---
type: "concept-contradiction"
node_id: "L0-xcx4"
source_channel: "rollout"
analysis_version: 2
title: "Contradiction: v1 constraint C-5 vs structure generation (resolved)"
aliases: ["L0-xcx4"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 1219
tags: ["title:C-5 forbids a permanent loop that structure discovery needs", "alias:L0-xcx4", "is_a:contradiction", "target:L0", "resolved", "status:resolved", "resolved_by:L0-adr-spwn", "category:invariant-violation", "severity:medium", "relates_to:L0-adr-strc", "relates_to:L0-strf", "relates_to:L0-strf-p005", "relates_to:L0-adr-spwn", "relates_to:L0-wind", "relates_to:L0-wrdn", "relates_to:L0-bast", "see_also:fourstructuresspecruencopy", "see_also:scytheofcalamityspecv1ruen"]
level: 1
---
# Contradiction: v1 constraint C-5 vs structure generation (resolved)

**Links:** `is_a: ["contradiction"]` · `relates_to: ["L0-strf", "L0-strf-p005", "L0-adr-strc", "L0-adr-spwn", "L0-wrdn", "L0-bast"]` · **target_node:** `L0` · **status:** resolved · **resolved_by:** `L0-adr-spwn`

**Statement A (L0 C-5, v1).** "No permanent global per-tick world scans. Short-lived tick loops allowed **only while temporary objects (Scythe projectiles) exist**."

**Statement B (Four Structures spec §7).** Structures appear per chunk across the explored world, with event-driven initialisation and no global scans of loaded chunks.

**Conflict.** The stable API has no chunk-generated event (`L0-adr-strc`), so noticing new chunks needs a permanent, throttled loop over player positions.

**Resolution.**
- `strf-p005` delivers the tick-budget design the plan required: one ≥20-tick player-position pass, with all heavy work in `runJob` under per-tick caps.
- `L0-adr-spwn` fixes the constraint text:
  - C-5a (weapons): unchanged.
  - C-5b: the discovery pass.
  - C-5c: the one-time, bounded tickingarea sweep for the spawn Windmill.

`wrdn-ad02` and `bast-ad01`, which still call this open, read as superseded (`L0-adr-body`).
