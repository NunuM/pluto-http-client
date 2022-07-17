import {MultiValueMap} from "../utils/collections";
import {Header} from "./header";

export enum HttpHeaders {
    ACCEPT = "Accept",
    ACCEPT_CHARSET = "Accept-Charset",
    ACCEPT_ENCODING = "Accept-Encoding",
    ACCEPT_LANGUAGE = "Accept-Language",
    ALLOW = "Allow",
    AUTHORIZATION = "Authorization",
    CACHE_CONTROL = "Cache-Control",
    CONTENT_DISPOSITION = "Content-Disposition",
    CONTENT_ENCODING = "Content-Encoding",
    CONTENT_ID = "Content-ID",
    CONTENT_LANGUAGE = "Content-Language",
    CONTENT_LENGTH = "Content-Length",
    CONTENT_LOCATION = "Content-Location",
    CONTENT_TYPE = "Content-Type",
    DATE = "Date",
    ETAG = "ETag",
    EXPECT = "Expect",
    EXPIRES = "Expires",
    HOST = "Host",
    IF_MATCH = "If-Match",
    IF_MODIFIED_SINCE = "If-Modified-Since",
    IF_NONE_MATCH = "If-None-Match",
    IF_UNMODIFIED_SINCE = "If-Unmodified-Since",
    LAST_MODIFIED = "Last-Modified",
    LOCATION = "Location",
    LINK = "Link",
    RETRY_AFTER = "Retry-After",
    USER_AGENT = "User-Agent",
    VARY = "Vary",
    WWW_AUTHENTICATE = "WWW-Authenticate",
    COOKIE = "Cookie",
    SET_COOKIE = "Set-Cookie",
    LAST_EVENT_ID_HEADER = "Last-Event-ID",
}

export function fromMap(multiValueMap: MultiValueMap<Header>): { [key: string]: string } {
    const obj : { [key: string]: string } = {};
    for (let [k, header] of multiValueMap.entries()) {
        obj[k] = Array.from(header.entries()).map(([_, h]) => h.value).join(",")
    }

    return obj;
}
