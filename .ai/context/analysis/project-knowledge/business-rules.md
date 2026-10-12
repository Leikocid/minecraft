---
title: Business Rules
type: project-knowledge
generated_at: "2026-10-12T18:21:49.794Z"
source_channel: rollout
node_id: rollout-business-rules
aliases: ["rollout-business-rules","business-rules","project-knowledge/business-rules"]
is_a: ["rollout","business-rules"]
relates_to: ["L0","L0-ench-r001","L0-ench-r002","L0-ench-r003","L0-ench-r004","L0-ench-r005","L0-pear-ru01","L0-pear-ru02","L0-pear-ru03","L0-pear-ru04","L0-trdt-cons","L0-trdt-r001","L0-trdt-r002","L0-trdt-r003","L0-uwbw-cons","L0-uwbw-r001","L0-uwbw-r002","L0-uwbw-r003","L0-uwbw-r004"]
priority: 650
---

# Business Rules

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Global Constraints (v11) (L0)

---
title: "Global Constraints (v11)"
aliases: ["L0-constraint", "Constraints"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0", "L0-pear", "L0-uwbw", "L0-ench", "L0-adr-prbd"]
see_also: ["underwaterbowfinalspecv3ruen-part-4", "underwaterbowfinalspecv3ruen-part-5", "constraints"]
supersedes: ["L0-constraint@v10"]
---
# Global Constraints (v11)

**Carried unchanged:** C-1 … C-29, C-30′, C-31 … C-43, C-5a′, C-5d, C-5e, C-5f, C-7″, C-12′, C-20⁗, C-20⁵, C-20⁶. Spec v3 §1–§5 equal v2, so C-38 … C-43 and C-20⁶ are unchanged. The ones v11 leans on most:
- **C-2:** stable 2.10.0, no Experiments.
- **C-16:** the closest stable equivalent, with the limitation *reported*. v3's closing note extends this explicitly to "distant chunk loading".
- **C-38:** native systems are verified before anything is claimed. It now covers the fishing hook and chunk preloading as well as the enchanting table.
- **C-40:** recipe shape collisions. The Pearl Rod's ` P / R ` shape is checked against carrot-on-a-stick, warped-fungus-on-a-stick and every add-on recipe.

| ID | Constraint | Source |
|---|---|---|
| C-44 | *(new)* **A teleport is verified, never faked.** A scripted teleport to a stored location runs these steps in order:<br>1. Make the destination chunk loaded and ticking (a pooled ticking area, polled with `isChunkLoaded`, with a bounded timeout).<br>2. Re-read the target block and compare its typeId with the record.<br>3. Find a safe spot: two passable, non-harmful cells over a solid floor, with no lava, fire, magma, cactus, powder snow or sweet berry bush in the feet or head cell. Try the plate cell first, then its 8 horizontal neighbours.<br>4. Teleport.<br>5. Read the player's dimension and location back.<br>Only a matching read-back counts as success and clears the binding. Every other outcome sends the player a specific message and changes nothing else: the timeout, a pool exhausted, the plate missing or changed, no safe spot, a dimension refused, or the player dead or offline at the end. No distance cap is applied beyond the world border. Every ticking area is released on every path. | spec v3 §7, §8 |
| C-45 | *(new)* **Personal state is bound to a player's life, not to an item.** State the spec grants to "the player who did X", such as the Pearl Rod's binding, records the player id **and a life epoch** read from that player's persistent dynamic property. Each player death increments the epoch. The state is honoured only for the same id with the same epoch, so a death voids every copy everywhere, in an inventory, a chest, a drop or a stranger's hand, with no search. For any other holder the item behaves as unbound. Item-borne state survives a restart, logout, a chest and a drop, and stays valid only while its owner's epoch is unchanged. | spec v3 §7 |
| C-46 | *(new)* **A non-legendary scripted item never enters the legendary machinery.** Its token, mark and dynamic properties must not match `lgnd` `defForToken` or `defForItem`, or any retention, Void or recovery hook. It drops, despawns, burns and breaks under vanilla world rules. A shared token-swap helper extracted from `craftgate.ts` must leave the legendary gate's behaviour and scenarios unchanged. | spec v3 §6, §7 |
| C-20⁷ | *(extended)* v11 acceptance needs:<br>• the craft at fixed 3×3 positions, failing when shifted or in the 2×2 grid, and repeatable;<br>• durability damage 0 after N reels, including a hooked mob;<br>• a binding on **each** vanilla plate type, enumerated at runtime from `BlockTypes` (`*pressure_plate`), not hard-coded;<br>• one teleport, then the binding is cleared and the next use casts;<br>• a broken plate gives no teleport, and so does one replaced by another type;<br>• the owner's death voids the binding, including a rod picked up by a second SimulatedPlayer, and a transferred rod casts normally for its new holder;<br>• a far plate (≥ 10 K blocks) is reached through the preload;<br>• a forced preload failure gives no teleport and an error message;<br>• a restart keeps the binding and the epoch;<br>• unbound fishing still works.<br>Each bullet has a negative control (C-20). | spec v3 §8 |




- **node**: L0

### R-ench-001 · Eligibility comes from vanilla data, and curses never appear (L0-ench-r001)

# R-ench-001 · Eligibility comes from vanilla data, and curses never appear

**is_a:** rule · **part_of:** L0-ench · **relates_to:** L0-ench-r003, L0-ench-ac04, L0-ench-ac06, L0-ench-adr1

**Rule.**
1. An item's eligible set is exactly the vanilla 1.26.51 enchantment set for its `minecraft:enchantable` slot(s). That covers vanilla items and custom items with an `enchantable` component, for example def #8 with slot `bow`.
2. Treasure enchantments are **included** (Mending, Frost Walker, Soul Speed, Swift Sneak, Wind Burst, and whatever else the probe lists).
3. The curses `binding` and `vanishing` are **always removed**, at a rate of 0 % with no exceptions (spec §4, "Проклятия НИКОГДА").
4. Levels never exceed the vanilla maximum.
5. An item without an `enchantable` component gets no roll at all.

**Data, not inference.** The table is a static map in `roll.ts`, generated once from the 1.26.51 data. A `bds` parity scenario (`ac06`) proves that the engine's `canAddEnchantment` agrees with it for each item and enchantment. A mismatch fails the check: the roller must never offer what the engine refuses, nor miss what it accepts.

**Usefulness is not filtered.** Mending or Unbreaking on an item with no durability (legendaries) stays eligible if the slot admits it, because the spec says "all compatible" (`L0-ench-asm1`).

**Source:** spec v2 §4 Goal; §5 bullets 4 and 6.




- **node**: L0-ench-r001

### R-ench-002 · Vanilla conflict groups are never combined (L0-ench-r002)

# R-ench-002 · Vanilla conflict groups are never combined

**is_a:** rule · **part_of:** L0-ench · **relates_to:** L0-ench-r001, L0-ench-ac04

**Rule.** No roll result ever holds two members of the same conflict group. Each group is mutually exclusive inside itself.

| Group | Members (Bedrock ids) |
|---|---|
| Protection | protection, fire_protection, blast_protection, projectile_protection |
| Damage | sharpness, smite, bane_of_arthropods |
| Mace damage | density, breach, smite, bane_of_arthropods |
| Mining | silk_touch, fortune |
| Boots | depth_strider, frost_walker |
| Bow | infinity, mending |
| Crossbow | multishot, piercing |
| Trident | riptide vs loyalty; riptide vs channeling |

The table is the *expected* 1.26.51 set. The probe's `canAddEnchantment` pass is authoritative: for each pair it adds A, then asks about B. Any pair the engine refuses joins a group, and any pair it accepts leaves one. Spear enchantments (Lunge) take whatever the probe measures.

**Order.** Conflicts are resolved when a member is chosen: later picks lose. The rare stage's guaranteed member is chosen first, so it can never be pushed out by a standard pick.

**Enforcement.** The final guard in `L0-ench-roll` step 6 throws on any conflicting pair. A fuzz test (`ac04`) runs ≥ 10 000 random requests over every item and every tier, and expects 0 throws and 0 pairs.

**Source:** spec v2 §4 ("несовместимые чары не совмещаются"); §5 bullet 6.




- **node**: L0-ench-r002

### R-ench-003 · Per-def forbidden lists beat the table, and the C-37 scrubs keep running (L0-ench-r003)

# R-ench-003 · Per-def forbidden lists beat the table, and the C-37 scrubs keep running

**is_a:** rule · **part_of:** L0-ench · **relates_to:** L0-xcx32, L0-trdt, L0-sclk, L0-ench-ac04

**Rule.**
1. **The roller never emits an enchantment that a def forbids.** There are two sources today:
   - `FORBIDDEN_ENCHANTMENTS` (`src/legendary/enchant.ts:10`): the Above-Water Trident never gets `loyalty` or `riptide` (R-trdt-003);
   - `PIERCING` for `SCULK_CROSSBOW` (`src/sculk/enchant.ts:7`, L0-sclk-r005).

   `roll.ts` reads both through a single `forbiddenFor(itemId)` accessor and copies neither list. A new def that forbids something joins automatically.
2. **The C-37 scrubs are never removed or bypassed by this component.** Any approved adapter applies its result and then lets the existing scrub run on the same stack in the same tick (or the hand-change path). So a forbidden enchantment that still arrives some other way (an anvil, a command, a vanilla table offer under option (c)) is stripped as before.
3. **Purity.** The accessor lives in a pure module that both the scrubs and the roller import. It must not drag `@minecraft/server` into `roll.ts`.

**Why.** This is the second facet of `xcx32`: "offers ALL compatible" would otherwise re-offer exactly what C-37 removes. The default, accepted in `L0-adr-enrl`, is that the per-def list wins.

**Source:** C-37; `L0-xcx32` second facet; the plan's reduce seam ("the roller's pool excludes `FORBIDDEN_ENCHANTMENTS` and the crossbow's Piercing").




- **node**: L0-ench-r003

### R-ench-004 · The 20 % rare stage (L0-ench-r004)

# R-ench-004 · The 20 % rare stage

**is_a:** rule · **part_of:** L0-ench · **relates_to:** L0-xasm39, L0-ench-gl01, L0-ench-ac02

**Rule.** For each **valid generation** (one roll result for an item whose eligible set holds at least one formerly table-inaccessible enchantment; `xasm39`):
- **with p = 0.20,** the result holds **at least one** eligible rare enchantment;
- **with p = 0.80,** it is the standard vanilla pool and holds **none**.

If the item has no eligible rare, the standard pool is used, and the generation is excluded from the 20 % statistic.

**Independence.** The rare stage is a separate draw from the level rule (`r005`). The spec says these are different stages, and the RNG draws are not shared.

**Statistic (C-39).** For n generations, the count of results with ≥ 1 rare member must fall within np ± 3√(np(1−p)):
- n = 1 000 → [162, 238];
- n = 10 000 → [1 880, 2 120].

The test runs once with a fixed seed and once unseeded. It is tested for each item class: mace, boots, a bow, a trident, and a custom def.

**Why "none" on a miss.** The spec's split is "20 % include … otherwise 80 % standard pool". If a miss could still draw a rare in the fill, the observed rate would rise above 20 % and the acceptance bullet would fail by construction.

**Source:** spec v2 §4 Distribution; §5 bullet 4.




- **node**: L0-ench-r004

### R-ench-005 · Wind Burst and Unbreaking levels: 70/40/20 independent rolls, highest wins (L0-ench-r005)

# R-ench-005 · Wind Burst and Unbreaking levels: 70/40/20 independent rolls, highest wins

**is_a:** rule · **part_of:** L0-ench · **relates_to:** L0-xasm39, L0-ench-gl02, L0-ench-ac03

**Rule.** When `wind_burst` or `unbreaking` is chosen, **in either branch of the rare stage**, the roller:
1. draws three independent rolls: I succeeds when u₁ < 0.70, II when u₂ < 0.40, III when u₃ < 0.20;
2. takes the highest successful level;
3. uses **I** if none succeeds (the safe fallback);
4. caps the result at `min(vanillaMax = 3, tierCap)`, where `tierCap` is I / II / III for tiers 1 / 2 / 3 (`xasm39`, "context max"). The spec says to use the highest level the context allows.

These are independent probabilities, not shares of 100 %.

**Expected distribution at tier 3:**
- P(III) = 0.20;
- P(II) = 0.40 × 0.80 = 0.32;
- P(I) = 0.48. This is 0.7·0.6·0.8 from a successful I roll, plus 0.3·0.6·0.8 from the fallback.

At tier 2, P(II) = 0.52 and P(I) = 0.48. At tier 1, P(I) = 1.

**Statistics (C-39, n = 1 000 at tier 3, ±3σ):**
- III ∈ [162, 238];
- II ∈ [276, 364];
- I ∈ [433, 527].

The I-roll does not change the output distribution, so the test **also** checks the trace (`ent1`). Each roll's own success rate must sit within ±3σ of 0.70, 0.40 and 0.20, and all three rolls must be drawn every time, never short-circuited. This proves the "independent checks" wording in §5 bullet 5, not just the final shape.

**Other enchantments** do not use this rule (`L0-ench-asm1`).

**Source:** spec v2 §4 (level paragraph); §5 bullet 5.




- **node**: L0-ench-r005

### Rule: a binding is honoured only for its living binder, and is cleared only by success or a dead plate (L0-pear-ru01)

# Rule: a binding is honoured only for its living binder, and is cleared only by success or a dead plate

**Is a:** rule. **Part of:** L0-pear. **Relates to:** L0-xasm42, C-44, C-45, L0-pear-pr03.

1. **Who may use the binding.** It is honoured only when `pr_owner === user.id` **and** `pr_epoch === user's current andrew:life_epoch`. For any other holder the rod is unbound, and a use is a vanilla cast, which may then bind it afresh and overwrite the record. Spec: «Передача/выбрасывание не дают другому игроку права…».
2. **Death.** Every player death increments the epoch, so every binding that player made is void wherever the rod is. That holds even if the same player picks the rod up again after respawning. Spec: «При смерти привязавшего игрока все его активные привязки… сбрасываются».
3. **Clears the binding:**
   - a successful teleport with a matching read-back;
   - the plate typeId differs from the record, or is no longer a plate;
   - the plate generation differs;
   - a new binding (overwrite).
4. **Keeps the binding (and reports):**
   - the preload timed out (200 ticks);
   - the ticking-area budget is exhausted;
   - another dimension was refused;
   - no safe spot;
   - the read-back mismatched;
   - the rod left the inventory mid-wait.
5. **One trip per binding.** After a success, the next use is a vanilla cast (§8).
6. **No queueing.** A use while a teleport is pending is cancelled with a message.
7. **Every outcome sends the player a specific message**, except death. No outcome reports success without the read-back (C-44).

**Rationale:** spec §7 and §8; outcome table `xasm42`; C-44 and C-45. Negative controls in `L0-pear-ac03` and `L0-pear-ac04`.




- **node**: L0-pear-ru01

### Rule: safe arrival spot (L0-pear-ru02)

# Rule: safe arrival spot

**Is a:** rule. **Part of:** L0-pear. **Relates to:** C-44, L0-pear-pr03.

**Candidates, in order:**
1. the plate cell P (feet in P, standing on the support);
2. then P's 8 horizontal neighbours in a fixed order: N, E, S, W, NE, SE, SW, NW. The order is fixed so tests are deterministic.

No vertical search: the spec says "над ней или рядом" (above it or beside it).

**A candidate cell F is safe when all of these hold:**
- **Feet F and head F+1 are passable:** air, a plate, carpet, a sign, a torch, a button, snow layers ≤ 1, flowers or grass. Determined by `block.isAir || block.isLiquid === false && block in the passable table`. No runtime `isSolid` exists in 2.10.0 (engine fact), so a typeId allow-list is kept in `safe-spot.ts`.
- **Neither F nor F+1 contains** lava, fire or soul fire, magma, cactus, powder snow, sweet berry bush, wither rose, or water deeper than F.
- **The floor F−1 is a full solid block,** by a typeId deny-list of non-solid or harmful floors: air, liquids, magma, campfire, cactus, powder snow, scaffolding.
  - For P itself the floor is the plate's support, which is solid by construction. A plate cannot sit on air.
- **F lies inside the dimension's height range,** and F+1 < `heightRange.max`.

**Arrival point:** `(F.x + 0.5, F.y, F.z + 0.5)`. The facing is unchanged.

**No candidate safe** → no teleport, the binding is kept, and the player sees "destination unsafe" (`xasm42`).

**Limitations:**
- Mobs standing at the spot are not considered.
- Liquids flowing in after the check, within the same tick, are not considered.




- **node**: L0-pear-ru02

### Rule: plate identity = typeId + observed-path generation (proposed close of `xcx34`) (L0-pear-ru03)

# Rule: plate identity = typeId + observed-path generation (proposed close of `xcx34`)

**Is a:** rule. **Part of:** L0-pear. **Relates to:** L0-xcx34, L0-pear-ent2.

A binding names a plate by `{dim, cell, typeId, generation}`. At teleport time the plate counts as **the same plate** only if:
- the cell's typeId equals the recorded typeId (the permutation is ignored, because `redstone_signal` changes on every press); **and**
- the world generation at that cell equals the recorded one.

**Generation bump sources.** Each bump is applied only to watched cells (`andrew:pg_watch`) and only in the plate's own dimension.

| Path | Event | Cells checked |
|---|---|---|
| A player breaks the plate or its support | `world.afterEvents.playerBreakBlock` | the broken cell and the cell above it |
| A player places a block at a watched cell (re-placing a plate) | `world.afterEvents.playerPlaceBlock` | the placed cell |
| An explosion | `world.afterEvents.blockExplode` | the exploded cell and the cell above it |
| A piston | `world.afterEvents.pistonActivate`, over `getAttachedBlocksLocations()` and the arm cell | each moved cell and the cell above it |

**Not observed** (a same-type re-place still teleports; reported limitation):
- `/setblock`, `/fill`, `/clone`;
- structure or template loads;
- other add-ons' `setType`;
- liquid flow;
- game rules that clear blocks.

**A different-type or missing plate on any path** is always caught by the typeId check.

**Scenario proof:**
- a player break and re-place of the same type → no teleport, binding cleared (positive);
- TNT next to a plate, then the same type re-placed → no teleport;
- `/setblock` to a different plate type → no teleport;
- **negative control:** an untouched plate, pressed by a mob walking over it → teleport succeeds. This proves the permutation is ignored.

**Closes `xcx34`** once Andrey accepts the limitation in the acceptance sheet.




- **node**: L0-pear-ru03

### Rule: item invariants (durability, crafting, non-legendary) (L0-pear-ru04)

# Rule: item invariants (durability, crafting, non-legendary)

**Is a:** rule. **Part of:** L0-pear. **Relates to:** L0-xasm43, C-46, L0-lgnd, L0-ench.

1. **Infinite durability = damage held at 0.** A marked rod's `durability.damage` is written back to 0:
   - when a tracked hook ends (reel or release);
   - on bind;
   - on the shared interval's hand check, every 20 ticks for holders of a marked rod.

   A reel costs at most 5 durability (or 2 on a block hook), and the rod has 64, so it can never break between checks.
   - **Fallback** if the probe shows damage cannot be written back: re-issue a fresh marked rod carrying the same dynamic properties, enchantments and nameTag.
2. **Unlimited crafting.** There is no world flag and no counter, and the recipe never locks.
3. **Not legendary (C-46).**
   - The token and the marked rod return undefined from `defForToken`, `defForStack` and `isLegendaryStack` (the plan's "`defForItem`"; names as read in `src/legendary/registry.ts` during reduce v11).
   - No retention, Void recovery, despawn protection, refund or gate applies.
   - Death drops are vanilla, and keepInventory is honoured as vanilla.
4. **Enchanting.** The rod is a `minecraft:fishing_rod` for the `ench` roller: Lure, Luck of the Sea, Mending, Unbreaking. Enchanting must keep the mark, nameTag and binding; the `ench` result writes back the same stack with its properties intact.
5. **Transfer is free.** The rod can be dropped, traded, stored or given. A transfer never transfers the use of a binding (`L0-pear-ru01`).




- **node**: L0-pear-ru04

### Constraints and probe plan (run on checks BDS 19136 before building) (L0-trdt-cons)

# Constraints and probe plan (run on checks BDS 19136 before building)

**Links.** is_a: constraints. relates_to: L0-xcx31, L0-xasm33, L0-xasm34, L0-xasm37, L0-adr-twth, L0-adr-twrp.

## Binding constraints
- C-7, C-16, C-29, C-30′ (visual strike only until `xq10`), C-33 to C-37.
- Stable `@minecraft/server` 2.10.0 only.
- One shared `runInterval`, never `runJob` (`runJob` stalls 15–30 ms).
- Probes run on a private BDS copy and never import `bds-gametest.mjs`.

## Probe list
Each probe records numbers into the README "Measured" table.

| # | Probe | Decides |
|---|---|---|
| P1 | Token recipe with 2 water buckets: are the empties returned? With a full inventory, where do they go? Shift-craft ×1 | `L0-trdt-adrf` branch |
| P2 | Vanilla `minecraft:trident` melee and thrown damage against no armour and against diamond armour. Impaling V on the custom item against a drowned | `minecraft:damage`, `impact_damage`, the Impaling limitation |
| P3 | `itemStartUse` / `itemReleaseUse` with a use-duration item, no `throwable`: event, `useDuration`, `isSneaking` at release. On iPad touch, run by Andrey's session or the QA BDS | the input in `pmov` |
| P4 | Vanilla Riptide III in water, flat, standing: horizontal and vertical distance. Then `applyKnockback` H/V to match ± 20 % | dash constants |
| P5 | `beforeEvents.entityHurt` cancel on cause `fall` after a knockback launch from 20 blocks up | fall grant path or katana fallback |
| P6 | Sim player swim speed: plain, sprint-swim, with the impulse | swim impulse constants |
| P7 | Vanilla thrown trident: launch speed and gravity per tick. Match the custom projectile's `power`, `gravity`, `inertia` | entity JSON |
| P8 | Teleport-steered entity at 0.5 b/tick through a 3-block wall: arrival time | return implementation |
| P9 | Restart with a custody entity loaded: does `entityLoad` fire, and is the `andrew:tr.throw` property kept? Is `Entity.id` stable? | stale handling |
| P10 | `damageSource.damagingProjectile` and `damagingEntity` for a script-shot projectile with an owner | thrown raise or the scripted fallback (`addm` §3) |

## Non-functional limits
- No added per-tick work when no record exists and no player holds the trident.
- No world dynamic property write per tick: the record is written at throw, swap, every 20 ticks during return, and at delivery.
- The return interval itself is shared and starts and stops with records and holders.




- **node**: L0-trdt-cons

### R-trdt-001 · One weapon, one place; inserted exactly once (L0-trdt-r001)

# R-trdt-001 · One weapon, one place; inserted exactly once

**Links.** is_a: rule. relates_to: L0-trdt-adcl, L0-trdt-ecus, L0-trdt-pthr, L0-trdt-pfbk.

**Rule.**
- At every tick, the marked trident instance is in exactly one of these places:
  - a slot;
  - a dropped `minecraft:item`;
  - custody (a record plus at most one custody entity);
  - owed or pending in lgnd.
- A held copy and a custody record for the same instance never coexist **as live copies**. A crash mid-throw may briefly leave a held copy beside a record. That copy becomes stale at delivery and is voided.
- The return inserts at most once per `throwId`. The record's deletion happens in the same synchronous block as the insert or the delivery.
- A non-live mark is never inserted or delivered.

**Rationale.** C-33 and C-7. The `lgnd` generation ledger is the arbiter, so any second copy becomes stale rather than live.

**Check.**
- A per-tick GameTest observer counts live marked copies across the thrower's inventory, the off hand, item entities and the owed and pending lists, plus custody records, through a full throw → hit → return cycle and through each fallback.
- The assertion is count == 1 at every tick.




- **node**: L0-trdt-r001

### R-trdt-002 · Each landed hit: vanilla base + 2 before armour, one strike, idempotent (L0-trdt-r002)

# R-trdt-002 · Each landed hit: vanilla base + 2 before armour, one strike, idempotent

**Links.** is_a: rule. relates_to: L0-adr-twlt, L0-trdt-addm, L0-xasm34, L0-xcx29.

**Rule.**
1. **Base damage.**
   - Melee is the measured vanilla trident melee value (expected 9: `minecraft:damage` 8 + hand 1).
   - A thrown hit is the measured vanilla thrown value (expected 8).
2. **Bonus.**
   - The bonus is +2 **before** armour, Protection and Resistance (`xasm34`), applied in the same hurt event through `raiseHit`.
   - A lethal raise goes through the helper's `system.run` overkill path, so the totem still works.
3. **Who it applies to.**
   - Living targets only: players and mobs with health.
   - Armour stands, item frames, boats and minecarts get no bonus and no strike.
4. **Strike.**
   - Exactly one `playStrikes` visual per accepted hit.
   - No `lightning_bolt` entity is spawned until `xq10` opts in.
   - No fire, conversion or knockback from the visual.
5. **Idempotency.**
   - One bonus and one strike per key: (`throwId`, target) for a thrown hit, (attacker, tick, target) for melee.
   - A hit swallowed by the hurt window (`event.damage` ≤ the window's last) gets neither.
6. **No recursion.** Nothing the trident spawns deals damage.




- **node**: L0-trdt-r002

### R-trdt-003 · Loyalty and Riptide never stay on the trident (L0-trdt-r003)

# R-trdt-003 · Loyalty and Riptide never stay on the trident

**Links.** is_a: rule. relates_to: L0-xasm35, L0-adr-twth, L0-trdt-pthr.

**Rule.**
- The item has `minecraft:enchantable` slot `trident`.
- On `playerInventoryItemChange` naming an `andrew:above_water_trident` stack, on re-insert after a return, and on `grant` through lgnd (that goes through `playerInventoryItemChange` too):
  - remove `loyalty` and `riptide`;
  - keep all others (Unbreaking, Mending, Impaling, Channeling).
- The scrub writes the stack back into the same slot only when something was removed, so it cannot loop.
- **Marked copies:** after a scrub, the lgnd mark's `look` is refreshed (`withLook`), so a later lgnd return does not restore Loyalty or Riptide.
- **Channeling** is inert: there is no second strike.
- **Reported limitations:** the anvil and table previews show the enchantments, and the anvil consumes the book.




- **node**: L0-trdt-r003

### Constraints · Underwater Bow and recipes (L0-uwbw-cons)

# Constraints · Underwater Bow and recipes

**Links.** relates_to: L0-lgnd, L0-strm, L0-sclk, C-2, C-26, C-29, C-30′, C-34, C-40–C-43.

1. **The stable API.** Use stable `@minecraft/server` 2.10.0 with no Experiments (C-2). There is no `projectileShoot`: attribution is through `entitySpawn` in the same tick.
2. **One shared interval.** Flight correction, Super Fire and the HUD run in one shared interval, with no `runJob`.
3. **One synchronous block** (C-26). The armed hit's damage write is synchronous in the before-event; the strike, Super Fire, cooldown and disarm are synchronous in the after-event.
4. **The `lgnd` seam stays within def fields.**
   - `hudKeys.armed?` is optional, so the other seven defs are untouched.
   - Use is not claimed through `resolveActivation`.
   - `startCooldown` is called on the hit.
   - The `lgnd`, `magn` and `sclk` legendary scenarios gate the merge.
5. **The `strm` seam.** `raiseHit`'s behaviour is frozen. `setHit` is added beside it (`adex`), and the Storm Blade scenarios gate the merge.
6. **Arrow attribution never touches arrows from other bows,** skeletons or dispensers.
7. **Evidence.** Every `bds` criterion has an in-test negative control or a red-before-fix proof. Runs use a private BDS copy on 19136, with env in the command and absolute artifact paths. The broad tier plus the scenarios this change can reach are the gate.
8. **The version** goes to 1.11.0, with RU/EN lang for every new key.




- **node**: L0-uwbw-cons

### R-uwbw-001 · Only a successful hit spends the charge (L0-uwbw-r001)

# R-uwbw-001 · Only a successful hit spends the charge

**Rule.** The armed charge is consumed, and the 600-tick cooldown started, **only** when **all** of these hold:
1. the arrow carries `ub:armedShot`;
2. it hit a **living entity**: it has `minecraft:health` and is not `armor_stand`, `boat`, `chest_boat`, `minecart*` or an item frame; the shooter itself does not count;
3. the hurt before-event saw `event.damage > 0`, was not cancelled, and was not swallowed by the hurt window or a shield.

**Everything else is a miss.** A miss keeps `ub:armed`, starts no cooldown and changes no HUD:
- a block, water or lava;
- a shield block;
- an invulnerable target;
- a despawned or removed arrow;
- an unloaded chunk.

**Targets.** Players and mobs both count (spec: "Целью может быть игрок или моб").

**Source.** Spec v2 §1 and §5 bullet 3; C-41; `xasm38`.




- **node**: L0-uwbw-r001

### R-uwbw-002 · Normal fire vs Super Fire (L0-uwbw-r002)

# R-uwbw-002 · Normal fire vs Super Fire

**Normal hit.**
- The target burns for `max(2 s, Flame duration)`; the two never add.
- Water may put it out, as vanilla does.
- Damage is vanilla `onFire`/`fireTick`.

**Armed hit.**
- **Super Fire** for exactly 5 s, 1 HP per second (5 ticks), cause `fireTick`, marked as scripted.
- It burns in water too. Fire Resistance and fire-immune mobs take 0.
- It places no fire block.
- A second armed hit refreshes it and never stacks.
- Vanilla fire on the same target inside the window adds no extra damage.

**The two must be distinguishable** (spec §5 bullet 2):
- a target in water after a normal hit stops burning within 1 s;
- a target in water after an armed hit loses 5 HP over 5 s.

**Source.** Spec v2 §1 and §5; C-43; `xasm38`.




- **node**: L0-uwbw-r002

### R-uwbw-003 · The armed hit is exactly 14 before armour (L0-uwbw-r003)

# R-uwbw-003 · The armed hit is exactly 14 before armour

**Rule.**
- The armed hit **replaces** the arrow's vanilla damage with 14 HP before armour. Power and crit are ignored. Armour, toughness, Protection, Projectile Protection and Resistance then apply as vanilla.
- The native event is rewritten to `afterArmour(14, defence)`; this is the post-armour value the before-event carries. There is no second `applyDamage` hit, which the hurt window would swallow.
- The value is exact and non-stacking (C-29). Against an unarmoured target it reads 14.00.
- **If the hit is lethal,** it is delivered via `applyDamage` with a source, so the totem works. A lethal before-event rewrite would eat the totem *and* kill.
- **Punch knockback** still applies. The strike visual deals 0 (C-30′).

**Source.** Spec v2 §1 ("14 HP (7 сердец) до брони"); C-29; `xasm38`.




- **node**: L0-uwbw-r003

### R-uwbw-004 · Recipe outputs and shape uniqueness (L0-uwbw-r004)

# R-uwbw-004 · Recipe outputs and shape uniqueness

1. **The Mace and the rockets are pure vanilla ids** (`minecraft:mace` ×1, `minecraft:firework_rocket` ×3). They carry no lore, no `andrew:` look-alike and no script post-processing, and they keep vanilla durability, stats and enchantability. Crafting them is unlimited.
2. **Existing recipes keep working.** That means the vanilla Heavy Core Mace, the vanilla rockets with Gunpowder, and every `packs/behavior/recipes/*` recipe.
3. **No shape collides with any vanilla 1.26.51 recipe or any add-on recipe:**
   - ` R / BWB / S `;
   - `I / Z`;
   - `P / S`.

   This is enforced by a unit test that loads every `packs/behavior/recipes/*.json` and a checked-in vanilla shape list.
   - The bow recipe differs from the trident's ` G / BTB / G `.
   - `I / Z` differs from vanilla Heavy Core / Breeze Rod by ingredient.
4. **The bow craft returns exactly 2 empty buckets**, never 0, 4 or a water bucket (C-34). A blocked craft returns none.

**Source.** Spec v2 §1–§3 and §5 bullet 1; C-34; C-40.




- **node**: L0-uwbw-r004

