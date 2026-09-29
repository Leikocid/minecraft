// CX-lgnd-10 probes against BDS 1.26.51.1: what death retention does with a
// second marked copy of one weapon, and with a marked copy in the off hand.
//
// probe_retention_offhand keeps the contract of probe-place.ts: it passes when
// its measurement completed, and the engine's answer is the "[probe]
// RETENTION-OFF RESULT …" line. probe_retention_two_copies asserts: every copy
// comes back exactly once, and a later death with nothing on the player grants
// nothing. The retention module's own "[andrew] legendary retention: path A|B"
// lines, printed between a test's start and its RESULT, say which path acted.

import {
  type Container,
  type Dimension,
  type Entity,
  EntityComponentTypes,
  EquipmentSlot,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, Test, registerAsync } from "@minecraft/server-gametest";
import { WEB_SWORD } from "../legendary/registry";
import { getMark, isItemOf, makeMark, markItem } from "../legendary/state";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };

/** Twice DROP_SEARCH_RADIUS in src/legendary/retention.ts: also sees what the sweep left behind. */
const GROUND_RADIUS = 16;

/** Past two 40-tick loss-recovery checks, so a loss return would have landed. */
const SETTLE_TICKS = 100;

const log = (msg: string): void => console.warn(`[probe] ${msg}`);

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    throw new Error(`${player.name} has no inventory container`);
  }
  return container;
}

function heldCount(player: Player, id: string): number {
  const container = inventoryOf(player);
  let found = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (isItemOf(WEB_SWORD, stack) && getMark(WEB_SWORD, stack)?.id === id) {
      found++;
    }
  }
  const offhand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);
  if (isItemOf(WEB_SWORD, offhand) && getMark(WEB_SWORD, offhand)?.id === id) {
    found++;
  }
  return found;
}

function groundCount(dimension: Dimension, location: Vector3, id: string): number {
  return dimension
    .getEntities({ type: "minecraft:item", location, maxDistance: GROUND_RADIUS })
    .filter((entity: Entity) => {
      const stack = entity.getComponent("minecraft:item")?.itemStack;
      return isItemOf(WEB_SWORD, stack) && getMark(WEB_SWORD, stack)?.id === id;
    }).length;
}

function owedRaw(): string {
  const raw = world.getDynamicProperty(`andrew:${WEB_SWORD.keyPrefix}_owed`);
  return typeof raw === "string" ? raw : "none";
}

/** The stored pending value as text, whatever its format, or "none". */
function pendingRaw(player: Player): string {
  const raw = player.getDynamicProperty(`andrew:${WEB_SWORD.keyPrefix}_pending`);
  return typeof raw === "string" ? raw : "none";
}

/** Where instance `id` is after death, respawn and the settle window. */
function whereabouts(player: Player, dimension: Dimension, deathAt: Vector3, id: string): string {
  const held = heldCount(player, id);
  const ground = groundCount(dimension, deathAt, id);
  const pending = pendingRaw(player).includes(id);
  const owed = owedRaw().includes(id);
  const accounted = held + ground > 0 || pending || owed;
  return `${id}: held=${held} ground=${ground} pending=${pending} owed=${owed} -> ${accounted ? "ACCOUNTED" : "VANISHED"}`;
}

/** Kills the player, respawns them, waits, and returns the death spot. */
async function dieAndRespawn(test: Test, player: SimulatedPlayer): Promise<{
  died: boolean;
  deathAt: Vector3;
  dimension: Dimension;
}> {
  let died = false;
  const witness = world.afterEvents.entityDie.subscribe((event) => {
    const dead: Entity | undefined = event.deadEntity;
    if (dead !== undefined && player.isValid && dead.id === player.id) {
      died = true;
    }
  });
  const deathAt = player.location;
  const dimension = player.dimension;
  player.kill();
  await test.idle(10);
  player.respawn();
  await test.idle(SETTLE_TICKS);
  world.afterEvents.entityDie.unsubscribe(witness);
  return { died, deathAt, dimension };
}

registerAsync("andrew", "probe_retention_two_copies", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(STAND, "andrew_probe_two", GameMode.Survival);
  await test.idle(4);

  // A crafted copy plus an operator give: the pair README recommends for testing retention.
  const marks = [makeMark("craft", player), makeMark("admin", player)];
  for (const mark of marks) {
    inventoryOf(player).addItem(markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), mark));
  }
  await test.idle(4);
  const before = marks.map((m) => `${m.id}:${heldCount(player, m.id)}`).join(" ");
  log(`RETENTION-2 carried before death: ${before}`);

  const { died, deathAt, dimension } = await dieAndRespawn(test, player);
  test.assert(died, "the player never died, so retention was never asked");

  const rows = marks.map((m) => whereabouts(player, dimension, deathAt, m.id));
  const accounted = rows.filter((r) => r.endsWith("ACCOUNTED")).length;
  log(
    `RETENTION-2 RESULT accounted=${accounted}/${marks.length}; ${rows.join("; ")}; ` +
      `pending=${pendingRaw(player)}; owed=${owedRaw()}`
  );
  for (const mark of marks) {
    const held = heldCount(player, mark.id);
    test.assert(held === 1, `${mark.origin} copy ${mark.id} is held ${held} times after respawn, expected once`);
    const ground = groundCount(dimension, deathAt, mark.id);
    test.assert(ground === 0, `${ground} item entities of ${mark.origin} copy ${mark.id} lie at the death spot`);
    test.assert(!owedRaw().includes(mark.id), `${mark.origin} copy ${mark.id} is owed although it was returned`);
  }
  test.assert(pendingRaw(player) === "none", `the pending return survived the restore: ${pendingRaw(player)}`);

  // The tokens are spent: dying again with nothing must hand nothing back.
  inventoryOf(player).clearAll();
  const second = await dieAndRespawn(test, player);
  test.assert(second.died, "the player never died a second time");
  const again = marks.map((m) => heldCount(player, m.id) + groundCount(second.dimension, second.deathAt, m.id));
  log(`RETENTION-2 second death RESULT copies=${again.join(",")}; pending=${pendingRaw(player)}; owed=${owedRaw()}`);
  test.assert(
    again.every((n) => n === 0),
    `a death with an empty inventory brought copies back: ${again.join(",")}`
  );
  test.assert(
    pendingRaw(player) === "none" && !marks.some((m) => owedRaw().includes(m.id)),
    "a death with an empty inventory left a return outstanding"
  );
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

registerAsync("andrew", "probe_retention_offhand", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(STAND, "andrew_probe_off", GameMode.Survival);
  await test.idle(4);

  const mark = makeMark("admin", player);
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  let set = "no equippable component";
  if (equippable !== undefined) {
    try {
      set = `setEquipment returned ${String(equippable.setEquipment(EquipmentSlot.Offhand, markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), mark)))}`;
    } catch (err) {
      set = `setEquipment threw ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  await test.idle(4);
  const offhand = equippable?.getEquipment(EquipmentSlot.Offhand);
  const offMark = offhand === undefined ? undefined : getMark(WEB_SWORD, offhand);
  const inContainer = heldCount(player, mark.id) - (offMark?.id === mark.id ? 1 : 0);
  log(
    `RETENTION-OFF before death: ${set}; offhand=${offhand?.typeId ?? "empty"} mark=${offMark?.id ?? "none"}; ` +
      `in container=${inContainer}`
  );
  if (offMark?.id !== mark.id) {
    // The shipped item has no minecraft:allow_off_hand, and the engine then
    // refuses the slot to scripts as well; that refusal is the answer.
    log(`RETENTION-OFF RESULT off hand refused the marked sword (${set}); nothing to retain`);
    test.succeed();
    return;
  }

  const { died, deathAt, dimension } = await dieAndRespawn(test, player);
  test.assert(died, "the player never died, so retention was never asked");

  log(`RETENTION-OFF RESULT ${whereabouts(player, dimension, deathAt, mark.id)}; owed=${owedRaw()}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");
