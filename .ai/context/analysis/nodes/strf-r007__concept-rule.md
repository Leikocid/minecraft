---
type: "concept-rule"
node_id: "L0-strf-r007"
source_channel: "rollout"
analysis_version: 5
title: "Rule: loaded-footprint guarantee and revalidation of deferred candidates"
aliases: ["L0-strf-r007"]
is_a: ["rule"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1314
tags: ["is_a:rule", "loaded-chunks", "C-12", "relates_to:L0-strf-as03", "relates_to:L0-strf-p003"]
level: 2
---
# Rule: loaded-footprint guarantee and revalidation of deferred candidates

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- No block read that decides validity and no block write (place, fill, chest, marker, gold) happens unless **every chunk** covering the rotated AABB plus the 2-block margin is loaded (C-12). The check uses `isChunkLoaded` where available, otherwise a `getBlock` probe per covered chunk (`L0-strf-as03`).
- If any covered chunk is not loaded, the candidate becomes `pending`. It is kept in memory only (it is not persisted) keyed by chunk, and re-queued when discovery next sees that chunk. The chunk's evaluated bit is **not** set while a candidate on it is pending. After a restart, the roll reproduces the pending candidate (`L0-strf-r001`).
- Once the world is reserved (`planned`), the record persists and the remaining steps resume on load (`L0-strf-p004`).
- **Revalidation.** A candidate that waited ≥ 1 job slice is fully revalidated before reserving. Between validation and reservation a player could build in the footprint, which the collision heuristic sees as planks/chests. Placement must never overwrite a player's build that it can detect.
- An instance whose chunks unload during init keeps its state and resumes later. Partial chest filling is safe (`L0-strf-p004`).
