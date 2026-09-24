---
type: "concept-assumption"
node_id: "cool-asm5"
source_channel: "rollout"
analysis_version: 1
title: "A-5 · Scythe projectiles have a finite lifetime and a staggered launch"
aliases: ["cool-asm5"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 701
tags: ["CAN_ASSUME", "scythe", "title:Scythe projectile lifetime"]
---
# A-5 · Scythe projectiles have a finite lifetime and a staggered launch

**Gap.** Scythe §4–5 define hit, out-of-radius and target-invalid outcomes but no timeout, speed or spacing between the 3 projectiles.

**Assumption (CAN_ASSUME).** Projectiles are launched with a short stagger (~0.5 s), fly at a fixed speed faster than a sprinting player, and expire after ~10 s; expiry with ≥1 hit → full cooldown, with 0 hits → treated like "target left radius before first hit" (no cooldown).

**Impact if wrong.** Without a timeout a target that stays in radius but can't be reached (e.g. flying with elytra at high speed) keeps projectiles alive indefinitely, violating "no orphaned temporary entities".
