---
type: "concept-rule"
node_id: "L0-airs-r002"
source_channel: "rollout"
analysis_version: 5
title: "Rule: fixed contents — 10 chests, 1 Vindicator spawner, no one-time mobs of its own"
aliases: ["L0-airs-r002"]
is_a: ["rule"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 1479
tags: ["is_a:rule", "chests", "spawner", "relates_to:L0-loot", "relates_to:L0-strf-r010", "relates_to:L0-strf-r004", "relates_to:L0-strf-p004"]
level: 2
---
# Rule: fixed contents — 10 chests, 1 Vindicator spawner, no one-time mobs of its own

**Links:** `part_of: ["L0-airs"]` · `is_a: ["rule"]`

- Interior: 1 central corridor + 4 small rooms in the lower hull. Each room has exactly 1 ceiling lamp; the corridor is lit enough to be usable but the spawner cell must stay within the engine's light-suppression threshold for spawners (`L0-strf-r010`) (§5.2).
- Exactly 10 chests, all at fixed template-local points, converted to world space by `rotateLocal` (`L0-strf-r004`): 2 per room × 4 rooms = 8, plus 2 in the corridor (§5.3).
- Exactly 1 spawner, at a fixed point approximately at the corridor's centre: a vanilla `minecraft:mob_spawner` baked into the template with `EntityIdentifier` = Vindicator (`L0-adr-tmpl`, `L0-strf-r010`). It spawns with a vanilla iron axe; no equipment script. Fallback if the entity id does not survive `place`: `L0-strf-d002`'s pseudo-spawner — a body-transparent change, `airs` does not special-case it.
- All 10 chests are filled exactly once from the shared custom weighted table (`L0-loot`, custom path only — `airs` never uses the vanilla-loot-table path that `wrdn`/`bast` use). Room/corridor position does not change loot quality (§3.3, §5.3).
- `airs.def.chests.length === 10` and `airs.def.guards === undefined` are asserted by `strf`'s template test and registry init (`L0-strf-e001`, `L0-strf-p004`) — `airs` skips the `looted → guarded` step entirely, going straight to `done` after loot.
