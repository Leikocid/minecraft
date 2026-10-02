---
type: "concept-assumption"
node_id: "L0-airs-as02"
source_channel: "rollout"
analysis_version: 5
title: "Assumption (CAN_ASSUME) — the 40–100 ring is sampled at several seeded angles/radii, not a single point"
aliases: ["L0-airs-as02"]
is_a: ["assumption"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 1278
tags: ["is_a:assumption", "can-assume", "linked-search"]
level: 2
---
# Assumption (CAN_ASSUME) — the 40–100 ring is sampled at several seeded angles/radii, not a single point

**Gap.** §5.6 fixes the ring's inner and outer radius (40, 100) but never says how many candidate positions are tried inside it, or in what order, before giving up.

**Assumption.** `strf.searchRing` samples a deterministic, seeded sequence of points across the annulus — e.g. a fixed number of angles (8–16) crossed with a small number of radii between 40 and 100 — and validates them in that fixed order, stopping at the first `valid` result (mirrors the discovery roll's determinism, `L0-strf-r001`). This gives every Windmill instance a real chance at a linked Airship without an unbounded or non-deterministic search.

**Impact if wrong.** Only the practical *success rate* and *distribution* of linked Airships around Windmills changes (denser or sparser sampling), not any pass/fail rule in this deep-dive. Test 33 (linked attempt happens regardless of a nearby independent Airship) passes under any reasonable sampling density, since it only checks that the attempt is *made*, not how many candidates were probed. If the client wants an exhaustive scan of the annulus instead, `airs.tryLinked` and `L0-airs-e002` are the only call sites that would need to change.
