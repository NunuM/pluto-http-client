import {Marshal} from "./marshal";
import {Readable} from "stream";
import {Buffer} from "buffer";
import {MediaType} from "../core/media-type";
import {PrimitiveMultiValueMap} from "../utils/collections";
import {Unmarshal} from "./unmarshal";

export abstract class Entity<T> implements Marshal<T> {

    constructor(protected _mediaType: MediaType) {
    }

    static json(obj?: any): Entity<string> {
        return new JsonEntity(obj);
    }

    static form(obj: { [key: string]: string } | PrimitiveMultiValueMap): Entity<string> {
        return new FormUrlEncoded(obj);
    }

    marshal(): Promise<Uint8Array | Readable> {
        return Promise.reject(new Error("Not implemented"));
    }

    get mediaType(): MediaType {
        return this._mediaType;
    }
}

export class StringEntity extends Entity<string> implements Unmarshal<string> {

    constructor(private _data: string = "") {
        super(MediaType.ANY_TEXT_TYPE);
    }

    marshal(): Promise<Uint8Array | Readable> {
        return Promise.resolve(Buffer.from(this._data));
    }

    unmarshal(bytes: Buffer, mediaType?: MediaType): Promise<string> {
        return Promise.resolve(bytes.toString("utf-8"));
    }

}

export class JsonEntity extends Entity<string> implements Unmarshal<any> {

    constructor(private _data: any = {}) {
        super(MediaType.APPLICATION_JSON_TYPE);
    }

    marshal(): Promise<Uint8Array | Readable> {
        try {
            return Promise.resolve(Buffer.from(JSON.stringify(this._data)));
        } catch (e) {
            return Promise.reject(e);
        }
    }

    unmarshal(bytes: Buffer, mediaType?: MediaType): Promise<any> {
        if (this.mediaType.isCompatible(mediaType)) {
            try {
                return Promise.resolve(JSON.parse(bytes.toString('utf-8')));
            } catch (e) {
                return Promise.reject(e);
            }
        }

        return Promise.reject(new Error(`Incompatible Media-Type reader: Expected: ${this.mediaType.toString()} response with: ${mediaType?.toString()}`));
    }
}


export class BinaryEntity extends Entity<Uint8Array> implements Unmarshal<Uint8Array> {

    constructor(private _data: Uint8Array = new Uint8Array([])) {
        super(MediaType.APPLICATION_OCTET_STREAM_TYPE);
    }

    marshal(): Promise<Uint8Array | Readable> {
        return Promise.resolve(this._data);
    }

    unmarshal(bytes: Buffer, mediaType?: MediaType): Promise<Uint8Array> {
        return Promise.resolve(bytes);
    }
}


export class FormUrlEncoded extends Entity<string> {

    constructor(private _entity: { [key: string]: string } | PrimitiveMultiValueMap) {
        super(MediaType.APPLICATION_FORM_URLENCODED_TYPE);
    }

    marshal(): Promise<Uint8Array | Readable> {
        let body;

        if (this._entity instanceof PrimitiveMultiValueMap) {
            body = encodeURI(
                Object.entries(
                    Object.fromEntries(
                        this._entity.entries()
                    )
                ).map(([k, values]) => {
                    const r: string[] = [];

                    for (const value of values) {
                        r.push(`${k}=${value}`);
                    }

                    return r.join("&");

                }).join("&"));
        } else {
            body = encodeURI(Object.entries(this._entity).map(([k, v]) => `${k}=${v}`).join("&"));
        }

        return Promise.resolve(Buffer.from(body));
    }

}
