import {
    createSignal,
    For,
  } from "solid-js";
import { Text, View, hexColor } from "@lightningjs/solid";
import { colours, adjectives, nouns } from '../../../shared/data';
import { warmup } from "../../../shared/utils/warmup";

import { pick } from "./utils/pick";
import { getRenderer } from "./utils/renderer";

let idCounter = 1;
function buildData(count) {
    let data = new Array(count);
    for (let i = 0; i < count; i++) {
        const [label, setLabel] = createSignal(`${pick(adjectives)} ${pick(nouns)}`);
        const [color, setColor] = createSignal(pick(colours));
        const [textColor, setTextColor] = createSignal(pick(colours));
        const [width, setW] = createSignal(200);
        const [height, setH] = createSignal(40);
        const [x, setX] = createSignal(null);
        const [y, setY] = createSignal(null);
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

const Benchmark = () => {
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

            for(let i = 0, d = data(), len = d.length; i < len; i += (skip + 1)) {
                const row = d[i];
                row.setLabel(`${pick(adjectives)} ${pick(nouns)}`);
                row.setColor(pick(colours));
                row.setTextColor(pick(colours));
            }
        });
    },
    swapRows = () => {
        return new Promise((resolve) => {
            const swapPerf = performance.now();
            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - swapPerf });
            });

            const d = data().slice();
            if (d.length > 998) {
                let tmp = d[1];
                d[1] = d[998];
                d[998] = tmp;

                // For some reason this doesn't work because solid throws a 
                // "Node already rendered" Error - so going to manually swap the data
                setData([]);
                setData(d);
            }
        });
    },
    selectRandom = () => {
        return new Promise((resolve) => {
            const selectPerf = performance.now();
            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - selectPerf });
            });

            const d = data();
            const selected = d[Math.floor(Math.random() * d.length)];
            
            selected.setX(100);
            selected.setY(100);
            selected.setColor(hexColor('red'));
            selected.setTextColor(hexColor('black'));
            selected.setW(1200);
            selected.setH(400);
            selected.setFontSize(128);
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

    return (<View>
        <For each={ data() }>{ (row, index) => {
            const x = row.x() || (index() % 27 * 40);
            const y = row.y() || ~~( index() / 27 ) * 40;

            return <View x={x} y={y} width={row.width()} height={row.height()} color={row.color()}>
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
        }}
        </For>
    </View>
  );
};

export default Benchmark;