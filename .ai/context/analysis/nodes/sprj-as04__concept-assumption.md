---
type: "concept-assumption"
node_id: "L0-sprj-as04"
source_channel: "rollout"
analysis_version: 1
title: "ASM (sprj-04) — The launch is not compensated for knockback resistance"
aliases: ["L0-sprj-as04"]
is_a: ["assumption"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 1296
tags: ["is_a:assumption", "CAN_ASSUME", "knockback", "probe"]
level: 2
---
# ASM (sprj-04) — The launch is not compensated for knockback resistance

`CAN_ASSUME` · **Links:** `part_of: ["L0-sprj"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sprj-p003", "ADR-024", "ASM-019"]`

**Assumed.** `applyKnockback({x:0, z:0}, V)` uses one constant `V`, tuned in GameTest on a target **without** armour for an apex of 10 ± 2 (ASM-019). Knockback resistance (each Netherite armour piece in Bedrock) lowers the apex, and we do not scale `V` up to compensate.

**Basis.** §4 says "примерно на 10 блоков", an approximate figure. Compensating means reading the armour, and the knockback-resistance attribute is not exposed on the stable API. Vanilla PvP also treats knockback resistance as a legitimate defence against launches.

**Impact if wrong.** A fully Netherite-armoured target may be launched noticeably lower than 10 blocks. If the owner wants a fixed 10 blocks regardless of armour, the options are to scale `V` by the equipped Netherite piece count (read from the `equippable` component) or a scripted teleport arc. ADR-024 rejected the latter, so it would need an ADR. §8 test 6 must state that the apex is measured on an unarmoured target.

**Probe needed:** check whether `applyKnockback`'s vertical strength is capped by the engine at the needed magnitude on 1.26.5x.
