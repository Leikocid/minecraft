// Placement on a real engine (L0-strf-p003, L0-strf-p004): all four rotations
// judged by the blocks in the world, a clear larger than one fillBlocks call,
// block entities that survive place, a resume after an interrupted chest fill,
// and a legendary in a holder under the write box surviving the write
// (L0-lgnd-p008). Every test clears what it placed.

import {
  BlockComponentTypes,
  BlockTypes,
  BlockVolume,
  Difficulty,
  type Dimension,
  EnchantmentType,
  type Entity,
  GameMode,
  ItemStack,
  StructureRotation,
  type Vector3,
  world,
} from "@minecraft/server";
import { Test, registerAsync } from "@minecraft/server-gametest";
import { forgetWatched, protectLegendariesIn } from "../legendary/recovery";
import { WEB_SWORD } from "../legendary/registry";
import { withoutOwed } from "../legendary/rules";
import { getMark, isItemOf, ledgerGen, markItem, readOwed, writeOwed } from "../legendary/state";
import { BODIES } from "../structures/bodies";
import { type Box, FILL_CELL_LIMIT, boxOf, cells, sliceBox } from "../structures/clear";
import { type PlaceHooks, type PlaceWorld, Placer, type StructureBody, CHESTS_FILLED, engineWorld } from "../structures/place";
import { EnabledTypes } from "../structures/config";
import { type Instance, type Rotation, type Vec3, Registry, SALT_KEY } from "../structures/registry";
import type { Candidate } from "../structures/roll";
import { StrfRuntime, engineStrf } from "../structures/runtime";
import { ROTATIONS, rotateCardinal, rotatedSize, toWorld } from "../structures/rotate";
import { coveredChunks } from "../structures/site";
import { MemoryStore } from "../structures/store";

const STRUCTURE = "andrew:platform";
const TEMPLATE = "andrew:probe_box";
const DEF = "probe_box";
const CHUNK = 16;

/** Template-local points of src/structures/templates/probe_box.json, declared here, not read from the template. */
const BOX_SIZE: Vec3 = [9, 5, 7];
const CHESTS: Vec3[] = [
  [2, 1, 1],
  [6, 1, 1],
];
const SPAWNER: Vec3 = [4, 1, 3];
const SHRIEKER: Vec3 = [4, 1, 5];
const STAIRS: Vec3 = [2, 1, 5];
const DOOR_LOWER: Vec3 = [4, 1, 0];
const DOOR_UPPER: Vec3 = [4, 2, 0];
const DOOR_FACING = "south";
/** Bedrock stairs weirdo_direction 0..3 = east, west, south, north. */
const WEIRDO = ["east", "west", "south", "north"];
const STAIRS_WEIRDO = 3;

const SPAWNER_WAIT_TICKS = 1200;

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);
const v = (p: Vec3): Vector3 => ({ x: p[0], y: p[1], z: p[2] });
const fmt = (p: Vec3): string => p.join(",");

function body(extra: Partial<StructureBody> = {}): Record<string, StructureBody> {
  return { [DEF]: { templateId: TEMPLATE, chests: CHESTS.map((local, i) => ({ local, table: `gt:${i}` })), ...extra } };
}

function registry(store = new MemoryStore()): Registry {
  if (store.get(SALT_KEY) === undefined) store.set(SALT_KEY, "gt-place");
  return new Registry(store, log);
}

function plan(reg: Registry, origin: Vec3, rot: Rotation, size: Vec3 = rotatedSize(BOX_SIZE, rot)): Instance {
  const r = reg.plan({ def: DEF, dim: "o", origin, rot, size, id: `${DEF}:gt:${fmt(origin)}:${rot}:${Date.now()}` });
  if (!r.ok) throw new Error(`plan blocked by ${r.blockedBy.id}`);
  return r.instance;
}

// world.structureManager throws in early execution; read it only inside a test.
const api = () => ({ structureManager: world.structureManager, BlockVolume, StructureRotation, protectLegendaries: protectLegendariesIn });

function fillBox(dim: Dimension, box: Box, block: string): void {
  for (const s of sliceBox(box)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), block);
}

/** Ticking areas over every chunk under the box; resolves once all are loaded, returns their remover. */
export async function loadBox(test: Test, dim: Dimension, name: string, box: Box): Promise<() => void> {
  const chunks = coveredChunks(box.min[0], box.min[2], box.max[0] - box.min[0] + 1, box.max[2] - box.min[2] + 1);
  const xs = chunks.map(([x]) => x);
  const zs = chunks.map(([, z]) => z);
  const [cx0, cx1, cz0, cz1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  // One ticking area may not exceed 100 chunks, and the engine snaps each one outward to
  // chunk bounds — so a box that measures 10×10 becomes 11×11 and is refused for its size,
  // which no amount of freeing slots fixes. Tiles of 8 stay clear of both effects.
  const TILE = 8;
  const tiles: { x0: number; x1: number; z0: number; z1: number; name: string }[] = [];
  for (let a = cx0; a <= cx1; a += TILE)
    for (let b = cz0; b <= cz1; b += TILE)
      tiles.push({
        x0: a * CHUNK,
        x1: Math.min(a + TILE - 1, cx1) * CHUNK + 15,
        z0: b * CHUNK,
        z1: Math.min(b + TILE - 1, cz1) * CHUNK + 15,
        name: tiles.length === 0 ? name : `${name}${tiles.length}`,
      });

  const remove = (): void => {
    for (const tile of tiles) {
      try {
        dim.runCommand(`tickingarea remove ${tile.name}`);
      } catch (e) {
        log(`strf place: tickingarea remove ${tile.name} threw ${String(e)}`);
      }
    }
  };

  const add = (tile: (typeof tiles)[number]): number =>
    dim.runCommand(`tickingarea add ${tile.x0} 0 ${tile.z0} ${tile.x1} 0 ${tile.z1} ${tile.name}`).successCount;
  for (const tile of tiles) {
    if (add(tile) !== 0) continue;
    // The engine caps how many ticking areas a world may hold — measured at ten by the
    // strf probe (Q11). Every test releases its own, but `tickingarea remove` does not
    // free the slot in the same tick, so a back-to-back suite can meet the cap without
    // anything leaking. Clear the leftovers once and retry; the log keeps a real leak
    // visible instead of hiding behind the retry.
    log(`strf place: tickingarea add ${tile.name} refused — clearing leftover areas and retrying once`);
    try {
      dim.runCommand("tickingarea remove_all");
    } catch (e) {
      log(`strf place: tickingarea remove_all threw ${String(e)}`);
    }
    if (add(tile) === 0) {
      remove();
      throw new Error(
        `tickingarea add ${tile.name} refused twice, after remove_all — ${tiles.length} tile(s) for ${cx1 - cx0 + 1}×${cz1 - cz0 + 1} chunks`
      );
    }
  }

  for (let t = 0; t < 300; t++) {
    if (chunks.every(([cx, cz]) => dim.isChunkLoaded({ x: cx * CHUNK, y: 0, z: cz * CHUNK }))) return remove;
    await test.idle(1);
  }
  remove();
  throw new Error(`${name}: chunks not loaded after 300 ticks`);
}

/** Non-air cells of a box, by position. */
function scan(dim: Dimension, box: Box): Map<string, { at: Vec3; typeId: string; states: Record<string, boolean | number | string> }> {
  const out = new Map<string, { at: Vec3; typeId: string; states: Record<string, boolean | number | string> }>();
  for (let x = box.min[0]; x <= box.max[0]; x++)
    for (let y = box.min[1]; y <= box.max[1]; y++)
      for (let z = box.min[2]; z <= box.max[2]; z++) {
        const b = dim.getBlock({ x, y, z });
        if (b === undefined) throw new Error(`${x},${y},${z} unloaded during the scan`);
        if (!b.isAir) out.set(`${x},${y},${z}`, { at: [x, y, z], typeId: b.typeId, states: b.permutation.getAllStates() });
      }
  return out;
}

function countType(dim: Dimension, box: Box, typeId: string): { found: number; unloaded: number } {
  let found = 0;
  let unloaded = 0;
  for (let x = box.min[0]; x <= box.max[0]; x++)
    for (let y = box.min[1]; y <= box.max[1]; y++)
      for (let z = box.min[2]; z <= box.max[2]; z++) {
        const b = dim.getBlock({ x, y, z });
        if (b === undefined) unloaded++;
        else if (b.typeId === typeId) found++;
      }
  return { found, unloaded };
}

const noHooks: PlaceHooks = { fillChest: () => {} };

const base = (test: Test): Vec3 => {
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  return [b.x, b.y, b.z];
};

// ------------------------------------------------ AC1: four rotations, judged by the world

registerAsync("andrew", "strf_place_rotations", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const b = base(test);
  const loc: Vec3 = [b[0], b[1] + 14, b[2]];
  // Wide enough to catch a box rotated about its origin block instead of inside its AABB.
  const area: Box = { min: [loc[0] - 10, loc[1] - 2, loc[2] - 10], max: [loc[0] + 19, loc[1] + 6, loc[2] + 19] };
  const unload = await loadBox(test, dim, "andrew_gt_place_a", area);
  const verdicts: string[] = [];
  let reference = -1;
  try {
    test.assert(scan(dim, area).size === 0, "scan area not empty before placing");
    for (const rot of ROTATIONS) {
      const reg = registry();
      const placer = new Placer(reg, engineWorld(dim, api()), body(), noHooks, log);
      const inst = plan(reg, loc, rot);
      const r = placer.run(inst);
      test.assert(r.place === "placed" && r.state === "done", `rot ${rot}: ${JSON.stringify(r)}`);
      const found = [...scan(dim, area).values()];
      fillBox(dim, area, "minecraft:air");

      const min = [0, 1, 2].map((k) => Math.min(...found.map((c) => c.at[k])));
      const max = [0, 1, 2].map((k) => Math.max(...found.map((c) => c.at[k])));
      const rs = rotatedSize(BOX_SIZE, rot);
      const problems: string[] = [];
      if (fmt(min as Vec3) !== fmt(loc)) problems.push(`min corner ${min.join(",")} != location ${fmt(loc)}`);
      if ([0, 1, 2].some((k) => max[k] - min[k] + 1 !== rs[k])) problems.push(`AABB ${max.map((m, k) => m - min[k] + 1).join("x")} != ${rs.join("x")}`);
      if (reference < 0) reference = found.length;
      else if (found.length !== reference) problems.push(`${found.length} blocks, rotation 0 had ${reference}`);

      const at = new Map(found.map((c) => [fmt(c.at), c]));
      const expect = (label: string, p: Vec3, typeId: string, states: Record<string, boolean | number | string> = {}): void => {
        const w = toWorld(loc, p, BOX_SIZE, rot);
        const cell = at.get(fmt(w));
        if (cell?.typeId !== typeId) {
          problems.push(`${label}: ${typeId} expected at ${fmt(w)}, found ${cell?.typeId ?? "air"}`);
          return;
        }
        for (const [k, want] of Object.entries(states)) {
          if (cell.states[k] !== want) problems.push(`${label} ${k}=${String(cell.states[k])}, expected ${String(want)}`);
        }
      };
      CHESTS.forEach((p, i) => expect(`chest${i}`, p, "minecraft:chest"));
      expect("spawner", SPAWNER, "minecraft:mob_spawner");
      expect("shrieker", SHRIEKER, "minecraft:sculk_shrieker");
      const facing = rotateCardinal(DOOR_FACING, rot);
      expect("door-lower", DOOR_LOWER, "minecraft:wooden_door", { upper_block_bit: false, "minecraft:cardinal_direction": facing });
      expect("door-upper", DOOR_UPPER, "minecraft:wooden_door", { upper_block_bit: true, "minecraft:cardinal_direction": facing });
      expect("stairs", STAIRS, "minecraft:stone_brick_stairs", {
        weirdo_direction: WEIRDO.indexOf(rotateCardinal(WEIRDO[STAIRS_WEIRDO], rot)),
      });
      for (const p of problems) log(`strf place rot=${rot * 90} MISMATCH ${p}`);
      verdicts.push(`${rot * 90}:${problems.length === 0 ? "ok" : `${problems.length} mismatch(es)`}`);
      await test.idle(1);
    }
    log(`strf place rotations: ${verdicts.join(" ")} blocks=${reference}`);
    test.assert(verdicts.every((x) => x.endsWith(":ok")), `rotations: ${verdicts.join(" ")}`);
    test.succeed();
  } finally {
    fillBox(dim, area, "minecraft:air");
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC2: a clear over the one-call limit, cut and complete

registerAsync("andrew", "strf_place_clear_sliced", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const b = base(test);
  // x/z mod 16 = 8: the box crosses chunk borders on both axes.
  const origin: Vec3 = [Math.floor(b[0] / CHUNK) * CHUNK - 8, b[1] + 12, Math.floor(b[2] / CHUNK) * CHUNK - 8];
  const size: Vec3 = [40, 30, 40];
  const box = boxOf(origin, size);
  const outside: Vec3[] = [
    [box.min[0] - 1, box.min[1] + 5, box.min[2] + 5],
    [box.max[0] + 1, box.min[1] + 5, box.min[2] + 5],
    [box.min[0] + 5, box.min[1] - 1, box.min[2] + 5],
    [box.min[0] + 5, box.max[1] + 1, box.min[2] + 5],
    [box.min[0] + 5, box.min[1] + 5, box.min[2] - 1],
    [box.min[0] + 5, box.min[1] + 5, box.max[2] + 1],
  ];
  const unload = await loadBox(test, dim, "andrew_gt_place_b", { min: [box.min[0] - 1, box.min[1], box.min[2] - 1], max: [box.max[0] + 1, box.max[1], box.max[2] + 1] });
  try {
    fillBox(dim, box, "minecraft:stone");
    for (const p of outside) dim.setBlockType(v(p), "minecraft:gold_block");
    await test.idle(1);
    test.assert(countType(dim, box, "minecraft:stone").found === cells(box), "setup: box not all stone");

    const inner = engineWorld(dim, api());
    const calls: number[] = [];
    const recording: PlaceWorld = { ...inner, fill: (s) => (calls.push(cells(s)), inner.fill(s)) };
    const reg = registry();
    const placer = new Placer(reg, recording, body({ clear: true }), noHooks, log);
    const inst = plan(reg, origin, 0, size);
    const t = Date.now();
    const r = placer.place(inst);
    const ms = Date.now() - t;
    await test.idle(1);
    const left = countType(dim, box, "minecraft:stone");
    const kept = outside.filter((p) => dim.getBlock(v(p))?.typeId === "minecraft:gold_block").length;
    log(`strf place clear: ${fmt(size)}=${cells(box)} cells in ${calls.length} call(s) [${calls.join(" ")}] + place, ${ms} ms; stone left ${left.found}, unloaded ${left.unloaded}; outside markers kept ${kept}/${outside.length}`);
    test.assert(r === "placed", `place: ${r}`);
    test.assert(cells(box) > FILL_CELL_LIMIT && calls.length >= 2, `not sliced: ${calls.join(" ")}`);
    test.assert(calls.every((n) => n <= FILL_CELL_LIMIT), `a call over ${FILL_CELL_LIMIT}: ${calls.join(" ")}`);
    test.assert(calls.reduce((a, n) => a + n, 0) === cells(box), `calls cover ${calls.reduce((a, n) => a + n, 0)} of ${cells(box)}`);
    test.assert(left.found === 0 && left.unloaded === 0, `stone left ${left.found}, unloaded ${left.unloaded}`);
    test.assert(kept === outside.length, `the clear left the footprint: ${outside.length - kept} marker(s) gone`);
    test.succeed();
  } finally {
    fillBox(dim, box, "minecraft:air");
    for (const p of outside) dim.setBlockType(v(p), "minecraft:air");
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC3: block entities survive place, no script delivery

registerAsync("andrew", "strf_place_block_entities", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const b = base(test);
  // Both boxes ~10 blocks from the anchor, inside the spawner's 16-block player range;
  // the control box differs only by a missing spawner.
  const at: Vec3 = [b[0] + 9, b[1] + 1, b[2]];
  const control: Vec3 = [b[0] - 11, b[1] + 1, b[2]];
  const rot: Rotation = 1;
  const rs = rotatedSize(BOX_SIZE, rot);
  const unload = await loadBox(test, dim, "andrew_gt_place_c", { min: control, max: [at[0] + rs[0], at[1] + rs[1], at[2] + rs[2]] });
  const difficultyBefore = world.getDifficulty();
  test.spawnSimulatedPlayer({ x: 3, y: 2, z: 5 }, "andrew_strf_place", GameMode.Survival);
  try {
    const reg = registry();
    const seen: string[] = [];
    const hooks: PlaceHooks = {
      fillChest: (ctx) => {
        const container = dim.getBlock(v(ctx.pos))?.getComponent(BlockComponentTypes.Inventory)?.container;
        seen.push(`${ctx.index}:${container === undefined ? "none" : container.size}`);
      },
    };
    const placer = new Placer(reg, engineWorld(dim, api()), body(), hooks, log);
    const r = placer.run(plan(reg, at, rot));
    const r2 = placer.run(plan(reg, control, rot));
    test.assert(r.state === "done" && r2.state === "done", `run: ${JSON.stringify(r)} ${JSON.stringify(r2)}`);
    dim.setBlockType(v(toWorld(control, SPAWNER, BOX_SIZE, rot)), "minecraft:stone_bricks");
    await test.idle(2);

    for (const p of CHESTS) {
      const w = toWorld(at, p, BOX_SIZE, rot);
      const blk = dim.getBlock(v(w));
      const container = blk?.getComponent(BlockComponentTypes.Inventory)?.container;
      log(`strf place chest @${fmt(w)} ${blk?.typeId} inventory=${container === undefined ? "undefined" : container.size}`);
      test.assert(blk?.typeId === "minecraft:chest" && container !== undefined, `chest @${fmt(w)}: ${blk?.typeId}, inventory ${container === undefined ? "missing" : "ok"}`);
    }
    log(`strf place fillChest hook saw: ${seen.join(" ")}`);
    test.assert(seen.length === 2 * CHESTS.length && seen.every((s) => !s.endsWith(":none")), `fillChest hook: ${seen.join(" ")}`);
    const spawner = dim.getBlock(v(toWorld(at, SPAWNER, BOX_SIZE, rot)));
    test.assert(spawner?.typeId === "minecraft:mob_spawner", `spawner is ${spawner?.typeId}`);

    // Peaceful (the server default) forbids hostile spawns, spawners included.
    world.setDifficulty(Difficulty.Easy);
    const centre = (o: Vec3): Vector3 => ({ x: o[0] + rs[0] / 2, y: o[1] + 2, z: o[2] + rs[2] / 2 });
    const mobsIn = (o: Vec3): string[] =>
      dim.getEntities({ location: centre(o), maxDistance: 5 }).filter((e) => e.typeId !== "minecraft:player").map((e) => e.typeId);
    let zombieAt = -1;
    for (let t = 0; t <= SPAWNER_WAIT_TICKS; t += 20) {
      if (mobsIn(at).includes("minecraft:zombie")) {
        zombieAt = t;
        break;
      }
      await test.idle(20);
    }
    const controlMobs = mobsIn(control);
    log(`strf place spawner: first zombie after ${zombieAt} tick(s); box mobs=[${mobsIn(at).join(" ")}] control mobs=[${controlMobs.join(" ")}]`);
    test.assert(zombieAt >= 0, `no zombie from the spawner within ${SPAWNER_WAIT_TICKS / 20} s`);
    test.assert(!controlMobs.includes("minecraft:zombie"), "zombie also in the spawner-less control box — not attributable");
    test.succeed();
  } finally {
    world.setDifficulty(difficultyBefore);
    for (const e of dim.getEntities({ location: { x: b[0], y: b[1], z: b[2] }, maxDistance: 32, type: "minecraft:zombie" })) e.remove();
    fillBox(dim, boxOf(at, rs), "minecraft:air");
    fillBox(dim, boxOf(control, rs), "minecraft:air");
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(SPAWNER_WAIT_TICKS + 600)
  .tag("andrew");

// ------------------------------------------------ AC4: an interrupted init resumes, no second set

registerAsync("andrew", "strf_place_resume", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const b = base(test);
  const loc: Vec3 = [b[0], b[1] + 14, b[2]];
  const rot: Rotation = 3;
  const box = boxOf(loc, rotatedSize(BOX_SIZE, rot));
  const unload = await loadBox(test, dim, "andrew_gt_place_d", box);
  const store = new MemoryStore();
  const guards: number[] = [];
  // addItem is deliberately not idempotent: a repeated fill shows as a second stack.
  const fill = (failAt: number | undefined, calls: number[]): PlaceHooks => ({
    fillChest: (ctx) => {
      if (ctx.index === failAt) throw new Error("gt: interrupted");
      calls.push(ctx.index);
      dim.getBlock(v(ctx.pos))?.getComponent(BlockComponentTypes.Inventory)?.container?.addItem(new ItemStack("minecraft:diamond", 3));
    },
  });
  const diamonds = (p: Vec3): number => {
    const c = dim.getBlock(v(toWorld(loc, p, BOX_SIZE, rot)))?.getComponent(BlockComponentTypes.Inventory)?.container;
    if (c === undefined) return -1;
    let n = 0;
    for (let i = 0; i < c.size; i++) if (c.getItem(i)?.typeId === "minecraft:diamond") n += c.getItem(i)?.amount ?? 0;
    return n;
  };
  try {
    const reg1 = registry(store);
    const calls1: number[] = [];
    const first = new Placer(reg1, engineWorld(dim, api()), body({ guards: () => guards.push(1) }), fill(1, calls1), log);
    const inst = plan(reg1, loc, rot);
    let threw = "";
    try {
      first.run(inst);
    } catch (e) {
      threw = String(e);
    }
    const mid = reg1.get("o", inst.origin, inst.id);
    log(`strf place resume: interrupted (${threw}) state=${mid?.state} filled=${String(mid?.extras[CHESTS_FILLED])} diamonds=${CHESTS.map(diamonds).join(",")}`);
    test.assert(threw.includes("interrupted"), `no interruption: ${threw}`);
    test.assert(mid?.state === "placed" && mid.extras[CHESTS_FILLED] === 1, `mid state ${mid?.state} filled ${String(mid?.extras[CHESTS_FILLED])}`);
    test.assert(diamonds(CHESTS[0]) === 3 && diamonds(CHESTS[1]) === 0, `partial fill: ${CHESTS.map(diamonds).join(",")}`);

    await test.idle(1);
    // A fresh Registry over the same store, as after a restart.
    const reg2 = registry(store);
    const calls2: number[] = [];
    const second = new Placer(reg2, engineWorld(dim, api()), body({ guards: () => guards.push(2) }), fill(undefined, calls2), log);
    const again = reg2.get("o", inst.origin, inst.id);
    if (again === undefined) throw new Error("record lost");
    const r = second.run(again);
    const third = second.run(reg2.get("o", inst.origin, inst.id) ?? again);
    log(`strf place resume: ${JSON.stringify(r)} then ${JSON.stringify(third)}; fills ${calls1.join(",")} | ${calls2.join(",")}; guards ${guards.join(",")}; diamonds=${CHESTS.map(diamonds).join(",")}`);
    test.assert(r.place === "skipped" && r.state === "done", `resume: ${JSON.stringify(r)}`);
    test.assert(third.state === "done", `third run: ${JSON.stringify(third)}`);
    test.assert(calls2.join(",") === "1", `resumed fills ${calls2.join(",")}, expected only chest 1`);
    test.assert(CHESTS.every((p) => diamonds(p) === 3), `diamonds per chest ${CHESTS.map(diamonds).join(",")}, expected one set of 3 each`);
    test.assert(guards.join(",") === "2", `guards ran ${guards.join(",")}`);
    test.succeed();
  } finally {
    for (const p of CHESTS) dim.getBlock(v(toWorld(loc, p, BOX_SIZE, rot)))?.getComponent(BlockComponentTypes.Inventory)?.container?.clearAll();
    fillBox(dim, box, "minecraft:air");
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ a legendary in a holder under the write box survives the write

interface ProtectCase {
  holder: string;
  /** Chunks east of the test; the GameTest world is flat, so any of them is a valid Windmill site. */
  offset: number;
  /** false: the same write with the protection pass taken out — the check must go red. */
  pass: boolean;
}

const PROTECT_CASES: readonly ProtectCase[] = [
  { holder: "minecraft:hopper", offset: 720, pass: true },
  { holder: "minecraft:purple_shulker_box", offset: 730, pass: true },
  { holder: "minecraft:hopper", offset: 740, pass: false },
  { holder: "minecraft:purple_shulker_box", offset: 750, pass: false },
];

const PROTECT_OWNER = "gt-protect-owner";
/** Wider than the Windmill's footprint plus the drop spot's 16 rings. */
const PROTECT_RADIUS = 40;

function protectRuntime(salt: string): StrfRuntime {
  const store = new MemoryStore();
  store.set(SALT_KEY, `${salt}-${Date.now()}`);
  const enabled = new EnabledTypes(store);
  enabled.enable(["windmill"]);
  const api = { world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType, protectLegendaries: protectLegendariesIn };
  return new StrfRuntime(store, engineStrf(api), { log, enabled });
}

function markedSword(id: string): ItemStack {
  return markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), { origin: "admin", owner: PROTECT_OWNER, id, gen: 0 });
}

function holderAt(dim: Dimension, at: Vector3, typeId: string, sword: ItemStack): void {
  dim.setBlockType(at, typeId);
  const container = dim.getBlock(at)?.getComponent(BlockComponentTypes.Inventory)?.container;
  if (container === undefined) throw new Error(`${typeId} at ${at.x},${at.y},${at.z} has no inventory`);
  container.setItem(0, sword);
  container.setItem(1, new ItemStack("minecraft:diamond", 3));
}

/** Every copy of instance `id` near `centre`: on the ground, in the block at `at`, owed. */
function censusOf(dim: Dimension, id: string, centre: Vector3, at: Vector3): { ground: Entity[]; inHolder: number; owed: number; gen: number } {
  const ground = dim.getEntities({ type: "minecraft:item", location: centre, maxDistance: PROTECT_RADIUS }).filter((e) => {
    const s = e.getComponent("minecraft:item")?.itemStack;
    return isItemOf(WEB_SWORD, s) && getMark(WEB_SWORD, s)?.id === id;
  });
  const container = dim.getBlock(at)?.getComponent(BlockComponentTypes.Inventory)?.container;
  let inHolder = 0;
  for (let i = 0; i < (container?.size ?? 0); i++) {
    const s = container?.getItem(i);
    if (isItemOf(WEB_SWORD, s) && getMark(WEB_SWORD, s)?.id === id) inHolder++;
  }
  const owed = (readOwed(WEB_SWORD)[PROTECT_OWNER] ?? []).filter((e) => e.mark.id === id).length;
  return { ground, inHolder, owed, gen: ledgerGen(WEB_SWORD, id) };
}

registerAsync("andrew", "strf_place_protects_legendaries", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const verdicts: string[] = [];
  for (const c of PROTECT_CASES) {
    const tag = `${c.holder.replace("minecraft:", "")}${c.pass ? "" : "/no-pass"}`;
    const rt = protectRuntime(`gt-protect-${c.offset}`);
    const def = rt.defs.find((d) => d.id === "windmill");
    if (def === undefined) throw new Error("no windmill roll def");
    const [cx, cz] = [Math.floor(base(test)[0] / CHUNK) + c.offset, Math.floor(base(test)[2] / CHUNK)];
    const x = cx * CHUNK + 8;
    const z = cz * CHUNK + 8;
    const unload = await loadBox(test, dim, `andrew_gt_protect_${c.offset}`, { min: [x - PROTECT_RADIUS, 0, z - PROTECT_RADIUS], max: [x + PROTECT_RADIUS, 0, z + PROTECT_RADIUS] });
    const size = rotatedSize(def.size, 0);
    const [ox, oz] = [x - Math.floor(size[0] / 2), z - Math.floor(size[2] / 2)];
    let footprint: Box | undefined;
    const ids: string[] = [];
    try {
      const top = dim.getTopmostBlock({ x, z });
      if (top === undefined) throw new Error(`no ground at ${x},${z}`);
      const at: Vector3 = { x, y: top.location.y + 1, z };
      const centre: Vector3 = { x: x + 0.5, y: at.y, z: z + 0.5 };

      // The guard: a player's holder in the footprint keeps the Windmill off the site.
      const guardId = `gt-protect-${c.offset}-guard-${Date.now()}`;
      ids.push(guardId);
      holderAt(dim, at, c.holder, markedSword(guardId));
      const guard = rt.placeAt("windmill", "o", x, z, 0);
      const kept = censusOf(dim, guardId, centre, at).inHolder;
      const guardOk = guard.kind === "rejected" && guard.reason === "collision:player" && kept === 1;
      dim.getBlock(at)?.getComponent(BlockComponentTypes.Inventory)?.container?.clearAll();
      dim.setBlockType(at, "minecraft:air");

      // The write: a holder that got into the box after the site check, through
      // SiteGate.occupy into Placer.write with the production engine adapter.
      const cand: Candidate = { id: `windmill:o:${Math.floor(ox / CHUNK)}:${Math.floor(oz / CHUNK)}`, def, dim: "o", cx: Math.floor(ox / CHUNK), cz: Math.floor(oz / CHUNK), rot: 0, size, x: ox, z: oz };
      const site = rt.gate.site(cand);
      if (site.kind !== "valid") throw new Error(`${tag}: site ${JSON.stringify(site)}`);
      const planned = rt.registry.plan({ def: "windmill", dim: "o", origin: [ox, site.y, oz], rot: 0, size, id: cand.id });
      if (!planned.ok) throw new Error(`${tag}: plan blocked by ${planned.blockedBy.id}`);
      footprint = boxOf(planned.instance.origin, size);
      const id = `gt-protect-${c.offset}-${Date.now()}`;
      ids.push(id);
      holderAt(dim, at, c.holder, markedSword(id));
      const engine = engineStrf({ world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType, protectLegendaries: protectLegendariesIn });
      const pw = engine.placeWorld("o");
      if (pw === undefined) throw new Error("no place world");
      const placer = new Placer(rt.registry, c.pass ? pw : { ...pw, protect: undefined }, BODIES, engine.hooks("o"), log);
      const placed = placer.place(planned.instance, rt.gate);
      await test.idle(20);

      const n = censusOf(dim, id, centre, at);
      const fp = footprint;
      const outside = n.ground.filter((e) => {
        const l = e.location;
        return l.x < fp.min[0] || l.x >= fp.max[0] + 1 || l.z < fp.min[2] || l.z >= fp.max[2] + 1;
      });
      const copies = n.ground.length + n.inHolder + n.owed;
      // Criterion 1: placed, and exactly one live copy — outside the footprint or owed to its owner — with no loss return.
      const writeOk = placed === "placed" && copies === 1 && outside.length + n.owed === 1 && n.gen === 0;
      const where = n.ground.map((e) => `${e.location.x.toFixed(1)},${e.location.y.toFixed(1)},${e.location.z.toFixed(1)}`).join(" ");
      log(
        `strf protect ${tag} RESULT guard=${guard.kind}${guard.kind === "rejected" ? `:${guard.reason}` : ""} kept=${kept}; ` +
          `write=${placed} block now=${dim.getBlock(at)?.typeId}; copies=${copies} (ground ${n.ground.length} [${where}] outside ${outside.length}, holder ${n.inHolder}, owed ${n.owed}) gen=${n.gen}; ` +
          `footprint ${footprint.min.join(",")}..${footprint.max.join(",")}; criterion=${writeOk ? "green" : "red"}`
      );
      verdicts.push(`${tag}:${guardOk && writeOk === c.pass ? "ok" : `FAIL(guard ${guardOk}, write ${writeOk})`}`);
    } finally {
      for (const e of dim.getEntities({ type: "minecraft:item", location: { x, y: 0, z }, maxDistance: 400 })) {
        const s = e.getComponent("minecraft:item")?.itemStack;
        if (isItemOf(WEB_SWORD, s) && ids.includes(getMark(WEB_SWORD, s)?.id ?? "")) {
          forgetWatched(e.id);
          e.remove();
        }
      }
      let owed = readOwed(WEB_SWORD);
      for (const e of owed[PROTECT_OWNER] ?? []) owed = withoutOwed(owed, PROTECT_OWNER, e.mark);
      writeOwed(WEB_SWORD, owed);
      if (footprint !== undefined) fillBox(dim, footprint, "minecraft:air");
      unload();
    }
  }
  log(`strf protect RESULT ${verdicts.join(" ")}`);
  test.assert(verdicts.every((v) => v.endsWith(":ok")), `protect: ${verdicts.join(" ")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");

export const STRF_PLACE_TESTS = ["strf_place_rotations", "strf_place_clear_sliced", "strf_place_block_entities", "strf_place_resume", "strf_place_protects_legendaries"];
