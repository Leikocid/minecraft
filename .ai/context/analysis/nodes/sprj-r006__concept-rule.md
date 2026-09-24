---
type: "concept-rule"
node_id: "L0-sprj-r006"
source_channel: "rollout"
analysis_version: 1
title: "R-sprj-006 — One shared tick loop, alive only while volleys exist"
aliases: ["L0-sprj-r006"]
is_a: ["rule"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 836
tags: ["is_a:rule", "performance", "runInterval"]
level: 2
---
# R-sprj-006 — One shared tick loop, alive only while volleys exist

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj-p001", "L0-sprj-p002", "C-4", "C-13", "ADR-025"]` · source: Scythe §7 ("короткий временный tick/update только пока они существуют").

**Rule:** there is at most **one** `system.runInterval` handle for the whole module. It is created when the volley map goes from empty to non-empty and cleared with `system.clearRun` in the same tick the map becomes empty. There are no per-projectile or per-volley timers, and no `runJob`.

**Also:**
- The tick does no world scan. It resolves only the specific owner and target ids it holds (`world.getEntity(id)`), and never calls `getPlayers()` or `getEntities()`.
- At idle, meaning no volleys, the Scythe module contributes zero per-tick work (C-4).
