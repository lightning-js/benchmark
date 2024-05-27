import Blits from '@lightningjs/blits'
import { sequence, printResults, createManyWithoutText, getDone, setDone } from '../perf'

let perf
const results = {}

export default Blits.Component('Memory', {
  template: `
    <Element :for="item in $items" w="4" h="4" :color="$item.color" x="$item.x" y="$item.y" key="$item.id" />
    `,
  state() {
    return {
      items: [],
    }
  },
  hooks: {
    async ready() {
      sequence([() => this.testCreateManyWithoutText(), () => printResults(results, 'memory')])
    },
    idle() {
      const done = getDone()
      if (done) {
        const now = performance.now()
        const time = now - perf
        perf = now
        done({ time })
        // done = null
        setDone(null)
      }
    },
  },
  methods: {
    empty() {
      this.items = []
    },
    async testCreateManyWithoutText() {
      // await createManyWithoutText.call(this, 20000)
      results.create = await createManyWithoutText.call(this, 20000)
    },
  },
})
