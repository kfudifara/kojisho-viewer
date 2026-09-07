import { readFile, writeFile } from 'node:fs/promises';

const [, , input = '古辞書.csv'] = process.argv;
const text = (await readFile(input, 'utf8')).replace(/^\uFEFF/, '');
const lines = text.split(/\r?\n/).filter(Boolean);
const [header, ...rows] = lines;
const parsed = rows.map((line, index) => {
  const columns = line.split('\t');
  const match = columns[0]?.match(/\/pid\/(\d+)\/1\/(\d+)$/);
  if (!match) throw new Error(`${index + 2}行目のURLがNDLコマURLではない`);
  return { line, pid: Number(match[1]), frame: Number(match[2]), index };
});
parsed.sort((a, b) => a.pid - b.pid || a.frame - b.frame || a.index - b.index);
await writeFile(input, `\uFEFF${header}\n${parsed.map(row => row.line).join('\n')}\n`, 'utf8');
console.log(`${parsed.length}行をPID・コマ番号の数値順へ並べ替えた`);
