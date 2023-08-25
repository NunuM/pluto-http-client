import {createServer} from 'http';
import cluster from 'cluster';
import * as child_process from "child_process";

//@ts-ignore
const port: number = parseInt(process.env.PORT, 10) || 7777;
//@ts-ignore
const timeout: number = parseInt(process.env.TIMEOUT, 10) || 1;
//@ts-ignore
const workers: number = parseInt(process.env.WORKERS) || 1;

const startBenchmark = () => {

    const benchmarkProcess = child_process.spawn('node', [
        '--require',
        'ts-node/register',
        'benchmark/index.ts',
    ], {env: {SERVER: `http://localhost:${port}`, ...process.env}});

    benchmarkProcess.stdout.setEncoding('utf8');
    benchmarkProcess.stderr.setEncoding('utf8');

    benchmarkProcess.stdout.on("data", console.log);
    benchmarkProcess.stderr.on("data", console.error);

    benchmarkProcess.on('exit', (signal) => {

        for (const id in cluster.workers) {
            //@ts-ignore
            cluster.workers[id].kill();
        }

        process.exit(0);
    });


}

if (cluster.isPrimary) {
    let workersReady = 0;

    const workerReady = () => {
        workersReady += 1;

        if (workersReady == workers) {
            startBenchmark();
        }
    }

    for (let i = 0; i < workers; i++) {
        cluster.fork();
    }

    for (const id in cluster.workers) {
        //@ts-ignore
        cluster.workers[id].on('message', workerReady);
    }

} else {
    const buf = Buffer.alloc(64 * 1024, '_')
    const server = createServer((req, res) => {
        setTimeout(function () {
            res.end(buf)
        }, timeout)
    }).listen(port, () => {
        //@ts-ignore
        console.log(`Worker ${cluster.worker.id} started`);
        //@ts-ignore
        process.send(cluster.worker.id);
    });
    server.keepAliveTimeout = 600e3
}


