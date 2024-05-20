import { chromium } from 'playwright';

export const getBrowserVersion = async () => {
    const browser = await chromium.launch({ 
        headless: true
    });

    const browserVersion = `Chromium ${await browser.version()}`;
    await browser.close();

    return browserVersion;
}

export const runBenchmark = async (url) => {
    if (!url) throw new Error('url is required');

    let resolve;
    const donePromise = new Promise((r) => {
        resolve = r;
    });

    // Setup
    const browser = await chromium.launch({ 
        headless: false
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
    });

    const page = await context.newPage();

    const exit = async (results) => {
        // Teardown
        await context.close();
        await browser.close();
        resolve(results);
    };

    // The actual interesting bit
    await page.goto(url);

    const title = await page.title();
    console.log('Loaded: ', title);

    // set CPU to 6x slowdown
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

    // create 5 min timeout
    const timeout = setTimeout(() => {
        console.error('Timeout!');
        exit();
    }, 1000 * 60 * 5);

    const collectJsHeap = async () => {
        await client.send('Performance.enable');
        const performanceMetrics = await client.send('Performance.getMetrics');
        await client.send('Performance.disable');
        return performanceMetrics.metrics.find(m => m.name === 'JSHeapUsedSize').value;
    }

    page.on('console', async msg => { 
        if (msg.text().includes('Done!')) {
            clearTimeout(timeout);

            const results = await msg.args()[1].jsonValue(); // hello
            console.log('results: ', results);
            exit(results);
        }

        if (msg.text().includes('Memory!')) {
            const jsheap = await collectJsHeap();
            const heapInMB = (jsheap / 1024 / 1024).toFixed(2);

            const results = await msg.args()[1].jsonValue(); // hello
            console.log('JS Heap: ', heapInMB, 'MB');
            exit({ ...results, heap: heapInMB})
        }
    });

    return donePromise;
}