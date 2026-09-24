---
type: "concept-architecture-decision"
node_id: "L0-sprj-ad02"
source_channel: "rollout"
analysis_version: 1
title: "ADR-sprj-02 — Pure-pursuit homing at constant speed, no turn-rate limit"
aliases: ["L0-sprj-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 1584
tags: ["is_a:architecture-decision", "homing", "status:proposed"]
level: 2
---
# ADR-sprj-02 — Pure-pursuit homing at constant speed, no turn-rate limit

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-sprj-ent2", "L0-sprj-p002", "ASM-018", "ADR-023"]` · status: proposed.

**Context.** §4 says only "самонаводящиеся… преследуют именно выбранного игрока". ADR-023 integrates position each tick "by homing toward the centre of the target's body". Neither sets a steering model.

**Decision.** Each tick, `vel = normalize(targetCentre − pos) × 0.5` (ASM-018 speed), then `pos += vel`, with the step clamped to the remaining distance. There is no inertia and no maximum turn rate. The target centre is `target.location + (0, 0.9, 0)`, re-read every tick.

**Why:**
- It is deterministic and trivially testable in the pure core (`L0-sprj-ad03`).
- The step (0.5) is below the hit diameter (2.0), so there is no tunnelling past the target.
- Sprinting players move at about 0.28 block/tick, so a projectile catches a running target. Only fast movement escapes it (elytra, riptide, ender pearl), and that is also what the leash is for.

**Rejected.**
- (a) Turn-rate-limited steering, like a vanilla shulker bullet. It feels more "bullet-like", but the three projectiles start orbiting a strafing target, lifetimes run out, and the result drifts into the `EXPIRED_NO_HIT` balance hole (Q-023).
- (b) Predictive intercept, aiming at the target's future position. It is harder to test and not needed at these speeds.

**Revisit** after the iPad demo if the flight reads as too "laser-like". Speed and a turn limit are constants.
