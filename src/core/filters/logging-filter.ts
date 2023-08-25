import {Filter, FilterOrder} from "../filter";
import {RequestContext} from "../request-context";
import {ResponseContext} from "../response";
import {PassThrough, TransformCallback} from "stream";
import util from "util";
import {Buffer} from "buffer";

type LoggerFn = (msg: string) => void;

export class LoggingFilter implements Filter {

    constructor(private loggerFn: LoggerFn) {
    }

    filter(requestContext: RequestContext, responseContent?: ResponseContext) {
        this.loggerFn(`URL:${requestContext.url().toString()}\tMethod:${requestContext.method()}\tStatus:${responseContent?.getStatus()}`);
    }

    order(): FilterOrder {
        return FilterOrder.PostRequest;
    }

    equals(other: any): boolean {
        return this == other;
    }
}


class BodyLoggingFilter implements Filter {

    private readonly _loggerFn: LoggerFn;
    private readonly _order: FilterOrder;

    constructor(loggerFn: LoggerFn, order: FilterOrder) {
        this._loggerFn = loggerFn;
        this._order = order;
    }

    filter(requestContext: RequestContext, responseContext?: ResponseContext) {

        const stream = new LoggingBodyStream();

        if (this._order < 0) {
            requestContext.pipe(stream);

            stream.once('end', () => {

                this._loggerFn(
                    util.format("URL: %s\t Method: %s\t Body:%s",
                        requestContext.url().toString(),
                        requestContext.method(),
                        Buffer.concat(stream.data).toString('utf8'))
                );
            });


        } else {
            responseContext?.pipe(stream);

            this._loggerFn(
                util.format("URL: %s\t Method: %s\tStatus:%s\t Body:%s",
                    requestContext.url().toString(),
                    requestContext.method(),
                    responseContext?.getStatus(),
                    Buffer.concat(stream.data).toString('utf8'))
            );

        }

    }

    equals(other: any): boolean {
        return this == other;
    }

    order(): FilterOrder {
        return this._order;
    }

}

class LoggingBodyStream extends PassThrough {

    private readonly _data: any[];

    constructor() {
        super();
        this._data = [];
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        this._data.push(chunk);
        super._transform(chunk, encoding, callback);
    }

    get data(): any[] {
        return this._data;
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
