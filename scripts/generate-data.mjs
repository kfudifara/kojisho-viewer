import { readFile, writeFile } from 'node:fs/promises';

const [, , input = '古辞書.csv', output = 'data-v3.js'] = process.argv;

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (char !== '\r') field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  if (quoted) throw new Error('CSVの引用符が閉じていない');
  return rows;
}

const source = (await readFile(input, 'utf8')).replace(/^\uFEFF/, '');
const table = parseCsv(source, source.includes('\t') ? '\t' : ',');
const headers = table.shift();
const required = ['URL', '異本', '辞書', '形式', '右巻', '右頁', '右面', '左巻', '左頁', '左面'];
if (!headers || headers.join(',') !== required.join(',')) throw new Error(`CSVの列は${required.join(',')}の順にする`);

const frames = table.filter(row => row.some(Boolean)).map((row, index) => {
  if (row.length !== headers.length) throw new Error(`${index + 2}行目の列数が正しくない`);
  return Object.fromEntries(headers.map((header, column) => [header, row[column]]));
});

const locations = frames.flatMap(frame => {
  const dictionaryName = `${frame['異本']}${frame['辞書']}`;
  const noVolume = frame['異本'] === '世尊寺本' && frame['辞書'] === '字鏡';
  return [['右', noVolume ? 'NA' : frame['右巻'], frame['右頁'], frame['右面']], ['左', noVolume ? 'NA' : frame['左巻'], frame['左頁'], frame['左面']]]
    .filter(([, , page]) => page !== 'NA')
    .map(([, volume, page, face]) => ({ URL: frame.URL, 辞書名: dictionaryName, 巻: volume === 'NA' ? '' : volume, 頁: page, 面: face === 'NA' ? 'なし' : face }));
});
const normalizedFrames = frames.map(frame => {
  const dictionaryName = `${frame['異本']}${frame['辞書']}`;
  const noVolume = frame['異本'] === '世尊寺本' && frame['辞書'] === '字鏡';
  const rightVolume = noVolume ? 'NA' : frame['右巻'], leftVolume = noVolume ? 'NA' : frame['左巻'];
  const volume = rightVolume !== 'NA' ? rightVolume : (leftVolume !== 'NA' ? leftVolume : '');
  return { URL: frame.URL, 辞書名: dictionaryName, 巻: volume, 形式: frame['形式'], 右巻: rightVolume, 右頁: frame['右頁'], 右面: frame['右面'], 左巻: leftVolume, 左頁: frame['左頁'], 左面: frame['左面'] };
});
const json = JSON.stringify({ frames: normalizedFrames, locations }).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
await writeFile(output, `window.KOJISHO_DATA=${json};\n`, 'utf8');
console.log(`${frames.length}コマ・${locations.length}掲載箇所を${output}へ出力した`);
