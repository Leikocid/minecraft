---
type: "concept-entity"
node_id: "L0-loot-e002"
source_channel: "rollout"
analysis_version: 5
title: "Entity: LootAttempt"
aliases: ["L0-loot-e002"]
is_a: ["entity"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 586
tags: ["is_a:entity", "relates_to:L0-loot-p001", "relates_to:L0-loot-e001"]
level: 2
---
# Entity: LootAttempt

One fill attempt within `L0-loot-p001`. Ephemeral — exists only during chest initialization; not stored as durable world state (only the *output* item stacks persist, inside the chest container).

**Attributes:**
- `chestRef` — the target chest block location
- `attemptIndex` — 1..N where N ∈ [5, 12]
- `category` — a `LootCategory.id`, or none if this attempt produced no output (see `L0-loot-asm1`)
- `resultStack` — the ItemStack placed into the chest, or none

**Relationships:** `part_of` one chest-fill run (`L0-loot-p001`); `category` refs `L0-loot-e001`.
