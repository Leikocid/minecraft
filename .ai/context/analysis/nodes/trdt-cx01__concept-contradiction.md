---
type: "concept-contradiction"
node_id: "L0-trdt-cx01"
source_channel: "rollout"
analysis_version: 9
level: 2
title: "CX-trdt-01 · An exact bucket refund needs a craftgate change outside `xasm32` and `xcx30`"
aliases: ["L0-trdt-cx01"]
is_a: ["contradiction"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 1205
tags: ["above-water-trident","status:resolved","framework-invariant","C-34","target:L0","resolved"]
closed_at: 2026-10-11
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-trdt-cx01
---

---
title: "CX-trdt-01 · An exact bucket refund needs a craftgate change outside xasm32 and xcx30"
aliases: ["L0-trdt-cx01"]
is_a: ["contradiction"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt", "L0-lgnd", "L0-xasm32", "L0-xasm33", "L0-xcx30", "L0-trdt-adrf", "L0-adr-trlg"]
target_node: "L0"
status: resolved
---
# CX-trdt-01 · An exact bucket refund needs a craftgate change outside `xasm32` and `xcx30`

**Status: resolved at the v9 reduce by `L0-adr-trlg` §2–3.** The generic, optional `refundExchange` def field is accepted as a deliberate widening of `xasm32`. It is inert for defs 1–6 and added only if probe P1 shows that the engine returns the buckets.

**Statement A (`xasm32`, `xcx30`):** a new legendary adds one registry entry plus its subscriptions; the trident may add at most a delivery export plus a scan exclusion.

**Statement B (C-34, `xasm33`):** a blocked craft's refund never yields both the filled and the empty bucket. Both refund variants need the 2 returned empties removed or exchanged.

**Evidence** (as read during reduce at v9): `src/legendary/craftgate.ts` `refund()` (lines 185–196) only adds `def.refund` stacks through `returnToPlayer` → `addItem`. It cannot take items.
