// Renders a Bedrock entity geometry with its texture, turned about one bone, so a model
// can be looked at without a Bedrock client (there is none on macOS, and BDS draws nothing).
//
//   node tools/model-preview.mjs --out dist/renders/model.png \
//     --geo packs/resource/models/entity/x.geo.json --texture packs/resource/textures/entity/x.png \
//     --bone spin --axis z [--steps 6]
//
// Each row is one camera; each column turns --bone about --axis by a further 180/steps
// degrees. Orthographic, flat Lambert light, nearest-texel sampling: it answers "is the
// silhouette right and does the turn show", not "how does the device light it".

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePngRgba } from '../scripts/lib/png.mjs';

const FACES = {
  north: { n: [0, 0, -1], u: [-1, 0, 0], v: [0, -1, 0], at: (o, s) => [o[0] + s[0], o[1] + s[1], o[2]], du: (s) => s[0], dv: (s) => s[1] },
  south: { n: [0, 0, 1], u: [1, 0, 0], v: [0, -1, 0], at: (o, s) => [o[0], o[1] + s[1], o[2] + s[2]], du: (s) => s[0], dv: (s) => s[1] },
  east: { n: [1, 0, 0], u: [0, 0, -1], v: [0, -1, 0], at: (o, s) => [o[0] + s[0], o[1] + s[1], o[2] + s[2]], du: (s) => s[2], dv: (s) => s[1] },
  west: { n: [-1, 0, 0], u: [0, 0, 1], v: [0, -1, 0], at: (o, s) => [o[0], o[1] + s[1], o[2]], du: (s) => s[2], dv: (s) => s[1] },
  up: { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], at: (o, s) => [o[0], o[1] + s[1], o[2]], du: (s) => s[0], dv: (s) => s[2] },
  down: { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, -1], at: (o, s) => [o[0], o[1], o[2] + s[2]], du: (s) => s[0], dv: (s) => s[2] },
};

const rad = (d) => (d * Math.PI) / 180;
function rotate([x, y, z], axis, deg) {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  if (axis === 'x') return [x, y * c - z * s, y * s + z * c];
  if (axis === 'y') return [x * c + z * s, y, -x * s + z * c];
  return [x * c - y * s, x * s + y * c, z];
}

/** Every textured surface sample of the geometry: position, normal, colour, bone. */
function surfaceSamples(geo, texture, density) {
  const tw = geo.description.texture_width;
  const th = geo.description.texture_height;
  const out = [];
  for (const bone of geo.bones) {
    for (const cube of bone.cubes ?? []) {
      for (const [face, spec] of Object.entries(FACES)) {
        const uv = cube.uv?.[face];
        if (!uv) continue;
        const start = spec.at(cube.origin, cube.size);
        const w = spec.du(cube.size);
        const h = spec.dv(cube.size);
        const nu = Math.max(1, Math.ceil(w * density));
        const nv = Math.max(1, Math.ceil(h * density));
        for (let i = 0; i < nu; i++) {
          for (let j = 0; j < nv; j++) {
            const fu = (i + 0.5) / nu;
            const fv = (j + 0.5) / nv;
            const tx = Math.floor(((uv.uv[0] + fu * uv.uv_size[0]) / tw) * texture.width);
            const ty = Math.floor(((uv.uv[1] + fv * uv.uv_size[1]) / th) * texture.height);
            const p = (ty * texture.width + tx) * 4;
            if (texture.rgba[p + 3] === 0) continue;
            out.push({
              bone: bone.name,
              pos: [0, 1, 2].map((k) => start[k] + spec.u[k] * fu * w + spec.v[k] * fv * h),
              normal: spec.n,
              colour: [texture.rgba[p], texture.rgba[p + 1], texture.rgba[p + 2]],
            });
          }
        }
      }
    }
  }
  return out;
}

/**
 * @param {{ geo: object, texture: {width:number,height:number,rgba:Uint8Array}, bone: string, axis: 'x'|'y'|'z',
 *   steps: number, cameras: {yaw:number,pitch:number}[], backgrounds: number[][] }} opts
 */
export function renderTurns({ geo, texture, bone, axis, steps, cameras, backgrounds, cell = 240, scale = 7 }) {
  const pivot = geo.bones.find((b) => b.name === bone)?.pivot ?? [0, 0, 0];
  const samples = surfaceSamples(geo, texture, 4);
  const centre = [0, 1, 2].map((k) => {
    const values = samples.map((s) => s.pos[k]);
    return (Math.min(...values) + Math.max(...values)) / 2;
  });
  const light = (() => {
    const l = [-0.4, 0.8, -0.45];
    const n = Math.hypot(...l);
    return l.map((x) => x / n);
  })();
  const rows = cameras.length * backgrounds.length;
  const width = steps * cell;
  const height = rows * cell;
  const rgba = new Uint8Array(width * height * 4);
  const depth = new Float32Array(width * height).fill(-Infinity);
  let row = 0;
  for (const bg of backgrounds) {
    for (const cam of cameras) {
      for (let step = 0; step < steps; step++) {
        const angle = (step * 180) / steps;
        const x0 = step * cell;
        const y0 = row * cell;
        for (let y = y0; y < y0 + cell; y++) {
          for (let x = x0; x < x0 + cell; x++) {
            rgba.set([...bg, 255], (y * width + x) * 4);
            depth[y * width + x] = -Infinity;
          }
        }
        for (const s of samples) {
          let pos = s.pos;
          let normal = s.normal;
          if (s.bone === bone) {
            pos = rotate(pos.map((v, k) => v - pivot[k]), axis, angle).map((v, k) => v + pivot[k]);
            normal = rotate(normal, axis, angle);
          }
          const lit = 0.45 + 0.55 * Math.max(0, normal[0] * light[0] + normal[1] * light[1] + normal[2] * light[2]);
          const view = rotate(rotate(pos.map((v, k) => v - centre[k]), 'y', cam.yaw), 'x', cam.pitch);
          const viewNormal = rotate(rotate(normal, 'y', cam.yaw), 'x', cam.pitch);
          if (viewNormal[2] <= 0) continue;
          const px = Math.round(x0 + cell / 2 + view[0] * scale);
          const py = Math.round(y0 + cell / 2 - view[1] * scale);
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              const qx = px + dx;
              const qy = py + dy;
              if (qx < x0 || qx >= x0 + cell || qy < y0 || qy >= y0 + cell) continue;
              const d = qy * width + qx;
              if (view[2] < depth[d]) continue;
              depth[d] = view[2];
              rgba.set([...s.colour.map((c) => Math.min(255, Math.round(c * lit))), 255], d * 4);
            }
          }
        }
      }
      row++;
    }
  }
  return encodePngRgba({ width, height, rgba });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const arg = (name, fallback) => {
    const at = process.argv.indexOf(`--${name}`);
    return at > 0 ? process.argv[at + 1] : fallback;
  };
  const out = arg('out');
  const geoPath = arg('geo');
  const texturePath = arg('texture');
  if (!out || !geoPath || !texturePath) {
    console.error('usage: node tools/model-preview.mjs --out <png> --geo <geo.json> --texture <png> [--bone spin --axis z --steps 6]');
    process.exit(2);
  }
  const geo = JSON.parse(readFileSync(geoPath, 'utf-8'))['minecraft:geometry'][0];
  const png = renderTurns({
    geo,
    texture: decodePng(readFileSync(texturePath)),
    bone: arg('bone', 'spin'),
    axis: arg('axis', 'z'),
    steps: Number(arg('steps', 6)),
    cameras: [
      { yaw: 90, pitch: 0 },
      { yaw: 150, pitch: 25 },
    ],
    backgrounds: [
      [126, 168, 220],
      [30, 30, 34],
    ],
  });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  console.log(`${out}`);
}
