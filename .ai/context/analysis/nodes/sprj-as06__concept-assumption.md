---
type: "concept-assumption"
node_id: "L0-sprj-as06"
source_channel: "rollout"
analysis_version: 1
title: "ASM (sprj-06) — `setBusy` is keyed by player id, not by a `Player` object"
aliases: ["L0-sprj-as06"]
is_a: ["assumption"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 972
tags: ["is_a:assumption", "CAN_ASSUME", "busy", "interface"]
level: 2
---
# ASM (sprj-06) — `setBusy` is keyed by player id, not by a `Player` object

`CAN_ASSUME` · **Links:** `part_of: ["L0-sprj"]` · `is_a: ["assumption"]` · `relates_to: ["L0-lgnd", "L0-sprj-p004", "L0-sprj-r007", "ADR-025"]`

**Assumed.** `L0-lgnd`'s in-memory busy flag (ADR-025) is a `Set`/`Map` keyed by `playerId + abilityKey`, and it can be cleared with only the id. That is required because on `OWNER_INVALID` (logout) the owner's `Player` handle is already invalid in the tick that resolves the volley.

**Basis.** The L0 contract lists `cooldown.setBusy` without a signature. The durable `start` needs a `Player` (dynamic property), but busy is in memory, so an id is enough.

**Impact if wrong.** If `setBusy` requires a valid `Player`, a volley whose owner logged out can never clear busy. The flag would leak until restart and the owner would rejoin "busy". That is a C-14 violation. The fix is a signature change in `L0-lgnd`, which is cheap if caught in review.
