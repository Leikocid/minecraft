---
type: "concept-rule"
node_id: "L0-sclk-r010"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-r010"]
is_a: ["rule"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 759
tags: ["rule", "deny-list", "C-7", "xcx25", "terrain"]
level: 2
---
**R-sclk-010 · One shared deny list for weapon terrain edits (C-7, `xcx25`)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xcx25", "L0-adr-sctr", "L0-orbc", "L0-pntr", "L0-xasm6"]`

- `PENETRATOR_KEEP` (`src/orbital/penetrator-keep.ts:34`) moves to `src/terrain/keep.ts`, exported as `TERRAIN_KEEP`. `penetrator-keep.ts` re-exports it, or its imports are updated, so the Orbital behaviour is byte-identical.
- The crossbow crater and the sculk patch never `setType` a block in `TERRAIN_KEEP`.
- No per-weapon copy or extension. If the crossbow needs an extra exclusion, it goes into the shared list and the Orbital gate re-runs.
- Liquids are skipped by the crater (`xasm25`), not by the list. The list keeps its Orbital meaning.
