---
type: "concept-rule"
node_id: "L0-trap-r004"
source_channel: "rollout"
title: "R-004 — Failure is free; the cooldown is a cost of success only"
aliases: ["L0-trap-r004"]
part_of: ["L0-trap"]
is_a: ["rule"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1658
tags: ["rule","ordering","cooldown","invariant","L0-trap"]
---

# R-004 — Failure is free; the cooldown is a cost of success only

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-cool", "L0-trap-pact", "L0-trap-ac02", "L0-trap-ct07"]`

**Rule.** A failed activation must leave the world and the player bit-identical to the moment before it: no block written, no cooldown started, no timer extended, no state recorded. The player may retry immediately. The 30-second cooldown begins **only** after a successful placement.

The forced ordering (ADR-006) is therefore:

> **validate reach → check cooldown → place cells → start cooldown**

**Source.** §5: *«Если корректной цели нет или цель вне допустимой дистанции, способность не срабатывает и cooldown не запускается.»* · §8: *«ровно 30 секунд после успешного создания ловушки»* · §12: *«Цель за пределами reach: ничего не происходит, cooldown не тратится.»* · L0 boundary: *"Reach is the boundary of the ability, and failing it is free… The cooldown is a cost of success only."*

**Rationale.** Any other ordering punishes a mis-aimed click with 30 seconds of disarmament. The spec states the rule three times in three sections, which is how strongly it is held.

**Consequence for ownership.** This component owns the **success predicate**; `L0-cool` owns the timer. The predicate's evaluation must complete before `L0-cool` is told anything. The cooldown *read* in step 2 is non-mutating — see CTR-007 for the ownership seam it crosses.

**Open.** What counts as "success" when the plan permits **zero** cells is not settled — **CTR-008**. Do not encode an answer without the owner's ruling.

**Verified by.** `L0-trap-ac02`, `L0-trap-ac08`.
