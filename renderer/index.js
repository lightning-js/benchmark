import {
  MainCoreDriver,
  RendererMain
} from '@lightningjs/renderer';

import { colours, adjectives, nouns } from '../data/data';
import { warmup } from '../utils/warmup';

const appHeight = 1080;
const appWidth = 1900;

const driver = new MainCoreDriver();
const renderer = new RendererMain({
    appWidth: appWidth,
    appHeight: appHeight,
    clearColor: 0x00000000,
    enableInspector: false,
}, 'app', driver);

await renderer.init();

let rootNode = renderer.createNode({
  color: 0,
  parent: renderer.root,
});

let lastX = 10;
let lastY = 10;

const pick = dict => dict[Math.round(Math.random() * 1000) % dict.length];

const createRow = (parent, config = {}) => {
    const { xOffset, yOffset, color, textColor, text } = config;
    const holder = renderer.createNode({
        x: lastX,
        y: lastY,
        width: 200,
        height: 40,
        color: color || 0x00000000,
        parent: parent || rootNode,
    });

    const textNode = renderer.createTextNode({
        x: 5,
        y: 2,
        width: 200,
        height: 40,
        parent: holder,
        text: text,
        alpha: 0.8,
        fontFamily: 'Ubuntu-ssdf',
        color: textColor || 0xFFFFFFFF,
        fontSize: 26,
    });

    lastX += xOffset || 0;
    lastY += yOffset || 0;

    if (lastY >= appHeight) {
        lastY = 10;
        lastX += 40;
    }

    if (lastX >= appWidth) {
        lastX = Math.floor(Math.random() * 10);
        lastY = Math.floor(Math.random() * 10);
    }
}

const clear = () => {
    return new Promise((resolve) => {
        let clearPerf = performance.now();

        renderer.once('idle', () => {
            const time = performance.now() - clearPerf;
            resolve({ time });
        });

        lastX = 10;
        lastY = 10;
    
        rootNode.destroy();
        rootNode = renderer.createNode({
            color: 0,
            parent: renderer.root,
        });
    });
}

const createMany = (amount = 1000) => {
    return new Promise((resolve) => {
        clear().then(() => {
            const create = () => {
                for (let i = 0; i < amount; i++) {
                    createRow(rootNode, {
                        xOffset: 0,
                        yOffset: 40,
                        color: pick(colours),
                        textColor: pick(colours),
                        text: `${pick(adjectives)} ${pick(nouns)}`
                    });
                }
            }

            const createPerf = performance.now();
            create();

            renderer.once('idle', () => {
                const time = performance.now() - createPerf;
                resolve({ time });
            });
        });
    });
}

const appendMany = (amount = 1000) => {
    return new Promise((resolve) => {
        const append = () => {
            for (let i = 0; i < amount; i++) {
                createRow(rootNode, {
                    xOffset: 0,
                    yOffset: 40,
                    color: pick(colours),
                    textColor: pick(colours),
                    text: `${pick(adjectives)} ${pick(nouns)}`
                });
            }
        }

        const appendPerf = performance.now();
        append();

        renderer.once('idle', () => {
            const time = performance.now() - appendPerf;
            resolve({ time });
        });
    });
}

const updateMany = (count, skip = 0) => {
    return new Promise((resolve) => {
        // slice count from parentNode's children
        const updateManyPerf = performance.now();

        let children;
        if (skip < 0) {
            children = rootNode.children.slice(0, count);
        } else {
            // get every nth child
            children = rootNode.children.filter((_, i) => i % (skip + 1) === 0).slice(0, count);
        }


        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            child.color = pick(colours);
    
            const textNode = child.children[0];
            if (!textNode) {
                continue;
            }

            textNode.color = pick(colours);
            textNode.text = `${pick(adjectives)} ${pick(nouns)}`;
        }

        renderer.once('idle', () => {
            const time = performance.now() - updateManyPerf;
            resolve({ time });
        });
    });
}

const swapRows = () => {
    return new Promise((resolve) => {
        if (rootNode.children.length < 998) {
            return resolve();
        }

        const a = rootNode.children[998];
        const b = rootNode.children[1];
        if (!a || !b) {
            return resolve();
        }

        const swapPerf = performance.now();        
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
        
        renderer.once('idle', () => {
            const time = performance.now() - swapPerf;
            resolve({ time });
        });
    });
}

const selectRandomNode = () => {
    return new Promise((resolve) => {
        const randomNode = rootNode.children[Math.floor(Math.random() * rootNode.children.length)];

        const selectPerf = performance.now();

        randomNode.x = 100;
        randomNode.y = 100;
        randomNode.color = 0xFF0000FF; //red
        randomNode.width = 1200;
        randomNode.height = 400;

        const textNode = randomNode.children[0];
        if (textNode) {
            textNode.color = 0x000000FF; //black
            textNode.fontSize = 128;
            textNode.x = 10;
            textNode.y = 10;
        }

        renderer.once('idle', () => {
            const time = performance.now() - selectPerf;
            resolve({ time });
        });
    });
}

const removeRow = () => {
    return new Promise((resolve) => {
        // select a random child node
        const node = rootNode.children[Math.floor(Math.random() * rootNode.children.length)];
        if (!node) {
            return resolve();
        }

        const removePerf = performance.now();
        node.destroy();

        renderer.once('idle', () => {
            const time = performance.now() - removePerf;
            resolve({ time });
        });
    });
}

const results = {};

await warmup(createMany, 1000, 5);
const createRes = await createMany(1000)
results.create = createRes.time.toFixed(2);

await createMany(1000);
await warmup(updateMany, 1000, 5);
await createMany(1000);
const updateManyRes = await updateMany(1000);
results.update = updateManyRes.time.toFixed(2);

await createMany(1000);
await warmup(updateMany, [1000, 10], 5);
await createMany(1000);
const skipNthRes = await updateMany(1000, 10);
results.skipNth = skipNthRes.time.toFixed(2);


await createMany(1000);
await warmup(selectRandomNode, undefined, 5);
await createMany(1000);
const selectRes = await selectRandomNode();
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

await warmup(createMany, 6000, 5);
const createResLots = await createMany(6000)
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

// save it for the results page
localStorage.setItem('renderer', JSON.stringify(results));