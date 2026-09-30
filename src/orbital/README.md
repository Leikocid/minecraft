# Orbital Cannon — deviations from the spec (C-16, `L0-orbc-r013`)

Each line is what ships in this module today, with the KV id that owns it.

1. **Custom item with the fishing-rod icon** (`L0-xcx13`). `andrew:orbital_cannon` is a custom item whose icon is the vanilla `fishing_rod` atlas entry; it is not a real fishing rod, because stable API cannot switch fishing off on one. It casts no line, has no durability and takes no enchantment.
2. **Input by `playerSwingStart`, and what a touch gives** (`L0-xcx8`, `L0-xcx14`, `L0-xq5`). Stable 2.10.0 has no LMB/RMB input event. RMB is `itemUse` (in the air) or `itemStartUseOn` (on a block — the Cannon raises neither `itemUse` nor after-`playerInteractWithBlock` there). LMB is `entityHitBlock` (a block the client picked) or `playerSwingStart` with `swingSource: Attack` plus the view ray — the only signal for a swing that hits nothing, at any distance. LMB fires only with the Cannon in the main hand (`L0-lgnd-as14`). While it is in the main hand no block breaks, in any game mode (`L0-orbc-as05`): the Cannon cannot mine. Measured on BDS with a SimulatedPlayer; what the iPad touch client sends — a tap versus a hold, a swing on a miss, at 6–10 blocks — is not observed (`L0-orbc-ac08`, iPad).
3. **Aim point on touch** (`L0-orbc-cx02`, `L0-orbc-ad01`). The target is the event's own block when the event names one within 10 blocks of the eyes, else the view ray (`maxDistance 10`, liquids and passable blocks skipped). On the default touch layout the block under the finger arrives with the event; a press that names no block aims from the screen centre. Distance is measured to the block's geometry, never through `BlockRaycastHit.faceLocation`.
4. **Nether ceiling** (`L0-orbc-cx03`, ruled by `L0-adr-oded` §2). The spawn height is the target +10, clamped to `heightRange.max − 1` = 127. A target high enough to put that cell in the bedrock roof (y ≥ 113) spawns its charge inside the roof, and it detonates there at once with the roof cell as its point — for both modes, no special case.
5. **The charge is moved by script, not by physics** (`L0-orbc-ad02`, `L0-orbc-as02`). `andrew:orbital_charge` has no gravity, no collision, a 0×0 box and ignores damage, so entities and blasts never move it. One shared `system.runInterval(step, 1)` exists only while some attack has a charge; each tick it teleports every charge `FALL_SPEED` = 1 block down and reads every cell between the old and the new y, so no block is skipped at any speed. Entities are never queried: players, mobs and boats do not stop a charge, liquids do not either. There is no client interpolation guarantee: on the iPad the charge may look stepped at 20 moves per second (not observed).
6. **Charges are lost on unload and restart** (`L0-orbc-r011`, `L0-orbc-ad03`, §11). Attacks live in memory only (`activeAttacks()`), nothing is persisted, and nothing is refunded. There is no ticking area and no force-load. A charge whose entity turns invalid, or whose next cell is unloaded, is dropped with no effect. The saved entity is removed when it next loads (`entityLoad`), and every charge entity is removed a tick after the world starts: an orphan never detonates.
7. **One scope per script runtime.** Attack ids are `<scope>-<tick>-<seq>` and the charge carries `andrew:oc_attack:<id>`. A runtime's `entityLoad`/`entitySpawn` sweep removes a charge with no attack tag and a charge of its own scope that no live attack holds; a charge of another scope is left to its runtime. The release pack is `oc`; the GameTest pack, which shares the world with it, is `gt`. So a charge hand-tagged with a scope nobody owns stays until the next world start.
8. **A 400-tick safety timeout** (`L0-orbc-p002`). Charges still falling 400 ticks after firing are removed as lost, with a warning in the log. It guards against a stuck path; a normal fall ends within ~90 ticks (End, +30 down to the Void from y 60).

## Files

| File | Holds |
|---|---|
| `index.ts` | `registerOrbitalCannon(scope)`: the stub effects, the input, then the flight |
| `activation.ts` | `p001`: events → hand → same-tick guard → cooldown → `lockTarget` → commit → `launch` |
| `flight.ts` | `p002`, `p003`, `ad02`, `ad03`: the attack registry, the shared interval, the four outcomes (detonated, voided, lost, timeout), the orphan sweeps |
| `target.ts` | `ad01`, `r003`: `lockTarget()`, `distanceToBlock()`, range 10 |
| `spawn.ts` | `r007`: `spawnY()`, charge location and spawn |
| `charge.ts` | `r014`: `Mode`, `Effect`, `registerEffect()`; `r008`/`as03`: `isContact()`, `PASS_THROUGH`; `as02`: `FALL_SPEED`, `sweepCells()`, `fallStep()` |
| `stub-effect.ts` | Both modes until the real effects register: one log line and one sound per detonation; LMB one column, RMB 160 |

Proof: `tests/orbital-core.test.mjs`, `tests/orbital-flight.test.mjs` (node); `src/gametest/orbital-core.ts`, `src/gametest/orbital-flight.ts` (BDS).
