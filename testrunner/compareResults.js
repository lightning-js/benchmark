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
 * Pure comparison logic for `--compare` runs.
 * No browser or filesystem access here so the math stays unit-testable.
 * All I/O (running benchmarks, writing JSON/markdown) lives in `index.js`.
 * @module compareResults
 */

/**
 * Throughput ops measured by `runBenchmark` (in-page `Done!` payload).
 */
export const COMPARE_OPS = [
    'create',
    'update',
    'skipNth',
    'select',
    'swap',
    'remove',
    'createLots',
    'append',
    'clear',
];

/**
 * Parses values like `40.00ms ±5.00`, `40.00`, `58.67` or `40` into ms.
 * Returns NaN when unparseable (e.g. missing/failed runs reported as -1 stay -1).
 * @param {number|string} value
 * @returns {number}
 */
export const parseMs = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return NaN;
    return parseFloat(value);
};

/**
 * Percent change of current vs base.
 * @param {number} base
 * @param {number} current
 * @returns {{delta: number, pct: number}}
 */
export const deltaPct = (base, current) => {
    if (!Number.isFinite(base) || !Number.isFinite(current) || base <= 0) {
        return { delta: NaN, pct: NaN };
    }
    const delta = current - base;
    return { delta, pct: (delta / base) * 100 };
};

/**
 * Compares one metric against the regression threshold.
 * Positive pct above threshold = regression. Improvements never fail.
 * @param {number} base
 * @param {number} current
 * @param {number} thresholdPct
 * @returns {{base: number, current: number, delta: number, pct: number, regressed: boolean}}
 */
const compareMetric = (base, current, thresholdPct) => {
    const { delta, pct } = deltaPct(base, current);
    return {
        base,
        current,
        delta,
        pct,
        regressed: Number.isFinite(pct) && pct > thresholdPct,
    };
};

/**
 * Compares base vs current benchmark runs.
 *
 * Gating (overall `regressed`):
 * - full mode: `avgMean` OR `startup` OR `fileSize` exceeding threshold fails.
 * - startup-only mode: `startup` OR `fileSize` exceeding threshold fails.
 * - per-op / memory regressions are reported always, but only fail with `strict: true`
 *   (memory heap/time stays advisory unless strict, it is too noisy for shared CI runners).
 *
 * @param {Object} input
 * @param {import('./types/results.js').Results} input.results - Raw throughput results per dir.
 * @param {import('./types/memoryResults.js').MemoryResults} input.memoryResults - Raw memory results per dir.
 * @param {import('./types/startupResults.js').StartupResults} input.startupResults - Raw startup results per dir.
 * @param {import('./types/fileSizeResults.js').FileSizeResults} input.fileSizeResults - Raw bundle bytes per dir.
 * @param {Object} input.processedResults - Output of `processResults`/`processStartupResults` for [base, current].
 * @param {string} input.base - Dist dir of the baseline (e.g. `renderer-base`).
 * @param {string} input.current - Dist dir of the candidate (e.g. `renderer-pr`).
 * @param {number} [input.thresholdPct=10] - Allowed % slowdown before failing.
 * @param {boolean} [input.strict=false] - Fail on any single op/memory regression too.
 * @param {boolean} [input.startupOnly=false] - Only startup + fileSize were measured.
 * @returns {Object} Comparison with per-metric details and overall `regressed` flag.
 */
export const compareBenchmarks = ({
    results = {},
    memoryResults = {},
    startupResults = {},
    fileSizeResults = {},
    processedResults = {},
    base,
    current,
    thresholdPct = 10,
    strict = false,
    startupOnly = false,
}) => {
    if (!base) throw new Error('base is required');
    if (!current) throw new Error('current is required');

    const ops = {};
    const regressedOps = [];

    if (!startupOnly) {
        for (const op of COMPARE_OPS) {
            const baseMs = parseMs(results[base]?.[op]);
            const currentMs = parseMs(results[current]?.[op]);
            // Skip ops that failed on either side (missing or -1); they cannot be compared.
            if (!Number.isFinite(baseMs) || !Number.isFinite(currentMs) || baseMs < 0 || currentMs < 0) {
                ops[op] = { base: baseMs, current: currentMs, delta: NaN, pct: NaN, regressed: false, skipped: true };
                continue;
            }
            const compared = compareMetric(baseMs, currentMs, thresholdPct);
            ops[op] = { ...compared, skipped: false };
            if (compared.regressed) regressedOps.push(op);
        }
    }

    // avgMean is dimensionless (mean of weighted means, ~1.0); compare directly.
    let avgMean = null;
    if (!startupOnly) {
        const baseAvg = parseFloat(processedResults[base]?.avgMean);
        const currentAvg = parseFloat(processedResults[current]?.avgMean);
        if (Number.isFinite(baseAvg) && Number.isFinite(currentAvg)) {
            avgMean = compareMetric(baseAvg, currentAvg, thresholdPct);
        } else {
            avgMean = { base: baseAvg, current: currentAvg, delta: NaN, pct: NaN, regressed: false, skipped: true };
        }
    }

    // Startup: prefer the raw numeric average over parsing the display string.
    const baseStartupRaw = startupResults[base];
    const currentStartupRaw = startupResults[current];
    const baseStartupMs = baseStartupRaw ? (Number.isFinite(baseStartupRaw.average) ? baseStartupRaw.average : parseMs(baseStartupRaw.startup)) : NaN;
    const currentStartupMs = currentStartupRaw ? (Number.isFinite(currentStartupRaw.average) ? currentStartupRaw.average : parseMs(currentStartupRaw.startup)) : NaN;
    let startup = null;
    if (Number.isFinite(baseStartupMs) && Number.isFinite(currentStartupMs) && baseStartupMs >= 0 && currentStartupMs >= 0) {
        startup = compareMetric(baseStartupMs, currentStartupMs, thresholdPct);
    } else {
        startup = { base: baseStartupMs, current: currentStartupMs, delta: NaN, pct: NaN, regressed: false, skipped: true };
    }

    // Bundle size in bytes (raw); displayed as KB elsewhere.
    const baseBytes = fileSizeResults[base];
    const currentBytes = fileSizeResults[current];
    let fileSize = null;
    if (Number.isFinite(baseBytes) && Number.isFinite(currentBytes)) {
        fileSize = compareMetric(baseBytes, currentBytes, thresholdPct);
    } else {
        fileSize = { base: baseBytes, current: currentBytes, delta: NaN, pct: NaN, regressed: false, skipped: true };
    }

    // Memory is advisory-only unless strict (shared CI runners make heap noisy).
    let memory = null;
    const baseMem = memoryResults[base];
    const currentMem = memoryResults[current];
    if (!startupOnly && baseMem && currentMem) {
        const baseHeap = parseFloat(baseMem.heap);
        const currentHeap = parseFloat(currentMem.heap);
        const baseTime = parseMs(baseMem.create);
        const currentTime = parseMs(currentMem.create);
        memory = {
            heap: Number.isFinite(baseHeap) && Number.isFinite(currentHeap)
                ? compareMetric(baseHeap, currentHeap, thresholdPct)
                : { base: baseHeap, current: currentHeap, delta: NaN, pct: NaN, regressed: false, skipped: true },
            time: Number.isFinite(baseTime) && Number.isFinite(currentTime) && baseTime >= 0 && currentTime >= 0
                ? compareMetric(baseTime, currentTime, thresholdPct)
                : { base: baseTime, current: currentTime, delta: NaN, pct: NaN, regressed: false, skipped: true },
        };
    }

    const memoryRegressed = Boolean(
        strict && memory && (!memory.heap.skipped && !memory.time.skipped) &&
        (memory.heap.regressed || memory.time.regressed)
    );

    const regressed = Boolean(
        (avgMean && !avgMean.skipped && avgMean.regressed) ||
        (startup && !startup.skipped && startup.regressed) ||
        (fileSize && !fileSize.skipped && fileSize.regressed) ||
        (strict && regressedOps.length > 0) ||
        memoryRegressed
    );

    return {
        base,
        current,
        thresholdPct,
        strict,
        startupOnly,
        ops,
        regressedOps,
        avgMean,
        startup,
        fileSize,
        memory,
        regressed,
    };
};

/**
 * Formats a ms delta/pct cell for markdown.
 * @param {{delta: number, pct: number, skipped?: boolean}} metric
 * @param {string} unit
 * @returns {string}
 */
const formatChange = (metric, unit = 'ms') => {
    if (!metric || metric.skipped || !Number.isFinite(metric.pct)) return 'n/a';
    const sign = metric.delta > 0 ? '+' : '';
    return `${sign}${metric.delta.toFixed(2)}${unit} (${sign}${metric.pct.toFixed(2)}%)`;
};

/**
 * Renders a comparison as Markdown for PR comments / CI step summaries.
 * @param {Object} comparison - Output of `compareBenchmarks`.
 * @param {Object} [meta]
 * @param {string} [meta.browserVersion]
 * @param {Object} [meta.frameworkVersions]
 * @returns {string}
 */
export const formatComparisonMarkdown = (comparison, meta = {}) => {
    const { base, current, thresholdPct, strict, startupOnly, ops, avgMean, startup, fileSize, memory, regressed } = comparison;
    const lines = [];
    lines.push(`# Benchmark comparison: \`${base}\` vs \`${current}\``);
    lines.push('');
    lines.push(`Threshold: +${thresholdPct}% ${strict ? '(strict: any op fails)' : '(gates on overall/startup/bundle)'}` + (startupOnly ? ' · startup-only' : ''));
    if (meta.browserVersion) lines.push(`Browser: ${meta.browserVersion}`);
    if (meta.frameworkVersions) {
        lines.push(`Versions: \`${base}\` ${meta.frameworkVersions[base] ?? ''} vs \`${current}\` ${meta.frameworkVersions[current] ?? ''}`);
    }
    lines.push('');
    lines.push(`## Verdict: ${regressed ? '❌ REGRESSION' : '✅ NO REGRESSION'}`);
    lines.push('');

    if (!startupOnly && avgMean && !avgMean.skipped) {
        lines.push(`- Overall (avgMean): ${avgMean.base.toFixed(2)} → ${avgMean.current.toFixed(2)} ${formatChange(avgMean, '')} ${avgMean.regressed ? '❌' : '✅'}`);
    }
    if (startup && !startup.skipped) {
        lines.push(`- Startup (avg): ${startup.base.toFixed(2)}ms → ${startup.current.toFixed(2)}ms (${formatChange(startup)}) ${startup.regressed ? '❌' : '✅'}`);
    } else {
        lines.push(`- Startup: n/a (a side failed to report)`);
    }
    if (fileSize && !fileSize.skipped) {
        lines.push(`- Bundle: ${(fileSize.base / 1024).toFixed(2)}KB → ${(fileSize.current / 1024).toFixed(2)}KB (${formatChange({ ...fileSize, delta: fileSize.delta / 1024, }, 'KB')}) ${fileSize.regressed ? '❌' : '✅'}`);
    }
    if (memory && (!memory.heap.skipped || !memory.time.skipped)) {
        const heap = memory.heap.skipped ? 'n/a' : `${memory.heap.base}MB → ${memory.heap.current}MB (${formatChange(memory.heap, 'MB')})`;
        lines.push(`- Memory heap: ${heap}${strict && memory.heap.regressed ? ' ❌' : ''}`);
    }
    lines.push('');

    if (!startupOnly) {
        lines.push('| Op | Base | Current | Change | Status |');
        lines.push('| --- | --- | --- | --- | --- |');
        for (const op of COMPARE_OPS) {
            const m = ops[op];
            if (!m || m.skipped) {
                lines.push(`| ${op} | n/a | n/a | n/a | ⚠️ skipped |`);
                continue;
            }
            lines.push(`| ${op} | ${m.base.toFixed(2)}ms | ${m.current.toFixed(2)}ms | ${formatChange(m)} | ${m.regressed ? '❌' : '✅'} |`);
        }
    }

    return lines.join('\n') + '\n';
};
