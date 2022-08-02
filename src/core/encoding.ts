import * as zlib from "zlib";
import stream from "node:stream";
import {Header} from "./header";
import {Filter, FilterOrder} from "./filter";
import {ResponseContext} from "./response";
import {HttpHeaders} from "./http-headers";
import {RequestContext} from "./request-context";


export abstract class Encoding extends Header implements Filter {

    protected constructor(private _format = "*", _qualityValue?: number) {
        super(HttpHeaders.ACCEPT_ENCODING, _format);
    }

    filter(_: RequestContext, responseContext?: ResponseContext) {
        if (responseContext) {
            if(responseContext.getHeaderString(HttpHeaders.CONTENT_ENCODING).startsWith(this._format))
            {
                responseContext.pipe(this.getCompressor());
            }
        }
    }

    order(): FilterOrder {
        return FilterOrder.PostRequestUncompress;
    }

    abstract getCompressor(): stream.Readable;

}

export class GzipEncoding extends Encoding {

    private readonly _compression: zlib.Gzip;

    constructor(zlibOptions?: zlib.ZlibOptions) {
        super("gzip");
        this._compression = zlib.createGunzip(zlibOptions);
    }

    getCompressor(): stream.Readable {
        return this._compression;
    }
}

