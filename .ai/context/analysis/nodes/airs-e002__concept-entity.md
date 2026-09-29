---
type: "concept-entity"
node_id: "L0-airs-e002"
source_channel: "rollout"
analysis_version: 2
title: "Entity — `tryLinked` request and ring candidate"
aliases: ["L0-airs-e002"]
is_a: ["entity"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 1535
tags: ["is_a:entity", "linked-search", "ring", "relates_to:L0-wind", "relates_to:L0-strf-r002", "relates_to:L0-strf-d004", "relates_to:L0-airs-cx01"]
level: 2
---
# Entity — `tryLinked` request and ring candidate

**Links:** `part_of: ["L0-airs"]` · `is_a: ["entity"]`

```ts
LinkedAirships.start(parent: Instance): void
// called by the Placer's `linked` hook after `la=true`

interface LinkedSearchState {
  windmillInstanceId: string;
  centre: { x: number; z: number };      // parent Windmill's origin, template-local centre
  excludeAABB: AABB;                     // parent Windmill's own rotated 2D footprint (X/Z only)
  rMin: 40;
  rMax: 100;
}
```

- `tryLinked` calls `strf.searchRing(airshipDef, centre, 40, 100)`, which yields candidate `(x, z, rot)` triples inside the annulus (`L0-strf-r002` item 5; sampling pattern is an assumption, `L0-airs-as02`).
- Each candidate is validated exactly like an independent Airship (`L0-airs-r003`), then filtered by `excludeAABB`: any candidate whose 2D footprint intersects `excludeAABB` is skipped before the expensive footprint probe runs, as a cheap early-out (`L0-strf-d004`).
- The search stops at the first `valid` candidate and places it, or exhausts the ring and returns "not created" — an unreadable ring persists `ls=pending` and is resumed. Only a fully read ring with no valid spot ends `none` (contrast `L0-strf-p003`'s `pending` for a single placement).
- `parentInstance` is carried only for the deviation report / debug logging; `strf`'s registry and collision test key purely on the placed Airship's own AABB, with no link back to the Windmill (`L0-strf-r006`).
