---
type: "concept-contradiction"
node_id: "L0-ench-cx01"
source_channel: "rollout"
analysis_version: 10
title: "CX-ench-01 · xq11 promises \"anvils untouched\", but the option (a) signature cannot tell an anvil from a table"
aliases: ["L0-ench-cx01"]
is_a: ["contradiction"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 2173
tags: ["v10","enchanting","status:resolved","resolved-by:L0-adr-enrl+L0-xq11@reduce-v10","assumption-gap","target:L0-adr-enrl","affects:L0-xq11","resolved"]
level: 2
closed_at: 2026-10-12
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-ench-cx01
---

# CX-ench-01 · xq11 promises "anvils untouched", but the option (a) signature cannot tell an anvil from a table

**is_a:** contradiction · **part_of:** L0-ench · **target:** L0-adr-enrl (option a) · **relates_to:** L0-xq11, L0-xcx32, L0-ench-prob, L0-ench-ac06
**Category:** assumption-gap. **Status:** open.

**Side A.** `L0-xq11` option (a) tells Andrey: "Anvils and books are untouched."

**Side B.** `L0-adr-enrl` decision 2(a) detects a table use as "a stack that gained enchantments while the player's level dropped by 1–3". Two facts of the vanilla flow break that signature:
1. **Timing and identity.** The table has its own input slot. The item **leaves** the player inventory when it is placed, the levels drop **at the click**, and the enchanted stack comes back as a **new arrival**, possibly many ticks later, when the player takes it out. No inventory stack "gains" enchantments in place. That only happens for `/enchant`, which has no level drop.
2. **The anvil overlaps.** Anvil + book (for example, a Mending book on a pickaxe) also costs levels, often 1–3, and also returns an enchanted stack on take-out. A level-drop-plus-arrival heuristic would therefore **re-roll anvil results**, destroying a Mending book the player applied on purpose. That breaks the promise in Side A and the spec's scope (§4 targets only the table).

**What could separate them (the probe's Q4):**
- the book or second item leaving the inventory before the anvil take-out;
- a rename;
- lapis;
- table proximity (a block ray or a nearby `enchanting_table` check at the time of the drop).

None of these is proven. The probe must show whether any of them is reliable, including the case where the player puts the book in the anvil long before the take-out.

**Effect.**
- Until Q4 is answered, the option table sent with `xq11` must not say "anvils untouched" for (a) unless the verdict proves a separating signal. Otherwise the cost line reads "may also re-roll some anvil results".
- Not blocking for the probe or the roller. Blocking for building adapter (a).

**Not self-resolved.** The reducer or analyst decides whether to amend `xq11`'s wording or the ADR's detection rule.

**Resolved at reduce v10.** `L0-adr-enrl` 2(a) now detects an *arrival* after a level drop and requires a Q4-proven separator. The `xq11` (a) anvil line is a placeholder that the probe verdict fills in; it no longer promises "anvils untouched". Still blocking for building adapter (a); not blocking for the probe or the roller.
