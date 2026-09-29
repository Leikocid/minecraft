---
type: "concept-contradiction"
node_id: "L0-xcx14"
source_channel: "rollout"
analysis_version: 3
title: "CX-L0-14 · The 10-block range and the \\"vanilla highlight is the marker\\" rule do not hold together on iPad touch"
aliases: ["L0-xcx14"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-orbc","L0-lgnd","L0-pntr","L0-ring","L0-xcx8","L0-xq5","L0-orbc-cx02","L0-orbc-ad01","L0-adr-orbc","L0-lgnd-ad09"]
see_also: ["L0-orbc-ac08","L0-orbc-ac03"]
priority: 540
size_chars: 2197
tags: ["status:open","target:null","severity:high","category:source-vs-engine","escalates:L0-orbc-cx02","extends:L0-xcx8","blocks:L0-orbc","relates_to:L0-orbc","relates_to:L0-lgnd","relates_to:L0-pntr","relates_to:L0-ring","relates_to:L0-xcx8","relates_to:L0-xq5","relates_to:L0-orbc-cx02","relates_to:L0-orbc-ad01","resolved"]
level: 1
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx14
---

# CX-L0-14 · The 10-block range and the "vanilla highlight is the marker" rule do not hold together on iPad touch

**Target:** `null` (escalated; client and device). **Severity:** high: it blocks `orbc` task creation. **Escalates:** `L0-orbc-cx02`. **Extends:** `L0-xcx8`. **Status:** open.

**Statement A: spec.**
- **§6:** both modes target a block up to 10 away, and the ordinary vanilla highlight is the only marker.
- **Mobile** uses "the closest stable equivalent".
- The target machine is an iPad (the `ipad` channel is the only rendering proof).

**Statement B: engine and ADRs.**
- `L0-xcx8`: stable 2.10.0 reports LMB on a block only within vanilla reach, about 5–6 blocks.
- `L0-orbc-cx02`, from the touch interaction model, **not yet observed on the device**:
  - with default "tap to interact", the highlighted block is the one under the finger, and touch reports no tap beyond reach. So **RMB 6–10 is unreachable too**;
  - the view ray (`L0-adr-orbc` §2) points at the screen centre, which is not the tapped block.
- `L0-orbc-ad01` (proposed) fixes the aim point: the event block first, the ray as fallback. The range is still limited on touch.

**Why this is L0, not `orbc`.**
- The range answer changes `lgnd` (`ad09` activation mode, and whether "attack" is a click or a gesture), every `orbc` input AC, and `pntr`/`ring`'s iPad ACs, which all start from "tap a block 8 away".
- `L0-xq5`, as filed, assumed RMB reaches 10 on touch. It is rewritten with this finding.

**What closes it.**
1. An `ipad` observation, with a split-controls (crosshair) layout versus the default touch layout, of the targeted block and the maximum tap distance for Use and Attack.
2. The client's answer to the rewritten `L0-xq5`.
3. Then `orbc-ad01` is accepted or changed. Until then, `orbc` tasks are not created (reduce plan, roll-up).
