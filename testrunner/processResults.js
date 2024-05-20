export const processResults = (results, memoryResults) => {
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
            memory: memoryResults[f].heap,
            time: memoryResults[f].create,
        }
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

const calculateMean = (value, baseline) => {
    return (value / baseline).toFixed(2);
}

const avgMean = (values) => {
    return (values.reduce((a, b) => a + b) / values.length).toFixed(2);
}
