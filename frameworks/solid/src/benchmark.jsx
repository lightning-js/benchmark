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
import { Text, View } from "@lightningtv/solid";
import { colours, adjectives, nouns } from '../../../shared/data';
import { warmup } from "../../../shared/utils/warmup";

import { pick } from "./utils/pick";
import { getRenderer } from "./utils/renderer";

function buildData(count) {
    let data = new Array(count);
    for (let i = 0; i < count; i++) {
        data[i] = {
            label: `${pick(adjectives)} ${pick(nouns)}`,
            color: pick(colours),
            textColor: pick(colours),
            width: 200,
            height: 40,
            x: (i % 27 * 40),
            y: ~~( i / 27 ) * 40,
            fontSize: 26
        }
    }

    return data;
}

const Benchmark = () => {
    let container;
    const [data, setData] = createSignal([]),
    createMany = (amount = 1000) => {
        return clear().then(() => {
            return new Promise((resolve) => {
                const createPerf = performance.now();
                getRenderer().once('idle', () => {
                    resolve({ time: performance.now() - createPerf});
                });

                setData(buildData(amount))
            });
        });
    },
    clear = () => { 
        return new Promise((resolve) => {
            if (data().length === 0) {
                resolve({ time: 0 });
                return;
            }

            const clearPerf = performance.now();
            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - clearPerf });
            });
            setData([]);
        });
    },
    appendMany = (amount = 1000) => {
        return new Promise((resolve) => {
            const appendPerf = performance.now();
            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - appendPerf });
            });

            setData([...data(), ...buildData(amount)]);
        });
    },
    updateMany = (count = 1000, skip = 0) => {
        return new Promise((resolve) => {
            const updatePerf = performance.now();
            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - updatePerf });
            });

            // If we were to update all the objects this would be slow to reconcile unless we used Index rather than For
            // instead we'll just update the nodes
            const d = container.children;
            for(let i = 0, len = d.length; i < len; i += (skip + 1)) {
                const node = d[i];
                const text = node.children[0];
                text.text = `${pick(adjectives)} ${pick(nouns)}`;
                node.color = pick(colours);
                text.color = pick(colours);
            }
        });
    },
    swapRows = () => {
        return new Promise((resolve) => {
            const swapPerf = performance.now();
            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - swapPerf });
            });

            const a = container.children[998];
            const b = container.children[1];
        
            const temp = a;
            a.y = b.y;
            a.x = b.x;
            a.color = b.color;
            a.children[0].color = b.children[0].color;
            a.children[0].text = b.children[0].text;

            b.y = temp.y;
            b.x = temp.x;
            b.color = temp.color;
            b.children[0].color = temp.children[0].color;
            b.children[0].text = temp.children[0].text;
        });
    },
    selectRandom = () => {
        return new Promise((resolve) => {
            const selectPerf = performance.now();
            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - selectPerf });
            });

            
            const selected = container.children[Math.floor(Math.random() * container.children.length)];
            const text = selected.children[0];
            
            selected.x = 100;
            selected.y = 100;
            selected.color = 0xFF0000FF // red;
            selected.width = 1200;
            selected.height = 400;
            text.fontSize = 100;
        });
    },
    removeRow = () => {
        return new Promise((resolve) => {
            const removePerf = performance.now();
            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - removePerf });
            });

            const d = data().slice();
            d.pop();
            setData(d);
        });
    },
    runBenchmark = async () => {
        const results = {};

        await warmup(createMany, 1000, 5)
        const createRes = await createMany(1000)
        results.create = createRes.time.toFixed(2);

        await createMany(1000);
        await warmup(updateMany, 1000, 5)
        await createMany(1000);
        const updateRes = await updateMany(1000, 0);
        results.update = updateRes.time.toFixed(2);

        await createMany(1000);
        await warmup(updateMany, [1000, 10], 5);
        await createMany(1000);
        const skipNthRes = await updateMany(1000, 10);
        results.skipNth = skipNthRes.time.toFixed(2);

        await createMany(1000);
        await warmup(selectRandom, undefined, 5);
        await createMany(1000);
        const selectRes = await selectRandom();
        results.select = selectRes.time.toFixed(2);

        await createMany(1000);
        await warmup(swapRows, undefined, 5);
        await createMany(1000);
        const swapRes = await swapRows();
        results.swap = swapRes.time.toFixed(2);

        await createMany(1000);
        await warmup(removeRow, undefined, 5);
        await createMany(1000);
        const removeRes = await removeRow();
        results.remove = removeRes.time.toFixed(2);

        await warmup(createMany, 10000, 5);
        const createResLots = await createMany(10000)
        results.createLots = createResLots.time.toFixed(2);

        await clear();
        await warmup(appendMany, 1000, 5);
        await createMany(1000);
        const appendRes = await appendMany(1000);
        results.append = appendRes.time.toFixed(2);

        await warmup(createMany, 1000, 5);
        const clearRes = await clear();
        results.clear = clearRes.time.toFixed(2);

        Object.keys(results).forEach(key => {
            console.log(`${key}: ${results[key]}ms`);
        });

        console.log('Done!', results);
    }

    console.log('starting benchmark');
    setTimeout(runBenchmark, 1000);

    return (<Show when={data().length > 0}>
        <View ref={container}>
            <For each={ data() }>{ (row) => {
                return <View x={row.x} y={row.y} width={row.width} height={row.height} color={row.color}>
                    <Text 
                        x={5}
                        y={2}
                        width={row.width}
                        height={row.height}
                        alpha={0.8}
                        fontFamily={"Ubuntu"}
                        color={row.textColor}
                        fontSize={row.fontSize}>
                        {row.label}
                    </Text>
                </View>
            }}
            </For>
        </View>
    </Show>
  );
};

export default Benchmark;