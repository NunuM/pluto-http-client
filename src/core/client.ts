import {URL} from "url";
import {Http2WebTarget, WebTarget} from "./web-target";
import {MultiValueMap, TreeMultiValueMap} from "../utils/collections";
import {Header} from "./header";
import {Filter} from "./filter";
import http from "http";
import https from "https";


export class Client {

    private readonly _timeout?: number;
    private readonly _headers: MultiValueMap<Header>;
    private readonly _filters: TreeMultiValueMap<number, Filter>;
    private readonly _agent?: http.Agent | https.Agent;
    private readonly _allowInsecure: boolean;

    constructor(headers: MultiValueMap<Header>,
                filters: TreeMultiValueMap<number, Filter>,
                allowInsecure: boolean,
                timeout?: number,
                agent?: http.Agent | https.Agent) {
        this._timeout = timeout;
        this._headers = headers;
        this._filters = filters;
        this._agent = agent;
        this._allowInsecure = allowInsecure;
    }

    target(url: string | URL): WebTarget {
        return new WebTarget(this, typeof url === "string" ? new URL(url) : url)
    }

    get timeout(): number | undefined {
        return this._timeout;
    }

    get headers(): MultiValueMap<Header> {
        return this._headers;
    }

    get filters(): TreeMultiValueMap<number, Filter> {
        return this._filters;
    }

    get agent(): http.Agent | https.Agent | undefined {
        return this._agent;
    }

    get allowInsecure(): boolean {
        return this._allowInsecure;
    }

    public snapshot(): Client {
        return new Client(
            this._headers.clone(),
            this._filters.clone(),
            this._allowInsecure,
            this._timeout,
            this._agent);
    }

}


export class Http2Client extends Client {
    target(url: string | URL): WebTarget {
        return new Http2WebTarget(this.snapshot(), typeof url === "string" ? new URL(url) : url);
    }
}



