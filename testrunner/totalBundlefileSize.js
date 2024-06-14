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

import fs from 'fs';
import path from 'path';

// gets the total size of all javascript files in a directory
export const getJavaScriptBundleSize = (baseDirectory) => {
    let totalSize = 0;
    const directory = path.join(baseDirectory, 'assets');
    const files = fs.readdirSync(directory);
    files.forEach((file) => {
        const filePath = path.join(directory, file);
        // check if its a .js file
        if (filePath.endsWith('.js')) {
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
        }
    });

    return totalSize;
}