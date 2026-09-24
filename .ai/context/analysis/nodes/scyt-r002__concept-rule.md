---
type: "concept-rule"
node_id: "L0-scyt-r002"
source_channel: "rollout"
analysis_version: 1
title: "R-scyt-002 — Nearest wins; ties go to the view direction"
aliases: ["L0-scyt-r002"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 978
tags: ["is_a:rule", "targeting", "tie-break"]
level: 2
---
# R-scyt-002 — Nearest wins; ties go to the view direction

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-p001", "ASM-025"]` · source: Scythe §3, §8 tests 2 and 4.

**Rule:** from the candidates (`L0-scyt-r001`), choose the one with the minimum 3D Euclidean distance from `launchPoint`, measured feet to feet.

**Tie-break:** candidates whose distances differ by ≤ 0.01 block (ASM-025) count as tied. Among tied candidates, choose the smallest angle between the owner's `getViewDirection()` and the direction from the owner's eyes to the candidate's head. Compare by the largest dot product, so no `acos` is needed.

**Final fallback:** if the angle is also tied within ε, choose by ascending entity id. The result is deterministic, so GameTests are reproducible.

**Scope:** the target is chosen once, at activation. It is never re-selected mid-flight, and projectiles never switch to a nearer player (§4 «преследуют именно выбранного игрока»).
