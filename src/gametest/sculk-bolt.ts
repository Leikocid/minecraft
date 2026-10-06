// SCLK-BOLT-01 scenarios for the Sculk Crossbow bolt (L0-sclk-p002, p003; T04 ac04, T05 ac05; R-sclk-001,
// r007; K-sclk-1). This pack arms its own copy of the production module (src/gametest/main.ts); the
// observer stream of observeBolts and the entities in the world are the witnesses. Each scenario logs one
// "[gametest] sculk-bolt <name> RESULT …" line.

import { BlockVolume, type Dimension, EnchantmentType, type Entity, GameMode, ItemStack, type Vector3, system, world } from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { SCULK_CROSSBOW } from "../legendary/registry";
import {
  BOLT_ID,
  BOLT_LIFETIME_TICKS,
  type BoltEvent,
  type BoltRecord,
  MULTISHOT_YAW_DEGREES,
  boltLoopRunning,
  boltLoopStarts,
  launchBolt,
  liveBoltCount,
  observeBolts,
} from "../sculk";
import { goTo } from "./orbital-core";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const ARROW = "minecraft:arrow";
const VANILLA_CROSSBOW = "minecraft:crossbow";
const STONE = "minecraft:stone";
const AIR = "minecraft:air";
const END_STONE = "minecraft:end_stone";
const SLOT = 0;
const AMMO_SLOT = 9;
/** A full load is 25 ticks (max_draw_duration 1.25 s); the probe loaded 27. */
const LOAD_TICKS = 27;
const SHOOTER_AT: Vector3 = { x: 3, y: 2, z: 0 };
const WALL_Z = 20;
/** Test-relative: level from the shooter's eye, at the wall (probe P1 aimed the same way). */
const AIM_WALL: Vector3 = { x: 3.5, y: 3.52, z: WALL_Z };
const FLIGHT_TICKS = 15;

const log = (msg: string): void => console.warn(`[gametest] sculk-bolt ${msg}`);
const f2 = (n: number): string => n.toFixed(2);
const fmt = (v: Vector3): string => `${f2(v.x)},${f2(v.y)},${f2(v.z)}`;
const len = (v: Vector3): number => Math.hypot(v.x, v.y, v.z);
const sub = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const yawOf = (v: Vector3): number => (Math.atan2(v.x, v.z) * 180) / Math.PI;
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

interface Stamped {
  tick: number;
  event: BoltEvent;
}

interface Watch {
  events: Stamped[];
  launches(): Array<Stamped & { event: Extract<BoltEvent, { kind: "launched" }> }>;
  /** entity / block / expired events of one record, in order. */
  endings(id: string): BoltEvent[];
  trailTicks(id: string): number[];
  trailPoints(id: string): Vector3[];
  stop(): void;
}

function watchBolts(ownerId: string): Watch {
  const events: Stamped[] = [];
  const stop = observeBolts((event) => {
    if (event.record.ownerId === ownerId) events.push({ tick: system.currentTick, event });
  });
  return {
    events,
    launches: () => events.filter((s): s is Stamped & { event: Extract<BoltEvent, { kind: "launched" }> } => s.event.kind === "launched"),
    endings: (id) => events.filter((s) => s.event.record.id === id && s.event.kind !== "launched" && s.event.kind !== "trail").map((s) => s.event),
    trailTicks: (id) => [...new Set(events.filter((s) => s.event.record.id === id && s.event.kind === "trail").map((s) => s.tick))],
    trailPoints: (id) => events.flatMap((s) => (s.event.record.id === id && s.event.kind === "trail" ? [...s.event.points] : [])),
    stop,
  };
}

function describe(e: BoltEvent): string {
  switch (e.kind) {
    case "entity":
      return `entity`;
    case "block":
      return `block ${e.block.typeId.replace("minecraft:", "")}@${fmt(e.block.location)}`;
    case "expired":
      return `expired ${e.reason}`;
    default:
      return e.kind;
  }
}

/** A bolt from an earlier scenario lives at most BOLT_LIFETIME_TICKS; this one starts with none. */
async function quiet(test: Test): Promise<void> {
  for (let t = 0; t < BOLT_LIFETIME_TICKS + 20 && liveBoltCount() > 0; t++) await test.idle(1);
  test.assert(liveBoltCount() === 0, `${liveBoltCount()} bolt(s) still alive from an earlier scenario`);
}

function inventoryOf(p: SimulatedPlayer) {
  const container = p.getComponent("minecraft:inventory")?.container;
  if (container === undefined) throw new Error(`${p.name} has no inventory`);
  return container;
}

function ammo(p: SimulatedPlayer): number {
  const c = inventoryOf(p);
  let n = 0;
  for (let i = 0; i < c.size; i++) {
    const s = c.getItem(i);
    if (s?.typeId === ARROW) n += s.amount;
  }
  return n;
}

function crossbow(id: string, multishot: boolean): ItemStack {
  const stack = new ItemStack(id, 1);
  if (!multishot) return stack;
  const ench = stack.getComponent("minecraft:enchantable");
  const e = { type: new EnchantmentType("multishot"), level: 1 };
  if (ench === undefined || !ench.canAddEnchantment(e)) throw new Error(`${id} refuses multishot`);
  ench.addEnchantment(e);
  return stack;
}

/** A use right after a one-tick use returns false and starts nothing; one tick later it starts (probe P1). */
async function startUse(test: Test, p: SimulatedPlayer): Promise<number> {
  for (let attempt = 1; attempt <= 20; attempt++) {
    const tick = system.currentTick;
    if (p.useItemInSlot(SLOT)) return tick;
    await test.idle(1);
  }
  return -1;
}

interface Shot {
  press: number;
  ammoBefore: number;
  ammoAfter: number;
  /** Arrows alive in the area at press+1 … press+FLIGHT_TICKS, one count per tick. */
  arrows: number[];
  bolts: number[];
  loopRunning: boolean[];
  /** Speed of each launched bolt one tick after its launch. */
  speed1: Map<string, number>;
}

/** Loads the held crossbow, then fires it with one press, sampling the area every tick of the flight. */
async function fire(test: Test, p: SimulatedPlayer, aim: Vector3, watch: Watch, centre: Vector3, radius: number): Promise<Shot> {
  const dim = p.dimension;
  p.lookAtLocation(aim, LookDuration.Continuous);
  await test.idle(3);
  // charge_on_draw spends the arrow when the load completes, not when the press fires it.
  const ammoBefore = ammo(p);
  test.assert((await startUse(test, p)) >= 0, "the load never started");
  await test.idle(LOAD_TICKS);
  p.stopUsingItem();
  await test.idle(3);
  const launchedBefore = watch.launches().length;
  const press = await startUse(test, p);
  test.assert(press >= 0, "the press never fired");
  const shot: Shot = { press, ammoBefore, ammoAfter: -1, arrows: [], bolts: [], loopRunning: [], speed1: new Map() };
  for (let t = 1; t <= FLIGHT_TICKS; t++) {
    await test.idle(1);
    if (t === 1) p.stopUsingItem();
    shot.arrows.push(dim.getEntities({ type: ARROW, location: centre, maxDistance: radius }).length);
    shot.bolts.push(dim.getEntities({ type: BOLT_ID, location: centre, maxDistance: radius }).length);
    shot.loopRunning.push(boltLoopRunning());
    if (t === 1) {
      for (const l of watch.launches().slice(launchedBefore)) {
        const bolt = l.event.record.bolt;
        if (bolt.isValid) shot.speed1.set(l.event.record.id, len(bolt.getVelocity()));
      }
    }
  }
  shot.ammoAfter = ammo(p);
  return shot;
}

function removeAll(dim: Dimension, type: string, centre: Vector3, radius: number): number {
  let n = 0;
  for (const e of dim.getEntities({ type, location: centre, maxDistance: radius })) {
    e.remove();
    n++;
  }
  return n;
}

function snapshot(dim: Dimension, from: Vector3, to: Vector3): Map<string, string> {
  const out = new Map<string, string>();
  for (let x = from.x; x <= to.x; x++)
    for (let y = from.y; y <= to.y; y++)
      for (let z = from.z; z <= to.z; z++) {
        const block = dim.getBlock({ x, y, z });
        out.set(`${x},${y},${z}`, block === undefined ? "unloaded" : `${block.typeId}${JSON.stringify(block.permutation.getAllStates())}`);
      }
  return out;
}

function diff(before: Map<string, string>, after: Map<string, string>): string[] {
  const out: string[] = [];
  for (const [k, v] of before) if (after.get(k) !== v) out.push(`${k}: ${v} -> ${after.get(k) ?? "missing"}`);
  return out;
}

async function waitEnded(test: Test, watch: Watch, ids: readonly string[], ticks: number): Promise<void> {
  for (let t = 0; t < ticks && ids.some((id) => watch.endings(id).length === 0); t++) await test.idle(1);
}

// ---------------------------------------------------------------- AC#1, T04: one arrow, one bolt, no arrow left

registerAsync("andrew", "sculk_bolt_one_arrow_one_bolt", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const shooter = test.spawnSimulatedPlayer(SHOOTER_AT, "sk_bolt_one", GameMode.Survival);
  const watch = watchBolts(shooter.id);
  const wallA = test.worldBlockLocation({ x: -3, y: 1, z: WALL_Z });
  const wallB = test.worldBlockLocation({ x: 9, y: 8, z: WALL_Z });
  const centre = test.worldLocation({ x: 3, y: 3, z: 10 });
  try {
    await quiet(test);
    dim.fillBlocks(new BlockVolume(wallA, wallB), STONE);
    inventoryOf(shooter).setItem(AMMO_SLOT, new ItemStack(ARROW, 64));
    await test.idle(5);

    // Control: the same shot from a vanilla crossbow keeps its arrow, so the arrow count below can see one.
    shooter.setItem(crossbow(VANILLA_CROSSBOW, false), SLOT, true);
    const control = await fire(test, shooter, AIM_WALL, watch, centre, 30);
    const controlLaunches = watch.launches().length;
    removeAll(dim, ARROW, centre, 30);

    const startsBefore = boltLoopStarts();
    const runningBefore = boltLoopRunning();
    shooter.setItem(crossbow(SCULK_CROSSBOW.itemId, false), SLOT, true);
    const shot = await fire(test, shooter, AIM_WALL, watch, centre, 30);
    const launches = watch.launches();
    const l = launches[0];
    const record = l?.event.record;
    await waitEnded(test, watch, record === undefined ? [] : [record.id], 30);
    const endings = record === undefined ? [] : watch.endings(record.id);
    const trailTicks = record === undefined ? [] : watch.trailTicks(record.id);
    const trail = record === undefined ? [] : watch.trailPoints(record.id);
    const arrowSpeed = l?.event.arrowVelocity === undefined ? NaN : len(l.event.arrowVelocity);
    const boltSpeed = record === undefined ? NaN : (shot.speed1.get(record.id) ?? NaN);
    const startsDelta = boltLoopStarts() - startsBefore;
    const runningAfter = boltLoopRunning();

    log(
      `one_arrow_one_bolt RESULT control (vanilla crossbow): arrows alive per tick [${control.arrows.join(",")}], launches ${controlLaunches}, ammo ${control.ammoBefore}->${control.ammoAfter}; ` +
        `sculk crossbow: launches ${launches.length} at press+${l === undefined ? "-" : l.tick - shot.press}, owner ${record?.ownerId === shooter.id ? "shooter" : record?.ownerId}, ` +
        `arrow |v| ${f2(arrowSpeed)} bolt |v|@+1 ${f2(boltSpeed)}; arrows alive per tick [${shot.arrows.join(",")}], bolts [${shot.bolts.join(",")}]; ` +
        `ending [${endings.map(describe).join("; ")}]; trail on ${trailTicks.length} ticks, y ${trail.length > 0 ? `${f2(trail[0].y)}->${f2(trail[trail.length - 1].y)}` : "-"}; ` +
        `ammo ${shot.ammoBefore}->${shot.ammoAfter}; loop running before ${runningBefore}, in flight [${shot.loopRunning.map((b) => (b ? 1 : 0)).join("")}], after ${runningAfter}, starts +${startsDelta}`
    );

    test.assert(Math.max(...control.arrows) >= 1, `control: the vanilla crossbow's arrow was never seen alive [${control.arrows.join(",")}]`);
    test.assert(controlLaunches === 0, `control: a vanilla crossbow's arrow became ${controlLaunches} bolt(s)`);
    test.assert(launches.length === 1 && record !== undefined, `one press gave ${launches.length} bolts, not 1`);
    test.assert(l.tick === shot.press, `the bolt was launched at press+${l.tick - shot.press}, not in the arrow's spawn tick`);
    test.assert(record.ownerId === shooter.id, `the bolt's owner is ${record.ownerId}, not the shooter`);
    test.assert(Math.abs(boltSpeed / arrowSpeed - 1) <= 0.05, `the bolt's speed ${f2(boltSpeed)} is not within 5 % of the arrow's ${f2(arrowSpeed)}`);
    test.assert(shot.arrows.every((n) => n === 0), `a vanilla arrow survived its spawn tick: [${shot.arrows.join(",")}]`);
    test.assert(shot.bolts[0] === 1, `${shot.bolts[0]} bolts in the air one tick after the press`);
    test.assert(endings.length === 1 && endings[0].kind === "block", `the bolt ended [${endings.map(describe).join("; ")}], not once on the wall`);
    const hit = endings[0] as Extract<BoltEvent, { kind: "block" }>;
    test.assert(hit.block.typeId === STONE && hit.block.location.z === wallA.z, `the bolt hit ${hit.block.typeId} at ${fmt(hit.block.location)}, not the wall`);
    test.assert(trailTicks.length >= 5, `the trail was drawn on ${trailTicks.length} ticks, not ≥ 5`);
    test.assert(trail[trail.length - 1].y < trail[0].y - 0.2, `the trail did not fall with the bolt: y ${f2(trail[0].y)} -> ${f2(trail[trail.length - 1].y)}`);
    test.assert(shot.ammoBefore - shot.ammoAfter === 1, `the shot spent ${shot.ammoBefore - shot.ammoAfter} arrows, not 1`);
    test.assert(!runningBefore && shot.loopRunning[0] && !runningAfter && startsDelta === 1, "the interval did not live exactly for the bolt's flight");
  } finally {
    watch.stop();
    dim.fillBlocks(new BlockVolume(wallA, wallB), AIR);
    removeAll(dim, ARROW, centre, 30);
    test.removeSimulatedPlayer(shooter);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ---------------------------------------------------------------- AC#2: Multishot, three bolts of their own

registerAsync("andrew", "sculk_bolt_multishot_three_bolts", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const shooter = test.spawnSimulatedPlayer(SHOOTER_AT, "sk_bolt_ms", GameMode.Survival);
  const watch = watchBolts(shooter.id);
  const wallA = test.worldBlockLocation({ x: -6, y: 1, z: WALL_Z });
  const wallB = test.worldBlockLocation({ x: 12, y: 8, z: WALL_Z });
  const centre = test.worldLocation({ x: 3, y: 3, z: 10 });
  try {
    await quiet(test);
    dim.fillBlocks(new BlockVolume(wallA, wallB), STONE);
    inventoryOf(shooter).setItem(AMMO_SLOT, new ItemStack(ARROW, 64));
    shooter.setItem(crossbow(SCULK_CROSSBOW.itemId, true), SLOT, true);
    await test.idle(5);
    const startsBefore = boltLoopStarts();
    const shot = await fire(test, shooter, AIM_WALL, watch, centre, 30);
    const launches = watch.launches();
    const records = launches.map((s) => s.event.record);
    const ids = records.map((r) => r.id);
    await waitEnded(test, watch, ids, 30);
    const startsDelta = boltLoopStarts() - startsBefore;
    const turns = launches.map((s) => {
      const a = s.event.arrowVelocity;
      return a === undefined ? NaN : yawOf(s.event.record.velocity) - yawOf(a);
    });
    const yaws = records.map((r) => yawOf(r.velocity));
    const endings = ids.map((id) => watch.endings(id));
    const hits = endings.map((e) => (e.length === 1 && e[0].kind === "block" ? e[0] : undefined));
    const cells = new Set(hits.map((h) => (h === undefined ? "none" : fmt(h.block.location))));
    const trailOwners = new Set(watch.events.filter((s) => s.event.kind === "trail").map((s) => s.event.record.id));

    log(
      `multishot RESULT launches ${launches.length} at press+[${launches.map((s) => s.tick - shot.press).join(",")}], ids ${new Set(ids).size}, seeds ${new Set(records.map((r) => r.seed)).size}, ` +
        `volleys ${new Set(records.map((r) => r.volleyId)).size} indexes [${records.map((r) => r.volleyIndex).join(",")}]; ` +
        `yaw [${yaws.map(f2).join(",")}]° turned by [${turns.map(f2).join(",")}]°; arrows alive per tick [${shot.arrows.join(",")}], bolts [${shot.bolts.join(",")}]; ` +
        `endings [${endings.map((e) => e.map(describe).join("+") || "none").join(" | ")}]; trails of ${trailOwners.size} records; ` +
        `ammo ${shot.ammoBefore}->${shot.ammoAfter}; interval starts +${startsDelta}, running in flight [${shot.loopRunning.map((b) => (b ? 1 : 0)).join("")}], after ${boltLoopRunning()}`
    );

    test.assert(launches.length === 3, `a Multishot press gave ${launches.length} bolts, not 3`);
    test.assert(launches.every((s) => s.tick === shot.press), `the bolts were launched at press+[${launches.map((s) => s.tick - shot.press).join(",")}], not in one tick`);
    test.assert(new Set(ids).size === 3 && new Set(records).size === 3, "the three bolts do not have three records");
    test.assert(new Set(records.map((r) => r.volleyId)).size === 1, "the three bolts are not one volley");
    test.assert([...records.map((r) => r.volleyIndex)].sort().join() === "0,1,2", `volley indexes ${records.map((r) => r.volleyIndex).join()}`);
    for (const [i, s] of launches.entries()) {
      const want = MULTISHOT_YAW_DEGREES[s.event.record.volleyIndex];
      test.assert(Math.abs(turns[i] - want) < 0.01, `bolt ${s.event.record.volleyIndex} was turned ${f2(turns[i])}°, not ${want}°`);
    }
    test.assert(Math.max(...yaws) - Math.min(...yaws) >= 18, `the volley spreads ${f2(Math.max(...yaws) - Math.min(...yaws))}°, not about 20°`);
    test.assert(shot.arrows.every((n) => n === 0), `a vanilla arrow survived: [${shot.arrows.join(",")}]`);
    test.assert(shot.bolts[0] === 3, `${shot.bolts[0]} bolts in the air one tick after the press`);
    test.assert(hits.every((h) => h !== undefined), `not every bolt ended once on the wall: [${endings.map((e) => e.map(describe).join("+")).join(" | ")}]`);
    test.assert(cells.size === 3, `three bolts hit ${cells.size} distinct cells: one hit was merged or shared`);
    test.assert(trailOwners.size === 3, `trails were drawn for ${trailOwners.size} records, not 3`);
    test.assert(shot.ammoBefore - shot.ammoAfter === 1, `a Multishot shot spent ${shot.ammoBefore - shot.ammoAfter} arrows, not 1`);
    test.assert(startsDelta === 1 && shot.loopRunning[0] && !boltLoopRunning(), `three bolts made ${startsDelta} intervals, not one`);
  } finally {
    watch.stop();
    dim.fillBlocks(new BlockVolume(wallA, wallB), AIR);
    removeAll(dim, ARROW, centre, 30);
    test.removeSimulatedPlayer(shooter);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ---------------------------------------------------------------- AC#3, T05: the trail harms nothing beside it

registerAsync("andrew", "sculk_bolt_trail_harmless", async (test: Test): Promise<void> => {
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const overworld = test.getDimension();
  const end = world.getDimension("the_end");
  // The End's void, clear of orbital-core (+400) and orbital-flight (+460): the bolt ends with no outcome.
  const x0 = origin.x + 560;
  const z0 = origin.z;
  const Y = 60;
  const shooter = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 1 }, "sk_bolt_hl_s", GameMode.Survival);
  const bystander = test.spawnSimulatedPlayer({ x: 5, y: 2, z: 1 }, "sk_bolt_hl_b", GameMode.Survival);
  const watch = watchBolts(shooter.id);
  const placed: Vector3[] = [];
  const hurts: string[] = [];
  const hurtSub = world.afterEvents.entityHurt.subscribe((e) => {
    if (e.hurtEntity.id === bystander.id) hurts.push(`${e.damageSource.cause}:${f2(e.damage)}@${system.currentTick}`);
  });
  let unload: (() => void) | undefined;
  const put = (at: Vector3, type: string): void => {
    end.setBlockType(at, type);
    placed.push(at);
  };
  try {
    await quiet(test);
    unload = await loadBox(test, end, "andrew_gt_skb_hl", { min: [x0 - 8, 0, z0 - 8], max: [x0 + 8, 96, z0 + 40] });
    put({ x: x0, y: Y - 1, z: z0 - 3 }, END_STONE);
    put({ x: x0 + 1, y: Y - 1, z: z0 + 8 }, END_STONE);
    // The column beside the line: grass under glass, its face 0.5 from the line's centre.
    put({ x: x0 - 1, y: Y, z: z0 + 12 }, "minecraft:grass_block");
    put({ x: x0 - 1, y: Y + 1, z: z0 + 12 }, "minecraft:glass");
    put({ x: x0 - 1, y: Y + 2, z: z0 + 12 }, "minecraft:glass");
    await goTo(test, shooter, end, { x: x0, y: Y, z: z0 - 3 });
    await goTo(test, bystander, end, { x: x0 + 1, y: Y, z: z0 + 8 });
    // 0.6 beside the line: its box starts 0.3 from the line's centre, the bolt's ends 0.125 from it.
    bystander.teleport({ x: x0 + 1.1, y: Y, z: z0 + 8.5 }, { dimension: end });
    await test.idle(10);

    const from: Vector3 = { x: x0 - 2, y: Y - 2, z: z0 - 1 };
    const to: Vector3 = { x: x0 + 3, y: Y + 3, z: z0 + 16 };
    const blocksBefore = snapshot(end, from, to);
    const pos0 = { ...bystander.location };
    const v0 = bystander.getVelocity();
    let maxDv = 0;
    let maxDp = 0;
    const record = launchBolt(shooter, end, { x: x0 + 0.5, y: Y + 1, z: z0 + 0.5 }, { x: 0, y: 0, z: 3 });
    test.assert(record !== undefined, "launchBolt refused the bolt");
    const r = record as BoltRecord;
    for (let t = 0; t < BOLT_LIFETIME_TICKS + 10 && watch.endings(r.id).length === 0; t++) {
      await test.idle(1);
      maxDv = Math.max(maxDv, len(sub(bystander.getVelocity(), v0)));
      maxDp = Math.max(maxDp, len(sub(bystander.location, pos0)));
    }
    await test.idle(5);
    const endings = watch.endings(r.id);
    const trail = watch.trailPoints(r.id);
    const near = (p: Vector3, x: number, z: number): number => Math.hypot(p.x - x, p.z - z);
    const toBystander = Math.min(...trail.filter((p) => Math.abs(p.z - pos0.z) < 1.5).map((p) => near(p, pos0.x, pos0.z)));
    const toColumn = Math.min(...trail.filter((p) => Math.abs(p.z - (z0 + 12.5)) < 1.5).map((p) => near(p, x0 - 0.5, z0 + 12.5)));
    const changed = diff(blocksBefore, snapshot(end, from, to));

    // Controls: the hurt witness and the block diff both see a change when there is one.
    const hurtsBefore = hurts.length;
    bystander.applyDamage(1);
    await test.idle(1);
    const witnessLive = hurts.length - hurtsBefore;
    const probeCell: Vector3 = { x: x0 + 3, y: Y + 3, z: z0 + 16 };
    end.setBlockType(probeCell, STONE);
    const diffLive = diff(blocksBefore, snapshot(end, from, to)).length;
    end.setBlockType(probeCell, AIR);

    log(
      `trail_harmless RESULT ending [${endings.map(describe).join("; ")}] at age ${endings.length > 0 ? watch.events.find((s) => s.event === endings[0])!.tick - r.bornTick : "-"}; ` +
        `trail ${trail.length} points, nearest ${f2(toBystander)} to the bystander's axis, ${f2(toColumn)} to the column's; ` +
        `bystander hurt [${hurts.slice(0, hurtsBefore).join(" ")}], max |dv| ${maxDv.toFixed(4)}, max |dp| ${maxDp.toFixed(4)}; blocks changed ${changed.length} [${changed.slice(0, 3).join("; ")}]; ` +
        `controls: applyDamage(1) seen ${witnessLive}, one set block seen ${diffLive}`
    );

    test.assert(endings.length === 1 && endings[0].kind === "expired", `the bolt ended [${endings.map(describe).join("; ")}], not expired`);
    test.assert(toBystander <= 1.0, `the trail passed ${f2(toBystander)} from the bystander: it was not beside the line`);
    test.assert(toColumn <= 1.2, `the trail passed ${f2(toColumn)} from the column: it was not beside the line`);
    test.assert(hurtsBefore === 0, `the bystander took entityHurt: ${hurts.slice(0, hurtsBefore).join(" ")}`);
    test.assert(maxDv <= 0.01, `the bystander's velocity changed by ${maxDv.toFixed(4)}`);
    test.assert(maxDp <= 0.01, `the bystander moved by ${maxDp.toFixed(4)}`);
    test.assert(changed.length === 0, `blocks along the line changed: ${changed.slice(0, 4).join("; ")}`);
    test.assert(witnessLive === 1 && diffLive === 1, `a control saw nothing: hurt ${witnessLive}, diff ${diffLive}`);
  } finally {
    world.afterEvents.entityHurt.unsubscribe(hurtSub);
    watch.stop();
    for (const at of placed) end.setBlockType(at, AIR);
    for (const p of [shooter, bystander]) {
      try {
        if (p.dimension.id !== overworld.id) await goTo(test, p, overworld, test.worldBlockLocation({ x: 1, y: 2, z: 1 }));
      } catch (err) {
        log(`trail_harmless: ${p.name} did not come back: ${errText(err)}`);
      }
      test.removeSimulatedPlayer(p);
    }
    unload?.();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ---------------------------------------------------------------- AC#4: 100 ticks with nothing hit

registerAsync("andrew", "sculk_bolt_expires_after_lifetime", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const shooter = test.spawnSimulatedPlayer(SHOOTER_AT, "sk_bolt_life", GameMode.Survival);
  const watch = watchBolts(shooter.id);
  try {
    await quiet(test);
    const at = test.worldLocation({ x: 3.5, y: 2, z: 3.5 });
    // Straight up from high over the test: it never leaves the test's chunk column and never comes down to it.
    const start: Vector3 = { x: at.x, y: Math.min(at.y + 100, dim.heightRange.max - 90), z: at.z };
    const record = launchBolt(shooter, dim, start, { x: 0, y: 3, z: 0 });
    test.assert(record !== undefined, "launchBolt refused the bolt");
    const r = record as BoltRecord;
    let lastValidAge = -1;
    let topY = start.y;
    for (let t = 0; t < BOLT_LIFETIME_TICKS + 20 && watch.endings(r.id).length === 0; t++) {
      await test.idle(1);
      if (r.bolt.isValid) {
        lastValidAge = system.currentTick - r.bornTick;
        topY = Math.max(topY, r.bolt.location.y);
      }
    }
    await test.idle(2);
    const endings = watch.endings(r.id);
    const endTick = watch.events.find((s) => s.event === endings[0])?.tick ?? -1;
    const left = dim.getEntities({ type: BOLT_ID, location: start, maxDistance: 200 }).length;
    log(
      `expires_after_lifetime RESULT start y ${f2(start.y)}, top y ${f2(topY)}; ending [${endings.map(describe).join("; ")}] at age ${endTick - r.bornTick}; ` +
        `last seen alive at age ${lastValidAge}; trail on ${watch.trailTicks(r.id).length} ticks; bolts left ${left}; interval running after ${boltLoopRunning()}`
    );
    test.assert(endings.length === 1 && endings[0].kind === "expired" && endings[0].reason === "lifetime", `the bolt ended [${endings.map(describe).join("; ")}], not by lifetime`);
    test.assert(endTick - r.bornTick === BOLT_LIFETIME_TICKS, `the bolt expired at age ${endTick - r.bornTick}, not ${BOLT_LIFETIME_TICKS}`);
    test.assert(lastValidAge >= BOLT_LIFETIME_TICKS - 2, `the bolt was gone by age ${lastValidAge + 1}: something else removed it`);
    test.assert(topY > start.y + 30, `the bolt rose only to ${f2(topY)}: it never flew`);
    test.assert(!r.bolt.isValid && left === 0, `the bolt is still in the world (valid ${r.bolt.isValid}, ${left} nearby)`);
    test.assert(!boltLoopRunning(), "the interval outlived the last bolt");
  } finally {
    watch.stop();
    test.removeSimulatedPlayer(shooter);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ---------------------------------------------------------------- AC#4: the Void, from a real shot

registerAsync("andrew", "sculk_bolt_expires_in_void", async (test: Test): Promise<void> => {
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const overworld = test.getDimension();
  const end = world.getDimension("the_end");
  const x0 = origin.x + 620;
  const z0 = origin.z;
  const Y = 60;
  const shooter = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 1 }, "sk_bolt_void", GameMode.Survival);
  const watch = watchBolts(shooter.id);
  const pad: Vector3 = { x: x0, y: Y - 1, z: z0 };
  let unload: (() => void) | undefined;
  try {
    await quiet(test);
    unload = await loadBox(test, end, "andrew_gt_skb_v", { min: [x0 - 8, 0, z0 - 8], max: [x0 + 8, 96, z0 + 40] });
    end.setBlockType(pad, END_STONE);
    await goTo(test, shooter, end, { x: x0, y: Y, z: z0 });
    inventoryOf(shooter).setItem(AMMO_SLOT, new ItemStack(ARROW, 64));
    shooter.setItem(crossbow(SCULK_CROSSBOW.itemId, false), SLOT, true);
    await test.idle(5);
    const centre: Vector3 = { x: x0 + 0.5, y: Y / 2, z: z0 + 8 };
    // About 45° down: the line crosses the pad's top 1.6 blocks out, past its edge. Steeper, it hits the pad.
    const shot = await fire(test, shooter, test.relativeLocation({ x: x0 + 0.5, y: Y - 20, z: z0 + 20.5 }), watch, centre, 64);
    const launches = watch.launches();
    const r = launches[0]?.event.record;
    await waitEnded(test, watch, r === undefined ? [] : [r.id], 60);
    const endings = r === undefined ? [] : watch.endings(r.id);
    const endTick = watch.events.find((s) => s.event === endings[0])?.tick ?? -1;
    const trail = r === undefined ? [] : watch.trailPoints(r.id);
    log(
      `expires_in_void RESULT launches ${launches.length}; ending [${endings.map(describe).join("; ")}] at age ${r === undefined ? "-" : endTick - r.bornTick}; ` +
        `trail lowest y ${trail.length > 0 ? f2(Math.min(...trail.map((p) => p.y))) : "-"} (floor ${end.heightRange.min}); arrows alive per tick [${shot.arrows.join(",")}]; bolt valid after ${r?.bolt.isValid}`
    );
    test.assert(launches.length === 1 && r !== undefined, `the shot gave ${launches.length} bolts, not 1`);
    test.assert(endings.length === 1 && endings[0].kind === "expired" && endings[0].reason === "void", `the bolt ended [${endings.map(describe).join("; ")}], not in the Void`);
    test.assert(shot.arrows.every((n) => n === 0), `a vanilla arrow survived: [${shot.arrows.join(",")}]`);
    test.assert(!(r as BoltRecord).bolt.isValid, "the bolt is still in the world");
  } finally {
    watch.stop();
    end.setBlockType(pad, AIR);
    try {
      if (shooter.dimension.id !== overworld.id) await goTo(test, shooter, overworld, test.worldBlockLocation({ x: 1, y: 2, z: 1 }));
    } catch (err) {
      log(`expires_in_void: the shooter did not come back: ${errText(err)}`);
    }
    test.removeSimulatedPlayer(shooter);
    unload?.();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

// ---------------------------------------------------------------- AC#4: past the simulation distance

registerAsync("andrew", "sculk_bolt_expires_past_simulation_distance", async (test: Test): Promise<void> => {
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const overworld = test.getDimension();
  const end = world.getDimension("the_end");
  // The setting in which a bolt was measured hanging at 65 blocks, still in a loaded chunk, until its lifetime ran out.
  const x0 = origin.x + 680;
  const z0 = origin.z;
  const Y = 60;
  const shooter = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 1 }, "sk_bolt_sim", GameMode.Survival);
  const watch = watchBolts(shooter.id);
  const pad: Vector3 = { x: x0, y: Y - 1, z: z0 - 3 };
  let unload: (() => void) | undefined;
  try {
    await quiet(test);
    unload = await loadBox(test, end, "andrew_gt_skb_s", { min: [x0 - 8, 0, z0 - 8], max: [x0 + 8, 96, z0 + 40] });
    end.setBlockType(pad, END_STONE);
    await goTo(test, shooter, end, { x: x0, y: Y, z: z0 - 3 });
    await test.idle(10);
    const record = launchBolt(shooter, end, { x: x0 + 0.5, y: Y + 1, z: z0 + 0.5 }, { x: 0, y: 0, z: 3 });
    test.assert(record !== undefined, "launchBolt refused the bolt");
    const r = record as BoltRecord;
    const zs: string[] = [];
    let lastAt: Vector3 | undefined;
    for (let t = 0; t < BOLT_LIFETIME_TICKS + 10 && watch.endings(r.id).length === 0; t++) {
      await test.idle(1);
      if (r.bolt.isValid) {
        lastAt = { ...r.bolt.location };
        zs.push(f2(lastAt.z - z0));
      }
    }
    const endings = watch.endings(r.id);
    const endTick = watch.events.find((s) => s.event === endings[0])?.tick ?? -1;
    const loadedThere = lastAt === undefined ? "-" : String(end.isChunkLoaded(lastAt));
    log(
      `expires_past_simulation_distance RESULT ending [${endings.map(describe).join("; ")}] at age ${endTick - r.bornTick}; last seen at ${lastAt === undefined ? "-" : fmt(lastAt)}, ` +
        `isChunkLoaded there ${loadedThere}; bolt z per tick [${zs.join(" ")}]; valid after ${r.bolt.isValid}`
    );
    const ending = endings[0];
    test.assert(
      endings.length === 1 && ending.kind === "expired" && (ending.reason === "stalled" || ending.reason === "unloaded"),
      `the bolt ended [${endings.map(describe).join("; ")}], not on leaving the simulated chunks`
    );
    test.assert(endTick - r.bornTick < BOLT_LIFETIME_TICKS - 20, `the bolt ended at age ${endTick - r.bornTick}: only the lifetime cap caught it`);
    test.assert(!r.bolt.isValid, "the bolt is still in the world");
  } finally {
    watch.stop();
    end.setBlockType(pad, AIR);
    try {
      if (shooter.dimension.id !== overworld.id) await goTo(test, shooter, overworld, test.worldBlockLocation({ x: 1, y: 2, z: 1 }));
    } catch (err) {
      log(`expires_past_simulation_distance: the shooter did not come back: ${errText(err)}`);
    }
    test.removeSimulatedPlayer(shooter);
    unload?.();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

// ---------------------------------------------------------------- AC#4: out of the loaded chunks

registerAsync("andrew", "sculk_bolt_expires_leaving_loaded_chunks", async (test: Test): Promise<void> => {
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const dim = test.getDimension();
  const shooter = test.spawnSimulatedPlayer(SHOOTER_AT, "sk_bolt_edge", GameMode.Survival);
  const watch = watchBolts(shooter.id);
  // A far site only its own ticking area loads; high in the air, so nothing is in the way.
  const x0 = Math.floor((origin.x + 704) / 16) * 16;
  const z0 = Math.floor(origin.z / 16) * 16;
  const y = origin.y + 60;
  let unload: (() => void) | undefined;
  try {
    await quiet(test);
    unload = await loadBox(test, dim, "andrew_gt_skb_e", { min: [x0, 0, z0], max: [x0 + 47, 96, z0 + 15] });
    await test.idle(5);
    let edge: number | undefined;
    for (let x = x0; x < x0 + 400 && edge === undefined; x++) if (!dim.isChunkLoaded({ x, y, z: z0 + 8 })) edge = x;
    test.assert(edge !== undefined, "no unloaded chunk within 400 blocks east of the site");
    const record = launchBolt(shooter, dim, { x: x0 + 8, y, z: z0 + 8.5 }, { x: 3, y: 0, z: 0 });
    test.assert(record !== undefined, "launchBolt refused the bolt");
    const r = record as BoltRecord;
    const xs: string[] = [];
    for (let t = 0; t < BOLT_LIFETIME_TICKS + 20 && watch.endings(r.id).length === 0; t++) {
      await test.idle(1);
      if (r.bolt.isValid) xs.push(f2(r.bolt.location.x - x0));
    }
    const endings = watch.endings(r.id);
    const endTick = watch.events.find((s) => s.event === endings[0])?.tick ?? -1;
    const trail = watch.trailPoints(r.id);
    const lastX = trail.length > 0 ? trail[trail.length - 1].x : NaN;
    log(
      `expires_leaving_loaded_chunks RESULT first unloaded x = site+${(edge as number) - x0}; ending [${endings.map(describe).join("; ")}] at age ${endTick - r.bornTick}, ` +
        `last trail x = site+${f2(lastX - x0)}; bolt x per tick [${xs.join(" ")}]`
    );
    unload();
    unload = undefined;
    await test.idle(2);
    // Load the chunks across the edge: a bolt saved past it would come back now.
    const e = Math.floor((edge as number) / 16) * 16;
    unload = await loadBox(test, dim, "andrew_gt_skb_e2", { min: [e - 16, 0, z0], max: [e + 31, 96, z0 + 15] });
    await test.idle(20);
    const left = dim.getEntities({ type: BOLT_ID, location: { x: e + 8, y, z: z0 + 8 }, maxDistance: 40 }).length;
    log(`expires_leaving_loaded_chunks RESULT bolts across the edge after loading it: ${left}`);
    test.assert(endings.length === 1 && endings[0].kind === "expired" && endings[0].reason === "unloaded", `the bolt ended [${endings.map(describe).join("; ")}], not on leaving the loaded chunks`);
    test.assert(lastX < (edge as number) && lastX > (edge as number) - 7, `the bolt's last trail point x = site+${f2(lastX - x0)} is not just before the edge`);
    test.assert(left === 0, `${left} bolt(s) were found past the edge after loading it`);
  } finally {
    watch.stop();
    unload?.();
    test.removeSimulatedPlayer(shooter);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ---------------------------------------------------------------- AC#4, C-23: a chunk unloads under a bolt

registerAsync("andrew", "sculk_bolt_unloaded_under_it_and_reloaded", async (test: Test): Promise<void> => {
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const dim = test.getDimension();
  const shooter = test.spawnSimulatedPlayer(SHOOTER_AT, "sk_bolt_unl", GameMode.Survival);
  const watch = watchBolts(shooter.id);
  const x0 = Math.floor((origin.x + 832) / 16) * 16;
  const z0 = Math.floor(origin.z / 16) * 16;
  const y = origin.y + 60;
  const box = { min: [x0, 0, z0] as [number, number, number], max: [x0 + 15, 96, z0 + 15] as [number, number, number] };
  const removed: string[] = [];
  const loaded: string[] = [];
  const removeSub = world.afterEvents.entityRemove.subscribe((e) => removed.push(e.removedEntityId));
  // The module's own handler runs first and removes a bolt it loads: read the id only, which still reads.
  const loadSub = world.afterEvents.entityLoad.subscribe((e) => {
    try {
      loaded.push(e.entity.id);
    } catch {
      loaded.push("unreadable");
    }
  });
  let unload: (() => void) | undefined;
  let stray: Entity | undefined;
  try {
    await quiet(test);
    unload = await loadBox(test, dim, "andrew_gt_skb_u", box);
    await test.idle(5);
    // A bolt with no record, as after a restart (C-23), and a live one; both slow, both in this chunk.
    stray = dim.spawnEntity(BOLT_ID, { x: x0 + 4.5, y, z: z0 + 4.5 });
    const strayId = stray.id;
    const record = launchBolt(shooter, dim, { x: x0 + 8.5, y, z: z0 + 8.5 }, { x: 0, y: 0.5, z: 0 });
    test.assert(record !== undefined, "launchBolt refused the bolt");
    const r = record as BoltRecord;
    await test.idle(2);
    unload();
    unload = undefined;
    for (let t = 0; t < 40 && watch.endings(r.id).length === 0; t++) await test.idle(1);
    const endings = watch.endings(r.id);
    const unloadedNow = !dim.isChunkLoaded({ x: x0 + 8, y, z: z0 + 8 });
    const removedBeforeReload = removed.filter((id) => id === strayId).length;
    loaded.length = 0;
    unload = await loadBox(test, dim, "andrew_gt_skb_u2", box);
    await test.idle(20);
    const left = dim.getEntities({ type: BOLT_ID, location: { x: x0 + 8, y, z: z0 + 8 }, maxDistance: 48 }).map((e) => e.id);
    log(
      `unloaded_under_it_and_reloaded RESULT live bolt ending [${endings.map(describe).join("; ")}], chunk unloaded after ${unloadedNow}; ` +
        `after reload: came back via entityLoad [${loaded.map((id) => (id === r.id ? "live" : id === strayId ? "stray" : id)).join(",")}], ` +
        `removed [${removed.filter((id) => id === r.id || id === strayId).map((id) => (id === r.id ? "live" : "stray")).join(",")}], bolts left ${left.length}`
    );
    test.assert(unloadedNow, "the chunk never unloaded: the scenario measured nothing");
    test.assert(endings.length === 1 && endings[0].kind === "expired", `the live bolt ended [${endings.map(describe).join("; ")}], not with no outcome`);
    test.assert(left.length === 0, `${left.length} bolt(s) are in the reloaded chunk`);
    test.assert(loaded.includes(strayId), "the record-less bolt never came back with its chunk: the reload path was not exercised");
    test.assert(removed.filter((id) => id === strayId).length > removedBeforeReload, "the record-less bolt came back and was not removed");
  } finally {
    world.afterEvents.entityRemove.unsubscribe(removeSub);
    world.afterEvents.entityLoad.unsubscribe(loadSub);
    watch.stop();
    if (stray?.isValid === true) stray.remove();
    unload?.();
    test.removeSimulatedPlayer(shooter);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");
