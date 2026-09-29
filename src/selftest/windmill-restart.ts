// A Windmill's irreversibility across a real restart (L0-wind-ac11, §2): run 1
// builds one through the production Placer and body, then loots a chest,
// breaks a spawner and a wall and kills three guards; run 2 — after bds:check
// restarts the server on the same world — runs the startup resume and checks
// that all of it stayed that way and that no second set of loot or guards
// appeared. The phase comes from a marker run 1 saves.

import {
  BlockVolume,
  BlockTypes,
  Difficulty,
  type Dimension,
  EnchantmentType,
  ItemStack,
  StructureRotation,
  type Vector3,
  world,
} from "@minecraft/server";
import { protectLegendariesIn } from "../legendary/recovery";
import { GUARD_COUNT, WINDMILL_BODY, guardTag } from "../structures/bodies/windmill";
import { boxOf, sliceBox } from "../structures/clear";
import { Loot, contents } from "../structures/loot";
import { CHESTS_FILLED, GUARDS_SPAWNED, Placer, engineSpawnGuard, engineWorld } from "../structures/place";
import { type Instance, type Vec3, Registry } from "../structures/registry";
import { rotatedSize, toWorld } from "../structures/rotate";
import { StrfRuntime, engineStrf } from "../structures/runtime";
import { DynamicPropertyStore, type KeyValueStore } from "../structures/store";
import { SPAWNERS, WINDMILL_SIZE } from "../structures/templates/windmill";
import { BUILDING } from "../structures/templates/windmill-fields";
import type { Log, Wait } from "./chunk-probe";

const MARKER = "andrew:selftest_windmill";
const AREA = "andrew_selftest_windmill";
/** Its own key prefix: the registry restart check compares every record under the bare prefix. */
const SCOPE = "wb:";
/** In the sky over a stone slab, so terrain and water never decide the result. */
const Y = 200;
const SLAB_MARGIN = 10;
const KILLED = 3;
const SIZE: Vec3 = [...WINDMILL_SIZE];
/** A west-wall stone block of floor 1. */
const WALL: Vec3 = [BUILDING.x0, 3, 15];

interface Marker {
  id: string;
  origin: Vec3;
  rot: Instance["rot"];
  center: Vec3;
  /** Contents of chests 1..24, untouched by run 1. */
  kept: string[];
}

class ScopedStore implements KeyValueStore {
  constructor(private readonly inner: KeyValueStore) {}
  get = (k: string): string | undefined => this.inner.get(SCOPE + k);
  set = (k: string, value: string | undefined): void => this.inner.set(SCOPE + k, value);
  keys = (): string[] => this.inner.keys().filter((k) => k.startsWith(SCOPE)).map((k) => k.slice(SCOPE.length));
  totalBytes = (): number | undefined => this.inner.totalBytes();
}

const v = (p: Vec3): Vector3 => ({ x: p[0], y: p[1], z: p[2] });
const store = (): KeyValueStore => new ScopedStore(new DynamicPropertyStore(world));

function readMarker(): Marker | undefined {
  const raw = world.getDynamicProperty(MARKER);
  return typeof raw === "string" ? (JSON.parse(raw) as Marker) : undefined;
}

export const windmillRestartPhase = (): 1 | 2 => (readMarker() === undefined ? 1 : 2);

async function load(dim: Dimension, center: Vec3, wait: Wait): Promise<void> {
  // Peaceful (the server default) deletes the guards the moment their chunk ticks.
  world.setDifficulty(Difficulty.Easy);
  const r = dim.runCommand(`tickingarea add circle ${center.join(" ")} 2 ${AREA}`);
  if (r.successCount === 0) throw new Error(`tickingarea add ${AREA} refused`);
  for (let t = 0; t < 600; t++) {
    if (dim.isChunkLoaded(v(center)) && dim.getBlock(v(center)) !== undefined) {
      // Entities of a freshly loaded chunk settle within ~45 ticks (probe Q5).
      await wait(60);
      return;
    }
    await wait(1);
  }
  throw new Error(`the windmill area @${center.join(",")} did not load within 600 ticks`);
}

const unload = (dim: Dimension): void => void dim.runCommand(`tickingarea remove ${AREA}`);

const chestContents = (dim: Dimension, origin: Vec3, rot: Instance["rot"]): string[] =>
  WINDMILL_BODY.chests.map((c) => {
    const container = dim.getBlock(v(toWorld(origin, c.local, SIZE, rot)))?.getComponent("minecraft:inventory")?.container;
    return container === undefined ? "no chest" : contents(container).join(" ");
  });

const at = (m: Pick<Marker, "origin" | "rot">, local: Vec3): Vec3 => toWorld(m.origin, local, SIZE, m.rot);
const typeAt = (dim: Dimension, p: Vec3): string => dim.getBlock(v(p))?.typeId ?? "unloaded";

export async function windmillRestartRun1(dim: Dimension, spawn: Vector3, wait: Wait, log: Log): Promise<void> {
  const rot: Instance["rot"] = 2;
  const size = rotatedSize(SIZE, rot);
  const origin: Vec3 = [Math.floor(spawn.x) + 2000, Y, Math.floor(spawn.z) + 2000];
  const center: Vec3 = [origin[0] + 17, Y, origin[2] + 17];
  await load(dim, center, wait);
  try {
    const slab = { min: [origin[0] - SLAB_MARGIN, Y - 1, origin[2] - SLAB_MARGIN] as Vec3, max: [origin[0] + size[0] + SLAB_MARGIN, Y - 1, origin[2] + size[2] + SLAB_MARGIN] as Vec3 };
    for (const s of sliceBox(slab)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), "minecraft:stone");

    const reg = new Registry(store(), log);
    const planned = reg.plan({ def: "windmill", dim: "o", origin, rot, size });
    if (!planned.ok) throw new Error(`plan refused: blocked by ${planned.blockedBy.id}`);
    const placer = new Placer(
      reg,
      engineWorld(dim, { structureManager: world.structureManager, BlockVolume, StructureRotation, protectLegendaries: protectLegendariesIn }),
      { windmill: WINDMILL_BODY },
      { ...new Loot(dim, { ItemStack, EnchantmentType }, log).hooks, spawnGuard: engineSpawnGuard(dim) },
      log
    );
    const r = placer.run(planned.instance);
    if (r.state !== "done") throw new Error(`placer.run: ${JSON.stringify(r)}`);
    const inst = planned.instance;
    await wait(2);

    const all = chestContents(dim, origin, rot);
    const empty = all.filter((c) => c === "").length;
    if (empty > 0) throw new Error(`${empty} chest(s) empty after the init`);
    const guards = dim.getEntities({ tags: [guardTag(inst.id)] });
    if (guards.length !== GUARD_COUNT) throw new Error(`${guards.length} guards after the init`);

    // The player's doing: loot chest 0, break the floor-1 spawner and a wall block, kill three guards.
    dim.getBlock(v(at({ origin, rot }, WINDMILL_BODY.chests[0].local)))?.getComponent("minecraft:inventory")?.container?.clearAll();
    dim.getBlock(v(at({ origin, rot }, [...SPAWNERS[0].at] as Vec3)))?.setType("minecraft:air");
    dim.getBlock(v(at({ origin, rot }, WALL)))?.setType("minecraft:air");
    for (const g of guards.slice(0, KILLED)) g.kill();
    await wait(20);

    const marker: Marker = { id: inst.id, origin, rot, center, kept: chestContents(dim, origin, rot).slice(1) };
    world.setDynamicProperty(MARKER, JSON.stringify(marker));
    log(
      `windmill restart run 1: ${inst.id} done at ${origin.join(",")} rot ${rot}; 25 chests filled (${all.map((c) => c.split(" ").length).join(",")} slots); ` +
        `looted chest 0, broke spawner ${SPAWNERS[0].entity} and wall ${WALL.join(",")}; guards ${guards.length} -> ${dim.getEntities({ tags: [guardTag(inst.id)] }).length}`
    );
  } finally {
    unload(dim);
  }
}

export async function windmillRestartRun2(dim: Dimension, wait: Wait, log: Log): Promise<void> {
  const m = readMarker();
  if (m === undefined) throw new Error("no marker");
  world.setDynamicProperty(MARKER, undefined);
  await load(dim, m.center, wait);
  try {
    // What main.ts does at startup: the registry resumes anything unfinished.
    const rt = new StrfRuntime(store(), engineStrf({ world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType, protectLegendaries: protectLegendariesIn }), { log });
    const resumed = rt.resumeUnfinished();
    for (let i = 0; i < 5; i++) rt.pumpPlacement();
    await wait(40);

    const records = rt.instances("windmill");
    const rec = records.find((i) => i.id === m.id);
    const now = chestContents(dim, m.origin, m.rot);
    const guards = dim.getEntities({ tags: [guardTag(m.id)] }).length;
    const facts = {
      records: records.length,
      state: rec?.state,
      lc: rec?.extras[CHESTS_FILLED],
      gs: rec?.extras[GUARDS_SPAWNED],
      resumed,
      chest0: now[0] === "" ? "empty" : now[0],
      keptChests: now.slice(1).filter((c, i) => c === m.kept[i]).length,
      spawner: typeAt(dim, at(m, [...SPAWNERS[0].at] as Vec3)),
      wall: typeAt(dim, at(m, WALL)),
      guards,
    };
    log(`windmill restart RESULT run 2: ${JSON.stringify(facts)}`);

    const problems: string[] = [];
    if (facts.records !== 1 || facts.state !== "done") problems.push(`${facts.records} record(s), state ${facts.state}`);
    if (facts.lc !== 25 || facts.gs !== GUARD_COUNT) problems.push(`progress lc=${String(facts.lc)} gs=${String(facts.gs)}`);
    if (resumed !== 0) problems.push(`${resumed} instance(s) resumed`);
    if (facts.chest0 !== "empty") problems.push(`looted chest refilled: ${facts.chest0}`);
    if (facts.keptChests !== 24) problems.push(`${24 - facts.keptChests} untouched chest(s) changed`);
    if (facts.spawner !== "minecraft:air") problems.push(`broken spawner is ${facts.spawner}`);
    if (facts.wall !== "minecraft:air") problems.push(`broken wall is ${facts.wall}`);
    if (guards !== GUARD_COUNT - KILLED) problems.push(`${guards} guards, expected ${GUARD_COUNT - KILLED}`);
    if (problems.length > 0) throw new Error(problems.join("; "));
  } finally {
    const box = boxOf(m.origin, rotatedSize(SIZE, m.rot));
    for (const c of WINDMILL_BODY.chests) dim.getBlock(v(at(m, c.local)))?.getComponent("minecraft:inventory")?.container?.clearAll();
    for (const e of dim.getEntities({ location: v(m.center), maxDistance: 64 })) if (e.typeId !== "minecraft:player") e.remove();
    for (const s of sliceBox({ min: [box.min[0] - SLAB_MARGIN, Y - 1, box.min[2] - SLAB_MARGIN], max: [box.max[0] + SLAB_MARGIN, box.max[1], box.max[2] + SLAB_MARGIN] }))
      dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), "minecraft:air");
    unload(dim);
  }
}
