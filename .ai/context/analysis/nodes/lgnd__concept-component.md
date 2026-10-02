---
type: "concept-component"
node_id: "L0-lgnd"
source_channel: "rollout"
analysis_version: 5
title: "Legendary weapon framework (`src/legendary/`) — v4: as-built v1.4.x + the UFO delta"
aliases: ["L0-lgnd"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 3977
level: 1
needs_rebuild_marked_at: 2026-10-02T19:13:14.955Z
---
---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-orbc", "L0-webs", "L0-scyt", "L0-pntr", "L0-ring", "L0-magn", "L0-stgt", "L0-adr-hold", "L0-xcx9", "L0-xcx10", "L0-xcx11"]
governs_files: ["src/legendary/", "src/websword/trap.ts", "src/scythe/targeting.ts", "src/orbital/activation.ts", "src/main.ts", "src/gametest/main.ts"]
see_also: ["ufomagnetspecv1ruen-part-2", "ufomagnetspecv1ruen-part-4", "orbitalcannonspecv1ruen-part-1", "scytheofcalamityspecv1ruen-part-1", "webswordspecv1ruen-part-1"]
---
# Legendary weapon framework (`src/legendary/`) — v4: as-built v1.4.x + the UFO delta

**Responsibility.** Every general legendary rule is implemented once, for the Web Sword, the Scythe of Calamity and the Orbital Cannon:
- craft gate
- marks and generation
- death retention
- loss return
- protection from script-caused destruction
- hand priority
- cooldown and busy
- HUD
- `hidden_until`

v4 adds one consumer, the UFO Magnet (`magn`), which must never pull a legendary (UFO §4, AC 13).

## Current state (verified in code, 2026-10-02) — see `ad12`
**Shipped:**
- gen guard
- owed list
- pending list (every marked copy)
- off-hand read, with `allow_off_hand` on all three items
- craft tokens (L0-xcx9 closed)
- third def
- `protectLegendariesIn`
- `isLegendaryItemEntity`
- `fire_resistant` (fire and lava are now *prevented*)
- the v1.4.2 departure tracking ("a legendary cannot be lost in the tick it is dropped")

L0-xcx10 is closed: the remaining deviation is C-16's "return" for cactus, TNT, despawn and the Void.

**Not built:**
- **`holder`.** The return target is still `mark.owner` (`recovery.ts:440`, `:748`), so **L0-xcx11 stays open** (`cx09`, `cx11`).
- **`resolveActivation(player, mode)`.** The Cannon gates LMB to the main hand and latches same-tick activations in `orbital/activation.ts`.

The v3 "not started" statements are retired.

## v4 UFO delta
| # | Change | Artifacts |
|---|---|---|
| 1 | Publish `isLegendaryStack(stack)`: type-based over `itemId` and `craftTokenId`, any mark state | `ad13`, `gl14` |
| 2 | Magnet exclusion: no legendary stack, and no entity holder (chest/hopper minecart, armour stand) carrying one, is selected | `r016`, `as15`, `ac21` |
| 3 | A magnet pull of a hopper block protects first; the `magn` choice is open | `r016` §4, `cx13` |
| 4 | Death retention on a magnet-fall death is confirmed cause-agnostic (`entityDie` path B) | `ac22`, `as16` |
| 5 | `hidden_until` restated as epoch ms under C-21 (closes `cx03`) | `r010` |

**About `HOLDER_TYPES` and teleported holders.** `HOLDER_TYPES` is a list of block types. Recovery never watches a stack inside an entity, so a magnet that teleports a minecart or armour stand cannot break any watch. The risk is the opposite one: the magnet carrying a legendary off. `r016` closes that by exclusion, and a later destruction of such an entity spills into watched item entities (`as15`).

## Published contracts (v4)
- `LEGENDARIES`, `defForStack`, `defForToken`, and `isLegendaryStack` (new).
- `isReady`, `startCooldown`, `setBusy`, `clearBusy`, `isBusy`.
- `resolveActivation(player)`, `heldLegendaries(player)`.
- `protectLegendariesIn(dim, box, {avoid, reason}) → {moved, handedBack}`, which throws on unloaded or unreadable volumes.
- `isLegendaryItemEntity(entity)`.
- `isHiddenFromTargeting`, `hideFromTargeting`, `HIDDEN_UNTIL_KEY`.

## Does NOT own
- What abilities do (`webs`, `scyt`, `orbc`, `pntr`, `ring`).
- The magnet's selection, physics and release (`magn`). `lgnd` only states the exclusion contract.
- Item and recipe JSON.

## Next task (one `lgnd` task, for UFO)
1. Add `isLegendaryStack`, with a unit test.
2. Add the `ufo:legendary_*` GameTests for `ac21` and `ac22`, built with `magn`.
3. Separately, and blocked on the client (`L0-adr-hold`): `holder`.

## Risk
- Nested shulker and bundle contents stay invisible (`cx12`).
- A hopper minecart that collects a ground legendary triggers a return and leaves a stale copy (`as15`, `cx02` a).
