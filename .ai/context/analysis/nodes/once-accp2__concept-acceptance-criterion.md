---
type: "concept-acceptance-criterion"
node_id: "L0-once-accp2"
source_channel: "rollout"
aliases: ["L0-once-accp2"]
part_of: ["L0-once"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1133
tags: ["acceptance-criterion","craft","blocked","spec-13-3","L0-once"]
---

**AC-ONCE-2 — Second survival craft in the same world is blocked.**

Maps to §13: *«второй survival-крафт в том же мире заблокирован»*.

**GIVEN** a world where the Web Sword has already been survival-crafted once (flag set), and any player in Survival mode with 4× Cobweb and 1× Diamond Sword — whether the original crafter or a different player,
**WHEN** that player crafts the plus-pattern recipe at a crafting table,
**THEN** the player's inventory contains **no** additional `andrew:web_sword`,
**AND** the world craft flag is unchanged (same `crafterName`, same `at`),
**AND** no announcement is broadcast,
**AND** the blocked player receives a localized denial message.

**Explicitly covers both actors.** The original crafter attempting a second craft and a *different* player attempting the first-for-them craft are the same case. Testing only one of the two is insufficient — a per-player implementation would pass the first and fail the second.

**Harness:** `packs/gametest`, two simulated players, sequential crafts.

**Owned by:** `L0-once` · **Rules:** R-001, R-005 (absolute half), R-006 · **Rolls up to:** `L0-qatg`
