---
type: "concept-acceptance-criterion"
node_id: "L0-once-accp4"
source_channel: "rollout"
aliases: ["L0-once-accp4"]
part_of: ["L0-once"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1292
tags: ["acceptance-criterion","creative","give","exemption","L0-once"]
---

**AC-ONCE-4 — Creative crafting and `/give` do not touch the budget.**

Maps to §3 (*«Creative и /give … НЕ расходуют право»*) and §13's `/give` availability test. Not a standalone §13 test — derived, and must be added to the matrix.

**GIVEN** a fresh world where the Web Sword has never been survival-crafted,
**WHEN** an operator runs `/give @s andrew:web_sword` **and** a player in Creative mode crafts the recipe,
**THEN** both produce a Web Sword,
**AND** the world craft flag remains **absent**,
**AND** no announcement is broadcast on either path,
**AND** a subsequent Survival craft still succeeds and announces normally (AC-ONCE-1 holds afterwards).

**Reverse direction — the exemption is symmetric:**

**GIVEN** a world where the survival craft has already happened,
**WHEN** an operator `/give`s a copy and a Creative player crafts one,
**THEN** the flag remains `crafted: true` with its original `crafterName`,
**AND** a subsequent Survival craft is still blocked.

**Also assert:** an arbitrary number of admin copies (≥3) may exist simultaneously without affecting gate behaviour in either direction (R-003, R-007).

**Harness:** `packs/gametest` for the Creative craft; BDS console for `/give`.

**Owned by:** `L0-once` · **Rules:** R-003, R-007 · **Rolls up to:** `L0-qatg`
