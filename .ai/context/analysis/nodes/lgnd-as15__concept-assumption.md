---
type: "concept-assumption"
node_id: "L0-lgnd-as15"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-lgnd-as15"]
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 580
size_chars: 1924
tags: ["ufo", "probe-needed"]
level: 2
---
---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r016", "L0-lgnd-ad13", "L0-magn", "L0-lgnd-ad12"]
---
**ASM-lgnd-15: Entity holders (chest/hopper minecarts, armour stands) need no recovery watching while the magnet moves them. Their legendary contents can be read by `magn` at selection time.**

What this assumes (measure on BDS 1.26.51.1):
1. **The minecart's container is readable.** `minecraft:inventory` on `chest_minecart` and `hopper_minecart` gives a readable container, so `isLegendaryStack` can be checked per slot.
2. **The armour-stand hand is readable through `hasitem`.** Mobs have no `equippable` in 2.10.0 (UFO §4, U4b), so an armour-stand hand is checked with `hasitem={item=andrew:<id>,location=slot.weapon.mainhand}` (and offhand). That is one item per query: 6 ids × 2 slots per candidate stand, once at selection.
3. **Recovery tracks only item entities and player departures.** It never tracks a stack inside an entity, so a teleported minecart or stand cannot break a watch: there is none.
4. **Destruction spills.** If such an entity is later destroyed (lava, cactus, the Void), its contents spill as `minecraft:item` entities that `entitySpawn` watches. Fire and lava are covered by `fire_resistant`; the Void and cactus by a return.

**Impact if wrong.**
- If (1) fails, `magn` must skip every non-empty chest or hopper minecart.
- If (2) is too costly, it must skip every armour stand holding anything in a hand.
- If (4) fails (a minecart destroyed in the Void drops nothing), a legendary stored in a minecart is lost with no return. That is an as-built gap regardless of the magnet, and `r016` item 3 is what keeps the magnet from making it likelier.
- Separately, a hopper minecart picking up a ground legendary is classified as lost, because `whereIs` searches **block** containers only. That creates a stale copy (`cx02` a). It is harmless, but it is a log-visible return.
