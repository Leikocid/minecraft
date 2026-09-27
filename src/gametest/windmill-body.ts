// The Windmill body on a real engine (L0-wind-p001, -p004, -r004..-r006): a
// natural candidate on a bad site is cancelled without touching a block; a
// full init fills 25 chests and spawns exactly 10 guards once; a guard stands
// the noon sun; a cured guard is an ordinary villager. Every test clears what
// it placed and puts the world's difficulty and time back.

import {
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
  WeatherType,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, Test, registerAsync } from "@minecraft/server-gametest";
import { stripHelmet } from "../selftest/mob-probe";
import { GUARD_COUNT, GUARD_ENTITY, WINDMILL_BODY, guardPoints, guardTag } from "../structures/bodies/windmill";
import { type Box, boxOf, sliceBox } from "../structures/clear";
import { contents } from "../structures/loot";
import { LINKED_STATUS } from "../structures/bodies/airship";
import { EnabledTypes } from "../structures/config";
import { CHESTS_FILLED, GUARDS_SPAWNED, LINKED_TRIED, engineSpawnGuard } from "../structures/place";
import { COLLISION_MARGIN, type Instance, type Rotation, type Vec3, SALT_KEY, clearTestHook, installTestHook } from "../structures/registry";
import { buildCandidate } from "../structures/roll";
import { StrfRuntime, engineStrf } from "../structures/runtime";
import { MemoryStore } from "../structures/store";
import { WINDMILL_SIZE } from "../structures/templates/windmill";
import { toWorld } from "../structures/rotate";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const CHUNK = 16;
const NOON = 6000;
const MIDNIGHT = 18000;
const SIZE: Vec3 = [...WINDMILL_SIZE];

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);
const v = (p: Vec3): Vector3 => ({ x: p[0], y: p[1], z: p[2] });
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err));
const health = (e: Entity): number => (e.isValid ? (e.getComponent("minecraft:health")?.currentValue ?? -1) : -1);

function runtime(salt: string): StrfRuntime {
  const store = new MemoryStore();
  store.set(SALT_KEY, `${salt}-${Date.now()}`);
  return new StrfRuntime(store, engineStrf({ world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType }), { log });
}

/** Chunk `offset` chunks east of the test, clear of every other test's ground. */
function farChunk(test: Test, offset: number): [number, number] {
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  return [Math.floor(b.x / CHUNK) + offset, Math.floor(b.z / CHUNK)];
}

function fillBox(dim: Dimension, box: Box, block: string): void {
  for (const s of sliceBox(box)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), block);
}

function groundAt(dim: Dimension, x: number, z: number): number {
  const top = dim.getTopmostBlock({ x, z });
  if (top === undefined) throw new Error(`no ground at ${x},${z}`);
  return top.location.y;
}

/** Hostile mobs, the guards included, exist only above Peaceful (the server default). */
function worldSnapshot(): () => void {
  const difficulty = world.getDifficulty();
  const daylight = world.gameRules.doDayLightCycle;
  const time = world.getTimeOfDay();
  return () => {
    world.setDifficulty(difficulty);
    world.gameRules.doDayLightCycle = daylight;
    world.setTimeOfDay(time);
  };
}

function removeMobs(dim: Dimension, box: Box): void {
  const centre: Vec3 = [(box.min[0] + box.max[0]) / 2, (box.min[1] + box.max[1]) / 2, (box.min[2] + box.max[2]) / 2];
  for (const e of dim.getEntities({ location: v(centre), maxDistance: 64 })) if (e.typeId !== "minecraft:player") e.remove();
}

/** Every block of the box as "type states", read a few x-slices per tick so the watchdog never sees one long tick. */
async function snapshot(test: Test, dim: Dimension, box: Box): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let x = box.min[0]; x <= box.max[0]; x++) {
    for (let y = box.min[1]; y <= box.max[1]; y++)
      for (let z = box.min[2]; z <= box.max[2]; z++) {
        const b = dim.getBlock({ x, y, z });
        if (b === undefined) throw new Error(`${x},${y},${z} unloaded during the snapshot`);
        out.set(`${x},${y},${z}`, `${b.typeId} ${JSON.stringify(b.permutation.getAllStates())}`);
      }
    if ((x - box.min[0]) % 4 === 3) await test.idle(1);
  }
  return out;
}

function diff(a: Map<string, string>, b: Map<string, string>): string[] {
  const out: string[] = [];
  for (const [k, was] of a) if (b.get(k) !== was) out.push(`${k}: ${was} -> ${b.get(k)}`);
  return out;
}

// ------------------------------------------------ AC1: a bad natural site is cancelled, the land untouched

interface SiteCase {
  label: string;
  offset: number;
  /** Shapes the land (or the registry) under the candidate; returns the undo. */
  build(dim: Dimension, rt: StrfRuntime, fp: Box, ground: number): () => void;
  reason: RegExp;
}

const CASES: readonly SiteCase[] = [
  {
    label: "uneven",
    offset: 120,
    // A 6-block step across half the footprint: past the flat profile's spread of 3.
    build(dim, _rt, fp, ground) {
      const step: Box = { min: [fp.min[0] + 17, ground + 1, fp.min[2]], max: [fp.max[0], ground + 6, fp.max[2]] };
      fillBox(dim, step, "minecraft:stone");
      return () => fillBox(dim, step, "minecraft:air");
    },
    reason: /^uneven$/,
  },
  {
    label: "water",
    offset: 126,
    // A still pond sunk into the ground over half the footprint: far past 5 % liquid.
    build(dim, _rt, fp, ground) {
      const pond: Box = { min: [fp.min[0], ground, fp.min[2]], max: [fp.max[0], ground, fp.min[2] + 17] };
      fillBox(dim, pond, "minecraft:water");
      return () => fillBox(dim, pond, "minecraft:grass_block");
    },
    reason: /^liquid$/,
  },
  {
    label: "collision",
    offset: 132,
    // Flat dry land, but another structure's record sits inside the footprint.
    build(_dim, rt, fp, ground) {
      const r = rt.registry.plan({ def: "airship", dim: "o", origin: [fp.min[0] + 10, ground + 1, fp.min[2] + 10], rot: 0, size: [15, 7, 12], id: "airship:gt:other" });
      if (!r.ok) throw new Error("the colliding record was refused");
      return () => {};
    },
    reason: /^collision:/,
  },
];

registerAsync("andrew", "windmill_body_site_cancel", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const verdicts: string[] = [];
  for (const c of CASES) {
    const rt = runtime(`gt-wb-${c.label}`);
    const [cx, cz] = farChunk(test, c.offset);
    const def = rt.defs.find((d) => d.id === "windmill");
    if (def === undefined) throw new Error("no windmill roll def");
    const cand = buildCandidate(rt.registry.salt(), "o", cx, cz, def);
    const fp: Box = { min: [cand.x, 0, cand.z], max: [cand.x + cand.size[0] - 1, 0, cand.z + cand.size[2] - 1] };
    const unload = await loadBox(test, dim, `andrew_gt_wb_${c.label}`, { min: [fp.min[0] - COLLISION_MARGIN, 0, fp.min[2] - COLLISION_MARGIN], max: [fp.max[0] + COLLISION_MARGIN, 0, fp.max[2] + COLLISION_MARGIN] });
    let undo = (): void => {};
    try {
      const ground = groundAt(dim, cand.x + 1, cand.z + 1);
      undo = c.build(dim, rt, fp, ground);
      await test.idle(2);
      const area: Box = {
        min: [fp.min[0] - COLLISION_MARGIN, ground - 3, fp.min[2] - COLLISION_MARGIN],
        max: [fp.max[0] + COLLISION_MARGIN, ground + SIZE[1] + 3, fp.max[2] + COLLISION_MARGIN],
      };
      const before = await snapshot(test, dim, area);

      installTestHook({ outcomes: [["windmill", "o", cx, cz, true]] });
      let result;
      try {
        result = rt.discovery.evaluateChunk("o", cx, cz).results.find((r) => r.def === "windmill");
      } finally {
        clearTestHook();
      }
      rt.pumpPlacement(10);
      await test.idle(5);
      const after = await snapshot(test, dim, area);
      const changed = diff(before, after);
      const windmills = rt.instances("windmill");
      log(
        `windmill site ${c.label}: candidate ${cand.id} rot ${cand.rot} at ${cand.x},${cand.z} -> ${result?.outcome} ${result?.reason ?? ""}; ` +
          `records=${windmills.length} queued=${rt.queued}; ${before.size} blocks compared, ${changed.length} changed${changed.length > 0 ? `: ${changed.slice(0, 5).join(" | ")}` : ""}`
      );
      const ok = result?.outcome === "rejected" && c.reason.test(result.reason ?? "") && windmills.length === 0 && changed.length === 0;
      verdicts.push(`${c.label}:${ok ? "ok" : "FAIL"}`);
    } finally {
      undo();
      unload();
    }
  }
  log(`windmill site cancel RESULT ${verdicts.join(" ")}`);
  test.assert(verdicts.every((x) => x.endsWith(":ok")), `site cancel: ${verdicts.join(" ")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");

// ------------------------------------------------ AC2 + AC3: full init — 25 chests, exactly 10 guards, once

const guardsOf = (dim: Dimension, inst: Instance): Entity[] => dim.getEntities({ tags: [guardTag(inst.id)] });

registerAsync("andrew", "windmill_body_init", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const restore = worldSnapshot();
  const rt = runtime("gt-wb-init");
  const [cx, cz] = farChunk(test, 140);
  const x = cx * CHUNK + 8;
  const z = cz * CHUNK + 8;
  const rot: Rotation = 1;
  const reach: Box = { min: [x - 24, 0, z - 24], max: [x + 24, 0, z + 24] };
  const unload = await loadBox(test, dim, "andrew_gt_wb_init", reach);
  let inst: Instance | undefined;
  try {
    world.setDifficulty(Difficulty.Easy);
    const out = rt.placeAt("windmill", "o", x, z, rot);
    test.assert(out.kind === "placed", `placeAt: ${JSON.stringify(out)}`);
    if (out.kind !== "placed") return;
    inst = out.instance;
    await test.idle(2);
    test.assert(inst.state === "done", `state ${inst.state}`);

    // AC2: every chest filled, 5–12 occupied slots, no two alike.
    const per: string[] = [];
    const sigs = new Set<string>();
    const bad: string[] = [];
    WINDMILL_BODY.chests.forEach((c, i) => {
      const pos = toWorld(inst!.origin, c.local, SIZE, inst!.rot);
      const container = dim.getBlock(v(pos))?.getComponent("minecraft:inventory")?.container;
      if (container === undefined) {
        bad.push(`#${i} no container at ${pos.join(",")}`);
        return;
      }
      const items = contents(container);
      per.push(String(items.length));
      sigs.add(items.join(" "));
      if (items.length < 5 || items.length > 12) bad.push(`#${i} ${items.length} slots`);
    });
    log(`windmill init chests: ${per.length} read, occupied slots ${per.join(",")}; distinct contents ${sigs.size}; lc=${String(inst.extras[CHESTS_FILLED])}`);
    test.assert(bad.length === 0 && per.length === 25, `chests: ${bad.join(" | ")}`);
    test.assert(sigs.size === 25, `only ${sigs.size} distinct chest contents of 25`);

    // AC3: exactly 10 tagged zombie villagers, each fireproof for good.
    const guards = guardsOf(dim, inst);
    const fx = guards.map((g) => g.getEffect("fire_resistance")?.duration ?? 0);
    log(
      `windmill init guards: ${guards.length} tagged ${guardTag(inst.id)}; types ${[...new Set(guards.map((g) => g.typeId))].join(",")}; ` +
        `fire_resistance durations ${fx.join(",")}; names ${[...new Set(guards.map((g) => g.nameTag))].join(",")}; gs=${String(inst.extras[GUARDS_SPAWNED])}`
    );
    test.assert(guards.length === GUARD_COUNT, `${guards.length} guards, expected ${GUARD_COUNT}`);
    test.assert(guards.every((g) => g.typeId === GUARD_ENTITY), "a guard is not a zombie villager");
    test.assert(fx.every((d) => d === -1), `fire_resistance not infinite on every guard: ${fx.join(",")}`);

    // The step again, by every route there is: nothing new.
    const again = rt.placeAt("windmill", "o", x, z, rot);
    const stepAgain = rt.registry.runStep(inst, "guard", () => test.fail("the guard step ran a second time"));
    const resumed = rt.resumeUnfinished();
    rt.pumpPlacement(10);
    await test.idle(5);
    const afterRerun = guardsOf(dim, inst).length;
    log(`windmill init rerun: placeAt -> ${again.kind}, guard step -> ${stepAgain}, resumed ${resumed}; guards ${afterRerun}`);
    test.assert(again.kind === "blocked" && stepAgain === "skipped" && resumed === 0, "a second init route was open");
    test.assert(afterRerun === GUARD_COUNT, `an 11th guard: ${afterRerun}`);

    // Killed guards stay dead: nothing tops them up, whatever runs next.
    const victims = guards.slice(0, 3);
    for (const g of victims) g.kill();
    await test.idle(40);
    rt.resumeUnfinished();
    rt.pumpPlacement(10);
    rt.registry.runStep(inst, "guard", () => test.fail("the guard step ran after deaths"));
    await test.idle(100);
    const left = guardsOf(dim, inst).length;
    const rec = rt.registry.get("o", inst.origin, inst.id);
    log(`windmill guards RESULT killed ${victims.length}, ${left} left after 140 ticks and a rerun; record ${rec?.state} gs=${String(rec?.extras[GUARDS_SPAWNED])}`);
    test.assert(left === GUARD_COUNT - victims.length, `${left} guards after killing ${victims.length}`);
    test.assert(rec?.state === "done", `record ${rec?.state}`);
    test.succeed();
  } finally {
    if (inst !== undefined) {
      const box = boxOf(inst.origin, inst.size);
      for (const c of WINDMILL_BODY.chests) dim.getBlock(v(toWorld(inst.origin, c.local, SIZE, inst.rot)))?.getComponent("minecraft:inventory")?.container?.clearAll();
      removeMobs(dim, box);
      fillBox(dim, box, "minecraft:air");
      removeMobs(dim, box);
    }
    restore();
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ------------------------------------------------ AC4: a guard at noon keeps its health, a control burns

const FAKE: Instance = { id: "windmill:gt", def: "windmill", dim: "o", origin: [0, 0, 0], rot: 0, size: SIZE, state: "looted", extras: {} };

/** A guard through the production spawn hook, at a test-relative cell. */
function spawnGuardAt(test: Test, dim: Dimension, rel: Vector3): Entity {
  const w = test.worldBlockLocation(rel);
  const g = guardPoints(FAKE.id)[0];
  return engineSpawnGuard(dim)({ ...g, instance: FAKE, index: 0, pos: [w.x, w.y, w.z] });
}

const SUN_TICKS = 300;

registerAsync("andrew", "windmill_guard_noon", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const restore = worldSnapshot();
  const spawned: Entity[] = [];
  try {
    world.setDifficulty(Difficulty.Easy);
    world.gameRules.doDayLightCycle = false;
    world.setTimeOfDay(NOON);
    dim.setWeather(WeatherType.Clear, 24000);
    // Creative: the mobs ignore it and stay in the open.
    test.spawnSimulatedPlayer({ x: 6, y: 2, z: 6 }, "andrew_wb_noon", GameMode.Creative);
    const guard = spawnGuardAt(test, dim, { x: 1, y: 2, z: 1 });
    const control = test.spawn(GUARD_ENTITY, { x: 5, y: 2, z: 1 });
    spawned.push(guard, control);
    for (const e of spawned) {
      // A helmet stops sun damage by itself; neither mob may keep one.
      stripHelmet(e);
      e.addEffect("slowness", SUN_TICKS + 200, { amplifier: 255, showParticles: false });
    }
    await test.idle(2);
    const sky = dim.getSkyLightLevel({ ...guard.location, y: guard.location.y + 1 });
    const start = { guard: health(guard), control: health(control) };
    let guardFire = 0;
    let controlFire = 0;
    for (let t = 0; t < SUN_TICKS; t++) {
      if (guard.isValid && guard.getComponent("minecraft:onfire") !== undefined) guardFire++;
      if (control.isValid && control.getComponent("minecraft:onfire") !== undefined) controlFire++;
      await test.idle(1);
    }
    const end = { guard: health(guard), control: control.isValid ? health(control) : 0 };
    const max = guard.getComponent("minecraft:health")?.effectiveMax ?? -1;
    log(
      `windmill guard noon RESULT guard hp ${start.guard}->${end.guard} of ${max}, on fire ${guardFire}/${SUN_TICKS} ticks, ` +
        `fire_resistance duration ${guard.getEffect("fire_resistance")?.duration ?? "none"}; control hp ${start.control}->${end.control}` +
        `${control.isValid ? "" : " (dead)"}, on fire ${controlFire}/${SUN_TICKS} ticks; sky light ${sky}, time ${world.getTimeOfDay()}`
    );
    test.assert(controlFire > 0 && end.control < start.control, "the control did not burn: the sun was not reaching them");
    test.assert(guard.isValid && end.guard === start.guard && end.guard === max, `the guard lost health: ${start.guard}->${end.guard}`);
    test.succeed();
  } finally {
    restore();
    for (const e of spawned) if (e.isValid) e.remove();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(SUN_TICKS + 300)
  .tag("andrew");

// ------------------------------------------------ AC5: a cured guard becomes an ordinary villager, and stays one

/** Vanilla conversion takes 2–5 minutes; 6000 ticks is the upper bound plus slack. */
const CURE_WAIT_TICKS = 6600;
const STAYS_TICKS = 400;

registerAsync("andrew", "windmill_guard_cured", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const restore = worldSnapshot();
  let guard: Entity | undefined;
  let villager: Entity | undefined;
  try {
    world.setDifficulty(Difficulty.Easy);
    world.gameRules.doDayLightCycle = false;
    world.setTimeOfDay(MIDNIGHT);
    const player: SimulatedPlayer = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 5 }, "andrew_wb_cure", GameMode.Survival);
    guard = spawnGuardAt(test, dim, { x: 3, y: 2, z: 3 });
    const tag = guardTag(FAKE.id);
    stripHelmet(guard);
    guard.addEffect("slowness", CURE_WAIT_TICKS, { amplifier: 255, showParticles: false });
    // Weakness is the cure's precondition and takes the zombie's melee to zero.
    guard.addEffect("weakness", 1200, { amplifier: 0 });
    log(`windmill cure: guard ${guard.id} tags [${guard.getTags().join(" ")}] fire_resistance ${guard.getEffect("fire_resistance")?.duration ?? "none"}`);
    await test.idle(5);

    const apples = (): number => {
      const c = player.getComponent("minecraft:inventory")?.container;
      let n = 0;
      if (c) for (let i = 0; i < c.size; i++) if (c.getItem(i)?.typeId === "minecraft:golden_apple") n += c.getItem(i)?.amount ?? 0;
      return n;
    };
    player.setItem(new ItemStack("minecraft:golden_apple", 4), 0, true);
    player.lookAtEntity(guard);
    let fed = false;
    for (let tries = 0; tries < 10 && !fed; tries++) {
      try {
        const before = apples();
        player.interactWithEntity(guard);
        await test.idle(2);
        fed = apples() < before;
      } catch (err) {
        log(`windmill cure: interactWithEntity threw ${errText(err)}`);
        await test.idle(5);
      }
    }
    test.assert(fed, "the golden apple was never taken");

    const at = guard.location;
    let waited = 0;
    for (; waited < CURE_WAIT_TICKS && villager === undefined; waited += 20) {
      if (!guard.isValid) {
        villager = dim.getEntities({ location: at, maxDistance: 6 }).find((e) => e.typeId.includes("villager") && !e.typeId.includes("zombie"));
      }
      if (villager === undefined) await test.idle(20);
    }
    test.assert(villager !== undefined, `no villager within ${waited} ticks (guard ${guard.isValid ? "still a zombie" : "gone"})`);
    if (villager === undefined) return;
    const read = (e: Entity): string =>
      `${e.typeId} tags [${e.getTags().join(" ")}] fire_resistance ${e.getEffect("fire_resistance")?.duration ?? "none"} name ${JSON.stringify(e.nameTag)}`;
    const cured = read(villager);
    // Nothing in the add-on may turn it back: give scripts time, then read again.
    await test.idle(STAYS_TICKS);
    const later = villager.isValid ? read(villager) : "gone";
    const guardsLeft = dim.getEntities({ tags: [tag] }).length;
    log(`windmill cure RESULT cured after ~${waited} ticks: ${cured}; ${STAYS_TICKS} ticks later: ${later}; guards with the tag: ${guardsLeft}`);
    const ordinary = (e: Entity): boolean => !e.typeId.includes("zombie") && !e.getTags().some((t) => t.startsWith("andrew:guard:")) && e.getEffect("fire_resistance") === undefined;
    test.assert(ordinary(villager), `cured: ${cured}`);
    test.assert(villager.isValid && ordinary(villager), `later: ${later}`);
    test.assert(guardsLeft === 0, `${guardsLeft} entities still carry ${tag}`);
    test.succeed();
  } finally {
    restore();
    if (guard?.isValid) guard.remove();
    if (villager?.isValid) villager.remove();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(CURE_WAIT_TICKS + STAYS_TICKS + 600)
  .tag("andrew");

// ------------------------------------------------ STRF-SUBSET-01: the Airship disabled, the Windmill still done

registerAsync("andrew", "windmill_body_airship_disabled", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const restore = worldSnapshot();
  const store = new MemoryStore();
  store.set(SALT_KEY, `gt-wb-noair-${Date.now()}`);
  const enabled = new EnabledTypes(store);
  enabled.enable(["windmill"]);
  const lines: string[] = [];
  // A ring-capable engine: without the gate the linked search would really run here.
  const rt = new StrfRuntime(
    store,
    engineStrf({ world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType, system, ringAreaPrefix: "andrew_gt_noair" }),
    { log: (m) => (lines.push(m), log(m)), enabled }
  );
  const [cx, cz] = farChunk(test, 150);
  const x = cx * CHUNK + 8;
  const z = cz * CHUNK + 8;
  const unload = await loadBox(test, dim, "andrew_gt_wb_noair", { min: [x - 24, 0, z - 24], max: [x + 24, 0, z + 24] });
  let inst: Instance | undefined;
  try {
    world.setDifficulty(Difficulty.Easy);
    const out = rt.placeAt("windmill", "o", x, z, 0);
    test.assert(out.kind === "placed", `placeAt: ${JSON.stringify(out)}`);
    if (out.kind !== "placed") return;
    inst = out.instance;
    await test.idle(20);
    const rec = rt.registry.get("o", inst.origin, inst.id);
    const skipped = lines.filter((l) => l.includes(`linked attempt for ${inst!.id} skipped: airship is not enabled`));
    const airships = rt.instances("airship").length;
    log(
      `windmill airship disabled RESULT enabled=${enabled.list().join(",")} record ${rec?.state} lt=${String(rec?.extras[LINKED_TRIED])} ls=${String(rec?.extras[LINKED_STATUS])}; ` +
        `linked attempts ${rt.linked.attempts.size}, airship records ${airships}; skip lines ${skipped.length}`
    );
    test.assert(rec?.state === "done", `record ${rec?.state}`);
    test.assert(rec?.extras[LINKED_STATUS] === "skipped", `linked status ${String(rec?.extras[LINKED_STATUS])}`);
    test.assert(rt.linked.attempts.size === 0 && airships === 0, "a linked Airship was attempted");
    test.assert(skipped.length === 1, `skip logged ${skipped.length} times`);
    test.succeed();
  } finally {
    if (inst !== undefined) {
      const box = boxOf(inst.origin, inst.size);
      for (const c of WINDMILL_BODY.chests) dim.getBlock(v(toWorld(inst.origin, c.local, SIZE, inst.rot)))?.getComponent("minecraft:inventory")?.container?.clearAll();
      removeMobs(dim, box);
      fillBox(dim, box, "minecraft:air");
      removeMobs(dim, box);
    }
    restore();
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

export const WINDMILL_BODY_TESTS = ["windmill_body_site_cancel", "windmill_body_init", "windmill_guard_noon", "windmill_guard_cured", "windmill_body_airship_disabled"];

log(`registered ${WINDMILL_BODY_TESTS.length} windmill body test(s): ${WINDMILL_BODY_TESTS.join(" ")}`);
