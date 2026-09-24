---
title: Architecture
type: project-knowledge
generated_at: "2026-09-24T19:42:02.849Z"
source_channel: rollout
node_id: rollout-architecture
aliases: ["rollout-architecture","architecture","project-knowledge/architecture"]
is_a: ["rollout","architecture"]
relates_to: ["L0-adr-cast","L0-adr-lgnd","L0-adr-scope","L0-adr-scyt","L0-infr","L0-lgnd","L0-pick","L0-scyt","L0-webs"]
priority: 520
---

# Architecture

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Components

### Component: Build & verification infrastructure (Stage 0) (L0-infr)

# Component: Build & verification infrastructure (Stage 0)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd"]`

## Responsibility
Turns the TypeScript source and the two static packs (`packs/behavior`, `packs/resource`) into a shippable `.mcaddon`, and proves — without a human, wherever the engine allows it — that the result actually loads and runs on real Bedrock: static (TS + JSON), a Bedrock Dedicated Server in Docker, an optional beta-only GameTest lane with SimulatedPlayer, and a LAN cycle that gets the same build onto the iPad for the checks only a human eye can make (rendering, icons, Creative placement, RU/EN names).

This is Stage 0 of the project: nothing in Stage 1 (Miner's Pickaxe) or Stage 2 (legendary weapons) starts until this component's own 5 closing criteria are green [src: stage-0-infrastructure, C-11].

## Inputs
- `src/**/*.ts` — behavior-pack script sources (single entry `src/main.ts`), plus dev-only sources under `src/selftest/`
- `packs/behavior/`, `packs/resource/` (static manifests, textures, lang files) — hand-authored, not generated
- `packs/gametest/`, `packs/selftest/` — dev-only packs, never shipped
- `scripts/targets.mjs` — the single source of truth for version targets
- Operator-supplied facts: the iPad's installed Bedrock version (read manually from Settings)

## Outputs
- `dist/andrew.mcaddon` — the release archive (behavior + resource only)
- `dist/bds-check.log`, `dist/bds-gametest.log` — saved server logs, the evidence artifacts `/verify` attaches to run-check
- Process exit code 0/1 from every `npm run bds:*` / `npm run validate` / `npm run build` command — this is what ai-kit's autopilot reads to close build/bds-typed acceptance criteria without an operator [src: decision-verification-approach-automatic]
- A running LAN server (`npm run bds:up`) and a printed `ip:19132` address for the iPad

## Sub-systems (see child processes for detail)
1. **Build & package** (`npm run build`) — esbuild → validate → zip
2. **Structural validation** (`npm run validate`, also called from build) — manifests + every JSON under `packs/**`
3. **BDS one-shot check** (`npm run bds:check`) — creative world, in-engine selftest pack, log-verdict
4. **GameTest harness** (`npm run bds:gametest`) — beta-only, SimulatedPlayer, separate world
5. **LAN dev server** (`npm run bds:up` / `bds:down` / `bds:logs`) — Survival+cheats, iPad joins over the network
6. **Version targeting** (`scripts/targets.mjs`, `scripts/set-version.mjs`) — one file, two scripts, keeps every manifest, `compose.yaml` and `package.json` in agreement

## Three verification channels
- **build** — `tsc --noEmit` + `npm run validate`: proves the TS compiles against `@minecraft/server` 2.10.0 types and every JSON is structurally valid. Mac only, no Docker.
- **bds** — `npm run bds:check` (creative, one-shot, self-terminating) and `npm run bds:gametest` (beta, SimulatedPlayer): proves the packs actually load on the real engine, the script executes, and — for GameTest — that specific gameplay behaves as specified, all from a log or exit code alone.
- **ipad** — human-eyes-only: rendering, icons, Creative inventory placement, RU/EN names. A green `bds` run never closes an `ipad` criterion [C-6]; these criteria are typed `manual` and don't block merge/autopilot [decision-verification-approach-automatic].

## Known open issue
CTR-4 (open, target `L0-infr`): the raw specs (`minerspickaxetestspec`, `stage-0-infrastructure`) still quote `@minecraft/server` 2.9.0 / engine 1.26.0 — superseded by `decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001` and the code (`scripts/targets.mjs`: 2.10.0 / [1,26,50] / BDS 1.26.51.1). No code fix needed; the raw docs just haven't been annotated. Not re-filed here.

## Boundary
Owns: build tooling, packaging, JSON/manifest validation, the Docker BDS harness (both the one-shot check and the GameTest lane), the iPad delivery mechanics (import + LAN), and the version-target single source of truth.
Does not own: the gameplay logic that BDS/GameTest exercise (Miner's Pickaxe, Web Sword, Scythe, the `lgnd` legendary-weapon framework) — those are separate components that *consume* this one's verification channels.







### Legendary weapon framework (craft gate + refund, announcement, death retention/anti-dup, void return, cooldown + Action Bar, hand priority, localization) (L0-lgnd)

---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-sitm", "L0-stgt", "L0-sprj", "L0-sqat"]
governs_files: ["src/legendary/", "src/websword/", "src/main.ts", "src/gametest/main.ts"]
see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2", "scytheofcalamityspecv1ruen-part-1", "scytheofcalamityspecv1ruen-part-2"]
---
# Legendary weapon framework (craft gate + refund, announcement, death retention/anti-dup, void return, cooldown + Action Bar, hand priority, localization)

**Responsibility.** Implement each "general rule for legendary weapons" (*общие правила легендарных оружий*: Scythe §1, §6; Web Sword §3, §4, §8, §9, §10) exactly once, in a new `src/legendary/`. The shipped Web Sword (0.3.0, `src/websword/*`) becomes the first registered `LegendaryDef`, and the Scythe of Calamity the second. No weapon module keeps a private copy of an anti-dup invariant (C-7).

## Current state (verified in code, 2026-09-24)
`src/legendary/` does not exist yet. Everything is hard-wired to the Web Sword:
| File | Concern | Web-Sword-only detail |
|---|---|---|
| `state.ts` | key names, mark, world flag, pending, cooldown deadline | `andrew:ws_*`; `ws_pending` holds a single mark |
| `craftgate.ts` | after-the-fact gate, refund, broadcast | `REFUND = web×4 + diamond_sword×1` |
| `retention.ts` | death retention (inventory path + drop sweep), restore on spawn | `findMarkedSword` returns the first sword only; off hand not scanned |
| `cooldown.ts` | `isReady/startCooldown/remainingTicks`, 10-tick HUD | `_abilityKey` ignored (one slot per player); main hand only |
| `commands.ts` | `/andrew:websword <give\|reset> [target]` | command name, item id |
| `rules.ts` | pure `craftDecision`, `cooldownRemaining`, mark (de)serialisation | `COOLDOWN_TICKS` |

## Owns
- Registry `registerLegendary(def)` — `L0-lgnd-ent1`, `L0-lgnd-p006`.
- Instance mark with `gen` + `holder` — `L0-lgnd-ent2`.
- Per-weapon one-per-world craft gate, refund, broadcast, Creative/admin exemption — `L0-lgnd-p001`, `L0-lgnd-r002`.
- Death retention for every legendary carried, both hands — `L0-lgnd-p002`, `L0-lgnd-r008`.
- Loss (Void/ordinary destruction) return to the last holder — `L0-lgnd-p003`, `L0-lgnd-r005`, `L0-lgnd-r011`.
- Cooldown per (player, abilityKey) + in-memory busy — `L0-lgnd-ent3`, `L0-lgnd-r003`, `L0-lgnd-r009`.
- Hand-priority Use dispatch — `L0-lgnd-p004`, `L0-lgnd-r004`.
- The only Action Bar HUD for legendaries — `L0-lgnd-p005`, `L0-lgnd-r007`.
- Operator commands — `L0-lgnd-p007`.
- Read-only `isHiddenFromTargeting(player)` — `L0-lgnd-r010`.
- Localization plumbing: every player-facing string is a rawtext `translate` key; the RU/EN strings themselves are owned by `L0-sitm` (C-4).

## Published contracts (change only by ADR)
- `LegendaryDef` shape (`L0-lgnd-ent1`).
- `cooldown.isReady / isBusy / setBusy / start / remaining (player, abilityKey)`.
- `isHiddenFromTargeting(player): boolean`.
- Ability handler `(player, hand) → "cast" | "refused" | "busy"`; the framework never infers success.

## Inputs / outputs
**In:** stable `@minecraft/server` 2.10.0 events (C-2): `playerInventoryItemChange`, `entityDie`, `playerSpawn`, `playerLeave`, `itemUse`, `playerInteractWithBlock`, `entitySpawn`, `beforeEvents.entityRemove`, `system.beforeEvents.startup`. Weapon modules supply defs and ability handlers; `L0-sprj` calls `setBusy`/`start` on volley resolution.
**Out:** durable world/player/item dynamic properties per weapon prefix (`L0-lgnd-ad01`); a chat broadcast on first craft; private blocked/returned/voided/admin messages; Action Bar rawtext for holders only.

## Does NOT own
What an ability does (cobweb cube in `trap.ts`/`cube.ts`; target search `L0-stgt`; volley `L0-sprj`), item JSON, recipes and lang strings (`L0-sitm`; the Web Sword JSON gains only `minecraft:allow_off_hand`), Shadow Blade itself.

## Key decisions
`L0-lgnd-ad01` frozen per-weapon prefixes · `ad02` loss recovery by generation · `ad03` transient loss watcher · `ad04` fall-through dispatch on "not ready" only · `ad05` busy is memory-only · `ad06` compatibility shims for shipped paths and command.

## Open items
- Parent-level: CTR-1 (`cool-ctr1`, Void return for Web Sword; running on `L0-lgnd-as01`), CTR-3 (`cool-ctr3`, off-hand priority; running on Q-019 default a). Not re-raised here.
- This dive: `L0-lgnd-cx01` (Ready display differs), `L0-lgnd-cx02` (non-player pickup leaves a stale melee-capable copy), `L0-lgnd-cx06` (loss watcher vs the letter of C-5).
- Withdrawn after checking: cx04 (no test asserts the `ws_pending` format, so "tests unchanged" and the array change do not collide), cx05 (`/andrew:websword` stays as an alias, so README remains correct). cx03 became assumption `L0-lgnd-as09`.

## Constraint-number crosswalk
Artifacts `L0-lgnd-*` written before this revision cite an older C-numbering. Read them as: old C-1 → **C-2** (stable API); old C-4 "no global scans" → **C-5**; old C-9 "translate keys" → **C-4**; old C-13 "bounded tick work" → **C-5** (second sentence); old C-6, C-7 unchanged. Old C-10 (shipped tests stay green), C-14 (volleys do not survive restart) and C-17 (one implementation per rule) have no entry in the current `concept-constraint`; they are carried as `L0-lgnd-ac11`, `L0-lgnd-r009` and `L0-lgnd-r001` respectively.

## Risk
Highest regression risk of the Stage-2 Scythe work: it rewrites code under a shipped weapon. Web Sword unit tests, the `andrew:websword_*` GameTests and the pickaxe suites must stay green (`L0-lgnd-ac11`).







### Miner's Pickaxe probe (Stage 1: item, recipe, dig speed, enchantability, auto-smelt) (L0-pick)

# Miner's Pickaxe probe (Stage 1: item, recipe, dig speed, enchantability, auto-smelt)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-infr"]`

**Responsibility:** One custom item, `andrew:miners_pickaxe`, that serves as the compatibility probe for the whole add-on stack (Behavior Pack + Resource Pack + stable `@minecraft/server` Script API) before Stage 2's PvP add-on is built. It proves a custom tool item can be crafted, enchanted, and given non-vanilla dig/drop behavior on the operator's actual installed Bedrock version, with nothing else in scope. [src: minerspickaxetestspec]

**Inputs:**
- Crafting-table recipe consuming 3× Iron Ingot, 2× Raw Gold, 2× Stick (see `L0-pick-r005`, `L0-pick-ent1`).
- `world.beforeEvents.playerBreakBlock` on any block, filtered to when the pickaxe is the held tool (`src/autosmelt.ts`).

**Outputs:**
- One `andrew:miners_pickaxe` item, visible in Creative (Equipment → pickaxe group) and via `/give`, RU+EN localized name.
- Diamond-pickaxe-speed breaking of any `is_pickaxe_item_destructible` block (`L0-pick-r001`).
- Pickaxe-slot enchantability without a durability component — infinite use by omission (`L0-pick-r002`).
- Auto-smelt: 7 ore/debris block ids drop their smelted product directly instead of the raw material (`L0-pick-r003`).

**Deliberately out of scope for Stage 1** (per raw spec, confirmed unchanged by the implementation): durability, Fortune multiplication of auto-smelt yield, Silk Touch override, exact parity with every diamond-pickaxe mining tag beyond the three representative tag families actually tested.

**Dependency:** gated behind Stage 0 (infrastructure) closing every criterion first — ai-kit rejects cross-epic dependencies, which is the enforcement mechanism, not a process rule anyone has to remember [src: concept-constraint C-11, `L0-infr`].

**Known open issue inherited from raw sources (not re-filed here):** contradiction CTR-4 already covers this component — the raw spec's compatibility target (`@minecraft/server` 2.9.0 / `min_engine_version` 1.26.0) is superseded by `decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001` (2.10.0 / [1,26,50]) and matches the live implementation. CTR-4 targets `L0-infr` and stays open only so nobody retargets back to 2.9.0 from the stale raw doc; no new filing needed from this component.

**Verification split** (inherited from parent, applies here): craft/digger/auto-smelt logic is proven on BDS in Docker; Creative placement, icon and RU/EN name rendering are proven only on iPad [src: concept-constraint C-6, C-9]. Both channels are green for Stage 1 — DEMO-S1, operator-accepted 2026-09-21 (see `decision-q-007-enchantable-without-durability-podtverzhde`).

**Evidence base for this deep-dive:** raw spec `minerspickaxetestspec` (`docs/Miners_Pickaxe_Test_Spec.docx`); live source `packs/behavior/items/miners_pickaxe.json`, `packs/behavior/recipes/miners_pickaxe.json`, `src/autosmelt.ts`; test coverage `src/gametest/main.ts` (`pickaxe_digs_at_diamond_speed`, `pickaxe_autosmelt`, `pickaxe_keeps_vanilla_drops`) and `src/selftest/main.ts` (`pickaxe-item-stack`, `pickaxe-enchantable`, `pickaxe-no-durability`).

**Children:** rules `L0-pick-r001`..`r005`; entities `L0-pick-ent1`, `ent2`; acceptance criteria `L0-pick-ac01`..`ac07`; glossary `L0-pick-gl01`..`gl05`; assumptions `L0-pick-asm1`..`asm3`; ADR `L0-pick-ad01`.







### Scythe of Calamity (`andrew:scythe_of_calamity`) (L0-scyt)

# Scythe of Calamity (`andrew:scythe_of_calamity`)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-sprj", "L0-sitm", "L0-infr", "L0-webs"]` · sources: `scytheofcalamityspecv1ruen-part-1`, `scytheofcalamityspecv1ruen-part-2` (docs/Scythe_of_Calamity_Spec_v1_RU_EN.docx).

**Status:** no code yet. Checked 2026-09-24: `src/` has only `websword/`, `autosmelt.ts` and the test harnesses, and nothing in `packs/` mentions the Scythe. This deep-dive seeds Stage-2 planning.

## Responsibility
This is the second legendary weapon. It is a PvP ability: on Use, the Scythe locks the **nearest visible player** within 20 blocks and fires **3 homing projectiles** that pass through blocks. Each hit deals **exactly 3 HP true damage** and launches the target about **10 blocks** up. The attack ends early if the target leaves a **20-block leash** centred on the launch point. The cooldown outcome depends on whether any hit landed. All temporary state is cleaned up.

## Sub-scopes (the live KV holds partial children under other prefixes)
| Sub-scope | Owner node | What it holds |
|---|---|---|
| Item JSON, recipe, melee, enchant slot, RP assets | `L0-sitm` (ADRs `sitm-adr1/2`, `sitm-asm3`) | slot = sword, no digger or tool tags |
| Activation + target acquisition | **this node** (`L0-scyt-p001`, `r001`–`r003`). The earlier `L0-stgt`/`L0-sctg` have no live artifacts. | candidate filter, tie-break, no-target path |
| Volley flight, hits, true damage, launch, leash, outcome FSM, tick loop | `L0-sprj` (`r005`–`r008`, `ad01`–`ad03`, `ac05`–`ac14`) | this node restates only the contract (`r004`–`r008`) |
| Craft gate, announcement, retention, Void return, cooldown store, HUD, hand priority | `L0-lgnd` | the Scythe registers a `LegendaryDef` |

## Inputs
- `world.afterEvents.itemUse` where `itemStack.typeId === "andrew:scythe_of_calamity"` and the source is a `Player` (`L0-scyt-ad03`). The event goes through the `L0-lgnd` dispatcher, which applies hand priority, busy and cooldown.
- The owner's location, view direction and dimension. The players in that dimension within 20 blocks (`L0-scyt-ad01`).
- The `isHiddenByShadowBlade(player)` predicate. It is a stub that returns `false` until Shadow Blade exists (ASM-024, CTR-014).

## Outputs
- Either a localized no-target message (`andrew.scythe_of_calamity.no_target`) with no cooldown and no busy state,
- or one **Volley** handed to `L0-sprj` (`launchVolley(owner, target, launchPoint)`), which returns exactly one outcome and possibly one `cooldown.start(owner, "scythe")` through `L0-lgnd`.
- Effects on the target only: health minus 3 per hit, and upward knockback.
- **Never**: block writes, engine projectile entities, or damage to mobs or other players.

## Key rules (this node)
`r001` candidate filter · `r002` nearest plus view-angle tie-break · `r003` no target means no cost · `r004` blocks untouched · `r005` exact 3 HP true damage · `r006` launch about 10 blocks, fall damage kept · `r007` leash centred on the launch point · `r008` only the locked target can be hit · `r009` item stats and recipe.

## Dependencies and ordering
1. `L0-lgnd` must first be generalised from `src/websword/*` into a registry. That includes per-weapon cooldown keys (CTR-013), the steady HUD in both hands (CTR-017) and busy (ASM-017). The Scythe cannot ship on the current Web-Sword-only store.
2. `L0-infr`: GameTest and BDS on 1.26.51.1 cover the ACs in channel `bds`. The icon, names and particle look are covered on channel `ipad` (C-9).
3. C-11: Stage 2 Web Sword is closed (commit `f22896a`), so Scythe work may start.

## Open issues affecting this component
- CTR-014 / Q-020: AC-3 (Shadow Blade) cannot be verified end to end.
- `cool-ctr2`: the enchant slot. Resolved in design by `L0-sitm-adr1` (sword).
- CTR-015: the hoe base versus the Use trigger. Resolved in design by `L0-sitm-adr2` (no hoe tag).
- `L0-sprj-cx01/cx02`: when the cooldown is committed, and the lethal branch of true damage.
- `L0-scyt-cx01`: missing component nodes and targeting nodes in the graph.
- `L0-scyt-cx02`: the tuning numbers for projectile speed and lifetime disagree.
- Q-022: does the `pvp` gamerule affect candidates? The default is no.

## Constraints honoured
C-2 (stable 2.10.0 only), C-4 (`andrew:` ids, RU and EN), C-5 (targeting only at activation, and a tick loop only while volleys exist), C-7 (no orphans), C-10 (no world mutation in before-events).







### Web Sword: Targeting & 3×3×3 Cobweb Trap (L0-webs)

---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-lgnd-ad06", "L0-lgnd-cx04", "L0-lgnd-p004", "L0-lgnd-ent1", "L0-sprj"]
---

# Web Sword: Targeting & 3×3×3 Cobweb Trap

**Responsibility.** This component owns only what is unique to the Web Sword as a weapon: its item/recipe identity, and its active-ability body — resolving a melee-reach target and stamping a 3×3×3 (27-cell) cobweb trap around it, skipping protected and unloaded cells. It is the Web Sword's counterpart to `L0-sprj` (Scythe's homing-projectile body): both are per-weapon "cast" implementations plugged into the shared `L0-lgnd` legendary framework.

**Explicitly NOT owned here** (see `L0-lgnd` instead): one-per-world craft gate + refund + first-craft broadcast (`L0-lgnd-p001`), death retention (`L0-lgnd-p002`), Void/lava/despawn loss return (`L0-lgnd-p003`), main/off-hand dispatch (`L0-lgnd-p004`), cooldown timer + busy flag + Action Bar HUD (`L0-lgnd-p005`, `L0-lgnd-ent3`), instance marking/anti-dup (`L0-lgnd-ent2`), operator commands (`L0-lgnd-p007`), localization plumbing. Raw spec §§3,4,8,9,10,14 (one-per-world, death retention, cooldown UI, multiplayer determinism, localization, DoD) are all satisfied by the shared framework already deep-dived as `L0-lgnd`; a scope-overlap contradiction (`L0-webs-cx01`) documents this so the two aren't independently re-implemented or re-decided.

**Inputs.** A ready, dispatched cast from `L0-lgnd-p004` (`onCast(player)`), the player's current melee-interaction ray/reach, and world block/entity state around the resolved target.

**Outputs.** Up to 27 placed `minecraft:web` blocks; a filled-cell count; the ability wrapper starts the cooldown itself on `filled > 0` and returns `"cast"`/`"refused"` to `L0-lgnd` (`L0-webs-r005`, `L0-adr-cast`).

**Core flow** (detail in `L0-webs-p001`): resolve target cell (block-face-adjacent or entity-foot, entity wins ties, no hit ⇒ no target) → enumerate the 27-cell cube centered there → classify each cell (fillable / protected / unloaded / entity-occupied) → replace fillable cells with cobweb → report count.

**Item identity** (`L0-webs-ent1`, `L0-webs-r001`): Diamond-Sword-equivalent melee damage, infinite durability, `minecraft:enchantable` slot `sword`, shaped recipe (4× Cobweb + 1× Diamond Sword, any durability/enchantment, none carried over). This is currently documented only in the rollup decision `web-sword-item-values`; this component gives it a durable home.

**Why this scope now.** `L0-lgnd`'s migration (`ADR-021`, `L0-lgnd-ad06`) explicitly stopped short of the cast body: `L0-lgnd-cx04` notes the shipped `registerTrap()` (in `src/websword/trap.ts`, called from `src/gametest/main.ts`) "no longer subscribes to `itemUse` itself" under the new framework — i.e. `registerTrap`/the trap module is exactly this component's code counterpart, and it never received its own deep-dive. Decisions Q-011 (cube geometry), Q-013 (protected-block list) and Q-017 (zero-cells outcome) already resolved the hard questions operator-side; this deep-dive gives them rule/process/entity homes and adds the acceptance criteria, glossary and assumptions the rollups don't carry.

**NFRs.** Server-authoritative, deterministic across clients (spec §9); no permanent per-tick world scan (spec §11, project C-4/C-5) — target resolution and cube fill are one-shot, triggered only by a cast; never write into unloaded/inaccessible chunks (spec §6/§12).







## Architecture Decisions

### ADR-L0-cast · One ability-handler contract for every legendary weapon (L0-adr-cast)

---
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-webs", "L0-scyt", "L0-lgnd-r001", "L0-lgnd-r003", "L0-lgnd-r007", "L0-lgnd-p004", "L0-webs-r005", "L0-webs-ad02", "L0-scyt-ad03", "L0-scyt-r003", "L0-sprj-ad01", "L0-xcx1", "L0-xcx2"]
requires: ["L0-lgnd"]
status: accepted
---
# ADR-L0-cast · One ability-handler contract for every legendary weapon

**Context.** After the deep-dive, the three children describe the boundary between framework and weapon in three different ways:
- `L0-lgnd` (`r001`, `r003`, `p004`): the handler is `(player, hand) → "cast" | "refused" | "busy"`, and **only the ability owner** calls `cooldown.start`. The dispatcher alone subscribes to `itemUse` and `playerInteractWithBlock`. No weapon calls `setActionBar`.
- `L0-webs` (`r005`, `ad02`): the callback returns `{filled}`, and "`L0-lgnd` decides whether to start the cooldown". → `L0-xcx1`.
- `L0-scyt` (`ad03`, `r003`): "listens to `afterEvents.itemUse` alone" and shows its no-target text through a `hud.hold` that the `lgnd` contract does not publish. → `L0-xcx2`.

**Decision.**
1. **The handler contract is `lgnd`'s.** Each weapon registers `ability(player, hand): "cast" | "refused" | "busy"`. The weapon calls `cooldown.start(player, key)` itself, and only on success:
   - Web Sword: when `filled > 0`.
   - Scythe: at the first hit and again at resolution (`L0-sprj-ad01`).

   The framework never infers success. The Web Sword's pure `resolveAndPlaceTrap → {filled}` stays as an internal function inside the Web Sword handler.
2. **Trigger events belong to the dispatcher.** `L0-lgnd-p004` subscribes to both events and de-duplicates them for every weapon. `L0-scyt-ad03` reads as *"the Scythe ability ignores block context"*. It does not mean the Scythe keeps its own subscription. Its GameTest (one press on a block → one activation) still applies, now against the dispatcher.
3. **Transient messages are added to the published contract:** `hud.notify(player, translateKey, holdMs ≈ 2000)`.
   - Only the HUD module writes it.
   - The steady HUD pass skips a player whose hold has not expired.
   - It covers the Web Sword's no-room and no-target texts (`L0-webs-r005`) and the Scythe's `no_target` (`L0-scyt-r003`, CTR-017).

   Weapons still never call `setActionBar` (`L0-lgnd-r001`, `r007`).
4. **Item JSON ownership.** The Web Sword's `minecraft:allow_off_hand` change belongs to `L0-webs` (item identity, `L0-webs-r001`). The Scythe's belongs to `L0-sitm`. This corrects the wording in `L0-lgnd-r004`.

**Consequences.** One rule, one owner: C-17 in `lgnd`'s crosswalk, carried as `L0-lgnd-r001`. `L0-webs-r005`, `L0-webs-ad02` and the `L0-webs` component text were reconciled in place during reduce to point here. `hud.notify` must be part of the `lgnd` generalisation task, before either weapon migrates.







### ADR-L0-lgnd · L0 rulings on the framework's open contradictions (L0-adr-lgnd)

---
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-webs", "L0-scyt", "L0-sprj", "L0-infr", "L0-lgnd-cx02", "L0-lgnd-cx03", "L0-lgnd-cx04", "L0-lgnd-cx06", "L0-lgnd-ad02", "L0-lgnd-ad03", "L0-lgnd-ad06", "L0-lgnd-ac11", "L0-lgnd-as03", "L0-xasm1", "cool-ctr1"]
status: accepted
---
# ADR-L0-lgnd · L0 rulings on the framework's open contradictions

These contradictions were filed inside `L0-lgnd`. Each one needs an L0 reading because it changes a global constraint, a global assumption or a shipped weapon.

| Child item | L0 ruling | Why it is L0's call |
|---|---|---|
| `L0-lgnd-cx02`: a stale copy after a hopper or allay pickup | **(a) Accept.** A stale generation cannot cast. It is deleted on its first `playerInventoryItemChange` in any player inventory (`L0-lgnd-r005`). No heuristic proximity query is added. | C-7 is about *usable* duplicates. A melee-only stale copy that disappears on first player contact does not break it. The heuristic (b) would add a local query on every removal (C-5), and (c) would undo the CTR-1 default. |
| `L0-lgnd-cx03`: `hidden_until` in ticks | **Epoch ms.** ASM-020 is amended by `L0-xasm1`. | The same clock problem affects the cooldown store, which `webs` ships and `scyt` will use. |
| `L0-lgnd-cx04`: "tests unchanged" | ADR-021 reads as **"no edits to assertions"**. Harness wiring in `src/gametest/main.ts` (calling `registerLegendaryFramework()` in place of the self-subscribing `registerTrap()`) is allowed. `L0-lgnd-ac11` is the gate. | The GameTest harness belongs to `L0-infr`. The code it calls belongs to `L0-webs`. |
| `L0-lgnd-cx06`: the loss watcher vs C-5 | **The wording of C-5 is widened:** *"short-lived tick loops are allowed only while temporary objects exist: Scythe volleys, or marked legendary item entities on the ground. Each such loop iterates only those objects."* Before `L0-lgnd-ad03` ships, `L0-lgnd-as03` must be measured on BDS 1.26.51.1. If `beforeEvents.entityRemove` reliably fires on a Void kill, the watcher is dropped. | C-5 is an L0 constraint. `webs` and `scyt` also cite it. |

**Not re-ruled here:** CTR-1 (Void/lava return for the Web Sword) and CTR-3 (off-hand priority). Both stay open at L0 and run on their autopilot defaults (Q-020 a, Q-019 a), which `lgnd` implements. The operator may still reverse them at DEMO acceptance.

**Consequences.**
- `lgnd-cx02`, `cx03`, `cx04` and `cx06` are resolved by this ADR. `cx05` is resolved by `L0-adr-scope` §5.
- `lgnd-cx01` is escalated separately (`L0-xcx3`), because it needs the client.
- The `lgnd` generalisation task gets one extra acceptance step: the BDS probe for `as03`.







### ADR-L0-scope · Final component scopes after the deep-dive (L0-adr-scope)

---
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-webs", "L0-lgnd", "L0-scyt", "L0-sitm", "L0-sprj", "L0-stgt", "L0-webs-cx01", "L0-scyt-cx01", "L0-sprj-cx03", "L0-lgnd-cx05"]
status: accepted
---
# ADR-L0-scope · Final component scopes after the deep-dive

**Context.** Two children found that their scope overlapped a sibling's, or that part of the graph was missing:
- `L0-webs-cx01`: `webs` overlaps `lgnd`.
- `L0-scyt-cx01`: `sitm` and `sprj` have no component nodes, and no targeting node exists.

Both did the sensible interim thing and scoped themselves down, or acted as the umbrella. `L0-sprj-cx03` adds that stale rollup ids (`L0-scpr`, `L0-sctg`, `L0-scit`) collide with the current numbering.

**Decision.**
1. **L0 has exactly five components:** `infr`, `pick`, `lgnd`, `webs`, `scyt`.
2. **`L0-webs`** is scoped to the Web Sword's cast body (targeting, the 27-cell cube, the protected/unloaded filter, the outcome report) plus the **static** item/recipe definition. Craft gate, retention, loss return, cooldown/busy, dispatch, HUD, commands and localization plumbing belong to `L0-lgnd`. `webs` references them by id and does not restate them. This resolves `L0-webs-cx01`.
3. **`L0-scyt`** is the umbrella for the Scythe:
   - `L0-sitm` (item JSON, recipe, enchant slot, assets) and `L0-sprj` (volley engine) are its **sub-scopes**. Logically they are `part_of L0-scyt`. Their node ids are kept so their links stay valid.
   - Targeting belongs to `L0-scyt` (`p001`, `r001`–`r003`, `ac01`–`ac04`). `L0-stgt` is **not** reopened, and references to `L0-stgt` in `lgnd`/`sprj` read as `L0-scyt-p001`.

   This resolves `L0-scyt-cx01` and item 2 of `L0-sprj-cx03`.
4. **Rollups.** `project-knowledge/*.md` are regenerated from the live KV after this run commits. The `L0-scpr`/`L0-sctg`/`L0-scit` text and their ADR/C/ASM numbering are retired. When an id means one thing in a rollup and another in a live artifact, the **live** artifact wins. This covers item 1 of `L0-sprj-cx03`. Whether the regeneration happened can be checked after commit. It is not claimed here.
5. **Operator command.** `/andrew:legendary <id> …` is the framework command. `/andrew:websword` stays as a permanent alias, so README, Q-006, Q-008 and Q-014 remain correct. This closes `L0-lgnd-cx05`, which the child had already withdrawn.

**Consequences.** Future deep-dives use the five slugs above. Each shared legendary concern has one owner (`lgnd`), and each weapon keeps only what is unique to it.







### ADR-L0-scyt · Scythe tuning, when its cooldown is committed, and Stage-2 ordering (L0-adr-scyt)

---
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-scyt", "L0-sprj", "L0-lgnd", "L0-infr", "L0-sitm", "L0-scyt-cx02", "L0-sprj-ad02", "L0-sprj-ad01", "L0-sprj-cx01", "L0-lgnd-r009", "L0-lgnd-r003", "cool-asm5"]
requires: ["L0-lgnd", "L0-infr"]
status: accepted
---
# ADR-L0-scyt · Scythe tuning, when its cooldown is committed, and Stage-2 ordering

**1. Projectile tuning (`L0-scyt-cx02`).**
- Follow the live `L0-sprj-ad02`: **0.5 block/tick, pure pursuit, no turn limit**.
- Where `sprj` says nothing, adopt from the retired rollup design: a hit radius of 1.0, a 5-tick stagger and a 200-tick lifetime.
- Keep every value in one exported `SCYTHE_TUNING` constant, and have the GameTest timing windows read them from there.
- ASM-018 is kept. The rollup's ASM-029 (0.6 plus a turn limit) is retired together with `L0-scpr` (`L0-adr-scope` §4). This agrees with L0's `cool-asm5` (finite lifetime, staggered launch).

**2. Cooldown commit (`L0-sprj-cx01`).** Accept `L0-sprj-ad01` as an amendment to ADR-025: commit at the first hit and re-stamp at resolution. It is checked against the framework:
- `L0-lgnd-r003`: the ability owner calls `start`. ✔
- `L0-lgnd-r009`: busy wins over cooldown while the volley flies, and at resolution busy clears and `start` runs in one turn. ✔ The early write is invisible because busy hides it.
- `cooldown.start` must be an idempotent overwrite. `lgnd` guarantees that.

**3. Ordering, as the reduce invariant requires.** The Scythe **depends on the `lgnd` generalisation**. Today the framework is specific to the Web Sword: one cooldown slot per player, one pending mark, main hand only, `ws_*` ids hard-coded, and no busy or `hud.notify`. The Stage-2 Scythe plan is:
1. `lgnd` generalisation + Web Sword migration (`L0-lgnd-p006`, gate `L0-lgnd-ac11`), including `hud.notify` (`L0-adr-cast`) and the `as03` probe (`L0-adr-lgnd`).
2. `L0-sitm` item/recipe/assets, including the Scythe's `allow_off_hand`.
3. `L0-scyt` targeting (`p001`) on `isHiddenFromTargeting`.
4. The `L0-sprj` volley engine.
5. DEMO: GameTest on the `bds` channel through `L0-infr`, then the iPad pass.

C-11 is met: the Web Sword part of Stage 2 closed at `f22896a`. Steps 2–4 cannot be merged before step 1.

**Not resolved here:** `L0-sprj-cx02` (the lethal branch under Resistance V). It keeps its interim option (a) as a documented exception to C-15, and it does not block.







