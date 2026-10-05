---
type: "concept-rule"
node_id: "L0-lgnd-r018"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-r018"]
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 1074
tags: ["v7", "passive-def"]
level: 2
---
**R-lgnd-018: A passive legendary has every legendary property and no ability property.**

Related: L0-lgnd-ad15, L0-lgnd-r004, L0-lgnd-r007, L0-xcx24.

A def with `hasAbility(def) === false`:
1. **Never claims a Use.** `resolveActivation` skips it. With a passive def in the main hand and a ready active def in the off hand, the off hand answers the Use. This is a new case of `r004`: a passive main hand counts as "no ready ability", like a cooling one.
2. **Never draws a HUD line.** A player holding only passive legendaries receives no `setActionBar` call from the HUD. Holding a passive and an active one shows only the active line.
3. **Never writes or reads a timer.** No `andrew:cd_*` or `andrew:busy_*` key exists for it, and `defForAbility` never returns it.
4. **Keeps every other legendary rule unchanged**: the craft gate and broadcast, marks and generation, death retention (both hands), loss return and the owed list, `protectLegendariesIn`, magnetism (`r016`), operator commands.

Defs #1–#4 are active. Their behaviour, keys and HUD strings do not change.
