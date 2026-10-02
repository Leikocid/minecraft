---
type: "concept-assumption"
node_id: "L0-ufoc-as04"
source_channel: "rollout"
analysis_version: 5
title: "AS-ufoc-4 · A lost saucer aborts the event: it was never spawned, it unloaded, or a consumer threw"
aliases: ["L0-ufoc-as04"]
is_a: ["assumption"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1267
tags: ["is_a:assumption", "robustness", "unloaded-chunks", "relates_to:L0-ufoc-p002", "relates_to:L0-sauc-p001"]
level: 2
---
# AS-ufoc-4 · A lost saucer aborts the event: it was never spawned, it unloaded, or a consumer threw

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-p002", "L0-sauc-p001", "L0-magn-prel"]`

**Context.**
- The saucer spawns 90 blocks from the centre (§2). If that chunk is not loaded, `spawnEntity` throws.
- If every player leaves the area mid-event, the saucer's chunk can unload (U8, C-12′). §10 says the event continues when the *target* leaves, but it does not cover the saucer itself vanishing.

**Assumed.** `ufoc` aborts the event in any of these cases:
- `sauc` cannot spawn the saucer;
- the saucer is invalid on any later tick, outside `downed`;
- an `onPhase` consumer throws.

The abort releases everything held (when in `magnet`), removes whatever remains, ends the session and sets `next_ms` to now + 15 min. A saucer that unloaded and later reloads is removed by the `entityLoad` sweep, because its event id no longer matches (`p003`).

**Impact if wrong.**
- If the event should survive an unload (for example by pausing the phase clock), `p002` needs a "suspended" state.
- If `sauc` prefers to spawn nearer the centre when the 90-block point is unloaded, the abort becomes a fallback rather than the normal path.
