---
type: "concept-acceptance-criterion"
node_id: "L0-trap-ac09"
source_channel: "rollout"
title: "AC-09 — Two clients see identical cobweb; concurrent activations resolve independently"
aliases: ["L0-trap-ac09"]
part_of: ["L0-trap"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1528
tags: ["acceptance-criterion","gate","spec-13-12","multiplayer","L0-trap"]
---

# AC-09 — Two clients see identical cobweb; concurrent activations resolve independently

**Source:** §13 — *«Два клиента в multiplayer видят одинаковую паутину и одинаковое состояние мира.»* · §9, §11 · **Owner after reduce:** `L0-qatg` · **Rule:** R-008

**GIVEN** two players connected to the same dedicated server,
**WHEN** player A activates the ability,
**THEN** both clients observe the same set of cobweb blocks at the same coordinates.

**AND** when both players activate in the same tick at different targets, **both** traps are created in full and correctly — neither activation is dropped, delayed or merged (§9: *«каждый успешный вызов обрабатывается независимо»*).

**AND** when both activate at **overlapping** targets in the same tick, the resulting world state is deterministic: the union of both cubes, with the second handler recording `already-web` for the shared cells (a no-op skip). Both players consume their cooldown; neither activation fails because of the other.

**Evidence path is contested.** §14 requires a ≥2-player test; the environment has one iPad and no second Bedrock client (ASM-010, **Q-012**). Proposed split: the **concurrency** assertions run as a GameTest with simulated players (proven in Stage 1); the **"both clients see the same thing"** assertion needs one genuine two-client session if any second device can be borrowed. `L0-qatg` owns resolving this — do not silently downgrade the criterion.

**Surface:** Docker BDS (`bds:gametest`) + one manual two-client pass if available.
