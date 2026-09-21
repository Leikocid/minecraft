---
type: "concept-process"
node_id: "L0-trap-ptgt"
source_channel: "rollout"
title: "Process — Server-Side Target Resolution"
aliases: ["L0-trap-ptgt"]
part_of: ["L0-trap"]
is_a: ["process"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2880
tags: ["process","targeting","raycast","reach","L0-trap"]
---

# Process — Server-Side Target Resolution

**Links** — `part_of: ["L0-trap"]` · `is_a: ["process"]` · `relates_to: ["L0-trap-etgt", "L0-trap-r002", "L0-trap-r003", "L0-trap-as17", "L0-trap-as18", "L0-trap-as19"]` · `see_also: ["webswordspecv1ruen-part-1"]`

Turns "this player pressed Use" into a single block coordinate — the centre of the cube — or into `none`. Runs entirely server-side from server-read player state (C-3, ADR-006, ADR-014).

## Inputs

Player eye position, view direction, dimension, game mode. **Nothing from the client.** No coordinate, no target id, no hit result supplied by the client may be trusted or used (R-008).

## Steps

1. **Establish the reach bound.** One distance value, derived from vanilla survival interaction/melee reach — *«без искусственного дальнего луча»* (§5). The concrete value is **ASM-017**; it must be a named constant, not scattered literals, so a single owner answer retunes it.
2. **Cast one ray** from the eye along the view vector, length = reach bound. The ray **stops at the first solid block** (§12: *«Луч упирается в ближайший доступный блок»*) — this is what makes through-wall targeting impossible (R-003).
3. **Prefer the entity hit.** If a living entity is intersected at a distance ≤ the block hit, the target is that entity (§5 permits *«игрок/живая сущность»*). Mapping an entity to a cell is **ASM-019**.
4. **Otherwise take the block hit.** Resolve the block hit to the cube centre per the geometry rule (R-011 → see `L0-trap-etgt`; the exact face/offset convention is **ASM-008 / Q-011** and is not decided here).
5. **Otherwise fall back to a near point.** §5 explicitly allows *«точка непосредственно рядом с владельцем, если она находится в допустимой reach-зоне»* — i.e. aiming at open sky inside reach is still targetable. The fallback's definition is **ASM-018**.
6. **Bound-check.** If the resolved point's distance from the player exceeds the reach bound, return `none`. This check is the last word: nothing downstream may re-admit an out-of-reach point (R-002).
7. **Return** a `TargetResolution` (`L0-trap-etgt`) carrying the centre cell, the kind of hit, and the measured distance — the last two exist so GameTest can assert *why* a target resolved, not just *that* it did.

## Non-goals

- No per-tick proximity scan to pre-compute targets — prohibited by §11 (C-4) and rejected in ADR-006.
- No extended or custom-range ray — prohibited by §5.
- No re-targeting, re-try, or "nearest valid alternative" search. One ray, one answer. A miss is a free miss (R-004).

## Determinism note

Two clients watching the same activation never run this process — only the server does (C-3). The process must therefore avoid any input that differs per observer. The practical rule: every value it reads comes from the *activating player's* server-side state or from the world, never from the rendering context.
