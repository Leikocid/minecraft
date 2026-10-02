// UFO restart checks for bds:check (L0-ufoc-ac03, ac05 AC-18, L0-xcx17).
//
// Three product cores, scope "st", each over its own slice of this pack's
// dynamic properties (a pack reads only the properties it wrote, so the
// release pack's schedule is not visible from here):
//   timer    — run 1 stores a future next_ms; run 2 reads it back unchanged.
//   flight   — run 1 starts an event 3000 blocks out, lets the stub saucer
//              reach the magnet phase, then stops stepping the core (the point
//              where a server stops mid-event) and lets the saucer's chunk
//              unload; run 2 finds the in-flight marker, reschedules from the
//              load, and removes the saucer when the chunk loads again.
//   disabled — run 1 disables through the core's command path and leaves an
//              overdue next_ms; run 2 starts no arrival with a target present.
// The release pack's own /andrew:ufo disable and enable run from here too;
// bds-check.mjs reads their effect in the release pack's load line of each run.

import { type Dimension, type Vector3, system, world } from "@minecraft/server";
import { startUfo } from "../ufo";
import { FIRST_MAX_MS, FIRST_MIN_MS, PAUSE_MS, type UfoDurations, type UfoEnv, type UfoPlayer, type UfoStore } from "../ufo/env";
import { EVENT_TAG, IRON_TAG, SAUCER_ID, UFO_TAG, UfoCore, type UfoAction } from "../ufo/event";
import { ENABLED, IN_FLIGHT, NEXT_MS } from "../ufo/schedule";
import { type StubSaucer, createStubSaucer } from "../ufo/stub-saucer";
import type { Log, Wait } from "./chunk-probe";

const MARKER = "andrew:selftest_ufo";
const SCOPE = "st";
const AREA = "andrew_selftest_ufo";
/** Far outside anything loaded at a player-less start. */
const FAR: Vector3 = { x: 3000.5, y: 101, z: 3000.5 };
/** The arrival leg in 20 ticks, a magnet phase longer than any bds-check run. */
const FLIGHT: UfoDurations = { arrival: 20, magnet: 1_000_000, departure: 20, downed: 10 };
/** UFO §10: the reschedule happens at load; the check reads it within seconds. */
const LOAD_SLACK_MS = 5_000;
/** The release pack's command, run from this script with the script's permission. */
const RELEASE_COMMAND = "andrew:ufo";

interface Marker {
  timerAt: number;
  saucerId: string;
  eventId: string;
  hover: Vector3;
  standId: string;
}

const target: UfoPlayer = { id: "selftest-target", name: "selftest target", location: FAR, sendMessage: () => {} };

function scopedStore(prefix: string): UfoStore {
  return {
    get: (key) => world.getDynamicProperty(prefix + key),
    set: (key, value) => world.setDynamicProperty(prefix + key, value),
  };
}

interface Case {
  readonly store: UfoStore;
  readonly core: UfoCore;
  readonly saucer: StubSaucer;
  readonly logs: string[];
  undo?: () => void;
  /** What the store held at worldLoad, before the core read it. */
  loadedWith?: unknown;
  loadedAt?: number;
}

function makeCase(prefix: string, durations: UfoDurations): Case {
  const store = scopedStore(prefix);
  const logs: string[] = [];
  const ceiling = (): number => world.getDimension("overworld").heightRange.max;
  const env: UfoEnv = {
    now: () => Date.now(),
    durations,
    pauseMs: PAUSE_MS,
    firstMinMs: FIRST_MIN_MS,
    firstMaxMs: FIRST_MAX_MS,
    overworldPlayers: () => [target],
    random: () => 0,
    store,
    ceiling,
    log: (msg) => {
      logs.push(msg);
      console.warn(`[selftest] ${msg}`);
    },
  };
  const saucer = createStubSaucer({ overworld: () => world.getDimension("overworld"), random: () => 0, durations, ceiling });
  return { store, saucer, logs, core: new UfoCore(env, { scope: SCOPE, saucer }) };
}

const cases = {
  timer: makeCase("st1:", FLIGHT),
  flight: makeCase("st2:", FLIGHT),
  disabled: makeCase("st3:", FLIGHT),
};

/** Ids of every entity removed in this run, by any pack's script or by the engine. */
const removed = new Set<string>();
world.afterEvents.entityRemove.subscribe((event) => {
  removed.add(event.removedEntityId);
});

function readMarker(): Marker | undefined {
  const raw = world.getDynamicProperty(MARKER);
  return typeof raw === "string" ? (JSON.parse(raw) as Marker) : undefined;
}

export const ufoRestartPhase = (): 1 | 2 => (readMarker() === undefined ? 1 : 2);

/** Every run, at worldLoad and before anything else: what a production start does, per case. */
export function ufoRestartLoad(): void {
  for (const c of Object.values(cases)) {
    c.loadedWith = c.store.get(NEXT_MS);
    c.loadedAt = Date.now();
    c.undo = startUfo(c.core, world, system);
  }
}

function assert(cond: unknown, why: string): asserts cond {
  if (!cond) throw new Error(why);
}

async function loadFar(dim: Dimension, wait: Wait): Promise<void> {
  const r = dim.runCommand(`tickingarea add 2992 0 2992 3103 0 3007 ${AREA}`);
  assert(r.successCount > 0, `tickingarea add ${AREA} refused`);
  for (let t = 0; t < 600; t++) {
    if (dim.isChunkLoaded(FAR) && dim.isChunkLoaded({ x: 3090, y: 100, z: 3000 })) return;
    await wait(1);
  }
  throw new Error(`the far area did not load within 600 ticks`);
}

async function unloadFar(dim: Dimension, wait: Wait): Promise<void> {
  dim.runCommand(`tickingarea remove ${AREA}`);
  for (let t = 0; t < 400; t++) {
    if (!dim.isChunkLoaded(FAR)) return;
    await wait(1);
  }
  throw new Error("the far area stayed loaded 400 ticks after its ticking area went");
}

async function until(cond: () => boolean, ticks: number, wait: Wait, label: string): Promise<void> {
  for (let t = 0; t < ticks; t++) {
    if (cond()) return;
    await wait(1);
  }
  throw new Error(`${label}: not within ${ticks} ticks`);
}

/** Runs a release-pack command from script and returns its successCount, or the throw. */
function release(action: UfoAction): string {
  try {
    return `successCount=${world.getDimension("overworld").runCommand(`${RELEASE_COMMAND} ${action}`).successCount}`;
  } catch (err) {
    return `threw ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function ufoRestartRun1(wait: Wait, log: Log): Promise<void> {
  const dim = world.getDimension("overworld");
  const timerAt = Date.now() + 3_600_000;
  cases.timer.store.set(NEXT_MS, timerAt);

  const d = cases.disabled;
  d.core.command("disable");
  await wait(2);
  assert(d.store.get(ENABLED) === false, `disable left andrew:ufo_enabled = ${String(d.store.get(ENABLED))}`);
  d.store.set(NEXT_MS, Date.now() - 1_000);

  const f = cases.flight;
  await loadFar(dim, wait);
  f.core.command("come", target.id);
  await until(() => f.core.session()?.phase === "magnet", 60, wait, "the far event to reach the magnet phase");
  await wait(3);
  const s = f.core.session();
  const e = f.saucer.entity();
  assert(s !== undefined && e !== undefined, "no live event or no saucer in the magnet phase");
  assert(f.store.get(NEXT_MS) === IN_FLIGHT, `next_ms during the event is ${String(f.store.get(NEXT_MS))}, not the marker ${IN_FLIGHT}`);
  const hover = { x: s.centre.x + 0.5, y: s.hoverY, z: s.centre.z + 0.5 };
  assert(Math.hypot(e.location.x - hover.x, e.location.z - hover.z) < 0.01 && Math.abs(e.location.y - hover.y) < 0.01, `the saucer is at ${JSON.stringify(e.location)}, not the hover point`);
  assert(e.hasTag(UFO_TAG) && e.hasTag(EVENT_TAG + s.eventId), "the saucer lacks its UFO tags");
  // What magn will tag: a held element, saved in the same chunk.
  const stand = dim.spawnEntity("minecraft:armor_stand", { x: hover.x + 1, y: hover.y - 20, z: hover.z });
  stand.addTag(IRON_TAG);
  // The server stops here: nothing steps the event any more, and nothing loads its chunk.
  f.undo?.();
  const marker: Marker = { timerAt, saucerId: e.id, eventId: s.eventId, hover, standId: stand.id };
  world.setDynamicProperty(MARKER, JSON.stringify(marker));
  await unloadFar(dim, wait);
  log(`ufo restart run 1: timer ${timerAt}; event ${s.eventId} frozen in the magnet phase, saucer ${e.id} at ${JSON.stringify(hover)}, stand ${stand.id} tagged ${IRON_TAG}; far chunk unloaded`);
  log(`ufo restart run 1: release ${RELEASE_COMMAND} disable -> ${release("disable")}`);
}

export async function ufoRestartRun2(wait: Wait, log: Log): Promise<string[]> {
  const m = readMarker();
  assert(m !== undefined, "no run-1 marker");
  const dim = world.getDimension("overworld");
  const failures: string[] = [];
  const check = (name: string, cond: boolean, why: string): void => {
    log(`ufo restart run 2: ${name} ${cond ? "holds" : "does not hold"}: ${why}`);
    if (!cond) failures.push(`${name}: ${why}`);
  };

  const t = cases.timer;
  check("timer", t.loadedWith === m.timerAt && t.store.get(NEXT_MS) === m.timerAt, `stored ${m.timerAt}, at load ${String(t.loadedWith)}, now ${String(t.store.get(NEXT_MS))}`);

  const f = cases.flight;
  const next = f.store.get(NEXT_MS);
  const at = f.loadedAt ?? 0;
  const inWindow = typeof next === "number" && next >= at + PAUSE_MS && next <= at + PAUSE_MS + LOAD_SLACK_MS;
  // The control: the marker itself survived, so the load handler is what moved it.
  check("in-flight marker", f.loadedWith === IN_FLIGHT && inWindow, `at load ${String(f.loadedWith)}, after the load handler load + ${typeof next === "number" ? next - at : "?"} ms (want ${PAUSE_MS}…${PAUSE_MS + LOAD_SLACK_MS})`);

  const loadedSaucers = (): number =>
    dim.getEntities({ type: SAUCER_ID }).filter((e) => e !== undefined).length + dim.getEntities({ tags: [UFO_TAG] }).filter((e) => e !== undefined && e.typeId !== SAUCER_ID).length;
  check("no saucer at load", loadedSaucers() === 0, `${loadedSaucers()} UFO entities in loaded chunks`);

  await loadFar(dim, wait);
  await wait(40);
  const near = dim.getEntities({ location: m.hover, maxDistance: 48 }).filter((e) => e !== undefined);
  const ufos = near.filter((e) => e.typeId === SAUCER_ID || e.hasTag(UFO_TAG));
  const removal = f.logs.find((l) => l.includes(`removed stale saucer ${m.saucerId}`));
  check(
    "no saucer after its chunk loads",
    ufos.length === 0 && removed.has(m.saucerId) && removal !== undefined,
    `${ufos.length} UFO entities near the hover point; saucer ${m.saucerId} removed in this run: ${removed.has(m.saucerId)}; by the st core's entityLoad sweep: ${removal ?? "no log line"}`
  );
  const stand = world.getEntity(m.standId);
  check("held element released", stand !== undefined && stand.isValid && !stand.hasTag(IRON_TAG), `stand ${m.standId}: ${stand === undefined ? "not found" : `tags ${JSON.stringify(stand.getTags())}`}`);
  stand?.remove();
  dim.runCommand(`tickingarea remove ${AREA}`);

  const d = cases.disabled;
  const before = d.store.get(NEXT_MS);
  await wait(220);
  check(
    "disabled",
    d.store.get(ENABLED) === false && d.core.session() === undefined && d.core.lastEnd() === undefined && d.store.get(NEXT_MS) === before && typeof before === "number" && before < Date.now(),
    `enabled ${String(d.store.get(ENABLED))}, next_ms overdue by ${typeof before === "number" ? Date.now() - before : "?"} ms, session ${d.core.session()?.eventId ?? "none"} after 220 ticks with a target present`
  );

  log(`ufo restart run 2: release ${RELEASE_COMMAND} enable -> ${release("enable")}`);
  return failures;
}
