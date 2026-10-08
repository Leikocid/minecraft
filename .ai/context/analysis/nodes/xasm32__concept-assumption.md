---
type: "concept-assumption"
node_id: "L0-xasm32"
source_channel: "rollout"
analysis_version: 8
level: 1
title: "ASM-L0-32 · The Storm Blade's def"
aliases: ["L0-xasm32"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 1413
tags: ["v8", "storm-blade", "CAN_ASSUME"]
---
---
title: "ASM-L0-32 · Def #6 uses key prefix `sb`, a 600-tick cooldown, and needs no framework change"
aliases: ["L0-xasm32", "Storm Blade def"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-lgnd", "L0-adr-sckp"]
see_also: ["stormbladeelytratotemspecruen-part-1"]
governs_files: ["src/legendary/registry.ts"]
---
# ASM-L0-32 · The Storm Blade's def

**Assumption (CAN_ASSUME):** def #6 is
`{ itemId: "andrew:storm_blade", keyPrefix: "sb", abilityKey: "storm_blade", nameKey: "item.andrew:storm_blade", cooldownTicks: 600, craftTokenId: "andrew:storm_blade_crafted" }`.

`sb` collides with none of the existing prefixes `ws`, `sc`, `oc`, `dk` and `sk` (`registry.ts`). Read with `L0-adr-sckp`, which forbids reusing a prefix.

The recipe's refund on a blocked second craft gives the inputs back (2 lightning rods, 2 wind charges, 1 diamond sword), the same way the crossbow's does.

Every other legendary rule is def-driven at 1.8.0:
- the craft gate;
- retention, recovery and the Void return to the last holder;
- protection, the magnet, the HUD and hand priority.

The passive melee lives in `src/storm/`, subscribed to `entityHitEntity`. It is **not** a framework hook.

**Impact if wrong:** if any framework file has to change beyond `registry.ts` (adding the def) and `main.ts` (the subscription), `strm` must raise a new L0 contradiction before it builds, as the v7 invariant required.
