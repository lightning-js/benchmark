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

import Benchmark from './pages/Benchmark.js'
import Memory from './pages/Memory.js'
import Flex from './pages/Flex.js'
import symbols from '@lightningjs/blits/symbols'
import { setRenderer } from './perf.js'

export default Blits.Application({
  template: `
    <Element>
      <RouterView />
    </Element>
  `,
  routes: [
    { path: '/', component: Benchmark },
    { path: '/memory', component: Memory },
    { path: '/flex', component: Flex },
  ],
  hooks: {
    async ready() {
      const renderer = this[symbols['renderer']]()
      setRenderer(renderer)
    },
  },
})
