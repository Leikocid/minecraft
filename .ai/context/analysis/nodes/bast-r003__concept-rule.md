---
type: "concept-rule"
node_id: "L0-bast-r003"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-bast-r003"]
is_a: ["rule"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 812
tags: ["is_a:rule", "loot", "chests"]
level: 2
---
**Rule:** Exactly 10 chests are placed at fixed positions per instance: 3 in the central treasure room, 7 distributed through the rest of the structure (small rooms, niches, side areas, passages). The 3 treasure chests roll against the real vanilla Bastion Remnant *treasure* loot table; the other 7 roll against the real vanilla Bastion Remnant *regular* loot table. The shared custom weighted loot system used by Windmill/Airship (family §3) does **not** apply to Mini Bastion. Each chest's contents are generated exactly once and never refill after opening, destruction, chunk unload, or server restart.

**Rationale:** Mini Bastion deliberately reuses genuine vanilla loot behavior rather than the custom system, matching Mini Warden City's choice for Ancient City loot (see ADR-bast-02).

**Source:** §14.4.
