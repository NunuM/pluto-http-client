import {MediaType} from "./media-type";
import {Writable} from "stream";
import {MultiValueMap} from "../utils/collections";
import {Cookie} from "./cookie";
import {Unmarshal} from "../framework/unmarshal";
import {MultiValueMapType} from "./header";
import {EntityTag} from "./entity-tag";
import ReadableStream = NodeJS.ReadableStream;

export class Family {
    private static readonly INFORMATIONAL = 1;
    private static readonly SUCCESSFUL = 2;
    private static readonly REDIRECTION = 3;
    private static readonly CLIENT_ERROR = 4;
    private static readonly SERVER_ERROR = 5;
    private static readonly OTHER = 6;

    private readonly _familyNumber: number;

    private constructor(familyNumber: number) {
        this._familyNumber = familyNumber;
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
        switch (Math.trunc(statusCode / 100)) {
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

/**
 * Represents an HTTP response returned from a request.
 */
export interface Response {

    /**
     * Get the headers received in the response.
     */
    getHeaders(): MultiValueMapType;

    /**
     * Get the status information of the response.
     */
    getStatusInfo(): StatusType

    /**
     * Get the HTTP status code of the response.
     */
    getStatus(): number;

    /**
     * Get the media type of the response, if available.
     */
    getMediaType(): MediaType | undefined;

    /**
     * Get the entity tag (ETag) of the response, if available.
     */
    getEtag(): EntityTag | undefined;

    /**
     * Get the date of the response, if available.
     */
    getDate(): Date | undefined;

    /**
     * Get the last modified date of the response, if available.
     */
    getLastModified(): Date | undefined;

    /**
     * Get the header value associated with the given key.
     * @param key - The header key.
     */
    getHeaderString(key: string): string

    /**
     * Get the cookies received in the response.
     */
    getCookies(): MultiValueMap<Cookie>;

    /**
     * Read and parse the entity body of the response using a specified unmarshaller.
     * @param unmarshaller - The unmarshaller to use.
     * @returns A promise that resolves to the parsed entity.
     */
    readEntity<T>(unmarshaller: Unmarshal<T>): Promise<T>

    /**
     * Read the entity body of the response and write it to a writable stream.
     * @param writable - The writable stream to write the entity body to.
     * @returns The same writable stream passed as input.
     */
    readEntity(writable: Writable): Writable

    /**
     * Close the response and any associated resources.
     */
    close(): void;
}

export interface ResponseContextStreaming {
    pipe(readable: ReadableStream): void;
}

export interface ResponseContext extends Response, ResponseContextStreaming {

}

