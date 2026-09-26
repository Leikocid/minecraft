// .mcstructure — the NBT layout Bedrock reads for structure blocks and
// world.structureManager.place(). Built from a declarative template (see
// compileTemplate) or from raw palette indices (see buildMcstructure).
//
// Layout contracts with the engine:
//   - block index = x * sy * sz + y * sz + z  (z varies fastest)
//   - block_indices holds two layers: [0] the block, [1] the "extra" block in
//     the same cell (water for waterlogging); -1 means no block in that layer
//   - block_position_data is keyed by the decimal block index; its
//     block_entity_data carries x/y/z in world space, i.e. local position plus
//     structure_world_origin

import { MIN_ENGINE_VERSION } from '../targets.mjs';
import {
  TAG_COMPOUND,
  TAG_END,
  TAG_INT,
  TAG_LIST,
  byte,
  child,
  compound,
  int,
  list,
  readNbt,
  short,
  string,
  toPlain,
  writeNbt,
} from './nbt.mjs';

export const FORMAT_VERSION = 1;

/** Palette "version": the game version packed one byte per component. */
export function blockVersion([major, minor, patch, revision = 0] = MIN_ENGINE_VERSION) {
  return (major << 24) | (minor << 16) | (patch << 8) | revision;
}

// Block-entity ids for the blocks that need one. A block listed here always
// gets block_entity_data; the engine otherwise places a container or spawner
// with no entity behind it.
const BLOCK_ENTITY_IDS = {
  'minecraft:chest': 'Chest',
  'minecraft:trapped_chest': 'Chest',
  'minecraft:barrel': 'Barrel',
  'minecraft:mob_spawner': 'MobSpawner',
  'minecraft:sculk_shrieker': 'SculkShrieker',
};

// Vanilla spawner defaults; a template overrides any of them by name.
const SPAWNER_DEFAULTS = {
  Delay: 20,
  MinSpawnDelay: 200,
  MaxSpawnDelay: 800,
  SpawnCount: 4,
  MaxNearbyEntities: 6,
  RequiredPlayerRange: 16,
  SpawnRange: 4,
};

/** JSON state value -> NBT tag: booleans are bytes, integers ints. */
function stateTag(name, value) {
  if (typeof value === 'boolean') return byte(name, value ? 1 : 0);
  if (typeof value === 'number' && Number.isInteger(value)) return int(name, value);
  if (typeof value === 'string') return string(name, value);
  throw new Error(`block state ${name}: unsupported value ${JSON.stringify(value)}`);
}

function paletteKey({ name, states = {} }) {
  const sorted = Object.keys(states).sort().map((k) => [k, states[k]]);
  return `${name}${JSON.stringify(sorted)}`;
}

function paletteEntryTag({ name, states = {} }, version) {
  return compound('', [
    string('name', name),
    compound('states', Object.entries(states).map(([k, v]) => stateTag(k, v))),
    int('version', version),
  ]);
}

/**
 * Block-entity payload for one cell.
 * @param {{ name: string, chest?: object, spawner?: object }} block
 * @param {[number, number, number]} pos world-space position
 */
export function blockEntityEntries(block, [x, y, z]) {
  const id = BLOCK_ENTITY_IDS[block.name];
  if (id === undefined) {
    if (block.chest || block.spawner) throw new Error(`${block.name} has no block entity for its chest/spawner data`);
    return null;
  }
  const entries = [string('id', id), byte('isMovable', 1)];

  if (id === 'Chest' || id === 'Barrel') {
    const chest = block.chest ?? {};
    if (chest.loot_table) {
      entries.push(string('LootTable', chest.loot_table), int('LootTableSeed', chest.loot_seed ?? 0));
    }
    const items = (chest.items ?? []).map((item, i) => [
      byte('Count', item.count ?? 1),
      short('Damage', item.damage ?? 0),
      string('Name', item.name),
      byte('Slot', item.slot ?? i),
      byte('WasPickedUp', 0),
    ]);
    entries.push(list('Items', items.length ? TAG_COMPOUND : TAG_END, items), byte('Findable', 0));
  } else if (id === 'MobSpawner') {
    const spawner = block.spawner;
    if (!spawner?.entity) throw new Error(`mob_spawner needs spawner.entity (EntityIdentifier)`);
    entries.push(string('EntityIdentifier', spawner.entity));
    for (const [key, def] of Object.entries(SPAWNER_DEFAULTS)) entries.push(short(key, spawner[key] ?? def));
  }

  entries.push(int('x', x), int('y', y), int('z', z));
  return entries;
}

/**
 * Assemble the root tag from raw data.
 * @param {object} s
 * @param {[number, number, number]} s.size
 * @param {{ name: string, states?: object }[]} s.palette
 * @param {number[]} s.primary palette index per cell
 * @param {number[]} [s.secondary] palette index per cell, -1 = none
 * @param {Map<number, object[]>} [s.blockEntities] cell index -> block_entity_data entries
 * @param {[number, number, number]} [s.origin] structure_world_origin
 */
export function buildMcstructure({ size, palette, primary, secondary, blockEntities = new Map(), origin = [0, 0, 0] }) {
  const volume = size[0] * size[1] * size[2];
  if (primary.length !== volume) throw new Error(`primary layer has ${primary.length} cells, size needs ${volume}`);
  const second = secondary ?? new Array(volume).fill(-1);
  if (second.length !== volume) throw new Error(`secondary layer has ${second.length} cells, size needs ${volume}`);

  const version = blockVersion();
  const positionData = [...blockEntities.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, entries]) => compound(String(index), [compound('block_entity_data', entries)]));

  return compound('', [
    int('format_version', FORMAT_VERSION),
    list('size', TAG_INT, [...size]),
    compound('structure', [
      list('block_indices', TAG_LIST, [
        { elementType: TAG_INT, items: primary },
        { elementType: TAG_INT, items: second },
      ]),
      list('entities', TAG_COMPOUND, []),
      compound('palette', [
        compound('default', [
          list('block_palette', TAG_COMPOUND, palette.map((p) => paletteEntryTag(p, version).value)),
          compound('block_position_data', positionData),
        ]),
      ]),
    ]),
    list('structure_world_origin', TAG_INT, [...origin]),
  ]);
}

export const STRUCTURE_VOID = 'minecraft:structure_void';

export const cellIndex = ([sx, sy, sz], x, y, z) => x * sy * sz + y * sz + z;

/**
 * Compile a declarative template (src/structures/templates/*.json).
 *
 *   size    [x, y, z]
 *   blocks  legend: one character -> "minecraft:id" or
 *           { name, states?, waterlogged?, chest?: { items?, loot_table? },
 *             spawner?: { entity, Delay?, ... } }
 *   default legend key that fills the volume first (air if omitted)
 *   fill    [{ from: [x,y,z], to: [x,y,z], block: key }], applied in order
 *   layers  { "<y>": [row per z, north to south; char per x, west to east] }
 *           applied after fill; a space leaves the cell as it is
 *
 * @returns {{ tag: object, counts: Record<string, number> }} counts per block name
 */
export function compileTemplate(template) {
  const size = template.size;
  if (!Array.isArray(size) || size.length !== 3 || !size.every((n) => Number.isInteger(n) && n > 0)) {
    throw new Error(`size must be three positive integers, got ${JSON.stringify(size)}`);
  }
  const [sx, sy, sz] = size;
  const legend = { ...template.blocks };
  const defaultKey = template.default ?? '\0air';
  if (!(defaultKey in legend)) legend[defaultKey] = 'minecraft:air';
  const resolve = (key) => {
    const b = legend[key];
    if (b === undefined) throw new Error(`unknown block key ${JSON.stringify(key)}`);
    return typeof b === 'string' ? { name: b } : b;
  };

  const cells = new Array(sx * sy * sz).fill(defaultKey);
  const inBounds = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < sx && y < sy && z < sz;

  for (const f of template.fill ?? []) {
    resolve(f.block);
    const [x0, y0, z0] = f.from.map((v, i) => Math.min(v, f.to[i]));
    const [x1, y1, z1] = f.from.map((v, i) => Math.max(v, f.to[i]));
    if (!inBounds(x0, y0, z0) || !inBounds(x1, y1, z1)) throw new Error(`fill ${JSON.stringify(f)} leaves the ${size} volume`);
    for (let x = x0; x <= x1; x++)
      for (let y = y0; y <= y1; y++)
        for (let z = z0; z <= z1; z++) cells[cellIndex(size, x, y, z)] = f.block;
  }

  for (const [yKey, rows] of Object.entries(template.layers ?? {})) {
    const y = Number(yKey);
    if (!Number.isInteger(y) || y < 0 || y >= sy) throw new Error(`layer y=${yKey} outside 0..${sy - 1}`);
    if (rows.length > sz) throw new Error(`layer y=${y}: ${rows.length} rows, depth is ${sz}`);
    rows.forEach((row, z) => {
      const chars = [...row];
      if (chars.length > sx) throw new Error(`layer y=${y} row ${z}: ${chars.length} chars, width is ${sx}`);
      chars.forEach((ch, x) => {
        if (ch === ' ') return;
        resolve(ch);
        cells[cellIndex(size, x, y, z)] = ch;
      });
    });
  }

  const palette = [];
  const paletteIndex = new Map();
  const indexOf = (block) => {
    const key = paletteKey(block);
    let i = paletteIndex.get(key);
    if (i === undefined) {
      i = palette.length;
      palette.push({ name: block.name, states: block.states ?? {} });
      paletteIndex.set(key, i);
    }
    return i;
  };

  const origin = [0, 0, 0];
  const primary = new Array(cells.length);
  const secondary = new Array(cells.length).fill(-1);
  const blockEntities = new Map();
  const counts = {};
  const water = { name: 'minecraft:water', states: { liquid_depth: 0 } };

  for (let x = 0; x < sx; x++)
    for (let y = 0; y < sy; y++)
      for (let z = 0; z < sz; z++) {
        const i = cellIndex(size, x, y, z);
        const block = resolve(cells[i]);
        counts[block.name] = (counts[block.name] ?? 0) + 1;
        // A void cell is index -1 with no palette entry. A structure_void palette
        // entry is placed by structureManager.place as a real block over the terrain.
        if (block.name === STRUCTURE_VOID) {
          primary[i] = -1;
          continue;
        }
        primary[i] = indexOf(block);
        if (block.waterlogged) secondary[i] = indexOf(water);
        const be = blockEntityEntries(block, [x + origin[0], y + origin[1], z + origin[2]]);
        if (be) blockEntities.set(i, be);
      }

  return { tag: buildMcstructure({ size, palette, primary, secondary, blockEntities, origin }), counts };
}

/** Serialise a template straight to .mcstructure bytes. */
export function templateToBuffer(template) {
  const { tag, counts } = compileTemplate(template);
  return { buffer: writeNbt(tag), counts };
}

/**
 * Parse .mcstructure bytes into plain data for assertions.
 * @returns {{ formatVersion: number, size: number[], origin: number[],
 *   primary: number[], secondary: number[], palette: object[],
 *   blockEntities: Map<number, object> }}
 */
export function parseMcstructure(buf) {
  const { tag, end } = readNbt(buf, 0);
  if (end !== buf.length) throw new Error(`parsed ${end} of ${buf.length} bytes`);
  const structure = child(tag, 'structure');
  const [primary, secondary] = child(structure, 'block_indices').value.items.map((l) => l.items);
  const paletteDefault = child(child(structure, 'palette'), 'default');
  const blockEntities = new Map(
    child(paletteDefault, 'block_position_data').value.map((e) => [
      Number(e.name),
      toPlain(child(e, 'block_entity_data')),
    ])
  );
  return {
    formatVersion: child(tag, 'format_version').value,
    size: child(tag, 'size').value.items,
    origin: child(tag, 'structure_world_origin').value.items,
    primary,
    secondary,
    palette: toPlain(child(paletteDefault, 'block_palette')),
    blockEntities,
  };
}
