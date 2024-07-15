/**
 * Main entry point for the application.
 */

// import styling from './utils/styling';
import Lightning from '@lightningjs/core';

import { adjectives, nouns } from '../../shared/data';
import { warmup } from '../../shared/utils/warmup';

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
        w: 1080,
        h: 1920,
        clearColor: 0xFF000000,
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
                x: 5, y: 2, w: 200, h: 40, text: { text: '', fontSize: 26, fontFace: 'Ubuntu', textColor: 0xFFFFFFFF}
            }
        }
    }

    _firstActive() {
        const { color, textColor, text, index } = this.data;

        const x = index % 27 * 40
        const y  = ~~( index / 27 ) * 40

        this.patch({
            x: x,
            y: y,
            color: color || 0x00000000,
            Label: {
                text: { text: text, fontSize: 26, fontFace: 'Ubuntu', textColor: textColor || 0xFFFFFFFF}
            }
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

    _firstActive() {
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

    _createRow(index) {
        this.tag('Items').childList.add({
            type: Block, 
            data: {
                color: pick(colours),
                textColor: pick(colours),
                text: `${pick(adjectives)} ${pick(nouns)}`,
                index: index
            }
        });
    }

    _clear() {
        return new Promise( resolve => {
            const clearPerf = performance.now();
            this.tag('Items').childList.clear();

            this.stage.once('frameEnd', () => {
                const time = performance.now() - clearPerf;
                resolve({ time });
            });
        });
    }

    createMany(amount = 1000) {
        return new Promise( resolve => {
            this._clear().then(() => {
                const createPerf = performance.now();
                for (let i = 0; i < amount; i++) {
                    this._createRow(i);
                }

                this.stage.once('idle', () => {
                    const time = performance.now() - createPerf;
                    resolve({ time });
                });

            });
        })
    }

    createManyWithoutText(amount = 1000) {
        return new Promise( resolve => {
            this._clear().then(() => {
                const createPerf = performance.now();
                for (let i = 0; i < amount; i++) {
                    this.tag('Items').childList.add({
                        type: BlockNoText,
                        data: {
                            color: pick(colours),
                            index: i
                        }
                    });
                }

                this.stage.once('idle', () => {
                    const time = performance.now() - createPerf;
                    resolve({ time });
                });
            });
        });
    }

    updateMany(count, skip = 0) {
        return new Promise( resolve => {
            const updatePerf = performance.now();
            for (let i = 0; i < count; i += (skip + 1)) {
                const child = this.tag('Items').childList.getAt(i);
                if (child) {
                    child.patch({
                        color: pick(colours),
                        Label: {
                            text: { text: `${pick(adjectives)} ${pick(nouns)}`, textColor: pick(colours) },
                        }
                    });
                }
            }

            this.stage.once('idle', () => {
                const time = performance.now() - updatePerf;
                resolve({ time });
            });
        });
    }

    selectRandomNode() {
        return new Promise( resolve => {
            const selectPerf = performance.now();
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
                    text: { text: text, fontSize: 40, textColor: 0xFF000000 }
                });
            }

            this.stage.once('idle', () => {
                const time = performance.now() - selectPerf;
                resolve({ time });
            });

        });
    }

    swapRows() {
        return new Promise( resolve => {
            return this.createMany().then( () => {
                const swapPerf = performance.now();
                this.stage.once('idle', () => {
                    const time = performance.now() - swapPerf;
                    resolve({ time });
                });

                const a = this.tag('Items').childList.getAt(998);
                const b = this.tag('Items').childList.getAt(1);
            
                const temp = a;
                a.patch({
                    x: b.x,
                    y: b.y,
                    color: b.color,
                    Label: {
                        text: { text: b.data.text, textColor: b.data.textColor }
                    }
                });

                b.patch({
                    x: temp.x,
                    y: temp.y,
                    color: temp.color,
                    Label: {
                        text: { text: temp.data.text, textColor: temp.data.textColor }
                    }
                });
            });
        });
    }

    removeRow() {
        return new Promise( resolve => {
            const removePerf = performance.now();
            const index = Math.floor(Math.random() * this.tag('Items').childList.length);
            this.tag('Items').childList.removeAt(index);

            this.stage.once('idle', () => {
                const time = performance.now() - removePerf;
                resolve({ time });
            });
        });
    }

    appendMany(amount = 1000) {
        return new Promise( resolve => {
            const appendPerf = performance.now();
            for (let i = 0; i < amount; i++) {
                this._createRow(i);
            }

            this.stage.once('idle', () => {
                const time = performance.now() - appendPerf;
                resolve({ time });
            });
        });
    }

    async runBenchmark() {
        const results = {}

        console.log('Starting createMany benchmark');
        
        await warmup(this.createMany.bind(this), 1000, 5);
        const createRes = await this.createMany(1000);
        results.create = createRes.time.toFixed(2);

        console.log('Starting updateMany benchmark')

        await this.createMany(1000);
        await warmup(this.updateMany.bind(this), 1000, 5);
        await this.createMany(1000);
        const updateRes = await this.updateMany(1000);
        results.update = updateRes.time.toFixed(2);

        console.log('Starting updateMany with skip benchmark')

        await this.createMany(1000);
        await warmup(this.updateMany.bind(this), [1000, 10], 5);
        await this.createMany(1000);
        const skipNthRes = await this.updateMany(1000, 10);
        results.skipNth = skipNthRes.time.toFixed(2);

        console.log('Starting selectRandomNode benchmark');

        await this.createMany(1000);
        await warmup(this.selectRandomNode.bind(this), undefined, 5);
        await this.createMany(1000);
        const selectRes = await this.selectRandomNode();
        results.select = selectRes.time.toFixed(2);

        console.log('Starting swapRows benchmark');

        await warmup(this.swapRows.bind(this), undefined, 5);
        const swapRes = await this.swapRows();
        results.swap = swapRes.time.toFixed(2);

        console.log('Starting removeRow benchmark');

        await this.createMany(1000);
        await warmup(this.removeRow.bind(this), undefined, 5);
        await this.createMany(1000);
        const removeRes = await this.removeRow();
        results.remove = removeRes.time.toFixed(2);

        console.log('Starting createMany with 10k items benchmark');

        await warmup(this.createMany.bind(this), 10000, 5);
        const createResLots = await this.createMany(10000);
        results.createLots = createResLots.time.toFixed(2);

        console.log('Starting appendMany benchmark');

        await this._clear();
        // L2 goes out of array bounds if we append 5x1000 items
        // so we appeend 2x 1000 with a clear inbetween instead
        // this is only for the warmup phase so it's fine
        await warmup(this.appendMany.bind(this), 1000, 2);
        await this._clear();
        await warmup(this.createMany.bind(this), 1000, 2);
        await this.createMany(1000);
        const appendRes = await this.appendMany(1000);
        results.append = appendRes.time.toFixed(2);

        console.log('Starting clear benchmark');

        await warmup(this.createMany.bind(this), 1000, 5);
        const clearRes = await this._clear();
        results.clear = clearRes.time.toFixed(2);

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
