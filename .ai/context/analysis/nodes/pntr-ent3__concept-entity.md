---
type: "concept-entity"
node_id: "L0-pntr-ent3"
source_channel: "rollout"
analysis_version: 5
title: "CellClass (penetrator block classifier)"
aliases: ["L0-pntr-ent3"]
is_a: ["entity"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 1005
tags: ["title:CellClass (penetrator block classifier)", "is_a:entity", "relates_to:L0-xasm6", "relates_to:L0-pntr-r002", "relates_to:L0-pntr-r003"]
level: 2
---
# CellClass (penetrator block classifier)

`classify(block) → "skip" | "keep" | "removeContainer" | "removeWaterlogged" | "remove"`

| Class | Condition | Action |
|---|---|---|
| `skip` | `block.isAir` | none |
| `keep` | liquid type id, or `typeId ∈ PENETRATOR_KEEP` (the `xasm6` list) | none, and the column continues |
| `removeContainer` | `block.getComponent("minecraft:inventory")` present | protect legendaries → `clearAll` → `setType(air)` |
| `removeWaterlogged` | `block.isWaterlogged` | `setType("minecraft:water")` |
| `remove` | anything else | `setType("minecraft:air")` |

The checks run in this order. A waterlogged container, such as a waterlogged chest, takes the container path first and then becomes water.

**Ownership.** `PENETRATOR_KEEP` is an exported `ReadonlySet<string>` in `src/orbital/penetrator-keep.ts`. A unit test pins its contents. Its header comment documents the C-16 deviation: stable 2.10.0 has no block-hardness or "unbreakable" query, so a list is the only option.
