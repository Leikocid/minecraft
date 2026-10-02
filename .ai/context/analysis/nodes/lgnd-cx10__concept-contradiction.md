---
type: "concept-contradiction"
node_id: "L0-lgnd-cx10"
source_channel: "rollout"
analysis_version: 5
title: "CX-lgnd-10 · Death retention keeps only one marked copy per weapon, and never the off-hand one"
aliases: ["L0-lgnd-cx10"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 530
size_chars: 1439
tags: ["is_a:contradiction","source-vs-code","retention","status:open","resolved"]
level: 2
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-lgnd-cx10
---

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p002", "L0-lgnd-r008", "L0-lgnd-ent4", "L0-lgnd-ac07"]
status: open
category: source-vs-code
---
# CX-lgnd-10 · Death retention keeps only one marked copy per weapon, and never the off-hand one

**Design** (`p002`, `ent4`, `ac07`):
- Every live marked stack of every weapon is retained, from both the container and the off hand.
- `pending` is a JSON array.

**Code** (`src/legendary/retention.ts` `retain`, `state.ts`):
- `findMarked(def, container)` returns the **first** marked stack per weapon.
- `setPending` stores one serialized mark.
- The Equippable off-hand slot is not read (no `Offhand` reference outside `hands.ts`).

**Effect.**
- A player carrying two marked copies of the same weapon (for example the crafted Web Sword plus an admin `give` copy) keeps one. The second drops as an item entity. Path B only saves it if the single pending slot is free. Otherwise it is swept or left behind, and loss return would then re-issue it to the owner.
- An off-hand legendary, once `cx08` is fixed, would drop on death and go through loss return instead of retention.

In a normal Survival world only one crafted copy exists, so the practical exposure is limited to admin copies and to `cx08`.

**Resolution needed.** Choose one:
- (a) Array pending plus an off-hand scan, as designed.
- (b) Accept, and narrow `ac07` to one copy per weapon, main inventory only.
