// A Mini Bastion's garrison and loot across a chunk unload and a real restart
// (§14.4, §14.5, L0-bast-r005): run 1 builds one in the Nether through the
// production Placer, body and engine hooks, plunders two chests and kills
// three guards, then unloads its chunks and loads them again; run 2 — after
// bds:check restarts the server on the same world — runs the startup resume
// and counts again. Every count of survivors is logged. The phase comes from a
// marker run 1 saves.

import {
  BlockTypes,
  BlockVolume,
  Difficulty,
  type Dimension,
  EnchantmentType,
  ItemStack,
  StructureRotation,
  type Vector3,
  world,
} from "@minecraft/server";
import { BASTION_BODY, BRUTE, PIGLIN, guardTag, piglinCount } from "../structures/bodies/bastion";
import { type Box, boxOf, sliceBox } from "../structures/clear";
import { Loot, contents } from "../structures/loot";
import { CHESTS_FILLED, GUARDS_SPAWNED, Placer, engineSpawnGuard, engineWorld } from "../structures/place";
import { type Instance, type Vec3, Registry } from "../structures/registry";
import { rotatedSize, toWorld } from "../structures/rotate";
import { StrfRuntime, engineStrf } from "../structures/runtime";
import { DynamicPropertyStore, type KeyValueStore } from "../structures/store";
import { BASTION_SIZE } from "../structures/templates/bastion";
import type { Log, Wait } from "./chunk-probe";

const MARKER = "andrew:selftest_bastion";
const AREA = "andrew_selftest_bastion";
/** Its own key prefix: the registry restart check compares every record under the bare prefix. */
const SCOPE = "bb:";
/** Clear of the lava sea (31) and the Nether roof. */
const Y = 60;
const SHELL = 2;
const PLUNDERED = [0, 5];
const SIZE: Vec3 = [...BASTION_SIZE];

interface Marker {
  id: string;
  origin: Vec3;
  rot: Instance["rot"];
  center: Vec3;
  /** Guards alive after the kills and the in-run unload. */
  alive: number;
  names: number;
  /** Contents of every chest after the plunder. */
  chests: string[];
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
const peaceful = (): boolean => world.getDifficulty() === Difficulty.Peaceful;

function readMarker(): Marker | undefined {
  const raw = world.getDynamicProperty(MARKER);
  return typeof raw === "string" ? (JSON.parse(raw) as Marker) : undefined;
}

export const bastionRestartPhase = (): 1 | 2 => (readMarker() === undefined ? 1 : 2);

function fillBox(dim: Dimension, box: Box, block: string): void {
  for (const s of sliceBox(box)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), block);
}

async function load(dim: Dimension, center: Vec3, wait: Wait): Promise<void> {
  // Peaceful (the server default) deletes hostile mobs the moment their chunk ticks.
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
  throw new Error(`the bastion area @${center.join(",")} did not load within 600 ticks`);
}

const unload = (dim: Dimension): void => void dim.runCommand(`tickingarea remove ${AREA}`);

const at = (m: Pick<Marker, "origin" | "rot">, local: Vec3): Vec3 => toWorld(m.origin, local, SIZE, m.rot);

const chestContents = (dim: Dimension, m: Pick<Marker, "origin" | "rot">): string[] =>
  BASTION_BODY.chests.map((c) => {
    const container = dim.getBlock(v(at(m, c.local)))?.getComponent("minecraft:inventory")?.container;
    return container === undefined ? "no chest" : contents(container).join(" ");
  });

function census(dim: Dimension, id: string): { alive: number; piglins: number; brutes: number; names: number } {
  const g = dim.getEntities({ tags: [guardTag(id)] });
  return {
    alive: g.length,
    piglins: g.filter((e) => e.typeId === PIGLIN).length,
    brutes: g.filter((e) => e.typeId === BRUTE).length,
    names: g.filter((e) => e.nameTag !== "").length,
  };
}

export async function bastionRestartRun1(dim: Dimension, wait: Wait, log: Log): Promise<void> {
  const rot: Instance["rot"] = 1;
  const size = rotatedSize(SIZE, rot);
  const origin: Vec3 = [3000, Y, 3000];
  const center: Vec3 = [origin[0] + 10, Y, origin[2] + 10];
  await load(dim, center, wait);
  const box = boxOf(origin, size);
  const shell: Box = { min: [box.min[0] - SHELL, box.min[1] - SHELL, box.min[2] - SHELL], max: [box.max[0] + SHELL, box.max[1] + SHELL, box.max[2] + SHELL] };
  try {
    // A netherrack shell keeps the Nether's lava, mobs and open drops out.
    fillBox(dim, shell, "minecraft:netherrack");
    fillBox(dim, box, "minecraft:air");

    const reg = new Registry(store(), log);
    const planned = reg.plan({ def: "bastion", dim: "n", origin, rot, size });
    if (!planned.ok) throw new Error(`plan refused: blocked by ${planned.blockedBy.id}`);
    const placer = new Placer(
      reg,
      engineWorld(dim, { structureManager: world.structureManager, BlockVolume, StructureRotation }),
      { bastion: BASTION_BODY },
      { ...new Loot(dim, { ItemStack, EnchantmentType }, log).hooks, spawnGuard: engineSpawnGuard(dim, { peaceful }) },
      log
    );
    const r = placer.run(planned.instance);
    if (r.state !== "done") throw new Error(`placer.run: ${JSON.stringify(r)}`);
    const inst = planned.instance;
    await wait(2);

    const planned0 = piglinCount(inst.id) + 2;
    const c0 = census(dim, inst.id);
    const all = chestContents(dim, { origin, rot });
    if (all.some((c) => c === "")) throw new Error(`${all.filter((c) => c === "").length} chest(s) empty after the init`);
    if (c0.alive !== planned0 || c0.brutes !== 2) throw new Error(`${c0.alive} guards (${c0.brutes} brutes) after the init, planned ${planned0}`);

    // The player's doing: plunder a treasure and an other chest, kill two piglins and a brute.
    for (const i of PLUNDERED) dim.getBlock(v(at({ origin, rot }, BASTION_BODY.chests[i].local)))?.getComponent("minecraft:inventory")?.container?.clearAll();
    const guards = dim.getEntities({ tags: [guardTag(inst.id)] });
    const victims = [...guards.filter((e) => e.typeId === PIGLIN).slice(0, 2), ...guards.filter((e) => e.typeId === BRUTE).slice(0, 1)];
    for (const e of victims) e.kill();
    await wait(20);
    const c1 = census(dim, inst.id);

    // A chunk unload inside the run: the area's only loader goes away, the chunks go, then come back.
    unload(dim);
    let unloadedAfter = -1;
    for (let t = 0; t < 600; t++) {
      if (!dim.isChunkLoaded(v(center))) {
        unloadedAfter = t;
        break;
      }
      await wait(1);
    }
    if (unloadedAfter < 0) throw new Error("the bastion chunks never unloaded after the ticking area was removed");
    await wait(40);
    await load(dim, center, wait);
    const c2 = census(dim, inst.id);

    const marker: Marker = { id: inst.id, origin, rot, center, alive: c2.alive, names: c2.names, chests: chestContents(dim, { origin, rot }) };
    world.setDynamicProperty(MARKER, JSON.stringify(marker));
    log(
      `bastion restart RESULT run 1: ${inst.id} done in the Nether at ${origin.join(",")} rot ${rot}; guards spawned ${c0.alive} (${c0.piglins} piglins, ${c0.brutes} brutes); ` +
        `killed ${victims.length} -> ${c1.alive}; chunks unloaded after ${unloadedAfter} tick(s), reloaded -> survivors ${c2.alive}/${c1.alive} (${c2.piglins} piglins, ${c2.brutes} brutes, named ${c2.names}); ` +
        `plundered chests ${PLUNDERED.join(",")}`
    );
    if (c1.alive !== planned0 - victims.length) throw new Error(`${c1.alive} guards after killing ${victims.length} of ${planned0}`);
    if (c2.alive !== c1.alive || c2.names !== c2.alive) throw new Error(`the chunk unload took guards: ${c1.alive} -> ${c2.alive}, named ${c2.names}`);
  } catch (e) {
    fillBox(dim, shell, "minecraft:air");
    throw e;
  } finally {
    unload(dim);
  }
}

export async function bastionRestartRun2(dim: Dimension, wait: Wait, log: Log): Promise<void> {
  const m = readMarker();
  if (m === undefined) throw new Error("no marker");
  world.setDynamicProperty(MARKER, undefined);
  await load(dim, m.center, wait);
  try {
    // What main.ts does at startup: the registry resumes anything unfinished.
    const rt = new StrfRuntime(store(), engineStrf({ world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType }), { log });
    const resumed = rt.resumeUnfinished();
    for (let i = 0; i < 5; i++) rt.pumpPlacement();
    await wait(40);

    const records = rt.instances("bastion");
    const rec = records.find((i) => i.id === m.id);
    const now = chestContents(dim, m);
    const c = census(dim, m.id);
    const facts = {
      records: records.length,
      state: rec?.state,
      lc: rec?.extras[CHESTS_FILLED],
      gs: rec?.extras[GUARDS_SPAWNED],
      resumed,
      plundered: PLUNDERED.map((i) => (now[i] === "" ? "empty" : now[i])),
      keptChests: now.filter((x, i) => !PLUNDERED.includes(i) && x === m.chests[i]).length,
      survivors: `${c.alive}/${m.alive}`,
      named: c.names,
    };
    log(`bastion restart RESULT run 2: survivors after the restart ${c.alive}/${m.alive} (${c.piglins} piglins, ${c.brutes} brutes, named ${c.names}); ${JSON.stringify(facts)}`);

    const problems: string[] = [];
    if (facts.records !== 1 || facts.state !== "done") problems.push(`${facts.records} record(s), state ${facts.state}`);
    if (facts.lc !== 10 || facts.gs !== piglinCount(m.id) + 2) problems.push(`progress lc=${String(facts.lc)} gs=${String(facts.gs)}`);
    if (resumed !== 0) problems.push(`${resumed} instance(s) resumed`);
    if (facts.plundered.some((x) => x !== "empty")) problems.push(`a plundered chest refilled: ${facts.plundered.join(" | ")}`);
    if (facts.keptChests !== 10 - PLUNDERED.length) problems.push(`${10 - PLUNDERED.length - facts.keptChests} untouched chest(s) changed`);
    if (c.alive !== m.alive) problems.push(`${c.alive} guards, expected ${m.alive}`);
    if (c.names !== c.alive || m.names !== m.alive) problems.push(`names lost: ${c.names}/${c.alive}`);
    if (problems.length > 0) throw new Error(problems.join("; "));
  } finally {
    const box = boxOf(m.origin, rotatedSize(SIZE, m.rot));
    for (const cc of BASTION_BODY.chests) dim.getBlock(v(at(m, cc.local)))?.getComponent("minecraft:inventory")?.container?.clearAll();
    for (const e of dim.getEntities({ location: v(m.center), maxDistance: 40 })) if (e.typeId !== "minecraft:player") e.remove();
    fillBox(dim, { min: [box.min[0] - SHELL, box.min[1] - SHELL, box.min[2] - SHELL], max: [box.max[0] + SHELL, box.max[1] + SHELL, box.max[2] + SHELL] }, "minecraft:air");
    unload(dim);
  }
}
