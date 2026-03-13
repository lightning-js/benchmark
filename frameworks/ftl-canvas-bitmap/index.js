import renderer from 'ftl';
import browserPlatform from 'ftl/platform/browser';
import canvasRenderer from 'ftl/renderer/canvas';
import bitmapTextEngine from 'ftl/text/bitmap';

import { adjectives, nouns } from '../../shared/data.js';
import { warmup } from '../../shared/utils/warmup.js';
import { run } from '../../shared/utils/run.js';


const canvas = document.querySelector('canvas')
// const ctx = canvas.getContext('2d');

const { root, createElement, createText, signals, loadFont } = renderer({
  platform: browserPlatform,
  renderer: canvasRenderer(canvas, {
    sortChildrenByZ: false,
  }),
  text: {
    bitmap: bitmapTextEngine,
    defaultTextEngine: 'bitmap'
  },
  config: {
    width: canvas.width,
    height: canvas.height,
    uploadBudgetMs: 1000,
    maxTextureCount: 4096,
  }
});

const { fontData, atlasTexture } = await loadFont('bitmap', {
  family: 'ArialBMF',
  json: './fonts/arial.json',
  image: './fonts/arial.png'
})

const colours = [
  [1.0, 0.0, 0.0, 1.0], // red
  [1.0, 1.0, 0.0, 1.0], // yellow
  [0.0, 0.0, 1.0, 1.0], // blue
  [0.0, 1.0, 0.0, 1.0], // green
  [1.0, 0.0, 1.0, 1.0], // pink
  [0.647, 0.165, 0.165, 1.0], // brown (A52A2A)
  [0.502, 0.0, 0.502, 1.0], // purple (800080)
  [0.823, 0.412, 0.118, 1.0], // brown (D2691E)
  [1.0, 1.0, 1.0, 1.0], // white
  [0.0, 0.0, 0.0, 1.0], // black
  [1.0, 0.647, 0.0, 1.0], // orange (FFA500)
];


const waitUntilIdle = (startTime) => {
  return new Promise( (resolve, reject) => {
      let timeout = null;
      let lastTime;
      let clearSignal = null;
  
      const done = () => {
          clearTimeout(timeout);
          clearSignal();
          resolve(lastTime);
      }
  
      const rendererIdle = () => {
          lastTime = performance.now() - startTime;
          if (timeout) {
              clearTimeout(timeout);
          }
          setTimeout(done, 200);
      }
  
      clearSignal = signals.idle.subscribe(rendererIdle)
  })
}

// create holder root node
let rootNode 
const createRoot = () => {
  rootNode = createElement({ visible: false });
  root.addChild(rootNode);
}

createRoot();

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

let _zIndex = 0;
const createRow = (parent, index) => {
  const x = index % 27 * 40;
  const y = Math.floor(index / 27) * 40;
  const color = pick(colours);
  const textColor = pick(colours);

  const zIndex = _zIndex++ % 1000;

  const holder = createElement({ x, y, w: 200, h: 40, color: color, zIndex });
  const label = createElement({
    x: 5, y: 2, w: 200, h: 40,
    text: createText({
      type: 'bitmap',
      fontFamily: 'ArialBMF',
      alpha: 0.8,
      fontSize: 26,
      fontData,
      atlasTexture,
      text: `${pick(adjectives)} ${pick(nouns)}`,
      textColor: textColor,
    }),
    zIndex: zIndex,
  });

  holder.addChild(label);
  parent.addChild(holder);
  return holder;
};

const createRowWithoutText = (parent, index) => {
  const x = index % 216 * 4;
  const y = Math.floor(index / 216) * 4;
  const color = pick(colours);
  const node = createElement({ x, y, w: 4, h: 4, color });
  parent.addChild(node);
  return node;
};

const clear = () => new Promise((resolve) => {
  waitUntilIdle(performance.now()).then(time => {
    resolve({ time });
  });

  rootNode.destroy();
  createRoot();
});

const createMany = (amount = 1000) => new Promise((resolve) => {
  clear().then(() => {
    waitUntilIdle(performance.now()).then(time => {
      resolve({ time });
    });

    for (let i = 0; i < amount; i++) createRow(rootNode, i);
  });
});

const appendMany = (amount = 1000) => new Promise((resolve) => {
  createMany(1000).then(() => {
    waitUntilIdle(performance.now()).then(time => {
      resolve({ time });
    });

    for (let i = 0; i < amount; i++) createRow(rootNode, i + 1000);
  });
});

const updateMany = (count, skip = 0) => new Promise((resolve) => {
  waitUntilIdle(performance.now()).then(time => {
    resolve({ time });
  });

  for (let i = 0; i < rootNode.children.length; i += (skip + 1)) {
    const element = rootNode.children[i];
    if (!element || !element.children?.[0]) continue;
    element.color = pick(colours);
    const child = element.children[0];
    child.text = createText({
      type: 'bitmap',
      fontFamily: 'ArialBMF',
      alpha: 0.8,
      fontSize: 26,
      fontData,
      atlasTexture,
      text: `${pick(adjectives)} ${pick(nouns)}`,
      textColor: pick(colours),
    });

    // trigger a reflow
    child.dirty();
  }

});

const swapRows = () => new Promise((resolve) => {
  const a = rootNode.children[998];
  const b = rootNode.children[1];

  waitUntilIdle(performance.now()).then(time => {
    resolve({ time });
  });

  const aChild = a.children[0];
  const bChild = b.children[0];

  // swap the two elements
  Object.assign(a, { x: b.x, y: b.y, color: b.color, zIndex: b.zIndex });
  a.removeChild(aChild);
  a.addChild(bChild);
  a.dirty();

  Object.assign(b, { x: a.x, y: a.y, color: a.color, zIndex: a.zIndex });
  b.removeChild(bChild);
  b.addChild(aChild);
  b.dirty();

});

const selectRandomNode = () => new Promise((resolve) => {
  const node = rootNode.children[Math.floor(Math.random() * rootNode.children.length)];

  waitUntilIdle(performance.now()).then(time => {
    resolve({ time });
  });

  Object.assign(node, { x: 100, y: 100, w: 1200, h: 400, color: colours[0] });
  node.dirty();


  node.children[0].x = 10;
  node.children[0].y = 10;
  node.children[0].text = createText({
    type: 'bitmap',
    fontFamily: 'ArialBMF',
    fontSize: 128,
    fontData,
    atlasTexture,
    text: `${pick(adjectives)} ${pick(nouns)}`,
    textColor: colours[9],
  });

});

const removeRow = () => new Promise((resolve) => {
  waitUntilIdle(performance.now()).then(time => {
    resolve({ time });
  });

  const idx = Math.floor(Math.random() * rootNode.children.length);
  rootNode.children[idx].destroy();
});

const clearTest = () => {
  return new Promise( resolve => {
      createMany(1000).then( () => {
          clear().then( time => {
              resolve(time);
          });
      });
  });
}


const createManyWithoutText = (amount = 20000) => new Promise((resolve) => {
  clear().then(() => {
    waitUntilIdle(performance.now()).then(time => {
      resolve({ time });
    });
    
    for (let i = 0; i < amount; i++) createRowWithoutText(rootNode, i);
  });
});

const createMemoryBenchmark = async () => {
  const results = {};
  const { time } = await createManyWithoutText();
  results.create = time.toFixed(2);
  console.log('Memory!', results);
};

const runBenchmark = async () => {
  const results = {};

  await warmup(createMany, 1000, 5);
  results.create = await runAndLog(createMany, 1000, 5);

  await createMany(1000);
  await warmup(updateMany, 1000, 5);
  results.update = await runAndLog(updateMany, 1000, 5);

  await createMany(1000);
  await warmup(updateMany, [1000, 10], 5);
  await createMany(1000);
  results.skipNth = await runAndLog(updateMany, [1000, 10], 5);

  await createMany(1000);
  await warmup(selectRandomNode, undefined, 5);
  await createMany(1000);
  results.select = await runAndLog(selectRandomNode, undefined, 5);

  await createMany(1000);
  await warmup(swapRows, undefined, 5);
  await createMany(1000);
  results.swap = await runAndLog(swapRows, undefined, 5);

  await createMany(1000);
  await warmup(removeRow, undefined, 5);
  await createMany(1000);
  results.remove = await runAndLog(removeRow, undefined, 5);

  await warmup(appendMany, 1000, 5);
  results.append = await runAndLog(appendMany, 1000, 5);

  await warmup(clearTest, undefined, 5);
  results.clear = await runAndLog(clearTest, undefined, 5);

  await warmup(createMany, 10000, 5);
  results.createLots = await runAndLog(createMany, 10000, 5);

  Object.keys(results).forEach(key => {
    console.log(`${key}: ${results[key]}`);
  });

  console.log('Done!', results);
};

const runAndLog = async (fn, args, repeat) => {
  const { average, spread } = await run(fn, args, repeat);
  return `${average.toFixed(2)}ms ±${spread.toFixed(2)}`;
};

// Entry point
const hash = window.location.hash.substring(1);
if (hash === 'memory') {
  createMemoryBenchmark();
} else {
  runBenchmark();
}
