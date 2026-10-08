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

**The platform does:** a raised shield (a sneaking holder) cancels `entityAttack` + `damagingEntity` only when the source is within 90° of the holder's view (as a vanilla sword hit); a source-less call is blocked from every side; cause `projectile` throws. That is not a "standard protection".

The Sculk Crossbow avoided this with cause `sonicBoom`, which ignores armour too, so 13 causes pass the shield with armour applied exactly as entityAttack (CNTR-X27 P2); none is needed, since the native call is already directional.

**Resolved by measurement (CNTR-X27, BDS 1.26.51.1, `.ai/verify/CNTR-X27-AA/2.json`, `3.json`).** The premise is false. `applyDamage(D, {cause: entityAttack, damagingEntity: wielder})`, the call `strm-rdmg` prescribes, is cancelled by a raised shield only when the wielder is within 90° of the holder's view:
- 0–85° → 0 HP, `false`, shield wear D + 1;
- 90–180° → D, armour applied;
- the same at 2 and 8 blocks, and the same split as a vanilla diamond-sword hit.

Only a call with no `damagingEntity` is blocked from every side. The native call is therefore the vanilla shield, a standard protection, which is §02 «до учёта брони и прочих стандартных защит» read literally and `xq8` option 2. From behind, diamond + Protection IV takes 1.08 of 10 (0.56 of 6), the same as without a shield. No deviation, no C-16 entry.

(a) "block from every angle" and (c) are not platform limits but extra code (drop the source and lose kill credit, or a script facing check), and they would deviate from §02. (b) reproduces the native number (sonicBoom + the Java 1.21 armour formula: 1.08) but duplicates what the native call does. Closed.
