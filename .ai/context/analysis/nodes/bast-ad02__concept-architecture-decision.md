---
type: "concept-architecture-decision"
node_id: "L0-bast-ad02"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-bast-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 866
tags: ["is_a:architecture-decision", "loot", "relates_to:L0-wrdn"]
level: 2
---
**ADR-bast-02 — Reuse real vanilla Bastion Remnant loot tables instead of the shared custom loot system**

**Context:** The four-structure family already has a shared custom weighted loot system (§3) used by Windmill and Airship. §14.4 explicitly excludes Mini Bastion from it.

**Chosen:** Mini Bastion's 10 chests roll directly against the real vanilla Bastion Remnant loot tables (treasure variant for the 3 central chests, regular variant for the other 7), preserving genuine vanilla categories, quantities and rarities.

**Rejected alternative:** Apply the shared custom weighted loot system uniformly to all four structures for implementation consistency. Rejected by the spec itself (§14.4, §15) to preserve "authentic bastion" loot behavior — the same reasoning Mini Warden City (`L0-wrdn`) applies to the vanilla Ancient City table.

**Source:** §14.4, §15.
