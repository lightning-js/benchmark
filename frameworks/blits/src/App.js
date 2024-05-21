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
    for (let i = 0; i < this.items.length; i += skip + 1) {
      this.items[i].color = pick(colourNames)
      this.items[i].textColor = pick(colourNames)
      this.items[i].text = `${pick(adjectives)} ${pick(nouns)}`
    }
  })
}

const updateRandom = function () {
  return new Promise((resolve) => {
    done = resolve

    const randomItem = this.items[Math.floor(Math.random() * this.items.length)]

    randomItem.x = 1200
    randomItem.y = 100
    randomItem.color = 'red'
    randomItem.w = 1200
    randomItem.h = 400
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
        // () => this.testSkipNth(),
        // () => this.testUpdateRandom(),
        // () => this.testCreateMuchoMany(),
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
    async testCreateMuchoMany() {
      await warmup(createMany.bind(this), 10000, 5)
      results.createLots = await createMany.call(this, 10000)
    },
  },
})
