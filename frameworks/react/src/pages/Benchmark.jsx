import { Component } from 'react';

import { colours, adjectives, nouns } from '../../../../shared/data.js';
import { warmup } from "../../../../shared/utils/warmup.js";
import { waitUntilIdle } from '../../../../shared/utils/waitUntilIdle.js';
import { run } from '../../../../shared/utils/run.js';

import { pick } from "../../../../shared/utils/pick.js";
import { getRenderer } from "../utils/renderer";

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

export class Benchmark extends Component {
    constructor() {
        super();

        this.state = {
            data: []
        }

        this.renderer = getRenderer();

        setTimeout(() => {
            this.runBenchmark();
        }, 1000);
    }

    createMany = (amount = 1000) => {
        return this.clear().then(() => {
            return new Promise((resolve) => {
                const createPerf = performance.now();

                waitUntilIdle(this.renderer, createPerf).then( (time) => {
                    resolve({ time });
                });

                this.setState({ data: buildData(amount) });
            });
        });
  }

    clear = () => { 
        return new Promise((resolve) => {
            const data = this.state.data;
            if (data.length === 0) {
                resolve({ time: 0 });
                return;
            }

            const clearPerf = performance.now();
            waitUntilIdle(this.renderer, clearPerf).then( (time) => {
                resolve({ time });
            });
            
            this.setState({ data : [] });
        });
    }

    clearTest = () => {
        return new Promise( resolve => {  
            waitUntilIdle(this.renderer, performance.now()).then( time => {
                this.clear().then( time => {
                    resolve(time);
                });
            });
   
            this.setState({ data: buildData(1000) });
        });
    }
  
    appendMany = (amount = 1000) => {
      return new Promise((resolve) => {
            this.createMany(1000).then( () => {
                const appendPerf = performance.now();
                waitUntilIdle(this.renderer, appendPerf).then( (time) => {
                    resolve({ time });
                });

                this.setState({ data: this.state.data.concat(buildData(amount)) });
            });
        });
    }

    updateMany = (count = 1000, skip = 0) => {
        return new Promise((resolve) => {
            const updatePerf = performance.now();

            const data = this.state.data;
            for(let i = 0, len = data.length; i < len; i += (skip + 1)) {
                const node = data[i];
                node.label = `${pick(adjectives)} ${pick(nouns)}`;
                node.color = pick(colours);
                node.textColor = pick(colours);
            }

            waitUntilIdle(this.renderer, updatePerf).then( (time) => {
                resolve({ time });
            });

            this.setState({ data });
        });
    }
  
    swapRows = () => {
        return new Promise((resolve) => {
            const swapPerf = performance.now();
            waitUntilIdle(this.renderer, swapPerf).then( (time) => {
                resolve({ time });
            });
            
            const newdata = [...this.state.data];
            const d1 = newdata[1];
            const d998 = newdata[998];

            newdata[1] = d998;
            newdata[998] = d1;

            this.setState({ data: newdata });
        });
    }

    selectRandom = () => {
        return new Promise((resolve) => {
            const selectPerf = performance.now();
            waitUntilIdle(this.renderer, selectPerf).then( (time) => {
                resolve({ time });
            });

            const selected = this.state.data[Math.floor(Math.random() * this.state.data.length)];
            selected.x = 100;
            selected.y = 100;
            selected.color = 0xFF0000FF // red;
            selected.width = 1200;
            selected.height = 400;
            selected.fontSize = 100;

            this.setState({ data: this.state.data });
        });
    }

    removeRow = () => {
        return new Promise((resolve) => {
            const removePerf = performance.now();
            waitUntilIdle(this.renderer, removePerf).then( (time) => {
                resolve({ time });
            });

            this.state.data.pop();
            this.setState({ data: this.state.data });
        });
    }

    runBenchmark = async () => {
        console.log('running benchmark');

        const { createMany, clear, updateMany, appendMany, swapRows, selectRandom, removeRow, clearTest } = this;

        const results = {};

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
        await warmup(selectRandom, undefined, 5);
        await createMany(1000);
        const { average: selectAvg, spread: selectSpread } = await run(selectRandom, undefined, 5);
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
            console.log(`${key}: ${results[key]}ms`);
        });

        console.log('Done!', results);
    }

    

    render() {
        return (
        <lng-view>
        {this.state.data.map((row, index) => (
            <lng-view 
            key={index}
            x={row.x} 
            y={row.y} 
            width={row.width} 
            height={row.height} 
            color={row.color}>
            
            <lng-text
                x={5}
                y={2}
                width={row.width}
                height={row.height}
                alpha={0.8}
                fontFamily={"Ubuntu"}
                color={row.textColor}
                fontSize={row.fontSize}
            >
                {row.label}
            </lng-text>
            </lng-view>
        ))}
        </lng-view>
        );
    }
};

export default Benchmark;