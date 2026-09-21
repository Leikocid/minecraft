---
title: Glossary
type: project-knowledge
generated_at: "2026-09-21T21:24:41.634Z"
source_channel: rollout
node_id: rollout-glossary
aliases: ["rollout-glossary","glossary","project-knowledge/glossary"]
is_a: ["rollout","glossary"]
relates_to: ["L0-cool-ac01","L0-cool-ac02","L0-cool-ac03","L0-cool-ac04","L0-cool-ac05","L0-cool-gl01","L0-cool-gl02","L0-cool-gl03","L0-cool-gl04","L0-item-ac01","L0-item-ac02","L0-item-ac03","L0-item-ac04","L0-item-gl01","L0-item-gl02","L0-item-gl03","L0-item-gl04","L0-item-gl05","L0-keep-ac01","L0-keep-ac02","L0-keep-ac03","L0-keep-ac04","L0-keep-ac05","L0-keep-ac06","L0-keep-gloss-admin","L0-keep-gloss-dup","L0-keep-gloss-ledger","L0-keep-gloss-owner","L0-keep-gloss-prov","L0-keep-gloss-retention","L0-once-accp1","L0-once-accp2","L0-once-accp3","L0-once-accp4","L0-once-accp5","L0-once-accp6","L0-once-accp7","L0-once-accp8","L0-once-gadm","L0-once-gcrd","L0-once-gfca","L0-once-gsvc","L0-once-gwcf","L0-qatg-ac01","L0-qatg-ac02","L0-qatg-ac03","L0-qatg-ac04","L0-qatg-ac05","L0-qatg-ac06","L0-qatg-gl01","L0-qatg-gl02","L0-qatg-gl03","L0-qatg-gl04","L0-qatg-gl05","L0-trap-ac01","L0-trap-ac02","L0-trap-ac03","L0-trap-ac04","L0-trap-ac05","L0-trap-ac06","L0-trap-ac07","L0-trap-ac08","L0-trap-ac09","L0-trap-gact","L0-trap-gchk","L0-trap-gcub","L0-trap-gprb","L0-trap-greh","L0-trap-gtgt"]
priority: 510
---

# Glossary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Cool ac01 concept acceptance criterion (L0-cool-ac01)

**AC-COOL-1.** GIVEN a player successfully triggers the Web Sword ability (cobweb cube placed), WHEN they attempt to use the sword again within 30 seconds, THEN the ability does not trigger, no new cobweb is placed, and the player's cooldown record is unchanged by the failed attempt.

Source: §13 — *«После успешной способности повторное использование заблокировано 30 секунд.»* Grounded in R-cool-001, R-cool-002.


- **node**: L0-cool-ac01

### Cool ac02 concept acceptance criterion (L0-cool-ac02)

**AC-COOL-2.** GIVEN a player's Web Sword ability is on cooldown, WHEN exactly 30 seconds (600 ticks) have elapsed since the successful activation that started it, THEN `isReady` returns true and the next use attempt is allowed to proceed to targeting.

Source: §8 — *«Когда cooldown закончился, способность снова доступна.»* Grounded in R-cool-001.


- **node**: L0-cool-ac02

### Cool ac03 concept acceptance criterion (L0-cool-ac03)

**AC-COOL-3.** GIVEN a player is holding `andrew:web_sword` and it is on cooldown, WHEN an actionbar render tick runs, THEN the actionbar shows the remaining time as a localized (RU and EN, per client locale) string sourced from a translate key in `L0-item`'s catalogue — never a hardcoded literal.

Source: §8, §10. Grounded in R-cool-004, R-cool-005.


- **node**: L0-cool-ac03

### Cool ac04 concept acceptance criterion (L0-cool-ac04)

**AC-COOL-4.** GIVEN a player's Web Sword use attempt fails reach validation (no valid target, or target out of range), WHEN the failed attempt is evaluated, THEN `start()` is never called, no cooldown is started, and any pre-existing cooldown timer for that player is left exactly as it was.

Source: §5 — *«cooldown не запускается»*; §12 edge case. Grounded in R-cool-002.


- **node**: L0-cool-ac04

### Cool ac05 concept acceptance criterion (L0-cool-ac05)

**AC-COOL-5.** GIVEN no player on the server is currently holding an item registered with the cooldown service, WHEN the actionbar render interval fires, THEN it performs no per-player read or write work beyond its own holder-filter check — verifiable by a GameTest asserting the loop short-circuits on an empty holder set.

Source: C-4; decomposition plan's per-tick scoping note. Grounded in R-cool-004.


- **node**: L0-cool-ac05

### Cool gl01 concept glossary term (L0-cool-gl01)

**Ability Key**

A namespaced string identifier (e.g. `andrew:web_sword`) that names one legendary ability for the cooldown service, independent of which item(s) can trigger it. Introduced by ADR-007 as the seam the future cross-item cooldown framework will plug into. In v1 there is exactly one ability key.

**Synonyms:** abilityKey, ability id.


- **node**: L0-cool-gl01

### Cool gl02 concept glossary term (L0-cool-gl02)

**Cooldown Record**

The per-(player, ability key) state this component owns: when the ability becomes ready again. See entity `L0-cool-ent1`. Not to be confused with the vanilla `minecraft:cooldown` item component, which ADR-007 rejected because it exposes no remaining-time value for the actionbar to render.

**Synonyms:** cooldown state, timer record.


- **node**: L0-cool-gl02

### Cool gl03 concept glossary term (L0-cool-gl03)

**Actionbar**

The one-line, non-persistent HUD text area Bedrock renders above the hotbar, set via the stable `player.onScreenDisplay.setActionBar(...)` API. §8 names it directly but also accepts *«ближайший стабильный эквивалент»* (nearest stable equivalent) if the actionbar itself proves unsuitable — this component treats the actionbar as the primary target and has found no reason yet to invoke the fallback clause.

**Synonyms:** action bar, HUD countdown line.


- **node**: L0-cool-gl03

### Cool gl04 concept glossary term (L0-cool-gl04)

**Holder**

A player currently equipping (main hand or off hand — see `L0-cool-asm3`) an item whose type is registered with the cooldown service's `AbilityRegistration`. The actionbar render loop's per-tick scope is defined entirely in terms of holders (R-cool-004) — being a holder is what makes a player eligible for a countdown render, independent of whether their ability is actually on cooldown.

**Synonyms:** sword holder, item holder.


- **node**: L0-cool-gl04

### Item ac01 concept acceptance criterion (L0-item-ac01)

**Links** — `part_of: ["L0-item"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-item-r002", "L0-item-ent1"]`

GIVEN a world with the add-on loaded, WHEN a player opens the Creative inventory, THEN `andrew:web_sword` appears in the Equipment tab's sword group, in the unfiltered "All" catalogue, and via Creative Search — AND `/give <player> andrew:web_sword` succeeds.

**Source:** §1, §13 (test 1).


- **node**: L0-item-ac01

### Item ac02 concept acceptance criterion (L0-item-ac02)

**Links** — `part_of: ["L0-item"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-item-r003", "L0-item-ent2"]`

GIVEN a crafting table, WHEN a player places 1× Cobweb in each of the four edge-center cells and 1× Diamond Sword in the center cell of a 3×3 grid (all other cells empty), THEN exactly 1× `andrew:web_sword` is produced — AND any other arrangement (shifted, rotated off-pattern, wrong item counts, ingredients swapped) does **not** match.

**Source:** §2, §13 (test 2).


- **node**: L0-item-ac02

### Item ac03 concept acceptance criterion (L0-item-ac03)

**Links** — `part_of: ["L0-item"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-item-r001", "L0-item-asm1"]`

GIVEN a Web Sword used through an extended play session (many hits landed, blocks broken, extended time held), WHEN its state is inspected, THEN it shows no durability bar, cannot be consumed by use, and remains fully functional indefinitely — because no `minecraft:durability` component is present on the item.

**Source:** §1, §13 (test 5). Depends on ASM-005/Q-007 resolving in the assumed direction (`L0-item-asm1`) — if enchantability and durability-omission turn out incompatible, this AC and `L0-item-r001` must be revisited together.


- **node**: L0-item-ac03

### Item ac04 concept acceptance criterion (L0-item-ac04)

**Links** — `part_of: ["L0-item"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-item-r004"]`

GIVEN a player holding a Web Sword, WHEN they perform a plain melee attack (not the item-Use ability) against an entity, THEN damage dealt equals vanilla Diamond Sword damage (adjusted only by any applied compatible enchantments), AND no Cobweb is placed anywhere, AND no cooldown timer starts or is consumed.

**Source:** §7, §13 (test 6). Shared boundary with `L0-trap`/`L0-cool` — this AC fails if either sibling reacts to the attack event instead of the Use event.


- **node**: L0-item-ac04

### Item gl01 concept glossary term (L0-item-gl01)

**andrew:web_sword**

The custom namespaced identifier for the legendary Web Sword item. Follows the project's `andrew:` namespace convention (decision-namespace-addona-andrew-asm-002-q-002), same as `andrew:miners_pickaxe`.

**Synonyms:** Web Sword, Паутинный меч.


- **node**: L0-item-gl01

### Item gl02 concept glossary term (L0-item-gl02)

**Menu Category (Creative group)**

The Bedrock item component (`menu_category`) that controls which Creative-inventory tab and sub-group an item appears in (e.g. `category: "equipment"`, `group: "itemGroup.name.pickaxe"`). Distinct from Creative **Search**, which indexes all items regardless of `menu_category` and from the unfiltered "All"/«Все» catalogue tab. All three are separately testable and the spec requires all three for the Web Sword (§1).


- **node**: L0-item-gl02

### Item gl03 concept glossary term (L0-item-gl03)

**Shaped Recipe**

A Bedrock recipe type (`minecraft:recipe_shaped`) where ingredient **position** in the crafting grid matters, as opposed to a shapeless recipe where only the multiset of ingredients matters. The Web Sword's plus-pattern (4× Cobweb around 1× Diamond Sword) must use this type — a shapeless recipe would incorrectly match ingredients in any arrangement, including ones the spec's diagram excludes.


- **node**: L0-item-gl03

### Item gl04 concept glossary term (L0-item-gl04)

**Durability Omission Pattern**

This project's established idiom for "infinite durability": rather than assigning a very large numeric value to `minecraft:durability`, the component is **omitted from the item definition entirely**. First used on `andrew:miners_pickaxe`; the Web Sword repeats the pattern. Its interaction with `minecraft:enchantable` is unverified on this Bedrock build — see ASM-005/Q-007 and `L0-item-asm1`.


- **node**: L0-item-gl04

### Item gl05 concept glossary term (L0-item-gl05)

**Translate Key (.lang catalogue)**

A rawtext `translate` identifier (e.g. `item.andrew:web_sword.name`) resolved at render time by the Resource Pack's `ru_RU.lang` / `en_US.lang` files, optionally with `with`-substituted values (player name, seconds remaining). The project-wide rule (C-9, ADR-009): **no script ever emits a literal user-facing string** — every message is a translate key owned by `L0-item`'s catalogue (`L0-item-ent3`).


- **node**: L0-item-gl05

### AC K-1 — No ground drop on death (L0-keep-ac01)

# AC K-1 — No ground drop on death

**Links** — `part_of: ["L0-keep"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-keep-r001", "L0-keep-p001"]` · `maps_to: ["§13 AT-11", "WS-9"]` · `owner_after_reduce: ["L0-qatg"]`

**GIVEN** a player holding a provenance-marked `andrew:web_sword`
**WHEN** the player dies by any cause (fall, mob, PvP, `/kill`, void)
**THEN** no `andrew:web_sword` item entity exists in the world at the death location — checked on the death tick and again after the drop-collection window
**AND** no other player is able to pick one up at that location.

**Spec basis.** §13: *«После смерти владельца Web Sword не остаётся дропом на земле…»* · §4.

**How to verify.** GameTest with a simulated player on Docker BDS (KC-8, C-11). Kill the player, then assert zero matching item entities in the test volume. Sample on the death tick specifically — a transient drop that is removed a tick later still **fails**, because the window is exploitable (`L0-keep-r001`).

**Not covered here.** Whether the sword comes back — that is `L0-keep-ac02`.


- **node**: L0-keep-ac01

### AC K-2 — Restored to the same owner, exactly once (L0-keep-ac02)

# AC K-2 — Restored to the same owner, exactly once

**Links** — `part_of: ["L0-keep"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-keep-r002", "L0-keep-p002"]` · `maps_to: ["§13 AT-11", "WS-9"]` · `owner_after_reduce: ["L0-qatg"]`

**GIVEN** a player who died carrying a provenance-marked `andrew:web_sword`
**WHEN** the player respawns
**THEN** the player's inventory contains **exactly one** `andrew:web_sword`
**AND** it carries the same provenance marker it had before death
**AND** the world-wide count of that bonded instance is exactly one.

**Spec basis.** §13: *«…и возвращается без дюпа»* · §4: *«После возрождения предмет должен вернуться тому же владельцу.»*

**How to verify.** GameTest, simulated player. Assert inventory count **== 1**, not **>= 1** — the "at least one" assertion passes on a duplicate and is the easy way to ship the exact bug this component exists to prevent.

**Also assert.** No second player received a copy, and no item entity exists in the world (composes with `L0-keep-ac01`).


- **node**: L0-keep-ac02

### AC K-3 — Disconnect/reconnect cycling yields no extra copy `RELEASE BLOCKER` (L0-keep-ac03)

# AC K-3 — Disconnect/reconnect cycling yields no extra copy `RELEASE BLOCKER`

**Links** — `part_of: ["L0-keep"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-keep-r002", "L0-keep-p003"]` · `maps_to: ["§14 DoD", "WS-10"]` · `governed_by: ["C-7"]` · `owner_after_reduce: ["L0-qatg"]`

**GIVEN** a player who died carrying a provenance-marked `andrew:web_sword` and disconnected **before respawning**
**WHEN** the player reconnects, and then disconnects and reconnects **N more times** (N ≥ 3)
**THEN** the player has received exactly **one** `andrew:web_sword` in total across all sessions
**AND** no item entity was dropped at any point.

**Spec basis.** §4: *«…при смерти, disconnect/reconnect и рестарте»* · §14: *«Нет известных способов дюпа через… смерть или reconnect.»* · C-7.

**How to verify.** GameTest / BDS scripted session cycling. The N-times repetition is the point: a naive "grant on join if owed" implementation passes a single-cycle test and fails this one. Assert the **cumulative** grant count, not the final inventory — a player who drops the extra copy in a chest between cycles still represents a dup.

**Variants to cover.** Disconnect *during* the death animation; disconnect *after* respawn but before the grant lands; reconnect while the previous session is still registered.

**Blocker status.** Per KC-1, a failure here is not shippable at any severity discount.


- **node**: L0-keep-ac03

### AC K-4 — Server restart mid-cycle yields no extra copy and no lost obligation `RELEASE BLOCKER` (L0-keep-ac04)

# AC K-4 — Server restart mid-cycle yields no extra copy and no lost obligation `RELEASE BLOCKER`

**Links** — `part_of: ["L0-keep"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-keep-r002", "L0-keep-r005", "L0-keep-p003", "L0-keep-ent1"]` · `maps_to: ["§14 DoD", "WS-10", "K-6"]` · `governed_by: ["C-6", "C-7"]` · `owner_after_reduce: ["L0-qatg"]`

**GIVEN** a player who died carrying a provenance-marked `andrew:web_sword`
**WHEN** the server is stopped and restarted **before** the player respawns, and the player then rejoins
**THEN** the player receives exactly **one** `andrew:web_sword`
**AND** restarting the server again and rejoining again grants **nothing further**.

**Spec basis.** §4 (*«…и рестарте»*) · C-6 (state survives restart) · C-7.

**How to verify.** Docker BDS: scripted death → `stop` → restart → rejoin, asserting cumulative grant count == 1. Then repeat the restart/rejoin loop and assert the count is unchanged. This is the acceptance test that proves the ledger is genuinely durable rather than incidentally surviving in memory — it is the retention analogue of §13's restart test for the craft flag.

**Both directions matter.** Grant count of **2** is a dup (C-7 breach). Grant count of **0** is a silently destroyed legendary — a real defect, though the preferred one per `L0-keep-r002`.

**Blocker status.** Per KC-1.


- **node**: L0-keep-ac04

### AC K-5 — Death leaves the craft flag untouched, including during cooldown (L0-keep-ac05)

# AC K-5 — Death leaves the craft flag untouched, including during cooldown

**Links** — `part_of: ["L0-keep"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-keep-r004", "L0-once", "L0-cool"]` · `maps_to: ["§12", "K-4", "K-5"]` · `owner_after_reduce: ["L0-qatg"]`

**GIVEN** a world where the one survival craft has been spent, and a player holding the crafted `andrew:web_sword`
**WHEN** the player activates the ability, then dies **while the 30 s cooldown is still running**, then respawns
**THEN** a second survival craft remains blocked
**AND** the player holds exactly one `andrew:web_sword`
**AND** the total number of Web Swords in the world is unchanged.

**Spec basis.** §12, quoted directly: *«Смерть во время cooldown не должна создавать копию меча или сбрасывать persistent one-per-world flag.»*

**How to verify.** GameTest: craft (or set the flag), activate, kill mid-cooldown, respawn, then attempt a second survival craft and assert it is refused. Survives restart too — compose with `L0-keep-ac04`.

**Why the cooldown context.** §12 singles out this timing because it is when the most state is in flight — cooldown timer, ledger entry and craft flag all live at once. It is the natural place for a cross-component write to leak.

**Note.** Whether the *cooldown itself* survives death/respawn is **not** tested here — that is Q-009, owned by `L0-cool`.


- **node**: L0-keep-ac05

### AC K-6 — Admin/`give` copies are not retained `CONDITIONAL ON Q-006` (L0-keep-ac06)

# AC K-6 — Admin/`give` copies are not retained `CONDITIONAL ON Q-006`

**Links** — `part_of: ["L0-keep"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-keep-r003", "L0-keep-ent2"]` · `blocked_by: ["Q-006"]` · `source: ["CTR-005"]` · `owner_after_reduce: ["L0-qatg"]`

> This criterion's meaning depends on Q-006. Stated for the recommended "yes" branch.

**GIVEN** a player holding an `andrew:web_sword` obtained via `/give` or the Creative inventory (no provenance marker)
**WHEN** the player dies
**THEN** that sword **drops normally** as a ground item
**AND** no ledger entry is created for it
**AND** on respawn the player is granted nothing.

**AND GIVEN** a player holding **both** a crafted (marked) sword and a `/give` copy
**WHEN** the player dies and respawns
**THEN** the marked sword is restored (exactly one) and the unmarked one is on the ground — total count across world and inventory is unchanged at two.

**Spec basis.** Derived from §3/§4's admin-copy allowance plus §14's absolute no-dup rule, via CTR-005. **Not stated in the spec** — this criterion encodes the resolution, so it is only valid once the owner confirms it.

**If Q-006 is answered "no".** This criterion is withdrawn and replaced by whatever narrowed rule the owner accepts, together with an explicit written relaxation of §14. `L0-qatg` must not treat the current text as a release gate until Q-006 is closed.

**How to verify.** GameTest with two stacks distinguished by marker presence; assert the split outcome above.


- **node**: L0-keep-ac06

### Keep gloss admin concept glossary term (L0-keep-gloss-admin)

**Admin copy** (a.k.a. **test copy**, **dev copy**) · RU: *«Creative/test copies»*

A Web Sword instance obtained through the Creative inventory or `/give` rather than through a survival craft. §4 permits these to exist in **unlimited numbers**: *«Creative/test copies могут существовать у администратора; one-per-world относится к survival crafting, а не к количеству dev/test copies.»*

Two consequences that the rest of the team must not conflate:
1. Admin copies **do not consume** the world's single survival craft (§3) — an `L0-once` concern.
2. Admin copies are **not death-retained** under `L0-keep-r003` — they drop and can be looted like any ordinary item. An operator testing on a live server will lose one on death. This is intended behaviour, not a bug.

The existence of admin copies alongside an absolute no-dup rule is precisely what makes **CTR-005** a real conflict rather than a gap.

**Antonym**: **bonded sword** — the single survival-crafted, provenance-marked instance that retention protects.


- **node**: L0-keep-gloss-admin

### Keep gloss dup concept glossary term (L0-keep-gloss-dup)

**Dup path** · RU: *«дюп»*, *«способ дюпа»*

Any reproducible sequence of player or server actions that increases the number of Web Sword instances in the world without a legitimate craft or admin grant. Named explicitly in §14 — *«Нет известных способов дюпа через крафт, смерть или reconnect»* — and elevated to constraint **C-7**, where it is stated absolutely with no error budget.

The three named vectors:
- **via craft** — owned by `L0-once` (concurrent-craft race, §9)
- **via death** — owned by `L0-keep` (`L0-keep-p001`/`p002`)
- **via reconnect** — owned by `L0-keep` (`L0-keep-p003`)

A dup is distinguished from ordinary bugs by being **permanent and silent**: the extra item persists in world state indefinitely and cannot be detected after the fact without auditing every inventory and container.

**Synonyms**: duplication exploit, item duplication.


- **node**: L0-keep-gloss-dup

### Keep gloss ledger concept glossary term (L0-keep-gloss-ledger)

**Retention Ledger**

The durable, world-scoped map of `owner_id → {state, instance_ref}` that records which players are **owed** a Web Sword back. The only state `L0-keep` owns. Full definition: `L0-keep-ent1`.

Its dual role is the component's core idea: it is both the *record* of the obligation and the *idempotency token* that makes the withhold/re-grant pair safe to replay across death, reconnect and restart (`L0-keep-r002`).

Two states: **`pending`** (withheld, owed back) and **`redeemed`** (returned). A grant is only permitted against a `pending` entry, and claiming flips it in the same operation.

**Important**: the ledger records *owed swords*, not *existing swords*. It is not a census of Web Swords in the world and must never be used as one — deriving state by scanning is forbidden by C-4 (`L0-keep-r005`).

**Not to be confused with**: the **one-per-world craft flag**, which is separate state owned by `L0-once` and which this component may never read or write (`L0-keep-r004`).


- **node**: L0-keep-gloss-ledger

### Keep gloss owner concept glossary term (L0-keep-gloss-owner)

**Bonded owner** · RU: *«владелец»* (§4: *«должен вернуться тому же владельцу»*)

The player to whom a bonded Web Sword returns on respawn — the key of the Retention Ledger (`owner_id` in `L0-keep-ent1`).

Must be the player's **stable identity**, the one that persists across disconnect, reconnect and server restart. Explicitly **not** the display name (changeable, non-unique) and not any session- or connection-scoped handle (ASM-014). If the identity is unstable, a returning player is treated as a new player: the obligation is stranded and — worse — a fresh entry can be armed for the same physical person, which is a dup path.

§4 names the owner but never defines how ownership is established. This component reads it as **"the player who was carrying the sword at the moment of death"**, with the ledger keyed to that player. Whether ownership should instead be fixed at *craft* time (surviving trades and thefts) is an open design point folded into Q-006's `bound_owner` attribute.

**Related**: **bonded sword** — the marked instance; **admin copy** — an unmarked instance with no owner.


- **node**: L0-keep-gloss-owner

### Keep gloss prov concept glossary term (L0-keep-gloss-prov)

**Provenance marker** · *(conditional — pending Q-006)*

A durable per-instance attribute on a Web Sword item stack recording **how it entered the world**: `survival_craft` when set at craft time, **absent** for Creative and `/give` copies. Full definition: `L0-keep-ent2`.

Not specified anywhere in the source spec. It is the requirement **CTR-005 shows to be implied** by holding §4 (always return it to the owner) and §14 (no dup paths) together while §3 permits unlimited admin copies. Without it, the restore predicate cannot distinguish *"the owner's sword"* from *"a Web Sword"*, and any implementation breaks one of the two rules.

A sword carrying the marker is **bonded**; one without it is an **admin copy**.

**Depends on**: Q-006 (`BLOCKER`) — may instances carry such a marker at all? Recommended answer: yes.
**Synonyms**: instance provenance, craft marker, bonding tag.


- **node**: L0-keep-gloss-prov

### Keep gloss retention concept glossary term (L0-keep-gloss-retention)

**Death Retention** · RU: *«Сохранение после смерти»*

The behaviour required by spec §4 whereby a player's Web Sword is withheld from the death drop and returned to the same player on respawn. Implemented as a *withhold → owe → re-grant* cycle mediated by the Retention Ledger, **not** as the `keepInventory` gamerule (rejected in ADR-008 because it is server-wide and retains everything).

Retention is scoped to **one item** — `andrew:web_sword`. All other items, including `andrew:miners_pickaxe`, follow vanilla death rules untouched (C-10).

**Synonyms**: soulbound (informal, by analogy to modded Java — no such vanilla Bedrock mechanic exists), keep-on-death.
**Not to be confused with**: `keepInventory`, which is a different and explicitly rejected mechanism.


- **node**: L0-keep-gloss-retention

### Once accp1 concept acceptance criterion (L0-once-accp1)

**AC-ONCE-1 — First survival craft succeeds and is announced.**

Maps to §13: *«Первый survival-крафт успешен и объявляется в чате»* (first half).

**GIVEN** a fresh world where `andrew:web_sword` has never been crafted, and a player in Survival mode with 4× Cobweb and 1× Diamond Sword,
**WHEN** the player crafts the plus-pattern recipe at a crafting table,
**THEN** the player receives exactly 1× `andrew:web_sword`,
**AND** the world craft flag `andrew:web_sword_craft_gate` is present with `crafted: true` and `crafterName` equal to that player's display name,
**AND** every player online at that moment receives a chat message naming the weapon and the crafter,
**AND** no second sword is created anywhere.

**Harness:** `packs/gametest` with a simulated player performing the craft; assert on the dynamic property and on the message. Content-log evidence via `bds:check`.

**Negative half:** if the flag write fails, the announcement must NOT be sent — assert that a forced write failure leaves both the flag absent and the chat silent (`L0-once-pcft` failure handling).

**Owned by:** `L0-once` · **Rules:** R-001, R-004, R-006 · **Rolls up to:** `L0-qatg`


- **node**: L0-once-accp1

### Once accp2 concept acceptance criterion (L0-once-accp2)

**AC-ONCE-2 — Second survival craft in the same world is blocked.**

Maps to §13: *«второй survival-крафт в том же мире заблокирован»*.

**GIVEN** a world where the Web Sword has already been survival-crafted once (flag set), and any player in Survival mode with 4× Cobweb and 1× Diamond Sword — whether the original crafter or a different player,
**WHEN** that player crafts the plus-pattern recipe at a crafting table,
**THEN** the player's inventory contains **no** additional `andrew:web_sword`,
**AND** the world craft flag is unchanged (same `crafterName`, same `at`),
**AND** no announcement is broadcast,
**AND** the blocked player receives a localized denial message.

**Explicitly covers both actors.** The original crafter attempting a second craft and a *different* player attempting the first-for-them craft are the same case. Testing only one of the two is insufficient — a per-player implementation would pass the first and fail the second.

**Harness:** `packs/gametest`, two simulated players, sequential crafts.

**Owned by:** `L0-once` · **Rules:** R-001, R-005 (absolute half), R-006 · **Rolls up to:** `L0-qatg`


- **node**: L0-once-accp2

### Once accp3 concept acceptance criterion (L0-once-accp3)

**AC-ONCE-3 — The block survives a server restart.**

Maps to §13: *«После рестарта мира второй survival-крафт всё ещё заблокирован.»* This is the spec's only explicit persistence test and the direct evidence for C-6.

**GIVEN** a world where the Web Sword has been survival-crafted once,
**WHEN** all players disconnect, the world is saved, and the dedicated server is stopped and restarted,
**THEN** on rejoin, a survival craft attempt is still blocked exactly as in AC-ONCE-2,
**AND** the flag still reports the original `crafterName` and `at` values.

**Extend to all three durability events separately** — a single restart test hides two weaker failures:

| Sub-case | Assertion |
|---|---|
| a. Crafter logs out and back in (no restart) | Flag intact |
| b. World autosaves / manual save, no restart | Flag intact |
| c. Full server stop + start | Flag intact |

**Harness:** Docker BDS — this one cannot be covered by GameTest alone, since GameTest does not restart the host. Stop/start the container, rejoin, attempt the craft, grep the content log. This is the `bds:check` hop of C-11.

**Owned by:** `L0-once` · **Rules:** R-002 · **Rolls up to:** `L0-qatg`


- **node**: L0-once-accp3

### Once accp4 concept acceptance criterion (L0-once-accp4)

**AC-ONCE-4 — Creative crafting and `/give` do not touch the budget.**

Maps to §3 (*«Creative и /give … НЕ расходуют право»*) and §13's `/give` availability test. Not a standalone §13 test — derived, and must be added to the matrix.

**GIVEN** a fresh world where the Web Sword has never been survival-crafted,
**WHEN** an operator runs `/give @s andrew:web_sword` **and** a player in Creative mode crafts the recipe,
**THEN** both produce a Web Sword,
**AND** the world craft flag remains **absent**,
**AND** no announcement is broadcast on either path,
**AND** a subsequent Survival craft still succeeds and announces normally (AC-ONCE-1 holds afterwards).

**Reverse direction — the exemption is symmetric:**

**GIVEN** a world where the survival craft has already happened,
**WHEN** an operator `/give`s a copy and a Creative player crafts one,
**THEN** the flag remains `crafted: true` with its original `crafterName`,
**AND** a subsequent Survival craft is still blocked.

**Also assert:** an arbitrary number of admin copies (≥3) may exist simultaneously without affecting gate behaviour in either direction (R-003, R-007).

**Harness:** `packs/gametest` for the Creative craft; BDS console for `/give`.

**Owned by:** `L0-once` · **Rules:** R-003, R-007 · **Rolls up to:** `L0-qatg`


- **node**: L0-once-accp4

### Once accp5 concept acceptance criterion (L0-once-accp5)

**AC-ONCE-5 — Concurrent crafts by two players yield exactly one sword.**

Maps to §9 (*«Два игрока не должны иметь возможность обойти one-per-world crafting из-за одновременного крафта»*) and §14's two-player requirement. Not an explicit §13 test — derived, and must be added to the matrix.

**GIVEN** a fresh world on a dedicated server with two players in Survival, each holding 4× Cobweb and 1× Diamond Sword, at two separate crafting tables,
**WHEN** both complete the craft in the same tick (or in adjacent ticks),
**THEN** exactly **one** `andrew:web_sword` exists in the world afterwards,
**AND** the flag is set exactly once, naming the winner,
**AND** exactly **one** announcement is broadcast — not two,
**AND** the loser is treated as a blocked craft per AC-ONCE-2.

**Which player wins is not asserted.** Fairness is not a requirement; non-bypassability is.

**Harness — note the C-11 strain.** The reliable form is a GameTest with two simulated players crafting in the same tick, which Stage 1 proved is available (`bds:gametest`). Two genuine clients on the Docker BDS LAN server is the stronger evidence but is blocked on ASM-010 (only one iPad exists). Flag to `L0-qatg`: this criterion is the one most likely to need the simulated-player substitution the owner must approve.

**Review gate, not just a test.** The failure is timing-dependent and may pass by luck. Pair the test with a code review assertion: no `await`, no `system.run`, no deferral between the flag read and the flag write (R-004).

**Owned by:** `L0-once` · **Rules:** R-004 · **Rolls up to:** `L0-qatg`


- **node**: L0-once-accp5

### Once accp6 concept acceptance criterion (L0-once-accp6)

**AC-ONCE-6 — Death does not reset the craft flag.**

Maps to §12: *«Смерть во время cooldown не должна создавать копию меча или сбрасывать persistent one-per-world flag.»* The second clause is this component's; the first belongs to `L0-keep`.

**GIVEN** a world where the Web Sword has been survival-crafted, and the crafter is holding it,
**WHEN** the crafter dies — including while the ability is on cooldown — and respawns,
**THEN** the world craft flag is unchanged: still `crafted: true`, same `crafterName`, same `at`,
**AND** a survival craft attempt after respawn is still blocked (AC-ONCE-2 holds).

**Extend to the adjacent reset vectors**, all of which must leave the flag untouched:

| Vector | Assertion |
|---|---|
| Death + respawn | Flag intact |
| Disconnect + reconnect | Flag intact |
| Crafter leaves the server permanently | Flag intact, `crafterName` still resolvable in the denial message |
| Crafted sword destroyed (lava / void / `/clear`) | Flag intact — **see CTR-006**, this is the disputed one |

The last row is asserted as written here (flag survives) because R-001 says the flag is write-once, but it is the behaviour CTR-006 asks the owner to confirm. If the owner decides destruction should re-open the budget, this row inverts and R-001 must be amended.

**Cross-component guard.** This criterion is really a test that `L0-keep` never writes `L0-once`'s state. `L0-qatg` should treat a failure here as a boundary breach, not a gate bug.

**Owned by:** `L0-once` · **Rules:** R-002, R-007 · **Rolls up to:** `L0-qatg`


- **node**: L0-once-accp6

### Once accp7 concept acceptance criterion (L0-once-accp7)

**AC-ONCE-7 — Ingredient outcome on a blocked craft. `CONDITIONAL — blocked on CTR-003`**

No §13 test exists for this. That absence *is* CTR-003: §3 requires *«без потери ингредиентов»* with an escape clause, and the acceptance suite is silent, so an implementation that eats a Diamond Sword per attempt passes §13 and §14 in full.

This criterion is written in two mutually exclusive forms. **The owner must select one**; it cannot be resolved by this component.

**Form A — refund required** (if the owner ranks ingredient preservation as mandatory):

**GIVEN** a world where the Web Sword has been crafted, and a Survival player with 4× Cobweb + 1× Diamond Sword,
**WHEN** they attempt the craft,
**THEN** no Web Sword is obtained,
**AND** the player's inventory contains 4× Cobweb and 1× Diamond Sword again (or they are dropped at the player's feet if the inventory is full),
**AND** the inventory count is identical before and after — asserted by count, not by eye.

**Form B — consumption tolerated** (if the stable API cannot refund):

**GIVEN** the same setup,
**WHEN** they attempt the craft,
**THEN** no Web Sword is obtained,
**AND** the player receives the localized `andrew.web_sword.already_crafted` message **before or in the same tick as** the loss, so the cost is never silent.

**Escalation.** Whichever form is chosen must be added to §13 by the owner. Shipping Form B's behaviour while documenting Form A's promise is a defect independent of the choice.

**Owned by:** `L0-once` · **Rules:** R-005 · **Blocks:** nothing (the gate works either way) · **Rolls up to:** `L0-qatg`


- **node**: L0-once-accp7

### Once accp8 concept acceptance criterion (L0-once-accp8)

**AC-ONCE-8 — Both messages render correctly in RU and EN.**

Maps to §10 (*«Все пользовательские сообщения, включая first-craft announcement … должны иметь RU/EN варианты»*) and C-9.

**GIVEN** a client with locale `ru_RU` and a client with locale `en_US`,
**WHEN** the first survival craft occurs, and separately when a second craft is blocked,
**THEN** the RU client sees «Паутинный меч» inside a Russian sentence naming the crafter,
**AND** the EN client sees "Web Sword" inside an English sentence naming the crafter,
**AND** **no raw translate key** (e.g. `andrew.web_sword.first_craft`) appears on either screen,
**AND** the weapon name is localized *inside* the message, not left as English text in a Russian sentence.

**Static half — automatable.** Assert that `packs/resource/texts/ru_RU.lang` and `en_US.lang` both contain `andrew.web_sword.first_craft` and `andrew.web_sword.already_crafted`, and that the script source contains no literal user-facing string in `sendMessage`. This is a lint-style check and belongs in the existing suite.

**Visual half — iPad only.** Per C-11, "does it look right?" cannot be answered by BDS logs. The RU/EN rendering pass runs on the iPad by switching device language. `L0-qatg` owns scheduling it.

**Nested-translate trap.** The most likely failure is a correct-looking message with the weapon name inlined as a literal — it passes a log grep and fails the iPad pass. Assert the nesting explicitly.

**Owned by:** `L0-once` · **Rules:** R-006 · **Depends on:** `L0-item` (catalogue owner) · **Rolls up to:** `L0-qatg`


- **node**: L0-once-accp8

### Once gadm concept glossary term (L0-once-gadm)

**Admin Copy** / **Test Copy** (RU: «Creative/test copies», §4)

A `andrew:web_sword` instance obtained via `/give` or a Creative-mode craft. §4 permits these to exist in **unbounded number** and explicitly places them outside the one-per-world rule: *«one-per-world относится к survival crafting, а не к количеству dev/test copies.»*

Admin copies exist so the weapon can be tested on a live world without burning the world's single craft. Without them the feature would be untestable.

**Critical property — indistinguishability.** The spec specifies no owner tag, serial, or provenance marker, so an admin copy is byte-identical to the survival-crafted sword. This component does not need to tell them apart (R-007 forbids count-based gating), but `L0-keep`'s death-retention logic does — which is exactly why **CTR-005** is open and rated High. If the owner mandates a provenance marker, the natural write point is the first-craft process (`L0-once-pcft` step 5), but the marker and its ledger belong to `L0-keep`.

**Synonyms:** dev copy, `/give` copy, operator copy.


- **node**: L0-once-gadm

### Once gcrd concept glossary term (L0-once-gcrd)

**Craft Budget** / **Craft Right** (RU: «право на единственный survival-крафт», §3)

The world's allowance of exactly one successful survival craft of `andrew:web_sword`. Starts **unspent** in every new world, is **spent** by the first survival craft, and is never replenished by any in-game action.

The phrasing matters: the budget is a *right to craft*, not a *quota of swords*. An unbounded number of Web Swords may legitimately exist in a world (via Creative and `/give`) while the budget is still unspent, and conversely the budget can be spent in a world that currently contains zero Web Swords — if the crafted one was destroyed. That second case has no recovery path and is the subject of CTR-006.

**Scope:** *«на весь мир/сервер»* — implemented as world-scoped (ADR-005). On a dedicated BDS instance with one world these coincide; copying the world copies the spent budget.

**Synonyms:** the one-per-world budget, the craft allowance.


- **node**: L0-once-gcrd

### Once gfca concept glossary term (L0-once-gfca)

**First-Craft Announcement** (RU: объявление о первом крафте)

The one-time server-wide chat message emitted when the Web Sword's single survival craft succeeds. §3: *«При первом успешном крафте отправить всем игрокам локализованное сообщение с названием оружия и именем создателя.»*

Delivered as **rawtext with translate keys** (`andrew.web_sword.first_craft`) and a `with` substitution for the crafter's name, so each client renders it in its own language (R-006, ADR-009). Never a literal string.

**Audience:** all players online at craft time. No replay for players who join later (ASM-012).

**Significance beyond flavour.** It is the only in-game signal that the world's craft budget has been spent. A player who misses it has no way to learn the gate is closed and may waste a Diamond Sword discovering it — which is why the blocked-craft path carries its own per-player denial message (`andrew.web_sword.already_crafted`) as a second signal.

**Synonyms:** the reveal, the first-craft broadcast.


- **node**: L0-once-gfca

### Once gsvc concept glossary term (L0-once-gsvc)

**Survival Craft** (RU: survival-крафт)

A completed crafting-table craft of `andrew:web_sword` performed by a player **not** in Creative mode. Only a survival craft spends the world craft budget; this is the discriminator the whole component turns on.

Determined server-side by reading the crafting player's game mode at craft time (R-003) — never inferred from the item, the recipe, or the inventory.

**Boundary case:** Adventure mode. Players can craft at a table in Adventure, and the spec never says whether that counts. The working default is **yes, it spends the budget** (Adventure is a play mode, not an admin mode) — recorded as ASM-013 and open with the owner.

**Contrast with:** *Creative craft* and `/give`, both of which are exempt (`L0-once-gadm`).


- **node**: L0-once-gsvc

### Once gwcf concept glossary term (L0-once-gwcf)

**World Craft Flag** (RU: флаг крафта)

The durable world-scoped record that `andrew:web_sword` has been survival-crafted in this world. Stored as a dynamic property under `andrew:web_sword_craft_gate` holding a small versioned JSON record (see entity `L0-once-ecft`). Absent ⇒ the world's craft budget is unspent; present with `crafted: true` ⇒ spent, permanently.

It records a **craft event**, not a sword. It is never derived from the number of Web Swords in the world (R-007).

**Synonyms:** craft flag, one-per-world flag, the gate's state.
**Not to be confused with:** the *ownership ledger* (`L0-keep`), which tracks which player owns which sword instance. Different state, different owner, neither writes the other.


- **node**: L0-once-gwcf

### AC Q-1 — Clean import on the stable target (L0-qatg-ac01)

# AC Q-1 — Clean import on the stable target

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-qatg-ent3"]` · `maps_to: ["§14"]`

**GIVEN** the Web Sword's behavior/resource pack changes built and installed via `bds:check`
**WHEN** the Docker BDS server loads the world
**THEN** the console log shows zero content errors and zero dependency errors attributable to the Web Sword's item, recipe, or script changes
**AND** the existing pickaxe/Stage-0/1 content continues to load without new errors.

**Spec basis.** §14: *«Оружие импортируется без content/dependency errors на выбранной стабильной версии Bedrock.»*

**How to verify.** `npm run bds:check`; grep the resulting log per the existing pattern `scripts/bds-check.mjs` already uses for the pickaxe.

**Not covered here.** Whether the item behaves correctly once loaded — that is AT-1 through AT-12 (`L0-qatg-ac02`).


- **node**: L0-qatg-ac01

### AC Q-2 — Full acceptance coverage, single- and multi-player (L0-qatg-ac02)

# AC Q-2 — Full acceptance coverage, single- and multi-player

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-qatg-ent2", "L0-qatg-r002"]` · `maps_to: ["§14", "§9"]`

**GIVEN** the completed Acceptance Matrix (`L0-qatg-ent2`) with `pending_artifact_count = 0`
**WHEN** every mapped harness mechanism is run
**THEN** all twelve rows report `green` in a single-player world
**AND** every row where §9 claims multiplayer determinism (at minimum AT-3, AT-7, AT-12) has corroborating multiplayer evidence per `L0-qatg-p003`.

**Spec basis.** §14: *«Все acceptance tests выше проходят в одиночном мире и минимум в тесте с двумя игроками.»*

**How to verify.** `L0-qatg-p002` steps 2–4.

**Not covered here.** Whether a "pass" additionally requires the pickaxe regression suite — that is a separate, unconditional pre-check (`L0-qatg-ac06`/`L0-qatg-r003`), not part of this criterion.


- **node**: L0-qatg-ac02

### AC Q-3 — No known duplication path across all four vectors (L0-qatg-ac03)

# AC Q-3 — No known duplication path across all four vectors

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-qatg-r005", "L0-qatg-ctr1"]` · `maps_to: ["§14", "§4", "§12"]`

**GIVEN** the craft-completion, death, reconnect, and server-restart handlers as implemented by `L0-once` and `L0-keep`
**WHEN** each vector is exercised in isolation and in the combinations §4/§12 name (e.g. death immediately followed by restart)
**THEN** at no point does more than one legitimately-owed instance of the bonded `andrew:web_sword` exist for the same craft event
**AND** the craft flag itself is never reset by any of the four vectors (§12).

**Spec basis.** §14: *«Нет известных способов дюпа через крафт, смерть или reconnect»* — read together with §4/§12/C-7's fourth vector, restart (`L0-qatg-r005`, `L0-qatg-ctr1`).

**How to verify.** The dup-cycle GameTests already scoped by `L0-keep` (`L0-keep-ac03`, `ac04`) and `L0-once`'s craft-race/restart tests, read together as one criterion at the gate level.

**Not covered here.** Admin/`/give` copies, which are explicitly outside the one-per-world budget (§3, §4) and not a dup by definition.


- **node**: L0-qatg-ac03

### AC Q-4 — Shipped packs carry no Preview/Experiments dependency (L0-qatg-ac04)

# AC Q-4 — Shipped packs carry no Preview/Experiments dependency

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-qatg-r004"]` · `maps_to: ["§14"]`

**GIVEN** `packs/behavior/manifest.json` and `packs/resource/manifest.json` after the Web Sword is merged
**WHEN** the manifests are inspected (`manifests.test.mjs`) and the world is loaded without the `Beta APIs` experiment toggled on
**THEN** the Web Sword loads and functions fully
**AND** neither manifest declares a dependency on `@minecraft/server-gametest` or any other Beta-only module.

**Spec basis.** §14: *«Нет обязательной зависимости от Experiments/Preview.»* · C-1 · `L0-qatg-r004`.

**How to verify.** Existing `manifests.test.mjs` (C-10 regression suite), extended to assert on the new Web Sword entries; a `bds:check` run with Experiments left at their default (off) state.

**Not covered here.** `packs/gametest` itself, which is dev-only by design and explicitly exempt (`L0-qatg-r004` scope note).


- **node**: L0-qatg-ac04

### AC Q-5 — Web Sword is a standalone-ready module (L0-qatg-ac05)

# AC Q-5 — Web Sword is a standalone-ready module

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-qatg-ent3"]` · `maps_to: ["§14"]`

**GIVEN** `L0-qatg-ac01` through `L0-qatg-ac04` all satisfied
**WHEN** `L0-qatg-p002` derives the `module_ready` subgate
**THEN** the Web Sword is reported ready to be treated as a completed, independent module
**AND** work may proceed to the next Stage-2 legendary weapon per the project's stage gate.

**Spec basis.** §14: *«После прохождения тестов Web Sword можно считать самостоятельным готовым модулем и переходить к следующему оружию.»*

**How to verify.** Purely derived — no independent evidence beyond the four prior criteria (`L0-qatg-ent3`, evaluation rule).

**Not covered here.** Anything about the *next* weapon's scope — out of bounds per `concept-boundary`'s deferred list.


- **node**: L0-qatg-ac05

### AC Q-6 — The Acceptance Matrix itself has no unclaimed or duplicate rows (L0-qatg-ac06)

# AC Q-6 — The Acceptance Matrix itself has no unclaimed or duplicate rows

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-qatg-p001", "L0-qatg-r001"]` · `maps_to: ["§13"]`

**GIVEN** the current state of all five siblings' `concept-acceptance-criterion` artifacts
**WHEN** `L0-qatg-p001` rebuilds the Acceptance Matrix
**THEN** `unclaimed_count = 0` and `duplicate_claim_count = 0` for all twelve §13 rows
**AND** any nonzero `pending_artifact_count` is reported as a named gap (which sibling, which row) rather than silently blocking the whole gate with no explanation.

**Spec basis.** Decomposition plan reduce pass #2 (*"the five feature children... funnel into `L0-qatg`... reports any test left unclaimed or claimed twice"*).

**How to verify.** `L0-qatg-p001`, re-run whenever a sibling publishes.

**Not covered here.** The individual correctness of any sibling's own AC — this criterion only checks that the aggregation is structurally sound.


- **node**: L0-qatg-ac06

### Glossary — Acceptance Test (AT) (L0-qatg-gl01)

**Acceptance Test (AT)** · RU: *«приёмочный тест»* (§13)

One of the twelve bulleted checks in spec §13. Not a code artifact by itself — a natural-language claim ("Web Sword виден в Creative Equipment...") that this analysis assigns a stable `AT-1`..`AT-12` id and an owning L1 component (`L0-qatg-ent1`). Distinguish from a **test suite** (a `.test.mjs` file) or a **GameTest scenario** (a `Test`-registered function): an AT is the *requirement*, the harness mechanisms are how it gets *evidenced*.

**Related**: **Definition of Done** — the five conditions that gate on all twelve ATs jointly; **Acceptance Matrix** — the table that tracks them.


- **node**: L0-qatg-gl01

### Glossary — Definition of Done (DoD) (L0-qatg-gl02)

**Definition of Done (DoD)** · RU: *«готовность первой версии»* (§14)

The five §14 conditions that together decide whether the Web Sword counts as a finished, standalone module: clean import, full acceptance coverage (single- and multi-player), no known duplication path, no mandatory Preview/Experiments dependency, and the derived "ready to proceed" conclusion. Modelled as `L0-qatg-ent3`.

The DoD is a **superset** of the twelve ATs, not a synonym for them — it adds gate-level conditions (dup-safety across all four vectors, the Preview-dependency check) that no single AT states on its own.

**Related**: **Acceptance Test** — the individual checks the DoD aggregates; **Release Gate** — the process (`L0-qatg-p002`) that evaluates the DoD.


- **node**: L0-qatg-gl02

### Glossary — Acceptance Matrix (L0-qatg-gl03)

**Acceptance Matrix** · analysis term, not present verbatim in the spec

The twelve-row table (`L0-qatg-ent2`) mapping each §13 AT to its owning L1 component, harness mechanism(s), environment, and current status. Built and refreshed by `L0-qatg-p001`. Deliberately a **reference structure** — it points at sibling `concept-acceptance-criterion` artifacts rather than restating their pass conditions, so it cannot drift out of sync with the artifact it summarises (`L0-qatg-adr1`).

Not to be confused with the **Definition-of-Done Gate** (`L0-qatg-ent3`), which is a smaller set of five conditions layered on top of the matrix, not the matrix itself.


- **node**: L0-qatg-gl03

### Glossary — Harness (L0-qatg-gl04)

**Harness** · analysis term, collective

The set of mechanisms that can produce verification evidence for this project: `npm test` (7 static/build-time suites), `bds:check` (`packs/selftest`, stable-API in-engine assertions), `bds:gametest` (`packs/gametest`, Beta-API `SimulatedPlayer` scenarios, dev-only), the **iPad visual pass** (manual, one device), and — situationally — a genuine two-client Docker BDS LAN session. Each has a disjoint blind spot (see `L0-qatg` component doc, harness table); no single mechanism is "the" harness, and the Acceptance Matrix exists precisely to record which mechanism backs which claim.

**Related**: **iPad Visual Pass** — the one harness mechanism this component cannot automate.


- **node**: L0-qatg-gl04

### Glossary — iPad Visual Pass (L0-qatg-gl05)

**iPad Visual Pass** · analysis term, referring to the C-11 manual-verification half of the loop

The manual, on-device check performed on the project's one iPad: Creative Equipment placement, icon rendering, RU/EN text display, and the actionbar cooldown readout. Exists because, per C-11, there is no macOS Bedrock client and BDS logs cannot confirm anything about how the client *renders* — only that the server-side state is correct. Distinguish from `bds:check`, which proves the same underlying facts (item exists, is enchantable) without needing the device at all, by asserting on the server side instead of observing the client.

Bound by ASM-010/Q-012: only one iPad is documented in the environment, which is why the two-player DoD requirement cannot be satisfied by this mechanism alone.


- **node**: L0-qatg-gl05

### AC-01 — Use on a valid target creates the 3×3×3 cube (L0-trap-ac01)

# AC-01 — Use on a valid target creates the 3×3×3 cube

**Source:** §13 — *«Use по валидной цели создаёт приблизительно полный 3×3×3 куб Cobweb вокруг центра.»* · **Owner after reduce:** `L0-qatg` · **Rules:** R-005, R-008

**GIVEN** a player in survival holding `andrew:web_sword`, ability off cooldown, standing in an open area with only ordinary replaceable blocks (air) within reach,
**WHEN** the player uses the item aimed at a valid target inside reach,
**THEN** exactly 27 cells — the resolved centre ± 1 on each of X, Y and Z — contain `minecraft:web`, and no cell outside that volume is modified.

**Strengthened deliberately.** The spec says *«приблизительно полный»* (approximately full), which would pass a cube offset by one on every axis. The test asserts **exact coordinates**, not a block count — otherwise the release gate is blind to ASM-008 / Q-011, the component's most likely silent defect.

**Blocked on Q-011** for the centre convention. Until it is answered, implement against ASM-008 (centre ± 1, centre cell included) and write the test so the expected coordinate set is a single named constant that one answer can flip.

**Surface:** GameTest on Docker BDS (`bds:gametest`).


- **node**: L0-trap-ac01

### AC-02 — Use out of reach creates nothing and starts no cooldown (L0-trap-ac02)

# AC-02 — Use out of reach creates nothing and starts no cooldown

**Source:** §13 — *«Use вне reach ничего не создаёт и не запускает cooldown.»* · §5, §12 · **Owner after reduce:** `L0-qatg` · **Rules:** R-002, R-004

**GIVEN** a player holding `andrew:web_sword` with the ability off cooldown, aimed at a point strictly beyond the reach bound with nothing solid in between,
**WHEN** the player uses the item,
**THEN** no block in the world changes, **AND** the ability remains immediately available — a second use in the next tick against a valid in-reach target succeeds.

The second half is the real assertion. "No cobweb appeared" is satisfiable by a broken implementation that also burned the cooldown; only an immediate successful retry proves the failure was free.

**Also assert the boundary.** A target at just under the reach bound must succeed and a target at just over it must fail, both measured from the eye. This is what pins ASM-017 to a real value and catches an off-by-one in the bound-check.

**Surface:** GameTest on Docker BDS.


- **node**: L0-trap-ac02

### AC-03 — Protected cells survive; the rest of the cube still fills (L0-trap-ac03)

# AC-03 — Protected cells survive; the rest of the cube still fills

**Source:** §13 — *«Контейнер/bedrock внутри объёма не уничтожается; допустимые соседние клетки заполняются.»* · §6 · **Owner after reduce:** `L0-qatg` · **Rules:** R-005, R-006

**GIVEN** a target whose 27-cell volume contains a **chest holding items**, a **bedrock** block, and at least one ordinary replaceable cell,
**WHEN** the ability activates successfully,
**THEN** the chest block still exists **with its full inventory intact**, the bedrock block still exists, every remaining ordinary cell contains `minecraft:web`, **AND** the cooldown starts — a partial cube is a success (R-005).

**Assert the inventory, not just the block.** A classifier that replaces the chest and re-places an empty one would pass a block-type check. Contents are the thing C-8 actually protects.

**Assert the `reason` codes.** `L0-trap-ecel.reason` must be `block-entity` for the chest cell and `indestructible` for the bedrock cell. Without this the test cannot distinguish "correctly skipped the chest" from "never reached the chest", and it is the whole point of the criterion.

**Extend per Q-013.** When the closed deny-list is confirmed, this criterion gains one case per newly named class. The unresolvable-safety case (`unclassified ⇒ skip`) needs its own case too.

**Surface:** GameTest on Docker BDS. The highest-value test in the component — its failure mode is unrecoverable player data loss.


- **node**: L0-trap-ac03

### AC-04 — Activation at the edge of the loaded area writes nothing outside it (L0-trap-ac04)

# AC-04 — Activation at the edge of the loaded area writes nothing outside it

**Source:** §12 — *«Игрок активирует способность у края загруженной области: не форсировать опасную запись в незагруженные чанки.»* · §6 · **Owner after reduce:** `L0-qatg` · **Rule:** R-007

**GIVEN** a player positioned so that part of the resolved 27-cell volume lies in an unloaded/inaccessible chunk,
**WHEN** the ability activates,
**THEN** cells inside the loaded area are filled normally, cells outside it are left untouched, **AND** no chunk is loaded, pinned or generated as a side effect of the activation, **AND** the handler raises no unhandled error.

**Why "no side-effect load" is asserted separately.** An implementation that force-loads to complete the cube would pass a naive "did the world break?" check while doing exactly what §12 calls dangerous. Assert the loaded-chunk set before and after.

**Test construction is the hard part.** Forcing a deterministic unloaded neighbour inside a GameTest structure is awkward; if it proves infeasible, the fallback evidence is (a) a unit-level test of the classifier's `unloaded ⇒ skip` rung with a stubbed reader, plus (b) a BDS log check that a far-edge activation produces no content error. Record whichever is used — an untested R-007 should not pass silently through the gate.

**Depends on ASM-020** (how "loaded" is probed on the stable surface).

**Surface:** GameTest on Docker BDS + `bds:check` log grep.


- **node**: L0-trap-ac04

### AC-05 — A melee swing creates no cobweb and starts no cooldown (L0-trap-ac05)

# AC-05 — A melee swing creates no cobweb and starts no cooldown

**Source:** §13 — *«Обычный melee-урон соответствует Diamond Sword и не создаёт паутину.»* · §7 · **Owner after reduce:** `L0-qatg` · **Rule:** R-001

**GIVEN** a player holding `andrew:web_sword` with the ability off cooldown,
**WHEN** the player attacks a mob or a block with a normal swing (left click / tap),
**THEN** no cobweb appears anywhere, **AND** the ability is still immediately available — a use in the next tick succeeds.

**Split ownership, stated explicitly.** §13's test bundles two claims. The **damage parity** half (*«соответствует Diamond Sword»*) belongs to `L0-item`, which owns §1 and §7's damage clause. This component owns only the **negative** half above. `L0-qatg` should expect two criteria to map onto this one §13 line and must not treat the duplicate mapping as a double-claim.

**This is the ASM-006 falsifier.** If use and attack are not distinct engine events, this test fails immediately and the component's whole activation model needs rework. Run it **first**, before any placement logic is written — it costs minutes and it gates the design.

**Surface:** GameTest on Docker BDS with a simulated player.


- **node**: L0-trap-ac05

### AC-06 — The ray stops at the wall; no targeting through obstructions (L0-trap-ac06)

# AC-06 — The ray stops at the wall; no targeting through obstructions

**Source:** §12 — *«Луч упирается в ближайший доступный блок: использовать фактически доступную целевую точку; не атаковать сквозь стены.»* · **Owner after reduce:** `L0-qatg` · **Rule:** R-003

**GIVEN** a player and a second player (or mob) separated by a solid one-block wall, both well inside the reach bound,
**WHEN** the first player uses the sword aimed directly at the obstructed target,
**THEN** the cube is centred at the wall-side point, **NOT** on or beyond the target, **AND** the activation is a **success** (cobweb placed, cooldown started) — a blocked ray resolves a target, it does not fail.

**Both halves are load-bearing.** "Does not reach through" without "still succeeds at the wall" would be an implementation that fails whenever anything is in the way, which no spec clause asks for. Assert `TargetResolution.kind = block` and a `centre` at the wall.

**No §13 test covers this.** It comes from §12 only, so `L0-qatg` must add it rather than map it. A through-wall regression would otherwise ship unnoticed and is a genuine PvP exploit.

**Surface:** GameTest on Docker BDS with a simulated player behind a wall.


- **node**: L0-trap-ac06

### AC-07 — Placed cobweb survives the caster leaving, and is ordinary world state (L0-trap-ac07)

# AC-07 — Placed cobweb survives the caster leaving, and is ordinary world state

**Source:** §12 — *«Игрок выходит сразу после активации: уже созданная паутина остаётся.»* · §5, §9 · **Owner after reduce:** `L0-qatg` · **Rule:** R-005

**GIVEN** a player who activates the ability successfully,
**WHEN** the player disconnects immediately afterwards, and later the world is saved and the server restarted,
**THEN** every placed cobweb block is still present and unchanged, **AND** it is `minecraft:web` — the vanilla block, carrying no custom state, marker or owner.

**Second half:** another player or a mob interacts with the cobweb by normal Minecraft rules (§9) — it slows movement, it breaks with shears or a sword, it drops string. No component logic mediates any of this.

**Negative assertion:** no despawn or expiry occurs. Cobweb cleanup is out of scope by decision (L0 boundary); if a future change introduces a timer, this criterion fails and that is the intended signal.

**Note on the cooldown half of §12's bullet.** The same spec line continues *«cooldown должен сохраняться настолько, насколько это требуется общей системой cooldown проекта»* — that clause belongs to `L0-cool` and is entangled with CTR-004 / Q-009. This criterion covers the **cobweb** half only.

**Surface:** GameTest for placement + Docker BDS restart check.


- **node**: L0-trap-ac07

### AC-08 — A successful activation, and only a successful one, arms the cooldown (L0-trap-ac08)

# AC-08 — A successful activation, and only a successful one, arms the cooldown

**Source:** §13 — *«После успешной способности повторное использование заблокировано 30 секунд.»* · §5, §8, §12 · **Owner after reduce:** `L0-qatg` · **Rules:** R-004, and the seam in CTR-007

**GIVEN** a player who has just successfully placed a trap,
**WHEN** the player uses the sword again before 30 s have elapsed,
**THEN** no new cobweb appears and no block changes.

**AND, conversely** — given a failed activation (out of reach, or blocked by an active cooldown), the world is bit-identical afterwards and no timer is started or extended.

**Shared criterion, explicitly.** The **timing** half — that the block lasts exactly 30 s and the actionbar counts down — belongs to `L0-cool` (§8). This component owns only the **ordering** half: *success arms it, failure does not*. `L0-qatg` should expect this §13 line to be claimed from two sides and reconcile rather than flag a double-claim.

**Test both directions.** Most implementations get "cooldown blocks re-use" right and "failure doesn't arm it" wrong, because the second only shows up as a player complaint. Assert a failed use followed by an immediate successful use.

**Surface:** GameTest on Docker BDS with a simulated player and a controlled clock.


- **node**: L0-trap-ac08

### AC-09 — Two clients see identical cobweb; concurrent activations resolve independently (L0-trap-ac09)

# AC-09 — Two clients see identical cobweb; concurrent activations resolve independently

**Source:** §13 — *«Два клиента в multiplayer видят одинаковую паутину и одинаковое состояние мира.»* · §9, §11 · **Owner after reduce:** `L0-qatg` · **Rule:** R-008

**GIVEN** two players connected to the same dedicated server,
**WHEN** player A activates the ability,
**THEN** both clients observe the same set of cobweb blocks at the same coordinates.

**AND** when both players activate in the same tick at different targets, **both** traps are created in full and correctly — neither activation is dropped, delayed or merged (§9: *«каждый успешный вызов обрабатывается независимо»*).

**AND** when both activate at **overlapping** targets in the same tick, the resulting world state is deterministic: the union of both cubes, with the second handler recording `already-web` for the shared cells (a no-op skip). Both players consume their cooldown; neither activation fails because of the other.

**Evidence path is contested.** §14 requires a ≥2-player test; the environment has one iPad and no second Bedrock client (ASM-010, **Q-012**). Proposed split: the **concurrency** assertions run as a GameTest with simulated players (proven in Stage 1); the **"both clients see the same thing"** assertion needs one genuine two-client session if any second device can be borrowed. `L0-qatg` owns resolving this — do not silently downgrade the criterion.

**Surface:** Docker BDS (`bds:gametest`) + one manual two-client pass if available.


- **node**: L0-trap-ac09

### Trap gact concept glossary term (L0-trap-gact)

**Activation** *(активация)*

One invocation of the Web Sword's active ability, triggered by **standard item use** on a held `andrew:web_sword` — right click on desktop, long press on touch (§5). An activation either **succeeds** (cobweb placed, cooldown consumed) or **fails free** (nothing written, cooldown untouched — R-004).

A melee attack is **not** an activation (§7, R-001). This distinction is the whole reason the sword is usable in combat, and rests on ASM-006.

**Synonyms**: Use, ability use, срабатывание способности.
**Not to be confused with**: *craft* (a one-per-world event owned by `L0-once`) or *swing/attack* (no effect, owned by `L0-item`'s §7 damage clause).


- **node**: L0-trap-gact

### Trap gchk concept glossary term (L0-trap-gchk)

**Loaded / accessible area** *(загруженная/доступная область)*

The region of the world the server currently has in memory and may safely read and write. Cells outside it are **skipped like protected cells** (R-007).

The spec treats this as a hard edge, not best effort: §6 says *«Не пытаться создавать паутину вне загруженной/доступной области»* and §12 calls a write at the boundary *«опасная запись»* — dangerous. The component may not force-load a chunk, pin a ticket, or attempt a speculative write and swallow the error to complete a cube.

Consequence: a player activating at the edge of the simulation distance gets a clipped cube, and that is correct behaviour.

How "loaded" is probed on the stable `@minecraft/server` surface is **ASM-020**.

**Synonyms**: loaded chunks, simulation area, доступная область.


- **node**: L0-trap-gchk

### Trap gcub concept glossary term (L0-trap-gcub)

**Cobweb cube** *(куб паутины 3×3×3)* — also **the trap**

The 27-cell volume centred on the target point, into which the ability writes real vanilla `minecraft:web` blocks (§5). Working geometry: centre ± 1 on each axis, centre cell included (ASM-008, contested by **Q-011**).

Key properties:

- **Real vanilla cobweb** — no custom block, no marker, no owner. It interacts with everyone by normal Minecraft rules (§9).
- **Permanent** — no expiry timer. It stays until players clear it (§5). Cleanup is out of scope by decision.
- **Partial is normal** — protected, occupied or unloaded cells are skipped and the rest are filled anyway (§6). A cube of 19 cells is a success, not a failure (R-005).

**Synonyms**: 3×3×3 cube, the trap, ловушка.


- **node**: L0-trap-gcub

### Trap gprb concept glossary term (L0-trap-gprb)

**Protected block** *(защищённый блок)* / **skipped cell**

A cell the ability refuses to overwrite. §6 names only examples — *«сундуки и аналогичные block entities»*, *«bedrock и другие явно защищённые»* — so the set is open and the working deny-list is **ASM-007 / Q-013**.

Current working definition: any cell containing an **entity**; any block carrying a **block entity** (chest, barrel, shulker box, hopper, furnace, brewing stand, sign, spawner, …); any **indestructible** block (bedrock, barrier, command block, end portal frame, …); and — by the deny-by-default rule — **anything not positively recognised as ordinary and replaceable** (R-006).

The asymmetry that sets the default: destroyed player storage is unrecoverable, a weak trap is a one-line tuning fix. So uncertainty always resolves to *skip*.

**Synonyms**: protected cell, skipped cell, non-replaceable block.
**Antonym**: *ordinary replaceable block* — air, fluids, grass, plants and other soft vanilla blocks.


- **node**: L0-trap-gprb

### Trap greh concept glossary term (L0-trap-greh)

**Reach** *(reach-зона, допустимая дистанция)*

The maximum distance from the activating player at which a target may resolve. Defined by the spec as **ordinary survival interaction/melee reach** — *«без искусственного дальнего луча»* (§5). A candidate beyond it is not a target: the activation fails and costs nothing (R-002, R-004).

Reach is the ability's balance lever and the spec guards it in three places (§5, §12, and the L0 boundary's "excluded by decision" list). It is implemented as **one named constant** used both for the ray length and for the final bound-check.

The concrete numeric value, and whether Creative-mode reach differs, are **ASM-017** — unresolved.

**Synonyms**: interaction reach, melee reach, допустимая дистанция.


- **node**: L0-trap-greh

### Trap gtgt concept glossary term (L0-trap-gtgt)

**Target point** *(целевая позиция)* / **targeting ray**

The single block cell the cobweb cube is centred on, and the server-side ray that finds it.

The ray is cast once per activation from the player's eye along the view vector, bounded by **reach**, and **stops at the first solid block** — *«Луч упирается в ближайший доступный блок»* (§12). Hitting a wall is a normal resolution, not a failure; the reachable point at the wall becomes the target (R-003). Targeting through a wall is forbidden.

§5 allows three target forms — a point on a block, a player/living entity, or a point immediately next to the owner — all of which collapse into one centre cell before the cube is expanded (`L0-trap-etgt`).

**Synonyms**: raycast, целевая точка, target resolution.
**Not**: a long-range or custom ray — explicitly excluded (§5).


- **node**: L0-trap-gtgt

