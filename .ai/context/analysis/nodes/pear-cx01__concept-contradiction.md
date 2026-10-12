---
type: "concept-contradiction"
node_id: "L0-pear-cx01"
source_channel: "rollout"
analysis_version: 11
title: "CX-pear-01 · \"Share the ticking-area pool with spawn-search\" vs a world cap also used by the ring loaders"
aliases: ["L0-pear-cx01"]
is_a: ["contradiction"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 1367
tags: ["v11", "pearl-rod", "contradiction", "tickingarea", "plan-vs-code", "status:resolved", "resolved"]
level: 2
closed_at: 2026-10-12
closed_reason: resolved_by_decision
closed_by_ref: L0-adr-prta
---
# CX-pear-01 · "Share the ticking-area pool with spawn-search" vs a world cap also used by the ring loaders

**Target:** L0-adr-prbd §5 and the decomposition plan seam "the ticking-area pool owned by `src/structures/spawn-search.ts`".

**Side A (plan / ADR).** `spawn-search.ts` owns the ticking-area pool. The Pearl Rod preload shares it, "so a structure search and a teleport never evict each other".

**Side B (code, 1.10.0).**
- There are **two** independent pools:
  - `spawn-search` (`andrew_find_`, pool 5 per host, `src/main.ts:80-88`);
  - `search-ring` `engineRingLoader` (`andrew_ring_<d>`, 4 per dimension, `src/structures/runtime.ts:291,333`).
- Both comment that the engine caps areas at **10 per world** (`search-ring.ts:179`).
- Sharing with `spawn-search` alone leaves the Pearl Rod exposed to refusals caused by ring searches, and vice versa.
- Areas are not evicted, they are *refused*. So the failure mode is a starved add, not an eviction.

**Category:** plan mismatch (a seam omitted). It does not invalidate the decomposition.

**Proposed resolution:** `L0-pear-ad01`, a single world-wide allocator with one reserved Pearl Rod slot. Reduce decides.

**Impact if ignored:** under concurrent structure searches, a Pearl Rod trip fails with "server busy" more often than it needs to, or a structure search silently reports chunks as never loaded.
