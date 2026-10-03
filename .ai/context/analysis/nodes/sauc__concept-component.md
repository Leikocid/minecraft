---
type: "concept-component"
node_id: "L0-sauc"
source_channel: "rollout"
analysis_version: 5
title: "L0-sauc · Saucer and beam (the UFO actor and the shoot-down)"
aliases: ["L0-sauc"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 5094
tags: ["ufo", "saucer", "shoot-down"]
level: 1
---
# L0-sauc · Saucer and beam (the UFO actor and the shoot-down)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-ufoc", "L0-magn", "L0-orbc", "L0-ring", "L0-adr-ufoi", "L0-adr-ufom", "L0-adr-ufht", "L0-xcx15", "L0-xcx16"]`

**State (2026-10-02):** not implemented. There is no `src/ufo/` directory. The only prior art is the probe branch (`probe/ufo-magnet`, worktree `.work/9678e221`). It has the entities `andrew:ufo_probe` and `andrew:ufo_beam_probe`, which use the same component set as the shipped `andrew:orbital_charge`: `runtime_identifier minecraft:snowball`, a 0×0 collision box, no gravity or collision, not pushable, and `damage_sensor all → no`.

## Responsibility
The visible, physical half of the UFO Magnet event (UFO §2 table, §7, §8):
- **Look:** a BP + RP entity `andrew:ufo_saucer`. It has a metal disc about 12 blocks across, a glass dome and emissive rim lights, and it spins slowly. A translucent green **beam** cone runs from the underside to the ground and shows only during the magnet phase (`ad01`).
- **Body:** no push, no collision, and immune to all damage (`r003`). It is moved only by script.
- **Path:** it comes in from 90 blocks out at `min(hoverY + 10, ceiling − 4)` and reaches the hover point in 20 s. It leaves 90 blocks the opposite way in 15 s, then it is removed. It stays ≤ 100 blocks horizontally from the centre (U8, `r002`, `p001`, `L0-adr-ufht`).
- **Sound:** magnet-on, a hum every 2 s, and magnet-off (`r006`).
- **Shoot-down:** an interceptor on the shipped Orbital charge flight (`L0-adr-ufoi`), tested against a hull cylinder r 6 × h 3 in any phase. The steps (`p002`):
  1. the charge is absorbed;
  2. `ufoc.requestMagnetOff("shot")`;
  3. a 3 s smoking fall;
  4. a harmless blast (visual and sound only);
  5. 8 diamonds + 1 totem of undying;
  6. a localized broadcast naming the charge owner.

## Orbital baseline (v1.4.4)
- These figures come from `src/orbital/` (v1.4.4), not from the v3 nodes (`L0-xcx16`):
  - spawn = target + 60, capped at `heightRange.max − 1`;
  - fall speed 1 block per tick;
  - aim ≤ 25 blocks;
  - RMB refuses a target nearer than 7 blocks (`RING_MIN_RANGE`).
- RMB rings have radii 0.5 / 3.5 / 7 / 10.5 / 14 and powers 4 / 4 / 2 / 1 / 1.
- The interceptor is per charge. Against the r 6 hull, an RMB salvo aimed under the axis loses its centre and ring-3.5 columns, and the outer rings detonate normally (`as06`). The shooter's 7-block minimum shapes the `ac03` setup only.

## Inputs
- From `ufoc`: `onPhase(phase, {centre, hoverY, saucerPos, eventId})` for arrival, magnet, release, departure and pause, plus `requestMagnetOff(reason)`. `sauc` uses no interval of its own. `ufoc`'s shared interval calls `saucerStep(tick)` once per active tick (C-5d).
- From `orbc` (`src/orbital/flight.ts:117`): `registerInterceptor((attack, charge, from, to, tick) => boolean)`.

## Outputs
- `saucerPosition()`, which `magn` reads every tick for its hold targets.
- `reportShotDown({eventId, ownerId, ownerName})` to `ufoc`, which starts the 15 min pause from the shot (UFO §2, §8).
- Item entities for the reward, and the `andrew.ufo.shot_down` broadcast.

## Owns
- `packs/behavior/entities/ufo_saucer.json`, `packs/resource/entity/ufo_saucer.entity.json`, the geometry, texture, animation and render controller.
- `src/ufo/saucer.ts` (path, beam and sound) and `src/ufo/shootdown.ts`.
- The interceptor change in `src/orbital/flight.ts`. `Outcome` includes `"intercepted"` (`src/orbital/flight.ts:40`).
- The lang key `andrew.ufo.shot_down`, in RU and EN.

## Does NOT own
- The schedule, target, centre, `hoverY`, phase timing, commands, the arrival message and restart cleanup (`ufoc`, `L0-adr-ufom`). Cleanup finds the saucer by its `andrew_ufo` family or tag.
- What gets pulled and released (`magn`).
- Charge spawn, fall, targeting and effects (`orbc`/`pntr`/`ring`).

## Artifacts
- Processes: `p001` flight, `p002` shoot-down, `p003` interceptor seam.
- Rules: `r001` hull, `r002` path, `r003` immunity, `r004` harmless blast + reward, `r005` beam, `r006` sound.
- Entities: `ent1` saucer entity, `ent2` saucer runtime state.
- ADRs: `ad01` beam as a bone, `ad02` teleport-driven motion, `ad03` scripted blast.
- Assumptions: `as01`–`as06`. Contradiction: `cx01` (resolved by `L0-adr-ufht`).
- ACs: `ac01`–`ac06`. Glossary: `gl01`–`gl05`.

## NFRs (component-local)
- The saucer step is one teleport, one property write when the beam toggles, and the sounds. It sits inside the `L0-xasm16` budget (≤ 2 ms mean per active tick, together with `magn`).
- With no saucer registered, the interceptor adds one empty-set check per charge step.
- **Gate:** the task merges only after the full Orbital GameTest suite (flight, penetrator, ring) is green and unchanged on the task branch (`L0-adr-ufoi`, `ac04`), plus the whole suite (full-suite rule).

## Sequencing
This comes after `ufoc` with its stub saucer. Order:
1. the `orbc` seam with its own regression gate;
2. the entity and path;
3. the shoot-down.

`magn` can then integrate against `saucerPosition()`.
