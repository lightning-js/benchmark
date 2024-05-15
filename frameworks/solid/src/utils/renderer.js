// workaround because the renderer exposes the on idle events
// this way we can import the renderer and use it in the benchmark
let renderer = null;
export const getRenderer = () => renderer;
export const setRenderer = (r) => renderer = r;