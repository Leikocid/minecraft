---
type: "concept-contradiction"
node_id: "L0-strf-cx01"
source_channel: "rollout"
analysis_version: 2
title: "Contradiction — the test convention \\"arm production modules inside the gametest pack\\" vs the single-registry invariant (C-7)"
aliases: ["L0-strf-cx01"]
is_a: ["contradiction"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1621
tags: ["is_a:contradiction","category:invariant-violation","severity:high","status:open","target:L0-strf","relates_to:L0-infr","relates_to:L0-strf-d003","title:Per-pack dynamic properties vs the arm-in-gametest-pack test convention","resolved"]
level: 2
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-strf-cx01
---

# Contradiction — the test convention "arm production modules inside the gametest pack" vs the single-registry invariant (C-7)

**Statement A (project practice, measured on BDS 1.26.51.1; see the Web Sword epic, commit `1bbcea5`).** SimulatedPlayers are not marshalled into packs that do not load the beta gametest module. GameTests therefore **import and register the production module inside the gametest pack**. Dynamic properties written by one pack are invisible to the other.

**Statement B (`L0-strf-r008`, C-7, §6/§11).** Exactly one durable registry decides whether a structure exists. Re-load never creates a second copy.

**Conflict.** If both the release pack and the gametest pack run `strf` discovery in the same BDS world, each has its **own** salt and registry. Both would generate structures on the same chunks, placing different rotations over each other, filling chests twice and doubling guards. Also, the release pack's discovery reads `getAllPlayers()` entries that are unreadable for SimulatedPlayers. So the GameTest cannot drive the release pack's `strf` at all.

**Proposed resolution** (see `L0-strf-d003`). `strf` exposes `startStrf({ owner })`. The release pack calls it only if the gametest pack is **not** present. Detection uses a `scriptevent andrew:strf_owner` handshake at startup: the gametest pack claims ownership, and the release pack yields. BDS structure tests therefore run the gametest pack's copy exclusively.

**Needs.** Confirmation that the handshake is acceptable for `infr`'s harness. Alternative: a separate BDS world profile without the release pack for structure tests.
