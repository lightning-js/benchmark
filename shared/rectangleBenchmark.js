/**
 * Shared moving-rectangle scene and FPS sampler used by each renderer adapter.
 * CPU throttling is configured by the Playwright runner before navigation.
 */
export const RECTANGLE_COUNTS = [4000, 8000, 16000];

export const tickFpsMeter = (meter, now) => {
  if (meter.lastTick !== undefined) {
    meter.frameTime += (now - meter.lastTick - meter.frameTime) / 10;
  }
  meter.lastTick = now;
  return 1000 / meter.frameTime;
};

export const summarizeFrameIntervals = (intervals) => {
  const sorted = [...intervals].sort((a, b) => a - b);
  const percentile = (p) => sorted.length ? sorted[Math.ceil(sorted.length * p) - 1] : null;
  return {
    intervals: sorted.length,
    medianMs: percentile(0.5),
    p95Ms: percentile(0.95),
    p99Ms: percentile(0.99),
    maxMs: sorted.length ? sorted[sorted.length - 1] : null,
    over25Ms: sorted.filter((ms) => ms > 25).length,
    over50Ms: sorted.filter((ms) => ms > 50).length,
  };
};

export const createRectangleScene = (count, width, height, seed = 0x12345678) => {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  const scene = {
    count,
    width,
    height,
    x: new Float32Array(count),
    y: new Float32Array(count),
    size: new Float32Array(count),
    speed: new Float32Array(count),
  };

  for (let i = 0; i < count; i++) {
    scene.x[i] = random() * width;
    scene.y[i] = random() * height;
    scene.size[i] = 10 + random() * 40;
    scene.speed[i] = 1 + random();
  }
  return scene;
};

export const advanceRectangleScene = (scene) => {
  for (let i = 0; i < scene.count; i++) {
    let x = scene.x[i] - scene.speed[i];
    const halfExtent = scene.size[i] / 2;
    if (x + halfExtent < 0) x = scene.width + halfExtent;
    scene.x[i] = x;
  }
};

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const sampleFps = (scene, drawFrame, durationMs, subscribeFrame, meter, crossCheckRaf = false) => new Promise((resolve, reject) => {
  let frames = 0;
  let rafFrames = 0;
  let rafId;
  let previousFrame;
  let frameError;
  const intervals = [];
  const start = performance.now();
  if (crossCheckRaf) {
    const countRaf = () => {
      rafFrames++;
      rafId = requestAnimationFrame(countRaf);
    };
    rafId = requestAnimationFrame(countRaf);
  }
  const unsubscribe = subscribeFrame(() => {
    if (frameError) return;
    const now = performance.now();
    if (previousFrame !== undefined) intervals.push(now - previousFrame);
    previousFrame = now;
    // Same FPSMeter.tick() interval smoothing as the comparison (smoothing=10).
    tickFpsMeter(meter, now);
    try {
      advanceRectangleScene(scene);
      drawFrame(scene);
      frames++;
    } catch (error) {
      // Some engines isolate event-listener errors. Preserve the failure rather
      // than silently reporting a successful sample with fewer updates.
      frameError = error;
    }
  });
  setTimeout(() => {
    unsubscribe();
    if (crossCheckRaf) cancelAnimationFrame(rafId);
    if (frameError) {
      reject(frameError);
      return;
    }
    const elapsedMs = Math.max(1, performance.now() - start);
    resolve({
      fps: frames * 1000 / elapsedMs,
      meterFps: 1000 / meter.frameTime,
      framePacing: summarizeFrameIntervals(intervals),
      frames,
      elapsedMs,
      ...(crossCheckRaf ? {
        frames,
        rafFrames,
        elapsedMs,
        rafFps: rafFrames * 1000 / elapsedMs,
      } : {}),
    });
  }, durationMs);
});

/**
 * Run all rectangle counts. `drawScene` replaces the platform's current scene
 * and returns a callback that applies the next positions for each animation
 * frame.
 */
export const runRectangleBenchmark = async ({
  drawScene,
  subscribeFrame,
  crossCheckRaf = false,
  width = 1000,
  height = 540,
  counts = window.__RECTANGLE_BENCHMARK_CONFIG__?.counts ?? RECTANGLE_COUNTS,
  warmupMs = window.__RECTANGLE_BENCHMARK_CONFIG__?.warmupMs ?? 1000,
  sampleMs = window.__RECTANGLE_BENCHMARK_CONFIG__?.sampleMs ?? 1500,
  samples = window.__RECTANGLE_BENCHMARK_CONFIG__?.samples ?? 3,
}) => {
  const results = {};

  for (const count of counts) {
    console.log(`Rectangle slice started! ${count}`);
    try {
      const scene = createRectangleScene(count, width, height);
      const drawFrame = await drawScene(scene);
      const meter = { frameTime: 100, lastTick: undefined };
      await nextFrame();
      await nextFrame();
      await sampleFps(scene, drawFrame, warmupMs, subscribeFrame, meter, crossCheckRaf);

      const fpsSamples = [];
      const rafChecks = [];
      const measurements = [];
      for (let sample = 0; sample < samples; sample++) {
        const measurement = await sampleFps(scene, drawFrame, sampleMs, subscribeFrame, meter, crossCheckRaf);
        measurements.push(measurement);
        fpsSamples.push(measurement.fps);
        if (crossCheckRaf) rafChecks.push(measurement);
      }

      results[count] = {
        fps: fpsSamples.reduce((sum, fps) => sum + fps, 0) / fpsSamples.length,
        samples: fpsSamples,
        measurements,
        meterFps: measurements[measurements.length - 1].meterFps,
        ...(drawFrame.validateScene ? { sceneValidation: drawFrame.validateScene() } : {}),
        ...(crossCheckRaf ? {
          rafFps: rafChecks.reduce((sum, check) => sum + check.rafFps, 0) / rafChecks.length,
          rafChecks,
        } : {}),
      };
      console.log(`Rectangle benchmark ${count}: ${results[count].fps.toFixed(2)} FPS`);
      if (crossCheckRaf) {
        console.log(`L2 RAF cross-check ${count}: ${results[count].rafFps.toFixed(2)} RAF FPS`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results[count] = { fps: 0, samples: [], error: message };
      console.error(`Rectangle benchmark ${count} failed: ${message}`);
    }
    console.log('Rectangle slice result!', { count, result: results[count] });
  }

  console.log('Rectangles!', results);
  return results;
};

/** Bridge the shared workload to a renderer's native rectangle API. */
export const createRectangleAdapter = ({ createRect, destroyRect, setX, width = 1000, height = 540 }) => {
  let rectangles = [];

  return {
    width,
    height,
    drawScene(scene) {
      for (const rectangle of rectangles) {
        if (rectangle !== undefined) destroyRect(rectangle);
      }
      rectangles = new Array(scene.count);
      for (let i = 0; i < scene.count; i++) {
        rectangles[i] = createRect({
          x: scene.x[i],
          y: scene.y[i],
          size: scene.size[i],
        });
      }

      return (frameScene) => {
        for (let i = 0; i < rectangles.length; i++) {
          setX(rectangles[i], frameScene.x[i]);
        }
      };
    },
  };
};
