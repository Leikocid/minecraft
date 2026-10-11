---
type: "concept-rule"
node_id: "L0-trdt-r001"
source_channel: "rollout"
analysis_version: 9
title: "R-trdt-001 · One weapon, one place; inserted exactly once"
aliases: ["L0-trdt-r001"]
is_a: ["rule"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 1192
tags: ["above-water-trident", "C-33", "C-7", "custody"]
level: 2
---
# R-trdt-001 · One weapon, one place; inserted exactly once

**Links.** is_a: rule. relates_to: L0-trdt-adcl, L0-trdt-ecus, L0-trdt-pthr, L0-trdt-pfbk.

**Rule.**
- At every tick, the marked trident instance is in exactly one of these places:
  - a slot;
  - a dropped `minecraft:item`;
  - custody (a record plus at most one custody entity);
  - owed or pending in lgnd.
- A held copy and a custody record for the same instance never coexist **as live copies**. A crash mid-throw may briefly leave a held copy beside a record. That copy becomes stale at delivery and is voided.
- The return inserts at most once per `throwId`. The record's deletion happens in the same synchronous block as the insert or the delivery.
- A non-live mark is never inserted or delivered.

**Rationale.** C-33 and C-7. The `lgnd` generation ledger is the arbiter, so any second copy becomes stale rather than live.

**Check.**
- A per-tick GameTest observer counts live marked copies across the thrower's inventory, the off hand, item entities and the owed and pending lists, plus custody records, through a full throw → hit → return cycle and through each fallback.
- The assertion is count == 1 at every tick.
