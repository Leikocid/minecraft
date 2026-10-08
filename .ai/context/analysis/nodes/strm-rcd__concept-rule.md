---
type: "concept-rule"
node_id: "L0-strm-rcd"
source_channel: "rollout"
analysis_version: 8
title: "Rule: when the active fires, and what it costs"
aliases: ["L0-strm-rcd"]
is_a: ["rule"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 1585
tags: ["v8", "storm-blade", "cooldown", "trace"]
level: 2
---
---
title: "Storm Blade activation validity, cooldown spend and trace limits"
is_a: ["rule"]
part_of: ["L0-strm"]
relates_to: ["L0-xasm31", "L0-strm-pact", "L0-lgnd"]
---
# Rule: when the active fires, and what it costs

1. **A valid release spends 600 ticks (30 s), always.** A hit, a miss into air, and a wall at 0.5 blocks all count. That follows §02: "кулдаун начинается при валидном выпуске".
2. **An invalid attempt spends nothing and shows nothing new.** Invalid means:
   - on cooldown, or busy;
   - a stale (duplicate) stack;
   - a dead or spectating player;
   - the blade in neither hand;
   - the eye's chunk not loaded.
3. **The passive is independent.** It never reads or writes `sb` cooldown keys, and the active never gates the passive.
4. **Range.** The trace is ≤ **10.0 blocks Euclidean** from the eye along the view vector. The block-ray budget (cell steps) is set larger and then clamped by distance.
5. **The stop** is the first block that `katn`'s `TRACE_FLAGS` treat as solid. Liquids and passable blocks do not stop it. The trace never passes a stop, and no entity beyond the stop is eligible ("never through walls").
6. **One target.** It is the nearest living non-wielder whose ray distance is less than the stop distance. A second target is never damaged, even if the first dies.
7. **HUD.** The action bar shows «Клинок бури — Готово» / "Storm Blade — Ready" when ready, otherwise the whole seconds left (ceil), through the shared legendary HUD and lang keys.
8. **Cooldown persistence** follows the `lgnd` rules for def cooldowns (cited, not restated).
