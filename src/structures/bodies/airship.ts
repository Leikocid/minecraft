// The Airship's body (L0-airs): its template and 10 chests on the shared custom
// table, and the Windmill-linked attempt (§5.6, L0-airs-r004). Independent
// generation is strf's 2 % roll with the `altitude` profile; nothing here
// touches it. No guards (L0-airs-r005): the template's spawner is the only
// source of mobs. Generation, persistence and loot rules are strf's and loot's.

import type { TypeBody } from "../bodies";
import type { RollDef } from "../config";
import { CUSTOM_TABLE } from "../loot";
import { LINKED_TRIED } from "../place";
import type { DimShort, Instance, Registry, Vec3 } from "../registry";
import { type RingCandidate, type RingLoader, type RingResult, type RingSpec, footprintCentre, overlaps2d, ringCandidates, searchRing } from "../search-ring";
import type { SiteGate } from "../site";
import { AIRSHIP_ID, AIRSHIP_SIZE, CHESTS } from "../templates/airship";

export const AIRSHIP_BODY: TypeBody = {
  templateId: AIRSHIP_ID,
  standIn: false,
  size: [...AIRSHIP_SIZE],
  chests: CHESTS.map((c) => ({ local: [...c.at] as Vec3, table: CUSTOM_TABLE })),
};

/** §5.6: hard 40–100 blocks, horizontal, from the Windmill's centre to the Airship's. */
export const LINKED_RING: RingSpec = { rMin: 40, rMax: 100, radialStep: 10, arcStep: 16 };

/** Parent-record extras of the linked attempt; LINKED_TRIED itself belongs to the Placer. */
export const LINKED_STATUS = "ls";
/** `{ id, origin }` of the reserved Airship, written before its record is planned. */
export const LINKED_SPOT = "lo";

/** `skipped`: the Airship type was disabled when the parent finished; the attempt is spent. */
export type LinkedStatus = "searching" | "pending" | "none" | "placed" | "skipped";

/** Reason a ring candidate is refused for hanging over the parent's plot (§5.6). */
export const OVER_PARENT = "over-parent";

/** Unique per parent and ring slot, and never of the roll's `def:dim:cx:cz` form: a linked Airship is not the chunk's roll. */
export const linkedId = (parentId: string, slot: number): string => `airship:linked:${parentId}:${slot}`;

/** Refuses a candidate whose x/z footprint meets the parent's plot, fields included, whatever the height. */
export const overParent = (parent: Pick<Instance, "origin" | "size">) => (c: Pick<RingCandidate, "x" | "z" | "size">): string | undefined =>
  overlaps2d(c, { x: parent.origin[0], z: parent.origin[2], size: parent.size }) ? OVER_PARENT : undefined;

/** Centre of the parent's footprint, the ring's centre. */
export const parentCentre = (parent: Pick<Instance, "origin" | "size">): [number, number] =>
  footprintCentre({ x: parent.origin[0], z: parent.origin[2], size: parent.size });

export function linkedCandidates(salt: string, parent: Instance, def: RollDef): RingCandidate[] {
  return ringCandidates(`${salt}|${parent.id}|linked-airship`, (i) => linkedId(parent.id, i), def, parent.dim, parentCentre(parent), LINKED_RING);
}

/** What the linked attempt needs from the runtime. */
export interface LinkedHost {
  registry: Registry;
  gate: SiteGate;
  defs: readonly RollDef[];
  salt(): string;
  /** Placement and init of a reserved record, as natural generation runs them. */
  run(inst: Instance): Instance["state"] | "pending";
  /** Undefined: this engine cannot load the ring, and the attempt waits as pending. */
  loader(dim: DimShort): RingLoader | undefined;
  log(msg: string): void;
}

export interface LinkedOutcome {
  parent: string;
  status: LinkedStatus;
  airship?: Instance;
  /** Horizontal distance between the two centres. */
  distance?: number;
  result?: RingResult;
}

/** Candidates loaded at once; the rest of the engine's 10 ticking areas stay free for others. */
export const RING_PARALLEL = 2;

/**
 * One linked attempt per Windmill instance (L0-airs-cx01): the Placer marks
 * LINKED_TRIED and calls `start` once. An attempt whose ring could not be read
 * stays `pending` and is resumed — never counted as a finished failure, never
 * widened past 100 blocks, never merged with another Windmill's attempt or
 * with an independent Airship.
 */
export class LinkedAirships {
  private readonly running = new Map<string, Promise<LinkedOutcome>>();
  private readonly waiting = new Map<string, Instance>();
  /** Parent id → attempts started from the Placer hook; a resume is not an attempt. */
  readonly attempts = new Map<string, number>();

  constructor(private readonly host: LinkedHost) {}

  /** The Placer's `linked` hook for a parent instance. */
  start(parent: Instance): void {
    this.attempts.set(parent.id, (this.attempts.get(parent.id) ?? 0) + 1);
    this.host.log(`strf:airs linked attempt for ${parent.id}`);
    this.launch(parent);
  }

  /** The attempt in flight for a parent, or the one that finished last in this session. */
  outcome(parentId: string): Promise<LinkedOutcome> | undefined {
    return this.running.get(parentId);
  }

  get pendingCount(): number {
    return this.waiting.size;
  }

  /** Attempts a restart or an unreadable ring left open; returns how many were relaunched. */
  resume(parents: readonly Instance[]): number {
    let n = 0;
    for (const p of parents) {
      const status = p.extras[LINKED_STATUS];
      if (p.extras[LINKED_TRIED] !== true || status === "none" || status === "placed" || status === "skipped") continue;
      this.launch(p);
      n++;
    }
    return n;
  }

  /** Retries every pending attempt not already running. */
  retryPending(): number {
    const due = [...this.waiting.values()];
    this.waiting.clear();
    for (const p of due) this.launch(p);
    return due.length;
  }

  private launch(parent: Instance): void {
    const prev = this.running.get(parent.id);
    const run = (prev ?? Promise.resolve(undefined)).then(() => this.attempt(parent));
    this.running.set(parent.id, run);
    run.catch((e: unknown) => this.host.log(`strf:airs linked ${parent.id} threw ${String(e)}`));
  }

  private status(parent: Instance, s: LinkedStatus): void {
    this.host.registry.setExtra(parent, LINKED_STATUS, s);
  }

  private async attempt(parent: Instance): Promise<LinkedOutcome> {
    const { registry, log } = this.host;
    const now = registry.get(parent.dim, parent.origin, parent.id) ?? parent;
    const spot = now.extras[LINKED_SPOT] as { id: string; origin: Vec3 } | undefined;
    if (now.extras[LINKED_STATUS] === "placed" || now.extras[LINKED_STATUS] === "none") {
      const airship = now.extras[LINKED_STATUS] === "placed" && spot !== undefined ? registry.get(now.dim, spot.origin, spot.id) : undefined;
      return { parent: parent.id, status: now.extras[LINKED_STATUS] as LinkedStatus, airship };
    }
    const def = this.host.defs.find((d) => d.id === "airship");
    if (def === undefined) throw new Error("strf:airs no airship roll def");
    this.status(now, "searching");

    // A spot reserved before a crash is finished, not searched for again.
    if (spot !== undefined) {
      const rec = registry.get(now.dim, spot.origin, spot.id);
      if (rec !== undefined && rec.state !== "failed") {
        const state = this.host.run(rec);
        if (state === "pending") return this.wait(now, undefined);
        return this.finish(now, registry.get(rec.dim, rec.origin, rec.id) ?? rec, undefined);
      }
    }

    const loader = this.host.loader(now.dim);
    if (loader === undefined) {
      log(`strf:airs linked ${now.id} pending: this engine cannot load the ring`);
      return this.wait(now, undefined);
    }
    const cands = linkedCandidates(this.host.salt(), now, def);
    let placed: Instance | undefined;
    const result = await searchRing(cands, {
      exclude: overParent(now),
      loader,
      parallel: RING_PARALLEL,
      site: (c) => this.host.gate.site(c),
      take: (c, y) => {
        const origin: Vec3 = [c.x, y, c.z];
        registry.setExtra(now, LINKED_SPOT, { id: c.id, origin });
        const planned = registry.plan({ def: "airship", dim: now.dim, origin, rot: c.rot, size: c.size, id: c.id });
        if (!planned.ok) return "collision:instance";
        const state = this.host.run(planned.instance);
        if (state === "failed") return String(registry.get(now.dim, origin, c.id)?.extras.why ?? "failed");
        placed = registry.get(now.dim, origin, c.id) ?? planned.instance;
        return undefined;
      },
    });
    if (result.kind === "placed" && placed !== undefined) return this.finish(now, placed, result);
    if (result.kind === "pending") {
      for (const c of result.pending) this.host.gate.held.hold({ cand: c, slice: 0, state: "unloaded" });
      return this.wait(now, result);
    }
    this.status(now, "none");
    log(`strf:airs linked ${now.id} none: no valid spot in ${LINKED_RING.rMin}-${LINKED_RING.rMax} blocks (${result.checked} checked, rejects ${JSON.stringify(result.rejects)}); the ring is not widened`);
    return { parent: now.id, status: "none", result };
  }

  private wait(parent: Instance, result: RingResult | undefined): LinkedOutcome {
    this.status(parent, "pending");
    this.waiting.set(parent.id, parent);
    const n = result?.kind === "pending" ? result.pending.length : 0;
    this.host.log(`strf:airs linked ${parent.id} pending: ${n} ring candidate(s) unreadable, retried later`);
    return { parent: parent.id, status: "pending", result };
  }

  private finish(parent: Instance, airship: Instance, result: RingResult | undefined): LinkedOutcome {
    this.status(parent, "placed");
    this.waiting.delete(parent.id);
    const [px, pz] = parentCentre(parent);
    const [ax, az] = footprintCentre({ x: airship.origin[0], z: airship.origin[2], size: airship.size });
    const distance = Math.hypot(ax - px, az - pz);
    this.host.log(
      `strf:airs linked ${parent.id} placed ${airship.id} at ${airship.origin.join(",")} rot ${airship.rot} state ${airship.state}; ` +
        `distance ${distance.toFixed(2)} (ring ${LINKED_RING.rMin}-${LINKED_RING.rMax}), bottom ${airship.origin[1]} vs parent ${parent.origin[1]}` +
        (result === undefined ? " (resumed)" : `; ${result.checked} checked, rejects ${JSON.stringify(result.rejects)}`)
    );
    return { parent: parent.id, status: "placed", airship, distance, result };
  }
}
