import Blits from '@lightningjs/blits'
import symbols from '@lightningjs/blits/symbols'
import { runRectangleBenchmark } from '../../../../shared/rectangleBenchmark.js'

export default Blits.Component('Rectangles', {
  template: `
    <Element w="1000" h="540" clipping="true">
      <Element
        :for="rect in $rectangles"
        x="$rect.x"
        y="$rect.y"
        w="$rect.size"
        h="$rect.size"
        mount="0.5"
        color="white"
        border="{w: 1, color: '#000000', align: 'center'}"
        key="$rect.id"
        ref="rect"
      />
    </Element>
  `,
  state() {
    return { rectangles: [] }
  },
  hooks: {
    ready() {
      const app = document.querySelector('#app')
      if (app) {
        app.style.width = '1000px'
        app.style.height = '540px'
        app.style.overflow = 'hidden'
      }
      const renderer = this[symbols['renderer']]()
      runRectangleBenchmark({
        subscribeFrame: (callback) => {
          renderer.on('frameTick', callback)
          return () => renderer.off('frameTick', callback)
        },
        drawScene: async (scene) => {
          this.rectangles = Array.from({ length: scene.count }, (_, i) => ({
            id: `rect-${i}`,
            x: scene.x[i],
            y: scene.y[i],
            size: scene.size[i],
          }))

          // Build the keyed list once. This benchmark intentionally uses Blits'
          // documented Element refs, not whole-list reconciliation, for motion.
          await new Promise((resolve) => requestAnimationFrame(resolve))
          // $select() scans the loop collection on each first lookup. Doing
          // that N times is quadratic. Enumerate Blits' exported children
          // collection once and index the documented refs instead.
          const elements = new Array(scene.count)
          for (const child of this[symbols.children]) {
            if (!child) continue
            const collection = Array.isArray(child)
              ? child
              : Object.getPrototypeOf(child) === Object.prototype
                ? Object.values(child)
                : [child]
            for (const element of collection) {
              const match = element?.ref?.match(/^rect(\d+)$/)
              if (match) elements[Number(match[1])] = element
            }
          }
          for (let i = 0; i < scene.count; i++) {
            if (!elements[i]) throw new Error(`Missing Blits rectangle ref rect${i}`)
          }
          const countNodes = () => {
            const stack = [renderer.root]
            let count = 0
            while (stack.length) {
              const node = stack.pop()
              count++
              for (const child of node.children) stack.push(child)
            }
            return count
          }
          const nodesBefore = countNodes()
          const identities = elements.map((element) => element.node)

          const drawFrame = (frameScene) => {
            for (let i = 0; i < elements.length; i++) {
              elements[i].set('x', frameScene.x[i])
            }
          }
          // Check outside the timing samples that movement did not allocate or
          // replace nodes. Do not instrument createNode inside measured frames.
          drawFrame.validateScene = () => {
            const nodesAfter = countNodes()
            if (nodesAfter !== nodesBefore || elements.some((element, i) => element.node !== identities[i])) {
              throw new Error(`Blits node population changed during motion: ${nodesBefore} -> ${nodesAfter}`)
            }
            return { rectangles: scene.count, nodesBefore, nodesAfter, stable: true }
          }
          return drawFrame
        },
      }).catch((error) => console.error('Rectangle benchmark failed:', error))
    },
  },
})
