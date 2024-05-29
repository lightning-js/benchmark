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

import { processResults } from './processResults.js';
import { writeResults } from './writeResults.js';

const test = () => {
    const results = {
        renderer: {
          create: '40.00',
          update: '26.70',
          skipNth: '22.80',
          select: '47.50',
          swap: '41.90',
          remove: '24.80',
          createLots: '227.50',
          append: '49.40',
          clear: '18.80'
        },
        solid: {
          create: '57.50',
          update: '26.20',
          skipNth: '24.90',
          select: '29.40',
          swap: '84.70',
          remove: '33.70',
          createLots: '373.40',
          append: '42.80',
          clear: '38.60'
        }
    }

    const frameworkVersions = {
        'renderer' : '0.0.1',
        'solid' : '0.0.1'
    };

    const memoryResults = {
        renderer: { create: '1323.60', heap: '58.67' },
        solid: { create: '1722.10', heap: '88.98' }
    }

    const processedResults = processResults(results, memoryResults);
    console.log(JSON.stringify(processedResults));
    console.log(processedResults);

    writeResults(processedResults, frameworkVersions, 'Chromium1.0.0');
}

test();