---
type: "concept-acceptance-criterion"
node_id: "L0-trap-ac05"
source_channel: "rollout"
title: "AC-05 — A melee swing creates no cobweb and starts no cooldown"
aliases: ["L0-trap-ac05"]
part_of: ["L0-trap"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1209
tags: ["acceptance-criterion","gate","spec-13-6","melee","L0-trap"]
---

# AC-05 — A melee swing creates no cobweb and starts no cooldown

**Source:** §13 — *«Обычный melee-урон соответствует Diamond Sword и не создаёт паутину.»* · §7 · **Owner after reduce:** `L0-qatg` · **Rule:** R-001

**GIVEN** a player holding `andrew:web_sword` with the ability off cooldown,
**WHEN** the player attacks a mob or a block with a normal swing (left click / tap),
**THEN** no cobweb appears anywhere, **AND** the ability is still immediately available — a use in the next tick succeeds.

**Split ownership, stated explicitly.** §13's test bundles two claims. The **damage parity** half (*«соответствует Diamond Sword»*) belongs to `L0-item`, which owns §1 and §7's damage clause. This component owns only the **negative** half above. `L0-qatg` should expect two criteria to map onto this one §13 line and must not treat the duplicate mapping as a double-claim.

**This is the ASM-006 falsifier.** If use and attack are not distinct engine events, this test fails immediately and the component's whole activation model needs rework. Run it **first**, before any placement logic is written — it costs minutes and it gates the design.

**Surface:** GameTest on Docker BDS with a simulated player.
