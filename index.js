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

/**
 * This script runs benchmarks for multiple frameworks.
 * It retrieves the framework versions, runs the benchmarks,
 * collects the results, and writes them to a file.
 */

import fs from "fs";
import shell from 'shelljs';
import { runBenchmark, getBrowserVersion } from "./testrunner/runBenchmark.js";
import { processResults } from "./testrunner/processResults.js";
import { writeResults } from "./testrunner/writeResults.js";
import { getJavaScriptBundleSize } from "./testrunner/totalBundlefileSize.js";


/**
 * Check for --results or -r argument
 */
const args = process.argv.slice(2);
let writeOfficialResultsFlag = false;

if (args.includes('--results') || args.includes('-r')) {
    writeOfficialResultsFlag = true;
}

/**
 * Checks if the './dist' directory exists.
 * If it doesn't exist, it logs an error message and exits the process.
 */
if (!fs.existsSync('./dist')) {
    console.error('Please run `npm run setup` first');
    process.exit(1);
}

/**
 * Looks up the version of a framework by reading its package.json and package-lock.json files.
 * @param {string} dir - The directory of the framework.
 * @returns {string} The version of the framework.
 */
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

/**
 * Retrieves the list of subdirectories in the './dist' folder.
 * @returns {string[]} An array of subdirectory names.
 */
const dirs = fs.readdirSync('./dist', { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

/**
 * Checks if there are any frameworks to benchmark.
 * If there are no frameworks, it logs an error message and exits the process.
 */
if (dirs.length === 0) {
    console.error('No frameworks to benchmark, please ensure you have at least one framework in the dist folder');
    process.exit(1);
}

const frameworkVersions = {};
dirs.forEach( (f) => {
    const version = lookupFrameworkVersion(f);
    frameworkVersions[f] = version;
});

/**
 * Runs the benchmark for each framework.
 * Collects the benchmark results, memory results, and file size results.
 */

/**
 * The benchmark results object.
 * @typedef {import('./testrunner/types/results.js').Results} Results
 * @typedef {import('./testrunner/types/memoryResults.js').MemoryResults} MemoryResults
 * @typedef {import('./testrunner/types/fileSizeResults.js').FileSizeResults} FileSizeResults
 * 
 * @typedef {?Results} results
 */
let results = null;

/**
 * The memory results object.
 * @typedef {?MemoryResults} memoryResults
 */
let memoryResults = null;

/**
 * The file size results object.
 * @typedef {?FileSizeResults} fileSizeResults
*/
let fileSizeResults = null;
let idx = 0;

/**
 * Retrieves the browser version and logs it.
 */
const browserVersion = await getBrowserVersion();
console.log('Browser version:', browserVersion);

/**
 * Initializes the results object.
 * @typedef {import('./testrunner/types/results.js').Result} Result
 * @returns {Result} The results object.
 */
const createNewResult = () => {
    return {
        create: null,
        update: null,
        skipNth: null,
        select: null,
        swap: null,
        remove: null,
        createLots: null,
        append: null,
        clear: null
    }
}

/**
 * Runs the benchmark for a specific framework.
 * @param {string} dir - The directory of the framework.
 */
const run = async (dir) => {
    if (results === null) results = {};
    if (memoryResults === null) memoryResults = {};
    if (fileSizeResults === null) fileSizeResults = {};

    results[dir] = createNewResult();

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
        const filename = await writeResults(processedResults, frameworkVersions, browserVersion);

        if (writeOfficialResultsFlag) {
            writeOfficialResults(filename);
        }
    }
}

/**
 * Writes the results to a file.
 * @param {string} filename - The processed benchmark results.
 *
 * @returns {void}
 */
const writeOfficialResults = (filename) => {
    console.log('Writing official results...');
    const sourceFile = `./results/${filename}`;

    // Ensure the official_results directory exists
    if (!fs.existsSync('./official_results')) {
        fs.mkdirSync('./official_results');
    }

    // Generate a filename with the current date in YYYYMMDD format
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
    const cleanedFilename = filename.replace('_results_', '_');
    const newFilename = `${formattedDate}_${cleanedFilename}`;

    // Copy the file to the new location with the new filename
    shell.cp(sourceFile, `./official_results/${newFilename}`);
    console.log(`Official results written to: ./official_results/${newFilename}`);

    // Update the filename variable for use in the results.json file
    filename = newFilename;

    // Load or create the results.json file
    let resultsJson = {};
    const resultsJsonPath = './official_results/results.json';
    
    if (fs.existsSync(resultsJsonPath)) {
        const fileContent = fs.readFileSync(resultsJsonPath, 'utf8');
        resultsJson = JSON.parse(fileContent);
    }

    // Add the new result to the JSON object
    const blitsVersion = 'Blits ' + frameworkVersions['blits'] || '';
    const rendererVersion = 'Renderer ' + frameworkVersions['renderer'] || '';
    const version = `${formattedDate} ${blitsVersion} ${rendererVersion} ${browserVersion}`;
    resultsJson[version] = filename;

    // Write the updated JSON back to the file
    fs.writeFileSync(resultsJsonPath, JSON.stringify(resultsJson, null, 2));
}


run(dirs[0]);