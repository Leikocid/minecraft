---
type: "concept-architecture-decision"
node_id: "L0-adr-scope"
source_channel: "rollout"
analysis_version: 1
level: 0
title: "ADR-L0-scope · Final component scopes after the deep-dive"
aliases: ["L0-adr-scope"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 2508
tags: ["title:ADR-L0 component scopes and graph hygiene", "reduce", "cross-component"]
---
---
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-webs", "L0-lgnd", "L0-scyt", "L0-sitm", "L0-sprj", "L0-stgt", "L0-webs-cx01", "L0-scyt-cx01", "L0-sprj-cx03", "L0-lgnd-cx05"]
status: accepted
---
# ADR-L0-scope · Final component scopes after the deep-dive

**Context.** Two children found that their scope overlapped a sibling's, or that part of the graph was missing:
- `L0-webs-cx01`: `webs` overlaps `lgnd`.
- `L0-scyt-cx01`: `sitm` and `sprj` have no component nodes, and no targeting node exists.

Both did the sensible interim thing and scoped themselves down, or acted as the umbrella. `L0-sprj-cx03` adds that stale rollup ids (`L0-scpr`, `L0-sctg`, `L0-scit`) collide with the current numbering.

**Decision.**
1. **L0 has exactly five components:** `infr`, `pick`, `lgnd`, `webs`, `scyt`.
2. **`L0-webs`** is scoped to the Web Sword's cast body (targeting, the 27-cell cube, the protected/unloaded filter, the outcome report) plus the **static** item/recipe definition. Craft gate, retention, loss return, cooldown/busy, dispatch, HUD, commands and localization plumbing belong to `L0-lgnd`. `webs` references them by id and does not restate them. This resolves `L0-webs-cx01`.
3. **`L0-scyt`** is the umbrella for the Scythe:
   - `L0-sitm` (item JSON, recipe, enchant slot, assets) and `L0-sprj` (volley engine) are its **sub-scopes**. Logically they are `part_of L0-scyt`. Their node ids are kept so their links stay valid.
   - Targeting belongs to `L0-scyt` (`p001`, `r001`–`r003`, `ac01`–`ac04`). `L0-stgt` is **not** reopened, and references to `L0-stgt` in `lgnd`/`sprj` read as `L0-scyt-p001`.

   This resolves `L0-scyt-cx01` and item 2 of `L0-sprj-cx03`.
4. **Rollups.** `project-knowledge/*.md` are regenerated from the live KV after this run commits. The `L0-scpr`/`L0-sctg`/`L0-scit` text and their ADR/C/ASM numbering are retired. When an id means one thing in a rollup and another in a live artifact, the **live** artifact wins. This covers item 1 of `L0-sprj-cx03`. Whether the regeneration happened can be checked after commit. It is not claimed here.
5. **Operator command.** `/andrew:legendary <id> …` is the framework command. `/andrew:websword` stays as a permanent alias, so README, Q-006, Q-008 and Q-014 remain correct. This closes `L0-lgnd-cx05`, which the child had already withdrawn.

**Consequences.** Future deep-dives use the five slugs above. Each shared legendary concern has one owner (`lgnd`), and each weapon keeps only what is unique to it.
