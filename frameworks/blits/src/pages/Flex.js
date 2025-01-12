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
  createManyWithoutPositions,
  updateMany,
  updateRandom,
  swapRows,
  removeRow,
  appendMany,
  updateManyWidth,
} from '../perf.js'
import { run } from '../../../../shared/utils/run.js'

const results = {}

const Row = Blits.Component('Row', {
  props: ['rows'],
  template: `<Layout>
      <Element :for="item in $rows" :w="$item.w" :h="$item.h" :color="$item.color" key="$item.id">
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
    </Layout>
  `,
})

export default Blits.Component('Benchmark', {
  components: { Row },
  template: `<Layout direction="vertical">
        <Row :for="rows in $items" :rows="$rows" h="40" />
    </Layout>
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
        // () => this.testUpdateMany(),
        // () => this.swapRows(),
        () => printResults(results),
      ])
    },
  },
  methods: {
    async testCreateMany() {
      await warmup(createManyWithoutPositions.bind(this), 1000, 5)
      const { average: createAvg, spread: createSpread } = await run(createManyWithoutPositions.bind(this), 1000, 5)
      results.create = `${createAvg.toFixed(2)}ms ±${createSpread.toFixed(2)}`
    },
    async testUpdateMany() {
      await createManyWithoutPositions.call(this, 1000)
      await warmup(updateManyWidth.bind(this), 5, 5)
      const { average: updateAvg, spread: updateSpread } = await run(updateManyWidth.bind(this), 1000, 5)
      results.update = `${updateAvg.toFixed(2)}ms ±${updateSpread.toFixed(2)}`
    },
    async swapRows() {
      await createManyWithoutPositions.call(this, 1000)
      await warmup(swapRows.bind(this), 5)
      const { average: swapAvg, spread: swapSpread } = await run(swapRows.bind(this), 5)
      results.swap = `${swapAvg.toFixed(2)}ms ±${swapSpread.toFixed(2)}`
    }
  },
})
