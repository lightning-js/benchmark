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
 * This file contains the cold-startup benchmark runner.
 * @module runStartup
 */

import { chromium } from 'playwright';

/**
 * Number of cold loads per framework. Tunable via `STARTUP_RUNS`.
 * Cold starts are noisier than warm ops, hence more runs than the usual 5.
 */
const defaultIterations = () => {
    const parsed = parseInt(process.env.STARTUP_RUNS || '7', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
};

/**
 * Runs a single cold startup measurement: fresh context, CPU throttling applied
 * *before* navigation (so JS parse/compile is throttled too), then goto `#startup`
 * and wait for the in-page `Startup!` console signal.
 *
 * @param {import('playwright').Browser} browser - Reused browser instance.
 * @param {string} url - Base URL of the framework (without hash).
 * @param {Object} options
 * @param {number} options.cpuThrottleRate - CDP CPU throttling rate.
 * @param {boolean} options.headless - Unused here, kept for signature symmetry.
 * @param {number} options.timeoutPerRun - Per-iteration timeout in ms.
 * @returns {Promise<{startupMs: number, wallMs: number}>}
 */
const runSingleStartup = async (browser, url, { cpuThrottleRate, timeoutPerRun }) => {
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
    });

    const page = await context.newPage();

    // Apply CPU throttling BEFORE navigation so it covers JS parse/compile,
    // unlike the throughput benchmark which throttles after page load.
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottleRate });
    try {
        await client.send('Network.enable');
        await client.send('Network.clearBrowserCache');
    } catch {
        // Non-fatal: a fresh context already starts with a cold cache.
    }

    const wallStart = Date.now();

    const resultPromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Startup run timed out after ${timeoutPerRun}ms for ${url}`));
        }, timeoutPerRun);

        page.on('console', async (msg) => {
            const text = msg.text();
            if (msg.type() === 'error') {
                console.log('[browser error]', text);
            }

            if (text.includes('Startup!')) {
                clearTimeout(timer);
                try {
                    const results = msg.args().length > 1 ? await msg.args()[1].jsonValue() : {};
                    const startupMs = parseFloat(results.startup);
                    if (!Number.isFinite(startupMs)) {
                        reject(new Error(`Invalid Startup! payload: ${JSON.stringify(results)}`));
                        return;
                    }
                    resolve({ startupMs, wallMs: Date.now() - wallStart });
                } catch (err) {
                    reject(err);
                }
            }
        });
    });

    try {
        await page.goto(`${url}#startup`, { waitUntil: 'load' });
        const title = await page.title();
        console.log('Loaded (startup): ', title);
        return await resultPromise;
    } finally {
        await context.close();
    }
};

/**
 * Runs the cold-startup benchmark for one framework: N sequential cold loads.
 *
 * Each iteration uses a fresh browser context (cold disk/memory cache) and
 * reports the in-page time (navigation start -> first idle after 1,000 rows,
 * which includes JS download/parse/execute) plus a Playwright wall-clock
 * cross-check.
 *
 * @typedef {import('./types/startupResults.js').StartupResult} StartupResult
 *
 * @param {string} url - The base URL of the framework (without hash).
 * @param {Object} [options]
 * @param {number} [options.iterations] - Cold loads to perform (default 7 / `STARTUP_RUNS`).
 * @param {number} [options.cpuThrottleRate] - CDP CPU throttling rate (default 6).
 * @param {boolean} [options.headless] - Run headless (default false, matches throughput benchmark; set `HEADLESS=true` to override).
 * @param {number} [options.timeoutPerRun] - Per-iteration timeout in ms (default 2 min).
 * @returns {Promise<StartupResult>} Startup result; `startup` is `-1` when every iteration failed.
 */
export const runStartupBenchmark = async (url, options = {}) => {
    if (!url) throw new Error('url is required');

    const iterations = options.iterations ?? defaultIterations();
    const cpuThrottleRate = options.cpuThrottleRate ?? 6;
    const headless = options.headless ?? process.env.HEADLESS === 'true';
    const timeoutPerRun = options.timeoutPerRun ?? 1000 * 60 * 2;

    const browser = await chromium.launch({ headless });

    const runs = [];
    const wallRuns = [];

    try {
        for (let i = 0; i < iterations; i++) {
            try {
                console.log(`Startup run ${i + 1}/${iterations} for ${url}`);
                const { startupMs, wallMs } = await runSingleStartup(browser, url, {
                    cpuThrottleRate,
                    timeoutPerRun,
                });
                console.log(`Startup run ${i + 1}: ${startupMs.toFixed(2)}ms (wall ${wallMs}ms)`);
                runs.push(startupMs);
                wallRuns.push(wallMs);
            } catch (err) {
                console.error(`Startup run ${i + 1} failed:`, err.message);
            }
        }
    } finally {
        await browser.close();
    }

    if (runs.length === 0) {
        console.error(`All startup runs failed for ${url}`);
        return { startup: -1, average: -1, spread: -1, min: -1, runs: [], wallAverage: -1 };
    }

    const average = runs.reduce((acc, time) => acc + time, 0) / runs.length;
    const spread = Math.max(...runs) - Math.min(...runs);
    const min = Math.min(...runs);
    const wallAverage = wallRuns.reduce((acc, time) => acc + time, 0) / wallRuns.length;

    return {
        startup: `${average.toFixed(2)}ms ±${spread.toFixed(2)}`,
        average,
        spread,
        min,
        runs,
        wallAverage,
    };
}
