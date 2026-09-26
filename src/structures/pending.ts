// In-memory holding of candidates between their site check and occupation
// (L0-strf-r007, L0-strf-e003). Never persisted: after a restart the roll
// rebuilds the same candidate, and a reserved one is found in the registry.

import type { DimShort } from "./registry";
import type { Candidate } from "./roll";

export interface Held {
  cand: Candidate;
  /** Job slice in which the site was last checked. */
  slice: number;
  /** `unloaded`: part of the footprint was not loaded; `validated`: the check passed at `y`. */
  state: "unloaded" | "validated";
  y?: number;
}

/** Past this many held candidates the oldest is forgotten; a forgotten one is only rechecked. */
export const HELD_LIMIT = 1024;

const chunkKey = (dim: DimShort, cx: number, cz: number): string => `${dim}:${cx}:${cz}`;

export class PendingSites {
  /** Insertion-ordered by id, so the first key is the oldest. */
  private readonly byId = new Map<string, Held>();
  private readonly byChunk = new Map<string, Set<string>>();

  get size(): number {
    return this.byId.size;
  }

  hold(held: Held): void {
    const id = held.cand.id;
    this.release(id);
    this.byId.set(id, held);
    const key = chunkKey(held.cand.dim, held.cand.cx, held.cand.cz);
    const ids = this.byChunk.get(key) ?? new Set<string>();
    ids.add(id);
    this.byChunk.set(key, ids);
    while (this.byId.size > HELD_LIMIT) {
      const oldest = this.byId.keys().next().value;
      if (oldest === undefined) break;
      this.release(oldest);
    }
  }

  get(id: string): Held | undefined {
    return this.byId.get(id);
  }

  release(id: string): void {
    const held = this.byId.get(id);
    if (held === undefined) return;
    this.byId.delete(id);
    const key = chunkKey(held.cand.dim, held.cand.cx, held.cand.cz);
    const ids = this.byChunk.get(key);
    ids?.delete(id);
    if (ids?.size === 0) this.byChunk.delete(key);
  }

  /** Candidates rolled on this chunk, in the order they were held. */
  inChunk(dim: DimShort, cx: number, cz: number): Held[] {
    return [...(this.byChunk.get(chunkKey(dim, cx, cz)) ?? [])].map((id) => this.byId.get(id) as Held);
  }

  unloaded(): Held[] {
    return [...this.byId.values()].filter((h) => h.state === "unloaded");
  }
}
