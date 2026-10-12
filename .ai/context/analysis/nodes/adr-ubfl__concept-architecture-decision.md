---
type: "concept-architecture-decision"
node_id: "L0-adr-ubfl"
source_channel: "rollout"
analysis_version: 11
title: "ADR-L0-ubfl · Underwater Bow design"
aliases: ["L0-adr-ubfl"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 640
size_chars: 3699
tags: ["v10", "underwater-bow", "status:proposed"]
level: 2
---
---
title: "ADR-L0-ubfl · Underwater Bow: tagged vanilla arrow with liquid-neutral flight, armed charge spent on hit (replace-mode setHit), scripted Super Fire"
aliases: ["L0-adr-ubfl", "Underwater Bow design"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-uwbw", "L0-sclk", "L0-strm", "L0-lgnd", "L0-trdt-adrf", "L0-xcx33", "L0-xasm38", "L0-uwbw-adfl", "L0-uwbw-adex", "L0-uwbw-cx01", "L0-adr-lgwd"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1", "underwaterbowmacefireworksenchantingspecv2ruen-part-2"]
governs_files: ["src/sculk/bolt.ts", "src/storm/damage.ts", "src/legendary/scripted-damage.ts", "src/legendary/cooldown.ts", "packs/behavior/entities/trident_in_flight.json"]
---
# ADR-L0-ubfl · Underwater Bow design

**Context.** The spec asks for four things:
- arrows that fly in water and lava as they do in air;
- 2 s of fire on every hit;
- an armed hit: 14 HP before armour, a lightning visual, and 5 s of fire that water cannot put out;
- a 30 s cooldown that only a successful hit starts.

The stable API (2.10.0) constrains the design in three ways:
- it has no `projectileShoot` event;
- `setOnFire` in water is put out by the engine;
- `cause projectile + damagingEntity` throws in `applyDamage`.

**Decision (proposed; the `uwbw` probe confirms each part).**
1. **Item.** `andrew:underwater_bow` is a custom shooter that takes vanilla arrows (the `sclk` precedent). It has no durability and `minecraft:enchantable` slot `bow`, so vanilla bow enchantments and their conflicts come from data.
2. **Flight (amended at reduce v10 → `L0-uwbw-adfl`).** **Default: keep the vanilla `minecraft:arrow`.** `entitySpawn` tags the arrow from this bow in the same tick and stores its spawn velocity. While the arrow's block is water or lava, the one shared interval restores the air path. That keeps vanilla damage, Power, Punch, crit, Flame, tipped effects and Infinity for free. The `sclk`-style swap to `andrew:underwater_arrow` (`liquid_inertia` 0.99) is adopted **only if** probe rows 1–3 show that it reproduces the vanilla damage table exactly and meets ± 10 % in lava. The snowball-runtime precedents deal no impact damage, so the swap is the riskier path.
3. **Damage.**
   - **Normal hit:** vanilla bow damage, including Power, Punch and crit, plus `setOnFire(2)`, or Flame's measured duration if that is longer.
   - **Armed hit (amended at reduce v10 → `L0-uwbw-adex`, closes `L0-uwbw-cx01`):** the hurt before-event sets the hit to exactly 14 before armour through a new **replace-mode** `setHit(event, 14, {causes: [projectile]})` in `src/storm/damage.ts`. It shares `raiseHit`'s defence read, `afterArmour` and lethal plan. **It does not use `raiseHit`**, which only adds to `entityAttack` hits and would give vanilla + 14; `raiseHit`'s behaviour stays frozen. A lethal 14 writes 0 and follows through with `applyScriptedDamage(… cause: entityAttack, damagingEntity: shooter)` on the next tick, which keeps credit and the totem. The cause deviation is noted in the README. Then `playStrikes` runs once per hit key (C-30′), Super Fire is applied, `startCooldown(600)` runs, and the armed flag is cleared, all in one synchronous block (C-26).
4. **Armed state.** This is a per-player dynamic property `ub:armed`, which survives logout and restart (C-41). Sneak + the start of Use sets it (`xcx33`). The hit's after-event clears it only when the before-event recorded damage > 0 on a living entity that is not a sim-only witness. The arrow carries `ub:armedShot` from the tag in `entitySpawn`, so a shot fired before arming never spends the charge.
5. **Super Fire.** This is a scripted status with `{target, untilTick}` in one shared `runInterval`. Each second it applies 1 HP of `fireTick`, marked through `scripted-damage.ts`, and re-applies `setOnFire` for the visual out of water. In water it shows particles in place of flames. It spares fire-immune targets and places no blocks (C-43).
6. **Recipe.** A token recipe with `craftReturn: [[bucket, 2]]`, the `trdt-adrf` path.

**Rejected.**
- **A vanilla `minecraft:bow` with a lore tag.** The lore is lost on anvil rename and enchant, and the item cannot be a unique legendary or carry its own textures.
- **Velocity correction on every vanilla arrow.** It costs work every tick and misattributes arrows from other bows. Correction on *this bow's tagged* arrows while in a liquid is the default (§2).
- **`raiseHit` with a `causes` option for the 14.** It is additive (`src/storm/damage.ts`, read at reduce v10), so the armed hit would be vanilla + 14 (`L0-uwbw-cx01`).
- **Cooldown on arming.** The spec says a miss must not start a cooldown.
- **`setOnFire(5)` alone for Super Fire.** Water puts it out immediately.
- **A real `lightning_bolt`.** C-30′ forbids it. It would deal extra damage and place fire.
