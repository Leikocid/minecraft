---
type: "concept-component"
node_id: "L0-ufoc"
source_channel: "rollout"
analysis_version: 5
level: 1
title: "L0-ufoc · UFO event core (schedule, phases, commands, restart)"
aliases: ["L0-ufoc"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 4850
tags: ["is_a:component", "ufo", "stage6", "not-implemented", "relates_to:L0-sauc", "relates_to:L0-magn", "relates_to:L0-adr-ufom", "relates_to:L0-adr-ufpc", "relates_to:L0-adr-ufht", "relates_to:L0-xasm13", "relates_to:L0-xasm14", "relates_to:L0-xasm17", "relates_to:L0-xcx17", "relates_to:L0-xcx20", "see_also:ufomagnetspecv1ruen-part-1", "see_also:ufomagnetspecv1ruen-part-3", "see_also:ufomagnetspecv1ruen-part-4"]
---
# L0-ufoc · UFO event core (schedule, phases, commands, restart)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-sauc", "L0-magn", "L0-adr-ufom", "L0-adr-ufpc", "L0-adr-ufht", "L0-xasm13", "L0-xasm14", "L0-xasm17", "L0-xcx17", "L0-xcx20"]`

**State (2026-10-02):** not implemented. There is no `src/ufo/`. This run replaces the failed v4 node (`L0-xcx20`). It implements `L0-adr-ufom`, `L0-adr-ufpc` and `L0-adr-ufht` as given and does not re-derive them.

## Responsibility
`ufoc` is the event's only clock and only state machine (UFO §2, §9, §10, §12):
- **Schedule** (`r001`, `p001`). The next arrival is stored as epoch ms in `andrew:ufo_next_ms` (C-21). The first arrival comes a random 10–20 min after the first join (`L0-xasm14`). After every departure, shoot-down, `stop` or restart, the next one is set 15 min out. When an arrival falls due, the event waits for an Overworld player.
- **Enable flag** `andrew:ufo_enabled` (default on, `r006`).
- **Target and centre** (`r002`). The target is a random valid Overworld player. The centre is the block under their feet when the arrival starts, and it is frozen from then on.
- **Hover height** (`r003`): `hoverY = min(centre.y + 40, ceiling − 4)`, where `ceiling = overworld.heightRange.max` (`L0-adr-ufht`).
- **Phase machine** (`p002`, `r004`): arrival 400 ticks → magnet 1200 → release (instant) → departure 300 → pause; or `downed` after a shot. Every phase change is published as `onPhase(...)` to `sauc` and `magn`. Requests to switch the magnet off are latched (`adr-ufpc`).
- **One shared interval** (C-5d, `ad02`). It ticks every game tick but does only a clock check once per 100 ticks while no event is live. With a saucer, the order within a tick is latch → phase → `saucerStep` → `magnetStep`.
- **Restart cleanup** (C-23, `p003`, `L0-xasm17`). The sweep runs at `worldLoad` and again on `entityLoad`, keyed by event id. An event that was in flight is rescheduled for now + 15 min, detected through the in-flight marker (`ad03`, `cx01`).
- **Operator command** `/andrew:ufo come|stop|enable|disable` (`p004`).
- **Messages** (`r005`). The localized arrival notice `andrew.ufo.arrival` (RU/EN) goes to Overworld players within 150 blocks of the centre.
- **Environment seam** (`L0-xasm13`, `ad01`): `now()`, a phase-duration table and an online-Overworld-players provider, so GameTest can drive the logic.

## Inputs
- `world.afterEvents.playerSpawn` (initialSpawn) records the first join.
- `worldLoad` and `entityLoad` trigger cleanup.
- The custom command registry, at startup.
- From `sauc`: `reportShotDown({eventId, ownerId, ownerName})` and `requestMagnetOff("shot")`.
- From the command: `requestMagnetOff("stop")`.

## Outputs
- `onPhase(phase, {centre, hoverY, saucerPos, eventId})`, sent to `sauc` and `magn`.
- `saucerStep(tick)` and `magnetStep(tick)`, called from the one interval.
- Writes to the world dynamic properties `andrew:ufo_next_ms` and `andrew:ufo_enabled`.
- The arrival notice, and the command replies.

## Owns
- `src/ufo/index.ts` (`registerUfo()`, called from `src/main.ts`), `src/ufo/schedule.ts`, `src/ufo/phases.ts`, `src/ufo/env.ts` (the seam), `src/ufo/cleanup.ts` and `src/ufo/commands.ts`.
- The lang key `andrew.ufo.arrival` in `en_US.lang` and `ru_RU.lang`.
- GameTest scenarios for UFO ACs 1, 2 (timing), 3, 17 and 18, plus `bds-check` restart scenarios on the checks instance (19136).
- A stub saucer, so that `ufoc` can merge before `sauc` (Stage 6 step 2).

## Does NOT own
- The saucer entity, its path, beam, sound and shoot-down detection (`sauc`). `sauc` picks the bearing θ and spawns or removes the entity on `onPhase`.
- Iron selection, the hold and the release physics (`magn`).
- `orbc`'s interceptor seam.

## Artifacts
- **Entities:** `ent1` durable schedule state, `ent2` live event session.
- **Processes:** `p001` schedule and arrival trigger, `p002` per-tick phase machine, `p003` restart cleanup, `p004` operator command.
- **Rules:** `r001` timing, `r002` target and centre, `r003` hover height, `r004` single event / Overworld only / ordering, `r005` notice and localization, `r006` enable flag and command effects on the schedule.
- **ADRs:** `ad01` env seam, with tick-driven phases on an epoch schedule; `ad02` one period-1 interval with an idle divider; `ad03` the in-flight marker inside `next_ms`; `ad04` the command via `customCommandRegistry` at GameDirectors.
- **Assumptions:** `as01`–`as05`. **Contradiction:** `cx01`.
- **ACs:** `ac01`–`ac08`. **Glossary:** `g001`–`g006`.

## NFRs
- Idle cost: one counter increment per tick, plus one property read every 100 ticks.
- Active cost: the phase step is O(1). The total with `sauc` and `magn` stays within `L0-xasm16`.
- No `runJob` and no second interval (C-5d).
- **Gate:** the full suite is green on the task branch before the merge.
