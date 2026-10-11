---
title: Business Rules
type: project-knowledge
generated_at: "2026-10-11T18:49:56.572Z"
source_channel: rollout
node_id: rollout-business-rules
aliases: ["rollout-business-rules","business-rules","project-knowledge/business-rules"]
is_a: ["rollout","business-rules"]
relates_to: ["L0","L0-trdt-cons","L0-trdt-r001","L0-trdt-r002","L0-trdt-r003"]
priority: 630
---

# Business Rules

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Global Constraints (v9) (L0)

---
title: "Global Constraints"
aliases: ["L0-constraint", "Constraints"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0", "L0-trdt", "L0-adr-twlt", "L0-adr-twth", "L0-adr-twrp"]
see_also: ["constraints", "abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
supersedes: ["L0-constraint@v8"]
---
# Global Constraints (v9)

**Carried unchanged:** C-1 … C-29, C-31, C-32, C-5a′, C-5d, C-5e, C-5f, C-7″, C-12′, C-20⁗. All of them bind the trident. The ones it leans on most:
- C-2: stable 2.10.0, no Experiments.
- C-7: no duplication. For the trident this covers the craft, the bucket return, and throw/return.
- C-16: the closest stable equivalent, with the limitation *reported*.
- C-22: filter out `undefined` players.
- C-26: the outcome is decided once, on the server.
- C-29: exact, non-stacking bonus damage. It applies to the +2 (`xasm34`).

**C-30 is amended (C-30′).** See the table.

| ID | Constraint | Source |
|---|---|---|
| C-30′ | *(amended)* **Spectacle never deals damage.** A weapon's lightning, wind or electric visual causes no damage, fire, knockback, mob conversion or block change. **The exception:** a spec that explicitly asks for a *real* lightning entity may get one, but only after the client answers (`xq10`). Even then the bolt deals no damage beyond the spec's stated bonus. | storm §02/§05; trident §02 (`xcx29`) |
| C-33 | *(new)* **One weapon, one place.** At any tick a legendary copy is in exactly one of these places: an inventory or container slot, a dropped item entity, **in custody** (a projectile, a return entity, or a pending delivery), or nowhere because its world flag is unset. A held copy and an in-flight copy never coexist, and a returned copy is inserted exactly once. | trident §02, §03 |
| C-34 | *(new)* **Ingredient returns are exact.** A craft that returns container items (empty buckets) returns exactly the count consumed. That holds with a full inventory, through shift-craft, and through a blocked-craft refund. The refund never yields both the filled and the empty bucket. | trident §01, §03 |
| C-35 | *(new)* **Movement abilities are free and safe.** The dash has no cooldown and no input other than the weapon's own Use. Each dash grants exactly one fall-damage cancel, on the next landing, and an unused grant expires (`xasm36`). | trident §02 |
| C-36 | *(new)* **Held-only buffs.** A buff tied to holding a weapon applies only to its holder, only while it is in the main or off hand, and is gone within 1 tick of switching away, dropping it, or throwing it. | trident §02 |
| C-37 | *(new)* **Built-in enchantments are excluded.** If a weapon builds an enchantment in, that enchantment can never stay on the item. Wherever data cannot block it (anvil, enchanting table, `/enchant`), the script removes it on the next inventory observation and reports this as a limitation. Other enchantments in the slot are kept. | trident §02 |
| C-20⁵ | *(extended)* Trident acceptance needs:<br>• a melee hit and a thrown hit against an armoured SimulatedPlayer, compared with a vanilla trident;<br>• a dash from a dry platform with no rain;<br>• a measured landing;<br>• a measured return speed from a block hit at ≥ 20 blocks;<br>• a re-throw attempted mid-return;<br>• a full-inventory craft. | trident §04 |




- **node**: L0

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

