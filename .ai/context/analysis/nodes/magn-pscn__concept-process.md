---
type: "concept-process"
node_id: "L0-magn-pscn"
source_channel: "rollout"
analysis_version: 5
title: "Magnet-on: scan and select (runs once, synchronously, in the tick of `onPhase(\"magnet\")`)"
aliases: ["L0-magn-pscn"]
is_a: ["process"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 2144
tags: ["is_a:process", "magnet-on", "relates_to:L0-magn-rlim", "relates_to:L0-magn-adsc", "relates_to:L0-magn-adar", "relates_to:L0-xasm16"]
level: 2
---
# Magnet-on: scan and select (runs once, synchronously, in the tick of `onPhase("magnet")`)

1. **Zone.**
   - Cylinder r 50 around `centre`, y from `centre.y − 20` to `hoverY`.
   - Clamp y to the dimension range.
   - The zone is 101 × 101 × ≤ 61.
2. **Class 1, ground items.**
   - `dimension.getEntities({type:"minecraft:item", location: centre, maxDistance: ~80})`.
   - Drop `undefined` entries (C-22), apply the cylinder test, and keep stacks whose typeId is in IRON_ITEMS and that are not legendary (`L0-magn-rleg`).
   - Sort by 3-D distance to `centre`.
3. **Lazy cut.** Stop as soon as 10 candidates are collected; lower classes are not evaluated (`L0-magn-rlim`). This bounds the container reads.
4. **Block scan.** If any slot is still free, run **one** `getBlocks` over the zone box with `includeTypes` = scan types (`L0-magn-eirn`), then filter by the cylinder. Unloaded chunks are handled per `L0-magn-adsc`. The result is bucketed into containers, built blocks and ore.
5. **Class 2, container stacks.**
   - Visit containers nearest first.
   - A double chest is visited once, keyed by its canonical half (`L0-magn-rcnt`).
   - Each slot holding an IRON_ITEMS stack is one candidate, in slot order, until the limit is reached.
6. **Class 3, mobs and minecarts.**
   - Collect iron golems and minecarts through `getEntities` (filtering `undefined`).
   - Add mobs and armour stands carrying the tag `andrew:ufo_iron`, set by the four selector commands (`L0-magn-adar`).
   - Skip holders containing a legendary (`L0-magn-rleg`), and skip players.
   - Sort nearest first.
7. **Class 4, built blocks**, nearest first. A door counts once: both halves map to the lower half's position.
8. **Class 5, ore**, nearest first.
9. **Materialise** the chosen class 2/4/5 candidates (`L0-magn-pext`), assign ring slots 0..n−1, and subscribe the drop exemption (`L0-magn-rexm`).
10. **Measure.** Record the scan time to the cost log (`L0-xasm16`: ≤ 12 ms).

**Failure.** If the scan throws, the magnet still runs with the class 1 and class 3 candidates found so far. The error is logged once, and no partial block mutation is left behind.
