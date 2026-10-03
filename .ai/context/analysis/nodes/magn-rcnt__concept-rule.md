---
type: "concept-rule"
node_id: "L0-magn-rcnt"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-rcnt"]
is_a: ["rule"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1184
tags: ["is_a:rule", "containers", "relates_to:L0-magn-adhp", "relates_to:L0-magn-rdup", "see_also:ufomagnetspecv1ruen-part-2"]
level: 2
---
**Rule (UFO §5 Containers, U5, AC-9).** From a placed container, only stacks whose typeId is in IRON_ITEMS are removed. Each one becomes one element. Everything else is untouched: non-iron stacks, legendaries, shulker-box *items* held inside, and the container block itself.

**Containers in scope:**
- chest, double chest, trapped chest, barrel;
- **hopper** holding anything; an empty one is a built block (`L0-magn-adhp`);
- furnace, blast furnace, smoker;
- dispenser, dropper, brewing stand;
- every placed shulker box.

**Out of scope:**
- The crafter, which has no inventory in the API.
- Contents of bundles or nested shulker items.

**Double chest.**
- Either half exposes the 54-slot paired container (U5).
- The pair is visited **once**, keyed by its canonical half (the lower x, then the lower z). Slots therefore cannot be listed twice, and one stack cannot take two of the 10 places.

**Minecarts.** A chest or hopper minecart is not a container source. It is pulled whole, as a class 3 entity, with its contents (but see `L0-magn-rleg`).

**Order.** Containers go nearest first; within a container, slots go in index order. Partial extraction is fine: if the limit is reached mid-container, the remaining iron stays.
