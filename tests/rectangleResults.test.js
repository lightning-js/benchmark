import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import { processResults } from '../testrunner/processResults.js';
import { renderRectangleSection } from '../testrunner/rectangleResults.js';
import { writeResults } from '../testrunner/writeResults.js';

test('full result processing keeps rectangle slices without changing the weighted score', () => {
  const operations = { a: { create: '10ms' }, b: { create: '20ms' } };
  const rectangles = {
    a: { 8000: { fps: 50, samples: [50] }, 16000: { fps: 0, error: 'crash' } },
    b: { 8000: { fps: 60, samples: [60] } },
  };
  const baseline = processResults(operations, {}, {}, {});
  const combined = processResults(operations, {}, {}, {}, rectangles);
  assert.deepEqual(Object.keys(combined), Object.keys(baseline));
  for (const framework of Object.keys(operations)) {
    assert.equal(combined[framework].avgMean, baseline[framework].avgMean);
    assert.deepEqual(combined[framework].rectangles, rectangles[framework]);
  }
});

test('overview renders FPS, pacing diagnostics, escaped failures, and missing slices', () => {
  const html = renderRectangleSection({
    a: { rectangles: {
      8000: { fps: 42.125, measurements: [{ framePacing: { p95Ms: 50 } }] },
      64000: { fps: 0, error: '<script>crash</script>' },
    } },
    b: {},
  }, ['a', 'b'], { a: '1.0' });
  assert.match(html, /42\.13 FPS/);
  assert.match(html, /8,000 moving rectangles/);
  assert.match(html, /64,000 moving rectangles/);
  assert.match(html, /FAIL \(0 FPS\)/);
  assert.match(html, /p95Ms/);
  assert.match(html, /&lt;script&gt;crash&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /<td>n\/a<\/td>/);
});

test('reports without rectangle data retain their original result shape', () => {
  const result = processResults({ a: { create: '10ms' } }, {}, {}, {});
  assert.equal(Object.hasOwn(result.a, 'rectangles'), false);
});

test('full HTML overview includes rectangles beside the existing benchmark sections', async () => {
  const browser = `rectangle-report-test-${process.pid}-${Date.now()}`;
  const results = processResults(
    { a: { create: '10ms' } },
    { a: { heap: 4, create: 5 } },
    { a: 2048 },
    { a: { startup: '120ms', min: 120, runs: [120] } },
    { a: { 8000: { fps: 45, samples: [45] }, 64000: { fps: 0, error: 'page crashed' } } },
  );
  const filename = await writeResults(results, { a: '1.0' }, browser);
  try {
    const html = await fs.readFile(`./results/${filename}`, 'utf8');
    for (const text of ['create rows', 'create 20k nodes', 'cold startup', 'bundle size', '45.00 FPS', 'FAIL (0 FPS)', 'page crashed', '6x CPU slowdown']) {
      assert.ok(html.includes(text), text);
    }
    assert.doesNotMatch(html, /\{\{\w+\}\}/);
  } finally {
    await fs.unlink(`./results/${filename}`);
  }
});
