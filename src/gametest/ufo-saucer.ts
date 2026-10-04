// The UFO saucer (src/ufo/saucer.ts, L0-sauc) on a real engine: the §2 path at
// the real phase lengths (L0-sauc-ac01), the beam property and the §7 sounds
// against the phases (ac05), and §7 / AC-16 — nothing moves or hurts it (ac02).
//
// Every scenario builds the product core with the product saucer over a test
// env (L0-ufoc-ad01) on a pad of its own, far from the test origin, inside a
// ticking area over the ±100-block corridor the saucer flies: simulated players
// load no chunks. Event ids carry the scope "gs", which no other core removes.

import { BlockPermutation, BlockVolume, type Dimension, type Entity, EntityDamageCause, GameMode, type Vector3, system, world } from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { startUfo } from "../ufo";
import { FIRST_MAX_MS, FIRST_MIN_MS, PAUSE_MS, PHASE_TICKS, type UfoDurations, type UfoEnv, type UfoPlayer, overworldCandidates } from "../ufo/env";
import {
  EVENT_TAG,
  IDLE_CHECK_TICKS,
  type IntervalHost,
  type Phase,
  type PhasePayload,
  SAUCER_ID,
  type Saucer,
  UFO_FAMILY,
  UfoCore,
  centreUnder,
  horizontalDistance,
  hoverHeight,
} from "../ufo/event";
import { NEXT_MS } from "../ufo/schedule";
import {
  APPROACH_DISTANCE,
  ARRIVAL_BEARINGS,
  BEAM_LEN_PROPERTY,
  BEAM_PROPERTY,
  HUM_TICKS,
  LEG_ABOVE_HOVER,
  REACH_MARGIN,
  UFO_SOUNDS,
  type UfoSaucer,
  type UfoSound,
  arrivalBearing,
  beamLength,
  createSaucer,
  flightPath,
  legHeight,
  playUfoSound,
  tickingIn,
  tickingReach,
} from "../ufo/saucer";
import { goTo } from "./orbital-core";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const SCOPE = "gs";
const STAND: Vector3 = { x: 3, y: 2, z: 3 };
/** −x like the magnet pads, a row further out in z; 300 apart so the ±100 corridors never overlap. */
const SITE_DX = -1200;
const SITE_STEP = -300;
const SITE_DZ = 1600;
const PAD_HALF = 8;
const CORRIDOR = 100;
const CORRIDOR_HALF_WIDTH = 8;

const log = (msg: string): void => console.warn(`[gametest] ufo saucer ${msg}`);
const fmt = (v: Vector3 | undefined): string => (v === undefined ? "none" : `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const dist = (a: Vector3, b: Vector3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

// ---------------------------------------------------------------- the pad

interface Pad {
  dim: Dimension;
  cx: number;
  cz: number;
  /** The floor's top block; the target stands on it, so it is the event's centre. */
  top: number;
  unload: () => void;
}

async function pad(test: Test, name: string, k: number): Promise<Pad> {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const cx = origin.x + SITE_DX + SITE_STEP * k;
  const cz = origin.z + SITE_DZ;
  const top = dim.heightRange.min + 12;
  const unload = await loadBox(test, dim, name, { min: [cx - CORRIDOR, 0, cz - CORRIDOR_HALF_WIDTH], max: [cx + CORRIDOR, 0, cz + CORRIDOR_HALF_WIDTH] });
  // A repeat of the scenario finds its own craters and leftovers here.
  for (const e of dim.getEntities({ location: { x: cx + 0.5, y: top, z: cz + 0.5 }, maxDistance: 24 })) if (e !== undefined && e.isValid && e.typeId !== "minecraft:player") e.remove();
  dim.fillBlocks(new BlockVolume({ x: cx - PAD_HALF, y: top - 2, z: cz - PAD_HALF }, { x: cx + PAD_HALF, y: top, z: cz + PAD_HALF }), "minecraft:stone");
  dim.fillBlocks(new BlockVolume({ x: cx - PAD_HALF, y: top + 1, z: cz - PAD_HALF }, { x: cx + PAD_HALF, y: top + 16, z: cz + PAD_HALF }), "minecraft:air");
  return { dim, cx, cz, top, unload };
}

async function players(test: Test, p: Pad, label: string, spots: ReadonlyArray<readonly [number, number]>): Promise<SimulatedPlayer[]> {
  const out: SimulatedPlayer[] = [];
  for (const [i, [dx, dz]] of spots.entries()) {
    const sp = test.spawnSimulatedPlayer(STAND, `sauc_${label}_${i}`, GameMode.Survival);
    out.push(sp);
    await goTo(test, sp, p.dim, { x: p.cx + dx, y: p.top + 1, z: p.cz + dz });
  }
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

interface Sample {
  /** The UFO interval call this step ran in. */
  call: number;
  phase: string | undefined;
  /** The entity before the step teleported it: where the engine left it after the last tick. */
  before: Vector3 | undefined;
  after: Vector3 | undefined;
  scripted: Vector3 | undefined;
  beam: unknown;
}

interface PhaseRec {
  phase: Phase;
  payload: PhasePayload;
  call: number;
  at: Vector3 | undefined;
  /** The engine's read of the property; a write lands a tick after it is made. */
  beam: unknown;
  /** The saucer's own state: the magnet is on. */
  magnetOn: boolean;
  len: unknown;
  /** UFO saucers in the Overworld right after the saucer heard the phase. */
  saucers: number;
}

interface SoundRec {
  id: UfoSound;
  call: number;
  phase: string | undefined;
  at: Vector3;
}

interface Rig {
  core: UfoCore;
  saucer: UfoSaucer;
  samples: Sample[];
  phases: PhaseRec[];
  sounds: SoundRec[];
  /** Every line the core logged. */
  logs: string[];
  /** Arrival notices by player name. */
  notices: Map<string, number>;
  store: MemoryStore;
  calls(): number;
  of(phase: Phase): PhaseRec[];
  stop(): void;
}

function saucersInOverworld(): number {
  return world
    .getDimension("overworld")
    .getEntities({ type: SAUCER_ID })
    .filter((e) => e !== undefined && e.isValid).length;
}

function rig(opts: { durations: UfoDurations; theta01: number; ceiling: () => number; players: SimulatedPlayer[] }): Rig {
  const overworld = (): Dimension => world.getDimension("overworld");
  let calls = 0;
  const samples: Sample[] = [];
  const phases: PhaseRec[] = [];
  const sounds: SoundRec[] = [];
  const logs: string[] = [];
  const notices = new Map<string, number>();
  const store = new MemoryStore();
  let core: UfoCore | undefined;
  const env: UfoEnv = {
    now: () => Date.now(),
    durations: opts.durations,
    pauseMs: PAUSE_MS,
    firstMinMs: FIRST_MIN_MS,
    firstMaxMs: FIRST_MAX_MS,
    overworldPlayers: (): UfoPlayer[] =>
      overworldCandidates(opts.players).map((p) => ({ id: p.id, name: p.name, location: p.location, sendMessage: () => void notices.set(p.name, (notices.get(p.name) ?? 0) + 1) })),
    random: () => 0,
    store,
    ceiling: opts.ceiling,
    log: (msg) => {
      logs.push(msg);
      console.warn(`[gametest] ${msg}`);
    },
  };
  // The product saucer; its sound hook is the counted wrapper around the product playUfoSound.
  const saucer = createSaucer({
    overworld,
    random: () => opts.theta01,
    durations: opts.durations,
    ceiling: opts.ceiling,
    log: env.log,
    sound: (id, at) => {
      sounds.push({ id, call: calls, phase: core?.session()?.phase, at: { ...at } });
      playUfoSound(overworld(), id, at);
    },
  });
  const recording: Saucer = {
    onPhase: (phase, payload) => saucer.onPhase(phase, payload),
    saucerStep: (tick) => {
      const before = saucer.entity()?.location;
      saucer.saucerStep(tick);
      const e = saucer.entity();
      samples.push({ call: calls, phase: core?.session()?.phase, before, after: e?.location, scripted: saucer.saucerPosition(), beam: e?.getProperty(BEAM_PROPERTY) });
    },
    saucerPosition: () => saucer.saucerPosition(),
  };
  const recorder = {
    onPhase: (phase: Phase, payload: PhasePayload): void => {
      const e = saucer.entity();
      phases.push({
        phase,
        payload,
        call: calls,
        at: e?.location,
        beam: e?.getProperty(BEAM_PROPERTY),
        magnetOn: saucer.beamOn(),
        len: e?.getProperty(BEAM_LEN_PROPERTY),
        saucers: saucersInOverworld(),
      });
    },
  };
  const host: IntervalHost = {
    runInterval: (callback, tickInterval) =>
      system.runInterval(() => {
        calls++;
        callback();
      }, tickInterval),
    clearRun: (id) => system.clearRun(id),
  };
  core = new UfoCore(env, { scope: SCOPE, saucer: recording, listeners: [recorder] });
  const undo = startUfo(core, world, host);
  return {
    core,
    saucer,
    samples,
    phases,
    sounds,
    logs,
    notices,
    store,
    calls: () => calls,
    of: (phase) => phases.filter((x) => x.phase === phase),
    stop: () => {
      undo();
      saucer.entity()?.remove();
    },
  };
}

async function waitFor(test: Test, cond: () => boolean, ticks: number, label: string): Promise<number> {
  for (let t = 0; t <= ticks; t++) {
    if (cond()) return t;
    await test.idle(1);
  }
  throw new Error(`${label}: not within ${ticks} ticks`);
}

/** The worst distance, over samples[from…], between where the engine left the saucer and where the step before put it. */
function worstDrift(samples: readonly Sample[], from: number): number {
  let worst = 0;
  for (let i = Math.max(1, from); i < samples.length; i++) {
    const prev = samples[i - 1].scripted;
    const now = samples[i].before;
    if (prev === undefined || now === undefined) continue;
    worst = Math.max(worst, dist(prev, now));
  }
  return worst;
}

/** L0-sauc-ac01: the departure's last point on the bearing opposite the spawn. */
function bearingDot(centre: Vector3, a: Vector3, b: Vector3): number {
  const mx = centre.x + 0.5;
  const mz = centre.z + 0.5;
  const la = Math.hypot(a.x - mx, a.z - mz);
  const lb = Math.hypot(b.x - mx, b.z - mz);
  return ((a.x - mx) * (b.x - mx) + (a.z - mz) * (b.z - mz)) / (la * lb);
}

// ------------------------------------------- AC#1 + AC#3: the path, the beam and the sounds at the real phase lengths

const MAX_STEP = 0.5;
const MAX_OUT = 100;

registerAsync("andrew", "ufo_saucer_flight", async (test: Test): Promise<void> => {
  const p = await pad(test, "andrew_gt_sauc_f", 0);
  // θ = π: in from −x, out towards +x along the loaded corridor.
  const sims = await players(test, p, "f", [
    [0, 0],
    [2, -2],
  ]);
  const r = rig({ durations: PHASE_TICKS, theta01: 0.5, ceiling: () => p.dim.heightRange.max, players: sims });
  try {
    test.assert(r.core.command("come", sims[0].id).ok, "come was refused");
    const D = PHASE_TICKS;
    await waitFor(test, () => r.of("pause").length === 1, D.arrival + D.magnet + D.departure + 20, "the event to end");
    await test.idle(60);
    const [arrival] = r.of("arrival");
    const [magnet] = r.of("magnet");
    const [release] = r.of("release");
    const [departure] = r.of("departure");
    const [pause] = r.of("pause");
    test.assert(
      [arrival, magnet, release, departure, pause].every((x) => x !== undefined),
      `phases ${r.phases.map((x) => x.phase).join(" → ")}`
    );
    const { centre, hoverY, eventId } = arrival.payload;
    const hover: Vector3 = { x: centre.x + 0.5, y: hoverY, z: centre.z + 0.5 };
    test.assert(centre.y === p.top && centre.x === p.cx && centre.z === p.cz, `centre ${fmt(centre)}, not the pad's ${p.cx},${p.top},${p.cz}`);
    test.assert(hoverY === centre.y + 40, `hoverY ${hoverY}, not centre + 40`);
    test.assert(magnet.call - arrival.call === D.arrival && release.call - magnet.call === D.magnet && pause.call - release.call === D.departure, `the phases did not run ${D.arrival} / ${D.magnet} / ${D.departure} UFO ticks`);

    // The spawn: one saucer 90 out at hover + 10, the BP shape the script relies on.
    const spawnAt = arrival.at;
    if (spawnAt === undefined) throw new Error("no saucer in the arrival tick");
    const out0 = horizontalDistance(centre, spawnAt);
    log(`flight RESULT spawn ${out0.toFixed(3)} out at y ${spawnAt.y.toFixed(3)} (hover ${hoverY}); saucers in the Overworld ${arrival.saucers}; beam_len ${String(arrival.len)}, beam ${String(arrival.beam)}`);
    test.assert(arrival.saucers === 1, `${arrival.saucers} saucers in the Overworld at the spawn`);
    test.assert(Math.abs(out0 - APPROACH_DISTANCE) <= 0.5, `spawned ${out0.toFixed(3)} out, not 90 ± 0.5`);
    test.assert(Math.abs(spawnAt.y - (hoverY + LEG_ABOVE_HOVER)) <= 0.1, `spawned at y ${spawnAt.y}, not ${hoverY + LEG_ABOVE_HOVER} ± 0.1`);
    test.assert(arrival.len === beamLength(centre, hoverY) && arrival.len === hoverY - centre.y, `beam_len ${String(arrival.len)}, not ${hoverY - centre.y}`);

    // Every UFO tick of the event stepped, the entity valid in each, within 100 and 0.5 a step.
    const active = pause.call - arrival.call - 1;
    const invalid = r.samples.filter((s) => s.after === undefined);
    test.assert(r.samples.length === active && invalid.length === 0, `${r.samples.length} steps over ${active} active ticks, ${invalid.length} without a valid saucer`);
    const path = [spawnAt, ...r.samples.map((s) => s.after as Vector3)];
    let maxStep = 0;
    let maxOut = 0;
    for (let i = 0; i < path.length; i++) {
      maxOut = Math.max(maxOut, horizontalDistance(centre, path[i]));
      if (i > 0) maxStep = Math.max(maxStep, dist(path[i], path[i - 1]));
    }
    const drift = worstDrift(r.samples, 0);
    log(`flight RESULT ${path.length} positions: max step ${maxStep.toFixed(3)}, max out ${maxOut.toFixed(3)}, worst drift between ticks ${drift.toFixed(4)}`);
    test.assert(maxStep <= MAX_STEP, `a step of ${maxStep.toFixed(3)} blocks`);
    test.assert(maxOut <= MAX_OUT, `${maxOut.toFixed(3)} blocks out`);
    test.assert(drift < 0.01, `the engine moved the saucer ${drift.toFixed(4)} between two steps`);

    // At arrival + 400 (the magnet-on tick) on the hover point, and held there through the magnet.
    const atHover = r.samples.find((s) => s.call === magnet.call);
    test.assert(atHover?.after !== undefined && dist(atHover.after, hover) <= 0.1, `at arrival + 400 the saucer is at ${fmt(atHover?.after)}, not ${fmt(hover)}`);
    const held = r.samples.filter((s) => s.call >= magnet.call && s.call < release.call);
    const off = held.filter((s) => s.after === undefined || dist(s.after, hover) > 0.01);
    test.assert(held.length === D.magnet && off.length === 0, `${off.length} of ${held.length} magnet ticks off the hover point (first at ${fmt(off[0]?.after)})`);

    // Release + 300: the last point 90 out on the opposite bearing, and no saucer in the tick after.
    const last = r.samples.at(-1);
    if (last?.after === undefined) throw new Error("no last sample");
    const out1 = horizontalDistance(centre, last.after);
    const dot = bearingDot(centre, spawnAt, last.after);
    log(`flight RESULT last step in UFO tick release + ${last.call - release.call}: ${out1.toFixed(3)} out at y ${last.after.y.toFixed(3)}, bearing dot ${dot.toFixed(4)}; saucers at the pause ${pause.saucers}`);
    test.assert(last.call === release.call + D.departure - 1, `the last step came at release + ${last.call - release.call}`);
    test.assert(Math.abs(out1 - APPROACH_DISTANCE) <= 0.5, `the departure ended ${out1.toFixed(3)} out`);
    test.assert(dot <= -0.99, `the departure ended on bearing dot ${dot.toFixed(4)} to the spawn`);
    test.assert(pause.saucers === 0 && saucersInOverworld() === 0, `${pause.saucers} saucers at the pause, ${saucersInOverworld()} now`);
    // Negative control: a departure forced onto the spawn's own bearing fails the same assertion.
    const theta = Math.atan2(spawnAt.z - hover.z, spawnAt.x - hover.x);
    const forced = flightPath(centre, hoverY, p.dim.heightRange.max, theta + Math.PI);
    const forcedDot = bearingDot(centre, spawnAt, forced.end);
    test.assert(forcedDot > -0.99, `negative control: a same-bearing departure reads dot ${forcedDot.toFixed(4)} and passes`);

    // AC#3: the beam property exactly in the magnet phase.
    const wrongBeam = r.samples.filter((s) => (s.call >= magnet.call && s.call < release.call) !== (s.beam === true));
    log(`flight RESULT beam: false at the arrival ${String(arrival.beam)}, ${held.filter((s) => s.beam === true).length}/${held.length} magnet steps true, at the release ${String(release.beam)}, ${wrongBeam.length} steps wrong`);
    test.assert(arrival.beam === false && magnet.beam === true && release.beam === false, `beam at arrival / magnet / release: ${String(arrival.beam)} / ${String(magnet.beam)} / ${String(release.beam)}`);
    test.assert(wrongBeam.length === 0, `the beam is wrong in ${wrongBeam.length} steps (first in UFO tick ${wrongBeam[0]?.call} of phase ${wrongBeam[0]?.phase}: ${String(wrongBeam[0]?.beam)})`);

    // AC#3: activate at magnet-on, a hum every 40 from +40, deactivate at the release, nothing after.
    const expected: { id: UfoSound; call: number }[] = [{ id: UFO_SOUNDS.on, call: magnet.call }];
    for (let c = magnet.call + HUM_TICKS; c < release.call; c += HUM_TICKS) expected.push({ id: UFO_SOUNDS.hum, call: c });
    expected.push({ id: UFO_SOUNDS.off, call: release.call });
    const got = r.sounds.map((s) => `${s.id}@${s.call - magnet.call}`).join(" ");
    const want = expected.map((s) => `${s.id}@${s.call - magnet.call}`).join(" ");
    const hums = r.sounds.filter((s) => s.id === UFO_SOUNDS.hum).length;
    log(`flight RESULT sounds ${r.sounds.length}: ${UFO_SOUNDS.on} ×${r.sounds.filter((s) => s.id === UFO_SOUNDS.on).length}, ${UFO_SOUNDS.hum} ×${hums}, ${UFO_SOUNDS.off} ×${r.sounds.filter((s) => s.id === UFO_SOUNDS.off).length}; 60 ticks after the removal: none further`);
    test.assert(got === want, `sound log (UFO ticks from magnet-on)\n got  ${got}\n want ${want}`);
    const wantHums = Math.ceil(D.magnet / HUM_TICKS) - 1;
    test.assert(hums === wantHums, `${hums} hums over the ${D.magnet}-tick magnet, not ${wantHums}`);
    test.assert(r.sounds.every((s) => dist(s.at, hover) < 0.01), "a UFO sound played away from the saucer");
    test.assert(r.core.lastEnd()?.reason === "departed" && r.core.lastEnd()?.eventId === eventId, `the event ended by ${r.core.lastEnd()?.reason}`);
  } finally {
    r.stop();
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2800)
  .tag("andrew");

// ------------------------------------------- AC#2: nothing but the Cannon moves or hurts the saucer and the beam

/** The immunity scenario hovers 1 block over the floor (a test ceiling), so the floor, a player and a mob reach the hull. */
const LOW_HOVER = 2;
const IMMUNE: UfoDurations = { arrival: 40, magnet: 700, departure: 80, downed: 10 };
const STILL = 0.05;
const WALL_OUT = 20;

registerAsync("andrew", "ufo_saucer_immune", async (test: Test): Promise<void> => {
  const p = await pad(test, "andrew_gt_sauc_i", 1);
  const { dim, cx, cz, top } = p;
  // A is in reach of the hull and off the arrow's line; B stands back.
  const sims = await players(test, p, "i", [
    [0, 0],
    [-4, 4],
  ]);
  const [a, b] = sims;
  for (const sp of sims) {
    sp.addEffect("resistance", 4000, { amplifier: 255, showParticles: false });
    sp.addEffect("fire_resistance", 4000, { amplifier: 0, showParticles: false });
  }
  // θ = 0: in from +x, out towards −x across the wall.
  const r = rig({ durations: IMMUNE, theta01: 0, ceiling: () => top + LOW_HOVER + 15, players: sims });
  const hurts: string[] = [];
  const hits: string[] = [];
  const onHurt = world.afterEvents.entityHurt.subscribe((ev) => {
    if (ev.hurtEntity.typeId === SAUCER_ID) hurts.push(`${ev.damageSource.cause} ${ev.damage}`);
  });
  const onHit = world.afterEvents.projectileHitEntity.subscribe((ev) => {
    if (ev.getEntityHit().entity?.typeId === SAUCER_ID) hits.push(ev.projectile?.typeId ?? "?");
  });
  const wall: Vector3[] = [];
  const cells: Vector3[] = [];
  const set = (at: Vector3, type: string): void => {
    dim.setBlockType(at, type);
    cells.push(at);
  };
  try {
    // A stone wall across the departure path, WALL_OUT out on −x, over the whole height the leg sweeps.
    for (let y = top + 1; y <= top + LOW_HOVER + LEG_ABOVE_HOVER + 2; y++)
      for (let z = cz - 3; z <= cz + 3; z++) {
        const at = { x: cx - WALL_OUT, y, z };
        dim.setBlockType(at, "minecraft:stone");
        wall.push(at);
      }

    test.assert(r.core.command("come", a.id).ok, "come was refused");
    await waitFor(test, () => r.core.session()?.phase === "magnet", IMMUNE.arrival + 10, "the magnet phase");
    await goTo(test, a, dim, { x: cx + 2, y: top + 1, z: cz + 2 });
    await test.idle(5);
    const s = r.core.session();
    if (s === undefined) throw new Error("no session");
    const hover: Vector3 = { x: s.centre.x + 0.5, y: s.hoverY, z: s.centre.z + 0.5 };
    test.assert(s.hoverY === top + LOW_HOVER, `hoverY ${s.hoverY}, not the floor + ${LOW_HOVER}`);
    const saucer = r.saucer.entity();
    if (saucer === undefined) throw new Error("no saucer");
    const lines: string[] = [];

    const check = (label: string, from: number, note = ""): void => {
      const e = r.saucer.entity();
      const drift = worstDrift(r.samples, from);
      const offBy = e === undefined ? Infinity : dist(e.location, hover);
      const beam = e?.getProperty(BEAM_PROPERTY);
      const line = `${label}: valid ${e !== undefined}, drift ${drift.toFixed(4)}, off ${offBy.toFixed(4)}, beam ${String(beam)}, hurt ${hurts.length}${note === "" ? "" : `, ${note}`}`;
      lines.push(line);
      log(`immune RESULT ${line}`);
      test.assert(e !== undefined, `${label}: the saucer is gone`);
      test.assert(drift < 0.01 && offBy < 0.01, `${label}: the saucer moved (drift ${drift.toFixed(4)}, off ${offBy.toFixed(4)})`);
      test.assert(beam === true, `${label}: the beam is ${String(beam)}`);
      test.assert(hurts.length === 0, `${label}: the saucer was hurt: ${hurts.join(", ")}`);
      test.assert(r.core.session()?.phase === "magnet", `${label}: the magnet phase ended before the checks did`);
    };

    // 1. Damage of every cause, then the command.
    let from = r.samples.length;
    const applied: string[] = [];
    const threw: string[] = [];
    for (const cause of Object.values(EntityDamageCause)) {
      try {
        if (saucer.applyDamage(1000, { cause })) applied.push(cause);
      } catch (err) {
        threw.push(`${cause} (${errText(err)})`);
      }
    }
    await test.idle(3);
    check("applyDamage ×" + Object.values(EntityDamageCause).length, from, `applied ${applied.length === 0 ? "none" : applied.join(" ")}${threw.length === 0 ? "" : `, threw ${threw.join(" ")}`}`);
    from = r.samples.length;
    let damage: string;
    try {
      damage = `successCount ${dim.runCommand(`damage @e[type=${SAUCER_ID}] 100`).successCount}`;
    } catch (err) {
      damage = `threw ${errText(err)}`;
    }
    await test.idle(3);
    check("/damage 100", from, damage);

    // 2. An explosion at the hull itself.
    from = r.samples.length;
    const blew = dim.createExplosion(hover, 4, { breaksBlocks: false });
    await test.idle(3);
    check("createExplosion power 4", from, `exploded ${blew}`);

    // 3. An arrow through the hull, A's punch.
    from = r.samples.length;
    const arrow = dim.spawnEntity("minecraft:arrow", { x: hover.x - 4, y: hover.y + 0.5, z: hover.z });
    const projectile = arrow.getComponent("minecraft:projectile");
    if (projectile !== undefined) projectile.shoot({ x: 1.6, y: 0.08, z: 0 });
    else arrow.applyImpulse({ x: 1.6, y: 0.08, z: 0 });
    await test.idle(25);
    const arrowAt = arrow.isValid ? arrow.location : undefined;
    check("arrow", from, `hits on the saucer ${hits.length}, arrow now at ${fmt(arrowAt)}`);
    if (arrow.isValid) arrow.remove();
    from = r.samples.length;
    let punched: string;
    try {
      punched = String(a.attackEntity(saucer));
    } catch (err) {
      punched = `threw ${errText(err)}`;
    }
    await test.idle(5);
    check("player punch", from, `attackEntity ${punched}`);

    // 4. A piston under the saucer pushing up into its block.
    from = r.samples.length;
    const base = { x: cx, y: top + 1, z: cz };
    const power = { x: cx, y: top + 1, z: cz - 1 };
    dim.getBlock(base)?.setPermutation(BlockPermutation.resolve("minecraft:piston", { facing_direction: 1 }));
    cells.push(base);
    set(power, "minecraft:redstone_block");
    await test.idle(10);
    const head = dim.getBlock({ x: cx, y: top + 2, z: cz })?.typeId;
    dim.setBlockType(power, "minecraft:air");
    await test.idle(6);
    check("piston", from, `head block while extended ${head ?? "none"}`);
    dim.setBlockType(base, "minecraft:air");

    // 5. Lava, then fire, in the cells around the hull's point, walled in glass.
    from = r.samples.length;
    for (const dy of [1, 2])
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])
        set({ x: cx + dx, y: top + dy, z: cz + dz }, "minecraft:glass");
    set({ x: cx, y: top + 1, z: cz }, "minecraft:lava");
    set({ x: cx, y: top + 2, z: cz }, "minecraft:lava");
    await test.idle(25);
    check("lava", from, `on fire ${saucer.getComponent("minecraft:onfire") !== undefined}`);
    from = r.samples.length;
    dim.setBlockType({ x: cx, y: top + 2, z: cz }, "minecraft:air");
    dim.setBlockType({ x: cx, y: top + 1, z: cz }, "minecraft:netherrack");
    dim.setBlockType({ x: cx, y: top + 2, z: cz }, "minecraft:fire");
    await test.idle(25);
    check("fire", from, `fire block ${dim.getBlock({ x: cx, y: top + 2, z: cz })?.typeId ?? "none"}, on fire ${saucer.getComponent("minecraft:onfire") !== undefined}`);
    for (const at of cells) dim.setBlockType(at, "minecraft:air");
    cells.length = 0;

    // 6. A player standing in the hull, then a mob in it and a mob under the disc: none of them moves.
    from = r.samples.length;
    await goTo(test, b, dim, { x: cx, y: top + 1, z: cz });
    await test.idle(3);
    const bStart = b.location;
    let bMoved = 0;
    for (let t = 0; t < 20; t++) {
      await test.idle(1);
      bMoved = Math.max(bMoved, dist(b.location, bStart));
    }
    check("player in the hull", from, `the player moved ${bMoved.toFixed(4)}`);
    test.assert(bMoved < STILL, `the player in the hull moved ${bMoved.toFixed(4)}`);
    await goTo(test, b, dim, { x: cx - 4, y: top + 1, z: cz + 4 });

    from = r.samples.length;
    const cows: Entity[] = [dim.spawnEntity("minecraft:cow", { x: cx + 0.5, y: top + 1, z: cz + 0.5 }), dim.spawnEntity("minecraft:cow", { x: cx - 2.5, y: top + 1, z: cz + 0.5 })];
    for (const cow of cows) cow.addEffect("slowness", 400, { amplifier: 255, showParticles: false });
    await test.idle(8);
    const cowStart = cows.map((c) => c.location);
    const cowMoved = cows.map(() => 0);
    for (let t = 0; t < 20; t++) {
      await test.idle(1);
      cows.forEach((c, i) => (cowMoved[i] = Math.max(cowMoved[i], c.isValid ? dist(c.location, cowStart[i]) : Infinity)));
    }
    check("mobs", from, `the mob in the hull moved ${cowMoved[0].toFixed(4)}, the mob under the disc ${cowMoved[1].toFixed(4)}`);
    test.assert(cowMoved[0] < STILL && cowMoved[1] < STILL, `the mobs moved ${cowMoved.map((d) => d.toFixed(4)).join(" / ")}`);
    for (const cow of cows) if (cow.isValid) cow.remove();

    // 7. Primed TNT on the floor right under the hull.
    from = r.samples.length;
    await goTo(test, a, dim, { x: cx + 6, y: top + 1, z: cz + 6 });
    const tnt = dim.spawnEntity("minecraft:tnt", { x: hover.x, y: hover.y + 0.5, z: hover.z });
    await waitFor(test, () => !tnt.isValid, 120, "the TNT to go off");
    await test.idle(3);
    check("TNT", from, `crater: the floor under the hull is ${dim.getBlock({ x: cx, y: top, z: cz })?.typeId ?? "none"}`);

    // 8. The departure goes through the wall on schedule and leaves it standing.
    from = r.samples.length;
    await waitFor(test, () => r.of("pause").length === 1, IMMUNE.magnet + IMMUNE.departure + 20, "the event to end");
    const [release] = r.of("release");
    const [pause] = r.of("pause");
    const leg = r.samples.filter((x) => x.call >= release.call);
    const legDrift = worstDrift(r.samples, r.samples.indexOf(leg[0]) + 1);
    const legOff = leg.filter((x) => x.after === undefined || x.scripted === undefined || dist(x.after, x.scripted) > 0.01);
    const wallX = cx - WALL_OUT;
    const crossed = leg.some((x) => (x.after?.x ?? Infinity) > wallX + 1) && leg.some((x) => (x.after?.x ?? Infinity) < wallX);
    const broken = wall.filter((at) => dim.getBlock(at)?.typeId !== "minecraft:stone");
    const line = `wall: departure ${pause.call - release.call} UFO ticks, ${leg.length} steps, drift ${legDrift.toFixed(4)}, ${legOff.length} off the path, crossed x ${wallX}: ${crossed}, wall blocks changed ${broken.length}/${wall.length}`;
    lines.push(line);
    log(`immune RESULT ${line}`);
    test.assert(pause.call - release.call === IMMUNE.departure && leg.length === IMMUNE.departure, `the departure ran ${pause.call - release.call} UFO ticks with ${leg.length} steps`);
    test.assert(legDrift < 0.01 && legOff.length === 0, `the wall moved the saucer: drift ${legDrift.toFixed(4)}, ${legOff.length} steps off the path`);
    test.assert(crossed, "the departure never crossed the wall");
    test.assert(broken.length === 0, `${broken.length} wall blocks changed`);
    test.assert(hurts.length === 0, `the saucer was hurt: ${hurts.join(", ")}`);
    test.assert(r.core.lastEnd()?.reason === "departed", `the event ended by ${r.core.lastEnd()?.reason}`);
    test.assert(saucersInOverworld() === 0, "a saucer outlived the event");
    log(`immune RESULT ${lines.length} checks passed; projectile hits registered on the saucer ${hits.length}`);
  } finally {
    world.afterEvents.entityHurt.unsubscribe(onHurt);
    world.afterEvents.projectileHitEntity.unsubscribe(onHit);
    r.stop();
    for (const at of [...wall, ...cells]) dim.setBlockType(at, "minecraft:air");
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1800)
  .tag("andrew");

// ------------------------------------------- AC#3: the beam and the sounds when the event is cut short

const SCALED: UfoDurations = { arrival: 40, magnet: 200, departure: 40, downed: 10 };

registerAsync("andrew", "ufo_saucer_beam_stop", async (test: Test): Promise<void> => {
  const p = await pad(test, "andrew_gt_sauc_b", 2);
  const sims = await players(test, p, "b", [
    [0, 0],
    [2, 2],
  ]);
  const r = rig({ durations: SCALED, theta01: 0.5, ceiling: () => p.dim.heightRange.max, players: sims });
  const eventSounds = (eventId: string): SoundRec[] => {
    const span = r.phases.filter((x) => x.payload.eventId === eventId);
    const first = span[0]?.call ?? Infinity;
    const end = span.find((x) => x.phase === "pause")?.call ?? Infinity;
    return r.sounds.filter((x) => x.call >= first && x.call <= end);
  };
  const show = (list: SoundRec[], zero: number): string => list.map((x) => `${x.id}@${x.call - zero}`).join(" ") || "none";
  try {
    // A whole event on short phases: on, a hum at +40 … +160, off; nothing after.
    test.assert(r.core.command("come", sims[0].id).ok, "come was refused");
    await waitFor(test, () => r.of("pause").length === 1, SCALED.arrival + SCALED.magnet + SCALED.departure + 20, "the first event to end");
    const one = r.phases.filter((x) => x.payload.eventId === r.of("arrival")[0].payload.eventId);
    const m1 = one.find((x) => x.phase === "magnet");
    const rel1 = one.find((x) => x.phase === "release");
    const end1 = one.find((x) => x.phase === "pause");
    if (m1 === undefined || rel1 === undefined || end1 === undefined) throw new Error(`event 1 phases ${one.map((x) => x.phase).join(" → ")}`);
    const s1 = eventSounds(m1.payload.eventId);
    const want1 = [`${UFO_SOUNDS.on}@0`, ...[1, 2, 3, 4].map((k) => `${UFO_SOUNDS.hum}@${k * HUM_TICKS}`), `${UFO_SOUNDS.off}@${SCALED.magnet}`].join(" ");
    const beam1 = r.samples.filter((x) => x.call > one[0].call && x.call <= end1.call && (x.call >= m1.call && x.call < rel1.call) !== (x.beam === true));
    log(`beam_stop RESULT full event: sounds ${show(s1, m1.call)}; beam wrong in ${beam1.length} steps`);
    test.assert(show(s1, m1.call) === want1, `event 1 sounds ${show(s1, m1.call)}, want ${want1}`);
    test.assert(beam1.length === 0, `event 1: the beam is wrong in ${beam1.length} steps`);

    // A stop in the magnet: the beam written off, one deactivate and the saucer gone, all in the release
    // tick. No schedule foresees a stop, so the engine still reads the beam on until the removal.
    test.assert(r.core.command("come", sims[0].id).ok, "the second come was refused");
    await waitFor(test, () => r.of("magnet").length === 2, SCALED.arrival + 10, "the second magnet phase");
    await test.idle(50);
    const e2 = r.saucer.entity();
    test.assert(e2?.getProperty(BEAM_PROPERTY) === true, `the beam is ${String(e2?.getProperty(BEAM_PROPERTY))} 50 ticks into the magnet`);
    test.assert(r.core.command("stop").ok, "stop was refused");
    await waitFor(test, () => r.of("pause").length === 2, 5, "the stop in the magnet");
    const rel2 = r.of("release")[1];
    const pause2 = r.of("pause")[1];
    const s2 = eventSounds(rel2.payload.eventId);
    const off2 = s2.filter((x) => x.id === UFO_SOUNDS.off);
    log(
      `beam_stop RESULT stop in the magnet: release and pause in UFO ticks ${rel2.call} / ${pause2.call}, magnet on at the release ${rel2.magnetOn} ` +
        `(engine read ${String(rel2.beam)}), saucers at the pause ${pause2.saucers}; sounds ${show(s2, r.of("magnet")[1].call)}`
    );
    test.assert(rel2.call === pause2.call, "the stop's release and removal are not one UFO tick");
    test.assert(!rel2.magnetOn, "the saucer kept the beam on through the stop's release");
    test.assert(off2.length === 1 && off2[0].call === rel2.call, `deactivate after the stop: ${show(off2, rel2.call)}`);
    test.assert(pause2.saucers === 0, "the saucer outlived the stop");

    // A stop in the arrival: no sound and the beam never on.
    test.assert(r.core.command("come", sims[0].id).ok, "the third come was refused");
    await waitFor(test, () => r.of("arrival").length === 3, 5, "the third arrival");
    await test.idle(10);
    test.assert(r.core.command("stop").ok, "the second stop was refused");
    await waitFor(test, () => r.of("pause").length === 3, 5, "the stop in the arrival");
    const id3 = r.of("arrival")[2].payload.eventId;
    const s3 = eventSounds(id3);
    const pause3 = r.of("pause")[2];
    const on3 = r.samples.filter((x) => x.call > r.of("arrival")[2].call && x.call <= pause3.call && x.beam === true);
    log(`beam_stop RESULT stop in the arrival: sounds ${show(s3, pause3.call)}, beam on in ${on3.length} steps, release published ${r.of("release").length > 2}`);
    test.assert(s3.length === 0 && on3.length === 0 && r.of("release").length === 2, `the arrival stop: sounds ${show(s3, pause3.call)}, beam on ${on3.length}`);

    const total = r.sounds.length;
    await test.idle(40);
    test.assert(r.sounds.length === total && saucersInOverworld() === 0, "a UFO sound or a saucer after the last removal");
    test.assert(
      r.phases.filter((x) => x.phase === "arrival").every((x) => x.saucers === 1),
      "an arrival found more or fewer than one saucer in the Overworld"
    );
    test.assert(
      world
        .getDimension("overworld")
        .getEntities({ families: [UFO_FAMILY] })
        .filter((e) => e !== undefined && e.hasTag(EVENT_TAG + id3)).length === 0,
      "the stopped saucer is still in the world"
    );
  } finally {
    r.stop();
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1400)
  .tag("andrew");

// ------------------------------------------- one player alone: the chunks the engine keeps ticking around them

const LONE_SITE_DZ = 2600;
/** Chunks each way kept loaded while the player arrives, then released. */
const LONE_PRELOAD = 7;
/** Chunks each way mapped around the player's chunk. */
const REACH_SCAN = 9;
const REACH_MAX = 160;
const REACH_BEARINGS = 24;

const ticking = (dim: Dimension, at: Vector3): boolean => {
  try {
    return dim.isChunkLoaded(at);
  } catch {
    return false;
  }
};

/** Blocks from `from` along `theta` to the last quarter-block sample whose chunk is loaded and ticking. */
function reachAlong(dim: Dimension, from: Vector3, theta: number, max: number): number {
  const [c, s] = [Math.cos(theta), Math.sin(theta)];
  let reach = 0;
  for (let d = 0; d <= max; d += 0.25) {
    if (!ticking(dim, { x: from.x + d * c, y: from.y, z: from.z + d * s })) break;
    reach = d;
  }
  return reach;
}

function chunkMap(dim: Dimension, at: Vector3): { rows: string[]; count: number; chebyshev: number; euclid: number } {
  const pcx = Math.floor(at.x / 16);
  const pcz = Math.floor(at.z / 16);
  const rows: string[] = [];
  let count = 0;
  let chebyshev = -1;
  let euclid = -1;
  for (let dz = -REACH_SCAN; dz <= REACH_SCAN; dz++) {
    let row = "";
    for (let dx = -REACH_SCAN; dx <= REACH_SCAN; dx++) {
      const on = ticking(dim, { x: (pcx + dx) * 16 + 8, y: at.y, z: (pcz + dz) * 16 + 8 });
      row += dx === 0 && dz === 0 ? (on ? "P" : "p") : on ? "#" : ".";
      if (!on) continue;
      count++;
      chebyshev = Math.max(chebyshev, Math.abs(dx), Math.abs(dz));
      euclid = Math.max(euclid, Math.hypot(dx, dz));
    }
    rows.push(row);
  }
  return { rows, count, chebyshev, euclid };
}

function spawnProbe(dim: Dimension, at: Vector3): string {
  try {
    dim.spawnEntity(SAUCER_ID, at).remove();
    return "spawned";
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

interface Lone {
  dim: Dimension;
  sim: SimulatedPlayer;
  /** The block the player stands on. */
  ground: Vector3;
  /** The window's loaded+ticking chunks while the preload held, and after its release. */
  held: number;
  kept: number;
}

/**
 * A simulated player standing in the middle of a chunk at (x, z), and nothing else
 * holding the chunks around: the site is preloaded so that the player lands on
 * ground, then the ticking areas are released. Simulated players load no chunks,
 * but they keep the ones in their tick distance ticking.
 */
async function alone(test: Test, name: string, x: number, z: number): Promise<Lone> {
  const dim = test.getDimension();
  const span = LONE_PRELOAD * 16;
  const release = await loadBox(test, dim, name, { min: [x - span, 0, z - span], max: [x + span, 0, z + span] });
  const sim = test.spawnSimulatedPlayer(STAND, `${name}_p`, GameMode.Survival);
  try {
    const mx = Math.floor(x / 16) * 16 + 8;
    const mz = Math.floor(z / 16) * 16 + 8;
    const top = dim.getTopmostBlock({ x: mx, z: mz });
    if (top === undefined) throw new Error(`${name}: no ground at ${mx},${mz}`);
    for (const e of dim.getEntities({ location: { x: mx + 0.5, y: top.location.y, z: mz + 0.5 }, maxDistance: 24 })) if (e !== undefined && e.isValid && e.typeId !== "minecraft:player") e.remove();
    await goTo(test, sim, dim, { x: mx, y: top.location.y + 1, z: mz });
    await test.idle(20);
    const held = chunkMap(dim, sim.location).count;
    release();
    await test.idle(10);
    return { dim, sim, ground: top.location, held, kept: chunkMap(dim, sim.location).count };
  } catch (err) {
    release();
    test.removeSimulatedPlayer(sim);
    throw err;
  }
}

// ------------------------------------------- the measurement the arrival's start is chosen by

registerAsync("andrew", "ufo_arrival_reach_measured", async (test: Test): Promise<void> => {
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const lone = await alone(test, "andrew_gt_reach", origin.x + SITE_DX, origin.z + LONE_SITE_DZ);
  const { dim, sim } = lone;
  try {
    const counts: string[] = [];
    let waited = 0;
    for (const t of [20, 100, 200]) {
      await test.idle(t - waited);
      waited = t;
      counts.push(`+${t}: ${chunkMap(dim, sim.location).count}`);
    }
    log(`reach RESULT ticking areas released; chunks loaded+ticking in the ${2 * REACH_SCAN + 1}² window: ${lone.held} held by the preload, then ${lone.kept} (+10), ${counts.join(", ")}`);
    const cx = Math.floor(lone.ground.x / 16) * 16;
    const cz = Math.floor(lone.ground.z / 16) * 16;
    const spots: Array<[string, number, number]> = [
      ["chunk middle", cx + 8, cz + 8],
      ["chunk -x-z corner", cx, cz],
      ["chunk +x+z corner", cx + 15, cz + 15],
    ];
    for (const [label, x, z] of spots) {
      await goTo(test, sim, dim, { x, y: lone.ground.y + 1, z });
      await test.idle(40);
      const at = sim.location;
      const m = chunkMap(dim, at);
      const reach = Array.from({ length: REACH_BEARINGS }, (_, k) => reachAlong(dim, at, (2 * Math.PI * k) / REACH_BEARINGS, REACH_MAX));
      const lo = Math.min(...reach);
      const hi = Math.max(...reach);
      const east = reach[0];
      const edge = spawnProbe(dim, { x: at.x + east - 0.5, y: at.y + 40, z: at.z });
      const past = spawnProbe(dim, { x: at.x + east + 1, y: at.y + 40, z: at.z });
      log(
        `reach RESULT ${label} at ${fmt(at)}: ${m.count} chunks, Chebyshev ${m.chebyshev}, Euclid ${m.euclid.toFixed(2)} chunks; ` +
          `reach by ${360 / REACH_BEARINGS}° from east: ${reach.map((d) => d.toFixed(1)).join(" ")}; min ${lo.toFixed(2)}, max ${hi.toFixed(2)}; ` +
          `spawnEntity at east reach − 0.5: ${edge}; at east reach + 1: ${past}`
      );
      log(`reach RESULT ${label} map (P = the player's chunk, # = loaded and ticking):\n${m.rows.join("\n")}`);
      test.assert(m.count > 0, `${label}: no chunk is loaded and ticking around the player — the measurement measured nothing`);
      test.assert(edge === "spawned" && past.startsWith("threw"), `${label}: spawnEntity disagrees with isChunkLoaded at the edge (${edge} / ${past})`);

      // The product's walk over chunk columns against this quarter-block walk, bearing by bearing, capped at the §2 distance.
      const product = Array.from({ length: REACH_BEARINGS }, (_, k) => tickingReach(tickingIn(dim), at, (2 * Math.PI * k) / REACH_BEARINGS, APPROACH_DISTANCE));
      const off = product.filter((d, k) => {
        const walked = Math.min(reach[k], APPROACH_DISTANCE);
        return d > walked + 0.25 || d < walked - REACH_MARGIN - 0.25;
      });
      const pick = arrivalBearing(tickingIn(dim), at, 0);
      log(
        `reach RESULT ${label}: the saucer's measured reach by bearing ${product.map((d) => d.toFixed(1)).join(" ")}; ` +
          `of ${ARRIVAL_BEARINGS} bearings from east it comes in on ${((pick.theta * 180) / Math.PI).toFixed(1)}° from ${pick.reach.toFixed(2)} blocks`
      );
      test.assert(off.length === 0, `${label}: the product's reach strays from the engine's at ${off.length} bearing(s): ${product.map((d) => d.toFixed(2)).join(" ")} vs ${reach.map((d) => d.toFixed(2)).join(" ")}`);
      test.assert(pick.reach === Math.max(...Array.from({ length: ARRIVAL_BEARINGS }, (_, k) => tickingReach(tickingIn(dim), at, (2 * Math.PI * k) / ARRIVAL_BEARINGS, APPROACH_DISTANCE))), `${label}: the arrival did not take the longest bearing`);
    }
  } finally {
    test.removeSimulatedPlayer(sim);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ------------------------------------------- the arrival over one player who alone holds the chunks

const ARRIVE: UfoDurations = { arrival: PHASE_TICKS.arrival, magnet: 100, departure: PHASE_TICKS.departure, downed: 10 };
/** Two and a half chunks: the saucer comes in from afar, not out of the player's own chunk. */
const LONE_MIN_OUT = 40;

registerAsync("andrew", "ufo_arrival_single_player", async (test: Test): Promise<void> => {
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const lone = await alone(test, "andrew_gt_arrive", origin.x + SITE_DX + SITE_STEP, origin.z + LONE_SITE_DZ);
  const { dim, sim } = lone;
  const ceiling = dim.heightRange.max;
  const r = rig({ durations: ARRIVE, theta01: 0, ceiling: () => ceiling, players: [sim] });
  try {
    const centre = centreUnder(sim.location);
    const hoverY = hoverHeight(centre.y, ceiling);
    const legY = legHeight(hoverY, ceiling);
    const nominal = flightPath(centre, hoverY, ceiling, 0).start;
    const from = { x: centre.x + 0.5, y: legY, z: centre.z + 0.5 };
    log(
      `single RESULT one player at ${fmt(sim.location)}: ${lone.kept} chunks loaded and ticking after the preload's release; ` +
        `the §2 start ${APPROACH_DISTANCE} east ${fmt(nominal)} is ${ticking(dim, nominal) ? "" : "NOT "}loaded and ticking; measured reach east ${reachAlong(dim, from, 0, REACH_MAX).toFixed(2)}`
    );
    test.assert(lone.kept > 0, "no chunk stays ticking around the lone player — the scenario is wrong");
    test.assert(!ticking(dim, nominal), `the scenario is wrong: ${fmt(nominal)}, ${APPROACH_DISTANCE} blocks out, is loaded and ticking`);

    // As on the live server: the arrival falls due and the idle check starts it.
    r.store.set(NEXT_MS, Date.now() - 1);
    await waitFor(test, () => r.of("arrival").length === 1, IDLE_CHECK_TICKS + 5, "the scheduled arrival");
    await waitFor(test, () => r.of("pause").length === 1, ARRIVE.arrival + ARRIVE.magnet + ARRIVE.departure + 20, "the event to end");
    const [arrival] = r.of("arrival");
    const [pause] = r.of("pause");
    const order = r.phases.map((x) => x.phase).join(" → ");
    const end = r.core.lastEnd();
    const spawnAt = arrival.at;
    const last = r.samples.at(-1)?.after;
    const invalid = r.samples.filter((x) => x.after === undefined);
    log(
      `single RESULT ${order}; ended (${end?.reason ?? "?"}) ${pause.call - arrival.call} UFO ticks after the arrival; saucers at the arrival ${arrival.saucers}; ` +
        `spawn ${fmt(spawnAt)} ${spawnAt === undefined ? "-" : horizontalDistance(centre, spawnAt).toFixed(2)} out; last step ${fmt(last)} ${last === undefined ? "-" : horizontalDistance(centre, last).toFixed(2)} out; ` +
        `${r.samples.length} steps, ${invalid.length} without a saucer; notices ${sim.name}: ${r.notices.get(sim.name) ?? 0}`
    );
    if (spawnAt === undefined || arrival.saucers !== 1)
      throw new Error(`no saucer in the arrival tick: the event ended (${end?.reason ?? "?"}) after ${pause.call - arrival.call} UFO ticks — ${order}`);
    test.assert(order === "arrival → magnet → release → departure → pause" && end?.reason === "departed", `phases ${order}, ended by ${end?.reason ?? "?"}`);
    test.assert(invalid.length === 0 && r.samples.length === pause.call - arrival.call - 1, `${r.samples.length} steps, ${invalid.length} of them without a valid saucer`);
    const out0 = horizontalDistance(centre, spawnAt);
    test.assert(out0 >= LONE_MIN_OUT && out0 <= APPROACH_DISTANCE + 0.01, `the saucer spawned ${out0.toFixed(2)} out, not within [${LONE_MIN_OUT}, ${APPROACH_DISTANCE}]`);
    test.assert(ticking(dim, spawnAt), `the spawn point ${fmt(spawnAt)} is not loaded and ticking`);
    if (last === undefined) throw new Error("no last step");
    const out1 = horizontalDistance(centre, last);
    test.assert(out1 >= LONE_MIN_OUT && out1 <= APPROACH_DISTANCE + 0.01, `the departure ended ${out1.toFixed(2)} out, not within [${LONE_MIN_OUT}, ${APPROACH_DISTANCE}]`);
    test.assert(bearingDot(centre, spawnAt, last) <= -0.99, `the departure ended on bearing dot ${bearingDot(centre, spawnAt, last).toFixed(4)} to the spawn`);
    test.assert((r.notices.get(sim.name) ?? 0) === 1, `the target got ${r.notices.get(sim.name) ?? 0} notices, not 1`);
    const legs = r.logs.filter((l) => l.includes("saucer in from") || l.includes("saucer out to"));
    log(`single RESULT the saucer's own measurement: ${legs.join(" | ")}`);
    test.assert(legs.some((l) => l.includes(`saucer in from ${out0.toFixed(2)} blocks`)) && legs.some((l) => l.includes(`saucer out to ${out1.toFixed(2)} blocks`)), `the saucer did not log its measured legs: ${legs.join(" | ")}`);
    test.assert(pause.saucers === 0 && saucersInOverworld() === 0, `${pause.saucers} saucers at the pause, ${saucersInOverworld()} now`);
  } finally {
    r.stop();
    test.removeSimulatedPlayer(sim);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1400)
  .tag("andrew");
