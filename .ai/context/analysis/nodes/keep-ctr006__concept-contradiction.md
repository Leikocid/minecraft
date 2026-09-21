---
type: "concept-contradiction"
node_id: "L0-keep-ctr006"
source_channel: "rollout"
title: "CTR-009 — The provenance marker has no owner under the parent's state-ownership rule"
aliases: ["L0-keep-ctr006"]
part_of: ["L0-keep"]
is_a: ["contradiction"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 3171
tags: ["contradiction","open","scope-overlap","target:L0","L0-keep","resolved"]
closed_at: 2026-09-21
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-keep-ctr006
---

# CTR-009 — The provenance marker has no owner under the parent's state-ownership rule

> **Renumbered at reduce (analysis_version 2).** This was filed as "CTR-006", which `L0-once` had independently used for a different contradiction. L0 assigned the canonical number **CTR-009**; see `concept-contradiction` at `L0` for the full register.

- **Status:** `open` · **Category:** scope overlap · **Target node:** `L0` (parent decomposition) · **Severity:** Medium
- **Raised by:** `L0-keep` · **Depends on:** Q-006 (if answered "no", this contradiction dissolves)

## The disagreement

| Where | Statement |
|---|---|
| `L0` decomposition plan, *Ownership rules* | *"`L0-once` owns the craft flag; `L0-keep` owns the item ledger. **These are different pieces of state and neither may write the other's.**"* |
| CTR-005, suggested resolution | Provenance marker *"set at craft time and absent on `/give`"* — i.e. written inside the **craft-completion handler**, which is `L0-once`'s code (ADR-005). |
| `L0-keep-ent2`, `L0-keep-r003` | The marker is the input to every retention decision; its semantics, durability requirements and lifecycle are **`L0-keep`'s** concern. |

The provenance marker is a **third** piece of state. It is not the craft flag and not the retention ledger. It must be *written* by `L0-once` at the only moment its value is knowable, and it is *read and depended upon* exclusively by `L0-keep`. The parent's rule is stated as a clean two-way partition and has no slot for it.

## Why this is a real conflict, not a nitpick

The rule exists to prevent exactly the failure it now forces: a child reaching into state it does not own. As written, either

- **`L0-once` writes it** → `L0-once` is writing state whose invariants, durability requirements (ASM-015) and meaning are defined by `L0-keep`, with no contract between them; or
- **`L0-keep` writes it** → `L0-keep` must hook the craft-completion event, which is `L0-once`'s event and the place ADR-005 puts the flag write. Two children then mutate state inside one handler, which is the concrete form of the overlap the rule forbids.

Left unaddressed, this surfaces at integration as a merge conflict in the craft handler, or — worse — as a marker that one child assumes is written and the other never writes. That failure is **silent**: unmarked swords simply stop being retained (see ASM-015's impact note).

## Suggested resolution

Amend the parent's ownership rules to name the marker as a **third piece of durable state with a declared producer/consumer split**, rather than extending either child's ownership:

- **Producer:** `L0-once`, at craft completion, writing a value whose *shape and durability contract* `L0-keep` specifies (`L0-keep-ent2`).
- **Consumer:** `L0-keep`, exclusively.
- **Contract:** a single shared constant/helper module owned by `L0-keep` and called by `L0-once` — so the write site is `L0-once`'s, but the definition is not duplicated.

This mirrors how the parent already handles localization (*"ownership is central, use is distributed"* — `L0-item` owns the catalogue, siblings consume keys), so the pattern is established rather than new.

**Not escalating.** This refines the parent's ownership rules; it does not invalidate the six-child decomposition. Either child can proceed on its own slice today. But it must be settled **before** the craft handler is written, since that is where the two children meet.
