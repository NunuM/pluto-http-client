import {Encoding} from "./encoding";
import {CacheControl} from "./cache-control";
import {Response} from "./response";
import {Method} from "./method";
import {MediaType} from "./media-type";
import {Cookie} from "./cookie";
import {Entity} from "../framework/entity";

/**
 * This interface represents a request builder that helps in constructing HTTP requests.
 */
export interface RequestBuilder {

    /**
     * Set the desired media type for the response.
     * @param mediaType - The desired media type.
     * @returns The updated request builder.
     * @example builder.accept(MediaType.APPLICATION_JSON_TYPE);
     */
    accept(mediaType: MediaType): RequestBuilder;

    /**
     * Set the desired language for the response.
     * @param locale - The desired locale.
     * @returns The updated request builder.
     * @example builder.acceptLanguage('en-US');
     */
    acceptLanguage(locale: string): RequestBuilder;

    /**
     * Set the desired encoding for the response.
     * @param encoding - The desired encoding.
     * @returns The updated request builder.
     * @example builder.acceptEncoding(new GzipEncoding());
     */
    acceptEncoding(encoding: Encoding): RequestBuilder;

    /**
     * Set the cache control option for the request.
     * @param cacheControl - The cache control option.
     * @returns The updated request builder.
     * @example builder.cacheControl(new CacheControl());
     */
    cacheControl(cacheControl: CacheControl): RequestBuilder;

    /**
     * Set a cookie to be included in the request.
     * @param cookie - The cookie value.
     * @returns The updated request builder.
     * @example builder.cookie(new Cookie('session', '123'));
     */
    cookie(cookie: Cookie): RequestBuilder;

    /**
     * Set a custom header for the request.
     * @param key - The header key.
     * @param value - The header value.
     * @returns The updated request builder.
     * @example builder.header(HttpHeaders.AUTHORIZATION, 'Bearer token123');
     */
    header(key: string, value: string): RequestBuilder;

    /**
     * Perform an HTTP GET request.
     * @returns A promise that resolves to the response.
     * @example builder.get().then(response => { ... });
     */
    get(): Promise<Response>;

    /**
     * Perform an HTTP PUT request with the provided entity data.
     * @param entity - The entity data to send.
     * @returns A promise that resolves to the response.
     * @example builder.put(new JsonEntity({ id: 1, name: 'Updated Item' })).then(response => { ... });
     */
    put<T>(entity: Entity<T>): Promise<Response>

    /**
     * Perform an HTTP POST request with the provided entity data.
     * @param entity - The entity data to send.
     * @returns A promise that resolves to the response.
     * @example builder.post(new JsonEntity({ name: 'New Item' })).then(response => { ... });
     */
    post<T>(entity: Entity<T>): Promise<Response>

    /**
     * Perform an HTTP DELETE request with the provided entity data.
     * @param entity - The entity data to send.
     * @returns A promise that resolves to the response.
     * @example builder.delete(new JsonEntity({ id: 1 })).then(response => { ... });
     */
    delete<T>(entity: Entity<T>): Promise<Response>

    /**
     * Build and execute a custom HTTP request with the specified method and optional entity data.
     * @param method - The HTTP method to use.
     * @param entity - The entity data to send (optional).
     * @returns A promise that resolves to the response.
     * @example builder.build('PATCH', new JsonEntity({ rating: 5 })).then(response => { ... });
     */
    build<T>(method: Method, entity?: Entity<T>): Promise<Response>;

}
