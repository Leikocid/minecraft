---
type: "concept-contradiction"
node_id: "L0-scyt-cx04"
source_channel: "rollout"
analysis_version: 1
title: "CX-scyt-04 · `L0-sprj` children still say players-only, a 3D leash and event-driven invalidation; the code differs"
aliases: ["L0-scyt-cx04"]
is_a: ["contradiction"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1296
tags: ["is_a:contradiction", "category:stale-sibling", "severity:medium", "target:L0-sprj", "delta:2026-09-26"]
level: 2
---
# CX-scyt-04 · `L0-sprj` children still say players-only, a 3D leash and event-driven invalidation; the code differs

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-sprj", "L0-scyt-cx01", "L0-scyt-ad04", "L0-scyt-ad05", "L0-scyt-ad06"]`

**Target:** `L0-sprj` · **Category:** stale sibling vs shipped code · **Severity:** medium · **Status:** open.

| Topic | `L0-sprj` and prior text | Shipped (`src/scythe/volley*.ts`) |
|---|---|---|
| Target type | Player only | `Entity`: player or mob (`L0-scyt-ad04`) |
| Leash | `dist3D > 20` | horizontal `hypot(dx,dz) > 20` (`L0-scyt-ad05`) |
| Invalidation | `entityDie`/`playerLeave`/`playerDimensionChange` marks, `OWNER_INVALID` | per-tick polling of the target only; the volley survives the owner |
| Loop | one module interval, started and stopped with the map | one `runInterval` per volley |
| Damage | `setCurrentValue` only | `applyDamage(3)` + correction (`L0-scyt-ad06`) |
| Busy | memory only | a dynamic-property deadline (11 s) |

This node has been updated to the code. The `L0-sprj-*` nodes (32) were not rewritten, because they are outside this node's scope.

**Needed:** re-run the `L0-sprj` deep-dive in delta mode against `src/scythe/volley*.ts`, or retire it into `L0-scyt` (see `L0-scyt-cx01`).
