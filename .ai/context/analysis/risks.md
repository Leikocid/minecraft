---
title: Risks
type: analysis
generated_at: "2026-09-24T19:44:28.425Z"
source_channel: rollout
node_id: rollout-risks
aliases: ["rollout-risks","risks"]
is_a: ["rollout","risks"]
relates_to: ["L0-lgnd-cx02","L0-lgnd-cx03","L0-lgnd-cx04","L0-lgnd-cx05","L0-lgnd-cx06","L0-scyt-cx01","L0-scyt-cx02","L0-sprj-cx01","L0-sprj-cx03","L0-webs-cx01","L0-xcx1","L0-xcx2"]
priority: 520
---

# Risks

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

### CX-lgnd-02 · Loss return can leave a stale but still melee-usable copy (hopper/allay pickup) (L0-lgnd-cx02)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r005", "L0-lgnd-ad02", "cool-ctr1"]
---
# CX-lgnd-02 · Loss return can leave a stale but still melee-usable copy (hopper/allay pickup)

**Invariant** — C-7: no duplication via craft, death, reconnect, restart. Web Sword §14: *«Нет известных способов дюпа»*.

**Design** — `L0-lgnd-p003` step 3 classifies a removed legendary item entity as *pickup* only if the instance shows up in a **player** inventory within one tick. The stable 2.10.0 API gives no removal reason, so a hopper, hopper minecart, allay or fox picking up a dropped legendary is classified as *lost* and re-issued with `gen + 1`. `L0-lgnd-r005` makes the old stack stale: it cannot cast and is deleted when it next enters a player inventory.

**Conflict.** The stale stack is still an `andrew:web_sword` / `andrew:scythe_of_calamity` item with base melee damage and infinite durability. Until a player picks it up it sits in a container, and a non-player holder (e.g. an allay, a dispenser firing it into a player's hand, a trade through a container moved by a hopper chain) keeps a second physical copy. For the ability it is not a duplicate; for melee stats it is.

**Resolution needed.** Choose: (a) accept — stale copies are harmless because they are deleted on first player contact; (b) additionally clear the watch-set entity's stack when a hopper/allay is within 1 block at removal (heuristic, costs a local query); (c) drop loss return for non-Void causes and return only on Void (narrows CTR-1). Autopilot default: (a).







### CTR-lgnd-03: ASM-020 measures `hidden_until` in ticks, but the shipped code proved ticks are the wrong clock (L0-lgnd-cx03)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r010", "L0-lgnd-ent3", "L0-stgt"]
status: resolved
category: source-vs-code
---
# CTR-lgnd-03: ASM-020 measures `hidden_until` in ticks, but the shipped code proved ticks are the wrong clock

- **ASM-020 (L0):** a player is hidden iff `andrew:hidden_until` > "the current tick".
- **`src/websword/cooldown.ts`** (measured on BDS 1.26.51.1):
  - `world.getAbsoluteTime()` stops when `dodaylightcycle` is false.
  - `system.currentTick` restarts at 0 with the script engine.
  - A durable deadline on either clock is wrong after a restart, or never expires.
  For this reason the cooldown was moved to `Date.now()` milliseconds.

**Effect.** A tick-based `hidden_until` written before a restart would read as hidden for up to its whole stored value in new ticks. On a frozen day clock it would read as hidden forever.

**Interim position** (`L0-lgnd-r010`): use epoch ms via `Date.now()`, the same clock as the cooldowns. Only ASM-020's wording changes, not its contract.

**Needs:** L0 amends the wording of ASM-020, and the future Shadow Blade spec must write ms.







### CTR-lgnd-04: ADR-021 says existing tests stay unchanged, but the framework itself requires Web Sword changes (L0-lgnd-cx04)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad06", "L0-lgnd-ac11"]
status: resolved
category: source-vs-decision
---
# CTR-lgnd-04: ADR-021 says existing tests stay unchanged, but the framework itself requires Web Sword changes

**ADR-021:** the migration is covered by the existing GameTests without changing them.

**Required changes that touch shipped Web Sword behaviour:**
1. `allow_off_hand` plus the off-hand HUD (Q-019 a).
2. Void and lava return for the Web Sword (Q-020 a). The shipped `andrew:websword_*` tests do not cover this, so they do not break. But Q-014's "lost for good" is no longer true.
3. Death retention of several items: pending becomes an array, with a legacy read.
4. `registerTrap` no longer subscribes to `itemUse` itself. The GameTest pack calls `registerTrap()` today (`src/gametest/main.ts`). It loses its trigger unless the shim keeps a subscribing variant.

**Effect.** "Tests unchanged" holds only with the shims in `L0-lgnd-ad06` plus a GameTest-side `registerLegendaryFramework()`. Because of item 4, `src/gametest/main.ts` has to change. That file is test harness code, not a test *assertion*.

**Needs:** L0 to read ADR-021 as "no assertion edits", not "no file edits under `src/gametest/`".







### CTR-lgnd-05: ADR-021 renames the operator command, but the shipped command is documented (L0-lgnd-cx05)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p007", "L0-lgnd-ad06"]
status: resolved
category: source-vs-decision
---
# CTR-lgnd-05: ADR-021 renames the operator command, but the shipped command is documented

- **ADR-021:** the framework owns the give/reset commands as `/andrew:legendary <id> …`.
- **Shipped:** `/andrew:websword <give|reset> [target]` in `src/websword/commands.ts`. It is documented in `README.md` lines 167–172, referenced by decisions Q-006, Q-008 and Q-014, and mentioned in `src/gametest/main.ts`.
- **C-10:** the delivered platform must not regress.

**Interim handling:** register both names. `/andrew:websword` becomes an alias bound to the Web Sword def (`L0-lgnd-ad06`).

**Needs:** confirmation that keeping two command names is acceptable, instead of updating the README and deprecating the old name.







### CX-lgnd-06 · The loss watcher is a tick loop outside the letter of C-5 (L0-lgnd-cx06)

---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad03", "L0-lgnd-p003", "L0-lgnd-ac12"]
---
# CX-lgnd-06 · The loss watcher is a tick loop outside the letter of C-5

**Constraint** — C-5 (`concept-constraint`): *«no permanent global per-tick world scans. Short-lived tick loops allowed only while temporary objects (Scythe projectiles) exist.»*

**Design** — `L0-lgnd-ad03`: a 10-tick `runInterval` that runs while at least one marked legendary exists as a dropped item entity, iterating only those entity ids, to catch `y < heightRange.min` before the engine kills the item in the Void.

**Conflict.** The loop is not global and not permanent, so it keeps the spirit of C-5. But C-5 names Scythe projectiles as the only allowed case. A legendary dropped in an unloaded-but-ticking area, or left on the ground for the 5-minute despawn window, keeps the loop alive for minutes.

**Resolution needed.** Either widen C-5 to "while temporary objects **or dropped legendary items** exist", or drop the watcher and rely only on `beforeEvents.entityRemove` (`L0-lgnd-as03` must then be measured on BDS 1.26.51.1 to confirm the Void kill raises it).







### CX-scyt-01 · Scythe sub-scopes have children but no component nodes, and targeting has no nodes at all (L0-scyt-cx01)

# CX-scyt-01 · Scythe sub-scopes have children but no component nodes, and targeting has no nodes at all

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["contradiction"]` · `relates_to: ["L0", "L0-sprj-cx03", "L0-sitm", "L0-sprj"]` · **Target:** `L0` · **Category:** scope overlap and graph hygiene · **Severity:** medium · **Status:** open.

**Checked, not assumed** (`kv_list node_prefix "L0-s"`, `ls nodes/`, 2026-09-24):
- `L0-sitm-*` (3 nodes) and `L0-sprj-*` (32 nodes) are live, and each declares `part_of: L0-sitm` / `L0-sprj`. **Neither** `sitm__concept-component` nor `sprj__concept-component` exists.
- `L0-sprj` children cite `L0-sprj-p001…p004`, `r001…r004`, `ent1…ent3`, `ac01…ac04`. None of these are live.
- `L0-stgt` / `L0-sctg` (targeting) have **no** live artifacts. `L0-sprj` depends on its `selectTarget`.
- The L0 decomposition plan lists only `scyt` for the whole Scythe. So `sitm`/`sprj` overlap with this node's scope, under a different parent.

**Interim, done here:** `L0-scyt` acts as the umbrella. It owns targeting (`p001`, `r001`–`r003`, `ac01`–`ac04`), restates the missing `sprj` contract (`p002`, `p003`, `r004`–`r008`), and links to the live `sitm`/`sprj` children.

**Needed from L0:** either re-parent `sitm`/`sprj` under `L0-scyt` (as `L0-scyt-*` sub-components) or add their component nodes. Then regenerate the rollups (together with `L0-sprj-cx03`).







### CX-scyt-02 · Projectile tuning disagrees: 0.5 vs 0.6 block/tick, and turn-limited vs pure pursuit (L0-scyt-cx02)

# CX-scyt-02 · Projectile tuning disagrees: 0.5 vs 0.6 block/tick, and turn-limited vs pure pursuit

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-sprj-ad02", "L0-sprj", "L0-scyt-p002"]` · **Target:** `L0-sprj` · **Category:** source vs source · **Severity:** low · **Status:** open.

- **`L0-sprj-ad02` (live):** constant speed **0.5** block/tick (ASM-018), **no** turn-rate limit.
- **`project-knowledge/domain-model.md` → `L0-scpr-ent2` (rollup):** speed **about 0.6** block/tick (ASM-029), with a "maximum turn rate", a 1.0 hit radius, a 5-tick stagger and a 200-tick lifetime.

**Why it matters:**
- The speed sets how long a volley lasts, so it sets how often the leash or an expiry decides the outcome (AC-sprj-08/13).
- A turn limit changes whether a target that dodges sideways can be missed.
- The ASM number also clashes: ASM-018 against ASM-029.
- GameTest timing windows must use one set of numbers.

**Proposed:** follow the live `L0-sprj-ad02` (0.5 block/tick, pure pursuit) and adopt the rollup's stagger, lifetime and hit radius where `sprj` is silent. Keep all of them in one exported `SCYTHE_TUNING` constant. **L0 decides.** This node does not resolve it.







### Contradiction: ADR-025's tick-only resolution cannot honour ASM-023 (owner logout) or §5 (restart after a hit) (L0-sprj-cx01)

# Contradiction: ADR-025's tick-only resolution cannot honour ASM-023 (owner logout) or §5 (restart after a hit)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["contradiction"]` · `relates_to: ["L0", "L0-lgnd", "L0-sprj-ad01"]` · **Target:** `L0-sprj` · **Category:** invariant violation (L0 decision vs L0 assumption and spec) · **Severity:** Medium · **Status:** open. Proposed resolution: `L0-sprj-ad01`. The CTR number is L0's to assign.

**ADR-025:** "Event subscriptions … only mark the volley for resolution. The resolution itself happens in the tick loop." Resolution with `hits ≥ 1` calls `cooldown.start`.

**ASM-023:** "If the owner logs out … the cooldown is committed only if there has already been ≥1 hit."

**Engine fact:** the cooldown is a player dynamic property (`L0-lgnd`, Q-009). After `playerLeave`, in the next tick, the owner's `Player` handle is invalid, and an offline player's dynamic property cannot be written. The `beforeEvents.playerLeave` callback runs in read-only mode.

**Spec §5:** "Если хотя бы один снаряд уже попал… запускается полный 30-секундный кулдаун." ADR-023 makes volleys disappear on restart, so a hit followed by a crash never reaches resolution and the owner rejoins ready.

**Conflict:** as written, ADR-025 + ASM-023 cannot be implemented for owner logout, and ADR-025 + ADR-023 violate §5 for a restart after a hit.

**Proposed (not self-resolved):** `L0-sprj-ad01`, which commits at the first hit and re-stamps at resolution. It needs L0 to accept it as an amendment to ADR-025.







### Contradiction: a stale `L0-scpr` in the rollups covers this scope under incompatible ID numbering (L0-sprj-cx03)

# Contradiction: a stale `L0-scpr` in the rollups covers this scope under incompatible ID numbering

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["contradiction"]` · `relates_to: ["L0", "L0-stgt", "L0-stgt-ctrd"]` · **Target:** `L0` · **Category:** scope overlap / graph hygiene · **Severity:** Medium · **Status:** open.

**Checked (not an unverified claim):**
- `kv_list` (`node_prefix: "L0-s"`, `status: all`) returns only `L0-stgt` and `L0-stgt-ctrd`. **No live KV node** exists for `L0-scpr`, `L0-sctg` or `L0-scit`.
- They survive only in generated rollups (`project-knowledge/architecture.md`, `domain-model.md`, `business-rules.md`, `risks.md`, `assumptions.md`, `contradictions.md`) from an earlier decomposition. There, `L0-scpr` = "Scythe Homing Projectiles, True Damage & Cooldown Outcomes", which is this component's scope.

**Numbering clash with the current L0:**

| ID | Current L0 | Stale rollup |
|---|---|---|
| ADR-022 | True damage via `EntityHealthComponent` | Virtual projectiles (particles) |
| ADR-023 | Virtual projectiles | True damage |
| C-13 / C-14 / C-15 | Bounded tick / no orphans / exact 3 HP | Exact 3 HP / no block touch / no orphans |
| ASM-023 | Owner logout or death = cancel | Visibility = raycast |
| CTR-014 | Shadow Blade | (Shadow Blade), but CTR-016 = cooldown outcomes |

**Consequences:**
1. Any agent reading the rollups (`/plan`, `/execute`) gets two meanings per ID.
2. `L0-stgt` escalated as a "duplicate of `L0-sctg`" on the basis of those non-live rollup entries (`L0-stgt-ctrd`), so the current targeting stage has **no** deep-dive. `L0-sprj` depends on `selectTarget` from it.

**This node did not escalate.** It deep-dived under the current L0 numbering and reused the stale design only as input.

**Needed from L0:** regenerate the rollups from the live KV, retire the `L0-scpr`/`L0-sctg`/`L0-scit` text, and reopen `L0-stgt`.







### CX-webs-01 · The \ (L0-webs-cx01)

---
is_a: ["contradiction"]
part_of: ["L0-webs"]
relates_to: ["L0-lgnd", "L0-lgnd-ad06", "L0-lgnd-cx04", "L0-lgnd-p001", "L0-lgnd-p002", "L0-lgnd-p003", "L0-lgnd-p005"]
status: resolved
category: scope-overlap
target_node: L0
---
# CX-webs-01 · The "webs" component scope (item/recipe + ability) overlaps L0-lgnd, which has already absorbed the item/recipe, craft-gate, retention, void-return, cooldown and HUD pieces

**Assigned scope** (this deep-dive's brief): "Web Sword (item/recipe, reach targeting, 3×3×3 cobweb trap, protected-block filter, unloaded-chunk safety)".

**Checked (not an unverified claim).** `kv_get_subtree("L0", status="all")` shows exactly one live `concept-component`, `L0-lgnd` ("Legendary weapon framework"), whose own scope statement is "craft gate + refund, announcement, death retention/anti-dup, void return, cooldown + Action Bar, hand priority, localization" and whose process `L0-lgnd-p006` is explicitly titled "Registration, startup **and Web Sword migration**". `L0-lgnd-ad06` keeps the shipped Web Sword module paths/commands as thin shims over the shared framework. No live node named `L0-item`, `L0-once`, `L0-keep`, `L0-cool`, or `L0-qatg` exists — those names survive only as targets of already-resolved rollup decisions (`decision-resolve-l0*`), i.e. they were superseded by the `L0-lgnd` migration, the same pattern `L0-sprj-cx03` documented for `L0-scpr`/`L0-sctg`/`L0-scit`.

**Consequence.** Item identity (recipe, damage, enchant slot — spec §1–2), the one-per-world craft gate + refund (§3), death retention (§4), cooldown persistence + Action Bar (§8), and multiplayer determinism for those flows (§9) are **already owned and deep-dived under `L0-lgnd`** (or, for item values specifically, only in the rollup decision `web-sword-item-values` with no live component home yet). Re-deriving rules/processes for them under `L0-webs` would either duplicate `L0-lgnd`'s content or drift from it over time.

**This node did not escalate.** It scoped itself down to the genuine gap instead: `L0-lgnd`'s migration explicitly stopped at the cast body (`L0-lgnd-cx04` names the shipped `registerTrap()` module, which no longer self-subscribes to `itemUse` under the new framework, as needing a framework-side shim) — the targeting + 3×3×3 trap + protected-block filter + unloaded-chunk safety mechanic was never re-homed after the migration and has no other live deep-dive. `L0-webs`'s artifacts in this run cover only that residual (item identity is included too, since it likewise has no other live home, but framed as a static definition consumed by `L0-lgnd`'s registry, not as craft/retention logic).

**Needed from L0.** Confirm `L0-webs` should be scoped down to "targeting + trap + protected-block filter + unloaded-chunk safety (+ static item/recipe definition)" going forward, with the legendary-framework concerns formally cross-referenced rather than restated, and update the L0 decomposition plan/rollups so future deep-dives don't re-open the item/craft/retention/cooldown/HUD ground under this slug.







### CX-L0-01 · Web Sword rule overrides `lgnd`: who calls `cooldown.start` (L0-xcx1)

---
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-webs", "L0-lgnd", "L0-webs-r005", "L0-webs-ad02", "L0-lgnd-r003", "L0-lgnd-p004", "L0-adr-cast"]
status: resolved
resolved_by: L0-adr-cast
category: weapon-overrides-framework
target_node: L0
---
# CX-L0-01 · Web Sword rule overrides `lgnd`: who calls `cooldown.start`

**Side A:** `L0-lgnd-r003` and `L0-lgnd-p004` step 4 say: *"Only the ability owner arms a cooldown. The framework never starts one."* The handler returns `"cast" | "refused" | "busy"`.

**Side B:** `L0-webs-r005` and `L0-webs-ad02`, as first written in this run, said: *"`L0-lgnd` must not start the cooldown"* on zero cells, and *"`L0-lgnd` … owns the actual cooldown start/skip decision"*. The callback returned `{filled: number}`, and the component "never reads or writes cooldown state itself".

**Why it is a contradiction.** The reduce invariant says that a weapon overriding a `lgnd` rule becomes an L0 contradiction. The two statements put the same write in opposite modules. Taken together, neither module would start the Web Sword cooldown, or the framework would have to infer success from a weapon-specific return shape.

**Resolution.** `L0-adr-cast` keeps `lgnd`'s contract. The Web Sword handler calls `start` when `filled > 0` and returns `"cast"`. Otherwise it returns `"refused"` and calls `hud.notify`. Both children came from this run, so the `L0-webs` texts were reconciled in place. The behaviour does not change: zero cells still costs no cooldown (Q-017).







### CX-L0-02 · Scythe design steps around the `lgnd` contract (trigger subscription, HUD hold) (L0-xcx2)

---
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-scyt", "L0-lgnd", "L0-scyt-ad03", "L0-scyt-r003", "L0-lgnd-r001", "L0-lgnd-p004", "L0-lgnd-r007", "L0-adr-cast"]
status: resolved
resolved_by: L0-adr-cast
category: weapon-overrides-framework
target_node: L0
---
# CX-L0-02 · Scythe design steps around the `lgnd` contract (trigger subscription, HUD hold)

**Pair 1: trigger.**
- `L0-scyt-ad03`: the Scythe "listens to `world.afterEvents.itemUse` alone … with no `playerInteractWithBlock` twin".
- `L0-lgnd-r001`: a weapon module **may not** subscribe to `itemUse` or `playerInteractWithBlock` for its own item.
- `L0-lgnd-p004`: the one dispatcher subscribes to both events and de-duplicates them for every registered legendary.

**Pair 2: HUD.**
- `L0-scyt-r003`: the no-target text is held on the Action Bar through "`L0-lgnd`'s `hud.hold`".
- `L0-lgnd`'s published contracts: `registerLegendary`, `cooldown.*`, `isHiddenFromTargeting` and the handler. There is no hold or notify call, and `r001` forbids weapons from calling `setActionBar`. The Web Sword has the same unserved need for its no-room text (`L0-webs-r005`).

**Resolution.** `L0-adr-cast`:
- (2) Triggers are the dispatcher's alone. `scyt-ad03` becomes "the Scythe ignores block context".
- (3) `hud.notify(player, key, holdMs)` is added to the published contract and serves both weapons.

The `scyt` artifacts can keep their wording. `L0-adr-cast` is the binding reading.







