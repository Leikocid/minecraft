// L0-katn-cx01 probe against BDS 1.26.51.1: the engine facts the amended
// L0-adr-ktob §3 rests on, and what a player placed in a cell it calls safe
// meets.
//
// Not part of the shipped gametest pack: diagnose-CNTR-KATN-CX01.repro.sh copies
// this file to src/gametest/ for one run and restores the tree. There is no
// Katana code; the rays below are the ones L0-katn-ad01 §1–§3 and L0-katn-r004
// prescribe, cast on real blocks.

import { BlockTypes, type Dimension, EntityDamageCause, GameMode, type Vector3, system, world } from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";
const EPS = 0.01;
/** L0-adr-ktob §1: the trace flags, reused by the fit and reach rays. */
const TRACE = { includePassableBlocks: false, includeLiquidBlocks: false };
/** L0-katn-ad01 §3 / L0-katn-as03. */
const HAZARDS = ["minecraft:lava", "minecraft:flowing_lava", "minecraft:fire", "minecraft:soul_fire"];
const WATCH_TICKS = 40;
const SAMPLES = new Set([1, 3, 5, 10, 20, 40]);

const log = (msg: string): void => console.warn(`[probe] KATN ${msg}`);
const f2 = (v: Vector3): string => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;

interface Hurt {
  lava: number;
  fire: number;
  fireTick: number;
  other: string[];
  firstLava: number | undefined;
}
const hurts = new Map<string, Hurt>();
let t0 = 0;

world.afterEvents.entityHurt.subscribe((e) => {
  const h = hurts.get(e.hurtEntity.id);
  if (h === undefined) return;
  const cause = e.damageSource.cause;
  if (cause === EntityDamageCause.lava) {
    h.lava++;
    h.firstLava ??= system.currentTick - t0;
  } else if (cause === EntityDamageCause.fire) h.fire++;
  else if (cause === EntityDamageCause.fireTick) h.fireTick++;
  else h.other.push(cause);
});

function set(test: Test, rel: Vector3, id: string): void {
  test.getDimension().setBlockType(test.worldBlockLocation(rel), id);
}

function typeAt(test: Test, rel: Vector3): string {
  return test.getDimension().getBlock(test.worldBlockLocation(rel))?.typeId ?? "unloaded";
}

/** L0-katn-ad01 §1: one ray down the centre of the feet and head cells. A hit means "does not fit". */
function columnRay(dim: Dimension, feet: Vector3): string {
  const hit = dim.getBlockFromRay(
    { x: feet.x + 0.5, y: feet.y + 2 - EPS, z: feet.z + 0.5 },
    { x: 0, y: -1, z: 0 },
    { ...TRACE, maxDistance: 2 - 2 * EPS }
  );
  return hit === undefined ? "none" : hit.block.typeId;
}

function rayDown(dim: Dimension, from: Vector3, opts: { includePassableBlocks: boolean; includeLiquidBlocks: boolean }): string {
  const hit = dim.getBlockFromRay(from, { x: 0, y: -1, z: 0 }, { ...opts, maxDistance: 64 });
  return hit === undefined ? "none" : `${hit.block.typeId}@y${hit.block.location.y}`;
}

const CONTENTS: ReadonlyArray<{ id: string; below: string }> = [
  { id: "minecraft:air", below: "minecraft:stone" },
  { id: "minecraft:water", below: "minecraft:stone" },
  { id: "minecraft:lava", below: "minecraft:stone" },
  { id: "minecraft:flowing_lava", below: "minecraft:stone" },
  { id: "minecraft:fire", below: "minecraft:stone" },
  { id: "minecraft:soul_fire", below: "minecraft:soul_soil" },
  { id: "minecraft:short_grass", below: "minecraft:dirt" },
  { id: "minecraft:stone", below: "minecraft:stone" },
];

registerAsync("andrew", "probe_katn_cx01_safe", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const floor = typeAt(test, { x: 1, y: 1, z: 1 });
  log(`setup floor(1,1,1)=${floor} above(1,2,1)=${typeAt(test, { x: 1, y: 2, z: 1 })}`);

  const known = HAZARDS.map((id) => `${id.slice(10)}=${BlockTypes.get(id)?.id ?? "unknown"}`).join(" ");
  log(`IDS ${known}`);
  const family = BlockTypes.getAll()
    .map((t) => t.id)
    .filter((id) => /lava|fire|magma/.test(id))
    .sort();
  log(`IDS all lava/fire/magma types (${family.length}): ${family.join(" ")}`);

  // Natural flow: a 3-cell trench sunk into the floor, sealed by stone, source at its west end.
  // A script setBlockType of lava never starts a flow (measured: the trench stayed air for
  // 80 ticks); /setblock is tried instead.
  for (const x of [3, 4, 5]) {
    set(test, { x, y: 0, z: 1 }, "minecraft:stone");
    set(test, { x, y: 1, z: 1 }, "minecraft:air");
  }
  const src = test.worldBlockLocation({ x: 3, y: 1, z: 1 });
  const placed = dim.runCommand(`setblock ${src.x} ${src.y} ${src.z} lava`);
  log(`FLOW source via /setblock successCount=${placed.successCount}`);
  const flowStart = system.currentTick;

  // Part A — what the fit ray and the hazard filter see, one content at a time in a sealed pit.
  const pit: Vector3 = { x: 1, y: 1, z: 1 };
  const below: Vector3 = { x: 1, y: 0, z: 1 };
  const fit = new Map<string, { read: string; ray: string }>();
  for (const c of CONTENTS) {
    try {
      set(test, below, c.below);
      set(test, pit, c.id);
    } catch (err) {
      log(`FIT cell=${c.id} SKIP ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    const read0 = typeAt(test, pit);
    const ray0 = columnRay(dim, test.worldBlockLocation(pit));
    await test.idle(2);
    const read2 = typeAt(test, pit);
    const ray2 = columnRay(dim, test.worldBlockLocation(pit));
    fit.set(c.id, { read: read0, ray: ray0 });
    const depth = dim.getBlock(test.worldBlockLocation(pit))?.permutation.getState("liquid_depth");
    log(`FIT cell=${c.id} read=${read0}/${read2}(liquid_depth=${depth ?? "-"}) columnRay=${ray0}/${ray2} hazardListed=${HAZARDS.includes(read0)}`);
    set(test, pit, "minecraft:air");
    set(test, below, "minecraft:stone");
    await test.idle(2);
  }

  const flowWait = 200 - (system.currentTick - flowStart);
  if (flowWait > 0) await test.idle(flowWait);
  const flow = [3, 4, 5].map((x) => {
    const block = dim.getBlock(test.worldBlockLocation({ x, y: 1, z: 1 }));
    const depth = block?.permutation.getState("liquid_depth");
    return `${x}:${block?.typeId ?? "unloaded"}(liquid_depth=${depth ?? "-"})/columnRay=${columnRay(dim, test.worldBlockLocation({ x, y: 1, z: 1 }))}`;
  });
  log(`FLOW after ${system.currentTick - flowStart} ticks trench=[${flow.join(" ")}]`);

  // Part B — a cell the amended §3 calls safe, directly above lava.
  for (const x of [3, 5]) {
    set(test, { x, y: 0, z: 4 }, "minecraft:stone");
    set(test, { x, y: 1, z: 4 }, "minecraft:lava");
  }
  const cases: Array<{ label: string; spawn: Vector3; place: Vector3; player?: SimulatedPlayer }> = [
    { label: "above-stone", spawn: { x: 1, y: 2, z: 6 }, place: { x: 1.5, y: 2, z: 4.5 } },
    { label: "above-lava", spawn: { x: 3, y: 2, z: 6 }, place: { x: 3.5, y: 2, z: 4.5 } },
    { label: "in-lava", spawn: { x: 5, y: 2, z: 6 }, place: { x: 5.5, y: 1, z: 4.5 } },
  ];
  for (const c of cases) c.player = test.spawnSimulatedPlayer(c.spawn, `katn_${c.label}`, GameMode.Survival);
  await test.idle(10);

  // The r004 checks for the above-lava candidate F = (3,2,4).
  const F: Vector3 = { x: 3, y: 2, z: 4 };
  const feetBlock = dim.getBlock(test.worldBlockLocation(F));
  const headBlock = dim.getBlock(test.worldBlockLocation({ x: 3, y: 3, z: 4 }));
  const airShortcut = feetBlock?.isAir === true && headBlock?.isAir === true;
  const fitRay = columnRay(dim, test.worldBlockLocation(F));
  const hazard = HAZARDS.includes(feetBlock?.typeId ?? "") || HAZARDS.includes(headBlock?.typeId ?? "");
  const watcher = cases[1].player as SimulatedPlayer;
  const head = watcher.getHeadLocation();
  const target = test.worldLocation({ x: 3.5, y: 3.5, z: 4.5 });
  const delta = { x: target.x - head.x, y: target.y - head.y, z: target.z - head.z };
  const dist = Math.hypot(delta.x, delta.y, delta.z);
  const reachHit = dim.getBlockFromRay(head, { x: delta.x / dist, y: delta.y / dist, z: delta.z / dist }, { ...TRACE, maxDistance: dist - EPS });
  const reach = reachHit === undefined ? "clear" : `blocked:${reachHit.block.typeId}`;
  const under = typeAt(test, { x: 3, y: 1, z: 4 });
  const from = test.worldLocation({ x: 3.5, y: 2.5, z: 4.5 });
  const downAll = rayDown(dim, from, { includePassableBlocks: true, includeLiquidBlocks: true });
  const downLiquid = rayDown(dim, from, { includePassableBlocks: false, includeLiquidBlocks: true });
  const downStone = rayDown(dim, test.worldLocation({ x: 1.5, y: 2.5, z: 4.5 }), { includePassableBlocks: true, includeLiquidBlocks: true });
  log(
    `CANDIDATE above-lava F=(3,2,4) airShortcut=${airShortcut} columnRay=${fitRay} hazard=${hazard} ` +
      `reachFrom=${f2(test.relativeLocation(head))} reach=${reach} dist=${dist.toFixed(2)} cellBelow=${under} | ` +
      `downRay passable+liquid=${downAll} liquidOnly=${downLiquid} control(1,2,4)=${downStone}`
  );

  for (const c of cases) hurts.set((c.player as SimulatedPlayer).id, { lava: 0, fire: 0, fireTick: 0, other: [], firstLava: undefined });
  t0 = system.currentTick;
  for (const c of cases) (c.player as SimulatedPlayer).teleport(test.worldLocation(c.place));

  const track = new Map<string, string[]>(cases.map((c) => [c.label, []]));
  for (let t = 1; t <= WATCH_TICKS; t++) {
    await test.idle(1);
    if (!SAMPLES.has(t)) continue;
    for (const c of cases) {
      const p = c.player as SimulatedPlayer;
      if (!p.isValid) {
        track.get(c.label)?.push(`+${t}:gone`);
        continue;
      }
      const rel = test.relativeLocation(p.location);
      const feet = dim.getBlock({ x: Math.floor(p.location.x), y: Math.floor(p.location.y), z: Math.floor(p.location.z) });
      const onFire = p.getComponent("minecraft:onfire") !== undefined;
      track.get(c.label)?.push(`+${t}:y=${rel.y.toFixed(2)},feet=${feet?.typeId.slice(10) ?? "?"},onFire=${onFire}`);
    }
  }

  const tally = (label: string): Hurt => {
    const c = cases.find((x) => x.label === label) as (typeof cases)[number];
    return hurts.get((c.player as SimulatedPlayer).id) as Hurt;
  };
  for (const c of cases) {
    const h = tally(c.label);
    log(
      `CASE ${c.label} placed=${f2(c.place)} lavaHurt=${h.lava} firstLava=${h.firstLava === undefined ? "-" : `+${h.firstLava}`} ` +
        `fireHurt=${h.fire} fireTickHurt=${h.fireTick} other=[${h.other.join(",")}] track=[${(track.get(c.label) ?? []).join(" ")}]`
    );
  }

  const stone = tally("above-stone");
  const inLava = tally("in-lava");
  const aboveLava = tally("above-lava");
  const lavaFits = fit.get("minecraft:lava")?.ray === "none";
  const stoneFits = fit.get("minecraft:stone")?.ray === "none";
  const controlsOk = stone.lava + stone.fire + stone.fireTick === 0 && inLava.lava > 0 && !stoneFits;
  const verdict = !controlsOk
    ? "instrument-broken"
    : airShortcut && !hazard && reach === "clear" && aboveLava.lava > 0
      ? "safe-cell-above-lava-ends-in-lava"
      : "safe-cell-above-lava-stays-out";
  log(
    `RESULT lavaFitsColumnRay=${lavaFits} stoneFitsColumnRay=${stoneFits} candidateSafeByAmendedRule=${airShortcut && !hazard && reach === "clear"} ` +
      `lavaHurt above-stone=${stone.lava} in-lava=${inLava.lava} above-lava=${aboveLava.lava} ` +
      `firstLava above-lava=${aboveLava.firstLava ?? "-"} in-lava=${inLava.firstLava ?? "-"} verdict=${verdict}`
  );
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");
