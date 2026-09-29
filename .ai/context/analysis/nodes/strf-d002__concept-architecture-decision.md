---
type: "concept-architecture-decision"
node_id: "L0-strf-d002"
source_channel: "rollout"
analysis_version: 2
title: "ADR-strf-02 — Spawners are vanilla block entities from the template; a script pseudo-spawner is the fallback only"
aliases: ["L0-strf-d002"]
is_a: ["architecture-decision"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1393
tags: ["is_a:architecture-decision", "status:accepted", "spawner", "relates_to:L0-strf-r010", "relates_to:L0-adr-tmpl"]
level: 2
---
# ADR-strf-02 — Spawners are vanilla block entities from the template; a script pseudo-spawner is the fallback only

**Context.** §2 asks for spawners "максимально близко к ванильным" (infinite, player-proximity activation, light suppression, breakable, vanilla XP). The stable Script API cannot set a spawner's mob type at runtime. `.mcstructure` can carry `EntityIdentifier` in the block entity (`L0-adr-tmpl`).

**Decision.** Bake `mob_spawner` block entities with the mob id into each template. `strf` adds **no** runtime spawner logic. Vanilla handles activation, light, the spawn cap, breaking and XP.

**Fallback (only if probe item 1 fails).** Place a plain `mob_spawner` block and run a per-instance **pseudo-spawner**. It keeps a registry list of spawner cells. A job wakes every 200–800 ticks (seeded) only while a player is within 16 blocks of an instance. It checks that the block is still `mob_spawner` and that the light at the spawn cell is ≤ threshold, and it counts nearby mobs of that type (cap 6). Then it spawns 1–4 mobs. Breaking the block ends it for good. This goes in the deviation report because the XP and spinning-mob visuals may differ.

**Rejected.** *A custom `andrew:spawner` block with scripted behaviour.* It is not vanilla-like: no vanilla XP or visuals, and more code for less fidelity. *`/setblock` with NBT.* Bedrock commands cannot set block-entity data.
