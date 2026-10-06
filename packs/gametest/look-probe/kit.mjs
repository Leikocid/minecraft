// Builds dist/look-probe-kit.mcaddon: the iPad half of the crossbow-look probe
// (docs/feedback/probe-crossbow-look.md). A behaviour pack with the four probe items and a
// stable-API script, and a resource pack with the attachable, the readout bars, the icons and
// the flipbook entry. Every picture is drawn here, so the kit carries no Mojang texture.
//
//   node packs/gametest/look-probe/kit.mjs

import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { MIN_ENGINE_VERSION, SERVER_API_VERSION } from '../../../scripts/targets.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const out = join(root, 'dist', 'look-probe-kit');
const archive = join(root, 'dist', 'look-probe-kit.mcaddon');
const VERSION = [1, 0, 0];

// Fixed, so re-importing the kit on the iPad replaces the old copy instead of adding one.
const BP_UUID = '29c1a66f-f40a-4723-87c5-ffb814c10fdb';
const BP_DATA_UUID = 'e1c79c12-1472-4f1f-b43e-7083774d1b48';
const BP_SCRIPT_UUID = 'afdc46c9-b999-41d5-9eb6-ca78a24b04c0';
const RP_UUID = 'af4da89d-f011-4688-9d91-7f393878d6b7';
const RP_RES_UUID = '0f5b7c1e-3d2a-4b8e-9a61-5c2f7d9e4a13';

// ---- PNG

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
/** RGBA pixels (w*h*4) -> PNG. */
function png(w, h, px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const GLYPHS = {
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
};

/** A 16x16 tile: filled square with a darker rim and a 5x7 glyph drawn at 2x. */
function tile(px, w, oy, fill, ink, glyph) {
  const set = (x, y, c) => {
    const i = ((oy + y) * w + x) * 4;
    px[i] = c[0];
    px[i + 1] = c[1];
    px[i + 2] = c[2];
    px[i + 3] = 255;
  };
  const rim = fill.map((v) => Math.round(v * 0.55));
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(x, y, x === 0 || y === 0 || x === 15 || y === 15 ? rim : fill);
  GLYPHS[glyph].forEach((row, gy) => {
    [...row].forEach((bit, gx) => {
      if (bit !== '1') return;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) set(3 + gx * 2 + dx, 1 + gy * 2 + dy, ink);
    });
  });
}

function icon(fill, ink, glyph) {
  const px = Buffer.alloc(16 * 16 * 4);
  tile(px, 16, 0, fill, ink, glyph);
  return png(16, 16, px);
}

function strip(frames) {
  const px = Buffer.alloc(16 * 16 * frames.length * 4);
  frames.forEach(([fill, ink, glyph], i) => tile(px, 16, i * 16, fill, ink, glyph));
  return png(16, 16 * frames.length, px);
}

// Readout bar colours, in the order of the bars in probe_look.geo.json (bar1..bar6).
const BAR_COLOURS = [
  [220, 30, 30],
  [240, 140, 0],
  [30, 180, 30],
  [30, 60, 220],
  [150, 40, 200],
  [250, 250, 250],
];

/** Attachable skin: the state colour above v=30 (body and crossbar), one stripe per bar below. */
function skin(fill) {
  const px = Buffer.alloc(64 * 64 * 4);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const bar = Math.floor(x / 8);
      const c = y >= 30 && bar < BAR_COLOURS.length ? BAR_COLOURS[bar] : fill;
      px.set([...c, 255], (y * 64 + x) * 4);
    }
  }
  return png(64, 64, px);
}

const WHITE = [255, 255, 255];
const BLACK = [20, 20, 20];
const GREY = [128, 128, 128];
const YELLOW = [224, 192, 0];
const CYAN = [0, 192, 192];

// ---- packs

const manifest = (name, uuid, modules, dependencies) => ({
  format_version: 2,
  header: { name, description: 'Dev-only crossbow-look probe (packs/gametest/look-probe). Not part of andrew.mcaddon.', uuid, version: VERSION, min_engine_version: MIN_ENGINE_VERSION },
  modules,
  ...(dependencies ? { dependencies } : {}),
});

function build() {
  rmSync(out, { recursive: true, force: true });
  rmSync(archive, { force: true });
  const bp = join(out, 'look_probe_bp');
  const rp = join(out, 'look_probe_rp');

  mkdirSync(join(bp, 'items'), { recursive: true });
  for (const f of readdirSync(join(here, 'items'))) cpSync(join(here, 'items', f), join(bp, 'items', f));
  cpSync(join(here, 'kit-bp'), bp, { recursive: true });
  writeFileSync(
    join(bp, 'manifest.json'),
    JSON.stringify(
      manifest(
        'Andrew look probe BP',
        BP_UUID,
        [
          { type: 'data', uuid: BP_DATA_UUID, version: VERSION },
          { type: 'script', language: 'javascript', uuid: BP_SCRIPT_UUID, version: VERSION, entry: 'scripts/main.js' },
        ],
        [
          { module_name: '@minecraft/server', version: SERVER_API_VERSION },
          { uuid: RP_UUID, version: VERSION },
        ]
      ),
      null,
      2
    )
  );

  cpSync(join(here, 'kit-rp'), rp, { recursive: true });
  writeFileSync(join(rp, 'manifest.json'), JSON.stringify(manifest('Andrew look probe RP', RP_UUID, [{ type: 'resources', uuid: RP_RES_UUID, version: VERSION }]), null, 2));
  const tex = join(rp, 'textures', 'andrew_probe');
  mkdirSync(tex, { recursive: true });
  const pics = {
    icon_rest: icon(GREY, WHITE, 'R'),
    icon_pull: icon(YELLOW, BLACK, 'P'),
    icon_charged: icon(CYAN, BLACK, 'C'),
    // Greyscale on purpose: the engine tints the dyed icon with the item's colour.
    icon_dyed: icon([235, 235, 235], BLACK, 'D'),
    icon_flip: strip([
      [[200, 40, 40], WHITE, '1'],
      [[40, 170, 40], WHITE, '2'],
      [[40, 70, 210], WHITE, '3'],
      [[190, 40, 190], WHITE, '4'],
    ]),
    look_rest: skin(GREY),
    look_pull: skin(YELLOW),
    look_charged: skin(CYAN),
  };
  for (const [name, buf] of Object.entries(pics)) writeFileSync(join(tex, `${name}.png`), buf);

  // The zip CLI, as in scripts/build.mjs: one archive with both packs at its top level.
  execFileSync('zip', ['-r', '-X', archive, 'look_probe_bp', 'look_probe_rp', '-x', '*.DS_Store'], { cwd: out, stdio: 'ignore' });
  const listing = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf-8' }).split('\n').filter(Boolean);
  console.log(`${archive}: ${listing.length} entries`);
  for (const e of listing) if (!e.endsWith('/')) console.log(`  ${e}`);
  for (const f of listing.filter((e) => e.endsWith('.json'))) JSON.parse(readFileSync(join(out, f), 'utf-8'));
}

build();
