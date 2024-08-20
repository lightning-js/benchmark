import { Component } from 'react';

import { colours, adjectives, nouns } from '../../../../shared/data';
import { warmup } from "../../../../shared/utils/warmup";

import { pick } from "../../../../shared/utils/pick";
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

        setTimeout(() => {
            this.runBenchmark();
        }, 1000);
    }

    createMany = (amount = 1000) => {
        return this.clear().then(() => {
            return new Promise((resolve) => {
                const createPerf = performance.now();
                getRenderer().once('idle', () => {
                    resolve({ time: performance.now() - createPerf});
                });

                // setData(buildData(amount))
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
            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - clearPerf });
            });
            
            this.setState({ data : [] });
      });
  }
  
  appendMany = (amount = 1000) => {
      return new Promise((resolve) => {
          const appendPerf = performance.now();
          getRenderer().once('idle', () => {
              resolve({ time: performance.now() - appendPerf });
          });

          this.setState({ data: [...this.state.data, ...buildData(amount)] });
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

            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - updatePerf });
            });

            this.setState({ data });
      });
  }
  
  swapRows = () => {
      return new Promise((resolve) => {
            const swapPerf = performance.now();
            
            const data = this.state.data;
            const a = data[998];
            const b = data[1];

            const temp = a;
            a.y = b.y;
            a.x = b.x;
            a.color = b.color;
            a.textColor = b.textColor;
            a.text = b.text;

            b.y = temp.y;
            b.x = temp.x;
            b.color = temp.color;
            b.textColor = temp.textColor;
            b.text = temp.text;

            data[998] = b;
            data[1] = a;

            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - swapPerf });
            });

            this.setState({ data });
      });
  }

    selectRandom = () => {
        return new Promise((resolve) => {
            const selectPerf = performance.now();
            getRenderer().once('idle', () => {
                resolve({ time: performance.now() - selectPerf });
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
          getRenderer().once('idle', () => {
              resolve({ time: performance.now() - removePerf });
          });

          this.state.data.pop();
          this.setState({ data: this.state.data });
      });
  }

    runBenchmark = async () => {
        console.log('running benchmark');

        const { createMany, clear, updateMany, appendMany, swapRows, selectRandom, removeRow } = this;

        const results = {};

        await warmup(createMany, 1000, 5)
        const createRes = await createMany(1000)
        results.create = createRes.time.toFixed(2);

        await createMany(1000);
        await warmup(updateMany, 1000, 5);
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

        // await createMany(1000);
        // FIXME cant run warmups - it gets stuck
        // await warmup(swapRows, undefined, 5);
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