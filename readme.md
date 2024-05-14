# Lightning JS Benchmark suite

Allows the user to test various configurations with the Lightning JS project.
Similar to https://github.com/krausest/js-framework-benchmark the Lightning JS benchmark will execute a series of operations to measure the throughput of the framework.

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

## Why not use js-framework-benchmark

Two reasons:
1) LightningJS is a WebGL framework, `js-framework-benchmark` tests for DOM elements
2) We want to run this on a TV

## Baseline

The baseline is the direct renderer API against which we will compare Application Development frameworks

# Instructions

TBD.