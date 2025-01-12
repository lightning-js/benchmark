import { Component } from 'react';

import { colours, adjectives, nouns } from '../../../../shared/data.js';
import { warmup } from "../../../../shared/utils/warmup.js";
import { waitUntilIdle } from '../../../../shared/utils/waitUntilIdle.js';
import { run } from '../../../../shared/utils/run.js';

import { pick } from "../../../../shared/utils/pick.js";
import { getRenderer } from "../utils/renderer.js";

import { Column, Row } from '@plexinc/react-lightning-components';

function buildData(amount) {
    const items = []
    let count = 0
    while (count < amount) {
      const row = []
      for (let i = 0; i < 27 && count < amount; i++) {
        row.push({
            label: `${pick(adjectives)} ${pick(nouns)}`,
            color: pick(colours),
            textColor: pick(colours),
            width: 40,
            height: 40,
            fontSize: 26
        })
        count++
      }

      items.push(row)
    }

    return items;
}

export class Flex extends Component {
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

    runBenchmark = async () => {
        console.log('running benchmark');

        const { createMany } = this;

        const results = {};

        await warmup(createMany, 1000, 5);
        const { average: createAvg, spread: createSpread } = await run(createMany, 1000, 5);
        results.create = `${createAvg.toFixed(2)}ms ±${createSpread.toFixed(2)}`;

        Object.keys(results).forEach(key => {
            console.log(`${key}: ${results[key]}ms`);
        });

        console.log('Done!', results);
    }

    

    render() {
        return (
            <lng-view>
                {this.state.data.map((row, index) => {
                    return (<Column key={index} style={{width: 40}}>
                        <Row style={{height: 40}}>
                            {row.map((item, index) => {
                                return (
                                <lng-view 
                                    key={index}
                                    width={item.width} 
                                    height={item.height} 
                                    color={item.color}>
                                    
                                    <lng-text
                                        x={5}
                                        y={2}
                                        alpha={0.8}
                                        fontFamily={"Ubuntu"}
                                        color={item.textColor}
                                        fontSize={item.fontSize}
                                    >
                                        {item.label}
                                    </lng-text>
                                </lng-view>)
                            })}
                        </Row>
                    </Column>)
                })}
            </lng-view>
        );
    }
};

export default Flex;