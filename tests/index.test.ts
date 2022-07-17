import {
    EntityTag,
    Header,
    HttpHeaders,
    MediaType,
    ClientBuilder,
    TimeUnit,
    StringEntity,
    LoggingFilter
} from '../src';


import * as fs from "fs";


describe('testing http client', () => {

    const client = new ClientBuilder()
        .withTimeout(30, TimeUnit.Seconds)
        .withFilter(new LoggingFilter(console.log))
        .build();

    const target = client
        .target("https://run.mocky.io");

    test('test GET request', async () => {

        const response = await target
            .path("/v3/de314aa8-a521-47c4-8ff3-69b447dab89b")
            .request()
            .get();

        expect(response.getStatus()).toBe(200);

        expect(response.getStatusInfo().getFamily().isSuccessful()).toBe(true);

        const body = await response.readEntity(new StringEntity());

        expect(body).toBe("This is a test");
    });

    test('Test GET and write response into stream', async () => {

        const response = await target
            .path("/v3/de314aa8-a521-47c4-8ff3-69b447dab89b")
            .request()
            .header(HttpHeaders.ACCEPT, MediaType.ANY_TEXT_TYPE.toString())
            .get();

        const stream = response.readEntity(fs.createWriteStream('get_rsp.txt'))

        await new Promise((resolve, reject) => {
            stream.on("finish", () => {
                if(fs.existsSync('get_rsp.txt')) {
                    const body = fs.readFileSync('get_rsp.txt').toString('utf-8');
                    expect(body).toBe("This is a test");

                    fs.rmSync('get_rsp.txt')
                    resolve(true);
                } else {
                    reject("File must exists");
                }
            });

            stream.on('error', (err) => {
                reject(err);
            });
        });
    });


});

describe('testing header', () => {

    test('test etag header', () => {

        const h = new EntityTag("test");
        expect(h.value).toBe("\"test\"");
        expect(h.key).toBe(HttpHeaders.ETAG);

        const h1 = new EntityTag("test", true);
        expect(h1.value).toBe("W/\"test\"");

        expect(EntityTag.fromString("\"test\"").value).toBe("\"test\"");
        expect(EntityTag.fromString("\"test\"").isWeak).toBe(false);

        expect(EntityTag.fromString("W/\"test\"").value).toBe("W/\"test\"");
        expect(EntityTag.fromString("W/\"test\"").rawValue()).toBe("test");
        expect(EntityTag.fromString("W/\"test\"").isWeak).toBe(true);

    });

    test('testing equals', () => {

        expect(new Header(HttpHeaders.VARY, "encoding").equals(new Header(HttpHeaders.VARY, "encoding")))
            .toBe(true);

        expect(new Header(HttpHeaders.VARY, "encoding").equals(new Header(HttpHeaders.VARY, "range")))
            .toBe(false);

        expect(new Header(HttpHeaders.VARY, "encoding").equals(null))
            .toBe(false);
    });

    test('testing clone', () => {
        const h = new Header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_TYPE.toString());
        const h1 = h.clone();

        expect(h == h1)
            .toBe(false);

        expect(h.id() === h1.id())
            .toBe(true);

        expect(h.equals(h1))
            .toBe(true);
    });

    test('testing id', () => {
        const h = new Header(HttpHeaders.ACCEPT, MediaType.TEXT_XML_TYPE.toString());

        expect(h.id() === "accept").toBe(true);
        expect(h.key === HttpHeaders.ACCEPT).toBe(true);
    });
});
