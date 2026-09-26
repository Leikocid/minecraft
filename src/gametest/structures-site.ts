// Site suitability on a real engine (L0-strf-r005..r007): profiles cancel
// instead of relocating, a player build cancels and stays byte-identical, an
// unloaded footprint waits as pending, and a build made after validation is
// caught by the recheck. Sites lie away from the test platform and are loaded
// with /tickingarea (probe Q11), because GameTest keeps only its own area loaded.

import { BlockTypes, BlockVolume, type Dimension, type Vector3 } from "@minecraft/server";
import { Test, registerAsync } from "@minecraft/server-gametest";
import { type RollDef, ROLL_DEFS } from "../structures/config";
import { Discovery } from "../structures/discovery";
import { Registry, SALT_KEY, clearTestHook, installTestHook } from "../structures/registry";
import { type Candidate, buildCandidate } from "../structures/roll";
import { SiteChecker, SiteGate, coveredChunks, dimensionView } from "../structures/site";
import { MemoryStore } from "../structures/store";

const STRUCTURE = "andrew:platform";
const SALT = "gt-site";
const CHUNK = 16;

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);
const def = (id: string): RollDef => ROLL_DEFS.find((d) => d.id === id) as RollDef;

interface Rig {
  reg: Registry;
  checker: SiteChecker;
  gate: SiteGate;
  disc: Discovery;
}

function rig(dim: Dimension, defs: RollDef[]): Rig {
  const store = new MemoryStore();
  store.set(SALT_KEY, SALT);
  const reg = new Registry(store, log);
  const view = dimensionView(dim, { BlockVolume, BlockTypes });
  const checker = new SiteChecker((d) => (d === "o" ? view : undefined), () => SALT, { registry: reg, log });
  let disc: Discovery | undefined;
  const gate = new SiteGate(checker, reg, () => disc?.stats.slices ?? 0, log);
  disc = new Discovery(reg, gate.site, { defs, log });
  return { reg, checker, gate, disc };
}

const candidate = (id: string, cx: number, cz: number): Candidate => buildCandidate(SALT, "o", cx, cz, def(id));

/** Every chunk under the candidate plus margin, loaded by one rectangular ticking area; returns its remover. */
async function loadSite(test: Test, dim: Dimension, name: string, cands: Candidate[]): Promise<() => void> {
  const chunks = cands.flatMap((c) => coveredChunks(c.x, c.z, c.size[0], c.size[2]));
  const xs = chunks.map(([x]) => x);
  const zs = chunks.map(([, z]) => z);
  const [x0, x1, z0, z1] = [Math.min(...xs) * CHUNK, Math.max(...xs) * CHUNK + 15, Math.min(...zs) * CHUNK, Math.max(...zs) * CHUNK + 15];
  const added = dim.runCommand(`tickingarea add ${x0} 0 ${z0} ${x1} 0 ${z1} ${name}`).successCount;
  const remove = (): void => {
    try {
      dim.runCommand(`tickingarea remove ${name}`);
    } catch (e) {
      log(`strf site: tickingarea remove ${name} threw ${String(e)}`);
    }
  };
  if (added === 0) throw new Error(`tickingarea add ${name} refused`);
  for (let t = 0; t < 300; t++) {
    if (chunks.every(([cx, cz]) => dim.isChunkLoaded({ x: cx * CHUNK, y: 0, z: cz * CHUNK }))) {
      log(`strf site: ${name} loaded ${chunks.length} chunk(s) after ${t} tick(s)`);
      return remove;
    }
    await test.idle(1);
  }
  remove();
  throw new Error(`${name}: chunks not loaded after 300 ticks`);
}

const fill = (dim: Dimension, a: Vector3, b: Vector3, block: string): void => {
  dim.fillBlocks(new BlockVolume(a, b), block);
};

/** Every block of the footprint plus margin over a band of Y, as one string. */
function snapshot(dim: Dimension, c: Candidate, y0: number, y1: number): string {
  const parts: string[] = [];
  for (let x = c.x - 2; x < c.x + c.size[0] + 2; x++) {
    for (let z = c.z - 2; z < c.z + c.size[2] + 2; z++) {
      for (let y = y0; y <= y1; y++) parts.push(dim.getBlock({ x, y, z })?.typeId ?? "?");
    }
  }
  return parts.join(",");
}

/** A small player build: 4×4 planks floor, a 3-high planks wall on one edge, a chest on the floor. */
function buildHut(dim: Dimension, c: Candidate, ground: number): Vector3[] {
  const bx = c.x + 10;
  const bz = c.z + 10;
  fill(dim, { x: bx, y: ground + 1, z: bz }, { x: bx + 3, y: ground + 1, z: bz + 3 }, "minecraft:oak_planks");
  fill(dim, { x: bx, y: ground + 2, z: bz }, { x: bx + 3, y: ground + 4, z: bz }, "minecraft:oak_planks");
  const chest = { x: bx + 1, y: ground + 2, z: bz + 2 };
  dim.setBlockType(chest, "minecraft:chest");
  return [{ x: bx, y: ground + 1, z: bz }, { x: bx + 3, y: ground + 4, z: bz }, chest];
}

const groundAt = (dim: Dimension, c: Candidate): number => {
  const top = dim.getTopmostBlock({ x: c.x + Math.floor(c.size[0] / 2), z: c.z + Math.floor(c.size[2] / 2) });
  if (top === undefined) throw new Error(`no surface at ${c.id}`);
  return top.location.y;
};

function hereChunk(test: Test): [number, number] {
  const here = test.worldBlockLocation({ x: 0, y: 1, z: 0 });
  return [Math.floor(here.x / CHUNK), Math.floor(here.z / CHUNK)];
}

// ------------------------------------------------ AC2: water and slope cancel, good site passes

registerAsync("andrew", "strf_site_profiles", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const [hx, hz] = hereChunk(test);
  const row = hz + 12;
  const [wet, slope, good] = [hx, hx + 4, hx + 8].map((cx) => candidate("windmill", cx, row));
  const { reg, checker, disc } = rig(dim, [def("windmill")]);
  installTestHook({ outcomes: [wet, slope, good].map((c): [string, "o", number, number, boolean] => ["windmill", "o", c.cx, c.cz, true]) });
  const unload = await loadSite(test, dim, "andrew_gt_site_a", [wet, slope, good]);
  const g = groundAt(dim, good);
  const wetTo = wet.x + Math.floor(wet.size[0] * 0.3);
  try {
    fill(dim, { x: wet.x, y: g, z: wet.z }, { x: wetTo, y: g, z: wet.z + wet.size[2] - 1 }, "minecraft:water");
    fill(dim, { x: slope.x + 17, y: g + 1, z: slope.z }, { x: slope.x + slope.size[0] - 1, y: g + 6, z: slope.z + slope.size[2] - 1 }, "minecraft:stone");

    const probe = { x: wet.x + 1, z: wet.z + 1 };
    const top = dim.getTopmostBlock(probe);
    log(
      `strf site profiles: wet column ${probe.x},${probe.z} getBlock(y=${g})=${dim.getBlock({ ...probe, y: g })?.typeId} ` +
        `getBlock(y=${g + 1})=${dim.getBlock({ ...probe, y: g + 1 })?.typeId} getTopmostBlock=${top?.typeId}@${top?.location.y}`
    );
    const t0 = Date.now();
    const out = [wet, slope, good].map((c) => disc.evaluateChunk("o", c.cx, c.cz).results[0]);
    log(`strf site profiles: ground=${g} ${JSON.stringify(out)} in ${Date.now() - t0} ms; ${checker.statsLine()}`);
    const ids = reg.allInstances().map((i) => `${i.id}@${i.origin.join(",")}`);
    test.assert(out[0].outcome === "rejected" && out[0].reason === "liquid", `water site: ${JSON.stringify(out[0])}`);
    test.assert(out[1].outcome === "rejected" && out[1].reason === "uneven", `slope site: ${JSON.stringify(out[1])}`);
    test.assert(out[2].outcome === "planned", `good site: ${JSON.stringify(out[2])}`);
    test.assert(ids.length === 1 && ids[0].startsWith(`${good.id}@${good.x},${g + 1},${good.z}`), `records (no relocation expected): ${ids.join(" ")}`);
    test.assert(reg.isEvaluated("o", wet.cx, wet.cz) && reg.isEvaluated("o", slope.cx, slope.cz), "a rejected chunk is not marked evaluated");
    test.succeed();
  } finally {
    fill(dim, { x: wet.x, y: g, z: wet.z }, { x: wetTo, y: g, z: wet.z + wet.size[2] - 1 }, "minecraft:grass_block");
    fill(dim, { x: slope.x + 17, y: g + 1, z: slope.z }, { x: slope.x + slope.size[0] - 1, y: g + 6, z: slope.z + slope.size[2] - 1 }, "minecraft:air");
    unload();
    clearTestHook();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC3: a player build cancels and is left intact

registerAsync("andrew", "strf_site_player_build", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const [hx, hz] = hereChunk(test);
  const c = candidate("windmill", hx + 12, hz + 12);
  const { reg, checker, disc } = rig(dim, [def("windmill")]);
  installTestHook({ outcomes: [["windmill", "o", c.cx, c.cz, true]] });
  const unload = await loadSite(test, dim, "andrew_gt_site_b", [c]);
  const g = groundAt(dim, c);
  try {
    const cells = buildHut(dim, c, g);
    const before = snapshot(dim, c, g - 1, g + 6);
    const res = disc.evaluateChunk("o", c.cx, c.cz).results[0];
    const after = snapshot(dim, c, g - 1, g + 6);
    log(`strf site player build: ${JSON.stringify(res)} cells=${before.split(",").length} identical=${before === after}; ${checker.statsLine()}`);
    test.assert(res.outcome === "rejected" && res.reason === "collision:player", `player build: ${JSON.stringify(res)}`);
    test.assert(reg.allInstances().length === 0, "a record was written for a cancelled candidate");
    test.assert(before === after, "blocks of the footprint changed");
    test.assert(dim.getBlock(cells[2])?.typeId === "minecraft:chest", "the chest is gone");
    test.succeed();
  } finally {
    fill(dim, { x: c.x + 10, y: g + 1, z: c.z + 10 }, { x: c.x + 13, y: g + 4, z: c.z + 13 }, "minecraft:air");
    unload();
    clearTestHook();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC4: unloaded footprint → pending → same candidate placed

registerAsync("andrew", "strf_site_pending_unloaded", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const [hx, hz] = hereChunk(test);
  const c = candidate("airship", hx, hz + 250);
  const { reg, gate, disc } = rig(dim, [def("airship")]);
  installTestHook({ outcomes: [["airship", "o", c.cx, c.cz, true]] });
  let unload = (): void => {};
  let writes = 0;
  try {
    const covered = coveredChunks(c.x, c.z, c.size[0], c.size[2]);
    test.assert(
      covered.every(([cx, cz]) => !dim.isChunkLoaded({ x: cx * CHUNK, y: 0, z: cz * CHUNK })),
      `premise: the far site ${c.id} is already loaded`
    );
    const first = disc.evaluateChunk("o", c.cx, c.cz);
    const held = gate.held.get(c.id);
    log(`strf site pending: first ${JSON.stringify(first)} held=${JSON.stringify(held && { x: held.cand.x, z: held.cand.z, rot: held.cand.rot, state: held.state })}`);
    test.assert(first.results[0].outcome === "pending", `unloaded site: ${JSON.stringify(first.results[0])}`);
    test.assert(!first.evaluated && !reg.isEvaluated("o", c.cx, c.cz), "evaluated bit set on a pending chunk");
    test.assert(reg.allInstances().length === 0 && reg.shardKeys().length === 0, "registry written for a pending candidate");
    test.assert(held?.state === "unloaded", "pending candidate not held");

    unload = await loadSite(test, dim, "andrew_gt_site_c", [c]);
    const second = disc.evaluateChunk("o", c.cx, c.cz);
    const inst = reg.get("o", [c.x, 0, c.z], c.id);
    test.assert(second.results[0].outcome === "planned" && inst !== undefined, `after loading: ${JSON.stringify(second.results[0])}`);
    if (inst === undefined) return;
    test.assert(
      inst.origin[0] === held?.cand.x && inst.origin[2] === held.cand.z && inst.rot === held.cand.rot,
      `moved: held ${held?.cand.x},${held?.cand.z} rot ${held?.cand.rot} -> ${inst.origin.join(",")} rot ${inst.rot}`
    );
    const far: Vector3 = { x: inst.origin[0] + inst.size[0] - 1, y: inst.origin[1] + inst.size[1] - 1, z: inst.origin[2] + inst.size[2] - 1 };
    const near: Vector3 = { x: inst.origin[0], y: inst.origin[1], z: inst.origin[2] };
    const r = gate.occupy(inst, () => {
      writes++;
      dim.setBlockType(near, "minecraft:gold_block");
      dim.setBlockType(far, "minecraft:gold_block");
    });
    log(`strf site pending: occupy ${JSON.stringify(r)} origin=${inst.origin.join(",")} rot=${inst.rot} writes=${writes}`);
    test.assert(r.kind === "placed" && writes === 1, `occupy: ${JSON.stringify(r)}`);
    test.assert(reg.get("o", inst.origin, inst.id)?.state === "placed", "record not placed");
    test.assert(dim.getBlock(near)?.typeId === "minecraft:gold_block" && dim.getBlock(far)?.typeId === "minecraft:gold_block", "markers missing");
    dim.setBlockType(near, "minecraft:air");
    dim.setBlockType(far, "minecraft:air");
    test.succeed();
  } finally {
    unload();
    clearTestHook();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC5: a build between check and occupation is caught

registerAsync("andrew", "strf_site_recheck", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const [hx, hz] = hereChunk(test);
  const c = candidate("windmill", hx + 16, hz + 12);
  const { reg, checker, disc, gate } = rig(dim, [def("windmill")]);
  installTestHook({ outcomes: [["windmill", "o", c.cx, c.cz, true]] });
  const unload = await loadSite(test, dim, "andrew_gt_site_d", [c]);
  const g = groundAt(dim, c);
  try {
    disc.enqueue("o", c.cx, c.cz);
    const job = disc.job();
    while (job.next().done !== true);
    const inst = reg.get("o", [c.x, 0, c.z], c.id);
    test.assert(inst?.state === "planned", `validation did not reserve: ${JSON.stringify(disc.stats.outcomes.windmill)}`);
    if (inst === undefined) return;
    test.assert(gate.held.get(c.id)?.slice === 0 && disc.stats.slices >= 1, `slice clock: held ${gate.held.get(c.id)?.slice} now ${disc.stats.slices}`);

    await test.idle(1);
    buildHut(dim, c, g);
    const before = snapshot(dim, c, g - 1, g + 6);
    let writes = 0;
    const r = gate.occupy(inst, () => {
      writes++;
      fill(dim, { x: c.x, y: inst.origin[1], z: c.z }, { x: c.x + c.size[0] - 1, y: inst.origin[1] + 3, z: c.z + c.size[2] - 1 }, "minecraft:air");
    });
    const after = snapshot(dim, c, g - 1, g + 6);
    const rec = reg.get("o", inst.origin, inst.id);
    log(`strf site recheck: ${JSON.stringify(r)} writes=${writes} state=${rec?.state} identical=${before === after}; ${checker.statsLine()}`);
    test.assert(r.kind === "rejected" && r.reason === "collision:player", `recheck: ${JSON.stringify(r)}`);
    test.assert(writes === 0, "the world was written");
    test.assert(rec?.state === "failed", `record state ${rec?.state}`);
    test.assert(before === after, "blocks of the footprint changed");
    test.succeed();
  } finally {
    fill(dim, { x: c.x + 10, y: g + 1, z: c.z + 10 }, { x: c.x + 13, y: g + 4, z: c.z + 13 }, "minecraft:air");
    unload();
    clearTestHook();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

export const STRF_SITE_TESTS = ["strf_site_profiles", "strf_site_player_build", "strf_site_pending_unloaded", "strf_site_recheck"];
