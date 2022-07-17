import {Readable} from "stream";


export interface Marshal<T> {
    marshal(): Promise<Uint8Array | Readable>
}
