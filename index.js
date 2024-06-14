/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import { runBenchmark, getBrowserVersion } from "./testrunner/runBenchmark.js";
import { processResults } from "./testrunner/processResults.js";
import { writeResults } from "./testrunner/writeResults.js";
import { getJavaScriptBundleSize } from "./testrunner/totalBundlefileSize.js";

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
let fileSizeResults = {};
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

    // get the total size of the javascript bundle
    console.log(`Getting total size of the javascript bundle for ${dir}`);
    const fileSize = getJavaScriptBundleSize(`./dist/${dir}`);
    fileSizeResults[dir] = fileSize;

    idx++;
    if (idx < dirs.length) {
        run(dirs[idx]);
    } else {
        console.log('All benchmarks done!');

        console.log('Benchmark results:');
        console.log(results);

        console.log('Memory results:');
        console.log(memoryResults);

        console.log('File size results:');
        console.log(fileSizeResults);

        const processedResults = processResults(results, memoryResults, fileSizeResults);
        console.log('Processed results:');
        console.log(processedResults);

        console.log('Writing results...');
        writeResults(processedResults, frameworkVersions, browserVersion);
    }
}

run(dirs[0]);