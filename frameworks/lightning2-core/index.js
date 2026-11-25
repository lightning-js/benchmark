/**
 * Main entry point for the application.
 */

// import styling from './utils/styling';
import Lightning from '@lightningjs/core';

import { adjectives, nouns } from '../../shared/data';
import { warmup } from '../../shared/utils/warmup';
import { reportStartup } from '../../shared/utils/startup.js';
import { run } from '../../shared/utils/run.js';
import { runRectangleBenchmark } from '../../shared/rectangleBenchmark.js';

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
        w: window.location.hash === '#rectangles' ? 1000 : 1920,
        h: window.location.hash === '#rectangles' ? 540 : 1080,
        clearColor: window.location.hash === '#rectangles' ? 0xFFFFFFFF : 0x00000000,
        canvas2d: false,
        useImageWorker: true,
        pauseRafLoopOnIdle: window.location.hash === '#rectangles' ? false : true,
        bufferMemory: window.location.hash === '#rectangles' ? 32e6 : 2e6,
    },
    debug: false,
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
        if (hash === 'rectangles') {
            this.runRectangleBenchmark();
        } else if (hash === 'memory') {
            console.log('Running memory benchmark');
            this.createMemoryBenchmark();
        } else if (hash === 'startup') {
            console.log('Running startup benchmark');
            this.runStartupBenchmark();
        } else {
            this.runBenchmark();
        }
    }

    async runRectangleBenchmark() {
        const items = this.tag('Items').childList;
        await runRectangleBenchmark({
            crossCheckRaf: true,
            subscribeFrame: (callback) => {
                this.stage.on('frameStart', callback);
                return () => this.stage.off('frameStart', callback);
            },
            drawScene: (scene) => {
                if (scene.count > 16000) {
                    throw new Error('Lightning 2 supports at most 16,000 rectangles; this slice is unsupported.');
                }
                items.clear();
                for (let i = 0; i < scene.count; i++) {
                    items.add({
                        type: Rectangle,
                        data: {
                            x: scene.x[i] - scene.size[i] / 2,
                            y: scene.y[i] - scene.size[i] / 2,
                            size: scene.size[i],
                        },
                    });
                }

                const rectangles = Array.from({ length: scene.count }, (_, i) => items.getAt(i));
                return (frameScene) => {
                    for (let i = 0; i < rectangles.length; i++) {
                        rectangles[i].patch({ x: frameScene.x[i] - frameScene.size[i] / 2 });
                    }
                };
            },
        });
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

    _clear(trigger = false) {
        return new Promise( resolve => {
            this.waitUntilIdle(performance.now()).then(time => {
                if (trigger) {
                    this.tag('Items').childList.clear();
                }

                resolve({ time });
            });

            this.tag('Items').childList.clear();

            const data = {
                color: pick(colours),
                textColor: pick(colours),
                text: `${pick(adjectives)} ${pick(nouns)}`,
            }

            if (trigger) {
                this.tag('Items').childList.add({
                    data,
                    rect: true, w: 200, h: 40, color: data.color || 0x00000000,
                    Label: {
                        x: 5, y: 2,
                        text: { text: 'Cleared', fontSize: 26, fontFace: 'sans-serif', textColor: data.textColor || 0xFFFFFFFF, wordWrap: false }
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

    updateMany(count, skip = 0) {
        return new Promise( resolve => {
            const items = this.tag('Items');
            this.waitUntilIdle(performance.now()).then(time => {
                resolve({ time });
            });

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
        });
    }

    selectRandomNode() {
        return new Promise( resolve => {
            this.waitUntilIdle(performance.now()).then(time => {
                resolve({ time });
            });

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
        });
    }

    swapRows() {
        return new Promise( resolve => {
            return this.createMany().then( () => {
                this.waitUntilIdle(performance.now()).then(time => {
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
            this.waitUntilIdle(performance.now()).then(time => {
                resolve({ time });
            });

            const items = this.tag('Items');
            const index = Math.floor(Math.random() * items.childList.length);
            items.childList.removeAt(index);
        });
    }

    appendMany(amount = 1000) {
        return new Promise( resolve => {
            this.createMany(1000).then(() =>{
                this.waitUntilIdle(performance.now()).then(time => {
                    resolve({ time });
                });

                const items = this.tag('Items');
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

    async runStartupBenchmark() {
        // Cold startup: navigation start -> first stage idle after rendering
        // 1,000 rows. Items is empty on fresh load; a startTime of 0 makes
        // waitUntilIdle resolve with `performance.now()`, i.e. time since
        // navigation start, so JS download/parse/execute and framework init
        // are included.
        const startupPromise = this.waitUntilIdle(0);

        const items = this.tag('Items');
        for (let i = 0; i < 1000; i++) {
            this._createRow(items, i);
        }

        const time = await startupPromise;
        reportStartup(time);
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

class Rectangle extends Lightning.Component {
    static _template() {
        return {
            rect: true,
            color: 0xFFFFFFFF,
            shader: {
                type: Lightning.shaders.Outline,
                width: 1,
                color: 0xFF000000,
            },
        };
    }

    _init() {
        const { x, y, size } = this.data;
        this.patch({ x, y, w: size, h: size });
    }
}

const app = new App(options);
document.body.appendChild(app.stage.getCanvas());
