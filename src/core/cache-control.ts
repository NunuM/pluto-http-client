export class CacheControl {

    private _privateFields: Array<string> = []

    private _noCacheFields: Array<string> = []

    private _cacheExtension: Map<string, string> = new Map<string, string>();

    private _isPrivate: boolean = false;

    private _isNoCache: boolean = false;

    private _isNoStore: boolean = false;

    private _isNoTransform: boolean = false;

    private _isMustRevalidate: boolean = false;

    private _isProxyRevalidate: boolean = false;

    private _maxAge = -1;

    private _sMaxAge = -1;

    constructor() {
    }

    get privateFields(): Array<string> {
        return this._privateFields;
    }

    set privateFields(value: Array<string>) {
        this._privateFields = value;
    }

    get noCacheFields(): Array<string> {
        return this._noCacheFields;
    }

    set noCacheFields(value: Array<string>) {
        this._noCacheFields = value;
    }

    get cacheExtension(): Map<string, string> {
        return this._cacheExtension;
    }

    set cacheExtension(value: Map<string, string>) {
        this._cacheExtension = value;
    }

    get isPrivate(): boolean {
        return this._isPrivate;
    }

    set isPrivate(value: boolean) {
        this._isPrivate = value;
    }

    get isNoCache(): boolean {
        return this._isNoCache;
    }

    set isNoCache(value: boolean) {
        this._isNoCache = value;
    }

    get isNoStore(): boolean {
        return this._isNoStore;
    }

    set isNoStore(value: boolean) {
        this._isNoStore = value;
    }

    get isNoTransform(): boolean {
        return this._isNoTransform;
    }

    set isNoTransform(value: boolean) {
        this._isNoTransform = value;
    }

    get isMustRevalidate(): boolean {
        return this._isMustRevalidate;
    }

    set isMustRevalidate(value: boolean) {
        this._isMustRevalidate = value;
    }

    get isProxyRevalidate(): boolean {
        return this._isProxyRevalidate;
    }

    set isProxyRevalidate(value: boolean) {
        this._isProxyRevalidate = value;
    }

    get maxAge(): number {
        return this._maxAge;
    }

    set maxAge(value: number) {
        this._maxAge = value;
    }

    get sMaxAge(): number {
        return this._sMaxAge;
    }

    set sMaxAge(value: number) {
        this._sMaxAge = value;
    }

    toString(): string {

        let buffer = new Array<string>();

        if (this.isPrivate) {
            CacheControl.appendQuotedWithSeperator(buffer,
                "private",
                CacheControl.buildListValue(this.privateFields));
        }
        if (this._isNoCache) {
            CacheControl.appendQuotedWithSeperator(buffer,
                "no-cache",
                CacheControl.buildListValue(this.noCacheFields));
        }

        if (this.isNoStore) {
            CacheControl.appendWithSeperator(
                buffer,
                "no-store"
            );
        }

        if (this.isNoTransform) {
            CacheControl.appendWithSeperator(
                buffer,
                "no-transform"
            )
        }

        if (this.isMustRevalidate) {
            CacheControl.appendWithSeperator(
                buffer,
                "must-revalidate"
            )
        }

        if (this.isProxyRevalidate) {
            CacheControl.appendWithSeperator(
                buffer,
                "proxy-revalidate"
            )
        }

        if (this.maxAge != -1) {
            CacheControl.appendWithSeperator(
                buffer,
                "max-age",
                this.maxAge.toString()
            )
        }

        if (this.sMaxAge != -1) {
            CacheControl
                .appendWithSeperator(
                    buffer,
                    "s-maxage",
                    this.maxAge.toString()
                )
        }

        return buffer.join("");
    }

    private static buildListValue(values: string[]): string {
        const buffer = new Array<string>();
        for (const value of values) {
            buffer.push(value);
        }

        return buffer.join(", ")
    }

    private static appendWithSeperator(buffer: string[], field: string, value?: string) {
        if (buffer.length > 0) {
            buffer.push(", ")
        }

        buffer.push(field);

        if (value) {
            buffer.push(value);
        }
    }

    private static appendQuotedWithSeperator(buffer: string[],
                                             field: string,
                                             value: string): void {

        CacheControl.appendWithSeperator(buffer, field);

        if (value != null && !(value.length === 0)) {
            buffer.push("=\"");
            buffer.push(value);
            buffer.push("\"");
        }
    }
}
