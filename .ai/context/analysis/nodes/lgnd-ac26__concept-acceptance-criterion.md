---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac26"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-ac26"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 968
tags: ["v7", "passive-def"]
level: 2
---
**AC-lgnd-26: A passive def has no timer, no Use claim and no HUD line; defs #1–#4 are unchanged.** Channel: `build` (node unit tests, stubbed hands) + `bds`.

Related: L0-lgnd-ad15, L0-lgnd-r018, L0-xcx24.

**Build.**
- `hasAbility` is true for the four shipped defs and false for `SCULK_CROSSBOW`. `defForAbility` never returns a passive def.
- `cooldownKey`/`busyKey` for the four shipped abilities are byte-identical to 1.6.1.

**BDS.** GIVEN P holds the crossbow in the main hand and a ready Katana in the off hand
WHEN P presses Use
THEN `resolveActivation(P)` returns the Katana (off hand),
AND P's Action Bar shows only the Katana line.

GIVEN P holds only the crossbow, in either hand, for 5 s
THEN the HUD makes no `setActionBar` call for P,
AND P has no `andrew:cd_*` or `andrew:busy_*` property that was not there before.

**Regression gate.** `npm test` and the legendary, Web Sword, Scythe, Orbital and Katana GameTests pass **without assertion edits**.
