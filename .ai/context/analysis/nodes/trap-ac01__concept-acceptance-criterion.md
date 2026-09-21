---
type: "concept-acceptance-criterion"
node_id: "L0-trap-ac01"
source_channel: "rollout"
title: "AC-01 — Use on a valid target creates the 3×3×3 cube"
aliases: ["L0-trap-ac01"]
part_of: ["L0-trap"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1202
tags: ["acceptance-criterion","gate","spec-13-7","L0-trap"]
---

# AC-01 — Use on a valid target creates the 3×3×3 cube

**Source:** §13 — *«Use по валидной цели создаёт приблизительно полный 3×3×3 куб Cobweb вокруг центра.»* · **Owner after reduce:** `L0-qatg` · **Rules:** R-005, R-008

**GIVEN** a player in survival holding `andrew:web_sword`, ability off cooldown, standing in an open area with only ordinary replaceable blocks (air) within reach,
**WHEN** the player uses the item aimed at a valid target inside reach,
**THEN** exactly 27 cells — the resolved centre ± 1 on each of X, Y and Z — contain `minecraft:web`, and no cell outside that volume is modified.

**Strengthened deliberately.** The spec says *«приблизительно полный»* (approximately full), which would pass a cube offset by one on every axis. The test asserts **exact coordinates**, not a block count — otherwise the release gate is blind to ASM-008 / Q-011, the component's most likely silent defect.

**Blocked on Q-011** for the centre convention. Until it is answered, implement against ASM-008 (centre ± 1, centre cell included) and write the test so the expected coordinate set is a single named constant that one answer can flip.

**Surface:** GameTest on Docker BDS (`bds:gametest`).
