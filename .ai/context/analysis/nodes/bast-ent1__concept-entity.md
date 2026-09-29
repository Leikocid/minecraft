---
type: "concept-entity"
node_id: "L0-bast-ent1"
source_channel: "rollout"
analysis_version: 2
title: "MiniBastionStructure"
aliases: ["L0-bast-ent1"]
is_a: ["entity"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 848
tags: ["is_a:entity", "structure"]
level: 2
---
# MiniBastionStructure

The root record for one generated Mini Bastion instance.

**Attributes:**
- `instance_id` — unique per generated bastion.
- `dimension` — always Nether.
- `origin` — anchor coordinates of the placed template.
- `rotation` — one of 0°/90°/180°/270°, chosen randomly at placement.
- `footprint` — ~20×20 blocks (fixed by template).
- `height` — ~10-12 blocks (fixed by template).
- `level_count` — 2-3 (fixed by template).
- init state = the state of the `L0-strf-e002` InstanceRecord (`L0-strf-r008`).
- `chest_refs` — exactly 10 `BastionChest` records.
- `guard_refs` — 9-12 `BastionGuard` records (7-10 Piglins + exactly 2 Piglin Brutes).
- `treasure_room` — position/boundary of the central lower room, its surrounding-lava footprint, and its `gold_block_count` (2-4, random, set once).

**Source:** §14.1-14.5.
