/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
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

import os from 'os'

// gets CPU model, CPU cores and memory
export const getSystemInfo = () => {
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuCores = cpus.length;

    // get total memory in GB
    const memory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

    return {
        cpuModel,
        cpuCores,
        memory
    }
}

export const getOSInfo = () => {
    return {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch()
    }
}