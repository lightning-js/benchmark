import { createRectangleAdapter, runRectangleBenchmark } from './rectangleBenchmark.js';

const FTL_RECT_COLOR = [0, 0, 0, 1];

export const runFtlRectangleBenchmark = async ({ app, root, signals, createElement, RectShader, createShader, rectShader }) => {
  const rectangles = [];
  app.addActiveCheck(() => rectangles.length > 0);
  return runRectangleBenchmark({
    subscribeFrame: (callback) => signals.tick.subscribe(callback),
    drawScene(scene) {
      for (let i = rectangles.length - 1; i >= 0; i--) {
        for (const rect of rectangles[i]) rect.destroy();
      }
      rectangles.length = 0;
      for (let i = 0; i < scene.count; i++) {
        const size = scene.size[i];
        const rects = [];
        rectangles.push(rects);
        if (RectShader) {
          const shader = createShader(RectShader);
          shader.width = 1;
          shader.color = rectShader.color;
          if ('align' in shader) shader.align = 0.5;
          const rect = createElement({
            x: scene.x[i],
            y: scene.y[i],
            w: size,
            h: size,
            mountX: 0.5,
            mountY: 0.5,
            color: [1, 1, 1, 1],
            shader,
          });
          rects.push(rect);
          root.addChild(rect);
        } else {
          const border = createElement({
            x: scene.x[i],
            y: scene.y[i],
            w: size,
            h: size,
            mountX: 0.5,
            mountY: 0.5,
            color: FTL_RECT_COLOR,
          });
          rects.push(border);
          root.addChild(border);
          const fill = createElement({
            x: scene.x[i],
            y: scene.y[i],
            w: Math.max(0, size - 2),
            h: Math.max(0, size - 2),
            mountX: 0.5,
            mountY: 0.5,
            color: [1, 1, 1, 1],
          });
          rects.push(fill);
          root.addChild(fill);
        }
      }

      return (frameScene) => {
        for (let i = 0; i < rectangles.length; i++) {
          for (const rect of rectangles[i]) {
            // FTL's position-only fast path (updateWorldStatePosition) is only
            // taken via setPosition(); plain x= + dirty() stays on the general
            // resolver by design.
            if (typeof rect.setPosition === 'function') {
              rect.setPosition(frameScene.x[i], frameScene.y[i]);
            } else {
              rect.x = frameScene.x[i];
              rect.dirty();
            }
          }
        }
      };
    },
  });
};

// L3's indexed quad buffers use 16-bit indices, so a single batch wraps past
// 16,384 geometry slots — the same limit as Lightning 2. Counts above 16,000
// are reported as unsupported slices instead of measuring wrapped geometry.
const L3_MAX_RECTANGLES = 16000;

export const runRendererRectangleBenchmark = async (renderer, parent = renderer.root, BorderShader = null) => {
  if (BorderShader) renderer.stage.shManager.registerShaderType('RectangleBorder', BorderShader);
  const adapter = createRectangleAdapter({
    createRect: ({ x, y, size }) => {
      if (BorderShader) {
        return renderer.createNode({
          x,
          y,
          w: size,
          h: size,
          mountX: 0.5,
          mountY: 0.5,
          color: 0xffffffff,
          parent,
          shader: renderer.createShader('RectangleBorder', {
            w: 1,
            color: 0x000000ff,
            align: 'center',
          }),
        });
      }

      const node = renderer.createNode({
        x,
        y,
        w: size,
        h: size,
        mountX: 0.5,
        mountY: 0.5,
        color: 0x000000ff,
        parent,
      });
      let fill;
      try {
        fill = renderer.createNode({
          x,
          y,
          w: Math.max(0, size - 2),
          h: Math.max(0, size - 2),
          mountX: 0.5,
          mountY: 0.5,
          color: 0xffffffff,
          parent,
        });
      } catch (error) {
        node.destroy();
        throw error;
      }
      return { node, fill };
    },
    destroyRect: (rect) => {
      if (BorderShader) rect.destroy();
      else {
        rect.node.destroy();
        rect.fill.destroy();
      }
    },
    setX: (rect, x) => {
      if (BorderShader) rect.x = x;
      else {
        rect.node.x = x;
        rect.fill.x = x;
      }
    },
  });
  const drawScene = adapter.drawScene;
  return runRectangleBenchmark({
    ...adapter,
    drawScene: (scene) => {
      if (scene.count > L3_MAX_RECTANGLES) {
        throw new Error(`Lightning 3 renderer supports at most ${L3_MAX_RECTANGLES.toLocaleString()} rectangles; this slice is unsupported.`);
      }
      return drawScene(scene);
    },
    subscribeFrame: (callback) => {
      renderer.on('frameTick', callback);
      return () => renderer.off('frameTick', callback);
    },
  });
};
