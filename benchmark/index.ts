import * as Benchmark from 'benchmark';
import {ClientBuilder, StringEntity, TimeUnit} from "../src";

const server = process.env.SERVER || process.exit(1);

const client = new ClientBuilder()
    .withTimeout(1, TimeUnit.Minutes)
    .build();

const requestBuilder = client.target(server)
    .path('/')
    .request();

const suite = new Benchmark.Suite();


// Add benchmarks
suite.add('Pluto Bench GET Request', {
    defer: true,
    fn: (deferred: any) => {
        requestBuilder.get()
            .then((response) => {
                response.readEntity(new StringEntity()).then(() => deferred.resolve())
            });
    }
});

// Run the benchmarks
suite
    .on('cycle', (event: any) => {
        console.log(String(event.target));
    })
    .on('complete', () => {
        console.log('Benchmark finished.');
    })
    .run({async: true});
