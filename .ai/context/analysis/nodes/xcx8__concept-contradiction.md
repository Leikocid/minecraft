---
type: "concept-contradiction"
node_id: "L0-xcx8"
source_channel: "rollout"
analysis_version: 3
title: "CX-L0-08 · 10-block LMB targeting and the vanilla highlight vs the engine's attack reach"
aliases: ["L0-xcx8"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0","L0-orbc","L0-adr-orbc","L0-xq5"]
see_also: ["orbitalcannonspecv1ruen-part-1","orbitalcannonspecv1ruen-part-2"]
priority: 540
size_chars: 1287
tags: ["title:CX-L0-08 · 10-block LMB targeting and the vanilla highlight vs the engine's attack reach","alias:L0-xcx8","is_a:contradiction","relates_to:L0","relates_to:L0-orbc","relates_to:L0-adr-orbc","relates_to:L0-xq5","see_also:orbitalcannonspecv1ruen-part-1","see_also:orbitalcannonspecv1ruen-part-2","category:source-vs-engine","severity:high","status:open","target:L0-orbc","resolved"]
level: 1
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx8
---

# CX-L0-08 · 10-block LMB targeting and the vanilla highlight vs the engine's attack reach

**Statement A (Orbital §6).** Aim at a block up to **10 blocks** away. Both LMB and RMB work. "No extra marker; use the ordinary vanilla block highlight."

**Statement B (engine, stable API 2.10.0).**
- Vanilla draws the block outline, and fires `entityHitBlock`/`playerBreakBlock`, only within the player's interaction reach. In Survival that is well under 10 blocks, and on touch devices it is shorter still.
- There is no stable event for an attack/swing that hits nothing.

**Therefore:**
- LMB can only be detected on blocks within vanilla reach.
- For blocks 6–10 away, RMB can raycast them (`itemUse` fires regardless), but the player sees **no highlight** on them.
- LMB beyond reach cannot fire at all.

**Why it matters.** AC-3 ("no block within 10 → nothing") and the "vanilla highlight is the marker" rule cannot both be literally true for both modes.

**Options for the child and client:**
- (a) Accept LMB ≤ vanilla reach and RMB ≤ 10, and document it.
- (b) Map LMB to a stable alternative such as sneak+Use, keeping 10 for both.
- (c) Add a minimal particle marker in the 6–10 range (this departs from "no marker").

It is escalated as `L0-xq5`. It blocks `orbc` task creation.
