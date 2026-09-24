---
type: "concept-acceptance-criterion"
node_id: "L0-sprj-ac12"
source_channel: "rollout"
analysis_version: 1
title: "AC-sprj-12 — One tick loop at most, and none at idle (C-4, C-13)"
aliases: ["L0-sprj-ac12"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 728
tags: ["is_a:acceptance-criterion", "channel:bds", "performance", "runInterval"]
level: 2
---
# AC-sprj-12 — One tick loop at most, and none at idle (C-4, C-13)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-r006", "L0-sprj-r007"]` · channel: `bds`

**GIVEN** two owners who activate the Scythe on different targets 2 ticks apart,
**WHEN** both volleys are live,
**THEN** exactly one interval handle exists (spied on `system.runInterval` and `clearRun` calls, or an exported debug counter), **AND** after both resolve, the handle is null and `runInterval` was called exactly once for the pair.

**AND GIVEN** no volleys, **THEN** the Scythe module registers no per-tick callback at all.

**AND** a second Use by the same owner during flight creates no second volley (busy).
