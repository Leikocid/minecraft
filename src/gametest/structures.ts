// L0-strf-p005 on a real engine: discovery over a wide square around the test,
// drained by system.runJob. Every generator step is timed from outside the job
// as well as by the job itself; a step over SLICE_CEILING_MS fails the test.

import { type Dimension, system, world } from "@minecraft/server";
import { Test, register } from "@minecraft/server-gametest";
import { SLICE_CEILING_MS } from "../structures/config";
import { Discovery, type SiteVerdict } from "../structures/discovery";
import { COLLISION_MARGIN, Registry, SALT_KEY, clearTestHook, installTestHook } from "../structures/registry";
import { type Candidate } from "../structures/roll";
import { DynamicPropertyStore, type KeyValueStore } from "../structures/store";

const STRUCTURE = "andrew:platform";
const RADIUS = 12;
/** Blocks a candidate site reads, as the footprint probe batch does (L0-strf-p005). */
const PROBE_READS = 64;
/** Airship low enough to cut the Windmill (y 70..99), Warden City well under it. */
const Y: Readonly<Record<string, number>> = { windmill: 70, airship: 80, warden_city: -45, bastion: 40 };

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);

/** Real dynamic-property writes under a per-run prefix, removed afterwards. */
class ScopedStore implements KeyValueStore {
  constructor(
    private readonly inner: KeyValueStore,
    private readonly scope: string
  ) {}
  get(key: string): string | undefined {
    return this.inner.get(this.scope + key);
  }
  set(key: string, value: string | undefined): void {
    this.inner.set(this.scope + key, value);
  }
  keys(): string[] {
    return this.inner
      .keys()
      .filter((k) => k.startsWith(this.scope))
      .map((k) => k.slice(this.scope.length));
  }
  totalBytes(): number | undefined {
    return this.inner.totalBytes();
  }
  wipe(): void {
    for (const k of this.keys()) this.set(k, undefined);
  }
}

/** Loaded check on every chunk of the box plus margin, then a probe-sized batch of reads. */
function probeSite(dim: Dimension, baseY: number, c: Candidate): SiteVerdict {
  const m = COLLISION_MARGIN;
  for (let x = Math.floor((c.x - m) / 16); x <= Math.floor((c.x + c.size[0] + m) / 16); x++) {
    for (let z = Math.floor((c.z - m) / 16); z <= Math.floor((c.z + c.size[2] + m) / 16); z++) {
      if (!dim.isChunkLoaded({ x: x * 16, y: baseY, z: z * 16 })) return { kind: "pending" };
    }
  }
  for (let i = 0; i < PROBE_READS; i++) {
    dim.getBlock({ x: c.x + (i % 8) * Math.floor(c.size[0] / 8), y: baseY, z: c.z + Math.floor(i / 8) * Math.floor(c.size[2] / 8) });
  }
  return { kind: "valid", y: Y[c.def.id] ?? baseY };
}

register("andrew", "strf_discovery_tick_budget", (test: Test): void => {
  const dim = test.getDimension();
  const here = test.worldBlockLocation({ x: 0, y: 1, z: 0 });
  const cx = Math.floor(here.x / 16);
  const cz = Math.floor(here.z / 16);
  const store = new ScopedStore(new DynamicPropertyStore(world), `gt${Date.now()}:`);
  store.set(SALT_KEY, "gt-roll");
  // The test chunk carries all three Overworld structures, so the live run
  // also walks the plan and collision path, not only misses.
  installTestHook({ outcomes: [["windmill", "o", cx, cz, true], ["airship", "o", cx, cz, true], ["warden_city", "o", cx, cz, true]] });

  const reg = new Registry(store, log);
  const disc = new Discovery(reg, (c) => probeSite(dim, here.y, c), { radius: RADIUS, log });
  disc.discover([{ dimensionId: dim.id, x: here.x, z: here.z }]);
  const queued = disc.queueLength;

  const stepMs: number[] = [];
  disc.pump((job) =>
    system.runJob(
      (function* timed(): Generator<void, void, void> {
        for (;;) {
          const t0 = Date.now();
          const r = job.next();
          stepMs.push(Date.now() - t0);
          if (r.done === true) return;
          yield;
        }
      })()
    )
  );

  const verdict = (): string | undefined => {
    const outer = Math.max(0, ...stepMs);
    const ids = reg.allInstances().map((i) => i.id);
    log(
      `strf discovery budget: chunks=${disc.stats.chunks}/${queued} slices=${disc.stats.slices} ` +
        `slice-ms max=${disc.stats.maxSliceMs} (outer max=${outer}, steps=${stepMs.length}) ceiling=${SLICE_CEILING_MS} ` +
        `mean=${(disc.stats.totalMs / Math.max(1, disc.stats.slices)).toFixed(2)} records=${ids.join(",") || "none"}`
    );
    log(disc.statsLine());
    if (queued !== (2 * RADIUS + 1) ** 2) return `queued ${queued} chunks, expected ${(2 * RADIUS + 1) ** 2}`;
    if (disc.stats.chunks !== queued) return `evaluated ${disc.stats.chunks} of ${queued} chunks`;
    if (disc.stats.maxSliceMs > SLICE_CEILING_MS) return `a job slice took ${disc.stats.maxSliceMs} ms, ceiling ${SLICE_CEILING_MS}`;
    if (outer > SLICE_CEILING_MS) return `a runJob step took ${outer} ms measured outside the job, ceiling ${SLICE_CEILING_MS}`;
    const own = (d: string): boolean => ids.includes(`${d}:o:${cx}:${cz}`);
    if (disc.pendingDefs("o", cx, cz).length > 0) {
      log(`strf discovery budget: test chunk still pending ${disc.pendingDefs("o", cx, cz).join(",")}, order not checked`);
      return undefined;
    }
    if (!own("windmill")) return `forced windmill not planned: ${ids.join(",")}`;
    if (own("airship")) return "airship planned into the windmill";
    if (!own("warden_city")) return `warden city under the windmill not planned: ${ids.join(",")}`;
    return undefined;
  };

  const poll = system.runInterval(() => {
    if (disc.isRunning) return;
    system.clearRun(poll);
    let failure: string | undefined;
    try {
      failure = verdict();
    } catch (e) {
      failure = String(e);
    } finally {
      clearTestHook();
      store.wipe();
    }
    if (failure === undefined) test.succeed();
    else test.fail(failure);
  }, 1);
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");
