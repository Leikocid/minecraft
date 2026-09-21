---
type: "concept-architecture-decision"
node_id: "L0-trap-ad15"
source_channel: "rollout"
title: "ADR-015 — Plan all 27 cells, then apply; one synchronous invocation"
aliases: ["L0-trap-ad15"]
part_of: ["L0-trap"]
is_a: ["architecture-decision"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2375
tags: ["adr","architecture-decision","determinism","L0-trap"]
---

# ADR-015 — Plan all 27 cells, then apply; one synchronous invocation

**Links** — `part_of: ["L0-trap"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-trap-pfil", "L0-trap-ecub", "L0-trap-r008", "L0-trap-cons"]`

## Context

§9 requires every client to see the same result and concurrent activations to resolve independently; §11 requires server computation. The placement loop reads and writes the same 27 cells, so read/write interleaving is a determinism hazard — cell *n* would observe cell *n-1*'s cobweb. C-4 forbids the polling shape, and TC-2 caps the work at 27 reads + 27 writes.

## Decision

Split the placement into **phase A — plan** (pure reads producing 27 immutable `CellVerdict`s) and **phase B — apply** (writes only, no re-classification). Both phases run to completion inside **one synchronous item-use handler invocation**: no `runTimeout`, no chunked write, no async continuation, no state carried between invocations.

## Rejected alternatives

- **Classify and place in a single interleaved loop** — the natural implementation, and wrong three ways: the outcome depends on iteration order, an exception mid-loop leaves a half-cube, and there is no artefact for a test to assert against.
- **Deferring placement to a later tick (chunked or queued)** — introduces a window in which the player moves, dies or disconnects between validation and write, and creates exactly the cross-invocation state TC-3 forbids. It would also make concurrency something to engineer rather than something that is free.
- **Re-reading each cell during apply as a safety double-check** — sounds safer, is not: it makes the result order-dependent, and the plan is already only microseconds old within one tick.
- **Locking or serialising concurrent activations** — unnecessary. The Bedrock script host runs one handler to completion before the next, so holding no shared state is sufficient (the same host property `L0-once` relies on in ASM-015).

## Consequences

Concurrency safety (§9, C-5) falls out of statelessness rather than being separately implemented. Failure is atomic: a throw during phase A leaves the world untouched. The materialised plan is the object AC-01 and AC-03 assert against — without it, "skipped the chest" and "never reached the chest" are indistinguishable. Cost stays bounded at 27+27 operations in a single tick, well inside TC-2.
