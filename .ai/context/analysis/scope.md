---
title: Scope
type: analysis
generated_at: "2026-09-21T21:24:41.674Z"
source_channel: rollout
node_id: rollout-scope
aliases: ["rollout-scope","scope"]
is_a: ["rollout","scope"]
relates_to: ["L0-cool-ac01","L0-cool-ac02","L0-cool-ac03","L0-cool-ac04","L0-cool-ac05","L0-item-ac01","L0-item-ac02","L0-item-ac03","L0-item-ac04","L0-keep-ac01","L0-keep-ac02","L0-keep-ac03","L0-keep-ac04","L0-keep-ac05","L0-keep-ac06","L0-once-accp1","L0-once-accp2","L0-once-accp3","L0-once-accp4","L0-once-accp5","L0-once-accp6","L0-once-accp7","L0-once-accp8","L0-qatg-ac01","L0-qatg-ac02","L0-qatg-ac03","L0-qatg-ac04","L0-qatg-ac05","L0-qatg-ac06","L0-trap-ac01","L0-trap-ac02","L0-trap-ac03","L0-trap-ac04","L0-trap-ac05","L0-trap-ac06","L0-trap-ac07","L0-trap-ac08","L0-trap-ac09"]
priority: 510
---

# Scope

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

### Cool ac01 concept acceptance criterion (L0-cool-ac01)

**AC-COOL-1.** GIVEN a player successfully triggers the Web Sword ability (cobweb cube placed), WHEN they attempt to use the sword again within 30 seconds, THEN the ability does not trigger, no new cobweb is placed, and the player's cooldown record is unchanged by the failed attempt.

Source: §13 — *«После успешной способности повторное использование заблокировано 30 секунд.»* Grounded in R-cool-001, R-cool-002.


- **level**: 2

### Cool ac02 concept acceptance criterion (L0-cool-ac02)

**AC-COOL-2.** GIVEN a player's Web Sword ability is on cooldown, WHEN exactly 30 seconds (600 ticks) have elapsed since the successful activation that started it, THEN `isReady` returns true and the next use attempt is allowed to proceed to targeting.

Source: §8 — *«Когда cooldown закончился, способность снова доступна.»* Grounded in R-cool-001.


- **level**: 2

### Cool ac03 concept acceptance criterion (L0-cool-ac03)

**AC-COOL-3.** GIVEN a player is holding `andrew:web_sword` and it is on cooldown, WHEN an actionbar render tick runs, THEN the actionbar shows the remaining time as a localized (RU and EN, per client locale) string sourced from a translate key in `L0-item`'s catalogue — never a hardcoded literal.

Source: §8, §10. Grounded in R-cool-004, R-cool-005.


- **level**: 2

### Cool ac04 concept acceptance criterion (L0-cool-ac04)

**AC-COOL-4.** GIVEN a player's Web Sword use attempt fails reach validation (no valid target, or target out of range), WHEN the failed attempt is evaluated, THEN `start()` is never called, no cooldown is started, and any pre-existing cooldown timer for that player is left exactly as it was.

Source: §5 — *«cooldown не запускается»*; §12 edge case. Grounded in R-cool-002.


- **level**: 2

### Cool ac05 concept acceptance criterion (L0-cool-ac05)

**AC-COOL-5.** GIVEN no player on the server is currently holding an item registered with the cooldown service, WHEN the actionbar render interval fires, THEN it performs no per-player read or write work beyond its own holder-filter check — verifiable by a GameTest asserting the loop short-circuits on an empty holder set.

Source: C-4; decomposition plan's per-tick scoping note. Grounded in R-cool-004.


- **level**: 2

### Item ac01 concept acceptance criterion (L0-item-ac01)

**Links** — `part_of: ["L0-item"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-item-r002", "L0-item-ent1"]`

GIVEN a world with the add-on loaded, WHEN a player opens the Creative inventory, THEN `andrew:web_sword` appears in the Equipment tab's sword group, in the unfiltered "All" catalogue, and via Creative Search — AND `/give <player> andrew:web_sword` succeeds.

**Source:** §1, §13 (test 1).


- **level**: 2

### Item ac02 concept acceptance criterion (L0-item-ac02)

**Links** — `part_of: ["L0-item"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-item-r003", "L0-item-ent2"]`

GIVEN a crafting table, WHEN a player places 1× Cobweb in each of the four edge-center cells and 1× Diamond Sword in the center cell of a 3×3 grid (all other cells empty), THEN exactly 1× `andrew:web_sword` is produced — AND any other arrangement (shifted, rotated off-pattern, wrong item counts, ingredients swapped) does **not** match.

**Source:** §2, §13 (test 2).


- **level**: 2

### Item ac03 concept acceptance criterion (L0-item-ac03)

**Links** — `part_of: ["L0-item"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-item-r001", "L0-item-asm1"]`

GIVEN a Web Sword used through an extended play session (many hits landed, blocks broken, extended time held), WHEN its state is inspected, THEN it shows no durability bar, cannot be consumed by use, and remains fully functional indefinitely — because no `minecraft:durability` component is present on the item.

**Source:** §1, §13 (test 5). Depends on ASM-005/Q-007 resolving in the assumed direction (`L0-item-asm1`) — if enchantability and durability-omission turn out incompatible, this AC and `L0-item-r001` must be revisited together.


- **level**: 2

### Item ac04 concept acceptance criterion (L0-item-ac04)

**Links** — `part_of: ["L0-item"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-item-r004"]`

GIVEN a player holding a Web Sword, WHEN they perform a plain melee attack (not the item-Use ability) against an entity, THEN damage dealt equals vanilla Diamond Sword damage (adjusted only by any applied compatible enchantments), AND no Cobweb is placed anywhere, AND no cooldown timer starts or is consumed.

**Source:** §7, §13 (test 6). Shared boundary with `L0-trap`/`L0-cool` — this AC fails if either sibling reacts to the attack event instead of the Use event.


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

### AC-01 — Use on a valid target creates the 3×3×3 cube (L0-trap-ac01)

# AC-01 — Use on a valid target creates the 3×3×3 cube

**Source:** §13 — *«Use по валидной цели создаёт приблизительно полный 3×3×3 куб Cobweb вокруг центра.»* · **Owner after reduce:** `L0-qatg` · **Rules:** R-005, R-008

**GIVEN** a player in survival holding `andrew:web_sword`, ability off cooldown, standing in an open area with only ordinary replaceable blocks (air) within reach,
**WHEN** the player uses the item aimed at a valid target inside reach,
**THEN** exactly 27 cells — the resolved centre ± 1 on each of X, Y and Z — contain `minecraft:web`, and no cell outside that volume is modified.

**Strengthened deliberately.** The spec says *«приблизительно полный»* (approximately full), which would pass a cube offset by one on every axis. The test asserts **exact coordinates**, not a block count — otherwise the release gate is blind to ASM-008 / Q-011, the component's most likely silent defect.

**Blocked on Q-011** for the centre convention. Until it is answered, implement against ASM-008 (centre ± 1, centre cell included) and write the test so the expected coordinate set is a single named constant that one answer can flip.

**Surface:** GameTest on Docker BDS (`bds:gametest`).


- **level**: 2

### AC-02 — Use out of reach creates nothing and starts no cooldown (L0-trap-ac02)

# AC-02 — Use out of reach creates nothing and starts no cooldown

**Source:** §13 — *«Use вне reach ничего не создаёт и не запускает cooldown.»* · §5, §12 · **Owner after reduce:** `L0-qatg` · **Rules:** R-002, R-004

**GIVEN** a player holding `andrew:web_sword` with the ability off cooldown, aimed at a point strictly beyond the reach bound with nothing solid in between,
**WHEN** the player uses the item,
**THEN** no block in the world changes, **AND** the ability remains immediately available — a second use in the next tick against a valid in-reach target succeeds.

The second half is the real assertion. "No cobweb appeared" is satisfiable by a broken implementation that also burned the cooldown; only an immediate successful retry proves the failure was free.

**Also assert the boundary.** A target at just under the reach bound must succeed and a target at just over it must fail, both measured from the eye. This is what pins ASM-017 to a real value and catches an off-by-one in the bound-check.

**Surface:** GameTest on Docker BDS.


- **level**: 2

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


- **level**: 2

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


- **level**: 2

### AC-05 — A melee swing creates no cobweb and starts no cooldown (L0-trap-ac05)

# AC-05 — A melee swing creates no cobweb and starts no cooldown

**Source:** §13 — *«Обычный melee-урон соответствует Diamond Sword и не создаёт паутину.»* · §7 · **Owner after reduce:** `L0-qatg` · **Rule:** R-001

**GIVEN** a player holding `andrew:web_sword` with the ability off cooldown,
**WHEN** the player attacks a mob or a block with a normal swing (left click / tap),
**THEN** no cobweb appears anywhere, **AND** the ability is still immediately available — a use in the next tick succeeds.

**Split ownership, stated explicitly.** §13's test bundles two claims. The **damage parity** half (*«соответствует Diamond Sword»*) belongs to `L0-item`, which owns §1 and §7's damage clause. This component owns only the **negative** half above. `L0-qatg` should expect two criteria to map onto this one §13 line and must not treat the duplicate mapping as a double-claim.

**This is the ASM-006 falsifier.** If use and attack are not distinct engine events, this test fails immediately and the component's whole activation model needs rework. Run it **first**, before any placement logic is written — it costs minutes and it gates the design.

**Surface:** GameTest on Docker BDS with a simulated player.


- **level**: 2

### AC-06 — The ray stops at the wall; no targeting through obstructions (L0-trap-ac06)

# AC-06 — The ray stops at the wall; no targeting through obstructions

**Source:** §12 — *«Луч упирается в ближайший доступный блок: использовать фактически доступную целевую точку; не атаковать сквозь стены.»* · **Owner after reduce:** `L0-qatg` · **Rule:** R-003

**GIVEN** a player and a second player (or mob) separated by a solid one-block wall, both well inside the reach bound,
**WHEN** the first player uses the sword aimed directly at the obstructed target,
**THEN** the cube is centred at the wall-side point, **NOT** on or beyond the target, **AND** the activation is a **success** (cobweb placed, cooldown started) — a blocked ray resolves a target, it does not fail.

**Both halves are load-bearing.** "Does not reach through" without "still succeeds at the wall" would be an implementation that fails whenever anything is in the way, which no spec clause asks for. Assert `TargetResolution.kind = block` and a `centre` at the wall.

**No §13 test covers this.** It comes from §12 only, so `L0-qatg` must add it rather than map it. A through-wall regression would otherwise ship unnoticed and is a genuine PvP exploit.

**Surface:** GameTest on Docker BDS with a simulated player behind a wall.


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

