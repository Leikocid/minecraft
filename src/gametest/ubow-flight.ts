// Underwater Bow flight on a real engine (spec §1; L0-uwbw-a003, C-42): a SimulatedPlayer fires the
// bow along a glass channel of air, water or lava, and each flight is judged by src/ubow/flight-rules.ts
// against the bow's air shot and against its own air flight. The controls must go red: a vanilla bow in
// the same water, and the bow with its liquid handling switched off. The damage scenario holds the hit
// to the vanilla bow's; the last one closes probe §3's Infinity pickup dupe.

import { BlockVolume, type Dimension, EnchantmentType, type Entity, EntityDamageCause, GameMode, ItemStack, type Vector3, system, world } from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { UNDERWATER_BOW } from "../legendary/registry";
import { registerUbowFlight, setLiquidNeutral } from "../ubow/flight";
import {
  AIR_INERTIA,
  ARROW_ID,
  FLIGHT_TAG,
  FULL_DRAW_DAMAGE,
  type Flight,
  INFINITY_TAG,
  PARTIAL_DRAW_DAMAGE,
  PARTIAL_DRAW_TICKS,
  type PathPoint,
  SLOWED_CEILING,
  SPAWN_OFFSET_Y,
  VANILLA_LIQUID_INERTIA,
  type Comparison,
  airFlight,
  airLikeFailures,
  airPath,
  compare,
  horizontal,
  isSlowed,
  isVanillaFullDraw,
  speed,
} from "../ubow/flight-rules";

// The release pack's handlers receive no SimulatedPlayer (src/gametest/main.ts, "binding problem"),
// so the scenarios below drive this pack's copy of the module.
registerUbowFlight();

const STRUCTURE = "andrew:platform";
const BOW = "minecraft:bow";
const UBOW = UNDERWATER_BOW.itemId;
const AIR = "minecraft:air";
const GLASS = "minecraft:glass";
const WATER = "minecraft:water";
const LAVA = "minecraft:lava";
const SLOT = 0;
const AMMO_SLOT = 9;
const FULL = 25;
/** Ticks compared between a flight and its air reference; the air shot lands at about +8. */
const TICKS = [1, 2, 3, 4, 5, 6];
/** Sim players aim from about this far above their feet. */
const EYE = 1.62;

/** The channel: glass shell x 0..2, y 2..12, z -1..40; the lane x 1, medium y 3..6, air y 7..11 above. */
const SHELL_LO: Vector3 = { x: 0, y: 2, z: -1 };
const SHELL_HI: Vector3 = { x: 2, y: 12, z: 40 };
const LANE_LO: Vector3 = { x: 1, y: 3, z: 0 };
const MEDIUM_HI: Vector3 = { x: 1, y: 6, z: 39 };
const LANE_HI: Vector3 = { x: 1, y: 11, z: 39 };
/** The entry shooter's pedestal, above the medium. */
const PEDESTAL: Vector3 = { x: 1, y: 7, z: 0 };

interface Stance {
  readonly name: string;
  readonly feet: Vector3;
  /** Test-relative: lookAtLocation takes a relative point. */
  readonly aim: Vector3;
}

/** Shooter inside the medium, shooting level along the lane. */
const UNDER: Stance = { name: "under", feet: { x: 1.5, y: 3, z: 0.5 }, aim: { x: 1.5, y: 3 + EYE, z: 80.5 } };
/** Shooter on the pedestal, shooting down into the medium at about 12°. */
const ENTRY: Stance = { name: "entry", feet: { x: 1.5, y: 8, z: 0.5 }, aim: { x: 1.5, y: 3, z: 30.5 } };

const log = (msg: string): void => console.warn(`[gametest] ubow-flight ${msg}`);
const f2 = (n: number | undefined): string => (n === undefined || Number.isNaN(n) ? "-" : n.toFixed(2));
const f3 = (n: number | undefined): string => (n === undefined || Number.isNaN(n) ? "-" : n.toFixed(3));
const sub = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const short = (id: string): string => id.replace("minecraft:", "").replace("andrew:", "");
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const range = (xs: readonly number[]): string => (xs.length === 0 ? "-" : `${f2(Math.min(...xs))}–${f2(Math.max(...xs))}`);

function fill(dim: Dimension, a: Vector3, b: Vector3, block: string): void {
  dim.fillBlocks(new BlockVolume(a, b), block);
}

/** A Survival SimulatedPlayer that neither drowns nor burns; `boost` gives 40 HP. */
async function survivor(test: Test, rel: Vector3, name: string, boost = false): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(rel, name, GameMode.Survival);
  await test.idle(2);
  p.addEffect("water_breathing", 20000, { amplifier: 0, showParticles: false });
  p.addEffect("fire_resistance", 20000, { amplifier: 0, showParticles: false });
  if (boost) p.addEffect("health_boost", 20000, { amplifier: 4, showParticles: false });
  await test.idle(1);
  p.getComponent("minecraft:health")?.resetToMaxValue();
  return p;
}

/** A use right after another use can be refused for one tick; retry a few. */
async function startUse(test: Test, p: SimulatedPlayer): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (p.useItemInSlot(SLOT)) return true;
    await test.idle(1);
  }
  return false;
}

/** One arrow from spawn to its first block hit. */
interface Tracked {
  readonly e: Entity;
  readonly id: string;
  readonly born: number;
  readonly spawnAt: Vector3;
  readonly v0: Vector3;
  readonly tagged: boolean;
  readonly infinity: boolean;
  readonly liquid: number | undefined;
  readonly air: number | undefined;
  readonly samples: Map<number, PathPoint>;
  hitTick?: number;
  hitAt?: Vector3;
  hitBlock?: string;
  goneTick?: number;
}

function readInertia(e: Entity): { liquid: number | undefined; air: number | undefined } {
  try {
    const p = e.getComponent("minecraft:projectile");
    return { liquid: p?.liquidInertia, air: p?.airInertia };
  } catch {
    return { liquid: undefined, air: undefined };
  }
}

function hasTag(e: Entity, tag: string): boolean {
  try {
    return e.hasTag(tag);
  } catch {
    return false;
  }
}

/** Arrows of one shooter: spawn state, a sample every tick, and where each first hit a block. */
/**
 * `strip` takes the Infinity tag off each arrow right after the bow wrote it: tags are shared by both
 * packs, so the release pack's copy of the guard would otherwise still take the arrow off.
 */
function arrowTracker() {
  let ownerId: string | undefined;
  let strip = false;
  const arrows: Tracked[] = [];
  const spawnSub = world.afterEvents.entitySpawn.subscribe(({ entity: e }) => {
    if (ownerId === undefined || !e.isValid || e.typeId !== ARROW_ID) return;
    let owner: string | undefined;
    try {
      owner = e.getComponent("minecraft:projectile")?.owner?.id;
    } catch {
      owner = undefined;
    }
    if (owner !== ownerId) return;
    const { liquid, air } = readInertia(e);
    arrows.push({ e, id: e.id, born: system.currentTick, spawnAt: { ...e.location }, v0: e.getVelocity(), tagged: hasTag(e, FLIGHT_TAG), infinity: hasTag(e, INFINITY_TAG), liquid, air, samples: new Map() });
    if (strip) e.removeTag(INFINITY_TAG);
  });
  const hitSub = world.afterEvents.projectileHitBlock.subscribe((ev) => {
    const a = arrows.find((x) => x.id === ev.projectile.id);
    if (a === undefined || a.hitTick !== undefined) return;
    a.hitTick = system.currentTick - a.born;
    a.hitAt = { ...ev.location };
    try {
      a.hitBlock = ev.getBlockHit().block.typeId;
    } catch {
      a.hitBlock = "?";
    }
  });
  const interval = system.runInterval(() => {
    for (const a of arrows) {
      if (a.goneTick !== undefined) continue;
      const dt = system.currentTick - a.born;
      if (!a.e.isValid) {
        a.goneTick = dt;
        continue;
      }
      if (a.hitTick === undefined) a.samples.set(dt, { at: sub(a.e.location, a.spawnAt), v: a.e.getVelocity() });
    }
  }, 1);
  return {
    arrows,
    arm: (id: string | undefined, stripInfinity = false): void => {
      ownerId = id;
      strip = stripInfinity;
    },
    stop: (): void => {
      ownerId = undefined;
      world.afterEvents.entitySpawn.unsubscribe(spawnSub);
      world.afterEvents.projectileHitBlock.unsubscribe(hitSub);
      system.clearRun(interval);
    },
  };
}

type Tracker = ReturnType<typeof arrowTracker>;

interface Shot {
  readonly label: string;
  readonly started: boolean;
  readonly arrow: Tracked | undefined;
  readonly flight: Flight | undefined;
}

function flightOf(a: Tracked): Flight {
  return { samples: a.samples, landing: a.hitAt === undefined ? undefined : horizontal(sub(a.hitAt, a.spawnAt)) };
}

function sweepArrows(test: Test): void {
  const dim = test.getDimension();
  for (const e of dim.getEntities({ type: ARROW_ID, location: test.worldLocation({ x: 1, y: 6, z: 20 }), maxDistance: 40 })) {
    if (e.isValid) e.remove();
  }
}

/** Fires one shot and waits for its arrow to land (or `maxFlight` ticks); the arrow is left where it is. */
async function fire(test: Test, tracker: Tracker, shooter: SimulatedPlayer, label: string, bow: string, stance: Stance, draw = FULL, maxFlight = 40): Promise<Shot> {
  shooter.teleport(test.worldLocation(stance.feet), { rotation: { x: 0, y: 0 } });
  shooter.setItem(new ItemStack(bow), SLOT, true);
  shooter.getComponent("minecraft:inventory")?.container?.setItem(AMMO_SLOT, new ItemStack(ARROW_ID, 64));
  await test.idle(2);
  shooter.lookAtLocation(stance.aim, LookDuration.Continuous);
  await test.idle(4);
  const before = tracker.arrows.length;
  tracker.arm(shooter.id);
  const started = await startUse(test, shooter);
  await test.idle(draw);
  shooter.stopUsingItem();
  for (let i = 0; i < maxFlight; i++) {
    await test.idle(1);
    const a = tracker.arrows[before];
    if (a !== undefined && (a.hitTick !== undefined || a.goneTick !== undefined) && i > 2) break;
  }
  tracker.arm(undefined);
  const mine = tracker.arrows.slice(before);
  const arrow = mine[0];
  const shot: Shot = { label, started, arrow, flight: arrow === undefined ? undefined : flightOf(arrow) };
  if (mine.length !== 1) log(`${label}: ${mine.length} arrows from one release`);
  return shot;
}

/** The air flight this shot's arrow would make from its own launch, landing on the floor it hit. */
function ownAir(shot: Shot): Flight | undefined {
  const a = shot.arrow;
  if (a === undefined) return undefined;
  return airFlight(a.v0, TICKS[TICKS.length - 1] + 2, a.hitAt === undefined ? undefined : a.spawnAt.y + SPAWN_OFFSET_Y - a.hitAt.y);
}

const ratios = (c: Comparison): string => `run [${c.run.map(f2).join(" ")}] speed [${c.speed.map(f2).join(" ")}] landing ${f2(c.landing)}`;

function describe(shot: Shot, ref?: Shot): string {
  const a = shot.arrow;
  if (a === undefined) return `${shot.label}: started=${shot.started}, no arrow`;
  const runs = TICKS.map((t) => f2(a.samples.has(t) ? horizontal((a.samples.get(t) as PathPoint).at) : undefined)).join(" ");
  const speeds = TICKS.map((t) => f2(a.samples.has(t) ? speed((a.samples.get(t) as PathPoint).v) : undefined)).join(" ");
  const own = ownAir(shot);
  let vs = own === undefined || shot.flight === undefined ? "" : `; vs its own air flight ${ratios(compare(shot.flight, own, TICKS))}`;
  if (ref?.flight !== undefined && shot.flight !== undefined && ref !== shot) vs += `; vs the air shot ${ratios(compare(shot.flight, ref.flight, TICKS))}`;
  return (
    `${shot.label}: tagged=${a.tagged} liquidInertia ${f3(a.liquid)} airInertia ${f3(a.air)}; |v0| ${f2(speed(a.v0))} (${f2(a.v0.x)},${f2(a.v0.y)},${f2(a.v0.z)}); ` +
    `run +1..+6 [${runs}]; speed +1..+6 [${speeds}]; ` +
    `hit ${a.hitBlock === undefined ? "none" : `${short(a.hitBlock)}@+${a.hitTick} landing ${f2(shot.flight?.landing)} drop ${f2(a.hitAt === undefined ? undefined : a.spawnAt.y - a.hitAt.y)}`}` +
    `${a.goneTick === undefined ? "" : ` gone@+${a.goneTick}`}${vs}`
  );
}

/** Where the measured flight sits against the rules' air path from its own launch, signed, per tick. */
function modelGap(shot: Shot): string {
  const a = shot.arrow;
  if (a === undefined) return "-";
  const model = airPath(a.v0, TICKS[TICKS.length - 1]);
  const gaps = TICKS.filter((t) => a.samples.has(t)).map((t) => {
    const got = (a.samples.get(t) as PathPoint).at;
    const want = model[t].at;
    return `${f2(got.x - want.x)},${f2(got.y - want.y)},${f2(got.z - want.z)}`;
  });
  return `model gap x,y,z +1..+6 [${gaps.join(" ")}]`;
}

function build(test: Test, medium: string): void {
  const dim = test.getDimension();
  const o = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  fill(dim, add(o, SHELL_LO), add(o, SHELL_HI), GLASS);
  fill(dim, add(o, LANE_LO), add(o, LANE_HI), AIR);
  if (medium !== AIR) fill(dim, add(o, LANE_LO), add(o, MEDIUM_HI), medium);
  dim.setBlockType(add(o, PEDESTAL), GLASS);
}

function teardown(test: Test): void {
  const dim = test.getDimension();
  const o = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  sweepArrows(test);
  fill(dim, add(o, SHELL_LO), add(o, SHELL_HI), AIR);
}

/**
 * Air-like (C-42) twice over: run and speed tick by tick against the bow's own air shot, and in full,
 * landing included, against the air flight from the arrow's own launch. Shot against shot leaves the
 * landing out: a sim player's aim wavers by ±0.05 b/t vertically, which moves a landing by over 10 %.
 */
function assertAirLike(test: Test, shot: Shot, ref: Shot): void {
  const own = ownAir(shot);
  test.assert(shot.flight !== undefined && ref.flight !== undefined && own !== undefined, `${shot.label}: no arrow to compare (started=${shot.started}, reference ${ref.arrow === undefined ? "missing" : "present"})`);
  const vsShot = airLikeFailures(compare(shot.flight as Flight, { samples: (ref.flight as Flight).samples }, TICKS));
  test.assert(vsShot.length === 0, `${shot.label} is not within ±10 % of the air shot: ${vsShot.join("; ")}`);
  const vsOwn = airLikeFailures(compare(shot.flight as Flight, own as Flight, TICKS), { needLanding: true });
  test.assert(vsOwn.length === 0, `${shot.label} is not within ±10 % of its own air flight: ${vsOwn.join("; ")}`);
}

/** The air shot itself must be a whole flight that the rules' air model reproduces, or nothing is measured against anything. */
function assertReference(test: Test, air: Shot): void {
  assertBowArrow(test, air, true);
  const own = ownAir(air);
  test.assert(air.arrow?.hitTick !== undefined && (air.flight?.samples.size ?? 0) >= TICKS.length && own !== undefined, `${air.label}: the reference did not fly ${TICKS.length} ticks and land (${describe(air)})`);
  const off = airLikeFailures(compare(air.flight as Flight, own as Flight, TICKS), { needLanding: true });
  test.assert(off.length === 0, `${air.label}: the air model does not reproduce the engine's air flight: ${off.join("; ")}`);
}

function assertBowArrow(test: Test, shot: Shot, neutral: boolean): void {
  const a = shot.arrow;
  test.assert(a !== undefined, `${shot.label}: the bow fired no arrow (started=${shot.started})`);
  if (a === undefined) return;
  test.assert(a.tagged, `${shot.label}: the Underwater Bow's arrow is not tagged ${FLIGHT_TAG}`);
  const want = neutral ? (a.air ?? AIR_INERTIA) : VANILLA_LIQUID_INERTIA;
  test.assert(a.liquid !== undefined && Math.abs(a.liquid - want) < 1e-3, `${shot.label}: liquid inertia reads ${f3(a.liquid)}, want ${f3(want)}`);
}

function assertSlowed(test: Test, shot: Shot, ref: Shot, what: string): void {
  test.assert(shot.flight !== undefined && ref.flight !== undefined, `${shot.label}: no arrow to compare`);
  const c = compare(shot.flight as Flight, ref.flight as Flight, TICKS);
  test.assert(isSlowed(c), `${what}: ${shot.label} ran ${f2(c.run[c.run.length - 1])} of the air run at +${c.ticks[c.ticks.length - 1] ?? "-"}, want under ${SLOWED_CEILING}`);
}

// ------------------------------------------------ AC 1 + 3: water, with both controls

registerAsync("andrew", "ubow_flight_water", async (test: Test): Promise<void> => {
  const shooter = await survivor(test, { x: 4, y: 2, z: 0 }, "ubow_flight_w");
  const tracker = arrowTracker();
  try {
    build(test, AIR);
    await test.idle(2);
    const air = await fire(test, tracker, shooter, "under air ubow", UBOW, UNDER);
    const airEntry = await fire(test, tracker, shooter, "entry air ubow", UBOW, ENTRY);
    sweepArrows(test);
    build(test, WATER);
    await test.idle(2);
    const water = await fire(test, tracker, shooter, "under water ubow", UBOW, UNDER);
    const vanilla = await fire(test, tracker, shooter, "under water vanilla bow", BOW, UNDER);
    setLiquidNeutral(false);
    let off: Shot;
    try {
      off = await fire(test, tracker, shooter, "under water ubow, liquid handling off", UBOW, UNDER);
    } finally {
      setLiquidNeutral(true);
    }
    const waterEntry = await fire(test, tracker, shooter, "entry water ubow", UBOW, ENTRY);
    const vanillaEntry = await fire(test, tracker, shooter, "entry water vanilla bow", BOW, ENTRY);

    for (const s of [air, water, vanilla, off]) log(`RESULT ${describe(s, air)}`);
    for (const s of [airEntry, waterEntry, vanillaEntry]) log(`RESULT ${describe(s, airEntry)}`);
    log(`RESULT air references: under ${modelGap(air)}; entry ${modelGap(airEntry)}`);
    log(`RESULT model gaps in water: under ${modelGap(water)}; entry ${modelGap(waterEntry)}; vanilla ${modelGap(vanilla)}`);

    assertReference(test, air);
    assertReference(test, airEntry);
    assertBowArrow(test, water, true);
    assertAirLike(test, water, air);
    assertBowArrow(test, waterEntry, true);
    assertAirLike(test, waterEntry, airEntry);

    // Attribution: the vanilla bow's arrow is not the Underwater Bow's, and the same water slows it.
    test.assert(vanilla.arrow !== undefined && !vanilla.arrow.tagged, `under water vanilla bow: ${vanilla.arrow === undefined ? "no arrow" : "its arrow is tagged as the Underwater Bow's"}`);
    test.assert(Math.abs((vanilla.arrow?.liquid ?? 0) - VANILLA_LIQUID_INERTIA) < 1e-3, `under water vanilla bow: liquid inertia ${f3(vanilla.arrow?.liquid)}, want vanilla ${VANILLA_LIQUID_INERTIA}`);
    assertSlowed(test, vanilla, air, "control (vanilla bow)");
    // The measurement can go red: the bow's own arrow with the inertia write switched off.
    assertBowArrow(test, off, false);
    assertSlowed(test, off, air, "negative control (liquid handling off)");
  } finally {
    setLiquidNeutral(true);
    tracker.stop();
    teardown(test);
    test.removeSimulatedPlayer(shooter);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");

// ------------------------------------------------ AC 2: lava

/** Ticks a landed arrow must stay alive in lava: the probe's 100 (§2) and then some. */
const LAVA_WATCH = 120;

registerAsync("andrew", "ubow_flight_lava", async (test: Test): Promise<void> => {
  const shooter = await survivor(test, { x: 4, y: 2, z: 0 }, "ubow_flight_l");
  const tracker = arrowTracker();
  try {
    build(test, AIR);
    await test.idle(2);
    const air = await fire(test, tracker, shooter, "under air ubow", UBOW, UNDER);
    const airEntry = await fire(test, tracker, shooter, "entry air ubow", UBOW, ENTRY);
    sweepArrows(test);
    build(test, LAVA);
    await test.idle(2);
    const lava = await fire(test, tracker, shooter, "under lava ubow", UBOW, UNDER);
    const lavaEntry = await fire(test, tracker, shooter, "entry lava ubow", UBOW, ENTRY);
    const vanilla = await fire(test, tracker, shooter, "under lava vanilla bow", BOW, UNDER);
    shooter.teleport(test.worldLocation({ x: 4.5, y: 2, z: 0.5 }));
    await test.idle(LAVA_WATCH);
    const alive = (s: Shot): string => {
      const e = s.arrow?.e;
      if (e === undefined) return "no arrow";
      if (!e.isValid) return "gone";
      let fire = "-";
      try {
        fire = String(e.getComponent("minecraft:onfire")?.onFireTicksRemaining ?? 0);
      } catch (err) {
        fire = `threw ${errText(err)}`;
      }
      return `alive, on fire ${fire}`;
    };

    for (const s of [air, lava, vanilla]) log(`RESULT ${describe(s, air)}`);
    for (const s of [airEntry, lavaEntry]) log(`RESULT ${describe(s, airEntry)}`);
    log(`RESULT model gaps: air under ${modelGap(air)}; lava under ${modelGap(lava)}; lava entry ${modelGap(lavaEntry)}`);
    log(`RESULT lava survival ${LAVA_WATCH} ticks after landing: ${[lava, lavaEntry, vanilla].map((s) => `${s.label} ${alive(s)}`).join("; ")}`);

    assertReference(test, air);
    assertReference(test, airEntry);
    for (const s of [lava, lavaEntry]) {
      assertBowArrow(test, s, true);
      test.assert(s.arrow?.hitBlock === GLASS, `${s.label}: the arrow did not reach the channel's glass (${describe(s)})`);
      test.assert(s.arrow?.e.isValid === true, `${s.label}: lava destroyed the arrow within ${LAVA_WATCH} ticks of landing`);
    }
    assertAirLike(test, lava, air);
    assertAirLike(test, lavaEntry, airEntry);
  } finally {
    tracker.stop();
    teardown(test);
    test.removeSimulatedPlayer(shooter);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");

// ------------------------------------------------ AC 4: the bow's arrow hits like the vanilla bow's

const DAMAGE_SHOTS = 5;
/** Shooter and target in the lane, five blocks apart; aim at the target's chest. */
const SHOOTER_AT: Stance = { name: "damage", feet: { x: 1.5, y: 3, z: 0.5 }, aim: { x: 1.5, y: 4.1, z: 5.5 } };
const TARGET_AT: Vector3 = { x: 1.5, y: 3, z: 5.5 };

interface Hit {
  readonly tick: number;
  readonly cause: string;
  readonly damage: number;
  readonly tagged: boolean | undefined;
}

registerAsync("andrew", "ubow_flight_damage", async (test: Test): Promise<void> => {
  const shooter = await survivor(test, { x: 4, y: 2, z: 0 }, "ubow_flight_s");
  const target = await survivor(test, { x: 4, y: 2, z: 3 }, "ubow_flight_t", true);
  const tracker = arrowTracker();
  const hits: Hit[] = [];
  const hurtSub = world.beforeEvents.entityHurt.subscribe((e) => {
    if (e.hurtEntity.id !== target.id) return;
    const p = e.damageSource.damagingProjectile;
    let tagged: boolean | undefined;
    try {
      tagged = p === undefined ? undefined : p.hasTag(FLIGHT_TAG);
    } catch {
      tagged = undefined;
    }
    hits.push({ tick: system.currentTick, cause: e.damageSource.cause, damage: e.damage, tagged });
  });
  const shoot = async (label: string, bow: string, draw: number): Promise<Hit[]> => {
    target.teleport(test.worldLocation(TARGET_AT), { rotation: { x: 0, y: 180 } });
    target.getComponent("minecraft:health")?.resetToMaxValue();
    const from = system.currentTick;
    const shot = await fire(test, tracker, shooter, label, bow, SHOOTER_AT, draw, 20);
    await test.idle(12);
    sweepArrows(test);
    const mine = hits.filter((h) => h.tick >= from);
    log(`RESULT ${label}: arrow ${shot.arrow === undefined ? "none" : `tagged=${shot.arrow.tagged} |v0| ${f2(speed(shot.arrow.v0))}`}; hits [${mine.map((h) => `${h.cause} ${f2(h.damage)} tagged=${h.tagged ?? "-"}`).join("; ")}]`);
    return mine;
  };
  const series = async (label: string, bow: string, draw: number, n: number): Promise<Hit[][]> => {
    const out: Hit[][] = [];
    for (let i = 1; i <= n; i++) out.push(await shoot(`${label} #${i}`, bow, draw));
    return out;
  };
  try {
    build(test, AIR);
    await test.idle(2);
    const vanillaAir = await series("air vanilla bow full", BOW, FULL, DAMAGE_SHOTS);
    const ubowAir = await series("air ubow full", UBOW, FULL, DAMAGE_SHOTS);
    const vanillaPartial = await shoot(`air vanilla bow draw ${PARTIAL_DRAW_TICKS}`, BOW, PARTIAL_DRAW_TICKS);
    build(test, WATER);
    await test.idle(2);
    const ubowWater = await series("water ubow full", UBOW, FULL, DAMAGE_SHOTS);
    const ubowPartial = await shoot(`water ubow draw ${PARTIAL_DRAW_TICKS}`, UBOW, PARTIAL_DRAW_TICKS);

    const one = (hs: Hit[]): number => (hs.length === 1 && hs[0].cause === EntityDamageCause.projectile ? hs[0].damage : Number.NaN);
    const dmg = (xs: Hit[][]): number[] => xs.map(one);
    log(
      `RESULT full draw before-event damage: vanilla bow in air ${range(dmg(vanillaAir))}; Underwater Bow in air ${range(dmg(ubowAir))}; ` +
        `Underwater Bow in water ${range(dmg(ubowWater))}; envelope ${FULL_DRAW_DAMAGE.min}–${FULL_DRAW_DAMAGE.max}; ` +
        `draw ${PARTIAL_DRAW_TICKS}: vanilla in air ${f2(one(vanillaPartial))}, Underwater Bow in water ${f2(one(ubowPartial))}`
    );

    // The envelope is checked on the vanilla bow first: a vanilla hit outside it is the instrument's fault.
    vanillaAir.forEach((hs, i) => test.assert(isVanillaFullDraw(one(hs)), `control: vanilla full draw #${i + 1} hit for ${f2(one(hs))} (${hs.length} hits), outside ${FULL_DRAW_DAMAGE.min}–${FULL_DRAW_DAMAGE.max}`));
    vanillaAir.forEach((hs, i) => test.assert(hs[0]?.tagged === false, `control: vanilla full draw #${i + 1} arrow reads tagged=${hs[0]?.tagged}`));
    for (const [name, xs] of [
      ["in air", ubowAir],
      ["in water", ubowWater],
    ] as Array<[string, Hit[][]]>) {
      xs.forEach((hs, i) => {
        test.assert(isVanillaFullDraw(one(hs)), `Underwater Bow full draw ${name} #${i + 1} hit for ${f2(one(hs))} (${hs.length} hits), outside the vanilla ${FULL_DRAW_DAMAGE.min}–${FULL_DRAW_DAMAGE.max}`);
        test.assert(hs[0]?.tagged === true, `Underwater Bow full draw ${name} #${i + 1}: the hitting arrow reads tagged=${hs[0]?.tagged}`);
      });
    }
    test.assert(one(vanillaPartial) === PARTIAL_DRAW_DAMAGE, `control: vanilla draw ${PARTIAL_DRAW_TICKS} hit for ${f2(one(vanillaPartial))}, want ${PARTIAL_DRAW_DAMAGE}`);
    test.assert(one(ubowPartial) === PARTIAL_DRAW_DAMAGE, `Underwater Bow draw ${PARTIAL_DRAW_TICKS} in water hit for ${f2(one(ubowPartial))}, want the vanilla ${PARTIAL_DRAW_DAMAGE}`);
  } finally {
    world.beforeEvents.entityHurt.unsubscribe(hurtSub);
    tracker.stop();
    teardown(test);
    test.removeSimulatedPlayer(shooter);
    test.removeSimulatedPlayer(target);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(4000)
  .tag("andrew");

// ------------------------------------------------ Probe §3's dupe: a custom shooter's Infinity arrow can be picked up

const WALL_LO: Vector3 = { x: 2, y: 2, z: 6 };
const WALL_HI: Vector3 = { x: 4, y: 5, z: 6 };
const WALL_STANCE: Stance = { name: "wall", feet: { x: 3.5, y: 2, z: 0.5 }, aim: { x: 3.5, y: 3.5, z: 6 } };

function bowWith(id: string, infinity: boolean): ItemStack {
  const stack = new ItemStack(id);
  if (infinity) stack.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType("infinity"), level: 1 });
  return stack;
}

/** A picked-up arrow can land in any slot; each case starts from exactly 64 in the ammo slot. */
function resetAmmo(p: SimulatedPlayer): void {
  const c = p.getComponent("minecraft:inventory")?.container;
  for (let i = 0; i < (c?.size ?? 0); i++) if (c?.getItem(i)?.typeId === ARROW_ID) c.setItem(i, undefined);
  c?.setItem(AMMO_SLOT, new ItemStack(ARROW_ID, 64));
}

function arrowsIn(p: SimulatedPlayer): number {
  const c = p.getComponent("minecraft:inventory")?.container;
  let n = 0;
  for (let i = 0; i < (c?.size ?? 0); i++) {
    const s = c?.getItem(i);
    if (s?.typeId === ARROW_ID) n += s.amount;
  }
  return n;
}

interface Pickup {
  readonly label: string;
  readonly shot: number;
  readonly walked: number;
  readonly landed: boolean;
  readonly goneAfterLanding: number | undefined;
  readonly infinityTagged: boolean;
}

registerAsync("andrew", "ubow_infinity_no_pickup", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const shooter = await survivor(test, { x: 3, y: 2, z: 0 }, "ubow_flight_i");
  const tracker = arrowTracker();
  const wall: [Vector3, Vector3] = [test.worldBlockLocation(WALL_LO), test.worldBlockLocation(WALL_HI)];
  const run = async (label: string, bow: string, infinity: boolean, stripInfinity = false): Promise<Pickup> => {
    shooter.teleport(test.worldLocation(WALL_STANCE.feet), { rotation: { x: 0, y: 0 } });
    const before = tracker.arrows.length;
    shooter.setItem(bowWith(bow, infinity), SLOT, true);
    resetAmmo(shooter);
    await test.idle(2);
    shooter.lookAtLocation(WALL_STANCE.aim, LookDuration.Continuous);
    await test.idle(4);
    tracker.arm(shooter.id, stripInfinity);
    await startUse(test, shooter);
    await test.idle(FULL);
    shooter.stopUsingItem();
    await test.idle(15);
    tracker.arm(undefined);
    const shot = arrowsIn(shooter);
    const a = tracker.arrows[before];
    const at = a?.hitAt;
    if (at !== undefined) shooter.teleport({ x: at.x, y: test.worldLocation({ x: 0, y: 2, z: 0 }).y, z: at.z - 0.6 });
    await test.idle(30);
    const walked = arrowsIn(shooter);
    const p: Pickup = {
      label,
      shot,
      walked,
      landed: a?.hitTick !== undefined,
      goneAfterLanding: a?.hitTick === undefined || a.e.isValid ? undefined : (a.goneTick ?? Number.NaN) - a.hitTick,
      infinityTagged: a?.infinity === true,
    };
    log(`RESULT ${label}: ammo 64 -> ${shot} after the shot -> ${walked} after standing on the arrow 30 ticks; landed ${p.landed}; infinity tag ${p.infinityTagged}; arrow ${a === undefined ? "none" : a.e.isValid ? "still there" : `gone ${p.goneAfterLanding} tick(s) after landing`}`);
    sweepArrows(test);
    for (const e of dim.getEntities({ type: ARROW_ID, location: test.worldLocation({ x: 3, y: 3, z: 6 }), maxDistance: 12 })) e.remove();
    return p;
  };
  try {
    fill(dim, wall[0], wall[1], "minecraft:stone");
    await test.idle(2);
    const plain = await run("ubow plain", UBOW, false);
    const unguarded = await run("ubow infinity, tag stripped", UBOW, true, true);
    const guarded = await run("ubow infinity", UBOW, true);
    const vanilla = await run("vanilla bow infinity", BOW, true);

    test.assert(!plain.infinityTagged && unguarded.infinityTagged && guarded.infinityTagged && !vanilla.infinityTagged, `the Infinity tag must mark exactly the Infinity copy's arrows (plain ${plain.infinityTagged}, stripped ${unguarded.infinityTagged}, guarded ${guarded.infinityTagged}, vanilla ${vanilla.infinityTagged})`);
    test.assert(plain.landed && plain.shot === 63 && plain.walked === 64, `control: the bow's plain arrow must be spent and picked back up (64 -> ${plain.shot} -> ${plain.walked}, landed ${plain.landed})`);
    test.assert(unguarded.landed && unguarded.shot === 64 && unguarded.walked === 65, `negative control: without its tag the Infinity arrow is the probe's dupe (64 -> ${unguarded.shot} -> ${unguarded.walked}, landed ${unguarded.landed})`);
    test.assert(guarded.landed && guarded.shot === 64 && guarded.walked === 64, `the Infinity arrow came back as an item: 64 -> ${guarded.shot} -> ${guarded.walked} (landed ${guarded.landed})`);
    test.assert(guarded.goneAfterLanding !== undefined && guarded.goneAfterLanding <= 2, `the Infinity arrow was not taken off within 2 ticks of landing (${guarded.goneAfterLanding ?? "still there"})`);
    test.assert(vanilla.shot === 64 && vanilla.walked === 64, `reference: the vanilla Infinity bow gave 64 -> ${vanilla.shot} -> ${vanilla.walked}`);
  } finally {
    tracker.stop();
    fill(dim, wall[0], wall[1], AIR);
    sweepArrows(test);
    test.removeSimulatedPlayer(shooter);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");
