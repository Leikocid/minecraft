---
type: "concept-assumption"
node_id: "L0-trap-as19"
source_channel: "rollout"
title: "ASM-019 — An entity target maps to the block cell containing its feet, and entities win ties"
aliases: ["L0-trap-as19"]
part_of: ["L0-trap"]
is_a: ["assumption"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1777
tags: ["assumption","CAN_ASSUME","targeting","entity","L0-trap"]
---

# ASM-019 — An entity target maps to the block cell containing its feet, and entities win ties

**Status:** `CAN_ASSUME` · **Affects:** `L0-trap` · **Source:** §5's *«игрок/живая сущность»*

**Assumed, two parts.**

1. When the target is a living entity, the cube centres on the **block cell containing the entity's feet position** (its standing cell), not its eye or bounding-box centre.
2. When the ray intersects both an entity and a block at comparable distance, the **entity wins** (ADR-014's precedence).

**Basis.** §5 permits an entity as a target but never says how a bounding box becomes a cell, and never orders the three target forms. Feet-cell is chosen because it is what actually traps: cobweb at foot level stops movement, cobweb centred on the eyes of a tall mob leaves it standing in clear air below.

**Impact if wrong.**

- *Wrong cell.* For a player-sized target the feet cell and the box centre differ by one, so the 3×3×3 still envelops them — tolerable. For tall entities (enderman, ravager) the two readings diverge enough that the trap can miss the legs entirely, which is the whole function.
- *Wrong precedence.* If blocks should win ties, a player standing flat against a wall would be trapped at the wall rather than at themself — a near-identical outcome in practice, so the blast radius here is small.

**Interaction with C-8.** Neither reading permits touching the entity itself. §6 forbids removing or replacing entities, and R-006 skips the *cell* an entity occupies — so the targeted entity's own cell is skipped while the eight surrounding cells at its level are filled. That is intended: the trap encircles rather than entombs.

**How to close.** Fold into Q-011 — the same answer that fixes cube geometry should state the entity mapping.
