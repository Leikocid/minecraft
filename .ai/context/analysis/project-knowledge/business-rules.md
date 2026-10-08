---
title: Business Rules
type: project-knowledge
generated_at: "2026-10-08T18:47:14.738Z"
source_channel: rollout
node_id: rollout-business-rules
aliases: ["rollout-business-rules","business-rules","project-knowledge/business-rules"]
is_a: ["rollout","business-rules"]
relates_to: ["L0","L0-katn-r001","L0-katn-r002","L0-katn-r003","L0-katn-r004","L0-katn-r005","L0-katn-r006","L0-katn-r007","L0-katn-r008","L0-lgnd-r001","L0-lgnd-r002","L0-lgnd-r003","L0-lgnd-r004","L0-lgnd-r005","L0-lgnd-r006","L0-lgnd-r007","L0-lgnd-r008","L0-lgnd-r009","L0-lgnd-r010","L0-lgnd-r011","L0-lgnd-r012","L0-lgnd-r013","L0-lgnd-r014","L0-lgnd-r015","L0-lgnd-r016","L0-lgnd-r017","L0-lgnd-r018","L0-magn-rblk","L0-magn-rcnt","L0-magn-rdup","L0-magn-rexm","L0-magn-rleg","L0-magn-rlim","L0-magn-rply","L0-magn-rrel","L0-magn-rrng","L0-sauc-r001","L0-sauc-r002","L0-sauc-r003","L0-sauc-r004","L0-sauc-r005","L0-sauc-r006","L0-sclk-cons","L0-sclk-r001","L0-sclk-r002","L0-sclk-r003","L0-sclk-r004","L0-sclk-r005","L0-sclk-r006","L0-sclk-r007","L0-sclk-r008","L0-sclk-r009","L0-sclk-r010","L0-strm-rcd","L0-strm-rdmg","L0-strm-rvis","L0-ufoc-r001","L0-ufoc-r002","L0-ufoc-r003","L0-ufoc-r004","L0-ufoc-r005","L0-ufoc-r006"]
priority: 620
---

# Business Rules

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Global Constraints (v8) (L0)

---
title: "Global Constraints"
aliases: ["L0-constraint", "Constraints"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0", "L0-strm", "L0-adr-sbdm", "L0-adr-sblt", "L0-adr-sbvr"]
see_also: ["constraints", "stormbladeelytratotemspecruen-part-2"]
supersedes: ["L0-constraint@v7"]
---
# Global Constraints (v8)

**Carried unchanged:** C-1 … C-28, C-5a′, C-5d, C-5e, C-5f, C-7″, C-12′, C-20‴. All of them bind the Storm Blade. The ones it leans on most:
- C-2: stable 2.10.0, no Experiments.
- C-7: no duplication. The craft gate covers simultaneous crafts, the recipe book and shift-craft (storm §05).
- C-15: priority order.
- C-16: the closest stable equivalent, documented.
- C-22: filter out `undefined` players.
- C-26: the outcome is decided once, on the server. It applies to the trace: a trace resolves once, to one entity or to none.

**C-28 does not apply to the blade.** The blade's damage is *armour-respecting*, not fixed.

v8 adds:

| ID | Constraint | Source |
|---|---|---|
| C-29 | *(new)* **Armour-respecting bonus damage is exact and never stacks.** The active hit deals 10 HP and the passive bonus 6 HP, each *before* armour, Protection and Resistance, which then reduce it as for any `entityAttack`. Neither may be swallowed by the hurt-invulnerability window, nor counted twice. Active and passive are separate damage events. No other entity takes damage from either. Kill credit, the death message and totems work. | §02, §05, §06 |
| C-30 | *(new)* **Spectacle never deals damage.** Any lightning, wind or electric visual from a weapon causes no damage, fire, knockback, mob conversion (pig → piglin, villager → witch, creeper charge) or block change. If vanilla `lightning_bolt` cannot meet this on stable, it is not spawned (`L0-adr-sblt`). | §02, §05 |
| C-31 | *(new)* **Vanilla output stays vanilla.** A recipe that promises a vanilla item yields that exact `minecraft:` id, with no lore, dynamic property or mark. No script observes or alters it, and the legendary systems (magnet, protection, retention) treat it as an ordinary item. | §03, §04, §05 |
| C-32 | *(new)* **A chance is rolled per event, on the server.** The 30 % passive is an independent roll per landed hit, with no pity timer and no per-player streak state. The RNG is injectable so a GameTest can prove both branches deterministically and the rate statistically. | §02, §06 |
| C-20⁗ | *(extended)* Storm Blade acceptance uses ≥ 2 entities in a line for the "first target only" test, a wall test for "stopped by a solid block", and an armoured SimulatedPlayer for the pre-armour checks. | §06 |




- **node**: L0

### Katn r001 concept rule (L0-katn-r001)

---
title: "R-katn-001: Recipe, damage and durability"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-lgnd-p001", "L0-xasm22", "L0-katn-ent1"]
see_also: ["dragonkatanaspecv1ruen-part-1"]
---
**Rule.**
1. **Recipe.** It is a shaped 3×3 recipe:
   ```
   . G .
   P S P
   . G .
   ```
   G is `minecraft:golden_apple` (not the enchanted one), P is `minecraft:ender_pearl`, S is `minecraft:diamond_sword` (any damage or enchantment, none carried over, `L0-xasm22`).
   - The output is the craft token `andrew:dragon_katana_crafted`, never the item.
   - Gate, refund and broadcast are `L0-lgnd-p001`.
2. **Melee.** An ordinary hit deals exactly what a vanilla Diamond Sword deals in the same situation: no hidden bonus and no script damage (§4).
   - Vanilla enchantments for the sword slot apply as usual.
   - Melee is unaffected by the ability's cooldown (T14). The ability never runs on attack: the Katana def has no attack activation.
3. **Durability.** There is no durability component. Hits and uses never damage the item (T15).
4. **Ability harm.** The ability itself deals no damage to entities or blocks (§4, §8).

Source: Katana §2, §4, T04, T14, T15.




- **node**: L0-katn-r001

### Katn r002 concept rule (L0-katn-r002)

---
title: "R-katn-002: Server-authoritative 20-block cap, same dimension, no block edits"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-xasm18", "L0-katn-p001", "L0-katn-ent2"]
see_also: ["dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
---
**Rule** (C-24).
- The destination is computed only from the server's `getHeadLocation()` and `getViewDirection()` at the moment of use. No client-supplied point is ever read.
- **Cap.** The resulting head position lies within 20.0 blocks of the use-time head: `|B + (0,1.62,0) − H| ≤ 20`. Aim further than 20 is **clamped**, not refused (`L0-xasm18`).
- **Dimension.** The teleport is always in the player's current dimension. A teleport is never attempted into another dimension's chunks.
- **No edits.** The ability never calls `setType`, `setPermutation`, `fillBlocks` or any command that changes blocks. If no cell fits, there is no teleport. Space is never created.
- **Facing.** The teleport keeps the use-time rotation.
- **Particles.** Particles are never a source of truth for position (§11).

Source: Katana §5, §6, §11, §14; T05, T06, T10.




- **node**: L0-katn-r002

### Katn r003 concept rule (L0-katn-r003)

---
title: "R-katn-003: Obstacle semantics of the trace"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-adr-ktob", "L0-katn-ad01", "L0-katn-cx01", "L0-xasm21"]
see_also: ["dragonkatanaspecv1ruen-part-2"]
---
**Rule.** The trace stops at the first block that the engine's block ray reports with `includePassableBlocks: false, includeLiquidBlocks: false` (`L0-adr-ktob`).
- **Do not stop it:** water, lava, air, and passable blocks (grass, flowers, torches, signs, ladders, carpet, cobweb; to be confirmed by probe (2)).
- **Stop it:** full blocks and partial-collision blocks (slabs, stairs, fences, walls, glass panes, doors). The Katana stops short rather than risk a stuck player.
- **Unreadable = solid.** A point of the segment in an unloaded chunk (`dimension.getBlock` returns `undefined` or throws) or outside `dimension.heightRange` ends the trace just before it.
- The Katana never phases through a stopping block. The landing cell is always reached from the head by a clear ray.
- A Web Sword trap does not hold the player: cobweb is passable (`L0-xasm21`). The UFO magnet does not cancel the ability.

These semantics deliberately differ from the Scythe's `hasLineOfSight` (any non-air, non-liquid block blocks). Each module's README names the difference.

Source: Katana §5, §13; T07, T08; C-12, C-24.




- **node**: L0-katn-r003

### Katn r004 concept rule (L0-katn-r004)

---
title: "R-katn-004: Safe standing cell"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-xasm19", "L0-adr-ktob", "L0-katn-ad01", "L0-katn-as01", "L0-katn-as03", "L0-katn-cx01"]
see_also: ["dragonkatanaspecv1ruen-part-2"]
---
**Rule.** A candidate feet cell `F` is safe when all of these hold:
1. **Fits** (`L0-katn-ad01`): the feet cell `F` and the head cell `F+up` are each free (air, water, or a block the column ray passes).
2. **Not a hazard** (`L0-katn-as03`): neither cell is lava, fire or soul fire. A powder-snow, sweet-berry or magma *floor* is allowed: the spec forbids only suffocation and walls.
3. **Owner's side**: the centre of `F` is on the head's side of the hit-face plane, when there was a hit.
4. **Reachable**: a clear ray (same flags) runs from `H` to the centre of the head cell of `F`.
5. **In range**: `|centre(F) + (0,1.62,0) − H| ≤ 20`.

**Order** (`L0-xasm19`, nearest first): the desired feet cell; then cells back along the ray in 0.5-block steps; at each step the offsets +1 and +2 up and ±1 to the side (perpendicular to `d` in the horizontal plane). The first safe one wins. The search stops at the player's own cell. Nothing safe → refusal: no teleport, no cooldown.

- **Placement.** Teleport to the cell centre (x+0.5, y, z+0.5). A 0.6-wide hitbox centred in a free cell cannot overlap the neighbouring full blocks.
- **Pose.** No crawling or lying pose is simulated; a standing 2-high fit is required (§6).
- **Air.** A cell in the air is a valid B (fall protection covers it).

Source: Katana §5, §6; T07, T09.




- **node**: L0-katn-r004

### Katn r005 concept rule (L0-katn-r005)

---
title: "R-katn-005: Cooldown only on a successful teleport; an attempt on cooldown changes nothing"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-lgnd-p004", "L0-lgnd-p005", "L0-katn-p001"]
see_also: ["dragonkatanaspecv1ruen-part-2"]
---
**Rule.**
- `startCooldown(player, "dragon_katana")` (600 ticks = 30 000 ms, epoch ms) is called **only** after `player.teleport` returned without throwing, in the same turn.
- The cooldown is per player and ability (`andrew:cd_dragon_katana`), synchronised by the server, and survives a restart (`L0-lgnd-p005`).
- A refusal (no safe cell, all unreadable, wrong def resolved) never writes the timer.
- **On cooldown**, a Use press is a no-op. There is no teleport, `andrew:cd_dragon_katana` is unchanged, and there is no chat message. Only the HUD shows the remaining seconds.
- The Katana never sets the framework's busy window: the ability is instant. Swapping hands after a success changes nothing.
- **Off hand.** With another legendary ready in the main hand, the main hand wins. With the main hand on cooldown and the Katana ready in the off hand, the Katana fires (`L0-lgnd-p004`).
- Melee hits work at any cooldown state.

Source: Katana §5, §9, §11; T05, T14.




- **node**: L0-katn-r005

### Katn r006 concept rule (L0-katn-r006)

---
title: "R-katn-006: Fall protection is one-shot and bounded"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-adr-ktfl", "L0-xasm20", "L0-katn-p002", "L0-katn-ent2"]
see_also: ["dragonkatanaspecv1ruen-part-2"]
---
**Rule** (C-25).
- After a successful teleport, the first landing caused by it deals no fall damage (T11).
- The protection ends at the first of these: an on-ground tick, a liquid, a climb, a glide, death, a dimension change, logout, or 10 s of wall-clock time.
- The next ordinary fall deals vanilla damage (T12).
- The protection never blocks any other damage: PvP, mobs, lava, the Void, suffocation.
- It never alters the visible descent: no slow-falling float, unless the probe-failure fallback in `L0-katn-p002` §4 is adopted by a superseding ADR.
- It is not persisted.

Source: Katana §7; T11, T12.




- **node**: L0-katn-r006

### Katn r007 concept rule (L0-katn-r007)

---
title: "R-katn-007: Cherry-petal trail A→B, one-shot and harmless"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-p001", "L0-katn-as03"]
see_also: ["dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
---
**Rule** (C-5e).
- The trail is spawned **only** on a successful teleport.
- `dimension.spawnParticle` is called at points every 0.5 block from A+1 to B+1: at most 41 points, about 3 particles per point.
- It runs in the activation tick, or spread over ≤ 10 ticks through the shared interval. Nothing is scheduled after that.
- **Particle.** `minecraft:cherry_leaves_particle` if probe (4) shows it renders when spawned by script on iPad. Otherwise a custom RP particle `andrew:katana_petal`: a pink billboard, lifetime ≤ 1.5 s, no collision.
- **Visibility.** `spawnParticle` is broadcast to clients in range, so nearby players see it (§8).
- **Harmless.** No entity is spawned, no damage, no knockback, no block change, no sound requirement.
- Points in unloaded chunks are skipped silently.

Source: Katana §8, §14; T13.




- **node**: L0-katn-r007

### Katn r008 concept rule (L0-katn-r008)

---
title: "R-katn-008: HUD and localization strings"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-lgnd-p005", "L0-katn-ent1"]
see_also: ["dragonkatanaspecv1ruen-part-2"]
---
**Rule.** The shared HUD pass (`L0-lgnd-p005`) renders the Katana through the def's `hudKeys`, the field the Orbital Cannon already uses. No framework code changes.

| Key | en_US | ru_RU |
|---|---|---|
| `item.andrew:dragon_katana.name` | Dragon Katana | Катана дракона |
| `andrew.katana.hud_ready` | `%s — Ready` | `%s — Готово` |
| `andrew.katana.hud_cooldown` | `%s — %s s` | `%s — %s с` |

- Ready reads exactly "Dragon Katana — Ready" / "Катана дракона — Готово" (§10). The shared `%s: Ready` would not match.
- `hudKeys` takes both keys (`registry.ts:34`), so the Katana carries its own cooldown line too, in the same em-dash shape. The Orbital Cannon set the precedent (`andrew.orbital.hud_cooldown`). Key names: `L0-lgnd-ad14` (reconciled at reduce v6).
- During cooldown the HUD shows the whole seconds left, rounded up.
- Both lang files also carry the `andrew.katana.*` texts that `lgnd` needs: first_craft, craft_blocked, returned, admin_given, reset.
- Creative inventory: Equipment → swords group, and found by search; `/give @s andrew:dragon_katana` works.

Source: Katana §10.




- **node**: L0-katn-r008

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

- The Web Sword prefix is `ws` forever. It derives exactly the 0.3.0 names: `andrew:ws_crafted`, `ws_crafted_by`, `ws_pending`, `ws_origin`, `ws_owner`, `ws_id`, `ws_owner_name`.
- 0.3.0 formats must parse:
  - `ws_pending` holding a single serialised mark → a one-element array;
  - a stack without `ws_gen` → gen 0;
  - a stack without `ws_holder` → holder = `ws_owner`;
- New fields are additive. The framework never deletes or renames a key the shipped version wrote, except the cooldown key (`cx07`).
- After the upgrade, a 0.3.0 world where the sword was crafted still refunds a new craft. A sword cooling at the upgrade reads ready (`wpn2` on `cx07`).




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
relates_to: ["L0-stgt", "L0-lgnd-as09", "L0-lgnd-cx03", "L0-lgnd-ac14"]
---
**R-lgnd-010: `isHiddenFromTargeting(player)` reads `andrew:hidden_until` as an epoch-ms deadline (C-21).** Source: Scythe §3; L0 C-21.

- **Storage.** The player dynamic property `andrew:hidden_until` (`HIDDEN_UNTIL_KEY`, `src/legendary/hidden.ts:21`) holds a `Date.now()` deadline in **milliseconds**. That is the same clock as the cooldown (`andrew:cd_*`) and busy (`andrew:busy_*`) deadlines and the next UFO arrival. C-21 applies: every durable deadline uses epoch ms. `system.currentTick` restarts with the script engine, and `getAbsoluteTime()` stops under `dodaylightcycle false`.
- **Read.** `isHiddenAt(Date.now(), value)`. A missing or non-number value means not hidden; nothing throws.
- **Write.** `hideFromTargeting(player, seconds)` writes `Date.now() + seconds × 1000`. Zero or less clears it. `/andrew:hide <seconds> [target]` is the operator and test seam. The future Shadow Blade writes the same key in ms, and replaces only the body of `isHiddenFromTargeting`.
- **Durability.** It survives reconnect and restart. A deadline written before a restart is still exact after it.
- **Pack scope.** Dynamic properties are per pack. A player hidden by the release pack reads as not hidden in the GameTest pack (`hidden.ts:24-27`), so a GameTest must hide through its own pack.
- **Not hiding.** Vanilla invisibility is not hiding.

This settles `cx03`: C-21 is now the L0 wording, and ASM-020's "ticks" is retired.




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

### Lgnd r012 concept rule (L0-lgnd-r012)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad10", "L0-lgnd-p003", "L0-lgnd-p008", "L0-lgnd-ac09", "L0-lgnd-ac19", "L0-xcx10"]
---
**R-lgnd-012: Legendary destruction policy (all weapons)**

A **live marked** legendary is never lost to ordinary destruction. Which outcome applies depends on the cause:

| Cause | Outcome | Mechanism |
|---|---|---|
| This add-on removes blocks or detonates (Cannon LMB/RMB, any future effect) | **Stays in the world.** Same stack, same `gen`, placed at a safe spot outside the volume. No message. | `protectLegendariesIn` (`p008`) is called **before** the removal |
| RMB drop suppression | Legendary item entities are **never** removed | `isLegendaryItemEntity` exemption (`ring`) |
| Vanilla container break (player, TNT, creeper) | **Drops** as an item entity (vanilla spill) | none; the drop is then watched |
| Fire, lava | **Stays in the world** (`minecraft:fire_resistant`) | none |
| Cactus, vanilla explosion, despawn | **Returned** to `mark.owner` with `gen + 1`, plus `andrew.legendary.recovered`; queued in the owed list if offline | `p003` (deviation C-16) |
| Void (below `heightRange.min`) | Returned, as above (Orbital §5) | `p003` |

Invariants:
- No path grants a copy while a live copy exists. A `gen` bump always comes before a re-issue, and a protective move never bumps `gen` (C-7).
- Unmarked (Creative, `/give`) copies are outside this rule. They behave as vanilla items (`as11`).
- The craft flag is never reopened by any destruction (`r011`).
- The Web Sword, the Scythe and the Cannon are treated the same (Orbital §5 "общее правило").




- **node**: L0-lgnd-r012

### Lgnd r013 concept rule (L0-lgnd-r013)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r012", "L0-lgnd-p008", "L0-lgnd-ac19", "L0-lgnd-ac20", "L0-lgnd-cx12", "L0-xcx10", "L0-pntr", "L0-ring"]
---
**R-lgnd-013: Container-destruction rule**

When a block with an inventory (chest, trapped chest, barrel, hopper, dropper, dispenser, furnace family, brewing stand, shulker box, crafter, decorated pot) that holds a live marked legendary is destroyed, the legendary must survive or drop, never vanish (Orbital §5).

1. **Script removal** (`setType`, `fillBlocks`, `structureManager` overwrite, the Cannon LMB): the caller runs `protectLegendariesIn` over the affected volume **before** the first block change of that tick. Removing such a block without the call is a defect. `ac19` detects it.
2. **Script explosion** (`createExplosion`, the Cannon RMB): the helper runs over the blast AABB (centre ± power) before `createExplosion`. Ordinary contents may then be suppressed (`L0-xasm7`), and a legendary cannot be among them.
3. **Vanilla destruction:** rely on the vanilla spill. The dropped legendary falls under `r012` from then on.
4. **Death of the previous owner** while the legendary sits in a container: nothing happens (Orbital §5). Retention reads only the dying player's own inventory and off hand.
5. **Nested storage** (a legendary inside a shulker-box *item* or a bundle): out of reach of every rule here. Known limit, `cx12`.
6. Containers are never scanned outside a destruction volume (C-4). The helper runs only on demand.




- **node**: L0-lgnd-r013

### Lgnd r014 concept rule (L0-lgnd-r014)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad08", "L0-lgnd-p001", "L0-lgnd-r002", "L0-lgnd-ac15", "L0-xcx9"]
---
**R-lgnd-014: Only a craft token can claim or spend a weapon's craft budget**

- A weapon's one-per-world flag (`andrew:<p>_crafted`) is set only when a `def.craftTokenId` stack reaches a Survival or Adventure player's inventory while the flag is unset.
- A token that arrives while the flag is set is refunded with `def.refund`, and the `craft_blocked` message is sent.
- A plain `def.itemId` stack never claims and is never refunded. That covers vanilla `/give`, the Creative inventory, a Creative copy handed to a Survival player, a structure loot table, and `/replaceitem`. Such a stack stays unmarked, and the gate does not look at it.
- A token in Creative or Spectator is swapped for an unmarked `def.itemId`. The flag is unchanged.
- The token → weapon swap keeps the slot index. Only the `claim` branch stamps `origin: craft`, `owner` = `holder` = the crafter, and `gen: 0`.
- Contract on item JSON, owned by the weapon nodes:
  - Every legendary recipe outputs its token.
  - The token has `menu_category: none`, the weapon's icon and name, and `max_stack_size: 1`.
- `/andrew:<cmd> reset` clears the flag (unchanged). It does not delete tokens that are in flight.




- **node**: L0-lgnd-r014

### Lgnd r015 concept rule (L0-lgnd-r015)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad09", "L0-lgnd-r004", "L0-lgnd-r003", "L0-lgnd-p009", "L0-lgnd-ac16", "L0-adr-orbc"]
---
**R-lgnd-015: Activation modes share one cooldown and resolve through one function**

- `resolveActivation(player, mode)` is the only place that decides which held legendary a press activates. Every ability module calls it and acts only if the answer is its own def.
- `mode = "use"`: main hand, then off hand. Each is a candidate only if `"use" ∈ def.activations`, it is ready and it is not busy.
- `mode = "attack"`: main hand only, and only if `"attack" ∈ def.activations`, it is ready and it is not busy.
- All modes of one def share the def's `abilityKey`, and so share one cooldown and one busy deadline. While cooling, every mode resolves to `undefined`. The press creates nothing and sends no message (Orbital §6).
- The ability module calls `startCooldown` in the same synchronous turn as a successful activation. For the Cannon that is the charge spawn, never the hit. So at most one activation happens per player per tick, across modes.
- The cooldown is per player and ability. Several copies held by one player (Creative, `/give`) share it, and different players are independent (Orbital §7, AC-17).
- A press that finds no valid target writes no state.




- **node**: L0-lgnd-r015

### Lgnd r016 concept rule (L0-lgnd-r016)

**R-lgnd-016 (v7): Legendary weapons are magnetic by operator tuning; craft tokens never are, and magnetism never destroys or duplicates an instance.**

Related: L0-magn, L0-lgnd-ad13, L0-lgnd-ac21, L0-lgnd-ac22.

**History.** UFO §4 / AC 13 said legendaries are never pulled. The operator reversed it on 2026-10-04 (1.6.0, `de0fc68`, "Replaces UFO AC 13 / R-lgnd-016"). This rule is now an **operator-tuned exception** to the spec.

**As built (1.6.1).**
1. The magnet's predicate is `isMagneticStack(stack) = isIronItem || isLegendaryWeaponStack` (`iron.ts:139-140`, `magnet-select.ts:393`). A legendary **weapon** (any def's `itemId`, marked, unmarked or stale) is pulled like iron:
   - on the ground, from container slots, and as a late drop;
   - a player holding one in a hand is lifted (`magnet-hold.ts:117-136`);
   - a mob or armour stand holding one is a class-3 holder, tagged via `hasitem` over `HELD_LEGENDARY_IDS` (`magnet-select.ts:179`, `:320`).
2. A **craft token** is never magnetic: `hasitem` rejects `menu_category: none` items, and a token is a craft in flight (`ad08`).
3. A hopper holding anything is a container, never a pulled block (`decision-resolve-l0-lgnd-cx13`), so no block pull ever removes a holder with a legendary in it; `protectLegendariesIn` has no magnet call site.
4. **The framework invariants still hold under magnetism:** after a pull the world holds exactly one live copy of each marked instance, its gen is unchanged unless a tier-3 loss happened, and a fall death after the hold keeps every held legendary (`ac22`).
5. Every new def is magnetic with no `magn` edit, because the predicate is built from `LEGENDARIES`. The Katana and the crossbow are pulled; the crossbow spec does not list the magnet as a hazard, so this is no breach.




- **node**: L0-lgnd-r016

### Lgnd r017 concept rule (L0-lgnd-r017)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-katn", "L0-lgnd-p003", "L0-lgnd-ad12", "L0-lgnd-ac24", "L0-adr-ktob"]
---
**R-lgnd-017: A wielder teleport is not a loss event, and every Katana teleport stays in the player's own dimension.**

**1. Recovery sees nothing.** The framework's loss triggers are:
- (a) a watched `minecraft:item` entity removed or below the floor;
- (b) a departure from a player slot within ±2 ticks of a `DropItem` swing (`inFlight`);
- (c) a `VOID_HOLDER_TYPES` entity removed below the floor.

`player.teleport` moves the player and the stacks the player holds. It spawns no item entity, raises no `playerInventoryItemChange` and no `DropItem` swing, and removes no minecart. So a Katana activation can trip none of them. This holds even when the teleport is used to escape a Web Sword trap or the magnet's hold (`L0-xasm21`).

**2. Ground items left behind.** If the player teleports away and a watched item's chunk unloads, `recovery.ts:326` logs "unloaded with its chunk" and `entityLoad` re-watches the item. It is **never** returned. The same is true when a player walks away.

**3. Same dimension only.**
- The Katana calls `player.teleport(location, { facingLocation | rotation })` **without** the `dimension` option.
- Every cell it reads uses `player.dimension`.
- An unloaded or out-of-range cell counts as solid (C-12, C-24). A destination in an unloaded chunk is never attempted; the trace stops before it.
- No framework call the Katana makes takes a second dimension. `protectLegendariesIn` is not called at all, because the teleport removes no blocks (`r013` applies only to block-removing effects, and T10 says nothing is destroyed).

**4. Death after a teleport** (into lava, or a fall the one-shot flag does not cover) goes through cause-agnostic retention (`r008`, `ac22` precedent).

**Violation signal.** A `[andrew] legendary recovery: … lost` or `returned` log line during a Katana GameTest where no item was dropped.




- **node**: L0-lgnd-r017

### Lgnd r018 concept rule (L0-lgnd-r018)

**R-lgnd-018: A passive legendary has every legendary property and no ability property.**

Related: L0-lgnd-ad15, L0-lgnd-r004, L0-lgnd-r007, L0-xcx24.

A def with `hasAbility(def) === false`:
1. **Never claims a Use.** `resolveActivation` skips it. With a passive def in the main hand and a ready active def in the off hand, the off hand answers the Use. This is a new case of `r004`: a passive main hand counts as "no ready ability", like a cooling one.
2. **Never draws a HUD line.** A player holding only passive legendaries receives no `setActionBar` call from the HUD. Holding a passive and an active one shows only the active line.
3. **Never writes or reads a timer.** No `andrew:cd_*` or `andrew:busy_*` key exists for it, and `defForAbility` never returns it.
4. **Keeps every other legendary rule unchanged**: the craft gate and broadcast, marks and generation, death retention (both hands), loss return and the owed list, `protectLegendariesIn`, magnetism (`r016`), operator commands.

Defs #1–#4 are active. Their behaviour, keys and HUD strings do not change.




- **node**: L0-lgnd-r018

### Magn rblk concept rule (L0-magn-rblk)

**Rule (UFO §5 Blocks, U6, U3; AC-10, AC-11).**

**Built block.** A selected built iron block becomes `minecraft:air` plus **exactly one** item entity of that block's own item, spawned at the block centre. There is no vanilla drop for the block itself; U6 found that `setType(air)` drops nothing.

**Door.** An iron door is removed whole (both halves) and yields **one** `iron_door`. The lower half is removed, and the upper half goes with it (U6).

**Ore.** `iron_ore` and `deepslate_iron_ore` yield **one `raw_iron`** (like Survival mining without Fortune), never the ore block. The cavity remains as air.

**Underground.** Items born underground fly to their ring slot **through** stone. They move by teleport each tick with velocity cleared, so they neither collide nor fall (U3). This holds for ore 20 blocks deep (the zone floor is centre − 20).

**The hopper** is selected as a block only when empty (`L0-magn-adhp`); with anything in it, it is a container (`L0-magn-rcnt`).

**Other block entities.** No other block entity is ever removed by the magnet.




- **node**: L0-magn-rblk

### Magn rcnt concept rule (L0-magn-rcnt)

**Rule (UFO §5 Containers, U5, AC-9).** From a placed container, only stacks whose typeId is in IRON_ITEMS are removed. Each one becomes one element. Everything else is untouched: non-iron stacks, legendaries, shulker-box *items* held inside, and the container block itself.

**Containers in scope:**
- chest, double chest, trapped chest, barrel;
- **hopper** holding anything; an empty one is a built block (`L0-magn-adhp`);
- furnace, blast furnace, smoker;
- dispenser, dropper, brewing stand;
- every placed shulker box.

**Out of scope:**
- The crafter, which has no inventory in the API.
- Contents of bundles or nested shulker items.

**Double chest.**
- Either half exposes the 54-slot paired container (U5).
- The pair is visited **once**, keyed by its canonical half (the lower x, then the lower z). Slots therefore cannot be listed twice, and one stack cannot take two of the 10 places.

**Minecarts.** A chest or hopper minecart is not a container source. It is pulled whole, as a class 3 entity, with its contents (but see `L0-magn-rleg`).

**Order.** Containers go nearest first; within a container, slots go in index order. Partial extraction is fine: if the limit is reached mid-container, the remaining iron stays.




- **node**: L0-magn-rcnt

### Magn rdup concept rule (L0-magn-rdup)

**Rule (C-7″, C-15 priority 1).** Every materialisation is **remove first, spawn second, roll back on failure**.

**Container slot.**
1. Re-read the stack.
2. Run `setItem(k, undefined)`.
3. Run `spawnItem`.
4. If the spawn throws, run `setItem(k, stack)`.

**Block.**
1. Save the permutation and the item.
2. Run `setType(air)`.
3. Run `spawnItem`.
4. If the spawn throws, run `setPermutation(saved)`.

**Never** spawn before the removal. A throw after the spawn would duplicate.

**Invariant, checked by GameTest.** For each source, the number of iron items in the world after the event equals the number before. Block sources follow this mapping:
- block → 1 item;
- door → 1 item;
- ore → 1 raw_iron.

Non-iron container contents are byte-identical before and after.

**Ownership.** The magnet never writes to a block or entity in an unloaded chunk (C-12′). It never touches inventories of players, minecarts or armour stands.




- **node**: L0-magn-rdup

### Magn rexm concept rule (L0-magn-rexm)

**Rule (UFO §5, AC-6).** Iron dropped near the saucer during the magnet is pulled **in addition to** the 10-element limit.

- **Trigger.** An `entitySpawn` of `minecraft:item` happens while the magnet is on. The stack is in IRON_ITEMS and is not legendary. The spawn point is ≤ 12 blocks (3-D) from the hover point, the saucer position.
- **Effect.** The item is appended as a class `X` element with the next ring slot (the ring is re-spaced over n slots).
- **Source.** No attribution is made to a player; any iron item spawning in that sphere qualifies (`L0-magn-adex`). Items spawned by the magnet itself (extraction, block items) are already elements and are ignored by the listener.
- **No cap.** Each drop needs a player action, so the number of `X` elements is not capped.
- **Further out.** An iron item dropped more than 12 blocks from the hover point (a player on the ground, for example) is not pulled.




- **node**: L0-magn-rexm

### Magn rleg concept rule (L0-magn-rleg)

**Rule (UFO §4, AC-13, C-7″).** A legendary weapon is never iron and is never pulled, wherever it lies.

**Predicate.** "Legendary" means `isLegendaryStack(stack)` from `lgnd` v4 (`L0-lgnd-ad13`): the stack's type is a def's `itemId` **or** `craftTokenId`, in any mark state.
- **Before `lgnd` v4 ships**, use `defForStack(s) !== undefined || defForToken(s) !== undefined` from `src/legendary/registry.ts`. `defForStack` alone matches only `itemId`, so it would miss a craft token inside a pulled minecart.
- **Item entities** are judged by that predicate on their `minecraft:item` stack, **not** by `isLegendaryItemEntity`. That one is true only for a live marked instance, so it would let the magnet take an unmarked `/give` or Creative copy (`lgnd-ad13`, rejected option a).

**Call sites in `magn`:**
- ground items;
- container stacks;
- the player hand test;
- the drop exemption;
- every slot of a chest or hopper minecart, and the hand and armour slots of an armour stand or mob, before it is selected as a holder.

**Holders.** A class 3 holder whose inventory or equipment holds a legendary is **not selected**; the next candidate takes its place. A legendary therefore never moves through the magnet, not even inside its holder (`L0-magn-aslh`).

**Players.** A pulled player who carries a legendary is still pulled. The player is not "the legendary", and `lgnd` retention covers their death.

**Owned by `lgnd`, not restated here:** the predicate itself (`L0-lgnd-ad13`), the never-pulled rule including holders and players (`L0-lgnd-r016`), the watching of moved holders (`L0-lgnd-as15`), and death retention (`L0-lgnd-ac22`). The call sites above implement `L0-lgnd-r016` §2, §3, §5 and §6. Its §4 (holder blocks) is dormant, because the only holder block the magnet turns into air is an empty hopper (`L0-magn-adhp`). Where the two read differently, `lgnd` wins.




- **node**: L0-magn-rleg

### Magn rlim concept rule (L0-magn-rlim)

**Rule (UFO §5, AC-8).** One event pulls at most **10 non-player elements**.

- **An element** is one entity: a ground item stack, a stack extracted from one container slot, a mob, a minecart, or the single item produced by a block (a door counts once).
- **When.** The set is chosen once, at magnet-on. Nothing found later joins it, except exempt drops (`L0-magn-rexm`).
- **Priority** is strict between classes:
  1. iron ground items;
  2. iron container stacks;
  3. mobs and minecarts;
  4. built iron blocks;
  5. ore.

  A lower class is considered only if the higher classes leave free slots.
- **Within a class,** candidates are ordered nearest first by 3-D distance from the event centre (the block under the target at arrival). Ties go by entity id or block position, so the order is deterministic in tests.
- **Players** never count toward the 10 and are never in the set (`L0-magn-rply`).
- **A lost slot is not refilled.** An element that becomes invalid during the hold (picked up, killed) leaves its slot empty.




- **node**: L0-magn-rlim

### Magn rply concept rule (L0-magn-rply)

**Rule (UFO §5, §6; AC-4, AC-5, AC-6).** A player is pulled in a given tick **if and only if** all of the following hold:
- they are inside the zone cylinder and alive;
- their game mode is neither Creative nor Spectator; Adventure is pulled (`L0-xasm14`);
- the **main-hand or off-hand** stack is in IRON_ITEMS.

**What does not count.** Iron in the inventory or in worn armour slots. A legendary in hand is never iron.

**How.**
- `applyKnockback`, each tick, toward the point 6 blocks below the saucer, with the step capped at **0.6 blocks per tick**.
- Once there, the player is held, with a measured deviation of ≤ 0.03 (U1).

**Stop and resume (U10).**
- The hand state is re-read every tick. After a drop (`Q`) or a slot switch to non-iron, no knockback is sent from that tick on, and the player falls.
- Taking iron back into a hand while the magnet is on resumes the pull on the next tick.
- Leaving the zone horizontally stops the pull in the same way.

**Unlimited.** Any number of players can be pulled; they are outside the 10-element limit.




- **node**: L0-magn-rply

### Magn rrel concept rule (L0-magn-rrel)

**Rule (UFO §6; U1, U2; AC-7, AC-14).**

**One tick.** When the magnet goes off, every element and every held player is released in the **same tick**, with no staggering.

**Vanilla physics.**
- After the release the magnet applies no impulse and no teleport.
- Things fall from where they are, under vanilla gravity.

**Fall damage.**
- Fall damage is vanilla, counted **from the release point only**; time spent hovering adds nothing.
- U2: release at 37 blocks dealt 33 damage, a death; this is intended.
- A player lowered near the ground before release takes none (U1).
- If `applyKnockback` holding is found to accumulate fall distance, `magn` resets it before release (`L0-xasm16`, `L0-magn-a07`).

**Mobs.** Mobs take vanilla fall damage; iron golems are immune.

**Afterwards.** Released items are ordinary items: they can be picked up and despawn on the vanilla timer.

**Death from the fall.** A player who dies from the fall keeps legendaries under `lgnd` death retention; the other drops are vanilla.




- **node**: L0-magn-rrel

### Magn rrng concept rule (L0-magn-rrng)

**Rule (UFO §6, U11).** Elements hold on a ring of **radius 5 at 3 blocks below the saucer**, spaced evenly and rotating slowly. Players are held 6 blocks below the saucer on its axis, so a held player is about 5.8 blocks from every slot.

**Keep-away.** A hovering player picks up items within about 2 blocks (U11). In every tick, an **item** element's target that comes within 3 blocks of any player (for example, a player rising past the ring) is moved radially outward until it is 3 blocks clear. If it cannot clear radially, it is moved up instead. The margin is an assumption (`L0-magn-asrg`).

**Scope.** Mobs, minecarts and armour stands are not subject to pickup, but they use the same ring.

**On the way in.** Elements still flying toward the ring use the same keep-away offset for their next step.




- **node**: L0-magn-rrng

### R-sauc-1 · Hull hit test: a charge's swept segment against a cylinder of r 6 × h 3, in any phase (L0-sauc-r001)

# R-sauc-1 · Hull hit test: a charge's swept segment against a cylinder of r 6 × h 3, in any phase

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-p002", "L0-sauc-p003", "L0-sauc-as01", "L0-adr-ufoi"]`

**Rule.** A charge hits the saucer in a tick when all of the following hold:
1. `attack.dimensionId` is the Overworld.
2. The horizontal distance between the charge column `(x, z)` and the saucer position `(sx, sz)` **in that tick** is ≤ 6.0.
3. The vertical segment `[to.y, from.y]` swept this tick overlaps the hull band `[sy, sy + 3]`, closed at both ends (`as01`).

The test holds in every phase while the saucer entity exists: arrival, magnet, departure, and the downed fall (`as05`).

**Why a segment.** Charges fall 1 block per tick, so a point test at the charge position could miss nothing at today's speed. But `FALL_SPEED` is a tunable, and the sweep keeps the test exact at any speed, the same way the block-contact sweep does.

**Saucer position.** The test uses the position the saucer holds when the flight loop runs. The order of `ufoc`'s interval relative to the orbital interval is not fixed. A ≤ 0.225 block-per-tick lag during arrival is accepted: the hull edge tolerance is effectively ±0.25.

**Not a hit:**
- A charge column at a horizontal distance greater than 6.
- A charge whose whole fall lies above or below the band.
- Charges in the Nether or the End.




- **node**: L0-sauc-r001

### R-sauc-2 · Flight-path geometry and timing (L0-sauc-r002)

# R-sauc-2 · Flight-path geometry and timing

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-p001", "L0-sauc-as04", "L0-ufoc"]`

**Rule** (UFO §2 table, AC-2):

| Leg | From | To | Duration |
|---|---|---|---|
| Arrival | horizontal distance 90 from the centre on bearing θ, at `hoverY + 10` | hover point `(centre, hoverY)` | 400 ticks (20 s) |
| Hover | hover point | hover point | 1200 ticks (60 s), set by `ufoc` |
| Departure | hover point | horizontal distance 90 on bearing θ + 180°, at `hoverY + 10` | 300 ticks (15 s) |

After that the saucer is removed in the same tick.

**Constraints.**
- The horizontal distance from the centre stays ≤ 90 on every tick, and so never exceeds the 100-block U8 limit (C-12′). The 100 is read as horizontal (`as04`).
- θ is uniform in [0, 2π). The departure bearing is exactly opposite.
- The motion is continuous: the position step is ≤ 0.5 blocks per tick on every leg. The fastest step is at the middle of an eased leg, and stays under 0.5 blocks per tick for both legs.
- `hoverY` comes from `ufoc`: centre + 40, capped at ceiling − 15. `sauc` never recomputes it.
- The arrival and departure height is `min(hoverY + 10, ceiling − 4)`, so the hull never rises above the build limit and stays reachable by a charge in every phase (`L0-adr-ufht`, which resolves `sauc-cx01`).
- Nothing in the world changes the path: the saucer has no physics or collision, and it passes through terrain (UFO §7).




- **node**: L0-sauc-r002

### R-sauc-3 · Immune, unpushable, non-colliding (within the known engine traps) (L0-sauc-r003)

# R-sauc-3 · Immune, unpushable, non-colliding (within the known engine traps)

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-ent1", "L0-sauc-ac02"]`

**Rule** (UFO §7, AC-16): nothing but an Orbital charge crossing the hull affects the saucer or the beam. Not damage, not knockback, not a push, not collision. The Cannon itself acts **only** through the script hull test (`r001`), never through entity damage.

**Required BP shape.** This is the same pattern as the shipped `orbital_charge.json` and the U-probe entities:
- `format_version` **1.26.0**. The 1.26.50 format drops `minecraft:pushable` and refuses the whole entity.
- `runtime_identifier: "minecraft:snowball"`. Without it, a custom entity pushes mobs.
- `collision_box` 0 × 0, so players cannot hit or target it and it does not block anything.
- `physics {has_gravity: false, has_collision: false}`.
- `pushable {is_pushable: false, is_pushable_by_piston: false}`.
- `knockback_resistance 1`.
- `damage_sensor {cause: "all", deals_damage: "no"}`.
- No `health` component and no `projectile` component.
- `is_spawnable false`. `is_summonable true` for tests only.

**Consequences.**
- Arrows, tridents, TNT and other explosions, lightning, lava, fire, and the `/damage` command change nothing.
- `/kill` and `/andrew:ufo stop` are removals, not damage. They fall outside AC-16 and are handled as an aborted event (`p001`).
- Charges are never stopped by the entity. They are stopped by the interceptor.




- **node**: L0-sauc-r003

### R-sauc-4 · One shoot-down per event: a harmless blast, the reward exactly once, and a broadcast naming the charge owner (L0-sauc-r004)

# R-sauc-4 · One shoot-down per event: a harmless blast, the reward exactly once, and a broadcast naming the charge owner

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-p002", "L0-sauc-ad03", "L0-sauc-as03", "L0-ufoc"]`

**Rule** (UFO §8, AC-15; priority (1), C-7):
1. **First crossing wins.** Only the first charge to satisfy `r001` triggers the shoot-down. It is latched on `eventId`. Later crossings are absorbed but produce no second reward, broadcast or `reportShotDown`.
2. **The blast is harmless:**
   - no `createExplosion` (even `breaksBlocks: false` deals entity damage);
   - no block is changed;
   - no entity takes damage or knockback;
   - no fire.

   It is only particles plus the `random.explode` sound.
3. **The reward** is exactly `minecraft:diamond × 8` and `minecraft:totem_of_undying × 1`, as two item entities at the blast point. It is spawned once per `eventId`, never on a departure, a `stop` or a restart.
4. **The broadcast** goes to every online player: `andrew.ufo.shot_down` = RU "%s сбил НЛО!" / EN "%s shot down the UFO!". `%s` is the **owner of the absorbed charge** (`attack.ownerId`), not the closest player and not the event target.
5. **The schedule** is the next arrival at 15 min after the shot, set by `ufoc` from `reportShotDown`.




- **node**: L0-sauc-r004

### R-sauc-5 · The beam: translucent green, saucer underside to the ground, shown only during the magnet phase (L0-sauc-r005)

# R-sauc-5 · The beam: translucent green, saucer underside to the ground, shown only during the magnet phase

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-ad01", "L0-sauc-ent1", "L0-sauc-ac05"]`

**Rule** (UFO §7, DoD):
- **Visibility.**
  - The beam is visible if and only if `ufoc`'s phase is `magnet`.
  - It turns on in the magnet-on tick.
  - It turns off in the release tick, or in the shoot-down tick.
  - It is never visible during arrival, departure or the fall.
- **Look.**
  - A cone, wide end at the bottom, apex at the underside of the saucer.
  - The bottom radius is ≈ 5 blocks, a tunable judged on the iPad. It is not tied to the 50-block magnet zone.
  - Green with alpha ≈ 0.35–0.5. Terrain and pulled items are visible through it.
  - It is rendered without back-face culling and does not cast a shadow.
- **Length.** `hoverY − centre.y` (normally 40) is sent to the client as an int actor property `andrew:beam_len`. The geometry bone scales by it. The beam ends at the centre block. It does not follow terrain under the cone.
- **Visible whole.** `visible_bounds` covers the disc and the full beam length, so the client does not cull the beam when the disc is off screen. The beam is not damageable and not collidable: it is part of the saucer entity (`ad01`), so `r003` covers it.




- **node**: L0-sauc-r005

### R-sauc-6 · Sounds (L0-sauc-r006)

# R-sauc-6 · Sounds

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-r005", "L0-sauc-p002", "L0-sauc-as02"]`

**Rule** (UFO §7: vanilla `beacon.*` is allowed):

| Moment | Sound | Where |
|---|---|---|
| Magnet on | `beacon.activate` | saucer position |
| Every 40 ticks during the magnet (first at +40) | `beacon.ambient` | saucer position |
| Magnet off (release or shoot-down while the magnet is on) | `beacon.deactivate` | saucer position |
| Shoot-down blast | `random.explode` | blast point |

- The sounds are played with `dimension.playSound(id, pos, {volume: 4})`. Bedrock attenuates over about 16 × volume blocks, so 4 gives a ~64-block range and covers a player on the ground 40 below, inside the 50-block zone (`as02`).
- All calls go through one `playUfoSound()` wrapper so GameTests can count them (`ac05`).
- There is no arrival or departure sound; the spec asks for none.
- The hum stops on the release tick. No sound plays after the saucer is removed.




- **node**: L0-sauc-r006

### Constraints · `sclk` (component NFRs; inherits C-1 … C-28) (L0-sclk-cons)

# Constraints · `sclk` (component NFRs; inherits C-1 … C-28)

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["constraints"]` · `relates_to: ["L0-sclk-as04", "L0-sclk-ad04"]`

| Id | Constraint | From |
|---|---|---|
| K-sclk-1 | Zero per-tick cost when no bolt is alive and the carve queue is empty. No world scans, ever. | C-5f, §11 |
| K-sclk-2 | ≤ 3 trail particles per bolt per tick; bolt lifetime ≤ 100 ticks | C-5f, `xasm27` |
| K-sclk-3 | ≤ 300 `setType` per tick from the carve queue; no `runJob`, no new `runInterval` | ad04 |
| K-sclk-4 | Stable `@minecraft/server` 2.10.0 only; no Experiments; deviations are documented in the README | C-16, §13 |
| K-sclk-5 | Server-authoritative: every hit, damage and edit decision is in the BP script; the RP is cosmetic | §11 |
| K-sclk-6 | Edits respect C-12 (no unloaded writes) and C-27 (box, protect-first, deny list) | C-27 |
| K-sclk-7 | Acceptance with ≥ 2 SimulatedPlayers per combat test (a shooter plus a target or bystander) on the **checks** BDS; GameTests never default to production | C-20‴ |
| K-sclk-8 | Pure planners (`crater-plan.ts`, the speed gate, Piercing stripping) are node-tested with no `@minecraft/server` import. Platform quirk: `addEnchantments` silently drops a conflicting element and does not throw, while `canAddEnchantment` on a conflict throws `EnchantmentLevelOutOfBoundsError` instead of returning false | the repo pattern |
| K-sclk-9 | Defs #1–#4 keep byte-identical behaviour; the Orbital carve is unchanged after the deny-list move | `xcx24`, `xcx25` |




- **node**: L0-sclk-cons

### Sclk r001 concept rule (L0-sclk-r001)

**R-sclk-001 · One arrow → one bolt → at most one outcome (C-26, §8, §11)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-sclk-p002", "L0-sclk-p004", "L0-sclk-p005", "L0-sclk-ent3"]`

- Each substituted arrow gives **exactly one** bolt. Emulated Multishot gives exactly two more. Each bolt has its own `BoltRecord`.
- A record resolves **at most once**, to exactly one of: `entity` (p004), `block` (p005) or `expired` (p003). The handler deletes the record **before** acting, so a duplicate event (hit-entity then hit-block) is a no-op.
- Three Multishot bolts are three records. They are never merged into one hit, one damage call or one carve job.
- No other path damages an entity: not the trail, not the crater and not the patch.

Source: §8 ("each processed independently"), §11 ("cannot merge three arrows into one hit event"), §14.




- **node**: L0-sclk-r001

### Sclk r002 concept rule (L0-sclk-r002)

**R-sclk-002 · Fixed Sonic Boom damage (C-28)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xasm23", "L0-xcx22", "L0-adr-scdm", "L0-scyt", "L0-sclk-p004"]`

- `SONIC_BOOM_DAMAGE = 10` (HP). It is exported from one module (`src/sculk/constants.ts`) and read by the GameTests (`xasm23`; the probe's Q8 may replace the value, never the shape).
- Every living direct hit takes **exactly D** from absorption, then health, or kills the target if hp ≤ D. This holds:
  - at any difficulty (T07);
  - with any armour, Protection level or raised shield (T08) — which holds only because the cause is `sonicBoom`;
  - inside the hurt-invulnerability window (T17, `xcx22`).
- The mechanism is `sonicBoom`-cause `applyDamage` (exact through armour, Protection and a raised shield, absorption first), plus `setCurrentValue(hp − D)` only inside a known window. If hp ≤ D, it is an overkill `applyDamage(hp + 100)` with the same cause. The shipped Scythe pattern it descends from spans `volley.ts:115-133`.
- `damagingEntity` is the bolt's owner while the owner is valid, so the kill credit and the death message name the shooter.
- No vanilla arrow damage, no Power bonus, no crit bonus and no tipped effect is ever added (§9, §14).
- A totem of undying still works, because the lethal path goes through `applyDamage` with cause `sonicBoom`; an `entityAttack` overkill is stopped by a raised shield instead.




- **node**: L0-sclk-r002

### Sclk r003 concept rule (L0-sclk-r003)

**R-sclk-003 · Crater shape and bounds (§6, C-27)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-adr-sctr", "L0-sclk-ent4", "L0-sclk-p005"]`

- The footprint is a 5×5 square centred on the impact cell, in the plane of the hit face. The depth goes ≤ 3 cells into the face, from the impact cell inward. The crater never leaves this 5×5×3 box.
- Shape: an ellipsoid with semi-axes ≈ (2.5, 2.5, 3), each surface cell jittered by `seed`. **The impact cell and the cell behind it are always carved**, so the centre is ≥ 2 deep.
- Irregularity: on flat stone, at least one of the 25 footprint columns at the rim is left uncarved, so it is never a perfect box.
- The same `(impact, face, seed)` always gives the same cells (a pure function, node-tested).
- Side and ceiling hits carve into the face hit, not downward.
- The skip rules are r010 and `xasm25`: air, liquids, the deny list, unloaded cells and cells out of height range.




- **node**: L0-sclk-r003

### Sclk r004 concept rule (L0-sclk-r004)

**R-sclk-004 · Sculk placement (§5, §7, C-27)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xasm24", "L0-sclk-ent4", "L0-sclk-p004", "L0-sclk-p005"]`

- The only block placed is `minecraft:sculk`. Never a sensor, shrieker, catalyst or vein.
- **Eligible cell:** a solid full block (not a liquid, a container, a block entity, the deny list, or air) with an air or passable block on the exposed side.
  - Block hit: the cells form the crater's new inner surface plus the rim surface, inside the 5×5 around the impact.
  - Entity hit: the top surface under the target.
- **Box:** ≤ 5×5 in footprint, centred on the impact column (block hit) or on the target's feet column (entity hit). For an entity hit, the surface is searched ≤ 6 blocks below the feet (`xasm24`); if there is none, there is no patch.
- **Ragged edge:** the corner cells and about 30 % of the outer-ring cells are skipped by `seed` (§5, "not a perfect square").
- Sculk is permanent. There is no timer and no rollback. It survives a chunk or server reload as an ordinary block.
- The patch happens only as a bolt outcome. No other path places sculk (§7).




- **node**: L0-sclk-r004

### Sclk r005 concept rule (L0-sclk-r005)

**R-sclk-005 · Enchantments (§8)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-sclk-ad01", "L0-sclk-cx01", "L0-adr-scbs", "L0-sclk-as05"]`

- **Allowed:** Quick Charge (I–III), Multishot, Unbreaking (no effect, since there is no durability) and Mending (no effect).
- **Piercing is forbidden.**
  - Any `andrew:sculk_crossbow` stack found with `piercing` loses it. This is checked on `playerInventoryItemChange`, on a held-item change and on craft-token delivery.
  - The stack keeps its other enchantments. No XP is refunded.
  - Log `sculk: stripped piercing from <player>`.
- Even before a strip lands, Piercing never changes an outcome. A bolt resolves once (r001), so a pierce-through is impossible by construction.
- **Quick Charge** shortens the required charge time. Natively it is the vanilla 1.25 s − 0.25 s × level. When emulated (`as05`), the release-speed gate (r006) takes the same table.
- **Multishot** gives three bolts: native or emulated at ±10° yaw (`as05`), one arrow consumed.




- **node**: L0-sclk-r005

### Sclk r006 concept rule (L0-sclk-r006)

**R-sclk-006 · Ammunition and charge (§9, `xasm27`)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xasm27", "L0-sclk-cx02", "L0-sclk-ad01", "L0-sclk-p002"]`

- **Ammunition:** `minecraft:arrow` in every variant (plain, tipped, spectral). No firework rockets. Tipped and spectral effects are discarded.
- **Consumption:** as the engine spends it. In Survival, one arrow per shot, Multishot included. In Creative, none.
- **The reload is the only limiter** (§9: no cooldown).
  - A shot is charged if its **loading draw** lasted ≥ 25 − 5·QC ticks. Speed cannot tell: every fired arrow leaves at full speed (2.965–3.041 measured), so there is no under-charged arrow to detect.
  - Quick Charge does **not** natively shorten the time to full charge; shortening it is script work (`as05`).
  - An under-length release fires nothing and spends nothing — the native gate admits no early shot (`cx02`).
- **Bolts are never picked up.** They are removed on their outcome or on expiry.
- **Lifetime:** `BOLT_LIFETIME_TICKS = 100`.




- **node**: L0-sclk-r006

### Sclk r007 concept rule (L0-sclk-r007)

**R-sclk-007 · The trail is visual only and bounded (§4, §11, C-5f)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-sclk-p003", "L0-sclk-ad02"]`

- The trail is emitted only for a bolt with a live record, from the shared interval, at ≤ `TRAIL_PER_TICK` = 3 particles per bolt per tick. It is placed on the segment between the bolt's last and current real positions.
- Worst case: one player, a Multishot volley of 3 bolts × 3 particles × 100 ticks = 900 particle spawns in 5 s.
- The trail has no damage, no knockback, no block edits, no sound loop and no entity. No dummy entity carries it.
- Nothing lingers after the bolt dies: the particle's own lifetime is ≤ 1 s (an RP look-alike sets `max_lifetime ≤ 1`).
- The bolt itself is the physical projectile. The trail is never a hitscan ray (§9).




- **node**: L0-sclk-r007

### Sclk r008 concept rule (L0-sclk-r008)

**R-sclk-008 · Infinite durability (§1, §3, T18)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-sclk-ent1", "L0-adr-scbs"]`

- Under option A (`adr-scbs`), the item JSON has **no `minecraft:durability`** component, so shots, melee and use never create a damage value. `ItemStack.getComponent("minecraft:durability")` is `undefined`.
- Under option B (a fallback, `lgnd`-owned): after each shot, the script resets `durability.damage = 0` on the marked stack. T18 then goes to `lgnd` (plan routing).
- An anvil cannot "repair" it, and Unbreaking or Mending change nothing. Both are allowed (r005).




- **node**: L0-sclk-r008

### Sclk r009 concept rule (L0-sclk-r009)

**R-sclk-009 · Passive legendary: no ability, no cooldown, no HUD (§1, §9, §10, `xcx24`)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xcx24", "L0-lgnd"]`

- Def #5 has no ability block. It writes no cooldown or busy key, never claims a Use in `resolveActivation`, and never adds an Action Bar line.
- With the crossbow in one hand and the Katana, Cannon or Scythe in the other, the other weapon's Use and HUD behave as they do today.
- Holding the crossbow alone shows **no** "Ready" line.
- `sclk` adds no other framework hook. Any further need is a new L0 contradiction (plan, reduce §1).




- **node**: L0-sclk-r009

### Sclk r010 concept rule (L0-sclk-r010)

**R-sclk-010 · One shared deny list for weapon terrain edits (C-7, `xcx25`)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-xcx25", "L0-adr-sctr", "L0-orbc", "L0-pntr", "L0-xasm6"]`

- `PENETRATOR_KEEP` (`src/orbital/penetrator-keep.ts:34`) moves to `src/terrain/keep.ts`, exported as `TERRAIN_KEEP`. `penetrator-keep.ts` re-exports it, or its imports are updated, so the Orbital behaviour is byte-identical.
- The crossbow crater and the sculk patch never `setType` a block in `TERRAIN_KEEP`.
- No per-weapon copy or extension. If the crossbow needs an extra exclusion, it goes into the shared list and the Orbital gate re-runs.
- Liquids are skipped by the crater (`xasm25`), not by the list. The list keeps its Orbital meaning.




- **node**: L0-sclk-r010

### Rule: when the active fires, and what it costs (L0-strm-rcd)

---
title: "Storm Blade activation validity, cooldown spend and trace limits"
is_a: ["rule"]
part_of: ["L0-strm"]
relates_to: ["L0-xasm31", "L0-strm-pact", "L0-lgnd"]
---
# Rule: when the active fires, and what it costs

1. **A valid release spends 600 ticks (30 s), always.** A hit, a miss into air, and a wall at 0.5 blocks all count. That follows §02: "кулдаун начинается при валидном выпуске".
2. **An invalid attempt spends nothing and shows nothing new.** Invalid means:
   - on cooldown, or busy;
   - a stale (duplicate) stack;
   - a dead or spectating player;
   - the blade in neither hand;
   - the eye's chunk not loaded.
3. **The passive is independent.** It never reads or writes `sb` cooldown keys, and the active never gates the passive.
4. **Range.** The trace is ≤ **10.0 blocks Euclidean** from the eye along the view vector. The block-ray budget (cell steps) is set larger and then clamped by distance.
5. **The stop** is the first block that `katn`'s `TRACE_FLAGS` treat as solid. Liquids and passable blocks do not stop it. The trace never passes a stop, and no entity beyond the stop is eligible ("never through walls").
6. **One target.** It is the nearest living non-wielder whose ray distance is less than the stop distance. A second target is never damaged, even if the first dies.
7. **HUD.** The action bar shows «Клинок бури — Готово» / "Storm Blade — Ready" when ready, otherwise the whole seconds left (ceil), through the shared legendary HUD and lang keys.
8. **Cooldown persistence** follows the `lgnd` rules for def cooldowns (cited, not restated).




- **node**: L0-strm-rcd

### Rule: `stormDamage(target, D, wielder, opts?)` (L0-strm-rdmg)

---
title: "Storm damage helper: exact pre-armour D, never swallowed, never doubled"
is_a: ["rule"]
part_of: ["L0-strm"]
relates_to: ["L0-adr-sbdm", "L0-xasm29", "L0-xcx26", "L0-xcx27", "L0-sclk"]
governs_files: ["src/storm/damage.ts"]
---
# Rule: `stormDamage(target, D, wielder, opts?)`

**Rule.** Every Storm Blade damage event (active D = 10, passive D = 6) goes through one helper. Armour, toughness, Protection and Resistance then reduce D **exactly as for a vanilla `entityAttack` of D** (xasm29, C-29).

It has three modes, mirroring `src/sculk/hit.ts` modes but **not importing them**:
- **native**: the target is in no window. `applyDamage(D, { cause: entityAttack, damagingEntity: wielder })`.
- **window**: the target was hit L ticks-ago < `HURT_WINDOW_TICKS` (10) by a hit of strength L.
  - If P1 passes, `applyDamage(L + D, …)`; the engine takes the difference D and armours it.
  - If P1 fails, compute D′ (vanilla armour reduction of D) and subtract it from health, *unless* `health − D′ ≤ 0`, in which case take the lethal path.
- **lethal**: `applyDamage` with a value that guarantees death after armour, so totems, the death message and kill credit fire natively.

**Invariants**
- Exactly one target per call. No area effect, so a bystander's Δhealth = 0.
- No true-damage write in the native path. The `sonicBoom` cause is never used, because it bypasses armour, which C-28 does not grant this weapon.
- The helper records `(targetId → lastHitStrength, tick)` for every landed Storm hit, so a passive on an active (or the reverse) within 10 ticks still nets D.
- Active and passive are **separate calls** (§05). They are never merged into one 16-HP call.
- The return value of `applyDamage` is **not** evidence of damage, because it returns true when swallowed (`hit.ts:25`). Tests read health.
- A raised shield cancels the call (platform). This is deviation (a) of `xcx27` until `xq8` is answered.




- **node**: L0-strm-rdmg

### Rule: spectacle never acts (C-30) (L0-strm-rvis)

---
title: "Storm visuals are particles and sound only"
is_a: ["rule"]
part_of: ["L0-strm"]
relates_to: ["L0-adr-sblt", "L0-strm-pprb"]
---
# Rule: spectacle never acts (C-30)

- No `minecraft:lightning_bolt` is spawned or summoned, and the id does not appear in `src/storm/`. A grep check enforces this.
- A **strike** is a vertical column (~6 blocks above the point down to the point) of spark and flash particles from the P4 list, plus `ambient.weather.lightning.impact` at the point.
  - The active plays **3** strikes, staggered ≤ 6 ticks.
  - The passive plays **1**.
- The **trace** is wind and spark particles every ~0.5 block from the eye to the hit or stop point. It is drawn once.
- Visuals cause no damage, fire, knockback, mob conversion or block change. They add no entity, so the entity count in the test volume is unchanged.
- The work is scheduled on the shared `runInterval` (memory: `runJob` stalls). There is no work after the last strike (C-5f analogue).
- The deviation "lightning drawn with particles, not a vanilla bolt" is recorded under C-16 in the deviations doc. Spec §05 explicitly allows it.




- **node**: L0-strm-rvis

### R-ufoc-1 · Schedule timing (L0-ufoc-r001)

# R-ufoc-1 · Schedule timing

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["rule"]` · `relates_to: ["L0-ufoc-ent1", "L0-ufoc-p001", "L0-ufoc-as03", "L0-xasm14"]`

**Rule** (UFO §2, §8, §10; AC-1):
1. **First arrival** = first join + U[10, 20] min of real time. The draw is uniform and is made once, when `next_ms` is written.
2. **Next arrival** = the end of the departure + exactly 15 min. After a shoot-down, it is the shot + 15 min.
3. **Restart mid-event:** the next arrival is the restart + 15 min.
4. **Restart in a pause:** the stored `next_ms` holds, so the timer survives the restart.
5. **Due with no Overworld player:** the arrival waits and starts at the first check after such a player is present. Missed arrivals do not accumulate.
6. **Durable times** are epoch ms from `env.now()`, which is `Date.now` in the product. A tick count or `getAbsoluteTime` must never be used (C-21).

**Precision:** the idle check runs every 100 ticks, so an arrival may start up to 5 s late, or more under lag (`as03`). Phase durations are counted in ticks (`ad01`).




- **node**: L0-ufoc-r001

### R-ufoc-2 · Target and centre selection (L0-ufoc-r002)

# R-ufoc-2 · Target and centre selection

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["rule"]` · `relates_to: ["L0-ufoc-ent2", "L0-ufoc-as02", "L0-ufoc-p001"]`

**Rule** (UFO §2, §10):
- **Candidates** = `env.overworldPlayers()`, the online players for which all of these hold:
  - `isValid === true`;
  - `dimension.id === "minecraft:overworld"`;
  - health > 0.

  Unreadable (`undefined`) entries are dropped; product packs see simulated players that way. Game mode is not a filter (`as02`).
- **Target** = one candidate drawn uniformly through `env.random()`. For `come`, the target is the invoker when they are a candidate (`p004`).
- **Centre** = `{floor(x), floor(y) − 1, floor(z)}` of the target at arrival start, which is the block under their feet (`as02`). It is frozen for the whole event.
- The event goes on at the centre if the target leaves, dies, changes dimension or logs out (§10). After selection, no `ufoc` logic reads the target again.




- **node**: L0-ufoc-r002

### R-ufoc-3 · Hover height (L0-ufoc-r003)

# R-ufoc-3 · Hover height

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["rule"]` · `relates_to: ["L0-adr-ufht", "L0-sauc-r002", "L0-magn"]`

**Rule** (UFO §2, `L0-adr-ufht`):

`hoverY = min(centre.y + 40, ceiling − 15)`, where `ceiling = world.getDimension("overworld").heightRange.max`. On current Bedrock that is 320, so `hoverY` ≤ 305.

- It is computed once at arrival start and is part of every `onPhase` payload.
- `sauc` and `magn` never recompute it. `sauc` caps its legs at `min(hoverY + 10, ceiling − 4)` from the same `ceiling`.
- The magnet zone's top is `hoverY`, and its bottom is `centre.y − 20` (UFO §3, `magn`).
- With a centre at or above 276, `hoverY` is the cap and the saucer hovers less than 40 blocks above the centre. That is intended (`adr-ufht`).




- **node**: L0-ufoc-r003

### R-ufoc-4 · One event, Overworld only, one interval, fixed tick order (L0-ufoc-r004)

# R-ufoc-4 · One event, Overworld only, one interval, fixed tick order

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["rule"]` · `relates_to: ["L0-adr-ufpc", "L0-adr-ufom", "L0-ufoc-ad02", "L0-ufoc-p002"]`

**Rule** (UFO §2, §11; C-5d; AC-3):
1. At most one session, and therefore at most one saucer, exists in the world. An arrival never starts while a session exists, from the schedule or from `come`.
2. The event exists only in the Overworld. The centre, the saucer and the zone are always in `minecraft:overworld`. Players in the Nether or the End are never candidates and never make an arrival start.
3. All UFO world mutation runs inside the one UFO `runInterval`:
   - phase changes;
   - the saucer step;
   - the magnet scan, hold and release.

   The only exception is `sauc`'s charge absorption inside `orbc`'s step (`adr-ufpc`).
4. `ufoc`, `sauc` and `magn` create no `runTimeout`, no `runJob` and no second interval. The command defers its work through one `system.run` (`p004`).
5. Order within a tick: latch → liveness → advance phase → `saucerStep` → `magnetStep`.
6. With no session, a tick costs one counter check, and the clock and properties are read every 100 ticks.




- **node**: L0-ufoc-r004

### R-ufoc-5 · Arrival notice and localization (L0-ufoc-r005)

# R-ufoc-5 · Arrival notice and localization

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["rule"]` · `relates_to: ["L0-ufoc-as05", "L0-sauc", "L0-ufoc-ac07"]`

**Rule** (UFO §7, §12):
- **When:** once, at arrival start, in the same tick the session is created. This applies to `come` too.
- **Who:** every valid Overworld player whose horizontal distance to the centre is ≤ 150 blocks (`as05`). Players in other dimensions never receive it.
- **What:** `player.sendMessage({ rawtext: [{ translate: "andrew.ufo.arrival" }] })`. The client renders it in its own language:
  - `en_US.lang`: `andrew.ufo.arrival=A UFO is in the sky!`
  - `ru_RU.lang`: `andrew.ufo.arrival=В небе НЛО!`
- The shoot-down broadcast `andrew.ufo.shot_down` (`%s`) belongs to `sauc`, not here.
- Lang files must keep the UTF-8 encoding of the existing entries.




- **node**: L0-ufoc-r005

### R-ufoc-6 · Enable flag and how commands affect the schedule (L0-ufoc-r006)

# R-ufoc-6 · Enable flag and how commands affect the schedule

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["rule"]` · `relates_to: ["L0-ufoc-p004", "L0-ufoc-as01", "L0-ufoc-ent1"]`

**Rule** (UFO §9; AC-17):
1. `andrew:ufo_enabled` defaults to true when absent. It is stored in the world and survives a restart.
2. While it is false, no scheduled arrival starts. The first-join write of `next_ms` still happens, so the first window is known once the event is enabled.
3. `disable` during a live event stops the event exactly like `stop`: everything held is released and the saucer is removed (`as01`).
4. `enable` with `next_ms` in the past pushes `next_ms` to now + 15 min, so re-enabling never drops a saucer the same second (`as01`).
5. `stop` ends the event, and the next arrival is set to now + 15 min. `stop` does not change the flag.
6. `come` ignores the flag and the schedule. When the event it starts ends, the usual +15 min rule applies (`r001`).
7. The commands run for operators only (`GameDirectors`). A non-operator invocation changes nothing.




- **node**: L0-ufoc-r006

