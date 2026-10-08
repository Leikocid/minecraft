---
type: "concept-process"
node_id: "L0-strm-ppas"
source_channel: "rollout"
analysis_version: 8
title: "Passive melee proc"
aliases: ["L0-strm-ppas"]
is_a: ["process"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 2276
tags: ["v8", "storm-blade", "passive"]
level: 2
---
---
title: "Storm Blade passive: melee hit → 30 % roll → +6 HP + one strike"
is_a: ["process"]
part_of: ["L0-strm"]
relates_to: ["L0-strm-rdmg", "L0-strm-rvis", "L0-xasm30", "L0-xcx26", "L0-adr-sbdm"]
---
# Passive melee proc

1. **Trigger.** `world.beforeEvents.entityHurt` (cause entityAttack, damagingEntity a Player whose main hand holds the blade; readable in the callback) where:
   - `damagingEntity` is a Player;
   - its **main hand** holds a live `andrew:storm_blade`;
   - `hitEntity` is valid and has `minecraft:health`.

   An off-hand blade never procs, because Bedrock never melees with the off hand (xasm30). Item frames, health-less stands, items and orbs are not "living".
2. **Roll** (C-32). `if (rng() < 0.30)`, once per landed hit, with no streak or pity state. `rng` defaults to `Math.random` and is injected by tests (`setStormRng`).
   - On a miss, stop: the hit stays a plain diamond-sword hit.
3. No L is needed. The window and both hurt events use post-armour damage. Order in the swing's tick: beforeEvents.entityHurt → entityHitEntity → entityHurt.
4. **Bonus.** `event.damage += f(6)`; strike visual via `system.run`.
5. **Visual.** One strike at the target's position (`L0-strm-rvis`).
6. **Cooldown untouched.** The passive never reads or writes `sb` cooldown keys, so it procs at the same rate while the active is cooling down (§02, §06).

## Edge cases
- **A critical (falling) hit** raises L. The bonus must still net exactly +6 pre-armour. The raise adds f(6) on top of whatever the hit deals, so Sharpness needs no L (14.00 → 20.00 bare). Crits not measured.
- **A lethal melee** (the target died from the hit): no bonus and no strike, because the target is invalid.
- **A bonus that would be lethal**: it goes through `applyDamage`, so totems and credit work (C-29).
- **A raised shield** facing the wielder cancels the bonus by the same < 90° rule that blocks the melee; from behind both land.
