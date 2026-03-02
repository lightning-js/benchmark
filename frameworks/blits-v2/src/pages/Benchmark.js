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
import { warmup } from '../../../../shared/utils/warmup.js'
import {
  clearTest,
  sequence,
  printResults,
  createMany,
  updateMany,
  updateRandom,
  swapRows,
  removeRow,
  appendMany,
} from '../perf.js'
import { run } from '../../../../shared/utils/run.js'

const results = {}

export default Blits.Component('Benchmark', {
  template: `
    <Element>
      <Element :for="item in $items" :w="$item.w" :h="$item.h" :color="$item.color" :x="$item.x" :y="$item.y" key="$item.id">
        <Text
          :content="$item.text"
          :color="$item.textColor"
          alpha="0.8"
          :size="$item.fontSize || 26"
          font="Ubuntu"
          x="5"
          y="2"
          ref="text"
        />
      </Element>
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
        () => this.testSwapRows(),
        () => this.testRemoveRow(),
        () => this.testCreateMuchoMany(),
        () => this.testAppendMany(),
        () => this.testClear(),
        () => printResults(results),
      ])
    },
  },
  methods: {
    async testCreateMany() {
      await warmup(createMany.bind(this), 1000, 5)
      const { average: createAvg, spread: createSpread } = await run(createMany.bind(this), 1000, 5)
      results.create = `${createAvg.toFixed(2)}ms ±${createSpread.toFixed(2)}`
    },
    async testUpdateMany() {
      await createMany.call(this, 1000)
      await warmup(updateMany.bind(this), 0, 5)
      await createMany.call(this, 1000)

      const { average: updateAvg, spread: updateSpread } = await run(updateMany.bind(this), 0, 5)
      results.update = `${updateAvg.toFixed(2)}ms ±${updateSpread.toFixed(2)}`
    },
    async testSkipNth() {
      await createMany.call(this, 1000)
      await warmup(updateMany.bind(this), 10, 5)
      await createMany.call(this, 1000)

      const { average: skipNthAvg, spread: skipNthSpread } = await run(updateMany.bind(this), 10, 5)
      results.skipNth = `${skipNthAvg.toFixed(2)}ms ±${skipNthSpread.toFixed(2)}`
    },
    async testUpdateRandom() {
      await createMany.call(this, 1000)
      await warmup(updateRandom.bind(this), 5)
      await createMany.call(this, 1000)

      const { average: selectAvg, spread: selectSpread } = await run(updateRandom.bind(this), 5)
      results.select = `${selectAvg.toFixed(2)}ms ±${selectSpread.toFixed(2)}`
    },
    async testSwapRows() {
      await createMany.call(this, 1000)
      await warmup(swapRows.bind(this), 5)
      await createMany.call(this, 1000)

      const { average: swapAvg, spread: swapSpread } = await run(swapRows.bind(this), undefined, 5)
      results.swap = `${swapAvg.toFixed(2)}ms ±${swapSpread.toFixed(2)}`
    },
    async testRemoveRow() {
      await createMany.call(this, 1000)
      await warmup(removeRow.bind(this), 5)
      await createMany.call(this, 1000)

      const { average: removeAvg, spread: removeSpread } = await run(removeRow.bind(this), 5)
      results.remove = `${removeAvg.toFixed(2)}ms ±${removeSpread.toFixed(2)}`
    },
    async testCreateMuchoMany() {
      await warmup(createMany.bind(this), 10000, 5)
      const { average: createLotsAvg, spread: createLotsSpread } = await run(
        createMany.bind(this),
        10000,
        5
      )

      results.createLots = `${createLotsAvg.toFixed(2)}ms ±${createLotsSpread.toFixed(2)}`
    },
    async testAppendMany() {
      await warmup(appendMany.bind(this), 1000, 5)

      const { average: appendAvg, spread: appendSpread } = await run(
        appendMany.bind(this),
        10000,
        5
      )

      results.append = `${appendAvg.toFixed(2)}ms ±${appendSpread.toFixed(2)}`;
    },
    async testClear() {
      await warmup(clearTest.bind(this), 1000, 5)
      const { average: clearAvg, spread: clearSpread } = await run(clearTest.bind(this), 10000, 5)
      results.clear = `${clearAvg.toFixed(2)}ms ±${clearSpread.toFixed(2)}`
    },
  },
})
