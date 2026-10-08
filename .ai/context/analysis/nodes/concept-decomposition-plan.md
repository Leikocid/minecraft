---
type: "concept-decomposition-plan"
node_id: "L0"
source_channel: "rollout"
analysis_version: 8
level: 0
title: "L0 Decomposition Plan (v8)"
aliases: ["L0"]
is_a: ["decomposition-plan"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 6983
tags: ["v8", "storm-blade", "supersedes:L0-plan@v7"]
---
---
title: "L0 Decomposition Plan (v8)"
aliases: ["L0-plan", "Decomposition Plan"]
is_a: ["plan"]
part_of: ["L0"]
relates_to: ["L0", "L0-strm", "L0-lgnd", "L0-adr-sbdm", "L0-adr-sblt", "L0-adr-sbvr", "L0-xcx26", "L0-xcx27", "L0-xq8", "L0-xasm29", "L0-xasm30", "L0-xasm31", "L0-xasm32"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
supersedes: ["L0-plan@v7"]
---
# L0 Decomposition Plan (v8)

## Survey
- **Volume.** The KV has 36 raw fragments, about 143 KB, and 543 indexed artifacts. The v8 delta is **one new spec**, "Storm Blade + Elytra + Totem v1", in 2 fragments of about 8.6 K characters. Part 2 repeats §03, so it is about 7 K unique: 7 sections and 9 acceptance bullets. No other raw changed. The code is at 1.8.0. Since v7 the crossbow has shipped and been accepted, and `LGND-HOLD-01` (Void return to the last holder) has shipped.
- **Diversity.** Low. There is one weapon and two data-only recipes. The weapon touches four areas:
  1. item and framework (def #6, recipe, gate, HUD, hands, rules);
  2. the active trace and its hit;
  3. the passive melee proc;
  4. visuals.

  Area 1 is the `lgnd` contract with **no new capability**: the blade is an active def like #1–#4. The recipes are two JSON files.
- **Coherence.** High. Its outward seams:
  - `lgnd`: a def only;
  - `katn`: ray helpers, reused;
  - `sclk`: the hurt-window technique, mirrored but not shared, because true damage ≠ armour damage;
  - the magnet: def-driven, no change.
- **Dependencies.** Two short independent paths, Use → trace → hit and melee → roll → bonus. They meet only in the damage helper. That is too thin for a pipeline split.

## Decomposition strategy: coherent-coverage
This follows the one-node-per-weapon precedent (`webs`, `scyt`, `katn`, `sclk`). One new child, `strm`, covers the blade **and** the two vanilla recipes. The recipes are too small for a node, they share the spec and acceptance doc, and `L0-adr-sbvr` already settles them.

**`lgnd` is not re-run.**
- Def #6 is an active def. The shape, gate, token and refund, retention, recovery, last-holder Void return, `protectLegendariesIn`, HUD and `resolveActivation` take it with no code change (`xasm32`).
- `strm` adds the def to `registry.ts` and cites `lgnd-*` rules by id.
- `katn`, `sclk` and `magn` are not re-run either.

| id_suffix | label | prompt | model_hint |
|-----------|-------|--------|------------|
| strm | **The Storm Blade (`andrew:storm_blade`) and the Elytra/Totem recipes.**<br>**Probe first, on checks (19136).** It gates `L0-adr-sbdm` and `L0-adr-sblt`:<br>• P1/P2: inside the hurt window, does `applyDamage(L + D, entityAttack)` take D with armour applied to D, for players and mobs (`xcx26`)?<br>• A raised shield against the beam from behind (`xcx27`).<br>• Which particle ids exist for the spark/wind/flash on 1.26.51, and whether the thunder sound plays at the point.<br>• Diamond-sword melee on BDS, measured against vanilla (`xasm30`).<br>**Item:** def #6 (`sb`, 600 ticks, `xasm32`); a custom sword with diamond-sword damage, no durability, and the vanilla sword enchant slot; `allow_off_hand`; RU/EN lang; a Creative "Equipment" entry; an RP icon.<br>**Recipe:** lightning rod top and bottom, wind charge left and right, diamond sword in the centre → craft token; refund on a blocked craft. Covers simultaneous crafts, the recipe book and shift-craft through the existing gate.<br>**Active:** Use → `resolveActivation` → a trace ≤ 10 blocks Euclidean, reusing `src/katana/plan.ts` helpers (`xasm31`). The first living entity, never through walls, never a second one, takes 10 HP pre-armour through `src/storm/damage.ts` (`adr-sbdm`, C-29). Three visual strikes at the hit point, or at the stop point on a miss (`adr-sblt`, C-30). Cooldown on any valid release; invalid attempts are free. HUD «Клинок бури — Готово» / "Storm Blade — Ready" / seconds left.<br>**Passive:** `entityHitEntity` with the blade in the main hand → an independent 30 % roll with an injectable RNG (C-32) → +6 HP pre-armour through the same helper, plus one visual strike. It never reads or writes the cooldown.<br>**Vanilla recipes (`adr-sbvr`, C-31):** `elytra.json` and `totem_of_undying.json`, plain shaped recipes outputting the vanilla ids.<br>**GameTests (`bds`):**<br>• every §06 bullet: once-only craft across a restart, Creative copy free; melee = vanilla diamond sword; passive rate on N ≥ 1000 seeded and a ±5 % band on a live sample; exact +6 and 10 pre-armour against an armoured SimulatedPlayer, with an in-window negative control; ≤ 10 blocks, wall stop, second target untouched; 30 s cooldown, passive independent; no lightning entity and no fire; death, hazards and Void through the `lgnd` scenarios with def #6; Elytra and Totem crafted twice each through a Crafter.<br>• The magnet's legendary scenarios include def #6.<br>**iPad (`ipad`):** the trace and strikes read as lightning; the icon; the HUD line; the Creative entry; both recipes in the recipe book; a real totem pop and an elytra glide. | component-deep-dive | |

## Reduce plan
- **Cite, do not restate.** `strm` cites `lgnd-*` rules for the gate, retention, protection, Void, Creative copies and hand priority. It also cites `katn` for ray semantics. **The only framework edit allowed is adding def #6** to `registry.ts`, plus subscriptions in `main.ts`. Any other framework hook is a new L0 contradiction (`xasm32`).
- **`strm` owns `L0-adr-sbdm` and `L0-adr-sblt`** and their probe outcomes. A failed probe supersedes its ADR before the build tasks. `xcx26` closes only on a BDS proof with a negative control. `xcx27` closes either on Andrey's answer to `xq8` or on a documented deviation (default: full block).
- **AC routing:**
  - Craft-once, death, hazards and Void are `lgnd` rules, with Storm Blade call sites in `strm`.
  - Damage, trace, passive, cooldown, visuals and both vanilla recipes go to `strm`.
  - Split every AC into `bds` and `ipad` channels.
- **Roll-up.** The `strm` overview goes into the L0 diagram. De-duplicate new constraints against C-1 … C-32. At reduce, re-check these seams:
  - The Katana's ray helpers are imported, not copied.
  - `src/storm/damage.ts` does not import the crossbow's true-damage write.
  - The blade's recipe outline (` L / WSW / L `) equals the crossbow's (` E / DCD / E `) but its keys differ, so both recipes stay distinct in the recipe book.
  - Neither vanilla recipe collides with a pack recipe.
- **Stage-10 order:**
  1. The `strm` probe on checks.
  2. Vanilla recipes. They are independent and can ship first.
  3. Def #6, item, token, recipe, RP and lang.
  4. The damage helper with the hurt-window proof.
  5. The active trace, visuals, cooldown and HUD.
  6. The passive.

  Gate each merge by blast radius plus the legendary scenarios. Reopen the `ipad` criteria after each epic merge.
- **Not in this run:** `xcx12` (the structure reconcile) and the Orbital v1.4.4 reconcile. Both are still queued separately.
