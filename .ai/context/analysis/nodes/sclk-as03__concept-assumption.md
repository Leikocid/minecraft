---
type: "concept-assumption"
node_id: "L0-sclk-as03"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-as03"]
is_a: ["assumption"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 738
tags: ["assumption", "CAN_ASSUME", "knockback"]
level: 2
---
**AS-sclk-03 · No extra knockback on a hit (CAN_ASSUME)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sclk-p004", "L0-sclk-r002"]`

**Gap.** The vanilla Warden Sonic Boom knocks targets back hard. The spec says only that the **visual** does not knock back (§4) and says nothing about the hit.

**Assumption.** A hit applies only the knockback that `applyDamage(…, cause projectile)` itself gives. There is no `applyKnockback`. The weapon's identity is damage plus sculk, not displacement.

**Impact if wrong.** If the operator wants a Warden-like shove: one `applyKnockback` along the bolt's velocity in p004, with a tuned strength. GameTests that check the target's position after a hit would change.
