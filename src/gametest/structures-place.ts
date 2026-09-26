// Placement on a real engine (L0-strf-p003, L0-strf-p004): all four rotations
// judged by the blocks in the world, a clear larger than one fillBlocks call,
// block entities that survive place, and a resume after an interrupted chest
// fill. Every test clears what it placed.

import {
  BlockComponentTypes,
  BlockVolume,
  Difficulty,
  type Dimension,
  GameMode,
  ItemStack,
  StructureRotation,
  type Vector3,
  world,
} from "@minecraft/server";
import { Test, registerAsync } from "@minecraft/server-gametest";
import { type Box, FILL_CELL_LIMIT, boxOf, cells, sliceBox } from "../structures/clear";
import { type PlaceHooks, type PlaceWorld, Placer, type StructureBody, CHESTS_FILLED, engineWorld } from "../structures/place";
import { type Instance, type Rotation, type Vec3, Registry, SALT_KEY } from "../structures/registry";
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
const api = () => ({ structureManager: world.structureManager, BlockVolume, StructureRotation });

function fillBox(dim: Dimension, box: Box, block: string): void {
  for (const s of sliceBox(box)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), block);
}

/** One ticking area over every chunk under the box plus margin; resolves once all are loaded, returns its remover. */
export async function loadBox(test: Test, dim: Dimension, name: string, box: Box): Promise<() => void> {
  const chunks = coveredChunks(box.min[0], box.min[2], box.max[0] - box.min[0] + 1, box.max[2] - box.min[2] + 1);
  const xs = chunks.map(([x]) => x);
  const zs = chunks.map(([, z]) => z);
  const [x0, x1, z0, z1] = [Math.min(...xs) * CHUNK, Math.max(...xs) * CHUNK + 15, Math.min(...zs) * CHUNK, Math.max(...zs) * CHUNK + 15];
  if (dim.runCommand(`tickingarea add ${x0} 0 ${z0} ${x1} 0 ${z1} ${name}`).successCount === 0) throw new Error(`tickingarea add ${name} refused`);
  const remove = (): void => {
    try {
      dim.runCommand(`tickingarea remove ${name}`);
    } catch (e) {
      log(`strf place: tickingarea remove ${name} threw ${String(e)}`);
    }
  };
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

export const STRF_PLACE_TESTS = ["strf_place_rotations", "strf_place_clear_sliced", "strf_place_block_entities", "strf_place_resume"];
