// import { render, Text, Config } from "@lightningjs/solid";
import coreExtensionModuleUrl from "./AppCoreExtensions.js?importChunkUrl";

import {
  createSignal,
  For,
} from "solid-js";
import { render, Text, View, hexColor, Config } from "@lightningjs/solid";
import { colours, adjectives, nouns } from '../data/data';
import { warmup } from "../utils/warmup";

Config.debug = false;
Config.animationsEnabled = true;
Config.fontSettings.fontFamily = "Ubuntu";
Config.fontSettings.color = hexColor("#f6f6f6");
Config.fontSettings.fontSize = 64;
Config.rendererOptions = {
    coreExtensionModule: coreExtensionModuleUrl,
//   fpsUpdateInterval: logFps ? 200 : 0,
    enableInspector: false,
  // deviceLogicalPixelRatio: 1
};

const appHeight = 1080;
const appWidth = 1900;
const pick = (dict) => dict[Math.round(Math.random() * 1000) % dict.length];
let idCounter = 1;

function buildData(count) {
    let data = new Array(count);
    for (let i = 0; i < count; i++) {
        const [label, setLabel] = createSignal(`${pick(adjectives)} ${pick(nouns)}`);
        const [color, setColor] = createSignal(pick(colours));
        const [textColor, setTextColor] = createSignal(pick(colours));
        const [width, setW] = createSignal(200);
        const [height, setH] = createSignal(40);
        const [x, setX] = createSignal(10);
        const [y, setY] = createSignal(10);
        const [fontSize, setFontSize] = createSignal(26);
        data[i] = {
            id: idCounter++,
            label, setLabel,
            color, setColor,
            textColor, setTextColor,
            width, setW,
            height, setH,
            x, setX,
            y, setY,
            fontSize, setFontSize
        }
    }
    return data;
}

let renderer = null;
let c = {}; // control functions
let lastX = 10;
let lastY = 10;

const App = () => {
  const [data, setData] = createSignal([]),
    // [selected, setSelected] = createSignal(null),
    createMany = (amount = 1000) => {
        return clear().then(() => {
            return new Promise((resolve) => {
                const createPerf = performance.now();
                setData(buildData(amount))
                renderer.once('idle', () => {
                    resolve({ time: performance.now() - createPerf});
                });
            });
        });
    },
    clear = () => { 
        return new Promise((resolve) => {
            lastX = 10;
            lastY = 10;

            let clearPerf = performance.now();
            setData([]);
            renderer.once('idle', () => {
                resolve({ time: performance.now() - clearPerf });
            });
        });
    },
    appendMany = (amount = 1000) => {
        return new Promise((resolve) => {
            const appendPerf = performance.now();
            setData([...data(), ...buildData(amount)]);
            renderer.once('idle', () => {
                resolve({ time: performance.now() - appendPerf });
            });
        });
    },
    updateMany = (count = 1000, skip = 0) => {
        return new Promise((resolve) => {
            const updatePerf = performance.now();
            let newData = data();

            if (skip < 0) {
                newData = newData.slice(0, count);
            } else {
                newData.filter((_, i) => i % (skip + 1) === 0).slice(0, count);
            }


            for (let i = 0; i < newData.length; i++) {
                const row = newData[i];
                row.setLabel(`${pick(adjectives)} ${pick(nouns)}`);
                row.setColor(pick(colours));
                row.setTextColor(pick(colours));
            }

            renderer.once('idle', () => {
                resolve({ time: performance.now() - updatePerf });
            });
        });
    },
    swapRows = () => {
        return new Promise((resolve) => {
            const swapPerf = performance.now();
            const d = data().slice();
            if (d.length > 998) {
                const a = d[998];
                const b = d[1];

                const tmp = a;
                a.setY(b.y);
                a.setX(b.x);
                a.setColor(b.color);
                a.setTextColor(b.textColor);
                a.setLabel(b.label);

                b.setY(tmp.y);
                b.setX(tmp.x);
                b.setColor(tmp.color);
                b.textColor(tmp.textColor);
                b.setLabel(tmp.label);
                
                d[1] = a;
                d[998] = b;
                setData(d);
            }
            renderer.once('idle', () => {
                resolve({ time: performance.now() - swapPerf });
            });
        });
    },
    selectRandom = () => {
        return new Promise((resolve) => {
            const selectPerf = performance.now();
            const d = data().slice();
            const selected = d[Math.floor(Math.random() * d.length)];
            
            selected.setX(100);
            selected.setY(100);
            selected.setColor(hexColor('red'));
            selected.setTextColor(hexColor('black'));
            selected.setW(1200);
            selected.setH(400);
            selected.setFontSize(128);

            renderer.once('idle', () => {
                resolve({ time: performance.now() - selectPerf });
            });
        });
    },
    removeRow = () => {
        return new Promise((resolve) => {
            const removePerf = performance.now();
            const d = data().slice();
            d.pop();
            setData(d);
            renderer.once('idle', () => {
                resolve({ time: performance.now() - removePerf });
            });
        });
    };

    // set control functions
    c.createMany = createMany;
    c.clear = clear;
    c.appendMany = appendMany;
    c.updateMany = updateMany;
    c.swapRows = swapRows;
    c.selectRandom = selectRandom;
    c.removeRow = removeRow;

    return (<View>
        <For each={ data() }>{ (row, index) => {
            let x = row.x();
            let y = row.y();

            if (x === 10 && y === 10) {
                x = lastX;
                y = lastY;
            }

            const v = <View x={x} y={y} width={row.width()} height={row.height()} color={row.color()}>
                <Text 
                    x={5}
                    y={2}
                    width={row.width()}
                    height={row.height()}
                    alpha={0.8}
                    fontFamily={"Ubuntu"}
                    color={row.textColor()}
                    fontSize={row.fontSize()}>
                    {row.label()}
                </Text>
            </View>

            lastY += 40;

            if (lastY >= appHeight) {
                lastY = 10;
                lastX += 40;
            }

            if (lastX >= appWidth) {
                lastX = Math.floor(Math.random() * 10);
                lastY = Math.floor(Math.random() * 10);
            }

            return v;
        }}
        </For>
    </View>
  );
};


const solidResp = await render(() => <App />);
renderer = solidResp.renderer;

const results = {};

await warmup(c.createMany, 1000, 5)
const createRes = await c.createMany(1000)
results.create = createRes.time.toFixed(2);

await c.createMany(1000);
await warmup(c.updateMany, 1000, 5)
await c.createMany(1000);
const updateRes = await c.updateMany(1000, 0);
results.update = updateRes.time.toFixed(2);

await c.createMany(1000);
await warmup(c.updateMany, [1000, 10], 5);
await c.createMany(1000);
const skipNthRes = await c.updateMany(1000, 10);
results.skipNth = skipNthRes.time.toFixed(2);

await c.createMany(1000);
await warmup(c.selectRandom, undefined, 5);
await c.createMany(1000);
const selectRes = await c.selectRandom();
results.select = selectRes.time.toFixed(2);

// FIXME doesn't work?
// await c.createMany(1000);
// await warmup(c.swapRows, undefined, 5);
// await c.createMany(1000);
// const swapRes = await c.swapRows();
// results.swap = swapRes.time.toFixed(2);

await c.createMany(1000);
await warmup(c.removeRow, undefined, 5);
await c.createMany(1000);
const removeRes = await c.removeRow();
results.remove = removeRes.time.toFixed(2);

await warmup(c.createMany, 6000, 5);
const createResLots = await c.createMany(6000)
results.createLots = createResLots.time.toFixed(2);

await c.clear();
await warmup(c.appendMany, 1000, 5);
await c.createMany(1000);
const appendRes = await c.appendMany(1000);
results.append = appendRes.time.toFixed(2);

await warmup(c.createMany, 1000, 5);
const clearRes = await c.clear();
results.clear = clearRes.time.toFixed(2);

Object.keys(results).forEach(key => {
    console.log(`${key}: ${results[key]}ms`);
});

// save it for the results page
localStorage.setItem('solid', JSON.stringify(results));
