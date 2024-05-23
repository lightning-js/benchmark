import Blits from '@lightningjs/blits'
import { colourNames, adjectives, nouns } from '../../../shared/data.js'
import { warmup } from '../../../shared/utils/warmup'

const pick = (dict) => dict[Math.round(Math.random() * 1000) % dict.length]

let perf

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const sequence = (steps, pause = 0) => {
  return steps.reduce((promise, method) => {
    return promise
      .then(() => method())
      .then(() => delay(pause))
      .catch((e) => Promise.reject(e))
  }, Promise.resolve(null))
}

const results = {}

const printResults = () => {
  Object.entries(results).forEach((item) => {
    console.log(item[0], item[1].time.toFixed(2) + 'ms')
  })
}

let count = 1

const createItem = (x, y, key) => {
  return {
    id: key || 'key' + count++,
    x: x,
    y: y,
    w: 200,
    h: 40,
    color: pick(colourNames),
    textColor: pick(colourNames),
    text: `${pick(adjectives)} ${pick(nouns)}`,
  }
}

let done

const clear = function () {
  return new Promise((resolve) => {
    done = resolve
    this.items = []
  })
}

const createMany = function (amount) {
  return new Promise((resolve) => {
    clear.call(this).then(() => {
      done = resolve
      const items = []

      let x = 0
      let y = 0
      for (let i = 1; i < amount + 1; i++) {
        items.push(createItem(x, y))

        x = (i % 27) * 40
        y = ~~(i / 27) * 40
      }

      this.items = items
    })
  })
}

const updateMany = function (skip = 0) {
  return new Promise((resolve) => {
    done = resolve
    // for (let i = 0; i < this.items.length; i += skip + 1) {
    //   this.items[i].color = pick(colourNames)
    //   this.items[i].textColor = pick(colourNames)
    //   this.items[i].text = `${pick(adjectives)} ${pick(nouns)}`
    // }

    this.items = this.items.map((item, i) => {
      if (i % (skip + 1) === 0) {
        return {
          ...item,
          color: pick(colourNames),
          textColor: pick(colourNames),
          text: `${pick(adjectives)} ${pick(nouns)}`,
        }
      }
      return item
    })
  })
}

const updateRandom = function () {
  return new Promise((resolve) => {
    done = resolve
    const randomIdx = Math.floor(Math.random() * this.items.length)
    const newItems = this.items.map((item, i) => {
      if (i === randomIdx) {
        return {
          ...item,
          color: 'red',
          w: 1200,
          h: 400,
          x: 100,
          y: 100,
        }
      }
      return item
    })

    this.items = newItems
  })
}

const swapRows = function () {
  return new Promise((resolve) => {
    done = resolve
    const newItems = this.items.slice()
    if (this.items.length > 998) {
      const tmp = newItems[1]
      newItems[1] = newItems[998]
      newItems[998] = tmp
    }

    // this is really slow, but it's the only way to trigger a re-render
    this.items = []
    this.items = newItems
  })
}

const removeRow = function () {
  return new Promise((resolve) => {
    done = resolve
    const newItems = this.items.slice()
    newItems.pop()
    this.items = newItems
  })
}

const appendMany = function (amount) {
  return new Promise((resolve) => {
    done = resolve
    const newItems = this.items.slice()
    let x = 0
    let y = 0
    for (let i = 1; i < amount + 1; i++) {
      newItems.push(createItem(x, y))

      x = (i % 27) * 40
      y = ~~(i / 27) * 40
    }

    this.items = newItems
  })
}

export default Blits.Application({
  template: `
    <Element>
      <Element :for="item in $items" w="200" h="40" :color="$item.color" x="$item.x" y="$item.y" key="$item.id">
        <Text content="$item.text" :color="$item.textColor" alpha="0.8" size="26" font="Ubuntu" x="5" y="2" />
      </Element>
    </Element>
  `,

  // code: code,

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
        // () => this.testClear(),
        () => printResults(),
      ])
    },
    idle() {
      if (done) {
        const now = performance.now()
        const time = now - perf
        perf = now
        done({ time })
        done = null
      }
    },
  },
  methods: {
    empty() {
      this.items = []
    },
    async testCreateMany() {
      await warmup(createMany.bind(this), 1000, 5)
      results.create = await createMany.call(this, 1000)
    },
    async testUpdateMany() {
      await createMany.call(this, 1000)
      await warmup(updateMany.bind(this), 0, 5)
      await createMany.call(this, 1000)
      results.update = await updateMany.call(this, 0)
    },
    async testSkipNth() {
      await createMany.call(this, 1000)
      await warmup(updateMany.bind(this), 10, 5)
      await createMany.call(this, 1000)
      results.skipNth = await updateMany.call(this, 10)
    },
    async testUpdateRandom() {
      await createMany.call(this, 1000)
      await warmup(updateRandom.bind(this), null, 5)
      await createMany.call(this, 1000)
      results.select = await updateRandom.call(this)
    },
    async testSwapRows() {
      await createMany.call(this, 1000)
      await warmup(swapRows.bind(this), null, 5)
      results.swap = await swapRows.call(this)
    },
    async testRemoveRow() {
      await createMany.call(this, 1000)
      await warmup(removeRow.bind(this), null, 5)
      results.remove = await removeRow.call(this)
    },
    async testCreateMuchoMany() {
      await warmup(createMany.bind(this), 10000, 5)
      results.createLots = await createMany.call(this, 10000)
    },
    async testAppendMany() {
      await clear.call(this)
      await warmup(appendMany.bind(this), 1000, 5)
      await createMany.call(this, 1000)
      await warmup(appendMany.bind(this), 1000, 5)
      results.append = await appendMany.call(this, 1000)
    },
    async testClear() {
      await createMany.call(this, 1000)
      await clear.call(this)
      results.clear = await clear.call(this)
    },
  },
})
