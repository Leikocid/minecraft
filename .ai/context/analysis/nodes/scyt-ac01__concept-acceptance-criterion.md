---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac01"
source_channel: "rollout"
analysis_version: 1
title: "AC-scyt-01 — No player within 20 blocks: message shown, no cooldown (§8 test 1)"
aliases: ["L0-scyt-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 742
tags: ["is_a:acceptance-criterion", "spec-test:1", "channel:bds"]
level: 2
---
# AC-scyt-01 — No player within 20 blocks: message shown, no cooldown (§8 test 1)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r003"]`

**GIVEN** owner O holds a ready Scythe, and the nearest other player is 25 blocks away, or there is none,
**WHEN** O presses Use,
**THEN**:
- O (and only O) receives `andrew.scythe_of_calamity.no_target`: «Здесь нет игрока» in `ru_RU`, "There is no player here" in `en_US`;
- `sc_cooldown_until` is unchanged, and busy is false;
- no particles and no volley are created;
- a second press in the next tick behaves the same way, with no cooldown in between.

**Also:** a zombie or villager 5 blocks away does not change the result, because mobs are ignored.
