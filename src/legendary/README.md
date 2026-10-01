# legendary

Everything shared by the three legendary weapons — the Web Sword, the Scythe of
Calamity and the Orbital Cannon. `LEGENDARIES` in `registry.ts` is the list; the
Miner's Pickaxe is **not** on it and keeps vanilla behaviour in every way.

## A legendary cannot be destroyed

Orbital §5, extended to all three by
`decision-legendary-rules-obschie-dlya-vseh-legendarnyh`. The engine offers an
immunity component for fire only, so the rule is kept two ways: **immunity**
where a component exists, and **return** everywhere else — the instance dies, the
owner is handed it back at the next generation, and the dead copy can never cast
again (`state.ts`, `isLive`).

Every path below is held by a scenario. A path with no scenario is a path that
will reopen silently.

| Path | Held by | Scenario |
|---|---|---|
| Fire | `minecraft:fire_resistant` on the item: the entity never dies | `legendary_survives_fire` |
| Lava | the same component | `legendary_survives_lava` |
| A vanilla TNT, anyone's | return | `legendary_returns_from_tnt` |
| Cactus | return. Measured: a cactus eats only what rests on its **top face** — an item inside its cell or against its side survives (`probe_cactus_items`) | `legendary_returns_from_cactus` |
| Despawn after five minutes | return. The scenario models it with `remove()`: to this module a despawn is an entity that is simply gone, and 6000 ticks is past any scenario budget | `legendary_returns_when_it_vanishes` |
| The Void | return, prescribed by §5 itself | `legendary_returns_from_void` |
| The owner's death | retention: the stack stays in the inventory | `legendary_offhand_death_returns`, `legendary-retention` units |
| Our own ring blasts and the penetrator | the instance is moved out of the volume **before** the explosions, item frames broken open for it | `legendary_protect_ground_item`, `legendary_protect_framed` |
| An entity destroyed in the same tick it appeared | the departure ledger below — `watch()` never sees it, so the entity is not what is tracked | `legendary_pickup_sighting_not_consumed` |

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
