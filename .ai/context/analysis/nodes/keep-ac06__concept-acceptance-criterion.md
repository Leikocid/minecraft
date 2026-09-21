---
type: "concept-acceptance-criterion"
node_id: "L0-keep-ac06"
source_channel: "rollout"
title: "AC K-6 — Admin/`give` copies are not retained `CONDITIONAL ON Q-006`"
aliases: ["L0-keep-ac06"]
part_of: ["L0-keep"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1518
tags: ["acceptance-criterion","provenance","conditional","blocked:Q-006","L0-keep"]
---

# AC K-6 — Admin/`give` copies are not retained `CONDITIONAL ON Q-006`

**Links** — `part_of: ["L0-keep"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-keep-r003", "L0-keep-ent2"]` · `blocked_by: ["Q-006"]` · `source: ["CTR-005"]` · `owner_after_reduce: ["L0-qatg"]`

> This criterion's meaning depends on Q-006. Stated for the recommended "yes" branch.

**GIVEN** a player holding an `andrew:web_sword` obtained via `/give` or the Creative inventory (no provenance marker)
**WHEN** the player dies
**THEN** that sword **drops normally** as a ground item
**AND** no ledger entry is created for it
**AND** on respawn the player is granted nothing.

**AND GIVEN** a player holding **both** a crafted (marked) sword and a `/give` copy
**WHEN** the player dies and respawns
**THEN** the marked sword is restored (exactly one) and the unmarked one is on the ground — total count across world and inventory is unchanged at two.

**Spec basis.** Derived from §3/§4's admin-copy allowance plus §14's absolute no-dup rule, via CTR-005. **Not stated in the spec** — this criterion encodes the resolution, so it is only valid once the owner confirms it.

**If Q-006 is answered "no".** This criterion is withdrawn and replaced by whatever narrowed rule the owner accepts, together with an explicit written relaxation of §14. `L0-qatg` must not treat the current text as a release gate until Q-006 is closed.

**How to verify.** GameTest with two stacks distinguished by marker presence; assert the split outcome above.
