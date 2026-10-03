---
title: Business Rules
type: project-knowledge
generated_at: "2026-10-03T14:58:23.865Z"
source_channel: rollout
node_id: rollout-business-rules
aliases: ["rollout-business-rules","business-rules","project-knowledge/business-rules"]
is_a: ["rollout","business-rules"]
relates_to: ["L0","L0-katn-r001","L0-katn-r002","L0-katn-r003","L0-katn-r004","L0-katn-r005","L0-katn-r006","L0-katn-r007","L0-katn-r008","L0-lgnd-r001","L0-lgnd-r002","L0-lgnd-r003","L0-lgnd-r004","L0-lgnd-r005","L0-lgnd-r006","L0-lgnd-r007","L0-lgnd-r008","L0-lgnd-r009","L0-lgnd-r010","L0-lgnd-r011","L0-lgnd-r012","L0-lgnd-r013","L0-lgnd-r014","L0-lgnd-r015","L0-lgnd-r016","L0-lgnd-r017"]
priority: 600
---

# Business Rules

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Global Constraints (L0)

---
title: "Global Constraints"
aliases: ["L0-constraint", "Constraints"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0", "L0-adr-ktob", "L0-adr-ktfl", "L0-katn"]
see_also: ["constraints", "dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3", "ufomagnetspecv1ruen-part-4"]
supersedes: ["L0-constraint@v4"]
---
# Global Constraints

**Carried unchanged:**
- C-1 … C-14 (v2);
- C-5a′ and C-15 … C-20 (v3);
- C-5d, C-7″, C-12′ and C-21 … C-23 (v4).

All of them bind the Katana. The ones it leans on most:
- C-2: stable 2.10.0, no Experiments.
- C-7: no duplication. The craft gate and protection come from `lgnd`.
- C-12: never write into unloaded chunks. An unreadable trace cell is a blocker.
- C-15: the priority order.
- C-16: closest stable equivalent, documented.
- C-21: the cooldown is in epoch ms.
- C-22: filter out `undefined` players.

v6 adds:

| ID | Constraint | Source |
|---|---|---|
| C-24 | *(new)* **Wielder movement is server-authoritative and conservative.** The destination is computed only by the script from the server-side head location and view direction at activation, and capped at 20 blocks. The player is never placed in a cell the obstacle predicate (`L0-adr-ktob`) calls solid. Nothing is placed into a cell that cannot be read (unloaded chunk or outside the height range): such a cell counts as solid. A movement ability never edits blocks. | Katana §5, §6, §11, §14 |
| C-25 | *(new)* **Protective flags are one-shot and bounded.** A protection granted by an ability (the Katana's fall flag) is consumed by its first qualifying event and also expires after a wall-clock bound (epoch ms, C-21), whichever comes first. Like in-flight events (C-23), it is not persisted across a restart. It must never become a standing immunity. | Katana §7; T12 |
| C-5e | *(new)* **Ability visuals are one-shot.** A trail is spawned once, on success, as a bounded number of particle emissions in the activation tick (or spread over ≤ 10 ticks via the shared interval), with no lingering entities and no per-tick scans. The fall-flag watch costs nothing while no player carries the flag. | Katana §8, §14; C-5d |
| C-20″ | *(extended)* Katana acceptance uses ≥ 2 players: the trail is visible to an observer, and the cooldown belongs to the owner only. | Katana §8, §11 |




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
| Item entity burnt (fire, lava), cactus, vanilla explosion, despawn | **Returned** to the last holder with `gen + 1`, plus a private `returned` message; queued in the owed list if the holder is offline | `p003` (deviation C-16) |
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

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad13", "L0-magn", "L0-lgnd-r013", "L0-lgnd-ac21", "L0-lgnd-ac22", "L0-lgnd-cx13"]
---
**R-lgnd-016: The magnet never moves a legendary, and anything it moves that holds one stays recoverable.** Source: UFO §4, AC 13; Agent priorities (1).

1. **Predicate.** "Legendary" for the magnet means `isLegendaryStack(stack)`: the type is a def's `itemId` or `craftTokenId`, in any mark state (`ad13`).
2. **Ground / container stacks.** A stack for which the predicate is true is never selected, never extracted and never teleported. It does not count towards the 10-element limit.
3. **Whole-entity elements.** The magnet does not select:
   - a chest or hopper minecart with any slot holding a legendary;
   - an armour stand or mob with a legendary in a hand slot.
   It takes the next candidate instead.
4. **Holder blocks.** *Reduce v4: dormant.* `L0-magn-adhp` takes the hopper out of the pulled-block list, so the magnet turns no `HOLDER_TYPES` block into air (`L0-adr-ufnd`). The clause stays as the floor for any future change to that list. Turning a `HOLDER_TYPES` block into air is script-caused destruction. `protectLegendariesIn` runs first, in the same synchronous step (`r013`, tier 1). The legendary is then dropped next to the cell with the same id and gen, and is **not** pulled.
5. **Players.** A player is pulled by iron in either hand. A legendary in the other hand rides along as part of the player. That is not "pulling the weapon", and death retention covers it (`ac22`).
6. **Late drops.** A legendary dropped during the magnet within 12 blocks of the hover point is not iron, so it is not pulled beyond the limit either.
7. **Release / stop / restart.** The magnet holds no legendary, so it never has to release, persist or restore one.

**Why the entity case is a rule, not a nicety.** A pulled entity is teleported every tick and dropped with vanilla physics. It may land in lava, cactus or the Void. Its contents then spill as item entities, and recovery only catches them through `entitySpawn`, after the magnet has already moved the weapon. That is visible "pulling" (AC 13).




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

