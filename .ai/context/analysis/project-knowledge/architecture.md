---
title: Architecture
type: project-knowledge
generated_at: "2026-10-03T14:58:23.875Z"
source_channel: rollout
node_id: rollout-architecture
aliases: ["rollout-architecture","architecture","project-knowledge/architecture"]
is_a: ["rollout","architecture"]
relates_to: ["L0-adr-ktfl","L0-adr-ktgr","L0-adr-ktob","L0-katn","L0-lgnd"]
priority: 600
---

# Architecture

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Components

### Dragon Katana (`andrew:dragon_katana`) (L0-katn)

---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-lgnd-p001", "L0-lgnd-p002", "L0-lgnd-p003", "L0-lgnd-p004", "L0-lgnd-p005", "L0-lgnd-p008", "L0-webs", "L0-scyt", "L0-magn", "L0-adr-ktob", "L0-adr-ktfl", "L0-xasm18", "L0-xasm19", "L0-xasm20", "L0-xasm21", "L0-xasm22", "L0-xcx21"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
governs_files: ["src/katana/", "packs/behavior/items/dragon_katana.json", "packs/behavior/recipes/dragon_katana*.json", "packs/resource/texts/*.lang"]
---
# Dragon Katana (`andrew:dragon_katana`)

**Responsibility.** This component owns what is unique to the fourth legendary weapon:
- the item and recipe identity (`L0-katn-ent1`, `L0-katn-r001`);
- the teleport ability body: trace → safe cell → teleport → cooldown (`L0-katn-p001`, rules `r002`–`r005`);
- the one-shot fall flag (`L0-katn-p002`, `L0-katn-ent2`, `r006`);
- the cherry-petal trail (`L0-katn-r007`);
- the Katana HUD strings (`L0-katn-r008`);
- the GameTests for T04–T15 and the Katana call sites of T01–T03 and T16–T18.

It is the Katana's counterpart to `L0-webs` (trap body) and `L0-sprj`/`L0-scyt` (volley body). All four plug into `L0-lgnd`.

**Not owned here (cite `lgnd`, do not restate).**
- One Survival craft per world, the persistent flag, refund, Creative and `/give` copies, first-craft broadcast: `L0-lgnd-p001`.
- Death retention, and a contained item left alone: `L0-lgnd-p002`.
- Void, offline and owed return: `L0-lgnd-p003`.
- Orbital blast and ring protection: `L0-lgnd-p008`.
- Hand priority (main hand first, then a ready off hand): `L0-lgnd-p004`, through the shipped `resolveActivation` (`src/legendary/hands.ts:35`).
- The cooldown clock (`startCooldown`, epoch ms, `src/legendary/cooldown.ts:47`) and the shared HUD pass: `L0-lgnd-p005`.
- The T17 reading under C-16: `L0-xcx21`, `L0-xasm22`.

**What `katn` adds to the framework.** Def #4 in `LEGENDARIES` with `hudKeys` set: the def field already exists and the Orbital Cannon uses it. Nothing else. If a probe shows a framework hook is needed, that is an L0 contradiction, not a local patch (plan §"lgnd answers first").

**Inputs.**
- `world.afterEvents.itemUse`, plus `playerInteractWithBlock` for the same press, de-duplicated as in `src/websword/trap.ts`.
- The server-side `player.getHeadLocation()` and `getViewDirection()`.
- Block state along the segment.

**Outputs.**
- One `player.teleport(B, { keepVelocity: false, rotation kept })` in the same dimension.
- `startCooldown(player, "dragon_katana")`.
- An in-memory fall flag.
- A bounded burst of pink petal particles A→B.
- No block edits, no damage and no entities.

**Core flow** (`L0-katn-p001`): resolve → trace (`L0-adr-ktob`, refined by `L0-katn-ad01`) → endpoint (`L0-xasm18`, `L0-katn-as01`) → safe-cell search (`L0-xasm19`, `L0-katn-r004`) → teleport → cooldown → fall flag → trail. Any refusal leaves no state: no teleport, no cooldown, no message.

**Constraints honoured.**
- C-24: server-authoritative, ≤ 20, unreadable = solid, no block edits.
- C-25: the fall flag is one-shot, bounded and not persisted.
- C-5e: a one-shot trail; the watcher costs nothing while no flag is set.
- C-21: epoch-ms clocks.
- C-16: closest stable behaviour, deviations documented.

**Open items.**
- `L0-katn-cx01`: resolved at reduce v6 by amending `L0-adr-ktob` §3 (fits ≠ safe).
- `L0-katn-as01` … `as04`: endpoint geometry, aim source on iPad, hazards, the fall look-ahead.

**Probe first** (before any build task): (1) a self-teleport mid-fall resets fall distance (`L0-adr-ktfl`); (2) the ray flags: liquids skipped, cobweb/grass/carpet passable, slabs and fences hit; (3) `getBlockFromRay` behaviour at an unloaded chunk; (4) `minecraft:cherry_leaves_particle` via `spawnParticle` renders on iPad.

**Channels.** `bds`: T01–T18 as GameTests (`L0-katn-ac01` … `ac08`). `ipad`: trail, HUD, icon, Creative placement, aim feel (`L0-katn-ac09`).







### Legendary weapon framework (`src/legendary/`), v6: as built in 1.4.4, plus the Dragon Katana delta (L0-lgnd)

---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-orbc", "L0-webs", "L0-scyt", "L0-pntr", "L0-ring", "L0-magn", "L0-stgt", "L0-adr-hold", "L0-xcx11", "L0-xcx21", "L0-xasm22", "L0-lgnd-ad12", "L0-lgnd-ad14", "L0-lgnd-r017", "L0-lgnd-cx14"]
governs_files: ["src/legendary/", "src/websword/trap.ts", "src/scythe/targeting.ts", "src/orbital/activation.ts", "src/main.ts", "src/gametest/main.ts", "tests/legendary-registry.test.mjs"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3", "ufomagnetspecv1ruen-part-4", "orbitalcannonspecv1ruen-part-1"]
---
# Legendary weapon framework (`src/legendary/`), v6: as built in 1.4.4, plus the Dragon Katana delta

**Responsibility.** Every general legendary rule is implemented once, for every def in `LEGENDARIES`:
- the craft gate with tokens, and the first-craft broadcast
- marks and generation
- death retention
- loss return and the owed list
- protection from script-caused destruction (`protectLegendariesIn`)
- hand priority (`resolveActivation`)
- cooldown and busy
- HUD
- `hidden_until`
- the type predicate `isLegendaryStack`

v6 adds the **fourth def, the Dragon Katana** (`katn`). It needs **no framework code**, only data (`ad14`).

## As built in 1.4.4 (verified in code, 2026-10-03), see `ad12`
**Shipped**
- gen guard, owed list, pending list, off hand, craft tokens, `fire_resistant`, `protectLegendariesIn`, `isLegendaryItemEntity`, departure tracking.
- `heldLegendaries(player)` and `resolveActivation(player)` (`hands.ts:18`, `:35`). The resolver is Use-priority only: main if ready and not busy, else off. It has **no `mode` argument**, and the Cannon's LMB latch stays in `orbital/activation.ts`. That remains the as-built answer to `ad09`.
- `isLegendaryStack` (`registry.ts`). It is type-based over every def's `itemId` and `craftTokenId`, and `magn` uses it.
- **Void holder return** (merge `0a9d2b5`). `recovery.ts:135` `VOID_HOLDER_TYPES` = chest and hopper minecart. `beforeEvents.entityRemove` below `heightRange.min` reads the minecart's container, and every live marked instance goes through `lost()` on the next tick.

**Still open**
1. **`holder`.** `lost()` targets `w.mark.owner` (`recovery.ts:477`), and the protect hand-back targets `mark.owner` (`:785-787`). Katana §3 ("последнему владельцу", to the last owner) is the fourth spec asking for the last holder. **`L0-xcx11` stays open**, and `ad11`/`ac18` are unbuilt.
2. **Armour stand in the Void.** Its hands cannot be read on 2.10.0, so a legendary it holds is lost when the stand falls (`README.md:71`, `probe_ufo_holder_void`). Filed as `cx14`. The magnet avoids it (`r016`). Nothing else in the add-on moves an armour stand.
3. Nested shulker and bundle contents (`cx12`). The hopper-minecart stale copy (`as15`, `cx02`).

## v6 Katana delta
| # | Change | Artifacts |
|---|---|---|
| 1 | Def #4 `DRAGON_KATANA`: `andrew:dragon_katana`, prefix `dk`, ability `dragon_katana`, 600 ticks, token `andrew:dragon_katana_crafted`, refund 2 golden apple + 2 ender pearl + 1 diamond sword, command `andrew:katana`, `hudKeys` for the em-dash string | `ad14`, `as17` |
| 2 | Uniqueness-flag key `andrew:dk_crafted` (with `andrew:dk_crafted_by`), derived by `keysFor` | `ad14`, `ac23` |
| 3 | The registry uniqueness test also covers `craftTokenId` and `textPrefix` (as `ac11` asked; today it checks 4 fields) | `ac23` |
| 4 | No per-weapon code needed in `isLegendaryStack`, retention, recovery, `protectLegendariesIn`, the craft gate, commands or the HUD: each iterates `LEGENDARIES` or calls `defForStack`/`defForToken` | `ad14` |
| 5 | T16–T18 for the Katana under C-16. Fire and lava are prevented; Orbital blast and rings are prevented through `protectLegendariesIn`; cactus, TNT and despawn are **returned**; the Void returns to `owner` until `xcx11` closes | `ac24`, `L0-xcx21`, `L0-xasm22` |
| 6 | A wielder teleport is not a loss event, and every Katana teleport stays in the player's own dimension | `r017`, `ac24` |

## Published contracts (unchanged)
- `LEGENDARIES`, `defForStack`, `defForToken`, `isLegendaryStack`.
- `isReady`, `startCooldown`, `setBusy`, `clearBusy`, `isBusy`.
- `heldLegendaries(player)`, `resolveActivation(player)`.
- `protectLegendariesIn(dim, box, {avoid, reason}) → {moved, handedBack}`.
- `isLegendaryItemEntity`.
- `isHiddenFromTargeting`, `hideFromTargeting`.

## Does NOT own
- The Katana's trace, safe cell, teleport, fall flag and trail (`katn`, `L0-adr-ktob`, `L0-adr-ktfl`).
- Item, token and recipe JSON, and the lang strings (`katn`).
- The magnet's selection (`magn`).

## Next task (one `lgnd` task, for the Katana; it lands with `katn` item 2)
1. Add `DRAGON_KATANA` to `LEGENDARIES`.
2. Extend the uniqueness test.
3. Add key-derivation asserts for `dk`.
4. Add the Katana instances of the framework GameTests (`ac23`, `ac24`).

`holder` is a separate task, still blocked on `L0-adr-hold`.







## Architecture Decisions

### ADR-L0-ktfl · One-shot fall protection (L0-adr-ktfl)

---
title: "ADR-L0-ktfl · One-shot fall protection by resetting fall distance just before the landing"
aliases: ["L0-adr-ktfl", "Katana fall ADR"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-xasm20"]
see_also: ["dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
governs_files: ["src/katana/"]
---
# ADR-L0-ktfl · One-shot fall protection

**Status:** proposed (autopilot default). It is subject to a `katn` probe before the build.

## Context
- Katana §7 / T11 / T12: the first landing that follows a teleport deals no fall damage. The next ordinary fall deals normal damage. This must not become standing immunity (C-25).
- Stable 2.10.0 has **no damage before-event**. `entityHurt` is an after-event: it cannot stop a lethal fall.
- A measured engine fact: a player who is teleported carries **no stored fall distance**. So the risk is only the fall that **starts at B**, when B is in the air or above a drop.

## Decision
1. On a successful teleport, set a per-player, in-memory flag `{ until: Date.now() + bound }` (bound: `L0-xasm20`).
   - If B is already supported, the flag is still set. The first `isOnGround` tick consumes it.
2. One `katn`-local watcher interval visits only flagged players (C-5e). It exists only while a flag is armed, following the Orbital precedent; it is not a framework hook (`L0-katn-p002`, reconciled at reduce v6):
   - It consumes the flag on the first tick the player is on the ground, in a liquid, climbing, or gliding, or when they die, change dimension or leave.
   - While the player is falling (`velocity.y < 0`) and the ground is within the look-ahead (`max(2, ceil(|velocity.y|)+1)` blocks, `L0-katn-as04`), it **re-teleports the player to their own current location**, keeping the facing. That resets fall distance, and the landing deals no damage. It clears the flag in the same tick.
3. The flag is never persisted (C-23, C-25). A restart mid-fall drops the protection; that is accepted.

## Rejected alternatives
- **`resistance` amplifier 255 until landing.** It blocks *all* damage, PvP hits included, during the window. That is standing immunity in disguise.
- **`slow_falling` from B.** It changes how the descent looks and plays: a visible float that the spec does not ask for, and an exploitable glide.
- **Heal the damage in `entityHurt`.** A lethal fall kills before the after-event, so it fails T11 at height.
- **Teleport B to the ground below.** That contradicts "a point in the air is a valid destination" (§5).

## Consequences
- The probe must confirm three things on BDS 1.26.51 with a SimulatedPlayer:
  - that a self-teleport mid-fall resets fall distance;
  - the 2-block look-ahead at terminal velocity (about 3.9 blocks per tick). The look-ahead may need to scale with `velocity.y`;
  - that a self-teleport near a ledge does not snag on it.
- If the reset does not hold, `katn` supersedes this ADR. The fallback is `slow_falling` applied only in the last ticks before landing.







### ADR-L0-ktgr · The Katana inherits the framework's C-16 deviations (L0-adr-ktgr)

---
title: "ADR-L0-ktgr · The Katana inherits the framework's documented C-16 deviations unchanged; no Katana-specific recovery code"
aliases: ["L0-adr-ktgr", "Katana global-rules ADR"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-lgnd", "L0-xcx21", "L0-lgnd-cx14", "L0-xcx11", "L0-adr-hold", "L0-xasm22", "L0-lgnd-ad14", "L0-lgnd-r016", "L0-lgnd-r017", "L0-lgnd-ac24", "L0-katn-ac07", "L0-katn-r002"]
requires: ["L0-lgnd-ad14", "L0-lgnd-r017"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-3", "L0-xq6"]
governs_files: ["src/legendary/", "src/katana/"]
---
# ADR-L0-ktgr · The Katana inherits the framework's C-16 deviations

**Status:** accepted at reduce v6 as the autopilot default. The operator confirms or overturns it through `L0-xq6`, which does not block the build.

## Context
Katana §3/§13 asks to "preserve all global legendary-item rules". Both children agree that the framework meets those rules as built, by registering def #4 (`L0-lgnd-ad14`, `L0-xasm22`). Two child findings asked the reduce whether the **existing** deviations also bind the new weapon:
- `L0-xcx21`: T17 says the item "survives" cactus and TNT. As built, the item is destroyed and a marked copy is **returned** (C-16, the reading accepted when `xcx10` closed).
- `L0-lgnd-cx14`: a legendary held by an **armour stand** that falls into the Void is lost. Stand hands cannot be read on 2.10.0, and only chest and hopper minecarts are `VOID_HOLDER_TYPES` (`recovery.ts:135`, as read 2026-10-03).

## Decision
1. **T17 = the shipped three-tier reading** for the Katana, as for the other three weapons:
   - fire and lava are prevented (`fire_resistant`);
   - Orbital blast and ring are prevented (`protectLegendariesIn`);
   - cactus, TNT and despawn are returned (immediately, or owed).
   - The test text is `L0-lgnd-ac24`, which `L0-katn-ac07` now cites instead of restating. **Resolves `L0-xcx21`.**
2. **T18 target is `mark.owner`** until `L0-xcx11` / `L0-adr-hold` closes. The Katana's "последнему владельцу" adds a fourth spec voice to that open question but does not change it. Nothing in `katn` reads or writes `holder`.
3. **The armour stand in the Void is a documented C-16 deviation for all four legendaries** (`cx14` option a). The Katana adds no exposure:
   - its ability moves only the wielder, edits no block and spawns no entity (`L0-katn-r002`, `L0-lgnd-r017`);
   - the magnet skips holders that carry a legendary (`L0-lgnd-r016`).

   Option (b), a `hasitem` probe, stays a backlog note: it could detect a legendary type but never read its mark, so the best it could do is re-issue the ledger's last instance. **Resolves `L0-lgnd-cx14`** as a recorded deviation.
4. **No Katana-specific recovery, retention or HUD code.** The only framework delta is def #4 (`L0-lgnd-ad14`). Any later need for a hook ("rooted" for traps, `L0-xasm21`; a craft-time ingredient read, `L0-lgnd-as17`) is raised as an L0 contradiction, not patched locally.

## Rejected
- **A per-weapon Void or TNT path for the Katana.** It splits one policy into four, against `L0-lgnd-ad14`.
- **Holding the Katana build until `xcx11` closes.** T18 already passes against `mark.owner`; the holder change is one line in `lost()` and is reused by all four weapons.

## Consequences
- `L0-xcx21` and `L0-lgnd-cx14` close as resolved, pointing here.
- The module README's deviation list gains one line, "armour stand in the Void: lost", which covers all four legendaries.
- If the operator rejects item 1 or 3 via `L0-xq6`, the fix belongs in `lgnd` and applies to all four weapons.







### ADR-L0-ktob · The Katana's obstacle semantics (L0-adr-ktob)

---
title: "ADR-L0-ktob · The Katana's obstacle semantics: the engine's solid ray, not the Scythe's line of sight"
aliases: ["L0-adr-ktob", "Katana obstacle ADR"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-scyt", "L0-xasm18", "L0-xasm19", "L0-katn-ad01", "L0-katn-as03", "L0-katn-cx01", "L0-lgnd-r017"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
governs_files: ["src/katana/"]
---
# ADR-L0-ktob · The Katana's obstacle semantics

**Status:** proposed (autopilot default). `katn` confirms it by probe.

## Context
- Katana §5/§13 says "solid blocks stop the trace, water and lava do not", and "never phase through a solid obstacle".
- Stable `@minecraft/server` 2.10.0 has **no runtime `Block.isSolid`** (an engine fact).
- The only shipped precedent is the Scythe's `hasLineOfSight` (`src/scythe/targeting.ts`). It treats **every non-air, non-liquid block** as an obstacle, including tall grass, flowers, cobweb and glass. That is right for "can I see a target". For a teleport it is wrong: a flower 3 blocks ahead would stop a 20-block jump.

## Decision
1. **Trace.** Use `dimension.getBlockFromRay(head, viewDir, { maxDistance: 20, includePassableBlocks: false, includeLiquidBlocks: false })`.
   - The engine's own collision notion decides "solid".
   - Passable blocks (grass, flowers, torches) and liquids do not stop the trace.
   - The hit face gives the endpoint. With no hit, the endpoint is `head + 20·dir` (`L0-xasm18`).
2. **Unreadable means solid.** If any cell along the segment is in an unloaded chunk or outside the height range, the trace stops before it (C-12, C-24).
3. **Fit and safety** (amended at reduce v6, resolving `L0-katn-cx01`).
   - **Fits:** one vertical ray down the centre of the feet and head cells, with the trace flags, hits nothing (`L0-katn-ad01`). Both cells being `isAir` skips the ray. The cell below is not counted against the player. No hand-kept solid list is used.
   - **Safe:** it fits, **and** neither cell is `lava`, `flowing_lava`, `fire` or `soul_fire` (`L0-katn-as03`). Water is allowed. That list names hazards, not solids, so it does not reintroduce the hand-kept solid list rejected below.
   - Liquids do not stop the **trace** (§1); that is not the same as being a valid landing.
4. Documented deviations (C-16):
   - Blocks the ray treats as passable but the player cannot walk through: **none known**.
   - Blocks with partial collision (slabs, fences, glass panes): they count as solid for the trace and as occupied for the fit check. The Katana stops short rather than risk a stuck player.

## Rejected alternatives
- **Reuse the Scythe's line of sight.** Grass and flowers would block the ability, and wall-jumping off foliage would feel broken.
- **A hand-maintained solid/passable id list.** It drifts with every Bedrock update and contradicts the "engine-measured facts" practice.
- **Cell-step DDA over `getBlock` with `isAir`/`isLiquid` only.** Same flaw as line of sight, and it costs up to 20+ reads per use.

## Consequences
- `katn` must probe the ray flags on 1.26.51 before building. Memory notes record that the block ray passes carpet, signs and ladders. The probe confirms that liquids are skipped only with `includeLiquidBlocks: false`, and that cobweb is passable.
- The Scythe keeps its own stricter rule. The two notions are deliberately different and are named in each module's README.







