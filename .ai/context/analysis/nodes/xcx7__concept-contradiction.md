---
type: "concept-contradiction"
node_id: "L0-xcx7"
source_channel: "rollout"
analysis_version: 2
title: "CX-L0-07 · Structure tests 14–59 are channel-split only for the Windmill"
aliases: ["L0-xcx7"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 1332
tags: ["title:airs, wrdn and bast ACs are not split into bds and ipad channels", "target:L0", "status:open", "category:invariant-violation", "severity:low", "reduce", "relates_to:L0-infr", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-wrdn", "relates_to:L0-bast", "relates_to:L0-infr-p006", "relates_to:L0-airs-ac01", "relates_to:L0-wrdn-ac01", "relates_to:L0-bast-ac01"]
level: 1
---
# CX-L0-07 · Structure tests 14–59 are channel-split only for the Windmill

**Links:** `is_a: ["contradiction"]` · `relates_to: ["L0-infr", "L0-wind", "L0-airs", "L0-wrdn", "L0-bast"]` · **target_node:** `L0` · **status:** open

**Invariant (plan v2).** `infr` contributes the test harness. Structure acceptance tests 14–59 split into `bds` (counts, positions, state, statistics) and `ipad` (visual identity), following C-9.

**Observed during this reduce (version 2).**
- The `L0-wind-ac*` nodes carry the split: 14 mentions of `bds` and 4 of `ipad`.
- The `airs` ACs (8), `wrdn` ACs (10) and `bast` ACs (9) carry no channel at all.
- Some of these are clearly iPad-only. For example, `airs-ac01` (modern look), the Warden City and Bastion "reads as Ancient City / Bastion" criteria, and "almost entirely dark".
- `infr-p006` defines the `bds` lanes. No `infr` node maps tests 24–59 to channels.

**Risk.** Without a channel, the orchestrator can auto-verify a visual criterion from a green `bds` count. That is the failure recorded in memory "Orchestrator auto-verifies manual criteria", and C-6/C-9 forbid it.

**Interim rule until the delta pass.** Every structure AC whose THEN clause is about appearance, recognisability, lighting mood or "reads as" is `ipad`. Everything else is `bds`. `infr-p006` adds the per-test mapping.
