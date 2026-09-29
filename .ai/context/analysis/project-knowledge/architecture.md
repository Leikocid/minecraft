---
title: Architecture
type: project-knowledge
generated_at: "2026-09-29T19:09:13.626Z"
source_channel: rollout
node_id: rollout-architecture
aliases: ["rollout-architecture","architecture","project-knowledge/architecture"]
is_a: ["rollout","architecture"]
relates_to: ["L0-adr-hold","L0-adr-ochg","L0-adr-orbc","L0-lgnd","L0-orbc","L0-pntr","L0-ring"]
priority: 540
---

# Architecture

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Components

### Legendary weapon framework (shipped `src/legendary/`) — v3 delta (L0-lgnd)

---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-orbc", "L0-webs", "L0-scyt", "L0-pntr", "L0-ring", "L0-adr-orbc", "L0-adr-hold", "L0-adr-wpn2", "L0-adr-ochg", "L0-xcx9", "L0-xcx10", "L0-xcx11", "L0-xq3"]
governs_files: ["src/legendary/", "src/websword/trap.ts", "src/scythe/targeting.ts", "src/scythe/volley.ts", "src/orbital/", "src/main.ts", "src/gametest/main.ts"]
see_also: ["webswordspecv1ruen-part-1", "scytheofcalamityspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3"]
---
# Legendary weapon framework (shipped `src/legendary/`) — v3 delta

**Responsibility.** Every general legendary rule is implemented once, in `src/legendary/`, for three weapons: the Web Sword, the Scythe of Calamity and (v3) the Orbital Cannon. The general rules are Scythe §1 and §6, Web Sword §3, §4 and §8–§10, and Orbital §4, §5 and §7.

## Current state (verified in code, 2026-09-29)
The as-built shape in `L0-lgnd-ad07` still holds. No `src/legendary/` commit has landed since `120bdd5`. The **v2 backlog from `L0-adr-wpn2` has not shipped** (`L0-lgnd-cx11`):
- There is no `gen` on the mark or in the ledger.
- `_owed` is still a map `ownerId → one mark` (`recovery.ts:253`).
- `retention.ts` does not read the `Offhand` slot.
- No item JSON declares `minecraft:allow_off_hand`.
- `grep -rn orbital src/` finds nothing, so the Cannon is not started.

## v3 delta (this pass)
| # | Change | Artifacts |
|---|---|---|
| 1 | Add `ORBITAL_CANNON` to the static `LEGENDARIES`: `oc` / `orbital_cannon`, 600 ticks, refund 4 TNT + 1 Fishing Rod, `andrew:orbital` | `ent1`, `ac17`, `L0-adr-orbc` |
| 2 | Activation **mode**: `resolveActivation(player, mode)` with `"use" \| "attack"` and a per-def `activations`. Attack reads the main hand only. | `ad09`, `r015`, `p009`, `ac16` |
| 3 | Craft provenance: a recipe outputs a hidden **craft token** item. Plain `andrew:<weapon>` stacks (vanilla `/give`, Creative) never claim or refund (`xcx9`). | `ad08`, `r014`, `p001`, `ac15` |
| 4 | Loss return goes to the **last holder** (`holder` in the mark), with `owed` as a list keyed by holder (`xcx11`, answers `xq3`, realises `L0-adr-hold`) | `ad11`, `ent2`, `ent4`, `p003`, `ac08`, `ac18` |
| 5 | "Not destroyed" policy in three tiers: *prevent* (script-caused) → *spill* (vanilla container break) → *return* (fire, lava, cactus, TNT, Void). There is also a container-destruction rule (`xcx10`). | `ad10`, `r012`, `r013`, `ac09`, `ac20` |
| 6 | `protectLegendariesIn(dimension, volume)`, published for `pntr`/`ring` to call before they remove blocks or detonate | `p008`, `ac19` |
| 7 | The unshipped `wpn2` backlog (`gen`, owed list, off-hand read) is a **prerequisite** of 4 and 5 | `cx11` |

## Owns (unchanged, plus v3)
Everything it owned before, plus:
- the activation-mode resolver;
- craft tokens (the gate's half: the token → marked swap);
- the holder field;
- the destruction policy;
- `protectLegendariesIn`.

## Published contracts (v3)
- `LegendaryDef` gains `activations: ReadonlyArray<"use"|"attack">` (default `["use"]`) and `craftTokenId?: string`.
- `resolveActivation(player, mode = "use")`.
- `protectLegendariesIn(dimension, volume, opts?) → {moved, returned}`.
- `isLegendaryItemEntity(entity)`, which `ring` uses for drop suppression (`L0-adr-ochg` §3).
- `cooldown.*` and `isHiddenFromTargeting` are unchanged. The HUD gains a per-weapon key lookup: `andrew.<prefix>.ready/cooldown` if defined, else the shared `andrew.legendary.*` keys (which render `%s: Ready` / `%s: %s s`). The Cannon uses its own keys to render "Orbital Cannon — Ready" / "— 27s" (Orbital §7; `L0-adr-oded`).

## Does NOT own
- What an ability does: `trap.ts`, the Scythe volley, and the Cannon's charges and effects (`L0-orbc`, `L0-pntr`, `L0-ring`).
- The LMB target raycast and the Creative break cancel (`L0-orbc`).
- Item, entity and recipe JSON, including the token items' JSON (`webs`, `scyt`, `orbc`). `lgnd` only states the contract those files must meet (`r014`).

## Sequencing
One `lgnd` v3 task, in this order:
1. the `wpn2` backlog;
2. `holder`;
3. the tokens;
4. activation mode + the Cannon def;
5. `protectLegendariesIn`.

The `orbc` core tasks depend on items 4–5. They are also blocked on `L0-xq5` (LMB reach).

## Risk
- The token recipe change touches the shipped Web Sword and Scythe recipes. GameTests that simulate a craft by inserting an unmarked `andrew:web_sword` must insert the token instead. This is harness wiring, not an assertion (`L0-adr-lgnd` cx04 reading). `ac11` still gates it.
- A legendary nested inside a shulker box or bundle is invisible to every protection (`cx12`).







### L0-orbc · Orbital Cannon core (L0-orbc)

# L0-orbc · Orbital Cannon core

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-pntr", "L0-ring", "L0-adr-orbc", "L0-adr-ochg", "L0-xcx8", "L0-xcx13", "L0-xq5"]`

**State (2026-09-29):** not implemented. There is no `src/orbital/` and no `andrew:orbital_cannon` item. The framework that it plugs into is shipped: `src/legendary/{registry,hands,cooldown,hud,craftgate,retention,recovery}.ts`. **Task creation is blocked by `L0-xq5`/`L0-xcx8`**, the LMB reach question.

## Responsibility
The weapon shell shared by both attacks. It covers:
- the item, recipe and lang;
- the input and the target;
- the gate that decides whether an activation succeeds;
- the shared cooldown and the HUD entry;
- the **charge**: spawn, fall, contact, Void and lifecycle.

It owns no block or entity effect. Detonation is handed to `pntr` (LMB) or `ring` (RMB) through the charge contract (`L0-orbc-r014`).

## Not owned (referenced by id, not restated)
Owned by `lgnd`:
- the craft gate and the single Survival craft (ACs 1–2, `L0-xcx9`);
- retention on death, loss/Void return of the *item* and the last holder (`L0-xcx10`/`xcx11`, `L0-adr-hold`);
- cooldown storage (`cooldown.ts`, `cooldownKey`);
- hand resolution (`hands.ts`).

Owned by `pntr`/`ring`: the column and ring effects, drops and legendary protection in the blast.

## Inputs
- `world.afterEvents.itemUse`, `itemUseOn`/`playerInteractWithBlock` (RMB).
- `world.afterEvents.entityHitBlock` with a player damager, and `beforeEvents.playerBreakBlock` cancel (LMB). See `L0-adr-orbc` and the amendment `L0-orbc-ad01`.
- `Player.getBlockFromViewDirection({maxDistance: 10})`, `Dimension.heightRange`, `entityLoad`, and world startup.

## Outputs
- A cooldown write (`andrew:cd_orbital_cannon`, 600 ticks) through `lgnd` `startCooldown`.
- `andrew:orbital_charge` entities, moved by one bounded job per attack.
- `onDetonate(dimension, point, ownerId, mode)` calls to `pntr`/`ring`.
- An Action Bar segment through the shared `hud.ts`.

## Artifacts
- **Entities:** `ent1` item, `ent2` attack/target lock, `ent3` charge.
- **Processes:** `p001` activation, `p002` flight and detonation, `p003` lifecycle and cleanup.
- **Rules:** `r001`–`r014`.
- **ACs:** Orbital AC-3/4/5/6/16/18/19 plus item, HUD, input and dedup ACs. Each is split into `bds` or `ipad` (C-9).
- **ADRs:** `ad01` target source, `ad02` charge motion, `ad03` in-memory attacks with orphan sweep.
- **Assumptions:** `as01`–`as08`.
- **Contradictions:** `cx01` HUD wording, `cx02` touch aim point, `cx03` Nether roof clamp.

## Stage-5 order
`lgnd` delta → `orbc` with a stub effect (`onDetonate` logs, plays one sound) → `pntr` → `ring`. The stub lets AC-3/4/5/6/16/18/19 go green on BDS before any block is removed.

## Constraints honoured
- C-2: stable API 2.10.0 only.
- C-5a′: no permanent tick loop; the job ends with its last charge.
- C-7′: no duplication.
- C-15: priority order.
- C-16: limitation notes go in `src/orbital/` comments.
- C-17: cooldown.
- C-19: no leftovers.
- C-20: two-player tests.







### LMB penetrator (`pntr`) (L0-pntr)

# LMB penetrator (`pntr`)

**Status.** Analysis only. `src/orbital/` does not exist yet (checked 2026-09-29). Stage 5 order: `lgnd` delta → `orbc` → **`pntr`** → `ring`.

## Responsibility
This component is the *effect* half of the Orbital Cannon's LMB mode (Orbital §9, §12; ACs 7–10). `orbc` owns input, the target lock, the cooldown, the charge entity, its fall and the detonation. `pntr` starts when `orbc` calls `onDetonate(dimension, point, ownerId, mode="lmb")` and owns everything after that:

1. **Plan** an irregular, roughly 5×5 vertical column. It runs from the detonation cell down to `dimension.heightRange.min` (`L0-pntr-r001`).
2. **Classify** each cell as *keep* (air, liquids, Survival-unbreakable; `L0-pntr-r002`) or *remove* (everything else, including Obsidian, Nether portal, containers and spawners; `L0-pntr-r003`). A kept cell never ends the column.
3. **Protect legendaries** in container cells before removal through `lgnd`'s `protectLegendariesIn` (`L0-pntr-r005`).
4. **Remove** the blocks with no drops (`L0-pntr-r004`), batched top-down in one bounded `system.runJob` job that looks instant (`L0-pntr-p002`, `L0-pntr-cons`).
5. **Present** the effect with exactly one loud explosion sound at detonation and a ~1 s top-down particle wave (`L0-pntr-p003`).
6. Deal **no direct damage** (`L0-pntr-r006`). Fall, lava and suffocation happen naturally.

## Inputs
- From `orbc`: `dimension`, the integer detonation `point` (the solid cell the charge touched, or the cell it spawned inside), `ownerId` and `attackId`. The attack id seeds the irregularity.
- From `lgnd`: `protectLegendariesIn(dimension, volume, {avoid})`, specified in `L0-lgnd-p008` under the shared contract `L0-adr-oprt`. `pntr` passes the column footprint over its full height, once per attack, before its first `setType`. Item frames in the column are handled by `lgnd` (`L0-adr-oprt` §3).
- Engine: `dimension.heightRange`, `Dimension.getBlock`, `Block.setType`, `Block.isWaterlogged`/`setWaterlogged`, `BlockInventoryComponent`, `Dimension.playSound`, `Dimension.spawnParticle`, `system.runJob` (all stable in 2.10.0).

## Outputs
- World mutation: column cells set to `minecraft:air` (or to water for waterlogged cells; `L0-pntr-as04`).
- Legendaries from column containers, re-dropped outside the column by `lgnd`.
- One sound event, a bounded particle job and an optional debug/gametest report `{attackId, cellsScanned, cellsRemoved, cellsKept, ticksUsed}`.
- No entities of its own. `pntr` spawns nothing that outlives the attack (C-19).

## Not owned here
- Cooldown, target lock, the charge's look and fall, the Void and unload rules: `orbc`.
- Loss return, the craft gate and the holder field: `lgnd`.
- The TNT-like explosion, damage and drop suppression: `ring`. `pntr` never calls `createExplosion` (`L0-adr-ochg` §4).

## Key decisions and open items
- `L0-pntr-ad01`: a per-cell scan plus `setType` in one top-down `runJob`, rather than `fillBlocks` or a synchronous loop.
- `L0-pntr-ad02`: a deterministic seeded mask with a 3×3 core that is always removed and ragged rims that change per band.
- `L0-pntr-ad03`: a particle wave as a separate 20-tick bounded job with capped emitters.
- `L0-pntr-cx01` (open): legendaries in **item frames** cannot be protected on stable 2.10.0.
- Assumptions `L0-pntr-as01`…`as08` cover things to probe on BDS, such as throughput, container spill, liquid flow and waterlogging.

## Sibling overlap
- `ring` shares the charge contract and the legendary protection call, but has opposite block rules: `ring` follows TNT resistance, while `pntr` ignores it.
- The `xasm6` keep list is `pntr`-only. `ring` needs no list because the engine explosion enforces resistance.
- Structure blocks (C-13) are ordinary, so LMB can core the Warden City monument (Reinforced Deepslate is removed under `xasm6`) and structure chests. Structure persistence rules allow this.







### RMB rings (`ring`) (L0-ring)

# RMB rings (`ring`)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-orbc", "L0-pntr", "L0-lgnd", "L0-adr-ochg", "L0-xasm7", "L0-xasm8", "L0-xcx10"]`

**Status (2026-09-29).** Analysis only. `src/orbital/` does not exist, and nothing in `src/` calls `createExplosion` or writes `doTileDrops` (checked). Stage 5 order: `lgnd` delta → `orbc` → `pntr` → **`ring`**. The typings for stable `@minecraft/server` 2.10.0 expose `ExplosionOptions {allowUnderwater, breaksBlocks, causesFire, source}`. `world.gameRules.doTileDrops` is writable outside restricted execution.

## Responsibility
This component is the *effect* half of the Orbital Cannon's RMB mode (Orbital §10, §12, §15; ACs 11–15). It registers `registerEffect("rmb", …)` against the charge contract `L0-orbc-r014`, and owns:
1. **Layout.** `layout(target)` returns the charge columns for five continuous rings at d ≈ 1/5/10/15/20 (`L0-ring-r001`, `L0-ring-p001`, `L0-xasm8`). `orbc` spawns them all in one tick (`L0-ring-r002`).
2. **Detonation.** On `onDetonate(dim, point, ownerId, "rmb", attackId)`, the blast is queued. A global, bounded detonation queue drains it at ≤ `RING_MAX_BLASTS_PER_TICK` per tick (`L0-ring-p003`, `L0-ring-ad02`).
3. **Blast.** For each queued blast: protect legendaries, then one `dimension.createExplosion(centre, 4, …)`. The blast deals TNT damage, including to the owner (`L0-ring-r004`), and breaks blocks by TNT resistance (`L0-ring-r005`). It causes no fire. Underwater, it deals damage only (`L0-ring-r007`). All of this runs in `L0-ring-p002`.
4. **Drop suppression.** Broken blocks and destroyed containers leave no items (`L0-ring-r006`, `L0-xasm7`). Mob loot, XP and players' death drops stay vanilla. The mechanism is a scoped `doTileDrops` toggle (`L0-ring-ad01`). It departs from the snapshot-diff in `L0-adr-ochg` §3; see `L0-ring-cx01`.
5. **Independence and cleanup.** No blast moves, removes or triggers another charge (`L0-ring-r003`). After the attack, no ring-made entity or item is left (`L0-ring-r009`, C-19).

## Inputs
- From `orbc`: `target` for `layout`, then `dim`, `point`, `ownerId` and `attackId` per detonation (`L0-orbc-r014`). `point` is a solid contact cell in a loaded chunk.
- From `lgnd`: `protectLegendariesIn(dimension, volume, {avoid})` (`L0-lgnd-p008`) and `isLegendaryItemEntity`.
- Engine: `Dimension.createExplosion`, `world.gameRules.doTileDrops`, `Dimension.getBlock`, `Dimension.getBlocks`, `Dimension.getEntities`, `world.getEntity`, and `system.runInterval` (run only while its queue is non-empty).

## Outputs
- Column list (~140–160 `{x,z}`) per attack.
- Engine explosions. Each one plays its own sound and particles and applies damage and knockback.
- World mutation: blocks broken per TNT resistance, with no item drops.
- Legendaries in the blast AABB, moved to a safe spot by `lgnd`.
- An optional gametest report per attack: `{attackId, charges, blasts, maxBlastsInTick, ticksToDrain, itemsSuppressed, legendariesMoved}`.

## Not owned (referenced, not restated)
- Target lock, cooldown, spawn height, fall, Void/unload, orphans: `L0-orbc` (`p001`–`p003`, `r007`–`r011`).
- Retention, loss return, craft gate: `L0-lgnd`.
- The LMB column: `L0-pntr`. `ring` shares its charge contract and legendary call, but has the opposite block rule. `ring` follows TNT resistance through the engine, so it needs no keep list.

## Artifacts
- **Entities:** `ent1` Ring Layout, `ent2` Queued Blast, `ent3` Drop-Suppression Window.
- **Processes:** `p001` rasterise, `p002` one blast, `p003` detonation queue and load shaping.
- **Rules:** `r001`–`r010`.
- **Constraints:** `cons` (RG-1…RG-6).
- **ACs:** `ac11`–`ac15` (bds), `ai11`/`ai12`/`ai15` (ipad), `ac16` legendaries, `ac17` load, `ac18` cleanup and preserved loot.
- **ADRs:** `ad01` drop suppression, `ad02` queue cap, `ad03` underwater flags, `ad04` batched protection.
- **Assumptions:** `as01`–`as08`.
- **Glossary:** `gl01`–`gl05`.
- **Contradictions:** `cx01` (drop suppression in `L0-adr-ochg`), `cx02` (`lgnd` protection radius and safe-spot search).

## Constraints honoured
- C-2: stable API only.
- C-5a′: the queue loop exists only while blasts are queued.
- C-7′/C-15: a rank-1 failure keeps the gamerule restored and the item in the world.
- C-12: no write to unloaded chunks.
- C-16: deviations go in `src/orbital/ring.ts` comments.
- C-19: no leftovers.
- C-20: tests use two players.







## Architecture Decisions

### ADR-L0-hold · Legendary loss return goes to the last holder (L0-adr-hold)

# ADR-L0-hold · Legendary loss return goes to the last holder

**Status:** proposed. It needs a one-line client confirmation, because the Orbital spec is newer than `xq3` but does not say "overrides". **Context.**
- `L0-xq3` asked whether a lost legendary returns to the crafter or to the last holder. Meanwhile the as-built code returns it to the mark's `owner` (the crafter).
- Orbital §5, which restates the *general* legendary rule, says: "returns to the **last owner**; if offline, on next join". It also says the weapon "is not bound to its creator forever" and can be handed to another player.

**Decision.**
- Add `holder` (player id plus name) to the mark.
- Rewrite `holder` on every `playerInventoryItemChange` that surfaces the instance in a player's inventory. A container never becomes the holder.
- Loss return and offline delivery target `holder`. When no holder was ever recorded (admin copies), fall back to `owner`.
- The `_owed` list per player from `L0-adr-wpn2` is keyed by holder.
- The generation guard (`gen`) from `adr-wpn2` stays mandatory.

**Rejected.**
- Keep the crafter: this contradicts Orbital §5 and turns "transfer" into a loan.
- Last player to *touch* the item entity: there is no stable event for that, and it can be spoofed by a hopper.

**Consequences.** It applies to Web Sword and Scythe too. `lgnd-ac*` loss-return criteria get rewritten. `L0-xq3` closes once the client confirms.







### ADR-L0-ochg · Script-driven charges and programmatic explosions instead of primed TNT (L0-adr-ochg)

# ADR-L0-ochg · Script-driven charges and programmatic explosions instead of primed TNT

**Status:** proposed. **Context.**
- Orbital §8 and §10 need charges that pass through entities, stop on the first *block*, are not pushed by neighbouring blasts, drop nothing and cause no fire.
- Vanilla `minecraft:tnt` gets knocked back by other explosions, chain-primes other TNT, drops blocks, and cannot be told to ignore entities.
- §12 explicitly allows "controlled script-driven charge entities/visuals and programmatic explosions".

**Decision.**
1. **The charge is a script-moved, visual-only entity.** `andrew:orbital_charge`: TNT geometry (scaled ~1.2 for LMB, 1.0 for RMB), no collision with entities, `minecraft:pushable` false, `knockback_resistance` 1, no physics, no damage sensor effects. The script teleports it down each tick at a fixed speed, and each step checks only the block cells it crosses. When a charge is in a solid cell at spawn, it detonates in that tick.
2. **One bounded job per attack** moves all of that attack's charges. The job ends when the last charge is gone. That keeps C-5a′.
3. **RMB detonation** uses `dimension.createExplosion(point, 4, {breaksBlocks: !underwater, causesFire: false, allowUnderwater: true, source: owner})`, so TNT damage and self-damage come from the engine. **Drop suppression:** *withdrawn in v3 reduce; see `L0-adr-odrp`* (a scoped `doTileDrops=false` around the synchronous blasts). The original snapshot-diff of new item entities also deleted death drops and mob loot (`L0-ring-cx01`).
4. **LMB detonation** does not use an explosion. `pntr` removes the blocks directly (`setType(air)`), plays one explosion sound, and runs the particle job.
5. **Lifecycle.** Charges are tagged with the attack id. On `entityLoad` of an orphan charge (after an unload or restart), remove it. The cooldown is never touched.

**Rejected.**
- Vanilla primed TNT: it chain-reacts and gets pushed, and drops can't be controlled.
- Falling blocks: entity-stoppable and drops sand-like items.
- A pure particle "virtual" charge with no entity: no visible TNT, which fails §9/§10 visual identity on iPad.

**Risk.** `createExplosion` knockback still moves players and mobs; that is wanted. Whether the engine gives item drops for blocks broken by a script explosion must be measured on BDS 1.26.51.1. That is a probe item for `ring`.







### ADR-L0-orbc · Orbital Cannon is a third LegendaryDef with its own module and dual input (L0-adr-orbc)

# ADR-L0-orbc · Orbital Cannon is a third LegendaryDef with its own module and dual input

**Status:** proposed. **Context.** Orbital §1 asks for a *standalone* module that is portable into "the full PvP add-on". This repo already is that add-on. It has a static `LEGENDARIES` registry and per-weapon subscriptions filtered through `resolveActivation` (`L0-adr-wpn2` amending `L0-adr-cast`). The Cannon is the first weapon with **two** activations (Attack and Use), and both share one cooldown.

**Decision.**
1. Add `ORBITAL_CANNON: LegendaryDef` with `itemId andrew:orbital_cannon`, `keyPrefix "oc"`, `abilityKey "orbital_cannon"`, `cooldownTicks 600`, `craftGate true`, refund `[["minecraft:tnt",4],["minecraft:fishing_rod",1]]` and `command andrew:orbital`. The weapon body lives in `src/orbital/` and imports only `src/legendary/*` public contracts.
2. **Input.** RMB = `world.afterEvents.itemUse` (plus `itemUseOn` / `playerInteractWithBlock` deduped per tick). LMB = `world.afterEvents.entityHitBlock` where the damager is a player holding the Cannon, with a `beforeEvents.playerBreakBlock` cancel so Creative LMB does not break the targeted block. Both paths resolve the target through one `getBlockFromViewDirection({maxDistance: 10})` call at activation time. They do not use the event's block, so the target rule is the same for both modes.
3. `resolveActivation` gets a `mode` argument. Hand priority (main, then off) is unchanged.

**Rejected alternatives.**
- A separate behavior pack for "standalone": it would need a second craft gate and a second mark scheme and would break C-7′.
- Detecting LMB through `entityHitEntity` or the swing animation: there is no stable "swing" event.
- A beta `playerButtonInput` or input API: this violates C-2.

**Consequences.** LMB inherits the vanilla reach limit. See `L0-xcx8`: if the client insists on 10 blocks for LMB, only a stable workaround such as sneak+Use can deliver it.







