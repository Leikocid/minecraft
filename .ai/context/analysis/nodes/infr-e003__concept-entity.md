---
type: "concept-entity"
node_id: "L0-infr-e003"
source_channel: "rollout"
analysis_version: 2
title: "Entity: GameTest pack (`packs/gametest`)"
aliases: ["L0-infr-e003"]
is_a: ["entity"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 846
tags: ["is_a:entity"]
level: 2
---
# Entity: GameTest pack (`packs/gametest`)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["entity"]`

Dev-only behavior pack built against `@minecraft/server-gametest` `1.0.0-beta.1.26.51-stable` (devDependency, beta-only, no stable channel exists for this module). Requires the world-level "Beta APIs" experiment, which BDS exposes only through `level.dat` NBT — not through `server.properties` or an env var — so `bds-gametest.mjs` boots the server once to generate the world, patches the NBT flag directly, and reboots.

Registers a `SimulatedPlayer`-driven scenario against a generated `.mcstructure` test platform (built at run time by `writeStructure()`, not committed as a binary). Never zipped into `dist/andrew.mcaddon`; installed only into the dedicated `LEVEL_NAME=gametest` world (superflat, separate from the everyday `andrew` world).
