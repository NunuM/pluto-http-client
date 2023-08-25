import {Equals} from "../framework/equals";
import {Cloneable} from "../framework/cloneable";
import {Identifiable} from "../framework/identifiable";
//@ts-ignore
import {validateHeaderName, validateHeaderValue} from 'node:http';

export type MultiValueMapType = { [key: string]: number | string | string[] | undefined }

export class Header implements Equals, Cloneable<Header>, Identifiable {

    private readonly _key: string;
    private readonly _value: string;

    constructor(key: string, value: string) {
        validateHeaderName(key);
        validateHeaderValue(key, value);
        this._key = key;
        this._value = value;
    }

    get key(): string {
        return this._key;
    }

    get value(): string {
        return this._value;
    }

    clone(): Header {
        return new Header(this.key, this.value);
    }

    equals(other: any) {
        if (other instanceof Header) {
            return this.key.toLowerCase() === other.key.toLowerCase()
                && this.value === other.value;
        }

        return false
    }

    id(): string {
        return this.key.toLowerCase();
    }
}
