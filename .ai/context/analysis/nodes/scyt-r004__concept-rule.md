---
type: "concept-rule"
node_id: "L0-scyt-r004"
source_channel: "rollout"
analysis_version: 5
title: "R-scyt-004 — Projectiles pass through every block and change none"
aliases: ["L0-scyt-r004"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 804
tags: ["is_a:rule", "blocks", "projectiles"]
level: 2
---
# R-scyt-004 — Projectiles pass through every block and change none

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj", "L0-sprj-ac05", "ADR-023"]` · source: Scythe §4, §7, §8 test 5.

**Rule:**
- The volley has exactly **3** projectiles, no more and no fewer.
- Their motion ignores **all** blocks: obsidian, walls, doors, glass, bedrock and liquids included.
- Projectile code never calls `getBlock`, `setType`, `setPermutation`, `fillBlocks` or `/fill`/`/setblock`. It also never calls explosion APIs.
- A projectile inside a block still hits the target if it is within the hit radius. Visibility matters only at **target selection** (`L0-scyt-r001`), not in flight.

**Consequence:** a target that ducks behind a wall after the lock is still hit. That is intended by §4.
