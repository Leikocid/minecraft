---
type: "concept-assumption"
node_id: "L0-pick-asm1"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pick-asm1"]
is_a: ["assumption"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 851
tags: ["is_a:assumption", "relates_to:L0-pick-r003"]
level: 2
---
**Assumption:** auto-smelt yield count is fixed at 1, ignoring vanilla's own variable raw-drop count (e.g. copper ore: vanilla drops 2–5 raw copper, this pickaxe always drops 1 copper ingot). The raw spec's wording ("copper ore → copper ingot", singular) is taken literally rather than as shorthand for "drop count matching vanilla's raw yield."

**Impact if wrong:** if the operator actually wants smelt-yield parity with vanilla's raw-drop range, the auto-smelt payout is undervalued for copper by up to 5x, and Stage 2 balance work inherits a silently-wrong baseline. Cheap to fix — `SmeltedDrop.count` is already a field, just hardcoded to 1 at every call site — but currently untested against any explicit "should count vary" requirement; the raw spec's Fortune deferral talks about multiplication on top of a base, not what that base should be.
