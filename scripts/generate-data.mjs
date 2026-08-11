import { readFile, writeFile } from 'node:fs/promises';

const [, , input = '古辞書.csv', output = 'data-v3.js'] = process.argv;

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (char !== '\r') field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  if (quoted) throw new Error('CSVの引用符が閉じていない');
  return rows;
}

const table = parseCsv((await readFile(input, 'utf8')).replace(/^\uFEFF/, ''));
const headers = table.shift();
const required = ['URL', '辞書名', '巻', '頁', '面'];
if (!headers || headers.join(',') !== required.join(',')) throw new Error(`CSVの列は${required.join(',')}の順にする`);

const rows = table.filter(row => row.some(Boolean)).map((row, index) => {
  if (row.length !== headers.length) throw new Error(`${index + 2}行目の列数が正しくない`);
  return Object.fromEntries(headers.map((header, column) => [header, row[column]]));
});

const json = JSON.stringify(rows).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
await writeFile(output, `window.KOJISHO_DATA=${json};\n`, 'utf8');
console.log(`${rows.length}件を${output}へ出力した`);
