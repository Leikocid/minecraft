# legendary

Everything shared by the five legendary weapons — the Web Sword, the Scythe of
Calamity, the Orbital Cannon, the Dragon Katana and the Sculk Crossbow.
`LEGENDARIES` in `registry.ts` is the list; the Miner's Pickaxe is **not** on it
and keeps vanilla behaviour in every way. A weapon joins by adding its def: the
Katana and the Crossbow bring no recovery, retention or protection code of their
own (`L0-adr-ktgr`, `L0-lgnd-ac27`).

## A legendary cannot be destroyed

Orbital §5, Katana T17 and Crossbow T20, extended to all five by
`decision-legendary-rules-obschie-dlya-vseh-legendarnyh`. The engine offers an
immunity component for fire only, so the rule is kept two ways: **immunity**
where a component exists, and **return** everywhere else — the instance dies, the
owner is handed it back at the next generation, and the dead copy can never cast
again (`state.ts`, `isLive`).

Every path below is held by a scenario. A path with no scenario is a path that
will reopen silently. The `legendary-fireproof.ts` scenarios run every def in
`LEGENDARIES`, one cell each on a two-column grid. Before anything is written,
each scenario reads the block under every cell from the engine, and it must be
the platform's stone floor. Six defs fit the 7×7 platform; a seventh lands past
its edge and fails that read. `legendary_katana_*` and
`legendary_sculk_crossbow_*` are the Katana's and the Crossbow's own instances of
the rest (`L0-lgnd-ac24`, `ac27`).

| Path | Held by | Scenario |
|---|---|---|
| Fire | `minecraft:fire_resistant` on the item: the entity never dies, and after 10 s it still lies in its cell with the same id and generation | `legendary_survives_fire` |
| Lava | the same component | `legendary_survives_lava` |
| A vanilla TNT, anyone's | return | `legendary_returns_from_tnt` |
| Cactus | return. Measured: a cactus eats only what rests on its **top face** — an item inside its cell or against its side survives (`probe_cactus_items`) | `legendary_returns_from_cactus` |
| Despawn after five minutes | return. The scenario models it with `remove()`: to this module a despawn is an entity that is simply gone, and 6000 ticks is past any scenario budget | `legendary_returns_when_it_vanishes` |
| The Void | return, prescribed by §5 itself | `legendary_returns_from_void`, `legendary_katana_void_thrown`, `legendary_sculk_crossbow_void_thrown` (enchanted, named, with lore) |
| The owner's death, whatever killed them | retention: the stack comes back with the **same** id and generation, and the same look (below); it never reads the damage cause | `legendary_offhand_death_returns`, `legendary_ufo_fall_death_keeps` (a fall from the UFO's hover height), `legendary_katana_death_kill`, `legendary_katana_death_lava`, `legendary_katana_death_after_jump` (killed in the jump's own tick), `legendary_katana_death_lava_after_jump`, `legendary_sculk_crossbow_death_kill`, `_lava`, `_offhand` (Quick Charge, Multishot, a name and lore), `legendary-retention` units |
| A minecart or armour stand holding it is destroyed | return: the holder spills its contents as item entities, which recovery watches like any other — also after the holder was teleported away and back | `legendary_ufo_holder_chest_minecart`, `legendary_ufo_holder_hopper_minecart`, `legendary_ufo_holder_armor_stand` |
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
  swing gate and the container search both keep it on the shelf
  (`legendary_in_a_chest_stays_there`).
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
engine. The UFO Magnet still never selects a holder that carries a legendary
(`isLegendaryStack`, L0-lgnd-r016 §3).
