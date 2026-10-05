---
type: "concept-contradiction"
node_id: "L0-xcx25"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "CX-L0-25 · Two weapons carving terrain"
aliases: ["L0-xcx25"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 1371
tags: ["v7","sculk-crossbow","category:scope-overlap","severity:low","status:resolved","target:L0","resolved_by:L0-sclk-r010","resolved"]
closed_at: 2026-10-05
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx25
---

---
title: "CX-L0-25 · Scope overlap: the Sculk Crossbow crater and the Orbital Cannon both carve terrain under the same protection rules"
aliases: ["L0-xcx25", "Crossbow crater vs Orbital carve overlap"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-orbc", "L0-pntr", "L0-adr-sctr", "L0-xasm6"]
see_also: ["sculkcrossbowspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-2"]
governs_files: ["src/orbital/penetrator-keep.ts"]
---
# CX-L0-25 · Two weapons carving terrain

**Overlap.** The Orbital Cannon (`orbc`/`pntr`) already owns a scripted carve:
- a Survival-unbreakable deny list (`src/orbital/penetrator-keep.ts`, `L0-xasm6`);
- legendary protection before edits (`protectLegendariesIn`);
- ~~the unloaded-chunk rule (C-12)~~ — not shared code: each component handles it locally, and the crater clips its own box (`adr-sctr` §2.1).

The crossbow crater (§6) needs exactly the same three rules. If `sclk` implements its own, C-7 (no duplication) is broken, and the two weapons will disagree on what is unbreakable (for example, one breaks a reinforced deepslate block and the other spares it).

**Proposed resolution (autopilot default).** As in `L0-adr-sctr` §3: move the deny list to a neutral module that both import, with no change in Orbital behaviour. `protectLegendariesIn` is already a single implementation in `lgnd` (`recovery.ts`), so the move does not touch it. `sclk` owns the refactor task. Its gate is the four `pntr_*` GameTests plus the node bundle — **not** the ring, which has no reference to the list and goes by blast resistance through `createExplosion` (`pntr-r003` forbids the two effects sharing a block classifier). The Web Sword keeps its **own** list (`websword/cube.ts:28`, Q-013): it is a deliberately different list with different meaning, and unifying it would change the Web Sword's behaviour. `orbc` is not re-analysed. Severity is low.

**Resolved at reduce (v7):** `L0-sclk-r010`. One deny list in `src/terrain/keep.ts`, moved by `sclk` with no behaviour change; gate `L0-sclk-ac22` (Orbital protection scenarios on the extraction commit).
