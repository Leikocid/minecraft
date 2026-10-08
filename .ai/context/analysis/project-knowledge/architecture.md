---
title: Architecture
type: project-knowledge
generated_at: "2026-10-08T18:47:14.753Z"
source_channel: rollout
node_id: rollout-architecture
aliases: ["rollout-architecture","architecture","project-knowledge/architecture"]
is_a: ["rollout","architecture"]
relates_to: ["L0-adr-sbdm","L0-adr-sblt","L0-adr-sbvr","L0-katn","L0-lgnd","L0-magn","L0-sauc","L0-sclk","L0-strm","L0-ufoc"]
priority: 620
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







### Legendary weapon framework (`src/legendary/`), v7: as built at 1.6.1, plus the passive def and the Sculk Crossbow delta (L0-lgnd)

# Legendary weapon framework (`src/legendary/`), v7: as built at 1.6.1, plus the passive def and the Sculk Crossbow delta

Related: L0-sclk, L0-katn, L0-magn, L0-orbc, L0-webs, L0-scyt, L0-xcx11, L0-xcx24, L0-adr-scbs, L0-adr-hold, L0-xasm26, L0-lgnd-ad15, L0-lgnd-ad16, L0-lgnd-ad17, L0-lgnd-cx15, L0-lgnd-cx16, L0-lgnd-r016, L0-lgnd-r018.

**Responsibility.** Every general legendary rule is implemented once, for every def in `LEGENDARIES`: the token craft gate and first-craft broadcast, marks and generation, death retention, loss return and the owed list, `protectLegendariesIn`, hand priority (`resolveActivation`), cooldown and busy, the HUD, `hidden_until`, and the type predicates `isLegendaryStack` / `isLegendaryWeaponStack`.

## As built at 1.6.1 (read from code 2026-10-05)
- **Four defs** (`registry.ts`): Web Sword `ws`, Scythe `sc`, Orbital Cannon `oc`, Dragon Katana `dk` (shipped 1.5.0, `KATA-LGND-01-AA`). The Katana needed no framework code (`ad14` held).
- **Every def has an ability.** `abilityKey` and `cooldownTicks` are required fields (`registry.ts:12-15`). The HUD draws a line for every held def (`hud.ts:37-56`), and `resolveActivation` lets any held, ready def claim a Use (`hands.ts:35-42`).
- **Legendary weapons are magnetic** (operator tuning, 1.6.0, `de0fc68`). The magnet uses `isLegendaryWeaponStack` (weapons, never tokens): ground, container slots, late drops, a player holding one (`magnet-hold.ts:117-136`), and a mob or armour stand holding one (`magnet-select.ts:179`, `:320`). The UFO AC 13 "never pulled" rule is retired. See `r016` and `ac21`.
- **Armour stand in the Void** is closed in code (`decision-resolve-l0-lgnd-cx14`: stand watcher plus two return guards, `recovery.ts:326`, `:433`).
- **Return target is still `mark.owner`.** `lost()` targets `w.mark.owner` (`recovery.ts:490`), and the protect hand-back and owed entry use it too (`:877-879`). `decision-resolve-l0-xcx11` (2026-09-29) chose the last holder and named `LGND-GEN-01-AA`. That task is archived, but the mark has no holder field (`state.ts`). See `cx16`.

## v7 delta
| # | Change | Artifacts |
|---|---|---|
| 1 | Passive def: a def may have no ability. Then it has no timer key, no Use claim and no HUD line. Defs #1–#4 keep byte-identical keys and behaviour | `ad15`, `ent1`, `r018`, `ac26` (closes `L0-xcx24`) |
| 2 | Def #5 `SCULK_CROSSBOW`: `andrew:sculk_crossbow`, token `andrew:sculk_crossbow_crafted`, refund 2 echo shard + 2 deepslate + 1 crossbow, command `andrew:crossbow`, passive | `ad16`, `as18`, `ac25` |
| 3 | **Key prefix: not `sc`.** `sc` is the Scythe's; reuse would share the craft flag, marks, pending and owed. Proposed `sk` | `cx15`, `as18` |
| 4 | No per-weapon code in retention, recovery, the Void paths, `protectLegendariesIn`, commands or the magnet: each iterates `LEGENDARIES` or calls `defForStack`/`defForToken` | `ad16`, `ac27` |
| 5 | Return target for T19/T20/Void: `mark.owner` until the holder task ships, as for the Katana. Tests call one `returnTarget(mark)` helper so the holder task changes one function | `ad17`, `ac27`, `cx16` |
| 6 | Magnet: the crossbow is pulled like the other four. Not a spec breach (the crossbow spec does not list the magnet as a hazard) | `r016`, `ac21` |

**Fallback, stated as larger.** If the `sclk` probe rejects a custom shooter and `L0-adr-scbs` falls back to the vanilla `minecraft:crossbow` (option B), identity can no longer be by type. `isLegendaryStack`, `isLegendaryWeaponStack`, `defForStack`, `heldLegendaries`, the magnet's `hasitem` holder tags (which cannot read dynamic properties), the craft gate (the recipe *input* is the same type), retention and the GameTests all become mark-aware. That is a framework rewrite of identity, not a def. It needs its own L0 decision and is **not** planned by this pass (`ad16` §Fallback).

## Published contracts
- `LEGENDARIES`, `defForStack`, `defForToken`, `defForAbility` (active defs only), `isLegendaryStack`, `isLegendaryWeaponStack`, **`hasAbility(def)`** (new).
- `isReady`, `startCooldown`, `setBusy`, `clearBusy`, `isBusy`.
- `heldLegendaries(player)` (still returns passive defs; retention-neutral), `resolveActivation(player)` (active defs only).
- `protectLegendariesIn(dim, box, {avoid, reason}) → {moved, handedBack}`; `sclk`'s crater calls it before carving (`L0-xcx25`).
- `isLegendaryItemEntity`, `isHiddenFromTargeting`, `hideFromTargeting`.

## Does NOT own
The crossbow item JSON, token, recipe, lang, bolt pipeline, damage, crater, durability (custom base) and Piercing exclusion (`sclk`). The magnet's selection (`magn`).

## Next tasks
1. **LGND-PASSIVE** (before `sclk` item): `ad15` type split, `hasAbility`, HUD/resolver skips, registry test. Gate: the existing legendary GameTests and `npm test` pass with no assertion edits (`ac26`).
2. **Def #5** lands with the `sclk` item task: the entry, the uniqueness and key asserts, the crossbow instances of the framework GameTests (`ac25`, `ac27`).
3. **LGND-HOLD** (separate, unblocked by the decision): the holder field per `ad11`; `ac18` plus the holder clauses of `ac08`, `ac09`, `ac24`, `ac27`.







### L0-magn · UFO magnet effect (L0-magn)

# L0-magn · UFO magnet effect

**Status.** Not implemented. This is step 4 of the Stage 6 order, after `lgnd` v4, `ufoc` and `sauc`. It can be built against a stub `ufoc` that implements `L0-adr-ufpc`. Probes U1–U11 are on branch `probe/ufo-magnet` (`src/gametest/probe-ufo.ts`, BDS 1.26.51.1).

## Responsibility
For 60 s, everything made of iron in the magnet zone is pulled under the hovering saucer and held there. When the magnet goes off, everything is released at once. The work splits into:
- classifying iron;
- one zone scan;
- selecting at most 10 non-player elements;
- turning blocks and container stacks into items;
- moving players and elements each tick;
- releasing them.

## Inputs (the phase contract, `L0-adr-ufpc`)
- `onPhase("magnet", {centre, hoverY, saucerPos, eventId})` starts the magnet: scan, select, extract.
- `magnetStep(tick)` is called by the `ufoc` interval after `saucerStep` in the same tick. `saucerPosition()` is read only inside it, so it is already this tick's position.
- `onPhase("release")` triggers the simultaneous release. A shoot-down (`sauc`), `/andrew:ufo stop` and an abort go through `requestMagnetOff(reason)`, which latches: the release runs at the start of the next interval tick (`L0-magn-prel`).
- `lgnd`: `isLegendaryStack(stack)` is the "never pulled" predicate (`L0-lgnd-ad13`). Until `lgnd` v4 ships, the interim is `defForStack || defForToken` (`L0-magn-rleg`). Holder watching and death retention stay with `lgnd` (`lgnd-r*`); they are not restated here.

## Outputs / world effects
- Iron item entities, extracted stacks, mobs, minecarts and block items move through teleports to ring slots (r 5, 3 blocks below the saucer).
- Players are pulled through `applyKnockback` to a point 6 blocks below the saucer.
- Selected blocks become air, plus exactly one item each. Dependants resting on them pop as in vanilla (`L0-adr-ufnd`).
- On release, everything falls with vanilla physics and vanilla fall damage.

## Zone
- A cylinder of r 50 around the centre, from centre − 20 up to `hoverY`.
- Only loaded chunks count (C-12′).

## Artifacts
- **Processes:** `L0-magn-pscn` (magnet-on scan and selection), `-pext` (extraction and block → item), `-phld` (per-tick hold), `-prel` (release).
- **Entities:** `-eirn` (iron classification lists), `-eelm` (magnet element).
- **Rules:** `-rlim` (limit and priority), `-rexm` (12-block drop exemption), `-rply` (player pull), `-rcnt` (containers), `-rblk` (blocks/door/ore), `-rrng` (ring away from players), `-rrel` (release and fall), `-rleg` (legendary exclusion), `-rdup` (no-dup ordering).
- **ADRs:** `-adhp` (settles `L0-xcx18`), `-adar` (armour through tag selectors), `-adsc` (scan over loaded chunks), `-adex` (drop exemption through `entitySpawn`).
- **Contradiction:** `-cxdp` (AC-10 "nothing else drops" vs vanilla pops of dependants; resolved by `L0-adr-ufnd`).
- **Assumptions:** `-aslh` (legendary holders skipped), `-asfl` (flight speed), `-asrg` (ring margin), `-asit` (block → item), `-asbd` (horse armour, hand iron).
- **Glossary:** `-gelm`, `-gzon`, `-gring`, `-gexm`, `-gcls`, `-gtag`, `-glat`.
- **ACs:**
  - `bds` channel: UFO 4–14 → `-a04` … `-a14`, plus `-atps` (cost measured).
  - `ipad` channel: `-aipd`, one manual criterion for the smooth lift, the visible cloud and the visible fall. It is never closed by a GameTest and is reopened after every epic merge (`L0-xcx19`).

## Boundaries
- No saucer and no beam rendering (`sauc`).
- No schedule (`ufoc`).
- No change to `orbc`.
- All code lives in `src/ufo/magnet*.ts`, driven by the single UFO interval through `magnetStep` (`L0-adr-ufom`, C-5d). It creates no timers of its own. The one event subscription it holds is the drop exemption's `entitySpawn` listener, during the magnet only.







### L0-sauc · Saucer and beam (the UFO actor and the shoot-down) (L0-sauc)

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







### Sculk Crossbow (`andrew:sculk_crossbow`): component v1 (L0-sclk)

# Sculk Crossbow (`andrew:sculk_crossbow`): component v1

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-orbc", "L0-pntr", "L0-magn", "L0-scyt", "L0-katn", "L0-adr-scbs", "L0-adr-scdm", "L0-adr-sctr", "L0-xcx22", "L0-xcx23", "L0-xcx24", "L0-xcx25", "L0-xasm23", "L0-xasm24", "L0-xasm25", "L0-xasm26", "L0-xasm27", "L0-xq7"]`

Source: `docs/Sculk_Crossbow_Spec_v1_RU_EN.docx` (raw `sculkcrossbowspecv1ruen-part-1..4`, priority 610). Legendary def #5. It is the first legendary with **no active ability, no cooldown and no HUD line** (`L0-xcx24`).

## Responsibility
A passive ranged legendary. Every projectile its holder fires is replaced at spawn by one `andrew:sculk_bolt`. The bolt flies physically, with a Warden-style Sonic Boom trail, and resolves exactly once (C-26):
- **entity hit:** fixed `SONIC_BOOM_DAMAGE` = 10 HP, absorption first, through armour, the shield and the invulnerability window (C-28), plus a sculk patch under the target, with no crater;
- **block hit:** an irregular crater ≤ 5×5×3 plus a ring of plain sculk ≤ 5×5, with no entity damage (C-27);
- **expiry:** after 100 ticks, on leaving loaded chunks, or in the Void, nothing happens.

## What `sclk` owns, and what it does not
| Owned here | Delegated (cited, not restated) |
|---|---|
| the item def JSON, icon, RP texture, RU/EN item and tooltip lang | craft gate, first-craft broadcast, token swap and refund → `lgnd` (R-lgnd-001: one implementation) |
| the recipe JSON (echo shard / deepslate / crossbow → token) | death retention, hazard protection, Void return, Creative/`/give` copies → `lgnd` (T19, T20; `xasm26`) |
| the bolt entity (BP + RP), the shot→bolt swap, the flight, the trail | the no-ability def shape → `lgnd` v7 (`xcx24`) |
| hit resolution, damage, patch, crater, carve queue | `protectLegendariesIn` → `lgnd` (`recovery.ts`) |
| enforcing that Piercing is stripped | magnetism → `magn` (def-driven, `xasm26`) |
| moving the deny list from `penetrator-keep.ts` to `src/terrain/keep.ts` (`xcx25`) | the Orbital carve itself → `orbc`/`pntr` (unchanged) |
| the probe and the outcomes of the three ADRs | |

## Inputs
- `world.afterEvents.entitySpawn` (or `projectileShoot`, per the probe) for arrow-type projectiles whose owner holds `andrew:sculk_crossbow`.
- `projectileHitEntity` and `projectileHitBlock`, filtered to `andrew:sculk_bolt`.
- The shared interval (one `runInterval`, never `runJob`) for trail emission, lifetime and the carve queue.
- `playerInventoryItemChange` and held-item changes, used to strip Piercing.

## Outputs
- Health changes on the struck entity only, via `applyDamage` + `setCurrentValue`, with kill credit to the owner.
- Block edits: air for the crater and `minecraft:sculk` for the patch. These are ordinary world changes, synced and saved.
- `minecraft:sonic_explosion` particles (or an RP look-alike, `L0-sclk-ad02`) along each bolt's path.
- `[andrew] sculk:` log lines, which GameTests and the probe read as witnesses.

## Stage-7 order (from the plan)
1. Probe on checks (19136): `L0-sclk-p001`. It gates `adr-scbs`/`adr-scdm`. A failed gate supersedes the ADR before any build task.
2. `lgnd` v7 (no-ability def, def #5).
3. Item, token, recipe, RP.
4. Bolt pipeline and damage.
5. Crater and sculk, together with the deny-list extraction (Orbital scenarios as its gate).

## Child artifacts
- **Processes:** p001 probe · p002 shot→bolt · p003 flight/trail/expiry · p004 entity hit · p005 block hit/carve · p006 craft wiring.
- **Rules:** r001–r010.
- **Entities:** ent1 item · ent2 bolt entity · ent3 bolt record · ent4 carve plan.
- **ACs:** ac01–ac20 = T01–T20 (T01–T03, T19 and T20 as crossbow call sites of `lgnd`), ac21 probe, ac22 Orbital regression, ac23–ac27 iPad.
- **Decisions:** ad01–ad04 · **Assumptions:** as01–as05 · **Contradictions:** cx01–cx02 · **Glossary:** gl01–gl06 · **Constraints:** cons.

## Seams the reduce re-checks
- Orbital protection stays green after the deny-list move.
- The magnet's GameTests include def #5.
- A Katana ray stops on sculk (a full solid block).
- Crater vs a structure `protect` box: check, do not assume (`xasm25` says structures get no protection).







### strm · Storm Blade + two vanilla recipes (L0-strm)

---
title: "strm · Storm Blade (`andrew:storm_blade`) + Elytra/Totem recipes"
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-katn", "L0-sclk", "L0-scyt", "L0-magn", "L0-adr-sbdm", "L0-adr-sblt", "L0-adr-sbvr", "L0-xcx26", "L0-xcx27", "L0-xq8", "L0-xasm29", "L0-xasm30", "L0-xasm31", "L0-xasm32"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
governs_files: ["src/storm/", "src/legendary/registry.ts", "src/main.ts", "src/katana/plan.ts", "packs/behavior/items/storm_blade*.json", "packs/behavior/recipes/storm_blade.json", "packs/behavior/recipes/elytra.json", "packs/behavior/recipes/totem_of_undying.json"]
---
# strm · Storm Blade + two vanilla recipes

**Source:** "Storm Blade + Elytra + Totem of Undying v1" (§01–§07). Code base 1.8.0.

## Responsibility
1. **Legendary def #6**, the Storm Blade. It is a diamond-sword-class melee weapon with:
   - an **active** Use ability: a straight trace of ≤ 10 blocks that deals 10 HP pre-armour to the first living entity, with three visual strikes;
   - a **passive** melee proc: 30 % for +6 HP pre-armour and one visual strike.
2. **Two unlimited vanilla recipes**: 6 feathers + diamond chestplate → `minecraft:elytra`, and 8 gold ingots + emerald → `minecraft:totem_of_undying` (`L0-adr-sbvr`, C-31).

## What strm owns vs cites
| Area | Owner | Note |
|---|---|---|
| Craft-once gate, token swap, refund, broadcast, Creative/`/give` copies | `lgnd` (cited) | def-driven; strm only adds def #6 |
| Retention on death, chest stays, hazards, Void → last holder (incl. offline) | `lgnd` (cited) | `lgnd` scenarios gain def #6 |
| Hand priority (`resolveActivation`), HUD line, cooldown storage | `lgnd` (cited) | HUD text via lang keys |
| Magnet pick-up | `magn` (cited) | legendary scenarios include def #6 |
| Ray stepping, `TRACE_FLAGS` | `katn` | **imported** from `src/katana/plan.ts` (`L0-strm-adtr`) |
| Hurt-window technique | `sclk` | **mirrored**, not shared: armour damage ≠ true damage |
| Damage helper `src/storm/damage.ts` | strm | `L0-adr-sbdm`, C-29 |
| Trace, visuals, cooldown spend, passive roll | strm | `L0-adr-sblt`, C-30, C-32 |
| `elytra.json`, `totem_of_undying.json` | strm | no script and no gate |

## Inputs
- `itemUse` → `resolveActivation(player)` → `{ def: storm_blade, slot }`.
- `entityHitEntity` (+ the same tick's `entityHurt` for L) with the blade in the main hand.
- Dimension block/entity rays; an injectable `Rng` (`() => number`).

## Outputs
- `applyDamage` on exactly one target per event, with cause `entityAttack` and the wielder as `damagingEntity`.
- Particles and sound only: no entity is spawned, and there is no `lightning_bolt`.
- The cooldown is written through the def's cooldown key, on the active path only.

## Sub-artifacts
- Processes: `L0-strm-pact` (active), `L0-strm-ppas` (passive), `L0-strm-pprb` (probe).
- Rules: `L0-strm-rdmg` (damage), `L0-strm-rcd` (validity/cooldown), `L0-strm-rvis` (visuals).
- Entities: `L0-strm-edef` (def + item), `L0-strm-ercp` (the three recipes).
- ACs: `L0-strm-acr` (craft/legendary), `L0-strm-acd` (damage), `L0-strm-act` (trace/cooldown), `L0-strm-acv` (visuals/vanilla), `L0-strm-aci` (iPad).
- Decision `L0-strm-adtr`, assumption `L0-strm-asm1`, contradiction `L0-strm-cxkb`.

## Framework boundary (xasm32)
The only framework edits allowed are the def #6 entry in `registry.ts` and the subscriptions in `main.ts`. Exporting the Katana's private `trace` is a `katn` edit, not a framework edit (`L0-strm-adtr`). Any other change to `src/legendary/*` means a new L0 contradiction before the build.

## Build order (from the L0 plan)
1. Probe.
2. Vanilla recipes.
3. Def, item, token, recipe, RP and lang.
4. Damage helper with the hurt-window proof.
5. Active trace, visuals, cooldown and HUD.
6. Passive.







### L0-ufoc · UFO event core (schedule, phases, commands, restart) (L0-ufoc)

# L0-ufoc · UFO event core (schedule, phases, commands, restart)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-sauc", "L0-magn", "L0-adr-ufom", "L0-adr-ufpc", "L0-adr-ufht", "L0-xasm13", "L0-xasm14", "L0-xasm17", "L0-xcx17", "L0-xcx20"]`

**Shipped: UFOC-CORE-01-AA (aef4d54, merge 4f479af), `src/ufo/`.** It implements `L0-adr-ufom`, `L0-adr-ufpc` and `L0-adr-ufht` as given and does not re-derive them.

## Responsibility
`ufoc` is the event's only clock and only state machine (UFO §2, §9, §10, §12):
- **Schedule** (`r001`, `p001`). The next arrival is stored as epoch ms in `andrew:ufo_next_ms` (C-21). The first arrival comes a random 10–20 min after the first join (`L0-xasm14`). After every departure, shoot-down, `stop` or restart, the next one is set 15 min out. When an arrival falls due, the event waits for an Overworld player.
- **Enable flag** `andrew:ufo_enabled` (default on, `r006`).
- **Target and centre** (`r002`). The target is a random valid Overworld player. The centre is the block under their feet when the arrival starts, and it is frozen from then on.
- **Hover height** (`r003`): `hoverY = min(centre.y + 40, ceiling − 15)`, where `ceiling = overworld.heightRange.max` (`L0-adr-ufht`).
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







## Architecture Decisions

### ADR-L0-sbdm · Storm Blade damage (status: proposed, probe-gated) (L0-adr-sbdm)

---
title: "ADR-L0-sbdm · Storm Blade damage: armour-respecting and safe from the hurt window"
aliases: ["L0-adr-sbdm", "Storm Blade damage pipeline"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-xcx26", "L0-xcx27", "L0-xasm29", "L0-adr-scdm"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
governs_files: ["src/sculk/hit.ts", "src/scythe/volley.ts"]
---
# ADR-L0-sbdm · Storm Blade damage (status: proposed, probe-gated)

## Context
Spec §02/§05 asks for **10 HP (active)** and **+6 HP (passive)** *before* armour, as separate events that never double.

The engine has a hurt window (memory, CNTR-X22; `src/sculk/hit.ts:25`). For 10 ticks after a landed hit, a weaker or equal `applyDamage` takes 0 and a stronger one takes only the difference. `applyDamage` still returns true either way.

The passive fires from `entityHitEntity`, which is **the same tick as the melee hit**. Melee is about 7–8 HP and the bonus is 6, so a plain `applyDamage(6)` is swallowed every time (`xcx26`). An active hit on a target meleed within the last 10 ticks loses part of its damage the same way.

The crossbow's answer (`hit.ts` window mode: `applyDamage`, then a health write) gives *true* damage. It skips armour, which this spec forbids.

## Options
- **A: Difference-stacking (proposed).** Inside a known window whose last hit was L, call `applyDamage(L + D)` with `entityAttack` and the wielder as `damagingEntity`. The engine takes the difference D and applies armour to it, so armour and credit stay native. Outside a window, call `applyDamage(D)` alone. L comes from the blade's own melee (`entityHitEntity` → `entityHurt.damage` in the same tick), or from a per-target record of the last landed hit and its tick.
  - Probe P1: is armour applied to the difference (D) or to L + D?
  - Probe P2: does the difference hold for players *and* mobs?
- **B: Deferred bonus.** Schedule the passive/active damage for the tick the window closes (+10). Simple and native, but the bonus lands half a second late, and a second melee hit in between re-opens the window.
- **C: Manual armour.** Compute the vanilla armour/toughness/Protection/Resistance reduction in script and write health directly (the `hit.ts` window pattern with D′ = reduced D). Exact timing, but it re-implements the engine's armour formula. That is drift-prone across versions and breaks totems/absorption unless the lethal path goes through `applyDamage`.

## Decision
**A**, gated on probes P1 and P2 on checks (19136).
- If P1 shows armour is applied to L + D, use **C** for the in-window case only, keeping `applyDamage` for the lethal and out-of-window paths (the same split as `hit.ts`).
- **B** is rejected unless both A and C fail. A visible half-second lag breaks "the strike comes with the hit".

## Consequences
- `strm` owns a small `src/storm/damage.ts` that mirrors `hit.ts` modes (`lethal | native | window`). It must not import the crossbow's true-damage write.
- A GameTest proves each mode against an armoured SimulatedPlayer, comparing health before and after to a vanilla-sword control. It includes an in-test negative control for plain `applyDamage(6)` inside the window (red proof).
- The shield question (`xcx27`) is separate: any `entityAttack` `applyDamage` is cancelled by a raised shield.







### ADR-L0-sblt · Storm Blade visuals (status: proposed, probe-gated) (L0-adr-sblt)

---
title: "ADR-L0-sblt · Visual-only lightning and the wind/electric trace"
aliases: ["L0-adr-sblt", "Storm Blade visuals"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-adr-sbdm"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
---
# ADR-L0-sblt · Storm Blade visuals (status: proposed, probe-gated)

## Context
The spec wants three lightning strikes at the active hit point and one per passive proc. They must deal no damage, set no fire and cause no knockback (C-30). It also wants a visible straight wind-and-electric line of up to 10 blocks. Spec §05 explicitly allows particles and sound if vanilla lightning cannot be purely visual.

On stable 2.10.0, a `minecraft:lightning_bolt` from `spawnEntity` or `/summon`:
- damages entities near the strike;
- can ignite blocks (unless `doFireTick` is off, which is world-wide);
- converts pigs, villagers and creepers.

There is no stable API to cancel entity damage before it applies.

## Options
- **A: Particles and sound (proposed).**
  - A vertical column of electric-spark and flash particles at each strike point, plus the vanilla thunder/impact sound (`ambient.weather.lightning.impact`).
  - The trace is particles every ~0.5 block along the real ray (wind-burst plus spark), emitted once from the shared interval.
  - No entity is spawned, so nothing can damage or ignite. Zero cost once the burst is over (C-5f analogue).
- **B: A custom RP-only "bolt" entity** (snowball runtime, no collision, no damage, a short lifetime) with a bolt geometry and render controller. It looks closer to vanilla, but it is a new entity: it must not push mobs (memory: use a snowball runtime) and it needs iPad proof of the render.
- **C: Real `lightning_bolt`** with the target pre-protected. Rejected: it cannot be made visual-only on stable (fire, conversions, bystander damage). This is the exact failure the spec forbids.

## Decision
**A**, and record the deviation from "lightning strikes" under C-16 in the deviations doc. **B** is a later iPad-driven upgrade if the operator judges A unreadable. It needs its own task and must keep C-30.

Probe on checks:
- Which particle ids exist on 1.26.51 (spark, wind burst, flash)?
- Does the sound play at the point for every player within 16 blocks?

The iPad criterion is "the operator reads it as lightning".

## Consequences
- No `lightning_bolt` id appears anywhere in `src/storm/`. A grep check guards this.
- GameTest: after an active hit and a forced passive proc, there is no fire block within 3 cells, no new entity of type `lightning_bolt`, and bystanders' health is unchanged.







### ADR-L0-sbvr · Vanilla item recipes (status: accepted) (L0-adr-sbvr)

---
title: "ADR-L0-sbvr · Elytra and Totem as plain native shaped recipes"
aliases: ["L0-adr-sbvr", "Vanilla item recipes"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-lgnd"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
governs_files: ["packs/behavior/recipes/"]
---
# ADR-L0-sbvr · Vanilla item recipes (status: accepted)

## Context
Spec §03–§05 asks for two **unlimited** recipes that output real `minecraft:elytra` and `minecraft:totem_of_undying`, with no new mechanics, using "native shaped recipes". Every legendary recipe in the pack outputs a **craft token** (`andrew:*_crafted`), which a script swaps under the craft gate.

## Options
- **A: Plain `minecraft:recipe_shaped` with the vanilla result (accepted).** Two JSON files in `packs/behavior/recipes/`, each with `tags: ["crafting_table"]` and an `unlock` on the feather or gold ingot. No token and no script.
- **B: A token plus a script swap.** Rejected: it adds a gate to an ungated item and risks C-31 (stray marks or properties).

## Decision
**A.** The recipes live in `strm`'s scope as one small task. `lgnd` is not touched: neither item is a def. The magnet and protection treat them as ordinary items (C-31).

## Consequences
- GameTest: real-recipe crafting is possible through a Crafter (memory). Craft each recipe twice. The output type id is exactly the vanilla id, it has no dynamic properties, and the input slots are empty afterwards.
- Collision check: neither pattern collides with any existing pack recipe. The Storm Blade's ` L / WSW / L ` shape shares its outline with the crossbow's but uses different keys, which is safe.
- iPad: both recipes appear in the recipe book once a feather or a gold ingot is held.







