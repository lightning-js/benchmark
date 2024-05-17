import fs from "fs";
import { runBenchmark } from "./testrunner/runBenchmark.js";

if (!fs.existsSync('./dist')) {
    console.error('Please run `npm run setup` first');
    process.exit(1);
}

// get list of subdirectories in the dist folder
const dirs = fs.readdirSync('./dist', { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

if (dirs.length === 0) {
    console.error('No frameworks to benchmark, please ensure you have at least one framework in the dist folder');
    process.exit(1);
}

// run the benchmark for each framework
let results = {};
let memoryResults = {};
let idx = 0;
const run = async (dir) => {
    console.log(`Running benchmark for ${dir}`);
    const result = await runBenchmark(`http://localhost:8080/${dir}/`);
    results[dir] = result;

    // run memory benchmark
    console.log(`Running memory benchmark for ${dir}`);
    const memoryResult = await runBenchmark(`http://localhost:8080/${dir}/#memory`);
    memoryResults[dir] = memoryResult;

    idx++;
    if (idx < dirs.length) {
        run(dirs[idx]);
    } else {
        console.log('All benchmarks done!');

        console.log('Benchmark results:');
        console.log(results);

        console.log('Memory results:');
        console.log(memoryResults);

        process.exit(0);
    }
}

run(dirs[0]);