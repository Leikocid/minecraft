---
type: "concept-rule"
node_id: "L0-strf-r012"
source_channel: "rollout"
analysis_version: 2
title: "Rule: every stable-API approximation is written in the deviation report"
aliases: ["L0-strf-r012"]
is_a: ["rule"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1146
tags: ["is_a:rule", "deviation-report", "C-3", "dod", "relates_to:L0-strf-e004"]
level: 2
---
# Rule: every stable-API approximation is written in the deviation report

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- File: `docs/structures/deviations.md`, checked in and owned by `strf`. Body components append their own entries in the same format (`L0-strf-e004`).
- An entry is **mandatory** whenever an implementation departs from a spec sentence because of a stable-API limit (preamble, §7, §11 DoD, §15, C-3).
- Entries known at analysis time, which must exist before the structures stage closes:
  1. Generation on first player discovery, not during terrain generation (pop-in, trees inside the footprint removed, pre-install chunks eligible) (`L0-adr-strc`).
  2. The vanilla-structure collision heuristic is incomplete (`L0-strf-r006`).
  3. Guard persistence comes from the name tag. Sun immunity comes from fire resistance, which may show fire visuals (per probe).
  4. Any failed probe item and its fallback (`L0-strf-p006`).
  5. `wrdn`: shrieker "natural" status. `loot`: vanilla-table invocation path.
- The stage's DoD check (`infr` gate) fails if a probe item is marked FAIL without a corresponding deviation entry.
