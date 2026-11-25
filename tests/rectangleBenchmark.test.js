import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRectangleAdapter,
  createRectangleScene,
  advanceRectangleScene,
  summarizeFrameIntervals,
  RECTANGLE_COUNTS,
  tickFpsMeter,
} from '../shared/rectangleBenchmark.js';

test('default loads are 4k, 8k and 16k', () => {
  assert.deepEqual(RECTANGLE_COUNTS, [4000, 8000, 16000]);
});

test('FPSMeter smoothing matches the reference tick formula', () => {
  const meter = { frameTime: 20, lastTick: 100 };
  assert.equal(tickFpsMeter(meter, 140), 1000 / 22);
  assert.equal(meter.lastTick, 140);
  assert.equal(tickFpsMeter(meter, 160), 1000 / 21.8);
});

test('frame pacing exposes long gaps hidden by average FPS', () => {
  const pacing = summarizeFrameIntervals([16, 17, 16, 100, 16]);
  assert.equal(pacing.medianMs, 16);
  assert.equal(pacing.p95Ms, 100);
  assert.equal(pacing.maxMs, 100);
  assert.equal(pacing.over25Ms, 1);
  assert.equal(pacing.over50Ms, 1);
  assert.equal(summarizeFrameIntervals([]).p95Ms, null);
});

test('adapter scene dimensions match the 1000x540 drawing area', () => {
  const adapter = createRectangleAdapter({
    createRect: (props) => props,
    destroyRect: () => {},
    setX: () => {},
  });
  assert.equal(adapter.width, 1000);
  assert.equal(adapter.height, 540);
  const scene = createRectangleScene(32000, adapter.width, adapter.height);
  for (let i = 0; i < scene.count; i++) {
    assert.ok(scene.x[i] >= 0 && scene.x[i] <= adapter.width);
    assert.ok(scene.y[i] >= 0 && scene.y[i] <= adapter.height);
  }
});

test('adapter replaces the previous slice rather than accumulating rectangles', () => {
  const created = [];
  const destroyed = [];
  const adapter = createRectangleAdapter({
    createRect: (props) => {
      created.push(props);
      return props;
    },
    destroyRect: (rect) => destroyed.push(rect),
    setX: (rect, x) => { rect.x = x; },
  });
  adapter.drawScene(createRectangleScene(4000, adapter.width, adapter.height));
  const scene = createRectangleScene(8000, adapter.width, adapter.height);
  const drawFrame = adapter.drawScene(scene);
  assert.equal(created.length, 12000);
  assert.equal(destroyed.length, 4000);
  advanceRectangleScene(scene);
  drawFrame(scene);
  assert.equal(created[4000].x, scene.x[0]);
});
