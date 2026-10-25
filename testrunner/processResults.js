/**
 * Processes the benchmark results and calculates various metrics.
 * 
 * @typedef {import('./types/results.js').Results} Results
 * @typedef {import('./types/memoryResults.js').MemoryResults} MemoryResults
 * @typedef {import('./types/fileSizeResults.js').FileSizeResults} FileSizeResultsObject
 * @typedef {import('./types/startupResults.js').StartupResults} StartupResultsObject
 * 
 * @param {Results} results - The benchmark results object.
 * @param {MemoryResults} memoryResults - The memory results object.
 * @param {FileSizeResultsObject} fileSizeResults - The file size results object.
 * @param {StartupResultsObject} [startupResults] - The startup results object.
 * @returns {Object} - The processed and sorted results object.
 */
export const processResults = (results, memoryResults, fileSizeResults, startupResults = {}) => {
    const processedResults = {};
    const fastestTimes = {
        create: null,
        update: null,
        skipNth: null,
        select: null,
        swap: null,
        remove: null,
        createLots: null,
        append: null,
        clear: null
    }

    const frameworks = Object.keys(results);

    // find fastest time for each operation
    frameworks.forEach(f => {
        const framework = results[f];
        const times = Object.keys(framework);

        console.log(times);

        // find fastest time for each operation
        times.forEach(t => {
            const fastest = parseFloat(fastestTimes[t]);
            const current = parseFloat(framework[t]);

            if (!fastest) {
                return fastestTimes[t] = current;
            }
            
            if (current < fastest) {
                return fastestTimes[t] = current;
            }
        });
    });

    // process results and calculate mean
    frameworks.forEach(f => {
        const framework = results[f];
        const times = Object.keys(framework);

        // process results
        processedResults[f] = {};
        times.forEach(t => {
            const weightedMean = calculateWeightedMean(parseFloat(framework[t]), fastestTimes[t], t);

            processedResults[f][t] = {
                mean: weightedMean.toFixed(2),
                color: computeColor(weightedMean),
                time: framework[t]
            }
        });

        // geometric mean of all means
        const timesArray = times.map(t => parseFloat(processedResults[f][t].mean));
        processedResults[f].avgMean = avgMean(timesArray).toFixed(2);
    });

    // add memory results
    frameworks.forEach(f => {
        if (!memoryResults[f]) {
            return;
        }

        processedResults[f].memory = {
            memory: memoryResults[f].heap || -1,
            time: memoryResults[f].create || -1,
        }
    });

    // add file size results
    frameworks.forEach(f => {
        if (!fileSizeResults[f]) {
            return;
        }

        // add file size to processed results
        // convert to KB
        processedResults[f].fileSize = (fileSizeResults[f] / 1024).toFixed(2);
    });

    // add startup results (cold load to first frame, reported separately and
    // deliberately excluded from avgMean). Uses a plain relative mean against
    // the fastest framework rather than the Krause op weights.
    const { cells: startupCells } = buildStartupCells(frameworks, startupResults);
    frameworks.forEach(f => {
        if (startupCells[f]) {
            processedResults[f].startup = startupCells[f];
        }
    });

    // sort the frameworks by avgMean
    const sortedFrameworks = frameworks.sort((a, b) => {
        return processedResults[a].avgMean - processedResults[b].avgMean;
    });

    // create sorted results Object
    const sortedResults = {};
    sortedFrameworks.forEach(f => {
        sortedResults[f] = processedResults[f];
    });

    return sortedResults;
}

/**
 * Processes only startup results (used by `--startup-only` runs, where no
 * throughput/memory results exist). Returns per-framework startup cells plus
 * bundle sizes, sorted by startup mean (fastest first). Frameworks whose
 * startup failed get no `startup` cell, same as in the full report.
 *
 * @typedef {import('./types/fileSizeResults.js').FileSizeResults} FileSizeResultsObject
 * @typedef {import('./types/startupResults.js').StartupResults} StartupResultsObject
 *
 * @param {StartupResultsObject} startupResults - The startup results object.
 * @param {FileSizeResultsObject} [fileSizeResults] - The file size results object.
 * @returns {Object} - The processed startup-only results object, in the same
 * shape as `processResults` output (per-framework `startup`/`fileSize` cells).
 */
export const processStartupResults = (startupResults, fileSizeResults = {}) => {
    const frameworks = Object.keys(startupResults);
    const { cells } = buildStartupCells(frameworks, startupResults);

    const processedResults = {};
    frameworks.forEach(f => {
        processedResults[f] = {};
        if (cells[f]) {
            processedResults[f].startup = cells[f];
        }
        if (fileSizeResults[f] !== undefined) {
            processedResults[f].fileSize = (fileSizeResults[f] / 1024).toFixed(2);
        }
    });

    // sort fastest startup first; frameworks without a startup cell go last
    const sortedFrameworks = frameworks.sort((a, b) => {
        const aMean = processedResults[a].startup ? parseFloat(processedResults[a].startup.mean) : Infinity;
        const bMean = processedResults[b].startup ? parseFloat(processedResults[b].startup.mean) : Infinity;
        return aMean - bMean;
    });

    const sortedResults = {};
    sortedFrameworks.forEach(f => {
        sortedResults[f] = processedResults[f];
    });

    return sortedResults;
}

/**
 * Builds the per-framework startup report cells shared by the full and the
 * startup-only reports. Uses a plain relative mean against the fastest
 * framework (no Krause op weights).
 *
 * @param {string[]} frameworks - Framework names.
 * @param {Object} startupResults - Raw startup results per framework.
 * @returns {{cells: Object, fastestStartup: (number|null)}}
 */
const buildStartupCells = (frameworks, startupResults) => {
    let fastestStartup = null;
    (frameworks || []).forEach(f => {
        if (!startupResults[f]) {
            return;
        }

        const current = parseFloat(startupResults[f].startup);
        if (!Number.isFinite(current) || current < 0) {
            return;
        }

        if (fastestStartup === null || current < fastestStartup) {
            fastestStartup = current;
        }
    });

    const cells = {};
    (frameworks || []).forEach(f => {
        if (!startupResults[f] || fastestStartup === null) {
            return;
        }

        const value = parseFloat(startupResults[f].startup);
        if (!Number.isFinite(value) || value < 0) {
            cells[f] = {
                mean: '-1',
                color: computeColor(1),
                time: 'Failed',
                min: -1,
                runs: [],
            };
            return;
        }

        const mean = calculateMean(value, fastestStartup);
        cells[f] = {
            mean: mean.toFixed(2),
            color: computeColor(mean),
            time: startupResults[f].startup,
            min: startupResults[f].min ?? -1,
            runs: startupResults[f].runs ?? [],
        };
    });

    return { cells, fastestStartup };
}

/**
 * Calculates the mean value relative to a baseline value.
 * @param {number} value - The value to calculate the mean for.
 * @param {number} baseline - The baseline value to compare against.
 * @returns {number} - The calculated mean value.
 */
const calculateMean = (value, baseline) => {
    return (value / baseline);
}

/**
 * Calculates the weighted mean value relative to a baseline value.
 * @param {number} value - The value to calculate the mean for.
 * @param {number} baseline - The baseline value to compare against.
 * @param {string} type - The type of operation.
 * @returns {number} - The calculated mean value.
 */
const calculateWeightedMean = (value, baseline, type) => {
    console.log(value, baseline, type);
    if (value === baseline) {
        return 1;
    }

    const mean = calculateMean(value, baseline);
    const weight = weightedResults[type];
 
    const weightedMean = weight * Math.log(mean);
    return Math.exp(weightedMean);
}

/**
 * Weighted result table
 * Similar to https://github.com/krausest/js-framework-benchmark/wiki/Computation-of-the-weighted-geometric-mean
 */
const weightedResults = {
    create: 0.64,
    update: 0.56,
    skipNth: 0.56,
    select: 0.19,
    swap: 0.13,
    remove: 0.53,
    createLots: 0.56,
    append: 0.55,
    clear: 0.42
}

/**
 * Calculates the average mean value from an array of values.
 * @param {number[]} values - The array of values to calculate the average mean for.
 * @returns {number} - The calculated average mean value.
 */
const avgMean = (values) => {
    if (!values || values.length === 0) {
        return 0;
    }
    return (values.reduce((a, b) => a + b) / values.length);
}


/**
 * Compute the color for a given mean factor.
 * 
 * @param {number} factor - The mean factor.
 * @returns {string} - The RGBA background color for the given mean factor.
 */
const computeColor = function (factor) {
    if (factor < 2.0) {
      const a = factor - 1.0;
      const r = (1.0 - a) * 99 + a * 255;
      const g = (1.0 - a) * 191 + a * 236;
      const b = (1.0 - a) * 124 + a * 132;
      return `rgb(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)})`;
    } else {
      const a = Math.min((factor - 2.0) / 2.0, 1.0);
      const r = (1.0 - a) * 255 + a * 249;
      const g = (1.0 - a) * 236 + a * 105;
      const b = (1.0 - a) * 132 + a * 108;
      return `rgb(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)})`;
    }
}