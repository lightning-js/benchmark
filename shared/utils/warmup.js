/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
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

let i = 0;
export const warmup = (fn, argument, count = 5) => {
    return new Promise((resolve) => {
        const runWarmup = (fn, argument, count) => {
            // check if arguments is an array
            if (!Array.isArray(argument)) {
                argument = [argument];
            }

            fn(...argument).then(() => {
                i++;
                if (i < count) {
                    return setTimeout(() => {
                        runWarmup(fn, argument, count);
                    }, 100);
                }
    
                i = 0;
                resolve();
            });
        }

        runWarmup(fn, argument, count);
    });
}