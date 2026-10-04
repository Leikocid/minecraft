// The UFO event core (src/ufo/) on a real engine: the schedule on a test clock,
// the phases at their real lengths with the product saucer, Overworld only, the
// operator command, the arrival notice, one interval and its idle cost.
//
// The release pack reads a SimulatedPlayer as undefined, so it can never pick
// one as a target. Every scenario here builds its own core — the product class,
// the product saucer and the product candidate filter — over an env whose
// clock the test moves and whose players are the test's own (L0-ufoc-ad01).
// Its event ids carry the scope "gt", which the release core's sweeps leave alone.

import {
  BlockVolume,
  CommandPermissionLevel,
  CustomCommandParamType,
  CustomCommandStatus,
  type Dimension,
  GameMode,
  type RawMessage,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import type { Box } from "../structures/clear";
import { startUfo } from "../ufo";
import { UFO_COMMAND, registerUfoCommand } from "../ufo/commands";
import { FIRST_MAX_MS, FIRST_MIN_MS, PAUSE_MS, PHASE_TICKS, type UfoDurations, type UfoEnv, type UfoPlayer, type UfoStore, overworldCandidates } from "../ufo/env";
import {
  ARRIVAL_TEXT,
  EVENT_TAG,
  IDLE_CHECK_TICKS,
  type IntervalHost,
  type Magnet,
  NOTICE_RANGE,
  type Phase,
  type PhaseListener,
  type PhasePayload,
  SAUCER_ID,
  type Saucer,
  UfoCore,
  centreUnder,
  horizontalDistance,
  hoverHeight,
} from "../ufo/event";
import { ENABLED, NEXT_MS } from "../ufo/schedule";
import { APPROACH_DISTANCE, type UfoSaucer, createSaucer, legHeight } from "../ufo/saucer";
import { goTo } from "./orbital-core";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const COMMAND = "andrew:gt_ufo";
const SCOPE = "gt";
const STAND: Vector3 = { x: 3, y: 2, z: 3 };
const STAND_2: Vector3 = { x: 1, y: 2, z: 1 };
/** Short phases for the scenarios that are about the schedule, not the phase lengths. */
const SHORT: UfoDurations = { arrival: 20, magnet: 40, departure: 20, downed: 10 };
/** One idle check plus the tick the GameTest continuation runs ahead of the interval. */
const IDLE_WINDOW = IDLE_CHECK_TICKS + 2;

const log = (msg: string): void => console.warn(`[gametest] ufo ${msg}`);
const fmt = (v: Vector3): string => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

/** The finest clock the script runtime offers; QuickJS on BDS may only have Date.now. */
const perf = (globalThis as { performance?: { now(): number } }).performance;
const fine: { name: string; now(): number } =
  perf !== undefined && typeof perf.now === "function" ? { name: "performance.now", now: () => perf.now() } : { name: "Date.now", now: () => Date.now() };

let current: UfoCore | undefined;
registerUfoCommand({ system, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus }, { name: COMMAND, core: () => current, log });

// ---------------------------------------------------------------- the rig

/** A test-owned clock: it starts at Date.now() and moves only when the test moves it. */
class TestClock {
  private t = Date.now();
  reads = 0;
  readonly now = (): number => {
    this.reads++;
    return this.t;
  };
  peek(): number {
    return this.t;
  }
  set(ms: number): void {
    this.t = ms;
  }
  advance(ms: number): void {
    this.t += ms;
  }
}

class CountingStore implements UfoStore {
  readonly data = new Map<string, number | boolean>();
  reads = 0;
  writes = 0;
  get(key: string): unknown {
    this.reads++;
    return this.data.get(key);
  }
  set(key: string, value: number | boolean | undefined): void {
    this.writes++;
    if (value === undefined) this.data.delete(key);
    else this.data.set(key, value);
  }
}

interface PhaseRec {
  phase: Phase;
  payload: PhasePayload;
  tick: number;
  call: number;
  now: number;
  wallMs: number;
  /** Where the saucer entity was when the phase was published (after the saucer heard it). */
  entityAt: Vector3 | undefined;
  entityDim: string | undefined;
}

interface StepRec {
  call: number;
  seq: number;
  kind: "saucerStep" | "magnetStep";
  phase: string | undefined;
  pos: Vector3 | undefined;
}

/** Counts what the core asks of the engine's scheduler, and how often its callback runs per tick. */
class SpyHost implements IntervalHost {
  intervals = 0;
  cleared = 0;
  calls = 0;
  readonly perTick = new Map<number, number>();
  /** Script time inside the core's tick, by the finest clock available. */
  tickMs = 0;
  constructor(private readonly timed: () => boolean) {}
  runInterval(callback: () => void, tickInterval?: number): number {
    this.intervals++;
    return system.runInterval(() => {
      this.calls++;
      const t = system.currentTick;
      this.perTick.set(t, (this.perTick.get(t) ?? 0) + 1);
      if (!this.timed()) return callback();
      const start = fine.now();
      callback();
      this.tickMs += fine.now() - start;
    }, tickInterval);
  }
  clearRun(runId: number): void {
    this.cleared++;
    system.clearRun(runId);
  }
}

interface Rig {
  core: UfoCore;
  env: UfoEnv;
  clock: TestClock;
  store: CountingStore;
  saucer: UfoSaucer;
  host: SpyHost;
  players: SimulatedPlayer[];
  inbox: Map<string, RawMessage[]>;
  /** Every line the core logged. */
  logs: string[];
  phases: PhaseRec[];
  steps: StepRec[];
  /** Script time spent inside the saucer and the recording magnet. */
  consumerMs: number;
  timing: boolean;
  next(): number | undefined;
  of(phase: Phase): PhaseRec[];
  stop(): void;
}

function rig(opts: {
  durations: UfoDurations;
  random: () => number;
  /** Heard before the recorder, after the saucer and the magnet. */
  extra?: readonly PhaseListener[];
  /** The saucer's arrival throws before the product saucer hears it, as a spawn in an unloaded chunk does. */
  failArrival?: boolean;
}): Rig {
  const clock = new TestClock();
  const store = new CountingStore();
  const players: SimulatedPlayer[] = [];
  const inbox = new Map<string, RawMessage[]>();
  const logs: string[] = [];
  const box = (name: string): RawMessage[] => {
    let list = inbox.get(name);
    if (list === undefined) inbox.set(name, (list = []));
    return list;
  };
  const env: UfoEnv = {
    now: clock.now,
    durations: opts.durations,
    pauseMs: PAUSE_MS,
    firstMinMs: FIRST_MIN_MS,
    firstMaxMs: FIRST_MAX_MS,
    // The product filter over the test's players; the wrapper is the notice witness.
    overworldPlayers: (): UfoPlayer[] =>
      overworldCandidates(players).map((p) => ({
        id: p.id,
        name: p.name,
        location: p.location,
        sendMessage: (message: RawMessage): void => {
          box(p.name).push(message);
          p.sendMessage(message);
        },
      })),
    random: opts.random,
    store,
    ceiling: () => world.getDimension("overworld").heightRange.max,
    log: (msg) => {
      logs.push(msg);
      console.warn(`[gametest] ${msg}`);
    },
  };
  const saucer = createSaucer({ overworld: () => world.getDimension("overworld"), random: opts.random, durations: opts.durations, ceiling: env.ceiling, log: env.log });
  const r: Partial<Rig> & { phases: PhaseRec[]; steps: StepRec[] } = { phases: [], steps: [], consumerMs: 0, timing: false };
  const host = new SpyHost(() => r.timing === true);
  let seq = 0;
  const timedCall = (fn: () => void): void => {
    if (!r.timing) return fn();
    const start = fine.now();
    try {
      fn();
    } finally {
      r.consumerMs = (r.consumerMs ?? 0) + fine.now() - start;
    }
  };
  let core: UfoCore | undefined;
  // Every member of the Saucer contract, delegated to the product saucer.
  const recordingSaucer: Saucer = {
    onPhase: (phase, payload) =>
      timedCall(() => {
        if (opts.failArrival === true && phase === "arrival") throw new Error(`LocationInUnloadedChunkError stand-in: no saucer for ${payload.eventId}`);
        saucer.onPhase(phase, payload);
      }),
    saucerStep: (tick) =>
      timedCall(() => {
        saucer.saucerStep(tick);
        r.steps.push({ call: host.calls, seq: ++seq, kind: "saucerStep", phase: core?.session()?.phase, pos: saucer.saucerPosition() });
      }),
    saucerPosition: () => saucer.saucerPosition(),
  };
  const magnet: Magnet = {
    onPhase: () => {},
    magnetStep: () => timedCall(() => void r.steps.push({ call: host.calls, seq: ++seq, kind: "magnetStep", phase: core?.session()?.phase, pos: undefined })),
  };
  const recorder = {
    onPhase: (phase: Phase, payload: PhasePayload): void => {
      const e = saucer.entity();
      r.phases.push({ phase, payload, tick: system.currentTick, call: host.calls, now: clock.peek(), wallMs: Date.now(), entityAt: e?.location, entityDim: e?.dimension.id });
    },
  };
  core = new UfoCore(env, { scope: SCOPE, saucer: recordingSaucer, magnet, listeners: [...(opts.extra ?? []), recorder] });
  const undo = startUfo(core, world, host);
  current = core;
  return Object.assign(r, {
    core,
    env,
    clock,
    store,
    saucer,
    host,
    players,
    inbox,
    logs,
    next: () => {
      const v = store.data.get(NEXT_MS);
      return typeof v === "number" ? v : undefined;
    },
    of: (phase: Phase) => r.phases.filter((p) => p.phase === phase),
    stop: () => {
      undo();
      saucer.entity()?.remove();
      if (current === core) current = undefined;
    },
  }) as Rig;
}

async function waitFor(test: Test, cond: () => boolean, ticks: number, label: string): Promise<number> {
  for (let t = 0; t <= ticks; t++) {
    if (cond()) return t;
    await test.idle(1);
  }
  throw new Error(`${label}: not within ${ticks} ticks`);
}

/** The line the saucer flies, ±100 blocks east-west of the stand: random 0 or 1 puts its legs due east and west. */
async function loadCorridor(test: Test, name: string): Promise<() => void> {
  const c = test.worldBlockLocation(STAND);
  const box: Box = { min: [c.x - 100, 0, c.z - 8], max: [c.x + 100, 0, c.z + 8] };
  return loadBox(test, test.getDimension(), name, box);
}

function saucersEverywhere(): number {
  let n = 0;
  for (const d of ["overworld", "nether", "the_end"]) n += world.getDimension(d).getEntities({ type: SAUCER_ID }).filter((e) => e !== undefined).length;
  return n;
}

function eventSaucers(eventId: string): number {
  return world
    .getDimension("overworld")
    .getEntities({ type: SAUCER_ID, tags: [EVENT_TAG + eventId] })
    .filter((e) => e !== undefined).length;
}

/** A closed room with a floor, `stand` on it, in a loaded box of its own. */
async function room(test: Test, dim: Dimension, name: string, x0: number, floorY: number, z0: number, shell: string): Promise<{ stand: Vector3; unload: () => void }> {
  const unload = await loadBox(test, dim, name, { min: [x0 - 1, floorY - 1, z0 - 1], max: [x0 + 7, floorY + 6, z0 + 7] });
  dim.fillBlocks(new BlockVolume({ x: x0 - 1, y: floorY - 1, z: z0 - 1 }, { x: x0 + 7, y: floorY + 6, z: z0 + 7 }), shell);
  dim.fillBlocks(new BlockVolume({ x: x0, y: floorY + 1, z: z0 }, { x: x0 + 6, y: floorY + 5, z: z0 + 6 }), "minecraft:air");
  return { stand: { x: x0 + 3, y: floorY + 1, z: z0 + 3 }, unload };
}

/** Runs the command as the player; the engine's refusal comes back as a throw or successCount 0. */
function run(p: SimulatedPlayer, action: string, command: string = COMMAND): string {
  try {
    return `successCount=${p.runCommand(`${command} ${action}`).successCount}`;
  } catch (e) {
    return `threw ${errText(e)}`;
  }
}

const accepted = (outcome: string): boolean => /^successCount=[1-9]/.test(outcome);

// ------------------------------------------------ AC#2: the schedule on the test clock (L0-ufoc-ac01, ac02)

registerAsync("andrew", "ufo_schedule_scaled_clock", async (test: Test): Promise<void> => {
  // random 1: the top of the first window, the last candidate, the legs due east and west.
  const r = rig({ durations: SHORT, random: () => 1 });
  const unload = await loadCorridor(test, "andrew_gt_ufo_s");
  try {
    const join = r.clock.peek();
    const p = test.spawnSimulatedPlayer(STAND, "ufo_sched", GameMode.Survival);
    r.players.push(p);
    await waitFor(test, () => r.next() !== undefined, 40, "the first join to write next_ms");
    const first = r.next() as number;
    log(`schedule RESULT first join at ${join}: next_ms = join + ${first - join} ms`);
    test.assert(first === join + FIRST_MAX_MS, `random 1 put the first arrival at join + ${first - join} ms, not + ${FIRST_MAX_MS}`);

    // A second join while next_ms is present changes nothing.
    test.spawnSimulatedPlayer(STAND_2, "ufo_sched_late", GameMode.Survival);
    await test.idle(10);
    test.assert(r.next() === first, `a second first join moved next_ms by ${(r.next() ?? 0) - first} ms`);

    const window = async (label: string, due: number, arrivalsBefore: number): Promise<void> => {
      r.clock.set(due - 60_000);
      await test.idle(IDLE_CHECK_TICKS + 20);
      test.assert(r.of("arrival").length === arrivalsBefore, `${label}: an arrival started a minute before next_ms`);
      r.clock.set(due);
      const took = await waitFor(test, () => r.of("arrival").length > arrivalsBefore, IDLE_WINDOW, `${label}: the arrival after next_ms`);
      const a = r.of("arrival")[arrivalsBefore];
      log(`schedule RESULT ${label}: arrival ${took} ticks after the clock reached next_ms, at next_ms + ${a.now - due} ms`);
      test.assert(a.now >= due, `${label}: the arrival started at next_ms ${a.now - due} ms`);
    };

    await window("first arrival (join + 20 min)", first, 0);
    await waitFor(test, () => r.of("pause").length === 1, SHORT.arrival + SHORT.magnet + SHORT.departure + 10, "the first event to end");
    const end1 = r.of("pause")[0];
    test.assert(r.core.lastEnd()?.reason === "departed", `the first event ended by ${r.core.lastEnd()?.reason}`);
    test.assert(r.next() === end1.now + PAUSE_MS, `after the departure next_ms = end + ${(r.next() ?? 0) - end1.now} ms, not + ${PAUSE_MS}`);

    await window("after the departure (+15 min)", end1.now + PAUSE_MS, 1);
    await waitFor(test, () => r.core.session()?.phase === "magnet", SHORT.arrival + 5, "the magnet phase");
    r.clock.advance(1234);
    const shotAt = r.clock.peek();
    const eventId = r.core.session()?.eventId as string;
    const seen = r.phases.length;
    const callAtShot = r.host.calls;
    r.core.reportShotDown({ eventId, ownerId: p.id, ownerName: p.name });
    test.assert(r.next() === shotAt + PAUSE_MS, `after the shot next_ms = shot + ${(r.next() ?? 0) - shotAt} ms`);
    test.assert(r.phases.slice(seen).map((x) => x.phase).join() === "downed", `inside the caller: ${r.phases.slice(seen).map((x) => x.phase).join()}`);
    r.core.reportShotDown({ eventId, ownerId: p.id, ownerName: p.name });
    test.assert(r.phases.length === seen + 1 && r.next() === shotAt + PAUSE_MS, "a second report for the same event changed something");
    await waitFor(test, () => r.of("release").length === 2, 3, "the release after the shot");
    const release = r.of("release")[1];
    test.assert(release.call === callAtShot + 1, `the release came in UFO tick ${release.call - callAtShot} after the shot, not the next one`);
    await waitFor(test, () => r.of("pause").length === 2, SHORT.downed + 5, "the end of downed");
    test.assert(r.core.lastEnd()?.reason === "downed", `the shot event ended by ${r.core.lastEnd()?.reason}`);
    test.assert(r.next() === shotAt + PAUSE_MS, "the end of downed moved next_ms off the shot");

    await window("after the shot (+15 min)", shotAt + PAUSE_MS, 2);
    r.core.command("stop");
    await waitFor(test, () => r.core.session() === undefined, 5, "the stop");
  } finally {
    r.stop();
    unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");

// ------------------------------------------------ AC#3 + AC#8: real phase lengths, the product saucer, one interval

/** The arrival leg moves 90/400 of a block a tick; the spawn point is read in the arrival tick itself. */
const AT_SPAWN = 0.01;

registerAsync("andrew", "ufo_phases_real_durations", async (test: Test): Promise<void> => {
  const r = rig({ durations: PHASE_TICKS, random: () => 0 });
  const unload = await loadCorridor(test, "andrew_gt_ufo_r");
  const dim = test.getDimension();
  const pad: Vector3[] = [];
  try {
    const p = test.spawnSimulatedPlayer(STAND, "ufo_phases", GameMode.Survival);
    r.players.push(p);
    await test.idle(10);
    const centre = test.worldBlockLocation({ x: STAND.x, y: STAND.y - 1, z: STAND.z });
    const ceiling = dim.heightRange.max;
    const hoverY = Math.min(centre.y + 40, ceiling - 15);
    r.timing = true;
    r.core.command("come", p.id);
    await waitFor(test, () => r.of("pause").length === 1, PHASE_TICKS.arrival + PHASE_TICKS.magnet + PHASE_TICKS.departure + 20, "the event to end");
    r.timing = false;
    const [arrival] = r.of("arrival");
    const [magnet] = r.of("magnet");
    const [release] = r.of("release");
    const [departure] = r.of("departure");
    const [pause] = r.of("pause");
    const order = r.phases.map((x) => x.phase).join(" → ");
    const sec = (a: PhaseRec, b: PhaseRec): string => ((b.wallMs - a.wallMs) / 1000).toFixed(2);
    log(
      `phases RESULT ${order}; ticks arrival→magnet ${magnet.tick - arrival.tick}, magnet→release ${release.tick - magnet.tick}, release→departure ${departure.tick - release.tick}, ` +
        `departure→pause ${pause.tick - departure.tick}; wall s ${sec(arrival, magnet)} / ${sec(magnet, release)} / ${sec(release, departure)} / ${sec(departure, pause)}`
    );
    test.assert(order === "arrival → magnet → release → departure → pause", `phase order ${order}`);
    test.assert(Math.abs(magnet.tick - arrival.tick - 400) <= 1, `arrival lasted ${magnet.tick - arrival.tick} ticks, not 400`);
    test.assert(release.tick === departure.tick && release.call === departure.call, "the release and the departure are not in one tick");
    test.assert(Math.abs(release.tick - magnet.tick - 1200) <= 1, `the magnet lasted ${release.tick - magnet.tick} ticks, not 1200`);
    test.assert(Math.abs(pause.tick - departure.tick - 300) <= 1, `the departure lasted ${pause.tick - departure.tick} ticks, not 300`);
    test.assert(new Set(r.phases.map((x) => x.payload.eventId)).size === 1, "the payloads carry more than one event id");
    test.assert(
      r.phases.every((x) => x.payload.hoverY === hoverY && x.payload.centre.x === centre.x && x.payload.centre.y === centre.y && x.payload.centre.z === centre.z),
      `payload centre/hoverY ${fmt(arrival.payload.centre)} / ${arrival.payload.hoverY}, expected ${fmt(centre)} / ${hoverY}`
    );
    test.assert(hoverY === hoverHeight(centre.y, ceiling), "the scenario and the product disagree on the hover height");

    // The saucer: 90 blocks out at hover + 10, at the hover point through the magnet, gone after the pause.
    const spawnAt = arrival.entityAt;
    if (spawnAt === undefined || arrival.entityDim !== "minecraft:overworld") throw new Error(`no saucer in the Overworld in the arrival tick (${arrival.entityDim ?? "none"})`);
    const out = horizontalDistance(centre, spawnAt);
    log(`phases RESULT saucer spawned ${out.toFixed(3)} blocks from the centre at y ${spawnAt.y} (hover ${hoverY}, ceiling ${ceiling})`);
    test.assert(Math.abs(out - APPROACH_DISTANCE) <= AT_SPAWN, `the saucer spawned ${out.toFixed(3)} blocks out, not ${APPROACH_DISTANCE}`);
    test.assert(Math.abs(spawnAt.y - legHeight(hoverY, ceiling)) <= AT_SPAWN && legHeight(hoverY, ceiling) === hoverY + 10, `the saucer spawned at y ${spawnAt.y}, not ${hoverY + 10}`);
    const held = r.steps.filter((s) => s.kind === "saucerStep" && s.phase === "magnet");
    const off = held.filter((s) => s.pos === undefined || horizontalDistance(centre, s.pos) > 0.01 || Math.abs(s.pos.y - hoverY) > 0.01);
    test.assert(held.length >= 1199 && off.length === 0, `${off.length} of ${held.length} magnet ticks off the hover point (first ${off[0]?.pos === undefined ? "none" : fmt(off[0].pos)})`);
    const last = r.steps.filter((s) => s.kind === "saucerStep").at(-1);
    log(`phases RESULT last saucer step at ${last?.pos === undefined ? "none" : fmt(last.pos)}, ${last?.pos === undefined ? "-" : horizontalDistance(centre, last.pos).toFixed(2)} blocks out`);
    await test.idle(1);
    test.assert(r.saucer.entity() === undefined && eventSaucers(arrival.payload.eventId) === 0, "the saucer is still in the world after the pause");

    // saucerStep on every active tick; magnetStep only in the magnet phase, after saucerStep in the same tick.
    const saucerCalls = r.steps.filter((s) => s.kind === "saucerStep").map((s) => s.call);
    const active = pause.call - arrival.call - 1;
    test.assert(saucerCalls.length === active && new Set(saucerCalls).size === active, `saucerStep ran ${saucerCalls.length} times over ${active} active ticks`);
    const mags = r.steps.filter((s) => s.kind === "magnetStep");
    test.assert(mags.length === release.call - magnet.call, `magnetStep ran ${mags.length} times, the magnet lasted ${release.call - magnet.call} UFO ticks`);
    test.assert(mags.every((s) => s.phase === "magnet"), "magnetStep outside the magnet phase");
    const before = mags.filter((s) => !r.steps.some((t) => t.kind === "saucerStep" && t.call === s.call && t.seq < s.seq));
    test.assert(before.length === 0, `${before.length} magnetStep calls without a saucerStep before them in the same tick`);

    // AC#8: one interval for the whole event, its callback once a tick, and the core's own cost.
    const ticks = [...r.host.perTick.entries()].filter(([t]) => t >= arrival.tick && t <= pause.tick);
    const doubled = ticks.filter(([, n]) => n !== 1);
    const missing = pause.tick - arrival.tick + 1 - ticks.length;
    const coreMs = r.host.tickMs - r.consumerMs;
    log(
      `budget RESULT event: runInterval calls ${r.host.intervals}, cleared ${r.host.cleared}; ${ticks.length} game ticks, ${doubled.length} with a second callback, ${missing} without one; ` +
        `script ms inside the core's tick ${r.host.tickMs.toFixed(1)}, of it consumers ${r.consumerMs.toFixed(1)}, core alone ${coreMs.toFixed(1)} = ${((coreMs * 1000) / Math.max(1, active)).toFixed(1)} µs per active tick (clock ${fine.name})`
    );
    test.assert(r.host.intervals === 1, `the core created ${r.host.intervals} intervals`);
    test.assert(doubled.length === 0 && missing === 0, `the interval callback ran ${doubled.length} doubled and ${missing} missing ticks during the event`);

    // Second case: a centre at y 290 hovers at the cap, ceiling − 15.
    const top = test.worldBlockLocation({ x: STAND.x, y: 0, z: STAND.z });
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        const at = { x: top.x + dx, y: 290, z: top.z + dz };
        dim.setBlockType(at, "minecraft:stone");
        pad.push(at);
      }
    await goTo(test, p, dim, { x: top.x, y: 291, z: top.z });
    r.core.command("come", p.id);
    await waitFor(test, () => r.of("arrival").length === 2, 5, "the arrival over the pad at y 290");
    const high = r.of("arrival")[1];
    log(`phases RESULT pad at y 290: centre ${fmt(high.payload.centre)}, hoverY ${high.payload.hoverY}, saucer at ${high.entityAt === undefined ? "none" : fmt(high.entityAt)}`);
    test.assert(high.payload.centre.y === 290, `the centre over the pad is at y ${high.payload.centre.y}`);
    test.assert(high.payload.hoverY === ceiling - 15 && high.payload.hoverY === 305, `hoverY over a y 290 centre is ${high.payload.hoverY}, not ceiling − 15 = ${ceiling - 15}`);
    r.core.command("stop");
    await waitFor(test, () => r.core.session() === undefined, 5, "the stop over the pad");
  } finally {
    r.stop();
    for (const at of pad) dim.setBlockType(at, "minecraft:air");
    unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2700)
  .tag("andrew");

// ------------------------------------------------ AC#4: Overworld only, waits for a player, one saucer (L0-ufoc-ac05)

registerAsync("andrew", "ufo_overworld_only", async (test: Test): Promise<void> => {
  const r = rig({ durations: { arrival: 20, magnet: 200, departure: 20, downed: 10 }, random: () => 0 });
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const unloads: Array<() => void> = [await loadCorridor(test, "andrew_gt_ufo_o")];
  let most = 0;
  const watch = system.runInterval(() => {
    most = Math.max(most, saucersEverywhere());
  }, 1);
  try {
    const p = test.spawnSimulatedPlayer(STAND, "ufo_dims", GameMode.Survival);
    r.players.push(p);
    const nether = await room(test, world.getDimension("nether"), "andrew_gt_ufo_n", origin.x, 40, origin.z, "minecraft:netherrack");
    unloads.push(nether.unload);
    const end = await room(test, world.getDimension("the_end"), "andrew_gt_ufo_e", origin.x + 400, 60, origin.z, "minecraft:end_stone");
    unloads.push(end.unload);
    await test.idle(4);
    let due = false;

    for (const [label, dim, stand] of [
      ["the Nether", world.getDimension("nether"), nether.stand],
      ["the End", world.getDimension("the_end"), end.stand],
    ] as const) {
      await goTo(test, p, dim, stand);
      // Due only once the player has left: an idle check in between would start the event in the Overworld.
      if (!due) r.store.set(NEXT_MS, r.clock.peek() - 1);
      due = true;
      const refused = r.core.command("come", p.id);
      await test.idle(300);
      log(`dims RESULT ${label}: 300 ticks due with the only player there — arrivals ${r.of("arrival").length}; come: ${refused.ok ? "accepted" : "refused"} (${refused.message})`);
      test.assert(r.of("arrival").length === 0 && r.core.session() === undefined, `an arrival started with the only player in ${label}`);
      test.assert(!refused.ok, `come from ${label} was accepted with nobody in the Overworld`);
      test.assert(r.next() === r.clock.peek() - 1, `waiting in ${label} rewrote next_ms`);
    }

    await goTo(test, p, test.getDimension(), test.worldBlockLocation(STAND));
    const took = await waitFor(test, () => r.of("arrival").length === 1, IDLE_WINDOW, "the arrival once the player is back in the Overworld");
    const a = r.of("arrival")[0];
    const under = centreUnder(p.location);
    log(`dims RESULT back in the Overworld: arrival after ${took} ticks, centre ${fmt(a.payload.centre)}, saucer in ${a.entityDim ?? "none"}`);
    test.assert(a.payload.centre.x === under.x && a.payload.centre.z === under.z, `the arrival is centred at ${fmt(a.payload.centre)}, not under the player ${fmt(under)}`);
    test.assert(a.entityDim === "minecraft:overworld", `the saucer is in ${a.entityDim ?? "no dimension"}`);

    const second = r.core.command("come", p.id);
    await test.idle(10);
    test.assert(!second.ok && r.of("arrival").length === 1 && r.core.session()?.eventId === a.payload.eventId, "a second come during a live event was not refused");
    test.assert(saucersEverywhere() === 1, `${saucersEverywhere()} saucers in the world during the event`);
    await waitFor(test, () => r.core.session()?.phase === "magnet", 30, "the magnet phase");
    r.core.command("stop");
    await waitFor(test, () => r.core.session() === undefined, 5, "the stop");
    await test.idle(2);
    log(`dims RESULT at most ${most} saucer(s) in the three dimensions at once; ${saucersEverywhere()} after the stop`);
    test.assert(most === 1, `at most ${most} saucers at once, not 1`);
    test.assert(saucersEverywhere() === 0, "a saucer is left after the stop");
  } finally {
    system.clearRun(watch);
    r.stop();
    for (const unload of unloads) unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1600)
  .tag("andrew");

// ------------------------------------------------ AC#6: operators only, and what each action does (L0-ufoc-ac06)

registerAsync("andrew", "ufo_commands_operator", async (test: Test): Promise<void> => {
  const r = rig({ durations: { arrival: 20, magnet: 200, departure: 20, downed: 10 }, random: () => 0 });
  const unload = await loadCorridor(test, "andrew_gt_ufo_c");
  try {
    const op = test.spawnSimulatedPlayer(STAND, "ufo_cmd_op", GameMode.Creative);
    op.commandPermissionLevel = CommandPermissionLevel.GameDirectors;
    const guest = test.spawnSimulatedPlayer(STAND_2, "ufo_cmd_guest", GameMode.Survival);
    guest.commandPermissionLevel = CommandPermissionLevel.Any;
    r.players.push(op, guest);
    await test.idle(10);

    const nextBefore = r.next();
    const guestRuns = ["come", "stop", "enable", "disable"].map((a) => `${a} -> ${run(guest, a)}`);
    await test.idle(3);
    log(`commands RESULT guest (level ${guest.commandPermissionLevel}): ${guestRuns.join("; ")}`);
    test.assert(r.core.pendingCommands() === 0 && r.core.session() === undefined && r.of("arrival").length === 0, "a non-operator's command reached the core");
    test.assert(!r.store.data.has(ENABLED) && r.next() === nextBefore, "a non-operator changed the stored state");
    test.assert(guestRuns.every((g) => !accepted(g.split(" -> ")[1])), `a guest's command was answered with success: ${guestRuns.join("; ")}`);
    // The release pack's /andrew:ufo is registered and answers; `stop` with no UFO changes nothing there.
    // It reads a SimulatedPlayer as undefined, so it cannot see the guest's level: logged, not asserted.
    const releaseGuest = run(guest, "stop", UFO_COMMAND);
    const releaseOp = run(op, "stop", UFO_COMMAND);
    log(`commands RESULT release ${UFO_COMMAND} stop: guest -> ${releaseGuest}; operator -> ${releaseOp}`);
    test.assert(accepted(releaseOp), `the release command answered the operator ${releaseOp}`);

    log(`commands RESULT op come -> ${run(op, "come")}`);
    await waitFor(test, () => r.core.session() !== undefined, 3, "the operator's come");
    test.assert(r.core.session()?.targetId === op.id && r.core.session()?.source === "command", `come targeted ${r.core.session()?.targetId}, not the operator ${op.id}`);
    await waitFor(test, () => r.core.session()?.phase === "magnet", 25, "the magnet phase");
    const eventId = r.core.session()?.eventId as string;
    test.assert(eventSaucers(eventId) === 1, "no saucer before the stop");
    const seen = r.phases.length;
    const at = system.currentTick;
    log(`commands RESULT op stop -> ${run(op, "stop")}`);
    const took = await waitFor(test, () => r.core.session() === undefined, 3, "the operator's stop");
    const after = r.phases.slice(seen).map((x) => x.phase).join();
    log(`commands RESULT stop: phases ${after} within ${system.currentTick - at} ticks (${took} waits); saucers of the event ${eventSaucers(eventId)}`);
    test.assert(after === "release,pause", `stop in the magnet phase published ${after}`);
    test.assert(r.saucer.entity() === undefined && eventSaucers(eventId) === 0, "the saucer survived the stop");
    test.assert(r.core.lastEnd()?.reason === "stop" && r.next() === r.clock.peek() + PAUSE_MS, `after stop next_ms = now + ${(r.next() ?? 0) - r.clock.peek()} ms`);

    log(`commands RESULT op disable -> ${run(op, "disable")}`);
    await test.idle(2);
    test.assert(r.store.data.get(ENABLED) === false, "disable did not store the flag");
    r.store.set(NEXT_MS, r.clock.peek() - 1);
    await test.idle(IDLE_CHECK_TICKS + 20);
    test.assert(r.of("arrival").length === 1, "a scheduled arrival started while disabled");

    log(`commands RESULT op come while disabled -> ${run(op, "come")}`);
    await waitFor(test, () => r.core.session() !== undefined, 3, "come while disabled");
    log(`commands RESULT op disable mid-event -> ${run(op, "disable")}`);
    await waitFor(test, () => r.core.session() === undefined, 3, "disable to stop the live event");
    test.assert(r.core.lastEnd()?.reason === "stop", `disable ended the event by ${r.core.lastEnd()?.reason}`);

    r.store.set(NEXT_MS, r.clock.peek() - 5);
    log(`commands RESULT op enable -> ${run(op, "enable")}`);
    await test.idle(2);
    test.assert(r.store.data.get(ENABLED) === true, "enable did not store the flag");
    test.assert(r.next() === r.clock.peek() + PAUSE_MS, `enable left an overdue next_ms (${(r.next() ?? 0) - r.clock.peek()} ms from now)`);
    await test.idle(IDLE_CHECK_TICKS + 5);
    test.assert(r.core.session() === undefined, "re-enabling dropped a saucer at once");
  } finally {
    r.stop();
    unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ------------------------------------------------ AC#7: the arrival notice within 150 blocks (L0-ufoc-ac07)

registerAsync("andrew", "ufo_arrival_notice", async (test: Test): Promise<void> => {
  const r = rig({ durations: SHORT, random: () => 0 });
  const dim = test.getDimension();
  const c = test.worldBlockLocation({ x: STAND.x, y: STAND.y - 1, z: STAND.z });
  const unloads: Array<() => void> = [await loadCorridor(test, "andrew_gt_ufo_m")];
  try {
    const spots: Array<{ name: string; dz: number }> = [
      { name: "ufo_near_149", dz: 149 },
      { name: "ufo_far_151", dz: 151 },
    ];
    const a = test.spawnSimulatedPlayer(STAND, "ufo_target_0", GameMode.Survival);
    const placed: SimulatedPlayer[] = [];
    for (const [i, s] of spots.entries()) {
      unloads.push(await loadBox(test, dim, `andrew_gt_ufo_p${i}`, { min: [c.x - 2, 0, c.z + s.dz - 2], max: [c.x + 2, 0, c.z + s.dz + 2] }));
      const ground = dim.getTopmostBlock({ x: c.x, z: c.z + s.dz });
      if (ground === undefined) throw new Error(`no ground ${s.dz} blocks out`);
      const p = test.spawnSimulatedPlayer(STAND_2, s.name, GameMode.Survival);
      await goTo(test, p, dim, { x: c.x, y: ground.location.y + 1, z: c.z + s.dz });
      placed.push(p);
    }
    const nether = await room(test, world.getDimension("nether"), "andrew_gt_ufo_q", c.x, 40, c.z, "minecraft:netherrack");
    unloads.push(nether.unload);
    const d = test.spawnSimulatedPlayer(STAND_2, "ufo_nether", GameMode.Survival);
    await goTo(test, d, world.getDimension("nether"), nether.stand);
    r.players.push(a, ...placed, d);
    await test.idle(4);

    r.core.command("come", a.id);
    await waitFor(test, () => r.of("arrival").length === 1, 3, "the arrival");
    await test.idle(3);
    const centre = r.of("arrival")[0].payload.centre;
    const report = r.players.map((p) => {
      const msgs = r.inbox.get(p.name) ?? [];
      return `${p.name} ${p.dimension.id.replace("minecraft:", "")} ${horizontalDistance(centre, p.location).toFixed(1)} blocks: ${msgs.length} [${msgs.map((m) => JSON.stringify(m)).join(" ")}]`;
    });
    log(`notice RESULT ${report.join("; ")}`);
    const got = (p: SimulatedPlayer): RawMessage[] => r.inbox.get(p.name) ?? [];
    const isNotice = (m: RawMessage): boolean => m.rawtext?.length === 1 && m.rawtext[0].translate === ARRIVAL_TEXT;
    for (const p of [a, placed[0]]) {
      test.assert(horizontalDistance(centre, p.location) <= NOTICE_RANGE, `${p.name} is not within ${NOTICE_RANGE} blocks — the scenario is wrong`);
      test.assert(got(p).length === 1 && isNotice(got(p)[0]), `${p.name} got ${got(p).length} message(s), not one ${ARRIVAL_TEXT}`);
    }
    test.assert(horizontalDistance(centre, placed[1].location) > NOTICE_RANGE, `${placed[1].name} is within ${NOTICE_RANGE} blocks — the scenario is wrong`);
    test.assert(got(placed[1]).length === 0, `${placed[1].name}, 151 blocks out, got the notice`);
    test.assert(got(d).length === 0, `${d.name}, in the Nether, got the notice`);
    r.core.command("stop");
    await waitFor(test, () => r.core.session() === undefined, 5, "the stop");
  } finally {
    r.stop();
    for (const unload of unloads) unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ------------------------------------------------ one listener's failure is its own (UFOC-ARRIVE)

const STUB = "gt_throwing_stub";

registerAsync("andrew", "ufo_listener_throws", async (test: Test): Promise<void> => {
  const heard: Phase[] = [];
  const stub = {
    name: STUB,
    onPhase: (phase: Phase): void => {
      heard.push(phase);
      throw new Error(`${STUB} refuses ${phase}`);
    },
  };
  const unload = await loadCorridor(test, "andrew_gt_ufo_l");
  let r = rig({ durations: SHORT, random: () => 0, extra: [stub] });
  try {
    const p = test.spawnSimulatedPlayer(STAND, "ufo_listener", GameMode.Survival);
    r.players.push(p);
    await test.idle(4);

    // A listener that throws on every phase: the saucer, the magnet and the recorder after it go on.
    test.assert(r.core.command("come", p.id).ok, "come was refused");
    await waitFor(test, () => r.of("pause").length === 1, SHORT.arrival + SHORT.magnet + SHORT.departure + 20, "the event to end");
    const order = r.phases.map((x) => x.phase).join(" → ");
    const blamed = r.logs.filter((l) => l.includes(`the ${STUB} listener threw`));
    const [arrival, magnet] = [r.of("arrival")[0], r.of("magnet")[0]];
    log(
      `listener RESULT throwing stub: recorder heard ${order}; stub heard ${heard.join(" → ")}; ended (${r.core.lastEnd()?.reason ?? "?"}); ` +
        `saucer at the arrival ${arrival?.entityAt === undefined ? "none" : fmt(arrival.entityAt)}, at the magnet ${magnet?.entityAt === undefined ? "none" : fmt(magnet.entityAt)}; ` +
        `notices ${(r.inbox.get(p.name) ?? []).length}; log lines naming the stub ${blamed.length}: ${blamed.join(" | ")}`
    );
    test.assert(order === "arrival → magnet → release → departure → pause", `a throwing listener cut the event to ${order}`);
    test.assert(r.core.lastEnd()?.reason === "departed", `the event ended by ${r.core.lastEnd()?.reason ?? "?"}, not departed`);
    test.assert(heard.join(" → ") === order, `the stub heard ${heard.join(" → ")}`);
    test.assert(arrival?.entityAt !== undefined && magnet?.entityAt !== undefined, "the saucer did not fly past the stub's failures");
    test.assert((r.inbox.get(p.name) ?? []).length === 1, `the target got ${(r.inbox.get(p.name) ?? []).length} notices, not 1`);
    for (const phase of ["arrival", "magnet", "release", "departure", "pause"])
      test.assert(
        blamed.some((l) => l.includes(`threw on ${phase}`) && l.includes(`${STUB} refuses ${phase}`)),
        `no log line names the ${STUB} listener's failure on ${phase}`
      );
    test.assert(!r.logs.some((l) => l.includes("aborting")), `a listener's failure aborted: ${r.logs.filter((l) => l.includes("aborting")).join(" | ")}`);
    r.stop();

    // The saucer's own arrival failing: no saucer, so no event and no notice of one.
    r = rig({ durations: SHORT, random: () => 0, failArrival: true });
    r.players.push(p);
    test.assert(r.core.command("come", p.id).ok, "come to the failing saucer was refused");
    await waitFor(test, () => r.of("pause").length === 1, 10, "the event without a saucer to end");
    const failed = r.of("arrival")[0];
    const ended = r.of("pause")[0];
    const saucerLine = r.logs.filter((l) => l.includes("the saucer listener threw on arrival"));
    log(
      `listener RESULT failing saucer: ${r.phases.map((x) => x.phase).join(" → ")}, ended (${r.core.lastEnd()?.reason ?? "?"}) after ${ended.call - failed.call} UFO ticks; ` +
        `notices ${(r.inbox.get(p.name) ?? []).length}; next_ms now + ${(r.next() ?? 0) - r.clock.peek()} ms; ${saucerLine.join(" | ")}`
    );
    test.assert(r.core.lastEnd()?.reason === "abort" && ended.call - failed.call <= 2, `without a saucer the event ended by ${r.core.lastEnd()?.reason ?? "?"} after ${ended.call - failed.call} ticks`);
    test.assert((r.inbox.get(p.name) ?? []).length === 0, `the target was told of a UFO that never appeared (${(r.inbox.get(p.name) ?? []).length} notices)`);
    test.assert(saucerLine.length === 1, `${saucerLine.length} log lines name the saucer listener's failure on arrival`);
    test.assert(r.next() === r.clock.peek() + PAUSE_MS, `after the failed arrival next_ms = now + ${(r.next() ?? 0) - r.clock.peek()} ms, not + ${PAUSE_MS}`);
  } finally {
    r.stop();
    unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC#8: the idle cost (L0-ufoc-ac08, C-5d)

const IDLE_TICKS = 2000;
const BENCH_TICKS = 20_000;

registerAsync("andrew", "ufo_idle_budget", async (test: Test): Promise<void> => {
  const r = rig({ durations: SHORT, random: () => 0 });
  try {
    r.store.set(NEXT_MS, r.clock.peek() + 3_600_000);
    await test.idle(2);
    const [reads0, now0, calls0] = [r.store.reads, r.clock.reads, r.host.calls];
    r.host.tickMs = 0;
    r.timing = true;
    await test.idle(IDLE_TICKS);
    r.timing = false;
    const calls = r.host.calls - calls0;
    const reads = r.store.reads - reads0;
    const nows = r.clock.reads - now0;

    // The same idle path, called back to back on a core of its own: a resolution the per-tick clock lacks.
    const bench = new UfoCore(
      { ...r.env, store: { get: () => r.clock.peek() + 3_600_000, set: () => {} } },
      { scope: "gtb", saucer: { onPhase: () => {}, saucerStep: () => {}, saucerPosition: () => undefined } }
    );
    const start = Date.now();
    for (let i = 0; i < BENCH_TICKS; i++) bench.tick();
    const benchMs = Date.now() - start;
    log(
      `budget RESULT idle: ${calls} UFO ticks with no session, now() read ${nows} times, the store ${reads} times; script ms inside the core's tick ${r.host.tickMs.toFixed(2)} ` +
        `= ${((r.host.tickMs * 1000) / Math.max(1, calls)).toFixed(2)} µs a tick (clock ${fine.name}); back to back ${BENCH_TICKS} idle ticks in ${benchMs} ms = ${((benchMs * 1000) / BENCH_TICKS).toFixed(3)} µs a tick; ` +
        `runInterval calls ${r.host.intervals}`
    );
    test.assert(calls >= IDLE_TICKS - 2, `the interval ran ${calls} times over ${IDLE_TICKS} ticks`);
    test.assert(nows <= IDLE_TICKS / IDLE_CHECK_TICKS + 1 && reads <= IDLE_TICKS / IDLE_CHECK_TICKS + 1, `idle reads: now() ${nows}, store ${reads} over ${calls} ticks`);
    test.assert(r.host.intervals === 1, `the core created ${r.host.intervals} intervals`);
    test.assert(r.core.session() === undefined && r.store.writes === 1, `the idle core wrote ${r.store.writes - 1} times`);
  } finally {
    r.stop();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(IDLE_TICKS + 200)
  .tag("andrew");

export const UFO_CORE_TESTS = [
  "ufo_schedule_scaled_clock",
  "ufo_phases_real_durations",
  "ufo_overworld_only",
  "ufo_commands_operator",
  "ufo_arrival_notice",
  "ufo_listener_throws",
  "ufo_idle_budget",
];
