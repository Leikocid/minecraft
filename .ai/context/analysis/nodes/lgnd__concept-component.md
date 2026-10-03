---
type: "concept-component"
node_id: "L0-lgnd"
source_channel: "rollout"
analysis_version: 6
title: "Legendary weapon framework (`src/legendary/`), v6: as built in 1.4.4, plus the Dragon Katana delta"
aliases: ["L0-lgnd"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 4942
tags: ["v6", "katana", "legendary", "as-built-1.4.4"]
level: 1
---
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
