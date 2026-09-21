---
type: "concept-entity"
node_id: "L0-keep-ent2"
source_channel: "rollout"
title: "Entity — Web Sword Provenance Marker"
aliases: ["L0-keep-ent2"]
part_of: ["L0-keep"]
is_a: ["entity"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2686
tags: ["entity","provenance","conditional","blocked:Q-006","L0-keep"]
---

# Entity — Web Sword Provenance Marker

**Links** — `part_of: ["L0-keep"]` · `is_a: ["entity"]` · `relates_to: ["L0-keep-ent1", "L0-keep-r003", "L0-once"]` · `blocked_by: ["Q-006"]` · `source: ["CTR-005"]`

> **CONDITIONAL ENTITY.** The spec does not mandate this. It is the requirement CTR-005 shows to be *implied* by holding §4 and §14 together. It exists only if Q-006 is answered "yes".

A durable per-instance attribute on an `andrew:web_sword` item stack that records **how that instance came into the world**. It is what lets the restore predicate say *"this is the owner's sword"* rather than *"this is a Web Sword"*.

## Attributes

| Attribute | Type | Meaning |
|---|---|---|
| `provenance` | `survival_craft` \| *(absent)* | Set at the moment of successful survival craft. **Absent** on `/give` and on Creative-inventory copies. |
| `bound_owner` | stable player id (optional) | The crafter. Present if the owner wants the sword bonded to a person rather than merely marked as crafted. |

Absence is meaningful and is the default: an unmarked Web Sword is an admin/test copy and is **outside** retention entirely.

## Semantics

- **Marked instance** → retained on death, restored on respawn, tracked in the Retention Ledger.
- **Unmarked instance** → behaves like any ordinary item. Drops on death, can be looted, can be destroyed. No ledger entry is created for it.

This is the branch that resolves CTR-005: §4's *«предмет должен вернуться тому же владельцу»* is scoped to the crafted sword, and §14's *«нет известных способов дюпа»* holds because the retained set is exactly the set the one-per-world gate already bounds to one.

## Who writes it — unresolved

The marker must be set **at craft completion**, which is inside `L0-once`'s handler, but it is **consumed and owned** by `L0-keep`. The parent decomposition states *"`L0-once` owns the craft flag; `L0-keep` owns the item ledger… neither may write the other's"*. This entity does not fit either side of that line — filed as **CTR-006** against `L0`.

## Durability requirement

The marker must survive the operations an item stack normally survives: being dropped and picked up, moved between inventory slots, stored in a container, and — critically — **world restart** (C-6). A marker that is lost by any of these silently converts a crafted sword into an admin copy and turns retention off for that player without any error.

If the stable API offers no item-stack-durable custom attribute that survives all of the above, this entity is not implementable as specified, and Q-006's "no" branch applies. **Verify this before committing to the design** — it is the load-bearing technical assumption (ASM-015).
