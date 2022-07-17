import {Buffer} from "buffer";
import {MediaType} from "../core/media-type";

export interface Unmarshal<T> {

    unmarshal(bytes: Buffer, mediaType?: MediaType): Promise<T>

}
