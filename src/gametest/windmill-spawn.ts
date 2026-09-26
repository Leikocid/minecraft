// The spawn Windmill on a real engine (§4.7, L0-wind-p002, -p003, -r007..-r013):
// the production SpawnSearch and site preparation, run around a stand-in spawn
// far from every other test. The release pack's own search is skipped in this
// world (see main.ts), because GameTests run at the real spawn. Every test
// puts back the ground it built and removes what it placed.

import {
  BlockTypes,
  BlockVolume,
  Difficulty,
  type Dimension,
  EnchantmentType,
  ItemStack,
  StructureRotation,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { Test, registerAsync } from "@minecraft/server-gametest";
import { GUARD_COUNT, guardTag } from "../structures/bodies/windmill";
import { type Box, FILL_CELL_LIMIT, boxOf, sliceBox } from "../structures/clear";
import { VOID_DEPTH, applyPrep, enginePrepWorld, largestStep, planPrep, precheck } from "../structures/prepare";
import { COLLISION_MARGIN, SALT_KEY, type Vec3, clearTestHook, installTestHook } from "../structures/registry";
import { StrfRuntime, engineStrf } from "../structures/runtime";
import { SPAWN_ID, SpawnSearch, engineSpawnHost } from "../structures/spawn-search";
import { MemoryStore } from "../structures/store";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const CHUNK = 16;
const PLOT = 35;
/** Ground of the built terrain; the flat world's own grass is at -61. */
const Y0 = -40;
const FLAT_GRASS = -61;

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);
const v = (p: Vec3): Vector3 => ({ x: p[0], y: p[1], z: p[2] });
const api = { BlockVolume, BlockTypes };

function runtime(store: MemoryStore, salt: string): StrfRuntime {
  if (store.get(SALT_KEY) === undefined) store.set(SALT_KEY, `${salt}-${Date.now()}`);
  return new StrfRuntime(store, engineStrf({ world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType }), { log });
}

function search(rt: StrfRuntime, store: MemoryStore, dim: Dimension, spawn: { x: number; z: number }, radius?: number, lines?: string[]): SpawnSearch {
  return new SpawnSearch(rt, store, engineSpawnHost(dim, system, api, () => spawn), {
    radius,
    log: (m) => {
      lines?.push(m);
      log(m);
    },
  });
}

/** A chunk-centred point `dz` blocks south of the test, clear of every other test's ground. */
function spot(test: Test, dz: number): { x: number; z: number } {
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  return { x: Math.floor(b.x / CHUNK) * CHUNK + 8, z: Math.floor((b.z + dz) / CHUNK) * CHUNK + 8 };
}

function fill(dim: Dimension, box: Box, block: string): void {
  for (const s of sliceBox(box)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), block);
}

const topY = (dim: Dimension, x: number, z: number): number => dim.getTopmostBlock({ x, z })?.location.y ?? -999;

/** Type of every cell, read a few x-slices per tick so no single tick runs long. */
async function snapshot(test: Test, dim: Dimension, box: Box): Promise<string[]> {
  const out: string[] = [];
  for (let x = box.min[0]; x <= box.max[0]; x++) {
    for (let y = box.min[1]; y <= box.max[1]; y++)
      for (let z = box.min[2]; z <= box.max[2]; z++) out.push(dim.getBlock({ x, y, z })?.typeId ?? "unloaded");
    if ((x - box.min[0]) % 4 === 3) await test.idle(1);
  }
  return out;
}

const changed = (a: string[], b: string[]): number => a.reduce((n, t, i) => n + (b[i] === t ? 0 : 1), 0);

/**
 * Raised ground around a plot whose min corner is px,pz: stone under dirt
 * under grass with its top at Y0, and a slope-1 hill east of the plot centre,
 * so the plot's spread is far past the flat profile's 3 and no step is over 1.
 */
function buildHill(dim: Dimension, px: number, pz: number): Box {
  const area: Box = { min: [px - 18, FLAT_GRASS + 1, pz - 18], max: [px + PLOT + 17, Y0, pz + PLOT + 17] };
  fill(dim, { min: area.min, max: [area.max[0], Y0 - 4, area.max[2]] }, "minecraft:stone");
  fill(dim, { min: [area.min[0], Y0 - 3, area.min[2]], max: [area.max[0], Y0 - 1, area.max[2]] }, "minecraft:dirt");
  fill(dim, { min: [area.min[0], Y0, area.min[2]], max: area.max }, "minecraft:grass_block");
  for (let x = area.min[0]; x <= area.max[0]; x++) {
    for (let z = area.min[2]; z <= area.max[2]; z++) {
      const h = 14 - Math.max(Math.abs(x - (px + 30)), Math.abs(z - (pz + 17)));
      if (h <= 0) continue;
      if (h > 1) fill(dim, { min: [x, Y0, z], max: [x, Y0 + h - 1, z] }, "minecraft:dirt");
      dim.setBlockType({ x, y: Y0 + h, z }, "minecraft:grass_block");
    }
  }
  return area;
}

function unbuild(dim: Dimension, area: Box): void {
  fill(dim, { min: area.min, max: [area.max[0], Y0 + 40, area.max[2]] }, "minecraft:air");
}

// ------------------------------------------------ AC1 + AC2 + AC3: one Windmill, found once, never again

function countIn(dim: Dimension, box: Box): { chests: number; spawners: number } {
  let chests = 0;
  let spawners = 0;
  for (let x = box.min[0]; x <= box.max[0]; x++)
    for (let y = box.min[1]; y <= box.max[1]; y++)
      for (let z = box.min[2]; z <= box.max[2]; z++) {
        const t = dim.getBlock({ x, y, z })?.typeId;
        if (t === "minecraft:chest") chests++;
        else if (t === "minecraft:mob_spawner") spawners++;
      }
  return { chests, spawners };
}

registerAsync("andrew", "windmill_spawn_once", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const difficulty = world.getDifficulty();
  const spawn = spot(test, 6000);
  const reach = 56;
  const unload = await loadBox(test, dim, "andrew_gt_ws_once", { min: [spawn.x - reach, 0, spawn.z - reach], max: [spawn.x + reach, 0, spawn.z + reach] });
  const store = new MemoryStore();
  let box: Box | undefined;
  try {
    // Peaceful deletes the guards the moment they spawn.
    world.setDifficulty(Difficulty.Easy);
    const rt = runtime(store, "gt-ws-once");
    const rec = await search(rt, store, dim, spawn).run();
    test.assert(rec.status === "done" && rec.origin !== undefined, `search: ${JSON.stringify(rec)}`);
    if (rec.origin === undefined) return;
    box = boxOf(rec.origin, [PLOT, 31, PLOT]);
    await test.idle(40);
    const inst = rt.registry.get("o", rec.origin, SPAWN_ID);
    const centre = [rec.origin[0] + 17, rec.origin[2] + 17];
    const d = Math.hypot(centre[0] - spawn.x, centre[1] - spawn.z);
    const inArea = Math.abs(Math.floor(centre[0] / CHUNK) - Math.floor(spawn.x / CHUNK)) <= 2 && Math.abs(Math.floor(centre[1] / CHUNK) - Math.floor(spawn.z / CHUNK)) <= 2;
    const first = { ...countIn(dim, box), guards: dim.getEntities({ tags: [guardTag(SPAWN_ID)] }).length, windmills: rt.instances("windmill").length };
    log(
      `windmill spawn once RESULT first load: ${rec.status} stage ${rec.stage} at ${rec.origin.join(",")} (centre ${Math.round(d)} blocks from spawn ${spawn.x},${spawn.z}, ` +
        `in 5x5 chunks ${inArea}); registry ${inst?.id} ${inst?.state}; searches ${rec.searches}; counts ${JSON.stringify(first)}`
    );
    test.assert(rec.stage === 1 && inArea && inst?.state === "done", `stage ${rec.stage}, inArea ${inArea}, record ${inst?.state}`);
    test.assert(first.windmills === 1 && first.chests === 25 && first.spawners === 3 && first.guards === GUARD_COUNT, JSON.stringify(first));

    // Two restarts: each a fresh runtime and search over the same store.
    for (const n of [2, 3]) {
      const rt2 = runtime(store, "gt-ws-once");
      const lines: string[] = [];
      const again = await search(rt2, store, dim, spawn, undefined, lines).run();
      rt2.resumeUnfinished();
      rt2.pumpPlacement(10);
      await test.idle(20);
      const now = { ...countIn(dim, box), guards: dim.getEntities({ tags: [guardTag(SPAWN_ID)] }).length, windmills: rt2.instances("windmill").length };
      const notRepeated = lines.some((l) => /already ran once .*not repeated/.test(l));
      log(`windmill spawn once RESULT load ${n}: status ${again.status} searches ${again.searches} not-repeated-line ${notRepeated}; counts ${JSON.stringify(now)}`);
      test.assert(JSON.stringify(now) === JSON.stringify(first), `load ${n}: ${JSON.stringify(now)} vs ${JSON.stringify(first)}`);
      test.assert(again.searches === 1 && notRepeated && JSON.stringify(again.origin) === JSON.stringify(rec.origin), `load ${n} searched again`);
    }
    test.succeed();
  } finally {
    if (box !== undefined) {
      for (const e of dim.getEntities({ location: v([box.min[0] + 17, box.min[1], box.min[2] + 17]), maxDistance: 80 })) if (e.typeId !== "minecraft:player") e.remove();
      for (let x = box.min[0]; x <= box.max[0]; x++)
        for (let y = box.min[1]; y <= box.min[1] + 22; y++)
          for (let z = box.min[2]; z <= box.max[2]; z++) dim.getBlock({ x, y, z })?.getComponent("minecraft:inventory")?.container?.clearAll();
      fill(dim, box, "minecraft:air");
      fill(dim, { min: [box.min[0], FLAT_GRASS, box.min[2]], max: [box.max[0], FLAT_GRASS, box.max[2]] }, "minecraft:grass_block");
    }
    world.setDifficulty(difficulty);
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(4000)
  .tag("andrew");

// ------------------------------------------------ AC4: nothing near spawn is rolled until the search ends

registerAsync("andrew", "windmill_spawn_holds_discovery", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const spawn = spot(test, 7000);
  const store = new MemoryStore();
  const rt = runtime(store, "gt-ws-hold");
  const s = search(rt, store, dim, spawn);
  const near: [number, number] = [Math.floor(spawn.x / CHUNK) + 1, Math.floor(spawn.z / CHUNK)];
  const far: [number, number] = [near[0] + 40, near[1]];
  const drain = (): void => {
    const job = rt.discovery.job();
    while (job.next().done !== true);
  };
  const cx = near[0] * CHUNK + 8;
  const unload = await loadBox(test, dim, "andrew_gt_ws_hold", { min: [cx - 24, 0, near[1] * CHUNK - 16], max: [cx + 24, 0, near[1] * CHUNK + 32] });
  installTestHook({ outcomes: [["windmill", "o", near[0], near[1], true], ["windmill", "o", far[0], far[1], false]] });
  try {
    const running = s.run();
    // Synchronously after run(): the record is written and the hold is on, the search waits out its start delay.
    const player = [{ dimensionId: "minecraft:overworld", x: cx, z: near[1] * CHUNK + 8 }];
    rt.discovery.discover(player);
    const queuedNear = rt.discovery.queueLength;
    rt.discovery.enqueue("o", far[0], far[1]);
    // A chunk queued before the hold began is dropped by the worker too.
    const hold = rt.discovery.hold;
    rt.discovery.hold = undefined;
    rt.discovery.enqueue("o", near[0], near[1]);
    rt.discovery.hold = hold;
    drain();
    const during = {
      active: s.isActive,
      queuedNear,
      held: rt.discovery.stats.held,
      nearEvaluated: rt.registry.isEvaluated("o", near[0], near[1]),
      farEvaluated: rt.registry.isEvaluated("o", far[0], far[1]),
      records: rt.registry.allInstances().length,
    };
    s.requestSkip("gametest");
    const rec = await running;
    // Only the held chunk: a whole discovery ring would also roll unrelated chunks at their natural 1 %.
    rt.discovery.enqueue("o", near[0], near[1]);
    drain();
    const after = {
      status: rec.status,
      hold: rt.discovery.hold === undefined ? "released" : "still on",
      nearEvaluated: rt.registry.isEvaluated("o", near[0], near[1]),
      records: rt.registry.allInstances().map((i) => `${i.id}:${i.state}`),
    };
    log(`windmill spawn hold RESULT during search ${JSON.stringify(during)}; after ${JSON.stringify(after)}`);
    test.assert(during.active && during.queuedNear === 0 && during.held > 0, `during: ${JSON.stringify(during)}`);
    test.assert(!during.nearEvaluated && during.farEvaluated && during.records === 0, `during: ${JSON.stringify(during)}`);
    test.assert(after.hold === "released" && after.nearEvaluated && after.records.length === 1 && after.records[0].endsWith(":planned"), `after: ${JSON.stringify(after)}`);
    test.succeed();
  } finally {
    clearTestHook();
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ------------------------------------------------ AC5 + AC7: level, blend, cap the cave, fill in slices

registerAsync("andrew", "windmill_spawn_prep_smooth", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const c = spot(test, 8000);
  const px = c.x - 17;
  const pz = c.z - 17;
  const unload = await loadBox(test, dim, "andrew_gt_ws_smooth", { min: [px - 20, 0, pz - 20], max: [px + PLOT + 19, 0, pz + PLOT + 19] });
  let area: Box | undefined;
  try {
    area = buildHill(dim, px, pz);
    // A natural 31-high stone spire on the plot: the plot clear box is 35×35×31 = 37 975 cells, over the engine cap.
    fill(dim, { min: [px + 5, Y0 + 1, pz + 5], max: [px + 7, Y0 + 31, pz + 7] }, "minecraft:stone");
    // A deep cave under the plot centre, 2 to 12 blocks below the ground.
    const cave: Box = { min: [px + 13, Y0 - 12, pz + 13], max: [px + 21, Y0 - 2, pz + 21] };
    fill(dim, cave, "minecraft:air");
    await test.idle(2);

    const pw = enginePrepWorld(dim, api);
    const planned = planPrep(pw.view, px, pz, PLOT);
    test.assert(planned.ok, `plan: ${planned.ok ? "" : planned.reason}`);
    if (!planned.ok) return;
    const plan = planned.plan;
    const checked = precheck(pw, plan, "o");
    test.assert(checked.ok, `precheck: ${checked.ok ? "" : checked.reason}`);
    const job = applyPrep(pw, plan);
    let r = job.next();
    while (r.done !== true) {
      await test.idle(1);
      r = job.next();
    }
    const stats = r.value;
    await test.idle(2);

    const yt = plan.targetY;
    const b = plan.band;
    const heights = new Map<string, number>();
    let offPlot = 0;
    for (let x = px - b - 3; x < px + PLOT + b + 3; x++)
      for (let z = pz - b - 3; z < pz + PLOT + b + 3; z++) {
        const h = topY(dim, x, z);
        heights.set(`${x},${z}`, h);
        if (x >= px && x < px + PLOT && z >= pz && z < pz + PLOT && h !== yt) offPlot++;
      }
    const step = largestStep(heights);
    let capSolid = 0;
    for (let y = yt - VOID_DEPTH; y <= yt; y++) if (dim.getBlock({ x: px + 17, y, z: pz + 17 })?.typeId !== "minecraft:air") capSolid++;
    let open = 0;
    let caveCells = 0;
    for (let x = cave.min[0]; x <= cave.max[0]; x++)
      for (let z = cave.min[2]; z <= cave.max[2]; z++)
        for (let y = cave.min[1]; y < yt - VOID_DEPTH; y++) {
          caveCells++;
          if (dim.getBlock({ x, y, z })?.typeId === "minecraft:air") open++;
        }
    log(
      `windmill spawn prep RESULT target y ${yt}, band ${b}${plan.steep ? " steep" : ""}; plot columns off target ${offPlot}; ` +
        `largest neighbour step over plot+band+3 = ${step.step} at ${step.at}; cave cap ${capSolid}/${VOID_DEPTH + 1} solid, cave below the cap ${open}/${caveCells} still air; ` +
        `fills ${stats.calls}, largest ${stats.maxCells} cells (cap ${FILL_CELL_LIMIT}); plot clear ${stats.plotClearCells} cells in ${stats.plotClearCalls} calls`
    );
    test.assert(offPlot === 0, `${offPlot} plot columns are not at the target`);
    test.assert(step.step <= 1, `a ${step.step}-block wall at ${step.at}`);
    test.assert(capSolid === VOID_DEPTH + 1 && caveCells > 0 && open === caveCells, `cap ${capSolid}, cave ${open}/${caveCells}`);
    test.assert(stats.plotClearCells > FILL_CELL_LIMIT && stats.plotClearCalls >= 2 && stats.maxCells <= FILL_CELL_LIMIT, `slicing: ${JSON.stringify(stats)}`);
    test.succeed();
  } finally {
    if (area !== undefined) unbuild(dim, area);
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");

// ------------------------------------------------ AC6: a build, a spawner or a structure stops it before any write

const ABORT_CASES: ReadonlyArray<{ label: string; block: string; at: (px: number, pz: number) => Vec3; reason: string }> = [
  { label: "player-build", block: "minecraft:oak_planks", at: (px, pz) => [px - 3, Y0 + 1, pz + 10], reason: "collision:player" },
  { label: "spawner", block: "minecraft:mob_spawner", at: (px, pz) => [px + 17, Y0 - 3, pz + 17], reason: "collision:spawner" },
  { label: "structure", block: "minecraft:stone_bricks", at: (px, pz) => [px + 30, Y0 + 5, pz + 17], reason: "collision:signature" },
];

registerAsync("andrew", "windmill_spawn_prep_aborts", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const c = spot(test, 9000);
  const px = c.x - 17;
  const pz = c.z - 17;
  const unload = await loadBox(test, dim, "andrew_gt_ws_abort", { min: [px - 20, 0, pz - 20], max: [px + PLOT + 19, 0, pz + PLOT + 19] });
  let area: Box | undefined;
  try {
    area = buildHill(dim, px, pz);
    const watch: Box = { min: [area.min[0], FLAT_GRASS, area.min[2]], max: [area.max[0], Y0 + 16, area.max[2]] };
    const pw = enginePrepWorld(dim, api);
    const verdicts: string[] = [];
    for (const k of ABORT_CASES) {
      const at = k.at(px, pz);
      const original = dim.getBlock(v(at))?.typeId ?? "minecraft:air";
      dim.setBlockType(v(at), k.block);
      await test.idle(1);
      const planned = planPrep(pw.view, px, pz, PLOT);
      const inVolume = planned.ok && [0, 1, 2].every((i) => at[i] >= planned.plan.volume.min[i] - COLLISION_MARGIN && at[i] <= planned.plan.volume.max[i] + COLLISION_MARGIN);
      const before = await snapshot(test, dim, watch);
      const r = planned.ok ? precheck(pw, planned.plan, "o") : planned;
      await test.idle(2);
      const diff = changed(before, await snapshot(test, dim, watch));
      log(`windmill spawn abort ${k.label}: ${k.block} at ${at.join(",")} inside the checked volume ${inVolume}; precheck -> ${r.ok ? "ok" : r.reason}; ${before.length} cells compared, ${diff} changed`);
      verdicts.push(`${k.label}:${!r.ok && r.reason === k.reason && inVolume && diff === 0 ? "ok" : "FAIL"}`);
      dim.setBlockType(v(at), original);
    }

    // The same through the production search: every forced candidate around the spawner is refused, nothing is written.
    dim.setBlockType(v(ABORT_CASES[1].at(px, pz)), ABORT_CASES[1].block);
    const store = new MemoryStore();
    const rt = runtime(store, "gt-ws-abort");
    const before = await snapshot(test, dim, watch);
    const rec = await search(rt, store, dim, { x: px + 17, z: pz + 17 }, 4).run();
    await test.idle(2);
    const diff = changed(before, await snapshot(test, dim, watch));
    const refused = Object.entries(rec.rejects ?? {}).filter(([k]) => k.startsWith("prep:"));
    log(`windmill spawn abort RESULT ${verdicts.join(" ")}; search -> ${rec.status} (${rec.reason}), refusals ${JSON.stringify(refused)}, windmills ${rt.instances("windmill").length}, ${diff} of ${before.length} cells changed`);
    test.assert(verdicts.every((x) => x.endsWith(":ok")), verdicts.join(" "));
    test.assert(rec.status === "failed" && refused.length > 0 && rt.instances("windmill").length === 0 && diff === 0, `search: ${rec.status} ${rec.reason}, ${diff} changed`);
    test.succeed();
  } finally {
    if (area !== undefined) unbuild(dim, area);
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");

// ------------------------------------------------ AC8: no dry land in the radius — no Windmill, and the log says why

registerAsync("andrew", "windmill_spawn_no_dry_land", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const spawn = spot(test, 10000);
  const radius = 30;
  const sea: Box = { min: [spawn.x - 60, FLAT_GRASS, spawn.z - 60], max: [spawn.x + 60, FLAT_GRASS, spawn.z + 60] };
  const unload = await loadBox(test, dim, "andrew_gt_ws_sea", { min: [sea.min[0], 0, sea.min[2]], max: [sea.max[0], 0, sea.max[2]] });
  try {
    fill(dim, sea, "minecraft:water");
    await test.idle(2);
    const store = new MemoryStore();
    const rt = runtime(store, "gt-ws-sea");
    const lines: string[] = [];
    const rec = await search(rt, store, dim, spawn, radius, lines).run();
    const line = lines.find((l) => l.includes("search finished")) ?? "";
    const checked = Number(/checked (\d+) place/.exec(line)?.[1] ?? -1);
    const sum = [...line.matchAll(/ ([a-z:-]+)=(\d+)/g)].reduce((n, m) => n + Number(m[2]), 0);
    log(`windmill spawn sea RESULT ${rec.status} (${rec.reason}); windmills ${rt.instances("windmill").length}; log line has ${checked} places, reasons sum to ${sum}`);
    test.assert(rec.status === "failed" && rec.reason === "no-dry-land" && rt.instances("windmill").length === 0, `search: ${JSON.stringify(rec)}`);
    test.assert(checked > 0 && sum === checked && /liquid=\d+/.test(line), `log line: ${line}`);
    test.succeed();
  } finally {
    fill(dim, sea, "minecraft:grass_block");
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");

export const WINDMILL_SPAWN_TESTS = ["windmill_spawn_once", "windmill_spawn_holds_discovery", "windmill_spawn_prep_smooth", "windmill_spawn_prep_aborts", "windmill_spawn_no_dry_land"];

log(`registered ${WINDMILL_SPAWN_TESTS.length} windmill spawn test(s): ${WINDMILL_SPAWN_TESTS.join(" ")}`);
