---
type: "concept-rule"
node_id: "L0-trap-r001"
source_channel: "rollout"
title: "R-001 — The ability fires on Use and only on Use"
aliases: ["L0-trap-r001"]
part_of: ["L0-trap"]
is_a: ["rule"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1349
tags: ["rule","activation","melee","L0-trap"]
---

# R-001 — The ability fires on Use and only on Use

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-pact", "L0-trap-ac05"]`

**Rule.** The ability is triggered exclusively by standard item use on a held `andrew:web_sword` — right click on desktop, long press on touch. A melee attack with the same sword triggers nothing: no target resolution, no cobweb, no cooldown.

**Source.** §5: *«Активация: стандартное использование предмета (Use / right click / long press, в зависимости от платформы).»* · §7: *«Обычный удар не создаёт паутину и не запускает cooldown.»*

**Rationale.** The two clauses are only jointly satisfiable if the engine raises distinct events for attack and use (ASM-006). If it does not, §7 is violated on every swing and the weapon becomes unusable in melee — which is the whole point of a sword. This is the cheapest assumption in the component to falsify, and the most expensive to discover late.

**Applies to.** The event registration itself — the handler must subscribe to the use surface only, and must filter on item type before doing any work.

**Violation looks like.** Cobweb appearing when the player swings at a mob; cooldown burning down with no trap placed; the player encasing themself mid-fight.

**Verified by.** `L0-trap-ac05` (§13: *«Обычный melee-урон … не создаёт паутину»*).
