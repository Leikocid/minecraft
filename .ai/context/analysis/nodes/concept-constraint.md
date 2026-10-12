---
type: "concept-constraint"
node_id: "L0"
source_channel: "rollout"
analysis_version: 10
title: "Global Constraints (v10)"
aliases: ["L0"]
is_a: ["constraint"]
priority: 640
size_chars: 4079
tags: ["v10", "underwater-bow", "enchanting"]
level: 0
---
---
title: "Global Constraints (v10)"
aliases: ["L0-constraint", "Constraints"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1", "underwaterbowmacefireworksenchantingspecv2ruen-part-2", "constraints"]
---
# Global Constraints (v10)

**Carried unchanged:** C-1 … C-29, C-30′, C-31 … C-37, C-5a′, C-5d, C-5e, C-5f, C-7″, C-12′, C-20⁗, C-20⁵. All of them bind v10. The ones it leans on most:
- C-2: stable 2.10.0, no Experiments. The spec repeats this: "без экспериментов, если возможно".
- C-7: no duplication. It covers the bow craft, the bucket return and the new recipes.
- C-16: the closest stable equivalent, with the limitation *reported*.
- C-29: exact, non-stacking bonus damage. It covers the 14 HP hit.
- C-30′: spectacle deals no damage. It covers the bow's lightning.
- C-34: exact bucket return.
- C-37: built-in enchantment exclusions. These still win over the table.

| ID | Constraint | Source |
|---|---|---|
| C-38 | *(new)* **Native systems: verify, then claim.** A requirement that changes a native engine system (the enchanting table, its UI or algorithm) needs a recorded probe on 1.26.51 before any build. If the engine cannot be intercepted, the release notes and the acceptance sheet say so in plain words. A custom block, UI, trade or exchange substitute is built **only after Andrey's written approval** (`xq11`). A partial hook (for example, rewriting the result after the fact) counts as an alternative and also needs approval. | spec v2 §4 "Техническое ограничение" |
| C-39 | *(new)* **Probabilities are proven statistically.** Every stated chance (20 % rare, 70/40/20 levels, 0 % curses) lives in a pure module with an injectable RNG. Each is tested on ≥ 1000 samples, with a tolerance of ± 3 σ of the binomial, and 0 occurrences for the "never" rates. The rates are tested with a fixed seed *and* unseeded. A unit run is `in_process` and cannot close an e2e criterion, so the engine hook needs its own `bds` or `ipad` proof. | spec v2 §4, §5 |
| C-40 | *(new)* **Additive vanilla recipes.** A recipe whose output is a vanilla item yields the real vanilla id (no `andrew:` look-alike), with vanilla stats, durability and enchantability. Crafting it is unlimited. Every vanilla recipe for that item keeps working. Its shape must not collide with any vanilla or add-on recipe. | spec v2 §2, §3, §5 |
| C-41 | *(new)* **Armed abilities are spent only by success.** An armed charge is consumed, and its cooldown started, only when a qualifying hit lands on a living entity and deals damage. A miss, a block hit, a shield block, a non-living target, or a despawned or removed arrow keeps the charge (`xasm38`). The armed state survives logout and restart. The HUD shows three states: ready, armed, and cooldown with the seconds left. | spec v2 §1 |
| C-42 | *(new)* **Liquid-neutral projectiles.** A projectile declared liquid-neutral keeps its air velocity and gravity in water and lava, within ± 10 % of the air path over the same distance. It is not destroyed by lava contact before its hit. | spec v2 §1, §5 |
| C-43 | *(new)* **Persistent fire is scripted, bounded and block-safe.** A "cannot be extinguished" burn lasts exactly its stated duration. It deals vanilla burning damage (1 HP/s, the `fireTick` cause, marked as scripted) whether or not the target is in water. Fire-immune targets take none. It places no fire block, and it ends early only on death or removal. | spec v2 §1 |
| C-20⁶ | *(extended)* v10 acceptance needs:<br>• both recipes for the Mace and the Rocket, with the output id asserted vanilla;<br>• the bow recipe with 2 buckets back and a full inventory;<br>• arrow speed in air vs water vs lava, measured by the same SimulatedPlayer at the same distance;<br>• a normal hit's fire put out by water, against Super Fire persisting underwater for 5 s;<br>• a charged miss with no cooldown, then a hit with a 30 s cooldown;<br>• a restart that keeps the craft flag, recovery and the armed state;<br>• ≥ 1000-roll statistics for the roller. | spec v2 §5 |
