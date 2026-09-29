---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac10"
source_channel: "rollout"
analysis_version: 3
title: "AC-orbc-10 · The HUD shows Ready or the countdown in either hand"
aliases: ["L0-orbc-ac10"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 815
tags: ["is_a:acceptance-criterion", "channel:bds", "channel:ipad", "relates_to:L0-orbc-r012", "relates_to:L0-orbc-cx01"]
level: 2
---
# AC-orbc-10 · The HUD shows Ready or the countdown in either hand

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r012", "L0-orbc-cx01", "L0-lgnd-cx08"]`

**`[bds]`** Call `hudMessage(P)`:
- The Cannon in the main hand with no cooldown gives rawtext `andrew.legendary.ready` with the Cannon's name.
- After firing, at t+60, it gives `andrew.legendary.cooldown` with `27`.
- With the Cannon in the off hand only, the same output. This needs `allow_off_hand` (`lgnd-cx08`).
- Holding no Cannon gives `undefined`.
- Player Q, who has not fired, gets Ready at the same moment.

**`[ipad]`** (manual): in EN and RU, the Action Bar text matches the wording `cx01` settles, for example `Orbital Cannon — Ready` and `Орбитальная пушка — 27с`. It updates about twice a second.
