import {
    createSignal,
    For,
  } from "solid-js";
import { View } from "@lightningjs/solid";
import { colours } from '../../../shared/data';

import { pick } from "./utils/pick";
import { getRenderer } from "./utils/renderer";

let idCounter = 1;
function buildData(count) {
    let data = new Array(count);
    for (let i = 0; i < count; i++) {
        const [color, setColor] = createSignal(pick(colours));
        data[i] = {
            id: idCounter++,
            color, setColor
        }
    }
    return data;
}


const Memory = () => {
  const [data, setData] = createSignal([]),
    // [selected, setSelected] = createSignal(null),
    createMany = (amount = 20000) => {
        return new Promise((resolve) => {
            const createPerf = performance.now();
            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - createPerf});
            });
            setData(buildData(amount))
        });
    },
    clear = () => { 
        return new Promise((resolve) => {
            let clearPerf = performance.now();
            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - clearPerf });
            });
            setData([]);
        });
    },
    start = async () => {
        const results = {};
        
        await clear();
        const memoryRes = await createMany(20000);
        results.create = memoryRes.time.toFixed(2);

        Object.keys(results).forEach(key => {
            console.log(`${key}: ${results[key]}ms`);
        });

        console.log('Memory!', results);
    }

    console.log('starting memory test');
    start();

    return (<View>
        <For each={ data() }>{ (row, index) => {
            const x = index() % 216 * 4
            const y = ~~( index() / 216 ) * 4
            return <View x={x} y={y} width={4} height={4} color={row.color()}></View>
        }}
        </For>
    </View>
  );
};

export default Memory;