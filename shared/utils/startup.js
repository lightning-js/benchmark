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
 * Contract string the startup benchmark logs to the console.
 * The test runner (`testrunner/runStartup.js`) listens for exactly this prefix.
 */
export const startupLogPrefix = 'Startup!';

/**
 * Report a cold-startup measurement to the console in the shape the runner expects.
 *
 * @param {number} time - Milliseconds since navigation start (i.e. `performance.now()`
 *  captured when the renderer goes idle after the first frame, which equals time
 *  since `performance.timeOrigin` and therefore includes JS download/parse/execute,
 *  framework init, font atlas load and scene build).
 * @returns {{startup: string}} The logged results object.
 */
export const reportStartup = (time) => {
    const results = { startup: `${time.toFixed(2)}ms` };
    console.log(startupLogPrefix, results);
    return results;
}
