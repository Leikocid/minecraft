---
type: "concept-contradiction"
node_id: "L0-strm-cxkb"
source_channel: "rollout"
analysis_version: 8
title: "CX-strm-kb · Knockback on the 10 HP hit"
aliases: ["L0-strm-cxkb"]
is_a: ["contradiction"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 1611
tags: ["v8","storm-blade","category:spec-vs-platform","severity:low","status:resolved","target:L0-strm","resolved_by:L0-adr-sbkb","resolved"]
level: 2
closed_at: 2026-10-08
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-strm-cxkb
---

---
title: "CX-strm-kb · 'No knockback' vs the native knockback of the beam's entityAttack"
is_a: ["contradiction"]
part_of: ["L0-strm"]
relates_to: ["L0-adr-sbdm", "L0-adr-sblt", "L0-strm-pprb"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
---
# CX-strm-kb · Knockback on the 10 HP hit

**Spec says:**
- §02: the three strikes "не наносят дополнительного урона, не поджигают и не отбрасывают; цель получает только предусмотренные 10 HP".
- §07: "visual-only lightning strikes with zero extra damage/knockback".

**The platform does:** `adr-sbdm` A deals the 10 HP (and the +6) as `applyDamage(…, { cause: entityAttack, damagingEntity: wielder })`. It is chosen so that armour and kill credit stay native. On Bedrock an attributed `applyDamage` applies **native knockback** to the target. That is known for `sonicBoom` (memory) and expected for `entityAttack`; probe P7 measures it. The strikes themselves add none (C-30), but a strict tester who sees the target pushed back on the beam hit will read it as "the lightning knocked them back".

**Readings:**
- (a) Knockback comes from the *hit*, not the *strikes*, so it is allowed. The spec bans only *extra* knockback from the visuals. This is the default (CAN_ASSUME).
- (b) No movement at all. Zero the velocity after the hit, or re-teleport the target to its position. That costs an extra write and may fight the melee's own knockback on the passive.

**Severity: low.** It is visible only on the active, and only in PvP. It is non-blocking: build (a) and record it in the deviations doc if P7 shows knockback.

**Resolved at reduce (v8):** reading (a), by `L0-adr-sbkb`.
