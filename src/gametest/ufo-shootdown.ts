// The Orbital Cannon shooting the UFO down on a real engine (UFO §8, AC-15):
// L0-sauc-ac03 in each phase and mode, the one-reward rule and the partly
// absorbed RMB salvo (r004, as05, as06), and the additive seam on the flight
// (ac04, L0-adr-ufoi). Every scenario builds the product core, saucer and —
// for the magnet phase — magnet over a test env on a pad of its own inside a
// ticking area over the ±100-block corridor the saucer flies; a SimulatedPlayer
// fires the real Cannon through activate(), with the real penetrator and rings
// in place of the stubs the other scenarios run on. Event ids carry the scope
// "gd", which no other core removes.

import {
  BlockVolume,
  type Dimension,
  Dimension as DimensionClass,
  Direction,
  type Entity,
  type ExplosionOptions,
  GameMode,
  ItemStack,
  type RawMessage,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import * as cooldown from "../legendary/cooldown";
import { ORBITAL_CANNON } from "../legendary/registry";
import { activate } from "../orbital/activation";
import { type Effect, type Mode, effectFor, registerEffect } from "../orbital/charge";
import { type Attack, type ChargeEnd, type Interceptor, interceptorCount, observeChargeEnds, registerInterceptor } from "../orbital/flight";
import { PENETRATOR_EFFECT } from "../orbital/penetrator";
import { RING_EFFECT } from "../orbital/ring";
import { layout, powerAtOffset } from "../orbital/ring-layout";
import { spawnY } from "../orbital/spawn";
import { STUB_EFFECTS } from "../orbital/stub-effect";
import { startUfo } from "../ufo";
import { FIRST_MAX_MS, FIRST_MIN_MS, PAUSE_MS, type UfoDurations, type UfoEnv, type UfoPlayer, overworldCandidates } from "../ufo/env";
import { type IntervalHost, type Phase, type PhasePayload, type Saucer, UfoCore } from "../ufo/event";
import { UfoMagnet } from "../ufo/magnet";
import { NEXT_MS } from "../ufo/schedule";
import { UFO_SOUNDS, type UfoSaucer, type UfoSound, createSaucer, legPosition, playUfoSound } from "../ufo/saucer";
import {
  BLAST_PARTICLE,
  HULL_HEIGHT,
  HULL_RADIUS,
  REWARD,
  SHOT_DOWN_TEXT,
  SMOKE_PARTICLE,
  SMOKE_PER_TICK,
  type ShotCore,
  type ShotPlayer,
  type ShotRecord,
  fallStep,
  landingCell,
} from "../ufo/shootdown";
import { arm, goTo } from "./orbital-core";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const SCOPE = "gd";
const STAND: Vector3 = { x: 3, y: 2, z: 3 };
/** −x like the other UFO pads, a row further out in z; 300 apart so the ±100 corridors never overlap. */
const SITE_DX = -1200;
const SITE_STEP = -300;
const SITE_DZ = 2100;
const PAD_X = 40;
const PAD_Z = 24;
const CORRIDOR = 100;
const FILL_CELLS = 32768;
/** The shooter stands this far out in z from the target: inside the 25-block aim, past RING_MIN_RANGE and past every ring's blast reach. */
const SHOOTER_DZ = 20;
const KEY = ORBITAL_CANNON.abilityKey;
/** AC-sauc-3: the column snapshot under the saucer, ±6 around the target. */
const COLUMN_HALF = 6;
/** AC-sauc-3: the blast area, 8 blocks around the blast point. */
const BLAST_HALF = 8;
const OVERWORLD = "minecraft:overworld";

const log = (msg: string): void => console.warn(`[gametest] ufo shootdown ${msg}`);
const fmt = (v: Vector3 | undefined): string => (v === undefined ? "none" : `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`);
const dist = (a: Vector3, b: Vector3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const flat = (a: { x: number; z: number }, b: { x: number; z: number }): number => Math.hypot(a.x - b.x, a.z - b.z);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

/** Set around every saucer step, so an explosion made inside one is told apart from the rings' own. */
let saucerStepping = false;

// ---------------------------------------------------------------- the pad

interface Pad {
  dim: Dimension;
  cx: number;
  cz: number;
  /** The floor's top block: the centre of the event, the target of every shot. */
  top: number;
  unload: () => void;
}

function fill(dim: Dimension, min: Vector3, max: Vector3, type: string): void {
  const area = (max.x - min.x + 1) * (max.z - min.z + 1);
  const slab = Math.max(1, Math.floor(FILL_CELLS / area));
  for (let y = min.y; y <= max.y; y += slab) {
    dim.fillBlocks(new BlockVolume({ x: min.x, y, z: min.z }, { x: max.x, y: Math.min(max.y, y + slab - 1), z: max.z }), type);
  }
}

async function pad(test: Test, name: string, k: number): Promise<Pad> {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const cx = origin.x + SITE_DX + SITE_STEP * k;
  const cz = origin.z + SITE_DZ;
  const min = dim.heightRange.min;
  const top = min + 12;
  const unload = await loadBox(test, dim, name, { min: [cx - CORRIDOR, 0, cz - PAD_Z - 4], max: [cx + CORRIDOR, 0, cz + PAD_Z + 4] });
  // A repeat of the scenario finds its own craters, rewards and leftovers here.
  for (const e of dim.getEntities({ location: { x: cx - PAD_X, y: min, z: cz - PAD_Z }, volume: { x: 2 * PAD_X, y: 120, z: 2 * PAD_Z } })) {
    if (e !== undefined && e.isValid && e.typeId !== "minecraft:player") e.remove();
  }
  fill(dim, { x: cx - PAD_X, y: min + 1, z: cz - PAD_Z }, { x: cx + PAD_X, y: top, z: cz + PAD_Z }, "minecraft:stone");
  fill(dim, { x: cx - PAD_X, y: top + 1, z: cz - PAD_Z }, { x: cx + PAD_X, y: top + 20, z: cz + PAD_Z }, "minecraft:air");
  return { dim, cx, cz, top, unload };
}

async function sims(test: Test, p: Pad, label: string, spots: ReadonlyArray<readonly [number, number]>): Promise<SimulatedPlayer[]> {
  const out: SimulatedPlayer[] = [];
  for (const [i, [dx, dz]] of spots.entries()) {
    const sp = test.spawnSimulatedPlayer(STAND, `sd_${label}_${i}`, GameMode.Survival);
    out.push(sp);
    await goTo(test, sp, p.dim, { x: p.cx + dx, y: p.top + 1, z: p.cz + dz });
  }
  return out;
}

// ---------------------------------------------------------------- snapshots

type Snapshot = Map<string, string>;

function snapshot(dim: Dimension, min: Vector3, max: Vector3): Snapshot {
  const out: Snapshot = new Map();
  for (let x = Math.floor(min.x); x <= Math.floor(max.x); x++)
    for (let y = Math.floor(min.y); y <= Math.floor(max.y); y++)
      for (let z = Math.floor(min.z); z <= Math.floor(max.z); z++) {
        let type: string;
        try {
          type = dim.getBlock({ x, y, z })?.typeId ?? "unloaded";
        } catch {
          type = "unloaded";
        }
        out.set(`${x},${y},${z}`, type);
      }
  return out;
}

function cubeAround(dim: Dimension, at: Vector3, half: number): Snapshot {
  return snapshot(dim, { x: at.x - half, y: at.y - half, z: at.z - half }, { x: at.x + half, y: at.y + half, z: at.z + half });
}

function changed(before: Snapshot, after: Snapshot): string[] {
  const out: string[] = [];
  for (const [k, v] of before) if (after.get(k) !== v) out.push(`${k} ${v}→${after.get(k) ?? "?"}`);
  return out;
}

// ---------------------------------------------------------------- the rig

class MemoryStore {
  readonly data = new Map<string, number | boolean>();
  get(key: string): unknown {
    return this.data.get(key);
  }
  set(key: string, value: number | boolean | undefined): void {
    if (value === undefined) this.data.delete(key);
    else this.data.set(key, value);
  }
}

interface PhaseRec {
  phase: Phase;
  payload: PhasePayload;
  call: number;
  tick: number;
}

interface StepRec {
  call: number;
  tick: number;
  phase: string | undefined;
  at: Vector3 | undefined;
}

interface HullCall {
  tick: number;
  attackId: string;
  slot: number;
  column: { x: number; z: number };
  from: Vector3;
  to: Vector3;
  /** What saucerPosition() read when the flight asked, and where the engine has the entity then. */
  saucer: Vector3 | undefined;
  entity: Vector3 | undefined;
  hit: boolean;
}

interface Report {
  tick: number;
  wall: number;
  call: number;
  info: { eventId: string; ownerId: string; ownerName: string };
  /** Where every scenario player was at the shot. */
  players: Map<string, Vector3>;
}

interface BlastRec {
  tick: number;
  predicted: Vector3;
  diff: string[];
  /** Health of every scenario player read right before the blast step. */
  health: Map<string, number>;
}

interface Rig {
  core: UfoCore;
  saucer: UfoSaucer;
  magnet: UfoMagnet | undefined;
  store: MemoryStore;
  phases: PhaseRec[];
  steps: StepRec[];
  sounds: { id: UfoSound; tick: number; at: Vector3 }[];
  hullCalls: HullCall[];
  reports: Report[];
  inbox: Map<string, RawMessage[]>;
  blasts: BlastRec[];
  /** A blast in a step the test did not foresee. */
  unforeseen: number[];
  durations: UfoDurations;
  calls(): number;
  of(phase: Phase): PhaseRec[];
  stop(): void;
}

function health(e: Entity): number {
  try {
    return e.isValid ? (e.getComponent("minecraft:health")?.currentValue ?? 0) : 0;
  } catch {
    return 0;
  }
}

function airAt(dim: Dimension, x: number, y: number, z: number): boolean {
  try {
    return dim.getBlock({ x, y, z })?.isAir !== false;
  } catch {
    return true;
  }
}

/** Where this fall step blasts, by the product's own arithmetic, or undefined when it falls on. */
function blastOfStep(dim: Dimension, shot: Readonly<ShotRecord>, at: Vector3 | undefined, durations: UfoDurations): Vector3 | undefined {
  if (at === undefined) return undefined;
  const next = fallStep(at.y, shot.vy);
  const cell = landingCell(at.y, next.y, dim.heightRange.min, (y) => airAt(dim, Math.floor(at.x), y, Math.floor(at.z)));
  if (cell !== undefined) return { x: at.x, y: cell + 1, z: at.z };
  return shot.steps + 1 >= durations.downed ? { x: at.x, y: next.y, z: at.z } : undefined;
}

function rig(opts: { durations: UfoDurations; theta01: number; players: SimulatedPlayer[]; magnet?: boolean }): Rig {
  const overworld = (): Dimension => world.getDimension("overworld");
  let calls = 0;
  const phases: PhaseRec[] = [];
  const steps: StepRec[] = [];
  const sounds: Rig["sounds"] = [];
  const hullCalls: HullCall[] = [];
  const reports: Report[] = [];
  const inbox = new Map<string, RawMessage[]>();
  const blasts: BlastRec[] = [];
  const unforeseen: number[] = [];
  const store = new MemoryStore();
  let core: UfoCore | undefined;
  const env: UfoEnv = {
    now: () => Date.now(),
    durations: opts.durations,
    pauseMs: PAUSE_MS,
    firstMinMs: FIRST_MIN_MS,
    firstMaxMs: FIRST_MAX_MS,
    overworldPlayers: (): UfoPlayer[] => overworldCandidates(opts.players).map((p) => ({ id: p.id, name: p.name, location: p.location, sendMessage: () => {} })),
    random: () => 0,
    store,
    ceiling: () => overworld().heightRange.max,
    log: (msg) => console.warn(`[gametest] ${msg}`),
  };
  const shotCore: ShotCore = {
    requestMagnetOff: (reason) => core?.requestMagnetOff(reason),
    reportShotDown: (info) => {
      reports.push({ tick: system.currentTick, wall: Date.now(), call: calls, info: { ...info }, players: new Map(opts.players.map((pl) => [pl.name, { ...pl.location }])) });
      core?.reportShotDown(info);
    },
  };
  // The product's broadcast path over the scenario's own players: a product pack reads a SimulatedPlayer as undefined.
  const shotPlayers = (): ShotPlayer[] =>
    opts.players.map((sp) => ({
      id: sp.id,
      name: sp.name,
      sendMessage: (message: RawMessage) => {
        const list = inbox.get(sp.name) ?? [];
        list.push(message);
        inbox.set(sp.name, list);
        sp.sendMessage(message);
      },
    }));
  let saucer: UfoSaucer | undefined;
  const spy = (fn: Interceptor): Interceptor => (attack, charge, from, to, tick) => {
    const at = saucer?.saucerPosition();
    const e = saucer?.entity();
    const hit = fn(attack, charge, from, to, tick);
    hullCalls.push({ tick: system.currentTick, attackId: attack.attackId, slot: charge.slot, column: { x: charge.x, z: charge.z }, from: { ...from }, to: { ...to }, saucer: at === undefined ? undefined : { ...at }, entity: e === undefined ? undefined : { ...e.location }, hit });
    return hit;
  };
  const made = createSaucer({
    overworld,
    random: () => opts.theta01,
    durations: opts.durations,
    ceiling: env.ceiling,
    sound: (id, at) => {
      sounds.push({ id, tick: system.currentTick, at: { ...at } });
      playUfoSound(overworld(), id, at);
    },
    shootdown: {
      registerInterceptor: (fn) => registerInterceptor(spy(fn)),
      core: () => shotCore,
      players: shotPlayers,
      itemStack: (typeId, amount) => new ItemStack(typeId, amount),
      log: (msg) => console.warn(`[gametest] ${msg}`),
    },
  });
  saucer = made;
  const recording: Saucer = {
    onPhase: (phase, payload) => made.onPhase(phase, payload),
    saucerStep: (tick) => {
      const shot = made.shot();
      let foreseen: { at: Vector3; before: Snapshot; health: Map<string, number> } | undefined;
      if (shot !== undefined && !shot.blasted) {
        const at = blastOfStep(overworld(), shot, made.saucerPosition(), opts.durations);
        if (at !== undefined) foreseen = { at, before: cubeAround(overworld(), at, BLAST_HALF), health: new Map(opts.players.map((p) => [p.name, health(p)])) };
      }
      saucerStepping = true;
      try {
        made.saucerStep(tick);
      } finally {
        saucerStepping = false;
      }
      const after = made.shot();
      if (foreseen !== undefined) {
        blasts.push({ tick: system.currentTick, predicted: foreseen.at, diff: changed(foreseen.before, cubeAround(overworld(), foreseen.at, BLAST_HALF)), health: foreseen.health });
      } else if (shot !== undefined && !shot.blasted && after?.blasted === true) {
        unforeseen.push(system.currentTick);
      }
      steps.push({ call: calls, tick: system.currentTick, phase: core?.session()?.phase, at: made.saucerPosition() });
    },
    saucerPosition: () => made.saucerPosition(),
    fallFinished: () => made.fallFinished?.() === true,
  };
  const magnet =
    opts.magnet === true
      ? new UfoMagnet({
          overworld,
          players: () => opts.players,
          saucerPosition: () => made.saucerPosition(),
          spawns: world.afterEvents.entitySpawn,
          host: { itemStack: (typeId, amount) => new ItemStack(typeId, amount), volume: (from, to) => new BlockVolume(from, to), now: () => Date.now(), log: (msg) => console.warn(`[gametest] ${msg}`) },
        })
      : undefined;
  const recorder = { onPhase: (phase: Phase, payload: PhasePayload): void => void phases.push({ phase, payload, call: calls, tick: system.currentTick }) };
  const host: IntervalHost = {
    runInterval: (callback, tickInterval) =>
      system.runInterval(() => {
        calls++;
        callback();
      }, tickInterval),
    clearRun: (id) => system.clearRun(id),
  };
  core = new UfoCore(env, { scope: SCOPE, saucer: recording, magnet, listeners: [recorder] });
  const live = core;
  const undo = startUfo(live, world, host);
  return {
    core: live,
    saucer: made,
    magnet,
    store,
    phases,
    steps,
    sounds,
    hullCalls,
    reports,
    inbox,
    blasts,
    unforeseen,
    durations: opts.durations,
    calls: () => calls,
    of: (phase) => phases.filter((x) => x.phase === phase),
    stop: () => {
      undo();
      // A pause publishes the reset that unregisters the hull; an event cut off by the stop gets it here.
      made.onPhase("pause", { centre: { x: 0, y: 0, z: 0 }, hoverY: 0, saucerPos: undefined, eventId: "stop" });
    },
  };
}

// ---------------------------------------------------------------- watchers

interface Spawned {
  item: string;
  amount: number;
  at: Vector3;
  tick: number;
}

function watchItems(): { items: Spawned[]; stop: () => void } {
  const items: Spawned[] = [];
  const h = world.afterEvents.entitySpawn.subscribe((ev) => {
    const e = ev.entity;
    try {
      if (!e.isValid || e.typeId !== "minecraft:item") return;
      const stack = e.getComponent("minecraft:item")?.itemStack;
      items.push({ item: stack?.typeId ?? "?", amount: stack?.amount ?? 0, at: { ...e.location }, tick: system.currentTick });
    } catch {
      // An item gone before its spawn event is read is not one the blast made in its own tick.
    }
  });
  return { items, stop: () => world.afterEvents.entitySpawn.unsubscribe(h) };
}

interface Hurt {
  name: string;
  cause: string;
  damage: number;
  tick: number;
}

function watchHurts(players: SimulatedPlayer[]): { hurts: Hurt[]; stop: () => void } {
  const hurts: Hurt[] = [];
  const ids = new Map(players.map((p) => [p.id, p.name]));
  const h = world.afterEvents.entityHurt.subscribe((ev) => {
    const name = ids.get(ev.hurtEntity.id);
    if (name !== undefined) hurts.push({ name, cause: ev.damageSource.cause, damage: ev.damage, tick: system.currentTick });
  });
  return { hurts, stop: () => world.afterEvents.entityHurt.unsubscribe(h) };
}

interface Spied {
  id: string;
  at: Vector3;
  tick: number;
}

/** Every spawnParticle and createExplosion this runtime makes on any dimension while armed. */
function spyWorld(): { particles: Spied[]; explosions: (Spied & { radius: number; inSaucerStep: boolean })[]; restore: () => void } {
  const particles: Spied[] = [];
  const explosions: (Spied & { radius: number; inSaucerStep: boolean })[] = [];
  const proto = DimensionClass.prototype;
  const spawnParticle = proto.spawnParticle;
  const createExplosion = proto.createExplosion;
  proto.spawnParticle = function (this: Dimension, ...args: Parameters<Dimension["spawnParticle"]>) {
    particles.push({ id: args[0], at: { ...args[1] }, tick: system.currentTick });
    return spawnParticle.apply(this, args);
  };
  proto.createExplosion = function (this: Dimension, location: Vector3, radius: number, options?: ExplosionOptions): boolean {
    explosions.push({ id: "explosion", at: { ...location }, radius, tick: system.currentTick, inSaucerStep: saucerStepping });
    return createExplosion.call(this, location, radius, options);
  };
  return {
    particles,
    explosions,
    restore: () => {
      proto.spawnParticle = spawnParticle;
      proto.createExplosion = createExplosion;
    },
  };
}

interface Detonation {
  mode: Mode;
  point: Vector3;
  attackId: string;
  tick: number;
}

/** `effect` as `mode`'s effect for one scenario, every onDetonate recorded; returns the calls and the restore. */
function useEffect(mode: Mode, effect: Effect): { calls: Detonation[]; restore: () => void } {
  const was = effectFor(mode);
  const calls: Detonation[] = [];
  // Spread, never field by field: a stand-in that drops minRange measures the wrong rule.
  registerEffect(mode, {
    ...effect,
    onDetonate(d, point, ownerId, m, attackId) {
      calls.push({ mode: m, point: { ...point }, attackId, tick: system.currentTick });
      effect.onDetonate(d, point, ownerId, m, attackId);
    },
  });
  return { calls, restore: () => void (was !== undefined && registerEffect(mode, was)) };
}

function watchEnds(): { ends: ChargeEnd[]; of: (attackId: string) => ChargeEnd[]; stop: () => void } {
  const ends: ChargeEnd[] = [];
  const stop = observeChargeEnds((e) => void ends.push({ ...e, point: e.point === undefined ? undefined : { ...e.point } }));
  return { ends, of: (id) => ends.filter((e) => e.attack.attackId === id), stop };
}

async function waitFor(test: Test, cond: () => boolean, ticks: number, label: string): Promise<number> {
  for (let t = 0; t <= ticks; t++) {
    if (cond()) return t;
    await test.idle(1);
  }
  throw new Error(`${label}: not within ${ticks} ticks`);
}

// ---------------------------------------------------------------- one shoot-down

/**
 * The block under where the hull will be when a charge fired now reaches it:
 * the charge falls 1 a tick from the spawn height, and in the j-th flight step
 * after the shot the hull stands where the saucer is j UFO ticks on. The
 * engine settles the tick order; the hull's radius absorbs a tick either way.
 */
function aimUnder(r: Rig, p: Pad): { target: Vector3; crossing: Vector3; j: number } {
  const s = r.core.session();
  const path = r.saucer.legs();
  if (s === undefined || path === undefined) throw new Error("no saucer to aim at");
  const top = spawnY(p.dim.id, p.top, p.dim.heightRange);
  const where = (j: number): Vector3 => {
    if (s.phase === "arrival" || s.phase === "departure") return legPosition(path, s.phase, s.phaseTick + j, r.durations);
    return path.hover;
  };
  for (let j = 1; j < 120; j++) {
    const at = where(j);
    if (top - j <= at.y + HULL_HEIGHT && top - j + 1 >= at.y) return { target: { x: Math.floor(at.x), y: p.top, z: Math.floor(at.z) }, crossing: at, j };
  }
  throw new Error("no crossing within 120 ticks");
}

function fire(shooter: SimulatedPlayer, mode: Mode, dim: Dimension, target: Vector3): Attack {
  cooldown.clearCooldown(shooter, KEY);
  const block = dim.getBlock(target);
  if (block === undefined) throw new Error(`no loaded block at ${fmt(target)}`);
  const attack = activate(shooter, mode, block, Direction.Up);
  if (attack === undefined) throw new Error(`${shooter.name} did not fire ${mode} at ${fmt(target)} from ${fmt(shooter.location)}`);
  return attack;
}

interface Outcome {
  attack: Attack;
  /** How every charge of the attack ended. */
  ends: ChargeEnd[];
  shot: ShotRecord;
  shotTick: number;
  report: Report;
  blast: BlastRec;
  explosions: (Spied & { radius: number; inSaucerStep: boolean })[];
  label: string;
}

/**
 * L0-sauc-ac03 for one charge in one phase: the charge through the hull is
 * absorbed, the fall smokes, the blast changes no block and hurts nobody, the
 * reward drops once, the shooter is named to everyone, the next arrival is
 * 15 min after the shot. Returns what the caller checks further.
 */
async function shootDown(
  test: Test,
  p: Pad,
  r: Rig,
  args: {
    shooter: SimulatedPlayer;
    witnesses: SimulatedPlayer[];
    mode: Mode;
    phase: "arrival" | "magnet" | "departure";
    at: number;
    label: string;
    /** Runs right after the shot is fired, before anything waits for it. */
    afterFire?: () => Promise<void>;
    /** Runs on the aimed column before the snapshots and the shot. */
    prepare?: (column: Vector3) => void;
    /** Fire this far in z off the column under the hull: still inside its radius. */
    aimDz?: number;
    /** How the fall must end. */
    blastBy?: "ground" | "cap";
    /** Charges of every attack, the shooter's included; the event waits for all of them to end. */
    charges?: () => number;
  }
): Promise<Outcome> {
  const { shooter, mode, phase, label } = args;
  await waitFor(test, () => r.core.session()?.phase === phase && r.core.session()!.phaseTick >= args.at, 2000, `${label}: ${phase} tick ${args.at}`);
  const { target, crossing, j } = aimUnder(r, p);
  await goTo(test, shooter, p.dim, { x: target.x, y: p.top + 1, z: target.z + SHOOTER_DZ });
  // goTo took ticks: aim again from the saucer's position now.
  const aim = aimUnder(r, p);
  args.prepare?.(aim.target);
  aim.target = { ...aim.target, z: aim.target.z + (args.aimDz ?? 0) };
  const before = snapshot(p.dim, { x: aim.target.x - COLUMN_HALF, y: p.top - 3, z: aim.target.z - COLUMN_HALF }, { x: aim.target.x + COLUMN_HALF, y: p.top + 2, z: aim.target.z + COLUMN_HALF });
  const items = watchItems();
  const hurts = watchHurts([shooter, ...args.witnesses]);
  const ends = watchEnds();
  const world0 = spyWorld();
  const sounds0 = r.sounds.length;
  const told0 = new Map([shooter, ...args.witnesses].map((pl) => [pl.name, r.inbox.get(pl.name)?.length ?? 0]));
  let attack: Attack | undefined;
  try {
    const firedTick = system.currentTick;
    attack = fire(shooter, mode, p.dim, aim.target);
    const fired = attack;
    const total = fired.charges.length;
    await args.afterFire?.();
    log(`${label} RESULT fired ${mode} attack ${attack.attackId} at ${fmt(aim.target)} in ${phase} tick ${r.core.session()?.phaseTick}; the hull expected over it in ${aim.j} ticks at ${fmt(aim.crossing)} (first aim ${fmt(target)}, j ${j}, ${fmt(crossing)})`);
    await waitFor(test, () => r.saucer.shot() !== undefined, 60, `${label}: the charge to cross the hull`);
    const shot = r.saucer.shot() as ShotRecord;
    const shotTick = shot.tick;
    await waitFor(test, () => r.core.session() === undefined, r.durations.downed + 10, `${label}: the downed fall to end`);
    await waitFor(test, () => ends.of(fired.attackId).length === total && ends.ends.length >= (args.charges?.() ?? total), 120, `${label}: every charge to end`);
    await test.idle(3);
    const own = ends.of(attack.attackId);
    const report = r.reports.at(-1);
    const blast = r.blasts.at(-1);
    if (report === undefined || blast === undefined) throw new Error(`${label}: report ${report !== undefined}, foreseen blast ${blast !== undefined}`);
    const fallSteps = r.steps.filter((s) => s.phase === "downed" && s.tick >= shotTick && s.tick <= blast.tick);
    // The blast step removes the saucer, so it reads no position; the blast point stands in for it.
    const fallYs = [...fallSteps.flatMap((s) => (s.at === undefined ? [] : [s.at.y])), ...(shot.blastAt === undefined ? [] : [shot.blastAt.y])];
    const smoke = world0.particles.filter((x) => x.id === SMOKE_PARTICLE && x.tick >= shotTick && x.tick <= blast.tick);
    const blastParticles = world0.particles.filter((x) => x.id === BLAST_PARTICLE && x.tick === blast.tick);
    const near = items.items.filter((x) => shot.blastAt !== undefined && dist(x.at, shot.blastAt) <= 2 && x.tick >= blast.tick && x.tick <= blast.tick + 1);
    const rewards = items.items.filter((x) => REWARD.some((rw) => rw.typeId === x.item));
    const hurtInBlast = hurts.hurts.filter((h) => h.tick >= blast.tick && h.tick <= blast.tick + 1);
    const healthNow = new Map([shooter, ...args.witnesses].map((pl) => [pl.name, health(pl)]));
    const dropped = [...blast.health].filter(([name, hp]) => (healthNow.get(name) ?? 0) < hp - 1e-6);
    const newSounds = r.sounds.slice(sounds0).filter((s) => s.tick >= shotTick);
    const intercepted = own.filter((e) => e.outcome === "intercepted");
    const hits = r.hullCalls.filter((c) => c.attackId === fired.attackId && c.hit);
    const latching = own.find((e) => hits.some((c) => c.slot === e.charge.slot && c.tick === shotTick));
    const message = shotMessage(shooter.name);
    const told = [shooter, ...args.witnesses].map((pl) => {
      const got = (r.inbox.get(pl.name) ?? []).slice(told0.get(pl.name) ?? 0);
      return { name: pl.name, got, ok: got.length === 1 && JSON.stringify(got[0]) === JSON.stringify(message) };
    });
    const next = r.store.get(NEXT_MS);
    const nextOff = typeof next === "number" ? next - (report.wall + PAUSE_MS) : NaN;
    log(
      `${label} RESULT shot in UFO ${shot.leg} by ${shot.ownerName} at ${fmt(shot.at)} in tick +${shotTick - firedTick} after firing; ${shot.absorbed} charge(s) absorbed of ${own.length} ended ` +
        `[${countBy(own.map((e) => e.outcome))}]; fall ${fallSteps.length} steps ${fallYs.length > 0 ? `${fallYs[0].toFixed(2)} → ${fallYs.at(-1)?.toFixed(2)}` : ""}, blast (${shot.blastBy}) at ${fmt(shot.blastAt)} ` +
        `(foreseen ${fmt(blast.predicted)}), ${blast.diff.length} block(s) changed by it, smoke ${smoke.length} calls, blast particles ${blastParticles.length}; ` +
        `reward near the blast [${near.map((x) => `${x.item.replace("minecraft:", "")}×${x.amount}`).join(" ")}], reward stacks anywhere ${rewards.length}; ` +
        `hurt in the blast ticks ${hurtInBlast.length}, health dropped ${dropped.map(([n]) => n).join(",") || "none"}; sounds after the shot [${newSounds.map((s) => s.id).join(" ")}]; ` +
        `broadcast ${told.map((t) => `${t.name}:${t.got.length}`).join(" ")}; next arrival − (shot + 15 min) = ${nextOff} ms`
    );

    // The charge: absorbed with the outcome intercepted, no column or ring effect for it.
    test.assert(latching !== undefined && latching.outcome === "intercepted", `${label}: the latching charge ended ${latching?.outcome ?? "unseen"}`);
    test.assert(intercepted.length === hits.length && hits.length >= 1, `${label}: ${intercepted.length} charges ended intercepted, the hull took ${hits.length}`);
    test.assert(own.length === total, `${label}: ${own.length} of ${total} charges ended`);
    test.assert(shot.ownerId === shooter.id && shot.ownerName === shooter.name && shot.attackId === attack.attackId, `${label}: the shot is credited to ${shot.ownerName} / ${shot.attackId}`);
    test.assert(shot.leg === (phase === "magnet" ? "hover" : phase), `${label}: shot in the ${shot.leg} leg`);
    test.assert(r.reports.filter((x) => x.info.eventId === shot.eventId).length === 1, `${label}: ${r.reports.length} shoot-down reports`);

    // The magnet off: a release only when the magnet was on, on the next UFO tick.
    const release = r.of("release").filter((x) => x.payload.eventId === shot.eventId && x.call >= report.call);
    if (phase === "magnet") test.assert(release.length === 1 && release[0].call === report.call + 1, `${label}: the release came in UFO call ${release[0]?.call}, the shot in ${report.call}`);
    else test.assert(release.length === 0, `${label}: a release after a ${phase} shot`);

    // The fall: straight down with smoke, ≤ downed steps, the saucer gone with the blast.
    test.assert(fallSteps.length >= 1 && fallSteps.length <= r.durations.downed, `${label}: ${fallSteps.length} fall steps`);
    test.assert(fallYs.length === fallSteps.length && fallYs.every((y, i) => i === 0 || y < fallYs[i - 1]), `${label}: the fall is not monotonic: ${fallYs.length} heights over ${fallSteps.length} steps`);
    test.assert(fallSteps.every((s) => s.at === undefined || flat(s.at, shot.at) < 1e-6) && shot.blastAt !== undefined && flat(shot.blastAt, shot.at) < 1e-6, `${label}: the fall is not straight down`);
    // Every step smokes but a landing one: a fall cut at the cap is airborne to its last step.
    const airborne = fallSteps.length - (shot.blastBy === "ground" ? 1 : 0);
    test.assert(smoke.length === airborne * SMOKE_PER_TICK, `${label}: ${smoke.length} smoke calls over ${airborne} airborne steps`);
    test.assert(r.saucer.entity() === undefined && r.steps.at(-1)?.at === undefined, `${label}: the saucer outlived the blast`);

    // The blast: where the product's arithmetic put it, harmless, heard once.
    test.assert(r.unforeseen.length === 0, `${label}: a blast in a step the fall arithmetic did not foresee (ticks ${r.unforeseen.join(",")})`);
    test.assert(shot.blastAt !== undefined && dist(shot.blastAt, blast.predicted) < 1e-6, `${label}: blast at ${fmt(shot.blastAt)}, foreseen ${fmt(blast.predicted)}`);
    test.assert(shot.blastBy === (args.blastBy ?? "ground"), `${label}: the fall ended by ${shot.blastBy}, not ${args.blastBy ?? "ground"}`);
    test.assert(blast.diff.length === 0, `${label}: the blast changed ${blast.diff.length} block(s): ${blast.diff.slice(0, 4).join(" ")}`);
    test.assert(blastParticles.length === 1 && shot.blastAt !== undefined && dist(blastParticles[0].at, shot.blastAt) < 1e-6, `${label}: ${blastParticles.length} blast particles`);
    test.assert(world0.explosions.filter((x) => x.inSaucerStep).length === 0, `${label}: a createExplosion inside a saucer step`);
    test.assert(hurtInBlast.length === 0 && dropped.length === 0, `${label}: hurt in the blast: ${hurtInBlast.map((h) => `${h.name} ${h.cause} ${h.damage}`).join(", ")}; health dropped: ${dropped.map(([n]) => n).join(",")}`);
    const blastSounds = newSounds.filter((s) => s.id === UFO_SOUNDS.blast);
    test.assert(blastSounds.length === 1 && blastSounds[0].tick === blast.tick, `${label}: ${blastSounds.length} blast sounds`);
    const offs = newSounds.filter((s) => s.id === UFO_SOUNDS.off).length;
    test.assert(offs === (phase === "magnet" ? 1 : 0), `${label}: ${offs} magnet-off sounds after a ${phase} shot`);

    // The reward: exactly 8 diamonds and 1 totem, two item entities at the blast, nothing else of the kind.
    const sum = (id: string): number => near.filter((x) => x.item === id).reduce((n, x) => n + x.amount, 0);
    test.assert(near.length === 2 && sum("minecraft:diamond") === 8 && sum("minecraft:totem_of_undying") === 1, `${label}: near the blast ${near.map((x) => `${x.item}×${x.amount}`).join(" ") || "nothing"}`);
    test.assert(rewards.length === 2, `${label}: ${rewards.length} diamond/totem stacks spawned in the whole event`);

    // The broadcast to every player, naming the owner of the charge.
    test.assert(told.every((t) => t.ok), `${label}: broadcast ${told.map((t) => `${t.name} ${JSON.stringify(t.got)}`).join("; ")}`);

    // The schedule: the next arrival 15 min after the shot, untouched by the end of the fall.
    test.assert(Math.abs(nextOff) <= 1000, `${label}: the next arrival is ${nextOff} ms off shot + 15 min`);
    test.assert(r.core.lastEnd()?.reason === "downed" && r.core.lastEnd()?.eventId === shot.eventId, `${label}: the event ended by ${r.core.lastEnd()?.reason}`);
    test.assert(interceptorCount() === 0, `${label}: ${interceptorCount()} interceptor(s) left after the blast`);

    if (mode === "lmb") {
      const after = snapshot(p.dim, { x: aim.target.x - COLUMN_HALF, y: p.top - 3, z: aim.target.z - COLUMN_HALF }, { x: aim.target.x + COLUMN_HALF, y: p.top + 2, z: aim.target.z + COLUMN_HALF });
      const diff = changed(before, after);
      test.assert(diff.length === 0, `${label}: ${diff.length} block(s) changed in the 13 × 13 column under the saucer: ${diff.slice(0, 4).join(" ")}`);
    }
    return { attack, ends: own, shot, shotTick, report, blast, explosions: world0.explosions, label };
  } finally {
    items.stop();
    hurts.stop();
    ends.stop();
    world0.restore();
  }
}

function shotMessage(name: string): RawMessage {
  return { rawtext: [{ translate: SHOT_DOWN_TEXT, with: [name] }] };
}

function countBy(xs: string[]): string {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m].map(([k, n]) => `${k}×${n}`).join(" ") || "none";
}

/**
 * R-sauc-1 on the engine's own numbers: every charge of `attack` the flight
 * offered to the hull is taken exactly when its column was within the radius
 * of where the saucer stood and its step overlapped the band — checked with
 * this test's arithmetic, not the product's — and the position the hull read
 * is where the engine had the entity.
 */
function checkHullCalls(test: Test, r: Rig, attack: Attack, ends: ChargeEnd[], label: string): { taken: number; flew: number } {
  const calls = r.hullCalls.filter((c) => c.attackId === attack.attackId);
  const bySlot = new Map<number, HullCall[]>();
  for (const c of calls) bySlot.set(c.slot, [...(bySlot.get(c.slot) ?? []), c]);
  let taken = 0;
  let flew = 0;
  const wrong: string[] = [];
  for (const end of ends) {
    const list = bySlot.get(end.charge.slot) ?? [];
    const should = list.find((c) => {
      if (c.saucer === undefined) return false;
      const d = Math.hypot(c.column.x + 0.5 - c.saucer.x, c.column.z + 0.5 - c.saucer.z);
      return d <= HULL_RADIUS && Math.max(c.from.y, c.to.y) >= c.saucer.y && Math.min(c.from.y, c.to.y) <= c.saucer.y + HULL_HEIGHT;
    });
    const hit = list.find((c) => c.hit);
    if (end.outcome === "intercepted") taken++;
    else flew++;
    if ((end.outcome === "intercepted") !== (should !== undefined) || hit !== should) wrong.push(`slot ${end.charge.slot} ${end.outcome}, should ${should === undefined ? "fly" : `stop at ${should.tick}`}`);
  }
  const offEntity = calls.filter((c) => c.saucer !== undefined && c.entity !== undefined && dist(c.saucer, c.entity) > 0.01);
  log(`${label} RESULT hull calls ${calls.length} over ${ends.length} charges: taken ${taken}, flew on ${flew}, disagreeing ${wrong.length}, read off the entity ${offEntity.length}`);
  test.assert(wrong.length === 0, `${label}: the hull disagrees with R-sauc-1 on ${wrong.length} charge(s): ${wrong.slice(0, 4).join("; ")}`);
  test.assert(offEntity.length === 0, `${label}: the hull read a position ${offEntity.length} time(s) away from the entity`);
  return { taken, flew };
}

// ------------------------------------------- AC#2: LMB and RMB in each phase

const MOVING: UfoDurations = { arrival: 400, magnet: 60, departure: 300, downed: 60 };
const HOVERING: UfoDurations = { arrival: 60, magnet: 400, departure: 60, downed: 60 };

async function phaseScenario(test: Test, phase: "arrival" | "magnet" | "departure", k: number): Promise<void> {
  const p = await pad(test, `andrew_gt_shoot_${phase.slice(0, 3)}`, k);
  // B is the target, at the centre; A shoots from SHOOTER_DZ out. In the magnet B holds iron and is lifted.
  const [b, a] = await sims(test, p, phase.slice(0, 3), [
    [0, 0],
    [0, SHOOTER_DZ],
  ]);
  arm(a);
  const durations = phase === "magnet" ? HOVERING : MOVING;
  // θ = π: in from −x, out towards +x, along the loaded corridor.
  const r = rig({ durations, theta01: 0.5, players: [b, a], magnet: phase === "magnet" });
  const lmb = useEffect("lmb", PENETRATOR_EFFECT);
  const rmb = useEffect("rmb", RING_EFFECT);
  const at = phase === "arrival" ? 300 : phase === "departure" ? 95 : 1;
  // ufsd: in the arrival also a shot over a pit to bedrock, where no ground is within the 60 fall steps.
  const cases: { mode: Mode; pit: boolean }[] = [
    { mode: "lmb", pit: false },
    { mode: "rmb", pit: false },
    ...(phase === "arrival" ? [{ mode: "lmb" as const, pit: true }] : []),
  ];
  try {
    for (const { mode, pit } of cases) {
      const label = `${phase}_${mode}${pit ? "_pit" : ""}`;
      await goTo(test, b, p.dim, { x: p.cx, y: p.top + 1, z: p.cz });
      let iron: Entity | undefined;
      if (phase === "magnet") {
        b.getComponent("minecraft:inventory")?.container?.setItem(0, new ItemStack("minecraft:iron_ingot", 1));
        b.selectedSlotIndex = 0;
        iron = p.dim.spawnItem(new ItemStack("minecraft:iron_nugget", 1), { x: p.cx + 8.5, y: p.top + 1, z: p.cz - 6.5 });
      }
      await test.idle(5);
      test.assert(r.core.command("come", b.id).ok, `${label}: come was refused`);
      await waitFor(test, () => r.core.session()?.phase === "arrival", 5, `${label}: the arrival`);
      const centre = r.core.session()?.centre;
      test.assert(centre !== undefined && centre.x === p.cx && centre.y === p.top && centre.z === p.cz, `${label}: centre ${fmt(centre)}`);
      // A moving-leg salvo lands about 10 out on the arrival's side (−x) or the departure's (+x): B stands clear of its rings.
      if (phase !== "magnet") await goTo(test, b, p.dim, { x: p.cx + (phase === "arrival" ? 12 : -12), y: p.top + 1, z: p.cz - 12 });
      const rmbBlasts = rmb.calls.length;
      const lmbBlasts = lmb.calls.length;
      const out = await shootDown(test, p, r, {
        shooter: a,
        witnesses: [b],
        mode,
        phase,
        at,
        label,
        ...(pit
          ? {
              prepare: (col: Vector3) => fill(p.dim, { x: col.x - 2, y: p.dim.heightRange.min + 1, z: col.z - 2 }, { x: col.x + 2, y: p.top, z: col.z + 2 }, "minecraft:air"),
              aimDz: 4,
              blastBy: "cap" as const,
            }
          : {}),
      });
      if (pit) test.assert(out.shot.blastAt !== undefined && out.shot.blastAt.y < p.top && out.shot.blastAt.y > p.dim.heightRange.min + 1, `${label}: the cap blast at ${fmt(out.shot.blastAt)} is not inside the pit`);
      checkHullCalls(test, r, out.attack, out.ends, label);
      const own = (mode === "lmb" ? lmb : rmb).calls.filter((c) => c.attackId === out.attack.attackId);
      if (mode === "lmb") test.assert(own.length === 0 && lmb.calls.length === lmbBlasts, `${label}: the absorbed LMB charge detonated (${own.length})`);
      else {
        // as06: the columns the hull did not take detonate as rings; none the hull took does.
        await test.idle(40);
        const taken = new Set(r.hullCalls.filter((c) => c.attackId === out.attack.attackId && c.hit).map((c) => `${c.column.x},${c.column.z}`));
        const blasted = rmb.calls.slice(rmbBlasts).filter((c) => c.attackId === out.attack.attackId);
        const overlap = blasted.filter((c) => taken.has(`${c.point.x},${c.point.z}`));
        log(`${label} RESULT salvo: ${taken.size} column(s) taken by the hull, ${blasted.length} detonated as rings, ${overlap.length} both`);
        test.assert(taken.size >= 1 && overlap.length === 0 && blasted.length + taken.size === layout(out.attack.target).length, `${label}: taken ${taken.size}, detonated ${blasted.length}, both ${overlap.length}, layout ${layout(out.attack.target).length}`);
      }
      if (phase === "magnet") {
        const view = r.magnet?.view();
        const summary = r.magnet?.lastSummary();
        const lifted = out.report.players.get(b.name);
        log(`${label} RESULT magnet: B at ${fmt(lifted)} at the shot, now ${fmt(b.location)}; released by ${summary?.reason}, ${summary?.held} element(s) held, up to ${summary?.maxPulled} player(s) pulled`);
        test.assert(lifted !== undefined && lifted.y > p.top + 3, `${label}: B was not lifted at the shot (${fmt(lifted)})`);
        test.assert(view === undefined && summary?.reason === "release" && summary.eventId === out.shot.eventId, `${label}: the magnet is ${view === undefined ? "off" : "on"}, released by ${summary?.reason}`);
        test.assert((summary?.maxPulled ?? 0) >= 1 && (summary?.held ?? 0) >= 1, `${label}: the magnet pulled ${summary?.maxPulled} player(s) and held ${summary?.held} element(s) before the shot`);
        test.assert(iron === undefined || !iron.isValid || iron.location.y < p.top + 6, `${label}: the held nugget did not fall (${iron?.isValid ? fmt(iron.location) : "gone"})`);
      }
      // Ready for the next event: clear what the shot left and wait out B's landing.
      await waitFor(test, () => Math.abs(b.location.y - (p.top + 1)) < 0.01, 200, `${label}: B to land`);
      for (const e of p.dim.getEntities({ type: "minecraft:item", location: { x: p.cx - PAD_X, y: p.dim.heightRange.min, z: p.cz - PAD_Z }, volume: { x: 2 * PAD_X, y: 100, z: 2 * PAD_Z } })) e.remove();
      b.getComponent("minecraft:inventory")?.container?.clearAll();
      b.addEffect("instant_health", 1, { amplifier: 4, showParticles: false });
    }
  } finally {
    lmb.restore();
    rmb.restore();
    r.stop();
    p.unload();
  }
  test.succeed();
}

registerAsync("andrew", "ufo_shootdown_arrival", (test: Test) => phaseScenario(test, "arrival", 0))
  .structureName(STRUCTURE)
  .maxTicks(2200)
  .tag("andrew");

registerAsync("andrew", "ufo_shootdown_magnet", (test: Test) => phaseScenario(test, "magnet", 1))
  .structureName(STRUCTURE)
  .maxTicks(1000)
  .tag("andrew");

registerAsync("andrew", "ufo_shootdown_departure", (test: Test) => phaseScenario(test, "departure", 2))
  .structureName(STRUCTURE)
  .maxTicks(2600)
  .tag("andrew");

// ------------------------------------------- AC#3: one reward per event; the salvo's outer rings go off

registerAsync("andrew", "ufo_shootdown_once", async (test: Test): Promise<void> => {
  const p = await pad(test, "andrew_gt_shoot_one", 3);
  // B the target at the centre; A fires the rings from +z; C fires a penetrator from −x two ticks later.
  const [b, a, c] = await sims(test, p, "one", [
    [0, 0],
    [0, SHOOTER_DZ],
    [-SHOOTER_DZ, 0],
  ]);
  arm(a);
  arm(c);
  const r = rig({ durations: HOVERING, theta01: 0.5, players: [b, a, c] });
  const lmb = useEffect("lmb", PENETRATOR_EFFECT);
  const rmb = useEffect("rmb", RING_EFFECT);
  let second: Attack | undefined;
  try {
    test.assert(r.core.command("come", b.id).ok, "come was refused");
    const out = await shootDown(test, p, r, {
      shooter: a,
      witnesses: [b, c],
      mode: "rmb",
      phase: "magnet",
      at: 1,
      label: "once",
      afterFire: async () => {
        await test.idle(2);
        second = fire(c, "lmb", p.dim, { x: p.cx, y: p.top, z: p.cz });
      },
      charges: () => layout({ x: 0, z: 0 }).length + 1,
    });
    if (second === undefined) throw new Error("C did not fire");
    const late = second;
    const { taken } = checkHullCalls(test, r, out.attack, out.ends, "once");
    const lateHit = r.hullCalls.find((x) => x.attackId === late.attackId && x.hit);
    const lmbOwn = lmb.calls.filter((x) => x.attackId === late.attackId);

    // The salvo: every column within the hull's radius of the axis was taken in the shot tick, every other went off at its ring's power.
    const target = out.attack.target;
    const offsets = layout({ x: 0, z: 0 });
    const inside = new Set(offsets.filter((o) => Math.hypot(o.x, o.z) <= HULL_RADIUS).map((o) => `${o.x},${o.z}`));
    const takenCols = new Set(r.hullCalls.filter((x) => x.attackId === out.attack.attackId && x.hit).map((x) => `${x.column.x - target.x},${x.column.z - target.z}`));
    const takenInShot = r.hullCalls.filter((x) => x.attackId === out.attack.attackId && x.hit && x.tick === out.shotTick).length;
    const detonated = rmb.calls.filter((x) => x.attackId === out.attack.attackId).map((x) => `${x.point.x - target.x},${x.point.z - target.z}`);
    const blasts = out.explosions.filter((x) => !x.inSaucerStep);
    const wrongPower = blasts.filter((x) => x.radius !== powerAtOffset(Math.floor(x.at.x) - target.x, Math.floor(x.at.z) - target.z));
    const byPower = countBy(blasts.map((x) => `power ${x.radius}`));
    log(
      `once RESULT salvo ${offsets.length} columns: ${takenCols.size} taken (all in the shot tick: ${takenInShot}), inside the radius ${inside.size}; ` +
        `${detonated.length} detonated, ${blasts.length} explosions [${byPower}], ${wrongPower.length} off their ring's power; ` +
        `C's charge ${late.attackId} taken in tick ${lateHit?.tick} (shot ${out.shotTick}) with the hull at ${fmt(lateHit?.saucer)}, onDetonate ${lmbOwn.length}; hull absorbed ${out.shot.absorbed}`
    );
    test.assert(takenCols.size === inside.size && [...inside].every((k) => takenCols.has(k)), `the hull took ${[...takenCols].join(" ")}, the radius holds ${[...inside].join(" ")}`);
    test.assert(takenInShot === inside.size && takenInShot >= 2, `${takenInShot} charges crossed in the shot tick: one reward needs two at once to mean anything`);
    test.assert(detonated.length === offsets.length - inside.size && detonated.every((k) => !inside.has(k)), `${detonated.length} detonated; an intercepted offset among them: ${detonated.filter((k) => inside.has(k)).join(" ")}`);
    test.assert(blasts.length === detonated.length && wrongPower.length === 0, `${blasts.length} explosions for ${detonated.length} detonations, ${wrongPower.length} off their ring's power`);

    // The second charge: through the falling hull, absorbed, no second reward, broadcast or report (as05, r004).
    test.assert(lateHit !== undefined && lateHit.tick > out.shotTick && lateHit.saucer !== undefined && lateHit.saucer.y < out.shot.at.y, `C's charge was not taken by the falling hull (hit ${lateHit?.tick}, hull ${fmt(lateHit?.saucer)})`);
    test.assert(lmbOwn.length === 0, "C's absorbed charge detonated");
    test.assert(out.shot.absorbed === taken + 1, `the hull counted ${out.shot.absorbed}, the salvo ${taken} and C 1`);
    test.assert(r.reports.length === 1 && r.reports[0].info.ownerId === a.id, `${r.reports.length} reports, the first for ${r.reports[0]?.info.ownerName}`);
    for (const pl of [a, b, c]) {
      const got = r.inbox.get(pl.name) ?? [];
      test.assert(got.length === 1 && JSON.stringify(got[0]) === JSON.stringify(shotMessage(a.name)), `${pl.name} got ${JSON.stringify(got)}`);
    }

    // Control for "the blast changed no block": the same probe around the same point sees a real explosion.
    const point = out.shot.blastAt;
    if (point === undefined) throw new Error("no blast point");
    await goTo(test, b, p.dim, { x: p.cx + 12, y: p.top + 1, z: p.cz - 12 });
    const before = cubeAround(p.dim, point, BLAST_HALF);
    p.dim.createExplosion(point, 4, { breaksBlocks: true });
    const control = changed(before, cubeAround(p.dim, point, BLAST_HALF));
    log(`once RESULT control: createExplosion power 4 at the blast point changes ${control.length} block(s) in the same ${2 * BLAST_HALF + 1}³ probe`);
    test.assert(control.length > 0, "control: the blast-area probe did not see a real explosion");
  } finally {
    lmb.restore();
    rmb.restore();
    r.stop();
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ------------------------------------------- AC#4: the seam is additive; without a saucer nothing is asked

registerAsync("andrew", "ufo_shootdown_seam", async (test: Test): Promise<void> => {
  const p = await pad(test, "andrew_gt_shoot_seam", 4);
  const [a] = await sims(test, p, "seam", [[0, SHOOTER_DZ]]);
  arm(a);
  const ends = watchEnds();
  const warnings: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]): void => {
    warnings.push(args.map(String).join(" "));
    original(...args);
  };
  const dig = useEffect("lmb", PENETRATOR_EFFECT);
  let r: Rig | undefined;
  const unregs: Array<() => void> = [];
  const column = (t: Vector3): Snapshot => snapshot(p.dim, { x: t.x - 3, y: p.top - 3, z: t.z - 3 }, { x: t.x + 3, y: p.top, z: t.z + 3 });
  const shoot = async (t: Vector3, label: string): Promise<{ attack: Attack; end: ChargeEnd; diff: string[]; ready: boolean }> => {
    const before = column(t);
    const attack = fire(a, "lmb", p.dim, t);
    const ready = cooldown.isReady(a, KEY);
    await waitFor(test, () => ends.of(attack.attackId).length === 1, 120, `${label}: the charge to end`);
    await test.idle(30);
    const end = ends.of(attack.attackId)[0];
    const diff = changed(before, column(t));
    log(`seam RESULT ${label}: ${attack.attackId} ended ${end.outcome}${end.point === undefined ? "" : ` at ${fmt(end.point)}`}, ${diff.length} block(s) changed in its column, cooldown started ${!ready}`);
    return { attack, end, diff, ready };
  };
  try {
    test.assert(interceptorCount() === 0, `${interceptorCount()} interceptor(s) registered before the scenario`);
    const t1 = { x: p.cx - 8, y: p.top, z: p.cz };
    const t2 = { x: p.cx, y: p.top, z: p.cz };
    const t3 = { x: p.cx + 8, y: p.top, z: p.cz };
    // Clear of the shafts the control and the throw dig.
    const t4 = { x: p.cx + 4, y: p.top, z: p.cz + 5 };
    const plane = p.top + 30;

    // A stub hull: a plane 30 over the target, in that column only.
    const seen: { attack: Attack; from: Vector3; to: Vector3 }[] = [];
    const offStub = registerInterceptor((attack, charge, from, to) => {
      if (charge.x !== t1.x || charge.z !== t1.z) return false;
      seen.push({ attack, from: { ...from }, to: { ...to } });
      return Math.max(from.y, to.y) >= plane && Math.min(from.y, to.y) <= plane;
    });
    unregs.push(offStub);
    const stubbed = await shoot(t1, "stub");
    const crossing = seen.at(-1);
    test.assert(stubbed.end.outcome === "intercepted" && stubbed.end.point === undefined, `stub: the charge ended ${stubbed.end.outcome}`);
    test.assert(crossing !== undefined && crossing.from.y >= plane && crossing.to.y <= plane, `stub: taken on ${fmt(crossing?.from)} → ${fmt(crossing?.to)}, not across y ${plane}`);
    test.assert(crossing?.attack.ownerId === a.id && crossing.attack.ownerName === a.name, `stub: the attack carries ${crossing?.attack.ownerId} / ${crossing?.attack.ownerName}`);
    test.assert(dig.calls.filter((x) => x.attackId === stubbed.attack.attackId).length === 0, "stub: onDetonate ran for an intercepted charge");
    test.assert(stubbed.diff.length === 0, `stub: ${stubbed.diff.length} block(s) changed under an intercepted charge`);
    test.assert(!stubbed.ready, "stub: the cooldown did not start");
    offStub();
    test.assert(interceptorCount() === 0, "the stub is still registered");

    // Control: the same shot with the stub gone digs its column.
    const control = await shoot(t2, "control");
    test.assert(control.end.outcome === "detonated" && control.end.point !== undefined && control.end.point.y === p.top, `control: the charge ended ${control.end.outcome} at ${fmt(control.end.point)}`);
    test.assert(dig.calls.filter((x) => x.attackId === control.attack.attackId).length === 1 && control.diff.length > 0, `control: onDetonate ×${dig.calls.filter((x) => x.attackId === control.attack.attackId).length}, ${control.diff.length} blocks dug`);

    // A throwing interceptor: logged once, and the charge detonates as without one.
    const offThrow = registerInterceptor(() => {
      throw new Error("seam probe throws");
    });
    unregs.push(offThrow);
    const w0 = warnings.length;
    const thrown = await shoot(t3, "throw");
    offThrow();
    const lines = warnings.slice(w0).filter((w) => w.includes("an interceptor threw") && w.includes("seam probe throws"));
    test.assert(thrown.end.outcome === "detonated" && thrown.diff.length > 0, `throw: the charge ended ${thrown.end.outcome}, ${thrown.diff.length} blocks dug`);
    test.assert(lines.length === 1, `throw: logged ${lines.length} times`);
    dig.restore();

    // The saucer's hull: no saucer, no call; a saucer, asked and declining a charge far from it; gone with the saucer.
    const stub = useEffect("lmb", STUB_EFFECTS.lmb);
    try {
      r = rig({ durations: MOVING, theta01: 0.5, players: [a] });
      test.assert(interceptorCount() === 0, "the hull is registered before any saucer");
      const none = await shoot(t4, "no saucer");
      test.assert(none.end.outcome === "detonated" && r.hullCalls.length === 0, `no saucer: ${r.hullCalls.length} hull calls, the charge ${none.end.outcome}`);
      test.assert(r.core.command("come", a.id).ok, "come was refused");
      await waitFor(test, () => r?.core.session()?.phase === "arrival", 5, "the arrival");
      await test.idle(5);
      test.assert(interceptorCount() === 1, `${interceptorCount()} interceptor(s) with the saucer up`);
      const far = await shoot(t4, "saucer far away");
      const farCalls = r.hullCalls.filter((x) => x.attackId === far.attack.attackId);
      test.assert(far.end.outcome === "detonated" && farCalls.length > 0 && farCalls.every((x) => !x.hit), `far: ${farCalls.length} hull calls, the charge ${far.end.outcome}`);
      test.assert(r.core.command("stop").ok, "stop was refused");
      await waitFor(test, () => r?.core.session() === undefined, 5, "the stop");
      test.assert(interceptorCount() === 0, `${interceptorCount()} interceptor(s) after the stop`);
      const calls = r.hullCalls.length;
      const after = await shoot(t4, "after the stop");
      test.assert(after.end.outcome === "detonated" && r.hullCalls.length === calls, `after the stop: ${r.hullCalls.length - calls} hull calls, the charge ${after.end.outcome}`);
      test.assert(r.saucer.shot() === undefined && r.reports.length === 0, "a shoot-down without a hit");
    } finally {
      stub.restore();
    }
  } finally {
    console.warn = original;
    for (const off of unregs) off();
    dig.restore();
    ends.stop();
    r?.stop();
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");
