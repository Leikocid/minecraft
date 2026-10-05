---
type: "concept-assumption"
node_id: "L0-xasm27"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "ASM-L0-27 · Ammunition and the bolt's life"
aliases: ["L0-xasm27"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 1659
tags: ["v7", "sculk-crossbow", "CAN_ASSUME"]
---
---
title: "ASM-L0-27 · Ammunition: arrows only (plain, tipped, spectral) with arrow effects dropped; no fireworks; bolts are not picked up; lifetime 100 ticks"
aliases: ["L0-xasm27", "Crossbow ammunition and bolt lifetime"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-adr-scbs", "L0-adr-scdm", "L0-xq7"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-2"]
---
# ASM-L0-27 · Ammunition and the bolt's life

**Gap.** §4 says "every fired arrow/bolt". A vanilla crossbow also loads **firework rockets**, and tipped arrows carry effects. The spec says nothing about pickup or how long a bolt lives.

**Assumption (CAN_ASSUME).**
- **Ammunition:** `minecraft:arrow` in all its variants (plain, tipped, spectral). **No fireworks.** A rocket's explosion would be area damage, which §5 and §9 forbid. If the base item is the vanilla crossbow (`adr-scbs` B), a loaded rocket is fired as one bolt and its explosion never happens.
- **Tipped and spectral effects are not applied.** The Sonic Boom hit replaces the arrow's whole hit (§5, "instead").
- **A bolt is never picked up.** It is removed on its outcome. Ammunition is spent as vanilla spends it: none in Creative, and the Infinity enchantment does not exist for crossbows.
- **Lifetime:** 100 ticks (5 s), or leaving loaded chunks, or falling into the Void. Then the bolt is removed with no outcome (C-26 "expiry").

**Impact if wrong.** If fireworks must work, the rocket path needs its own rule (a boom hit plus a crater?), and the operator must define it. If tipped effects must apply, the hit adds `addEffect` from the stored potion, which is a small change.
