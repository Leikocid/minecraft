---
type: "concept-decomposition-plan"
node_id: "L0"
source_channel: "rollout"
analysis_version: 4
title: "L0 Decomposition Plan (v4)"
aliases: ["L0"]
is_a: ["decomposition-plan"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 7713
tags: ["v4", "title:L0 Decomposition Plan (v4)", "alias:L0-plan", "is_a:plan", "relates_to:L0", "see_also:ufomagnetspecv1ruen-part-1", "see_also:ufomagnetspecv1ruen-part-2", "see_also:ufomagnetspecv1ruen-part-3", "see_also:ufomagnetspecv1ruen-part-4", "supersedes:L0-plan@v3"]
level: 0
needs_rebuild_marked_at: 2026-10-02T19:13:14.954Z
---
---
title: "L0 Decomposition Plan (v4)"
aliases: ["L0-plan", "Decomposition Plan"]
is_a: ["plan"]
part_of: ["L0"]
relates_to: ["L0"]
see_also: ["ufomagnetspecv1ruen-part-1", "ufomagnetspecv1ruen-part-2", "ufomagnetspecv1ruen-part-3", "ufomagnetspecv1ruen-part-4", "orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-3"]
supersedes: ["L0-plan@v3"]
---
# L0 Decomposition Plan (v4)

## Survey
- **Volume.** There are 27 primary inputs, about 107 KB raw, and the KV holds 406 artifacts. The v4 delta has two parts.
  1. **The UFO Magnet spec** is new: 4 fragments, ~13 K unique chars, 18 ACs and a DoD. Fragments 2/3 and 3/4 overlap.
  2. **The Orbital spec was re-imported** after the operator decisions behind v1.4.1–1.4.4: aim 25, spawn +60, ring diameters 1/7/14/21/28, powers 4/4/2/1/1 and an RMB minimum of 7. Those changes are **already built and merged**, so they are a reconcile debt, not new design (`L0-xcx16`).

  The UFO delta alone is above the self-work threshold, so decomposition is mandatory.
- **Diversity.** The UFO spec mixes three topics with different physics and different test channels:
  - a long-running **schedule and phase machine**: wall-clock, restart, commands;
  - a **rendered actor**: the saucer and beam entities, flight, invulnerability and the shoot-down;
  - a **world-mutating effect**: iron classification, the scan, selection, extraction, block → item, and the pull and hold of players and elements.
- **Coherence.** High inside the spec: one event and one lifecycle. It has exactly two outward seams:
  - "legendaries are never pulled", plus the holder moves, which land on `lgnd`;
  - "a Cannon charge crossing the hull", which lands on shipped `orbc`.
- **Dependencies.** There is a clear pipeline: schedule → arrive → magnet-on (scan, select) → hold → release → depart / shoot-down → pause. The magnet and the saucer only exchange the phase signal and the saucer position.

## Decomposition strategy: diversity
The split is by topic. The orchestration (`ufoc`), the actor (`sauc`) and the effect (`magn`) have different engine risks and different AC channels, and the phase machine is thin. `lgnd` is re-run because it is queued and because the magnet consumes its predicates. Every other node keeps its version and is **not** re-run, including `orbc`, `pntr` and `ring`. Their reconcile with v1.4.4 is a separate run (`xcx16`).

| id_suffix | label | prompt | model_hint |
|-----------|-------|--------|------------|
| lgnd | Legendary framework, v4 pass. It has two parts. **(1) Reconcile with the as-built v1.4.x code.** The v3 delta has shipped: tokens, holder, owed list, the off-hand read, `protectLegendariesIn`, `isLegendaryItemEntity`, the third def, and the v1.4.2 fix "a legendary cannot be lost in the tick it is dropped". Close `xcx9`–`xcx11` against the code and the GameTests, and retire stale v3 "not started" text. **(2) The UFO delta.** Publish a stack-level `isLegendaryStack(stack)` for `magn`. Make sure `HOLDER_TYPES` watching survives holders that the magnet teleports: chest and hopper minecarts and armour stands. Confirm death retention when a player dies from a magnet fall while holding a legendary. Restate `hidden_until` in ms under C-21. ACs: UFO 13 (rule side). | component-deep-dive | |
| ufoc | UFO event core. The durable schedule: epoch ms next-arrival, the first arrival 10–20 min after the first join, +15 min after a departure or shoot-down, waiting for an Overworld player, and the enable flag. Target and centre selection; hover height = centre + 40, capped at ceiling − 4. The phase machine (arrival 20 s / magnet 60 s / release / departure 15 s / pause), which publishes phase events to `sauc` and `magn`. One shared `runInterval` (C-5d). Restart cleanup of leftover entities (C-23). The operator command `/andrew:ufo come/stop/enable/disable`. RU/EN messages and the 150-block arrival notice. A testable clock seam (`L0-xasm13`). UFO ACs 1, 2 (timing), 3, 17, 18. | component-deep-dive | |
| sauc | Saucer and beam. BP + RP entities: a ~12-block disc, a dome, rim lights and a spin; a translucent green beam cone shown during the magnet. No push, no collision and immune to everything but the Cannon, within the known engine traps (pushable/runtime_identifier). The flight path: in from 90 blocks at hover + 10, out 90 blocks the opposite way, staying ≤ 100 blocks from the centre (U8). Sounds. **Shoot-down:** an interceptor on `orbc` flight (`L0-adr-ufoi`), the hull cylinder r 6 × h 3 in any phase, the charge absorbed, magnet-off through `ufoc`, a 3 s smoking fall, a blast that does no damage (visual and sound only), 8 diamonds + 1 totem, and a broadcast naming the charge owner. UFO ACs 2 (path and look), 15, 16, plus the iPad DoD visuals. | component-deep-dive | |
| magn | Magnet effect. The iron lists (items, blocks, ore, entities) verified against the 1.26.51 ids (`L0-xasm15`). Mob and armour-stand armour read through `hasitem`, one item at a time (U4b). One `getBlocks`/`includeTypes` zone scan at magnet-on (U7). The ≤ 10 priority selection, nearest first, and the 12-block drop exemption. Container iron-stack extraction (U5), with the hopper ruled by `L0-xcx18`. Block → air + one item, a whole door, ore → `raw_iron` (U6). Underground items fly through stone (U3). Player pull through `applyKnockback` ≤ 0.6 blocks per tick to 6 below the saucer, stopped and resumed by the hand state each tick (U10), never in Creative or Spectator. The cloud ring r 5 at −3, away from players (U11). Simultaneous release with vanilla physics and fall damage from the release point (U2). Legendaries excluded through `lgnd`. UFO ACs 4–14. | component-deep-dive | |

## Reduce plan
- **`lgnd` answers first.** `magn` references `lgnd-*` rules by id: the never-pulled predicate, watch over moved holders and death retention. It must not restate them.
- **`ufoc` publishes the phase contract** that `sauc` and `magn` consume:
  - `onPhase(phase, {centre, hoverY, saucerPos, eventId})`;
  - `requestMagnetOff(reason)`, which `sauc` calls on a shoot-down;
  - `saucerPosition()`, read each tick by `magn` for the hold targets.

  If a child needs a different signal, that is a contradiction on L0.
- **`sauc` owns the only change to shipped `orbc`**, the interceptor hook under `L0-adr-ufoi`:
  - the change is additive;
  - it adds the new outcome `"intercepted"`;
  - the existing `observeChargeEnds` observers see it.

  `pntr` and `ring` must keep passing unchanged. Their full GameTest suites are part of the `sauc` gate.
- **AC routing.** UFO 13 goes to `lgnd` (rule) and `magn` (call site). UFO 1, 3, 17, 18 and the timing half of 2 go to `ufoc`. The path and look half of 2, plus 15 and 16, go to `sauc`. UFO 4–12 and 14 go to `magn`. Each child splits its ACs into the `bds` channel (GameTest with ≥ 2 players, block and entity counts) and the `ipad` channel (saucer visible on approach, translucent beam, smooth pull, visible cloud, the fall). The restart and real-time ACs are automated as `L0-xcx17` allows.
- **Roll-up.** Child overviews go into the L0 overview diagram. New constraints are de-duplicated against C-1 … C-23. `L0-xcx18` is settled by `magn` (an ADR with the autopilot default) before the `magn` tasks are created.
- **Stage 6 order:**
  1. the `lgnd` v4 delta;
  2. `ufoc`, with a stub saucer and no magnet;
  3. `sauc`, including the `orbc` interceptor, with the full Orbital suite re-run;
  4. `magn`.

  After each merge, run the full suite, then re-open the auto-closed `ipad` criteria.
- **Not in this run:**
  - an `orbc`/`pntr`/`ring` reconcile with v1.4.4 (`xcx16`);
  - the structure scan-code reconcile (`xcx12`).

  Both are queued separately, and neither blocks Stage 6.
