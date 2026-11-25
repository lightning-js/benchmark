import { RECTANGLE_COUNTS } from '../shared/rectangleBenchmark.js';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

/** Render the FPS section in the shared results table, preserving slice errors. */
export const renderRectangleSection = (results, frameworks, frameworkVersions = {}) => {
  const counts = [...new Set(frameworks.flatMap((framework) =>
    Object.keys(results[framework].rectangles || {}).map(Number).filter(Number.isFinite),
  ))].sort((a, b) => a - b);
  if (!counts.length) counts.push(...RECTANGLE_COUNTS);

  const rows = counts.map((count) => {
    const cells = frameworks.map((framework) => {
      const slice = results[framework].rectangles?.[count];
      if (!slice) return '<td>n/a</td>';
      if (slice.error) {
        return `<td><details><summary>FAIL (0 FPS)</summary>${escapeHtml(slice.error)}</details></td>`;
      }
      if (!Number.isFinite(slice.fps)) return '<td>n/a</td>';
      // Include the complete diagnostics in the HTML itself so official copies
      // are self-contained and do not depend on a local raw JSON file.
      const diagnostics = escapeHtml(JSON.stringify(slice, null, 2));
      return `<td><details><summary>${slice.fps.toFixed(2)} FPS</summary><pre>${diagnostics}</pre></details></td>`;
    }).join('');
    return `<tr><th>${count.toLocaleString('en-US')} moving rectangles</th>${cells}</tr>`;
  }).join('\n');

  return `<thead><tr><th>Rectangle rendering (FPS, higher is better)</th>${frameworks.map((framework) =>
    `<th>${escapeHtml(framework)} ${escapeHtml(frameworkVersions[framework] ?? '')}</th>`,
  ).join('')}</tr></thead><tbody>${rows}</tbody>`;
};
