import fs from "fs";
import { runBenchmark, getBrowserVersion } from "./testrunner/runBenchmark.js";
import { processResults } from "./testrunner/processResults.js";
import { writeResults } from "./testrunner/writeResults.js";

if (!fs.existsSync('./dist')) {
    console.error('Please run `npm run setup` first');
    process.exit(1);
}

// import the package.json and grab the framework version
const lookupFrameworkVersion = (dir) => {
    if (!fs.existsSync(`./frameworks/${dir}/package.json`)) {
        return '';
    }

    const packageJson = JSON.parse(fs.readFileSync(`./frameworks/${dir}/package.json`, 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies);
    if (dependencies.length === 0) {
        return '';
    }

    // grab the first dependency
    const dependency = dependencies[0] || '';

    // check if the package-lock.json exists
    if (!fs.existsSync(`./frameworks/${dir}/package-lock.json`)) {
        return '';
    }

    // read the package-lock.json and find /node_modules/dependency/version
    const packageLock = JSON.parse(fs.readFileSync(`./frameworks/${dir}/package-lock.json`, 'utf8'));
    const dependencyString = `node_modules/${dependency}`;

    // find the dependency in the package-lock.json
    if (!packageLock.packages[dependencyString]) {
        return '';
    }

    // grab the version
    return packageLock.packages[dependencyString].version;
}

// get list of subdirectories in the dist folder
const dirs = fs.readdirSync('./dist', { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

if (dirs.length === 0) {
    console.error('No frameworks to benchmark, please ensure you have at least one framework in the dist folder');
    process.exit(1);
}

const frameworkVersions = {};
dirs.forEach( (f) => {
    const version = lookupFrameworkVersion(f);
    frameworkVersions[f] = version;
});

// run the benchmark for each framework
let results = {};
let memoryResults = {};
let idx = 0;

const browserVersion = await getBrowserVersion();
console.log('Browser version:', browserVersion);

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

        const processedResults = processResults(results, memoryResults);
        console.log('Processed results:');
        console.log(processedResults);

        console.log('Writing results...');
        writeResults(processedResults, frameworkVersions, browserVersion);
    }
}

run(dirs[0]);