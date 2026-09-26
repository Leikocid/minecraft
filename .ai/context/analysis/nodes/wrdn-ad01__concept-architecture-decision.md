---
type: "concept-architecture-decision"
node_id: "L0-wrdn-ad01"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-wrdn-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-wrdn"]
relates_to: ["L0-wrdn"]
priority: 530
size_chars: 905
tags: ["is_a:architecture-decision", "loot"]
level: 2
---
**AD-wrdn-01 · Reuse the vanilla Ancient City loot table verbatim, not the shared custom weighted system**

**Context:** the other Overworld structures (Windmill, Airship) share a custom weighted loot system (spec §3) so their chests feel consistent with each other. Mini Warden City is explicitly meant to feel like a real Ancient City encounter.

**Decision:** all 10 Mini Warden City chests roll against the real vanilla Ancient City loot table, unmodified (categories, quantities, rarities, including Enchanted Golden Apple / Swift Sneak odds).

**Rejected alternative:** applying the shared §3 weighted-category loot system uniformly across all four structures for implementation consistency. Rejected explicitly by the spec (§15: "Mini Warden City и Mini Bastion используют только соответствующие ванильные loot tables") — thematic fidelity to Ancient City loot outweighs implementation uniformity.
