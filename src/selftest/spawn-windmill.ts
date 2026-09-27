// The spawn Windmill of the release pack on a fresh default world, across the
// two restarts bds:check makes (§4.7, L0-wind-r011): run 1 finds exactly one,
// in the 5×5 chunks around spawn or within 500 blocks, reserved in the
// registry; runs 2 and 3 find the same one, the search not run again, and the
// same numbers of chests, spawners and guards. The release pack's dynamic
// properties are invisible here, so its state arrives as a script event.

import { type Dimension, Difficulty, system, world } from "@minecraft/server";
import { GUARD_COUNT, guardTag } from "../structures/bodies/windmill";
import { SEARCH_RADIUS, SPAWN_EVENT, SPAWN_ID, SPAWN_STATE_EVENT, STAGE1_CHUNKS, type SpawnState } from "../structures/spawn-search";
import { WINDMILL_SIZE } from "../structures/templates/windmill";
import type { Log, Wait } from "./chunk-probe";

const MARKER = "andrew:selftest_spawn";
const AREA = "andrew_selftest_spawn";
const CHUNK = 16;
/** The search on a rough seed samples up to 500 blocks around spawn before it gives up or prepares. */
const STATE_WAIT_TICKS = 5400;
/** Entities of a freshly loaded chunk settle within ~45 ticks (probe Q5). */
const ENTITY_SETTLE_TICKS = 80;
/** Guards may have wandered a little off the plot before the restart. */
const GUARD_MARGIN = 16;

interface Counts {
  chests: number;
  spawners: number;
  guards: number;
}

interface Marker {
  origin: [number, number, number];
  counts: Counts;
}

let latest: SpawnState | undefined;

/** Must run at script load, before the release pack's first announcement. */
export function listenSpawnState(): void {
  system.afterEvents.scriptEventReceive.subscribe(
    (e) => {
      if (e.id === SPAWN_STATE_EVENT) latest = JSON.parse(e.message) as SpawnState;
    },
    { namespaces: ["andrew"] }
  );
}

/** Peaceful (the bds:check default) deletes the guards the moment their chunk ticks: before the search places anything. */
export const keepGuardsAlive = (): void => world.setDifficulty(Difficulty.Easy);

const terminal = (s: SpawnState | undefined): s is SpawnState => s !== undefined && s.status !== "searching" && s.status !== "preparing";

function count(dim: Dimension, origin: [number, number, number]): Counts {
  const [sx, sy, sz] = WINDMILL_SIZE;
  let chests = 0;
  let spawners = 0;
  for (let x = origin[0]; x < origin[0] + sx; x++)
    for (let y = origin[1]; y < origin[1] + sy; y++)
      for (let z = origin[2]; z < origin[2] + sz; z++) {
        const t = dim.getBlock({ x, y, z })?.typeId;
        if (t === "minecraft:chest") chests++;
        else if (t === "minecraft:mob_spawner") spawners++;
      }
  return { chests, spawners, guards: dim.getEntities({ tags: [guardTag(SPAWN_ID)] }).length };
}

export async function spawnWindmillCheck(run: number, dim: Dimension, wait: Wait, log: Log): Promise<void> {
  // A fresh world enables nothing, and the search waits for Windmill. Enabled
  // through the operator's own command: this pack cannot write the release
  // pack's dynamic properties. The setting persists into runs 2 and 3.
  if (run === 1) {
    const r = dim.runCommand("andrew:structure enable windmill");
    log(`spawn windmill run 1: /andrew:structure enable windmill -> successCount ${r.successCount}`);
  }
  for (let t = 0; t < STATE_WAIT_TICKS && !terminal(latest); t += 20) {
    if (t % 400 === 0) dim.runCommand(`scriptevent ${SPAWN_EVENT} report`);
    await wait(20);
  }
  const s = latest;
  if (!terminal(s)) throw new Error(`no final spawn Windmill state from the release pack within ${STATE_WAIT_TICKS} ticks (last: ${JSON.stringify(s)})`);
  log(`spawn windmill run ${run}: release pack state ${JSON.stringify(s)}`);
  if (s.status !== "done" || s.origin === undefined) throw new Error(`run ${run}: no spawn Windmill: ${s.status} ${s.reason ?? ""}`);

  const o = s.origin;
  const [sx, , sz] = WINDMILL_SIZE;
  const r = dim.runCommand(`tickingarea add ${o[0] - GUARD_MARGIN} 0 ${o[2] - GUARD_MARGIN} ${o[0] + sx + GUARD_MARGIN} 0 ${o[2] + sz + GUARD_MARGIN} ${AREA}`);
  if (r.successCount === 0) throw new Error(`tickingarea add ${AREA} refused`);
  let counts: Counts;
  try {
    for (let t = 0; t < 600 && dim.getBlock({ x: o[0] + 17, y: o[1], z: o[2] + 17 }) === undefined; t++) await wait(1);
    await wait(ENTITY_SETTLE_TICKS);
    counts = count(dim, o);
  } finally {
    dim.runCommand(`tickingarea remove ${AREA}`);
  }

  const centre = [o[0] + Math.floor(sx / 2), o[2] + Math.floor(sz / 2)];
  const inArea =
    Math.abs(Math.floor(centre[0] / CHUNK) - Math.floor(s.spawn[0] / CHUNK)) <= STAGE1_CHUNKS &&
    Math.abs(Math.floor(centre[1] / CHUNK) - Math.floor(s.spawn[1] / CHUNK)) <= STAGE1_CHUNKS;
  const problems: string[] = [];
  if (s.searches !== 1) problems.push(`searches=${s.searches}`);
  if (s.nearSpawn !== 1) problems.push(`${s.nearSpawn} Windmill records near spawn`);
  if (s.record?.id !== SPAWN_ID || s.record.state !== "done") problems.push(`registry record ${JSON.stringify(s.record)}`);
  if ((s.distance ?? Infinity) > SEARCH_RADIUS) problems.push(`${s.distance} blocks from spawn`);
  if (s.stage === 1 && !inArea) problems.push("stage 1 site outside the 5x5 chunks");

  if (run === 1) {
    if (!s.ranNow) problems.push("run 1 did not run the search");
    if (counts.chests !== 25 || counts.spawners !== 3 || counts.guards !== GUARD_COUNT) problems.push(`counts ${JSON.stringify(counts)}`);
    world.setDynamicProperty(MARKER, JSON.stringify({ origin: o, counts } satisfies Marker));
  } else {
    const raw = world.getDynamicProperty(MARKER);
    if (typeof raw !== "string") throw new Error(`${MARKER} is absent — run 1 never saved it`);
    const m = JSON.parse(raw) as Marker;
    if (s.ranNow) problems.push(`run ${run} ran the search again`);
    if (JSON.stringify(m.origin) !== JSON.stringify(o)) problems.push(`origin moved: ${m.origin.join(",")} -> ${o.join(",")}`);
    if (JSON.stringify(m.counts) !== JSON.stringify(counts)) problems.push(`counts changed: ${JSON.stringify(m.counts)} -> ${JSON.stringify(counts)}`);
  }
  log(
    `spawn windmill RESULT run ${run}: ${s.status} stage ${s.stage}${s.prepared === true ? " (prepared)" : ""} at ${o.join(",")}, ` +
      `${s.distance} blocks from spawn ${s.spawn.join(",")} (in 5x5 chunks ${inArea}); registry ${s.record?.id} ${s.record?.state}; ` +
      `records near spawn ${s.nearSpawn}; searches ${s.searches}, searched this load ${s.ranNow}; checked ${s.checked}; counts ${JSON.stringify(counts)}`
  );
  if (problems.length > 0) throw new Error(problems.join("; "));
}
