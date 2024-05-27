import Blits from '@lightningjs/blits'
import { warmup } from '../../../../shared/utils/warmup'
import {
  clear,
  sequence,
  printResults,
  createMany,
  updateMany,
  updateRandom,
  swapRows,
  removeRow,
  appendMany,
  getDone,
  setDone,
} from '../perf'

let perf
const results = {}

export default Blits.Component('Benchmark', {
  template: `
    <Element :for="item in $items" w="200" h="40" :color="$item.color" x="$item.x" y="$item.y" key="$item.id">
      <Text content="$item.text" :color="$item.textColor" alpha="0.8" size="26" font="Ubuntu" x="5" y="2" />
    </Element>
    `,
  state() {
    return {
      items: [],
    }
  },
  hooks: {
    async ready() {
      sequence([
        () => this.testCreateMany(),
        () => this.testUpdateMany(),
        () => this.testSkipNth(),
        () => this.testUpdateRandom(),
        () => this.testCreateMuchoMany(),
        () => this.testSwapRows(),
        () => this.testRemoveRow(),
        () => this.testAppendMany(),
        () => this.testClear(),
        () => printResults(results),
      ])
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
    async testCreateMany() {
      //console.log('running testCreateMany')
      await warmup(createMany.bind(this), 1000, 5)
      results.create = await createMany.call(this, 1000)
    },
    async testUpdateMany() {
      //console.log('running testUpdateMany')
      await createMany.call(this, 1000)
      await warmup(updateMany.bind(this), 1000, 5)
      await createMany.call(this, 1000)
      results.update = await updateMany.call(this, 1000)
    },
    async testSkipNth() {
      //console.log('running testSkipNth')
      await createMany.call(this, 1000)
      await warmup(updateMany.bind(this), [1000, 10], 5)
      await createMany.call(this, 1000)
      results.skipNth = await updateMany.call(this, 10)
    },
    async testUpdateRandom() {
      //console.log('running testUpdateRandom')
      await createMany.call(this, 1000)
      await warmup(updateRandom.bind(this), null, 5)
      await createMany.call(this, 1000)
      results.select = await updateRandom.call(this)
    },
    async testSwapRows() {
      //console.log('running testSwapRows')
      await createMany.call(this, 1000)
      await warmup(swapRows.bind(this), null, 5)
      results.swap = await swapRows.call(this)
    },
    async testRemoveRow() {
      //console.log('running testRemoveRow')
      await createMany.call(this, 1000)
      await warmup(removeRow.bind(this), null, 5)
      results.remove = await removeRow.call(this)
    },
    async testCreateMuchoMany() {
      //console.log('running testCreateMuchoMany')
      await warmup(createMany.bind(this), 10000, 5)
      results.createLots = await createMany.call(this, 10000)
    },
    async testAppendMany() {
      //console.log('running testAppendMany')
      await clear.call(this)
      await warmup(appendMany.bind(this), 1000, 5)
      await createMany.call(this, 1000)
      // await warmup(appendMany.bind(this), 1000, 5)
      results.append = await appendMany.call(this, 1000)
    },
    async testClear() {
      //console.log('running testClear')
      await createMany.call(this, 1000)
      results.clear = await clear.call(this)
    },
  },
})
