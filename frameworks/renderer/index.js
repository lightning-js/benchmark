import coreExtensionModuleUrl from "./AppCoreExtensions.js?importChunkUrl";

import {
  MainCoreDriver,
  RendererMain
} from '@lightningjs/renderer';

import { colours, adjectives, nouns } from '../../shared/data';
import { warmup } from '../../shared/utils/warmup';

const appHeight = 1080;
const appWidth = 1900;

const driver = new MainCoreDriver();
const renderer = new RendererMain({
    appWidth: appWidth,
    appHeight: appHeight,
    clearColor: 0x00000000,
    enableInspector: false,
    coreExtensionModule: coreExtensionModuleUrl,
}, 'app', driver);

await renderer.init();

let rootNode = renderer.createNode({
  color: 0,
  parent: renderer.root,
});


// get hash of the url
const hash = window.location.hash.substring(1);


const pick = dict => dict[Math.round(Math.random() * 1000) % dict.length];

const createRow = (parent, config = {}) => {
    const { color, textColor, text, index } = config;

    const x = index % 27 * 40
    const y  = ~~( index / 27 ) * 40

    const holder = renderer.createNode({
        x: x,
        y: y,
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
        fontFamily: 'Ubuntu',
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
        let clearPerf = performance.now();
        renderer.once('idle', () => {
            const time = performance.now() - clearPerf;
            resolve({ time });
        });
    
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
            const createPerf = performance.now();
            renderer.once('idle', () => {
                const time = performance.now() - createPerf;
                resolve({ time });
            });

            [...Array(amount)].map((_, i) => {
                createRow(rootNode, {
                    index: i,
                    color: pick(colours),
                    textColor: pick(colours),
                    text: `${pick(adjectives)} ${pick(nouns)}`
                });
            });


        });
    });
}

const appendMany = (amount = 1000) => {
    return new Promise((resolve) => {
        const appendPerf = performance.now();
        renderer.once('idle', () => {
            const time = performance.now() - appendPerf;
            resolve({ time });
        });

        [...Array(amount)].map((_, i) => {
            createRow(rootNode, {
                index: i,
                color: pick(colours),
                textColor: pick(colours),
                text: `${pick(adjectives)} ${pick(nouns)}`
            });
        });


    });
}

const updateMany = (count, skip = 0) => {
    return new Promise((resolve) => {
        const updateManyPerf = performance.now();
        renderer.once('idle', () => {
            const time = performance.now() - updateManyPerf;
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
        renderer.once('idle', () => {
            const time = performance.now() - swapPerf;
            resolve({ time });
        });

        const a = rootNode.children[998];
        const b = rootNode.children[1];
     
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
}

const selectRandomNode = () => {
    return new Promise((resolve) => {
        const selectPerf = performance.now();
        renderer.once('idle', () => {
            const time = performance.now() - selectPerf;
            resolve({ time });
        });

        const randomNode = rootNode.children[Math.floor(Math.random() * rootNode.children.length)];

        randomNode.x = 100;
        randomNode.y = 100;
        randomNode.color = 0xFF0000FF; //red
        randomNode.width = 1200;
        randomNode.height = 400;

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
        renderer.once('idle', () => {
            const time = performance.now() - removePerf;
            resolve({ time });
        });

        rootNode.children[Math.floor(Math.random() * rootNode.children.length)].destroy();
    });
}

const createManyWithoutText = (amount = 20000) => {
    return new Promise((resolve) => {
        clear().then(() => {
            const createPerf = performance.now();
            renderer.once('idle', () => {
                const time = performance.now() - createPerf;
                resolve({ time });
            });

            [...Array(amount)].map((_, i) => {
                createRowWithoutText(rootNode, {
                    index: i,
                    color: pick(colours),
                });
            });
        });
    });
}


const createMemoryBenchmark = async () => {
    const results = {};

    await warmup(createManyWithoutText, 20000, 5);
    const createRes = await createManyWithoutText(20000)
    results.create = createRes.time.toFixed(2);

    Object.keys(results).forEach(key => {
        console.log(`${key}: ${results[key]}ms`);
    });

    // save it for the results page
    localStorage.setItem('renderer-memory', JSON.stringify(results));
}

const runBenchmark = async () => {
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

    // save it for the results page
    localStorage.setItem('renderer', JSON.stringify(results));
}

if (hash === 'memory') {
    console.log('Running memory benchmark');
    createMemoryBenchmark();
} else {
    runBenchmark();
}