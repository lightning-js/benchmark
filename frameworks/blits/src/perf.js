import { colourNames, adjectives, nouns } from '../../../shared/data.js'

// tools
const pick = (dict) => dict[Math.round(Math.random() * 1000) % dict.length]
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const sequence = (steps, pause = 0) => {
  return steps.reduce((promise, method) => {
    return promise
      .then(() => method())
      .then(() => delay(pause))
      .catch((e) => Promise.reject(e))
  }, Promise.resolve(null))
}

// helpers
const printResults = (results, type = 'benchmark') => {
  let text = type === 'benchmark' ? 'Done!' : 'Memory!'
  let processedResults = {}

  Object.keys(results).forEach((key) => {
    console.log(`${key}: ${results[key].time.toFixed(2)}ms`)
    processedResults[key] = results[key].time.toFixed(2)
  })

  console.log(text, processedResults)
}

// data
let done
let count = 1

const getDone = () => done
const setDone = (fn) => (done = fn)

// test methods
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

const createItemWithoutText = (x, y, key) => {
  return {
    id: key || 'key' + count++,
    x: x,
    y: y,
    w: 200,
    h: 40,
    color: pick(colourNames),
  }
}

const clear = function () {
  return new Promise((resolve) => {
    done = resolve
    const newItems = []
    this.items = newItems
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

const createManyWithoutText = function (amount = 20000) {
  return new Promise((resolve) => {
    clear.call(this).then(() => {
      done = resolve
      const items = []

      let x = 0
      let y = 0
      for (let i = 1; i < amount + 1; i++) {
        items.push(createItemWithoutText(x, y))

        x = (i % 216) * 4
        y = ~~(i / 216) * 4
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

export {
  clear,
  sequence,
  printResults,
  createMany,
  createManyWithoutText,
  updateMany,
  updateRandom,
  swapRows,
  removeRow,
  appendMany,
  getDone,
  setDone,
}
