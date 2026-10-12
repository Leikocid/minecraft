# legendary

Everything shared by the eight legendary weapons — the Web Sword, the Scythe of
Calamity, the Orbital Cannon, the Dragon Katana, the Sculk Crossbow, the Storm
Blade, the Above-Water Trident and the Underwater Bow. `LEGENDARIES` in
`registry.ts` is the list; the Miner's Pickaxe is **not** on it and keeps
vanilla behaviour in every way. A weapon joins by adding its def: the Katana,
the Crossbow and the Storm Blade bring no recovery, retention or protection code
of their own (`L0-adr-ktgr`, `L0-lgnd-ac27`, `L0-strm-acr`).

## One survival craft per world

The recipe outputs a craft token, never the weapon. `craftgate.ts` swaps every
token that reaches an inventory or the off hand: the first Survival or Adventure
token claims the world's flag and becomes a weapon marked `craft`; every later
one is refunded with `def.refund`; a Creative or Spectator token becomes a plain
copy. A plain weapon stack — a `/give`, a Creative copy, an admin copy — is never
gated.

A def whose recipe consumes a container lists it in **`craftReturn`**. An add-on
recipe hands no container back, while vanilla cake does
(`docs/feedback/probe-trident.md` §1), so the gate gives it with every craft it
keeps — the claim and the Creative unwrap — and never with a refund, which hands
the full ingredient back instead. The Trident and the Underwater Bow are the
defs with one, and the same one: 2 empty buckets with a kept craft, 2 water
buckets with a refund, never both kinds (`L0-trdt-adrf`, C-34;
`docs/feedback/probe-ubow.md` §7 measured the bow's recipe). It is the probe's
branch of `L0-adr-trlg` §2: with no engine return there is nothing to exchange,
so `refundExchange` is not added.

Refund and return stacks are split by the item's max stack size before they are
added: `new ItemStack(id, n)` clamps `n` to it without a word, so one stack of
2 water buckets is 1 bucket. What does not fit drops at the player's feet.
Scenarios: `websword_first_claim`, `websword_second_refund`,
`legendary_give_then_craft_*`, `legendary_*_other_flags_untouched`,
and, from one generator per bucket def (`trident_*`, `ubow_*`),
`_craft_two_empty_buckets`, `_craft_full_inventory`,
`_blocked_restart_seed` / `_check` (across a restart) and
`_creative_and_commands_spend_nothing`; units in
`tests/legendary-craftgate.test.mjs`.

## A legendary cannot be destroyed

Orbital §5, Katana T17, Crossbow T20 and Storm Blade §02, extended to all of them by
`decision-legendary-rules-obschie-dlya-vseh-legendarnyh`. The engine offers an
immunity component for fire only, so the rule is kept two ways: **immunity**
where a component exists, and **return** everywhere else — the instance dies, the
owner is handed it back at the next generation, and the dead copy can never cast
again (`state.ts`, `isLive`).

Every path below is held by a scenario. A path with no scenario is a path that
will reopen silently. The `legendary-fireproof.ts` scenarios run every def in
`LEGENDARIES`, one cell each on a two-column grid. Before anything is written,
each scenario reads the block under every cell from the engine, and it must be
the platform's stone floor. Eight defs fit the 7×7 platform; a ninth lands past
its edge and fails that read. `legendary_katana_*`, `legendary_sculk_crossbow_*`
and `legendary_storm_blade_*` are the Katana's, the Crossbow's and the Storm
Blade's own instances of the rest (`L0-lgnd-ac24`, `ac27`, `L0-strm-acr`);
`legendary_trident_*` and `trident_*` in `src/gametest/trident-legendary.ts`
are the Above-Water Trident's (`L0-trdt-a005`).

| Path | Held by | Scenario |
|---|---|---|
| Fire | `minecraft:fire_resistant` on the item: the entity never dies, and after 10 s it still lies in its cell with the same id and generation | `legendary_survives_fire` |
| Lava | the same component | `legendary_survives_lava` |
| A vanilla TNT, anyone's | return | `legendary_returns_from_tnt` |
| Cactus | return. Measured: a cactus eats only what rests on its **top face** — an item inside its cell or against its side survives (`probe_cactus_items`) | `legendary_returns_from_cactus` |
| Despawn after five minutes | return. The scenario models it with `remove()`: to this module a despawn is an entity that is simply gone, and 6000 ticks is past any scenario budget | `legendary_returns_when_it_vanishes` |
| The Void | return, prescribed by §5 itself, to the last holder (below) | `legendary_returns_from_void`, `legendary_katana_void_thrown`, `legendary_sculk_crossbow_void_thrown`, `legendary_storm_blade_void_thrown`, `legendary_trident_void_thrown` (enchanted, named, with lore) |
| The Void, after a hand-over | return to whoever held it last, never to its crafter; an offline or dead holder is owed it and paid on their next spawn (`L0-lgnd-ad11`). A SimulatedPlayer cannot reconnect with the same id, so on the engine the payment is proven on respawn, the same `playerSpawn` handler; the join itself (`initialSpawn: true`) is a node test | `legendary_hold_void_*`, `legendary_storm_blade_hold_void_after_transfer`, `_holder_offline`, `_holder_dead_redeemed`, the same three `legendary_trident_hold_void_*`, `legendary-recovery` units |
| The owner's death, whatever killed them | retention: the stack comes back with the **same** id and generation, and the same look (below); it never reads the damage cause | `legendary_offhand_death_returns`, `legendary_ufo_fall_death_keeps` (a fall from the UFO's hover height), `legendary_katana_death_kill`, `legendary_katana_death_lava`, `legendary_katana_death_after_jump` (killed in the jump's own tick), `legendary_katana_death_lava_after_jump`, `legendary_sculk_crossbow_death_kill`, `_lava`, `_offhand` (Quick Charge, Multishot, a name and lore), `legendary_storm_blade_death_kill`, `_lava`, `_offhand` (Sharpness, Looting, a name and lore), `legendary_trident_death_kill`, `_lava`, `_offhand` (Unbreaking, Impaling, a name and lore), `legendary-retention` units |
| The owner's death while it lies in a chest | nothing to do: retention reads the dying player's slots only, and the chest keeps the instance at the same generation | `legendary_in_a_chest_stays_there`, `legendary_storm_blade_in_a_chest_stays_there`, `legendary_trident_in_a_chest_stays_there` |
| The chest it lies in is destroyed | broken: the chest spills, the instance lies on the ground at the same generation and is watched. Someone's TNT: whatever the blast does to the spill, exactly one live copy is left, on the ground or back with its holder | `trident_chest_destroyed` |
| A minecart or armour stand holding it is destroyed | return: the holder spills its contents as item entities, which recovery watches like any other — also after the holder was teleported away and back | `legendary_ufo_holder_chest_minecart`, `legendary_ufo_holder_hopper_minecart`, `legendary_ufo_holder_armor_stand`, `legendary_trident_holder_chest_minecart` |
| A minecart or armour stand holding it falls into the Void | return: the engine removes the holder below the floor with no spill. Recovery reads a minecart's inventory as it is removed, and kills a stand that holds a legendary while it is below the floor, so the stand spills it (below) | `legendary_holder_void_chest_minecart`, `legendary_holder_void_hopper_minecart`, `legendary_katana_void_chest_minecart`, `legendary_stand_void_hands` |
| Our own ring blasts and the penetrator | the instance is moved out of the volume **before** the explosions, item frames broken open for it; same id and generation, nothing owed | `legendary_protect_ground_item`, `legendary_protect_framed`, `legendary_survives_orbital_column` (every def and a vanilla control in one chest inside an LMB column: the control is gone, each def lies outside the footprint once), `pntr_legendary_two_columns` (a Web Sword and a Katana in chests inside the two columns), `ring_legendaries_survive` (a Web Sword in a chest, a Scythe and a Katana on the ground) |
| A Katana jump (`L0-lgnd-r017`) | nothing to do: `player.teleport` spawns no item entity, changes no slot, raises no `DropItem` swing and removes no minecart, so no loss trigger fires. A watched item whose chunk unloads behind the jumper is logged as unloaded and watched again through `entityLoad` | `legendary_katana_jump_keeps_recovery` |
| An entity destroyed in the same tick it appeared | the departure ledger below — `watch()` never sees it, so the entity is not what is tracked | `legendary_pickup_sighting_not_consumed` |

## A returned copy is the same item

A death return and a loss return both mint a new stack from a ledger entry
(`grant` in `retention.ts`): the player's pending list, or the world's owed
list. A mark alone would bring back a bare weapon. So the entry also carries the
stack's **look** (`ItemLook` in `rules.ts`): its enchantments, its anvil name
and its lore. The look is read where the instance leaves the world:
- retention path A, from the slot;
- retention path B, from the dropped stack;
- a watched item entity;
- a departure from a slot;
- a minecart's inventory in the Void;
- a protect hand-back that has to be owed.

`grant` puts the look back. An enchantment the item no longer admits is left off
and named in the log. An entry without a look, written before looks existed or
with a malformed one, returns a bare copy rather than nothing. Nothing else on a
stack is carried: the legendaries have no durability, and the mark is the only
dynamic property they hold. Measured red before this, on BDS: a crossbow with
Quick Charge and Multishot came back bare from a death and from the Void.

## The departure ledger

`entitySpawn` arrives after a removal, and `watch()` cannot read an invalid
entity, so an item entity destroyed in the tick it appeared is never watched and
its death is nobody's business. Measured, not deduced: the owner picked an
instance up, dropped it, the entity died in that tick, and the instance was gone
for good — zero copies, zero owed.

So what is tracked is the **departure**: an instance that leaves a player's slot
is recorded with the player's cell, and the next check asks where it is now —
a watched entity, any player's inventory or off hand, or a container within
`IN_FLIGHT_SEARCH_HALF` of the cell. Nowhere ⇒ lost ⇒ returned.

A departure alone is not a loss, though. **It must be one the player swung for**
(`EntitySwingSource.DropItem`, within `DROP_SWING_WINDOW_TICKS` of the
departure). Moving an instance into a shulker-box *item*, a bundle or an ender
chest empties the slot exactly the same way, and a script can read none of those
three — so without the swing a return would quietly unstore the weapon. The same
gate is why `/clear` and a scripted `clearAll()` do not resurrect a legendary,
which `probe_retention_two_copies` holds.

Two more things worth keeping in mind:

- Storing a legendary in a chest is a departure too, and must not recall it. The
  swing gate and the container search both keep it on the shelf, also across the
  owner's death and respawn (`legendary_in_a_chest_stays_there`,
  `legendary_storm_blade_in_a_chest_stays_there`).
- A sighting of a pickup is evidence only for the entity it was recorded against.
  A departure is resolved by where the instance **is**, never by where it was —
  that is why `whereIs` only consults the sighting set on the entity path.

What this leaves open, named rather than hidden: a legendary thrown away and
destroyed in that same tick is covered, but one that leaves an inventory into
storage no script can read and is destroyed *there* (the shulker item burns with
its holder) is not, because nothing can tell that case from ordinary storage.

A holder *entity* that falls into the Void is removed by the engine with no
death and no spill. For a chest or hopper minecart, recovery reads its inventory
in `beforeEvents.entityRemove` when the minecart is below the floor and returns
every live instance through the same loss path (`legendary_holder_void_*`).
An armour stand has no script inventory or equippable, but `hasitem` reads its
hands, also below the floor. Recovery follows every loaded stand
(`entitySpawn`/`entityLoad`, a 1-tick interval that runs only while one is
loaded), asks a stand only once it is below the floor, and `kill()`s one that
holds a legendary type in either hand. That stand is already inside the 13-tick
window before the engine removes it. The spill keeps its mark, so the same loss
path returns it (`legendary_stand_void_hands`, `probe_stand_void`). An unmarked
copy spills and is not returned; a stand holding anything else is left to the
engine.

## The UFO Magnet takes a legendary like iron

The magnet reads the registry, not a list of its own: `isLegendaryWeaponStack` for
ground items and container stacks, and every def's `itemId` in a `hasitem` query
for a mob's or a stand's hands. A craft token is never magnetic. A new def is
pulled the moment it is registered; `ufo_magnet_legendaries` holds the Storm Blade
on the ground, in a chest and in a stand's off hand beside the other weapons.
`trident_magnet_legendary` does the same for the Above-Water Trident — on the
ground beside a Storm Blade, in a chest, in a zombie's main hand and a stand's
off hand — with custody entities in the zone that are never taken (below).

## Enchantments a legendary never keeps

`enchant.ts` takes an enchantment off a weapon whose own behaviour already does
what it does: `FORBIDDEN_ENCHANTMENTS` lists Loyalty and Riptide for the
Above-Water Trident (R-trdt-003); every other enchantment the item admits stays —
Unbreaking, Impaling, Channeling, Mending. The list, and the Sculk Crossbow's
`PIERCING`, live in the engine-free `enchant-rules.ts`; its `forbiddenFor()` is
what the enchanting roller (`src/enchanting/roll-rules.ts`) reads, so a table
never offers what a strip takes off (L0-ench-r003). The scrub is the Sculk
Crossbow's Piercing strip (`src/sculk/enchant.ts`) driven by a table, with the
same two triggers: the
`playerInventoryItemChange` that names the slot, in its own tick, and a hotbar
change for the selected slot and the off hand, which no inventory event names. A
scrub writes the slot back only when it took something off, so it cannot feed
itself, and the mark rides along. A death or loss return mints the copy from the
ledger's look and puts it in through `addItem`, so a look with Loyalty in it is
scrubbed on arrival (`trident_enchant_scrub_death_restore`). Exported
`scrubStack()` is for a caller that re-inserts a stack itself (the trident's
return).

Deviation (C-16): stable 2.10.0 has no before-event for an anvil or an
enchanting table, so their previews show Loyalty and Riptide and the anvil
consumes the book; the enchantment comes off the moment the stack reaches the
inventory. Measured on BDS 1.26.51.1: the engine refuses Riptide on a stack that
has Loyalty (`addEnchantment` throws, mislabelled as a level out of bounds), so
the two never sit on one stack; each is scrubbed on its own
(`trident_enchant_scrub`).

## A copy in custody (the trident's throw)

A thrown trident is in no slot and on no ground: it is held by the trident's
custody record and one entity of its own (`L0-trdt-adcl`). The framework gains
one export for it and no scan hook (T2): `deliverToLastHolder(def, mark, how)`
is the loss path above — the generation moves first, then the last holder gets
the copy if online and alive, or is owed it until their next spawn; a stale
mark delivers nothing. The rest needs no change, and why:

| # | Point | Why it holds without code | Proof |
|---|---|---|---|
| T3 | the departure ledger | a throw empties the hand slot from a script and raises no `DropItem` swing, so the departure is dismissed as storage; only a swing inside `DROP_SWING_WINDOW_TICKS` makes it a drop | `trident_throw_departure_not_a_loss` (with the swing as control), node test |
| T4 | death retention | the slot is empty while the copy is in custody, so nothing is stashed and nothing lies at the death spot; custody delivers | `trident_custody_fallback`, node test |
| T5 | `watch()` | it returns for every entity whose type is not `minecraft:item`, before reading a component | `trident_throw_departure_not_a_loss` (no recovery line for the custody entity), node test |
| T6 | the magnet | ground items are `minecraft:item` entities; holders are tagged by `hasitem`, and a custody entity has no inventory and no iron type | `trident_magnet_legendary`, node test |

`trident_custody_fallback` drives `deliverToLastHolder` on the engine for an
online, a dead and an offline thrower, and for a record already delivered.
