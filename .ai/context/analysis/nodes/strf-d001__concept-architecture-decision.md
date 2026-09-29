---
type: "concept-architecture-decision"
node_id: "L0-strf-d001"
source_channel: "rollout"
analysis_version: 2
title: "ADR-strf-01 — Stateless deterministic rolls plus an evaluated bitset, instead of a stored per-chunk outcome"
aliases: ["L0-strf-d001"]
is_a: ["architecture-decision"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1057
tags: ["is_a:architecture-decision", "status:accepted", "relates_to:L0-adr-strc", "relates_to:L0-strf-r001"]
level: 2
---
# ADR-strf-01 — Stateless deterministic rolls plus an evaluated bitset, instead of a stored per-chunk outcome

**Context.** Discovery may see a chunk many times, and crashes can lose unpersisted state. §11 forbids duplicates. Storage is bounded (C-6).

**Decision.** The roll outcome is recomputed from `hash(salt, dim, cx, cz, def)` every time. Only two things persist: 1 bit per chunk (*evaluated*) and records for placed or reserved instances. The bit is an optimisation, not a correctness guard. Correctness comes from determinism plus the registry.

**Rejected.**
- *Store every roll result per chunk.* This costs about 4× the storage. A lost write can still lead to a re-roll with a different `Math.random`, which means duplicates or misses.
- *No bitset, recompute always.* Correct, but every revisit re-runs validation probes for positive-roll chunks that were rejected. That wastes block reads (C-5b).

**Consequences.** A world's layout is fixed by its salt. Tests can force outcomes by injecting a salt or an override table through the test hook.
