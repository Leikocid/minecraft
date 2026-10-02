---
type: "concept-assumption"
node_id: "L0-pick-asm2"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pick-asm2"]
is_a: ["assumption"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 651
tags: ["is_a:assumption", "relates_to:L0-pick-r003"]
level: 2
---
**Assumption:** no XP is granted on auto-smelt, based on the reasoning that all 7 raw materials give 0 XP when mined normally in vanilla (XP comes from smelting at a furnace, not from mining the ore).

**Impact if wrong:** if Stage 2's PvP economy design expects auto-smelt to be XP-neutral versus "mine then smelt at a furnace" (which *does* grant XP), this pickaxe is currently a strict downgrade in earnable XP for any player who would otherwise smelt manually — worth flagging before Stage 2 economy is designed, not after. No code path currently grants XP on auto-smelt; adding it would need an explicit per-block XP table, which does not exist.
