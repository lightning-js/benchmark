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

import { For } from "solid-js";
import { View } from "@lightningtv/solid";
import { colours } from '../../../shared/data';
import { pick } from "./utils/pick";
import { getRenderer } from "./utils/renderer";

function buildData(count) {
    let data = [];
    for (let i = 0; i < count; i++) {
        data.push({
            color: pick(colours),
            x: i % 216 * 4,
            y: ~~( i / 216 ) * 4
        })
    }
    return data;
}


const Memory = () => {
    console.log('starting memory test');
    const memoryPerf = performance.now();
    const data = buildData(20000);

    getRenderer().once('idle', () => {
        const results = {};
        const memoryRes = { time: performance.now() - memoryPerf };
        results.create = memoryRes.time.toFixed(2);

        Object.keys(results).forEach(key => {
            console.log(`${key}: ${results[key]}ms`);
        });

        console.log('Memory!', results);
    });

    return (
        data.map((row) => <node x={/*@once*/ row.x} y={/*@once*/ row.y} width={4} height={4} color={/*@once*/ row.color}></node>)
  );
};

export default Memory;