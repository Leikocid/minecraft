---
type: "concept-entity"
node_id: "L0-bast-ent2"
source_channel: "rollout"
analysis_version: 5
title: "BastionChest"
aliases: ["L0-bast-ent2"]
is_a: ["entity"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 677
tags: ["is_a:entity", "chest", "loot"]
level: 2
---
# BastionChest

One of the 10 fixed chest slots inside a `MiniBastionStructure`.

**Attributes:**
- `chest_id` — unique within the parent instance.
- `instance_id` — parent `MiniBastionStructure`.
- `position` — fixed by template.
- `kind` — `treasure` (3 per instance, central room) | `regular` (7 per instance, distributed).
- `loot_table` — the real vanilla Bastion Remnant loot table matching `kind` (treasure variant or regular variant) — not the shared Windmill/Airship custom weighted system.
- registry `looted`; the container is the loot state (`L0-strf-r008` §4).
- `is_destroyed` — bool; once true, the chest is never restored.

**Source:** §14.4.
