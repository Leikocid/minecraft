---
type: "concept-contradiction"
node_id: "L0-xcx27"
source_channel: "rollout"
analysis_version: 8
level: 1
title: "CX-L0-27 · The shield vs the beam"
aliases: ["L0-xcx27"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 1425
tags: ["v8","storm-blade","category:spec-vs-platform","severity:medium","status:open","target:L0-strm","resolved"]
closed_at: 2026-10-08
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx27
---

---
title: "CX-L0-27 · A raised shield vs the 10 HP beam ('other standard protections')"
aliases: ["L0-xcx27", "Storm Blade beam vs shield"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-adr-sbdm", "L0-xq8", "L0-xasm29"]
see_also: ["stormbladeelytratotemspecruen-part-1"]
---
# CX-L0-27 · The shield vs the beam

**Spec says** (§02): the target takes 10 HP "before armour and other standard protections". §06 checks that the active hit is "10 HP before armour". It never mentions shields. The English handoff (§07) says only "10 HP before armor".

**The platform does:** a raised shield (a sneaking holder) cancels script `applyDamage` with cause `entityAttack` or `projectile` **entirely and regardless of facing**. A vanilla shield blocks only from the front. A shield-holder hit from behind would therefore take 0 HP. That is not a "standard protection".

The Sculk Crossbow avoided this with cause `sonicBoom`, which ignores armour too, so it is not available to an armour-respecting weapon.

**Options for `strm`:**
- (a) Accept the full block and document it under C-16.
- (b) Check facing in script, and if the target's back faces the wielder use a cause the shield ignores plus manual armour (`adr-sbdm` C).
- (c) Treat the shield as one of the "standard protections" and block from every angle.

**Severity: medium.** This is PvP-visible but narrow. Default (CAN_ASSUME) is (a), pending `xq8`.
