// Render a .mcstructure into PNG views: isometric, from four sides, at two scales.
//
// Why this exists: there is no Bedrock client on macOS and BDS draws nothing, so the
// shipped structures cannot be screenshotted. This renders the real block data instead
// — geometry and block colours, not the game's textures or lighting. It answers
// "is the silhouette right, are the blades and the door on one face, is the gold
// visible from outside", and not "does it read as an Ancient City": that stays an
// on-device check.
//
//   node scripts/render-structure.mjs                 all four, into dist/renders/
//   node scripts/render-structure.mjs windmill        one of them
//   node scripts/render-structure.mjs --tile 24       bigger blocks (closer view)
//   node scripts/render-structure.mjs --cut 4          drop everything at that height and above (no roof)
//   node scripts/render-structure.mjs --wall 1         drop the near faces (no front wall, look inside)

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMcstructure } from './lib/mcstructure.mjs';
import { encodePng } from './lib/png.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const structuresDir = join(root, 'packs', 'behavior', 'structures', 'andrew');
const outDir = join(root, 'dist', 'renders');

// Block colours, chosen to keep the materials apart at a glance rather than to match
// the game's palette. A block that is not listed renders magenta on purpose: a silent
// grey would hide it, and every unlisted block is a gap in this table.
const UNKNOWN = [255, 0, 255];
const COLOURS = {
  'minecraft:air': null,
  'minecraft:water': [58, 104, 198],
  'minecraft:flowing_water': [58, 104, 198],
  'minecraft:lava': [222, 110, 32],
  'minecraft:flowing_lava': [222, 110, 32],
  // Overworld ground and plants
  'minecraft:grass_block': [106, 153, 62],
  'minecraft:grass_path': [148, 124, 82],
  'minecraft:dirt': [122, 88, 62],
  'minecraft:coarse_dirt': [112, 80, 56],
  'minecraft:farmland': [98, 68, 44],
  'minecraft:wheat': [206, 188, 84],
  'minecraft:hay_block': [186, 160, 40],
  'minecraft:vine': [72, 118, 50],
  'minecraft:short_grass': [124, 168, 74],
  'minecraft:tall_grass': [118, 162, 70],
  'minecraft:fern': [110, 150, 68],
  'minecraft:dead_bush': [136, 110, 58],
  'minecraft:poppy': [190, 70, 60],
  'minecraft:dandelion': [214, 200, 70],
  'minecraft:pumpkin': [204, 126, 36],
  'minecraft:melon_block': [110, 156, 54],
  'minecraft:composter': [140, 108, 60],
  'minecraft:bell': [214, 178, 76],
  'minecraft:campfire': [180, 108, 50],
  'minecraft:web': [226, 226, 232],
  'minecraft:torch': [248, 214, 120],
  'minecraft:lantern': [236, 196, 110],
  'minecraft:soul_lantern': [120, 208, 214],
  'minecraft:soul_torch': [110, 196, 206],
  // Wood
  'minecraft:oak_planks': [162, 130, 78],
  'minecraft:spruce_planks': [114, 84, 48],
  'minecraft:oak_log': [126, 100, 58],
  'minecraft:spruce_log': [88, 64, 38],
  'minecraft:stripped_oak_log': [176, 146, 92],
  'minecraft:oak_stairs': [162, 130, 78],
  'minecraft:spruce_stairs': [114, 84, 48],
  'minecraft:oak_slab': [162, 130, 78],
  'minecraft:spruce_slab': [114, 84, 48],
  'minecraft:oak_fence': [150, 120, 72],
  'minecraft:oak_door': [138, 106, 60],
  'minecraft:oak_trapdoor': [150, 118, 70],
  'minecraft:ladder': [156, 126, 76],
  'minecraft:scaffolding': [196, 168, 96],
  // Stone
  'minecraft:stone': [128, 128, 128],
  'minecraft:cobblestone': [118, 118, 118],
  'minecraft:mossy_cobblestone': [104, 122, 96],
  'minecraft:stone_bricks': [136, 136, 136],
  'minecraft:mossy_stone_bricks': [112, 128, 104],
  'minecraft:cracked_stone_bricks': [124, 124, 124],
  'minecraft:stone_brick_stairs': [136, 136, 136],
  'minecraft:stone_brick_slab': [136, 136, 136],
  'minecraft:smooth_stone': [148, 148, 148],
  'minecraft:smooth_stone_slab': [168, 168, 168],
  'minecraft:polished_andesite_slab': [118, 120, 118],
  'minecraft:gravel': [130, 126, 124],
  'minecraft:glass': [206, 226, 232],
  'minecraft:glass_pane': [206, 226, 232],
  'minecraft:iron_bars': [160, 160, 164],
  'minecraft:chest': [168, 122, 56],
  'minecraft:barrel': [150, 114, 58],
  'minecraft:mob_spawner': [40, 52, 60],
  'minecraft:crafting_table': [150, 110, 62],
  'minecraft:cauldron': [70, 70, 74],
  'minecraft:bookshelf': [148, 116, 70],
  // Deepslate and sculk (Warden City)
  'minecraft:deepslate': [72, 72, 78],
  'minecraft:cobbled_deepslate': [78, 78, 84],
  'minecraft:polished_deepslate': [68, 68, 74],
  'minecraft:deepslate_bricks': [64, 64, 70],
  'minecraft:deepslate_tiles': [58, 58, 64],
  'minecraft:cracked_deepslate_tiles': [54, 54, 60],
  'minecraft:cracked_deepslate_bricks': [62, 62, 68],
  'minecraft:chiseled_deepslate': [60, 60, 66],
  'minecraft:reinforced_deepslate': [92, 96, 88],
  'minecraft:sculk': [26, 38, 44],
  'minecraft:sculk_vein': [34, 50, 56],
  'minecraft:sculk_sensor': [42, 74, 82],
  'minecraft:sculk_shrieker': [190, 176, 128],
  'minecraft:sculk_catalyst': [46, 62, 68],
  // Nether (Bastion)
  'minecraft:blackstone': [44, 38, 44],
  'minecraft:polished_blackstone': [52, 46, 52],
  'minecraft:polished_blackstone_bricks': [48, 42, 48],
  'minecraft:cracked_polished_blackstone_bricks': [44, 40, 46],
  'minecraft:chiseled_polished_blackstone': [50, 44, 50],
  'minecraft:polished_blackstone_stairs': [52, 46, 52],
  'minecraft:polished_blackstone_slab': [52, 46, 52],
  'minecraft:polished_blackstone_brick_stairs': [48, 42, 48],
  'minecraft:gilded_blackstone': [92, 66, 34],
  'minecraft:gold_block': [232, 192, 60],
  'minecraft:netherrack': [104, 46, 46],
  'minecraft:basalt': [72, 70, 78],
  'minecraft:polished_basalt': [80, 78, 86],
  'minecraft:smooth_basalt': [64, 62, 70],
  'minecraft:magma': [154, 70, 30],
  'minecraft:soul_sand': [82, 62, 50],
  'minecraft:soul_soil': [86, 66, 52],
  'minecraft:nether_bricks': [58, 30, 34],
  'minecraft:chain': [78, 78, 84],
  'minecraft:iron_chain': [78, 78, 84],
  // Airship
  'minecraft:concrete': [176, 176, 176],
  'minecraft:light_gray_concrete': [158, 158, 152],
  'minecraft:gray_concrete': [88, 92, 96],
  'minecraft:white_concrete': [212, 216, 216],
  'minecraft:iron_block': [198, 198, 198],
  'minecraft:sea_lantern': [186, 214, 206],
  'minecraft:redstone_lamp': [190, 132, 72],
  'minecraft:end_rod': [232, 226, 206],
};

function colourOf(name) {
  if (name in COLOURS) return COLOURS[name];
  // Families that only vary by wood/colour prefix: fall back to the base material.
  for (const [suffix, c] of [
    ['_concrete', COLOURS['minecraft:concrete']],
    ['_stairs', COLOURS['minecraft:stone_brick_stairs']],
    ['_slab', COLOURS['minecraft:stone_brick_slab']],
    ['_planks', COLOURS['minecraft:oak_planks']],
    ['_log', COLOURS['minecraft:oak_log']],
    ['_fence', COLOURS['minecraft:oak_fence']],
    ['_door', COLOURS['minecraft:oak_door']],
    ['_wool', [200, 200, 200]],
  ])
    if (name.endsWith(suffix)) return c;
  return UNKNOWN;
}

/** Load a structure into a sparse list of solid cells plus its size. */
function cells(file, maxY = Infinity) {
  const s = parseMcstructure(readFileSync(file));
  const [sx, sy, sz] = s.size.map(Number);
  const out = [];
  const unknown = new Map();
  let i = 0;
  // block_indices walk x, then y, then z — the order buildMcstructure writes.
  for (let x = 0; x < sx; x++)
    for (let y = 0; y < sy; y++)
      for (let z = 0; z < sz; z++, i++) {
        const idx = s.primary[i];
        if (idx === -1) continue;
        if (y >= maxY) continue;
        const name = s.palette[idx].name;
        const c = colourOf(name);
        if (c === null) continue;
        if (c === UNKNOWN) unknown.set(name, (unknown.get(name) ?? 0) + 1);
        out.push({ x, y, z, c });
      }
  return { size: [sx, sy, sz], list: out, unknown };
}

const shade = (c, k) => [Math.min(255, Math.round(c[0] * k)), Math.min(255, Math.round(c[1] * k)), Math.min(255, Math.round(c[2] * k))];

/** Render one isometric view. `turn` is 0..3 quarter turns around the vertical axis. */
function render({ size, list }, turn, tile, strip = 0) {
  const [sx, , sz] = size;
  // In this projection depth is x+z, so the two faces at the high end of both axes are the
  // ones between the camera and the interior. Dropping them is the only way to look inside
  // a structure whose roof must stay on.
  const [rsx, rsz] = turn % 2 === 0 ? [sx, sz] : [sz, sx];
  const rot = ({ x, z }) => {
    switch (turn) {
      case 1:
        return { x: sz - 1 - z, z: x };
      case 2:
        return { x: sx - 1 - x, z: sz - 1 - z };
      case 3:
        return { x: z, z: sx - 1 - x };
      default:
        return { x, z };
    }
  };
  const half = tile / 2;
  const quarter = tile / 4;
  const wall = half; // vertical pixels one block occupies

  const put = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of list) {
    const { x, z } = rot(b);
    if (strip > 0 && (x >= rsx - strip || z >= rsz - strip)) continue;
    const px = (x - z) * half;
    const py = (x + z) * quarter - b.y * wall;
    put.push({ px, py, depth: x + z, y: b.y, c: b.c });
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px + tile);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py + half + wall);
  }
  const pad = tile;
  const width = Math.ceil(maxX - minX) + pad * 2;
  const height = Math.ceil(maxY - minY) + pad * 2;
  const rgb = new Uint8Array(width * height * 3);
  // Sky, so the silhouette reads against something.
  for (let i = 0; i < rgb.length; i += 3) {
    rgb[i] = 18;
    rgb[i + 1] = 20;
    rgb[i + 2] = 26;
  }
  const pixel = (x, y, c) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = (y * width + x) * 3;
    rgb[i] = c[0];
    rgb[i + 1] = c[1];
    rgb[i + 2] = c[2];
  };

  // Painter's order: farther first (smaller x+z), and lower first within a column.
  put.sort((a, b) => a.depth - b.depth || a.y - b.y);

  const top = (c) => shade(c, 1.0);
  const left = (c) => shade(c, 0.72);
  const right = (c) => shade(c, 0.52);

  for (const b of put) {
    const ox = Math.round(b.px - minX) + pad;
    const oy = Math.round(b.py - minY) + pad;
    // Top rhombus: tile wide, half tall.
    for (let dy = 0; dy < half; dy++) {
      const t = dy < quarter ? dy : half - 1 - dy;
      const spread = Math.round((t + 1) * 2);
      for (let dx = half - spread; dx < half + spread; dx++) pixel(ox + dx, oy + dy, top(b.c));
    }
    // Two walls under it, each a parallelogram sliding down from the rhombus edge.
    for (let dx = 0; dx < half; dx++) {
      const edge = Math.round(quarter + dx / 2);
      for (let dy = 0; dy < wall; dy++) pixel(ox + dx, oy + edge + dy, left(b.c));
    }
    for (let dx = half; dx < tile; dx++) {
      const edge = Math.round(quarter + (tile - 1 - dx) / 2);
      for (let dy = 0; dy < wall; dy++) pixel(ox + dx, oy + edge + dy, right(b.c));
    }
  }
  return { width, height, rgb };
}

const SIDE = ['юг-запад', 'северо-запад', 'северо-восток', 'юго-восток'];

function main() {
  const args = process.argv.slice(2);
  let tiles = [8, 16];
  const ti = args.indexOf('--tile');
  if (ti !== -1) {
    tiles = [Number(args[ti + 1])];
    args.splice(ti, 2);
  }
  // A buried or roofed structure shows nothing from outside; cutting the top off is the
  // only way to look at the inside without a game client.
  let maxY = Infinity;
  const si = args.indexOf('--cut');
  if (si !== -1) {
    maxY = Number(args[si + 1]);
    args.splice(si, 2);
  }
  let strip = 0;
  const wi = args.indexOf('--wall');
  if (wi !== -1) {
    strip = Number(args[wi + 1]);
    args.splice(wi, 2);
  }
  const want = args.filter((a) => !a.startsWith('--'));
  const files = readdirSync(structuresDir)
    .filter((f) => f.endsWith('.mcstructure'))
    .filter((f) => want.length === 0 || want.some((w) => f.startsWith(w)))
    .sort();
  if (files.length === 0) throw new Error(`no structures matched ${want.join(', ') || '(all)'} in ${structuresDir}`);
  mkdirSync(outDir, { recursive: true });

  for (const f of files) {
    const id = basename(f, '.mcstructure');
    const data = cells(join(structuresDir, f), maxY);
    process.stdout.write(`${id}: ${data.size.join('×')}, ${data.list.length} видимых блоков\n`);
    if (data.unknown.size > 0)
      process.stdout.write(
        `  ⚠ без цвета (рисуются малиновым): ${[...data.unknown.entries()].map(([n, c]) => `${n}×${c}`).join(', ')}\n`
      );
    for (const tile of tiles)
      for (let turn = 0; turn < 4; turn++) {
        const img = render(data, turn, tile, strip);
        const cut = Number.isFinite(maxY) ? `-cut${maxY}` : '';
        const front = strip > 0 ? `-wall${strip}` : '';
        const name = `${id}${cut}${front}-${String(tile).padStart(2, '0')}px-${turn}.png`;
        writeFileSync(join(outDir, name), encodePng(img));
        process.stdout.write(`  ${name}  ${img.width}×${img.height}  (${SIDE[turn]})\n`);
      }
  }
  process.stdout.write(`\nготово: ${outDir}\n`);
}

main();
