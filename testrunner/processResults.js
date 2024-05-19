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

    console.log('fastestTimes', fastestTimes);

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
        const timesArray = times.map(t => processedResults[f][t].mean);
        processedResults[f].geometricMean = avgMean(timesArray);
    });

    // add memory results
    frameworks.forEach(f => {
        if (!memoryResults[f]) {
            return;
        }

        processedResults[f].memory = {
            memory: memoryResults[f].memory,
            time: memoryResults[f].create,
        }
    });

    // sort the frameworks by geometric mean
    const sortedFrameworks = frameworks.sort((a, b) => {
        return processedResults[a].geometricMean - processedResults[b].geometricMean;
    });

    return sortedFrameworks.map(f => {
        return {
            name: f,
            results: processedResults[f]
        }
    });
}

const calculateMean = (value, baseline) => {
    return (value / baseline);
}

const avgMean = (values) => {
    return (values.reduce((a, b) => a + b) / values.length).toFixed(2);
}

const test = () => {
    const results = {
        renderer: {
            create: '312.30',
            update: '155.90',
            skipNth: '103.70',
            select: '137.00',
            swap: '216.50',
            remove: '103.70',
            createLots: '1656.10',
            append: '362.70',
            clear: '71.70'
        },
        solid: {
            create: '397.40',
            update: '223.60',
            skipNth: '108.90',
            select: '102.60',
            swap: '703.60',
            remove: '107.70',
            createLots: '2733.50',
            append: '397.20',
            clear: '305.70'
        }
    }

    const memoryResults = {
        renderer: { create: '1323.60', heap: '58.67' },
        solid: { create: '1722.10', heap: '88.98' }
    }

    const processedResults = processResults(results, memoryResults);
    console.log(JSON.stringify(processedResults));
    console.log(processedResults);
}

// test();