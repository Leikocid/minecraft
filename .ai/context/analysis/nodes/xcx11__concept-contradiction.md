---
type: "concept-contradiction"
node_id: "L0-xcx11"
source_channel: "rollout"
analysis_version: 3
title: "CX-L0-11 · Void return target: Orbital §5 \\"last owner\\" vs as-built crafter"
aliases: ["L0-xcx11"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0","L0-lgnd","L0-xq3","L0-adr-hold","L0-lgnd-cx09"]
see_also: ["orbitalcannonspecv1ruen-part-1"]
priority: 540
size_chars: 926
tags: ["title:CX-L0-11 · Void return target: Orbital §5 \"last owner\" vs as-built crafter","alias:L0-xcx11","is_a:contradiction","relates_to:L0","relates_to:L0-lgnd","relates_to:L0-xq3","relates_to:L0-adr-hold","relates_to:L0-lgnd-cx09","see_also:orbitalcannonspecv1ruen-part-1","category:source-vs-code","severity:medium","status:open","target:L0-lgnd","resolved"]
level: 1
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx11
---

# CX-L0-11 · Void return target: Orbital §5 "last owner" vs as-built crafter

**Spec (Orbital §5).**
- The weapon is not bound to its creator and can be given to others.
- A legendary that falls into the Void returns to its **last owner**. If that player is offline, it is delivered on their next join.

**Code.** `recovery.ts` returns the item to the mark's `owner`, which is the crafter or the admin. The mark has no holder field (`lgnd` component, `state.ts`). `L0-adr-wpn2` kept the as-built owner pending the client's answer to `L0-xq3`.

**Why it matters.** Consider player A crafting the weapon and giving it to B, and B then losing it in the Void. A gets it back, which contradicts the newest spec. It also creates a trading exploit: B can "return" the weapon to A for free.

**Proposed.** `L0-adr-hold` returns to the last holder. It needs client confirmation because the older weapon specs were read the other way.
