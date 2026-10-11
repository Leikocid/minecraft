---
title: Scope
type: analysis
generated_at: "2026-10-11T18:49:56.606Z"
source_channel: rollout
node_id: rollout-scope
aliases: ["rollout-scope","scope"]
is_a: ["rollout","scope"]
relates_to: ["L0-trdt-a001","L0-trdt-a002","L0-trdt-a003","L0-trdt-a004","L0-trdt-a005","L0-trdt-a006"]
priority: 630
---

# Scope

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

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


- **level**: 2

### AC-trdt-005 (bds) · Enchantment scrub; magnet and lgnd touch points (L0-trdt-a005)

# AC-trdt-005 (bds) · Enchantment scrub; magnet and lgnd touch points

**Links.** relates_to: L0-trdt-r003, L0-trdt-adcl, L0-magn.

- **Scrub.** GIVEN a trident with Loyalty III, Riptide III and Unbreaking III put in the inventory (via `/replaceitem`, an anvil-equivalent write), WHEN it is observed, THEN Loyalty and Riptide are gone and Unbreaking III stays. This also holds after a throw and return, and after an lgnd death restore.
- **Magnet.** The magnet's legendary scenarios include def #7 (on the ground, in a chest, held by a mob). A custody entity inside the magnet zone is never selected or moved.
- **Departure watch (T3).** A throw logs no `left an inventory` recovery line and mints no copy within 40 ticks.


- **level**: 2

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


- **level**: 2

