/**
 * @typedef {Object} ResultsObject
 * @property {string} name - The name of the test.
 * @property {number} time - Time in milliseconds.
 * 
 * @typedef {Object} Result
 * @property {ResultsObject} create - The create operation result.
 * @property {ResultsObject} update - The update operation result.
 * @property {ResultsObject} skipNth - The skipNth operation result.
 * @property {ResultsObject} select - The select operation result.
 * @property {ResultsObject} swap - The swap operation result.
 * @property {ResultsObject} remove - The remove operation result.
 * @property {ResultsObject} createLots - The createLots operation result.
 * @property {ResultsObject} append - The append operation result.
 * @property {ResultsObject} clear - The clear operation result.
 * 
 * @typedef {Object} Results
 * @property {string} framework - The directory of the test.
 * @property {Result} result - The benchmark results.
 */

export {}