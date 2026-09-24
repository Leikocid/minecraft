---
type: "concept-architecture-decision"
node_id: "cool-adr4"
source_channel: "rollout"
analysis_version: 1
title: "ADR-4 · Scythe homing projectiles are script-driven (moved each tick while alive), not native projectile physics"
aliases: ["cool-adr4"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 985
tags: ["title:ADR-4 Script-driven Scythe projectiles", "is_a:architecture-decision"]
---
# ADR-4 · Scythe homing projectiles are script-driven (moved each tick while alive), not native projectile physics

**Context.** Scythe §4/§7: the projectiles pass through every block without breaking it, track one player and look like a Shulker Bullet. They must also be cleaned up on target death, logout or dimension change. The spec itself suggests script movement.

**Decision.** Each projectile is a scripted entity or particle trail. A temporary `system.runInterval` loop moves it (it only runs while projectiles exist). Hits are detected by distance to the target, and damage and launch are applied by script (A-4). All projectile state is held in memory and on tagged entities. On load, any leftover tagged entities from a previous session are removed.

**Rejected.** (a) Native `minecraft:shulker_bullet`: it collides with blocks, does vanilla damage (not 3 HP true damage) and applies levitation instead of a 10-block launch. (b) A permanent global tick loop: violates C-5.
