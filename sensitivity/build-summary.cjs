// Rebuild the public summary figure from the curated aggregate results.
const fs = require('node:fs');
const path = require('node:path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/results.json'), 'utf8'));
const rows = data.rows.filter(row => row.family === 'SPM 6 mm / matched LSS' && row.estimator === 'SPM12 LSS' && row.ratingNorm === 'Raw');
const short = value => value
  .replace('Trial voxel z ', 'Trial z ')
  .replace(' → image mean', ' → mean')
  .replace('Source-wise z (60 images/source)', 'Source-wise image z')
  .replace('Pooled z (120 images)', 'Pooled image z')
  .replace(' → pooled image z', ' + pooled image z')
  .replace(' → source image z', ' + source image z');
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const max = Math.max(...rows.flatMap(row => [row.natural, row.ai]));
const color = (value, source) => {
  if (value === 0) return '#f0f3f5';
  const t = Math.log10(value + 1) / Math.log10(max + 1);
  const light = Math.round(90 - 45 * t);
  return source === 'Natural' ? `hsl(218 65% ${light}%)` : `hsl(24 66% ${light}%)`;
};
const fmt = value => value.toLocaleString('en-US');
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img" aria-labelledby="title desc">
<title id="title">Searchlight sensitivity summary</title><desc id="desc">Twelve SPM12 LSS beta normalization choices with raw ratings; each row compares Natural and AI surviving voxel counts after per-map FDR q less than .05 and clusters of at least 10 voxels.</desc>
<rect width="1200" height="720" fill="white"/><style>text{font-family:Arial,Helvetica,sans-serif;fill:#1e3342}.head{font-size:29px;font-weight:700}.sub{font-size:16px;fill:#566875}.label{font-size:15px}.num{font-size:15px;font-weight:700}.col{font-size:16px;font-weight:700}.foot{font-size:13px;fill:#657784}</style>
<text x="36" y="48" class="head">Analysis choices change the searchlight map</text><text x="36" y="78" class="sub">SPM 6 mm · SPM12 LSS · 5-voxel radius · raw GPT ratings · n = 30</text>
<rect x="35" y="110" width="1130" height="48" rx="4" fill="#eaf0f3"/><text x="47" y="140" class="col">Beta normalization</text><text x="772" y="140" class="col">Natural</text><text x="972" y="140" class="col">AI</text>`;
rows.forEach((row, i) => {
  const y = 163 + i * 42;
  svg += `<rect x="35" y="${y}" width="1130" height="40" fill="${i % 2 ? '#f7f9fa' : '#fff'}"/>
    <text x="47" y="${y + 26}" class="label">${esc(short(row.betaNorm))}</text>
    <rect x="745" y="${y + 5}" width="170" height="30" rx="3" fill="${color(row.natural, 'Natural')}"/>
    <text x="830" y="${y + 26}" text-anchor="middle" class="num">${fmt(row.natural)}</text>
    <rect x="944" y="${y + 5}" width="170" height="30" rx="3" fill="${color(row.ai, 'AI')}"/>
    <text x="1029" y="${y + 26}" text-anchor="middle" class="num">${fmt(row.ai)}</text>`;
});
svg += `<text x="36" y="695" class="foot">Surviving positive voxels · per-map voxelwise FDR q &lt; .05 · clusters ≥10 · color intensity uses a logarithmic scale</text></svg>`;
fs.writeFileSync(path.join(__dirname, '../media/sensitivity-summary.svg'), svg);
console.log(`Wrote summary figure with ${rows.length} rows`);
