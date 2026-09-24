---
type: "concept-assumption"
node_id: "L0-scyt-as01"
source_channel: "rollout"
analysis_version: 1
title: "ASM-scyt-01 — Only Survival or Adventure players are candidates, and only such owners can cast `CAN_ASSUME`"
aliases: ["L0-scyt-as01"]
is_a: ["assumption"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1002
tags: ["is_a:assumption", "CAN_ASSUME", "game-mode", "targeting"]
level: 2
---
# ASM-scyt-01 — Only Survival or Adventure players are candidates, and only such owners can cast `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-r001", "Q-015", "L0-sprj-as03"]`

**Assumed:** Creative and Spectator players are skipped as targets, because they cannot take the damage meaningfully. A Creative owner **can** cast, so the ability can be tested with `/give` in Creative (Scythe §1 allows Creative for testing). A Spectator owner cannot cast, because a spectator cannot use items. This mirrors Q-015 (Survival and Adventure gate) for targets and relaxes it for owners.

**Basis:** §3 says «видимый PLAYER» with no mention of game mode. Creative players ignore health damage.

**Impact if wrong:** if Creative targets must be locked (with damage having no effect), one filter line in r001 changes and AC-scyt-02's variant flips. If Creative owners must be blocked, testing moves to Survival worlds only. Either way the blast radius is small.
