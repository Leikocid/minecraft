---
type: "concept-acceptance-criterion"
node_id: "L0-trdt-a002"
source_channel: "rollout"
analysis_version: 9
title: "AC-trdt-002 (bds) · Melee and thrown = vanilla + 2 against armour; one strike"
aliases: ["L0-trdt-a002"]
is_a: ["acceptance-criterion"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 1052
tags: ["above-water-trident", "bds", "damage", "C-29", "C-30-prime"]
level: 2
---
# AC-trdt-002 (bds) · Melee and thrown = vanilla + 2 against armour; one strike

**Links.** relates_to: L0-trdt-r002, L0-trdt-addm, L0-adr-twlt.

- **Melee.** GIVEN a zombie in full iron armour and a sim player with the trident, WHEN one melee hit lands, THEN the `entityHurt` damage equals `afterArmour(vanillaMelee + 2)` ± 0.01, using the P2-measured vanilla value against the same armour.
- **Thrown.** The same check with a thrown hit and `vanillaThrown + 2`.
- **In-window negative control.**
  - A second trident melee hit within 10 ticks that is ≤ the window's last gets no bonus and no strike.
  - A plain `applyDamage(2)` after a landed hit is swallowed, which proves the window is armed.
- **Strike.** For each landed hit:
  - `visualStats()` counts exactly 1 strike;
  - `getEntities({type: "minecraft:lightning_bolt"})` is empty for 40 ticks;
  - no fire block appears within 3 blocks;
  - a pig target stays a pig.
- **Not living.** An armour stand gets no strike and no bonus.
- **Lethal.** A lethal hit on a totem holder pops the totem.
