---
title: Assumptions
type: analysis
generated_at: "2026-09-24T19:42:02.854Z"
source_channel: rollout
node_id: rollout-assumptions
aliases: ["rollout-assumptions","assumptions"]
is_a: ["rollout","assumptions"]
relates_to: ["L0-infr-as01","L0-infr-as02","L0-lgnd-as01","L0-lgnd-as02","L0-lgnd-as03","L0-lgnd-as04","L0-lgnd-as05","L0-lgnd-as06","L0-lgnd-as07","L0-lgnd-as08","L0-lgnd-as09","L0-pick-asm1","L0-pick-asm2","L0-pick-asm3","L0-scyt-as01","L0-scyt-as02","L0-scyt-as03","L0-sitm-asm3","L0-sprj-as01","L0-sprj-as02","L0-sprj-as03","L0-sprj-as04","L0-sprj-as05","L0-sprj-as06","L0-webs-as01","L0-webs-as02","L0-webs-as03","L0-xasm1","cool-asm1","cool-asm2","cool-asm3","cool-asm4","cool-asm5"]
priority: 520
---

# Assumptions (CAN_ASSUME)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Assumption: the GameTest harness is not one of Stage 0's five closing criteria (L0-infr-as01)

# Assumption: the GameTest harness is not one of Stage 0's five closing criteria

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]` · `relates_to: ["L0-infr-ac06"]`

**Assumed**: `npm run bds:gametest` is an additional verification lane layered on top of Stage 0, not a hard gate for Stage 0 itself. The original `stage-0-infrastructure.md` (2026-09-20) lists exactly 5 closing criteria — build, JSON validation, BDS-in-Docker load, iPad checks, first git commit — and does not mention GameTest or SimulatedPlayer at all. The GameTest harness (`scripts/bds-gametest.mjs`, `decision-q-012`) was introduced later (2026-09-21) as a lane for Stage 1 (Miner's Pickaxe behavior) and Stage 2 (legendary-weapon multiplayer proof).

**Impact if wrong**: if GameTest is actually meant to gate Stage 0's "done" status, then Stage 0 is not closed by `build` + `validate` + `bds:check` alone, and AC06 (`L0-infr-ac06`) would need to move from "additional lane" to "Stage-0 blocking criterion" in the rollups.






### Assumption: verification runs locally, not in hosted CI (L0-infr-as02)

# Assumption: verification runs locally, not in hosted CI

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]`

**Assumed**: no CI/CD pipeline automates `build`/`bds:check`/`bds:gametest` on push; these commands are run manually by the developer, or by the ai-kit autopilot task loop, on the Mac mini itself. No `.github/workflows` or equivalent was found in the repo listing reviewed for this deep-dive, and the `bds` channel's design assumes local, macOS-specific facts that a typical hosted runner wouldn't have: Docker Desktop already running (`assertDockerRunning` just checks, never installs, Docker), `en0`/`en1` LAN interfaces for `detectLanIp()`, and Apple Silicon + Rosetta for the image's `linux/amd64` platform pin.

**Impact if wrong**: if a hosted CI runner is later introduced, `bds:up`'s LAN-IP detection and the iPad-facing address it prints become meaningless there (no iPad can reach a CI runner's network), and `assertDockerRunning`'s guidance ("start Docker Desktop") would need a CI-specific branch.






### Lgnd as01 concept assumption (L0-lgnd-as01)

**ASM-lgnd-01: Q-020 default (a) applies to both weapons.**

Indestructibility and Void return cover the Web Sword as well as the Scythe ("по общим правилам", by the general rules). The craft right is still not reopened.

**Impact if wrong:**
- **(b) Scythe only:** `returnOnLoss` becomes a per-def flag set to false for the Web Sword. That is a one-line change, and ac09 is inverted for the Web Sword.
- **(c) not in v3:** drop `L0-lgnd-p003`, the owed/gen parts of ent4, ad02, ad03, ac08–ac10 and ac12. That removes about 30 % of this component's effort.






### Lgnd as02 concept assumption (L0-lgnd-as02)

**ASM-lgnd-02: The Scythe's key prefix is `sc` and its ability key is `scythe_of_calamity`.**

No source names them. They mirror the Web Sword's `ws` / `web_sword`.

**Impact if wrong:** none until the first world ships with them. After that, the names are frozen by the same logic as `L0-lgnd-r006`.






### Lgnd as03 concept assumption (L0-lgnd-as03)

**ASM-lgnd-03: The stable 2.10.0 API raises `world.beforeEvents.entityRemove` and `entitySpawn` for `minecraft:item` entities, without a removal reason.**

The removals assumed to raise the event: falling below the world floor, lava/fire, cactus, explosions and despawn. Because the event gives no reason, pickup vs. loss is inferred (`L0-lgnd-p003` step 3).

**Impact if wrong:**
- If the Void kill raises no `entityRemove`, the watcher's `y < heightRange.min` check becomes the only Void path. It still works.
- If some destruction cause raises nothing, that cause is not covered, and ac09 narrows.

This must be measured on BDS 1.26.51.x first, as was done for retention path A/B.






### Lgnd as04 concept assumption (L0-lgnd-as04)

**ASM-lgnd-04: No stable item component makes a custom item entity immune to lava, fire, cactus or explosions.**

So "must not be destroyed by ordinary means" (Scythe §1) is realised as *destroyed, then immediately re-issued to the last holder*, not as physical immunity.

**Impact if wrong:** if such a component exists on 1.26.50 (C-1), fire, lava and explosions become prevention instead of recovery. Most gen bumps disappear, and the stale-copy surface shrinks. The Void path is still needed.






### Lgnd as05 concept assumption (L0-lgnd-as05)

**ASM-lgnd-05: Unmarked (Creative) copies keep casting.**

The shipped `trap.ts` checks only `isWebSword`, never the mark. `src/gametest/main.ts` hands out unmarked `new ItemStack(WEB_SWORD_ID)` for the trap scenarios (checked). So the dispatcher treats an unmarked legendary as castable, with its cooldown keyed by the player. Only *stale* marked stacks are barred.

**Impact if wrong:** requiring a mark to cast would break the Web Sword trap GameTests (C-10). It would also make Creative testing on the iPad impossible.






### Lgnd as06 concept assumption (L0-lgnd-as06)

**ASM-lgnd-06: Ledger sizes stay far below the dynamic-property string limit (about 32 KB).**

Admin `give` copies are rare, and each owed entry is about 200 chars.

**Impact if wrong:** a long-running test world with many lost admin copies could overflow `_owed`. The mitigation is to drop the oldest `despawn` entries and log a line. That loses those debts, which in practice means admin copies only.






### Lgnd as07 concept assumption (L0-lgnd-as07)

**ASM-lgnd-07: Bedrock never raises `itemUse` for an off-hand custom item, and `minecraft:allow_off_hand` works on a custom sword and a custom hoe in 1.26.50.**

The off-hand ability is therefore reachable only through a main-hand legendary press (Q-019 a).

**Impact if wrong:**
- If `allow_off_hand` is rejected for these items, the two-hand ACs (ac04–ac06) cannot be tested, and Q-019 degrades to (b): HUD only.
- If an off-hand Use event does exist, the dispatcher gets a second trigger with the same priority rule.






### Lgnd as08 concept assumption (L0-lgnd-as08)

**ASM-lgnd-08: "Main hand on cooldown" (Scythe §6) also covers "main hand busy".**

So while a Scythe volley is in flight, a ready off-hand Web Sword fires on the next Use press.

**Impact if wrong:** if busy should swallow the press instead, one condition in `L0-lgnd-p004` changes and ac05's busy variant flips. In gameplay terms, the player could not web-trap a target mid-volley.






### Lgnd as09 concept assumption (L0-lgnd-as09)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r010", "L0-stgt", "L0-lgnd-p007"]
---
**ASM-lgnd-09: Shadow Blade hiding is stored as `andrew:hidden_until` in epoch milliseconds.**

Scythe §3 excludes a player hidden by Shadow Blade's active ability, but no source defines Shadow Blade or how its hidden state is stored. `L0-lgnd-r010` fixes a player dynamic property `andrew:hidden_until` holding a `Date.now()` deadline, the same clock as cooldowns (ticks restart with the script engine; absolute time stops with `dodaylightcycle false`, measured on BDS 1.26.51.1). Earlier lgnd artifacts cite this as "ASM-020"; no such parent assumption exists in the KV, so this artifact is the record.

**Impact if wrong:** low and local. If Shadow Blade arrives using a tag, an effect (invisibility) or a tick-based deadline, only the body of `isHiddenFromTargeting` changes; `L0-stgt` and the `/andrew:hide` test seam keep their call sites.






### Pick asm1 concept assumption (L0-pick-asm1)

**Assumption:** auto-smelt yield count is fixed at 1, ignoring vanilla's own variable raw-drop count (e.g. copper ore: vanilla drops 2–5 raw copper, this pickaxe always drops 1 copper ingot). The raw spec's wording ("copper ore → copper ingot", singular) is taken literally rather than as shorthand for "drop count matching vanilla's raw yield."

**Impact if wrong:** if the operator actually wants smelt-yield parity with vanilla's raw-drop range, the auto-smelt payout is undervalued for copper by up to 5x, and Stage 2 balance work inherits a silently-wrong baseline. Cheap to fix — `SmeltedDrop.count` is already a field, just hardcoded to 1 at every call site — but currently untested against any explicit "should count vary" requirement; the raw spec's Fortune deferral talks about multiplication on top of a base, not what that base should be.






### Pick asm2 concept assumption (L0-pick-asm2)

**Assumption:** no XP is granted on auto-smelt, based on the reasoning that all 7 raw materials give 0 XP when mined normally in vanilla (XP comes from smelting at a furnace, not from mining the ore).

**Impact if wrong:** if Stage 2's PvP economy design expects auto-smelt to be XP-neutral versus "mine then smelt at a furnace" (which *does* grant XP), this pickaxe is currently a strict downgrade in earnable XP for any player who would otherwise smelt manually — worth flagging before Stage 2 economy is designed, not after. No code path currently grants XP on auto-smelt; adding it would need an explicit per-block XP table, which does not exist.






### Pick asm3 concept assumption (L0-pick-asm3)

**Assumption:** `SPEED_TOLERANCE_TICKS = 4` and `BREAK_LIMIT_TICKS = 300` are empirically chosen GameTest constants, not derived from any written spec value — the raw spec only says "Diamond-like intended mining speed" (qualitative, no numeric target).

**Impact if wrong:** too tight a tolerance risks flaky CI on a slower Docker/BDS host (false failures unrelated to the pickaxe); too loose a tolerance risks the exact class of regression this test exists to catch (0.3.0's hand-speed fallback, `L0-pick-gl02`) slipping through silently on a future edit to `destroy_speeds`. No incident yet from either direction — this is a forward-looking risk note, not a bug report.






### ASM-scyt-01 — Only Survival or Adventure players are candidates, and only such owners can cast `CAN_ASSUME` (L0-scyt-as01)

# ASM-scyt-01 — Only Survival or Adventure players are candidates, and only such owners can cast `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-r001", "Q-015", "L0-sprj-as03"]`

**Assumed:** Creative and Spectator players are skipped as targets, because they cannot take the damage meaningfully. A Creative owner **can** cast, so the ability can be tested with `/give` in Creative (Scythe §1 allows Creative for testing). A Spectator owner cannot cast, because a spectator cannot use items. This mirrors Q-015 (Survival and Adventure gate) for targets and relaxes it for owners.

**Basis:** §3 says «видимый PLAYER» with no mention of game mode. Creative players ignore health damage.

**Impact if wrong:** if Creative targets must be locked (with damage having no effect), one filter line in r001 changes and AC-scyt-02's variant flips. If Creative owners must be blocked, testing moves to Survival worlds only. Either way the blast radius is small.






### ASM-scyt-02 — \ (L0-scyt-as02)

# ASM-scyt-02 — "About 10 blocks" is an apex of 8–12 blocks, reached with one calibrated `applyKnockback` vertical strength `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-r006", "L0-sprj-as04"]`

**Assumed:**
- The tolerance for «примерно на 10 блоков» is ±2 blocks on flat ground, with no Jump Boost or Levitation and no knockback resistance.
- The vertical strength is a single constant. Start at about 2.5 and tune it on BDS 1.26.51.1 by logging the peak `location.y` of a SimulatedPlayer. The exact value depends on engine drag and gravity, so it cannot be derived on paper.
- Netherite armour's knockback resistance is **not** compensated (`L0-sprj-as04`), so an armoured target flies lower.

**Impact if wrong:** if the client expects exactly 10 regardless of armour, compensate by scaling with the target's knockback resistance or use `setVelocity`-style teleport steps. The change is local to the hit adapter.






### ASM-scyt-03 — Netherite-sword parity is `minecraft:damage: 8` `CAN_ASSUME` (L0-scyt-as03)

# ASM-scyt-03 — Netherite-sword parity is `minecraft:damage: 8` `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-r009", "L0-scyt-ac15"]`

**Assumed:** the shipped Web Sword uses `minecraft:damage: 7` to match a Diamond Sword (Web Sword §7 was accepted in Stage 2). Vanilla Netherite is one point above Diamond, so the Scythe uses `8`.

**Basis:** `packs/behavior/items/web_sword.json` (read 2026-09-24), plus the vanilla diamond → netherite step of +1.

**Impact if wrong:** a one-number change in the item JSON. AC-scyt-15's BDS comparison against a real netherite sword catches it.






### Creative Equipment sub-group is \ (L0-sitm-asm3)

**Links:** `part_of: ["L0-sitm"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sitm-ent1"]`

# Creative Equipment sub-group is "swords," not "hoes" `CAN_ASSUME`

Creative Equipment sub-grouping is assumed to be "swords," matching the item's sword-slot enchantment and no-digger design (`L0-sitm-rul2`, `L0-sitm-rul3`), rather than "hoes," which would match its crafting ingredient (Diamond Hoe). The spec never states a Creative sub-group explicitly.

**Impact if wrong:** cosmetic-only change to `menu_category`'s group field in `L0-sitm-ent1`.






### ASM (sprj-01) — Absorption hearts are consumed first; if they cannot be read, the effect is removed (L0-sprj-as01)

# ASM (sprj-01) — Absorption hearts are consumed first; if they cannot be read, the effect is removed

`CAN_ASSUME` · **Links:** `part_of: ["L0-sprj"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sprj-p003", "L0-sprj-r003", "ADR-022"]`. ADR-022 defers this to "ASM in `L0-sprj`". L0 assigns the number.

**Assumed.** "3 HP" is taken from the target's total pool, with absorption first, then health, as vanilla damage does. For the implementation:
- If a stable 2.10.0 component exposes the absorption amount (`minecraft:absorption` via `getComponent`, to be probed), subtract `min(3, abs)` from it and the rest from health.
- If absorption cannot be read or written on the stable API, fall back to ADR-022's literal wording: `removeEffect("absorption")` (the hearts are lost), then take the full 3 HP from health.

**Basis.** ADR-022: "Absorption hearts: set them to zero first (count them as HP)". §4 says "броня и защитные зачарования не уменьшают этот урон" and does not mention absorption.

**Impact if wrong.** With the fallback, a target under a Golden Apple loses its absorption **and** 3 HP, so it is over-punished by up to 4 HP on the first hit. That is visible in §8 test 7 only if the test player has absorption, and `L0-sqat` should clear effects before the test. If the owner wants absorption ignored entirely (pure health damage), only `truedamage.ts` changes.






### ASM (sprj-02) — The leash is 3D Euclidean distance, and self-launch may end the volley (L0-sprj-as02)

# ASM (sprj-02) — The leash is 3D Euclidean distance, and self-launch may end the volley

`CAN_ASSUME` · **Links:** `part_of: ["L0-sprj"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sprj-r004", "L0-sprj-r008", "ASM-015", "ASM-019"]`

**Assumed.** "В радиусе 20 блоков от исходной точки" is a sphere: `|target.location − launchPoint| ≤ 20`, measured on feet positions and including the Y axis. This matches `L0-stgt`'s selection metric (ASM-015).

**Side effect accepted.** The ability's own launch (about 10 blocks up, ASM-019) can push the target out of the sphere. A target hit at 18 horizontal blocks reaches about √(18² + 10²) ≈ 20.6 at the apex, so the remaining projectiles vanish. That can only happen *after* a hit, so the outcome is `ESCAPED_AFTER_HIT` with a full cooldown. The spec is not violated, but that volley can land fewer than 3 hits.

**Impact if wrong.** If the owner means a horizontal (cylindrical) radius, the leash test ignores Y. The code change is one line, and §8 tests 8 and 9 are unaffected when run on flat ground. Under the sphere reading, test 7 (9 HP from 3 hits) must be run with the target well inside the radius (≤ 15 blocks).






### ASM (sprj-03) — A target that leaves Survival/Adventure mid-flight invalidates the volley (L0-sprj-as03)

# ASM (sprj-03) — A target that leaves Survival/Adventure mid-flight invalidates the volley

`CAN_ASSUME` · **Links:** `part_of: ["L0-sprj"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sprj-p002", "L0-sprj-ent3", "ASM-015", "ADR-022"]`

**Assumed.** The tick re-checks the target's game mode. If it is no longer Survival or Adventure (for example, an operator switches to Creative or Spectator mid-flight), the volley resolves `TARGET_INVALID`, with the cooldown only if `hits ≥ 1`.

**Basis.** ASM-015 excludes Creative and Spectator at selection. ADR-022's `setCurrentValue` path would otherwise damage a Creative player, because it bypasses invulnerability, which vanilla Creative never allows.

**Impact if wrong.** If the owner wants the volley to keep flying and simply skip damage on non-Survival targets, only the validity predicate changes. The risk of *not* doing this is a true-damage kill of a Creative operator, which counts as a bug.






### ASM (sprj-04) — The launch is not compensated for knockback resistance (L0-sprj-as04)

# ASM (sprj-04) — The launch is not compensated for knockback resistance

`CAN_ASSUME` · **Links:** `part_of: ["L0-sprj"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sprj-p003", "ADR-024", "ASM-019"]`

**Assumed.** `applyKnockback({x:0, z:0}, V)` uses one constant `V`, tuned in GameTest on a target **without** armour for an apex of 10 ± 2 (ASM-019). Knockback resistance (each Netherite armour piece in Bedrock) lowers the apex, and we do not scale `V` up to compensate.

**Basis.** §4 says "примерно на 10 блоков", an approximate figure. Compensating means reading the armour, and the knockback-resistance attribute is not exposed on the stable API. Vanilla PvP also treats knockback resistance as a legitimate defence against launches.

**Impact if wrong.** A fully Netherite-armoured target may be launched noticeably lower than 10 blocks. If the owner wants a fixed 10 blocks regardless of armour, the options are to scale `V` by the equipped Netherite piece count (read from the `equippable` component) or a scripted teleport arc. ADR-024 rejected the latter, so it would need an ADR. §8 test 6 must state that the apex is measured on an unarmoured target.

**Probe needed:** check whether `applyKnockback`'s vertical strength is capped by the engine at the needed magnitude on 1.26.5x.






### ASM (sprj-05) — The visual starts with a vanilla particle; a custom RP particle is `L0-sitm`'s asset (L0-sprj-as05)

# ASM (sprj-05) — The visual starts with a vanilla particle; a custom RP particle is `L0-sitm`'s asset

`CAN_ASSUME` · **Links:** `part_of: ["L0-sprj"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sitm", "L0-sqat", "ADR-023"]`

**Assumed.**
- The first implementation draws each projectile with one vanilla particle identifier chosen by an iPad look-test, from candidates such as `minecraft:endrod` or `minecraft:shulker_bullet`-like trails, spawned every tick at `pos`.
- If the look-test fails, a custom `andrew:calamity_bolt` particle JSON and texture are added to the Resource Pack. That asset is owned by `L0-sitm`, the RP owner. It is not listed in `L0-sitm`'s L0 scope, which is a gap for L0 to route. This component only references the identifier through one constant.
- Particles spawned inside solid blocks are hidden by the client. That is accepted: the projectile "reappears" when it emerges, which reads as passing through.

**Basis.** ADR-023 names both options and no owner for the RP particle. The decomposition plan's `sitm` row lists icon, JSON, recipe and lang only.

**Impact if wrong.** If no vanilla particle is readable on the iPad at 20 blocks, a custom particle becomes mandatory. That adds RP work to `L0-sitm` and one more iPad verification step (C-11). The final fallback is ADR-023 option (b), a dummy entity, which re-opens C-14's load-time cleanup.






### ASM (sprj-06) — `setBusy` is keyed by player id, not by a `Player` object (L0-sprj-as06)

# ASM (sprj-06) — `setBusy` is keyed by player id, not by a `Player` object

`CAN_ASSUME` · **Links:** `part_of: ["L0-sprj"]` · `is_a: ["assumption"]` · `relates_to: ["L0-lgnd", "L0-sprj-p004", "L0-sprj-r007", "ADR-025"]`

**Assumed.** `L0-lgnd`'s in-memory busy flag (ADR-025) is a `Set`/`Map` keyed by `playerId + abilityKey`, and it can be cleared with only the id. That is required because on `OWNER_INVALID` (logout) the owner's `Player` handle is already invalid in the tick that resolves the volley.

**Basis.** The L0 contract lists `cooldown.setBusy` without a signature. The durable `start` needs a `Player` (dynamic property), but busy is in memory, so an id is enough.

**Impact if wrong.** If `setBusy` requires a valid `Player`, a volley whose owner logged out can never clear busy. The flag would leak until restart and the owner would rejoin "busy". That is a C-14 violation. The fix is a signature change in `L0-lgnd`, which is cheap if caught in review.






### ASM-webs-01 — Unloaded-cell detection is \ (L0-webs-as01)

---
is_a: ["assumption"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r004"]
---
# ASM-webs-01 — Unloaded-cell detection is "query fails/returns undefined", not a chunk-ticking probe `CAN_ASSUME`

**Assumed.** A cell counts as outside the loaded/accessible area when the stable block-query API cannot return a definite block there (undefined result or a thrown error), not via any experimental "is chunk loaded/ticking" API. Such cells are handled exactly like `L0-webs-r004`'s protected-block branch: skip, don't force-load, don't retry.

**Basis.** Project constraint C-2 forbids beta/preview API and experimental toggles; the stable `@minecraft/server` 2.10.0 surface has no dedicated "chunk loaded" query, so a defensive read is the only stable-API way to detect this.

**Impact if wrong.** If a stable "is loaded" query does exist at implementation time, this narrows to a direct check instead of a defensive try/read; the skip *behavior* (`L0-webs-r004`, `L0-webs-ac07`) is unaffected either way. Low.






### ASM-webs-02 — A cell that is already Cobweb counts as satisfied, not skipped `CAN_ASSUME` (L0-webs-as02)

---
is_a: ["assumption"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-ent3", "L0-webs-r005"]
---
# ASM-webs-02 — A cell that is already Cobweb counts as satisfied, not skipped `CAN_ASSUME`

**Assumed.** If a candidate cell already contains `minecraft:web` before the cast runs, it requires no write and counts toward the trap's success count (`TrapCube.successCount`, `L0-webs-ent3`) — it is not treated as a "protected"/skip cell.

**Basis.** Neither the raw spec nor Q-011/Q-013/Q-017 addresses pre-existing Cobweb explicitly; treating "already correct" as success (rather than as a no-op skip) is the reading consistent with the ability's stated goal ("form a trap") and with Q-017's zero-cells wording ("ни одна из 27 клеток не заменена" — replaced-or-already-right, not narrowly "newly written").

**Impact if wrong.** If the owner wants pre-existing Cobweb to count as "skipped" like a protected cell, repeated casts into a partially-webbed area could flip from success to `no-room` (`L0-webs-ac06`) purely from earlier casts — a behavior change to `L0-webs-r005`, not to the cube geometry itself. Medium.






### ASM-webs-03 — \ (L0-webs-as03)

---
is_a: ["assumption"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r004"]
---
# ASM-webs-03 — "Entities" in the protected-block filter includes non-player mobs, not only players `CAN_ASSUME`

**Assumed.** Decision Q-013's "клетки с живой сущностью не трогаются" (cells with a living entity are left untouched) is read as applying to any living entity — hostile/passive mobs included — not only players, matching the raw spec §6's unqualified "не удалять... сущности".

**Basis.** Neither §6 nor Q-013 restricts this to players; the general phrasing ("живая сущность" / "entities") and the project's broader "don't remove entities" posture (also seen in `L0-lgnd`'s scope) both point to an entity-type-agnostic rule.

**Impact if wrong.** If only players should block placement, cells with mobs (e.g. a cow standing in the volume) would additionally be filled around the mob today but could instead legitimately overwrite/displace it under a narrower reading — changes `L0-webs-r004`'s entity branch only. Low.






### ASM-L0-1 · Every durable deadline in the add-on is stored as epoch ms (`Date.now()`) (L0-xasm1)

---
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-webs", "L0-scyt", "L0-lgnd-cx03", "L0-lgnd-r010", "L0-lgnd-r003", "L0-lgnd-r006", "L0-lgnd-ent3"]
status: CAN_ASSUME
---
# ASM-L0-1 · Every durable deadline in the add-on is stored as epoch ms (`Date.now()`)

**Assumption.** Every persisted "until" value is an **epoch-millisecond** number compared against `Date.now()`. This covers the cooldowns of both weapons, `andrew:hidden_until` (ASM-020, amended), and any future deadline. `system.currentTick` and `world.getAbsoluteTime()` are used only for in-memory, single-session timing: HUD cadence, volley flight, and the watcher interval.

**Basis.** Measured on BDS 1.26.51.1 by the shipped `src/websword/cooldown.ts`:
- `getAbsoluteTime()` stops when `dodaylightcycle` is false.
- `currentTick` restarts at 0 with the script engine.

A tick-based durable deadline is therefore wrong after a restart. `L0-lgnd-r006` already reads legacy tick-era `ws_cooldown_until` values as expired.

**Amends.** The wording of ASM-020 changes from "`hidden_until` > the current tick" to "`hidden_until` > `Date.now()`". The contract (a read-only predicate, false when absent) does not change. The future Shadow Blade spec must write ms.

**If wrong.** If the server clock jumps (the host's wall-clock is changed), cooldowns shorten or lengthen by the size of the jump. This is accepted for a single operator's LAN server.






### A-1 · \ (cool-asm1)

# A-1 · "Hidden by Shadow Blade" is detectable as an invisibility effect / marker

**Gap.** Scythe §3 excludes players "скрытый активной способностью Shadow Blade", but Shadow Blade has no spec in any source.

**Assumption (CAN_ASSUME).** Until Shadow Blade is specified, the Scythe target filter excludes players with the `invisibility` effect, and exposes a single predicate (`isHiddenFromTargeting(player)`) that Shadow Blade will later extend (e.g. with an `andrew:` tag or dynamic property).

**Impact if wrong.** If Shadow Blade hides players by another mechanism (e.g. vanish/teleport, no effect), acceptance test Scythe #3 cannot be satisfied and the predicate must be re-implemented; if vanilla invisibility must *not* exclude targets, the filter over-excludes.






### A-2 · \ (cool-asm2)

# A-2 · "Ближайший видимый игрок" means unobstructed line of sight within 20 blocks

**Gap.** Scythe §3 says "nearest visible PLAYER in 20 blocks" while projectiles pass through all blocks; "visible" is not defined.

**Assumption (CAN_ASSUME).** Visible = a block raycast from the owner's head to the candidate's head is not blocked by a solid block, and the candidate is not hidden per A-1; same dimension; not the owner; alive; Survival/Adventure (spectators and creative players excluded).

**Impact if wrong.** If "visible" only means "not invisible", players behind walls would be valid targets (the projectiles can reach them); line-of-sight filtering would wrongly report "There is no player here".






### A-3 · \ (cool-asm3)

# A-3 · "Общие правила легендарных оружий" = union of Web Sword + Scythe rules, applied to every legendary

**Gap.** No standalone document defines the shared legendary rules. The Scythe spec references them (incl. void return and "не должно уничтожаться обычными способами"); the Web Sword spec re-states most of them but has no void/indestructibility rule.

**Assumption (CAN_ASSUME).** The shared rule set = one Survival craft per world (persistent, race-safe, refund on blocked craft), first-craft global RU/EN announcement, Creative/`/give` exempt, keep on death + return to owner without dup, return to last owner on void fall / destruction (lava, fire, cactus, despawn), infinite durability, 30 s cooldown with Action Bar, main-hand priority. It applies retroactively to the Web Sword.

**Impact if wrong.** If void return / indestructibility is Scythe-only, the `lgnd` framework adds unneeded behaviour to Web Sword; if it applies but isn't implemented, the already-shipped Web Sword (v0.3.x) can be lost permanently — and with the one-per-world rule, never re-crafted in Survival (see decision q-014 "право остаётся потраченным").






### A-4 · True damage and 10-block launch are implemented with stable APIs by health manipulation + vertical impulse (cool-asm4)

# A-4 · True damage and 10-block launch are implemented with stable APIs by health manipulation + vertical impulse

**Gap.** Scythe §4/§7 require exactly 3 HP ignoring armor/Protection and ~10-block vertical launch, leaving the mechanism to "the available API".

**Assumption (CAN_ASSUME).** True damage = reduce the `minecraft:health` component by 3 directly (with a non-armor damage cause for the hurt feedback and correct kill attribution when HP reaches 0); launch = `applyKnockback` / `applyImpulse` with a vertical strength tuned empirically on BDS to reach ≈10 blocks (±2). Fall damage is left to vanilla.

**Impact if wrong.** Direct health writes may bypass totems, death messages or kill credit; if the operator expects kill credit to the Scythe owner or totem interaction, the mechanism must change. Launch height varies with Jump Boost/levitation/slow-falling.






### A-5 · Scythe projectiles have a finite lifetime and a staggered launch (cool-asm5)

# A-5 · Scythe projectiles have a finite lifetime and a staggered launch

**Gap.** Scythe §4–5 define hit, out-of-radius and target-invalid outcomes but no timeout, speed or spacing between the 3 projectiles.

**Assumption (CAN_ASSUME).** Projectiles are launched with a short stagger (~0.5 s), fly at a fixed speed faster than a sprinting player, and expire after ~10 s; expiry with ≥1 hit → full cooldown, with 0 hits → treated like "target left radius before first hit" (no cooldown).

**Impact if wrong.** Without a timeout a target that stays in radius but can't be reached (e.g. flying with elytra at high speed) keeps projectiles alive indefinitely, violating "no orphaned temporary entities".






