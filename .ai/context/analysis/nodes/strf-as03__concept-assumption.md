---
type: "concept-assumption"
node_id: "L0-strf-as03"
source_channel: "rollout"
analysis_version: 5
title: "Assumption (CAN_ASSUME) — How loaded chunks are detected, and the discovery radius"
aliases: ["L0-strf-as03"]
is_a: ["assumption"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 984
tags: ["is_a:assumption", "can-assume", "api", "probe"]
level: 2
---
# Assumption (CAN_ASSUME) — How loaded chunks are detected, and the discovery radius

**Gap.** C-12 requires that nothing is written into unloaded chunks. It is unverified whether `Dimension.isChunkLoaded` exists in `@minecraft/server` 2.10.0 stable, and what `getBlock` does out of range.

**Assumption.** One of the following holds: `isChunkLoaded(location)` is present, **or** `getBlock` returns `undefined` or throws `LocationInUnloadedChunkError` for unloaded chunks. `strf` wraps both behind `isLoaded(dim, cx, cz)`. The discovery radius `R_DISCOVER = 4` chunks, which is inside BDS's default simulation/ticking distance, so footprints around a player are normally loaded. Candidates that reach beyond it go `pending`.

**Impact if wrong.** If neither method is reliable, placement could throw mid-job and leave a `planned` record, which is safe but noisy. The fallback is placing only candidates whose AABB lies entirely within 3 chunks of some player. Probe item 9 settles it.
