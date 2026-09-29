// CX-L0-12 check, code side: builds the four templates from this checkout and
// reads the .mcstructure files a server actually loads, then asserts the sizes
// and contents the report quotes. Exit 0 = the shipped structures are as stated.
//
//   node docs/feedback/diagnose-CNTR-XCX12-AA-sizes.mjs <deployed structures/andrew dir>

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildStructures } from '../../scripts/build-structures.mjs';
import { parseMcstructure } from '../../scripts/lib/mcstructure.mjs';

const EXPECTED = {
  airship: { size: [75, 18, 13], 'minecraft:chest': 10, 'minecraft:mob_spawner': 1, 'minecraft:sculk_shrieker': 0 },
  'warden-city': { size: [63, 20, 63], 'minecraft:chest': 40, 'minecraft:mob_spawner': 0, 'minecraft:sculk_shrieker': 8 },
  windmill: { size: [35, 31, 35], 'minecraft:chest': 25, 'minecraft:mob_spawner': 3, 'minecraft:sculk_shrieker': 0 },
  bastion: { size: [20, 12, 20], 'minecraft:chest': 10, 'minecraft:mob_spawner': 0, 'minecraft:sculk_shrieker': 0 },
};

const deployed = process.argv[2];
if (!deployed) {
  console.error('usage: diagnose-CNTR-XCX12-AA-sizes.mjs <deployed structures/andrew dir>');
  process.exit(2);
}

const count = (s, name) => {
  const hit = new Set(s.palette.flatMap((p, i) => (p.name === name ? [i] : [])));
  return s.primary.filter((i) => hit.has(i)).length;
};

const built = mkdtempSync(join(tmpdir(), 'xcx12-'));
let failures = 0;
try {
  buildStructures({ to: built });
  for (const [id, want] of Object.entries(EXPECTED)) {
    const head = readFileSync(join(built, `${id}.mcstructure`));
    const live = readFileSync(join(deployed, `${id}.mcstructure`));
    const s = parseMcstructure(live);
    const got = { size: s.size };
    for (const name of Object.keys(want).filter((k) => k !== 'size')) got[name] = count(s, name);
    const off = Object.keys(want).filter((k) => JSON.stringify(want[k]) !== JSON.stringify(got[k]));
    if (!head.equals(live)) off.push('bytes(head!=deployed)');
    failures += off.length;
    console.log(
      `${off.length === 0 ? 'OK  ' : 'FAIL'} ${id}: size=[${s.size.join(', ')}] chests=${got['minecraft:chest']} spawners=${got['minecraft:mob_spawner']} shriekers=${got['minecraft:sculk_shrieker']} head==deployed=${head.equals(live)}${off.length ? ` off=${off.join(',')}` : ''}`
    );
  }
} finally {
  rmSync(built, { recursive: true, force: true });
}
console.log(failures === 0 ? 'RESULT PASS' : `RESULT FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
