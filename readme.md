# Lightning JS Benchmark suite

Allows the user to test various configurations with the Lightning JS project.
Similar to https://github.com/krausest/js-framework-benchmark the Lightning JS benchmark will execute a series of operations to measure the throughput of the framework.

For the official results please see https://lightning-js.github.io/benchmark/

## Operations

The following operations will be executed:
- Create 1,000 rows (5 warmup runs)
- Update all 1,000 rows (5 warmup runs)
- Partial update, update every 10th row for 1,000 rows (3 warmup runs)
- Select row, change color of a selected row (5 warmup runs)
- Swap row, swap 2 rows for a table with 1,000 rows (5 warmup runs)
- Remove row, remove 1 row (5 warm up runs)
- Create many rows, create 10,000 rows (5 warmup runs)
- Append rows to large table, appending 1,000 rows to a table of 1,000 rows (5 warmup runs)
- Cold startup, load the app and render 1,000 rows to the first frame (7 cold loads, fresh browser context per run, 6x CPU slowdown applied before navigation so JS fetch/parse is included; reported separately from the throughput average)

To run only the startup benchmark (skips the throughput and memory benchmarks, useful for validating startup functionality), serve `dist/` and pass the flag directly to the runner:

`npx http-server -c-1 ./dist/` (terminal 1)

`node index.js --startup-only` (terminal 2, combine with `--results` to also copy to `official_results/`)

Tune the number of cold loads per framework with `STARTUP_RUNS` (default 7) and force headless Chromium with `HEADLESS=true`.

## Compare mode (regression check for renderer / FTL release PRs)

Compares two already-built `dist/<dir>` bundles back-to-back on the same machine/browser and fails when the candidate regresses beyond a threshold. Intended to run infrequently (e.g. version bumps / release PRs), since the full throughput suite is slow.

`npx http-server -c-1 ./dist/` (terminal 1)

`node index.js --compare --base renderer-base --current renderer-pr --threshold 10` (terminal 2)

- `--base <dist-dir>` / `--current <dist-dir>`: required, must exist under `dist/`. Build them first, e.g. build `main` into `dist/renderer-base` and the PR into `dist/renderer-pr` (for FTL: `ftl-base` / `ftl-pr`).
- `--threshold <pct>`: allowed % slowdown, default `10`. Gates on overall `avgMean`, startup average, and bundle size.
- `--strict`: also fail when any single op (or memory heap/time) exceeds the threshold. Default reports per-op regressions without failing.
- `--startup-only`: only compare cold startup + bundle size (much faster, more stable — best for frequent CI).
- Writes `results/compare_<base>_vs_<current>.json` (machine-readable artifact), `results/compare_<base>_vs_<current>.md` (paste into a PR comment or CI step summary), plus the standard side-by-side HTML report. Exit code is `1` on regression, `0` otherwise.

Example for a renderer release PR (run once, same job/machine):

```
# base from main, current from the PR
cp -r dist/renderer dist/renderer-base
# ... rebuild dist/renderer-pr from the PR source ...
node index.js --compare --base renderer-base --current renderer-pr --threshold 10
```

## Why not use js-framework-benchmark

Two reasons:
1) LightningJS is a WebGL framework, `js-framework-benchmark` tests for DOM elements
2) We want to run this on a TV

## Baseline

The baseline is the direct renderer API against which we will compare Application Development frameworks

# Instructions

## Install this

Clone the repository:

`git clone <repo>`

Setup the framework:

`npm run setup`

This should install the dependencies, build the frameworks and copy the frameworks to the dist folder.

If this is the first time that you are using PlayWright (https://playwright.dev/) please make sure you install the PlayWright dependencies by running:

`npm run setup:playwright`


You can also run individual commands by doing:

`npm run build:<x>`

To build a framework or if you want to copy the files:

`npm run copy:<x>`

# Implemented weighted results

As of v0.0.2 the Lightning Benchmark implements weighted mean results for different operations. Not all operations are equal when executed, certain framework operations hold a higher weight in terms of measurable impact. The weights used as similar to [https://github.com/krausest/js-framework-benchmark/wiki/Computation-of-the-weighted-geometric-mean](Krauset) and are setup as follows:

| test | weight |
| ---- | ------ |
| create | 0.64 |
| update | 0.56 |
| skipNth | 0.56 |
| select | 0.19 |
| swap | 0.13 |
| remove | 0.53 |
| createLots | 0.56 |
| append | 0.55 |
| clear | 0.42 |

