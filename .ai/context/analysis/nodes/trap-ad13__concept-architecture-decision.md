---
type: "concept-architecture-decision"
node_id: "L0-trap-ad13"
source_channel: "rollout"
title: "ADR-013 — The safety filter is a deny-by-default per-cell classifier"
aliases: ["L0-trap-ad13"]
part_of: ["L0-trap"]
is_a: ["architecture-decision"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2163
tags: ["adr","architecture-decision","safety-filter","L0-trap"]
---

# ADR-013 — The safety filter is a deny-by-default per-cell classifier

**Links** — `part_of: ["L0-trap"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-trap-r006", "L0-trap-ecel", "L0-trap-pfil"]`

## Context

§6 lists protected things by **example**, never closing the list (ASM-007, Q-013). C-8 is the constraint; its failure mode is irrecoverable deletion of player property. Meanwhile the trap must still form well enough to be a weapon.

## Decision

Classify **each cell independently** against an ordered ladder that short-circuits on the first match, cheapest probe first: *unloaded → entity present → block entity → indestructible → already web → ordinary → **unclassified***. Only `ordinary` yields a write. The terminal `unclassified` branch resolves to **skip**, so the classifier is a whitelist of things it is *sure* are replaceable, not a blacklist of things it happens to know are dangerous.

The deny-list may be narrowed only on positive evidence that a class is safe (TC-5), never on the grounds that the trap feels weak.

## Rejected alternatives

- **Allow-by-default with a blacklist** — the obvious reading of §6, and the reason it is rejected: the list is open-ended, so every unknown modded or future block becomes destructible. One missing entry equals permanent data loss.
- **A single "is this block breakable?" hardness check** — bedrock is caught, chests are not. Chests are breakable and carry the data C-8 actually protects.
- **Whole-cube veto if any cell is protected** — contradicts §6's *«остальные допустимые клетки всё равно заполнить»* and §13 test 10.
- **Deferring safety to a vanilla fill/structure primitive** — expresses no per-cell skipping and risks writes into unloaded chunks (already rejected in ADR-006).

## Consequences

Cost is bounded and uniform: exactly one classification pass over 27 cells, no search. The `reason` code retained per cell (`L0-trap-ecel`) is what makes AC-03 assert *why* a cell was skipped rather than merely counting blocks. The visible risk shifts to the safe side — an over-strict list produces a weak trap, which shows up as a tuning complaint rather than as a lost chest.
