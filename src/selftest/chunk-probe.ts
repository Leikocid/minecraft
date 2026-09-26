// stage4-probe, strf-p006 questions 9 and 11, on the stable @minecraft/server
// 2.10.0 surface only, so both lanes can run it: the GameTest pack (with a
// simulated player in the world) and the selftest pack of bds:check (a world
// with no player at all).
//
// Measurements, not product assertions. Every function logs what the engine
// did and returns; it throws only when it could not measure.

import { Dimension, Vector3, system } from "@minecraft/server";

export type Log = (msg: string) => void;
export type Wait = (ticks: number) => Promise<void>;

export const errText = (err: unknown): string =>
  err instanceof Error ? `${err.constructor?.name ?? err.name}(${err.name}): ${err.message}` : String(err);

const fmt = (v: Vector3): string => `${v.x},${v.y},${v.z}`;

/** A promise that resolves after `ticks` game ticks — for code outside a GameTest. */
export const systemWait: Wait = (ticks) => new Promise((resolve) => system.runTimeout(resolve, Math.max(1, ticks)));

/** What the engine answers for one location, every call guarded separately. */
export function readLocation(dim: Dimension, at: Vector3): string {
  const parts: string[] = [];
  try {
    parts.push(`isChunkLoaded=${String(dim.isChunkLoaded(at))}`);
  } catch (err) {
    parts.push(`isChunkLoaded threw ${errText(err)}`);
  }
  try {
    const block = dim.getBlock(at);
    parts.push(`getBlock=${block === undefined ? "undefined" : block.typeId}`);
  } catch (err) {
    parts.push(`getBlock threw ${errText(err)}`);
  }
  try {
    const top = dim.getTopmostBlock({ x: at.x, z: at.z });
    parts.push(`getTopmostBlock=${top === undefined ? "undefined" : `${top.typeId}@y${top.location.y}`}`);
  } catch (err) {
    parts.push(`getTopmostBlock threw ${errText(err)}`);
  }
  return parts.join(" ");
}

/** The write side: does setBlockType into an unloaded chunk throw or vanish silently? */
export function tryWrite(dim: Dimension, at: Vector3): string {
  try {
    dim.setBlockType(at, "minecraft:glass");
  } catch (err) {
    return `setBlockType threw ${errText(err)}`;
  }
  let after: string;
  try {
    after = dim.getBlock(at)?.typeId ?? "undefined";
  } catch (err) {
    after = `getBlock threw ${errText(err)}`;
  }
  return `setBlockType returned normally; block afterwards=${after}`;
}

/**
 * Q9 part 1: is `isChunkLoaded` on the live Dimension object — checked on the
 * object and its prototype chain, not taken from the .d.ts.
 */
export function inspectChunkApi(dim: Dimension, log: Log, tag: string): boolean {
  const own: string[] = [];
  for (let proto: object | null = Object.getPrototypeOf(dim); proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
    own.push(...Object.getOwnPropertyNames(proto));
  }
  const related = own.filter((n) => /chunk|load|tick/i.test(n));
  const present = typeof (dim as unknown as Record<string, unknown>).isChunkLoaded === "function";
  log(
    `${tag} Dimension prototype: ${own.length} member(s); chunk/load/tick-related=[${related.join(" ")}]; ` +
      `typeof dim.isChunkLoaded=${typeof (dim as unknown as Record<string, unknown>).isChunkLoaded}`
  );
  return present;
}

/** Compress a per-chunk L/U string into ranges: "0-4:L 5-48:U". */
export function runs(marks: string[]): string {
  const out: string[] = [];
  let start = 0;
  for (let i = 1; i <= marks.length; i++) {
    if (i === marks.length || marks[i] !== marks[start]) {
      out.push(`${start === i - 1 ? start : `${start}-${i - 1}`}:${marks[start]}`);
      start = i;
    }
  }
  return out.join(" ");
}

/**
 * Walk chunk by chunk along +x from `origin` and record, per chunk, whether
 * isChunkLoaded and getBlock agree. Returns the index of the last loaded chunk.
 */
export function scanFrontier(dim: Dimension, origin: Vector3, chunks: number, log: Log, tag: string): number {
  const loaded: string[] = [];
  const disagree: string[] = [];
  let last = -1;
  for (let c = 0; c <= chunks; c++) {
    const at = { x: origin.x + c * 16, y: origin.y, z: origin.z };
    let isLoaded = false;
    let block = "undefined";
    try {
      isLoaded = dim.isChunkLoaded(at);
    } catch (err) {
      block = `isChunkLoaded threw ${errText(err)}`;
    }
    try {
      block = dim.getBlock(at)?.typeId ?? "undefined";
    } catch (err) {
      block = `threw ${errText(err)}`;
    }
    loaded.push(isLoaded ? "L" : "U");
    if (isLoaded) last = c;
    const blockSaysLoaded = block !== "undefined" && !block.startsWith("threw");
    if (blockSaysLoaded !== isLoaded) disagree.push(`${c}(${isLoaded ? "L" : "U"}/getBlock=${block})`);
  }
  log(`${tag} chunks along +x from ${fmt(origin)}: ${runs(loaded)}; isChunkLoaded vs getBlock disagreements=[${disagree.join(" ")}]`);
  return last;
}

export interface TickingAreaLoad {
  loadedBefore: boolean;
  addResult: string;
  ticks: number;
  ms: number;
  loaded: boolean;
  unloadTicks: number;
}

/**
 * Q11: `/tickingarea add circle` through runCommand at `center`, then poll
 * every tick until isChunkLoaded and getBlock both say loaded, then remove
 * the area and time the unload.
 */
export async function tickingAreaLoad(
  dim: Dimension,
  center: Vector3,
  name: string,
  wait: Wait,
  log: Log,
  tag: string,
  maxTicks = 600
): Promise<TickingAreaLoad> {
  const loadedBefore = dim.isChunkLoaded(center);
  log(`${tag} before add @${fmt(center)}: ${readLocation(dim, center)}`);

  let addResult: string;
  const command = `tickingarea add circle ${center.x} ${center.y} ${center.z} 2 ${name}`;
  try {
    addResult = `successCount=${dim.runCommand(command).successCount}`;
  } catch (err) {
    addResult = `threw ${errText(err)}`;
  }
  log(`${tag} runCommand("${command}") -> ${addResult}`);

  const t0 = Date.now();
  let ticks = 0;
  let loaded = false;
  for (; ticks <= maxTicks; ticks++) {
    if (dim.isChunkLoaded(center) && dim.getBlock(center) !== undefined) {
      loaded = true;
      break;
    }
    await wait(1);
  }
  const ms = Date.now() - t0;
  log(`${tag} ${loaded ? `loaded after ${ticks} tick(s), ${ms} ms` : `NOT loaded within ${maxTicks} ticks (${ms} ms)`}: ${readLocation(dim, center)}`);
  if (loaded) {
    const edge = { x: center.x + 2 * 16, y: center.y, z: center.z };
    const beyond = { x: center.x + 4 * 16, y: center.y, z: center.z };
    log(`${tag} radius-2 edge chunk @${fmt(edge)}: ${readLocation(dim, edge)}; 4 chunks out @${fmt(beyond)}: ${readLocation(dim, beyond)}`);
  }

  try {
    log(`${tag} tickingarea remove ${name} -> successCount=${dim.runCommand(`tickingarea remove ${name}`).successCount}`);
  } catch (err) {
    log(`${tag} tickingarea remove ${name} threw ${errText(err)}`);
  }
  let unloadTicks = -1;
  for (let t = 0; t <= 200; t++) {
    if (!dim.isChunkLoaded(center)) {
      unloadTicks = t;
      break;
    }
    await wait(1);
  }
  log(`${tag} after remove: ${unloadTicks < 0 ? "still loaded 200 ticks later" : `unloaded after ${unloadTicks} tick(s)`}`);

  return { loadedBefore, addResult, ticks, ms, loaded, unloadTicks };
}

/**
 * Q11 limit: add one-block ticking areas until the engine refuses, then remove
 * every one that was added. Areas that already exist (GameTest's own, if any)
 * count against the same limit, so the caller reports `added` alongside where
 * it ran.
 */
export function tickingAreaLimit(dim: Dimension, origin: Vector3, log: Log, tag: string, attempts = 40): { added: number; refusal: string } {
  const names: string[] = [];
  let refusal = `none within ${attempts} attempts`;
  try {
    for (let i = 0; i < attempts; i++) {
      const x = origin.x + i * 64;
      const name = `andrew_probe_lim_${i}`;
      let result: string;
      let ok = false;
      try {
        const count = dim.runCommand(`tickingarea add ${x} ${origin.y} ${origin.z} ${x} ${origin.y} ${origin.z} ${name}`).successCount;
        ok = count > 0;
        result = `successCount=${count}`;
      } catch (err) {
        result = `threw ${errText(err)}`;
      }
      if (!ok) {
        refusal = `attempt ${i + 1}: ${result}`;
        break;
      }
      names.push(name);
    }
  } finally {
    for (const name of names) {
      try {
        dim.runCommand(`tickingarea remove ${name}`);
      } catch (err) {
        log(`${tag} cleanup: tickingarea remove ${name} threw ${errText(err)}`);
      }
    }
  }
  log(`${tag} limit: ${names.length} area(s) added before refusal (${refusal}); all removed`);
  return { added: names.length, refusal };
}
