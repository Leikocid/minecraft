---
type: "concept-client-question"
node_id: "L0-trap-cqst"
source_channel: "rollout"
title: "Client Questions — Active Ability"
aliases: ["L0-trap-cqst"]
part_of: ["L0-trap"]
is_a: ["client-question"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 3882
tags: ["client-question","open-question","L0-trap"]
---

# Client Questions — Active Ability

**Links** — `part_of: ["L0-trap"]` · `is_a: ["client-question"]` · `relates_to: ["L0"]`

Q-011 and Q-013 are **inherited from L0** and refined here with implementation detail, per the decomposition plan's reduce pass 3 — refined and handed back, **not** self-resolved. Q-017 is new.

> **Renumbered at reduce (analysis_version 2).** The new question below was filed as "Q-014", a number `L0-once` and `L0-keep` also used for different questions. L0 assigned **Q-017**; see `concept-client-question` at `L0`.

---

## Q-011 (refined) — Where exactly does the cube sit, and what does it centre on?

**Blocks:** `L0-trap` implementation · **Source:** ASM-008, plus ASM-018 and ASM-019 raised here · **Cost of a late answer:** low to fix, but **§13 will not catch a wrong answer** — the test says *«приблизительно полный»*.

Four sub-questions, ideally answered together:

1. **Geometry.** Confirm the cube is the centre cell ±1 on each axis, **including** the centre cell itself (27 cells, ASM-008)?
2. **Block targets.** When the ray hits a block face, does the cube centre on **the hit block** or on **the adjacent air cell at that face**? These differ by one and produce visibly different traps — centring on the block buries a third of the cube in terrain when aiming at the ground.
3. **Entity targets** (ASM-019). Centre on the entity's **feet cell**? And when the ray hits an entity and a block at similar distance, does the entity win?
4. **Open-air aim** (ASM-018). Aiming at nothing solid within reach — does the ability **succeed** at the ray's end point, or fail? §5's *«точка непосредственно рядом с владельцем»* implies succeed; §5's *«Если корректной цели нет»* could imply fail.

**Plus the balance question the geometry implies:** targeting the ground at your own feet entombs the caster. Is that **intended** (escape denial, a real cost to careless use) or a **bug** to guard against?

**Recommended answers:** (1) yes, 27 cells including centre; (2) the adjacent air cell at the hit face; (3) feet cell, entity wins ties; (4) succeed at the ray end; self-entombment is a feature.

---

## Q-013 (refined) — Confirm the closed protected-block deny-list and the posture

**Blocks:** `L0-trap` tuning, not structure · **Source:** ASM-007 · **Cost of a late answer:** low to change, but failures are **unrecoverable player data loss**.

Proposed working list — please confirm, add or remove:

- **Entities** — any cell occupied by a living entity is skipped (§6, not negotiable).
- **Block entities** — chest, trapped chest, ender chest, barrel, shulker box, hopper, dropper, dispenser, furnace/blast furnace/smoker, brewing stand, beacon, lectern, jukebox, sign, banner, spawner, campfire, enchanting table, anvil, bed.
- **Indestructible / special** — bedrock, barrier, command block, structure block, jigsaw, end portal frame, end portal, nether portal, light block.
- **Everything else not positively recognised as ordinary and replaceable** ⇒ skipped by default.

**And confirm the posture:** *skip any cell whose safety is uncertain, accepting a weaker trap over destroyed storage.* This is the load-bearing half — the list can be wrong and recoverable, the posture cannot.

---

## Q-017 (new) — What happens when all 27 cells are skipped?

**Blocks:** `L0-trap` success predicate, and a possible `.lang` key in `L0-item` · **Source:** CTR-008 · **Cost of a late answer:** low, but it ships unexamined — no §13 test covers it.

A valid, in-reach target whose entire volume is protected or unloaded (aiming at the Nether bedrock floor, or into a wall of chests). §6's partial-skip logic says success; §8's *«после успешного создания ловушки»* says no trap was created.

**Question:** rank — (a) zero cells = **failure**, cooldown not consumed; (b) zero cells = **success**, cooldown consumed like any partial cube; (c) failure **with a localized message** explaining there is no valid space.

**Recommended answer:** (a). (c) is also fine but needs a translate key decided before `L0-item` closes its catalogue, so it cannot be left open indefinitely.
