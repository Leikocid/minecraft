---
type: "concept-contradiction"
node_id: "L0-xcx23"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "CX-L0-23 · The shield vs a physical hit"
aliases: ["L0-xcx23"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 1586
tags: ["v7","sculk-crossbow","category:internal","severity:medium","status:open","target:L0-sclk","resolved"]
closed_at: 2026-10-05
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx23
---

---
title: "CX-L0-23 · Crossbow §9 'the shield must not cancel the special damage' vs §9 'the projectile stays physical and must really hit'"
aliases: ["L0-xcx23", "Crossbow shield vs physical hit"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-adr-scdm", "L0-xq7"]
see_also: ["sculkcrossbowspecv1ruen-part-2", "sculkcrossbowspecv1ruen-part-3"]
---
# CX-L0-23 · The shield vs a physical hit

**Source.** §5, §9 and T08: armour, armour enchantments **and the shield** do not reduce the special damage. §9 also says: the projectile stays physical; it must actually hit an entity or a block; the beam is not hitscan.

**Tension.** In vanilla, a raised shield **deflects** the projectile before it counts as a hit. If the bolt is deflected, physically there was no direct hit, so by §9 there should be no damage. But §5 and T08 say the shield must not cancel it. The two statements agree only if "the bolt touching the raised shield" counts as a direct hit on its holder. Whether a snowball-runtime bolt even raises `projectileHitEntity` on a shield-holder is not known (to be probed).

**Proposed resolution (autopilot default).** A bolt whose flight ends on a shield-holder's hitbox, whether as `projectileHitEntity` or as a deflection the script detects as "bolt within 0.6 of a player who has a shield up", counts as a direct hit on that player: full D, a patch, no crater. A deflected bolt is removed and never lands a second outcome (C-26). If the engine gives no reliable signal, the deviation is documented under C-16 and the operator confirms it in `L0-xq7`.
