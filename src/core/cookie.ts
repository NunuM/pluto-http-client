import {HttpHeaderReader} from "../utils/http-header-reader";
import {Equals} from "../framework/equals";
import {Identifiable} from "../framework/identifiable";
import {Cloneable} from "../framework/cloneable";

export enum SameSite {
    NONE = "None",
    LAX = "Lax",
    STRICT = "Strict"
}

export class Cookie implements Equals, Identifiable, Cloneable<Cookie> {

    private readonly _name: string;
    private readonly _value: string;
    private _version: number;
    private _path?: string;
    private _domain?: string;
    private _comment?: string;
    private _maxAge?: number;
    private _expiry?: Date;
    private _secure?: boolean;
    private _httpOnly?: boolean;
    private _sameSite?: SameSite;

    constructor(name: string,
                value?: string,
                version?: number,
                path?: string,
                domain?: string,
                comment?: string,
                maxAge?: number,
                expiry?: Date,
                secure?: boolean,
                httpOnly?: boolean,
                sameSite?: SameSite) {
        this._name = name;
        this._value = value || "";
        this._version = version || 1;
        this._path = path;
        this._domain = domain;
        this._comment = comment;
        this._maxAge = maxAge;
        this._expiry = expiry;
        this._secure = secure;
        this._httpOnly = httpOnly;
        this._sameSite = sameSite;
    }

    id(): string {
        return this.name;
    }

    clone(): Cookie {
        return new Cookie(
            this.name,
            this.value,
            this.version,
            this.path,
            this.domain,
            this.comment,
            this.maxAge,
            this.expiry,
            this.secure,
            this.httpOnly,
            this.sameSite
        )
    }

    equals(other: any): boolean {
        if (!other) {
            return false;
        } else if (!(other instanceof Cookie)) {
            return false;
        } else {
            if (this.name !== other.name) {
                return false;
            } else if (this.value !== other.value) {
                return false;
            } else if (this.version !== other.version) {
                return false;
            } else if (this.path !== other.path) {
                return false;
            } else if (this.domain !== other.domain) {
                return false;
            } else if (this.comment !== other.comment) {
                return false;
            } else if (this.maxAge != other.maxAge) {
                return false;
            } else if (this.expiry !== other.expiry) {
                return false;
            } else if (this.secure !== other.secure) {
                return false;
            } else if (this.httpOnly !== other.httpOnly) {
                return false;
            } else {
                return this.sameSite === other.sameSite;
            }
        }
    }

    get name(): string {
        return this._name;
    }

    get value(): string {
        return this._value;
    }

    get version(): number {
        return this._version;
    }

    set version(value: number) {
        this._version = value;
    }

    get path(): string | undefined {
        return this._path;
    }

    set path(value: string | undefined) {
        this._path = value;
    }

    get domain(): string | undefined {
        return this._domain;
    }

    set domain(value: string | undefined) {
        this._domain = value;
    }


    get comment(): string | undefined {
        return this._comment;
    }

    set comment(value: string | undefined) {
        this._comment = value;
    }

    get maxAge(): number | undefined {
        return this._maxAge;
    }

    set maxAge(value: number | undefined) {
        this._maxAge = value;
    }

    get expiry(): Date | undefined {
        return this._expiry;
    }

    set expiry(value: Date | undefined) {
        this._expiry = value;
    }

    get secure(): boolean | undefined {
        return this._secure;
    }

    set secure(value: boolean | undefined) {
        this._secure = value;
    }

    get httpOnly(): boolean | undefined {
        return this._httpOnly;
    }

    set httpOnly(value: boolean | undefined) {
        this._httpOnly = value;
    }

    get sameSite(): SameSite | undefined {
        return this._sameSite;
    }

    set sameSite(value: SameSite | undefined) {
        this._sameSite = value;
    }

    static fromString(header?: string): Cookie | undefined {
        return HttpHeaderReader.parseCookie(header);
    }

    toString(): string {
        const buffer = [`${this.name}`, "="];

        HttpHeaderReader.appendQuotedIfWhitespace(buffer, this.value)

        buffer.push(`;Version=${this.version}`);

        if (this.comment) {
            buffer.push(";Comment=")
            HttpHeaderReader.appendQuotedIfWhitespace(buffer, this.comment);
        }

        if (this.domain) {
            buffer.push(";Domain=")
            HttpHeaderReader.appendQuotedIfWhitespace(buffer, this.domain);
        }

        if (this.path) {
            buffer.push(";Path=")
            HttpHeaderReader.appendQuotedIfWhitespace(buffer, this.path);
        }

        if (this.maxAge && this.maxAge != -1) {
            buffer.push(`;MaxAge=${this.maxAge}`);
        }

        if (this.secure) {
            buffer.push(";Secure")
        }

        if (this.httpOnly) {
            buffer.push(";HttpOnly")
        }

        if (this.expiry) {
            buffer.push(`;Expires=${this.expiry.toDateString()}`)
        }

        if (this.sameSite) {
            buffer.push(`;SameSite=${this.sameSite}`)
        }

        return buffer.join("")
    }
}
