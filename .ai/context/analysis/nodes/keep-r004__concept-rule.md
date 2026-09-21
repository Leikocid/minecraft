---
type: "concept-rule"
node_id: "L0-keep-r004"
source_channel: "rollout"
title: "Rule K-R4 — Death never touches the one-per-world craft flag"
aliases: ["L0-keep-r004"]
part_of: ["L0-keep"]
is_a: ["rule"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1623
tags: ["rule","invariant","boundary","craft-flag","L0-keep"]
---

# Rule K-R4 — Death never touches the one-per-world craft flag

**Links** — `part_of: ["L0-keep"]` · `is_a: ["rule"]` · `relates_to: ["L0-once", "L0-keep-ac05"]` · `spec: ["§12"]` · `governed_by: ["C-7"]`

**Rule.** No path in this component may read-modify-write, clear, or otherwise affect the persistent one-per-world craft flag owned by `L0-once`. Death, respawn, disconnect, rejoin and restart leave it exactly as it was.

**Source.** §12: *«Смерть во время cooldown не должна создавать копию меча или сбрасывать persistent one-per-world flag.»* The parent decomposition assigns this invariant to `L0-keep` explicitly: *"`L0-once` owns the craft flag; `L0-keep` owns the item ledger… §12's invariant is the one that connects them and belongs to `L0-keep` as a constraint it must respect."*

**Rationale.** The flag counts **craft events**, not swords in existence (see `concept-boundary`). Losing a sword to death does not un-spend the world's one craft, so a reset would hand out a second legitimate craft — a dup path that arrives through the craft gate rather than the item, and one C-7 covers just as absolutely.

The inverse is equally forbidden: retention must not *set* the flag either. Restoring a sword is not a craft.

**Practical form.** The ledger and the flag are separate keys in durable storage with no code path between them. Reviewability is the point — a reviewer should be able to grep this component and find zero references to the craft-flag key.

**Testable as.** `L0-keep-ac05`.

**Violation looks like.** A player crafts the Web Sword, dies, and the world then permits a second survival craft.
