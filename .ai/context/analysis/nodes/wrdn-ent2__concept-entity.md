---
type: "concept-entity"
node_id: "L0-wrdn-ent2"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-wrdn-ent2"]
is_a: ["entity"]
part_of: ["L0-wrdn"]
relates_to: ["L0-wrdn"]
priority: 530
size_chars: 812
tags: ["is_a:entity", "loot", "chest"]
level: 2
---
## WrdnChest

Exactly 40 per `MiniWardenCityInstance` (`L0-wrdn-ent1`).

**Attributes**
- `chestId` — 1..40, fixed slot in the template.
- `zone` — `central` (exactly 12) or `outer` (exactly 28).
- `positionOffset` — position relative to the template anchor, rotated with the instance.
- `lootTableRef` — always the vanilla Ancient City loot table; never the shared Windmill/Airship weighted table (`L0-wrdn-rul6`).
- fill state = registry `looted`; the container itself is the loot state (`L0-strf-r008` §4).

**Invariant:** `zone=central` count is always exactly 12 and `zone=outer` count is always exactly 28, for every instance (`L0-wrdn-rul6`, raw AC 48).
