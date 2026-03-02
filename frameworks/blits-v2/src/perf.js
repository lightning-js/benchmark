/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { colourNames, adjectives, nouns } from '../../../shared/data.js'
import { waitUntilIdle } from '../../../shared/utils/waitUntilIdle.js'

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
    console.log(`${key}: ${results[key]}`)
    processedResults[key] = results[key]
  })

  console.log(text, processedResults)
}

// data
let count = 1

let renderer
const setRenderer = (r) => (renderer = r)

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
    if (this.items.length === 0) {
      return resolve({
        time: 0,
      })
    }

    const clearPerf = performance.now()
    waitUntilIdle(renderer, clearPerf).then((time) => {
      resolve({ time })
    })

    this.items = []
  })
}

const clearTest = function () {
  return new Promise((resolve) => {
    createMany.call(this, 1000).then(() => {
      clear.call(this).then((time) => {
        resolve(time)
      })
    })
  })
}

const createMany = function (amount) {
  return new Promise((resolve) => {
    clear.call(this).then(() => {
      const createPerf = performance.now()
      waitUntilIdle(renderer, createPerf).then((time) => {
        resolve({ time })
      })

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
      const createManyPerf = performance.now()
      waitUntilIdle(renderer, createManyPerf).then((time) => {
        resolve({ time })
      })

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
    const perf = performance.now()
    waitUntilIdle(renderer, perf).then((time) => {
      resolve({ time })
    })

    for (let i = 0; i < this.items.length; i += skip + 1) {
      this.items[i].color = pick(colourNames)
      this.items[i].textColor = pick(colourNames)
      this.items[i].text = `${pick(adjectives)} ${pick(nouns)}`
    }
    this.$trigger('items')
  })
}

const updateRandom = function () {
  return new Promise((resolve) => {
    const perf = performance.now()
    waitUntilIdle(renderer, perf).then((time) => {
      resolve({ time })
    })

    const randomIdx = Math.floor(Math.random() * this.items.length)

    this.items[randomIdx].color = 'red'
    this.items[randomIdx].w = 1200
    this.items[randomIdx].h = 400
    this.items[randomIdx].x = 100
    this.items[randomIdx].y = 100
    this.items[randomIdx].fontSize = 100
    this.$trigger('items')
  })
}

const swapRows = function () {
  return new Promise((resolve) => {
    const perf = performance.now()
    waitUntilIdle(renderer, perf).then((time) => {
      resolve({ time })
    })

    const a = this.items[0]
    const b = this.items[this.items.length - 2]

    this.items[0] = { ...b, ...{ x: a.x, y: a.y } }
    this.items[this.items.length - 2] = { ...a, ...{ x: b.x, y: b.y } }
  })
}

const removeRow = function () {
  return new Promise((resolve) => {
    const perf = performance.now()
    waitUntilIdle(renderer, perf).then((time) => {
      resolve({ time })
    })

    this.items.pop()
  })
}

const appendMany = function (amount) {
  return new Promise((resolve) => {
    clear.call(this).then(() => {
      createMany.call(this, 1000).then((t) => {
        const appendPerf = performance.now()
        waitUntilIdle(renderer, appendPerf).then((time) => {
          resolve({ time })
        })

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
    })
  })
}

export {
  clear,
  clearTest,
  sequence,
  printResults,
  createMany,
  createManyWithoutText,
  updateMany,
  updateRandom,
  swapRows,
  removeRow,
  appendMany,
  setRenderer,
}
