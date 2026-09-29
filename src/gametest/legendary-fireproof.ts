// CNTR-XCX10-AA / LGND-FIREPROOF-01-AA (W1): Orbital §5 wants a legendary to
// never be destroyed. minecraft:fire_resistant (format_version >= 1.21.90)
// meets this literally for fire and lava — the item entity survives instead
// of vanishing, so recovery.ts never sees a loss and never queues a return.
// This replaces the old andrew:legendary_survives_lava, which removed the
// surviving entity itself and so stayed green testing nothing (F1 of the
// diagnose report).
//
// Cactus, an explosion and despawn are not covered by the component; that
// fallback (destroyed -> returned) is exercised by legendary_returns_from_void
// in main.ts, which stays on the same "destroyed means returned" path for the
// Void per §5 itself.

import { type Dimension, type Entity, GameMode, ItemStack, type Player, type Vector3 } from "@minecraft/server";
import { type Test, registerAsync } from "@minecraft/server-gametest";
import { LEGENDARIES, type LegendaryDef } from "../legendary/registry";
import { makeMark, markItem, readPending } from "../legendary/state";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 2, y: 2, z: 5 };
const SURVIVE_TICKS = 80;
const CONTROL_ITEM_ID = "minecraft:diamond_sword";

const log = (msg: string): void => console.warn(`[gametest] fireproof ${msg}`);

interface Cell {
  def: LegendaryDef;
  cell: Vector3;
}

// Cells two apart on the platform floor (stone at test-relative y=1), one
// legendary each, plus a vanilla control that the same burn cell destroys.
const CELLS: Cell[] = [
  { def: LEGENDARIES[0], cell: { x: 1, y: 2, z: 1 } },
  { def: LEGENDARIES[1], cell: { x: 3, y: 2, z: 1 } },
];
const CONTROL_CELL: Vector3 = { x: 5, y: 2, z: 1 };

function spawnMarked(test: Test, dim: Dimension, owner: Player, def: LegendaryDef, cell: Vector3): Entity {
  const mark = markItem(def, new ItemStack(def.itemId, 1), makeMark("admin", owner));
  const at = test.worldLocation({ x: cell.x + 0.5, y: cell.y + 0.2, z: cell.z + 0.5 });
  return dim.spawnItem(mark, at);
}

/**
 * Drops a marked instance of every legendary, plus a vanilla control, into the
 * same destructive block, and checks each legendary is still a valid entity
 * (not destroyed, not returned) while the control is gone.
 */
async function scenario(test: Test, block: string): Promise<void> {
  const dim = test.getDimension();
  const owner = test.spawnSimulatedPlayer(STAND, `andrew_fireproof_${block.replace("minecraft:", "")}`, GameMode.Survival);
  await test.idle(2);

  // Netherrack under every cell keeps a fire block burning for the whole
  // window; it makes no difference to a lava cell sitting on top of it.
  for (const { cell } of CELLS) test.setBlockType("minecraft:netherrack", { x: cell.x, y: cell.y - 1, z: cell.z });
  test.setBlockType("minecraft:netherrack", { x: CONTROL_CELL.x, y: CONTROL_CELL.y - 1, z: CONTROL_CELL.z });

  const spawned = CELLS.map(({ def, cell }) => ({ def, entity: spawnMarked(test, dim, owner, def, cell) }));
  const controlAt = test.worldLocation({ x: CONTROL_CELL.x + 0.5, y: CONTROL_CELL.y + 0.2, z: CONTROL_CELL.z + 0.5 });
  const control = dim.spawnItem(new ItemStack(CONTROL_ITEM_ID, 1), controlAt);
  await test.idle(2);

  for (const { cell } of CELLS) test.setBlockType(block, cell);
  test.setBlockType(block, CONTROL_CELL);
  await test.idle(SURVIVE_TICKS);

  for (const { def, entity } of spawned) {
    test.assert(entity.isValid, `${def.itemId} was destroyed in ${block} — minecraft:fire_resistant is missing or not honoured`);
  }
  test.assert(!control.isValid, `${CONTROL_ITEM_ID} survived ${block} — the probe cell does not actually destroy items, so the assertion above proves nothing`);
  for (const def of LEGENDARIES) {
    test.assert(readPending(def, owner).length === 0, `${block}: a return was queued for ${def.itemId} even though it survived in place`);
  }
  log(`${block} RESULT: ${spawned.map((s) => s.def.itemId).join(", ")} survived in place; ${CONTROL_ITEM_ID} destroyed; no pending return`);

  for (const { cell } of CELLS) test.setBlockType("minecraft:air", cell);
  test.setBlockType("minecraft:air", CONTROL_CELL);
  for (const { entity } of spawned) if (entity.isValid) entity.remove();
  if (control.isValid) control.remove();
  test.succeed();
}

registerAsync("andrew", "legendary_survives_lava", (test) => scenario(test, "minecraft:lava"))
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

registerAsync("andrew", "legendary_survives_fire", (test) => scenario(test, "minecraft:fire"))
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");
