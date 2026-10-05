---
type: "concept-assumption"
node_id: "L0-sclk-as02"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-as02"]
is_a: ["assumption"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 897
tags: ["assumption", "CAN_ASSUME", "shield", "xcx23"]
level: 2
---
**AS-sclk-02 · Shield fallback geometry (CAN_ASSUME)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["assumption"]` · `relates_to: ["L0-xcx23", "L0-sclk-p004", "L0-sclk-ac08"]`

**Assumption.** If probe Q6 shows that a snowball-runtime bolt is deflected by a raised shield with no `projectileHitEntity`, the interval resolves the bolt as an entity hit on a player when **both** hold:
- the bolt is ≤ `SHIELD_HIT_RADIUS` = 0.8 blocks from that player's eye-height axis;
- the player is blocking (`isSneaking` with a shield in either hand: the Bedrock shield is raised by sneaking).

The first match wins, and the record is claimed (r001).

**Impact if wrong.**
- If the radius is too wide, a near-miss past a sneaking shield-holder counts as a hit, against §9.
- If it is too narrow, deflections sometimes deal nothing, against T08.

Either way only one constant and the T08 shield instance change.
