---
type: "concept-rule"
node_id: "L0-sprj-r007"
source_channel: "rollout"
analysis_version: 1
title: "R-sprj-007 — One live volley per owner; the ability is busy while it flies"
aliases: ["L0-sprj-r007"]
is_a: ["rule"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 904
tags: ["is_a:rule", "busy", "concurrency"]
level: 2
---
# R-sprj-007 — One live volley per owner; the ability is busy while it flies

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj-p001", "L0-lgnd", "L0-stgt", "ASM-017", "C-5"]`

**Rule:** from `launchVolley` until resolution, `cooldown.isBusy(owner, "scythe")` is true. A second Use during that time is rejected silently by `L0-stgt`/`L0-lgnd`, with no message and no new volley. `launchVolley` also refuses defensively if a volley for that owner already exists.

**Multiplayer (C-5):** volleys from different owners run side by side and do not interact, even on the same target. Each has its own hits, leash and outcome. A target hit by two volleys in one tick takes 3 HP from each.

**Busy is always released:** every path out of `ACTIVE` (P-sprj-002 steps 5–7, P-sprj-004, the exception handler) clears busy in the same tick. Busy is in-memory only, so a restart clears it.
