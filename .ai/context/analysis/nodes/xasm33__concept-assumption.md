---
type: "concept-assumption"
node_id: "L0-xasm33"
source_channel: "rollout"
analysis_version: 11
title: "ASM-L0-33 · The trident's def"
aliases: ["L0-xasm33"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 1757
tags: ["v9", "above-water-trident", "CAN_ASSUME"]
level: 1
---
---
title: "ASM-L0-33 · Def #7: `andrew:above_water_trident`, prefix `tr`, a passive def; refund and buckets"
aliases: ["L0-xasm33", "Trident def"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-lgnd", "L0-xasm32", "L0-adr-sckp"]
see_also: ["abovewatertridentspecv1ruen-part-1"]
governs_files: ["src/legendary/registry.ts", "packs/behavior/recipes/"]
---
# ASM-L0-33 · The trident's def

**Assumption (CAN_ASSUME).**
- **Identifier.** The spec's `addon:above_water_trident` is only "suggested". The project namespace wins: `andrew:above_water_trident`, token `andrew:above_water_trident_crafted`, command `andrew:trident`.
- **Key prefix `tr`.** It collides with none of `ws`, `sc`, `oc`, `dk`, `sk`, `sb` (`L0-adr-sckp`).
- **Def shape.** A **`PassiveLegendaryDef`**, like the Sculk Crossbow: no `abilityKey`, cooldown or HUD line. The spec forbids a cooldown, and throw and dash are owned by `src/trident/`, not `resolveActivation`.
- **Buckets.** Bedrock's crafting returns the water buckets' container item (an empty bucket) for a token craft just as for any shaped recipe, the way cake returns buckets. The probe verifies this, including with a full inventory (C-34).
- **Refund on a blocked craft.** 2 golden apples, 1 trident and 2 **water** buckets, **minus** the 2 empty buckets the engine already returned. The refund removes them first; if that fails, it returns only the apples and trident plus 2 water buckets in exchange for the 2 empties. The deep-dive picks the variant.

**Impact if wrong.**
- If the engine does not return buckets for this recipe, the script must give them, and a full inventory needs a protected drop.
- If the refund ignores the empties, every blocked craft mints 2 buckets, which breaks C-7 and C-34.
