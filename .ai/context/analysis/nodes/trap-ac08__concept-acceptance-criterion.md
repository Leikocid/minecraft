---
type: "concept-acceptance-criterion"
node_id: "L0-trap-ac08"
source_channel: "rollout"
title: "AC-08 — A successful activation, and only a successful one, arms the cooldown"
aliases: ["L0-trap-ac08"]
part_of: ["L0-trap"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1298
tags: ["acceptance-criterion","gate","spec-13-9","cooldown-seam","L0-trap"]
---

# AC-08 — A successful activation, and only a successful one, arms the cooldown

**Source:** §13 — *«После успешной способности повторное использование заблокировано 30 секунд.»* · §5, §8, §12 · **Owner after reduce:** `L0-qatg` · **Rules:** R-004, and the seam in CTR-007

**GIVEN** a player who has just successfully placed a trap,
**WHEN** the player uses the sword again before 30 s have elapsed,
**THEN** no new cobweb appears and no block changes.

**AND, conversely** — given a failed activation (out of reach, or blocked by an active cooldown), the world is bit-identical afterwards and no timer is started or extended.

**Shared criterion, explicitly.** The **timing** half — that the block lasts exactly 30 s and the actionbar counts down — belongs to `L0-cool` (§8). This component owns only the **ordering** half: *success arms it, failure does not*. `L0-qatg` should expect this §13 line to be claimed from two sides and reconcile rather than flag a double-claim.

**Test both directions.** Most implementations get "cooldown blocks re-use" right and "failure doesn't arm it" wrong, because the second only shows up as a player complaint. Assert a failed use followed by an immediate successful use.

**Surface:** GameTest on Docker BDS with a simulated player and a controlled clock.
