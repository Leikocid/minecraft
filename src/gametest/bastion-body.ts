// The Mini Bastion body on a real engine (§14.2, §14.4, §14.5; L0-bast): the
// natural roll on a netherrack floor built in the Nether, placed one over it;
// the Overworld refused with the Nether named; a lava sea and a vanilla
// Bastion Remnant cancel the candidate before any write; 3 treasure chests
// and 7 others judged by their contents; the one-time garrison of 7–10
// piglins and 2 brutes, no hoglin, no spawner; re-running the guard step,
// killing guards and a script restart change nothing; the guards outlast a
// player standing past the despawn distance. Every test restores the Nether
// it built on.

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
  world,
} from "@minecraft/server";
import { Test, registerAsync } from "@minecraft/server-gametest";
import { BRUTE, PIGLIN, PIGLIN_MAX, PIGLIN_MIN, goldKept, guardTag, piglinCount, roleTag } from "../structures/bodies/bastion";
import { BODIES } from "../structures/bodies";
import { type Box, boxOf, sliceBox } from "../structures/clear";
import type { RollDef } from "../structures/config";
import { BASTION_OTHER, BASTION_TREASURE } from "../structures/loot";
import { ARMOR_SLOTS, CATEGORIES } from "../structures/loot-table";
import { CHESTS_FILLED, GUARDS_SPAWNED, Placer } from "../structures/place";
import { COLLISION_MARGIN, type Instance, type Vec3, SALT_KEY, clearTestHook, installTestHook } from "../structures/registry";
import { type Candidate, buildCandidate } from "../structures/roll";
import { toWorld } from "../structures/rotate";
import { type StrfEngine, StrfRuntime, engineStrf } from "../structures/runtime";
import { MemoryStore } from "../structures/store";
import { BASTION_SIZE, BRUTE_SLOTS, CHESTS, TREASURE, TREASURE_GOLD } from "../structures/templates/bastion";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const CHUNK = 16;
/** Top of the built netherrack floor; the profile stands the bastion one over it. */
const FLOOR = 45;
/** The scan of the netherFloor profile runs 110 → 32; the built site covers it. */
const SITE_TOP = 112;
const SITE_BOTTOM = 25;
/** Past the 128-block instant-despawn distance of vanilla mobs. */
const FAR = 160;
const SIZE: Vec3 = [...BASTION_SIZE];

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);
const v = (p: Vec3): Vector3 => ({ x: p[0], y: p[1], z: p[2] });
const engineApi = { world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType };
const nether = (): Dimension => world.getDimension("nether");

/** Everything the custom table of loot-table.ts can put in a chest. */
const CUSTOM_ITEMS: ReadonlySet<string> = new Set(
  CATEGORIES.flatMap((c) =>
    c.items !== undefined ? [...c.items] : ["iron", "diamond"].flatMap((mat) => (c.gear === "armor" ? ARMOR_SLOTS : [c.gear ?? ""]).map((k) => `minecraft:${mat}_${k}`))
  )
);

function fillBox(dim: Dimension, box: Box, block: string): void {
  for (const s of sliceBox(box)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), block);
}

const unique = (label: string): string => `gt-bb-${label}-${Date.now()}`;

/** A Nether chunk far from anything the other Nether tests build. */
function farChunk(test: Test, offset: number): [number, number] {
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  return [Math.floor(b.x / CHUNK) + offset, Math.floor(b.z / CHUNK) - 40];
}

interface Watch {
  firstWrites: string[];
  fills: string[];
  guards: string[];
}

/** The production engine with the first template write, every chest fill and every guard spawn observed. */
function watched(rtRef: { rt?: StrfRuntime }, watch: Watch): StrfEngine {
  const base = engineStrf(engineApi);
  return {
    ...base,
    placeWorld(d) {
      const pw = base.placeWorld(d);
      if (pw === undefined) return undefined;
      return {
        ...pw,
        place(id, origin, rot) {
          const rec = rtRef.rt?.registry.allInstances().find((i) => i.origin.join() === origin.join());
          watch.firstWrites.push(`${rec?.id} dim=${d} record=${rec?.state} at ${origin.join(",")}`);
          pw.place(id, origin, rot);
        },
      };
    },
    hooks(d) {
      const h = base.hooks(d);
      return {
        ...h,
        fillChest: (ctx) => (watch.fills.push(`${ctx.instance.id}#${ctx.index} ${ctx.table}`), h.fillChest(ctx)),
        spawnGuard: (ctx) => (watch.guards.push(`${ctx.index}:${ctx.entity}`), h.spawnGuard?.(ctx)),
      };
    },
  };
}

function runtime(salt: string, watch: Watch, store = new MemoryStore()): StrfRuntime {
  if (store.get(SALT_KEY) === undefined) store.set(SALT_KEY, salt);
  const ref: { rt?: StrfRuntime } = {};
  ref.rt = new StrfRuntime(store, watched(ref, watch), { log });
  return ref.rt;
}

const newWatch = (): Watch => ({ firstWrites: [], fills: [], guards: [] });

const bastionDef = (rt: StrfRuntime): RollDef => {
  const d = rt.defs.find((x) => x.id === "bastion");
  if (d === undefined) throw new Error("no bastion roll def");
  return d;
};

/** The worked area of a candidate: its footprint plus the margin and two more columns, over the whole profile scan. */
const areaOf = (c: Candidate): Box => ({
  min: [c.x - COLLISION_MARGIN - 2, SITE_BOTTOM, c.z - COLLISION_MARGIN - 2],
  max: [c.x + c.size[0] + COLLISION_MARGIN + 1, SITE_TOP, c.z + c.size[2] + COLLISION_MARGIN + 1],
});

/** Netherrack up to `floor`, air over it to the top of the scan. */
function buildFloor(dim: Dimension, area: Box, floor: number): void {
  fillBox(dim, area, "minecraft:air");
  fillBox(dim, { min: area.min, max: [area.max[0], floor, area.max[2]] }, "minecraft:netherrack");
}

/** A lava sea: lava up to 31, air over it. */
function buildLavaSea(dim: Dimension, area: Box): void {
  fillBox(dim, area, "minecraft:air");
  fillBox(dim, { min: area.min, max: [area.max[0], 31, area.max[2]] }, "minecraft:lava");
}

/** Chests emptied first so the fill drops nothing; then every mob and item in reach; the area back to netherrack. */
function restore(dim: Dimension, area: Box, inst: Instance | undefined): void {
  if (inst !== undefined) for (const p of chestCells(inst)) dim.getBlock(v(p))?.getComponent("minecraft:inventory")?.container?.clearAll();
  fillBox(dim, area, "minecraft:netherrack");
  const centre: Vec3 = [(area.min[0] + area.max[0]) / 2, FLOOR, (area.min[2] + area.max[2]) / 2];
  for (const e of dim.getEntities({ location: v(centre), maxDistance: 64 })) if (e.typeId !== "minecraft:player") e.remove();
}

const at = (inst: Instance, local: readonly number[]): Vec3 => toWorld(inst.origin, [local[0], local[1], local[2]], SIZE, inst.rot);
const chestCells = (inst: Instance): Vec3[] => BODIES.bastion.chests.map((c) => at(inst, c.local));

/** One chest's stacks, "typeId x amount" plus enchantments, sorted. */
function chestLoot(dim: Dimension, p: Vec3): string[] {
  const c = dim.getBlock(v(p))?.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error(`no chest at ${p.join(",")}`);
  const out: string[] = [];
  for (let i = 0; i < c.size; i++) {
    const s = c.getItem(i);
    if (s === undefined) continue;
    const ench = s.getComponent("minecraft:enchantable")?.getEnchantments().map((e) => `${e.type.id}${e.level}`).join("+");
    out.push(`${s.typeId}x${s.amount}${ench ? `[${ench}]` : ""}`);
  }
  return out.sort();
}

const itemOf = (stack: string): string => /^(.*)x\d+(\[.*\])?$/.exec(stack)?.[1] ?? stack;

function generate(rt: StrfRuntime, dim: "o" | "n", cx: number, cz: number): { outcome: string; reason?: string } {
  installTestHook({ outcomes: [["bastion", dim, cx, cz, true]] });
  let r;
  try {
    r = rt.discovery.evaluateChunk(dim, cx, cz).results.find((x) => x.def === "bastion");
  } finally {
    clearTestHook();
  }
  rt.pumpPlacement(10);
  return { outcome: r?.outcome ?? "none", reason: r?.reason };
}

/** Living guards of an instance, by the tag the roster carries. */
const guardsOf = (dim: Dimension, id: string): Entity[] => dim.getEntities({ tags: [guardTag(id)] }).filter((e) => e.isValid);

function census(dim: Dimension, id: string): { piglins: number; brutes: number; hoglins: number; named: number; total: number } {
  const g = guardsOf(dim, id);
  return {
    piglins: g.filter((e) => e.typeId === PIGLIN).length,
    brutes: g.filter((e) => e.typeId === BRUTE).length,
    hoglins: g.filter((e) => /hoglin/.test(e.typeId)).length,
    named: g.filter((e) => e.nameTag !== "").length,
    total: g.length,
  };
}

const onIsland = (inst: Instance, p: Vector3): boolean => {
  const a = at(inst, [TREASURE.x0, 0, TREASURE.z0]);
  const b = at(inst, [TREASURE.x1, 0, TREASURE.z1]);
  const [x0, x1, z0, z1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0]) + 1, Math.min(a[2], b[2]), Math.max(a[2], b[2]) + 1];
  return p.x >= x0 && p.x <= x1 && p.z >= z0 && p.z <= z1;
};

const dist = (p: Vector3, q: Vec3): number => Math.hypot(p.x - (q[0] + 0.5), p.y - q[1], p.z - (q[2] + 0.5));

// ------------------------------------------------ AC1 – AC4, AC6, AC7: one bastion, start to restart

registerAsync("andrew", "bastion_body_generate", async (test: Test): Promise<void> => {
  const dim = nether();
  const [cx, cz] = farChunk(test, 600);
  const watch = newWatch();
  const store = new MemoryStore();
  const rt = runtime(unique("gen"), watch, store);
  const cand = buildCandidate(rt.registry.salt(), "n", cx, cz, bastionDef(rt));
  const area = areaOf(cand);
  const unload = await loadBox(test, dim, "andrew_gt_bb_gen", area);
  let inst: Instance | undefined;
  let player: ReturnType<Test["spawnSimulatedPlayer"]> | undefined;
  let unloadFar: (() => void) | undefined;
  const difficultyBefore = world.getDifficulty();
  try {
    // Peaceful (the server default) refuses to spawn a piglin: the guard step would wait at `looted`.
    world.setDifficulty(Difficulty.Easy);
    buildFloor(dim, area, FLOOR);
    await test.idle(2);
    const res = generate(rt, "n", cx, cz);
    inst = rt.instances("bastion")[0];
    test.assert(res.outcome === "planned" && inst !== undefined, `roll: ${JSON.stringify(res)}`);
    const b = inst!;
    test.assert(b.state === "done" && b.dim === "n", `state ${b.state} dim ${b.dim}`);

    // AC1: in the Nether, one over the floor, written only after the reservation.
    const bottom = dim.getBlock(v(at(b, [5, 0, 5])))?.typeId;
    const under = dim.getBlock(v([b.origin[0] + 5, b.origin[1] - 1, b.origin[2] + 5]))?.typeId;
    log(`bastion generate AC1 RESULT ${b.id} rot ${b.rot} origin ${b.origin.join(",")} (floor ${FLOOR}); bottom layer ${bottom}, under it ${under}; first write: ${watch.firstWrites.join(" | ")}`);
    test.assert(b.origin[1] === FLOOR + 1 && bottom === "minecraft:blackstone" && under === "minecraft:netherrack", `origin ${b.origin.join(",")} bottom ${bottom} under ${under}`);
    test.assert(watch.firstWrites.length === 1 && / dim=n record=planned /.test(watch.firstWrites[0]), `first writes: ${watch.firstWrites.join(" | ")}`);

    // Gold: 2..4 of the four slots.
    const gold = TREASURE_GOLD.filter((g) => dim.getBlock(v(at(b, g)))?.typeId === "minecraft:gold_block").length;
    log(`bastion gold: ${gold} treasure gold blocks, planned ${goldKept(b.id).length}`);
    test.assert(gold === goldKept(b.id).length && gold >= 2 && gold <= 4, `gold ${gold}`);

    // AC2: the chests by their contents.
    const loot = chestCells(b).map((p) => chestLoot(dim, p));
    loot.forEach((l, i) => log(`bastion chest ${i} (${CHESTS[i].zone}) at ${chestCells(b)[i].join(",")}: ${l.join(" ")}`));
    const tre = loot.slice(0, 3);
    const oth = loot.slice(3);
    const treItems = new Set(tre.flat().map(itemOf));
    const othItems = new Set(oth.flat().map(itemOf));
    const onlyTre = [...treItems].filter((i) => !othItems.has(i));
    const onlyOth = [...othItems].filter((i) => !treItems.has(i));
    const notCustom = [...new Set([...treItems, ...othItems])].filter((i) => !CUSTOM_ITEMS.has(i));
    const fills = watch.fills.map((f) => f.split(" ")[1]);
    log(
      `bastion chests AC2 RESULT treasure ${tre.length} chests ${tre.filter((l) => l.length > 0).length} filled, items ${[...treItems].join(",")}; ` +
        `other ${oth.length} chests ${oth.filter((l) => l.length > 0).length} filled, items ${[...othItems].join(",")}; ` +
        `treasure-only ${onlyTre.join(",") || "none"}; other-only ${onlyOth.join(",") || "none"}; not from the custom table ${notCustom.length}; fills ${fills.join(",")}`
    );
    test.assert(loot.every((l) => l.length > 0), "an empty chest");
    test.assert(fills.join() === [...Array(3).fill(BASTION_TREASURE), ...Array(7).fill(BASTION_OTHER)].join(), `fills ${fills.join(",")}`);
    test.assert(onlyTre.length > 0 && onlyOth.length > 0, "the two tables gave the same item sets");
    test.assert(notCustom.length > 0, "every item could have come from the custom table");

    // AC3: the roster, read from the engine.
    const n = piglinCount(b.id);
    const brutes = guardsOf(dim, b.id).filter((e) => e.typeId === BRUTE);
    const tBrute = brutes.find((e) => e.hasTag(roleTag("treasure")));
    const oBrute = brutes.find((e) => e.hasTag(roleTag("other")));
    const oSlot = at(b, BRUTE_SLOTS.find((s) => s.slot === "other")!.at);
    const tSpawn = tBrute?.location;
    const oSpawnDist = oBrute === undefined ? -1 : dist(oBrute.location, oSlot);
    await test.idle(40);
    const c0 = census(dim, b.id);
    const box = boxOf(b.origin, b.size);
    const hoglinsNear = dim.getEntities({ location: v([(box.min[0] + box.max[0]) / 2, b.origin[1] + 6, (box.min[2] + box.max[2]) / 2]), maxDistance: 20 }).filter((e) => /hoglin/.test(e.typeId)).length;
    const tIsland = tBrute?.isValid === true && onIsland(b, tBrute.location) && tBrute.location.y >= b.origin[1] + 2;
    log(
      `bastion garrison AC3 RESULT piglins ${c0.piglins} (planned ${n}, allowed ${PIGLIN_MIN}–${PIGLIN_MAX}) brutes ${c0.brutes} hoglins tagged ${c0.hoglins} hoglins in the bastion ${hoglinsNear} named ${c0.named}/${c0.total}; ` +
        `treasure brute spawned ${tSpawn === undefined ? "-" : `${tSpawn.x.toFixed(1)},${tSpawn.y.toFixed(1)},${tSpawn.z.toFixed(1)}`}, on the island after 40 ticks ${tIsland}; ` +
        `other brute spawned ${oSpawnDist.toFixed(2)} from its slot ${oSlot.join(",")}; gs=${String(b.extras[GUARDS_SPAWNED])} spawns ${watch.guards.join(" ")}`
    );
    test.assert(c0.piglins === n && n >= PIGLIN_MIN && n <= PIGLIN_MAX, `${c0.piglins} piglins, planned ${n}`);
    test.assert(c0.brutes === 2 && c0.hoglins === 0 && hoglinsNear === 0, `brutes ${c0.brutes} hoglins ${c0.hoglins}/${hoglinsNear}`);
    test.assert(c0.named === c0.total, "an unnamed guard");
    test.assert(tSpawn !== undefined && onIsland(b, tSpawn) && tIsland, "the treasure brute is not on the island");
    test.assert(oSpawnDist >= 0 && oSpawnDist <= 1, `the other brute spawned ${oSpawnDist} from its slot`);

    // AC6: no spawner anywhere in the placed bastion.
    const spawners = sliceBox(box).filter((s) => dim.containsBlock(new BlockVolume(v(s.min), v(s.max)), { includeTypes: ["minecraft:mob_spawner", "minecraft:trial_spawner"] }, false)).length;
    log(`bastion spawners AC6 RESULT spawner blocks in the placed box: ${spawners === 0 ? 0 : "some"}`);
    test.assert(spawners === 0, "a spawner in the bastion");

    // AC4: re-run the guard step every way it can be reached; then kill three and re-run again.
    const guardsBefore = watch.guards.length;
    const placer = new Placer(rt.registry, engineStrf(engineApi).placeWorld("n")!, BODIES, { fillChest: () => {}, spawnGuard: () => watch.guards.push("rerun") }, log);
    const reinit = placer.init(b);
    const regen = generate(rt, "n", cx, cz);
    const byHand = rt.placeAt("bastion", "n", cand.x + 10, cand.z + 10, b.rot, { id: b.id });
    await test.idle(10);
    const c1 = census(dim, b.id);
    const victims = guardsOf(dim, b.id).filter((e) => e.typeId === PIGLIN).slice(0, 2).concat(guardsOf(dim, b.id).filter((e) => e.hasTag(roleTag("other"))));
    for (const e of victims) e.kill();
    await test.idle(20);
    const c2 = census(dim, b.id);
    const rt2 = runtime("unused", watch, store);
    const resumed = rt2.resumeUnfinished();
    rt2.pumpPlacement(10);
    const again = generate(rt2, "n", cx, cz);
    placer.init(b);
    await test.idle(100);
    const c3 = census(dim, b.id);
    log(
      `bastion garrison AC4 RESULT before ${c0.total}; after re-running the step (init -> ${reinit}, roll -> ${regen.outcome}, place by hand -> ${byHand.kind}) ${c1.total}; ` +
        `killed ${victims.length} -> ${c2.total}; after a restart (resumed ${resumed}, roll -> ${again.outcome}) and 100 ticks ${c3.total}; spawn calls ${guardsBefore} -> ${watch.guards.length}`
    );
    test.assert(c1.total === c0.total && reinit === "done" && regen.outcome === "existing" && byHand.kind === "blocked", `re-run: ${c1.total} ${reinit} ${regen.outcome} ${byHand.kind}`);
    test.assert(c2.total === c0.total - victims.length && c3.total === c2.total && c3.brutes === 1, `after kills ${c2.total}, later ${c3.total}`);
    test.assert(watch.guards.length === guardsBefore && resumed === 0, `extra spawns ${watch.guards.slice(guardsBefore).join(" ")}`);

    // AC7: plunder one treasure and one other chest; a script restart refills neither.
    const cells = chestCells(b);
    for (const i of [0, 5]) dim.getBlock(v(cells[i]))?.getComponent("minecraft:inventory")?.container?.clearAll();
    const before = cells.map((p) => chestLoot(dim, p).join(" "));
    const rt3 = runtime("unused", watch, store);
    const resumed3 = rt3.resumeUnfinished();
    rt3.pumpPlacement(10);
    const byHand3 = rt3.placeAt("bastion", "n", cand.x + 10, cand.z + 10, b.rot, { id: b.id });
    await test.idle(5);
    const after = cells.map((p) => chestLoot(dim, p).join(" "));
    const changed = before.filter((x, i) => after[i] !== x).length;
    log(
      `bastion restart AC7 RESULT resumed ${resumed3}; place by hand -> ${byHand3.kind}; fills ${watch.fills.length}; lc=${String(rt3.registry.get("n", b.origin, b.id)?.extras[CHESTS_FILLED])}; ` +
        `plundered treasure chest ${after[0] === "" ? "empty" : after[0]}, plundered other chest ${after[5] === "" ? "empty" : after[5]}; chests changed ${changed}`
    );
    test.assert(resumed3 === 0 && byHand3.kind === "blocked" && watch.fills.length === 10, `restart: ${resumed3} ${byHand3.kind} fills ${watch.fills.length}`);
    test.assert(after[0] === "" && after[5] === "" && changed === 0, `plundered ${after[0]} / ${after[5]}, changed ${changed}`);

    // Distance: a player past the despawn distance in the same dimension; the guards stay, an unnamed control piglin may not.
    const control = dim.spawnEntity(PIGLIN, v([box.min[0] + 3, b.origin[1] + 5, box.min[2] + 10]));
    const far: Vec3 = [Math.floor((box.min[0] + box.max[0]) / 2) + FAR, FLOOR, Math.floor((box.min[2] + box.max[2]) / 2)];
    const pad: Box = { min: [far[0] - 1, far[1] - 1, far[2] - 1], max: [far[0] + 1, far[1] + 3, far[2] + 1] };
    unloadFar = await loadBox(test, dim, "andrew_gt_bb_far", pad);
    fillBox(dim, pad, "minecraft:air");
    fillBox(dim, { min: pad.min, max: [pad.max[0], far[1] - 1, pad.max[2]] }, "minecraft:netherrack");
    player = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 1 }, "andrew_bastion_far", GameMode.Creative);
    player.teleport({ x: far[0] + 0.5, y: far[1], z: far[2] + 0.5 }, { dimension: dim });
    await test.idle(200);
    const c4 = census(dim, b.id);
    const pd = player.dimension.id === dim.id ? Math.round(Math.hypot(player.location.x - (box.min[0] + 10), player.location.z - (box.min[2] + 10))) : -1;
    log(
      `bastion distance RESULT player in ${player.dimension.id} ${pd} blocks from the bastion for 200 ticks; guards ${c3.total} -> ${c4.total}; ` +
        `unnamed control piglin ${control.isValid ? "still there" : "despawned"}`
    );
    test.assert(pd > 128, `the player stands ${pd} blocks away`);
    test.assert(c4.total === c3.total, `guards ${c3.total} -> ${c4.total} with a far player`);
    test.succeed();
  } finally {
    if (player !== undefined) test.removeSimulatedPlayer(player);
    unloadFar?.();
    restore(dim, area, inst);
    world.setDifficulty(difficultyBefore);
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");

// ------------------------------------------------ AC1: only the Nether, only a fit floor

interface SiteCase {
  label: string;
  offset: number;
  build(dim: Dimension, area: Box, c: Candidate): string;
  reason: string;
}

const SITE_CASES: readonly SiteCase[] = [
  {
    label: "lava_sea",
    offset: 620,
    build(dim, area) {
      buildLavaSea(dim, area);
      return "a lava sea at 31 and air over it";
    },
    reason: "lavaOcean",
  },
  {
    label: "remnant",
    offset: 630,
    // A vanilla Bastion Remnant's bricks inside the footprint.
    build(dim, area, c) {
      buildFloor(dim, area, FLOOR);
      const p: Vec3 = [c.x + 8, FLOOR + 3, c.z + 8];
      dim.getBlock(v(p))?.setType("minecraft:polished_blackstone_bricks");
      return `polished_blackstone_bricks at ${p.join(",")}`;
    },
    reason: "collision:signature",
  },
  {
    label: "no_floor",
    offset: 640,
    // Nothing solid between the scan's top and bottom: open air down to the lava.
    build(dim, area) {
      fillBox(dim, area, "minecraft:air");
      fillBox(dim, { min: area.min, max: [area.max[0], SITE_BOTTOM + 2, area.max[2]] }, "minecraft:bedrock");
      return "air from the scan's top to below its bottom";
    },
    reason: "floor",
  },
];

registerAsync("andrew", "bastion_body_site", async (test: Test): Promise<void> => {
  const dim = nether();
  const verdicts: string[] = [];

  // The Overworld: a hand place is refused naming the Nether; a forced Overworld roll has no bastion to roll.
  {
    const watch = newWatch();
    const rt = runtime(unique("ow"), watch);
    const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
    const r = rt.placeAt("bastion", "o", b.x, b.z, 0);
    const [cx, cz] = [Math.floor(b.x / CHUNK), Math.floor(b.z / CHUNK)];
    const res = generate(rt, "o", cx, cz);
    const ok = r.kind === "wrong-dimension" && r.need === "n" && res.outcome === "none" && rt.instances().length === 0 && watch.firstWrites.length === 0;
    log(`bastion site overworld: place -> ${JSON.stringify(r)}; forced Overworld roll -> ${res.outcome}; records ${rt.instances().length}; writes ${watch.firstWrites.length}`);
    verdicts.push(`overworld:${ok ? "ok" : "FAIL"}`);
  }

  for (const sc of SITE_CASES) {
    const [cx, cz] = farChunk(test, sc.offset);
    const watch = newWatch();
    const rt = runtime(unique(sc.label), watch);
    const cand = buildCandidate(rt.registry.salt(), "n", cx, cz, bastionDef(rt));
    const area = areaOf(cand);
    const unload = await loadBox(test, dim, `andrew_gt_bb_${sc.label}`, area);
    let inst: Instance | undefined;
    try {
      const note = sc.build(dim, area, cand);
      await test.idle(2);
      const res = generate(rt, "n", cx, cz);
      await test.idle(2);
      inst = rt.instances("bastion")[0];
      const written = sliceBox(boxOf([cand.x, SITE_BOTTOM, cand.z], [cand.size[0], SITE_TOP - SITE_BOTTOM + 1, cand.size[2]])).some((s) =>
        dim.containsBlock(new BlockVolume(v(s.min), v(s.max)), { includeTypes: ["minecraft:chest", "minecraft:gilded_blackstone"] }, false)
      );
      const ok = res.outcome === "rejected" && res.reason === sc.reason && inst === undefined && !written && watch.firstWrites.length === 0;
      log(`bastion site ${sc.label}: ${cand.id} rot ${cand.rot}; ${note} -> ${res.outcome} ${res.reason ?? ""}; records ${rt.instances().length}; bastion blocks written ${written}`);
      verdicts.push(`${sc.label}:${ok ? "ok" : "FAIL"}`);
    } finally {
      restore(dim, area, inst);
      unload();
    }
    // A ticking area added in the tick another was removed never loads its chunks (measured on BDS 1.26.51.1).
    await test.idle(20);
  }
  log(`bastion site AC1 RESULT ${verdicts.join(" ")}`);
  test.assert(verdicts.every((x) => x.endsWith(":ok")), `bastion site: ${verdicts.join(" ")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");

export const BASTION_BODY_TESTS = ["bastion_body_generate", "bastion_body_site"];

log(`registered ${BASTION_BODY_TESTS.length} bastion body test(s): ${BASTION_BODY_TESTS.join(" ")}`);
