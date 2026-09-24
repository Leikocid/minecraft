---
type: "concept-contradiction"
node_id: "L0-scyt-cx01"
source_channel: "rollout"
analysis_version: 1
title: "CX-scyt-01 · Scythe sub-scopes have children but no component nodes, and targeting has no nodes at all"
aliases: ["L0-scyt-cx01"]
is_a: ["contradiction"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1388
tags: ["is_a:contradiction", "category:graph-hygiene", "category:scope-overlap", "severity:medium", "target:L0", "resolved", "resolved_by:L0-adr-scope"]
level: 2
---
# CX-scyt-01 · Scythe sub-scopes have children but no component nodes, and targeting has no nodes at all

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["contradiction"]` · `relates_to: ["L0", "L0-sprj-cx03", "L0-sitm", "L0-sprj"]` · **Target:** `L0` · **Category:** scope overlap and graph hygiene · **Severity:** medium · **Status:** open.

**Checked, not assumed** (`kv_list node_prefix "L0-s"`, `ls nodes/`, 2026-09-24):
- `L0-sitm-*` (3 nodes) and `L0-sprj-*` (32 nodes) are live, and each declares `part_of: L0-sitm` / `L0-sprj`. **Neither** `sitm__concept-component` nor `sprj__concept-component` exists.
- `L0-sprj` children cite `L0-sprj-p001…p004`, `r001…r004`, `ent1…ent3`, `ac01…ac04`. None of these are live.
- `L0-stgt` / `L0-sctg` (targeting) have **no** live artifacts. `L0-sprj` depends on its `selectTarget`.
- The L0 decomposition plan lists only `scyt` for the whole Scythe. So `sitm`/`sprj` overlap with this node's scope, under a different parent.

**Interim, done here:** `L0-scyt` acts as the umbrella. It owns targeting (`p001`, `r001`–`r003`, `ac01`–`ac04`), restates the missing `sprj` contract (`p002`, `p003`, `r004`–`r008`), and links to the live `sitm`/`sprj` children.

**Needed from L0:** either re-parent `sitm`/`sprj` under `L0-scyt` (as `L0-scyt-*` sub-components) or add their component nodes. Then regenerate the rollups (together with `L0-sprj-cx03`).
