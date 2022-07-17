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

    constructor(private req: RequestBuilder & RequestContextStreaming & RequestInformation) {
    }

    accept(mediaType: MediaType) {
        this.req.accept(mediaType);
    }

    acceptLanguage(locale: string) {
        this.req.acceptLanguage(locale);
    }

    acceptEncoding(encoding: Encoding) {
        this.req.acceptEncoding(encoding);
    }

    cacheControl(cacheControl: CacheControl) {
        this.req.cacheControl(cacheControl);
    }

    cookie(cookie: Cookie) {
        this.req.cookie(cookie);
    }

    header(key: string, value: string) {
        this.req.header(key, value);
    }

    url(): URL {
        return this.req.getUrl();
    }

    method(): Method {
        return this.req.getMethod();
    }

    headers(): MultiValueMapType {
        return this.req.getHeaders();
    }

    pipe(transform: Transform) {
        this.req.transform(transform);
    }

}
