/**
 * Main entry point for the application.
 */

import Lightning from '@lightningjs/core';

import { adjectives, nouns } from '../../shared/data.js';
import { warmup } from '../../shared/utils/warmup.js';
import { run } from '../../shared/utils/run.js';

// apply CSS styling
const style = document.createElement('style');
document.head.appendChild(style);
if (style.sheet)
    style.sheet.insertRule('@media all { html {height: 100%; width: 100%;} *,body {margin:0; padding:0;} canvas { position: absolute; z-index: 2; } body { width: 100%; height: 100%;} }');

// L2 colors are AA RR GG BB
const colours = [
    0xFFFF0000, // red
    0xFFFFFF00, // yellow
    0xFF0000FF, // blue
    0xFF00FF00, // green
    0xFFFF00FF, // pink
    0xFFA52A2A, // brown
    0xFF800080, // purple
    0xFFD2691E, // brown
    0xFFFFFFFF, // white
    0xFF000000, // black
    0xFFFFA500, // orange
]

const pick = dict => dict[Math.round(Math.random() * 1000) % dict.length];

const options = {
    stage: {
        w: 1920,
        h: 1080,
        clearColor: 0x00000000,
        canvas2d: false,
        useImageWorker: true,
        pauseRafLoopOnIdle: true,
        // bufferSize: 4e6, // WvB tried to raise this to 4M but it didn't work for the 20k items test
    },
    debug: false,
}

class Block extends Lightning.Component {
    static _template() {
        return {
            x: 0, y: 0,
            rect: true, w: 200, h: 40, color: 0x00000000,
            Label: {
                x: 5, y: 2,
                text: { text: '', fontSize: 26, fontFace: 'sans-serif', textColor: 0xFFFFFFFF, wordWrap: false }
            }
        }
    }

    _init() {
        const { color, textColor, text, index } = this.data;

        const x = index % 27 * 40
        const y  = ~~( index / 27 ) * 40

        this.patch({
            x: x,
            y: y,
            color: color || 0x00000000,
            Label: { text: { text: text, textColor: textColor || 0xFFFFFFFF } },
        });
    }
}

class BlockNoText extends Lightning.Component {
    static _template() {
        return {
            x: 0, y: 0,
            rect: true, w: 4, h: 4, color: 0xFF000000,
        }
    }

    _init() {
        const { color, index } = this.data;

        const x = index % 216 * 4
        const y  = ~~( index / 216 ) * 4

        this.patch({
            x: x,
            y: y,
            color: color,
        });
    }
}

export class App extends Lightning.Application {
    static _template() {
        return {
            Items: {}
        }
    }

    waitUntilIdle(startTime) {
        return new Promise( (resolve, reject) => {
            let timeout = null;
            let lastTime;
        
            const done = () => {
                clearTimeout(timeout);
                this.stage.off('idle', rendererIdle);
                resolve(lastTime);
            }
        
            const rendererIdle = () => {
                lastTime = performance.now() - startTime;
                if (timeout) {
                    clearTimeout(timeout);
                }
                setTimeout(done, 200);
            }
        
            this.stage.on('idle', rendererIdle);
        })
    }

    _init() {
        // get hash of the url
        const hash = window.location.hash.substring(1);
        if (hash === 'memory') {
            console.log('Running memory benchmark');
            this.createMemoryBenchmark();
        } else {
            this.runBenchmark();
        }
    }

    _createRow(items, index) {
        items.childList.add({
            type: Block, 
            data: {
                color: pick(colours),
                textColor: pick(colours),
                text: `${pick(adjectives)} ${pick(nouns)}`,
                index: index
            }
        });
    }

    _clear(trigger = false) {
        return new Promise( resolve => {
            this.waitUntilIdle(performance.now()).then(time => {
                if (trigger) {
                    this.tag('Items').childList.clear();
                }

                resolve({ time });
            });

            this.tag('Items').childList.clear();

            if (trigger) {
                this.tag('Items').childList.add({
                    type: Block,
                    data: {
                        color: pick(colours),
                        textColor: pick(colours),
                        text: 'Cleared',
                        index: 0
                    }
                });
            }
        });
    }

    clearTest() {
        return new Promise( resolve => {
            this.createMany(1000, true).then( () => {
                this._clear(true).then( time => {
                    resolve(time);
                });
            });
        });
    }

    createMany(amount = 1000, trigger = false) {
        return new Promise( resolve => {
            this._clear(trigger).then(() => {
                this.waitUntilIdle(performance.now()).then(time => {
                    resolve({ time });
                });

                const items = this.tag('Items');
                for (let i = 0; i < amount; i++) {
                    this._createRow(items, i);
                }
            });
        })
    }

    createManyWithoutText(amount = 1000) {
        return new Promise( resolve => {
            this._clear().then(() => {
                this.waitUntilIdle(performance.now()).then(time => {
                    resolve({ time });
                });

                const items = this.tag('Items');
                for (let i = 0; i < amount; i++) {
                    items.childList.add({
                        type: BlockNoText,
                        data: {
                            color: pick(colours),
                            index: i
                        }
                    });
                }
            });
        });
    }

    updateMany(count, skip = 0) {
        return new Promise( resolve => {
            this.waitUntilIdle(performance.now()).then(time => {
                resolve({ time });
            });

            const items = this.tag('Items');
            for (let i = 0; i < count; i += (skip + 1)) {
                const child = items.childList.getAt(i);
                if (child) {
                    child.patch({
                        color: pick(colours),
                        Label: {
                            text: { text: `${pick(adjectives)} ${pick(nouns)}`, textColor: pick(colours) },
                        }
                    });
                }
            }
        });
    }

    selectRandomNode() {
        return new Promise( resolve => {
            this.waitUntilIdle(performance.now()).then(time => {
                resolve({ time });
            });

            const index = Math.floor(Math.random() * this.tag('Items').childList.length);
            const child = this.tag('Items').childList.getAt(index);
            const text = child.data.text;

            if (child) {
                child.patch({
                    x: 100,
                    y: 100,
                    color: 0xFFFF0000, //RED
                    w: 1200,
                    h: 400,
                });

                const label = child.tag('Label');
                label.patch({
                    x: 10,
                    y: 10,
                    text: { fontSize: 128, textColor: 0xFF000000 }
                });
            }
        });
    }

    swapRows() {
        return new Promise( resolve => {
            return this.createMany().then( () => {
                this.waitUntilIdle(performance.now()).then(time => {
                    resolve({ time });
                });

                const a = this.tag('Items').childList.getAt(998);
                const b = this.tag('Items').childList.getAt(1);
            
                const { x, y, data } = a;
                
                a.patch({
                    data: b.data,
                    x: b.x,
                    y: b.y,
                    color: b.color,
                    Label: {
                        text: { text: b.data.text, textColor: b.data.textColor }
                    }
                });

                b.patch({
                    data: data,
                    x: x,
                    y: y,
                    color: data.color,
                    Label: {
                        text: { text: data.text, textColor: data.textColor }
                    }
                });
            });
        });
    }

    removeRow() {
        return new Promise( resolve => {
            this.waitUntilIdle(performance.now()).then(time => {
                resolve({ time });
            });

            const index = Math.floor(Math.random() * this.tag('Items').childList.length);
            this.tag('Items').childList.removeAt(index);
        });
    }

    appendMany(amount = 1000) {
        return new Promise( resolve => {
            this.createMany(1000).then(() =>{
                this.waitUntilIdle(performance.now()).then(time => {
                    resolve({ time });
                });

                const items = this.tag('Items')
                for (let i = 0; i < amount; i++) {
                    this._createRow(items, i);
                }
            });
        });
    }

    async runBenchmark() {
        const results = {}

        await warmup(this.createMany.bind(this), 1000, 5);
        const { average: createAvg, spread: createSpread } = await run(this.createMany.bind(this), 1000, 5);
        results.create = `${createAvg.toFixed(2)}ms ±${createSpread.toFixed(2)}`;

        await this.createMany(1000);
        await warmup(this.updateMany.bind(this), 1000, 5);
        await this.createMany(1000);
        const { average: updateAvg, spread: updateSpread } = await run(this.updateMany.bind(this), 1000, 5);
        results.update = `${updateAvg.toFixed(2)}ms ±${updateSpread.toFixed(2)}`;

        await this.createMany(1000);
        await warmup(this.updateMany.bind(this), [1000, 10], 5);
        await this.createMany(1000);
        const { average: skipNthAvg, spread: skipNthSpread } = await run(this.updateMany.bind(this), [1000, 10], 5);
        results.skipNth = `${skipNthAvg.toFixed(2)}ms ±${skipNthSpread.toFixed(2)}`;

        await this.createMany(1000);
        await warmup(this.selectRandomNode.bind(this), undefined, 5);
        await this.createMany(1000);
        const { average: selectAvg, spread: selectSpread } = await run(this.selectRandomNode.bind(this), undefined, 5);
        results.select = `${selectAvg.toFixed(2)}ms ±${selectSpread.toFixed(2)}`;

        await warmup(this.swapRows.bind(this), undefined, 5);
        const { average: swapAvg, spread: swapSpread } = await run(this.swapRows.bind(this), undefined, 5);
        results.swap = `${swapAvg.toFixed(2)}ms ±${swapSpread.toFixed(2)}`;

        await this.createMany(1000);
        await warmup(this.removeRow.bind(this), undefined, 5);
        await this.createMany(1000);
        const { average: removeAvg, spread: removeSpread } = await run(this.removeRow.bind(this), undefined, 5);
        results.remove = `${removeAvg.toFixed(2)}ms ±${removeSpread.toFixed(2)}`;

        await warmup(this.createMany.bind(this), 10000, 5);
        const { average: createLotsAvg, spread: createLotsSpread } = await run(this.createMany.bind(this), 10000, 5);
        results.createLots = `${createLotsAvg.toFixed(2)}ms ±${createLotsSpread.toFixed(2)}`;

        await warmup(this.appendMany.bind(this), 1000, 5);
        const { average: appendAvg, spread: appendSpread } = await run(this.appendMany.bind(this), 10000, 5);
        results.append = `${appendAvg.toFixed(2)}ms ±${appendSpread.toFixed(2)}`;

        await warmup(this.clearTest.bind(this), 1000, 5);
        const { average: clearAvg, spread: clearSpread } = await run(this.clearTest.bind(this), 10000, 5);
        results.clear = `${clearAvg.toFixed(2)}ms ±${clearSpread.toFixed(2)}`;

        Object.keys(results).forEach(key => {
            console.log(`${key}: ${results[key]}ms`);
        });
    
        console.log('Done!', results);
    }

    async createMemoryBenchmark() {
        const results = {};

        // This isn't supported on L2, as L2 can't handle 20k items
        // so we're skipping this part of the benchmarm

        // const createRes = await this.createManyWithoutText(7000);
        // results.create = createRes.time.toFixed(2);

        // Object.keys(results).forEach(key => {
        //     console.log(`${key}: ${results[key]}ms`);
        // });

        console.log('Memory!', undefined);
    }
}

const app = new App(options);
document.body.appendChild(app.stage.getCanvas());
