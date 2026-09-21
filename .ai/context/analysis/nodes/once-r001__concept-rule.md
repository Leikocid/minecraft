---
type: "concept-rule"
node_id: "L0-once-r001"
source_channel: "rollout"
aliases: ["L0-once-r001"]
part_of: ["L0-once"]
is_a: ["rule"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1201
tags: ["rule","invariant","craft","L0-once"]
---

**R-001 — Exactly one survival craft of `andrew:web_sword` per world, forever.**

Source: §3 — *«В Survival конкретный Web Sword можно успешно скрафтить только один раз на весь мир/сервер.»*

The world craft flag (`L0-once-ecft`) is **write-once**. Once `crafted: true` is recorded, no game-logic path may clear, overwrite or bypass it. Every craft-completion event for `andrew:web_sword` is evaluated against it, and every evaluation after the first in Survival is a denial.

**Consequences:**
- There is no in-game reset. Not by death, not by reconnect, not by the crafter leaving the server, not by the sword being destroyed (see CTR-006 for the last one — an open question, not a licence to reset).
- "Blocked" means the player obtains no second Web Sword. It does not mean the craft attempt is prevented from occurring; see R-005 for the ingredient question.
- The rule is scoped to the **craft event**, not to the number of swords in the world. See R-003 and R-007.

**Rationale.** This is the weapon's entire scarcity design and the reason the item is "legendary". A re-openable gate is a C-7 duplication path by definition.

**Verified by:** `L0-once-accp1`, `L0-once-accp2`, `L0-once-accp3`.
