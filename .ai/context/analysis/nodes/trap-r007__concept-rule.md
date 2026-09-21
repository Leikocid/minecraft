---
type: "concept-rule"
node_id: "L0-trap-r007"
source_channel: "rollout"
title: "R-007 — Never write outside the loaded/accessible area"
aliases: ["L0-trap-r007"]
part_of: ["L0-trap"]
is_a: ["rule"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1755
tags: ["rule","chunks","safety","L0-trap"]
---

# R-007 — Never write outside the loaded/accessible area

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-pfil", "L0-trap-as20", "L0-trap-ac04"]`

**Rule.** A cell that lies in an unloaded or otherwise inaccessible chunk is skipped exactly like a protected cell. The component must not force-load, ticket-pin or otherwise coerce a chunk into existence to complete a cube, and must not attempt a speculative write and swallow the error.

**Source.** §6: *«Не пытаться создавать паутину вне загруженной/доступной области.»* · §12: *«Игрок активирует способность у края загруженной области: не форсировать опасную запись в незагруженные чанки.»* · L0 boundary: *"Chunk loading is a hard edge, not a best effort."*

**Rationale.** The spec calls the write *«опасная»* — dangerous — which is unusually strong language for a block placement. Forcing a load at the edge of the simulation distance risks corrupt or ghost state that outlives the activation, and it is the one failure here that can damage the world rather than merely annoy a player.

**Applies to.** `L0-trap-pfil` phase A, ladder rung 1 — the **first** check, before any other classification, so an unreadable cell costs one probe and nothing more.

**Method.** How "loaded and accessible" is probed on the stable surface is **ASM-020**: the working assumption is that a block read on an unloaded cell either returns undefined or throws, and either outcome is treated as `skip`. The probe must not itself be the thing that causes a load.

**Consequence.** A player activating at the render edge gets a clipped cube. That is correct behaviour, not a bug, and it is indistinguishable at the API level from a cube clipped by bedrock.

**Verified by.** `L0-trap-ac04`.
