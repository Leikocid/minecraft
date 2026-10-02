---
type: "concept-architecture-decision"
node_id: "L0-loot-adr1"
source_channel: "rollout"
analysis_version: 5
title: "ADR-loot-1 · Cumulative-weight roll per attempt, not per-category independent chance"
aliases: ["L0-loot-adr1"]
is_a: ["architecture-decision"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 1092
tags: ["is_a:architecture-decision", "relates_to:L0-loot-p001", "relates_to:L0-loot-r001"]
level: 2
---
# ADR-loot-1 · Cumulative-weight roll per attempt, not per-category independent chance

**Context:** spec §3.1 item 2 requires each attempt to yield at most one category, and explicitly states weights are relative weights of selection, "not independent simultaneous rolls" — ruling out treating each category as its own independent Bernoulli trial (which could yield 0, 1, or several categories per attempt).

**Decision:** implement each attempt as a single cumulative-weight roll: sum all currently-eligible category weights, draw one random number in that range, walk the cumulative list to find the selected category. This structurally guarantees exactly one outcome per attempt (a category, or nothing if the implementation reserves a no-op slot — see `L0-loot-asm1`).

**Rejected alternative:** per-category independent probability check (`for each of 13 categories: if random() < weight/100, emit it`). Rejected because it violates §3.1 item 2 directly — it could emit multiple categories from one attempt, exactly what the spec's note on "не независимые одновременные броски" forbids.
