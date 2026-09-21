---
type: "concept-assumption"
node_id: "L0-trap-as18"
source_channel: "rollout"
title: "ASM-018 — Aiming at open air inside reach resolves to the ray's end point"
aliases: ["L0-trap-as18"]
part_of: ["L0-trap"]
is_a: ["assumption"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1685
tags: ["assumption","CAN_ASSUME","targeting","L0-trap"]
---

# ASM-018 — Aiming at open air inside reach resolves to the ray's end point

**Status:** `CAN_ASSUME` · **Affects:** `L0-trap` · **Source:** §5's third target form

**Assumed.** When the ray hits neither a block nor an entity within the reach bound, the target is the block cell at the **ray's end point** — i.e. the cell at exactly the reach distance along the view vector. The activation **succeeds**; it does not fail for want of something solid to hit.

**Basis.** §5 lists as a valid target *«точка непосредственно рядом с владельцем, если она находится в допустимой reach-зоне»* — a point, not a surface. That clause only has meaning if an unobstructed aim can still produce a target; otherwise the ability would be unusable in the open, which is where a PvP trap is most wanted.

**The competing reading.** §5's *«Если корректной цели нет … способность не срабатывает»* could be read as "no solid hit ⇒ no valid target ⇒ fail". This analysis rejects that reading because it makes the third target form dead text, but the two clauses are genuinely in tension and the owner may disagree.

**Impact if wrong.** Moderate and player-visible. If the fallback should not exist, the implementation places traps in mid-air where the owner expected nothing — free cobweb on every sky-aimed click, and a balance change. If the fallback exists but is placed differently (e.g. one block in front of the player rather than at full reach), the trap lands in the wrong spot in the most common open-field engagement. Either way the fix is local to `L0-trap-ptgt` step 5.

**Note.** No §13 acceptance test exercises this path at all — the gate is silent on it. Worth folding into Q-011's answer.
