---
type: "concept-assumption"
node_id: "L0-pear-as01"
source_channel: "rollout"
analysis_version: 11
title: "ASM-pear-01 · Defaults filled in by the deep-dive"
aliases: ["L0-pear-as01"]
is_a: ["assumption"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 2087
tags: ["v11", "pearl-rod", "assumption", "CAN_ASSUME"]
level: 2
---
# ASM-pear-01 · Defaults filled in by the deep-dive

**Is a:** assumption (CAN_ASSUME). **Part of:** L0-pear. **Relates to:** L0-xasm42, L0-pear-pr01, L0-pear-pr02, L0-pear-pr03, L0-pear-ent2.

1. **The rod must still be in the user's inventory when the teleport fires**, found by rod id. If it was dropped or stored mid-wait, there is no teleport and the binding stays on that rod.
   - *Impact if wrong:* if Andrey wants the trip to go ahead anyway, the binding clear would target a rod we cannot reach. The trip would then be repeatable, which breaks "teleports once".
2. **A hook binds only to the rod it was cast from** (by rod id), and only if that rod is still in the caster's inventory at bind time.
   - *Impact if wrong:* none visible. Vanilla removes the hook when the rod leaves the hand.
3. **Plate-generation entries are never deleted**, and only watched cells are recorded.
   - *Impact if wrong:* world dynamic-property growth of a few dozen bytes per distinct bound plate, which is negligible against the measured budget.
4. **A token that never reaches a player inventory** (crafter, hopper) stays a token. It is not a usable rod.
   - *Impact if wrong:* a crafter-made rod needs a manual pick-up, after which the swap fires. A cosmetic issue.
5. **Arrival feedback:** the actionbar shows "Arrived", plus `mob.endermen.portal` at the destination. No particles. That is an iPad taste item.
6. **Messages are sent as `rawtext` translate keys**, defined in the RP `texts/*.lang` for `en_US` and `ru_RU`, so they follow the iPad's language. Only the rod's nameTag is a fixed string (`xq12` item 2).
   - *Impact if wrong:* if translate keys do not resolve on the actionbar, the fallback is a bilingual fixed string. Only the wording changes.
7. **The preload area is 3×3 blocks around the plate**, which touches 1–4 chunks. The poll covers the 9 candidate cells.
   - *Impact if wrong:* a neighbour cell in an unloaded chunk reads as unsafe. Prevented by polling all 9.
8. **Hand-check cadence is 20 ticks** for the durability hold.
   - *Impact if wrong:* none. The worst-case loss between checks is far below 64.
