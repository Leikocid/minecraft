---
type: "concept-architecture-decision"
node_id: "L0-trdt-adrf"
source_channel: "rollout"
analysis_version: 9
title: "ADR-trdt-adrf · Bucket return and blocked-craft refund (picks the `xasm33` variant)"
aliases: ["L0-trdt-adrf"]
is_a: ["architecture-decision"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 2022
tags: ["above-water-trident", "recipe", "refund", "C-34", "status:proposed"]
level: 2
---
# ADR-trdt-adrf · Bucket return and blocked-craft refund (picks the `xasm33` variant)

**Links.** is_a: architecture-decision. relates_to: L0-xasm33, L0-lgnd, L0-trdt-cx01, L0-trdt-a001.

**Context.**
- The recipe ` G / BTB / G ` uses 2 water buckets.
- If the engine returns their containers as it does for cake (probe P1), a blocked craft leaves the player holding 2 empty buckets.
- `craftgate.refund` adds every `def.refund` stack with `addItem` and drops at the feet on overflow.
- A static refund list of 2 water buckets would leave the player with 2 water buckets plus the 2 returned empties, which breaks C-34 and C-7.

**Decision.** An exchange, not an addition.
- `def.refund` = golden apple ×2 and trident ×1.
- A new optional def field `refundExchange: [["minecraft:bucket", "minecraft:water_bucket", 2]]`.
  - `craftgate.refund` removes up to 2 empty buckets from the inventory and off hand.
  - It then adds exactly as many water buckets as it removed, with overflow dropped at the feet.
  - If none can be found (the player moved them in the same tick), it adds none, and logs the count.
- **If probe P1 shows the engine returns no bucket:** `refundExchange` is unset, `refund` lists 2 water buckets, and a successful craft gets 2 empty buckets from the script (with a protected drop on a full inventory).
- **Full inventory with an engine return:** the probe records where the engine puts the bucket (a drop or the grid). The GameTest asserts the inventory plus nearby `minecraft:item` entities hold exactly 2 buckets after the craft.

**Rejected alternatives.**
- **Refund only the apples and the trident, and keep the returned empties.** It satisfies C-34 but not the "exact refund" of the spec: it silently loses the water.
- **A trident-local refund hook.** It duplicates the craftgate's token detection and settle order, and risks a double refund.

**Consequence.** This touches `craftgate.ts` and the `LegendaryBase` type. It is not a custody hook, but it is still outside `xasm32` (`L0-trdt-cx01`).
