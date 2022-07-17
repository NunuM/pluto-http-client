import {Equals} from "../framwork/equals";
import {HttpHeaderReader} from "../utils/http-header-reader";

export class MediaType implements Equals {

    public static readonly WILDCARD_TYPE = new MediaType("*", "*");
    public static readonly ANY_TEXT_TYPE = new MediaType("text", "*");
    public static readonly APPLICATION_XML_TYPE = new MediaType("application", "xml");
    public static readonly APPLICATION_ATOM_XML_TYPE = new MediaType("application", "atom+xml");
    public static readonly APPLICATION_XHTML_XML_TYPE = new MediaType("application", "xhtml+xml");
    public static readonly APPLICATION_SVG_XML_TYPE = new MediaType("application", "svg+xml");
    public static readonly APPLICATION_JSON_TYPE = new MediaType("application", "json");
    public static readonly APPLICATION_FORM_URLENCODED_TYPE = new MediaType("application", "x-www-form-urlencoded");
    public static readonly MULTIPART_FORM_DATA_TYPE = new MediaType("multipart", "form-data");
    public static readonly APPLICATION_OCTET_STREAM_TYPE = new MediaType("application", "octet-stream");
    public static readonly TEXT_PLAIN_TYPE = new MediaType("text", "plain");
    public static readonly TEXT_XML_TYPE = new MediaType("text", "xml");
    public static readonly TEXT_HTML_TYPE = new MediaType("text", "html");
    public static readonly SERVER_SENT_EVENTS_TYPE = new MediaType("text", "event-stream");
    public static readonly APPLICATION_JSON_PATCH_JSON_TYPE = new MediaType("application", "json-patch+json");


    constructor(private _type: string, private _subtype: string, private _parameters?: Map<string, string>) {
    }

    equals(other: any): boolean {
        if (other instanceof MediaType) {
            return this.type === other.type && this.subtype === other.subtype;
        }

        return false;
    }

    get type(): string {
        return this._type;
    }

    get subtype(): string {
        return this._subtype;
    }

    public isWildcardType(): boolean {
        return this.type === "*";
    }

    public isWildcardSubtype() {
        return this.subtype === "*";
    }

    public isCompatible(other?: MediaType): boolean {
        if (!other) {
            return false;
        } else {
            return (this.type.toLowerCase() == this.type.toLowerCase()
                    || this.isWildcardType()
                    || other.isWildcardType())
                && (this.subtype.toLowerCase() === other.subtype
                    || this.isWildcardSubtype()
                    || other.isWildcardSubtype());
        }
    }

    toString(): string {
        const buffer = [`${this.type}/${this.subtype}`];

        if (this._parameters) {
            for (const [k, v] of this._parameters?.entries()) {
                buffer.push(";", k, "=")
                HttpHeaderReader.appendQuotedIfNonToken(buffer, v);
            }
        }

        return buffer.join("");
    }

    static fromString(header?: string): MediaType {

        if (!header) {
            throw new Error("Mediatype is null");
        }

        const reader = new HttpHeaderReader(header);

        reader.hasNext();

        const type = reader.nextToken();
        reader.nextSeparator("/");
        const subtype = reader.nextToken();

        let params: Map<string, string> | undefined;
        if (reader.hasNext()) {
            params = HttpHeaderReader.readParameters(reader);
        }

        if (!type || !subtype) {
            throw new Error("Header with media type or subtype missing");
        }

        return new MediaType(type, subtype, params);
    }
}
