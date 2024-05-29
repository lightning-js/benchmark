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
    const randomIdx = Math.floor(Math.random() * this.items.length)

    this.items[randomIdx].color = 'red'
    this.items[randomIdx].w = 1200
    this.items[randomIdx].h = 400
    this.items[randomIdx].x = 100
    this.items[randomIdx].y = 100
    this.items[randomIdx].fontSize = 100
  })
}

const swapRows = function () {
  return new Promise((resolve) => {
    done = resolve

    const a = this.items[0]
    const b = this.items[this.items.length - 1]

    this.items[1] = {...b, ...{x: a.x, y: a.y}}
    this.items[this.items.length - 2] = {...a, ...{x: b.x, y: b.y}}

  })
}

const removeRow = function () {
  return new Promise((resolve) => {
    done = resolve
    this.items.pop()
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
