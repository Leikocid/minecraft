---
type: "concept-acceptance-criterion"
node_id: "L0-trap-ac02"
source_channel: "rollout"
title: "AC-02 — Use out of reach creates nothing and starts no cooldown"
aliases: ["L0-trap-ac02"]
part_of: ["L0-trap"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1050
tags: ["acceptance-criterion","gate","spec-13-8","L0-trap"]
---

# AC-02 — Use out of reach creates nothing and starts no cooldown

**Source:** §13 — *«Use вне reach ничего не создаёт и не запускает cooldown.»* · §5, §12 · **Owner after reduce:** `L0-qatg` · **Rules:** R-002, R-004

**GIVEN** a player holding `andrew:web_sword` with the ability off cooldown, aimed at a point strictly beyond the reach bound with nothing solid in between,
**WHEN** the player uses the item,
**THEN** no block in the world changes, **AND** the ability remains immediately available — a second use in the next tick against a valid in-reach target succeeds.

The second half is the real assertion. "No cobweb appeared" is satisfiable by a broken implementation that also burned the cooldown; only an immediate successful retry proves the failure was free.

**Also assert the boundary.** A target at just under the reach bound must succeed and a target at just over it must fail, both measured from the eye. This is what pins ASM-017 to a real value and catches an off-by-one in the bound-check.

**Surface:** GameTest on Docker BDS.
