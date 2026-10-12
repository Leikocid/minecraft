---
type: "concept-architecture-decision"
node_id: "L0-adr-trlg"
source_channel: "rollout"
analysis_version: 10
level: 1
title: "ADR-L0-trlg · The trident widens `lgnd` by two generic hooks"
aliases: ["L0-adr-trlg"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 3444
tags: ["v9", "above-water-trident", "framework-invariant", "reduce", "status:accepted", "settles:xcx30", "settles:trdt-cx01"]
---
---
title: "ADR-L0-trlg · The trident widens lgnd by two generic hooks: an exported delivery and a refund exchange"
aliases: ["L0-adr-trlg", "Trident lgnd widening"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-lgnd", "L0-magn", "L0-xcx30", "L0-xasm32", "L0-xasm33", "L0-trdt-adcl", "L0-trdt-adrf", "L0-trdt-cx01", "L0-adr-twth"]
requires: ["L0-lgnd"]
see_also: ["L0-trdt-ecus", "L0-trdt-pfbk", "L0-trdt-cons"]
governs_files: ["src/legendary/recovery.ts", "src/legendary/craftgate.ts", "src/legendary/registry.ts"]
---
# ADR-L0-trlg · The trident widens `lgnd` by two generic hooks

**Status:** accepted at the v9 reduce. It settles `L0-xcx30` and `L0-trdt-cx01`.

**Context.**
- `xasm32` (v7/v8) says a new legendary adds one `registry.ts` entry plus its `main.ts` subscriptions. Any other framework hook needs an L0 decision.
- `xcx30` allowed the trident at most "a delivery export plus a scan exclusion". More than that would mean re-running `lgnd` at v10.
- `L0-trdt-adcl` lists the touch points T1–T7. Only T2 changes framework code: `recovery.ts`'s private `lost()` is exported as `deliverToLastHolder`, with its body unchanged. **No scan exclusion is needed**, because `watch()`, retention and the magnet already skip entities that are not `minecraft:item` and have no inventory.
- Outside custody, `L0-trdt-adrf` needs the craftgate to *take* the 2 empty buckets the engine returns before it refunds 2 water buckets (C-34, C-7). As read during reduce at v9, `craftgate.ts` `refund()` (lines 185–196) only adds stacks (`returnToPlayer` → `addItem`), and `recovery.ts:506` holds `lost()` as a private function.

**Decision.**
1. **Accept T2.** Export `lost` as `deliverToLastHolder`. Its signature stays the existing `({def, mark}, how)`; `adcl`'s `(def, mark, how)` is notation, not a new shape. This is within `xcx30`'s allowance, so **`lgnd` is not re-run.**
2. **Accept an optional `refundExchange` field on the def base type**, handled inside `craftgate.refund`.
   - It is generic: `[fromItem, toItem, count][]`. It removes up to `count` of `fromItem` from the inventory and off hand, then adds that many of `toItem`.
   - It is unset, and therefore inert, for defs 1–6.
   - **It is conditional on probe P1.** If the engine returns no bucket, the field is not added, `def.refund` lists the water buckets, and `xasm32` is widened by T2 only.
3. **`xasm32` is restated:** a new def adds a registry entry, its subscriptions, and at most the generic hooks accepted by an L0 ADR. Today those are `deliverToLastHolder` and `refundExchange`. A third hook needs a new L0 contradiction.
4. **Proof obligation.** Any change to `recovery.ts` or `craftgate.ts` puts the full `lgnd` scenario set (with def #7) and the magnet's legendary scenarios into the merge gate. The T3–T6 "no code" seams each need the named GameTest from `adcl`; they are not assumed.

**Rejected alternatives.**
- **Re-running `lgnd` at v10.** Both hooks are small and generic, and the existing `lgnd` scenarios cover them. A re-run adds no knowledge.
- **A trident-local refund hook.** It would duplicate the craftgate's token detection and settle order, and risk a double refund (`adrf`).
- **A "custody" place inside `lgnd`.** It needs new scan hooks in recovery, retention and magnet (`adcl`, rejected).

**Consequences.**
- `L0-xcx30` and `L0-trdt-cx01` are resolved.
- The `lgnd` README must document both exports as framework API.
