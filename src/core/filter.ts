import {ResponseContext} from "./response";
import {Equals} from "../framwork/equals";
import {RequestContext} from "./request-context";

export interface Filter extends Equals {

    order(): FilterOrder;

    filter(requestContext: RequestContext, responseContext?: ResponseContext): void;
}

export enum FilterOrder {
    PreRequest = -10,
    PostRequestUncompress = 1,
    PostRequest = 10
}
