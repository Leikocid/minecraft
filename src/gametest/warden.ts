// The Mini Warden City template on a real engine (§13, L0-wrdn-rul2..rul5):
// buried in stone under a grass surface, in all four rotations, with the
// surface marker laid on top. Judged by the blocks in the world. Every test
// clears what it placed.

import { BlockPermutation, BlockTypes, BlockVolume, type Dimension, StructureRotation, type Vector3, world } from "@minecraft/server";
import { Test, registerAsync } from "@minecraft/server-gametest";
import { type Box, boxOf, sliceBox } from "../structures/clear";
import type { Rotation, Vec3 } from "../structures/registry";
import { ENGINE_ROTATION, ROTATIONS, rotatedSize, toWorld } from "../structures/rotate";
import wardenCityTemplate, { CENTER_XZ, CHESTS, SHRIEKERS, WARDEN_CITY_ID, WARDEN_CITY_SIZE, markerColumns } from "../structures/templates/warden-city";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const SIZE: Vec3 = [...WARDEN_CITY_SIZE];
/** Rock between the city top and the grass: three stone layers and one of dirt. */
const COVER = 4;
const ROCK = "minecraft:stone";
/** Blocks a survival player cannot break: a dig that meets one has failed. */
const UNBREAKABLE = new Set(["minecraft:bedrock", "minecraft:reinforced_deepslate", "minecraft:barrier", "minecraft:end_portal_frame"]);

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);
const v = (p: Vec3): Vector3 => ({ x: p[0], y: p[1], z: p[2] });
const fmt = (p: Vec3): string => p.join(",");
const local = (p: readonly number[]): Vec3 => [p[0], p[1], p[2]];

function fillBox(dim: Dimension, box: Box, block: string): void {
  for (const s of sliceBox(box)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), block);
}

/** The template source: block counts per name (air and structure_void excluded), void cells, distinct blocks. */
function templateFacts(): { counts: Map<string, number>; voids: number; distinct: { name: string; states: Record<string, string | number | boolean> }[] } {
  const t = wardenCityTemplate();
  const counts = new Map<string, number>();
  let voids = 0;
  for (const rows of Object.values(t.layers))
    for (const row of rows)
      for (const ch of row) {
        const name = t.blocks[ch].name;
        if (name === "minecraft:structure_void") voids++;
        else if (name !== "minecraft:air") counts.set(name, (counts.get(name) ?? 0) + 1);
      }
  const distinct = Object.values(t.blocks).map((b) => ({ name: b.name, states: b.states ?? {} }));
  return { counts, voids, distinct };
}

interface Site {
  dim: Dimension;
  /** City min corner. */
  loc: Vec3;
  /** The whole worked volume: city, cover, surface and one layer above it. */
  box: Box;
  surfaceY: number;
}

/** Stone around and above the city's box, dirt and grass on top: a buried site with a real surface. */
function buryCity(site: Site, rot: Rotation): void {
  const { dim, loc, box, surfaceY } = site;
  fillBox(dim, box, "minecraft:air");
  fillBox(dim, { min: box.min, max: [box.max[0], surfaceY - 2, box.max[2]] }, ROCK);
  fillBox(dim, { min: [box.min[0], surfaceY - 1, box.min[2]], max: [box.max[0], surfaceY - 1, box.max[2]] }, "minecraft:dirt");
  fillBox(dim, { min: [box.min[0], surfaceY, box.min[2]], max: [box.max[0], surfaceY, box.max[2]] }, "minecraft:grass_block");
  world.structureManager.place(WARDEN_CITY_ID, dim, v(loc), { rotation: StructureRotation[ENGINE_ROTATION[rot]], includeEntities: false });
}

/**
 * Lay the marker on the surface: sculk replaces the top block of its column,
 * a vein lies on top of it. Only columns whose top is natural ground take it.
 */
function layMarker(site: Site, rot: Rotation): Vec3 {
  const { dim, loc, surfaceY } = site;
  const vein = BlockPermutation.resolve("minecraft:sculk_vein", { multi_face_direction_bits: 1 });
  let center: Vec3 | undefined;
  for (const c of markerColumns(loc, rot)) {
    let y = surfaceY + 1;
    while (y > loc[1] && dim.getBlock({ x: c.x, y, z: c.z })?.isAir === true) y--;
    const top = dim.getBlock({ x: c.x, y, z: c.z });
    if (top === undefined || !["minecraft:grass_block", "minecraft:dirt", ROCK].includes(top.typeId)) continue;
    if (c.kind === "sculk") top.setType("minecraft:sculk");
    else dim.getBlock({ x: c.x, y: y + 1, z: c.z })?.setPermutation(vein);
    if (c.center) center = [c.x, y, c.z];
  }
  if (center === undefined) throw new Error("marker centre was not laid");
  return center;
}

async function withSites(test: Test, name: string, body: (site: Site) => Promise<void>): Promise<void> {
  const dim = test.getDimension();
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const loc: Vec3 = [b.x - CENTER_XZ[0], b.y + 6, b.z - CENTER_XZ[1]];
  const surfaceY = loc[1] + SIZE[1] + COVER;
  const box: Box = { min: [loc[0], loc[1], loc[2]], max: [loc[0] + SIZE[0] - 1, surfaceY + 1, loc[2] + SIZE[2] - 1] };
  const unload = await loadBox(test, dim, name, box);
  try {
    await body({ dim, loc, box, surfaceY });
  } finally {
    fillBox(dim, box, "minecraft:air");
    for (const e of dim.getEntities({ location: v([loc[0] + CENTER_XZ[0], loc[1] + SIZE[1] / 2, loc[2] + CENTER_XZ[1]]), maxDistance: 64, type: "minecraft:item" })) e.remove();
    unload();
  }
}

registerAsync("andrew", "warden_rotations", async (test: Test): Promise<void> => {
  const facts = templateFacts();
  const unknown = [...facts.counts.keys()].filter((n) => BlockTypes.get(n) === undefined);
  test.assert(unknown.length === 0, `template names the engine does not know: ${unknown.join(" ")}`);
  // A state the engine does not accept would be silently dropped by the structure loader.
  const badStates: string[] = [];
  for (const d of facts.distinct) {
    if (d.name === "minecraft:structure_void" || d.name === "minecraft:air") continue;
    try {
      BlockPermutation.resolve(d.name, d.states);
    } catch (e) {
      badStates.push(`${d.name} ${JSON.stringify(d.states)}: ${String(e)}`);
    }
  }
  test.assert(badStates.length === 0, `states the engine rejects: ${badStates.join("; ")}`);

  await withSites(test, "andrew_gt_warden_r", async (site) => {
    const { dim, loc } = site;
    const verdicts: string[] = [];
    for (const rot of ROTATIONS) {
      buryCity(site, rot);
      const markerCenter = layMarker(site, rot);
      const problems: string[] = [];

      // The city's box, block by block.
      const cityBox = boxOf(loc, rotatedSize(SIZE, rot));
      const counts = new Map<string, number>();
      const found = new Map<string, string>();
      const min: Vec3 = [Infinity, Infinity, Infinity];
      const max: Vec3 = [-Infinity, -Infinity, -Infinity];
      let stone = 0;
      for (let y = cityBox.min[1]; y <= cityBox.max[1]; y++) {
        for (let x = cityBox.min[0]; x <= cityBox.max[0]; x++) {
          for (let z = cityBox.min[2]; z <= cityBox.max[2]; z++) {
            const blk = dim.getBlock({ x, y, z });
            if (blk === undefined) throw new Error(`${x},${y},${z} unloaded during the scan`);
            if (blk.isAir) continue;
            if (blk.typeId === ROCK) {
              stone++;
              continue;
            }
            counts.set(blk.typeId, (counts.get(blk.typeId) ?? 0) + 1);
            found.set(`${x},${y},${z}`, blk.typeId);
            const p = [x, y, z];
            for (let i = 0; i < 3; i++) [min[i], max[i]] = [Math.min(min[i], p[i]), Math.max(max[i], p[i])];
          }
          // About a thousand reads a tick: a whole 63×63 layer in one tick trips the script watchdog.
          if ((x - cityBox.min[0]) % 16 === 15) await test.idle(1);
        }
        await test.idle(1);
      }
      for (const [name, n] of facts.counts) if (counts.get(name) !== n) problems.push(`${name}: ${counts.get(name) ?? 0} in the world, ${n} in the template`);
      for (const [name, n] of counts) if (!facts.counts.has(name)) problems.push(`${name}: ${n} in the world, none in the template`);
      // structure_void keeps the ground: the stone left in the box is exactly the void cells.
      if (stone !== facts.voids) problems.push(`${stone} stone cells kept, ${facts.voids} structure_void cells in the template`);

      for (const c of CHESTS) {
        const w = fmt(toWorld(loc, local(c.at), SIZE, rot));
        if (found.get(w) !== "minecraft:chest") problems.push(`no chest at ${w} (template ${fmt(local(c.at))})`);
      }
      for (const sh of SHRIEKERS) {
        const p = toWorld(loc, local(sh.at), SIZE, rot);
        const blk = dim.getBlock(v(p));
        const got = blk === undefined ? undefined : { typeId: blk.typeId, states: blk.permutation.getAllStates() };
        if (got?.typeId !== "minecraft:sculk_shrieker" || got.states.can_summon !== true) problems.push(`${sh.slot} shrieker at ${fmt(p)}: ${JSON.stringify(got)}`);
      }

      // The marker: the rotated pattern exactly, and its centre over the centre of what was built.
      for (const c of markerColumns(loc, rot)) {
        const top = dim.getBlock({ x: c.x, y: site.surfaceY, z: c.z })?.typeId;
        const above = dim.getBlock({ x: c.x, y: site.surfaceY + 1, z: c.z })?.typeId;
        const ok = c.kind === "sculk" ? top === "minecraft:sculk" : top === "minecraft:grass_block" && above === "minecraft:sculk_vein";
        if (!ok) problems.push(`marker ${c.kind} at ${c.x},${c.z}: ${top} under ${above}`);
      }
      let surfaceSculk = 0;
      for (let x = site.box.min[0]; x <= site.box.max[0]; x++) {
        for (let z = site.box.min[2]; z <= site.box.max[2]; z++) {
          const t = dim.getBlock({ x, y: site.surfaceY, z })?.typeId;
          const a = dim.getBlock({ x, y: site.surfaceY + 1, z })?.typeId;
          if (t === "minecraft:sculk" || a === "minecraft:sculk_vein") surfaceSculk++;
        }
        if (x % 16 === 0) await test.idle(1);
      }
      const want = markerColumns(loc, rot).length;
      if (surfaceSculk !== want) problems.push(`${surfaceSculk} sculk columns on the surface, the marker has ${want}`);
      const centreX = (min[0] + max[0]) / 2;
      const centreZ = (min[2] + max[2]) / 2;
      if (markerCenter[0] !== centreX || markerCenter[2] !== centreZ)
        problems.push(`marker centre ${markerCenter[0]},${markerCenter[2]} is not over the city centre ${centreX},${centreZ} (built ${fmt(min)}..${fmt(max)})`);

      for (const p of problems) log(`warden rot=${rot * 90} MISMATCH ${p}`);
      verdicts.push(`${rot * 90}:${problems.length === 0 ? "ok" : `${problems.length} mismatch(es)`}`);
      log(`warden rot=${rot * 90}: blocks=${found.size} kept stone=${stone} built ${fmt(min)}..${fmt(max)} marker centre ${fmt(markerCenter)} (${want} cells)`);
      await test.idle(1);
    }
    log(`warden rotations: ${verdicts.join(" ")}`);
    test.assert(verdicts.every((x) => x.endsWith(":ok")), `rotations: ${verdicts.join(" ")}`);
  });
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");

registerAsync("andrew", "warden_dig_down", async (test: Test): Promise<void> => {
  await withSites(test, "andrew_gt_warden_d", async (site) => {
    const { dim, loc, surfaceY } = site;
    const verdicts: string[] = [];
    for (const rot of ROTATIONS) {
      buryCity(site, rot);
      const [mx, my, mz] = layMarker(site, rot);
      await test.idle(1);

      // A player at the marker centre digs straight down: one block at a time,
      // each broken if it is breakable, until the next block is already open.
      const dug: string[] = [];
      let landed: Vec3 | undefined;
      let blocked = "";
      for (let y = my; y >= loc[1] - 1; y--) {
        const blk = dim.getBlock({ x: mx, y, z: mz });
        if (blk === undefined) throw new Error(`${mx},${y},${mz} unloaded`);
        if (blk.isAir) {
          landed = [mx, y, mz];
          break;
        }
        if (UNBREAKABLE.has(blk.typeId)) {
          blocked = `${blk.typeId} at y=${y}`;
          break;
        }
        dug.push(blk.typeId);
        blk.setType("minecraft:air");
      }

      const problems: string[] = [];
      if (blocked) problems.push(`the dig hit ${blocked}`);
      if (landed === undefined) problems.push(`no open space under the marker after ${dug.length} blocks`);
      else {
        // Inside the city, below its roof, with the open cell under it too — a drop into a room.
        if (landed[1] < loc[1] || landed[1] >= loc[1] + SIZE[1]) problems.push(`landed at ${fmt(landed)}, outside the city's height`);
        if (dim.getBlock({ x: landed[0], y: landed[1] - 1, z: landed[2] })?.isAir !== true) problems.push(`no room under ${fmt(landed)}`);
        // A room, not a pocket: the open floor at the landing level spreads wide.
        const seen = new Set([fmt(landed)]);
        const queue: Vec3[] = [landed];
        while (queue.length > 0 && seen.size < 400) {
          const c = queue.pop() as Vec3;
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const n: Vec3 = [c[0] + dx, c[1], c[2] + dz];
            if (seen.has(fmt(n)) || dim.getBlock(v(n))?.isAir !== true) continue;
            seen.add(fmt(n));
            queue.push(n);
          }
        }
        if (seen.size < 50) problems.push(`landed in a pocket of ${seen.size} cells at ${fmt(landed)}`);
        // No ready shaft: the whole cover plus the city roof had to be broken.
        if (dug.length < COVER + 1 + 2) problems.push(`only ${dug.length} blocks dug: a shaft was already there`);
        log(`warden dig rot=${rot * 90}: from ${mx},${my},${mz} broke ${dug.length} (${dug.join(" ")}) landed ${fmt(landed)}, open floor ${seen.size >= 400 ? "400+" : seen.size}`);
      }
      if (my !== surfaceY) problems.push(`marker centre at y=${my}, the surface is ${surfaceY}`);

      for (const p of problems) log(`warden dig rot=${rot * 90} MISMATCH ${p}`);
      verdicts.push(`${rot * 90}:${problems.length === 0 ? "ok" : `${problems.length} problem(s)`}`);
      await test.idle(1);
    }
    log(`warden dig down: ${verdicts.join(" ")}`);
    test.assert(verdicts.every((x) => x.endsWith(":ok")), `dig down: ${verdicts.join(" ")}`);
  });
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

export const WARDEN_TESTS = ["warden_rotations", "warden_dig_down"];

log(`registered ${WARDEN_TESTS.length} warden test(s): ${WARDEN_TESTS.join(" ")}`);
