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
 * This file contains functions for running benchmarks and getting browser version.
 * @module runBenchmark
 */

import { chromium } from 'playwright';

/**
 * Gets the version of the Chromium browser.
 * @returns {Promise<string>} The version of the Chromium browser.
 */
export const getBrowserVersion = async () => {
    const browser = await chromium.launch({ 
        headless: true
    });

    const browserVersion = `Chromium ${await browser.version()}`;
    await browser.close();

    return browserVersion;
}

/**
 * Runs a benchmark on the specified URL.
 * 
 * @typedef {import('./types/results.js').Result} Result
 * @typedef {import('./types/memoryResults.js').MemoryResult} MemoryResult
 * @typedef {import('./types/fileSizeResults.js').FileSizeResults} FileSizeResults
 * 
 * @param {string} url - The URL to run the benchmark on.
 * @returns {Promise<Result & MemoryResult>} A promise that resolves with the benchmark results.
 * @throws {Error} If the URL is not provided.
 */
export const runBenchmark = async (url) => {
    if (!url) throw new Error('url is required');

    let resolve, timeout;
    let collectJsHeap = () => {};
    let loaded = false;

    const donePromise = new Promise((r) => {
        resolve = r;
    });

    // Setup
    const browser = await chromium.launch({ 
        headless: false
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
    });

    const page = await context.newPage();
    page.on('console', async msg => { 
        const clearTm = () => { if (timeout) clearTimeout(timeout) };

        if (msg.text().includes('Done!')) {
            clearTm();
            console.log('Benchmark complete!');

            const results = await msg.args()[1].jsonValue();
            console.log('results: ', results);
            exit(results);
        }

        if (msg.text().includes('Memory!')) {
            clearTm();
            console.log('Memory test complete!');

            // if we have a results, get the time
            if (msg.args().length > 1) {
                const jsheap = await collectJsHeap();
                // @ts-ignore
                const heapInMB = (jsheap / 1024 / 1024).toFixed(2);
                const results = await msg.args()[1].jsonValue(); 
                console.log('JS Heap: ', heapInMB, 'MB');
                return exit({ ...results, heap: heapInMB})
            }

            // we dont have a results, test failed
            console.error('Memory test failed');
            return exit({ create: -1, heap: -1 });
        }
    });

    /**
     * Exits the benchmark and closes the browser.
     * @param {Result|MemoryResult} [results={}] - The benchmark results.
     * @returns {Promise<void>}
     */
    const exit = async (results) => {
        if (!loaded) { 
            setTimeout(() => exit(results), 1000)
            return Promise.resolve();
        }

        // Teardown
        await context.close();
        await browser.close();
        resolve(results);
    };

    // The actual interesting bit
    await page.goto(url);

    const title = await page.title();
    console.log('Loaded: ', title);

    // set CPU to 6x slowdown
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

    // create 10 min timeout
    timeout = setTimeout(() => {
        console.error('Timeout!');
        exit();
    }, 1000 * 60 * 10);

    /**
     * Collects the JavaScript heap size.
     * @returns {Promise<number>} The JavaScript heap size in bytes.
     */
    collectJsHeap = async () => {
        await client.send('Performance.enable');
        const performanceMetrics = await client.send('Performance.getMetrics');
        await client.send('Performance.disable');
        return performanceMetrics.metrics.find(m => m.name === 'JSHeapUsedSize').value;
    }

    loaded = true;

    return donePromise;
}