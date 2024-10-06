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
import { sequence, printResults, createManyWithoutText } from '../perf'

const results = {}

export default Blits.Component('Memory', {
  template: `
    <Element :for="item in $items" w="4" h="4" :color="$item.color" x="$item.x" y="$item.y" key="$item.id" />
  `,
  state() {
    return {
      items: [],
    }
  },
  hooks: {
    async ready() {
      sequence([() => this.testCreateManyWithoutText(), () => printResults(results, 'memory')])
    },
  },
  methods: {
    empty() {
      this.items = []
    },
    async testCreateManyWithoutText() {
      const createRes = await createManyWithoutText.call(this, 20000)
      results.create = createRes.time.toFixed(2) + 'ms'
    },
  },
})
