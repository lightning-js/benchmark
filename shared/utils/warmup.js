let i = 0;
export const warmup = (fn, argument, count = 5) => {
    return new Promise((resolve) => {
        const runWarmup = (fn, argument, count) => {
            // check if arguments is an array
            if (!Array.isArray(argument)) {
                argument = [argument];
            }

            fn(...argument).then(() => {
                i++;
                if (i < count) {
                    return setTimeout(() => {
                        runWarmup(fn, argument, count);
                    }, 100);
                }
    
                i = 0;
                resolve();
            });
        }

        runWarmup(fn, argument, count);
    });
}