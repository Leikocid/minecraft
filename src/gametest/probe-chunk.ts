// stage4-probe, strf-p006 questions 9, 11 and 8 against BDS 1.26.51.1:
// is a chunk's loaded state observable, does /tickingarea force-load chunks
// 500 blocks out, and how much the dynamic-property store takes.
//
// Same contract as probe-place.ts: a test passes when its measurement
// completed; the engine's answer is the "[probe] Qn RESULT …" line. The
// player-less half of Q9/Q11 runs in the selftest lane of bds:check
// (src/selftest/main.ts) — this world always has GameTest's own machinery in it.

import { GameMode, Vector3, world } from "@minecraft/server";
import { Test, registerAsync } from "@minecraft/server-gametest";
import {
  errText,
  inspectChunkApi,
  readLocation,
  scanFrontier,
  tickingAreaLimit,
  tickingAreaLoad,
  tryWrite,
} from "../selftest/chunk-probe";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };

/** BDS default; docker/bds/server.properties does not override it. */
const VIEW_DISTANCE_CHUNKS = 32;

const log = (msg: string): void => console.warn(`[probe] ${msg}`);
const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });

// ------------------------------------------------ Q9: is "loaded" observable

registerAsync("andrew", "probe_chunk_loaded", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const base = test.worldBlockLocation({ x: 0, y: 1, z: 0 });
  const present = inspectChunkApi(dim, log, "Q9");

  const player = test.spawnSimulatedPlayer(STAND, "andrew_probe_q9", GameMode.Survival);
  await test.idle(100);
  const at = player.location;
  const origin = { x: Math.floor(at.x), y: base.y, z: Math.floor(at.z) };
  const frontier = scanFrontier(dim, origin, VIEW_DISTANCE_CHUNKS + 16, log, "Q9");

  const probes: Array<[string, Vector3]> = [
    ["player chunk", origin],
    [`view-distance+5 (${VIEW_DISTANCE_CHUNKS + 5} chunks)`, add(origin, { x: (VIEW_DISTANCE_CHUNKS + 5) * 16, y: 0, z: 0 })],
    [`measured frontier+5 (${frontier + 5} chunks)`, add(origin, { x: (frontier + 5) * 16, y: 0, z: 0 })],
    ["10000 blocks out", add(origin, { x: 10000, y: 0, z: 10000 })],
  ];
  let unloadedRead = "no unloaded location observed";
  let unloadedWrite = "";
  for (const [label, p] of probes) {
    const read = readLocation(dim, p);
    log(`Q9 ${label}: ${read}`);
    if (!dim.isChunkLoaded(p)) {
      unloadedRead = read.replace(/^isChunkLoaded=\w+ /, "");
      unloadedWrite = tryWrite(dim, p);
      log(`Q9 ${label}: ${unloadedWrite}`);
    }
  }

  log(
    `Q9 RESULT dimension.isChunkLoaded ${present ? "PRESENT" : "ABSENT"} on the 2.10.0 Dimension object; ` +
      `loaded frontier around a simulated player = ${frontier} chunk(s); in an unloaded chunk: ${unloadedRead}; ${unloadedWrite}`
  );
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ------------------------------------------------ Q11: /tickingarea 500 blocks out

registerAsync("andrew", "probe_tickingarea_load", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const base = test.worldBlockLocation({ x: 0, y: 1, z: 0 });
  const center = add(base, { x: 500, y: 0, z: 0 });
  const wait = (ticks: number) => test.idle(ticks);

  const r = await tickingAreaLoad(dim, center, "andrew_probe_q11", wait, log, "Q11");
  const limit = tickingAreaLimit(dim, add(base, { x: 3000, y: 0, z: 0 }), log, "Q11");

  log(
    `Q11 RESULT runCommand tickingarea add at 500 blocks: ${r.addResult}; loaded before=${r.loadedBefore}; ` +
      `${r.loaded ? `loaded after ${r.ticks} tick(s) / ${r.ms} ms` : "did NOT load"}; ` +
      `unload after remove=${r.unloadTicks < 0 ? ">200 ticks" : `${r.unloadTicks} tick(s)`}; ` +
      `areas added before refusal=${limit.added} (GameTest world; ${limit.refusal})`
  );
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ------------------------------------------------ Q8: dynamic-property budget

/** Stop the total-size walk here if nothing refuses first. */
const TOTAL_CAP_BYTES = 32 * 1024 * 1024;
const MIB = 1024 * 1024;

registerAsync("andrew", "probe_dynamic_property_budget", async (test: Test): Promise<void> => {
  const KEY = "andrew:probe_dp";
  const baseline = world.getDynamicPropertyTotalByteCount();

  const tryPut = (key: string, value: string): string => {
    try {
      world.setDynamicProperty(key, value);
      return "";
    } catch (err) {
      return errText(err);
    }
  };

  /** Largest length of `ch.repeat(n)` one key accepts, by bisection up to 4 Mi chars. */
  const maxLength = (ch: string): { max: number; refusal: string; readBack: number; bytes: number } => {
    let lo = 0;
    let hi = 4 * MIB;
    let refusal = tryPut(KEY, ch.repeat(hi));
    if (refusal === "") return { max: hi, refusal: "none up to 4 Mi chars", readBack: -1, bytes: -1 };
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      const why = tryPut(KEY, ch.repeat(mid));
      if (why === "") lo = mid;
      else {
        hi = mid;
        refusal = why;
      }
    }
    world.setDynamicProperty(KEY, ch.repeat(lo));
    const back = world.getDynamicProperty(KEY);
    const bytes = world.getDynamicPropertyTotalByteCount() - baseline;
    world.setDynamicProperty(KEY, undefined);
    return { max: lo, refusal, readBack: typeof back === "string" ? back.length : -1, bytes };
  };

  const ascii = maxLength("a");
  log(`Q8 one key, ASCII: max ${ascii.max} chars accepted (read back ${ascii.readBack}, +${ascii.bytes} bytes total); ${ascii.max + 1}: ${ascii.refusal}`);
  const cyr = maxLength("ж");
  log(`Q8 one key, 2-byte UTF-8 'ж': max ${cyr.max} chars accepted (read back ${cyr.readBack}, +${cyr.bytes} bytes total); ${cyr.max + 1}: ${cyr.refusal}`);
  await test.idle(1);

  const value = "x".repeat(Math.min(ascii.max, MIB));
  const keys: string[] = [];
  let refusal = `none up to the ${TOTAL_CAP_BYTES / MIB} MiB cap`;
  let nextMilestone = MIB;
  const t0 = Date.now();
  try {
    while (world.getDynamicPropertyTotalByteCount() - baseline < TOTAL_CAP_BYTES) {
      const key = `andrew:probe_dp_${keys.length}`;
      const why = tryPut(key, value);
      if (why !== "") {
        refusal = `key #${keys.length + 1}: ${why}`;
        break;
      }
      keys.push(key);
      const total = world.getDynamicPropertyTotalByteCount() - baseline;
      if (total >= nextMilestone) {
        log(`Q8 total ${(total / MIB).toFixed(2)} MiB in ${keys.length} key(s), ${Date.now() - t0} ms so far`);
        nextMilestone += MIB;
        await test.idle(1);
      }
    }
    const total = world.getDynamicPropertyTotalByteCount() - baseline;
    const last = world.getDynamicProperty(keys[keys.length - 1] ?? KEY);
    log(
      `Q8 RESULT one key: ${ascii.max} ASCII chars / ${cyr.max} 'ж' chars; total walk: ${keys.length} key(s) of ` +
        `${value.length} chars = ${total} bytes (${(total / MIB).toFixed(2)} MiB) in ${Date.now() - t0} ms, refusal: ${refusal}; ` +
        `last key reads back ${typeof last === "string" ? last.length : "non-string"} chars; ` +
        `engine warnings, if any, are the non-[probe] "dynamic propert" lines of the log`
    );
  } finally {
    for (const key of keys) world.setDynamicProperty(key, undefined);
    log(`Q8 cleanup: ${keys.length} key(s) removed, total now ${world.getDynamicPropertyTotalByteCount()} bytes (baseline ${baseline})`);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

export const PROBE_CHUNK_TESTS = ["probe_chunk_loaded", "probe_tickingarea_load", "probe_dynamic_property_budget"];

log(`registered ${PROBE_CHUNK_TESTS.length} probe test(s): ${PROBE_CHUNK_TESTS.join(" ")}`);
