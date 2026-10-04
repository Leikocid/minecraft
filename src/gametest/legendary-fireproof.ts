// Every legendary in LEGENDARIES against the hazards that destroy an item
// entity (Orbital §5, Katana T17, L0-lgnd-ac24).
//
// Fire and lava are prevented: minecraft:fire_resistant (format_version >=
// 1.21.90) keeps the marked entity in place, so recovery.ts never sees a loss.
// Cactus, a primed TNT and despawn have no stable component, so the entity is
// destroyed and recovery.ts hands the instance back at gen + 1 (C-16, L0-xcx21).
// The Void, the other return path, is held by legendary_returns_from_void
// (main.ts) and legendary_katana_void_* (legendary-recovery.ts).

import { type Container, type Dimension, type Entity, GameMode, ItemStack, type Player, type Vector3 } from "@minecraft/server";
import { type Test, registerAsync } from "@minecraft/server-gametest";
import { LEGENDARIES, type LegendaryDef } from "../legendary/registry";
import { isLegendaryItemEntity } from "../legendary/recovery";
import { type Mark } from "../legendary/rules";
import { findAllMarked, getMark, ledgerGen, makeMark, markItem, readPending } from "../legendary/state";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 2, y: 2, z: 5 };
/** Katana T17: still in place after 10 s. */
const SURVIVE_TICKS = 200;
const CONTROL_ITEM_ID = "minecraft:diamond_sword";

const log = (msg: string): void => console.warn(`[gametest] fireproof ${msg}`);
const typeOf = (dim: Dimension, at: Vector3): string => dim.getBlock(at)?.typeId ?? "unreadable";

interface Cell {
  def: LegendaryDef;
  cell: Vector3;
}

/** The platform scripts/bds-gametest.mjs writes is PLATFORM_SIZE × PLATFORM_SIZE. */
const PLATFORM_SIZE = 7;

// One cell per legendary, two apart on the platform floor (stone at
// test-relative y=1), generated from the registry. Columns x=1,3 and rows
// z=1,3,5 hold six legendaries; a seventh runs off the platform, where its item
// has no floor and falls out of every hazard's reach, and assertOnPlatform()
// fails the scenario. The vanilla control has the x=5 column to itself.
const GRID_COLUMNS = 2;
const CELLS: Cell[] = LEGENDARIES.map((def, i) => ({
  def,
  cell: { x: 1 + 2 * (i % GRID_COLUMNS), y: 2, z: 1 + 2 * Math.floor(i / GRID_COLUMNS) },
}));
const CONTROL_CELL: Vector3 = { x: 5, y: 2, z: 3 };

function assertOnPlatform(test: Test): void {
  for (const { def, cell } of CELLS) {
    const on = cell.x >= 0 && cell.x < PLATFORM_SIZE && cell.z >= 0 && cell.z < PLATFORM_SIZE;
    test.assert(on, `${def.itemId}'s cell ${cell.x},${cell.z} lies off the ${PLATFORM_SIZE}×${PLATFORM_SIZE} platform`);
  }
}

function spawnMarked(test: Test, dim: Dimension, owner: Player, def: LegendaryDef, cell: Vector3): { entity: Entity; mark: Mark } {
  const mark = makeMark("admin", owner);
  const at = test.worldLocation({ x: cell.x + 0.5, y: cell.y + 0.2, z: cell.z + 0.5 });
  return { entity: dim.spawnItem(markItem(def, new ItemStack(def.itemId, 1), mark), at), mark };
}

/**
 * Drops a marked instance of every legendary, plus a vanilla control, into the
 * same destructive block, and checks each legendary is still a valid entity in
 * its own cell with the same id and generation (not destroyed, not returned)
 * while the control is gone.
 */
async function scenario(test: Test, block: string): Promise<void> {
  assertOnPlatform(test);
  const dim = test.getDimension();
  const owner = test.spawnSimulatedPlayer(STAND, `andrew_fireproof_${block.replace("minecraft:", "")}`, GameMode.Survival);
  await test.idle(2);

  // Netherrack under every cell keeps a fire block burning for the whole
  // window; it makes no difference to a lava cell sitting on top of it.
  for (const { cell } of CELLS) test.setBlockType("minecraft:netherrack", { x: cell.x, y: cell.y - 1, z: cell.z });
  test.setBlockType("minecraft:netherrack", { x: CONTROL_CELL.x, y: CONTROL_CELL.y - 1, z: CONTROL_CELL.z });

  const spawned = CELLS.map(({ def, cell }) => ({ def, cell, ...spawnMarked(test, dim, owner, def, cell) }));
  const controlAt = test.worldLocation({ x: CONTROL_CELL.x + 0.5, y: CONTROL_CELL.y + 0.2, z: CONTROL_CELL.z + 0.5 });
  const control = dim.spawnItem(new ItemStack(CONTROL_ITEM_ID, 1), controlAt);
  // spawnItem gives the item a random shove (returnPath below hits the same
  // thing): uncleared, a legendary can drift off its own cell before the
  // block below is set and land somewhere the scenario never governs —
  // observed intermittently as a random legendary "destroyed" in a cell nothing
  // was ever placed under.
  for (const { entity } of spawned) entity.clearVelocity();
  control.clearVelocity();
  await test.idle(2);

  for (const { cell } of CELLS) test.setBlockType(block, cell);
  test.setBlockType(block, CONTROL_CELL);
  await test.idle(SURVIVE_TICKS);

  const rows = spawned.map(({ def, cell, entity, mark }) => {
    const stack = entity.isValid ? entity.getComponent("minecraft:item")?.itemStack : undefined;
    const now = stack === undefined ? undefined : getMark(def, stack);
    const at = entity.isValid ? entity.location : undefined;
    const home = test.worldBlockLocation(cell);
    const inCell = at !== undefined && Math.floor(at.x) === home.x && Math.floor(at.z) === home.z;
    const where = at === undefined ? "gone" : `${(at.x - home.x).toFixed(2)},${(at.y - home.y).toFixed(2)},${(at.z - home.z).toFixed(2)} from its cell`;
    return { def, mark, alive: entity.isValid, now, inCell, where, ledger: ledgerGen(def, mark.id), pending: readPending(def, owner).length };
  });
  log(
    `${block} RESULT after ${SURVIVE_TICKS} ticks: ` +
      rows.map((r) => `${r.def.itemId} ${r.alive ? "alive" : "DESTROYED"} at ${r.where}, id ${r.now?.id === r.mark.id ? "same" : (r.now?.id ?? "-")} gen ${r.now?.gen ?? "-"} ledger ${r.ledger}`).join(" | ") +
      `; ${CONTROL_ITEM_ID} ${control.isValid ? "survived" : "destroyed"}`
  );
  for (const r of rows) {
    test.assert(r.alive, `${r.def.itemId} was destroyed in ${block} — minecraft:fire_resistant is missing or not honoured`);
    test.assert(r.inCell, `${r.def.itemId} left its cell in ${block}: ${r.where}`);
    test.assert(r.now?.id === r.mark.id && r.now.gen === r.mark.gen, `${r.def.itemId} in ${block} reads id ${r.now?.id ?? "-"} gen ${r.now?.gen ?? "-"}, was ${r.mark.id} gen ${r.mark.gen}`);
    test.assert(r.ledger === r.mark.gen, `${block}: the ledger moved ${r.def.itemId} to gen ${r.ledger} — it was returned, not kept in place`);
    test.assert(r.pending === 0, `${block}: a return was queued for ${r.def.itemId} even though it survived in place`);
  }
  test.assert(!control.isValid, `${CONTROL_ITEM_ID} survived ${block} — the probe cell does not actually destroy items, so the assertion above proves nothing`);

  for (const { cell } of CELLS) test.setBlockType("minecraft:air", cell);
  test.setBlockType("minecraft:air", CONTROL_CELL);
  for (const { entity } of spawned) if (entity.isValid) entity.remove();
  if (control.isValid) control.remove();
  test.succeed();
}

registerAsync("andrew", "legendary_survives_lava", (test) => scenario(test, "minecraft:lava"))
  .structureName(STRUCTURE)
  .maxTicks(SURVIVE_TICKS + 120)
  .tag("andrew");

registerAsync("andrew", "legendary_survives_fire", (test) => scenario(test, "minecraft:fire"))
  .structureName(STRUCTURE)
  .maxTicks(SURVIVE_TICKS + 120)
  .tag("andrew");

// ---------------------------------------------------------------- the three paths no component covers

/** recovery.ts checks its watched entities every 40 ticks; 60 leaves a margin. */
const RECOVERY_WAIT_TICKS = 60;
/** A cactus took 120 ticks to eat a diamond sword in probe_cactus_items; 160 leaves a margin. */
const CACTUS_WAIT_TICKS = 160;
/** A primed TNT fuses for 80 ticks. */
const TNT_WAIT_TICKS = 100;

interface Dropped {
  def: LegendaryDef;
  entity: Entity;
  mark: Mark;
}

function containerOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    throw new Error("the owner has no inventory container");
  }
  return container;
}

/**
 * Drops one marked instance of every legendary plus a vanilla control, destroys
 * them the way `destroy` says, and checks every instance came back to its owner
 * exactly once at the next generation. `models` names what the destroyer stands
 * for when it is not the thing itself.
 */
async function returnPath(
  test: Test,
  name: string,
  mode: GameMode,
  prepare: (test: Test) => void,
  destroy: (test: Test, dim: Dimension, dropped: Dropped[], control: Entity) => void,
  wait: number,
  models: string,
  /** Blocks added under every item, when the path builds a column to drop onto. */
  lift = 0
): Promise<void> {
  assertOnPlatform(test);
  const dim = test.getDimension();
  const owner = test.spawnSimulatedPlayer(STAND, name, mode);
  await test.idle(2);

  prepare(test);
  const dropped: Dropped[] = CELLS.map(({ def, cell }) => ({
    def,
    ...spawnMarked(test, dim, owner, def, { ...cell, y: cell.y + lift }),
  }));
  const controlAt = test.worldLocation({ x: CONTROL_CELL.x + 0.5, y: CONTROL_CELL.y + lift + 0.2, z: CONTROL_CELL.z + 0.5 });
  const control = dim.spawnItem(new ItemStack(CONTROL_ITEM_ID, 1), controlAt);
  // spawnItem gives the item a random shove, and one block of cactus is narrow
  // enough to slide off before it takes any damage (measured: 1 of 3 eaten).
  for (const d of dropped) d.entity.clearVelocity();
  control.clearVelocity();
  // entitySpawn must reach recovery.ts before the entity dies, or nothing is watched.
  await test.idle(4);

  const want = dropped.map((d) => ledgerGen(d.def, d.mark.id) + 1);
  destroy(test, dim, dropped, control);
  await test.idle(wait);
  const alive = dropped.filter((d) => d.entity.isValid).map((d) => d.def.itemId);
  const controlAlive = control.isValid;

  await test.idle(RECOVERY_WAIT_TICKS);
  const container = containerOf(owner);
  const rows = dropped.map((d, i) => {
    const held = findAllMarked(d.def, container).filter((x) => x.mark.id === d.mark.id);
    return { id: d.def.itemId, held: held.length, gen: held[0]?.mark.gen, want: want[i], ledger: ledgerGen(d.def, d.mark.id), pending: readPending(d.def, owner).length };
  });
  const centre = test.worldLocation({ x: 3, y: 2, z: 2 });
  const onGround = dim.getEntities({ type: "minecraft:item", location: centre, maxDistance: 14 }).filter((e) => isLegendaryItemEntity(e)).length;
  log(
    `${name} RESULT (${models}): destroyed ${CELLS.length - alive.length}/${CELLS.length}` +
      `${alive.length === 0 ? "" : ` (still alive: ${alive.join(", ")})`}, control destroyed ${!controlAlive}; ` +
      `${rows.map((r) => `${r.id} held ${r.held} gen ${r.gen ?? "-"} want ${r.want} ledger ${r.ledger} pending ${r.pending}`).join(" | ")}; ` +
      `marked items left on the ground ${onGround}`
  );
  test.assert(!controlAlive, `${CONTROL_ITEM_ID} survived — the destroyer does not destroy items, so nothing below proves anything`);
  test.assert(alive.length === 0, `not destroyed, so the return path never ran: ${alive.join(", ")}`);
  for (const r of rows) {
    test.assert(r.held === 1, `the owner holds ${r.held} ${r.id} of that instance, expected exactly 1`);
    test.assert(r.gen === r.want, `${r.id} came back at generation ${r.gen ?? "none"}, expected ${r.want}`);
    test.assert(r.ledger === r.want, `${r.id}: the ledger reads gen ${r.ledger}, so the copy handed back is not the live one (want ${r.want})`);
    test.assert(r.pending === 0, `${r.id} is still owed to the owner after being handed over`);
  }
  test.assert(onGround === 0, `${onGround} marked item(s) still lying on the ground`);
  test.succeed();
}

registerAsync("andrew", "legendary_returns_from_tnt", (test) =>
  returnPath(
    test,
    "andrew_tnt_victim",
    // The blast would kill a Survival owner on the same 7-wide platform, and a
    // dead owner is owed the return instead of handed it — which would leave
    // the hand-back untested.
    GameMode.Creative,
    () => undefined,
    (_test, dim, dropped) => {
      const at = dropped[Math.floor(dropped.length / 2)].entity.location;
      dim.spawnEntity("minecraft:tnt", at).clearVelocity();
      console.warn(`[gametest] fireproof tnt: primed TNT at ${at.x.toFixed(1)},${at.y.toFixed(1)},${at.z.toFixed(1)}`);
    },
    TNT_WAIT_TICKS,
    "a primed vanilla TNT entity, nobody's attack"
  )
)
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

/**
 * Does a cactus destroy an item entity on BDS at all, and in which arrangement?
 * Java destroys items that touch one; Bedrock parity here is unknown, and a
 * legendary scenario built on the wrong arrangement passes while testing
 * nothing. Vanilla controls only — no legendary is involved.
 */
registerAsync("andrew", "probe_cactus_items", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  // The platform's stone floor is test-relative y=1, so the sand goes a level
  // above it: sand placed ON the floor cell has nothing under it and falls,
  // taking the cactus with it (measured — the first run of this probe read a
  // cell that was already air).
  const cactus: Vector3 = { x: 3, y: 3, z: 1 };
  test.setBlockType("minecraft:sand", { x: cactus.x, y: cactus.y - 1, z: cactus.z });
  test.setBlockType("minecraft:cactus", cactus);
  // A step beside the cactus, a level below it, to rest an item against its side.
  test.setBlockType("minecraft:stone", { x: cactus.x + 1, y: cactus.y - 1, z: cactus.z });
  await test.idle(10);

  const spots: { name: string; at: Vector3 }[] = [
    { name: "inside the cactus cell", at: { x: 3.5, y: 3.2, z: 1.5 } },
    { name: "resting on its top face", at: { x: 3.5, y: 4.2, z: 1.5 } },
    { name: "against its side, on a step", at: { x: 4.5, y: 3.2, z: 1.5 } },
    { name: "dropped from 2 blocks above", at: { x: 3.5, y: 5.5, z: 1.5 } },
  ];
  const items = spots.map(({ name, at }) => {
    const entity = dim.spawnItem(new ItemStack(CONTROL_ITEM_ID, 1), test.worldLocation(at));
    entity.clearVelocity();
    return { name, entity };
  });
  await test.idle(120);

  const standing = typeOf(dim, test.worldLocation({ x: cactus.x, y: cactus.y, z: cactus.z }));
  log(
    `probe cactus RESULT block now ${standing}: ${items
      .map(({ name, entity }) => `${name} -> ${entity.isValid ? "alive" : "destroyed"}`)
      .join(", ")}`
  );
  for (const { entity } of items) if (entity.isValid) entity.remove();
  test.assert(standing === "minecraft:cactus", `the cactus was gone (${standing}) before the window ended — this probe measured nothing`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

registerAsync("andrew", "legendary_returns_from_cactus", (test) =>
  returnPath(
    test,
    "andrew_cactus_victim",
    GameMode.Survival,
    (t) => {
      // probe_cactus_items, BDS 1.26.51.1: a cactus destroys only what rests on
      // its TOP face — an item inside its cell or pressed to its side survives.
      // Sand one level above the stone floor, cactus on the sand, item dropped
      // onto the cactus (lift = 2 below).
      for (const cell of [...CELLS.map((c) => c.cell), CONTROL_CELL]) {
        t.setBlockType("minecraft:sand", cell);
        t.setBlockType("minecraft:cactus", { x: cell.x, y: cell.y + 1, z: cell.z });
      }
    },
    () => undefined,
    CACTUS_WAIT_TICKS,
    "a cactus the item is dropped onto",
    2
  )
)
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

registerAsync("andrew", "legendary_returns_when_it_vanishes", (test) =>
  returnPath(
    test,
    "andrew_vanish_victim",
    GameMode.Survival,
    () => undefined,
    (_test, _dim, dropped, control) => {
      for (const d of dropped) d.entity.remove();
      control.remove();
    },
    4,
    "remove(), which is all a 5-minute despawn is to the script: the entity is gone and the engine names no reason. 6000 ticks is past any scenario budget, and the control is removed by hand here, so it proves nothing in this one"
  )
)
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

/**
 * The one way a legendary could still be lost for good: a pickup sighting that
 * nothing consumes. The owner picks a watched instance up — recovery.ts records
 * the sighting — then drops it and the new entity dies in the same tick, before
 * entitySpawn reaches watch(), which is what would have cleared the sighting.
 * The next check then finds the first entity gone with a sighting standing, and
 * a loss read as a pickup owes the owner nothing.
 */
registerAsync("andrew", "legendary_pickup_sighting_not_consumed", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const def = LEGENDARIES[0];
  const owner = test.spawnSimulatedPlayer(STAND, "andrew_sighting", GameMode.Survival);
  await test.idle(4);
  const container = containerOf(owner);

  const { entity, mark } = spawnMarked(test, dim, owner, def, STAND);
  entity.clearVelocity();
  const mine = (): { slot: number; gen: number }[] =>
    findAllMarked(def, container)
      .filter((x) => x.mark.id === mark.id)
      .map((x) => ({ slot: x.slot, gen: x.mark.gen }));
  let waited = 0;
  while (mine().length === 0 && waited < 80) {
    await test.idle(2);
    waited += 2;
  }
  test.assert(mine().length === 1, `the owner never picked the instance up (${waited} ticks)`);

  // Same tick: drop it and kill the entity the drop created, so entitySpawn
  // reaches watch() only after the entity is already invalid.
  owner.selectedSlotIndex = mine()[0].slot;
  test.assert(owner.dropSelectedItem(), "dropSelectedItem refused to drop the instance");
  const fresh = dim
    .getEntities({ type: "minecraft:item", location: owner.location, maxDistance: 4 })
    .filter((e) => isLegendaryItemEntity(e));
  test.assert(fresh.length === 1, `expected exactly one dropped legendary in the same tick, found ${fresh.length}`);
  fresh[0].remove();

  await test.idle(RECOVERY_WAIT_TICKS + 40);
  const held = mine();
  const pending = readPending(def, owner).length;
  log(
    `sighting RESULT picked up after ${waited} tick(s), then dropped and removed in one tick: ` +
      `owner holds ${held.length} (gen ${held[0]?.gen ?? "-"}), owed ${pending}`
  );
  test.assert(held.length + pending === 1, `the instance is gone: the owner holds ${held.length} and is owed ${pending}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

/**
 * Putting a legendary into a chest is a departure from the player's slot too,
 * and must not be read as a loss: the chest keeps the instance, the owner is
 * handed nothing. The guard on the departure ledger above.
 */
registerAsync("andrew", "legendary_in_a_chest_stays_there", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const def = LEGENDARIES[0];
  const chestCell: Vector3 = { x: 3, y: 2, z: 1 };
  const owner = test.spawnSimulatedPlayer(STAND, "andrew_chest_keeper", GameMode.Survival);
  await test.idle(4);
  test.setBlockType("minecraft:chest", chestCell);
  await test.idle(4);

  const container = containerOf(owner);
  const slot = owner.selectedSlotIndex;
  const mark = makeMark("admin", owner);
  container.setItem(slot, markItem(def, new ItemStack(def.itemId, 1), mark));
  await test.idle(4);

  const chest = dim.getBlock(test.worldLocation(chestCell))?.getComponent("minecraft:inventory")?.container;
  test.assert(chest !== undefined, "the chest has no inventory container");
  const stack = container.getItem(slot);
  test.assert(stack !== undefined, "the marked stack never reached the owner's slot");
  // Into the chest first, out of the inventory second: the instance is never nowhere.
  (chest as Container).setItem(0, stack);
  container.setItem(slot, undefined);

  // Past the departure grace and a full recovery check.
  await test.idle(RECOVERY_WAIT_TICKS + 40);
  const inChest = findAllMarked(def, chest as Container).filter((x) => x.mark.id === mark.id);
  const held = findAllMarked(def, containerOf(owner)).filter((x) => x.mark.id === mark.id);
  const pending = readPending(def, owner).length;
  log(
    `chest RESULT instance ${mark.id}: in the chest ${inChest.length} (gen ${inChest[0]?.mark.gen ?? "-"}), ` +
      `owner holds ${held.length} (gen ${held[0]?.mark.gen ?? "-"}), owed ${pending}`
  );
  test.assert(inChest.length === 1, `the chest holds ${inChest.length} copies of the instance, expected 1`);
  test.assert(inChest[0].mark.gen === mark.gen, `the stored copy went stale: gen ${inChest[0].mark.gen}, was ${mark.gen} — a stored legendary was recalled`);
  test.assert(held.length === 0 && pending === 0, `the owner was handed ${held.length} copies and is owed ${pending} for an instance that is in a chest`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");
