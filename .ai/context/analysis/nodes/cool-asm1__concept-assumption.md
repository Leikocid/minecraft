---
type: "concept-assumption"
node_id: "cool-asm1"
source_channel: "rollout"
analysis_version: 1
title: "A-1 · \"Hidden by Shadow Blade\" is detectable as an invisibility effect / marker"
aliases: ["cool-asm1"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 771
tags: ["CAN_ASSUME", "scythe", "title:Shadow Blade hiding = invisibility"]
---
# A-1 · "Hidden by Shadow Blade" is detectable as an invisibility effect / marker

**Gap.** Scythe §3 excludes players "скрытый активной способностью Shadow Blade", but Shadow Blade has no spec in any source.

**Assumption (CAN_ASSUME).** Until Shadow Blade is specified, the Scythe target filter excludes players with the `invisibility` effect, and exposes a single predicate (`isHiddenFromTargeting(player)`) that Shadow Blade will later extend (e.g. with an `andrew:` tag or dynamic property).

**Impact if wrong.** If Shadow Blade hides players by another mechanism (e.g. vanish/teleport, no effect), acceptance test Scythe #3 cannot be satisfied and the predicate must be re-implemented; if vanilla invisibility must *not* exclude targets, the filter over-excludes.
