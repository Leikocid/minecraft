---
type: "concept-assumption"
node_id: "L0-xasm21"
source_channel: "rollout"
analysis_version: 6
level: 1
title: "ASM-L0-21 · Escape interplay with other features"
aliases: ["L0-xasm21"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 1547
tags: ["v6", "katana", "CAN_ASSUME", "alias:L0-xasm21", "is_a:assumption", "relates_to:L0-katn", "relates_to:L0-webs", "relates_to:L0-magn", "see_also:dragonkatanaspecv1ruen-part-1", "see_also:webswordspecv1ruen-part-1", "see_also:ufomagnetspecv1ruen-part-2"]
---
---
title: "ASM-L0-21 · The Katana may teleport out of a Web Sword trap and out of the UFO magnet's hold"
aliases: ["L0-xasm21", "Katana escape interplay"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-webs", "L0-magn"]
see_also: ["dragonkatanaspecv1ruen-part-1", "webswordspecv1ruen-part-1", "ufomagnetspecv1ruen-part-2"]
---
# ASM-L0-21 · Escape interplay with other features

**Gap.** The Katana spec names no interaction with the other legendaries or with events. Two follow from the mechanics:
1. **Web Sword trap.** A player caught in the 3×3×3 cobweb cube can use the Katana. Cobweb is passable to the block ray (`L0-adr-ktob`), so the trace leaves the cube.
2. **UFO magnet hold.** A player held under the saucer for iron in hand can teleport away. The magnet re-applies knockback each tick while iron is held, so they may be pulled back.

**Assumption (CAN_ASSUME).** Both escapes are **allowed**, and no feature blocks another's ability. This matches the spec's single rule that only solid blocks stop the trace. It also keeps the nodes independent: no change to `webs` or `magn`.

**Impact if wrong.**
- If the client wants a trap to be inescapable, `katn` would need a new `lgnd`-level "rooted" predicate, published like the hidden seam (`lgnd-r010`), that `webs` sets and `katn` reads. That is a framework change, and the reduce would raise it as a contradiction.
- If the magnet must win, `magn` ignores teleports, which is already its behaviour.

Worth asking the client during the iPad acceptance of the Katana.
