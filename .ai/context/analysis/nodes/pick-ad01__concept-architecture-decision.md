---
type: "concept-architecture-decision"
node_id: "L0-pick-ad01"
source_channel: "rollout"
analysis_version: 1
title: "ADR: single broad tag query for pickaxe dig speed, not enumerated tier tags"
aliases: ["L0-pick-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 1697
tags: ["is_a:architecture-decision", "dig-speed", "relates_to:L0-pick-r001", "relates_to:L0-pick-gl02", "relates_to:L0-pick-gl04"]
level: 2
---
# ADR: single broad tag query for pickaxe dig speed, not enumerated tier tags

**Context:** `minecraft:digger.destroy_speeds` needs to match "every block a diamond pickaxe can mine" at a flat diamond-tier speed. Bedrock exposes this via several overlapping tag families (legacy `stone_pick_diggable`/`iron_pick_diggable`/…, `diamond_tier_destructible`, and the umbrella `is_pickaxe_item_destructible`), and a given block may carry only one family (`L0-pick-gl04`). The shipped 0.3.0 build's query missed some of these families and blocks silently dropped to bare-hand speed (`L0-pick-gl02`) — Bedrock has no engine fallback to try a lower tier.

**Decision:** one `destroy_speeds` entry, `query.any_tag('minecraft:is_pickaxe_item_destructible')` at flat `speed: 8`, `use_efficiency: true`. Coverage is proven empirically per-run against a live vanilla `diamond_pickaxe`, not asserted from documentation (`L0-pick-r001`).

**Rejected alternative:** enumerate every legacy tier tag (`stone_pick_diggable`, `iron_pick_diggable`, `diamond_tier_destructible`, …) as separate `destroy_speeds` entries. Rejected because it is the same shape of bug that caused the 0.3.0 regression — it requires the author to know and list every tag family a target block might use, and Mojang's own tag assignment per block is not documented in one place; the umbrella tag is designed to not need that enumeration.

**Consequence:** if a future Bedrock version introduces a new block carrying none of these tag families, the pickaxe will silently mine it at hand speed again unless `pickaxe_digs_at_diamond_speed`'s `SPEED_BLOCKS` list is extended to cover it — the GameTest is a sample, not exhaustive over all blocks.
