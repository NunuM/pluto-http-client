import {Equals} from "../framework/equals";
import {Cloneable} from "../framework/cloneable";
import {Identifiable} from "../framework/identifiable";

export type MultiValueMapType = { [key: string]: number | string | string[] | undefined }

export class Header implements Equals, Cloneable<Header>, Identifiable {
    constructor(private _key: string, private _value: string) {
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
