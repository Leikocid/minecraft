---
current_analysis_version: 11
current_versions_by_node:
  L0: 11
  L0-lgnd: 7
  L0-pick: 2
  L0-infr: 2
  L0-scyt: 2
  L0-webs: 2
  L0-strf: 2
  L0-loot: 2
  L0-wind: 2
  L0-wrdn: 2
  L0-bast: 2
  L0-airs: 2
  L0-pntr: 3
  L0-orbc: 3
  L0-ring: 3
  L0-ufoc: 5
  L0-sauc: 5
  L0-magn: 5
  L0-katn: 6
  L0-sclk: 7
  L0-strm: 8
  L0-trdt: 9
  L0-uwbw: 10
  L0-ench: 10
  L0-pear: 11
pending_revisions: []
last_run:
  started_at: '2026-10-12T18:08:33.026Z'
  completed_at: '2026-10-12T18:21:32.251Z'
  duration_seconds: 779
  total_artifacts_current: 68
  total_size_kb: 391
  open_contradictions: 5
  llm_calls: 3
  llm_budget_used_pct: 2
  input_hash: 11b7a73e1c7bff639bceacaa8fdacd4383726efc1d220af304a05f32b06a514a
  run_priority: 650
  run_scope:
    recorded_at: '2026-10-12T18:08:33.056Z'
    rule: 'full: every node the decomposition plans name, from L0 down.'
    nodes:
      - L0
    reasons:
      L0: root — every run enters the tree here
  stages:
    - stage: nodes
      entered_at: '2026-09-24T19:23:43.218Z'
      done: 6
    - stage: rollout
      entered_at: '2026-09-24T19:42:02.813Z'
    - stage: nodes
      entered_at: '2026-09-26T08:02:47.839Z'
      done: 12
    - stage: rollout
      entered_at: '2026-09-26T08:34:28.601Z'
    - stage: collect-decisions
      entered_at: '2026-09-26T08:38:44.737Z'
    - stage: load-model
      entered_at: '2026-09-29T16:55:19.761Z'
    - stage: audit
      entered_at: '2026-09-29T16:55:19.768Z'
    - stage: delta 1/8
      entered_at: '2026-09-29T16:55:19.777Z'
    - stage: delta 2/8
      entered_at: '2026-09-29T16:55:48.347Z'
    - stage: delta 3/8
      entered_at: '2026-09-29T16:56:17.605Z'
    - stage: delta 4/8
      entered_at: '2026-09-29T16:56:23.957Z'
    - stage: delta 5/8
      entered_at: '2026-09-29T16:56:28.191Z'
    - stage: delta 6/8
      entered_at: '2026-09-29T16:56:33.467Z'
    - stage: delta 7/8
      entered_at: '2026-09-29T16:56:39.698Z'
    - stage: delta 8/8
      entered_at: '2026-09-29T16:57:02.786Z'
    - stage: nodes
      entered_at: '2026-09-29T18:44:27.434Z'
      done: 5
    - stage: rollout
      entered_at: '2026-09-29T19:09:13.581Z'
    - stage: collect-decisions
      entered_at: '2026-09-30T15:21:33.649Z'
    - stage: load-model
      entered_at: '2026-09-30T15:21:33.662Z'
    - stage: audit
      entered_at: '2026-09-30T15:21:33.669Z'
    - stage: delta 1/2
      entered_at: '2026-09-30T15:21:33.674Z'
    - stage: delta 2/2
      entered_at: '2026-09-30T15:21:39.301Z'
    - stage: collect-decisions
      entered_at: '2026-09-30T15:23:06.900Z'
    - stage: load-model
      entered_at: '2026-09-30T15:23:06.917Z'
    - stage: audit
      entered_at: '2026-09-30T15:23:06.923Z'
    - stage: delta 1/2
      entered_at: '2026-09-30T15:23:06.929Z'
    - stage: delta 2/2
      entered_at: '2026-09-30T15:23:12.656Z'
    - stage: collect-decisions
      entered_at: '2026-10-02T18:41:57.104Z'
    - stage: load-model
      entered_at: '2026-10-02T18:41:57.116Z'
    - stage: audit
      entered_at: '2026-10-02T18:41:57.121Z'
    - stage: delta 1/2
      entered_at: '2026-10-02T18:41:57.127Z'
    - stage: delta 2/2
      entered_at: '2026-10-02T18:42:01.976Z'
    - stage: nodes
      entered_at: '2026-10-02T18:42:28.055Z'
      done: 4
    - stage: rollout
      entered_at: '2026-10-02T18:59:43.239Z'
    - stage: nodes
      entered_at: '2026-10-02T19:01:34.949Z'
      done: 5
    - stage: rollout
      entered_at: '2026-10-02T19:12:16.964Z'
    - stage: collect-decisions
      entered_at: '2026-10-03T14:41:56.084Z'
    - stage: nodes
      entered_at: '2026-10-03T14:42:44.718Z'
      done: 3
    - stage: rollout
      entered_at: '2026-10-03T14:58:23.838Z'
    - stage: nodes
      entered_at: '2026-10-05T16:54:57.833Z'
      done: 3
    - stage: rollout
      entered_at: '2026-10-05T17:12:56.108Z'
    - stage: collect-decisions
      entered_at: '2026-10-08T18:34:57.651Z'
    - stage: load-model
      entered_at: '2026-10-08T18:34:57.675Z'
    - stage: audit
      entered_at: '2026-10-08T18:34:57.684Z'
    - stage: delta 1/1
      entered_at: '2026-10-08T18:34:57.690Z'
    - stage: nodes
      entered_at: '2026-10-08T18:35:41.445Z'
      done: 2
    - stage: rollout
      entered_at: '2026-10-08T18:47:14.691Z'
    - stage: collect-decisions
      entered_at: '2026-10-11T18:30:11.547Z'
    - stage: load-model
      entered_at: '2026-10-11T18:30:11.584Z'
    - stage: audit
      entered_at: '2026-10-11T18:30:11.590Z'
    - stage: delta 1/1
      entered_at: '2026-10-11T18:30:11.596Z'
    - stage: nodes
      entered_at: '2026-10-11T18:31:21.739Z'
      done: 2
    - stage: rollout
      entered_at: '2026-10-11T18:49:56.551Z'
    - stage: nodes
      entered_at: '2026-10-12T17:54:52.525Z'
      done: 3
    - stage: rollout
      entered_at: '2026-10-12T18:07:51.589Z'
    - stage: nodes
      entered_at: '2026-10-12T18:08:33.075Z'
      done: 2
    - stage: rollout
      entered_at: '2026-10-12T18:21:49.769Z'
  digest_review:
    analysis_version: 11
    through: '2026-10-12T18:21:49.754Z'
    reviewed_at: '2026-10-12T18:21:49.754Z'
last_rollout_hashes:
  project-knowledge/glossary.md: 5f13d71afcccfd20
  project-knowledge/business-rules.md: 39c89bbe453049b5
  project-knowledge/boundaries.md: 52130c6cd83d1194
  project-knowledge/intent.md: cd488f0730d03d85
  project-knowledge/domain-model.md: 4e771cf2a28c43ac
  project-knowledge/architecture.md: ee277ea2b5ddf492
  assumptions.md: ff743e729557fa9c
  contradictions.md: 046bc083c999792e
  client-questions.md: 41a72a9fee2fa518
  summary.md: 45232d38801d0456
  scope.md: 7c245f5b93875b9a
  risks.md: 3d57d6e55e31f021
  decisions.md: 46863890ef57b4a1
runtime_vocabulary:
  concept-boundary:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-constraint:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-decomposition-plan:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-intent:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-overview:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-acceptance-criterion:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-entity:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-process:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-rule:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-component:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-architecture-decision:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-assumption:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-contradiction:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-glossary-term:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
  concept-client-question:
    description: Seen at runtime
    parent_type: concept
    invented_at: '2026-09-24T19:42:02.803Z'
slug_mappings:
  'Build & verification infrastructure (Stage 0: TS build, `.mcaddon` packaging, JSON validation, BDS in Docker, GameTest harness, iPad LAN cycle, version targets)': L0-infr
  'Miner''s Pickaxe probe (Stage 1: item, recipe, dig speed, enchantability, auto-smelt)': L0-pick
  Legendary weapon framework (one-per-world craft gate + refund, announcement, death retention/anti-dup, void return, cooldown store + Action Bar, hand priority, localization): L0-lgnd
  Web Sword (item/recipe, reach targeting, 3×3×3 cobweb trap, protected-block filter, unloaded-chunk safety): L0-webs
  Scythe of Calamity (item/recipe, nearest-visible-player targeting + tie-break, 3 homing projectiles through blocks, 3 HP true damage, ~10-block launch, 20-block pursuit radius and cooldown outcomes, cleanup): L0-scyt
  'Build & verification infrastructure (Stage 0 closed; v2 delta: structure-template pipeline — generating `.mcstructure` from repo sources, packing `structures/`, worldgen/placement GameTest harness, statistical chunk-roll checks, restart/idempotency checks on BDS)': L0-infr
  Miner's Pickaxe probe (Stage 1, closed — reconcile only): L0-pick
  Legendary weapon framework (shipped `src/legendary/`; reconcile spec vs code): L0-lgnd
  Web Sword (shipped; reconcile): L0-webs
  Scythe of Calamity (shipped Stage 3; mob targeting now in scope; reconcile): L0-scyt
  Structure framework — StructureDef registry, chunk discovery + seeded per-chunk roll, rotation, footprint validity (dry land / water / lava ocean / world ceiling / flatness), vanilla/custom structure collision heuristic, loaded-footprint guarantee, `structureManager.place`, persistent instance registry + idempotent first-init, one-time persistent mobs, vanilla-like spawner semantics, deviation report: L0-strf
  Loot system — custom weighted table (13 categories, 5–12 attempts, Golden Apple once, 80/20 iron/diamond, random armor slot, compatible non-curse enchants up to max level) + vanilla loot-table application (`chests/ancient_city`, `chests/bastion_treasure`, `chests/bastion_other`); one-time fill; statistical tests: L0-loot
  Windmill — template (3 floors, stairs, blades, fields, fence, water, decay), 25 chests 5/8/12, 3 spawners, 10 sun-immune persistent field Zombie Villagers + cure behaviour, 1 % normal gen, guaranteed spawn-area search (5×5 chunks → ≤500 blocks → forced site prep with edge smoothing, shallow void fill only), linked-Airship trigger: L0-wind
  Airship — template (gondola 4 rooms + corridor, balloon), 10 chests, 1 Vindicator spawner, whole-footprint land check, altitude 40–70 above max terrain, ceiling rejection, independent 2 %, Windmill-linked 40–100 block search (no dedupe, no widening): L0-airs
  Mini Warden City — ~30×30×10–15 template, random top Y −35…−45, land-above check, ~5×5 surface sculk marker aligned so digging down hits the hall, Reinforced Deepslate monument, 2 natural shriekers (`can_summon`), 10 Ancient City chests (3 central), sparse soul lighting, 5 % gen: L0-wrdn
  Mini Bastion — Nether ~20×20×10–12 template, 2–3 levels, lava treasure room (3 treasure chests + 2–4 gold blocks), 7 bastion chests, 7–10 Piglins + 2 Brutes one-time persistent, no Hoglins, not over lava ocean, 5 % gen: L0-bast
  Legendary framework — v3 delta only. Add `ORBITAL_CANNON` to the static registry (cooldown 600 ticks, refund 4 TNT + 1 Fishing Rod). Add an LMB activation path to `resolveActivation`. Make `/give` and Creative copies stop claiming the craft (`xcx9`). Return to the last holder, with a `holder` field in the mark (`xcx11`, answers `xq3`). Add a "not destroyed" policy and a container-destruction rule (`xcx10`). Expose a `protectLegendariesIn(dimension, volume)` helper for the effects. Reconcile existing ACs.: L0-lgnd
  'Orbital Cannon core. Item JSON: fishing-rod icon, no fishing, no durability, not enchantable, punch damage, Equipment category (`xcx13`). Recipe and lang. Input mapping for LMB/RMB and touch (`xcx8`). 10-block raycast on any face; silent no-op with no cooldown when nothing is hit. Target lock, shared cooldown and HUD. Charge spawn height per dimension with ceiling clamp. A script-driven charge that falls through entities and detonates on first block contact or immediately when inside a solid block; the Void destroys it. Owner-independent lifecycle bound to its dimension; lost on unload or restart.': L0-orbc
  LMB penetrator. Compute the irregular ~5×5 column from the detonation point down to `heightRange.min`. Keep liquids and Survival-unbreakable blocks without stopping below them (`xasm6`). Remove Obsidian, Nether portals, containers and spawners with no drops, but protect legendaries through `lgnd`. Batched removal that looks instant. One sound and a ~1 s top-down particle wave. No direct damage. ACs 7–10.: L0-pntr
  'RMB rings. Rasterise continuous rings at d≈1/5/10/15/20 (`xasm8`). Spawn all charges at once. Each explodes independently (no chain push). TNT-equivalent damage including the owner. TNT-resistance block breaking with no drops (`xasm7`) and no fire. Underwater: damage only. Protect legendaries. Clean up temporaries. Performance under several simultaneous RMBs. ACs 11–15.': L0-ring
  'Legendary framework, v4 pass. It has two parts. **(1) Reconcile with the as-built v1.4.x code.** The v3 delta has shipped: tokens, holder, owed list, the off-hand read, `protectLegendariesIn`, `isLegendaryItemEntity`, the third def, and the v1.4.2 fix "a legendary cannot be lost in the tick it is dropped". Close `xcx9`–`xcx11` against the code and the GameTests, and retire stale v3 "not started" text. **(2) The UFO delta.** Publish a stack-level `isLegendaryStack(stack)` for `magn`. Make sure `HOLDER_TYPES` watching survives holders that the magnet teleports: chest and hopper minecarts and armour stands. Confirm death retention when a player dies from a magnet fall while holding a legendary. Restate `hidden_until` in ms under C-21. ACs: UFO 13 (rule side).': L0-lgnd
  'UFO event core. The durable schedule: epoch ms next-arrival, the first arrival 10–20 min after the first join, +15 min after a departure or shoot-down, waiting for an Overworld player, and the enable flag. Target and centre selection; hover height = centre + 40, capped at ceiling − 4. The phase machine (arrival 20 s / magnet 60 s / release / departure 15 s / pause), which publishes phase events to `sauc` and `magn`. One shared `runInterval` (C-5d). Restart cleanup of leftover entities (C-23). The operator command `/andrew:ufo come/stop/enable/disable`. RU/EN messages and the 150-block arrival notice. A testable clock seam (`L0-xasm13`). UFO ACs 1, 2 (timing), 3, 17, 18.': L0-ufoc
  'Saucer and beam. BP + RP entities: a ~12-block disc, a dome, rim lights and a spin; a translucent green beam cone shown during the magnet. No push, no collision and immune to everything but the Cannon, within the known engine traps (pushable/runtime_identifier). The flight path: in from 90 blocks at hover + 10, out 90 blocks the opposite way, staying ≤ 100 blocks from the centre (U8). Sounds. **Shoot-down:** an interceptor on `orbc` flight (`L0-adr-ufoi`), the hull cylinder r 6 × h 3 in any phase, the charge absorbed, magnet-off through `ufoc`, a 3 s smoking fall, a blast that does no damage (visual and sound only), 8 diamonds + 1 totem, and a broadcast naming the charge owner. UFO ACs 2 (path and look), 15, 16, plus the iPad DoD visuals.': L0-sauc
  Magnet effect. The iron lists (items, blocks, ore, entities) verified against the 1.26.51 ids (`L0-xasm15`). Mob and armour-stand armour read through `hasitem`, one item at a time (U4b). One `getBlocks`/`includeTypes` zone scan at magnet-on (U7). The ≤ 10 priority selection, nearest first, and the 12-block drop exemption. Container iron-stack extraction (U5), with the hopper ruled by `L0-xcx18`. Block → air + one item, a whole door, ore → `raw_iron` (U6). Underground items fly through stone (U3). Player pull through `applyKnockback` ≤ 0.6 blocks per tick to 6 below the saucer, stopped and resumed by the hand state each tick (U10), never in Creative or Spectator. The cloud ring r 5 at −3, away from players (U11). Simultaneous release with vanilla physics and fall damage from the release point (U2). Legendaries excluded through `lgnd`. UFO ACs 4–14.: L0-magn
  ? 'Dragon Katana (`andrew:dragon_katana`). **Item:** a Diamond Sword clone on the `web_sword.json` template: damage 7, `is_sword`, sword enchant slot, `fire_resistant`, `allow_off_hand`, no durability, Creative "Equipment", RU/EN names. **Recipe:** golden apple / ender pearl ×2 / Diamond Sword, through the framework''s craft token (T01–T03). **Ability:** `itemUse` (and the block-tap path as in `webs`/`scyt`) → `resolveActivation` → server-side trace from the head along the view, capped at 20 blocks (clamp per `L0-xasm18`), with obstacle semantics per `L0-adr-ktob` (water and lava pass, unreadable = solid) → the nearest safe standing cell on the owner''s side (`L0-xasm19`), with no block edits → `teleport` keeping the facing → `startCooldown` 30 s epoch ms. A cooldown attempt is a no-op that does not reset the timer (T05–T10). **Fall:** a one-shot flag per `L0-adr-ktfl` / `L0-xasm20` (T11, T12). **Trail:** a pink cherry-petal trail A→B under C-5e, harmless (T13). **HUD:** the RU/EN ready string and seconds. **GameTests:** T04–T15 with SimulatedPlayers, plus the Katana instances of T16–T18 against the framework. **iPad:** the trail, the HUD, the icon and the Creative placement. Probe first: fall-distance reset and the ray flags (`includePassableBlocks`, liquids).'
  : L0-katn
  'Legendary framework, v6 pass. **(1) Reconcile with as-built 1.4.4:** `resolveActivation` and `heldLegendaries` are shipped (`hands.ts`). The Void-minecart holder return has merged (`recovery.ts` `VOID_HOLDER_TYPES`). Re-state what is still open (`holder` for the last owner, `xcx11`; the armour stand). **(2) Katana delta:** def #4 and its craft token, and the uniqueness-flag key. Confirm that `isLegendaryStack`, retention, `protectLegendariesIn` (Orbital blast and rings, T17) and the HUD need no per-weapon code beyond the def. State T17 under C-16 (`L0-xcx21`, `L0-xasm22`). Make sure the Katana''s self-teleport does not trip recovery (a player teleport moves no item entity) and that a teleport into another dimension''s chunks is never attempted (same-dimension only).': L0-lgnd
  ? 'Sculk Crossbow (`andrew:sculk_crossbow`). **Probe first** (gates `L0-adr-scbs` and `L0-adr-scdm`): does a custom `minecraft:shooter` item get a loaded state, and do Quick Charge and Multishot apply to it? Does the vanilla crossbow''s projectile spawn expose its owner and velocity at `entitySpawn`, so it can be swapped for a bolt? Snowball-runtime bolt against a shield-holder (`xcx23`). Hurt-invulnerability on three hits in the same tick (`xcx22`). The `sonic_explosion` particle on the iPad. **Item:** the def from `L0-adr-scbs`, infinite durability, an enchant slot without Piercing (strip it on sight if the slot cannot exclude it), RU/EN lang, the Creative "Equipment" entry. **Recipe:** echo shard / deepslate / crossbow through the craft token (T01–T03). **Pipeline:** each projectile spawned by a marked crossbow becomes exactly one `andrew:sculk_bolt` with the same velocity and owner (C-26). It emits boom particles along its real path while in flight (C-5f), and has a lifetime cap. **Entity hit:** fixed `SONIC_BOOM_DAMAGE` (10, `xasm23`) through the Scythe true-damage pattern (C-28); a sculk patch under the target (`xasm24`); no crater. **Block hit:** an irregular crater seeded per bolt, ≤ 5×5×3, plus sculk on the exposed surfaces ≤ 5×5, under C-27 (`L0-adr-sctr`, `xasm25`); no entity damage. **Ammunition** per `xasm27`. **GameTests:** T04–T18 with SimulatedPlayers (≥ 2, C-20‴), plus the crossbow instances of T19–T20 against the framework. **iPad:** trail, crater, sculk, icon, Creative.'
  : L0-sclk
  ? 'Legendary framework, v7 pass. **(1) Reconcile with 1.6.1:** the Katana shipped (1.5.0). Legendaries are magnetic (`magnet-select.ts`, `magnet-hold.ts`): restate the old "never pulled" rule as an operator-tuned exception. **(2) No-ability def (`L0-xcx24`):** `LegendaryDef` gains an optional ability. Without it: no cooldown key, no `resolveActivation` claim and no HUD line (`hud.ts:37`). `cooldownTicks`/`abilityKey` become optional or are moved into an `ability` block, with no behaviour change for defs #1–#4. **(3) Crossbow delta:** def #5 (`keyPrefix: "sc"`), the craft token and refund (echo shard ×2, deepslate ×2, crossbow). Confirm that retention, recovery, Void and `protectLegendariesIn` need no per-weapon code. If `L0-adr-scbs` falls back to the vanilla crossbow, `isLegendaryStack` must become mark-aware; that is a larger change and must be stated as such. **(4) Holder (`xcx11`):** the decision says "the last holder" and the code returns to `mark.owner`. Either plan the holder field or restate T20 / the Void return against `mark.owner`, as v6 did for the Katana.'
  : L0-lgnd
  ? '**The Storm Blade (`andrew:storm_blade`) and the Elytra/Totem recipes.**<br>**Probe first, on checks (19136).** It gates `L0-adr-sbdm` and `L0-adr-sblt`:<br>• P1/P2: inside the hurt window, does `applyDamage(L + D, entityAttack)` take D with armour applied to D, for players and mobs (`xcx26`)?<br>• A raised shield against the beam from behind (`xcx27`).<br>• Which particle ids exist for the spark/wind/flash on 1.26.51, and whether the thunder sound plays at the point.<br>• Diamond-sword melee on BDS, measured against vanilla (`xasm30`).<br>**Item:** def #6 (`sb`, 600 ticks, `xasm32`); a custom sword with diamond-sword damage, no durability, and the vanilla sword enchant slot; `allow_off_hand`; RU/EN lang; a Creative "Equipment" entry; an RP icon.<br>**Recipe:** lightning rod top and bottom, wind charge left and right, diamond sword in the centre → craft token; refund on a blocked craft. Covers simultaneous crafts, the recipe book and shift-craft through the existing gate.<br>**Active:** Use → `resolveActivation` → a trace ≤ 10 blocks Euclidean, reusing `src/katana/plan.ts` helpers (`xasm31`). The first living entity, never through walls, never a second one, takes 10 HP pre-armour through `src/storm/damage.ts` (`adr-sbdm`, C-29). Three visual strikes at the hit point, or at the stop point on a miss (`adr-sblt`, C-30). Cooldown on any valid release; invalid attempts are free. HUD «Клинок бури — Готово» / "Storm Blade — Ready" / seconds left.<br>**Passive:** `entityHitEntity` with the blade in the main hand → an independent 30 % roll with an injectable RNG (C-32) → +6 HP pre-armour through the same helper, plus one visual strike. It never reads or writes the cooldown.<br>**Vanilla recipes (`adr-sbvr`, C-31):** `elytra.json` and `totem_of_undying.json`, plain shaped recipes outputting the vanilla ids.<br>**GameTests (`bds`):**<br>• every §06 bullet: once-only craft across a restart, Creative copy free; melee = vanilla diamond sword; passive rate on N ≥ 1000 seeded and a ±5 % band on a live sample; exact +6 and 10 pre-armour against an armoured SimulatedPlayer, with an in-window negative control; ≤ 10 blocks, wall stop, second target untouched; 30 s cooldown, passive independent; no lightning entity and no fire; death, hazards and Void through the `lgnd` scenarios with def #6; Elytra and Totem crafted twice each through a Crafter.<br>• The magnet''s legendary scenarios include def #6.<br>**iPad (`ipad`):** the trace and strikes read as lightning; the icon; the HUD line; the Creative entry; both recipes in the recipe book; a real totem pop and an elytra glide.'
  : L0-strm
  ? '**The Above-Water Trident (`andrew:above_water_trident`), def #7.**<br>**First deliverable: settle `xcx30`.** Design the custody ledger (`L0-adr-twth` §2/§5) and list every `lgnd` touch point: delivery to the last holder, death and offline handling, the stale entity on `entityLoad`, and the magnet ignoring the return entity.<br>**Probe, on checks (19136):**<br>• the engine bucket return for a token recipe, including a full inventory (`xasm33`);<br>• vanilla trident melee and thrown damage, and Impaling on a custom item (`xasm34`);<br>• `itemReleaseUse` and the charge on iPad touch, and `isSneaking` at release;<br>• vanilla Riptide III launch distance, and its `applyKnockback` calibration (`xasm37`);<br>• the fall cancel via the hurt before-event (with the katana teleport as fallback);<br>• vanilla swim speed with a sprint-swim baseline;<br>• vanilla throw speed and gravity;<br>• the return at 0.5 b/tick through blocks;<br>• a stale projectile on restart.<br>**Item:** custom trident: charge, no throwable, no durability, trident enchant slot, `allow_off_hand`; RU/EN lang; a Creative "Equipment" entry; RP icon and in-flight model (trident geometry).<br>**Recipe:** ` G / BTB / G ` → token. Exact bucket return and refund (C-34).<br>**Damage:** vanilla trident base for melee and thrown hits; +2 pre-armour through the shared `native / window / lethal` helper (extracted from or imported from `src/storm/damage.ts`); one strike visual per hit (`adr-twlt`); idempotent per hit event.<br>**Movement:** a sneak-release dash, with no cooldown, anywhere; a one-shot fall grant (`xasm36`); a held-only swim boost (C-36).<br>**Throw:** the ledger, then remove from hand, then spawn and launch; hit → damage → return; miss/block → visible 10 b/s return; re-insert exactly once; fallbacks (offline, death, dimension, unloaded, 30 s cap).<br>**Enchant:** scrub Loyalty and Riptide (C-37, `xasm35`).<br>**GameTests (`bds`)** for every acceptance bullet:<br>• recipe plus 2 buckets, full inventory;<br>• second craft blocked across a restart; Creative copy free;<br>• melee and thrown = vanilla + 2 against armour, with an in-window negative control; exactly one strike and no `lightning_bolt` entity;<br>• a dash on a dry platform with no rain, in the Nether and the End;<br>• no damage on the next landing, then normal damage on the one after;<br>• swim speed with and without the trident, in either hand;<br>• return speed 10 b/s ± 5 % from a block hit; re-throw refused mid-return; no duplicate at any tick;<br>• thrower dies, logs off or switches dimension mid-flight; Void, chest, fire, lava, explosion (through the `lgnd` scenarios with def #7);<br>• Loyalty and Riptide stripped, Unbreaking kept.<br>The magnet''s legendary scenarios include def #7.<br>**iPad (`ipad`):** dash feel, swim feel, the visible flight and return, the strike reads as lightning, icon, Creative entry, recipe in the recipe book, the sneak gesture.'
  : L0-trdt
  ? '**The Underwater Bow (`andrew:underwater_bow`), def #8 (Active), plus the Mace and Firework Rocket recipes.**<br>**Probe first, on checks (19136):**<br>• the `sclk` entitySpawn swap for a custom-shooter bow;<br>• `liquid_inertia` 0.99 (the `trident_in_flight` precedent) and survival in lava;<br>• vanilla bow damage on the swapped arrow, with Power, Punch, Flame and Infinity;<br>• `setOnFire` in water vs a scripted `fireTick` burn;<br>• an arrow raised to 14 through `strm` `raiseHit` with `causes: projectile` (`cause projectile + damagingEntity throws`, so use the before-event rewrite);<br>• a shield-blocked arrow;<br>• bucket return for the token recipe (the `trdt` `craftReturn` path);<br>• the plain `minecraft:firework_rocket` recipe output''s flight duration and Elytra boost (`xasm39`).<br>**Item:** custom shooter, bow draw/pull, `allow_off_hand` (if the shooter allows it), no durability, enchantable slot `bow`, RU/EN lang, a Creative entry, and RP textures.<br>**Recipe:** ` R / BWB / S ` → token, with exactly 2 buckets back (C-34).<br>**Flight:** C-42.<br>**Normal hit:** vanilla damage plus 2 s of fire, using the longer of that and Flame''s (`xasm38`).<br>**Ability:**<br>• arm on sneak + Use (`xcx33`, `xasm38`);<br>• the charge persists;<br>• a hit on a living entity → 14 pre-armour (C-29 exact), one `playStrikes`, Super Fire 5 s (C-43), and startCooldown(600);<br>• a miss → nothing (C-41);<br>• HUD: ready / armed / cooldown.<br>**Legendary:** every `lgnd` rule through def #8 (once per world, Creative free, retention, Void, recovery, persistence).<br>**Mace:** ` I / Z ` → `minecraft:mace`.<br>**Rockets:** ` P / S ` → 3 `minecraft:firework_rocket`.<br>Both are checked against every vanilla and `packs/behavior/recipes/*` shape (C-40).<br>**GameTests (`bds`) for each acceptance bullet in §5** that touches §1–§3, plus a negative control for each.<br>**iPad (`ipad`):** draw feel, HUD, lightning, underwater fire, icon, recipe book, rocket boost.'
  : L0-uwbw
  ? '**The enchanting table (§4): feasibility first.**<br>**First deliverable: a probe and a written verdict** on 1.26.51 / stable 2.10.0 (C-38). The probe asks:<br>• is there any event or component that sees table offers or the applied enchant? (`beforeEvents`, `playerInventoryItemChange` with before/after enchantments, an XP level drop of 1–3, `enchantable` slot data);<br>• can a SimulatedPlayer operate a table at all?;<br>• which treasure enchantments are already table-reachable on Bedrock (the Mace and Wind Burst, spear Lunge)?;<br>• can the result be told apart from an anvil, a command or a loot result?<br>**Feed `xq11`** with the verdict and the option table (`L0-adr-enrl`). **No engine hook is built before Andrey answers.**<br>**Always built:** a pure roller `src/enchanting/roll.ts` with an injectable RNG. It holds:<br>• the eligibility table per item, derived from vanilla data;<br>• the curse exclusion;<br>• the vanilla conflict groups;<br>• the 20 % rare stage, then 70/40/20 independent level rolls for Wind Burst and Unbreaking, highest wins, fallback I, capped by context max;<br>• exclusion of each def''s FORBIDDEN list.<br>Tests: ≥ 1000-sample statistics (C-39), plus a conflict and curse fuzz.<br>**If a hook is approved:** wire it, prove it on `bds` where a SimulatedPlayer can reach it and on `ipad` otherwise, and keep the C-37 scrubs running after it.'
  : L0-ench
  ? '**The Pearl Rod («Перовый сокровятель»): a non-legendary fishing rod that binds to a pressure plate and teleports its binder there (spec v3 §6–§8).**<br>**Probe first, on checks (19136):**<br>• whether `minecraft:fishing_hook` raises `projectileHitBlock` and what block it reports on a plate (a plate has no collision, so the hook may report the support block);<br>• the hook''s resting location on each plate type;<br>• whether the owner is readable (the projectile component) or must be correlated through `itemUse` plus `entitySpawn` +0;<br>• whether `hook.remove()` resets the rod''s cast pose on the client;<br>• whether a cancelled `beforeEvents.itemUse` on a vanilla rod casts nothing;<br>• whether `durability.damage` can be written back to 0 after a reel;<br>• whether ItemStack dynamic properties survive a reel, an anvil rename, a chest, a drop and a restart;<br>• whether `/tickingarea` preloads at 10 K / 100 K / 1 M blocks and in the Nether and the End (per `probe_tickingarea_load`), and the area cap shared with `spawn-search`;<br>• whether a cross-dimension `teleport` works with `dimension`;<br>• whether a 3×3 recipe pattern with blanks (`" P "," R ","   "`) enforces fixed positions (it must not craft when shifted, nor in the 2×2 grid).<br>**Item (`L0-adr-prbd`):** a **marked vanilla `minecraft:fishing_rod`**:<br>• the recipe outputs `andrew:pearl_rod_token`, which is swapped after the fact (the craftgate''s swap with no gate);<br>• name «Перовый сокровятель», an EN lore line and a rod id in a dynamic property;<br>• durability held at 0 damage;<br>• unlimited crafting, droppable, normal death drops.<br>**Recipe:** Ender Pearl top-middle, Fishing Rod centre, all other cells empty (`xq12`). It is checked against every vanilla and add-on shape (C-40).<br>**Binding:** the hook enters a plate cell (`xasm41`) → store {dimension, x, y, z, plate typeId, owner id, owner life epoch, plate generation} on the rod, then remove the hook.<br>**Bound use:**<br>• the owner, alive and with a matching epoch: cancel the cast, preload the destination, re-validate the plate, find a safe spot at or beside it, teleport, read the arrival back, then clear the binding;<br>• any other player: a normal cast (`xasm42`).<br>**Failure:** report it and never fake success (C-44). A missing plate clears the binding; a load timeout keeps it.<br>**Death:** bump the owner''s life epoch, which invalidates every binding of theirs wherever the rods are (C-45).<br>**Persistence:** the binding and the epoch survive a restart.<br>**GameTests (`bds`):** one for each §8 bullet, every plate type from `BlockTypes` (`*pressure_plate`), and a negative control for each.<br>**iPad (`ipad`):** the cast pose after retract, the name, lore and icon, the recipe book, the arrival feel, and the failure messages.'
  : L0-pear
tags:
  - analysis
  - registry
type: system-registry
---

# Analyst State

Runtime state for the analyst pipeline (analyse runs, vocabulary, slug map, rollout caches). Updated automatically.

## Current Versions

| Node | Version |
|------|---------|
| L0 | 11 |
| L0-airs | 2 |
| L0-bast | 2 |
| L0-ench | 10 |
| L0-infr | 2 |
| L0-katn | 6 |
| L0-lgnd | 7 |
| L0-loot | 2 |
| L0-magn | 5 |
| L0-orbc | 3 |
| L0-pear | 11 |
| L0-pick | 2 |
| L0-pntr | 3 |
| L0-ring | 3 |
| L0-sauc | 5 |
| L0-sclk | 7 |
| L0-scyt | 2 |
| L0-strf | 2 |
| L0-strm | 8 |
| L0-trdt | 9 |
| L0-ufoc | 5 |
| L0-uwbw | 10 |
| L0-webs | 2 |
| L0-wind | 2 |
| L0-wrdn | 2 |

## Last Run

- Started: 2026-10-12T18:08:33.026Z
- Completed: 2026-10-12T18:21:32.251Z
- Duration: 779s
- Current artifacts: 68 (391 KB total)
- LLM calls: 3 (2% budget)
- Open contradictions: 5

## Changelog

- 2026-10-12 18:07 — promoted L0 (v9 → v10) — auto-promoted after refine-driven re-analysis
- 2026-10-02 19:11 — promoted L0-ufoc (v3 → v5) — auto-promoted after refine-driven re-analysis
- 2026-10-02 18:58 — promoted L0-lgnd (v3 → v4) — auto-promoted after refine-driven re-analysis
- 2026-10-02 18:58 — promoted L0 (v3 → v4) — auto-promoted after refine-driven re-analysis — incomplete: 3 of 4 planned children have artifacts at v4; never analysed: L0-ufoc

*Auto-generated by `ai-kit analyze`. Manual edit allowed only for forced rollback of `current_versions_by_node`. Other fields overwritten on next run.*
