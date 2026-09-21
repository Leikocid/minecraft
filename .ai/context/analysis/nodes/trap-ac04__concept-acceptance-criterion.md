---
type: "concept-acceptance-criterion"
node_id: "L0-trap-ac04"
source_channel: "rollout"
title: "AC-04 — Activation at the edge of the loaded area writes nothing outside it"
aliases: ["L0-trap-ac04"]
part_of: ["L0-trap"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1457
tags: ["acceptance-criterion","gate","spec-12","chunks","L0-trap"]
---

# AC-04 — Activation at the edge of the loaded area writes nothing outside it

**Source:** §12 — *«Игрок активирует способность у края загруженной области: не форсировать опасную запись в незагруженные чанки.»* · §6 · **Owner after reduce:** `L0-qatg` · **Rule:** R-007

**GIVEN** a player positioned so that part of the resolved 27-cell volume lies in an unloaded/inaccessible chunk,
**WHEN** the ability activates,
**THEN** cells inside the loaded area are filled normally, cells outside it are left untouched, **AND** no chunk is loaded, pinned or generated as a side effect of the activation, **AND** the handler raises no unhandled error.

**Why "no side-effect load" is asserted separately.** An implementation that force-loads to complete the cube would pass a naive "did the world break?" check while doing exactly what §12 calls dangerous. Assert the loaded-chunk set before and after.

**Test construction is the hard part.** Forcing a deterministic unloaded neighbour inside a GameTest structure is awkward; if it proves infeasible, the fallback evidence is (a) a unit-level test of the classifier's `unloaded ⇒ skip` rung with a stubbed reader, plus (b) a BDS log check that a far-edge activation produces no content error. Record whichever is used — an untested R-007 should not pass silently through the gate.

**Depends on ASM-020** (how "loaded" is probed on the stable surface).

**Surface:** GameTest on Docker BDS + `bds:check` log grep.
