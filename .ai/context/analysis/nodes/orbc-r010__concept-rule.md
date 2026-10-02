---
type: "concept-rule"
node_id: "L0-orbc-r010"
source_channel: "rollout"
analysis_version: 5
title: "Rule · After firing, the attack does not depend on its owner and stays in its dimension"
aliases: ["L0-orbc-r010"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1051
tags: ["is_a:rule", "relates_to:L0-orbc-p003", "relates_to:L0-ring", "lifecycle"]
level: 2
---
# Rule · After firing, the attack does not depend on its owner and stays in its dimension

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-p003", "L0-ring", "L0-orbc-ac18"]`

Once charges are spawned, none of these cancels, pauses, redirects or accelerates them:
- the owner's death;
- a hand or slot change, or dropping or giving away the Cannon;
- the owner logging out;
- the owner changing dimension.

**Details.**
- Charges only ever exist in the `dimensionId` of the attack. They are moved with `teleport` inside that dimension and are never re-spawned elsewhere.
- The attack keeps `ownerId` as a string. The effects may *look up* the owner (for example `ring`'s explosion `source` and self-damage), but they must accept that the owner is absent. With no owner, the blast still happens, with no source.
- It is not required that the owner's own position keeps the area loaded. If the area stays loaded because of another player, the attack completes. If it does not, `r011` applies.

Source: Orbital §11 and AC-18.
