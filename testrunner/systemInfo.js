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

import os from 'os'

/**
 * Retrieves system information including CPU model, CPU cores, and memory.
 * @returns {Object} An object containing the system information.
 * @property {string} cpuModel - The model of the CPU.
 * @property {number} cpuCores - The number of CPU cores.
 * @property {string} memory - The total memory in GB.
 */
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

/**
 * Retrieves operating system information including platform, release, and architecture.
 * @returns {Object} An object containing the operating system information.
 * @property {string} platform - The platform of the operating system.
 * @property {string} release - The release version of the operating system.
 * @property {string} arch - The architecture of the operating system.
 */
export const getOSInfo = () => {
    return {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch()
    }
}