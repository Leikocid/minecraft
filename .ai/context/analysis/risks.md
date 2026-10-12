---
title: Risks
type: analysis
generated_at: "2026-10-12T18:07:51.665Z"
source_channel: rollout
node_id: rollout-risks
aliases: ["rollout-risks","risks"]
is_a: ["rollout","risks"]
relates_to: ["L0-ench-cx01","L0-uwbw-cx01","L0-xcx32","L0-xcx33"]
priority: 640
---

# Risks

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

### CX-ench-01 · xq11 promises "anvils untouched", but the option (a) signature cannot tell an anvil from a table (L0-ench-cx01)

# CX-ench-01 · xq11 promises "anvils untouched", but the option (a) signature cannot tell an anvil from a table

**is_a:** contradiction · **part_of:** L0-ench · **target:** L0-adr-enrl (option a) · **relates_to:** L0-xq11, L0-xcx32, L0-ench-prob, L0-ench-ac06
**Category:** assumption-gap. **Status:** open.

**Side A.** `L0-xq11` option (a) tells Andrey: "Anvils and books are untouched."

**Side B.** `L0-adr-enrl` decision 2(a) detects a table use as "a stack that gained enchantments while the player's level dropped by 1–3". Two facts of the vanilla flow break that signature:
1. **Timing and identity.** The table has its own input slot. The item **leaves** the player inventory when it is placed, the levels drop **at the click**, and the enchanted stack comes back as a **new arrival**, possibly many ticks later, when the player takes it out. No inventory stack "gains" enchantments in place. That only happens for `/enchant`, which has no level drop.
2. **The anvil overlaps.** Anvil + book (for example, a Mending book on a pickaxe) also costs levels, often 1–3, and also returns an enchanted stack on take-out. A level-drop-plus-arrival heuristic would therefore **re-roll anvil results**, destroying a Mending book the player applied on purpose. That breaks the promise in Side A and the spec's scope (§4 targets only the table).

**What could separate them (the probe's Q4):**
- the book or second item leaving the inventory before the anvil take-out;
- a rename;
- lapis;
- table proximity (a block ray or a nearby `enchanting_table` check at the time of the drop).

None of these is proven. The probe must show whether any of them is reliable, including the case where the player puts the book in the anvil long before the take-out.

**Effect.**
- Until Q4 is answered, the option table sent with `xq11` must not say "anvils untouched" for (a) unless the verdict proves a separating signal. Otherwise the cost line reads "may also re-roll some anvil results".
- Not blocking for the probe or the roller. Blocking for building adapter (a).

**Not self-resolved.** The reducer or analyst decides whether to amend `xq11`'s wording or the ADR's detection rule.

**Resolved at reduce v10.** `L0-adr-enrl` 2(a) now detects an *arrival* after a level drop and requires a Q4-proven separator. The `xq11` (a) anvil line is a placeholder that the probe verdict fills in; it no longer promises "anvils untouched". Still blocking for building adapter (a); not blocking for the probe or the roller.







### CX-uwbw-01 · ADR-ubfl's "exactly 14 through `raiseHit`" vs what `raiseHit` does (L0-uwbw-cx01)

# CX-uwbw-01 · ADR-ubfl's "exactly 14 through `raiseHit`" vs what `raiseHit` does

**Links.** relates_to: L0-adr-ubfl, L0-strm, L0-uwbw-r003, L0-uwbw-adex, L0-xasm38.

**Side A.** The planning documents describe the armed hit as a rewrite to exactly 14 through `raiseHit`:
- `L0-adr-ubfl` §3: "the hurt before-event rewrites the hit to exactly 14 before armour, through `strm` `raiseHit` with an opt-in `causes: [projectile]`";
- the plan row says the same;
- `xasm38` says the 14 **replaces** vanilla arrow damage.

**Side B, verified in code** (`src/storm/damage.ts:315-345`). `raiseHit(event, damage)` is the Storm Blade's **additive** passive:
1. It returns early unless `damageSource.cause === entityAttack`. It has no `causes` parameter, so a projectile hit is never raised.
2. It computes `bonus = afterArmour(damage, defence)` and plans `event.damage + bonus`. The hit *grows* by 14; it does not become 14.

Called as the ADR says, even with a `causes` opt-in, an armed arrow would deal vanilla arrow damage + 14 (for example 9 + 14 at full draw), not the 14 that C-29 and `xasm38` require.

**Impact.** This changes the `strm` seam. A `causes` option alone is not enough; a *replace* mode is needed (`L0-uwbw-adex`). The Storm Blade's behaviour must not move (plan reduce seam: "`raiseHit`'s projectile cause is opt-in only").

**Proposed resolution** (for reduce, not self-applied to ADR-ubfl):
- Split the shared core of `raiseHit` (defence read, `planRaise` lethal/totem handling, report and emit) into an internal function.
- Add `setHit(event, preArmour, {causes})`, which targets `afterArmour(preArmour)` as the absolute post-armour damage.
- Leave `raiseHit`'s signature and behaviour unchanged.

**Closes when** ADR-ubfl §3 is amended to name `setHit` (or equivalent), and probe row 5 confirms the exact readings.

**Resolved at reduce v10.** `L0-adr-ubfl` §2–§3 were amended in place to name the replace-mode `setHit` (`L0-uwbw-adex`) and the tagged-vanilla-arrow default (`L0-uwbw-adfl`). The Storm Blade scenarios gate the merge. Probe row 5 still has to confirm the exact readings on BDS.







### CX-L0-32 · The enchanting goal vs what the stable API can do (L0-xcx32)

---
title: "CX-L0-32 · An enchanting table that offers treasure enchantments vs a stable API with no table hook"
aliases: ["L0-xcx32", "Enchanting table feasibility"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-ench", "L0-xq11", "L0-adr-enrl", "L0-xasm39", "L0-trdt", "L0-sclk"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1", "underwaterbowmacefireworksenchantingspecv2ruen-part-3"]
governs_files: ["src/legendary/enchant.ts", "src/sculk/enchant.ts"]
---
# CX-L0-32 · The enchanting goal vs what the stable API can do

**Side A: spec v2 §4 Goal.** "The standard enchanting table offers ALL vanilla enchantments valid for the item, including treasure ones … per offer/generation, a 20 % chance of a rare one." The verbs are *offer* and *generation*: the table's own three offers and its preview.

**Side B: the engine as built and recorded.**
- C-2 requires stable `@minecraft/server` 2.10.0 with no Experiments, and the spec repeats this: "без экспериментов, если возможно".
- Stable 2.10.0 has **no before-event for an anvil or an enchanting table**. This is recorded in `src/legendary/enchant.ts:1-3`, and the Sculk Crossbow's Piercing strip and the trident's Loyalty/Riptide strip both work around it after the fact.
- No component or JSON exposes the table's offer algorithm or its preview UI to an add-on.

The most a script can see is the **result**, through `playerInventoryItemChange`: a stack that gained enchantments, plus the player's XP level drop. It cannot change what the table *shows*.

**The spec anticipates this.** It says not to claim full implementation if the vanilla table cannot be intercepted, and that a custom block, UI or exchange is allowed only after approval. So this is a recorded feasibility conflict, not a defect in the spec. It still blocks the build, because any hook we can build is itself an alternative.

**Second facet: scope overlap.** §4 applies "to all eligible vanilla and supported custom items". Two existing rules forbid specific enchantments:
- C-37 / R-trdt-003: the trident's Loyalty and Riptide;
- the Sculk Crossbow's Piercing strip.

A table that "offers all compatible" enchantments would offer exactly what these rules remove. The default is that the per-def forbidden lists win: the roller excludes them and the existing scrubs keep running.

**Effect.** `L0-ench` may analyse, probe and build the pure roller. It **must not build an engine hook** until `L0-xq11` is answered.

**Resolution path.** The `ench` probe produces a verdict. Andrey then picks an option in `xq11`:
- (a) a post-hoc re-roll of the table result, with a preview mismatch;
- (b) a custom station;
- (c) a reported limitation only.

This contradiction closes on that answer. The second facet closes when `L0-adr-enrl` is accepted.







### CX-L0-33 · How is the bow's charge armed? (L0-xcx33)

---
title: "CX-L0-33 · The bow's ability is \"switched on\", but Use already draws the bow"
aliases: ["L0-xcx33", "Bow arming gesture"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-uwbw", "L0-lgnd", "L0-xasm38", "L0-adr-ubfl", "L0-xcx28"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1"]
governs_files: ["src/legendary/hands.ts", "src/legendary/cooldown.ts"]
---
# CX-L0-33 · How is the bow's charge armed?

**Side A: spec v2 §1.** "Активное умение … включение заряжает следующий УСПЕШНЫЙ выстрел" ("an active ability … switching it on charges the next SUCCESSFUL shot"). It has a 30 s cooldown and a UI status. The spec names **no input** for switching it on.

**Side B: the framework contract.**
- An active legendary claims **Use** (`resolveActivation`, `src/legendary/hands.ts:37`). Its cooldown starts when activation succeeds (`src/legendary/cooldown.ts:5`).
- On a bow, Use *is* the draw and shot. Taking Use for the ability would make the bow unable to shoot, and leaving Use alone leaves the ability unreachable.
- The cooldown here starts on a **later hit**, not at activation, so the framework's ordering does not fit either.

**Precedent.** The trident had the same "one input, two behaviours" clash (`xcx28` / `xq9`). Its default was sneak = the alternate behaviour.

**Default (CAN_ASSUME, `xasm38`).**
- **Sneak + start of Use arms the charge** while the bow is ready. The draw continues normally, so arming and shooting can be one gesture.
- Use while not sneaking is a plain shot, and a plain shot never arms.
- Arming while already armed does nothing.
- Arming during the cooldown is refused, with the HUD showing the seconds left.

The `lgnd` seam has two parts: the cooldown start is deferred until the hit, and the HUD gets a third "armed" state. Reduce records these as a widening, or schedules `lgnd` (see the plan).

**Closes when** Andrey confirms or replaces the gesture. This can ride along with `xq11` as a non-blocking sub-question. Otherwise it ships as the default with a note on the acceptance sheet.







