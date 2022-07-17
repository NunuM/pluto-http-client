import {Encoding} from "./encoding";
import {CacheControl} from "./cache-control";
import {Response} from "./response";
import {Method} from "./method";
import {MediaType} from "./media-type";
import {Cookie} from "./cookie";
import {Entity} from "../framwork/entity";


export interface RequestBuilder {

    accept(mediaType: MediaType): RequestBuilder;

    acceptLanguage(locale: string): RequestBuilder;

    acceptEncoding(encoding: Encoding): RequestBuilder;

    cacheControl(cacheControl: CacheControl): RequestBuilder;

    cookie(cookie: Cookie): RequestBuilder;

    header(key: string, value: string): RequestBuilder;

    get(): Promise<Response>;

    put<T>(entity: Entity<T>): Promise<Response>

    post<T>(entity: Entity<T>): Promise<Response>

    delete<T>(entity: Entity<T>): Promise<Response>

    build<T>(method: Method, entity?: Entity<T>): Promise<Response>;

}
