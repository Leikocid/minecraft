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
tags: ["is_a:architecture-decision", "status:proposed", "testing", "relates_to:L0-strf-cx01", "relates_to:L0-infr"]
level: 2
---
# ADR-strf-03 — Exactly one pack owns `strf` in a world, and tests drive it through a hook API

**Context.** `L0-strf-cx01`: dynamic properties are per pack, and SimulatedPlayers are unreadable in the release pack. Two `strf` instances would each generate everything.

**Decision.**
- `strf` is a library (`src/structures/`) with an explicit `startStrf({ owner, testHooks? })`. Importing it has no side effects.
- The release `main.ts` calls `startStrf` after a 1-tick ownership handshake. A `system.sendScriptEvent("andrew:strf_claim")` from the gametest pack makes the release pack skip starting.
- The gametest pack starts `strf` with `testHooks`: `evaluateChunk(dim,cx,cz)`, `forceRoll(defId, true|false)`, `setSalt`, `crashAfter(step)`, and `queueFromPositions(vec[])`. Tests do not depend on SimulatedPlayer positions for discovery.
- The test hooks are compiled only into the gametest bundle, never into the release pack.

**Rejected.** *Both packs run `strf`, sharing state through scoreboards.* Scoreboards cannot hold the registry (size and type), and it is fragile. *Structure tests without the release pack.* This is viable as the backup, but it loses the "release pack loads cleanly alongside" signal.

**Consequences.** `infr` adds the handshake to its harness. The release build's size check asserts that `testHooks` is absent.
