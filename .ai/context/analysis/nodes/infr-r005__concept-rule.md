---
type: "concept-rule"
node_id: "L0-infr-r005"
source_channel: "rollout"
analysis_version: 1
title: "Rule: GameTest and the Beta APIs experiment never reach the release build"
aliases: ["L0-infr-r005"]
is_a: ["rule"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 895
tags: ["is_a:rule"]
level: 2
---
# Rule: GameTest and the Beta APIs experiment never reach the release build

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

`@minecraft/server-gametest` has no stable channel — using it requires the "Beta APIs" experiment on the world. The release product must stay on stable `@minecraft/server` 2.10.0 with no experimental toggles in any manifest [C-2]. Enforced structurally:
- `packs/gametest` is a devDependency-only pack, never zipped into `dist/andrew.mcaddon`.
- The experiment is enabled only in a separate world (`LEVEL_NAME=gametest`, superflat `LEVEL_TYPE=FLAT`), never in the everyday `andrew` world that `bds:check`/`bds:up` use.
- The two worlds are driven by the same `compose.yaml` via `BDS_LEVEL_NAME`/`BDS_LEVEL_TYPE`/`BDS_GAMEMODE` env overrides, not by separate compose files, so the version pin (`assertComposePinsVersion`) and port/image config stay single-sourced.
