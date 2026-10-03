// CNTR-X16 (L0-xcx16): measures the Orbital figures from src/orbital/ and lists
// every line of the v3 Orbital nodes (adr-orbc, orbc-*, pntr-*, ring-*) that
// still states a figure the code contradicts. Exit 1 while any such line is
// left, 0 once the KV agrees with the code. With --strict-citations, exit 2
// when a row of the report quotes text its cited line does not hold (before
// the edits are applied every row must stand). A rule fires only while the
// code differs from the v3 figure, so a code change back to v3 silences it.
//
//   node docs/feedback/diagnose-CNTR-X16.measure.mjs [--strict-citations]

import { build } from 'esbuild';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nodesDir = join(root, '.ai', 'context', 'analysis', 'nodes');

const engineStub = {
  name: 'engine-stub',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'x', namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'throw new Error("runtime engine import")', loader: 'js' }));
  },
};
const bundle = await build({
  stdin: {
    contents: [
      `export * from './src/orbital/ring-layout.ts';`,
      `export { TARGET_RANGE, distanceToBlock } from './src/orbital/target.ts';`,
      `export { SPAWN_OFFSET, DEFAULT_SPAWN_OFFSET, spawnY } from './src/orbital/spawn.ts';`,
      `export { FALL_SPEED } from './src/orbital/charge.ts';`,
    ].join('\n'),
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [engineStub],
});
const m = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));

/** `name = <number>` read from a source file that cannot be bundled without the engine. */
function sourceConst(rel, pattern) {
  const lines = readFileSync(join(root, rel), 'utf8').split('\n');
  const i = lines.findIndex((l) => pattern.test(l));
  if (i < 0) throw new Error(`${rel}: ${pattern} not found`);
  return { value: Number(lines[i].match(pattern)[1]), at: `${rel}:${i + 1}` };
}

const L = m.RING_LAYOUT;
const diameters = [1, ...L.rings.map((r) => r.d)];
const powers = [L.centre.power, ...L.rings.map((r) => r.power)];
const reach = Math.max(...L.columns.map((c) => Math.max(Math.abs(c.x), Math.abs(c.z))));
const byPower = {};
for (const c of L.columns) byPower[c.power] = (byPower[c.power] ?? 0) + 1;
const perTick = sourceConst('src/orbital/ring.ts', /^export const RING_MAX_BLASTS_PER_TICK = (\d+);/);
const queueAge = sourceConst('src/orbital/ring.ts', /^export const MAX_QUEUE_AGE_TICKS = (\d+);/);
const timeout = sourceConst('src/orbital/flight.ts', /^export const ATTACK_TIMEOUT_TICKS = (\d+);/);
const cooldown = sourceConst('src/legendary/rules.ts', /^export const COOLDOWN_TICKS = (\d+);/);
const old = m.buildColumns([1, 5, 10, 15, 20], [4, 4, 4, 4, 4]);

console.log('# Measured from src/orbital/ (v' + JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version + ')');
console.log(`TARGET_RANGE            ${m.TARGET_RANGE}  (eye to nearest point of the block)`);
console.log(`RING_MIN_RANGE (RMB)    ${m.RING_MIN_RANGE}`);
console.log(`SPAWN_OFFSET            ${JSON.stringify(m.SPAWN_OFFSET)} default ${m.DEFAULT_SPAWN_OFFSET}`);
console.log(`FALL_SPEED              ${m.FALL_SPEED} block/tick -> fuse ${m.SPAWN_OFFSET['minecraft:overworld'] / m.FALL_SPEED} ticks = ${m.SPAWN_OFFSET['minecraft:overworld'] / m.FALL_SPEED / 20} s (Overworld/End), ${m.SPAWN_OFFSET['minecraft:nether'] / m.FALL_SPEED / 20} s (Nether)`);
console.log(`spawnY                  overworld y64 -> ${m.spawnY('minecraft:overworld', 64, { max: 320 })}; nether y120 -> ${m.spawnY('minecraft:nether', 120, { max: 128 })}; the_end y60 -> ${m.spawnY('minecraft:the_end', 60, { max: 256 })}`);
console.log(`ring diameters          ${diameters.join('/')}  radii ${diameters.map((d) => d / 2).join('/')}`);
console.log(`ring powers             ${powers.join('/')}  reach 2x power ${powers.map((p) => 2 * p).join('/')}`);
console.log(`cells per ring          centre 1 + ${L.rings.map((r) => r.cells.length).join(' + ')} = ${L.count} columns; footprint +-${reach}`);
console.log(`columns by power        ${JSON.stringify(byPower)}`);
for (const r of L.rings) {
  const set = new Set(r.cells.map((c) => `${c.x},${c.z}`));
  const degrees = r.cells.map((c) => [-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dz) => (dx || dz) && set.has(`${c.x + dx},${c.z + dz}`))).filter(Boolean).length);
  const err = Math.max(...r.cells.map((c) => Math.abs(Math.hypot(c.x, c.z) - r.r)));
  console.log(`ring d${r.d} invariants     same-ring 8-neighbours ${Math.min(...degrees)}..${Math.max(...degrees)} (cells with >2: ${degrees.filter((d) => d > 2).length}); max |dist - r| ${err.toFixed(3)}`);
}
console.log(`RING_MAX_CHARGES        ${m.RING_MAX_CHARGES}`);
console.log(`blasts per tick         ${perTick.value} (${perTick.at}) -> 1 attack ${Math.ceil(L.count / perTick.value)} ticks, 3 attacks ${Math.ceil((3 * L.count) / perTick.value)} ticks`);
console.log(`MAX_QUEUE_AGE_TICKS     ${queueAge.value} (${queueAge.at}); ATTACK_TIMEOUT_TICKS ${timeout.value} (${timeout.at}); cooldown ${cooldown.value} ticks (${cooldown.at})`);
console.log(`v3 table 1/5/10/15/20   ${old.columns.length} columns (1 + ${old.rings.map((r) => r.cells.length).join(' + ')}), footprint +-10`);

const implemented = existsSync(join(root, 'src', 'orbital', 'index.ts'));
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// Each rule: the v3 figure, whether the code still differs from it, and the text that states it.
const rules = [
  { id: 'aim-10', live: m.TARGET_RANGE !== 10,
    re: /maxDistance: ?10\b|within 10\b(?! ticks)|block within 10\b|\b10[- ]block|range 10\b|RMB up to 10\b|≤ 10\.\s*It passes|(?<!\d)10 blocks\b(?! of)/ },
  { id: 'spawn-30', live: m.SPAWN_OFFSET['minecraft:overworld'] !== 30,
    re: /\+ ?30\b|\.y ?\+ ?30\b|target ?\+ ?30\b|"30 blocks above|terrain \+ 30/ },
  { id: 'fall-1.5s', live: m.SPAWN_OFFSET['minecraft:overworld'] / m.FALL_SPEED !== 30, re: /takes 1\.5 s/ },
  { id: 'diam-1/5/10/15/20', live: !sameList(diameters, [1, 5, 10, 15, 20]),
    re: /1\/5\/10\/15\/20|d = 5\/10\/15\/20|d = 5, 10, 15, 20|\{2\.5, 5, 7\.5, 10\}|(?<!AC-)\brings? (5|10|15|20)\b|ring-(5|15) line/ },
  { id: 'count-145/160', live: L.count < 140 || L.count > 161,
    re: /[~≈] ?1(41|45|60)\b|140–160|141–161|1 \+ ~?16 \+|160 columns|⌈160\/48⌉/ },
  { id: 'cap-200', live: m.RING_MAX_CHARGES !== 200, re: /RING_MAX_CHARGES = 200|hard cap of 200|asserts ≤ 200|at ≤ 200/ },
  { id: 'drain-4/10', live: Math.ceil(L.count / perTick.value) !== 4, re: /≤ 4 ticks|= 4 ticks \(0\.2 s\)|≤ 10 ticks \(0\.5 s\)|drain within 10 ticks/ },
  { id: 'all-power-4', live: !powers.every((p) => p === 4), re: /~480 power-4 explosions/ },
  { id: 'not-implemented', live: implemented,
    re: /not implemented\. There is no `src\/orbital\/`|Analysis only\. `src\/orbital\/` does not exist|"not-implemented"|"blocked:L0-xq5"|Task creation is blocked|\*\*Blocked\*\* until `L0-xq5`/ },
];

const files = readdirSync(nodesDir).filter((f) => /^(orbc|ring|pntr|adr-orbc)/.test(f)).sort();
const hits = [];
for (const f of files) {
  readFileSync(join(nodesDir, f), 'utf8').split('\n').forEach((line, i) => {
    for (const r of rules) if (r.live && r.re.test(line)) hits.push(`${f}:${i + 1} [${r.id}] ${line.trim().slice(0, 140)}`);
  });
}
console.log(`\n# v3 figures still stated in ${files.length} Orbital nodes: ${hits.length} line-rule hits`);
for (const h of hits) console.log(h);

// Every edit-list row of the report, "- `stem:line` — «old» → …" or "= «old»",
// must quote text that stands on that line today: a wrong address is caught here.
const reportPath = join(root, 'docs', 'feedback', 'diagnose-CNTR-X16.md');
const bad = [];
let rows = 0;
if (existsSync(reportPath)) {
  const nodeFiles = readdirSync(nodesDir);
  for (const row of readFileSync(reportPath, 'utf8').split('\n')) {
    const m = row.match(/^- `([^`]+?):(\d+)` [—=] «(.+?)»/);
    if (m === null) continue;
    rows++;
    const [, stem, n, old] = m;
    const file = stem.includes('/') ? join(root, stem) : join(nodesDir, nodeFiles.find((f) => f === `${stem}.md` || f.startsWith(`${stem}__`)) ?? `${stem}?`);
    const line = existsSync(file) ? readFileSync(file, 'utf8').split('\n')[Number(n) - 1] ?? '' : '';
    if (!line.includes(old)) bad.push(`${stem}:${n} does not contain «${old}»`);
  }
}
console.log(`\n# report citations: ${rows - bad.length}/${rows} still stand on the cited line, ${bad.length} gone (applied, or a wrong address)`);
for (const b of bad) console.log(`GONE ${b}`);
const strict = process.argv.includes('--strict-citations');
process.exit(strict && bad.length > 0 ? 2 : hits.length > 0 ? 1 : 0);
