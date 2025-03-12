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



const processResults = (results) => {
    let average = 0;
    let spread = 0;

    if (results.length > 0) {
        const sum = results.reduce((acc, time) => acc + time, 0);
        average = sum / results.length;

        const minTime = Math.min(...results);
        const maxTime = Math.max(...results);
        spread = maxTime - minTime;
    }

    return { average, spread }
}

export const run = (fn, argument, count = 5) => {
    let i = 0;
    const results = [];

    return new Promise((resolve) => {
        const runTest = (fn, argument, count) => {
            // check if arguments is an array
            if (!Array.isArray(argument)) {
                argument = [argument, count];
            }

            fn(...argument).then((res) => {
                results.push(res.time);

                i++;
                if (i < count) {
                    return setTimeout(() => {
                        runTest(fn, argument, count);
                    }, 100);
                }
    
     
                const { average, spread } = processResults(results);
                resolve({ average, spread });
            });
        }

        runTest(fn, argument, count);
    });
}