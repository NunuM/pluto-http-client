import {Header} from "./header";
import {HttpHeaders} from "./http-headers";
import {Event, HttpHeaderReader} from "../utils/http-header-reader";


export class EntityTag extends Header {

    private readonly _isWeak: boolean;

    constructor(value: string, isWeak: boolean = false) {
        super(HttpHeaders.ETAG, value);
        this._isWeak = isWeak;
    }

    get value(): string {
        return `${this.isWeak ? "W/" : ""}"${super.value}"`;
    }

    rawValue(): string {
        return super.value;
    }

    get isWeak(): boolean {
        return this._isWeak;
    }

    static fromString(header: string): EntityTag {

        const reader = new HttpHeaderReader(header);
        const e = reader.next(false);
        if (e == Event.QuotedString) {
            return new EntityTag(reader.value || "");
        }

        if (e == Event.Token) {
            const ev = reader.value;
            if (ev != null && ev.length > 0 && ev.charAt(0) == 'W') {
                reader.nextSeparator('/');
                return new EntityTag(reader.nextQuotedString() || "", true);
            }
        }

        throw new Error(`Error parsing entity tag ${header}`);
    }
}
