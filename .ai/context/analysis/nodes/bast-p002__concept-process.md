---
type: "concept-process"
node_id: "L0-bast-p002"
source_channel: "rollout"
analysis_version: 5
title: "P-bast-002 — One-time population and idempotent initialization"
aliases: ["L0-bast-p002"]
is_a: ["process"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 1437
tags: ["is_a:process", "initialization", "persistence", "idempotency", "delta:2026-09-26"]
level: 2
---
# P-bast-002 — One-time population and idempotent initialization

Runs immediately after a Mini Bastion template is placed (P-bast-001), or on first load of a bastion that was placed but not yet populated.

1. Each step runs only while the registry record is in its predecessor state (`L0-strf-r008` §2, `L0-strf-p004`).
2. Fill the 10 fixed chest positions once: the 3 treasure-room chests roll against the real vanilla Bastion Remnant *treasure* loot table; the 7 remaining chests roll against the real vanilla Bastion Remnant *regular* loot table.
3. Place 2-4 (random) ordinary Gold Blocks in the treasure room.
4. Spawn the one-time guard roster: 7-10 regular Piglins + exactly 2 Piglin Brutes, no Hoglins. One Brute is placed at/guarding the treasure room; the other at a second fixed position elsewhere in the template. No mob spawners are created.
5. Mark all spawned mobs and filled chests as non-regenerating, and advance the registry record (planned → placed → looted → guarded → done).

This process must never run twice for the same bastion instance, and must never top up guards or refill chests after the fact. Nothing destroyed or altered afterward (blocks, lava, chests, guards) is ever restored, including across server restarts. Cite: `L0-strf-r008`, `L0-strf-r009`.

**Rules invoked:** R-bast-003 (chests/loot), R-bast-004 (treasure room/guards), R-bast-005 (guard persistence), R-bast-006 (world-state persistence/idempotency).
**Source:** §14.3-14.6.
