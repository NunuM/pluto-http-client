import {URL} from "url";
import {Client} from "./client";
import {RequestBuilder} from "./request-builder";
import {Http2NodeRequest, HttpNodeRequest} from "./impl/node-request";
import * as http2 from "http2";
import {ClientHttp2Session} from "http2";

export class WebTarget {

    constructor(protected _client: Client, protected _url: URL) {
    }

    path(path: string): WebTarget {
        this._url.pathname = path;

        return this;
    }

    addQueryParam(key: string, value: string): WebTarget {

        this._url.searchParams.append(key, value);

        return this;
    }

    request(): RequestBuilder {
        return new HttpNodeRequest(this._client, this._url);
    }

}

export class Http2WebTarget extends WebTarget {

    private readonly _http2Client: ClientHttp2Session;
    private _error?: Error;

    constructor(client: Client, url: URL) {
        super(client, url);
        this._http2Client = http2.connect(url, {
            timeout: client.timeout,
            rejectUnauthorized: !client.allowInsecure,
        });

        this._http2Client.on("timeout", () => {
            this._error = new Error("Socket timeout");
        });

        this._http2Client.on("error", (error) => {
            this._error = error;
        });
    }

    request(): RequestBuilder {
        return new Http2NodeRequest(
            this._client,
            this._url,
            this._http2Client,
            this._error
        );
    }

}
