---
type: "concept-assumption"
node_id: "L0-infr-as05"
source_channel: "rollout"
analysis_version: 2
title: "Assumption (CAN_ASSUME) — structure template source files live under `src/structures/templates/`"
aliases: ["L0-infr-as05"]
is_a: ["assumption"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 863
tags: ["is_a:assumption", "kind:CAN_ASSUME", "relates_to:L0-adr-tmpl", "relates_to:L0-infr-e005", "relates_to:L0-infr-p005", "v2-delta"]
level: 2
---
# Assumption (CAN_ASSUME) — structure template source files live under `src/structures/templates/`

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]` · `relates_to: ["L0-adr-tmpl", "L0-infr-e005", "L0-infr-p005"]`

**Gap**: `L0-adr-tmpl` says the four templates are "layered block palettes or builder functions in TS/JSON" but does not fix a directory. Stage 0's fixed layout rule (`L0-infr-r003`) predates structures entirely.

**Assumed**: sources live under `src/structures/templates/` (one module per structure), following the existing per-feature convention of `src/legendary/`, `src/websword/`, etc., read by `scripts/build-structures.mjs` at build time.

**Impact if wrong**: purely a path/naming detail — `L0-infr-r003`'s fixed-layout table would need one more row, and `build-structures.mjs`'s import paths would move; no behavioral consequence.
