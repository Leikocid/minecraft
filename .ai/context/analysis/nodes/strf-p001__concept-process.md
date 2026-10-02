---
type: "concept-process"
node_id: "L0-strf-p001"
source_channel: "rollout"
analysis_version: 5
title: "Process — chunk discovery and the seeded per-chunk roll"
aliases: ["L0-strf-p001"]
is_a: ["process"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 2599
tags: ["is_a:process", "discovery", "worldgen", "relates_to:L0-strf-r001", "relates_to:L0-strf-r002", "relates_to:L0-strf-p005"]
level: 2
---
# Process — chunk discovery and the seeded per-chunk roll

**Links:** `part_of: ["L0-strf"]` · `is_a: ["process"]`

**Trigger.** `system.runInterval(discover, 20)`. This is the only permanent loop `strf` owns (C-5b).

**Steps**
1. For each valid player (skip `undefined`/invalid entries; see the SimulatedPlayer note in `L0-strf-cx01`), read `dimension.id` and location, then compute the chunk `(cx, cz) = floor(x/16), floor(z/16)`.
2. Enumerate chunks in a square ring of radius `R_DISCOVER` chunks around the player. Default 4, which matches the BDS default simulation distance (`L0-strf-as03`).
3. For each chunk, read the region shard `andrew:st:<dim>:<rx>:<rz>` (32×32 chunks) from an in-memory cache. If the chunk's *evaluated* bit is set, skip it. Otherwise enqueue `(dim, cx, cz)` once. An in-memory `Set` dedupes the queue.
4. The job worker (`L0-strf-p005`) pops chunks. For each `StructureDef` whose `dimension` matches, in **registry priority order** (`L0-strf-r002`):
   - `u = hash32(salt, dim, cx, cz, def.id) / 2^32`. If `u ≥ def.chance`, continue with the next def.
   - On success, derive `rot = hash32(salt, dim, cx, cz, def.id, "rot") mod 4` and the anchor origin (`L0-strf-as01`), then build a `Candidate` (`L0-strf-e003`).
   - Run validation (`L0-strf-p002`) and, if valid, placement (`L0-strf-p003`).
5. Set the chunk's evaluated bit **after** every def has been rolled and resolved: rejected, placed, or recorded as `pending`. Persist the shard (write-coalesced, at most one write per shard per job slice).

**Invariants**
- The roll is a pure function of `(salt, dim, cx, cz, id)` (`L0-strf-r001`). A lost evaluated bit (crash before persist) re-rolls to the same result. A candidate that was already placed is found in the shard's instance list, so it cannot generate twice.
- `salt` is created once (`Math.random` 53-bit → base36) and stored in `andrew:st:salt`. It is never regenerated. If it goes missing while shards exist, stop generation and log an error. Do not re-salt (C-7).
- No neighbour relocation for normal candidates (§4.6, §5.5, §13.2, §14.2). Relocating searches exist only through the `wind`/`airs` API.
- Chunks already explored before the add-on was installed become eligible the first time a player comes near. This is the secondary "existing world" scenario (§4.7), and the deviation report records it.

**Failure/edge**
- Player in the End: no defs match. The queue stays empty (C-14).
- A player teleports far: the queue grows. The worker drains it FIFO under the tick budget, and chunks that are no longer loaded are re-deferred (`L0-strf-r007`).
