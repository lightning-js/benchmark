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
            processedResults[f][t] = {
                mean: calculateMean(framework[t], fastestTimes[t]),
                time: framework[t]
            }
        });

        // geometric mean of all means
        const timesArray = times.map(t => parseFloat(processedResults[f][t].mean));
        processedResults[f].avgMean = avgMean(timesArray);
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

    // sort the frameworks by geometric mean
    const sortedFrameworks = frameworks.sort((a, b) => {
        return processedResults[a].geometricMean - processedResults[b].geometricMean;
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
 * @returns {string} - The calculated mean value.
 */
const calculateMean = (value, baseline) => {
    return (value / baseline).toFixed(2);
}

/**
 * Calculates the average mean value from an array of values.
 * @param {number[]} values - The array of values to calculate the average mean for.
 * @returns {string} - The calculated average mean value.
 */
const avgMean = (values) => {
    return (values.reduce((a, b) => a + b) / values.length).toFixed(2);
}
