import {Socket} from "net";
import {IncomingMessage} from "http";


let flag = true;

const g = "GET / HTTP/1.1\r\n" +
    "Host: reqbin.com\r\nContent-Length:1\r\n\r\na"

class TestS extends Socket {


    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean | undefined }): T {
        return super.pipe(destination, options);
    }


    // @ts-ignore
    addListener(event: string, listener: () => void): this {
        return super.addListener(event, listener);
    }

    read(size?: number): any {

        if (size === 0) {
            return "";
        }

        if (flag) {
            flag = false;
            this.emit("data", g);
            return g;
        } else {
            this.emit("end")
            return null;
        }
    }

    connect(a: any, b: any, connectionListener?: () => void): this {

        this.emit("ready");

        return this;
    }
}


const r = new TestS();

r.connect("", "", () => {
    console.log("login");
});


// @ts-ignore
const t = new IncomingMessage(r);


t.on("data", (chunk) => {
    console.log(chunk);
});

t.on("end", () => {
    console.log("enf");
});

t.on('error', (error) => {
    console.log(error);
})


setTimeout(() => {

}, 100000)
