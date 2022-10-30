import {Method} from "../method";
import {URL, urlToHttpOptions} from "url";
import {Encoding} from "../encoding";
import {Response, ResponseContext} from "../response";
import {CacheControl} from "../cache-control";
import https from "https";
import http, {ClientRequest} from "http";
import {Client} from "../client";
import {RequestBuilder} from "../request-builder";
import {Header, MultiValueMapType} from "../header";
import {fromMap, HttpHeaders} from "../http-headers";
import {MediaType} from "../media-type";
import {MultiValueMap} from "../../utils/collections";
import {Cookie} from "../cookie";
import {Entity} from "../../framework/entity";
import {pipeline, Readable, Transform, Writable} from "stream";
import {RequestContext, RequestContextStreaming, RequestInformation} from "../request-context";
import {ClientHttp2Session, ClientHttp2Stream, constants as Http2Constants} from "http2";
import {NodeResponse} from "./node-response";
import {Buffer} from "buffer";

export abstract class NodeRequest implements RequestBuilder, RequestContextStreaming, RequestInformation {

    protected _method: Method;
    protected readonly headers: MultiValueMap<Header>;
    protected _transformers: Transform[] = [];

    constructor(protected _client: Client, protected _url: URL) {
        this._method = Method.GET;
        this.headers = this._client.headers;
    }

    getHeaders(): MultiValueMapType {
        return fromMap(this.headers);
    }

    private setHeader(key: string, value: string) {
        this.headers.add(new Header(key, value));
    }

    accept(mediaType: MediaType): RequestBuilder {
        this.setHeader(HttpHeaders.ACCEPT, mediaType.toString());

        return this;
    }

    acceptEncoding(encoding: Encoding): RequestBuilder {
        this.setHeader(encoding.key, encoding.value);

        this._client.filters.put(encoding.order(), encoding);

        return this;
    }

    acceptLanguage(locale: string): RequestBuilder {
        this.setHeader(HttpHeaders.ACCEPT_LANGUAGE, locale);

        return this;
    }

    build<T>(method: Method, entity?: Entity<T>): Promise<Response> {
        this._method = method;

        return this.makeRequest(entity);
    }

    cacheControl(cacheControl: CacheControl): RequestBuilder {
        this.setHeader(HttpHeaders.CACHE_CONTROL, cacheControl.toString());

        return this;
    }

    cookie(cookie: Cookie): RequestBuilder {
        this.setHeader(HttpHeaders.COOKIE, cookie.toString());

        return this;
    }

    delete<T>(entity: Entity<T>): Promise<Response> {
        this._method = Method.DELETE;

        return this.makeRequest(entity);
    }

    get(): Promise<Response> {
        return this.makeRequest();
    }

    header(key: string, value: string): RequestBuilder {
        this.setHeader(key, value);

        return this;
    }

    post<T>(entity: Entity<T>): Promise<Response> {
        this._method = Method.POST;

        return this.makeRequest(entity);
    }

    put<T>(entity: Entity<T>): Promise<Response> {

        this._method = Method.PUT;

        return this.makeRequest(entity);
    }

    protected executePreFilters(request: RequestContext) {
        for (let filters of this._client.filters.subMap(Number.MIN_SAFE_INTEGER, 0)) {
            for (const [_, filter] of filters.entries()) {
                filter.filter(request);
            }
        }
    }

    protected executePostFilters(request: RequestContext, response: ResponseContext) {
        for (let filters of this._client.filters.subMap(0, Number.MAX_SAFE_INTEGER)) {
            for (const [_, filter] of filters.entries()) {
                filter.filter(request, response);
            }
        }
    }

    private makeRequest<T>(entity?: Entity<T>): Promise<Response> {

        if (entity) {
            this.header(HttpHeaders.CONTENT_TYPE, entity.mediaType.toString());
        }

        return this.execute(entity);
    }

    protected abstract execute<T>(entity?: Entity<T>): Promise<Response>;


    transform(transform: Transform) {
        this._transformers.push(transform);
    }

    getUrl(): URL {
        return this._url;
    }

    getMethod(): Method {
        return this._method;
    }

    protected static writeEntity<T>(entity: Entity<T>,
                                    sink: Writable,
                                    transformers: Transform[],
                                    cb: (e: Error) => void) {
        return entity
            .marshal()
            .then((data) => {
                let bodyStream: Readable;

                if (data instanceof Readable) {
                    bodyStream = data;
                } else if (data instanceof Buffer) {
                    bodyStream = Readable.from(data)
                } else {
                    bodyStream = Readable.from(Buffer.from(data));
                }

                // @ts-ignore
                pipeline(bodyStream, ...transformers, sink, (error) => {
                    if (error) {
                        cb(error);
                    }
                });
            });
    }
}

export class Http2NodeRequest extends NodeRequest {

    private _req: ClientHttp2Session;
    private _responseHeaders: MultiValueMap<Header>;

    constructor(client: Client, url: URL, session: ClientHttp2Session, private _error?: Error) {
        super(client, url);
        this._req = session;
        this._responseHeaders = new MultiValueMap<Header>();
    }

    protected execute<T>(entity?: Entity<T>): Promise<Response> {
        if (this._error) {
            return Promise.reject(this._error);
        }

        return new Promise((resolve, reject) => {


            const requestContext = new RequestContext(this);

            const headers = fromMap(this.headers);

            headers[Http2Constants.HTTP2_HEADER_METHOD] = this._method;
            headers[Http2Constants.HTTP2_HEADER_PATH] = this.getPath();

            const stream: ClientHttp2Stream = this._req.request(headers, {
                endStream: !entity
            });

            stream.on("response", (responseHeaders, _flags) => {

                const response = new NodeResponse(responseHeaders, stream, responseHeaders[":status"]);

                this.executePostFilters(requestContext, response);

                resolve(response);
            });

            stream.on("error", (error) => {
                reject(error);
            })

            stream.on("timeout", () => {
                stream.destroy(new Error("Client Timeout"))
            });

            this.executePreFilters(requestContext);

            if (entity) {
                Http2NodeRequest
                    .writeEntity(entity, stream, this._transformers, reject)
                    .catch(reject);
            } else {
                stream.end();
            }
        });
    }

    /**
     * Get request path
     * @private
     */
    private getPath(): string {
        const urlParts = urlToHttpOptions(this._url);
        let path = "/";

        if (urlParts.path) {
            path = urlParts.path;
        }

        //@ts-ignore
        if (urlParts.search) {
            //@ts-ignore
            path += urlParts.search
        }

        //@ts-ignore
        if (urlParts.hash) {
            //@ts-ignore
            path += urlParts.hash
        }

        return path;
    }
}

export class HttpNodeRequest extends NodeRequest {

    private req?: ClientRequest;

    protected execute<T>(entity?: Entity<T>): Promise<Response> {

        return new Promise<Response>((resolve, reject) => {

            const requestContext = new RequestContext(this);

            const lib = this._url.protocol === 'https:' ? https : http;

            this.req = lib.request(this._url, {
                timeout: this._client.timeout,
                headers: fromMap(this.headers),
                method: this._method,
                agent: this._client.agent,
                rejectUnauthorized: !this._client.allowInsecure
            }, (response) => {

                const nodeResponse = new NodeResponse(response.headers, response, response.statusCode);

                this.executePostFilters(requestContext, nodeResponse);

                resolve(nodeResponse);
            });

            this.req.once('timeout', () => {
                this.req?.destroy(new Error("Client timeout"));
            });

            this.req.once('error', (error) => {
                reject(error);
            });

            this.executePreFilters(requestContext);

            if (entity) {
                HttpNodeRequest
                    .writeEntity(entity, this.req, this._transformers, reject)
                    .catch(reject);
            } else {
                this.req.end();
            }
        });
    }

}
