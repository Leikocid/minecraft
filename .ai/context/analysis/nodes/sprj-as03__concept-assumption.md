---
type: "concept-assumption"
node_id: "L0-sprj-as03"
source_channel: "rollout"
analysis_version: 1
title: "ASM (sprj-03) — A target that leaves Survival/Adventure mid-flight invalidates the volley"
aliases: ["L0-sprj-as03"]
is_a: ["assumption"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 950
tags: ["is_a:assumption", "CAN_ASSUME", "validity", "game-mode"]
level: 2
---
# ASM (sprj-03) — A target that leaves Survival/Adventure mid-flight invalidates the volley

`CAN_ASSUME` · **Links:** `part_of: ["L0-sprj"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sprj-p002", "L0-sprj-ent3", "ASM-015", "ADR-022"]`

**Assumed.** The tick re-checks the target's game mode. If it is no longer Survival or Adventure (for example, an operator switches to Creative or Spectator mid-flight), the volley resolves `TARGET_INVALID`, with the cooldown only if `hits ≥ 1`.

**Basis.** ASM-015 excludes Creative and Spectator at selection. ADR-022's `setCurrentValue` path would otherwise damage a Creative player, because it bypasses invulnerability, which vanilla Creative never allows.

**Impact if wrong.** If the owner wants the volley to keep flying and simply skip damage on non-Survival targets, only the validity predicate changes. The risk of *not* doing this is a true-damage kill of a Creative operator, which counts as a bug.
