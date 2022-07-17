import {MediaType} from "./media-type";
import {Writable} from "stream";
import {MultiValueMap} from "../utils/collections";
import {Cookie} from "./cookie";
import {Unmarshal} from "../framework/unmarshal";
import {MultiValueMapType} from "./header";
import {EntityTag} from "./entity-tag";
import ReadableStream = NodeJS.ReadableStream;

export class Family {
    private static readonly INFORMATIONAL = 0;
    private static readonly SUCCESSFUL = 1;
    private static readonly REDIRECTION = 2;
    private static readonly CLIENT_ERROR = 2;
    private static readonly SERVER_ERROR = 2;
    private static readonly OTHER = 2;

    private constructor(private _familyNumber: number) {
    }

    isInformal(): boolean {
        return Family.INFORMATIONAL === this._familyNumber;
    }

    isSuccessful(): boolean {
        return Family.SUCCESSFUL === this._familyNumber;
    }

    isRedirection(): boolean {
        return Family.REDIRECTION === this._familyNumber
    }

    isClientError(): boolean {
        return Family.CLIENT_ERROR === this._familyNumber;
    }

    isServerError(): boolean {
        return Family.SERVER_ERROR === this._familyNumber;
    }

    isOther(): boolean {
        return Family.OTHER === this._familyNumber;
    }

    static familyOf(statusCode: number): Family {
        switch (statusCode / 100) {
            case 1:
                return new Family(Family.INFORMATIONAL);
            case 2:
                return new Family(Family.SUCCESSFUL);
            case 3:
                return new Family(Family.REDIRECTION);
            case 4:
                return new Family(Family.CLIENT_ERROR);
            case 5:
                return new Family(Family.SERVER_ERROR);
            default:
                return new Family(Family.OTHER);
        }
    }
}


export class StatusType {

    constructor(private _statusCode: number) {
    }

    getStatusCode(): number {
        return this._statusCode;
    }

    getFamily(): Family {
        return Family.familyOf(this._statusCode);
    }
}

export interface Response {

    getHeaders(): MultiValueMapType;

    getStatusInfo(): StatusType

    getStatus(): number;

    getMediaType(): MediaType | undefined;

    getEtag(): EntityTag | undefined;

    getDate(): Date | undefined;

    getLastModified(): Date | undefined;

    getHeaderString(key: string): string

    getCookies(): MultiValueMap<Cookie>;

    readEntity<T>(unmarshaller: Unmarshal<T>): Promise<T>

    readEntity(writable: Writable): Writable
}

export interface ResponseContextStreaming {
    pipe(readable: ReadableStream): void;
}

export interface ResponseContext extends Response, ResponseContextStreaming {

}

