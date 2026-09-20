import renderer from 'ftl';
import browser from 'ftl/platform/browser';
import webgl from 'ftl/renderer/webgl';
import bitmapTextEngine from 'ftl/text/bitmap';
import { DefaultRectShader, DefaultTextureShader, BitmapTextShader } from 'ftl/shaders';
import { createShader } from 'ftl/shaders/create';

import { adjectives, nouns } from '../../shared/data.js';
import { warmup } from '../../shared/utils/warmup.js';
import { run } from '../../shared/utils/run.js';

const shaders = {
  rectangleShader: createShader(DefaultRectShader),
  textureShader: createShader(DefaultTextureShader),
  bmfTextShader: createShader(BitmapTextShader),
  additionalShaders: [],
}

const canvas = document.querySelector('canvas')
const { root, createElement, createText, signals, loadFont } = renderer({
  platform: browser,
  renderer: webgl(canvas, shaders),
  text: {
    bitmap: bitmapTextEngine,
    defaultTextEngine: 'bitmap'
  },
  config: {
    width: canvas.width,
    height: canvas.height,
    uploadBudgetMs: 1000,
    maxTextureSize: 4096,
    numImageWorkers: 0,
  }
});

const fontLoadedPromise = loadFont('bitmap', {
  family: 'ArialBMF',
  json: './fonts/arial.json',
  image: './fonts/arial.png'
}).catch(error => {
  console.error('[BMF] loadFont failed:', String(error));
});

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

// Rows are laid out on a 27-column grid with a 40px step, but each row is 200px
// wide and its label overflows well past its own column. So a row overlaps the
// next four columns *in the same visual line* and relies on those columns being
// painted over it. Rows in different lines are 40px apart with h:40 and never
// overlap.
//
// Giving every row a unique zIndex (the old `_zIndex++ % 1000`) expresses that
// with 1000 z-buckets, which is the worst case for FTL's renderer: renderZList
// activates the rect shader and then the text shader for *every* bucket, and
// every shader switch flushes the active shader. That is ~2000 shader
// activations and ~1000 single-quad draw calls per frame.
//
// Bucketing by *column* instead expresses exactly the same paint order with 27
// buckets: column c+1 still paints over column c, and within a bucket the
// renderer always prepares COLOR before TEXT so a label still sits above its own
// rect. The 26 -> 0 wrap is harmless because column 26 is the last in a line and
// column 0 of the next line is 40px below it. Result: ~37 rects batched into a
// single draw call per bucket, 54 shader activations per frame instead of 2000,
// with pixel-identical output.
const COLUMNS = 27;

const createRow = (parent, index) => {
  const x = index % COLUMNS * 40;
  const y = Math.floor(index / COLUMNS) * 40;
  const color = pick(colours);
  const textColor = pick(colours);

  const zIndex = index % COLUMNS;

  const holder = createElement({ x, y, w: 200, h: 40, color: color, zIndex });
  const label = createElement({
    x: 5, y: 2, w: 200, h: 40,
    text: createText({
      type: 'bitmap',
      fontFamily: 'ArialBMF',
      alpha: 0.8,
      fontSize: 26,
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
  // 4x4 rects on a 4px grid: nothing overlaps and there is no text, so the
  // whole scene belongs in one bucket and one batched draw call.
  const node = createElement({ x, y, w: 4, h: 4, color, zIndex: 0 });
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

  const aLabel = a.children[0];
  const bLabel = b.children[0];

  // Snapshot a's values *before* overwriting them — reading a.x after assigning
  // b's values to a yields b's values back and is not a swap at all.
  const tempX = a.x;
  const tempY = a.y;
  const tempColor = a.color;
  // textColor lives inside the text object, so swapping the object swaps the
  // colour with it (the reference benchmark swaps text + colour separately).
  const tempText = aLabel.text;

  // Swap in place. The labels are children of the holders and travel with them,
  // so re-parenting them would churn the z-buckets for no visual gain. zIndex
  // is a column identity here and deliberately stays put: swapping two rows'
  // contents must not reorder the buckets.
  //
  // This makes the swap a pure property update, which is exactly what the rect
  // shader's surgical upload path is built for: 2 bufferSubData calls instead
  // of re-uploading all 1000 quads.
  Object.assign(a, { x: b.x, y: b.y, color: b.color });
  aLabel.text = bLabel.text; // the text setter dirties the element itself
  a.dirty();

  Object.assign(b, { x: tempX, y: tempY, color: tempColor });
  bLabel.text = tempText;
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

fontLoadedPromise.then(() => {
  if (hash === 'memory') {
    createMemoryBenchmark();
  } else {
    runBenchmark();
  }
}).catch(error => {
  console.error('[BMF] Benchmark failed to start:', error);
});
