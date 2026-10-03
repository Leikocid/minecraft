// The UFO restart ACs inside the GameTest suite (L0-ufoc-ac03, ac05 AC-18, UFO
// AC-17): scripts/bds-gametest.mjs stops and starts BDS on the same world
// between andrew:ufo_restart_seed and andrew:ufo_restart_check (RESTART_AFTER).
//
// Three product cores, scopes gtr1–gtr3, each over its own slice of this pack's
// dynamic properties; the release core ("ufo") and the "gt" cores of the other
// scenarios leave their saucers alone:
//   timer    — the seed stores a future next_ms; the check reads it back unchanged.
//   flight   — the seed starts an event 3000 blocks out, lets the saucer reach
//              the magnet phase, stops stepping the core (where a server stops
//              mid-event) and lets the saucer's chunk unload; after the restart
//              the core finds the in-flight marker, reschedules from the load and
//              removes the saucer when its chunk loads again.
//   disabled — the seed disables through the core's command path and leaves an
//              overdue next_ms; the check sees no arrival with a target present.
// The release pack's own /andrew:ufo disable runs in the seed and enable in the
// check. A pack reads only the dynamic properties it wrote, so the runner reads
// the release flag from the release pack's load line after the restart.

import { type Dimension, type Entity, type Vector3, system, world } from "@minecraft/server";
import { type Test, registerAsync } from "@minecraft/server-gametest";
import type { Box } from "../structures/clear";
import { startUfo } from "../ufo";
import { UFO_COMMAND } from "../ufo/commands";
import { FIRST_MAX_MS, FIRST_MIN_MS, PAUSE_MS, type UfoDurations, type UfoEnv, type UfoPlayer, type UfoStore } from "../ufo/env";
import { EVENT_TAG, type IntervalHost, IRON_TAG, SAUCER_ID, UFO_FAMILY, UFO_TAG, type UfoAction, UfoCore } from "../ufo/event";
import { ENABLED, IN_FLIGHT, NEXT_MS } from "../ufo/schedule";
import { type UfoSaucer, createSaucer } from "../ufo/saucer";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const RECORD = "andrew:gt_ufo_restart";
const AREA = "andrew_gt_ufo_rs";
/** Far outside every other scenario's ground. */
const FAR: Vector3 = { x: 3000.5, y: 101, z: 3000.5 };
/** FAR and the saucer's approach leg east of it. */
const FAR_BOX: Box = { min: [2992, 0, 2992], max: [3103, 0, 3007] };
/** The arrival leg in 20 ticks, a magnet phase that outlasts the whole pair. */
const FLIGHT: UfoDurations = { arrival: 20, magnet: 1_000_000, departure: 20, downed: 10 };
/** UFO §10: the reschedule happens at load; the check reads it within seconds. */
const LOAD_SLACK_MS = 5_000;
const DISABLED_TICKS = 220;
/** The check's ticks are far fewer; a check that never reaches its `finally` leaves the cores running. */
const GUARD_TICKS = 6_000;

const log = (msg: string): void => console.warn(`[gametest] ufo-restart ${msg}`);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const accepted = (outcome: string): boolean => /^successCount=[1-9]/.test(outcome);

interface SeedRecord {
  timerAt: number;
  overdueAt: number;
  saucerId: string;
  eventId: string;
  hover: Vector3;
  standId: string;
}

const target: UfoPlayer = { id: "gt-restart-target", name: "restart target", location: FAR, sendMessage: () => {} };

interface Case {
  readonly scope: string;
  readonly store: UfoStore;
  readonly core: UfoCore;
  readonly saucer: UfoSaucer;
  readonly host: IntervalHost;
  readonly logs: string[];
  /** Interval calls since this script loaded: the core ran, so its silence means something. */
  ticks: number;
  undo?: () => void;
  /** What the store held at worldLoad, before the core read it. */
  loadedWith?: unknown;
  loadedAt?: number;
}

function makeCase(scope: string): Case {
  const prefix = `${scope}:`;
  const store: UfoStore = {
    get: (key) => world.getDynamicProperty(prefix + key),
    set: (key, value) => world.setDynamicProperty(prefix + key, value),
  };
  const logs: string[] = [];
  const ceiling = (): number => world.getDimension("overworld").heightRange.max;
  const env: UfoEnv = {
    now: () => Date.now(),
    durations: FLIGHT,
    pauseMs: PAUSE_MS,
    firstMinMs: FIRST_MIN_MS,
    firstMaxMs: FIRST_MAX_MS,
    overworldPlayers: () => [target],
    random: () => 0,
    store,
    ceiling,
    log: (msg) => {
      logs.push(msg);
      log(msg);
    },
  };
  const saucer = createSaucer({ overworld: () => world.getDimension("overworld"), random: () => 0, durations: FLIGHT, ceiling });
  const c: Case = {
    scope,
    store,
    saucer,
    logs,
    ticks: 0,
    core: new UfoCore(env, { scope, saucer }),
    host: {
      runInterval: (callback, tickInterval) =>
        system.runInterval(() => {
          c.ticks++;
          callback();
        }, tickInterval),
      clearRun: (id) => system.clearRun(id),
    },
  };
  return c;
}

const cases = {
  timer: makeCase("gtr1"),
  flight: makeCase("gtr2"),
  disabled: makeCase("gtr3"),
};
const all = Object.values(cases);

function start(c: Case): void {
  c.undo ??= startUfo(c.core, world, c.host);
}

function stopAll(): number {
  let stopped = 0;
  for (const c of all) {
    if (c.undo === undefined) continue;
    c.undo();
    c.undo = undefined;
    stopped++;
  }
  return stopped;
}

function clearStores(): void {
  for (const c of all) for (const key of [NEXT_MS, ENABLED]) c.store.set(key, undefined);
}

function readRecord(): SeedRecord | undefined {
  const raw = world.getDynamicProperty(RECORD);
  return typeof raw === "string" ? (JSON.parse(raw) as SeedRecord) : undefined;
}

/** Ids of every entity removed since this script loaded, by any pack's script or by the engine. */
const removed = new Set<string>();
world.afterEvents.entityRemove.subscribe((event) => {
  removed.add(event.removedEntityId);
});

// What a production start does, per case — only in the boot after the seed, so
// no core of this file ticks through the rest of the suite.
world.afterEvents.worldLoad.subscribe(() => {
  if (readRecord() === undefined) return;
  for (const c of all) {
    c.loadedWith = c.store.get(NEXT_MS);
    c.loadedAt = Date.now();
    start(c);
  }
  log(`worldLoad: the seed's record found, cores ${all.map((c) => c.scope).join(", ")} started`);
  system.runTimeout(() => {
    const n = stopAll();
    if (n > 0) log(`guard: ${n} core(s) still running ${GUARD_TICKS} ticks after the load — stopped`);
  }, GUARD_TICKS);
});

/** Runs the release pack's command from script and returns its successCount, or the throw. */
function release(action: UfoAction): string {
  try {
    return `successCount=${world.getDimension("overworld").runCommand(`${UFO_COMMAND} ${action}`).successCount}`;
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

async function until(test: Test, cond: () => boolean, ticks: number, label: string): Promise<void> {
  for (let t = 0; t < ticks; t++) {
    if (cond()) return;
    await test.idle(1);
  }
  throw new Error(`${label}: not within ${ticks} ticks`);
}

/** UFO entities in the loaded Overworld, by the same three queries the core's sweep uses. */
function loadedUfoEntities(dim: Dimension): string[] {
  const seen = new Map<string, string>();
  for (const query of [{ type: SAUCER_ID }, { tags: [UFO_TAG] }, { families: [UFO_FAMILY] }]) {
    for (const e of dim.getEntities(query)) {
      if (e === undefined || !e.isValid || seen.has(e.id)) continue;
      seen.set(e.id, `${e.typeId} ${e.id} [${e.getTags().join(" ")}]`);
    }
  }
  return [...seen.values()];
}


function must(cond: unknown, why: string): asserts cond {
  if (!cond) throw new Error(why);
}

registerAsync("andrew", "ufo_restart_seed", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const f = cases.flight;
  const d = cases.disabled;
  let unload: (() => void) | undefined;
  let stand: Entity | undefined;
  let passed = false;
  world.setDynamicProperty(RECORD, undefined);
  clearStores();
  try {
    const timerAt = Date.now() + 3_600_000;
    cases.timer.store.set(NEXT_MS, timerAt);

    start(d);
    d.core.command("disable");
    await test.idle(2);
    must(d.store.get(ENABLED) === false, `disable left andrew:ufo_enabled = ${String(d.store.get(ENABLED))}`);
    const overdueAt = Date.now() - 1_000;
    d.store.set(NEXT_MS, overdueAt);

    unload = await loadBox(test, dim, AREA, FAR_BOX);
    start(f);
    f.core.command("come", target.id);
    await until(test, () => f.core.session()?.phase === "magnet", 60, "the far event to reach the magnet phase");
    await test.idle(3);
    const s = f.core.session();
    const e = f.saucer.entity();
    must(s !== undefined && e !== undefined, "no live event or no saucer in the magnet phase");
    must(f.store.get(NEXT_MS) === IN_FLIGHT, `next_ms during the event is ${String(f.store.get(NEXT_MS))}, not the marker ${IN_FLIGHT}`);
    const hover = { x: s.centre.x + 0.5, y: s.hoverY, z: s.centre.z + 0.5 };
    must(
      Math.hypot(e.location.x - hover.x, e.location.z - hover.z) < 0.01 && Math.abs(e.location.y - hover.y) < 0.01,
      `the saucer is at ${JSON.stringify(e.location)}, not the hover point ${JSON.stringify(hover)}`
    );
    must(e.hasTag(UFO_TAG) && e.hasTag(EVENT_TAG + s.eventId), `the saucer lacks its UFO tags: ${JSON.stringify(e.getTags())}`);
    // What magn will tag: a held element, saved in the saucer's chunk. On the ground, so no fall can kill it.
    const ground = dim.getTopmostBlock({ x: hover.x + 1, z: hover.z });
    must(ground !== undefined, "no ground under the hover point");
    stand = dim.spawnEntity("minecraft:armor_stand", { x: hover.x + 1, y: ground.location.y + 1, z: hover.z });
    stand.addTag(IRON_TAG);

    // The server stops here: nothing steps the event any more, and nothing loads its chunk.
    stopAll();
    const rec: SeedRecord = { timerAt, overdueAt, saucerId: e.id, eventId: s.eventId, hover, standId: stand.id };
    world.setDynamicProperty(RECORD, JSON.stringify(rec));
    unload();
    unload = undefined;
    await until(test, () => !dim.isChunkLoaded(FAR), 400, "the far chunk to unload after its ticking area went");

    const reply = release("disable");
    log(
      `seed RESULT timer ${timerAt}; disabled core next_ms ${overdueAt}; event ${s.eventId} frozen in the magnet phase, saucer ${e.id} at ${JSON.stringify(hover)}, ` +
        `stand ${stand.id} tagged ${IRON_TAG}; far chunk unloaded; release ${UFO_COMMAND} disable -> ${reply}`
    );
    must(accepted(reply), `the release ${UFO_COMMAND} disable answered ${reply}`);
    // The release core carries a command out on its next tick; the runner stops the server seconds after the pass line.
    await test.idle(3);
    passed = true;
  } finally {
    stopAll();
    unload?.();
    if (!passed) {
      world.setDynamicProperty(RECORD, undefined);
      const e = f.saucer.entity();
      if (e?.isValid === true) e.remove();
      if (stand?.isValid === true) stand.remove();
    }
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

registerAsync("andrew", "ufo_restart_check", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const failures: string[] = [];
  const check = (name: string, cond: boolean, why: string): void => {
    log(`check RESULT ${name} ${cond ? "holds" : "does not hold"}: ${why}`);
    if (!cond) failures.push(`${name}: ${why}`);
  };
  let unload: (() => void) | undefined;
  let standId: string | undefined;
  let releaseEnable: string | undefined;
  try {
    const m = readRecord();
    must(m !== undefined, "no record from andrew:ufo_restart_seed: it did not run in this world before the restart");
    standId = m.standId;
    must(all.every((c) => c.undo !== undefined && c.loadedAt !== undefined), "the restart cores did not start at worldLoad");

    const t = cases.timer;
    check("timer", t.loadedWith === m.timerAt && t.store.get(NEXT_MS) === m.timerAt, `stored ${m.timerAt}, at load ${String(t.loadedWith)}, now ${String(t.store.get(NEXT_MS))}`);

    const f = cases.flight;
    const next = f.store.get(NEXT_MS);
    const at = f.loadedAt ?? 0;
    const inWindow = typeof next === "number" && next >= at + PAUSE_MS && next <= at + PAUSE_MS + LOAD_SLACK_MS;
    // The control: the marker itself survived the restart, so the load handler is what moved it.
    check(
      "in-flight marker",
      f.loadedWith === IN_FLIGHT && inWindow,
      `at load ${String(f.loadedWith)}, after the load handler ${String(next)} = load + ${typeof next === "number" ? next - at : "?"} ms (want ${PAUSE_MS}…${PAUSE_MS + LOAD_SLACK_MS})`
    );

    const atLoad = loadedUfoEntities(dim);
    check("no saucer at load", atLoad.length === 0, `${atLoad.length} UFO entities in the loaded Overworld${atLoad.length > 0 ? `: ${atLoad.join("; ")}` : ""}`);

    unload = await loadBox(test, dim, AREA, FAR_BOX);
    const removal = (): string | undefined => f.logs.find((l) => l.includes(`removed stale saucer ${m.saucerId}`));
    const standNow = (): Entity | undefined => world.getEntity(m.standId);
    const loadedAtTick = system.currentTick;
    for (let n = 0; n < 200 && !(removed.has(m.saucerId) && removal() !== undefined && standNow()?.hasTag(IRON_TAG) === false); n++) await test.idle(1);
    await test.idle(5);
    const after = loadedUfoEntities(dim);
    check(
      "no saucer after its chunk loads",
      after.length === 0 && removed.has(m.saucerId) && removal() !== undefined,
      `${after.length} UFO entities in the loaded Overworld${after.length > 0 ? ` (${after.join("; ")})` : ""}; saucer ${m.saucerId} removed in this run: ${removed.has(m.saucerId)}; ` +
        `by the ${f.scope} core's entityLoad sweep: ${removal() ?? "no log line"} (${system.currentTick - loadedAtTick} ticks after the far chunks loaded)`
    );
    const stand = standNow();
    check("held element released", stand !== undefined && stand.isValid && !stand.hasTag(IRON_TAG), `stand ${m.standId}: ${stand === undefined ? "not found" : `tags ${JSON.stringify(stand.getTags())}`}`);

    const d = cases.disabled;
    const before = d.store.get(NEXT_MS);
    const ticks0 = d.ticks;
    await test.idle(DISABLED_TICKS);
    const ran = d.ticks - ticks0;
    check(
      "disabled",
      d.store.get(ENABLED) === false &&
        d.core.session() === undefined &&
        d.core.lastEnd() === undefined &&
        before === m.overdueAt &&
        d.store.get(NEXT_MS) === before &&
        before < Date.now() &&
        ran >= DISABLED_TICKS,
      `enabled ${String(d.store.get(ENABLED))}, next_ms ${String(before)} (seeded ${m.overdueAt}) overdue by ${typeof before === "number" ? Date.now() - before : "?"} ms, ` +
        `session ${d.core.session()?.eventId ?? "none"} after ${ran} core ticks with a target present`
    );

    releaseEnable = release("enable");
    log(`check RESULT release ${UFO_COMMAND} enable -> ${releaseEnable}`);
    // The release core carries a command out on its next tick; its log line is what the runner reads.
    await test.idle(3);
  } finally {
    stopAll();
    const stand = standId === undefined ? undefined : world.getEntity(standId);
    if (stand?.isValid === true) stand.remove();
    unload?.();
    clearStores();
    world.setDynamicProperty(RECORD, undefined);
    // The release flag persists in the world, so a failed check gives the UFO event back too.
    if (releaseEnable === undefined) log(`check: release ${UFO_COMMAND} enable on the way out -> ${release("enable")}`);
  }
  test.assert(failures.length === 0, failures.join("; "));
  test.assert(accepted(releaseEnable), `the release ${UFO_COMMAND} enable answered ${releaseEnable}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");
