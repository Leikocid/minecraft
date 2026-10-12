---
title: Contradictions
type: analysis
generated_at: "2026-10-12T22:34:59.447Z"
source_channel: rollout
node_id: rollout-contradictions
aliases: ["rollout-contradictions","contradictions"]
is_a: ["rollout","contradictions"]
relates_to: ["L0-xcx32","L0-xcx33","L0-xcx34"]
priority: 650
---

# Contradictions

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

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

The most a script can see is the **result**, through `playerInventoryItemChange` — and less of it than this node first said. Measured (`docs/feedback/probe-enchanting.md` §2): the stack does **not** gain enchantments in place. It leaves the inventory when it goes into the table's slot and comes back as a fresh arrival, two separate events, possibly many ticks apart. The level drop raises **no event at all**: it is visible only by polling `player.level`. Lapis spent inside the table's own slot is invisible. The script cannot change what the table *shows*.

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






### CX-L0-34 · A "replaced" plate must not teleport, but blocks have no identity (L0-xcx34)

---
title: "CX-L0-34 · A \"replaced\" plate must not teleport, but blocks have no identity"
aliases: ["L0-xcx34", "Plate identity"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-adr-prbd", "L0-xasm42"]
see_also: ["underwaterbowfinalspecv3ruen-part-2", "underwaterbowfinalspecv3ruen-part-4", "underwaterbowfinalspecv3ruen-part-5"]
---
# CX-L0-34 · A "replaced" plate must not teleport, but blocks have no identity

**Side A (spec v3).**
- §7: record "тип/идентичность блока" (the block's type/identity).
- "Если плита сломана/заменена — привязка недействительна, телепортации нет" (if the plate is broken or replaced, the binding is void and there is no teleport).
- §8: "Destroyed/replaced plates do not teleport."

**Side B (engine, stable 2.10.0).**
- A block is only a position plus a permutation. It has no instance id.
- An oak plate broken and re-placed as an oak plate at the same position reads exactly as the original.
- The permutation is no help either: `redstone_signal` changes whenever the plate is pressed.
- Several replacement paths raise **no event a script sees**: `/setblock`, `/fill`, `/clone`, structure loads, and other add-ons' `setType`. Pistons cannot move plates, but they pop them.

**What is detectable.**
- A replacement by a **different** type: the typeId check at teleport time.
- A plate that is **missing**: the typeId is no longer `*pressure_plate`.
- A same-type replacement **through an observed path**: `playerBreakBlock`, `blockExplode`, `pistonActivate`, and the support block broken under the plate. Each of these bumps a per-position **plate generation** counter in a world dynamic property, and the binding records the generation it saw.
- A same-type replacement through an unobserved path is **not detectable**. That rod still teleports.

**Impact.** One §8 bullet ("replaced plates do not teleport") is fully met only for different-type and observed replacements. Claiming more would breach C-44 / C-16.

**Default until answered (`xasm42`).**
- Ship the typeId check plus the observed-path generation counter.
- List "a same-type plate replaced by commands or structure loads is indistinguishable" as a reported limitation in the release notes and the acceptance sheet.
- The `bds` scenarios cover a player break and re-place of the same type, an explosion, and a different-type `/setblock`.

**Closes when** the `pear` deep-dive confirms the observed-path list on 1.26.51 and Andrey accepts the limitation through the acceptance sheet. No separate question is needed unless the deep-dive finds a cheaper complete signal.






