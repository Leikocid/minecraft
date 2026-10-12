---
title: Glossary
type: project-knowledge
generated_at: "2026-10-12T18:21:49.783Z"
source_channel: rollout
node_id: rollout-glossary
aliases: ["rollout-glossary","glossary","project-knowledge/glossary"]
is_a: ["rollout","glossary"]
relates_to: ["L0-ench-ac01","L0-ench-ac02","L0-ench-ac03","L0-ench-ac04","L0-ench-ac05","L0-ench-ac06","L0-ench-gl01","L0-ench-gl02","L0-ench-gl03","L0-pear-ac01","L0-pear-ac02","L0-pear-ac03","L0-pear-ac04","L0-pear-ac05","L0-pear-ac06","L0-pear-ac07","L0-pear-gl01","L0-pear-gl02","L0-pear-gl03","L0-pear-gl04","L0-pear-gl05","L0-trdt-a001","L0-trdt-a002","L0-trdt-a003","L0-trdt-a004","L0-trdt-a005","L0-trdt-a006","L0-trdt-g001","L0-trdt-g002","L0-trdt-g003","L0-uwbw-a001","L0-uwbw-a002","L0-uwbw-a003","L0-uwbw-a004","L0-uwbw-a005","L0-uwbw-a006","L0-uwbw-a007","L0-uwbw-a008","L0-uwbw-g001","L0-uwbw-g002","L0-uwbw-g003","L0-uwbw-g004"]
priority: 650
---

# Glossary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### AC-ench-01 · The probe verdict exists, with evidence, and is attached to xq11 (L0-ench-ac01)

# AC-ench-01 · The probe verdict exists, with evidence, and is attached to xq11

**is_a:** acceptance-criterion · **part_of:** L0-ench · **relates_to:** L0-ench-prob, L0-xq11

**GIVEN** BDS 1.26.51 on checks (19136), with `@minecraft/server` 2.10.0 stable and no Experiments,
**WHEN** the `enchanting-probe` scenarios run and iPad observations O1 (when the level drop happens vs when the item returns) and O2 (what the table offers for the Mace, the spear, boots, a bow and a trident) are recorded,
**THEN** `src/enchanting/README.md` § Verdict:
- answers Q1–Q4, each with a scenario name or an observation id;
- includes the option table (a)/(b)/(c) from `L0-adr-enrl`;
- states, in plain words, whether the vanilla table's offers can be changed.

**AND** the verdict is attached to the `xq11` message sent to Andrey.

**Channels:**
- `bds` for Q1.1, Q1.2, Q1.4, Q2 (a SimulatedPlayer `interactWithBlock` on a table → no change in 40 ticks, with `/enchant` as a positive control) and Q4's scriptable rows;
- `ipad` for O1/O2 and Q4's table and anvil rows.


- **node**: L0-ench-ac01

### AC-ench-02 · The rare stage hits ≈ 20 % of valid generations; curses 0 % (L0-ench-ac02)

# AC-ench-02 · The rare stage hits ≈ 20 % of valid generations; curses 0 %

**is_a:** acceptance-criterion · **part_of:** L0-ench · **relates_to:** L0-ench-r004, L0-ench-r001

**GIVEN** `rollEnchantments` at tier 3 for each of `minecraft:mace`, `minecraft:diamond_boots`, `minecraft:bow`, `minecraft:diamond_pickaxe` and `andrew:underwater_bow`,
**WHEN** it is called 1 000 times per item with a fixed seed, and 1 000 times per item unseeded,
**THEN**:
- results with ≥ 1 rare member number in [162, 238] per 1 000 valid generations;
- every `rareStage:'miss'` result holds 0 rare members;
- `binding` and `vanishing` occur **0** times in all results.

**AND** an item with no eligible rare enchantment always reports `rareStage:'none'` and is excluded from the count.

**Channel:** `unit` (`node --test`, in_process). Per C-39 this closes the roller criterion only, not §5 bullet 4 in the engine. That needs an approved hook (`ac06`).


- **node**: L0-ench-ac02

### AC-ench-03 · Wind Burst and Unbreaking: 70/40/20 independent rolls, highest wins, capped (L0-ench-ac03)

# AC-ench-03 · Wind Burst and Unbreaking: 70/40/20 independent rolls, highest wins, capped

**is_a:** acceptance-criterion · **part_of:** L0-ench · **relates_to:** L0-ench-r005

**GIVEN** 1 000 rolls in which `wind_burst` (Mace) or `unbreaking` (pickaxe) was chosen, at tier 3,
**WHEN** the levels and the traces are counted,
**THEN**:
- the counts are III ∈ [162, 238], II ∈ [276, 364] and I ∈ [433, 527];
- every result's three level rolls are present in the trace;
- the per-roll success counts are within ±3σ of 700, 400 and 200;
- no level exceeds 3.

**AND** at tier 2 no level exceeds II and P(II) ∈ ±3σ of 0.52. At tier 1, every level is I.
**AND** the same seed reproduces an identical sequence of `EnchantRoll`s. The test runs seeded and unseeded.

**Channel:** `unit`.


- **node**: L0-ench-ac03

### AC-ench-04 · Conflict, curse and forbidden fuzz; treasure is reachable; the module is pure (L0-ench-ac04)

# AC-ench-04 · Conflict, curse and forbidden fuzz; treasure is reachable; the module is pure

**is_a:** acceptance-criterion · **part_of:** L0-ench · **relates_to:** L0-ench-r002, L0-ench-r003, L0-ench-r001

**GIVEN** ≥ 10 000 requests with random item (every `ELIGIBILITY` key), random tier and random seed,
**WHEN** each result is checked,
**THEN** there are 0 conflicting pairs (`r002`), 0 curses, 0 levels above the vanilla max, and 0 guard throws.

**AND** `andrew:above_water_trident` (the `TRIDENT.itemId`) never carries `loyalty` or `riptide`, and the Sculk Crossbow never carries `piercing`.
**AND** across the run, every treasure member of each item's eligible set appears at least once. Examples: Mending on a pickaxe, Swift Sneak on leggings, Wind Burst on the Mace. This is the roller half of "Mending and other eligible treasure can be offered".
**AND** a source check shows that `src/enchanting/roll.ts` and its imports never reach `@minecraft/server`.

**Channel:** `unit`.


- **node**: L0-ench-ac04

### AC-ench-05 · No hook before the xq11 answer; the default (c) is reported honestly (L0-ench-ac05)

# AC-ench-05 · No hook before the xq11 answer; the default (c) is reported honestly

**is_a:** acceptance-criterion · **part_of:** L0-ench · **relates_to:** L0-xq11, L0-xcx32, L0-adr-enrl

**GIVEN** `xq11` is unanswered, or answered (c),
**WHEN** the epic merges,
**THEN**:
- no module subscribes an event to enchant, re-roll, or open a custom station on behalf of §4 (`grep` of `src/enchanting/` for `world.` / `system.` returns nothing);
- `roll.ts` is imported only by tests;
- the C-37 scrubs are unchanged.

**AND** the release notes and the acceptance sheet carry the verdict's claim sentence. §5 bullets 4–6 are marked "rules engine built and statistically proven; not deliverable at the vanilla table on stable Bedrock (C-38)". Nothing claims a full implementation.

**Channel:** `review`, plus the `ipad` acceptance sheet signed by Andrey.


- **node**: L0-ench-ac05

### AC-ench-06 · Engine parity of the data, always; the hook proof only if it is approved (L0-ench-ac06)

# AC-ench-06 · Engine parity of the data, always; the hook proof only if it is approved

**is_a:** acceptance-criterion · **part_of:** L0-ench · **relates_to:** L0-ench-r001, L0-ench-r002, L0-ench-r003, L0-ench-cx01

**Parity (always, `bds`).**
**GIVEN** BDS 1.26.51,
**WHEN** a scenario spawns each `ELIGIBILITY` item and calls `canAddEnchantment` for every `EnchantmentTypes` id (and for each `r002` pair, adds A and then asks about B),
**THEN** the engine's answers equal `roll.ts`'s eligibility table and conflict groups, minus curses and forbidden ids, with 0 mismatches. A mismatch is a negative control: flipping one table entry turns the scenario red.

**Hook (only if `xq11` = (a) or (b)).**
- **`bds`:** the adapter's apply function is called directly on a stand-in stack with a seeded RNG. The stack carries the roller result. Then the C-37 scrub still strips `loyalty` from a trident and `piercing` from the Sculk Crossbow in the same tick. A SimulatedPlayer cannot use a table (`ac01` Q2), so the table step itself is not on `bds`.
- **`ipad`:**
  - ≥ 20 table uses on Mace, boots and pickaxe show a rare at least once and a curse never;
  - an anvil + Mending book on a pickaxe is **not** re-rolled (`L0-ench-cx01`);
  - for (a), the preview/result mismatch is visible and is documented as a deviation.


- **node**: L0-ench-ac06

### Ench gl01 concept glossary term (L0-ench-gl01)

**Formerly table-inaccessible enchantment (rare, treasure)**

A non-curse enchantment that is valid for an item's slot but that the vanilla Bedrock 1.26.51 table never offers. The expected set is Mending, Frost Walker, Soul Speed, Swift Sneak and Wind Burst. Also Lunge, if the probe finds it is not offered. The exact per-slot list comes from the probe (`L0-ench-prob` Q3) and is held in `TREASURE` in `roll.ts`. Curses (`binding`, `vanishing`) are treasure in vanilla but are **never** in this set.

A **valid generation** is one roll for an item whose eligible set holds at least one of these. Only valid generations count toward the 20 % statistic.

**Synonyms:** rare enchantment, treasure enchantment, "редкая (ранее недоступная через стол) чара".


- **node**: L0-ench-gl01

### Ench gl02 concept glossary term (L0-ench-gl02)

**Context max (table tier)**

The highest level the enchanting context allows: `min(vanilla max level, tier cap)`. The tier cap is I, II or III for table tiers 1, 2 and 3 (`xasm39`). The tier maps to the 1/2/3-level cost of the chosen offer. Bookshelf counts are not observable, so they are not part of it.

The Wind Burst/Unbreaking level rule is applied first and then capped. If the rolled level is not allowed, the highest allowed level is used.

**Synonyms:** tier cap, "максимально разрешённый уровень".


- **node**: L0-ench-gl02

### Ench gl03 concept glossary term (L0-ench-gl03)

**Roller / adapter / scrub / verdict**

- **Roller:** the pure function `rollEnchantments` in `src/enchanting/roll.ts`. It turns `{itemId, tier, rng}` into an enchantment list under §4's rules. It has no engine import and is proven by unit statistics.
- **Adapter:** the optional engine-side code that applies roller output in the game: (a) a post-hoc re-roll, or (b) a custom station. It is built only after Andrey's approval in `xq11` (C-38).
- **Scrub (strip):** the existing C-37 code that removes a def's forbidden enchantments after they arrive: `src/legendary/enchant.ts` for the trident's Loyalty/Riptide, and `src/sculk/enchant.ts` for the crossbow's Piercing. It always runs after any adapter.
- **Feasibility verdict:** the probe's written answer to Q1–Q4, with evidence and the option table, attached to `xq11`.

**Synonyms:** roller = enchant roller, rules engine.


- **node**: L0-ench-gl03

### AC-pear-01 · Unlimited craft, correct grid, no durability loss (§8 bullet 1) (L0-pear-ac01)

# AC-pear-01 · Unlimited craft, correct grid, no durability loss (§8 bullet 1)

**Relates to:** L0-pear-pr01, L0-pear-ru04, L0-xasm43, C-40.

**`bds` (GameTest; crafter-loaded via `/replaceitem`, which performs a real recipe craft):**
- GIVEN a crafter with an Ender Pearl at top-middle and a Fishing Rod at centre, WHEN it crafts 3 times in a row, THEN 3 tokens come out. A token picked up by a sim player becomes a `minecraft:fishing_rod` with `andrew:pearl_rod`, nameTag «Перовый сокровятель», lore "Pearl Rod"/"unbound", and damage 0.
- **Negative controls:** the same two items shifted (pearl top-left over rod middle-left), and the pearl below the rod → nothing crafts. If the probe shows Bedrock trims blank rows and columns, this becomes a recorded deviation.
- **C-40:** the recipe set has no other shape that matches pearl + rod, and carrot-on-a-stick and warped-fungus-on-a-stick still craft (unit test over `packs/behavior/recipes/*` plus vanilla shapes).
- GIVEN a marked rod reeled 30 times from a block hook, THEN damage reads 0 after each reel. **Negative control:** a plain rod's damage rises over the same sequence.
- A token and a marked rod return undefined from `defForToken`, `defForStack` and `isLegendaryStack` (the plan's "`defForItem`"; names as read in `src/legendary/registry.ts` during reduce v11) (unit test).

**`ipad`:**
- the recipe book shows the Pearl Rod icon;
- the 2×2 inventory grid does not offer it;
- the crafted rod shows the name and lore;
- the durability bar never visibly drops.


- **node**: L0-pear-ac01

### AC-pear-02 · Every vanilla plate binds; the next use teleports once and clears (§8 bullet 2) (L0-pear-ac02)

# AC-pear-02 · Every vanilla plate binds; the next use teleports once and clears (§8 bullet 2)

**Relates to:** L0-pear-pr02, L0-pear-pr03, L0-xasm41.

**`bds`:** one scenario per typeId from `BlockTypes.getAll()` matching `/pressure_plate$/`. The list is printed in the log; it is expected to be 15 or more, including both weighted plates and polished blackstone.
- GIVEN a sim player with a marked rod, standing 6 blocks from plate X, WHEN they cast so that the hook lands in X's cell, THEN within 60 ticks:
  - the rod's record holds X's dimension, cell, typeId, the player's id and epoch;
  - the hook is gone;
  - the lore reads "bound: overworld x y z".
- WHEN the player walks 50 blocks away and uses the rod, THEN no hook survives the use (`L0-adr-prcn`: none spawns on the cancel branch, it is removed at +0 on the remove branch), and the player stands at X's cell (or a neighbour) with a dimension and location read-back within 0.5. The record is cleared.
- **Negative controls:**
  - a hook resting on a stone block next to X → no binding;
  - a hook landing in water above X's level → no binding;
  - an unmarked vanilla rod cast into X → no binding and no properties written.

**`ipad`:**
- after a bind, the rod returns to the idle pose with no lingering line;
- the arrival feels instant: no fall damage, no suffocation, the sound plays.


- **node**: L0-pear-ac02

### AC-pear-03 · Destroyed or replaced plates do not teleport; the use after a trip is a normal cast (§8 bullet 3) (L0-pear-ac03)

# AC-pear-03 · Destroyed or replaced plates do not teleport; the use after a trip is a normal cast (§8 bullet 3)

**Relates to:** L0-pear-ru01, L0-pear-ru03, L0-xcx34.

**`bds`:** each case starts with a bound rod.
- **Destroyed:** the plate is broken by the sim player → the use teleports nobody, the record is cleared, the message is "plate gone or replaced", and no hook survives the use (`L0-adr-prcn`).
- **Replaced, same type, observed:** the plate is broken and re-placed by a player → the same result.
- **Replaced by explosion:** TNT is detonated next to the plate, then the plate is re-placed → the same result.
- **Replaced, different type:** `/setblock` stone plate → oak plate → the same result.
- **After success:** a successful trip, then a second use → a vanilla hook spawns (the cast is not cancelled) and there is no teleport.
- **Negative control** (the permutation is ignored): a zombie stands on the plate (redstone_signal > 0) at use time → the teleport succeeds.
- **Recorded limitation** (scenario asserts the documented behaviour): `/setblock` to the **same** type → the teleport succeeds, marked as the `xcx34` limitation.

**`ipad`:** the failure messages read clearly in both languages.


- **node**: L0-pear-ac03

### AC-pear-04 · Owner death resets the binding; others cannot exploit a transferred bound rod (§8 bullet 4) (L0-pear-ac04)

# AC-pear-04 · Owner death resets the binding; others cannot exploit a transferred bound rod (§8 bullet 4)

**Relates to:** L0-pear-ru01, L0-pear-ent2, C-45.

**`bds`:** two sim players A and B, with a plate bound by A.
- **Transfer:** A drops the rod and B picks it up and uses it → a vanilla hook spawns for B, with no teleport. If B's hook lands in a plate, the record is overwritten with B as owner.
- **Death:** A dies, which bumps `andrew:life_epoch` by 1. The dropped rod is picked up by B → B's use is a vanilla cast. A, respawned, picks the rod back up → A's use is also a vanilla cast. The epoch is checked, not just the id.
- **Death in a chest:** A's rod is in a chest when A dies → after the respawn A takes it out → a vanilla cast. The binding was voided with no inventory search.
- **Death while pending:** A uses the rod and is killed before the preload ends → no teleport, the area is released, and the ticking-area count is back to its baseline.
- **Negative control:** A bound, A alive, the rod round-tripped through a chest and a ground drop → A's use teleports.
- **Note:** the dead sim player stays in `getAllPlayers` (engine fact), so tests read the epoch, not presence. Sim players regenerate, so kills use `kill` or lethal `applyDamage`.


- **node**: L0-pear-ac04

### AC-pear-05 · Distant and unloaded destinations: no range cap, no unsafe teleport (§8 bullet 5) (L0-pear-ac05)

# AC-pear-05 · Distant and unloaded destinations: no range cap, no unsafe teleport (§8 bullet 5)

**Relates to:** L0-pear-pr03, L0-pear-ru02, L0-pear-ad01, C-44.

**`bds`:**
- **Far plate reached:**
  - a plate at +10 000 blocks is placed through a ticking area, then the area is released and the chunk is confirmed unloaded;
  - the binding is written directly (registry stand-in);
  - the player uses the rod → they arrive within 0.5 and the area count returns to baseline.
  - Repeat at 100 K and 1 M if the probe passes; otherwise those distances are recorded deviations.
- **Cross-dimension:** an overworld player with a binding to a Nether plate → arrives in the Nether, if the probe passes; otherwise "other dimensions unsupported" and the binding is kept.
- **Forced preload failure:**
  - all budget slots are held by a test fixture → "server busy", no teleport, binding kept;
  - an injected 1-tick timeout → "destination did not load", no teleport, binding kept, area released.
- **Unsafe destination:** lava poured over the plate and its 8 neighbours, or a block placed at the head height of all 9 → "destination unsafe", no teleport, binding kept.
- **Negative control:** the same far plate with a pre-loaded chunk → success. This proves the failure scenarios fail because of their fault and not the setup.
- The scenarios run BDS-only (checks 19136, private instance), never production.


- **node**: L0-pear-ac05

### AC-pear-06 · Unbound fishing works; items and state survive a reload (§8 bullet 6) (L0-pear-ac06)

# AC-pear-06 · Unbound fishing works; items and state survive a reload (§8 bullet 6)

**Relates to:** L0-pear-ent1, L0-pear-ent2, L0-pear-ru04.

**`bds`:**
- **Fishing:** an unbound marked rod cast into water → a hook spawns and stays. After a bite window the reel yields a vanilla fishing loot item, the damage is 0, and no binding is written.
  - **Negative control:** the same with a plain rod → loot, damage > 0.
- **Restart:** a rod bound by A, in A's inventory, plus a second bound rod in a chest. Restart BDS (scenario pair before and after, as in the existing restart scenarios). Then:
  - both records are intact;
  - A's epoch is unchanged;
  - plate generations are unchanged;
  - A's use teleports;
  - no `andrew_pearl_*` area is left over.
  - Sim players do not survive a restart, so the after half re-spawns A with the same id or uses the registry stand-in. The method is fixed by the probe.
- **Persistence probes** (ac07): the properties survive a reel, a chest, a drop and an anvil rename. A rename that drops the mark is a reported limitation.

**`ipad`:** fishing with the Pearl Rod looks and feels like vanilla; after a world reload the name, lore and binding are unchanged.


- **node**: L0-pear-ac06

### AC-pear-07 · Probe recorded before the build (checks 19136) (L0-pear-ac07)

# AC-pear-07 · Probe recorded before the build (checks 19136)

**Relates to:** L0-pear, L0-pear-cx02, L0-pear-ad01, L0-xasm41, L0-xasm43.

A `probe_pearl_*` criterion set logs one line per question, and each answer is copied into the KV (engine facts) before stage 2. It must state, with measured values:
1. **Hook events:** `projectileHitBlock` on `minecraft:fishing_hook` — fires or not, and which block it reports on a plate.
2. **Resting height:** the hook's rest height per plate typeId, which calibrates the 0.25 threshold.
3. **Owner:** the hook's projectile owner — readable or undefined.
4. **Cancelled cast:** a cancelled `beforeEvents.itemUse` on a vanilla rod — a hook spawns, yes or no (`cx02`).
5. **Durability:** `durability.damage = 0` written after a reel holds on the next read.
6. **Dynamic properties** after a reel, a chest, a drop, an anvil rename and a restart.
7. **`/tickingarea` load** at 10 K / 100 K / 1 M blocks and in the Nether and the End: ticks to `isChunkLoaded`, plus the world cap observed (`probe_tickingarea_load`).
8. **Cross-dimension** `teleport({dimension})` of a sim player, with a read-back.
9. **Recipe:** the 3×3 pattern with blanks — a shifted layout crafts or not (crafter).

**`ipad`** (only the iPad can see these): whether `hook.remove()` resets the cast pose, and whether a cancelled cast flickers a line.

**Pass:** every line is present and the KV is updated. Any "no" re-routes to the fallback named in the owning artifact.


- **node**: L0-pear-ac07

### Pear gl01 concept glossary term (L0-pear-gl01)

**Pearl Rod («Перовый сокровятель»)**

A vanilla `minecraft:fishing_rod` carrying the dynamic property `andrew:pearl_rod` (the rod id), the nameTag «Перовый сокровятель» and the lore "Pearl Rod".
- It is crafted from an Ender Pearl above a Fishing Rod, as `andrew:pearl_rod_token`, which is swapped into the rod.
- It is non-legendary (C-46).

**Synonyms:** Pearl Rod, marked rod, Перовый сокровятель. The spoken name "эндер перо" ("ender feather") means the Ender Pearl ingredient (`xq12`).

**Not to be confused with:** the Orbital Cannon, a custom item with a fishing-rod icon that is not a rod.


- **node**: L0-pear-gl01

### Pear gl02 concept glossary term (L0-pear-gl02)

**Binding (привязка)**

The record on a Pearl Rod: `{dim, plate cell, plate typeId, owner id, owner life epoch, plate generation}`.
- It is created when the rod's hook comes to rest in a pressure-plate cell.
- It is **honoured** only for the same owner with the same epoch.
- It is **cleared** by a successful teleport or a missing or replaced plate.
- It is **void** (ignored, then overwritten) after the owner's death.

**States:** unbound / bound / honoured (bound + the owner's matching epoch).


- **node**: L0-pear-gl02

### Pear gl03 concept glossary term (L0-pear-gl03)

**Life epoch**

The player dynamic property `andrew:life_epoch`, incremented on each death of that player. State tied to "the player who did X" stores the id plus the epoch, so one death voids every copy everywhere without a search (C-45).

**Synonyms:** owner epoch, life counter.


- **node**: L0-pear-gl03

### Pear gl04 concept glossary term (L0-pear-gl04)

**Plate generation**

A per-cell counter in a world dynamic property (`andrew:pg:<dim>:<x>:<y>:<z>`). It is bumped whenever an observed path (player break or place, explosion, piston) touches a watched plate cell or its support. It stands in for block identity, which Bedrock blocks do not have (`xcx34`). A mismatch at teleport time means the plate was replaced.

**Related term:** watched cell (`andrew:pg_watch`): a plate cell that some rod is bound to.


- **node**: L0-pear-gl04

### Pear gl05 concept glossary term (L0-pear-gl05)

**Ticking-area budget**

The engine's world-wide cap of 10 ticking areas. It is shared by `spawn-search` (`andrew_find_*`), the structure ring loaders (`andrew_ring_*`) and the Pearl Rod preload (`andrew_pearl_*`), and handed out by a single allocator with one slot reserved for the Pearl Rod (`L0-pear-ad01`).

**Synonyms:** area pool, preload slot.


- **node**: L0-pear-gl05

### AC-trdt-001 (bds) · Recipe, buckets, one craft per world, Creative copy (L0-trdt-a001)

# AC-trdt-001 (bds) · Recipe, buckets, one craft per world, Creative copy

**Links.** relates_to: L0-trdt-adrf, L0-xasm33, L0-lgnd.

- **Craft.** GIVEN a crafter loaded with ` G / BTB / G `, WHEN it crafts, THEN:
  - one marked `andrew:above_water_trident` exists;
  - exactly 2 empty buckets come back (P1 branch);
  - the craft flag is set.
- **Full inventory.** GIVEN the same craft with every slot full, THEN inventory buckets plus nearby bucket item entities = 2, and no trident or token is lost.
- **Blocked craft.** GIVEN the flag is set and the server restarts, WHEN the recipe is crafted again, THEN:
  - no trident results;
  - the inventory gains 2 golden apples, 1 trident and 2 water buckets;
  - it holds 0 extra empty buckets (the exchange); total buckets of either kind = 2.
- **Creative copy.** GIVEN a Creative copy is given (no mark), THEN the craft flag is unchanged and that copy is never voided.


- **node**: L0-trdt-a001

### AC-trdt-002 (bds) · Melee and thrown = vanilla + 2 against armour; one strike (L0-trdt-a002)

# AC-trdt-002 (bds) · Melee and thrown = vanilla + 2 against armour; one strike

**Links.** relates_to: L0-trdt-r002, L0-trdt-addm, L0-adr-twlt.

- **Melee.** GIVEN a zombie in full iron armour and a sim player with the trident, WHEN one melee hit lands, THEN the `entityHurt` damage equals `afterArmour(vanillaMelee + 2)` ± 0.01, using the P2-measured vanilla value against the same armour.
- **Thrown.** The same check with a thrown hit and `vanillaThrown + 2`.
- **In-window negative control.**
  - A second trident melee hit within 10 ticks that is ≤ the window's last gets no bonus and no strike.
  - A plain `applyDamage(2)` after a landed hit is swallowed, which proves the window is armed.
- **Strike.** For each landed hit:
  - `visualStats()` counts exactly 1 strike;
  - `getEntities({type: "minecraft:lightning_bolt"})` is empty for 40 ticks;
  - no fire block appears within 3 blocks;
  - a pig target stays a pig.
- **Not living.** An armour stand gets no strike and no bonus.
- **Lethal.** A lethal hit on a totem holder pops the totem.


- **node**: L0-trdt-a002

### AC-trdt-003 (bds) · Dash, fall grant, swim boost (L0-trdt-a003)

# AC-trdt-003 (bds) · Dash, fall grant, swim boost

**Links.** relates_to: L0-trdt-pmov, L0-adr-twrp, L0-xasm36, L0-xasm37.

- **Dash.** GIVEN a dry platform, clear weather, and a sneaking sim player releasing after 10 ticks of charge, THEN:
  - horizontal displacement is within ± 20 % of the P4 Riptide III value;
  - this holds in the Overworld, the Nether and the End;
  - a second dash right after also launches (no cooldown);
  - a release under 10 ticks moves nothing.
- **Fall.** WHEN the dash ends in a fall worth ≥ 5 HP, THEN the first landing deals 0. A following fall from the same height deals normal damage (drop − 3). An unused grant expires after 10 s.
- **Swim.** A sprint-swimming sim player:
  - holding the trident (main hand, then off hand) has horizontal speed 5.6 b/s ± 15 %;
  - without it, its speed equals the P6 baseline ± 10 %;
  - after a hotbar switch, the speed falls back within 2 ticks.


- **node**: L0-trdt-a003

### AC-trdt-004 (bds) · Throw, return, custody fallbacks (L0-trdt-a004)

# AC-trdt-004 (bds) · Throw, return, custody fallbacks

**Links.** relates_to: L0-trdt-pthr, L0-trdt-pfbk, L0-trdt-r001, L0-xcx30.

- **Return speed.** A throw at a wall 20 blocks away: the return starts on the block hit, covers 20 blocks in 2.0 s ± 5 %, passes through the wall, and the copy is re-inserted into the selected slot.
- **Re-throw.** During the return, the thrower holds no copy and a release does nothing. The live-copy count is 1 at every tick (`r001` observer).
- **Entity hit.** A hit on a zombie triggers the return from the hit point.
- **Mid-flight fallbacks**, each ending with exactly one live copy:
  - **thrower dies:** after respawn the copy is in their inventory;
  - **thrower leaves** (sim player removed): the owed entry is redeemed on the next spawn;
  - **thrower switches dimension:** delivered directly, with a message;
  - **entity unloaded:** delivered;
  - **30 s return cap:** delivered.
- **Restart.** A restart mid-return delivers on load. The pre-restart entity is removed by `entityLoad` with a `stale` log, and no second copy appears.
- **Through `lgnd` with def #7:** the Void, chest, fire, lava and explosion scenarios pass.


- **node**: L0-trdt-a004

### AC-trdt-005 (bds) · Enchantment scrub; magnet and lgnd touch points (L0-trdt-a005)

# AC-trdt-005 (bds) · Enchantment scrub; magnet and lgnd touch points

**Links.** relates_to: L0-trdt-r003, L0-trdt-adcl, L0-magn.

- **Scrub.** GIVEN a trident with Loyalty III, Riptide III and Unbreaking III put in the inventory (via `/replaceitem`, an anvil-equivalent write), WHEN it is observed, THEN Loyalty and Riptide are gone and Unbreaking III stays. This also holds after a throw and return, and after an lgnd death restore.
- **Magnet.** The magnet's legendary scenarios include def #7 (on the ground, in a chest, held by a mob). A custody entity inside the magnet zone is never selected or moved.
- **Departure watch (T3).** A throw logs no `left an inventory` recovery line and mints no copy within 40 ticks.


- **node**: L0-trdt-a005

### AC-trdt-006 (ipad) · Andrey's acceptance sheet (L0-trdt-a006)

# AC-trdt-006 (ipad) · Andrey's acceptance sheet

**Links.** relates_to: L0-xq9, L0-xq10, L0-adr-twrp, L0-adr-twlt.

On Andrey's iPad, against production, Andrey confirms:
- **Sneak gesture:** a crouched release dashes, a standing release throws.
- **Dash feel:** it reads like Riptide, even without the spin pose.
- **Swim feel.**
- **Flight and return:** the flight is visible, and the return can be seen passing through blocks.
- **Lightning:** the strike reads as lightning.
- **Icon:** it shows in the hotbar and inventory.
- **Creative:** the item is in the "Equipment" tab.
- **Recipe book:** the recipe appears in it.

Each line records a yes or no, or a tuning note, on the acceptance sheet. Reported limitations are listed on the sheet: no spin pose, no lightning entity, the anvil preview, the sneak gesture default.


- **node**: L0-trdt-a006

### Trdt g001 concept glossary term (L0-trdt-g001)

**Custody**

The state of a legendary copy that is neither in a slot nor on the ground, because it was thrown: a custody record plus at most one custody entity (the flying projectile or the returning entity). C-33 lists it as one of the four places a copy may be. It ends with exactly one re-insert or one `deliverToLastHolder` call.

**Synonyms:** in flight, in-flight copy. **Not to be confused with** the lgnd `inFlight` map in `recovery.ts`, which tracks stacks that just left a slot.


- **node**: L0-trdt-g001

### Trdt g002 concept glossary term (L0-trdt-g002)

**throwId**

The identifier of one throw. It is the key of the custody record, and the custody entity carries it as the entity dynamic property `andrew:tr.throw`. It ties an entity to its record across a restart without relying on `Entity.id`. It is also the idempotency key for the thrown +2 and the strike.


- **node**: L0-trdt-g002

### Trdt g003 concept glossary term (L0-trdt-g003)

**Fall grant**

A one-shot, per-player permission set by each trident dash. It cancels the first fall damage that follows. It is consumed by that cancel or by a damage-free landing, and expires after 10 s (`xasm36`). A new dash refreshes it; grants never stack.

**Related:** the katana's `FALL_FLAG_MS` and teleport method in `src/katana/fall.ts`, the fallback path.


- **node**: L0-trdt-g003

### AC-uwbw-001 (bds) · Mace and rocket recipes run alongside vanilla and give vanilla items (L0-uwbw-a001)

# AC-uwbw-001 (bds) · Mace and rocket recipes run alongside vanilla and give vanilla items

**Links.** relates_to: L0-uwbw-r004, L0-uwbw-prcp. Spec §5 bullet 1.

- **Mace.** GIVEN a Crafter loaded with Iron Block over Breeze Rod, WHEN it crafts, THEN exactly 1 `minecraft:mace` drops with no lore and no dynamic properties, and its durability equals a vanilla Mace's max.
- **Vanilla Mace.** GIVEN Heavy Core over Breeze Rod, THEN 1 `minecraft:mace` also drops.
- **Rockets.** GIVEN Paper over String, THEN exactly 3 `minecraft:firework_rocket` drop. GIVEN Paper + Gunpowder (shapeless), THEN vanilla rockets still drop.
- **Shape uniqueness (unit, `in_process`).** No shape in `packs/behavior/recipes/*.json` or the vanilla list collides with ` R / BWB / S `, `I / Z` or `P / S`.
- **Negative control.** Iron *Ingot* over Breeze Rod, and Paper over Stick, craft nothing.


- **node**: L0-uwbw-a001

### AC-uwbw-002 (bds) · Bow recipe, 2 buckets, once per world, Creative copy (L0-uwbw-a002)

# AC-uwbw-002 (bds) · Bow recipe, 2 buckets, once per world, Creative copy

**Links.** relates_to: L0-lgnd, L0-trdt-adrf, C-34, L0-uwbw-r004.

- **Craft.** GIVEN a Crafter with ` R / BWB / S `, WHEN it crafts and a sim player picks up the token, THEN:
  - one marked `andrew:underwater_bow` exists;
  - exactly 2 empty buckets come back (inventory plus nearby item entities = 2);
  - the `ub` craft flag is set.
- **Blocked craft.** GIVEN the flag is set and the server restarts, WHEN the recipe is crafted again, THEN no bow results, and the refund is 1 lightning rod, 1 bow, 2 water buckets and 1 sand, with 0 empty buckets.
- **Creative copy.** GIVEN a Creative copy (no mark), THEN the flag is unchanged.
- **Durability and enchanting.** The item has no durability component, and its enchantable slot is `bow`: Power V + Infinity apply, and Mending + Infinity are refused, as for a vanilla bow.
- **Negative control.** The same craft with one water bucket swapped for an empty bucket gives nothing.


- **node**: L0-uwbw-a002

### AC-uwbw-003 (bds) · Arrows keep air speed in water and lava (L0-uwbw-a003)

# AC-uwbw-003 (bds) · Arrows keep air speed in water and lava

**Links.** relates_to: L0-uwbw-pfly, L0-uwbw-adfl, C-42. Spec §5 bullet 2.

- **Water.** GIVEN a sim player firing a full-draw shot along a 16-block water channel and the same shot through air, THEN after 10 ticks the bow's arrow in water is within ± 10 % of the air arrow's distance and drop.
- **Lava.** GIVEN the same shot through 16 blocks of lava, THEN the arrow stays valid until it hits the target block at the far end, within ± 10 % of the air distance.
- **Attribution.** An arrow fired by a vanilla `minecraft:bow` in the same test is **not** marked, and its water distance is < 50 % of air.
- **Negative control.** With the liquid handling disabled by a test flag, the bow's water arrow falls short by > 50 %. This proves the measurement can go red.


- **node**: L0-uwbw-a003

### AC-uwbw-004 (bds) · Normal fire and Super Fire differ (L0-uwbw-a004)

# AC-uwbw-004 (bds) · Normal fire and Super Fire differ

**Links.** relates_to: L0-uwbw-r002, L0-uwbw-esfr. Spec §5 bullet 2.

- **Normal hit, dry.** GIVEN a normal hit on a zombie on dry ground, THEN it reads on fire, and the fire lasts 2 s ± 2 ticks (Flame: max(2, Flame)).
- **Normal hit, wet.** GIVEN a normal hit on a target standing in water, THEN it takes no fire damage after 1 s.
- **Armed hit, wet.** GIVEN an armed hit on a target standing in water, THEN it takes exactly 5 `fireTick` hurts of 1 HP at 20-tick spacing (entityHurt witness), and none after 5 s + 2 ticks.
- **Blocks and immunity.** No fire block appears within 3 blocks. A blaze target takes 0 burn.
- **Negative control.** A normal hit in water yields 0 `fireTick` hurts in the same window.


- **node**: L0-uwbw-a004

### AC-uwbw-005 (bds) · A miss keeps the charge; a hit starts 30 s (L0-uwbw-a005)

# AC-uwbw-005 (bds) · A miss keeps the charge; a hit starts 30 s

**Links.** relates_to: L0-uwbw-r001, L0-uwbw-parm, L0-uwbw-earm. Spec §5 bullet 3.

- **Miss.** GIVEN an armed sim player, WHEN the armed arrow hits each of these in turn:
  - a block;
  - a raised front shield;
  - an armour stand;
  - and it then despawns,

  THEN `ub:armed` stays true, the cooldown reads 0, and the HUD reads armed.
- **Hit.** WHEN the next arrow hits a zombie, THEN:
  - `ub:armed` is false;
  - the cooldown reads 600 ± 1 ticks;
  - the HUD reads cooldown;
  - one strike witness is logged.
- **Cooldown.** Arming during the cooldown is refused; at expiry the HUD reads ready.
- **Order.** A shot fired *before* arming never spends the charge.
- **Negative control.** An unarmed hit starts no cooldown.


- **node**: L0-uwbw-a005

### AC-uwbw-006 (bds) · The armed hit is exactly 14 before armour, with a zero-damage strike (L0-uwbw-a006)

# AC-uwbw-006 (bds) · The armed hit is exactly 14 before armour, with a zero-damage strike

**Links.** relates_to: L0-uwbw-r003, L0-uwbw-adex, L0-strm.

- **No armour.** GIVEN an armed hit on an unarmoured zombie at full HP, THEN the post-hit loss reads 14.00, whatever the draw, Power or crit.
- **Armour.** GIVEN iron and diamond + Protection IV targets, THEN the loss equals `afterArmour(14)` from the recorded formula, ± 0.01.
- **Lethal.** GIVEN a 10 HP sim player with a totem, THEN the totem pops and the player survives.
- **Strike.** `playStrikes` runs once per hit key. No `minecraft:lightning_bolt` entity exists, no other entity within 5 blocks loses HP, and no fire block is placed.
- **Player target.** The same holds on a sim player.
- **Negative control.** An unarmed full-draw hit on the same zombie reads the vanilla value (≠ 14).


- **node**: L0-uwbw-a006

### AC-uwbw-007 (bds) · A restart keeps uniqueness and recovery; the charge persists (L0-uwbw-a007)

# AC-uwbw-007 (bds) · A restart keeps uniqueness and recovery; the charge persists

**Links.** relates_to: L0-lgnd, L0-uwbw-earm. Spec §5 bullet 7.

- **Uniqueness.** GIVEN the bow was crafted, WHEN BDS restarts, THEN the craft flag still blocks a second craft (refund path).
- **Death.** GIVEN the owner dies with the bow, THEN it returns on respawn.
- **Void.** GIVEN the bow item is dropped into the Void, THEN it returns to its last owner.
- **Destruction.** Lava, fire and cactus do not destroy it.
- **Pending recovery.** A pending recovery survives a restart and is delivered at the next join.
- **The charge.** GIVEN `ub:armed` is true, WHEN the player logs out and back in, and after a restart, THEN it is still armed and the HUD reads armed.
- **Magnet.** The `magn` legendary scenarios include def #8.
- **Negative control.** A Creative copy dropped into the Void is not recovered.


- **node**: L0-uwbw-a007

### AC-uwbw-008 (ipad) · Feel and look on Andrey's iPad (L0-uwbw-a008)

# AC-uwbw-008 (ipad) · Feel and look on Andrey's iPad

**Links.** relates_to: L0-uwbw-eitm, L0-uwbw-parm, L0-xasm39. Reopen after every epic merge.

1. **Draw.** The draw feels like a vanilla bow: the pull stages show in hand and in third person, and the release speed is the same.
2. **HUD.** It shows "ready", then "armed" after sneak-draw, then a countdown after a hit, and a miss leaves it on "armed". This is checked in RU and EN.
3. **Lightning.** The armed hit shows the lightning visual, and nearby mobs and players take no damage.
4. **Underwater fire.** Super Fire's flame or particles are visible on a target in water and stop at 5 s. A normal hit's fire goes out in water.
5. **Icon.** The icon and the Creative entry are visible, readable, and in the item icon house style.
6. **Recipe book.** The bow, the Mace and the rockets appear and craft from it; the 2 buckets come back.
7. **Rockets.** A rocket from Paper + String boosts an Elytra, with a flight length like flight 1 (`xasm39`). Otherwise the limitation is recorded.


- **node**: L0-uwbw-a008

### Uwbw g001 concept glossary term (L0-uwbw-g001)

**Armed charge** (`ub:armed`)

This is the Underwater Bow's one-shot ability state. It is switched on by sneak + the start of Use, and it marks the next arrow fired as an **armed shot** (`ub:armedShot`). A **successful hit** spends it (R-uwbw-001); a miss keeps it. It persists through logout, restart and death.

**Synonyms:** charge, armed state; RU «заряд».
**HUD states:** ready, armed, cooldown.


- **node**: L0-uwbw-g001

### Uwbw g002 concept glossary term (L0-uwbw-g002)

**Super Fire** (RU «Суперогонь»)

This is a scripted 5 s burn applied by an armed hit. It deals 1 HP/s with cause `fireTick` (marked as scripted). Water does not put it out, it places no fire block, and it refreshes rather than stacks. In water its visual is particles. See E-uwbw-sfr and C-43.

**Contrast:** "normal fire" is the vanilla `setOnFire` from a normal hit, which water does put out.


- **node**: L0-uwbw-g002

### Uwbw g003 concept glossary term (L0-uwbw-g003)

**Successful hit** (RU «успешный выстрел/попадание»)

An armed arrow landing on a **living entity** (a player or a mob; not an armour stand, vehicle or frame, and not the shooter), with hurt before-event damage > 0 that the hurt window or a shield did not swallow. Only a successful hit spends the charge and starts the 600-tick cooldown.

**Miss:** anything else, including a block, a shield, a despawn, or an invulnerable target.


- **node**: L0-uwbw-g003

### Uwbw g004 concept glossary term (L0-uwbw-g004)

**Liquid-neutral arrow**

An arrow from the Underwater Bow that keeps its air velocity and gravity in water and lava, within ± 10 % (C-42), and that lava does not destroy before it hits. It is built either by tagging the vanilla arrow and restoring its velocity (the default) or by swapping it for a custom projectile with `liquid_inertia` 0.99 (ADR-uwbw-fl).

**Related:** the arrow swap (the `sclk` entitySpawn +0 swap); `trident_in_flight`.


- **node**: L0-uwbw-g004

