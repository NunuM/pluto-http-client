# Pluto HTTP Client

[![NPM version][npm-image]][npm-url]

HTTP client for NodeJS. Inspired in the Java JAX-RS spec, so you can expect excellence, versatility and extensibility.

## Motivation

I have Node.js applications that currently rely on the well-known "request" library. However, as we're all aware, this library has been discontinued since 2020. To compound the issue, they've opted not to accept any community merge requests for updates or security patches. It's frustrating, resembling an admonishing parent, they consistently point to the discontinuation post, even though the library continues to see around 19,000 weekly downloads even after two years of being abandoned. It's worth noting that we're discussing an HTTP client here; it's not a complex, cutting-edge codebase.

Given this situation, I'm actively seeking a suitable replacement. While I experimented with alternatives like "axios" and others, they all emphasize front-end and back-end compatibility (not to mention ESM module compatibility), which isn't my primary concern. I'm in search of a library that provides a straightforward and robust API, harnessing the latest features of Node.js, without being encumbered by compatibility intricacies.

## Features

* HTTP, HTTPs, HTTP2
* Filters / Observability
* Streaming
* Well-defined API
* **0 dependencies**

### Examples

#### HTTP GET Request

```typescript
 const client = new ClientBuilder()
    .withTimeout(30, TimeUnit.Seconds)
    .withFilter(new LoggingFilter(console.log))
    .build();

const target = client
    .target("https://run.mocky.io");

const response = await target
    .path("/v3/de314aa8-a521-47c4-8ff3-69b447dab89b")
    .request()
    .header(HttpHeaders.ACCEPT, MediaType.ANY_TEXT_TYPE.toString())
    .get();

if(response.getStatusInfo().getFamily().isSuccessful()) {
    const body = await response.readEntity(new StringEntity());
} else {
    console.log("Response status code:", response.getStatus());
}

```

#### HTTP GET Request and redirect to Writable Stream

```typescript
 const client = new ClientBuilder()
    .withTimeout(30, TimeUnit.Seconds)
    .withFilter(new LoggingFilter(console.log))
    .build();

const target = client
    .target("https://run.mocky.io");

const response = await target
    .path("/v3/de314aa8-a521-47c4-8ff3-69b447dab89b")
    .request()
    .header(HttpHeaders.ACCEPT, MediaType.ANY_TEXT_TYPE.toString())
    .get();

response.readEntity(fs.createWriteStream('get_response.txt'));
```

### HTTP POST JSON Request

```typescript
 const client = new ClientBuilder()
    .withTimeout(30, TimeUnit.Seconds)
    .withFilter(new LoggingFilter(console.log))
    .build();

const target = client
    .target("https://run.mocky.io");

const response = await target
    .path("/v3/de314aa8-a521-47c4-8ff3-69b447dab89b")
    .request()
    .post(Entity.json({test: 1}));

const obj = await response.readEntity(new JsonEntity());

```

### HTTP2

```typescript
 const client = new ClientBuilder()
    .withTimeout(30, TimeUnit.Seconds)
    .withFilter(new LoggingFilter(console.log))
    .withHttp2()
    .build();
```

### Implementing a Filter - Uppercase PostRequest Filter 

```typescript
class ToUppercaseFilter extends Transform implements Filter {
    
    filter(requestContext: RequestContext, responseContext?: ResponseContext): void {
        responseContext?.pipe(this);
    }

    order(): FilterOrder {
        return FilterOrder.PostRequest;
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        callback(null, String(chunk).toUpperCase());
    }

    equals(other: any): boolean {
        return other == this;
    }
}
```

### Request Interface

```typescript
interface Request {

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
```

### Response Interface

```typescript
interface Response {

    getHeaders(): MultiValueMapType;

    getStatusInfo(): StatusType

    getStatus(): number;

    getMediaType(): MediaType | undefined;

    getEtag(): EntityTag | undefined;

    getDate(): Date | undefined;

    getLastModified(): Date | undefined;

    getHeaderString(key: string): string

    getCookies(): MultiValueMap<Cookie>;

    readEntity<T>(unmarshaller: Unmarshal<T>): Promise<T>

    readEntity(writable: Writable): Writable
    
}
```

[npm-url]: https://www.npmjs.com/package/pluto-http-client
[npm-image]: https://img.shields.io/npm/v/pluto-http-client.svg
