import {Cookie} from "../core/cookie";

export enum Event {
    Token, QuotedString, Comment, Separator, Control
}

export class HttpHeaderReader {

    private index: number;
    private readonly length: number;
    private _value?: string;
    private event?: Event;

    private static readonly TOKEN = 0;
    private static readonly QUOTED_STRING = 1;
    private static readonly COMMENT = 2;
    private static readonly SEPARATOR = 3;
    private static readonly CONTROL = 4;

    private static readonly WHITE_SPACE = new Set(['\t', '\r', '\n', ' ']);

    private static readonly SEPARATORS = new Set(
        ['(', ')', '<', '>', '@', ',', ';', ':', '\\', '"', '/', '[', ']', '?', '=', '{', '}', ' ', '\t']
    );

    private static readonly TYPE_TABLE = HttpHeaderReader.createTableType();
    private static readonly IS_TOKEN = HttpHeaderReader.createTokenTable();


    constructor(private header: string, private processComments = false) {
        this.index = 0;
        this.length = header.length
    }


    hasNext(): boolean {
        return this.skipWhiteSpace();
    }


    get value(): string | undefined {
        return this._value;
    }

    skipWhiteSpace(): boolean {
        for (; this.index < this.length; this.index++) {
            if (!this.isWhiteSpace(this.header.charAt(this.index))) {
                return true;
            }
        }

        return false;
    }


    isWhiteSpace(c: string): boolean {
        return HttpHeaderReader.WHITE_SPACE.has(c);
    }

    isSeparator(c: string): boolean {
        return HttpHeaderReader.SEPARATORS.has(c);
    }


    nextToken(): string {
        const e = this.next(false);
        if (e != Event.Token) {
            throw new Error("Next event is not a Token:" + this.index);
        }

        return this._value || "";
    }


    nextSeparator(seperator: string) {
        const e = this.next(false);
        if (e != Event.Separator) {
            throw new Error("Next event is not a Separator" + this.index);
        }

        if (seperator != this._value?.charAt(0)) {
            throw new Error(`Expected separator '${seperator}' instead of ${this._value?.charAt(0)} at index ${this.index}`);
        }
    }

    hasNextSeparator(separator: string, skipWhiteSpace: boolean) {
        if (skipWhiteSpace) {
            this.skipWhiteSpace();
        }

        if (this.index >= this.length) {
            return false;
        }

        let c = this.header.charAt(this.index);
        return this.isSeparator(c) && c == separator;
    }


    next(skipWhiteSpace: boolean = true, preserveBackslash = false): Event {

        this.event = this.process(this.getNextCharacter(skipWhiteSpace), preserveBackslash);

        return this.event;
    }

    getNextCharacter(skipWhiteSpace: boolean): number {
        if (skipWhiteSpace) {
            this.skipWhiteSpace();
        }

        if (this.index >= this.length) {
            throw new Error("HTTP_HEADER_END_OF_HEADER:" + this.index);
        }

        return this.header.charCodeAt(this.index);
    }

    getType(c: number): number {
        return HttpHeaderReader.TYPE_TABLE[c];
    }

    isToken(c: number): boolean {
        return HttpHeaderReader.IS_TOKEN[c];
    }

    processQuotedString(preserveBackslash: boolean) {
        let filter = false;

        for (let start = ++this.index; this.index < this.length; this.index++) {
            const c = this.header.charCodeAt(this.index);
            if (!preserveBackslash && c == '\\'.charCodeAt(0)) {
                this.index++;
                filter = true;
            } else if (c == '\r'.charCodeAt(0)) {
                filter = true;
            } else if (c == '"'.charCodeAt(0)) {
                this._value = (filter) ? this.filterToken(this.header, start, this.index, preserveBackslash) : this.header.substring(start, this.index);

                this.index++;
                return;
            }
        }

        throw Error("HTTP_HEADER_UNBALANCED_QUOTED" + this.index);
    }

    nextQuotedString(): string | undefined {
        const e = this.next(false);
        if (e != Event.QuotedString) {
            throw new Error(`Next event is not a Quoted String. Index: ${this.index}`);
        } else {
            return this._value;
        }
    }

    nextTokenOrQuotedString(preserveBackslash: boolean): string {
        const e = this.next(false, preserveBackslash);
        if (e != Event.Token && e != Event.QuotedString) {
            throw new Error("Next event is not a Token or a Quoted String, " + this._value + this.index);
        } else {
            return this._value || "";
        }
    }


    filterToken(s: string, start: number, end: number, preserveBackslash: boolean = false): string {
        const buffer: string[] = [];
        let c;
        let gotEscape = false;
        let gotCR = false;

        for (let i = start; i < end; i++) {
            c = s.charAt(i);
            if (c == '\n' && gotCR) {
                gotCR = false;
                continue;
            }

            gotCR = false;
            if (!gotEscape) {
                if (!preserveBackslash && c == '\\') {
                    gotEscape = true;
                } else if (c == '\r') {
                    gotCR = true;
                } else {
                    buffer.push(c);
                }
            } else {
                buffer.push(c);
                gotEscape = false;
            }
        }

        return buffer.join("");
    }

    processComment(): void {
        let filter = false;
        let nesting;
        let start;

        for (start = ++this.index, nesting = 1; nesting > 0 && this.index < this.length; this.index++) {
            let c = this.header.charAt(this.index);
            if (c == '\\') {
                this.index++;
                filter = true;
            } else if (c == '\r') {
                filter = true;
            } else if (c == '(') {
                nesting++;
            } else if (c == ')') {
                nesting--;
            }
        }
        if (nesting != 0) {
            throw new Error("HTTP_HEADER_UNBALANCED_COMMENTS" + this.index);
        }

        this._value = (filter) ? this.filterToken(this.header, start, this.index - 1) : this.header.substring(start, this.index - 1);
    }


    process(c: number, preserveBackslash: boolean) {

        if (c > 127) {
            this.index++;
            return Event.Control;
        }

        switch (this.getType(c)) {
            case HttpHeaderReader.TOKEN: {
                const start = this.index;
                for (this.index++; this.index < this.length; this.index++) {
                    if (!this.isToken(this.header.charCodeAt(this.index))) {
                        break;
                    }
                }
                this._value = this.header.substring(start, this.index);
                return Event.Token;
            }
            case HttpHeaderReader.QUOTED_STRING:
                this.processQuotedString(preserveBackslash);
                return Event.QuotedString;
            case HttpHeaderReader.COMMENT:
                if (!this.processComments) {
                    throw new Error("HTTP_HEADER_COMMENTS_NOT_ALLOWED" + this.index);
                }

                this.processComment();
                return Event.Comment;
            case HttpHeaderReader.SEPARATOR:
                this.index++;
                this._value = String.fromCharCode(c);
                return Event.Separator;
            case HttpHeaderReader.CONTROL:
                this.index++;
                this._value = String.fromCharCode(c);
                return Event.Control;
            default:
                // White space
                throw new Error("HTTP_HEADER_WHITESPACE_NOT_ALLOWED:" + this.index);
        }
    }

    private static createTableType(): { [key: number]: number } {

        const table: { [key: number]: number } = {};

        const controlCharBound = 32;
        for (let i = 0; i < controlCharBound; i++) {
            table[i] = HttpHeaderReader.CONTROL;
        }

        table[127] = HttpHeaderReader.CONTROL;

        // Token
        for (let i = controlCharBound; i < 127; i++) {
            table[i] = HttpHeaderReader.TOKEN;
        }

        // Separator
        for (const c of HttpHeaderReader.SEPARATORS.values()) {
            table[c.charCodeAt(0)] = HttpHeaderReader.SEPARATOR;
        }

        // Comment
        table['('.charCodeAt(0)] = HttpHeaderReader.COMMENT;

        // QuotedString
        table['"'.charCodeAt(0)] = HttpHeaderReader.QUOTED_STRING;

        // White space
        for (const c of HttpHeaderReader.WHITE_SPACE.values()) {
            table[c.charCodeAt(0)] = -1;
        }

        return table;
    }

    private static createTokenTable(): { [key: number]: boolean } {
        const table: { [key: number]: boolean } = {};

        for (let i = 0; i <= 127; i++) {
            table[i] = (HttpHeaderReader.TYPE_TABLE[i] == HttpHeaderReader.TOKEN);
        }

        return table;
    }

    public static readParameters(reader: HttpHeaderReader, fileNameFix = false): Map<string, string> {
        let m = new Map<string, string>();

        while (reader.hasNext()) {
            reader.nextSeparator(';');
            while (reader.hasNextSeparator(';', true)) {
                reader.next();
            }

            if (!reader.hasNext()) {
                break;
            }

            let name = reader.nextToken()?.toString().toLowerCase();
            reader.nextSeparator('=');

            let value;

            if ("filename" === name && fileNameFix) {
                value = reader.nextTokenOrQuotedString(true).toString();
                value = value.substring(value.lastIndexOf('\\') + 1);
            } else {
                value = reader.nextTokenOrQuotedString(false).toString();
            }


            m.set(name, value);
        }

        return m;
    }

    public static appendQuotedIfWhitespace(buffer: string[], s: string) {
        if (/ /.test(s || "")) {
            buffer.push(`"${s}"`)
        } else {
            buffer.push(s)
        }
    }

    public static appendQuotedIfNonToken(b: string[], value: string) {
        if (value) {
            const quote = !HttpHeaderReader.isTokenString(value);
            if (quote) {
                b.push('"');
            }

            HttpHeaderReader.appendEscapingQuotes(b, value);
            if (quote) {
                b.push('"');
            }
        }
    }

    private static isTokenString(s: string): boolean {

        for (let idx = 0; idx < s.length; ++idx) {
            const c = s.charCodeAt(idx);
            if (!HttpHeaderReader.IS_TOKEN[c]) {
                return false;
            }
        }

        return true;
    }

    private static appendEscapingQuotes(b: string[], value: string) {
        for (let i = 0; i < value.length; ++i) {
            const c = value.charAt(i);
            if (c == '"') {
                b.push('\\');
            }

            b.push(c);
        }

    }

    public static parseCookie(header?: string): Cookie | undefined {

        if (!header) {
            return;
        }

        let cookie: Cookie | undefined = undefined;

        const bites = header.split(/;/);
        for (let bite of bites) {
            const crumbs = bite.split("=", 2);
            const name = crumbs.length > 0 ? crumbs[0].trim() : "";
            let value = crumbs.length > 1 ? crumbs[1].trim() : "";
            if (value.startsWith("\"") && value.endsWith("\"") && value.length > 1) {
                value = value.substring(1, value.length - 1);
            }

            if (!cookie) {
                cookie = new Cookie(name, value);
            } else {
                let param = name.toLowerCase();
                if (param.startsWith("comment")) {
                    cookie.comment = value;
                } else if (param.startsWith("domain")) {
                    cookie.domain = value;
                } else if (param.startsWith("max-age")) {
                    cookie.maxAge = Number.parseInt(value);
                } else if (param.startsWith("path")) {
                    cookie.path = value;
                } else if (param.startsWith("secure")) {
                    cookie.secure = true;
                } else if (param.startsWith("version")) {
                    cookie.version = Number.parseInt(value);
                } else if (param.startsWith("httponly")) {
                    cookie.httpOnly = true;
                } else if (param.startsWith("expires")) {
                    cookie.expiry = new Date(value);
                }
            }
        }

        return cookie;
    }
}
