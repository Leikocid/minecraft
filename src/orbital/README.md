# Orbital Cannon — deviations from the spec (C-16, `L0-orbc-r013`)

Each line is what ships in this module today, with the KV id that owns it.

1. **Custom item with the fishing-rod icon** (`L0-xcx13`). `andrew:orbital_cannon` is a custom item whose icon is the vanilla `fishing_rod` atlas entry; it is not a real fishing rod, because stable API cannot switch fishing off on one. It casts no line, has no durability and takes no enchantment.
2. **Input by `playerSwingStart`, and what a touch gives** (`L0-xcx8`, `L0-xcx14`, `L0-xq5`). Stable 2.10.0 has no LMB/RMB input event. RMB is `itemUse` (in the air) or `itemStartUseOn` (on a block — the Cannon raises neither `itemUse` nor after-`playerInteractWithBlock` there). LMB is `entityHitBlock` (a block the client picked) or `playerSwingStart` with `swingSource: Attack` plus the view ray — the only signal for a swing that hits nothing, at any distance. LMB fires only with the Cannon in the main hand (`L0-lgnd-as14`). While it is in the main hand no block breaks, in any game mode (`L0-orbc-as05`): the Cannon cannot mine. Measured on BDS with a SimulatedPlayer; what the iPad touch client sends — a tap versus a hold, a swing on a miss, at 6–10 blocks — is not observed (`L0-orbc-ac08`, iPad).
3. **Aim point on touch** (`L0-orbc-cx02`, `L0-orbc-ad01`). The target is the event's own block when the event names one within 10 blocks of the eyes, else the view ray (`maxDistance 10`, liquids and passable blocks skipped). On the default touch layout the block under the finger arrives with the event; a press that names no block aims from the screen centre. Distance is measured to the block's geometry, never through `BlockRaycastHit.faceLocation`.
4. **Nether ceiling** (`L0-orbc-cx03`, ruled by `L0-adr-oded` §2). The spawn height is the target +10, clamped to `heightRange.max − 1` = 127. A target high enough to put that cell in the bedrock roof (y ≥ 113) spawns its charge inside the roof, and it detonates there at once with the roof cell as its point — for both modes, no special case.
5. **The charge is moved by script, not by physics** (`L0-orbc-ad02`). `andrew:orbital_charge` has no gravity, no collision, a 0×0 box and ignores damage, so entities and blasts never move it; its fall is a scripted teleport (ORBC-FLIGHT-01-AA), with no client interpolation guarantee. In this core a charge that spawns in air stays where it spawned; only a charge spawned inside a contact block detonates, in the activation tick.
6. **Charges are lost on unload and restart** (`L0-orbc-r011`, `L0-orbc-ad03`, §11). Attacks live in memory only (`activeAttacks()`), nothing is persisted, and nothing is refunded. After a chunk unload or a server restart the script no longer knows the charge; the entity stays in the save with its `andrew:oc_attack:<id>` tag until the orphan sweep (ORBC-FLIGHT-01-AA) removes it.

## Files

| File | Holds |
|---|---|
| `index.ts` | `registerOrbitalCannon()`: the stub effects, then the input |
| `activation.ts` | `p001`: events → hand → same-tick guard → cooldown → `lockTarget` → commit; the attack registry |
| `target.ts` | `ad01`, `r003`: `lockTarget()`, `distanceToBlock()`, range 10 |
| `spawn.ts` | `r007`: `spawnY()`, charge location and spawn |
| `charge.ts` | `r014`: `Mode`, `Effect`, `registerEffect()`; `r008`/`as03`: `isContact()`, `PASS_THROUGH` |
| `stub-effect.ts` | Both modes until the real effects register: one log line and one sound per detonation; LMB one column, RMB 160 |

Proof: `tests/orbital-core.test.mjs` (node), `src/gametest/orbital-core.ts` (BDS).
