---
type: "concept-process"
node_id: "L0-scyt-p002"
source_channel: "rollout"
analysis_version: 5
title: "P-scyt-002 — Volley end to end (as shipped)"
aliases: ["L0-scyt-p002"]
is_a: ["process"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1794
tags: ["is_a:process", "volley", "delta:2026-09-26"]
level: 2
---
# P-scyt-002 — Volley end to end (as shipped)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["process"]` · `relates_to: ["L0-scyt-ent2", "L0-scyt-r004", "L0-scyt-r005", "L0-scyt-r006", "L0-scyt-r007", "L0-scyt-ad06"]`

Code: `launchVolley`, `step`, `strike`, `end`. Tuning is in `volley-rules.ts`.

1. **Launch:** refuse if the owner already has a volley. Freeze `launchPoint`, start a dedicated `runInterval(…, 1)`, store the volley in `active`, and `setBusy(owner, 220 ticks)`.
2. **Each tick** (`step`):
   1. `age++`;
   2. if the target is not live (invalid, other dimension, hp ≤ 0) → `target_invalid`;
   3. if outside the horizontal radius 20 → `out_of_radius` (`L0-scyt-r007`);
   4. if `age > 200` → `timeout`;
   5. release projectiles due at tick `10·i` from the owner's feet + 1.2;
   6. for each projectile: aim at the target's feet + 1.0 and step 0.8 blocks toward it with pure pursuit. Blocks are never read (`L0-scyt-r004`). Within 1.0 of the aim point it is a **hit**: `strike` (3 HP exact `r005`, then launch 1.35 `r006`), and the projectile is consumed. If the target dies → `target_invalid`. Otherwise draw `minecraft:endrod` at the projectile's position;
   7. if all 3 were fired and none are flying → `spent`.
3. **Hit 1:** `startCooldown` right away, so an owner who logs out mid-flight still pays (Q-009).
4. **End** (once): clear the interval, empty `flying`, remove the volley from `active`. If the owner is valid, `clearBusy`, and when `hits > 0` `startCooldown` again (a full 30 s from the end). Log the reason, the hits and the verdict.
5. An exception in a tick → `error`, counted, and the volley ends the same way.

**Throughput:** projectile 1 needs about 1 s to cover 20 blocks at 0.8 b/t. The volley's last launch is at tick 20, and it normally ends in 2–3 s.
