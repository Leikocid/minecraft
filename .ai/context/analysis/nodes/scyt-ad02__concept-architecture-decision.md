---
type: "concept-architecture-decision"
node_id: "L0-scyt-ad02"
source_channel: "rollout"
analysis_version: 1
title: "ADR-scyt-02 — \"Visible\" = a block raycast from the owner's eyes reaches the candidate's head **or** body centre"
aliases: ["L0-scyt-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1586
tags: ["is_a:architecture-decision", "visibility", "raycast", "status:proposed", "refines:ASM-023"]
level: 2
---
# ADR-scyt-02 — "Visible" = a block raycast from the owner's eyes reaches the candidate's head **or** body centre

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-scyt-r001", "ASM-023"]` · status: proposed. It refines ASM-023 (MUST_ASK) and does not replace it.

**Context.** §3 says «ближайший видимый PLAYER» without defining "visible". ASM-023 reads it as an unobstructed block raycast from the owner's eyes. With a single probe to the feet or the centre, a player whose legs are behind a half-slab or fence would count as hidden, even though the owner clearly sees their head.

**Decision.** For each candidate, cast `dimension.getBlockFromRay(eye, dir, { maxDistance: d, includeLiquidBlocks: false, includePassableBlocks: false })`:
1. toward `candidate.getHeadLocation()`;
2. if that is blocked, toward `candidate.location + (0, 0.9, 0)`, the body centre.

The candidate is visible if either ray returns no block closer than the probe point. Glass and other non-passable transparent blocks **block** visibility, because the stable API has no "opaque-only" filter.

**Rejected.**
- A single ray to the feet or centre. It gives false "hidden" results behind low cover.
- `getEntitiesFromRay`, treating entity occlusion as hiding. ASM-023 excludes it, and it makes the choice depend on stray mobs.
- No visibility check at all (radius only). That contradicts §3's «видимый».

**Consequence.** If the client rules that glass does not hide (Q under ASM-023), switch to a per-block allow-list check along the ray. The interface stays the same.
