---
type: "concept-rule"
node_id: "L0-wind-r007"
source_channel: "rollout"
analysis_version: 2
title: "Rule: spawn Windmill search order — 5×5 chunks, then nearest ≤ 500 blocks, then forced prep"
aliases: ["L0-wind-r007"]
is_a: ["rule"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1287
tags: ["is_a:rule", "spawn-windmill", "search", "relates_to:L0-wind-p002", "relates_to:L0-wind-as01", "relates_to:L0-wind-as02"]
level: 2
---
# Rule: spawn Windmill search order — 5×5 chunks, then nearest ≤ 500 blocks, then forced prep

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-p002, L0-wind-p003, L0-wind-as01, L0-wind-as02, L0-wind-cx01]`

**Source:** §4.7 items 6–9, §9 edge case 1, §12 bullet 2, test 14.

1. **Mandatory.** Exactly one spawn Windmill per new world, 100 % (the old 50 % is cancelled, §4.7.6).
2. **Stage 1:** a naturally valid site (normal validity rules) inside the 5×5-chunk square centred on the world-spawn chunk (`L0-wind-as01`). Among valid sites, the one nearest to spawn.
3. **Stage 2:** only if stage 1 has none. Search outward and take the **nearest** naturally valid site, never farther than 500 blocks from world spawn (`L0-wind-as02`).
4. **Stage 3:** only if stages 1–2 have none. Take the best **dry-land** position within 500 blocks and force-prepare it (`L0-wind-p003`).
5. A stage is never skipped: a forced-prep site is never chosen while a natural site exists within 500 blocks, even a farther one.
6. Collision rules are identical to normal generation. Unlike a normal candidate, a colliding spawn candidate is not "cancelled" — the search moves on to the next position (§6 last bullet).
7. No dry position at all → `failed`/`no-dry-land`, no Windmill, reasons logged (`L0-xq4`).
