import { Component } from 'react';

import { colours, adjectives, nouns } from '../../../../shared/data';
import { warmup } from "../../../../shared/utils/warmup";

import { pick } from "../../../../shared/utils/pick";
import { getRenderer } from "../utils/renderer";

function buildData(count) {
    let data = new Array(count);
    for (let i = 0; i < count; i++) {
        data[i] = {
            color: pick(colours),
            x: i % 216 * 4,
            y: ~~( i / 216 ) * 4
        }
    }

    return data;
}

export class Memory extends Component {
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


    runBenchmark = async () => {
        console.log('running memory benchmark');

        const { createMany } = this;

        const results = {};
        const createRes = await createMany(20000)
        results.create = createRes.time.toFixed(2);

        Object.keys(results).forEach(key => {
            console.log(`${key}: ${results[key]}ms`);
        });

        console.log('Memory!', results);
    }

    

    render() {
        return (
        <lng-view>
        {this.state.data.map((row, index) => (
            <lng-view 
                key={index}
                x={row.x} 
                y={row.y} 
                width={4} 
                height={4} 
                color={row.color}>
            </lng-view>
        ))}
        </lng-view>
        );
    }
};

export default Memory;