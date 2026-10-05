---
type: "concept-client-question"
node_id: "L0-xq7"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "Q-L0-7 · Sculk Crossbow: confirm the defaults (non-blocking)"
aliases: ["L0-xq7"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 1547
tags: ["v7", "sculk-crossbow", "non-blocking", "channel:ipad"]
---
---
title: "Q-L0-7 · The Sculk Crossbow defaults the operator should confirm"
aliases: ["L0-xq7", "Sculk Crossbow confirmation sheet"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-lgnd", "L0-xasm23", "L0-xasm24", "L0-xasm25", "L0-xasm26", "L0-xasm27", "L0-xcx23", "L0-adr-scbs"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-2"]
---
# Q-L0-7 · Sculk Crossbow: confirm the defaults (non-blocking)

The build proceeds on these defaults. A "no" changes only the item named.

1. **Damage** is 10 HP (5 hearts) per bolt, the same at every difficulty, through any armour or shield (`xasm23`).
2. **The crater drops nothing.** Water is not removed. Bedrock, portals and similar stay. Chests in the crater spill. Structures get no protection (`xasm25`).
3. **The patch under a target in the air**: only if there is ground at most 6 blocks below. Boats, minecarts and the UFO take no damage but still get a patch (`xasm24`).
4. **Arrows only, no fireworks.** Tipped-arrow effects are dropped (`xasm27`).
5. **The crossbow is pulled by the UFO magnet**, like every legendary since 1.6.0 (`xasm26`).
6. **Void return** goes to the last holder, falling back to the crafter for a stack nobody has held since the change (`xasm26`; built 2026-10-05).
7. **Feel:** the custom item does hold a loaded bolt — with `charge_on_draw` it loads at `max_draw_duration` and fires on the next press, like a crossbow. Quick Charge has no native effect, so shortening the draw is script work (`adr-scbs`). Hold to load, press to fire, Quick Charge by script — is that acceptable?
