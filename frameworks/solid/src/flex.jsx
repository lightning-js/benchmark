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

import {
    createSignal,
    For,
    Index
  } from "solid-js";

import { Row, Column } from "@lightningtv/solid/primitives";
import { Text, View } from "@lightningtv/solid";
import { colours, adjectives, nouns } from '../../../shared/data.js';
import { warmup } from "../../../shared/utils/warmup.js";
import { waitUntilIdle } from "../../../shared/utils/waitUntilIdle.js";
import { run } from "../../../shared/utils/run.js";

import { pick } from "./utils/pick.js";
import { getRenderer } from "./utils/renderer.js";

function buildData(amount) {
    const items = []
    let count = 0
    while (count < amount) {
      const row = []
      for (let i = 0; i < 27 && count < amount; i++) {
        row.push({
            label: `${pick(adjectives)} ${pick(nouns)}`,
            color: pick(colours),
            textColor: pick(colours),
            width: 40,
            height: 40,
            fontSize: 26
        })
        count++
      }

      items.push(row)
    }

    return items;
}

const Flex = () => {
    let container;
    const renderer = getRenderer();

    const [data, setData] = createSignal(),
    createMany = (amount = 1000) => {
        return clear().then(() => {
            return new Promise((resolve) => {
                const createPerf = performance.now();
                waitUntilIdle(renderer, createPerf).then(time => {
                    resolve({ time });
                });

                setData(buildData(amount))
            });
        });
    },
    clear = () => { 
        return new Promise((resolve) => {
            if (!data) {
                resolve({ time: 0 });
                return;
            }

            const clearPerf = performance.now();
            waitUntilIdle(renderer, clearPerf).then(time => {
                resolve({ time });
            });
            setData([]);
        });
    },
    runBenchmark = async () => {
        const results = {};

        await warmup(createMany, 1000, 5);
        const { average: createAvg, spread: createSpread } = await run(createMany, 1000, 5);
        results.create = `${createAvg.toFixed(2)}ms ±${createSpread.toFixed(2)}`;

        Object.keys(results).forEach(key => {
            console.log(`${key}: ${results[key]}ms`);
        });

        console.log('Done!', results);
    }

    console.log('starting benchmark');
    setTimeout(runBenchmark, 1000);

    return (<Show when={data()}>
        <View ref={container}>
            <Column gap={0} width={40}>
            <For each={ data() }>{ (row) => {
                return <Row height={40} gap={0}>
                    <For each={ row }>{ (item) => {
                        return <View x={item.x} y={item.y} width={item.width} height={item.height} color={item.color}>
                            <Text 
                                x={5}
                                y={2}
                                width={item.width}
                                height={item.height}
                                alpha={0.8}
                                fontFamily={"Ubuntu"}
                                color={item.textColor}
                                fontSize={item.fontSize}>
                                {item.label}
                            </Text>
                        </View>
                    }}</For>
                </Row>
            }}</For>
            </Column>
        </View>
    </Show>
  );
};

export default Flex;