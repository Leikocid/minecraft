---
type: "concept-architecture-decision"
node_id: "L0-trap-ad14"
source_channel: "rollout"
title: "ADR-014 — One ray, one reach bound, three target forms collapsed to one cell"
aliases: ["L0-trap-ad14"]
part_of: ["L0-trap"]
is_a: ["architecture-decision"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2269
tags: ["adr","architecture-decision","targeting","L0-trap"]
---

# ADR-014 — One ray, one reach bound, three target forms collapsed to one cell

**Links** — `part_of: ["L0-trap"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-trap-ptgt", "L0-trap-etgt", "L0-trap-r002", "L0-trap-r003"]`

## Context

§5 admits three target forms — a point on a block, a player/living entity, or a point immediately next to the owner — all *«если она находится в допустимой reach-зоне»*. §12 requires the ray to stop at the first solid block. C-3 requires server computation. Downstream, `L0-trap-pfil` needs exactly one centre cell.

## Decision

Cast **a single ray** from the player's eye along the server-read view vector, length = the reach bound, stopping at the first solid block. Resolve in a fixed precedence — **entity hit → block hit → near-point fallback** — and collapse whichever matched into one centre cell plus a `kind` tag. Apply the reach bound **twice**: once as the ray length, once as a final bound-check on the resolved point, both from the same named constant.

## Rejected alternatives

- **Three separate resolution passes (one per target form)** — three chances to disagree about reach, and an ordering question at every call site. One ray with a precedence order answers it once.
- **Nearest-valid-target search within a radius** — reintroduces the proximity scan §11 prohibits, and makes the weapon aim for the player.
- **Trusting a client-reported hit result** — violates C-3 outright; two clients could diverge.
- **Failing when the ray hits a wall** — would make the weapon useless in exactly the close-quarters situation it is for. §12 says *use the reachable point*, not *give up* (R-003).
- **Separate reach values for ray length and validation** — invites a target that the ray finds but the check rejects, or worse the reverse. One constant, checked twice.

## Consequences

Reach becomes a single tunable, which matters because its value is unresolved (ASM-017) and Creative-mode reach may differ. The `kind` and `distance` fields on `TargetResolution` exist purely so GameTests can assert *why* a target resolved — without them AC-02 and AC-06 can only observe coincidences. The precedence order (entity before block) is itself an assumption when both are hit at similar distance; recorded in ASM-019.
