---
type: "concept-rule"
node_id: "L0-scyt-r008"
source_channel: "rollout"
analysis_version: 1
title: "R-scyt-008 — Only the locked target can be hit"
aliases: ["L0-scyt-r008"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 609
tags: ["is_a:rule", "projectiles", "pvp"]
level: 2
---
# R-scyt-008 — Only the locked target can be hit

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj", "L0-scyt-r002", "C-18"]` · source: Scythe §3, §4.

**Rule:** a projectile's hit test compares its position only with `targetId`. Other players, mobs, armour stands, the owner and item entities in the path are neither damaged nor launched, and they do not absorb the projectile. The Scythe ability never damages the owner.

**Why:** §4 says «преследуют именно выбранного игрока», and §3 says «мобы не являются целями». Collateral hits would also make the 9 HP maximum untestable.
