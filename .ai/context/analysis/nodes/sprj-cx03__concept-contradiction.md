---
type: "concept-contradiction"
node_id: "L0-sprj-cx03"
source_channel: "rollout"
analysis_version: 1
title: "Contradiction: a stale `L0-scpr` in the rollups covers this scope under incompatible ID numbering"
aliases: ["L0-sprj-cx03"]
is_a: ["contradiction"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 1883
tags: ["is_a:contradiction", "category:scope-overlap", "category:graph-hygiene", "target:L0", "severity:medium", "resolved", "resolved_by:L0-adr-scope"]
level: 2
---
# Contradiction: a stale `L0-scpr` in the rollups covers this scope under incompatible ID numbering

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["contradiction"]` · `relates_to: ["L0", "L0-stgt", "L0-stgt-ctrd"]` · **Target:** `L0` · **Category:** scope overlap / graph hygiene · **Severity:** Medium · **Status:** open.

**Checked (not an unverified claim):**
- `kv_list` (`node_prefix: "L0-s"`, `status: all`) returns only `L0-stgt` and `L0-stgt-ctrd`. **No live KV node** exists for `L0-scpr`, `L0-sctg` or `L0-scit`.
- They survive only in generated rollups (`project-knowledge/architecture.md`, `domain-model.md`, `business-rules.md`, `risks.md`, `assumptions.md`, `contradictions.md`) from an earlier decomposition. There, `L0-scpr` = "Scythe Homing Projectiles, True Damage & Cooldown Outcomes", which is this component's scope.

**Numbering clash with the current L0:**

| ID | Current L0 | Stale rollup |
|---|---|---|
| ADR-022 | True damage via `EntityHealthComponent` | Virtual projectiles (particles) |
| ADR-023 | Virtual projectiles | True damage |
| C-13 / C-14 / C-15 | Bounded tick / no orphans / exact 3 HP | Exact 3 HP / no block touch / no orphans |
| ASM-023 | Owner logout or death = cancel | Visibility = raycast |
| CTR-014 | Shadow Blade | (Shadow Blade), but CTR-016 = cooldown outcomes |

**Consequences:**
1. Any agent reading the rollups (`/plan`, `/execute`) gets two meanings per ID.
2. `L0-stgt` escalated as a "duplicate of `L0-sctg`" on the basis of those non-live rollup entries (`L0-stgt-ctrd`), so the current targeting stage has **no** deep-dive. `L0-sprj` depends on `selectTarget` from it.

**This node did not escalate.** It deep-dived under the current L0 numbering and reused the stale design only as input.

**Needed from L0:** regenerate the rollups from the live KV, retire the `L0-scpr`/`L0-sctg`/`L0-scit` text, and reopen `L0-stgt`.
