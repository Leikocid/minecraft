---
type: "concept-architecture-decision"
node_id: "L0-sclk-ad01"
source_channel: "rollout"
analysis_version: 7
title: "AD-sclk-01 · Piercing: slot `crossbow` plus strip-on-sight"
aliases: ["L0-sclk-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1094
tags: ["architecture-decision", "piercing", "enchantments", "T15"]
level: 2
---
# AD-sclk-01 · Piercing: slot `crossbow` plus strip-on-sight

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-sclk-r005", "L0-sclk-cx01", "L0-adr-scbs"]`

**Context.** T15: "Piercing cannot be applied or used." A Bedrock item's `enchantable.slot` picks a whole vanilla slot. Slot `crossbow` brings Quick Charge, Multishot **and** Piercing. Stable 2.10.0 has no before-event for anvils or enchanting tables.

**Decision.** Use slot `crossbow`, so Quick Charge and Multishot come from the vanilla tables. Remove Piercing from any sculk-crossbow stack on sight (r005). Piercing also has no gameplay path, because a bolt resolves once.

**Rejected.**
- **Slot `bow`.** It brings Power, Punch, Flame and Infinity and loses Quick Charge and Multishot (T14, T16).
- **Slot `none` plus scripted Quick Charge and Multishot from a custom upgrade.** The vanilla enchanting UX is gone, and §8 says "vanilla enchantments are allowed".
- **Refusing the anvil result.** No stable hook exists (C-16).

**Consequence.** Piercing and Multishot exclude each other in the engine, so only a crossbow without Multishot ever reaches the strip.
 For a moment, a stack can carry Piercing (cx01).
