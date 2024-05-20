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
    <p>Tests are run by executing an operation and waiting for the WebGL rennder to be Idle</p>
    <p>Results are the time in milliseconds to execute the operation</p>
    <p>All operations are executed on 6x CPU slowdown</p>
</div>`;


const table = `<table>
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
    </tbody>
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
    </tbody>
</table>`;

const createFile = (filename) => {
    // check if results dir exists
    if (!fs.existsSync('./results')) {
        fs.mkdirSync('./results');
    }

    return fs.createWriteStream(`./results/${filename}`);
}


export const writeResults = (results, frameworkVersions, browserVersion) => {
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

    // write the results header
    fileStream.write(resultsHeader);

    const frameworks = Object.keys(results);
    const frameworkNamesAndVersions = frameworks.map(f => `${f} ${frameworkVersions[f]}`);

    // write some html
    const frameworksHeader = frameworkNamesAndVersions.map(f => `<th>${f}</th>`).join('');
    const createRows = frameworks.map(f => `<td>${results[f].create.time} (${results[f].create.mean})</td>`).join('');
    const updateRows = frameworks.map(f => `<td>${results[f].update.time} (${results[f].update.mean})</td>`).join('');
    const partialUpdateRows = frameworks.map(f => `<td>${results[f].skipNth.time} (${results[f].skipNth.mean})</td>`).join('');
    const selectRow = frameworks.map(f => `<td>${results[f].select.time} (${results[f].select.mean})</td>`).join('');
    const swapRows = frameworks.map(f => `<td>${results[f].swap.time} (${results[f].swap.mean})</td>`).join('');
    const removeRow = frameworks.map(f => `<td>${results[f].remove.time} (${results[f].remove.mean})</td>`).join('');
    const createManyRows = frameworks.map(f => `<td>${results[f].createLots.time} (${results[f].createLots.mean})</td>`).join('');
    const appendRows = frameworks.map(f => `<td>${results[f].append.time} (${results[f].append.mean})</td>`).join('');
    const clearRows = frameworks.map(f => `<td>${results[f].clear.time} (${results[f].clear.mean})</td>`).join('');
    const overall = frameworks.map(f => `<td>${results[f].avgMean}</td>`).join('');
    const rowsMemory = frameworks.map(f => `<td>${results[f].memory.memory}MB (created in ${results[f].memory.time}ms)</td>`).join('');

    fileStream.write(table
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
        .replace('{{frameworks}}', frameworksHeader)
        .replace('{{rowsMemory}}', rowsMemory)
    );
    
    // write the footer
    fileStream.write(indexFooter);

    // close the file
    fileStream.end();
    console.log(`Results written to ${filename}`);

    fileStream.on('finish', function() {
        // exit out
        process.exit(0);
    });
    

}