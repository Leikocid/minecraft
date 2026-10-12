---
type: "concept-decomposition-plan"
node_id: "L0"
source_channel: "rollout"
analysis_version: 10
title: "L0 Decomposition Plan (v10)"
aliases: ["L0"]
is_a: ["decomposition-plan"]
priority: 640
size_chars: 8700
tags: ["v10", "underwater-bow", "enchanting", "supersedes:L0-plan@v9"]
level: 0
---
---
title: "L0 Decomposition Plan (v10)"
aliases: ["L0-plan", "Decomposition Plan"]
is_a: ["plan"]
part_of: ["L0"]
relates_to: ["L0", "L0-uwbw", "L0-ench", "L0-lgnd", "L0-sclk", "L0-strm", "L0-trdt", "L0-adr-ubfl", "L0-adr-enrl", "L0-xcx32", "L0-xcx33", "L0-xq11", "L0-xasm38", "L0-xasm39"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1", "underwaterbowmacefireworksenchantingspecv2ruen-part-2", "underwaterbowmacefireworksenchantingspecv2ruen-part-3"]
supersedes: ["L0-plan@v9"]
---
# L0 Decomposition Plan (v10)

## Survey
- **Volume.** 41 raw fragments (about 163 KB). The v10 delta is **one new spec**, "Underwater Bow / Mace / Fireworks / Enchanting v2" (priority 640). It is 3 fragments, about 12.7 K characters. The EN half mirrors the RU half and part 3 overlaps part 2, so about 6 K is unique. It has 5 sections and 7 acceptance bullets. No other raw changed. The code is at 1.10.0, and the trident has shipped and been accepted. "v2" is the document's own label; there is no v1 in `docs/` or the KV, and version labels do not drive supersession.
- **Diversity.** High. There are four unrelated areas:
  1. a legendary weapon, which is script-heavy;
  2. and 3. two vanilla-output recipes, which are data only;
  4. a global rework of a native engine system, which is feasibility-gated.
- **Coherence.** Split.
  - §1–§3 talk to the add-on's own framework (`lgnd`, `sclk` arrows, `strm` strikes, the trident's bucket return).
  - §4 talks to the engine. It applies to *every* enchantable item. It has its own risk profile: it may end as a "not possible" report, and its build is blocked on `xq11`.
- **Dependencies.** No pipeline. The only seam between the two halves is that the bow must take "compatible bow enchantments". That is satisfied by `minecraft:enchantable` slot `bow`, whatever `ench` turns out to be. `ench` must also honour the per-def forbidden lists (C-37, `FORBIDDEN_ENCHANTMENTS`, `src/sculk/enchant.ts`).
- **Blocking contradictions?** `xcx32` blocks the **`ench` build**, not the analysis or the probe. `xcx33` has a shippable default (`xasm38`).

## Decomposition strategy: diversity
There are two children. The bow follows the one-node-per-weapon precedent (`webs` … `trdt`). Following v8's `strm` (Storm Blade + Elytra/Totem), the two vanilla recipes ride with the weapon node: they are about 40 lines of JSON plus collision checks and do not justify a node. The enchanting table gets its own node, because its outcome, risk and verification channel all differ.

**`lgnd`, `sclk`, `strm` and `trdt` are not re-run.** `uwbw` names the exact `lgnd` touch points (the armed state and the HUD's third state; startCooldown on hit). If they go beyond a def field plus one HUD key set, reduce schedules `lgnd` at v11, as it did with `xcx30`.

| id_suffix | label | prompt | model_hint |
|-----------|-------|--------|------------|
| uwbw | **The Underwater Bow (`andrew:underwater_bow`), def #8 (Active), plus the Mace and Firework Rocket recipes.**<br>**Probe first, on checks (19136):**<br>• the `sclk` entitySpawn swap for a custom-shooter bow;<br>• `liquid_inertia` 0.99 (the `trident_in_flight` precedent) and survival in lava;<br>• vanilla bow damage on the swapped arrow, with Power, Punch, Flame and Infinity;<br>• `setOnFire` in water vs a scripted `fireTick` burn;<br>• an arrow raised to 14 through `strm` `raiseHit` with `causes: projectile` (`cause projectile + damagingEntity throws`, so use the before-event rewrite);<br>• a shield-blocked arrow;<br>• bucket return for the token recipe (the `trdt` `craftReturn` path);<br>• the plain `minecraft:firework_rocket` recipe output's flight duration and Elytra boost (`xasm39`).<br>**Item:** custom shooter, bow draw/pull, `allow_off_hand` (if the shooter allows it), no durability, enchantable slot `bow`, RU/EN lang, a Creative entry, and RP textures.<br>**Recipe:** ` R / BWB / S ` → token, with exactly 2 buckets back (C-34).<br>**Flight:** C-42.<br>**Normal hit:** vanilla damage plus 2 s of fire, using the longer of that and Flame's (`xasm38`).<br>**Ability:**<br>• arm on sneak + Use (`xcx33`, `xasm38`);<br>• the charge persists;<br>• a hit on a living entity → 14 pre-armour (C-29 exact), one `playStrikes`, Super Fire 5 s (C-43), and startCooldown(600);<br>• a miss → nothing (C-41);<br>• HUD: ready / armed / cooldown.<br>**Legendary:** every `lgnd` rule through def #8 (once per world, Creative free, retention, Void, recovery, persistence).<br>**Mace:** ` I / Z ` → `minecraft:mace`.<br>**Rockets:** ` P / S ` → 3 `minecraft:firework_rocket`.<br>Both are checked against every vanilla and `packs/behavior/recipes/*` shape (C-40).<br>**GameTests (`bds`) for each acceptance bullet in §5** that touches §1–§3, plus a negative control for each.<br>**iPad (`ipad`):** draw feel, HUD, lightning, underwater fire, icon, recipe book, rocket boost. | component-deep-dive | |
| ench | **The enchanting table (§4): feasibility first.**<br>**First deliverable: a probe and a written verdict** on 1.26.51 / stable 2.10.0 (C-38). The probe asks:<br>• is there any event or component that sees table offers or the applied enchant? (`beforeEvents`, `playerInventoryItemChange` with before/after enchantments, an XP level drop of 1–3, `enchantable` slot data);<br>• can a SimulatedPlayer operate a table at all?;<br>• which treasure enchantments are already table-reachable on Bedrock (the Mace and Wind Burst, spear Lunge)?;<br>• can the result be told apart from an anvil, a command or a loot result?<br>**Feed `xq11`** with the verdict and the option table (`L0-adr-enrl`). **No engine hook is built before Andrey answers.**<br>**Always built:** a pure roller `src/enchanting/roll.ts` with an injectable RNG. It holds:<br>• the eligibility table per item, derived from vanilla data;<br>• the curse exclusion;<br>• the vanilla conflict groups;<br>• the 20 % rare stage, then 70/40/20 independent level rolls for Wind Burst and Unbreaking, highest wins, fallback I, capped by context max;<br>• exclusion of each def's FORBIDDEN list.<br>Tests: ≥ 1000-sample statistics (C-39), plus a conflict and curse fuzz.<br>**If a hook is approved:** wire it, prove it on `bds` where a SimulatedPlayer can reach it and on `ipad` otherwise, and keep the C-37 scrubs running after it. | component-deep-dive | |

## Reduce plan
- **Cite, do not restate.**
  - `uwbw` cites `lgnd` for the gate, token, refund, retention, Void, Creative and persistence.
  - It cites `trdt-adrf` for bucket return.
  - It cites `sclk` for the arrow swap and the `remove_on_hit` grace.
  - It cites `strm` for `raiseHit` and `playStrikes`.
- **The `lgnd` widening.** Reduce accepts `uwbw`'s list of `lgnd` touch points: a deferred cooldown start and a third HUD state (`hudKeys.armed`). It records them as an ADR if they stay within def fields and one HUD key. Otherwise it emits a v11 `lgnd` re-run.
- **`ench` closes in one of two ways:**
  - **(a) approved:** the hook is built per `xq11`, with the deviation from the preview UI documented;
  - **(b) not approved or impossible:** a reported limitation (C-16, C-38), the roller kept dormant and tested, and §4's acceptance bullets marked "not deliverable on stable Bedrock" in the acceptance sheet. `xcx32` closes on Andrey's answer.
- **AC routing.**
  - §5 bullet 1 → `uwbw` (recipes).
  - Bullets 2, 3 and 7 → `uwbw`.
  - Bullets 4, 5 and 6 → `ench`. These are statistical, and they reach the engine only via an approved hook.
  - Every AC is split into the `bds` and `ipad` channels.
- **Roll-up.**
  - The two child overviews go into the L0 diagram.
  - New constraints are de-duplicated against C-1 … C-43.
  - Seams re-checked at reduce:
    - the bow recipe ` R / BWB / S ` is distinct from ` G / BTB / G ` (the trident) and every other add-on recipe;
    - `raiseHit`'s projectile cause is opt-in only (the Storm Blade does not move);
    - the roller's pool excludes `FORBIDDEN_ENCHANTMENTS` (trident) and the crossbow's Piercing;
    - the magnet's legendary scenarios include def #8.
- **Stage-11 order:**
  1. The `uwbw` probe and the `ench` probe, in parallel on checks, as distinct criterion sets.
  2. Mace and Rocket recipes (small, independent).
  3. Def #8, item, token, bucket recipe, RP and lang.
  4. Arrow swap and liquid flight.
  5. Normal fire.
  6. Armed charge, 14 HP, strike, Super Fire, cooldown and HUD.
  7. Roller (pure).
  8. `ench` hook, only after `xq11`.

  Gate each merge by blast radius plus the `lgnd`/`sclk`/`strm`/`magn` scenarios. Reopen the `ipad` criteria after each epic merge. The add-on goes to 1.11.0.
- **Not in this run:** `xcx12` (the structure reconcile) and the Orbital v1.4.4 reconcile. Both are still queued separately.
