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
import { getOSInfo, getSystemInfo } from "./systemInfo.js";

const indexHeader = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lightning JS Framework benchmark</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
            }
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #f2f2f2;
            }
            h2 {
                margin: 0;
            }
            p {
                margin: 0;
            }
            div {
                padding: 10px;
            }
            span {
                font-weight: bold;
            }
        </style>
    </head>
    <body>`;

const indexFooter = `</body>
    </html>`;

const header = `<div>
    <h2>Results for Lightning JS Framework benchmark</h2>
    <p>The benchmark was run on <span>{{OSversion}}</span> on a <span>{{systemVersion}}</span></p>
    <p>Tests where executed on browser version: <span id="browserVersion">{{browserVersion}}</span> using PlayWright</p>
</div>`;

const resultsHeader = `<div>
    <h2>Results</h2>
    {{resultsDescription}}
</div>`;

const opsDescription = `
    <p>Tests are run by executing an operation and waiting for the WebGL rennder to be Idle</p>
    <p>Results are the time in milliseconds to execute the operation</p>
    <p>All operations are executed on 6x CPU slowdown</p>`;

const startupDescription = `
    <p>Startup is measured from navigation start to the first idle after rendering 1,000 nodes (fresh browser context per run, 6x CPU slowdown applied before navigation, so JS fetch/parse is included)</p>`;


const opsSection = `
    <thead>
        <tr>
            <th>
                <b>Name</b>
                <br>
                Duration for...
            </th>
            {{frameworks}}
        </tr>

    </thead>
    <tbody>
        <tr>
            <th>
                <b>create rows</b>
                <div>creating 1,000 nodes. (5 warmup runs)</div>
            </th>
            {{createRows}}
        </tr>
        <tr>
            <th>
                <b>replace all rows</b>
                <div>updating all 1,000 nodes. (5 warmup runs)</div>
            </th>
            {{updateRows}}
        </tr>
        <tr>
            <th>
                <b>partial update rows</b>
                <div>updating every 10th node for 1,000 nodes. (5 warmup runs)</div>
            </th>
            {{partialUpdateRows}}
        </tr>
        <tr>
            <th>
                <b>select row</b>
                <div>selecting a node at random. (5 warmup runs)</div>
            </th>
            {{selectRow}}
        </tr>
        <tr>
            <th>
                <b>swap rows</b>
                <div>swapping 2 nodes. (5 warmup runs)</div>
            </th>
            {{swapRows}}
        </tr>
        <tr>
            <th>
                <b>remove row</b>
                <div>removing a node. (5 warmup runs)</div>
            </th>
            {{removeRow}}
        </tr>
        <tr>
            <th>
                <b>create many rows</b>
                <div>creating 10,000 nodes. (5 warmup runs)</div>
            </th>
            {{createManyRows}}
        </tr>
        <tr>
            <th>
                <b>append rows</b>
                <div>appending 1,000 nodes to 1,000 nodes. (5 warmup runs)</div>
            </th>
            {{appendRows}}
        </tr>
        <tr>
            <th>
                <b>clear rows</b>
                <div>removing all nodes. (5 warmup runs)</div>
            </th>
            {{clearRows}}
        </tr>
        <tr>
            <th>
                <b>Overall</b>
                <div>Average mean of all tests</div>
            </th>
            {{overall}}
        </tr>
    </tbody>`;

const memorySection = `
    <thead>
        <tr>
            <th>
                <b>Name</b>
                <br>
                Memory for...
            </th>
            {{frameworks}}
        </tr>
    </thead>
    <tbody>
        <tr>
            <th>
                <b>create 20k nodes</b>
                <div>creating 20k nodes.</div>
            </th>
            {{rowsMemory}}
        </tr>
    </tbody>`;

const startupSection = `
    <thead>
        <tr>
            <th>
                <b>Name</b>
                <br>
                Startup for...
            </th>
            {{frameworks}}
        </tr>
    </thead>
    <tbody>
        <tr>
            <th>
                <b>cold startup</b>
                <div>cold load to first frame of 1,000 nodes. Includes JS fetch/parse, font atlas and first idle. Fresh context per run.</div>
            </th>
            {{rowsStartup}}
        </tr>
    </tbody>`;

const fileSizeSection = `
    <thead>
        <tr>
            <th>
                <b>Name</b>
                <br>
                File size for...
            </th>
            {{frameworks}}
        </tr>
    </thead>
    <tbody>
        <tr>
            <th>
                <b>bundle size</b>
                <div>JavaScript size of the framework</div>
            </th>
            {{rowsSize}}
        </tr>
    </tbody>`;

// Single table: all sections share the same column widths, so framework
// columns stay aligned across ops / memory / startup / file-size rows.
// Only sections with data are included.
const table = `<table>
{{sections}}
</table>`;

const createFile = (filename) => {
    // check if results dir exists
    if (!fs.existsSync('./results')) {
        fs.mkdirSync('./results');
    }

    return fs.createWriteStream(`./results/${filename}`);
}

/**
 * Writes benchmark results to a single HTML file.
 * Only sections with data are rendered, so both full runs and
 * `--startup-only` runs produce the same `results_*.html` file.
 * @param {Object} results - The benchmark results.
 * @param {Object} frameworkVersions - The versions of the frameworks used in the benchmark.
 * @param {string} browserVersion - The version of the browser used for the benchmark.
 * 
 * @return {Promise<string>} Filename Returns the filename of the results file
 */
export const writeResults = (results, frameworkVersions, browserVersion) => {
    return new Promise((resolve, reject) => {

        const osVersion = getOSInfo();
        const systemVersion = getSystemInfo();

        const filename = `results_${browserVersion}_${osVersion.platform}_${osVersion.release}_${osVersion.arch}.html`;
        const fileStream = createFile(filename);

        fileStream.on('error', function(err) {
            console.error("Error writing to file:", err);
        });

        // write the index header
        fileStream.write(indexHeader);

        // write the header
        fileStream.write(header
            .replace('{{OSversion}}', `${osVersion.platform} ${osVersion.release} ${osVersion.arch}`)
            .replace('{{systemVersion}}', `${systemVersion.cpuModel} ${systemVersion.cpuCores} and ${systemVersion.memory} GB memory`)
            .replace('{{browserVersion}}', browserVersion)
        );

        const frameworks = Object.keys(results);
        const frameworkNamesAndVersions = frameworks.map(f => `${f} ${frameworkVersions[f] ?? ''}`);

        const hasOps = frameworks.some(f => results[f].create);
        const hasMemory = frameworks.some(f => results[f].memory);
        const hasStartup = frameworks.some(f => results[f].startup);
        const hasFileSize = frameworks.some(f => results[f].fileSize !== undefined);

        // write the results header with only the relevant descriptions
        fileStream.write(resultsHeader.replace('{{resultsDescription}}',
            `${hasOps ? opsDescription : ''}${hasStartup ? startupDescription : ''}`
        ));

        // write some html
        const frameworksHeader = frameworkNamesAndVersions.map(f => `<th>${f}</th>`).join('');
        const opCell = (f, key) => {
            const entry = results[f][key];
            if (entry && entry.time !== undefined) {
                return `<td style="background-color: ${entry.color}; color: rgb(0, 0, 0);">${entry.time} (${entry.mean})</td>`;
            }
            return `<td>n/a</td>`;
        };
        const createRows = frameworks.map(f => opCell(f, 'create')).join('');
        const updateRows = frameworks.map(f => opCell(f, 'update')).join('');
        const partialUpdateRows = frameworks.map(f => opCell(f, 'skipNth')).join('');
        const selectRow = frameworks.map(f => opCell(f, 'select')).join('');
        const swapRows = frameworks.map(f => opCell(f, 'swap')).join('');
        const removeRow = frameworks.map(f => opCell(f, 'remove')).join('');
        const createManyRows = frameworks.map(f => opCell(f, 'createLots')).join('');
        const appendRows = frameworks.map(f => opCell(f, 'append')).join('');
        const clearRows = frameworks.map(f => opCell(f, 'clear')).join('');
        const overall = frameworks.map(f => `<td>${results[f].avgMean ?? 'n/a'}</td>`).join('');
        const rowsSize = frameworks.map(f => `<td>${results[f].fileSize ?? 'n/a'} KB</td>`).join('');
        const rowsMemory = frameworks.map(f => {
            if (results[f].memory && (results[f].memory.memory !== 'NaN' || results[f].memory.time !== -1)) {
                return `<td>${results[f].memory.memory}MB (created in ${results[f].memory.time}ms)</td>`
            } else {
                return `<td>Failed</td>`;
            }
        }).join('');
        const rowsStartup = frameworks.map(f => {
            const startup = results[f].startup;
            if (startup && startup.time && startup.time !== 'Failed') {
                const detail = startup.min >= 0 && startup.runs
                    ? ` (min ${startup.min.toFixed(2)}ms, n=${startup.runs.length})`
                    : '';
                return `<td style="background-color: ${startup.color}; color: rgb(0, 0, 0);">${startup.time} (${startup.mean})${detail}</td>`;
            } else {
                return `<td>Failed</td>`;
            }
        }).join('');

        // Sections are assembled into a single table so framework columns
        // share widths and stay aligned across ops / memory / startup rows.
        const sections = [];
        if (hasOps) {
            sections.push(opsSection
                .replace('{{frameworks}}', frameworksHeader)
                .replace('{{createRows}}', createRows)
                .replace('{{updateRows}}', updateRows)
                .replace('{{partialUpdateRows}}', partialUpdateRows)
                .replace('{{selectRow}}', selectRow)
                .replace('{{swapRows}}', swapRows)
                .replace('{{removeRow}}', removeRow)
                .replace('{{createManyRows}}', createManyRows)
                .replace('{{appendRows}}', appendRows)
                .replace('{{clearRows}}', clearRows)
                .replace('{{overall}}', overall)
            );
        }

        if (hasMemory) {
            sections.push(memorySection
                .replace('{{frameworks}}', frameworksHeader)
                .replace('{{rowsMemory}}', rowsMemory)
            );
        }

        if (hasStartup) {
            sections.push(startupSection
                .replace('{{frameworks}}', frameworksHeader)
                .replace('{{rowsStartup}}', rowsStartup)
            );
        }

        if (hasFileSize) {
            sections.push(fileSizeSection
                .replace('{{frameworks}}', frameworksHeader)
                .replace('{{rowsSize}}', rowsSize)
            );
        }

        fileStream.write(table.replace('{{sections}}', sections.join('\n')));
        
        // write the footer
        fileStream.write(indexFooter);

        // close the file
        fileStream.end();
        console.log(`Results written to ${filename}`);

        fileStream.on('finish', function() {
            resolve(filename);
        });
    }); 
}

