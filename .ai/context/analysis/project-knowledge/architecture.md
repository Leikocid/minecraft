---
title: Architecture
type: project-knowledge
generated_at: "2026-10-05T17:12:56.143Z"
source_channel: rollout
node_id: rollout-architecture
aliases: ["rollout-architecture","architecture","project-knowledge/architecture"]
is_a: ["rollout","architecture"]
relates_to: ["L0-adr-hldb","L0-adr-scbs","L0-adr-scdm","L0-adr-scfc","L0-adr-sckp","L0-adr-scpi","L0-adr-sctr","L0-lgnd","L0-sclk"]
priority: 610
---

# Architecture

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Components

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







### Sculk Crossbow (`andrew:sculk_crossbow`): component v1 (L0-sclk)

# Sculk Crossbow (`andrew:sculk_crossbow`): component v1

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-orbc", "L0-pntr", "L0-magn", "L0-scyt", "L0-katn", "L0-adr-scbs", "L0-adr-scdm", "L0-adr-sctr", "L0-xcx22", "L0-xcx23", "L0-xcx24", "L0-xcx25", "L0-xasm23", "L0-xasm24", "L0-xasm25", "L0-xasm26", "L0-xasm27", "L0-xq7"]`

Source: `docs/Sculk_Crossbow_Spec_v1_RU_EN.docx` (raw `sculkcrossbowspecv1ruen-part-1..4`, priority 610). Legendary def #5. It is the first legendary with **no active ability, no cooldown and no HUD line** (`L0-xcx24`).

## Responsibility
A passive ranged legendary. Every projectile its holder fires is replaced at spawn by one `andrew:sculk_bolt`. The bolt flies physically, with a Warden-style Sonic Boom trail, and resolves exactly once (C-26):
- **entity hit:** fixed `SONIC_BOOM_DAMAGE` = 10 HP through armour, the shield and the invulnerability window (C-28), plus a sculk patch under the target, with no crater;
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







## Architecture Decisions

### ADR-L0-hldb · Holder: decided, unbuilt, one seam (status: accepted, resolves `L0-lgnd-cx16`) (L0-adr-hldb)

---
title: "ADR-L0-hldb · The last-holder return is decided and unbuilt; tests target `mark.owner` through one helper until `LGND-HOLD` ships"
aliases: ["L0-adr-hldb", "Holder build-out"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-sclk", "L0-katn", "L0-adr-hold", "L0-xcx11", "L0-lgnd-cx16", "L0-lgnd-ad11", "L0-lgnd-ad17", "L0-lgnd-ac18", "L0-lgnd-ac27", "L0-sclk-ac20", "L0-xasm26"]
requires: ["L0-adr-hold"]
governs_files: ["src/legendary/state.ts", "src/legendary/recovery.ts"]
---
# ADR-L0-hldb · Holder: decided, unbuilt, one seam (status: accepted, resolves `L0-lgnd-cx16`)

**Context.** `decision-resolve-l0-xcx11` (2026-09-29) chose "return to the last holder" and named `LGND-GEN-01-AA`. That task shipped the mark generation only. As read in this run (`lgnd`, 2026-10-05): the mark has no holder field (`state.ts`), and `lost()` and the protect hand-back target `mark.owner` (`recovery.ts:490`, `:877-879`). `L0-adr-hold` still says "proposed", and `lgnd-ac18` said "pending confirmation". The crossbow spec §3 is the fifth spec asking for the last holder. `sclk-ac20` was written against `mark.owner` (`xasm26`).

**Decision.**
1. `L0-adr-hold` is **accepted**: the operator decision is final, and there is no client question left. `lgnd-ac18` was corrected in place to drop "pending confirmation".
2. The holder field is **its own task, `LGND-HOLD`**, per `lgnd-ad11`. It is independent of and not blocking the crossbow epics.
3. Until it ships, every weapon's T20/Void test (the crossbow's `sclk-ac20` included) resolves the expected recipient through a single `returnTarget(mark)` test helper that returns `mark.owner` (`lgnd-ad17`). `LGND-HOLD` changes that helper and the holder clauses of `lgnd-ac08`/`ac09`/`ac24`/`ac27`, and no per-weapon test.

**Consequence.** The crossbow ships with the same documented deviation as the Katana: Void and loss go to the crafter or `/give` target. That remains true only until `LGND-HOLD` lands.







### ADR-L0-scbs · The crossbow's base item (status: proposed, probe-gated) (L0-adr-scbs)

---
title: "ADR-L0-scbs · The Sculk Crossbow's base item: a custom shooter, not a marked vanilla crossbow"
aliases: ["L0-adr-scbs", "Sculk Crossbow base item"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-lgnd", "L0-xcx24", "L0-xasm27"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-2"]
---
# ADR-L0-scbs · The crossbow's base item (status: proposed, probe-gated)

**Context.** Spec §1 says "base: Vanilla Crossbow". It requires infinite durability, a Creative/search/`/give` entry, Quick Charge and Multishot working (T14, T16), and Piercing impossible (T15). The framework identifies legendaries **by type id** (`isLegendaryStack`, `registry.ts:127`). Every shipped legendary is a custom `andrew:` item: the Web Sword and Katana clone a sword, and the Cannon looks like a fishing rod.

**Options.**
- **A: a custom `andrew:sculk_crossbow`** with `minecraft:shooter` (arrow ammunition), `minecraft:enchantable` (slot `crossbow`), no `minecraft:durability`, and a crossbow icon.
  - Pros: framework identity is unchanged, as are Creative/`/give` (T03) and infinite durability by omission.
  - Risks: a custom shooter draws and releases like a bow, with no stored "loaded" state. Quick Charge and Multishot may not apply natively. If they do not, the script emulates them: Multishot = two extra bolts at ±10°; Quick Charge = a shorter required use duration, read from the enchantment level.
- **B: the vanilla `minecraft:crossbow`** with the legendary mark in item dynamic properties.
  - Pros: real loading; Quick Charge and Multishot are native.
  - Cons: `isLegendaryStack` has to become mark-aware throughout the framework, the magnet and the GameTests. There is no Creative entry (§10). Durability must be refilled after every shot (T18). The unmarked vanilla crossbow is the recipe input and looks identical.

**Decision (proposed).** **A.** It keeps C-7 (one identity mechanism) and needs only the no-ability framework delta (`L0-xcx24`).

**Gate.** It is accepted only after the `sclk` probe records:
1. that the custom shooter fires arrows in Survival and consumes ammunition;
2. whether the enchanting table and the anvil offer Quick Charge, Multishot and Piercing for slot `crossbow`;
3. whether Multishot and Quick Charge change the custom shooter's behaviour natively.
4. (added at reduce, `L0-sclk-cx02`, `L0-adr-scfc`) the minimum release time (probe Q5). Under A a full-charge gate is mandatory: a bolt is spawned only for a release at or past the Quick-Charge-adjusted charge time. If neither the native draw nor the scripted gate holds reliably, B is adopted.

If (1) or (4) fails, B is adopted. Under B, T18 (durability kept at 0) moves from `sclk` to `lgnd`, together with mark-aware identity. The reduce then re-opens `lgnd` for mark-based identity. Under C-16, emulated Quick Charge is a documented deviation from the vanilla feel.

**Rejected: C, a custom item that shoots nothing** (the script spawns bolts on `itemUse`). It loses the crossbow's charge, the ammunition use and vanilla enchantment handling altogether, and §9 makes the standard reload the weapon's only limiter.







### ADR-L0-scdm · How a bolt hits (status: proposed, probe-gated) (L0-adr-scdm)

---
title: "ADR-L0-scdm · Bolt substitution and true damage for the Sculk Crossbow"
aliases: ["L0-adr-scdm", "Sculk bolt and damage pipeline"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-xcx22", "L0-xcx23", "L0-xasm23", "L0-xasm27"]
see_also: ["sculkcrossbowspecv1ruen-part-2", "sculkcrossbowspecv1ruen-part-3", "sculkcrossbowspecv1ruen-part-4"]
governs_files: ["src/scythe/volley.ts", "src/scythe/volley-rules.ts"]
---
# ADR-L0-scdm · How a bolt hits (status: proposed, probe-gated)

**Context.** §5, §9 and §14 put the most weight on this: vanilla arrow damage must be **replaced**, never stacked. Stable 2.10.0 has no before-event that cancels projectile damage. `projectileHitEntity` is an after-event: by the time it fires, the arrow has already dealt armour-reduced, shield-blocked damage.

**Decision (proposed).**
1. **Substitution at spawn.** When an arrow-type projectile spawns whose owner holds a marked crossbow (main or off hand), the script removes it in the same tick. It spawns one `andrew:sculk_bolt` in its place with the same location, velocity and owner (`minecraft:projectile` `shoot`). One spawn gives one bolt, so each Multishot projectile has its own record (C-26).
   - The bolt is a **snowball-runtime** entity with zero damage. Engine facts: an entity without `runtime_identifier` pushes mobs; snowball-runtime entities persist and reload through `entityLoad`, and the reload removes them (C-23).
   - Gravity and drag match the arrow (tuned constants, probe-measured), so the bolt still falls like a bolt (§9: physical, not hitscan).
2. **Hit.** `projectileHitEntity` and `projectileHitBlock` are filtered to `andrew:sculk_bolt`. The bolt's record is resolved exactly once, then the bolt is removed.
3. **Damage.** `SONIC_BOOM_DAMAGE` (`xasm23`) goes through the shipped Scythe true-damage pattern (`volley.ts:114`, `decision-scythe-true-damage`): `applyDamage(D, {cause: projectile, damagingEntity: owner})` for the flash, the sound and kill credit, then `health.setCurrentValue(hp − D)`. If D ≥ hp, it is an overkill `applyDamage`. This makes D exact through armour, Protection and the invulnerability window (`xcx22`).
4. **Visual.** While a bolt lives, the shared interval emits `minecraft:sonic_explosion` (or a look-alike RP particle if the iPad shows it badly) at the bolt's real position and the previous one (C-5f).

**Gate.** The probe confirms:
- that the spawn event carries the owner and velocity of a crossbow/shooter arrow in time to swap it with no damage;
- what a snowball-runtime bolt does against a raised shield (`xcx23`);
- that three bolts in one tick each take the full D (T17).

**Rejected.**
- **Keep the vanilla arrow and top up the difference after the hit.** The arrow's damage depends on armour, Power and the shield. A lethal arrow cannot be undone. There is also no reliable way to tell "arrow damage" from other damage in the same tick (violates C-26 and §14 "no stacking").
- **A hitscan ray from the shooter.** Forbidden by §9.
- **Arrow runtime with damage 0.** The arrow runtime keeps knockback, sticks in targets and can be picked up, and the shield still deflects it.







### ADR-L0-scfc · Full-charge gate (status: accepted, probe-gated; resolves `L0-sclk-cx02`) (L0-adr-scfc)

---
title: "ADR-L0-scfc · Full charge is the crossbow's fire-rate gate; a failed gate falls back to option B and re-opens `lgnd` identity"
aliases: ["L0-adr-scfc", "Crossbow full-charge gate"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-lgnd", "L0-adr-scbs", "L0-sclk-cx02", "L0-sclk-r006", "L0-sclk-as05", "L0-sclk-p001", "L0-sclk-ac18", "L0-xasm27", "L0-xq7"]
requires: ["L0-adr-scbs"]
governs_files: ["src/sculk/", "packs/behavior/items/sculk_crossbow.json"]
---
# ADR-L0-scfc · Full-charge gate (status: accepted, probe-gated; resolves `L0-sclk-cx02`)

**Context.** Spec §9 makes the standard crossbow reload (with Quick Charge) the weapon's only limiter: there is no cooldown. Option A of `adr-scbs` is a custom `minecraft:shooter`, which may release like a bow at any draw. Damage is fixed (C-28) and every block hit carves a full crater, so a tap-release would multiply both the DPS and the terrain edits.

**Decision.**
- Under option A, a bolt is spawned **only** for a release at or past the Quick-Charge-adjusted full-charge time (`sclk-r006`, `as05`). An early projectile is removed with no bolt, and the ammunition stays spent.
- Probe **Q5** (release at 1/5/10/20/25 ticks) is now gate (4) of `adr-scbs`, edited in place at reduce. If `charge_on_draw` / `max_draw_duration` already blocks an early release natively, the scripted check stays as a guard, and its test still runs.
- If neither the native nor the scripted gate holds reliably on BDS **and** the iPad, `adr-scbs` falls to **option B**.

**Why this is cross-component.** Option B is not a `sclk`-local change. It makes legendary identity mark-based across `lgnd` (`isLegendaryStack`, `defForStack`, the craft gate, retention) and `magn` (`hasitem` holder tags cannot read a mark). It also moves **T18** (durability) from `sclk` to `lgnd`, which has to keep a vanilla crossbow repaired. A Q1 or Q5 failure therefore needs a new L0 decision before any build task. This ADR does not pre-approve that rewrite.

**T18 routing (plan invariant).** Option A: T18 is in `sclk` (`sclk-ac18`: the item JSON has no `minecraft:durability`). Option B: T18 is in `lgnd`.







### ADR-L0-sckp · The Sculk Crossbow's key prefix is `sk` (status: accepted, resolves `L0-lgnd-cx15`) (L0-adr-sckp)

---
title: "ADR-L0-sckp · The Sculk Crossbow's key prefix is `sk`"
aliases: ["L0-adr-sckp", "Crossbow key prefix"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-sclk", "L0-lgnd-cx15", "L0-xasm26", "L0-lgnd-as18", "L0-lgnd-ad16", "L0-sclk-p006", "L0-sclk-ent1", "L0-sclk-ac01", "L0-sclk-ac02", "L0-sclk-ac03"]
requires: ["L0-lgnd"]
governs_files: ["src/legendary/registry.ts"]
---
# ADR-L0-sckp · The Sculk Crossbow's key prefix is `sk` (status: accepted, resolves `L0-lgnd-cx15`)

**Context.** The v7 plan row for `lgnd` and `L0-xasm26` gave def #5 `keyPrefix "sc"`. `sclk` built on that (p006, ent1, ac01–ac03). `lgnd` read `registry.ts` and found `sc` is the **Scythe's** prefix. It has been live since v3, and worlds already hold `andrew:sc_crafted`, `sc_owed`, `sc_pending` and `sc_gen:*`. Sharing it would merge the two weapons' craft flags and ledgers, and the registry uniqueness test (`lgnd-ac23`) would stop the build.

**Decision.** Def #5 uses **`keyPrefix: "sk"`**. No `andrew:sk_` key exists anywhere. Like every prefix, it is frozen once a world ships (`lgnd-r006`).

**Reconciled in place at reduce.** All of these were written in this run, so they were corrected rather than filed against: `sclk-p006`, `sclk-ent1`, `sclk-ac01`–`ac03` (flag `sk`), `L0-xasm26`, and the `lgnd` row of the v7 decomposition plan (now annotated). The `lgnd` side (`as18`, component delta #3) already said `sk`.

**Consequence.** The token id, item id and command `andrew:crossbow` are unaffected. A test asserting the craft flag reads `andrew:sk_crafted`.







### ADR-L0-scpi · Piercing on the Sculk Crossbow (status: accepted, probe-gated; resolves `L0-sclk-cx01`) (L0-adr-scpi)

---
title: "ADR-L0-scpi · T15 reads as \"Piercing is stripped on entry and never acts\" (C-16 deviation)"
aliases: ["L0-adr-scpi", "Crossbow Piercing reading"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-sclk-cx01", "L0-sclk-ad01", "L0-sclk-r005", "L0-sclk-ac15", "L0-adr-scbs", "L0-sclk-p001"]
see_also: ["constraints"]
governs_files: ["src/sculk/"]
---
# ADR-L0-scpi · Piercing on the Sculk Crossbow (status: accepted, probe-gated; resolves `L0-sclk-cx01`)

**Context.** T15: "Piercing cannot be applied or used." `minecraft:enchantable.slot = "crossbow"` is needed for Quick Charge and Multishot (T14, T16), and it admits Piercing. Stable 2.10.0 has no hook to refuse an anvil or enchanting-table result (C-16). The v7 plan already allowed "strip it on sight if the slot cannot exclude it".

**Decision.**
- T15 passes when the following hold. (a) Every sculk-crossbow stack that gains Piercing loses it in the same tick the inventory-change event reports it (`sclk-r005`). (b) No bolt behaves differently with Piercing, because each bolt resolves once (`sclk-r001`).
- The momentary tooltip is listed in the README C-16 deviation list.
- If probe **Q2** shows that neither the table nor the anvil offers Piercing for the custom item, the deviation is dropped, and T15 is tested only as "cannot be applied".

**Scope.** This applies only to `sclk`. No `lgnd` hook is involved: the strip is crossbow code on `playerInventoryItemChange`, so the plan's single framework change still holds.







### ADR-L0-sctr · Crater and sculk (status: proposed) (L0-adr-sctr)

---
title: "ADR-L0-sctr · Crater and sculk: a scripted, bounded, protected carve with a shared deny list"
aliases: ["L0-adr-sctr", "Sculk crater carve"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-orbc", "L0-lgnd", "L0-xcx25", "L0-xasm24", "L0-xasm25"]
see_also: ["sculkcrossbowspecv1ruen-part-2", "sculkcrossbowspecv1ruen-part-4"]
governs_files: ["src/orbital/penetrator-keep.ts", "src/legendary/recovery.ts"]
---
# ADR-L0-sctr · Crater and sculk (status: proposed)

**Context.** §6, §7, §11 and §14 ask for an irregular crater of up to about 5×5×(2–3) with no explosion damage, then permanent plain sculk around it. The edits are event-driven, synced and saved. With Multishot and Quick Charge, one player can cause about 3 carves every ~0.6 s.

**Decision (proposed).**
1. **Shape.** A pure, node-tested `craterCells(impact, face, seed)`. It returns cells inside a 5×5 footprint and down to 3 deep: an ellipsoid with radius jitter, seeded per bolt so a GameTest can replay it. The centre column is always at least 2 deep. The **patch** is `sculkCells(…)`: the top exposed solid full-block faces within ≤ 5×5, with a ragged edge.
2. **Order in the hit tick:**
   1. clip the box to loaded chunks and the height range (C-12);
   2. `protectLegendariesIn(dimension, box)` (`recovery.ts:679`);
   3. set each crater cell to air if it is not on the deny list and not a liquid;
   4. turn each patch cell into `minecraft:sculk`.

   There are no item drops (`xasm25`) and no entity damage. Each bolt does at most 75 + 25 `setType` calls. A per-tick budget (for example 300 calls) queues overflow to the next tick of the shared interval, keeping the order per bolt.
3. **The deny list is shared.** `penetrator-keep.ts` (the Orbital LMB Survival-unbreakable list, `L0-xasm6`) moves to a neutral module, for example `src/terrain/keep.ts`. Both weapons import it, with no change in behaviour for the Orbital (C-7, `xcx25`).

**Rejected.**
- **`dimension.createExplosion`.** It always damages entities, breaks blocks by blast resistance rather than to the bounds asked for, and drops items (§6, T12).
- **Spreading the carve over a `runJob`.** The engine fact: starting `runJob` stalls the next tick by 15–30 ms. The interval budget achieves the same thing without that.
- **A per-weapon copy of the deny list.** It would drift (C-7).







