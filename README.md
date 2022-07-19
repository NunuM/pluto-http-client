# Pluto HTTP Client

[![NPM version][npm-image]][npm-url]

HTTP client for NodeJS. Inspired in the Java JAX-RS spec, so you can expect excellence, versatility and extensibility.

## Motivation

I've NodeJS apps that are using the famous request library, but was we all know, it was discontinued since 2020. Worst
then that, they do not allow any MR from the community to update nor make security patches, like waining kids, they
always refer to the post that they have discontinued even still that they have 19K download weekly passed 2 years of
this repo close down (it's a f*** HTTP client, it's not a cutting edge piece of code). So I need a substitute for it,
and after tried the axios and other, they all want to give FE and BE compatibility (to not talk of ESM modules), I dont
want to care about this compatibility, I want a FK library thatt works with a well defined API and uses the latest
NodeJS features.

## Features

* HTTP, HTTPs, HTTP2
* Filters / Observability
* Streaming
* Well-defined API
* 0 dependencies

### Examples

#### Simple HTTP GET

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

const body = await response.readEntity(new StringEntity());
```

#### Simple HTTP GET and Stream Response

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

### POST JSON Request

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
console.log(obj);
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
