/**
 * Main entry point for the application.
 */

// import styling from './utils/styling';
import Lightning from '@lightningjs/core';

import { adjectives, nouns } from '../../shared/data';
import { warmup } from '../../shared/utils/warmup';

// apply CSS styling
// styling();

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
        w: 1280,
        h: 720,
        clearColor: 0xFF000000,
        canvas2d: false,
        useImageWorker: true,
        pauseRafLoopOnIdle: true,
    },
    debug: false,
}

class Block extends Lightning.Application {
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

export class App extends Lightning.Application {
    static _template() {
        return {
            Items: {}
        }
    }

    _init() {
        this._items = [];

        setTimeout(() => {
            this.createMany();
        }, 1000);
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
        this.tag('items').childList.clear();
    }

    createMany(amount = 1000) {
        for (let i = 0; i < amount; i++) {
            this._createRow(i);
        }
    }
}

const app = new App(options);
document.body.appendChild(app.stage.getCanvas());
