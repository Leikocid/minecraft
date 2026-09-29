---
type: "concept-architecture-decision"
node_id: "L0-strf-d003"
source_channel: "rollout"
analysis_version: 2
title: "ADR-strf-03 — Exactly one pack owns `strf` in a world, and tests drive it through a hook API"
aliases: ["L0-strf-d003"]
is_a: ["architecture-decision"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1342
tags: ["is_a:architecture-decision", "status:superseded", "testing", "relates_to:L0-strf-cx01", "relates_to:L0-infr", "relates_to:L0-adr-own"]
level: 2
---
# ADR-strf-03 — Exactly one pack owns `strf` in a world, and tests drive it through a hook API

**Context.** `L0-strf-cx01`: dynamic properties are per pack, and SimulatedPlayers are unreadable in the release pack. Two `strf` instances would each generate everything.

**Decision.**
- `StrfRuntime(store, engine, {enabled})`; the release passes the world's `EnabledTypes`; tests build their own runtime over `MemoryStore`/`ScopedStore` and drive `Discovery.evaluateChunk`/`discover`/`enqueue` plus `installTestHook({salt, outcomes})`.
- The test hooks are compiled only into the gametest bundle, never into the release pack.

**Rejected.** *Both packs run `strf`, sharing state through scoreboards.* Scoreboards cannot hold the registry (size and type), and it is fragile. *Structure tests without the release pack.* This is viable as the backup, but it loses the "release pack loads cleanly alongside" signal.

**Consequences.** The release bundle drops the `STRF_TEST_HOOK` label (`scripts/build.mjs:75`); `tests/structures-registry.test.mjs` AC5 asserts it.
