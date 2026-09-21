---
type: "concept-acceptance-criterion"
node_id: "L0-trap-ac06"
source_channel: "rollout"
title: "AC-06 — The ray stops at the wall; no targeting through obstructions"
aliases: ["L0-trap-ac06"]
part_of: ["L0-trap"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1209
tags: ["acceptance-criterion","spec-12","walls","L0-trap"]
---

# AC-06 — The ray stops at the wall; no targeting through obstructions

**Source:** §12 — *«Луч упирается в ближайший доступный блок: использовать фактически доступную целевую точку; не атаковать сквозь стены.»* · **Owner after reduce:** `L0-qatg` · **Rule:** R-003

**GIVEN** a player and a second player (or mob) separated by a solid one-block wall, both well inside the reach bound,
**WHEN** the first player uses the sword aimed directly at the obstructed target,
**THEN** the cube is centred at the wall-side point, **NOT** on or beyond the target, **AND** the activation is a **success** (cobweb placed, cooldown started) — a blocked ray resolves a target, it does not fail.

**Both halves are load-bearing.** "Does not reach through" without "still succeeds at the wall" would be an implementation that fails whenever anything is in the way, which no spec clause asks for. Assert `TargetResolution.kind = block` and a `centre` at the wall.

**No §13 test covers this.** It comes from §12 only, so `L0-qatg` must add it rather than map it. A through-wall regression would otherwise ship unnoticed and is a genuine PvP exploit.

**Surface:** GameTest on Docker BDS with a simulated player behind a wall.
