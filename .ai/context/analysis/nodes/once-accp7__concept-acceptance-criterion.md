---
type: "concept-acceptance-criterion"
node_id: "L0-once-accp7"
source_channel: "rollout"
aliases: ["L0-once-accp7"]
part_of: ["L0-once"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1599
tags: ["acceptance-criterion","refund","conditional","CTR-003","blocked","L0-once"]
---

**AC-ONCE-7 — Ingredient outcome on a blocked craft. `CONDITIONAL — blocked on CTR-003`**

No §13 test exists for this. That absence *is* CTR-003: §3 requires *«без потери ингредиентов»* with an escape clause, and the acceptance suite is silent, so an implementation that eats a Diamond Sword per attempt passes §13 and §14 in full.

This criterion is written in two mutually exclusive forms. **The owner must select one**; it cannot be resolved by this component.

**Form A — refund required** (if the owner ranks ingredient preservation as mandatory):

**GIVEN** a world where the Web Sword has been crafted, and a Survival player with 4× Cobweb + 1× Diamond Sword,
**WHEN** they attempt the craft,
**THEN** no Web Sword is obtained,
**AND** the player's inventory contains 4× Cobweb and 1× Diamond Sword again (or they are dropped at the player's feet if the inventory is full),
**AND** the inventory count is identical before and after — asserted by count, not by eye.

**Form B — consumption tolerated** (if the stable API cannot refund):

**GIVEN** the same setup,
**WHEN** they attempt the craft,
**THEN** no Web Sword is obtained,
**AND** the player receives the localized `andrew.web_sword.already_crafted` message **before or in the same tick as** the loss, so the cost is never silent.

**Escalation.** Whichever form is chosen must be added to §13 by the owner. Shipping Form B's behaviour while documenting Form A's promise is a defect independent of the choice.

**Owned by:** `L0-once` · **Rules:** R-005 · **Blocks:** nothing (the gate works either way) · **Rolls up to:** `L0-qatg`
