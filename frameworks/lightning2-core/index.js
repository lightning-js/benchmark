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
        w: 1920,
        h: 1080,
        clearColor: 0x00000000,
        canvas2d: false,
        useImageWorker: true,
        // bufferSize: 4e6, // WvB tried to raise this to 4M but it didn't work for the 20k items test
    },
    debug: false,
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

    _createRow(items, index) {
        const data = {
            color: pick(colours),
            textColor: pick(colours),
            text: `${pick(adjectives)} ${pick(nouns)}`,
        }

        const x = index % 27 * 40
        const y  = ~~( index / 27 ) * 40

        items.childList.add({
            data,
            x, y,
            rect: true, w: 200, h: 40, color: data.color || 0x00000000,
            Label: {
                x: 5, y: 2,
                text: { text: data.text, fontSize: 26, fontFace: 'sans-serif', textColor: data.textColor || 0xFFFFFFFF, wordWrap: false }
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
                const items = this.tag('Items');
                for (let i = 0; i < amount; i++) {
                    this._createRow(items, i);
                }

                this.stage.once('frameEnd', () => {
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
                const items = this.tag('Items');
                for (let i = 0; i < amount; i++) {
                    const color = pick(colours);
                    const index = i;
                    const x = index % 216 * 4;
                    const y  = ~~( index / 216 ) * 4;

                    items.childList.add({
                        x, y,
                        rect: true, w: 4, h: 4, color: color || 0xFF000000,
                    });
                }

                this.stage.once('frameEnd', () => {
                    const time = performance.now() - createPerf;
                    resolve({ time });
                });
            });
        });
    }

    updateMany(count, skip = 0) {
        return new Promise( resolve => {
            const updatePerf = performance.now();
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
                    // Note: this is oddly slower than `patch`
                    // child.color = pick(colours);
                    // const label = child.childList.getAt(0);
                    // label.text.text = `${pick(adjectives)} ${pick(nouns)}`;
                    // label.text.textColor = pick(colours);
                }
            }

            this.stage.once('frameEnd', () => {
                const time = performance.now() - updatePerf;
                resolve({ time });
            });
        });
    }

    selectRandomNode() {
        return new Promise( resolve => {
            const selectPerf = performance.now();
            const items = this.tag('Items');
            const index = Math.floor(Math.random() * items.childList.length);
            const child = items.childList.getAt(index);

            if (child) {
                child.patch({
                    x: 100,
                    y: 100,
                    color: 0xFFFF0000, //RED
                    w: 1200,
                    h: 400,
                    Label: {
                        x: 10, y: 10, 
                        text: { fontSize: 128, textColor: 0xFF000000 } 
                    },
                });
            }

            this.stage.once('frameEnd', () => {
                const time = performance.now() - selectPerf;
                resolve({ time });
            });

        });
    }

    swapRows() {
        return new Promise( resolve => {
            return this.createMany().then( () => {
                const swapPerf = performance.now();
                this.stage.once('frameEnd', () => {
                    const time = performance.now() - swapPerf;
                    resolve({ time });
                });

                const items = this.tag('Items');
                const a = items.childList.getAt(998);
                const b = items.childList.getAt(1);
            
                const { x, y, data } = a;

                a.patch({
                    data: b.data,
                    x: b.x,
                    y: b.y,
                    color: b.data.color,
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
            const removePerf = performance.now();
            const items = this.tag('Items');
            const index = Math.floor(Math.random() * items.childList.length);
            items.childList.removeAt(index);

            this.stage.once('frameEnd', () => {
                const time = performance.now() - removePerf;
                resolve({ time });
            });
        });
    }

    appendMany(amount = 1000) {
        return new Promise( resolve => {
            const appendPerf = performance.now();
            const items = this.tag('Items');
            for (let i = 0; i < amount; i++) {
                this._createRow(items, i);
            }

            this.stage.once('frameEnd', () => {
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
