---
type: "concept-rule"
node_id: "L0-ring-r002"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-r002"]
is_a: ["rule"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 998
tags: ["is_a:rule", "timing", "relates_to:L0-orbc-p002", "relates_to:L0-ring-p003"]
level: 2
---
**R-ring-002 · All charges spawn in one tick. Detonation time follows terrain plus at most the queue delay** (Orbital §10)

- `orbc` spawns every column of the layout in the activation tick, at the dimension's `spawnY` (`L0-orbc-p002`, `r007`), and they start falling together. `ring` provides only the layout. It must not stagger spawns.
- A charge spawned inside a solid cell detonates in the spawn tick (`L0-orbc-r008`). The others detonate on first block contact, so differences in terrain height give different contact ticks. §10 accepts this.
- `ring`'s detonation queue (`p003`) may add **≤ 4 ticks** for one attack and **≤ 10 ticks** with 3 concurrent attacks (RG-2). This delay is the only one `ring` is allowed to add. It must never reorder blasts across attacks (FIFO).

**Rationale:** §10 says "created simultaneously … start falling simultaneously". The queue delay is covered by "actual explosion time may differ slightly" and by the C-15 rank-3 priority over rank-4 visual fidelity.
