---
type: "concept-decomposition-plan"
node_id: "L0"
source_channel: "rollout"
analysis_version: 11
level: 0
title: "L0 Decomposition Plan (v11)"
aliases: ["L0"]
is_a: ["decomposition-plan"]
priority: 650
size_chars: 8182
tags: ["v11", "pearl-rod", "teleport", "supersedes:L0-plan@v10"]
---
---
title: "L0 Decomposition Plan (v11)"
aliases: ["L0-plan", "Decomposition Plan"]
is_a: ["plan"]
part_of: ["L0"]
relates_to: ["L0", "L0-pear", "L0-uwbw", "L0-ench", "L0-lgnd", "L0-strc", "L0-adr-prbd", "L0-xcx34", "L0-xq12", "L0-xasm41", "L0-xasm42", "L0-xasm43", "L0-xasm44"]
see_also: ["underwaterbowfinalspecv3ruen-part-3", "underwaterbowfinalspecv3ruen-part-4", "underwaterbowfinalspecv3ruen-part-5"]
supersedes: ["L0-plan@v10"]
---
# L0 Decomposition Plan (v11)

## Survey
- **Volume.** There are 46 raw fragments (about 184 KB). The v11 delta is **one new spec**, "Underwater Bow FINAL Specification v3" (priority 650, 5 fragments, about 32 K characters).
  - **§1–§5 are word-for-word v2.** A line diff of v2 against v3 shows no change outside the header and §6–§8. The `uwbw` and `ench` analyses (v10) therefore stand unchanged.
  - **§6–§8 are new.** They describe the **Pearl Rod** («Перовый сокровятель»), about 6 K characters unique (RU + EN, with part 5 overlapping part 4). It has 3 sections and 6 acceptance bullets.
  - The closing note, "Preserve all v2 … rules above", confirms v3 as a strict superset.
  - The code is at 1.10.0. 1.11.0 (the bow, the recipes and the `ench` probe) is not built yet.
- **Diversity.** There is one new topic. It is a **non-legendary utility item** whose core is a **teleport**. It shares no mechanics with the bow or the enchanting table.
- **Coherence.** The Pearl Rod is self-contained. It touches three existing seams:
  - **the token-swap path** from `src/legendary/craftgate.ts`, without the gate;
  - **the ticking-area pool** owned by `src/structures/spawn-search.ts`, which the preload must share;
  - **the shared interval** rule (no `runJob`; one `runInterval`).
- **Dependencies.** No pipeline. Its only ordering constraint is to probe first, because four of its rules depend on engine facts nobody has measured yet:
  - whether a hook is detectable on a plate;
  - whether the hook's owner is readable;
  - whether removing the hook resets the rod on the client;
  - whether the preload works across dimensions.
- **Blocking contradictions?** None block. `xcx34` (a same-type replacement plate is indistinguishable from the original) has a shippable default (`xasm42`). `xq12` (ender pearl vs "ender feather") is self-flagged by the spec and defaults to the Ender Pearl.

## Decomposition strategy: diversity
There is **one new child**. It follows the one-node-per-item precedent (`webs` … `uwbw`).

**`uwbw` and `ench` are not re-run.** Their source text is unchanged, so only their `see_also` gains the v3 fragments at rollout. **`lgnd` is not touched.** The Pearl Rod is explicitly *not* legendary: it has no craft gate, no retention, no Void recovery and no protection. It must not be registered as a def.

| id_suffix | label | prompt | model_hint |
|-----------|-------|--------|------------|
| pear | **The Pearl Rod («Перовый сокровятель»): a non-legendary fishing rod that binds to a pressure plate and teleports its binder there (spec v3 §6–§8).**<br>**Probe first, on checks (19136):**<br>• whether `minecraft:fishing_hook` raises `projectileHitBlock` and what block it reports on a plate (a plate has no collision, so the hook may report the support block);<br>• the hook's resting location on each plate type;<br>• whether the owner is readable (the projectile component) or must be correlated through `itemUse` plus `entitySpawn` +0;<br>• whether `hook.remove()` resets the rod's cast pose on the client;<br>• whether a cancelled `beforeEvents.itemUse` on a vanilla rod casts nothing;<br>• whether `durability.damage` can be written back to 0 after a reel;<br>• whether ItemStack dynamic properties survive a reel, an anvil rename, a chest, a drop and a restart;<br>• whether `/tickingarea` preloads at 10 K / 100 K / 1 M blocks and in the Nether and the End (per `probe_tickingarea_load`), and the area cap shared with `spawn-search`;<br>• whether a cross-dimension `teleport` works with `dimension`;<br>• whether a 3×3 recipe pattern with blanks (`" P "," R ","   "`) enforces fixed positions (it must not craft when shifted, nor in the 2×2 grid).<br>**Item (`L0-adr-prbd`):** a **marked vanilla `minecraft:fishing_rod`**:<br>• the recipe outputs `andrew:pearl_rod_token`, which is swapped after the fact (the craftgate's swap with no gate);<br>• name «Перовый сокровятель», an EN lore line and a rod id in a dynamic property;<br>• durability held at 0 damage;<br>• unlimited crafting, droppable, normal death drops.<br>**Recipe:** Ender Pearl top-middle, Fishing Rod centre, all other cells empty (`xq12`). It is checked against every vanilla and add-on shape (C-40).<br>**Binding:** the hook enters a plate cell (`xasm41`) → store {dimension, x, y, z, plate typeId, owner id, owner life epoch, plate generation} on the rod, then remove the hook.<br>**Bound use:**<br>• the owner, alive and with a matching epoch: cancel the cast, preload the destination, re-validate the plate, find a safe spot at or beside it, teleport, read the arrival back, then clear the binding;<br>• any other player: a normal cast (`xasm42`).<br>**Failure:** report it and never fake success (C-44). A missing plate clears the binding; a load timeout keeps it.<br>**Death:** bump the owner's life epoch, which invalidates every binding of theirs wherever the rods are (C-45).<br>**Persistence:** the binding and the epoch survive a restart.<br>**GameTests (`bds`):** one for each §8 bullet, every plate type from `BlockTypes` (`*pressure_plate`), and a negative control for each.<br>**iPad (`ipad`):** the cast pose after retract, the name, lore and icon, the recipe book, the arrival feel, and the failure messages. | component-deep-dive | |

## Reduce plan
- **Cite, do not restate.**
  - `pear` cites `lgnd` craftgate for the token swap pattern, and states that it does **not** use its gate, refund or retention.
  - It cites `spawn-search` for the ticking-area pool.
  - It cites the `trdt` and `uwbw` probes for the `entitySpawn` +0 correlation and the shared interval.
- **Seams re-checked at reduce:**
  - the Pearl Rod recipe vs carrot-on-a-stick and warped-fungus-on-a-stick, and vs every `packs/behavior/recipes/*` shape;
  - the fixed-position rule (`xasm43`) also applies to the v10 Mace ` I / Z ` and Rocket ` P / S ` patterns, because the spec draws them at fixed cells too. Reduce tells `uwbw` whether to switch to full 3×3 patterns (it is not re-run for this; the change is a pattern string);
  - the preload must allocate from the same ticking-area pool as `spawn-search`, so a structure search and a teleport never evict each other. If the pool cannot be shared without editing `spawn-search`, that edit is a refactor that keeps the structures scenarios green;
  - a marked rod must never satisfy `lgnd` `defForToken` or `defForItem`;
  - the `ench` roller's eligibility table treats the Pearl Rod as a `minecraft:fishing_rod` (Luck of the Sea, Lure, Mending, Unbreaking). Unbreaking is harmless on an unbreakable rod.
- **AC routing.** All six §8 bullets go to `pear`. Each is split into the `bds` and `ipad` channels. "Very distant / unloaded" gets two `bds` scenarios:
  - a far plate preloaded and reached;
  - a forced preload failure (the pool exhausted, or a timeout injected) with no teleport and an error message.
- **Roll-up.**
  - `pear`'s overview joins the L0 diagram.
  - New constraints are de-duplicated against C-1 … C-45.
  - `xcx34` closes on the `pear` deep-dive's choice of plate-generation sources.
  - `xq12` closes on Andrey's answer, defaulting to the Ender Pearl.
- **Stage order (1.11.x):**
  1. The `pear` probe on checks. It runs in parallel with the `uwbw` and `ench` probes as distinct criterion sets.
  2. The token, the recipe and the marked rod (name, lore, durability hold).
  3. The binding.
  4. The bound use with preload, validation, safe spot and teleport.
  5. Death and epoch, transfer, and persistence.

  Gate each merge by blast radius plus the `lgnd` craftgate and `structures` spawn-search scenarios. Reopen the `ipad` criteria after each epic merge.
- **Not in this run:** `xcx12` (the structure reconcile) and the Orbital v1.4.4 reconcile, both still queued.
