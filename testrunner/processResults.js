/**
 * Processes the benchmark results and calculates various metrics.
 * 
 * @typedef {import('./types/results.js').Results} Results
 * @typedef {import('./types/memoryResults.js').MemoryResults} MemoryResults
 * @typedef {import('./types/fileSizeResults.js').FileSizeResults} FileSizeResultsObject
 * 
 * @param {Results} results - The benchmark results object.
 * @param {MemoryResults} memoryResults - The memory results object.
 * @param {FileSizeResultsObject} fileSizeResults - The file size results object.
 * @returns {Object} - The processed and sorted results object.
 */
export const processResults = (results, memoryResults, fileSizeResults) => {
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
        const framework = results[f] || {};
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
        const framework = results[f] || {};
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