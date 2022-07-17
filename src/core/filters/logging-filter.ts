import {Filter, FilterOrder} from "../filter";
import {RequestContext} from "../request-context";
import {ResponseContext} from "../response";
import {PassThrough, TransformCallback} from "stream";
import * as util from "util";

export class LoggingFilter implements Filter {

    constructor(private loggerFn: (msg: string) => void) {
    }

    filter(requestContext: RequestContext, responseContent?: ResponseContext) {

        this.loggerFn(`URL:${requestContext.url().toString()}\nMethod:${requestContext.method()}`);
        this.loggerFn(`Status:${responseContent?.getStatus()}`);

    }

    order(): FilterOrder {
        return FilterOrder.PostRequest;
    }

    equals(other: any): boolean {
        return this == other;
    }
}


class BodyLoggingFilter extends PassThrough implements Filter {

    private _data: any[] = [];

    constructor(private loggerFn: (msg: string) => void, private _order: FilterOrder) {
        super();
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        this._data.push(chunk);

        super._transform(chunk, encoding, callback);
    }

    equals(other: any): boolean {
        return this == other;
    }

    filter(requestContext: RequestContext, responseContext?: ResponseContext) {
        this.addListener('end', () => {
            this.loggerFn(`URL:${requestContext.url()}\nMethod:${requestContext.method()}\nStatus:${responseContext?.getStatus()}\nHeaders:${util.format("%s", responseContext?.getHeaders())}\nBody:${this._data}`);
            this._data = [];
        });

        if (this._order < 0) {
            requestContext.pipe(this);
        } else {
            responseContext?.pipe(this);
        }
    }

    order(): FilterOrder {
        return this._order;
    }

}

export class LoggingRequestBodyFilter extends BodyLoggingFilter {
    constructor(loggerFn: (msg: string) => void) {
        super(loggerFn, FilterOrder.PreRequest);
    }
}

export class LoggingResponseBodyFilter extends BodyLoggingFilter {
    constructor(loggerFn: (msg: string) => void) {
        super(loggerFn, FilterOrder.PostRequest);
    }
}
