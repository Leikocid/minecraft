// Server-side Molang readout for the crossbow-look probe.
//
//   node player-molang.mjs install <BDS data dir> <gametest pack dir>
//   node player-molang.mjs clean <gametest pack dir>
//
// install writes <pack>/entities/player.json and <pack>/animation_controllers/look_probe.ac.json.
// player.json is the BDS's own vanilla definition, read out of its .brarchive at run time
// (never committed: it is Mojang's file), plus one behaviour animation controller per bit of
// each query below. A controller tags the player `lp_<key>_<bit>` while its bit is set, so a
// script can read a Molang value it cannot evaluate itself: sign `s`, integer bits `i0..`,
// fraction bits `f0..` in 1/1024.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const INT_BITS = 18;
export const FRAC_BITS = 10;

// c1/c2 are constants and hp a query the server certainly answers: they prove the pipe.
export const QUERIES = {
  c1: '1234.5',
  c2: '-3.25',
  hp: 'query.health',
  mhud: 'query.main_hand_item_use_duration',
  irud: 'query.item_remaining_use_duration',
  irun: "query.item_remaining_use_duration('main_hand', 1.0)",
  imud: 'query.item_max_use_duration',
  mhmd: 'query.main_hand_item_max_duration',
  iiud: 'query.item_in_use_duration',
  iui: 'query.is_using_item',
  iic: 'query.item_is_charged',
  iicm: "query.item_is_charged('main_hand')",
  iic0: 'query.item_is_charged(0)',
  isc: 'query.is_charged',
  ischg: 'query.is_charging',
  gaf: 'query.get_animation_frame',
};

const PLAYER = 'player.json';

/** One entry of a .brarchive: 16-byte header (magic, count, version), 256-byte entries
 * (u8 name length, 247-byte name, u32 offset, u32 length), then the data block. */
function brarchiveEntry(file, want) {
  const b = readFileSync(file);
  const count = b.readUInt32LE(8);
  const base = 16 + count * 256;
  for (let i = 0; i < count; i++) {
    const e = 16 + i * 256;
    if (b.subarray(e + 1, e + 1 + b[e]).toString('utf8') !== want) continue;
    const off = b.readUInt32LE(e + 248);
    return b.subarray(base + off, base + off + b.readUInt32LE(e + 252)).toString('utf8');
  }
  return undefined;
}

const semver = (name) => (name.match(/^vanilla_(\d+)\.(\d+)(?:\.(\d+))?$/) ?? []).slice(1).map((n) => Number(n ?? 0));
const newer = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

/** The newest vanilla behaviour pack that carries player.json: the one the world resolves to. */
function vanillaPlayer(dataDir) {
  const packs = join(dataDir, 'behavior_packs');
  const found = readdirSync(packs)
    .filter((n) => /^vanilla_\d/.test(n))
    .map((n) => ({ n, v: semver(n), f: join(packs, n, '__brarchive', 'entities.brarchive') }))
    .filter((p) => p.v.length === 3 && existsSync(p.f))
    .sort((a, b) => newer(b.v, a.v))
    .map((p) => ({ ...p, json: brarchiveEntry(p.f, PLAYER) }))
    .find((p) => p.json !== undefined);
  if (found === undefined) throw new Error(`no vanilla_*/__brarchive/entities.brarchive with ${PLAYER} under ${packs}`);
  return { pack: found.n, json: JSON.parse(found.json) };
}

function bitConditions(expr) {
  const a = `math.abs(${expr})`;
  const out = [['s', `(${expr}) < 0`]];
  for (let i = 0; i < INT_BITS; i++) out.push([`i${i}`, `math.mod(math.floor(${a} / ${2 ** i}), 2) >= 1`]);
  for (let i = 0; i < FRAC_BITS; i++) {
    out.push([`f${i}`, `math.mod(math.floor((${a} - math.floor(${a})) * ${1024 / 2 ** i}), 2) >= 1`]);
  }
  return out;
}

function controllers() {
  const defs = {};
  const names = {};
  for (const [key, expr] of Object.entries(QUERIES)) {
    for (const [bit, cond] of bitConditions(expr)) {
      const tag = `lp_${key}_${bit}`;
      const id = `controller.animation.andrew_lp.${key}.${bit}`;
      defs[id] = {
        initial_state: 'lo',
        states: {
          lo: { transitions: [{ hi: cond }], on_entry: [`/tag @s remove ${tag}`] },
          hi: { transitions: [{ lo: `!(${cond})` }], on_entry: [`/tag @s add ${tag}`] },
        },
      };
      names[tag] = id;
    }
  }
  return { defs, names };
}

function install(dataDir, packDir) {
  const { pack, json } = vanillaPlayer(dataDir);
  const { defs, names } = controllers();
  const desc = json['minecraft:entity'].description;
  if (desc.animations !== undefined || desc.scripts !== undefined) {
    throw new Error(`${pack}/${PLAYER} already declares animations or scripts; merge them by hand`);
  }
  desc.animations = names;
  desc.scripts = { animate: Object.keys(names) };
  mkdirSync(join(packDir, 'entities'), { recursive: true });
  mkdirSync(join(packDir, 'animation_controllers'), { recursive: true });
  writeFileSync(join(packDir, 'entities', PLAYER), JSON.stringify(json, null, 1));
  writeFileSync(
    join(packDir, 'animation_controllers', 'look_probe.ac.json'),
    JSON.stringify({ format_version: '1.10.0', animation_controllers: defs }, null, 1)
  );
  console.log(`player.json from ${pack} (format ${json.format_version}); ${Object.keys(names).length} bit controllers over ${Object.keys(QUERIES).length} queries`);
}

function clean(packDir) {
  rmSync(join(packDir, 'entities', PLAYER), { force: true });
  rmSync(join(packDir, 'animation_controllers'), { recursive: true, force: true });
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'install' && args.length === 2) install(args[0], args[1]);
else if (cmd === 'clean' && args.length === 1) clean(args[0]);
else {
  console.error('usage: player-molang.mjs install <BDS data dir> <gametest pack dir> | clean <gametest pack dir>');
  process.exit(2);
}
