import {Client, Http2Client} from "./client"
import {Header} from "./header";
import {Filter} from "./filter";
import {MultiValueMap, NumberComparator, TreeMultiValueMap} from "../utils/collections";
import {TimeUnit} from "../utils/time-unit";
import http from "http";
import https from "https";

export class ClientBuilder {

    private _timeout?: number;
    private _allowInsecure: boolean;
    private _headers: MultiValueMap<Header>;
    private _filters: TreeMultiValueMap<number, Filter>;
    private _agent?: http.Agent | https.Agent;
    private _http2: boolean = false;

    constructor() {
        this._filters = new TreeMultiValueMap(new NumberComparator());
        this._headers = new MultiValueMap<Header>();
        this._allowInsecure = false;
    }

    setAllowInsecure(allow: boolean): ClientBuilder {
        this._allowInsecure = allow;

        return this;
    }

    withAgent(agent?: http.Agent | https.Agent): ClientBuilder {

        this._agent = agent;

        return this;
    }

    withTimeout(timeout: number, timeUnit: TimeUnit = TimeUnit.Milliseconds): ClientBuilder {

        this._timeout = timeout * timeUnit;

        return this;
    }

    withHeader(name: string, value: string): ClientBuilder {
        this.headers.add(new Header(name, value));

        return this;
    }

    withFilter(filter: Filter): ClientBuilder {

        this.filters.put(filter.order(), filter);

        return this;
    }

    withHttp2(): ClientBuilder {
        this._http2 = true;

        const builder = new Http2ClientBuilder();

        builder._timeout = this._timeout;
        builder._allowInsecure = this._allowInsecure;
        builder._filters = this._filters;
        builder._headers = this._headers;

        return builder;
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

    header(key: string, value: string): ClientBuilder {
        this._headers.add(new Header(key, value))
        return this;
    }

    get allowInsecure(): boolean {
        return this._allowInsecure;
    }

    get agent(): http.Agent | https.Agent | undefined {
        return this._agent;
    }

    build(): Client {
        return new Client(
            this.headers,
            this.filters,
            this._allowInsecure,
            this.timeout,
            this._agent)
    }
}

class Http2ClientBuilder extends ClientBuilder {

    build(): Client {
        return new Http2Client(
            this.headers,
            this.filters,
            this.allowInsecure,
            this.timeout)
    }

}
