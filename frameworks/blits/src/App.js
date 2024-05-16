import Blits from '@lightningjs/blits'
import { colourNames, adjectives, nouns } from '../../../shared/data.js'

const pick = (dict) => dict[Math.round(Math.random() * 1000) % dict.length]

let perf
let currentTest

const startPerf = (test) => {
  currentTest = test
  perf = performance.now()
}

const clearPerf = () => (currentTest = false)

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const sequence = (steps, pause = 0) => {
  return steps.reduce((promise, method) => {
    return promise
      .then(() => method())
      .then(() => delay(pause))
      .catch((e) => Promise.reject(e))
  }, Promise.resolve(null))
}

const createMany = (amount) => {
  const items = []

  let x = 0
  let y = 0
  for (let i = 1; i < amount + 1; i++) {
    items.push({
      x: x,
      y: y,
      color: pick(colourNames),
      textColor: pick(colourNames),
      text: `${pick(adjectives)} ${pick(nouns)}`,
    })

    x = (i % 27) * 40
    y = ~~(i / 27) * 40
  }

  return items
}

export default Blits.Application({
  template: `
    <Element>
      <Element :for="item in $items" w="200" h="40" color="$item.color" x="$item.x" y="$item.y">
        <Text content="$item.text" color="$item.textColor" />
      </Element>
    </Element>
  `,
  state() {
    return {
      items: [],
    }
  },
  hooks: {
    ready() {
      sequence(
        [
          () => {
            console.log('Start warming up')
            this.items = createMany(1000)
          },
          () => {
            this.items = []
          },
          () => {
            this.items = createMany(1000)
          },
          () => {
            this.items = []
          },
          () => {
            this.items = createMany(1000)
          },
          () => {
            this.items = []
          },
          () => {
            this.items = createMany(1000)
          },
          () => {
            this.items = []
          },
          () => {
            this.items = createMany(1000)
          },
          () => {
            this.items = []
          },
          () => {
            console.log('Start Create 1000 test')
            startPerf('Create 1000')
            const items = createMany(1000)
            this.items = items
          },
        ],
        200
      )
    },
    idle() {
      if (currentTest) {
        const now = performance.now()
        console.log(currentTest, now - perf)
        perf = now
      }
    },
  },
})
