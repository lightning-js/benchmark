import {
  MainCoreDriver,
  RendererMain
} from '@lightningjs/renderer';

import { colours, adjectives, nouns } from '../data/data';

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
        lastX = Math.random() * 10;
        lastY = Math.random() * 10;
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

const updateMany = (count, skip = 0) => {
    return new Promise((resolve) => {
        // slice count from parentNode's children
        let children;
        if (skip < 0) {
            children = rootNode.children.slice(0, count);
        } else {
            // get every nth child
            children = rootNode.children.filter((_, i) => i % (skip + 1) === 0).slice(0, count);
        }

        const updateManyPerf = performance.now();
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


// warmup
let i = 0;
const warmup = (fn, argument, count = 5) => {
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

const results = {};

await warmup(createMany, 1000, 5);
const createRes = await createMany(1000)
results.create = createRes.time.toFixed(2);

await createMany(1000);
await warmup(updateMany, 1000, 5);
await clear();
await createMany(1000);
const updateManyRes = await updateMany(1000);
results.update = updateManyRes.time.toFixed(2);

await createMany(1000);
await warmup(updateMany, [1000, 10], 5);
await clear();
await createMany(1000);
const skipNthRes = await updateMany(1000, 10);
results.skipNth = skipNthRes.time.toFixed(2);

await createMany(1000);
await warmup(selectRandomNode, undefined, 5);
await clear();
await createMany(1000);
const selectRes = await selectRandomNode();
results.select = selectRes.time.toFixed(2);

Object.keys(results).forEach(key => {
    console.log(`${key}: ${results[key]}ms`);
});
