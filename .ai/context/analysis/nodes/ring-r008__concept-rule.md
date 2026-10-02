---
type: "concept-rule"
node_id: "L0-ring-r008"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-r008"]
is_a: ["rule"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1212
tags: ["is_a:rule", "legendary", "relates_to:L0-lgnd-p008", "relates_to:L0-lgnd-r013", "relates_to:L0-lgnd-ad10", "relates_to:L0-xcx10", "relates_to:L0-pntr-cx01", "relates_to:L0-ring-ad04", "relates_to:L0-ring-cx02", "relates_to:L0-ring-ac16"]
level: 2
---
**R-ring-008 · Legendaries are never destroyed by RMB** (Orbital §5, §10; `L0-lgnd-ad10` tier 1; `L0-lgnd-r013` §2)

- **Before the first explosion of every queue step**, `ring` calls `protectLegendariesIn` (`L0-lgnd-p008`):
  - once per dimension per step (`ad04`);
  - over the union of the step's blast centres ± 8;
  - with `avoid` = the attack's ring footprint ± 8.
- ±8 = 2 × power, which covers item entities that explosion damage can destroy, not only broken containers (±~5). See `L0-ring-cx02`.
- **Protection failure wins over the blast** (C-15 rank 1): if the helper throws, the step's blasts are skipped and dropped as lost, and the error is logged. The cooldown is not refunded (`L0-orbc-ent2`).
- **The fallback container sweep (`ad01`) must skip** any entity where `isLegendaryItemEntity` holds.
- **Players' inventories** are not touched. A player killed by the blast keeps legendaries under `lgnd` retention.
- **Known gaps, inherited and not re-raised:**
  - Item frames are blocks in Bedrock and have resistance 0. A legendary in a frame is removed with `doTileDrops` false (`L0-pntr-cx01`).
  - Nested shulker boxes and bundles (`L0-lgnd-cx12`).
  - These go in the C-16 notes of `ring.ts`.
