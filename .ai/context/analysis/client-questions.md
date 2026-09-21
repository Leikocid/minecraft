---
title: Client Questions
type: analysis
generated_at: "2026-09-21T21:24:41.668Z"
source_channel: rollout
node_id: rollout-client-questions
aliases: ["rollout-client-questions","client-questions"]
is_a: ["rollout","client-questions"]
relates_to: ["L0","L0-keep-q014","L0-once","L0-trap-cqst"]
priority: 510
---

# Client Questions (MUST_ASK)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.
>
> Заполните секцию **Answer** по каждому вопросу — аналитик использует ответы на следующей итерации.

# Client Questions

**Links** — `title: Client Questions` · `aliases: ["L0-client-question", "Client Questions"]` · `part_of: ["L0"]` · `is_a: ["client-question"]` · `relates_to: ["L0-item", "L0-once", "L0-keep", "L0-trap", "L0-cool", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `supersedes: ["L0"]`

Q-001…Q-005 were **answered by decisions on 2026-09-20** (iPad version, namespace, TypeScript, no Windows PC, enchant-without-durability method). Q-006…Q-013 were raised at decompose. Q-014…Q-017 are new from the children.

## Canonical numbering — one collision repaired at reduce

Three children independently filed a new question as "Q-014". Repaired in place; the child artifacts carry a renumbering note.

| Filed as | Raised by | Canonical | Subject |
|---|---|---|---|
| Q-014 | `L0-once` | **Q-014** (kept) | Destroyed sword — can another be crafted? |
| Q-015 | `L0-once` | **Q-015** | Which game modes do the PvP maps run in? |
| Q-014 | `L0-keep` | **Q-016** | Is the sword genuinely un-lootable in PvP? |
| Q-014 | `L0-trap` | **Q-017** | What happens when all 27 cells are skipped? |

## Ask these four first

Ordered by rework cost, not by severity. The first is in a class of its own.

| # | Question | Blocks | Late-answer cost |
|---|---|---|---|
| **Q-006** | May a sword instance carry a provenance marker? | `L0-keep`, `L0-once`, and CTR-006's answer | **High — four owners** |
| **Q-007** | Does enchantable-without-durability actually work on 1.26.51? | `L0-item`, and the *shipped pickaxe* | High — can invalidate §1 |
| **Q-014** | If the world's only sword is destroyed, can another be crafted? | `L0-once` (CTR-006) | Medium |
| **Q-012** | How is the two-player DoD test actually run? | `L0-qatg` (release gate) | Medium — stalls at the end |

---

## Q-006 — Can a Web Sword instance carry a provenance marker? `BLOCKER`

**Blocks:** `L0-keep` (implementation — do not start), `L0-once` (craft handler), CTR-006's resolution, `L0-item`'s catalogue freeze · **Source:** CTR-005 · **Cost of a late answer:** high.

Death retention must return *the owner's* sword, while Creative/`/give` copies are explicitly allowed to exist in unlimited numbers. With no way to tell instances apart, "no duplication" and "always return it to the owner" cannot both hold — all three readings break something the spec states.

**Question:** may Web Sword items carry a durable per-instance marker, set at survival craft and absent on `/give`, so death retention applies only to the survival-crafted sword?

**Recommended answer: yes.** **If no**, §14's "no known dup path" must be narrowed in writing to exclude admin copies, §4 rewritten to protect only the crafted instance, and two of `L0-keep`'s acceptance criteria change meaning.

> **Reduce note — why this one is different.** It was filed as a `L0-keep` blocker. Seeing all six children at once, it is the project's keystone: it determines `L0-keep`'s ledger shape, it is *written* inside `L0-once`'s craft handler (ADR-016), it supplies the only bounded answer to CTR-006, and it decides whether `L0-item` needs retention keys. **One answer unblocks four components.** Nothing else in this list is worth asking before it.

---

## Q-007 — Does the enchantable-without-durability combination actually work? `BLOCKER`

**Blocks:** `L0-item` · **Source:** ASM-005 (carried from v1's ASM-004) · **Cost of a late answer:** high — it can invalidate §1 and two acceptance tests.

The **shipped pickaxe already encodes this hypothesis** (`minecraft:enchantable`, no `minecraft:durability`) and Stage 1 decided to verify it empirically on the iPad — but the outcome is recorded nowhere this analysis can read. The sword repeats the identical shape with `slot: "sword"`.

**Question:** was this confirmed in Stage 1 on Bedrock 1.26.51 — does the pickaxe actually accept enchantments at a table or anvil? If it has not been tested, test it before building the sword. It costs minutes, and a negative answer invalidates a clause in §1 of a spec that is otherwise ready to build.

---

## Q-008 — If a blocked second craft cannot refund ingredients, is consuming them acceptable?

**Blocks:** `L0-once` acceptance criteria, and `L0-item`'s catalogue freeze (ADR-019) · **Source:** CTR-003, ASM-011 · **Cost:** medium.

§3 asks for blocking *«без потери ингредиентов»* but hedges with *«насколько это позволяет стабильный API»*, and no acceptance test covers preservation. A player could lose a Diamond Sword per attempt and the implementation would still pass §13 and §14.

**Question:** rank the fallbacks — (a) detect and refund, (b) block and consume **with a localized explanatory message**, (c) refund is mandatory and the feature waits until achievable.

**Recommended answer:** (a) if feasible, else (b). A player must at minimum be *told* why the craft failed. Note that (b) adds a `.lang` key, which is why this also gates ADR-019.

---

## Q-009 — Does the 30-second cooldown survive logout and rejoin?

**Blocks:** `L0-cool` · **Source:** CTR-004 · **Cost:** medium — it changes where cooldown state lives.

§12 defers this to an *«общая система cooldown проекта»* that has no specification anywhere. As written the requirement is not actionable, yet it is directly testable and player-visible.

**Recommended answer: persist it.** A resetting cooldown is an obvious logout-abuse path and C-7 already establishes that reconnecting must not confer an advantage. `L0-cool` has **provisionally implemented "persist"** (player-scoped dynamic property) — confirm before implementation, since reversing it relocates the state.

---

## Q-010 — Is §8's main-hand / off-hand priority rule in scope for v1?

**Blocks:** `L0-cool` scope · **Source:** CTR-004 · **Cost:** low if the seam is kept.

§8 opens with *«Если в будущем…»* but states a definite rule. It cannot be implemented or tested with one legendary item.

**Recommended answer:** defer to the multi-weapon stage, keep the ability-key seam (ADR-007). Provisionally recorded as deferred in `concept-boundary`.

---

## Q-011 — Where exactly does the 3×3×3 cube sit relative to the target?

**Blocks:** `L0-trap` implementation · **Source:** ASM-008, refined in `trap-cqst` with three sub-questions · **Cost:** low to fix, **but §13 will not catch a wrong answer** — the test says *«приблизительно полный»*, which passes a cube off by one on every axis.

Four sub-questions, ideally answered together: (1) centre cell ±1 including the centre, 27 cells? (2) on a block hit, does the cube centre on the **hit block** or the **adjacent air cell** — they differ by one and centring on the block buries a third of the cube in terrain when aiming at the ground; (3) on an entity hit, the feet cell, and does the entity win a tie with a block at similar distance? (4) aiming at open air within reach — succeed at the ray's end, or fail?

**Plus the balance question the geometry implies:** targeting the ground at your own feet entombs the caster. Intended (escape denial) or a bug to guard against?

**Recommended:** 27 cells including centre; adjacent air cell; feet cell with entity winning ties; succeed at ray end; self-entombment is a feature.

---

## Q-012 — How should the two-player Definition-of-Done test be run?

**Blocks:** `L0-qatg` release gate · **Source:** ASM-010, `L0-qatg-asm1` · **Cost:** medium — it stalls the gate at the very end.

§14 requires a test with at least two players. The documented environment supplies **one** iPad, and macOS has no Bedrock client at all. This is the one DoD condition with no guaranteed environment.

**Recommended answer:** accept the `SimulatedPlayer` GameTest (already proven in Stage 1) as the multiplayer evidence for scripted logic and amend §14 to match — but keep one genuine two-client check for §13's "both clients see the same cobweb" if any second device can be borrowed. Answering this early is cheap; answering it late means discovering at gate time that the evidence cannot be produced.

---

## Q-013 — What is the closed list of protected blocks?

**Blocks:** `L0-trap` tuning, not structure · **Source:** ASM-007 · **Cost:** low to change, but failures are **unrecoverable player data loss**.

§6 names only examples — chests *«и подобные»*, bedrock *«и другие защищённые блоки»*. `L0-trap` proposes a concrete working list: any cell with a living entity; every block entity (chest/trapped/ender chest, barrel, shulker, hopper, dropper, dispenser, furnace family, brewing stand, beacon, lectern, jukebox, sign, banner, spawner, campfire, enchanting table, anvil, bed); indestructible and special (bedrock, barrier, command/structure/jigsaw block, end portal + frame, nether portal, light block); everything not positively recognised as ordinary and replaceable is skipped by default.

**Confirm the posture, above all:** *skip any cell whose safety is uncertain, accepting a weaker trap over destroyed storage.* The list can be wrong and recoverable; the posture cannot.

---

## Q-014 — If the world's only Web Sword is destroyed, can another be crafted?

**Blocks:** `L0-once` (CTR-006) · **Source:** CTR-006 · **Cost:** medium — "yes" is a new requirement, not a clarification.

The spec protects the sword against death, disconnect and restart, then pairs that with a write-once budget. Lava, the void, `/clear` and a killed item entity are never mentioned. The reachable terminal state is a running server with a spent budget and zero obtainable Web Swords.

**Question:** should the world be able to craft another? **Recommended: "no, that's the risk"** — it needs no new mechanism; add one line to §3 saying so explicitly. If **yes**, it requires Q-006's marker, an explicit recovery trigger, and its own §13 test — and it must **not** be automatic detection, which re-opens a destroy-and-recraft dup path. A middle path worth offering: **an operator-only command that clears the flag**, logged — cheap, auditable, and no dup path since it requires operator intent.

---

## Q-015 — Which game modes do your PvP maps actually run in?

**Blocks:** `L0-once` (ASM-013) · **Cost:** low.

The craft gate discriminates Survival from Creative. Adventure and Spectator are unstated. If the PvP maps run players in Adventure, the gate's mode check is wrong by omission rather than by logic.

---

## Q-016 — In a PvP add-on, is the legendary sword genuinely un-lootable?

**Blocks:** `L0-keep` scope confirmation (not implementation) · **Cost:** medium — it changes what retention *means*, not how it is built.

The project is scoped as a **PvP** add-on. §4 requires the owner's sword never to drop on death and always to return. Together: **killing the owner yields nothing.** The one-per-world legendary weapon can never change hands by combat, and a player who loses the craft race has no path to it for the life of the world.

That may be exactly the intent — a reward for crafting first, protected. It is also a plausible oversight, since §4 reads like a convenience feature while its effect in PvP is a permanent non-transferable monopoly. Nothing in the spec states a looting or transfer rule either way, which is why this is a question and not a contradiction.

**Recommended answer: confirm as intended** — most consistent with *«один раз на весь мир/сервер»*. The alternatives (retention protects against environmental death only; or the sword is retained but voluntarily tradeable) both need mechanics the spec does not describe. Note that under `L0-keep`'s rules admin `/give` copies are **not** retained and therefore **are** lootable, so a world can already contain lootable swords — but only by operator action, not by gameplay.

---

## Q-017 — What happens when all 27 cells are skipped?

**Blocks:** `L0-trap`'s success predicate, and a possible `.lang` key in `L0-item` (ADR-019) · **Source:** CTR-008 · **Cost:** low, but **it ships unexamined** — no §13 test covers it.

A valid, in-reach target whose entire volume is protected or unloaded: the Nether bedrock floor, the build ceiling, a wall of chests.

**Question:** rank — (a) zero cells = **failure**, cooldown not consumed; (b) zero cells = **success**, cooldown consumed like any partial cube; (c) failure **with a localized message** explaining there is no valid space.

**Recommended:** (a) — it follows §8's *«после успешного создания ловушки»* most closely. (b) is what you get by accident and disarms a player for 30 s per attempt when pinned against bedrock. (c) is also fine but needs a translate key decided **before `L0-item` closes its catalogue**, so it cannot be left open indefinitely.

### Answer

_..._

---


### Child-level question details

<details>
<summary>3 original question(s) at child nodes — already promoted above</summary>

#### Q-016 — In a PvP add-on, is the legendary sword genuinely un-lootable? (L0-keep-q014)

# Q-016 — In a PvP add-on, is the legendary sword genuinely un-lootable?

> **Renumbered at reduce (analysis_version 2).** Filed as "Q-014", a number `L0-once` and `L0-trap` also used for different questions. L0 assigned **Q-016**; see `concept-client-question` at `L0`.

**Links** — `part_of: ["L0-keep"]` · `is_a: ["client-question"]` · `relates_to: ["L0-keep-r001", "L0-keep-r003"]` · **Blocks:** `L0-keep` (scope confirmation, not implementation) · **Cost of a late answer:** medium — it changes what retention *means*, not how it is built.

## Why this is being asked

The spec's opening line scopes the whole project as a *«Minecraft Bedrock PvP Add-On»*. §4 then requires that the owner's Web Sword never drops on death and always returns to them.

Put together: **killing the sword's owner yields nothing.** The one-per-world legendary weapon cannot change hands by combat — only the original crafter can ever wield it, for the life of the world. A player who loses the craft race to a rival has no path to the item at all.

That may be exactly the intent — the weapon is a *reward for crafting first*, and making it unloseable protects that achievement. It is also a plausible oversight, since §4 reads like a convenience feature ("don't lose your stuff") while its actual effect in a PvP context is a permanent, non-transferable monopoly.

Nothing in the spec states a looting or transfer rule either way, so this analysis cannot settle it by reading. It is recorded as a question rather than a contradiction for that reason.

## Question

Is the intended behaviour that the Web Sword **can never be taken from its owner by another player**, for the entire life of the world?

If so, confirm it explicitly so it can be written into the boundary as a deliberate design property rather than a side effect.

If not, the owner should state which relaxation is wanted — for example:
- **(a)** retention protects against environmental death only, and PvP death drops the sword;
- **(b)** the sword is always retained, but can be traded/given voluntarily;
- **(c)** retention is as specified and the monopoly is intended (**no change**).

## Recommended answer

**(c) — confirm as intended.** It is the reading most consistent with *«один раз на весь мир/сервер»*: a single world-unique artifact whose owner is fixed by who crafted it first. Options (a) and (b) both require new mechanics the spec does not describe, and (a) in particular would add a death-cause distinction to `L0-keep-p001` that nothing else in the document anticipates.

**Note.** Under `L0-keep-r003`, admin/`/give` copies are *not* retained and therefore **are** lootable. So the world can already contain lootable Web Swords if an operator chooses to hand them out. That is a partial answer to the design tension, but only through operator action, not through gameplay.

---

#### Open questions — One-per-World Craft Gate (L0-once)

# Open questions — One-per-World Craft Gate

**Links** — `part_of: ["L0-once"]` · `is_a: ["client-question"]` · `relates_to: ["L0", "L0-keep"]`

Refined, not resolved. Per the decomposition plan, children add implementation detail to their routed questions and hand them back; L0 re-aggregates.

---

## Q-008 (refined) — What happens to the ingredients on a blocked craft?

**Routed to this node at L0. Ties to CTR-003.**

§3 asks for the second craft to be blocked *«без потери ингредиентов, насколько это позволяет стабильный API»*. §13 tests only that it is blocked. Please rank:

1. **Refund required** — the 4× Cobweb and 1× Diamond Sword come back. If the stable API cannot do this cleanly, implementation stops and asks again.
2. **Refund preferred, consumption acceptable** — ship the best the API allows, always with a localized message explaining the loss.
3. **Consumption fine** — blocked is blocked; the message is optional.

**Why we need the answer:** as the spec stands, an implementation that eats a Diamond Sword on every blocked attempt passes §13 and §14 in full. The acceptance suite cannot tell options 1 and 3 apart, so the choice has to be stated. Whichever you pick becomes `L0-once-accp7` and should be added to §13.

**Our recommendation:** option 2, with the message mandatory.

---

## Q-014 (new) — If the world's only Web Sword is destroyed, can another be crafted?

**Ties to CTR-006.** §4 protects the sword from death, but lava, the void, `/clear` and item despawn are not mentioned. Since the craft flag is write-once, a server can reach a state where the budget is spent and no Web Sword exists, permanently.

1. **No — that is the risk.** Recommended; needs no new mechanism, just a sentence in §3.
2. **Yes, automatically.** This is a new requirement, not a clarification: it needs instance provenance (see CTR-005), a detection trigger, and its own test. It also re-opens a craft dup path.
3. **Operators can reset it manually.** A single op-only command that clears the flag, written to the content log. Cheap, auditable, no dup path.

---

## Q-015 (new) — Which game modes do your PvP maps actually run in?

**Ties to ASM-013.** §3 splits the world into "Survival" and "Creative / `/give`". Adventure mode is never mentioned, and players *can* craft at a table in Adventure. Since this is a PvP add-on and PvP maps commonly run in Adventure, the gap is not theoretical.

Our default: **Adventure crafts spend the budget** (it is a play mode, not an admin mode). Confirm, or tell us Adventure should be exempt.

**Blast radius if we guessed wrong:** on an Adventure-mode map, a wrongly-exempted gate never closes and the legendary weapon becomes unlimited.

---

## Not asked — resolved locally

- *World vs server scope of «на весь мир/сервер»* — already decided by ADR-005 (world-scoped).
- *Does a late-joining player see the announcement?* — assumed no (ASM-012); cosmetic, not worth the owner's attention unless they disagree.
- *Does a shift-click bulk craft yield multiple swords?* — an engine-behaviour question we will answer ourselves with a GameTest (ASM-014), not a question for the owner.

---

#### Client Questions — Active Ability (L0-trap-cqst)

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

---


</details>

