/**
 * A single cold-startup measurement for one framework: N sequential cold loads
 * (fresh browser context each) from navigation start to first idle after
 * rendering 1,000 rows, including JS download/parse/execute.
 *
 * @typedef {Object} StartupResult
 * @property {string|number} startup - Mean startup time formatted as `"<avg>ms ±<spread>"`, or `-1` when every run failed.
 * @property {number} average - Mean of the successful runs in milliseconds.
 * @property {number} spread - Max minus min of the successful runs in milliseconds.
 * @property {number} min - Fastest successful run in milliseconds.
 * @property {number[]} runs - All successful per-run measurements in milliseconds.
 * @property {number} wallAverage - Mean Playwright wall-clock time per run in milliseconds (cross-check).
 *
 * @typedef {Object} StartupResults
 * @property {string} framework - The framework name.
 * @property {StartupResult} results - The startup benchmark results.
 */

export {}
