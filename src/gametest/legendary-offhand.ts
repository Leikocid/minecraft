// The off hand on a real engine: both legendaries are admitted to it, the hand
// priority resolves to it, death retention returns what was held there, and a
// craft token can never be parked there.
//
// setEquipment(Offhand) is the engine's admission check, not a way around it:
// it returns false for a custom item without minecraft:allow_off_hand (BDS
// 1.26.51.1, CNTR-LGND-CX08-AA). The craft token carries no such component, so
// every run shows the refusal next to the admission. /replaceitem does bypass
// the component, so nothing here fills a hand with it.

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
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { clearCooldown, startCooldown } from "../legendary/cooldown";
import { resolveActivation } from "../legendary/hands";
import { SCYTHE_OF_CALAMITY, WEB_SWORD } from "../legendary/registry";
import * as state from "../legendary/state";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };

/** Past two 40-tick loss-recovery checks, so a loss return would have landed. */
const DEATH_SETTLE_TICKS = 100;

/** Twice the retention sweep radius: also sees what the sweep left behind. */
const GROUND_RADIUS = 16;

/** [item, whether the off hand must take it]. */
const OFFERS: ReadonlyArray<readonly [string, boolean]> = [
  [WEB_SWORD.itemId, true],
  [SCYTHE_OF_CALAMITY.itemId, true],
  // A custom item without the component: the refusal the check turns on.
  [WEB_SWORD.craftTokenId, false],
  ["minecraft:diamond_sword", false],
  // The slot is writable at all.
  ["minecraft:shield", true],
];

const log = (msg: string): void => console.warn(`[gametest] offhand ${msg}`);

function equippableOf(player: Player) {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  if (equippable === undefined) {
    throw new Error(`${player.name} has no equippable component`);
  }
  return equippable;
}

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    throw new Error(`${player.name} has no inventory container`);
  }
  return container;
}

/** Empties the off hand, then asks the engine to put `id` there. */
function offer(player: Player, id: string): { returned: boolean; readBack: string } {
  const equippable = equippableOf(player);
  equippable.setEquipment(EquipmentSlot.Offhand, undefined);
  const returned = equippable.setEquipment(EquipmentSlot.Offhand, new ItemStack(id, 1));
  return { returned, readBack: equippable.getEquipment(EquipmentSlot.Offhand)?.typeId ?? "empty" };
}

/** Every stack the player holds: inventory, then the off hand. */
function carried(player: Player): ItemStack[] {
  const container = inventoryOf(player);
  const stacks: ItemStack[] = [];
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack !== undefined) stacks.push(stack);
  }
  const offhand = state.offhandOf(player);
  if (offhand !== undefined) stacks.push(offhand);
  return stacks;
}

registerAsync("andrew", "legendary_offhand_admitted", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(STAND, "oh_admit", GameMode.Survival);
  await test.idle(4);

  const failures: string[] = [];
  for (const [id, admitted] of OFFERS) {
    const { returned, readBack } = offer(player, id);
    log(`offer ${id}: returned=${returned} readBack=${readBack} expected=${admitted ? "admitted" : "refused"}`);
    if (returned !== admitted || (readBack === id) !== admitted) {
      failures.push(`${id}: returned=${returned} readBack=${readBack}, expected ${admitted ? "admitted" : "refused"}`);
    }
  }

  offer(player, WEB_SWORD.itemId);
  state.setOffhand(player, undefined);
  if (state.offhandOf(player) !== undefined) {
    failures.push(`setOffhand(undefined) left ${state.offhandOf(player)?.typeId} in the off hand`);
  }

  log(`admitted RESULT ${failures.length === 0 ? "ok" : failures.join("; ")}`);
  test.assert(failures.length === 0, failures.join("; "));
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(100)
  .tag("andrew");

// decision-legendary-hand-priority: the main hand wins while ready, and a ready
// off hand fires while the main hand is on cooldown.
registerAsync("andrew", "legendary_offhand_resolves", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(STAND, "oh_hands", GameMode.Survival);
  await test.idle(4);

  const equippable = equippableOf(player);
  equippable.setEquipment(EquipmentSlot.Mainhand, new ItemStack(SCYTHE_OF_CALAMITY.itemId, 1));
  const put = offer(player, WEB_SWORD.itemId);
  test.assert(put.returned && put.readBack === WEB_SWORD.itemId, `the off hand refused the Web Sword: ${JSON.stringify(put)}`);

  clearCooldown(player, WEB_SWORD.abilityKey);
  clearCooldown(player, SCYTHE_OF_CALAMITY.abilityKey);
  const bothReady = resolveActivation(player);
  startCooldown(player, SCYTHE_OF_CALAMITY.abilityKey);
  const mainCooling = resolveActivation(player);
  clearCooldown(player, SCYTHE_OF_CALAMITY.abilityKey);

  const show = (hit: ReturnType<typeof resolveActivation>): string => `${hit?.slot ?? "none"}/${hit?.def.itemId ?? "none"}`;
  log(`resolves RESULT both ready -> ${show(bothReady)}; main on cooldown -> ${show(mainCooling)}`);
  test.assert(
    bothReady?.slot === EquipmentSlot.Mainhand && bothReady.def === SCYTHE_OF_CALAMITY,
    `both ready: expected Mainhand/${SCYTHE_OF_CALAMITY.itemId}, got ${show(bothReady)}`
  );
  test.assert(
    mainCooling?.slot === EquipmentSlot.Offhand && mainCooling.def === WEB_SWORD,
    `main hand on cooldown: expected Offhand/${WEB_SWORD.itemId}, got ${show(mainCooling)}`
  );
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(100)
  .tag("andrew");

registerAsync("andrew", "legendary_offhand_death_returns", async (test: Test): Promise<void> => {
  const player: SimulatedPlayer = test.spawnSimulatedPlayer(STAND, "oh_death", GameMode.Survival);
  await test.idle(4);

  const mark = state.makeMark("admin", player);
  const put = equippableOf(player).setEquipment(
    EquipmentSlot.Offhand,
    state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), mark)
  );
  test.assert(put, "the off hand refused the marked Web Sword");
  await test.idle(4);

  let died = false;
  const witness = world.afterEvents.entityDie.subscribe((event) => {
    const dead: Entity | undefined = event.deadEntity;
    if (dead !== undefined && player.isValid && dead.id === player.id) died = true;
  });
  const deathAt = player.location;
  const dimension: Dimension = player.dimension;
  player.kill();
  await test.idle(10);
  player.respawn();
  await test.idle(DEATH_SETTLE_TICKS);
  world.afterEvents.entityDie.unsubscribe(witness);

  const isOurs = (stack: ItemStack | undefined): boolean =>
    state.isItemOf(WEB_SWORD, stack) && state.getMark(WEB_SWORD, stack)?.id === mark.id;
  const held = carried(player).filter(isOurs).length;
  const ground = dimension
    .getEntities({ type: "minecraft:item", location: deathAt, maxDistance: GROUND_RADIUS })
    .filter((entity) => isOurs(entity.getComponent("minecraft:item")?.itemStack)).length;
  const pending = state.readPending(WEB_SWORD, player).some((m) => m.id === mark.id);
  const owed = (state.readOwed(WEB_SWORD)[player.id] ?? []).some((entry) => entry.mark.id === mark.id);

  log(`death RESULT died=${died} held=${held} ground=${ground} pending=${pending} owed=${owed}`);
  test.assert(died, "the player never died, so retention was never asked");
  test.assert(held === 1, `the off-hand sword is held ${held} times after respawn, expected once`);
  test.assert(ground === 0, `${ground} copies of the off-hand sword lie at the death spot`);
  test.assert(!pending && !owed, `the return is still outstanding: pending=${pending} owed=${owed}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// A craft token has no allow_off_hand, and no inventory event names the off
// hand, so a token parked there would wait unseen by the gate. Every route to
// the slot is tried with the token, and with the weapon as the control.
const PARK_ROUTES: ReadonlyArray<readonly [string, (player: Player, id: string) => unknown]> = [
  ["setEquipment", (player, id) => equippableOf(player).setEquipment(EquipmentSlot.Offhand, new ItemStack(id, 1))],
  [
    "replaceitem",
    (player, id) => player.runCommand(`replaceitem entity @s slot.weapon.offhand 0 ${id}`).successCount,
  ],
  [
    "ContainerSlot.setItem",
    (player, id) => equippableOf(player).getEquipmentSlot(EquipmentSlot.Offhand).setItem(new ItemStack(id, 1)),
  ],
];

registerAsync("andrew", "legendary_offhand_token_refused", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(STAND, "oh_token", GameMode.Survival);
  await test.idle(4);

  const parkedBy = (id: string): string[] => {
    const parked: string[] = [];
    for (const [route, park] of PARK_ROUTES) {
      equippableOf(player).setEquipment(EquipmentSlot.Offhand, undefined);
      let said: string;
      try {
        said = String(park(player, id));
      } catch (err) {
        said = `threw ${(err instanceof Error ? err.message : String(err)).split("\n")[0]}`;
      }
      const now = state.offhandOf(player)?.typeId ?? "empty";
      log(`park ${id} via ${route}: ${said} -> ${now}`);
      if (now === id) parked.push(route);
    }
    equippableOf(player).setEquipment(EquipmentSlot.Offhand, undefined);
    return parked;
  };

  const token = parkedBy(WEB_SWORD.craftTokenId);
  const weapon = parkedBy(WEB_SWORD.itemId);
  log(`token RESULT token parked by [${token.join(", ")}]; weapon parked by [${weapon.join(", ")}]`);
  test.assert(token.length === 0, `the craft token reached the off hand via ${token.join(", ")}`);
  test.assert(
    weapon.length === PARK_ROUTES.length,
    `the control failed: the weapon was parked only by [${weapon.join(", ")}]`
  );
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(100)
  .tag("andrew");
