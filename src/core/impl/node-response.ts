import stream from "node:stream";
import {MediaType} from "../media-type";
import {MultiValueMap} from "../../utils/collections";
import {Cookie} from "../cookie";
import {MultiValueMapType} from "../header";
import {Readable, Transform, Writable} from "stream";
import {Unmarshal} from "../../framework/unmarshal";
import {Buffer} from "buffer";
import {EntityTag} from "../entity-tag";
import {ResponseContext, StatusType} from "../response";


export class NodeResponse implements ResponseContext {

    private _reader: stream.Readable;
    private _mediaType?: MediaType;
    private _cookies?: MultiValueMap<Cookie>;
    private _etag?: EntityTag;

    constructor(private _headers: MultiValueMapType,
                private response: Readable,
                private _statusCode: number = -1) {
        this._reader = response;
    }

    /**
     * @inheritDoc
     */
    getHeaders(): MultiValueMapType {
        return this._headers
    }

    /**
     * @inheritDoc
     */
    getCookies(): MultiValueMap<Cookie> {

        if (!this._cookies) {
            this._cookies = new MultiValueMap();

            if (Array.isArray(this._headers['set-cookie'])) {
                this._headers['set-cookie'].forEach((c) => {
                    const someCookie = Cookie.fromString(c);
                    if (someCookie) {
                        // @ts-ignore
                        this._cookies.add(someCookie);
                    }
                });
            }
        }

        return this._cookies;
    }

    /**
     * @inheritDoc
     */
    getDate(): Date | undefined {
        if (this._headers["date"]) {
            // @ts-ignore
            return new Date(this._headers["date"])
        }
    }

    /**
     * @inheritDoc
     */
    getHeaderString(key: string): string {
        return (this._headers[key.toLowerCase()] || "").toString();
    }

    /**
     * @inheritDoc
     */
    getLastModified(): Date | undefined {
        if (this._headers["last-modified"]) {
            // @ts-ignore
            return new Date(this._headers["last-modified"])
        }
    }

    /**
     * @inheritDoc
     */
    getMediaType(): MediaType | undefined {
        if (!this._mediaType) {
            try {
                // @ts-ignore
                this._mediaType = MediaType.fromString(this._headers["content-type"]);
            } catch (e) {
                if (process.env.PLUTO_DEBUG) {
                    console.debug("Error parsing ETAG:", e);
                }
            }
        }

        return this._mediaType;
    }

    /**
     * @inheritDoc
     */
    getEtag(): EntityTag | undefined {
        if (!this._etag) {
            try {
                // @ts-ignore
                this._etag = EntityTag.fromString(this._headers['etag'])
            } catch (e) {
                if (process.env.PLUTO_DEBUG) {
                    console.debug("Error parsing ETAG:", e);
                }
            }
        }

        return this._etag;
    }

    /**
     * @inheritDoc
     */
    getStatus(): number {
        return this._statusCode;
    }

    /**
     * @inheritDoc
     */
    getStatusInfo(): StatusType {
        return new StatusType(this.getStatus());
    }

    /**
     * @inheritDoc
     */
    readEntity<T>(unmarshaller: Unmarshal<T>): Promise<T>;

    /**
     * @inheritDoc
     */
    readEntity(writable: Writable): Writable;

    /**
     * @inheritDoc
     */
    readEntity<T>(unmarshaller: Writable | Unmarshal<T>): Writable | Promise<T> {

        if (unmarshaller instanceof Writable) {
            return this._reader.pipe(unmarshaller);
        }

        return new Promise((resolve, reject) => {

            const buff: Uint8Array[] = [];

            this._reader.on('error', (e) => {
                reject(e);
            });

            this._reader.on('data', (chunk) => {
                buff.push(chunk);
            });

            this._reader.on('end', () => {
                unmarshaller
                    .unmarshal(Buffer.concat(buff), this.getMediaType())
                    .then((t) => {
                        resolve(t);
                    })
                    .catch((e) => {
                        reject(e);
                    });
            });
        });
    }

    /**
     * @inheritDoc
     */
    pipe(transformer: Transform) {
        this._reader = this._reader.pipe(transformer);
    }

    /**
     * @inheritDoc
     */
    close(): void {
        this._reader.destroy();
    }

}


