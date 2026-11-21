const groupLabels = new Map([
  ['SPM 6 mm / matched LSS|SPM12 LSS', 'SPM 6 mm · SPM12 LSS'],
  ['SPM 6 mm / matched LSS|GLMsingle Type-B LSS', 'SPM 6 mm · GLMsingle Type-B LSS'],
  ['60-image estimator comparison|GLMsingle Type-D treatment: fixed HRF + GLMdenoise + fractional ridge', 'SPM 6 mm · GLMsingle Type-D'],
  ['60-image estimator comparison|SPM12 LSS: one target trial versus all other trials', 'fMRIPrep 4 mm · SPM12 LSS']
]);
const groupFor = row => groupLabels.get(`${row.family}|${row.estimator}`) || `${row.family} · ${row.estimator}`;
const compactBeta = value => value.replace('Trial voxel z ', 'Trial z ').replace(' → image mean', ' → mean').replace('Source-wise z (60 images/source)', 'Source-wise image z').replace('Pooled z (120 images)', 'Pooled image z');
const compactRating = value => value.replace(' (60 images/source)', '').replace(' (120 images)', '').replace('Raw GPT valence/arousal ratings', 'Raw');
const format = value => Number(value).toLocaleString('en-US');
const filterGroup = document.getElementById('group-filter');
const filterBeta = document.getElementById('beta-filter');
const filterRating = document.getElementById('rating-filter');
const chart = document.getElementById('chart');
const tbody = document.getElementById('results-body');
let rows = [];

function addOptions(select, values) {
  for (const value of [...new Set(values)].sort((a, b) => a.localeCompare(b))) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
}
function cell(tr, content, className = '') {
  const td = document.createElement('td');
  td.textContent = content;
  if (className) td.className = className;
  tr.append(td);
}
function draw() {
  const visible = rows.filter(row =>
    (filterGroup.value === 'all' || groupFor(row) === filterGroup.value) &&
    (filterBeta.value === 'all' || row.betaNorm === filterBeta.value) &&
    (filterRating.value === 'all' || row.ratingNorm === filterRating.value)
  );
  chart.replaceChildren();
  tbody.replaceChildren();
  document.getElementById('result-count').textContent = format(visible.length);
  document.getElementById('chart-count').textContent = `${visible.length} configurations · log scale (zero shown as empty)`;
  const max = Math.max(1, ...rows.flatMap(row => [row.natural, row.ai]));
  visible.forEach((row, index) => {
    const label = `${groupFor(row)} · ${compactBeta(row.betaNorm)} · ${compactRating(row.ratingNorm)} · ${row.radius}`;
    const barRow = document.createElement('div');
    barRow.className = 'chart-row';
    barRow.title = label;
    const name = document.createElement('span');
    name.className = 'chart-label';
    name.textContent = `${index + 1}. ${compactBeta(row.betaNorm)} / ${compactRating(row.ratingNorm)}`;
    barRow.append(name);
    for (const source of ['natural', 'ai']) {
      const track = document.createElement('div');
      track.className = 'chart-bar-track';
      const bar = document.createElement('div');
      bar.className = `chart-bar ${source}`;
      bar.style.width = row[source] === 0 ? '0%' : `${100 * Math.log10(row[source] + 1) / Math.log10(max + 1)}%`;
      track.append(bar);
      const count = document.createElement('span');
      count.className = 'chart-value';
      count.textContent = format(row[source]);
      barRow.append(track, count);
    }
    chart.append(barRow);
    const tr = document.createElement('tr');
    cell(tr, row.preprocessing);
    cell(tr, row.estimator);
    cell(tr, row.radius);
    cell(tr, row.betaNorm);
    cell(tr, row.ratingNorm);
    cell(tr, format(row.natural), 'number');
    cell(tr, format(row.ai), 'number');
    tbody.append(tr);
  });
  chart.setAttribute('aria-label', `Log-scale bar chart for ${visible.length} completed configurations, with Natural and AI surviving voxel counts`);
}
fetch('data/results.json').then(response => {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}).then(data => {
  rows = data.rows.sort((a, b) => groupFor(a).localeCompare(groupFor(b)) || a.betaNorm.localeCompare(b.betaNorm) || a.ratingNorm.localeCompare(b.ratingNorm));
  addOptions(filterGroup, rows.map(groupFor));
  addOptions(filterBeta, rows.map(row => row.betaNorm));
  addOptions(filterRating, rows.map(row => row.ratingNorm));
  [filterGroup, filterBeta, filterRating].forEach(select => select.addEventListener('change', draw));
  draw();
}).catch(error => {
  chart.textContent = `The results table could not load: ${error.message}`;
  document.getElementById('chart-count').textContent = 'Data unavailable';
});
