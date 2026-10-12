---
type: "concept-rule"
node_id: "L0-pear-ru02"
source_channel: "rollout"
analysis_version: 11
title: "Rule: safe arrival spot"
aliases: ["L0-pear-ru02"]
is_a: ["rule"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 1592
tags: ["v11", "pearl-rod", "rule", "safe-spot", "C-44"]
level: 2
---
# Rule: safe arrival spot

**Is a:** rule. **Part of:** L0-pear. **Relates to:** C-44, L0-pear-pr03.

**Candidates, in order:**
1. the plate cell P (feet in P, standing on the support);
2. then P's 8 horizontal neighbours in a fixed order: N, E, S, W, NE, SE, SW, NW. The order is fixed so tests are deterministic.

No vertical search: the spec says "над ней или рядом" (above it or beside it).

**A candidate cell F is safe when all of these hold:**
- **Feet F and head F+1 are passable:** air, a plate, carpet, a sign, a torch, a button, snow layers ≤ 1, flowers or grass. Determined by `block.isAir || block.isLiquid === false && block in the passable table`. No runtime `isSolid` exists in 2.10.0 (engine fact), so a typeId allow-list is kept in `safe-spot.ts`.
- **Neither F nor F+1 contains** lava, fire or soul fire, magma, cactus, powder snow, sweet berry bush, wither rose, or water deeper than F.
- **The floor F−1 is a full solid block,** by a typeId deny-list of non-solid or harmful floors: air, liquids, magma, campfire, cactus, powder snow, scaffolding.
  - For P itself the floor is the plate's support, which is solid by construction. A plate cannot sit on air.
- **F lies inside the dimension's height range,** and F+1 < `heightRange.max`.

**Arrival point:** `(F.x + 0.5, F.y, F.z + 0.5)`. The facing is unchanged.

**No candidate safe** → no teleport, the binding is kept, and the player sees "destination unsafe" (`xasm42`).

**Limitations:**
- Mobs standing at the spot are not considered.
- Liquids flowing in after the check, within the same tick, are not considered.
