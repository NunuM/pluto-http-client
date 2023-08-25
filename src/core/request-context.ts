import {MediaType} from "./media-type";
import {Encoding} from "./encoding";
import {CacheControl} from "./cache-control";
import {Cookie} from "./cookie";
import {RequestBuilder} from "./request-builder";
import {Transform} from "stream";
import {URL} from "url";
import {Method} from "./method";
import {MultiValueMapType} from "./header";

export interface RequestContextStreaming {
    transform(transform: Transform): void;
}

export interface RequestInformation {
    getHeaders(): MultiValueMapType;

    getUrl(): URL;

    getMethod(): Method;
}

export class RequestContext {

    private readonly _req: RequestBuilder & RequestContextStreaming & RequestInformation;

    constructor(req: RequestBuilder & RequestContextStreaming & RequestInformation) {
        this._req = req;
    }

    accept(mediaType: MediaType) {
        this._req.accept(mediaType);
    }

    acceptLanguage(locale: string) {
        this._req.acceptLanguage(locale);
    }

    acceptEncoding(encoding: Encoding) {
        this._req.acceptEncoding(encoding);
    }

    cacheControl(cacheControl: CacheControl) {
        this._req.cacheControl(cacheControl);
    }

    cookie(cookie: Cookie) {
        this._req.cookie(cookie);
    }

    header(key: string, value: string) {
        this._req.header(key, value);
    }

    url(): URL {
        return this._req.getUrl();
    }

    method(): Method {
        return this._req.getMethod();
    }

    headers(): MultiValueMapType {
        return this._req.getHeaders();
    }

    pipe(transform: Transform) {
        this._req.transform(transform);
    }

}
