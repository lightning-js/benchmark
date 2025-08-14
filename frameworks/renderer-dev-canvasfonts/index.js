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


import { RendererMain } from '@lightningjs/renderer';
import { WebGlCoreRenderer } from '@lightningjs/renderer/webgl';
import { CanvasTextRenderer } from '@lightningjs/renderer/canvas';

import { colours, adjectives, nouns } from '../../shared/data.js';
import { warmup } from '../../shared/utils/warmup.js';
import { waitUntilIdle } from '../../shared/utils/waitUntilIdle.js';
import { run } from '../../shared/utils/run.js';

const appHeight = 1080;
const appWidth = 1920;

const renderer = new RendererMain({
    appWidth: appWidth,
    appHeight: appHeight,
    clearColor: 0x00000000,
    numImageWorkers: 1,
    renderEngine: WebGlCoreRenderer,
    fontEngines: [ CanvasTextRenderer ],
    textureProcessingTimeLimit: 1000,
}, 'app');

let rootNode = renderer.createNode({
  color: 0,
  parent: renderer.root,
});

const pick = dict => dict[Math.round(Math.random() * 1000) % dict.length];

const createRow = (parent, config = {}) => {
    const { color, textColor, text, index } = config;

    const x = index % 27 * 40
    const y  = ~~( index / 27 ) * 40

    const nodeProps = {
        x: x,
        y: y,
        width: 200,
        height: 40,
        color: color || 0x00000000,
        parent: parent || rootNode
    }

    const holder = renderer.createNode(nodeProps);
    renderer.createTextNode({
        x: 5,
        y: 2,
        width: 200,
        height: 40,
        parent: holder,
        text: text,
        alpha: 0.8,
        fontFamily: 'sans-serif',
        color: textColor || 0xFFFFFFFF,
        fontSize: 26,
    });
}

const createRowWithoutText = (parent, config = {}) => {
    const { color, index } = config;

    const x = index % 216 * 4
    const y  = ~~( index / 216 ) * 4

    const node = renderer.createNode({
        x: x,
        y: y,
        width: 4,
        height: 4,
        color: color || 0x00000000,
        parent: parent || rootNode,
    });

    return node;
}

const clear = () => {
    return new Promise((resolve) => {
        const clearPerf = performance.now();
        waitUntilIdle(renderer, clearPerf).then(time => {
            resolve({ time });
        });
    
        rootNode.destroy();
        rootNode = renderer.createNode({
            color: 0,
            parent: renderer.root,
        });
    });
}

const clearTest = () => {
    return new Promise( resolve => {
        createMany(1000).then( () => {
            clear().then( time => {
                resolve(time);
            });
        });
    });
}

const createMany = (amount = 1000) => {
    return new Promise((resolve) => {
        clear().then(() => {
            const createPerf = performance.now();
            waitUntilIdle(renderer, createPerf).then(time => {
                resolve({ time });
            });

            for (let i = 0; i < amount; i++) {
                createRow(rootNode, {
                    index: i,
                    color: pick(colours),
                    textColor: pick(colours),
                    text: `${pick(adjectives)} ${pick(nouns)}`
                });
            }
        });
    });
}

const appendMany = (amount = 1000) => {
    return new Promise((resolve) => {
        clear().then(() => {
            createMany(1000).then( () => {
                const appendPerf = performance.now();
                waitUntilIdle(renderer, appendPerf).then(time => {
                    resolve({ time });
                });
        
                for (let i = 0; i < amount; i++) {
                    createRow(rootNode, {
                        index: i,
                        color: pick(colours),
                        textColor: pick(colours),
                        text: `${pick(adjectives)} ${pick(nouns)}`
                    });
                }
            });
        });
    });
}

const updateMany = (count, skip = 0) => {
    return new Promise((resolve) => {
        const updateManyPerf = performance.now();
        waitUntilIdle(renderer, updateManyPerf).then(time => {
            resolve({ time });
        });

        for (let i = 0; i < rootNode.children.length; i += (skip + 1)) {
            const child = rootNode.children[i];
            child.color = pick(colours);
    
            const textNode = child.children[0];
            textNode.color = pick(colours);
            textNode.text = `${pick(adjectives)} ${pick(nouns)}`;
        }
    });
}

const swapRows = () => {
    return new Promise((resolve) => {
        const swapPerf = performance.now();
        waitUntilIdle(renderer, swapPerf).then(time => {
            resolve({ time });
        });

        const a = rootNode.children[998];
        const b = rootNode.children[1];
     
        const temp = {
            x: a.x,
            y: a.y,
            color: a.color,
            childColor: a.children[0].color,
            childText: a.children[0].text
        };
        
        a.y = b.y;
        a.x = b.x;
        a.color = b.color;
        a.children[0].color = b.children[0].color;
        a.children[0].text = b.children[0].text;

        b.y = temp.y;
        b.x = temp.x;
        b.color = temp.color;
        b.children[0].color = temp.childColor;
        b.children[0].text = temp.childText;
    });
}

const selectRandomNode = () => {
    return new Promise((resolve) => {
        const selectPerf = performance.now();

        waitUntilIdle(renderer, selectPerf).then(time => {
            resolve({ time });
        });

        const randomNode = rootNode.children[Math.floor(Math.random() * rootNode.children.length)];
        randomNode.x = 100;
        randomNode.y = 100;
        randomNode.color = 0xFF0000FF; //red
        randomNode.width = 1200;
        randomNode.height = 400;
        randomNode.zIndex = 1000;

        const textNode = randomNode.children[0];
        textNode.color = 0x000000FF; //black
        textNode.fontSize = 128;
        textNode.x = 10;
        textNode.y = 10;
    });
}

const removeRow = () => {
    return new Promise((resolve) => {
        const removePerf = performance.now();
        waitUntilIdle(renderer, removePerf).then(time => {
            resolve({ time });
        });

        rootNode.children[Math.floor(Math.random() * rootNode.children.length)].destroy();
    });
}

const createManyWithoutText = (amount = 20000) => {
    return new Promise((resolve) => {
        clear().then(() => {
            const createPerf = performance.now();
            waitUntilIdle(renderer, createPerf).then(time => {
                resolve({ time });
            });

            for (let i = 0; i < amount; i++) {
                createRowWithoutText(rootNode, {
                    index: i,
                    color: pick(colours),
                });
            }
        });
    });
}


const createMemoryBenchmark = async () => {
    const results = {};

    const createRes = await createManyWithoutText(20000)
    results.create = createRes.time.toFixed(2);

    Object.keys(results).forEach(key => {
        console.log(`${key}: ${results[key]}ms`);
    });

    console.log('Memory!', results);
}

const runBenchmark = async () => {
    const results = {};

    // createMany(1000);
    await warmup(createMany, 1000, 5);
    const { average: createAvg, spread: createSpread } = await run(createMany, 1000, 5);
    results.create = `${createAvg.toFixed(2)}ms ±${createSpread.toFixed(2)}`;

    await createMany(1000);
    await warmup(updateMany, 1000, 5);
    await createMany(1000);
    const { average: updateAvg, spread: updateSpread } = await run(updateMany, 1000, 5);
    results.update = `${updateAvg.toFixed(2)}ms ±${updateSpread.toFixed(2)}`;

    await createMany(1000);
    await warmup(updateMany, [1000, 10], 5);
    await createMany(1000);
    const { average: skipNthAvg, spread: skipNthSpread } = await run(updateMany, [1000, 10], 5);
    results.skipNth = `${skipNthAvg.toFixed(2)}ms ±${skipNthSpread.toFixed(2)}`;

    await createMany(1000);
    await warmup(selectRandomNode, undefined, 5);
    await createMany(1000);
    const { average: selectAvg, spread: selectSpread } = await run(selectRandomNode, undefined, 5);
    results.select = `${selectAvg.toFixed(2)}ms ±${selectSpread.toFixed(2)}`;

    await createMany(1000);
    await warmup(swapRows, undefined, 5);
    await createMany(1000);
    const { average: swapAvg, spread: swapSpread } = await run(swapRows, undefined, 5);
    results.swap = `${swapAvg.toFixed(2)}ms ±${swapSpread.toFixed(2)}`;

    await createMany(1000);
    await warmup(removeRow, undefined, 5);
    await createMany(1000);
    const { average: removeAvg, spread: removeSpread } = await run(removeRow, undefined, 5);
    results.remove = `${removeAvg.toFixed(2)}ms ±${removeSpread.toFixed(2)}`;

    await warmup(createMany, 10000, 5);
    const { average: createLotsAvg, spread: createLotsSpread } = await run(createMany, 10000, 5);
    results.createLots = `${createLotsAvg.toFixed(2)}ms ±${createLotsSpread.toFixed(2)}`;

    await warmup(appendMany, 1000, 5);
    const { average: appendAvg, spread: appendSpread } = await run(appendMany, 10000, 5);
    results.append = `${appendAvg.toFixed(2)}ms ±${appendSpread.toFixed(2)}`;

    await warmup(clearTest, 1000, 5);
    const { average: clearAvg, spread: clearSpread } = await run(clearTest, 10000, 5);
    results.clear = `${clearAvg.toFixed(2)}ms ±${clearSpread.toFixed(2)}`;

    Object.keys(results).forEach(key => {
        console.log(`${key}: ${results[key]}`);
    });

    console.log('Done!', results);
}

// get hash of the url
const hash = window.location.hash.substring(1);
if (hash === 'memory') {
    console.log('Running memory benchmark');
    createMemoryBenchmark();
} else {
    runBenchmark();
}