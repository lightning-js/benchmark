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

/**
 * Wait until the renderer is idle with a grace period, sometimes it reports multiple
 * onIdle events until it is really done. Returns last onIdle timestamp received.
 * 
 * @param {Object} renderer 
 * @param {number} startTime 
 * @returns {Promise<number>}
 */
export const waitUntilIdle = (renderer, startTime) => {
    return new Promise( (resolve, reject) => {
        if (!renderer || typeof renderer.on !== 'function') {
            reject('waitOnIdle called without renderer instance');
            return;
        }

        let timeout = null;
        let lastTime;
    
        const done = () => {
            clearTimeout(timeout);
            renderer.off('idle', rendererIdle);
            resolve(lastTime);
        }
    
        const rendererIdle = () => {
            lastTime = performance.now() - startTime;
            if (timeout) {
                clearTimeout(timeout);
            }
            setTimeout(done, 200);
        }
    
        renderer.on('idle', rendererIdle);
    })
}