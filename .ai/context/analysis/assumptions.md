---
title: Assumptions
type: analysis
generated_at: "2026-10-02T19:12:17.142Z"
source_channel: rollout
node_id: rollout-assumptions
aliases: ["rollout-assumptions","assumptions"]
is_a: ["rollout","assumptions"]
relates_to: ["L0-airs-as01","L0-airs-as02","L0-bast-as01","L0-bast-as02","L0-bast-as03","L0-infr-as01","L0-infr-as02","L0-infr-as03","L0-infr-as04","L0-infr-as05","L0-lgnd-as01","L0-lgnd-as02","L0-lgnd-as03","L0-lgnd-as04","L0-lgnd-as05","L0-lgnd-as06","L0-lgnd-as07","L0-lgnd-as08","L0-lgnd-as09","L0-lgnd-as10","L0-lgnd-as11","L0-lgnd-as12","L0-lgnd-as13","L0-lgnd-as14","L0-lgnd-as15","L0-lgnd-as16","L0-loot-asm1","L0-loot-asm2","L0-loot-asm3","L0-magn-asbd","L0-magn-asfl","L0-magn-asit","L0-magn-aslh","L0-magn-asrg","L0-orbc-as01","L0-orbc-as02","L0-orbc-as03","L0-orbc-as04","L0-orbc-as05","L0-orbc-as06","L0-orbc-as07","L0-orbc-as08","L0-pick-asm1","L0-pick-asm2","L0-pick-asm3","L0-pntr-as01","L0-pntr-as02","L0-pntr-as03","L0-pntr-as04","L0-pntr-as05","L0-pntr-as06","L0-pntr-as07","L0-pntr-as08","L0-ring-as01","L0-ring-as02","L0-ring-as03","L0-ring-as04","L0-ring-as05","L0-ring-as06","L0-ring-as07","L0-ring-as08","L0-sauc-as01","L0-sauc-as02","L0-sauc-as03","L0-sauc-as04","L0-sauc-as05","L0-sauc-as06","L0-scyt-as01","L0-scyt-as02","L0-scyt-as03","L0-scyt-as04","L0-strf-as01","L0-strf-as02","L0-strf-as03","L0-strf-as04","L0-strf-as05","L0-strf-as06","L0-ufoc-as01","L0-ufoc-as02","L0-ufoc-as03","L0-ufoc-as04","L0-ufoc-as05","L0-webs-as01","L0-webs-as02","L0-webs-as03","L0-wind-as01","L0-wind-as02","L0-wind-as03","L0-wind-as04","L0-wind-as05","L0-wind-as06","L0-wind-as07","L0-wind-as08","L0-wind-as09","L0-wind-as10","L0-wind-as11","L0-wind-as12","L0-wrdn-as01","L0-wrdn-as02"]
priority: 580
---

# Assumptions (CAN_ASSUME)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Assumption (CAN_ASSUME) — the Airship's two doors sit on the short ends of the long axis (L0-airs-as01)

# Assumption (CAN_ASSUME) — the Airship's two doors sit on the short ends of the long axis

**Gap.** §5.2 says only "две обычные двери на противоположных сторонах" — opposite sides, without saying which axis (the 15-block long sides or the 7-block short ends).

**Assumption.** Doors sit on the two short ends (the 7-block-wide faces), i.e. at the bow and stern of the elongated-oval gondola, consistent with "вытянутый овальный объём" (an elongated oval reads lengthwise, so entry naturally sits at the ends, and this keeps both doors clear of the 4 rooms/corridor's long side walls where chest and lamp geometry is denser).

**Impact if wrong.** Purely a template-geometry choice for `infr`'s builder (`L0-adr-tmpl`). It does not change chest count, chest positions relative to rooms, the spawner position, or any generation/collision/altitude rule. If the client meant the long sides, only the door local points (and the `rotateLocal` inputs derived from them) need to move; no other artifact in this deep-dive depends on the axis chosen.






### Assumption (CAN_ASSUME) — the 40–100 ring is sampled at several seeded angles/radii, not a single point (L0-airs-as02)

# Assumption (CAN_ASSUME) — the 40–100 ring is sampled at several seeded angles/radii, not a single point

**Gap.** §5.6 fixes the ring's inner and outer radius (40, 100) but never says how many candidate positions are tried inside it, or in what order, before giving up.

**Assumption.** `strf.searchRing` samples a deterministic, seeded sequence of points across the annulus — e.g. a fixed number of angles (8–16) crossed with a small number of radii between 40 and 100 — and validates them in that fixed order, stopping at the first `valid` result (mirrors the discovery roll's determinism, `L0-strf-r001`). This gives every Windmill instance a real chance at a linked Airship without an unbounded or non-deterministic search.

**Impact if wrong.** Only the practical *success rate* and *distribution* of linked Airships around Windmills changes (denser or sparser sampling), not any pass/fail rule in this deep-dive. Test 33 (linked attempt happens regardless of a nearby independent Airship) passes under any reasonable sampling density, since it only checks that the attempt is *made*, not how many candidates were probed. If the client wants an exhaustive scan of the annulus instead, `airs.tryLinked` and `L0-airs-e002` are the only call sites that would need to change.






### Bast as01 concept assumption (L0-bast-as01)

**ASM-bast-01 — "Suitable chunk" for the 5% Nether roll** `CAN_ASSUME`

The spec's "подходящий Nether-чанк" (suitable Nether chunk) is not formally defined beyond "not a lava ocean, needs solid support." Assume: a chunk is suitable when its surface/support area can host the ~20×20 footprint on solid, non-lava-ocean terrain without requiring artificial leveling — unlike the Windmill spawn-area rule, which explicitly allows site preparation; Mini Bastion has no such fallback. Suitability is defined by profile `netherFloor` of `strf`, with thresholds in `L0-xasm4` §3 (row 3 of the `L0-adr-body` crosswalk).

**Impact if wrong:** If suitability is defined too loosely, bastions could generate partially clipped into terrain or floating over voids. If too strict, the effective generation rate drops well below the nominal 5%, which would fail AC-bast-01's statistical test.

**Source:** §14.2 (silent on the exact suitability algorithm).






### Bast as02 concept assumption (L0-bast-as02)

**ASM-bast-02 — Loot tables are invoked as real vanilla references, not reimplemented** `CAN_ASSUME`

Assume "real vanilla Bastion Remnant treasure/regular loot table" means calling the actual vanilla loot table identifiers/behavior via the Script API (e.g. a `LootTable` reference or fill-container-with-loot pathway) rather than hand-authoring a lookalike table.

**Impact if wrong:** A hand-authored approximation could silently drift from vanilla drop rates/categories (e.g. missing rare items), breaking the "genuine vanilla loot" intent of §14.4 without being caught by casual testing.

**Source:** §14.4 (names the tables but not the implementation mechanism).






### Bast as03 concept assumption (L0-bast-as03)

**ASM-bast-03 — Superseded: no per-instance init marker**

Superseded: idempotency is the single region-sharded registry (`L0-strf-r008`, `L0-adr-strs`); there is no per-instance marker. This assumption is void — nothing in the code refers to it.

**Source:** §14.6 (states the idempotency requirement, not the mechanism); the mechanism is `L0-strf-r008`.






### Assumption: the GameTest harness is not one of Stage 0's five closing criteria (L0-infr-as01)

# Assumption: the GameTest harness is not one of Stage 0's five closing criteria

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]` · `relates_to: ["L0-infr-ac06"]`

**Assumed**: `npm run bds:gametest` is an additional verification lane layered on top of Stage 0, not a hard gate for Stage 0 itself. The original `stage-0-infrastructure.md` (2026-09-20) lists exactly 5 closing criteria — build, JSON validation, BDS-in-Docker load, iPad checks, first git commit — and does not mention GameTest or SimulatedPlayer at all. The GameTest harness (`scripts/bds-gametest.mjs`, `decision-q-012`) was introduced later (2026-09-21) as a lane for Stage 1 (Miner's Pickaxe behavior) and Stage 2 (legendary-weapon multiplayer proof).

**Impact if wrong**: if GameTest is actually meant to gate Stage 0's "done" status, then Stage 0 is not closed by `build` + `validate` + `bds:check` alone, and AC06 (`L0-infr-ac06`) would need to move from "additional lane" to "Stage-0 blocking criterion" in the rollups.






### Assumption: verification runs locally, not in hosted CI (L0-infr-as02)

# Assumption: verification runs locally, not in hosted CI

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]`

**Assumed**: no CI/CD pipeline automates `build`/`bds:check`/`bds:gametest` on push; these commands are run manually by the developer, or by the ai-kit autopilot task loop, on the Mac mini itself. No `.github/workflows` or equivalent was found in the repo listing reviewed for this deep-dive, and the `bds` channel's design assumes local, macOS-specific facts that a typical hosted runner wouldn't have: Docker Desktop already running (`assertDockerRunning` just checks, never installs, Docker), `en0`/`en1` LAN interfaces for `detectLanIp()`, and Apple Silicon + Rosetta for the image's `linux/amd64` platform pin.

**Impact if wrong**: if a hosted CI runner is later introduced, `bds:up`'s LAN-IP detection and the iPad-facing address it prints become meaningless there (no iPad can reach a CI runner's network), and `assertDockerRunning`'s guidance ("start Docker Desktop") would need a CI-specific branch.






### Assumption (CAN_ASSUME) — statistical chunk-roll check sample size and tolerance are infra's to pick (L0-infr-as03)

# Assumption (CAN_ASSUME) — statistical chunk-roll check sample size and tolerance are infra's to pick

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]` · `relates_to: ["L0-infr-p006", "L0-infr-r006", "L0-xq2"]`

**Gap**: no raw source specifies how many synthetic chunk samples the statistical check should draw, or what deviation from the configured rate (1 %/2 %/5 %) counts as a pass. `L0-xq2` even leaves the rate constants themselves open to a pending client answer.

**Assumed**: infra picks a sample size and tolerance band per structure at implementation time (e.g. large enough that a binomial confidence interval around the configured rate is narrow relative to the gap between adjacent structures' rates — 1 % vs 2 % vs 5 %), driven directly through `strf`'s own roll function rather than a reimplementation (`L0-infr-r006`).

**Impact if wrong**: too small a sample/tight a tolerance → the check flakes on a correct implementation and blocks autopilot merges on noise; too loose → it never catches a broken roll (wrong constant, biased hash). If `L0-xq2`'s answer changes the rate constants, this check's expected values move with them — it must read the constants from `strf`'s config table, never hardcode them.






### Assumption (CAN_ASSUME) — \ (L0-infr-as04)

# Assumption (CAN_ASSUME) — "restart" for the idempotency check means a same-volume server restart, not `bds:down`/`bds:up`

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]` · `relates_to: ["L0-infr-p007", "L0-adr-strs"]`

**Gap**: no ADR specifies how the restart/idempotency check restarts BDS. The existing `bds:check`/`bds:up` flow re-stages the data directory fresh on every run (`L0-infr-p002`), which would erase the very world state the idempotency check needs to survive a restart.

**Assumed**: the check restarts the *server process* while keeping the same `data/` volume/world (e.g. `docker compose restart`, or stopping and restarting the container without re-staging) — distinct from `bds:down` + `bds:up`, which intentionally resets to a clean world.

**Impact if wrong**: if the intended check is actually "reinstall the add-on into a fresh world and confirm first-init still runs exactly once" rather than "survive a mid-lifetime restart," the check needs `bds:up`'s re-stage semantics instead, and both scenarios (fresh-install idempotency vs. restart idempotency) may be needed, not just one.






### Confirmed as built — structure template source files live under `src/structures/templates/` (L0-infr-as05)

# Confirmed as built — structure template source files live under `src/structures/templates/`

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]` · `relates_to: ["L0-adr-tmpl", "L0-infr-e005", "L0-infr-p005"]`

**Gap**: `L0-adr-tmpl` says the four templates are "layered block palettes or builder functions in TS/JSON" but does not fix a directory. Stage 0's fixed layout rule (`L0-infr-r003`) predates structures entirely.

**Assumed**: sources live under `src/structures/templates/` (one module per structure), following the existing per-feature convention of `src/legendary/`, `src/websword/`, etc., read by `scripts/build-structures.mjs` at build time.

**Impact if wrong**: purely a path/naming detail — `L0-infr-r003`'s fixed-layout table would need one more row, and `build-structures.mjs`'s import paths would move; no behavioral consequence.






### Lgnd as01 concept assumption (L0-lgnd-as01)

**ASM-lgnd-01 — decided 2026-09-24 (decision-legendary-rules-obschie-dlya-vseh-legendarnyh-vk): loss return applies to all legendaries, shipped in ed7558b.**

Indestructibility and Void return cover the Web Sword as well as the Scythe ("по общим правилам", by the general rules). The craft right is still not reopened.

**Impact if wrong:**
- **(b) Scythe only:** `returnOnLoss` becomes a per-def flag set to false for the Web Sword. That is a one-line change, and ac09 is inverted for the Web Sword.
- **(c) not in v3:** drop `L0-lgnd-p003`, the owed/gen parts of ent4, ad02, ad03, ac08–ac10 and ac12. That removes about 30 % of this component's effort.






### Lgnd as02 concept assumption (L0-lgnd-as02)

**ASM-lgnd-02: The Scythe's key prefix is `sc` and its ability key is `scythe_of_calamity`.**

No source names them. They mirror the Web Sword's `ws` / `web_sword`.

**Impact if wrong:** none until the first world ships with them. After that, the names are frozen by the same logic as `L0-lgnd-r006`.






### Lgnd as03 concept assumption (L0-lgnd-as03)

**ASM-lgnd-03: The stable 2.10.0 API raises `world.beforeEvents.entityRemove` and `entitySpawn` for `minecraft:item` entities, without a removal reason.**

The removals assumed to raise the event: falling below the world floor, lava/fire, cactus, explosions and despawn. Because the event gives no reason, pickup vs. loss is inferred (`L0-lgnd-p003` step 3).

**Impact if wrong:**
- If the Void kill raises no `entityRemove`, the watcher's `y < heightRange.min` check becomes the only Void path. It still works.
- If some destruction cause raises nothing, that cause is not covered, and ac09 narrows.

This must be measured on BDS 1.26.51.x first, as was done for retention path A/B.






### Lgnd as04 concept assumption (L0-lgnd-as04)

**ASM-lgnd-04: No stable item component makes a custom item entity immune to lava, fire, cactus or explosions.**

So "must not be destroyed by ordinary means" (Scythe §1) is realised as *destroyed, then immediately re-issued to the last holder*, not as physical immunity.

**Impact if wrong:** if such a component exists on 1.26.50 (C-1), fire, lava and explosions become prevention instead of recovery. Most gen bumps disappear, and the stale-copy surface shrinks. The Void path is still needed.






### Lgnd as05 concept assumption (L0-lgnd-as05)

**ASM-lgnd-05: Unmarked (Creative) copies keep casting.**

The shipped `trap.ts` checks only `isWebSword`, never the mark. `src/gametest/main.ts` hands out unmarked `new ItemStack(WEB_SWORD_ID)` for the trap scenarios (checked). So the dispatcher treats an unmarked legendary as castable, with its cooldown keyed by the player. Only *stale* marked stacks are barred.

**Impact if wrong:** requiring a mark to cast would break the Web Sword trap GameTests (C-10). It would also make Creative testing on the iPad impossible.






### Lgnd as06 concept assumption (L0-lgnd-as06)

**ASM-lgnd-06: Ledger sizes stay far below the dynamic-property string limit (about 32 KB).**

Admin `give` copies are rare, and each owed entry is about 200 chars.

**Impact if wrong:** a long-running test world with many lost admin copies could overflow `_owed`. The mitigation is to drop the oldest `despawn` entries and log a line. That loses those debts, which in practice means admin copies only.






### Lgnd as07 concept assumption (L0-lgnd-as07)

**ASM-lgnd-07: Bedrock never raises `itemUse` for an off-hand custom item, and `minecraft:allow_off_hand` works on a custom sword and a custom hoe in 1.26.50.**

The off-hand ability is therefore reachable only through a main-hand legendary press (Q-019 a).

**Impact if wrong:**
- If `allow_off_hand` is rejected for these items, the two-hand ACs (ac04–ac06) cannot be tested, and Q-019 degrades to (b): HUD only.
- If an off-hand Use event does exist, the dispatcher gets a second trigger with the same priority rule.






### Lgnd as08 concept assumption (L0-lgnd-as08)

**ASM-lgnd-08: "Main hand on cooldown" (Scythe §6) also covers "main hand busy".**

So while a Scythe volley is in flight, a ready off-hand Web Sword fires on the next Use press.

**Impact if wrong:** if busy should swallow the press instead, one condition in `L0-lgnd-p004` changes and ac05's busy variant flips. In gameplay terms, the player could not web-trap a target mid-volley.






### Lgnd as09 concept assumption (L0-lgnd-as09)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r010", "L0-stgt", "L0-lgnd-p007"]
---
**ASM-lgnd-09: Shadow Blade hiding is stored as `andrew:hidden_until` in epoch milliseconds.**

Scythe §3 excludes a player hidden by Shadow Blade's active ability, but no source defines Shadow Blade or how its hidden state is stored. `L0-lgnd-r010` fixes a player dynamic property `andrew:hidden_until` holding a `Date.now()` deadline, the same clock as cooldowns (ticks restart with the script engine; absolute time stops with `dodaylightcycle false`, measured on BDS 1.26.51.1). Earlier lgnd artifacts cite this as "ASM-020"; no such parent assumption exists in the KV, so this artifact is the record.

**Impact if wrong:** low and local. If Shadow Blade arrives using a tag, an effect (invisibility) or a tick-based deadline, only the body of `isHiddenFromTargeting` changes; `L0-stgt` and the `/andrew:hide` test seam keep their call sites.






### Lgnd as10 concept assumption (L0-lgnd-as10)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-cx09", "L0-lgnd-p003", "L0-lgnd-ad03", "L0-lgnd-cx06"]
---
**ASM-lgnd-10: A 40-tick loss check is fast enough to catch the Void before the engine kills the item. A hopper is the only non-player collector that matters.**

`recovery.ts` checks the watched entities every 40 ticks (2 s). An item that falls below `heightRange.min` is assumed to still exist at the next check, and the code removes it itself. The pickup heuristic looks only at players and at the container at the spot or one block below.

**Impact if wrong:**
- **The engine kills Void items within 2 s.** Classification then falls to "vanished from the ground", which gives the same outcome: the item is returned. Only the log line differs, so the impact is low.
- **Allays, hopper minecarts or hopper chains matter in practice.** A duplicate becomes possible (`cx09` item 2).

This must be measured on BDS 1.26.51.x.






### Lgnd as11 concept assumption (L0-lgnd-as11)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-as05", "L0-lgnd-r012", "L0-lgnd-r014", "L0-lgnd-ad08"]
---
**ASM-lgnd-11: Unmarked copies (vanilla `/give`, Creative) are ordinary items. They cast, but get no legendary protection.**

Orbital §4 allows these copies "for testing". Spec AC-20 says "the Orbital Cannon and all legendary weapons survive death and ordinary destruction", but does not say whether test copies are included.

What unmarked copies get under this assumption:
- **Cast:** yes, sharing the player's cooldown (Orbital §7, AC-17; `as05`).
- **Protection:** none. No death retention, loss return or `protectLegendariesIn` move. They die, burn and vanish as vanilla items.

Why:
- Each protection writes a durable token.
- Unmarked copies are unlimited, so protecting them grows `_owed`/`_pending` without bound (`as06`).
- It protects nothing scarce.

**Impact if wrong.** If the client wants every copy protected, the gate stamps `origin: "admin"` on the first inventory sighting of an unmarked `itemId` (no flag change).
- This is one branch in `craftgate.ts`.
- The owed list then needs a cap (drop the oldest `admin` entries).
- The `ac09` "unmarked destroyed as vanilla" clause inverts.






### Lgnd as12 concept assumption (L0-lgnd-as12)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p008", "L0-lgnd-r013", "L0-lgnd-ad10", "L0-xasm7", "L0-adr-ochg"]
---
**ASM-lgnd-12: Engine behaviour behind `protectLegendariesIn` (probe on BDS 1.26.51.x)**

1. `Dimension.getBlocks(volume, { includeTypes })` is stable in `@minecraft/server` 2.10.0. It filters engine-side, so a query of about 9³ (one RMB detonation) or about 5×5×384 (one LMB column) costs well under 1 ms per call.
2. `block.getComponent("inventory").container` is readable and writable for chests, barrels, hoppers, shulker boxes and the other inventory blocks, and `setItem(i)` removes a slot.
3. `setType("minecraft:air")` on a container **deletes** its contents without spawning item entities. That is the reason the extraction has to come before it.
4. `createExplosion` on a container **spills** its contents as new item entities. That is the reason RMB suppression must exempt legendaries.
5. `dimension.spawnItem(stack, loc)` keeps the stack's dynamic properties (the mark). The shipped death path B already relies on this for re-grant.

**Impact if wrong.**
- If (1) is not stable or is slow: iterate `getBlock` over the volume inside the Cannon's own removal job (pass a per-block `protectBlock(block)` instead). The cost moves into `pntr`'s job budget.
- If (3) spills contents: tier 1 is still needed for RMB, and the LMB step becomes a safety net.
- If (5) drops properties: re-drop through `new ItemStack` plus a re-stamp.






### Lgnd as13 concept assumption (L0-lgnd-as13)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad08", "L0-lgnd-r014", "L0-lgnd-p001", "L0-lgnd-ac15"]
---
**ASM-lgnd-13: A recipe can output a hidden token item that looks like the weapon, and the swap is invisible in practice.**

This assumes all of the following on 1.26.50 / BDS 1.26.51.x:
- A shaped recipe's `result` can be a custom item with `menu_category: none`.
- The crafting-table and 2×2 previews and the recipe book show its icon and localized name. Given the same `minecraft:icon` and a lang name equal to the weapon's, the result looks the same as the real weapon.
- `playerInventoryItemChange` fires when the token reaches any inventory slot. That includes a click-craft that leaves it on the cursor and is then placed, and the iPad craft button that moves it straight into the inventory.
- Replacing it in the next tick causes no client flicker that matters.
- A vanilla `/give @p andrew:<item>_crafted` is possible but obscure, and it would claim. That is accepted: it is the documented way to *simulate* a craft in tests.

**Impact if wrong.**
- If the recipe book hides `menu_category: none` results, set the category to `items` with `is_hidden_in_commands`, or accept the token being visible in Creative search.
- If `playerInventoryItemChange` misses the cursor-to-drop path (the player throws the crafted token straight out of the UI), the token claims later, when it is picked up. The outcome is the same.
- If the whole approach fails, fall back to `ad08` rejected (c) and document that `/give` claims.






### Lgnd as14 concept assumption (L0-lgnd-as14)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad09", "L0-lgnd-r015", "L0-lgnd-p009", "L0-xasm10"]
---
**ASM-lgnd-14: LMB with an off-hand Cannon does nothing. "Attack" is a main-hand action only.**

Orbital §7 shows the HUD for either hand. Orbital §6 gives two modes, but does not say which hand an attack comes from. Vanilla swings with the main-hand item, and `entityHitBlock` reports the main-hand context. An off-hand Cannon therefore:
- responds to **Use** only, through a main-hand legendary press (`as07`, hand priority);
- never responds to LMB.

**Impact if wrong.** If the client expects LMB to fire an off-hand Cannon while the main hand holds, for example, a pickaxe, `resolveActivation(player, "attack")` gains the off-hand fallback that `use` already has. That is one line. But mining with a pickaxe would then also fire the Cannon at every block you start to break, which is almost certainly unwanted. Confirm at the iPad DEMO.






### Lgnd as15 concept assumption (L0-lgnd-as15)

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






### Lgnd as16 concept assumption (L0-lgnd-as16)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ac22", "L0-lgnd-p002", "L0-magn"]
---
**ASM-lgnd-16: A magnet-fall death is an ordinary `entityDie`, and the magnet never touches a death drop before retention does.**

What this assumes:
- The magnet moves a held player by `applyKnockback` (UFO §6). The death is plain fall damage at landing.
- Death drops are spawned before `entityDie` (measured earlier). Retention path B empties the legendaries in the same handling, so no legendary item entity outlives the die tick.
- The magnet re-selects only iron dropped within 12 blocks of the hover point. A legendary is never iron, and death drops at ground level are about 37 blocks below it.

**Impact if wrong.**
- Suppose the player dies while still held, for example killed in the air by another player. Death drops would then spawn under the saucer, within 12 blocks. That is harmless for legendaries, because they are removed by retention and are not iron anyway.
- Suppose a future magnet change pulls **every** fresh drop near the hover point. A retained legendary is still safe, but an **unmarked** copy (no retention) would be pulled, which violates AC 13. `r016` item 1 covers this.






### Loot asm1 concept assumption (L0-loot-asm1)

**Assumption (CAN_ASSUME):** The spec says Golden Apple succeeds "at most once per chest" but doesn't say what happens when the weighted roll lands on Golden Apple again after it has already succeeded once. This deep-dive assumes either behavior is acceptable: (a) drop Golden Apple from the pool and renormalize remaining weights for that attempt, or (b) leave the pool unchanged and treat a repeat Golden Apple roll as a no-op/wasted attempt. Recommendation: (a), since it avoids attempts silently producing nothing, which could otherwise skew statistical tests that expect ~N items per chest.

**Impact if wrong:** if a statistical AC (`L0-loot-ac01`/`L0-loot-ac06`) is later written expecting a specific one of the two behaviors (e.g. counting non-empty attempts), the wrong choice could fail that test even though both are spec-compliant. Low blast radius — single-function fix.






### Loot asm2 concept assumption (L0-loot-asm2)

**Confirmed (Q4):** `L0-loot-p002` uses the stable mechanism `Dimension.runCommand("loot insert <pos> loot <tableId> ...")` (or an equivalent `Entity`/`Dimension` command call) for applying a vanilla loot table to a chest, since the stable `@minecraft/server` Script API (pinned 2.10.0 per `constraints.md`) has no direct "fill container from loot table" method. This was the open probe question the `strf` component owed per the L0 decomposition plan v2 reduce section ("is `/loot insert` with vanilla chest tables available through `runCommand`") — confirmed PASS by strf-p006 Q4 (`docs/structures/probe-results.md:16`).

**Impact if wrong:** if the probe finds `/loot insert` unavailable or behaves differently on 1.26.51.1, `L0-loot-p002`'s only step needs a different stable-API mechanism — this would not change `L0-loot-r006`/`r007`/the entities, only the process's step 2. Medium impact, contained to one process artifact.






### Loot asm3 concept assumption (L0-loot-asm3)

**Assumption (CAN_ASSUME):** "Compatible vanilla enchantments" (`L0-loot-r005`) is assumed to mean whatever the stable `@minecraft/server` enchantment API itself considers valid for that item (e.g. `ItemEnchantableComponent`/`EnchantmentTypes` rejecting an incompatible pairing), rather than this add-on hand-maintaining its own per-item compatibility matrix. Curses are filtered out explicitly by category before rolling, since the API itself won't refuse a curse as "incompatible" (curses are compatible with anything item-wise, just excluded by this spec).

**Impact if wrong:** if the stable API doesn't expose a compatibility check (only an apply-or-throw), the implementation needs a hand-maintained compatibility table instead — a larger but localized change to `L0-loot-p001` step 2c.






### magn-asbd · A horse in iron horse armour and a mob holding iron are not pulled (L0-magn-asbd)

# magn-asbd · A horse in iron horse armour and a mob holding iron are not pulled

**Assumption.**
- §4 names the helmet, chestplate, leggings and boots slots, and excludes iron weapons in a mob's hand.
- `iron_horse_armor` is listed only as an *item*.
- So a horse or donkey wearing it (body slot) is not a class 3 candidate.

**Impact if wrong.**
- Adding the body slot is one more tagging command (`hasitem={item=iron_horse_armor}`).
- A pulled horse with a rider raises the question of what happens to the rider, which the spec does not address.






### magn-asfl · Elements fly to their ring slot at ≤ 1.5 blocks per tick (L0-magn-asfl)

# magn-asfl · Elements fly to their ring slot at ≤ 1.5 blocks per tick

**Assumption.**
- The spec sets 0.6 blocks per tick for **players** only. For elements it says just "fly to their places".
- Ore can sit 60 blocks below the ring (centre − 20 → hover − 3), and the zone edge is ~50 blocks away horizontally.
- At 1.5 blocks per tick, the worst path of ~80 blocks takes ~2.7 s, about 5 % of the 60 s magnet. The flight is still visible on iPad as a stream rising into the cloud.

**Impact if wrong.**
- If the speed is too slow, far elements arrive late and look sluggish.
- If it is instantaneous, the "flying" visual is lost (the iPad DoD).
- Only one constant changes.






### magn-asit · `Block.getItemStack(1)` gives the right single item for every IRON_BLOCKS entry (L0-magn-asit)

# magn-asit · `Block.getItemStack(1)` gives the right single item for every IRON_BLOCKS entry

**Assumption.**
- `getItemStack(1, false)` returns the plain item for each block:
  - rail → rail;
  - a hanging lantern → lantern;
  - a water or lava cauldron → cauldron;
  - a chipped anvil → chipped_anvil.
- The door is special-cased to `iron_door`, and ore to `raw_iron`.
- An explicit fallback map keyed by block id covers any block where the call returns undefined or a variant item.
- A GameTest checks each IRON_BLOCKS id once.

**Impact if wrong.**
- A wrong item id gives the wrong drop, which breaks AC-10.
- A data-bearing item, such as a filled cauldron item, gives a non-vanilla item.
- Both are caught by the per-id test before merge.
- The cauldron's liquid is lost by design: the item is an empty cauldron.






### magn-aslh · Holders that contain a legendary are skipped, not pulled with it (L0-magn-aslh)

# magn-aslh · Holders that contain a legendary are skipped, not pulled with it

**Assumption.**
- UFO §5 pulls a chest or hopper minecart "whole", and an armour stand with iron armour is pulled.
- §4 and AC-13 say a legendary is "never pulled, wherever it lies".
- Reading: a class 3 holder whose inventory, or whose hand or armour slots, holds a legendary is **not selected**.
- The check uses the minecart's `minecraft:inventory` container and `hasitem` on `andrew:*` legendary ids for armour stands and mobs.

**Impact if wrong.** If the operator wants the holder pulled with the legendary inside, `lgnd`'s watching of moved holders (the `lgnd` v4 delta) becomes load-bearing, and AC-13 changes to "never separated from its holder". This costs one extra rule plus a GameTest.






### magn-asrg · A 3-block keep-away margin stops pickup; ring crowding is harmless (L0-magn-asrg)

# magn-asrg · A 3-block keep-away margin stops pickup; ring crowding is harmless

**Assumption.**
- U11 measured pickup at about 2 blocks for a hovering player, so a 3-block margin around every player suffices.
- Exempt drops grow the ring beyond 10 slots. At 30 slots the spacing on r 5 is still about 1 block, and held items do not merge, because each is teleported to its own point every tick.

**Impact if wrong.**
- **Pickup.** A held player would pick up ring items, so the "visible cloud" thins and the AC-8 counts drift. The fix is to raise the margin or the ring radius.
- **Merging.** Held stacks would merge, changing the element count. Then a minimum slot spacing would be needed (at most 1 slot per 1.5 blocks, overflow onto a second ring at −4).






### ASM-orbc-01 · \ (L0-orbc-as01)

# ASM-orbc-01 · "N blocks above the chosen point" is measured from the target block's Y

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-r007"]`

**Gap.** §8 says "30 blocks above the selected point", but does not say whether that is the block's Y, its top face (Y+1) or the hit point.

**Assumption.**
- `spawnY = target.y + offset`, in integer block coordinates.
- The charge's feet are at `spawnY`, and x and z are at the column centre (+0.5).
- The hit face and the sub-block hit point are ignored.

**Impact if wrong.** ±1 block of height, which is about 1 tick of fall. It only affects AC-4's exact numbers, and the unit test holds the constant.






### ASM-orbc-02 · Fall speed is a constant 1 block per tick (L0-orbc-as02)

# ASM-orbc-02 · Fall speed is a constant 1 block per tick

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-ad02", "L0-orbc-p002"]`

**Gap.** §8 says only "falls vertically down". No speed or acceleration is given.

**Assumption.**
- `FALL_SPEED = 1.0` block/tick, which is 20 blocks/s, constant with no acceleration.
- A +30 drop onto flat ground takes 1.5 s, and +10 in the Nether takes 0.5 s.
- It is exported as one named constant in `src/orbital/charge.ts`.

**Impact if wrong.**
- Faster (for example vanilla terminal, about 2–4 b/t) doubles the per-tick sweep reads and makes the TNT hard to see on the iPad.
- Slower makes aimed PvP shots easy to dodge.

The value is purely a tuning change. The sweep (`ad02`) keeps contact exact at any speed.






### ASM-orbc-03 · What a \ (L0-orbc-as03)

# ASM-orbc-03 · What a "block" is for contact

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-r008", "L0-orbc-r003"]`

**Gap.** §8 says a charge detonates "on first contact with a block", and one spawned in a "solid block" triggers at once. "Solid" is not defined. `Block.isSolid` exists in stable, but its semantics for slabs, leaves, glass and similar blocks are not verified on 1.26.51.1.

**Assumption.**
- Contact means not air, not a liquid, and not in `PASS_THROUGH`.
- `PASS_THROUGH` holds:
  - short and tall grass, ferns, flowers, saplings and dead bush;
  - all torches, redstone wire and rails;
  - a snow layer of height 1;
  - vines, cobweb, sugar cane, kelp and seagrass;
  - fire and soul fire;
  - `structure_void` and `light_block`.
- Everything else is contact, including leaves, glass, slabs, carpets, fences and barriers.
- A unit test lists the set, and the target raycast (`r003`) skips the same passable blocks.

**Probe.** Compare `Block.isSolid` against this set on BDS. If they agree, use `!isSolid && !isLiquid` as pass-through.

**Impact if wrong.** A charge stops on a flower, which gives an effect 1 block high, or it passes through a leaf canopy. Minor, and a local fix.






### ASM-orbc-04 · All charges of one attack spawn at the same Y, derived from the target (L0-orbc-as04)

# ASM-orbc-04 · All charges of one attack spawn at the same Y, derived from the target

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-r007", "L0-ring"]`

**Gap.** §10 says all RMB charges "are created simultaneously at the corresponding dimension height and start falling simultaneously". It is unclear whether "height" means per-column terrain + 30, or target + 30.

**Assumption.** There is one `spawnY` per attack, `target.y + offset` clamped (`r007`), shared by every ring column. On uneven terrain a column's fall is then longer or shorter, which matches §10's note that "actual detonation timing may differ slightly".

**Impact if wrong.** With per-column heights, every column needs a surface read at spawn: about 160 `getTopmostBlock` calls. The fall times would equalise. It is a change only in `p001` step 7.






### ASM-orbc-05 · Blocks stay unbreakable while the Cannon is in the main hand (L0-orbc-as05)

# ASM-orbc-05 · Blocks stay unbreakable while the Cannon is in the main hand

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-p001", "L0-adr-orbc"]`

**Gap.** `L0-adr-orbc` cancels `playerBreakBlock` so that Creative LMB does not break the target. It does not say what happens in Survival or during cooldown.

**Assumption.** `beforeEvents.playerBreakBlock` is cancelled whenever the main hand holds `andrew:orbital_cannon`, in every game mode, during cooldown or not. LMB is purely a weapon: a Survival hold never mines the targeted block, and players cannot mine with the Cannon.

**Impact if wrong.** If mining with the Cannon is expected, drop the cancel in Survival. It is a one-line change. The risk is that a Survival hold mines the block in the same gesture that fires.






### ASM-orbc-06 · A press during cooldown is silent (L0-orbc-as06)

# ASM-orbc-06 · A press during cooldown is silent

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-r005", "L0-orbc-r004"]`

**Gap.** §6 says only "a repeated press does not create a charge" during cooldown.

**Assumption.** A press during cooldown gives no message, sound or flash. The Action Bar countdown (`r012`) is the only feedback, and it is always visible while the Cannon is held.

**Impact if wrong.** If a "not ready" cue is wanted, add one lang key and a player-only `playSound`. There is no state change.






### ASM-orbc-07 · Creative Equipment category with no item group (L0-orbc-as07)

# ASM-orbc-07 · Creative Equipment category with no item group

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-ent1", "L0-orbc-ac02"]`

**Gap.** §4 says "preferably in Equipment". The Web Sword and Scythe join vanilla groups (`itemGroup.name.sword`, `itemGroup.name.hoe`). There is no verified vanilla group for the fishing rod.

**Assumption.** `menu_category: {category: "equipment"}` with no `group`. The Cannon then appears as a standalone entry in the Equipment tab.

**Impact if wrong.** It is cosmetic. If a rod or tool group id is confirmed on the iPad, add `group`. The change is JSON only.






### ASM-orbc-08 · Omitting `minecraft:damage` gives exactly empty-hand damage (L0-orbc-as08)

# ASM-orbc-08 · Omitting `minecraft:damage` gives exactly empty-hand damage

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-ent1", "L0-orbc-ac01"]`

**Gap.** §2 requires melee damage equal to an empty-hand punch. The default attack damage of a custom item without the component is believed to be 1, the same as the hand, but it is not measured.

**Assumption.**
- The item JSON has no `minecraft:damage` and no `minecraft:tags`, so no weapon or enchant-slot bonuses apply.
- `ac01` measures the result against an empty hand on BDS.

**Impact if wrong.** Set `minecraft:damage` to the value that matches the measurement. It is a JSON-only fix.






### Pick asm1 concept assumption (L0-pick-asm1)

**Assumption:** auto-smelt yield count is fixed at 1, ignoring vanilla's own variable raw-drop count (e.g. copper ore: vanilla drops 2–5 raw copper, this pickaxe always drops 1 copper ingot). The raw spec's wording ("copper ore → copper ingot", singular) is taken literally rather than as shorthand for "drop count matching vanilla's raw yield."

**Impact if wrong:** if the operator actually wants smelt-yield parity with vanilla's raw-drop range, the auto-smelt payout is undervalued for copper by up to 5x, and Stage 2 balance work inherits a silently-wrong baseline. Cheap to fix — `SmeltedDrop.count` is already a field, just hardcoded to 1 at every call site — but currently untested against any explicit "should count vary" requirement; the raw spec's Fortune deferral talks about multiplication on top of a base, not what that base should be.






### Pick asm2 concept assumption (L0-pick-asm2)

**Assumption:** no XP is granted on auto-smelt, based on the reasoning that all 7 raw materials give 0 XP when mined normally in vanilla (XP comes from smelting at a furnace, not from mining the ore).

**Impact if wrong:** if Stage 2's PvP economy design expects auto-smelt to be XP-neutral versus "mine then smelt at a furnace" (which *does* grant XP), this pickaxe is currently a strict downgrade in earnable XP for any player who would otherwise smelt manually — worth flagging before Stage 2 economy is designed, not after. No code path currently grants XP on auto-smelt; adding it would need an explicit per-block XP table, which does not exist.






### Pick asm3 concept assumption (L0-pick-asm3)

**Assumption:** `SPEED_TOLERANCE_TICKS = 4` and `BREAK_LIMIT_TICKS = 300` are empirically chosen GameTest constants, not derived from any written spec value — the raw spec only says "Diamond-like intended mining speed" (qualitative, no numeric target).

**Impact if wrong:** too tight a tolerance risks flaky CI on a slower Docker/BDS host (false failures unrelated to the pickaxe); too loose a tolerance risks the exact class of regression this test exists to catch (0.3.0's hand-speed fallback, `L0-pick-gl02`) slipping through silently on a future edit to `destroy_speeds`. No incident yet from either direction — this is a forward-looking risk note, not a bug report.






### AS-pntr-01 · Irregularity model and top edge (L0-pntr-as01)

# AS-pntr-01 · Irregularity model and top edge

**Gap.** §9 gives only "approximately 5×5", "small natural irregularity" and "from the actual trigger point".

**Assumption (CAN_ASSUME).**
- Horizontally the column fits in 7×7, with a 3×3 core that is always present and about 25 cells per layer.
- It starts exactly at the detonation cell's y. There is no crater or bowl above it and no widening at the surface.

**Impact if wrong.** If the client expects a TNT-like crater at the top, add a small hemispherical cut (r≈2.5) around `top`. That is a local change to `planColumn` and cheap.






### AS-pntr-02 · `setType` gives no drops or XP (L0-pntr-as02)

# AS-pntr-02 · `setType` gives no drops or XP

**Gap.** The stable API docs do not say whether `Block.setType` on a block with a block entity (chest, shulker, spawner) spills its contents or XP.

**Assumption (CAN_ASSUME).**
- `setType` replaces the block silently: no item entities and no XP orbs.
- `pntr` still calls `container.clearAll()` first as belt-and-braces (`L0-pntr-r004`).

**Probe.** A BDS gametest places a filled chest, a shulker box, a spawner and a furnace with fuel/output in the column, fires the LMB, then counts `minecraft:item` and `minecraft:xp_orb` entities in the column AABB. The count must be 0.

**Impact if wrong.**
- The furnace XP or a spawner's orb would leak. The fix is a post-job sweep of *new* item or XP entities in the column AABB that skips legendaries, reusing `ring`'s snapshot method (`L0-adr-ochg`).
- The cost is small, but it adds entity scans to C-5a′.






### AS-pntr-03 · Per-cell throughput is enough to look instant (L0-pntr-as03)

# AS-pntr-03 · Per-cell throughput is enough to look instant

**Gap.** There are no measured numbers for `getBlock` + `setType` cost on BDS 1.26.x with `runJob`.

**Assumption (CAN_ASSUME).**
- `runJob` processes at least ~2,000 column cells per tick without pushing the tick above 50 ms on the target host.
- So a typical Overworld column (~3,500 cells) finishes in ≤ 3 ticks, and the worst case (~9,600 cells) in ≤ 6 ticks (PN-1).

**Probe.** A gametest fires LMB from y=319 in a stone-filled test area and records `report.ticksUsed` and the tick times. It is repeated with 3 concurrent columns.

**Impact if wrong.**
- Removal visibly lags (the shaft "unzips" downward). Mitigations, in order:
  1. the hybrid `fillBlocks` fast path (`L0-pntr-ad01`, rejected alternative 1);
  2. relaxing PN-1 to ≤ 10 ticks and documenting it (C-15 rank 4 < rank 3).
- AC-10 (`L0-pntr-ac07`) is at risk.






### AS-pntr-04 · Waterlogged cells become water (L0-pntr-as04)

# AS-pntr-04 · Waterlogged cells become water

**Gap.**
- §9 says liquids are not removed.
- `xasm6` says "waterlogged state is kept" but does not say what happens to the solid part.

**Assumption (CAN_ASSUME).**
- A waterlogged block (a waterlogged fence, stairs, seagrass or kelp base) is treated as a solid plus water.
- The solid is removed and the cell becomes `minecraft:water`, a source block.
- So an ocean-floor column through a waterlogged shipwreck keeps its water.

**Impact if wrong.**
- If the client reads "keep waterlogged" as "keep the whole block", those cells go into the keep class. That is a one-line change, but it leaves fences and stairs floating in the shaft.
- Setting a source block could also create a little extra water where the waterlogged block had been dry-adjacent. This is cosmetic.






### AS-pntr-05 · Legendaries nested in storage items are `lgnd`'s problem (L0-pntr-as05)

# AS-pntr-05 · Legendaries nested in storage items are `lgnd`'s problem

**Gap.**
- A legendary can sit inside a bundle or shulker-box *item* that is inside a chest in the column.
- Stable 2.10.0 exposes `ItemInventoryComponent` only for items with the Storage Item component (bundles). Whether a shulker-box item's contents are readable is unverified.

**Assumption (CAN_ASSUME).**
- `lgnd.protectLegendariesIn` owns the recursion: it walks nested storage items where the API allows.
- `pntr` passes only the cell volume. It does not inspect items itself, so there is a single implementation shared with `ring`.

**Impact if wrong.**
- If shulker-box items are opaque, a legendary nested in one is deleted by the LMB. That violates C-7′.
- The `lgnd` delta must then either block putting legendaries into shulker boxes (a `beforeEvents` hook) or document the gap under C-16. Neither changes `pntr` code.






### AS-pntr-06 · Drops from neighbours outside the column are environmental (L0-pntr-as06)

# AS-pntr-06 · Drops from neighbours outside the column are environmental

**Gap.**
- §9's "no drops" covers destroyed blocks.
- Removing the column also breaks attached blocks *outside* it (torches, ladders, signs, rails, door halves, portal blocks), and they pop by vanilla rules.
- C-19 forbids "uncontrolled item entities".

**Assumption (CAN_ASSUME).**
- These neighbour drops are "environmental consequences" (AC-9) and are not suppressed.
- They are bounded: at most one ring of neighbours around the 7×7 column.
- `pntr` guarantees zero drops only for cells inside the column.

**Impact if wrong.** If the client wants a spotless column, add a post-job sweep of new item entities in a 9×9 AABB around the column (skipping legendaries). This is the same helper as in `L0-pntr-as02`.






### AS-pntr-07 · Liquids and gravity blocks react to script `setType` (L0-pntr-as07)

# AS-pntr-07 · Liquids and gravity blocks react to script `setType`

**Gap.** §9 says liquids "flow naturally into the shaft" after removal. The stable docs do not guarantee that `Block.setType` fires the neighbour updates that make water, lava or sand move.

**Assumption (CAN_ASSUME).** `setType` triggers ordinary neighbour updates:
- adjacent water and lava start flowing into the new air;
- sand and gravel above removed cells fall.

**Probe.** Fire LMB next to a water pool and under a sand overhang. Water must enter the shaft within 2 s and the sand must fall.

**Impact if wrong.** The shaft walls stay as frozen liquid faces, which violates §9 and AC-7. The fix: after the job, touch each edge liquid cell (`setType` to the same liquid) to force an update. That is O(perimeter) cheap.






### AS-pntr-08 · Non-solid breakables are removed too (L0-pntr-as08)

# AS-pntr-08 · Non-solid breakables are removed too

**Gap.** §9 speaks of destroying "all **solid** blocks a Survival player can break", and also says chests, spawners "and other destructible blocks" are destroyed.

**Assumption (CAN_ASSUME).** Everything that is not air, liquid or on the `xasm6` keep list is removed, including non-solid blocks such as torches, flowers, grass, snow layers, cobwebs, rails, carpets, signs and item frames. This matches `xasm6`'s "everything else is removed" and gives a clean shaft.

**Impact if wrong.** If only full solids should go, the classifier needs a solidity test. There is no stable query for it, so a second list would be needed. Cosmetic.






### Ring as01 concept assumption (L0-ring-as01)

**ASM-ring-01 · Script explosions drop the blocks they break**

**Assumption.** A `createExplosion(…, 4, {breaksBlocks:true})` on BDS 1.26.x drops the broken blocks as item entities, as vanilla Bedrock TNT does (effectively 100% yield). Suppression is therefore required. This is the probe item named in `L0-adr-ochg`.

**Probe.** Explode on a 9×9×5 stone/dirt pad with `doTileDrops` true, then count `minecraft:item` within ±8.

**Impact if wrong.**
- If script explosions drop nothing by themselves, `ad01` becomes dead code: remove the toggle and keep only the container check.
- If they drop at 1/power probability (Java-like), suppression is still needed, but the load in RG-4 is 4× lower.






### Ring as02 concept assumption (L0-ring-as02)

**ASM-ring-02 · `doTileDrops=false` also stops container contents spilling, and nothing else**

**Assumption.** While `world.gameRules.doTileDrops` is false:
- a chest, barrel, hopper or shulker box destroyed by the explosion drops neither itself nor its contents;
- mob loot and player death drops (`doMobLoot`, `keepInventory`) are unaffected.

**Probe.** One chest with 10 cobblestone, one zombie and one SimulatedPlayer (via the `bds-gametest` pack; see memory about SimulatedPlayer visibility) inside a blast. Count the items by type afterwards.

**Impact if wrong.**
- If contents still spill, enable the container fallback in `ad01`/`ent3`. That is a small, localised change.
- If mob or player drops are also suppressed, `ad01` fails `r006`. Revert to a diff limited to destroyed-block cells, and reopen `L0-ring-cx01`.






### Ring as03 concept assumption (L0-ring-as03)

**ASM-ring-03 · `source: owner` does not exempt the owner from damage**

**Assumption.** `ExplosionOptions.source` only attributes the explosion, for kill messages and credit. The source entity still takes damage and knockback, as a player who lit vanilla TNT does.

**Probe.** Run AC-13 twice, with and without `source`, on a SimulatedPlayer owner at 3 blocks. Compare the health loss.

**Impact if wrong.** If `source` exempts the owner, omit `source` on every blast. The only loss is kill attribution in the death message ("blown up" instead of "blown up by X"). Document it (C-16).






### Ring as04 concept assumption (L0-ring-as04)

**ASM-ring-04 · `breaksBlocks:false, allowUnderwater:true` in water deals full damage and still plays sound and particles**

**Assumption.** An explosion whose centre is in water, with these flags:
- changes no block;
- damages entities as on land;
- plays the normal explosion sound and particles.

**Probe.** Blast centred in a 5-deep pool, with a zombie 2 blocks away and a SimulatedPlayer at 4. Snapshot the blocks before and after.

**Impact if wrong.**
- If there is no sound underwater, add `dim.playSound("random.explode", centre)` for underwater blasts only (AC-12, ipad).
- If the damage is reduced by water, accept it as vanilla-consistent and note it (C-16). The spec says "normal TNT damage", and vanilla underwater TNT is the reference.






### Ring as05 concept assumption (L0-ring-as05)

**ASM-ring-05 · 48 power-4 explosions per tick fit the tick budget on BDS in Docker on the M4 Pro**

**Assumption.** `RING_MAX_BLASTS_PER_TICK = 48` with `doTileDrops` false keeps tick time within RG-3, with the players on iPad.
- The value is a starting guess: vanilla handles TNT cannons of this order.
- The cost is dominated by explosion ray-casting (~1,300 rays per blast) and client chunk re-sends.

**Probe.** 3 SimulatedPlayers fire RMB at the same tick over flat stone. Log `system.currentTick` deltas and the wall-clock ms per tick.

**Impact if wrong.**
- Lower the cap: 32, then 16. With 3 attacks, the drain time grows to ≤ 30 ticks (1.5 s), and RG-2 is relaxed as allowed.
- If even 16 fails, the only remaining lever is fewer charges: a 4-connected ring, about −30% (`L0-xasm8` impact).






### Ring as06 concept assumption (L0-ring-as06)

**ASM-ring-06 · The charge count is 140–160 per RMB, with a hard cap of 200**

**Assumption.**
- The real-radius midpoint circle in `p001` gives about 1 + 16 + 28 + 44 + 56 ≈ 145 columns. `L0-xasm8` estimated ≈ 160.
- All budgets (orbc's 480-charge flight sweep, RG-1 to RG-3) are sized for ≤ 160 per attack × 3 attacks.
- A unit test pins the exact count, and `layout` asserts ≤ 200.

**Impact if wrong.**
- If the client wants visibly thicker rings (a 2-wide band), the count roughly doubles to ~300. That breaks orbc's sweep budget and RG-3, and needs a new L0 budget decision.
- If the client accepts a 4-connected ring, the count drops to ~100.






### Ring as07 concept assumption (L0-ring-as07)

**ASM-ring-07 · World TNT primed by a ring blast is ordinary vanilla TNT**

**Assumption.**
- `minecraft:tnt` blocks in the world that a ring blast primes behave exactly as vanilla:
  - they explode ~4 s later;
  - they can push each other;
  - they drop blocks, because `doTileDrops` has been restored by then;
  - they can chain.
- "Each charge is independent" (§10) is about the Cannon's own charges only.

**Impact if wrong.** If the client expects the world's TNT to be neutralised, `ring` must remove TNT blocks in the blast volume beforehand. That breaks "TNT-like" behaviour and costs another block query per step.






### Ring as08 concept assumption (L0-ring-as08)

**ASM-ring-08 · The blast centre is the cell above the contact block**

**Assumption.** A landed charge explodes as if it were TNT resting on the contact block, with its centre at `point + (0.5, 1.5, 0.5)`. It uses `point` itself only when the cell above is solid (`r010`). §10 says only "falls to the first block". The resting position is the natural reading, and it matches what the iPad player sees: the TNT touches the ground, then explodes.

**Impact if wrong.** If the blast is meant to be *in* the contact block, the craters come out ~1 block deeper and the seabed checks move one cell down. It is a one-line change in `r010`, with no effect on budgets.






### AS-sauc-1 · The hull band is `[y, y + 3]` above the entity position, and the model is built to fill it (L0-sauc-as01)

# AS-sauc-1 · The hull band is `[y, y + 3]` above the entity position, and the model is built to fill it

**Assumption.**
- UFO §8 says "a cylinder of radius 6 and height 3 blocks **around its position**". It does not say whether the band is centred (y ± 1.5) or rests on the position.
- Reading: the entity position is the underside of the disc. The hull is r 6 in `[y, y + 3]`. The geometry (disc + dome) is built to occupy that band, and the beam hangs from y.
- The edges are closed: a charge column at exactly r = 6.0, or a segment ending exactly at y or y + 3, is a hit.

**Impact if wrong.**
- If the client meant a centred band, the hit band moves down by 1.5 blocks.
- Only shots that graze the top or bottom edge change outcome; a vertical charge column through the disc hits under either reading.
- The fix is a constant offset in the hull test and in `ac03`'s probe heights, with no model change.






### AS-sauc-2 · Filled-in tunables: fall acceleration, path easing, departure height, sound volume (L0-sauc-as02)

# AS-sauc-2 · Filled-in tunables: fall acceleration, path easing, departure height, sound volume

**Assumption** (the spec leaves these open):
- **Fall.** `vy` starts at 0 and gains `a = 0.025` blocks per tick².
  - From the hover height (≈ 40 above the centre) the saucer touches ground at ≈ 57 ticks, just inside 3 s.
  - From arrival or departure height (+50) the 60-tick cap fires first, at ≈ 45 blocks of drop. The blast then happens a few blocks above the ground, which §8 allows ("or after 3 seconds").
  - Ground = the first non-air cell (solid **or liquid**) under the hull centre.
- **Easing.** Arrival uses smoothstep. Departure uses ease-in (it accelerates away).
- **Departure height.** Departure climbs back to `hoverY + 10`, mirroring the arrival. §2 states only "the opposite way beyond the horizon (90 blocks)".
- **Sound volume.** `volume: 4`, about a 64-block range, for every UFO sound.

**Impact if wrong.**
- These are all constants in `src/ufo/saucer.ts`, so changing one is a one-line edit.
- `ac01`, `ac03` and `ac05` assert the constants through exported values, not literals.
- Only the iPad look and listen check (`ac06`) can reject them.
- One residual risk: a reward dropped over lava burns, as vanilla items do. If the operator wants the reward to be loss-proof, the blast point must move to the nearest non-lava surface.






### AS-sauc-3 · The shooter's name is resolved from `attack.ownerId` at the shot; `Attack` gains an optional `ownerName` (L0-sauc-as03)

# AS-sauc-3 · The shooter's name is resolved from `attack.ownerId` at the shot; `Attack` gains an optional `ownerName`

**Assumption.**
- The shipped `Attack` (`src/orbital/flight.ts:24-34`) carries `ownerId` only, and `L0-adr-ufoi` §6 passes only that.
- The charge is at most ~3 s old when it crosses the hull, since it spawns 60 above the target and falls 1 block per tick. The owner is therefore almost always online.
- `sauc` resolves the name from `world.getAllPlayers()`, filtering out `undefined` (C-22).
- To cover a disconnect in that window, the seam adds an **optional** `ownerName` to `Attack`, filled at launch from `player.name`. This is additive and unused by `pntr`/`ring`. The broadcast uses the live name, then `ownerName`, then the literal `"?"`.

**Impact if wrong.**
- If adding a field to `Attack` is refused, a shooter who logs out within ~3 s is broadcast as "?".
- This is cosmetic. No AC exercises it beyond C-20′'s "the shooter is named".






### AS-sauc-4 · The 100-block limit is horizontal; a saucer 90 out is loaded, persists for 95 s, and renders on the iPad (L0-sauc-as04)

# AS-sauc-4 · The 100-block limit is horizontal; a saucer 90 out is loaded, persists for 95 s, and renders on the iPad

**Assumption.**
1. **The 100-block limit is horizontal.** UFO §2 says "not farther than 100 blocks from the centre". The 3D distance at spawn is √(90² + 50²) ≈ 103. U8 measured unloading against the *loaded area*, which is a horizontal chunk distance. The horizontal reading is therefore the intended one.
2. **The spawn point is usable.** A chunk 90 blocks (≈ 6 chunks) from an online target player is loaded under BDS defaults, so `spawnEntity` and per-tick teleports there succeed. In GameTest, simulated players load no chunks, so the scenario needs a `tickingarea` covering the path (or a test-only shortened radius that is flagged as such).
3. **No despawn.** A `minecraft:snowball`-runtime custom entity with no projectile component is not despawned or auto-removed within the 95 s event. The shipped charge only proves 20 s (`ATTACK_TIMEOUT_TICKS` = 400). Probe U8 / the U1 run held a probe for ~60 s.
4. **It renders at range.** The iPad client draws an entity ~95 blocks away if its chunk is within the client's render distance (≥ 6 chunks) and `visible_bounds` is large (`ent1`).

**Impact if wrong.**
- (1) The path has to shrink to ~80 horizontal, an AC-2 deviation note.
- (3) The saucer vanishes mid-event; `p001` treats that as an abort, and the event is lost.
- (4) The DoD line "saucer visible on approach" fails at low render distance. The spawn radius stays at 90, so the fix is the operator's render-distance setting or a deviation.
- Each item is checked by `ac01` (positions and validity over the full 95 s) or by `ac06` (iPad).






### AS-sauc-5 · The hull keeps absorbing charges during the downed fall; the interceptor is removed only at the blast (L0-sauc-as05)

# AS-sauc-5 · The hull keeps absorbing charges during the downed fall; the interceptor is removed only at the blast

**Assumption.**
- §8 says "any phase — arrival, magnet or departure". It is silent on the 3 s fall after a shoot-down.
- `L0-adr-ufoi` already accepts that one RMB salvo can lose several charges to a hull.
- Reading: while the saucer entity exists, including the fall, a crossing charge is absorbed (no ring or column effect) but does not re-trigger (`r004` latch).
- The interceptor is unregistered in the blast tick.

**Impact if wrong.**
- If the client expects charges to pass through a falling wreck, a salvo fired right after the shoot-down loses its effect on the cells under the wreck.
- The change is one condition: `downed` makes the interceptor return `false`. `ac03` has a sub-case pinned to this choice.






### AS-sauc-6 · An RMB salvo is partly absorbed: columns inside the hull are intercepted, and the rest detonate at their per-ring power (L0-sauc-as06)

# AS-sauc-6 · An RMB salvo is partly absorbed: columns inside the hull are intercepted, and the rest detonate at their per-ring power

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sauc-r001", "L0-sauc-r004", "L0-sauc-ac03", "L0-adr-ufoi", "L0-ring"]`

**Context.**
- In shipped Orbital v1.4.4 (`src/orbital/ring-layout.ts`), RMB rings have radii 0.5 / 3.5 / 7 / 10.5 / 14 and powers 4 / 4 / 2 / 1 / 1.
- A blast reaches 2 × power.
- RMB refuses a target nearer than 7 blocks from the eye (`RING_MIN_RANGE`, Orbital §6).

**Assumption.**
- `r001` runs per charge. With the target under the saucer axis, the centre and ring-3.5 columns cross the r 6 hull and are intercepted.
- Rings 7, 10.5 and 14 fall clear of the hull and detonate normally at powers 2 / 1 / 1. That is ordinary Cannon behaviour and not "blast damage" from the saucer, so UFO §8's "no damage" covers only the saucer's own blast (`r004`).
- The first intercepted charge latches the shoot-down. The others in the same tick are absorbed silently (`r004` item 1).
- The 7-block minimum only limits where the shooter stands. Hovering at centre + 40 and spawning charges at target + 60 already require the target to be under the hull, so the minimum range adds no new positional limit.

**Impact if wrong.**
- If the client expects the whole salvo to vanish once the saucer is hit, the interceptor has to absorb every charge of an attack once one of them hits. That means a per-`attackId` set in `p003` and one line in `r001`.
- `ac03`'s RMB block assertions are scoped to this reading. Under the other reading they could go back to the full 13 × 13 snapshot.






### ASM-scyt-01 — Game mode is not a targeting filter (as shipped) `CAN_ASSUME` (L0-scyt-as01)

# ASM-scyt-01 — Game mode is not a targeting filter (as shipped) `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-r001", "Q-015", "L0-scyt-ac02"]`

**As shipped:** neither `gatherCandidates` nor `pickTarget` reads the game mode. A visible Creative or Spectator player within 20 blocks outranks every mob and **is locked**. The prior design skipped them, as a mirror of Q-015.

**Assumed acceptable:** the damage has no lasting effect on Creative players. A Spectator is normally not reachable, because the LOS ray and a hit still apply. The practical harm is a wasted volley. If no hit lands, it costs nothing.

**Unverified risks:**
1. The `setCurrentValue` correction in `r005` may lower a Creative player's health.
2. A Spectator near the owner can "steal" the lock from a real enemy or a mob.

**Impact if wrong:** add `getGameMode() ∈ {Survival, Adventure}` for players in `gatherCandidates`. That is one line, and it needs one new row in the table test. The owner side is unchanged: a Creative owner can cast, which is useful for `/andrew:scythe` testing.






### ASM-scyt-02 — \ (L0-scyt-as02)

# ASM-scyt-02 — "About 10 blocks" = `applyKnockback` vertical 1.35 (model-derived; the apex is not re-measured) `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-r006"]`

**Resolved by measurement plus a model:** strength 2.5 was measured at +29.29 blocks, which fits v₀ in blocks per tick with gravity 0.08 and drag 0.98. The same model gives 1.35 → +10.1. `LAUNCH_STRENGTH = 1.35` is what shipped.

**Still assumed:**
- The ±2-block tolerance on flat ground.
- Mobs fly the same as players. `applyKnockback` is declared on `Entity`, but mob knockback resistance and mass differ; a cow at 10 HP was seen dying from the fall.
- Netherite knockback resistance is not compensated.

**Impact if wrong:** it is one constant. `scythe_launches_target` should assert the apex at 1.35 (8–12). Today it only proves the calibration run.






### ASM-scyt-03 — Netherite-sword parity is `minecraft:damage: 8` `CAN_ASSUME` (L0-scyt-as03)

# ASM-scyt-03 — Netherite-sword parity is `minecraft:damage: 8` `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-r009", "L0-scyt-ac15"]`

**Assumed:** the shipped Web Sword uses `minecraft:damage: 7` to match a Diamond Sword (Web Sword §7 was accepted in Stage 2). Vanilla Netherite is one point above Diamond, so the Scythe uses `8`.

**Basis:** `packs/behavior/items/web_sword.json` (read 2026-09-24), plus the vanilla diamond → netherite step of +1.

**Impact if wrong:** a one-number change in the item JSON. AC-scyt-15's BDS comparison against a real netherite sword catches it.






### ASM-scyt-04 — \ (L0-scyt-as04)

# ASM-scyt-04 — "Mob" = any entity with a health component, including passive animals, villagers, pets and armour stands `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-ad04", "L0-scyt-r001"]`

**Assumed:** the operator's «на мобов тоже» means every living entity. There is no hostile-only filter and no exclusion of the owner's tamed pets, villagers, iron golems or armour stands. Anything with `minecraft:health` in range can be locked once no visible player qualifies.

**Basis:** `decision-scythe-targets-mobs` names only the health component as the discriminator.

**Impact if wrong:** a volley can go into the owner's own wolf or a village's villager. Hitting a golem aggros it, and a villager hit affects trading reputation. The fix is a type/family exclusion list in `gatherCandidates`, with a table test row. The ask belongs to the operator.






### Assumption (CAN_ASSUME) — Where the candidate footprint sits relative to its chunk (L0-strf-as01)

# Assumption (CAN_ASSUME) — Where the candidate footprint sits relative to its chunk

**Gap.** The spec gives a chance "per chunk", but the Windmill (35×35), Warden City (63×63) and Bastion (20×20) are larger than a chunk. It never says where the footprint lies.

**Assumption.** The **centre** of the rotated footprint is at the centre of the rolled chunk (`cx*16+8`, `cz*16+8`), with no jitter. The origin is `centre − floor(size'/2)`. The footprint therefore spills into neighbouring chunks symmetrically. Two adjacent positive rolls for large structures always collide, and the later one in discovery order is cancelled.

**Impact if wrong.** It lowers the effective density of large structures at 5 % (see `L0-xq2`). Structures are aligned to a visible chunk grid. Adding seeded jitter (±4) later is a one-line change, and existing worlds are unaffected because placed records store the origin.






### Assumption (CAN_ASSUME) — What counts as a \ (L0-strf-as02)

# Assumption (CAN_ASSUME) — What counts as a "significant part" of the footprint over water

**Gap.** §5.4: "Если значимая часть footprint находится над открытой водой, позиция непригодна". No number is given.

**Assumption.** For the Airship, more than 10 % of the footprint's surface samples being liquid makes the site invalid. The Windmill uses 5 % (`L0-xasm4` §4), because it sits on the ground and its fields need dry soil. Warden City: 0 % at the centre and the 8-point ring (`L0-xasm4` §5). All three are constants in the def table.

**Impact if wrong.** At 10 %, an Airship may hover over a small pond or a stream edge. If the client means "any water", set it to 0. Airship density along rivers drops slightly. Test 31 still passes either way because it uses open ocean or river.






### Assumption (CAN_ASSUME) — How loaded chunks are detected, and the discovery radius (L0-strf-as03)

# Assumption (CAN_ASSUME) — How loaded chunks are detected, and the discovery radius

**Gap.** C-12 requires that nothing is written into unloaded chunks. It is unverified whether `Dimension.isChunkLoaded` exists in `@minecraft/server` 2.10.0 stable, and what `getBlock` does out of range.

**Assumption.** One of the following holds: `isChunkLoaded(location)` is present, **or** `getBlock` returns `undefined` or throws `LocationInUnloadedChunkError` for unloaded chunks. `strf` wraps both behind `isLoaded(dim, cx, cz)`. The discovery radius `R_DISCOVER = 4` chunks, which is inside BDS's default simulation/ticking distance, so footprints around a player are normally loaded. Candidates that reach beyond it go `pending`.

**Impact if wrong.** If neither method is reliable, placement could throw mid-job and leave a `planned` record, which is safe but noisy. The fallback is placing only candidates whose AABB lies entirely within 3 chunks of some player. Probe item 9 settles it.






### Assumption (CAN_ASSUME) — Guard persistence and sun immunity with stable tools (L0-strf-as04)

# Assumption (CAN_ASSUME) — Guard persistence and sun immunity with stable tools

**Gap.** `L0-adr-strs` relies on a name tag to stop despawning and on infinite `fire_resistance` for sun immunity. The script `addEffect` duration is bounded (not infinite), and whether a *script-set* `nameTag` blocks despawn the same way a name-tag item does is unverified on BDS 1.26.51.

**Assumption.**
1. A script-set non-empty `nameTag` makes the mob persistent, as an item-applied name does.
2. `runCommand("effect @s fire_resistance infinite 0 true")` is stable, applies an infinite hidden effect, and survives restart. Fire resistance prevents sun damage; the mob may still show the burning animation, and that visual is a deviation.
3. Curing produces a new `minecraft:villager` without the effect.

**Impact if wrong.** (1) Guards vanish and test 19 fails. Fallback: re-apply persistence via a component group defined in a behavior-pack *entity event* on our own identifier, which the spec forbids (vanilla curing), or accept and document. (2) Guards burn at noon. Fallback: a helmet in the head slot via `EntityEquippableComponent`, if stable for mobs, which vanilla sun logic respects. Probe items 5–6.






### Assumption (CAN_ASSUME) — Dynamic-property budget (L0-strf-as05)

# Assumption (CAN_ASSUME) — Dynamic-property budget

**Gap.** World dynamic properties have per-key and total size limits that the spec and code do not record for 2.10.0.

**Assumption.** One string property holds at least 32 000 characters. The total world dynamic-property storage is large enough for ~1 000 region shards of ≤ 10 KB, which covers a 1 000 × 1 000-chunk explored area per dimension. The registry only grows with explored area, not with time.

**Impact if wrong.** If the per-key limit is much smaller (e.g. 4 KB), shards split more (overflow keys, `L0-strf-e002`). If the total is capped, very large worlds stop generating new structures once the cap is near. The fail-safe is to stop generating rather than lose records, and to log it. Probe item 8 measures both limits.






### Assumption (CAN_ASSUME) — `structureManager.place` rotation keeps the given location as the min corner (L0-strf-as06)

# Assumption (CAN_ASSUME) — `structureManager.place` rotation keeps the given location as the min corner

**Gap.** Whether Bedrock rotates a placed structure *within* its bounding box, with `location` staying the min corner of the rotated box, or around the origin block, is not documented in the KV.

**Assumption.** Rotation happens inside the bounding box. The placed blocks occupy `[loc, loc + rotatedSize − 1]`, as `/structure load … 90_degrees` does. `rotateLocal` is written for that convention.

**Impact if wrong.** Every chest, guard and marker point would be offset for 90/180/270. `rotateLocal` gets a per-rotation offset correction taken from probe item 2 and AC-strf-02. Bodies are unaffected because they only call `rotateLocal`.






### AS-ufoc-1 · How the commands behave where the spec is silent (L0-ufoc-as01)

# AS-ufoc-1 · How the commands behave where the spec is silent

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-p004", "L0-ufoc-r006"]`

**Spec (§9)** says only: `come` targets the invoker, or a random player; `stop` removes the saucer and drops what it holds; `enable`/`disable` is a stored flag. Everything below fills a gap.

**Assumed:**
1. **`come` from the Nether or End, or from the console:** the target is a random Overworld player. With no Overworld player, `come` fails with a message.
2. **`come` while a UFO is up:** it is refused (at most one saucer).
3. **`come` while the event is disabled:** it works, as an operator override for testing. The flag is unchanged.
4. **After `stop`:** the next arrival is now + 15 min, the same as a departure.
5. **`disable` mid-event:** it also stops the event.
6. **`enable` when `next_ms` is overdue:** the arrival is pushed to now + 15 min.
7. **Command replies:** plain English text, not localized. `CustomCommandResult.message` is a string, not rawtext.

**Impact if wrong:**
- Points 1–3 and 7: low; each is a small change in `commands.ts`.
- Point 4: if `stop` should leave the old schedule, the next saucer could arrive sooner than 15 min.
- Point 5: if `disable` should let a live event finish, the saucer stays up after the operator disabled the event.
- Point 6: an overdue arrival would fire within 5 s of `enable`.






### AS-ufoc-2 · The target can be in any game mode; the centre is the literal block under the feet (L0-ufoc-as02)

# AS-ufoc-2 · The target can be in any game mode; the centre is the literal block under the feet

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-r002", "L0-xasm14"]`

**Assumed:**
- **Game mode.** Any online, live Overworld player can be the target, including Creative and Spectator players. The spec says only "a random online player in the Overworld". `magn` still never pulls Creative or Spectator players (§5).
- **Centre.** The centre is `floor(y) − 1` under the target, with no downward raycast. A target who is flying, gliding or jumping gets a centre in the air.

**Impact if wrong:**
- If Spectators should be excluded, an event can happen over an observer. The fix is one filter in `overworldPlayers()`.
- With an airborne centre, the zone (centre − 20 … hoverY) can miss the ground, and the event pulls little. An alternative is a block raycast down to the first solid block, capped at 64 blocks. Note that a block raycast passes carpets, signs and ladders. Switching to it is a change local to `r002`.






### AS-ufoc-3 · \ (L0-ufoc-as03)

# AS-ufoc-3 · "Exactly 15 minutes" allows the 5 s idle-check granularity

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-r001", "L0-ufoc-ac02", "L0-ufoc-ad02"]`

**Assumed.**
- AC-1's "exactly 15 minutes" is met when the arrival starts within the next idle check after `next_ms`. That is [15 min, 15 min + 100 ticks], or about 5 s at 20 TPS.
- Phases count ticks (`ad01`), so under lag a 20 s arrival lasts more than 20 s of wall time. AC-2 is asserted in ticks: 400/1200/300.

**Impact if wrong.**
- If the operator wants second-exact arrivals, the idle divider drops to 20 ticks. That costs nothing measurable.
- If AC-2 is meant in wall seconds under lag, the phases would have to switch to ms deadlines, and the flight would jump. That reverses `ad01`.






### AS-ufoc-4 · A lost saucer aborts the event: it was never spawned, it unloaded, or a consumer threw (L0-ufoc-as04)

# AS-ufoc-4 · A lost saucer aborts the event: it was never spawned, it unloaded, or a consumer threw

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-p002", "L0-sauc-p001", "L0-magn-prel"]`

**Context.**
- The saucer spawns 90 blocks from the centre (§2). If that chunk is not loaded, `spawnEntity` throws.
- If every player leaves the area mid-event, the saucer's chunk can unload (U8, C-12′). §10 says the event continues when the *target* leaves, but it does not cover the saucer itself vanishing.

**Assumed.** `ufoc` aborts the event in any of these cases:
- `sauc` cannot spawn the saucer;
- the saucer is invalid on any later tick, outside `downed`;
- an `onPhase` consumer throws.

The abort releases everything held (when in `magnet`), removes whatever remains, ends the session and sets `next_ms` to now + 15 min. A saucer that unloaded and later reloads is removed by the `entityLoad` sweep, because its event id no longer matches (`p003`).

**Impact if wrong.**
- If the event should survive an unload (for example by pausing the phase clock), `p002` needs a "suspended" state.
- If `sauc` prefers to spawn nearer the centre when the 90-block point is unloaded, the abort becomes a fallback rather than the normal path.






### AS-ufoc-5 · The 150-block notice range is horizontal and Overworld-only, sent once at arrival start (L0-ufoc-as05)

# AS-ufoc-5 · The 150-block notice range is horizontal and Overworld-only, sent once at arrival start

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-r005", "L0-ufoc-ac07"]`

**Spec (§7):** the localized "В небе НЛО!" goes to players within 150 blocks of the centre when the arrival starts.

**Assumed:**
- The distance is horizontal (x/z), so players in deep caves under the centre are told too.
- Only Overworld players get it.
- It is sent once. Players who walk into range later are not told.
- `come` sends it too.

**Impact if wrong:** low. A 3D distance or a later re-notice is a change local to `r005`. Only AC `ac07`'s expected recipient set changes.






### ASM-webs-01 — Unloaded-cell detection is \ (L0-webs-as01)

---
is_a: ["assumption"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r004"]
---
# ASM-webs-01 — Unloaded-cell detection is "query fails/returns undefined", not a chunk-ticking probe `CAN_ASSUME`

**Assumed.** A cell counts as outside the loaded/accessible area when the stable block-query API cannot return a definite block there (undefined result or a thrown error), not via any experimental "is chunk loaded/ticking" API. Such cells are handled exactly like `L0-webs-r004`'s protected-block branch: skip, don't force-load, don't retry.

**Basis.** Project constraint C-2 forbids beta/preview API and experimental toggles; the stable `@minecraft/server` 2.10.0 surface has no dedicated "chunk loaded" query, so a defensive read is the only stable-API way to detect this.

**Impact if wrong.** If a stable "is loaded" query does exist at implementation time, this narrows to a direct check instead of a defensive try/read; the skip *behavior* (`L0-webs-r004`, `L0-webs-ac07`) is unaffected either way. Low.






### ASM-webs-02 — A cell that is already Cobweb counts as satisfied, not skipped `CAN_ASSUME` (L0-webs-as02)

---
is_a: ["assumption"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-ent3", "L0-webs-r005"]
---
# ASM-webs-02 — A cell that is already Cobweb counts as satisfied, not skipped `CAN_ASSUME`

**Assumed.** If a candidate cell already contains `minecraft:web` before the cast runs, it requires no write and counts toward the trap's success count (`TrapCube.successCount`, `L0-webs-ent3`) — it is not treated as a "protected"/skip cell.

**Basis.** Neither the raw spec nor Q-011/Q-013/Q-017 addresses pre-existing Cobweb explicitly; treating "already correct" as success (rather than as a no-op skip) is the reading consistent with the ability's stated goal ("form a trap") and with Q-017's zero-cells wording ("ни одна из 27 клеток не заменена" — replaced-or-already-right, not narrowly "newly written").

**Impact if wrong.** If the owner wants pre-existing Cobweb to count as "skipped" like a protected cell, repeated casts into a partially-webbed area could flip from success to `no-room` (`L0-webs-ac06`) purely from earlier casts — a behavior change to `L0-webs-r005`, not to the cube geometry itself. Medium.






### ASM-webs-03 — \ (L0-webs-as03)

---
is_a: ["assumption"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r004"]
---
# ASM-webs-03 — "Entities" in the protected-block filter includes non-player mobs, not only players `CAN_ASSUME`

**Assumed.** Decision Q-013's "клетки с живой сущностью не трогаются" (cells with a living entity are left untouched) is read as applying to any living entity — hostile/passive mobs included — not only players, matching the raw spec §6's unqualified "не удалять... сущности".

**Basis.** Neither §6 nor Q-013 restricts this to players; the general phrasing ("живая сущность" / "entities") and the project's broader "don't remove entities" posture (also seen in `L0-lgnd`'s scope) both point to an entity-type-agnostic rule.

**Impact if wrong.** If only players should block placement, cells with mobs (e.g. a cow standing in the volume) would additionally be filled around the mob today but could instead legitimately overwrite/displace it under a narrower reading — changes `L0-webs-r004`'s entity branch only. Low.






### Assumption — \ (L0-wind-as01)

# Assumption — "within 5×5 chunks" means the plot centre lies in the 5×5-chunk square around the spawn chunk

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r007, L0-wind-p002, L0-wind-ac01]`

- The square is the spawn chunk ±2 chunks (80×80 blocks). A 35×35 plot whose centre is inside it counts, even if its edge reaches into ring 3.
- Rationale: requiring the whole plot inside would leave only ~45×45 possible centres and make stage 1 fail more often for no gameplay benefit.
- **Impact if wrong:** low. If the client means "whole plot inside", stage 1 candidate generation shrinks; test 14's area check tightens. One constant.






### Assumption — \ (L0-wind-as02)

# Assumption — "≤ 500 blocks" and "nearest" use horizontal Euclidean distance from world spawn (x,z) to the plot centre

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r007, L0-wind-p002]`

- `d = hypot(cx − sx, cz − sz)`, Y ignored. World spawn = `world.getDefaultSpawnLocation()` x/z at first start (its Y may be a sentinel on a fresh world; it is not used).
- **Impact if wrong:** low. Chebyshev (square) distance would allow corners up to ~707 blocks; switching is one function.






### Assumption — blend band B = 6 blocks (grows to Bmax = 12), slope ≤ 1 block per block (L0-wind-as03)

# Assumption — blend band B = 6 blocks (grows to Bmax = 12), slope ≤ 1 block per block

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r009, L0-wind-e004, L0-wind-p003]`

- The spec only says "плавно соединять края … избегая грубой квадратной платформы с вертикальными стенами". Numbers are ours.
- B = 6 absorbs a 6-block height difference at slope 1. If larger, B grows up to 12; beyond that the candidate score is penalised so the search prefers gentler sites.
- **Impact if wrong:** visual only (iPad review, C-9). Wider band = more terrain changed around the Windmill; narrower = steeper banks. Tunable constants.






### Assumption — \ (L0-wind-as04)

# Assumption — "shallow void" depth D = 4 blocks below the target surface

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r010, L0-wind-e004]`

- Voids within 4 blocks under the levelled surface, and only under cells that need support, are filled. Anything deeper stays open under a 4-block natural cap.
- 4 blocks is enough to hold the template foundation and farmland/water ditches; the spec forbids filling deep caves "целиком".
- **Impact if wrong:** low–medium. Smaller D risks thin caps over caves (players may fall through when digging); larger D starts to look like plugging caves. One constant; iPad review.






### Assumption — \ (L0-wind-as05)

# Assumption — "best available dry land position" = lowest earthwork score, ties broken by distance to spawn

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-p002, L0-wind-e004, L0-wind-r007]`

- Eligible: liquid surface share ≤ 5 % *before* prep (dry land), no collision, all blocks in the prep volume on the natural whitelist, within 500 blocks.
- `score = cutVolume + fillVolume + 50·max(0, Δ − 2B) + 0.1·distance`. Lowest wins.
- The spec does not define "лучшая"; it does say the forced site must be dry land, and prefer nearer sites in stages 1–2.
- **Impact if wrong:** medium-low. The Windmill may appear farther from spawn than a client expects, or on a site that needs more earthwork. Weights are tunable.






### Assumption — a spawner-produced Vindicator carries an iron axe by vanilla default (L0-wind-as06)

# Assumption — a spawner-produced Vindicator carries an iron axe by vanilla default

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r003, L0-strf-r010]`

- Bedrock's vanilla Vindicator spawns holding an iron axe. A `mob_spawner` with `EntityIdentifier = minecraft:vindicator` should therefore satisfy §4.3/test 17 with no script.
- **Verify** in the `strf` probe: spawn 20 from the template spawner, assert all hold `minecraft:iron_axe` in the main hand.
- **Impact if wrong:** medium. Fallback: an `entitySpawn` handler equips an iron axe on Vindicators within 8 blocks of a registered Windmill/Airship spawner position (event-driven, no scan); recorded as a deviation. Shared with `airs`.






### Assumption — spawner zones stay at block light ≤ 7 (Lmax) (L0-wind-as07)

# Assumption — spawner zones stay at block light ≤ 7 (Lmax)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r003, L0-wind-ac06]`

- The exact Bedrock light threshold for monster spawners is not in the spec ("достаточно тёмными"). We keep every cell within 4 blocks horizontally / 1 vertically of each spawner at block light ≤ 7 by placing lanterns only on the far side of each floor (lantern light 15 falls off 1 per block → ≥ 8 blocks away).
- Sky light: the attic has a solid roof; windows avoid spawner line.
- **Impact if wrong:** medium. If Bedrock spawners require light 0, spawners stop working in the lit parts of floors → reposition lanterns in the template (no code change). Probe measures spawn rate with lanterns in place.






### Assumption — on Peaceful, the guard step is deferred until the difficulty is not Peaceful (L0-wind-as08)

# Assumption — on Peaceful, the guard step is deferred until the difficulty is not Peaceful

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r004, L0-strf-p004]`

- Bedrock removes hostile mobs on Peaceful; spawning 10 Zombie Villagers then would kill the one-time guards instantly and mark them "spawned".
- Rule: if `world.getDifficulty() === Peaceful` at `looted → guarded`, the instance stays `looted` and retries on the next discovery visit. The linked Airship waits too.
- Guards that already exist when a player switches to Peaceful are removed by vanilla and never restored (spec: no top-up).
- **Impact if wrong:** low. The spec is silent; a client may prefer "spawn anyway". The iPad world default is Normal.






### Assumption — field guards are adults, and zombie villagers do not convert to drowned in the ditches (L0-wind-as09)

# Assumption — field guards are adults, and zombie villagers do not convert to drowned in the ditches

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-e003, L0-wind-r004]`

- Guards are spawned as adults (via the entity's adult spawn event if the probe finds one; otherwise vanilla's baby chance is accepted and noted). The spec says only "Zombie Villagers".
- Vanilla Zombie Villagers do not convert to Drowned when submerged (only Zombies/Husks do), so guards walking into the water ditches stay guards. Probe confirms on 1.26.51.
- **Impact if wrong:** low. A baby guard is cosmetic; a drowned conversion would lose one guard's special status — acceptable, recorded.






### Assumption — installing into an existing world runs the spawn search once, with the natural-block whitelist protecting player builds (L0-wind-as10)

# Assumption — installing into an existing world runs the spawn search once, with the natural-block whitelist protecting player builds

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r008, L0-wind-r011, L0-wind-p002]`

- §4.7 note: the primary scenario is a new world; for an existing world "при необходимости допускается аналогичная одноразовая инициализация". We read "допускается" as *do it*, same rules.
- Player builds are not "detected structures" in the spec's sense, but the whitelist (`L0-wind-r008`) rejects any site containing crafted blocks, so a base is never flattened.
- **Impact if wrong:** medium. If the client wants no spawn Windmill in existing worlds, a single guard (world age / existing registry) skips the search.






### Assumption — `/tickingarea` works from `runCommand` on BDS 1.26.51.1 with a 10-area / 100-chunk limit (L0-wind-as11)

# Assumption — `/tickingarea` works from `runCommand` on BDS 1.26.51.1 with a 10-area / 100-chunk limit

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-ad01, L0-strf-p006]`

- `dimension.runCommand("tickingarea add <from> <to> andrew_ws_n")` succeeds without an operator player, loads the chunks within a few seconds, and `tickingarea remove` releases them.
- **Verify** in the `strf` probe: add a 10×10 window 400 blocks from spawn, poll `getBlock` until defined, time it, remove.
- **Impact if wrong:** high for §4.7 "at start". Fallback in `L0-wind-ad01`: search as the first player explores, deviation recorded; test 14 then passes only after the player has been online near spawn.






### Assumption — a naturally valid Windmill sits at the plot's modal surface Y, and the template's foundation skirt absorbs Δ ≤ 3 (L0-wind-as12)

# Assumption — a naturally valid Windmill sits at the plot's modal surface Y, and the template's foundation skirt absorbs Δ ≤ 3

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-p001, L0-wind-e001, L0-strf-r005]`

- The template carries 3 layers of natural-looking subsoil under the plot, so on terrain varying by up to 3 blocks no field cell floats and no wall is buried more than 3 blocks. This is part of the fixed template, not script terraforming, so §4.6 "не выравнивать" holds.
- Terrain above the plot surface inside the footprint (hills ≤ 3, trees) is overwritten by the template's air layers — the same effect as every discovery-time placement (`L0-adr-strc` §6).
- **Impact if wrong:** low-medium. If the client reads any tree removal as "levelling", the `flat` profile must also reject trees in the plot, cutting the 1 % yield further.






### Wrdn as01 concept assumption (L0-wrdn-as01)

**ASM-wrdn-01 · "Naturally generated" describes required behavior, not the placement mechanism**

§13.1/§13.5 call the city and its 8 Shriekers "naturally generated" and require them to behave exactly like vanilla worldgen output. Stable Bedrock Script API has no hook to inject custom content into actual chunk generation (same gap already flagged for the shared framework in `L0-xcx4`). The Windmill/Airship sections of the same doc use an explicit chunk-candidate-roll-then-fill pattern, and Mini Warden City's own §13.2 wording ("5% на подходящий чанк... генерация отменяется") is worded identically to theirs.

**Assumption:** Mini Warden City is placed post-hoc via script (a fill/place pass after the chunk has generated), exactly like its three siblings. "Naturally generated" in the spec means the Shriekers must be functionally indistinguishable from vanilla ones at runtime (full `can_summon` warning/Warden-summon participation) — it is not a demand for true vanilla structure/jigsaw injection.

**Impact if wrong:** if literal worldgen-time injection were required, it is very likely infeasible with stable Bedrock APIs at all; the project's own "closest stable approximation, document the deviation" directive would then apply anyway, so the practical implementation converges on the same approach regardless. Low risk.






### Wrdn as02 concept assumption (L0-wrdn-as02)

**ASM-wrdn-02 · No mobs beyond the 8 Shriekers (and Warden via their mechanic) are placed**

§13 never mentions spawners or one-time guard mobs for Mini Warden City, unlike Windmill (3 vanilla-like spawners + 10 persistent Zombie Villagers) and Mini Bastion (7–10 Piglins + 2 Piglin Brutes, explicitly "спавнеры не требуются, охрана — одноразовый набор").

**Assumption:** Mini Warden City deliberately ships with zero placed/spawned mobs of its own — the only hostile presence is the vanilla Shrieker→Warden chain, and ordinary ambient mob spawning in its dark interior (if any occurs under vanilla rules) is not a concern the spec addresses and is not something the add-on suppresses or augments.

**Impact if wrong:** if a guard mob or spawner was intended but dropped from the doc, difficulty/balance testing (and the acceptance-test sampling in `L0-wrdn-ac07`) would miss it. Medium-low risk — worth a one-line confirmation if the client is asked about the structure's difficulty.






