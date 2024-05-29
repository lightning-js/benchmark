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
    <Element :for="item in $items" :w="$item.w" :h="$item.h" :color="$item.color" :x="$item.x" :y="$item.y" key="$item.id">
      <Text
        content="$item.text"
        :color="$item.textColor"
        alpha="0.8"
        :size="$item.fontSize || 26"
        font="Ubuntu"
        x="5"
        y="2"
        ref="text"
      />
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
        setDone(null)
      }
    },
  },
  methods: {
    async testCreateMany() {
      await warmup(createMany.bind(this), 1000, 5)
      results.create = await createMany.call(this, 1000)
    },
    async testUpdateMany() {
      await createMany.call(this, 1000)
      await warmup(updateMany.bind(this), 5)
      await createMany.call(this, 1000)
      results.update = await updateMany.call(this)
    },
    async testSkipNth() {
      await createMany.call(this, 1000)
      await warmup(updateMany.bind(this), 10, 5)
      await createMany.call(this, 1000)
      results.skipNth = await updateMany.call(this, 10)
    },
    async testUpdateRandom() {
      await createMany.call(this, 1000)
      await warmup(updateRandom.bind(this), 5)
      await createMany.call(this, 1000)
      results.select = await updateRandom.call(this)
    },
    async testSwapRows() {
      await createMany.call(this, 1000)
      await warmup(swapRows.bind(this), 5)
      await createMany.call(this, 1000)
      results.swap = await swapRows.call(this)
    },
    async testRemoveRow() {
      await createMany.call(this, 1000)
      await warmup(removeRow.bind(this), 5)
      await createMany.call(this, 1000)
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
      results.append = await appendMany.call(this, 1000)
    },
    async testClear() {
      await warmup(createMany.bind(this), 1000, 5)
      results.clear = await clear.call(this)
    },
  },
})
