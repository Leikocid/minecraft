---
type: "concept-assumption"
node_id: "L0-bast-as02"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-bast-as02"]
is_a: ["assumption"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 667
tags: ["is_a:assumption", "CAN_ASSUME", "loot"]
level: 2
---
**ASM-bast-02 — Loot tables are invoked as real vanilla references, not reimplemented** `CAN_ASSUME`

Assume "real vanilla Bastion Remnant treasure/regular loot table" means calling the actual vanilla loot table identifiers/behavior via the Script API (e.g. a `LootTable` reference or fill-container-with-loot pathway) rather than hand-authoring a lookalike table.

**Impact if wrong:** A hand-authored approximation could silently drift from vanilla drop rates/categories (e.g. missing rare items), breaking the "genuine vanilla loot" intent of §14.4 without being caught by casual testing.

**Source:** §14.4 (names the tables but not the implementation mechanism).
