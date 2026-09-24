---
title: Business Rules
type: project-knowledge
generated_at: "2026-09-24T19:42:02.840Z"
source_channel: rollout
node_id: rollout-business-rules
aliases: ["rollout-business-rules","business-rules","project-knowledge/business-rules"]
is_a: ["rollout","business-rules"]
relates_to: ["L0","L0-infr-r001","L0-infr-r002","L0-infr-r003","L0-infr-r004","L0-infr-r005","L0-lgnd-r001","L0-lgnd-r002","L0-lgnd-r003","L0-lgnd-r004","L0-lgnd-r005","L0-lgnd-r006","L0-lgnd-r007","L0-lgnd-r008","L0-lgnd-r009","L0-lgnd-r010","L0-lgnd-r011","L0-pick-r001","L0-pick-r002","L0-pick-r003","L0-pick-r004","L0-pick-r005","L0-scyt-r001","L0-scyt-r002","L0-scyt-r003","L0-scyt-r004","L0-scyt-r005","L0-scyt-r006","L0-scyt-r007","L0-scyt-r008","L0-scyt-r009","L0-sprj-r005","L0-sprj-r006","L0-sprj-r007","L0-sprj-r008","L0-webs-r001","L0-webs-r002","L0-webs-r003","L0-webs-r004","L0-webs-r005"]
priority: 520
---

# Business Rules

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Global Constraints (L0)

# Global Constraints

| ID | Constraint | Source |
|---|---|---|
| C-1 | Bedrock Edition only; target device iPad (App Store Minecraft). | stage-0 |
| C-2 | Stable `@minecraft/server` only, pinned 2.10.0; `min_engine_version` [1,26,50]; BDS 1.26.51.1; single source of truth `scripts/targets.mjs`. | stage-0, pickaxe spec, constraints.md |
| C-3 | On a dependency/format error: retarget using the exact error text, never switch to Beta/Preview. | pickaxe spec |
| C-4 | All custom identifiers under `andrew:`; every item and message has `en_US` + `ru_RU` via resource-pack `.lang` (no hard-coded single language in scripts). | constraints.md, web sword §10 |
| C-5 | Ability logic runs server-side; no permanent global per-tick world scans. Short-lived tick loops allowed only while temporary objects (Scythe projectiles) exist. | web sword §11, scythe §7 |
| C-6 | One-per-world craft state lives in durable world-level storage surviving restart; concurrent crafts must not bypass it. | web sword §3, §9, §11 |
| C-7 | No duplication via craft, death, disconnect/reconnect, restart; no orphaned temporary entities on target death/logout/dimension change. | web sword §14, scythe §7, §9 |
| C-8 | Reproducible build from a clean clone with one command; no manual packaging, no machine-specific paths. | stage-0 |
| C-9 | Verification split: BDS proves loading/scripts; iPad alone proves rendering, icons, Creative placement, names; Survival world for drop behaviour. | constraints.md |
| C-10 | Before-events never mutate the world synchronously (defer via `system.run`); TS `strict`, no `any`. | constraints.md |
| C-11 | Stage gating: Stage N+1 work starts only after Stage N criteria close. | stage-0, constraints.md |
| C-12 | Performance/safety: 3×3×3 placement must skip protected cells and unloaded chunks; must be safe on a dedicated multiplayer server. | web sword §6, §11–12 |




- **node**: L0

### Rule: version targets live in one place, and drift is fixed by retargeting, never by loosening the API channel (L0-infr-r001)

# Rule: version targets live in one place, and drift is fixed by retargeting, never by loosening the API channel

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

`scripts/targets.mjs` is the sole source for three constants: `MIN_ENGINE_VERSION = [1,26,50]`, `SERVER_API_VERSION = '2.10.0'`, `BDS_VERSION = '1.26.51.1'`. Every manifest, `docker/bds/compose.yaml`'s `VERSION`, and the README must agree with it; nothing else may hardcode these as literals [C-2, C-3]. `validate.mjs` and `bds-gametest.mjs` both import from `targets.mjs` directly rather than duplicating the values. `assertComposePinsVersion()` (run at the top of both `bds:check` and `bds:up`) fails the run immediately if `compose.yaml`'s `VERSION` env drifts from `BDS_VERSION`.

**On a version/dependency error** from the game or BDS (`Unsupported version`, `Missing dependency: @minecraft/server …`, `Pack format version mismatch`): read the error text, update the one matching constant in `targets.mjs`, then `npm ci && npm run build` and re-check. **Never** enable a `-beta`/`-preview`/`-rc` module or an experiments toggle to make the error disappear — that hides a real incompatibility instead of fixing it [C-3; README §7].

**Rationale for centralizing**: hand-syncing the version across every manifest was missed twice on 2026-09-20 (`set-version.mjs` header comment) — the fix was a script (`npm run version:set -- <x.y.z>`) that rewrites `package.json`, `package-lock.json`, and every `packs/*/manifest.json` header/module/dependency version in one pass, because the iPad treats same-uuid + same-version as "already imported" and needs a bump on every content change.




- **node**: L0-infr-r001

### Rule: verification is split across three channels, and only two of them are automatic (L0-infr-r002)

# Rule: verification is split across three channels, and only two of them are automatic

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

- **build** — `tsc --noEmit` (types) + `npm run validate` (manifest/JSON structure). Mac-only, no Docker.
- **bds** — `npm run bds:check` / `npm run bds:gametest`. Proves pack loading, manifest/dependency errors, and script/gameplay execution from a Bedrock Dedicated Server log or in-engine GameTest assertions.
- **ipad** — human-eyes-only: rendering, icon, Creative-inventory placement, RU/EN names. **A green `bds` run never closes an `ipad` criterion** [C-6] — the engine-log analysis in `bds:check` can prove the resource pack was *accepted*, but not that it *renders* correctly.

Per `decision-verification-approach-automatic` (full autopilot, 2026-09-20): `build` and `bds` criteria are typed `build`/`unit`/`e2e` and closed automatically by `/verify` from run-check artifacts, no operator involved when green. `ipad` criteria are typed `manual`, are planned minimally, and **do not block merge/autopilot** — they stay open until an operator confirms them (`task_accept` / board button). Auto-smelt specifically must be verified in a **Survival** world; Creative suppresses drops [C-9], so `bds:up` always starts Survival+cheats while `bds:check` stays Creative.




- **node**: L0-infr-r002

### Rule: `npm run build` must succeed from a clean clone; fixed file layout and ownership (L0-infr-r003)

# Rule: `npm run build` must succeed from a clean clone; fixed file layout and ownership

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

No manual packaging steps, no machine-specific paths [C-7] — `scripts/build-clean-clone.sh` exists to prove this in isolation, separate from the everyday `npm run build`.

Fixed layout:
- `src/` — TS sources, single entry `src/main.ts` (+ `src/selftest/main.ts` for the dev-only self-check).
- `packs/behavior/`, `packs/resource/` — shipped packs; `packs/behavior/scripts/` is **build output**, gitignored, never hand-edited.
- `packs/selftest/`, `packs/gametest/` — dev-only, never shipped (see L0-infr-r004, L0-infr-r005).
- `scripts/*.mjs` — build/validate/BDS tooling; `tests/` — `node:test`; `docker/bds/` — the dedicated server; `dist/` — `andrew.mcaddon` + check logs, gitignored.

File ownership (who may write which file, from `constraints.md`):
- `packs/behavior/manifest.json`, `packs/resource/manifest.json` — only PACK-01; uuids are constant, never regenerated at build.
- `package.json` — created by INFRA-01; later tasks (BUILD-01, BDS-01) only add scripts, never rewrite ownership.
- `.env*` / secrets — none expected in this project; never committed.




- **node**: L0-infr-r003

### Rule: the selftest pack proves content from inside the engine but never ships (L0-infr-r004)

# Rule: the selftest pack proves content from inside the engine but never ships

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

`packs/selftest` is a dev-only behavior pack, bundled by `npm run build` (`bundleSelfTest()`) but deliberately **excluded** from `dist/andrew.mcaddon` — only `bds-check.mjs` installs it, straight from the working tree, alongside the release packs. `tests/selftest-pack.test.mjs` asserts the archive's two directory names explicitly, so the selftest pack cannot leak into a release by accident.

It runs inside the engine at world load and prints its own verdict lines (`[selftest] PASS/FAIL …`, terminated by `[selftest] DONE passed=N failed=M`) to the BDS log, which `analyzeLog()` reads as ground truth *independent of* the log-scraping heuristics used for the release script. `--break-selftest` rebundles it with a deliberately-failing fixture (`__SELFTEST_FIXTURE__` esbuild `--define`) for negative testing of the check itself, then unconditionally rebundles clean afterward — so a `--no-build` run right after never inherits the sabotaged bundle.




- **node**: L0-infr-r004

### Rule: GameTest and the Beta APIs experiment never reach the release build (L0-infr-r005)

# Rule: GameTest and the Beta APIs experiment never reach the release build

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

`@minecraft/server-gametest` has no stable channel — using it requires the "Beta APIs" experiment on the world. The release product must stay on stable `@minecraft/server` 2.10.0 with no experimental toggles in any manifest [C-2]. Enforced structurally:
- `packs/gametest` is a devDependency-only pack, never zipped into `dist/andrew.mcaddon`.
- The experiment is enabled only in a separate world (`LEVEL_NAME=gametest`, superflat `LEVEL_TYPE=FLAT`), never in the everyday `andrew` world that `bds:check`/`bds:up` use.
- The two worlds are driven by the same `compose.yaml` via `BDS_LEVEL_NAME`/`BDS_LEVEL_TYPE`/`BDS_GAMEMODE` env overrides, not by separate compose files, so the version pin (`assertComposePinsVersion`) and port/image config stay single-sourced.




- **node**: L0-infr-r005

### Lgnd r001 concept rule (L0-lgnd-r001)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent1", "L0-stgt", "L0-sprj"]
---
**R-lgnd-001: One implementation per general rule (C-17, ADR-021).**

The craft gate, instance mark, death retention, loss return, cooldown/busy storage, Use dispatch, HUD and the hidden predicate live only in `src/legendary/`.

A weapon module (`src/websword/trap.ts`, `src/scythe/*`) **may**:
- call `registerLegendary(def)`;
- call `isReady / isBusy / setBusy / start / remaining` and `isHiddenFromTargeting`;
- implement its `ability`.

It **may not**:
- subscribe to `itemUse`, `playerInteractWithBlock`, `entityDie`, `playerSpawn`, `playerInventoryItemChange` or `entityRemove` for its own item;
- read or write any `andrew:<prefix>_*` or `andrew:hidden_until` property;
- call `setActionBar`.

**Check:** `grep -rnE "andrew:(ws|sc)_|andrew:hidden_until" src/` matches only `src/legendary/state.ts`. This extends the guard stated in the shipped `state.ts` header.




- **node**: L0-lgnd-r001

### Lgnd r002 concept rule (L0-lgnd-r002)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p001", "L0-lgnd-p007"]
---
**R-lgnd-002: Independent one-per-world craft budget per weapon.**

Source: Scythe §1 (*«один успешный Survival-крафт на мир, сохранение флага после рестарта, глобальное сообщение при первом крафте … Creative и /give … без расходования Survival-флага»*); Web Sword §3; Q-006, Q-008.

- Each registered weapon has its own world flag `andrew:<p>_crafted`. A Scythe craft never reads, consumes or resets the Web Sword budget, and vice versa.
- Only a Survival/Adventure craft of an unmarked result claims the flag. Creative/Spectator results stay unmarked and are ignored. Admin `give` never touches the flag.
- The flag survives logout, save and restart (C-6). Only `reset <weapon>` clears it.
- The broadcast fires exactly once per weapon per world, on the claiming craft.
- A blocked craft is refunded with that weapon's `refundIngredients` and a private message. No result stack remains.




- **node**: L0-lgnd-r002

### Lgnd r003 concept rule (L0-lgnd-r003)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent3"]
---
**R-lgnd-003: Cooldowns are isolated per (player, abilityKey).**

Source: Scythe §6 (the priority rule presupposes independent cooldowns); ADR-007/ADR-017; Q-009.

- Starting the Scythe cooldown leaves the Web Sword's readiness unchanged, and vice versa. The shipped single slot (where `startCooldown` ignores `_abilityKey`) is replaced by one key per weapon.
- A cooldown belongs to the player, not the stack. Handing the weapon to someone else does not hand over its cooldown.
- The length is `def.cooldownMs`: exactly 30 s for both weapons, measured on `Date.now()`, and it survives reconnect and restart.
- Only the ability owner arms a cooldown. The framework never starts one, neither on dispatch nor on refusal.




- **node**: L0-lgnd-r003

### Lgnd r004 concept rule (L0-lgnd-r004)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p004", "L0-lgnd-as07", "L0-lgnd-as08"]
---
**R-lgnd-004: Hand priority.**

Source: Scythe §6 and Web Sword §8 (*«готовая способность main hand имеет приоритет; если main-hand способность на cooldown, может сработать готовая off-hand способность»*). Q-019 default (a).

- At most one ability runs per Use press.
- A ready main-hand legendary fires **even if it then refuses** (no target, no room). A refusal does not fall through.
- If the main-hand legendary is not ready (cooldown **or busy**, `L0-lgnd-as08`), a ready off-hand legendary with a *different* ability key fires.
- Both not ready → nothing happens and no state changes.
- The off hand can only be triggered through a main-hand legendary press (engine limit, `L0-lgnd-as07`). An empty or non-legendary main hand never casts the off-hand weapon.
- Both items declare `minecraft:allow_off_hand: true`. The JSON change is owned by `L0-webs` (Web Sword) and `L0-sitm` (Scythe), per `L0-adr-cast` §4.




- **node**: L0-lgnd-r004

### Lgnd r005 concept rule (L0-lgnd-r005)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent2", "L0-lgnd-ent4", "L0-lgnd-p003", "L0-lgnd-ad02"]
---
**R-lgnd-005: At most one live generation per instance.**

Source: C-7 (now including Void return). Every return path is a duplication primitive unless the returned copy supersedes the lost one.

- A marked stack is live iff its `gen` equals the ledger generation for its `(prefix, id)`.
- Re-issuing a lost instance bumps the generation **before** the new stack exists, in the same synchronous turn.
- A stale stack:
  - cannot cast (the dispatcher treats it as absent);
  - is deleted on death, not retained;
  - is not watched or returned;
  - is deleted on the first `playerInventoryItemChange` that shows it in any player's inventory, with a private `voided` message.
- Nothing lowers a generation. `reset` does not touch generations.

**Consequence:** a mis-classified "lost" copy may still exist physically (for example in a hopper chest), but it can never be a second usable legendary.




- **node**: L0-lgnd-r005

### Lgnd r006 concept rule (L0-lgnd-r006)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad01", "L0-lgnd-p006"]
---
**R-lgnd-006: Shipped Web Sword storage is frozen and read as-is.**

Source: ADR-021 (Web Sword storage keys are kept), C-10.

- The Web Sword prefix is `ws` forever. It derives exactly the 0.3.0 names: `andrew:ws_crafted`, `ws_crafted_by`, `ws_pending`, `ws_cooldown_until`, `ws_origin`, `ws_owner`, `ws_id`, `ws_owner_name`.
- 0.3.0 formats must parse:
  - `ws_pending` holding a single serialised mark → a one-element array;
  - a stack without `ws_gen` → gen 0;
  - a stack without `ws_holder` → holder = `ws_owner`;
  - a small tick-era `ws_cooldown_until` → expired.
- New fields are additive. The framework never deletes or renames a key the shipped version wrote.
- After the upgrade, a 0.3.0 world where the sword was crafted still refunds a new craft, and a sword cooling at shutdown is still cooling.




- **node**: L0-lgnd-r006

### Lgnd r007 concept rule (L0-lgnd-r007)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p005", "L0-lgnd-cx01", "L0-sitm"]
---
**R-lgnd-007: One HUD, holders only, both hands, translate keys only.**

Source: Scythe §6 (*«в основной или второй руке показывать состояние … Ready / remaining time»*); Web Sword §8; C-9; ADR-021 (a single actionbar HUD).

- Exactly one module writes the Action Bar for legendaries. `L0-stgt`/`L0-sprj` supply state through `setBusy`/`start` and never call `setActionBar`.
- The bar is written only for players holding a legendary in either hand. Everyone else's bar is untouched, not even cleared.
- Order is main hand first, then off hand. Remaining time is shown in whole seconds, rounded up, and never 0 while cooling.
- All text is rawtext `translate`. The keys are owned by `L0-sitm` (Scythe) and the shipped lang files (Web Sword).
- This is the add-on's only standing interval (10 ticks). The loss watcher (`L0-lgnd-ad03`) and volley loops (ADR-025) are transient.




- **node**: L0-lgnd-r007

### Lgnd r008 concept rule (L0-lgnd-r008)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p002", "L0-lgnd-ent4"]
---
**R-lgnd-008: Death retention returns every live legendary, exactly once.**

Source: Scythe §1 (*«сохранение при смерти»* as a general rule); Web Sword §4, §12; Q-016 (unlootable).

The shipped code holds **one** `ws_pending` per player, and `findMarkedSword` returns only the **first** marked sword. With two weapons, admin copies and an off hand, that loses items.

- A player who dies carrying N live legendaries (any mix of weapons and admin copies, in any slot including the off hand) gets back each of them after respawn.
- Pending is per weapon and holds an array of marks.
- Restore is idempotent per `(id, gen)`. A repeated spawn/join, a reconnect or a restart grants nothing extra.
- No live legendary item entity remains at the death spot. Another player can never pick one up (Q-016).
- Unmarked copies follow vanilla death drops.




- **node**: L0-lgnd-r008

### Lgnd r009 concept rule (L0-lgnd-r009)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent3", "L0-lgnd-ad05", "L0-sprj", "L0-stgt"]
---
**R-lgnd-009: Busy semantics.**

Source: ASM-017, ADR-025, and the decomposition-plan contract `cooldown.{isReady, isBusy, setBusy, start, remaining}`.

- `busy` means a multi-tick activation of that ability is in progress (a Scythe volley). While busy, `isReady` is false, a second Use of that weapon does nothing and says nothing, and the HUD shows `active`.
- busy and cooldown are independent:
  - A volley ending with 0 hits clears busy and does **not** start a cooldown (Scythe §5).
  - A volley ending with ≥ 1 hit clears busy **and** starts the cooldown in one turn, so no tick sees `isReady` true.
- busy is memory-only. It is false after a restart and cleared when the owner leaves. It is never persisted, so it can never strand an ability in "active".
- The Web Sword never sets busy. Its behaviour is unchanged.




- **node**: L0-lgnd-r009

### Lgnd r010 concept rule (L0-lgnd-r010)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-stgt", "L0-sqat", "L0-lgnd-cx03", "L0-lgnd-p007"]
---
**R-lgnd-010: `isHiddenFromTargeting(player)` contract.**

Source: ASM-020; the boundary (Shadow Blade is out of scope, only a read-only predicate); CTR-014; Q-022.

- Signature: `isHiddenFromTargeting(player: Player): boolean`. Pure read, no side effects, safe to call per candidate during a target search.
- Backing store: player dynamic property `andrew:hidden_until`, a number. Hidden iff it is a number **and** greater than `Date.now()`, i.e. epoch ms (see `L0-lgnd-cx03` for why not ticks).
- Absent, non-number or expired → `false`. With no Shadow Blade in the world it always returns false, as the boundary requires.
- Writers: today only `/andrew:hide` and GameTest. Tomorrow, Shadow Blade. No v3 weapon module writes it.
- The key is unprefixed on purpose: it is a cross-weapon contract, not Shadow Blade's private state. If Shadow Blade arrives with a different model (a tag or an effect), only this adapter changes (ASM-020 impact).




- **node**: L0-lgnd-r010

### Lgnd r011 concept rule (L0-lgnd-r011)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r002"]
---
**R-lgnd-011: Returning an item never reopens the craft right.**

Source: Q-014 (destroying the only sword does not give back the craft right), refined by Q-020 default (a): *returning the item ≠ reopening the craft right*.

- Loss return (`L0-lgnd-p003`) and death retention (`L0-lgnd-p002`) never write `andrew:<p>_crafted`.
- An instance that is not returned (for example removed by `/clear` or `/kill`, which are operator actions and not "ordinary means") leaves the budget spent. The operator remedy stays `reset <weapon>`.
- This applies to the Web Sword too. It changes shipped behaviour (lava and the Void used to destroy the sword for good), under Q-020 (a).




- **node**: L0-lgnd-r011

### Pick r001 concept rule (L0-pick-r001)

**Rule R1 — Dig speed must be verified against a live vanilla diamond pickaxe, not assumed from the tag query alone.**

`minecraft:digger` on `andrew:miners_pickaxe` has exactly one `destroy_speeds` entry: `query.any_tag('minecraft:is_pickaxe_item_destructible')` → speed 8, `use_efficiency: true`. Bedrock's tag-query digger has **no engine-level tier fallback** — a block the query misses does not fall back to a lower pickaxe tier, it falls back to speed 1 (bare hand). The shipped 0.3.0 build hit exactly this: copper ore took 302 ticks (15.1s) instead of a diamond pickaxe's 0.65s, and ancient debris never broke at all within the test limit.

**Enforcement:** `pickaxe_digs_at_diamond_speed` (GameTest) breaks three representative blocks — one per distinct tag family actually present in the live block data (`copper_ore`: `stone_pick_diggable`-family only; `deepslate`: `is_pickaxe_item_destructible` only; `ancient_debris`: `diamond_tier_destructible` only) — with the pickaxe and, in the same run, with a real `minecraft:diamond_pickaxe`, and asserts the pickaxe finishes within `SPEED_TOLERANCE_TICKS` (4) of vanilla and within `BREAK_LIMIT_TICKS` (300). Self-calibrating: no hardcoded tick counts that drift when Mojang retunes hardness.

**Rationale:** any future edit to `destroy_speeds` (narrowing the tag query, or adding a second entry) must keep covering all three tag families or this exact bug regresses silently. [src: `packs/behavior/items/miners_pickaxe.json`; `src/gametest/main.ts` L864-962] [see also: `L0-pick-ad01`]




- **node**: L0-pick-r001

### Pick r002 concept rule (L0-pick-r002)

**Rule R2 — Pickaxe-slot enchantability without a durability component.**

`andrew:miners_pickaxe` declares `minecraft:enchantable` with `slot: "pickaxe"`, `value: 10`, and declares **no** `minecraft:durability` component at all (not "very high durability" — the component is absent). This is the Stage 1 prototype's chosen way to get "infinite durability": omission, not a huge number.

Confirmed empirically on the actual target engine, not just declared in JSON: `SELFTEST-01-AA` (in-engine self-test on BDS 1.26.51.1) checks `ItemEnchantableComponent.canAddEnchantment === true` and that `EnchantmentSlot.Pickaxe` is among the enchantable slots, with `minecraft:durability` absent. Operator accepted the matching iPad check for DEMO-S1 on 2026-09-21. This closed decision `decision-q-007-enchantable-without-durability-podtverzhde` — before that check, "does Bedrock allow an enchantable item with no durability component" was an open risk, not an assumption.

**Invariant:** if a future task adds `minecraft:durability` to this item (e.g. to later support Unbreaking-only balance), `pickaxe-no-durability` (selftest) and the GameTest mining scenario's own durability-absence assertion must be updated together — they currently encode "no durability" as a hard pass/fail, not a default. [src: `packs/behavior/items/miners_pickaxe.json`; `src/selftest/main.ts` L127-150]




- **node**: L0-pick-r002

### Pick r003 concept rule (L0-pick-r003)

**Rule R3 — Auto-smelt is a closed 7-entry allow-list, not a general ore→ingot transform.**

`src/autosmelt.ts` maps exactly these block type ids to a smelted item, via a `Map` (not an object literal, to avoid prototype-pollution lookups like `"constructor"`):

| Block | Smelted drop |
|---|---|
| `minecraft:iron_ore` / `minecraft:deepslate_iron_ore` | `minecraft:iron_ingot` |
| `minecraft:gold_ore` / `minecraft:deepslate_gold_ore` | `minecraft:gold_ingot` |
| `minecraft:copper_ore` / `minecraft:deepslate_copper_ore` | `minecraft:copper_ingot` |
| `minecraft:ancient_debris` | `minecraft:netherite_scrap` |

The override only fires when `event.itemStack.typeId === "andrew:miners_pickaxe"` **and** the broken block is in this map. It cancels the vanilla break in a `beforeEvents.playerBreakBlock` handler, then — because before-events must never mutate the world synchronously — defers the actual `setBlockType(air)` + `spawnItem(drop)` to the next tick via `system.run`.

**Count is always 1**, even for blocks whose vanilla raw drop varies (copper ore normally drops 2–5 raw copper) — the spec's wording ("copper ore → copper ingot") is read literally (`L0-pick-asm1`). **No XP is granted**: all seven raw drops give 0 XP in vanilla, so cancelling the break takes nothing away; furnace XP is intentionally not replicated (`L0-pick-asm2`). [src: `src/autosmelt.ts`]




- **node**: L0-pick-r003

### Pick r004 concept rule (L0-pick-r004)

**Rule R4 — Everything outside the auto-smelt allow-list, and every other tool, keeps vanilla behavior unchanged.**

The auto-smelt handler returns immediately (no-op) unless both conditions hold: held item is `andrew:miners_pickaxe` **and** the target block is one of the seven ids in R3's map (`L0-pick-r003`). A block outside the list (e.g. stone) breaks and drops normally even when mined with the pickaxe; the pickaxe on a non-listed block, and any other tool on a listed block, both fall through to vanilla. Enforced by `pickaxe_keeps_vanilla_drops` (GameTest): mines `minecraft:stone` with the pickaxe and asserts the drop is `minecraft:cobblestone`, not `minecraft:iron_ingot`. This is the scope boundary that keeps Stage 1 a probe rather than a general "pickaxe mining rework." [src: `src/gametest/main.ts` L198-207]




- **node**: L0-pick-r004

### Pick r005 concept rule (L0-pick-r005)

**Rule R5 — Recipe is a single fixed shape, no substitutions.**

One `minecraft:recipe_shaped` entry, `crafting_table` tag only:

```
III
GSG
 S
```

`I` = Iron Ingot, `G` = Raw Gold, `S` = Stick, blank = empty. Result: 1× `andrew:miners_pickaxe`. Matches the raw spec exactly (top row 3 iron; middle row raw gold/stick/raw gold; bottom row empty/stick/empty). `unlock` is granted on picking up an Iron Ingot. No shapeless or alternate-ingredient variants exist. [src: `packs/behavior/recipes/miners_pickaxe.json`; `minerspickaxetestspec`]




- **node**: L0-pick-r005

### R-scyt-001 — Candidate filter (L0-scyt-r001)

# R-scyt-001 — Candidate filter

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-p001", "L0-scyt-ad02", "ASM-023", "ASM-024", "Q-015", "Q-022"]` · source: Scythe §3.

**Rule:** a player P is a candidate for owner O only if **all** of these hold:
1. P is a `Player`, not a mob or any other entity (§3 «Мобы не являются целями»).
2. P ≠ O.
3. P is in O's dimension, and `dist(P.location, launchPoint) ≤ 20`. The bound is inclusive.
4. `P.isValid` holds and P is alive. P is not in Spectator or Creative. Only Survival and Adventure count (the mirror of Q-015; an assumption, see `L0-scyt-as01`).
5. `isHiddenByShadowBlade(P) === false` (§3). This is a stub until Shadow Blade exists (ASM-024).
6. P is **visible** from O's eyes (`L0-scyt-ad02`).

**Not a filter:** vanilla Invisibility, sneaking, name tags, team membership, or the `pvp` gamerule. Q-022 is open, and the default is (a): ignore it.




- **node**: L0-scyt-r001

### R-scyt-002 — Nearest wins; ties go to the view direction (L0-scyt-r002)

# R-scyt-002 — Nearest wins; ties go to the view direction

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-p001", "ASM-025"]` · source: Scythe §3, §8 tests 2 and 4.

**Rule:** from the candidates (`L0-scyt-r001`), choose the one with the minimum 3D Euclidean distance from `launchPoint`, measured feet to feet.

**Tie-break:** candidates whose distances differ by ≤ 0.01 block (ASM-025) count as tied. Among tied candidates, choose the smallest angle between the owner's `getViewDirection()` and the direction from the owner's eyes to the candidate's head. Compare by the largest dot product, so no `acos` is needed.

**Final fallback:** if the angle is also tied within ε, choose by ascending entity id. The result is deterministic, so GameTests are reproducible.

**Scope:** the target is chosen once, at activation. It is never re-selected mid-flight, and projectiles never switch to a nearer player (§4 «преследуют именно выбранного игрока»).




- **node**: L0-scyt-r002

### R-scyt-003 — No target costs nothing (L0-scyt-r003)

# R-scyt-003 — No target costs nothing

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-p001", "L0-lgnd", "CTR-017"]` · source: Scythe §3, §8 test 1.

**Rule:** if no candidate survives `L0-scyt-r001`, then:
- show the localized message «Здесь нет игрока» / "There is no player here" (key `andrew.scythe_of_calamity.no_target`, both `ru_RU` and `en_US`, C-4) to **the owner only**;
- start **no** cooldown, set **no** busy, spawn **no** projectiles, and make **no** world change;
- the ability stays ready. An immediate second press searches again.

**Channel:** the owner's action bar, held for about 2 s through `L0-lgnd`'s `hud.hold`, so the steady Ready HUD does not overwrite it in the next pass (CTR-017). If `hud.hold` is not available, fall back to `sendMessage` (chat).




- **node**: L0-scyt-r003

### R-scyt-004 — Projectiles pass through every block and change none (L0-scyt-r004)

# R-scyt-004 — Projectiles pass through every block and change none

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj", "L0-sprj-ac05", "ADR-023"]` · source: Scythe §4, §7, §8 test 5.

**Rule:**
- The volley has exactly **3** projectiles, no more and no fewer.
- Their motion ignores **all** blocks: obsidian, walls, doors, glass, bedrock and liquids included.
- Projectile code never calls `getBlock`, `setType`, `setPermutation`, `fillBlocks` or `/fill`/`/setblock`. It also never calls explosion APIs.
- A projectile inside a block still hits the target if it is within the hit radius. Visibility matters only at **target selection** (`L0-scyt-r001`), not in flight.

**Consequence:** a target that ducks behind a wall after the lock is still hit. That is intended by §4.




- **node**: L0-scyt-r004

### R-scyt-005 — Exactly 3 HP true damage per hit (L0-scyt-r005)

# R-scyt-005 — Exactly 3 HP true damage per hit

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj", "L0-sprj-cx02", "L0-sprj-as01", "ADR-022", "C-15"]` · source: Scythe §4, §7, §8 tests 6–7.

**Rule:** each projectile that hits takes **exactly 3.0 HP** (1.5 hearts) from the target. Armour, armour toughness, Protection (any type) and Resistance do not reduce it.
- 3 hits = 9 HP.
- The damage is not scaled by difficulty, and it is not modified by melee enchantments on the Scythe (Sharpness does nothing here).

**Mechanism (ADR-022, detailed in `L0-sprj`):**
- non-lethal: `health.setCurrentValue(cur − 3)`;
- lethal (cur ≤ 3): the vanilla `applyDamage` path, so the death message, kill credit and Totem of Undying still work.

The Resistance V edge case is open in `L0-sprj-cx02`. Absorption hearts are consumed first (`L0-sprj-as01`).

**Hurt feedback:** play the hurt sound or animation if the API allows it. It is cosmetic and not part of the rule.




- **node**: L0-scyt-r005

### R-scyt-006 — Each hit launches the target about 10 blocks; fall damage is kept (L0-scyt-r006)

# R-scyt-006 — Each hit launches the target about 10 blocks; fall damage is kept

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj", "L0-sprj-as04", "L0-scyt-as02"]` · source: Scythe §4, §8 test 6.

**Rule:**
- After the damage is applied, every successful hit gives the target a vertical impulse that peaks about **10 blocks** above the takeoff Y. The tolerance for the AC is 8 to 12 blocks on flat ground with no effects.
- There is no horizontal push, and horizontal momentum is kept.
- Fall damage on landing is vanilla and is **not** suppressed. Script never sets `fall_distance` and never grants Slow Falling.
- A hit on an airborne target applies the impulse again from its current height, so the heights stack. That is allowed by §4 («оставшиеся снаряды могут попасть… в воздухе»).

**Mechanism:** `player.applyKnockback({ x: 0, z: 0 }, verticalStrength)` (stable 2.x signature). The vertical strength is calibrated on BDS to reach an apex of about 10 (`L0-scyt-as02`).




- **node**: L0-scyt-r006

### R-scyt-007 — The 20-block leash is centred on the frozen launch point (L0-scyt-r007)

# R-scyt-007 — The 20-block leash is centred on the frozen launch point

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj-r005", "L0-sprj-as02", "L0-sprj-ac08", "L0-sprj-ac09"]` · source: Scythe §5, §8 tests 8–9.

**Rule:**
- `launchPoint` is the owner's location at successful activation, and it never moves afterwards. If the owner walks, flies or teleports, the centre stays where it was.
- Each tick after movement and hits, if `dist3D(target.location, launchPoint) > 20`, the volley ends:
  - with **0 hits**: the remaining projectiles vanish, there is **no cooldown**, and the ability is ready at once;
  - with **≥ 1 hit**: the remaining projectiles vanish, and a **full 30 s** cooldown applies.
- Normal completion with ≥ 1 hit also applies the full 30 s cooldown. The 30 s is never pro-rated.

**Same radius:** targeting (r001) and the leash use the same centre and the same bound. A target locked at exactly 20.0 is inside. At > 20 it is outside.




- **node**: L0-scyt-r007

### R-scyt-008 — Only the locked target can be hit (L0-scyt-r008)

# R-scyt-008 — Only the locked target can be hit

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj", "L0-scyt-r002", "C-18"]` · source: Scythe §3, §4.

**Rule:** a projectile's hit test compares its position only with `targetId`. Other players, mobs, armour stands, the owner and item entities in the path are neither damaged nor launched, and they do not absorb the projectile. The Scythe ability never damages the owner.

**Why:** §4 says «преследуют именно выбранного игрока», and §3 says «мобы не являются целями». Collateral hits would also make the 9 HP maximum untestable.




- **node**: L0-scyt-r008

### R-scyt-009 — Item stats and recipe (L0-scyt-r009)

# R-scyt-009 — Item stats and recipe

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sitm", "L0-sitm-adr1", "L0-sitm-adr2", "L0-scyt-ent1", "L0-lgnd"]` · source: Scythe §1, §2.

**Item:**
- Id `andrew:scythe_of_calamity`. Names: RU «Коса бедствия», EN "Scythe of Calamity".
- Melee damage equals the Netherite Sword: `minecraft:damage: 8`. That is the shipped Web Sword's diamond-parity value 7, plus the vanilla step of +1 from diamond to netherite, which gives a Bedrock total of 9 against diamond's 8 (`L0-scyt-as03`). Check it on BDS by hitting an armour stand or zombie with both swords.
- Infinite durability: no `minecraft:durability` component.
- Enchantable, with slot `sword` (`L0-sitm-adr1`, resolves `cool-ctr2`).
- No `minecraft:digger` and no tool tags (`L0-sitm-adr2`), so there is no tilling and no digger trap.
- `minecraft:allow_off_hand: true`, for the hand-priority rule (`L0-lgnd`).
- Max stack size 1.
- Melee hits trigger no ability, no cooldown and no projectiles.

**Recipe** (shaped, `andrew:scythe_of_calamity`, crafting table), giving 1× Scythe:
```
 .  G  .      G = minecraft:golden_apple (not enchanted)
 O  H  O      O = minecraft:obsidian
 .  G  .      H = minecraft:diamond_hoe
```
The empty corners must stay empty. The one-per-world gate, refund and announcement come from `L0-lgnd` (`L0-scyt-p004`).




- **node**: L0-scyt-r009

### R-sprj-005 — Cooldown outcome: any hit ⇒ full 30 s, no hit ⇒ no cooldown (L0-sprj-r005)

# R-sprj-005 — Cooldown outcome: any hit ⇒ full 30 s, no hit ⇒ no cooldown

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj-ent3", "L0-sprj-ad01", "L0-lgnd", "ADR-025", "ASM-017", "ASM-023"]` · source: Scythe §5, §8 tests 8–9.

**Rule:**
- The target leaves the leash before the first hit → the remaining projectiles vanish, **no cooldown**, and the ability is ready as soon as busy is released (same tick).
- The target leaves after ≥ 1 hit → the remaining projectiles vanish, **full 30 s cooldown**.
- Normal completion with ≥ 1 hit → full 30 s.
- Every other terminal outcome (`L0-sprj-ent3`) follows the same split on `hits`.

**Duration:** the 30 s is always the full `cooldownMs` from the `LegendaryDef`, never pro-rated. It counts from the end of the volley (ASM-017). The first-hit commit (`L0-sprj-ad01`) only guarantees that a cooldown exists if the volley never reaches a clean end.

**Ownership:** this component decides *whether* the cooldown starts. `L0-lgnd` stores it and shows it.




- **node**: L0-sprj-r005

### R-sprj-006 — One shared tick loop, alive only while volleys exist (L0-sprj-r006)

# R-sprj-006 — One shared tick loop, alive only while volleys exist

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj-p001", "L0-sprj-p002", "C-4", "C-13", "ADR-025"]` · source: Scythe §7 ("короткий временный tick/update только пока они существуют").

**Rule:** there is at most **one** `system.runInterval` handle for the whole module. It is created when the volley map goes from empty to non-empty and cleared with `system.clearRun` in the same tick the map becomes empty. There are no per-projectile or per-volley timers, and no `runJob`.

**Also:**
- The tick does no world scan. It resolves only the specific owner and target ids it holds (`world.getEntity(id)`), and never calls `getPlayers()` or `getEntities()`.
- At idle, meaning no volleys, the Scythe module contributes zero per-tick work (C-4).




- **node**: L0-sprj-r006

### R-sprj-007 — One live volley per owner; the ability is busy while it flies (L0-sprj-r007)

# R-sprj-007 — One live volley per owner; the ability is busy while it flies

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj-p001", "L0-lgnd", "L0-stgt", "ASM-017", "C-5"]`

**Rule:** from `launchVolley` until resolution, `cooldown.isBusy(owner, "scythe")` is true. A second Use during that time is rejected silently by `L0-stgt`/`L0-lgnd`, with no message and no new volley. `launchVolley` also refuses defensively if a volley for that owner already exists.

**Multiplayer (C-5):** volleys from different owners run side by side and do not interact, even on the same target. Each has its own hits, leash and outcome. A target hit by two volleys in one tick takes 3 HP from each.

**Busy is always released:** every path out of `ACTIVE` (P-sprj-002 steps 5–7, P-sprj-004, the exception handler) clears busy in the same tick. Busy is in-memory only, so a restart clears it.




- **node**: L0-sprj-r007

### R-sprj-008 — Precedence within one tick (L0-sprj-r008)

# R-sprj-008 — Precedence within one tick

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj-p002", "L0-sprj-r004", "L0-sprj-r005"]`

**Rule:** within one tick, each volley is evaluated in this order:
1. invalidation marks from events;
2. the validity re-check;
3. projectile movement and **hits**;
4. the **leash**;
5. completion or expiry.

**Consequences:**
- If a projectile reaches the target in the same tick the target crosses 20 blocks, the hit counts, so the outcome is `ESCAPED_AFTER_HIT` with a cooldown. The player on the receiving end is not denied a hit that visibly landed.
- A target that logs out in the same tick a projectile would have hit takes no damage. The volley resolves on `hits` as it stood before that tick.
- The owner's own launch can carry the target out of the leash (`L0-sprj-as02`). That happens only after a hit, so it always resolves with a cooldown, which is consistent with §5.




- **node**: L0-sprj-r008

### Webs r001 concept rule (L0-webs-r001)

---
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-ent1"]
---
**Rule (R-webs-001 — Item & recipe identity).** `andrew:web_sword`: melee damage equal to the current BDS build's vanilla `diamond_sword` (read from the server's own vanilla data at implementation time, never hard-guessed — same posture as decision `web-sword-item-values`); no `minecraft:durability` component, infinite durability; `minecraft:enchantable` slot = `sword` (compatible vanilla sword enchantments apply); `menu_category` = equipment, sword group; visible in Creative Equipment, the "All" catalog, Creative Search, and via `/give`. Shaped recipe: row1 `[ , Cobweb, ]`, row2 `[Cobweb, Diamond Sword, Cobweb]`, row3 `[ , Cobweb, ]` → 1× Web Sword. The Diamond Sword ingredient may carry any durability/enchantments; none of it — or its identity — carries over to the result.

**Rationale.** Spec §1–2; closed by decision `web-sword-item-values`. Recipe correctness and damage/enchant-slot values are independently acceptance-tested (`L0-webs-ac01`).




- **node**: L0-webs-r001

### Webs r002 concept rule (L0-webs-r002)

---
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-ent2", "L0-webs-p001"]
---
**Rule (R-webs-002 — Target resolution & reach, Q-011).** The ability uses ordinary survival interaction/melee reach — no artificial long-range ray. Reach limit: blocks up to 5, entities up to 3. A block hit resolves the center cell as the air cell immediately adjacent to the struck face (not the struck block itself). An entity hit (including the owner's own feet, if in range — self-entombment is an accepted feature) resolves the center cell as that entity's foot cell; if a block and an entity are both hittable at the same reach, the entity wins. If the ray reaches an opaque block first, that is the effective target point — never attack through walls. If nothing is hit within reach: no target; the ability does not fire and the cooldown is not spent.

**Rationale.** Spec §5/§12; closed by decision Q-011.




- **node**: L0-webs-r002

### Webs r003 concept rule (L0-webs-r003)

---
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-ent3", "L0-webs-r002"]
---
**Rule (R-webs-003 — Cube geometry, Q-011).** The trap volume is exactly 27 cells: a 3×3×3 cube centered on the resolved target cell (`L0-webs-r002`), inclusive of the center. All 27 cells are candidates for replacement; none are excluded by geometry alone (only by `L0-webs-r004`'s filter).

**Rationale.** Spec §5 ("куб... 3×3×3"); the exact cell count and centering rule were ambiguous in the raw spec until closed by decision Q-011.




- **node**: L0-webs-r003

### Webs r004 concept rule (L0-webs-r004)

---
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-p001", "L0-webs-gl03"]
---
**Rule (R-webs-004 — Protected-block filter, Q-013).** Within the 27-cell cube, a cell is skipped (left untouched) instead of replaced when it is:
- occupied by a living entity (the entity is never moved, damaged, or removed; Cobweb is placed around it, not through it);
- a block with `minecraft:inventory`, or one of the named block-entities: chest, trapped/ender chest, barrel, shulker box, hopper, dropper, dispenser, furnace variants, brewing stand, beacon, lectern, jukebox, sign, banner, spawner, campfire, enchanting table, anvil, bed;
- one of the indestructible/special blocks: bedrock, barrier, command block, structure block, jigsaw, end portal + frame, nether portal, light block, reinforced deepslate;
- **outside the loaded/accessible area** — the ability never forces a chunk to load or writes into a cell it cannot confirm is loaded; such cells are treated exactly like a protected block, not retried or queued.

Liquids (water/lava) are replaced like ordinary blocks. Any block type the filter doesn't recognize defaults to **skip** (fail closed, never fail open) — this covers future/modded/unexpected block types the closed list doesn't name.

**Rationale.** Spec §6/§12; closed list and "when in doubt, skip" posture from decision Q-013.




- **node**: L0-webs-r004

### Webs r005 concept rule (L0-webs-r005)

---
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-p001", "L0-lgnd-p005"]
---
**Rule (R-webs-005 — Ability outcome contract).** (a) *Zero-cells failure (Q-017/CTR-008):* if a valid target was found but every one of the 27 cells is protected, unloaded, or entity-occupied (none filled and none already-Cobweb), the ability is treated as **not having fired**: the Web Sword ability returns `"refused"` and does not call `cooldown.start` (per `L0-lgnd-r003`, the ability owner arms the cooldown; reconciled at L0 by `L0-adr-cast`), and the player sees a localized "No room for cobweb" / «Нет места для паутины» actionbar message. (b) *Passive melee:* an ordinary attack with the Web Sword (no ability activation) never places Cobweb and never touches the cooldown — it is plain Diamond-Sword-equivalent melee damage with whatever compatible enchantments are applied (spec §7).

**Rationale.** Spec §5/§7/§12/§13 tests; closes CTR-008 via decision Q-017. This is the contract boundary between this component (which only ever reports a fill count or "no target") and `L0-lgnd` (which owns the cooldown store, dispatch and HUD; the start/skip call itself is made by this ability on `filled > 0`, per `L0-lgnd-r003` and `L0-adr-cast`).




- **node**: L0-webs-r005

