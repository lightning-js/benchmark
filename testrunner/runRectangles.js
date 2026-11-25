import fs from 'fs';
import { chromium } from 'playwright';
import { RECTANGLE_COUNTS } from '../shared/rectangleBenchmark.js';

const DEFAULT_SLICE_TIMEOUT_MS = 10 * 60 * 1000;

/** Run each rectangle-count slice in an isolated browser process. */
export const runRectangleBenchmarks = async (frameworks, browserVersion) => {
  const counts = process.env.RECTANGLE_COUNTS
    ? process.env.RECTANGLE_COUNTS.split(',').map((count) => Number.parseInt(count, 10)).filter(Number.isFinite)
    : RECTANGLE_COUNTS;
  const cpuThrottlingRate = 6;
  const warmupMs = Number.parseInt(process.env.RECTANGLE_WARMUP_MS || '1000', 10);
  const sampleMs = Number.parseInt(process.env.RECTANGLE_SAMPLE_MS || '1500', 10);
  const samples = Number.parseInt(process.env.RECTANGLE_SAMPLES || '3', 10);
  const timeoutMs = Number.parseInt(process.env.RECTANGLE_TIMEOUT_MS || `${DEFAULT_SLICE_TIMEOUT_MS}`, 10);
  const requestedFrameworks = process.env.RECTANGLE_FRAMEWORKS?.split(',').map((name) => name.trim()).filter(Boolean);
  const baseUrl = process.env.RECTANGLE_BASE_URL || 'http://localhost:8080';
  if (requestedFrameworks?.length) {
    frameworks = frameworks.filter((framework) => requestedFrameworks.includes(framework));
  }

  const startedAt = new Date();
  const filename = `rectangles_${startedAt.toISOString().replace(/[:.]/g, '-')}.json`;
  const results = {};
  fs.mkdirSync('./results', { recursive: true });
  const writePartialResults = () => {
    fs.writeFileSync(`./results/${filename}`, JSON.stringify({
      date: startedAt.toISOString(),
      browser: browserVersion,
      viewport: '1280x720 @ 1x; rectangle area 1000x540',
      counts,
      warmupMs,
      sampleMs,
      samplesPerCount: samples,
      timeoutMs,
      cpuThrottlingRate,
      measurement: 'renderer-callback FPS, not GPU completion or presentation',
      fpsMeterSmoothing: 10,
      results,
    }, null, 2));
  };

  const runSlice = async (framework, count) => {
    let browser;
    let context;
    let timeout;

    try {
      // Isolating every count means a renderer crash at 16k cannot discard 4k/8k,
      // and the next count gets a clean process and graphics context.
      browser = await chromium.launch({ headless: process.env.HEADLESS === 'true' });
      context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const client = await context.newCDPSession(page);
      await client.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottlingRate });
      await page.addInitScript((config) => {
        window.__RECTANGLE_BENCHMARK_CONFIG__ = config;
      }, { counts: [count], warmupMs, sampleMs, samples });

      const result = await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (callback, value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          callback(value);
        };
        timeout = setTimeout(() => finish(
          reject,
          new Error(`${framework} ${count} rectangle slice timed out after ${timeoutMs}ms`),
        ), timeoutMs);

        page.on('console', async (message) => {
          if (!message.text().startsWith('Rectangles!')) return;
          try {
            const results = await message.args()[1].jsonValue();
            finish(resolve, results[count]);
          } catch (error) {
            finish(reject, error);
          }
        });
        page.on('pageerror', (error) => finish(reject, error));
        page.on('crash', () => finish(reject, new Error(`${framework} page crashed at ${count} rectangles`)));
        browser.on('disconnected', () => finish(reject, new Error(`${framework} browser process disconnected at ${count} rectangles`)));

        const url = framework === 'blits'
          ? `${baseUrl}/${framework}/#/rectangles`
          : `${baseUrl}/${framework}/#rectangles`;
        page.goto(url).catch((error) => finish(reject, error));
      });

      if (!result) throw new Error(`${framework} did not return a result for ${count} rectangles`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Rectangle slice failed for ${framework} at ${count}: ${message}`);
      return { fps: 0, samples: [], error: message };
    } finally {
      clearTimeout(timeout);
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
    }
  };

  writePartialResults();
  for (const framework of frameworks) {
    results[framework] = {};
    for (const count of counts) {
      console.log(`Running rectangle benchmark for ${framework} at ${count.toLocaleString()} rectangles`);
      results[framework][count] = await runSlice(framework, count);
      const slice = results[framework][count];
      console.log(`${framework} ${count.toLocaleString()}: ${slice.error || `${slice.fps.toFixed(2)} FPS`}`);
      if (slice.rafFps !== undefined) {
        console.log(`  RAF cross-check: ${slice.rafFps.toFixed(2)} FPS`);
      }
      if (slice.measurements) {
        console.log(`  FPSMeter-style: ${slice.meterFps.toFixed(2)} FPS; p95 intervals: ${slice.measurements.map((m) => m.framePacing.p95Ms?.toFixed(1) ?? '-').join(', ')}ms`);
      }
      writePartialResults();
    }
  }

  console.log('Average FPS by framework and rectangle count:');
  console.table(Object.fromEntries(Object.entries(results).map(([framework, slices]) => [
    framework,
    Object.fromEntries(Object.entries(slices).map(([count, result]) => [
      count,
      result.error ? `FAIL (${result.error})` : `${result.fps.toFixed(2)} FPS`,
    ])),
  ])));
  console.log(`Rectangle results written to ./results/${filename}`);
  return JSON.parse(fs.readFileSync(`./results/${filename}`, 'utf8'));
};
