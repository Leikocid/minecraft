// The Orbital Cannon as an item and its charge as an entity, on a real engine
// (L0-orbc-ac01, L0-orbc-ent3). No Cannon behaviour exists yet: everything
// proven here follows from the JSON alone, which is what L0-orbc-r001 promises.
//
// Every assertion has a vanilla control measured in the same run, so a probe
// that reads nothing cannot pass: a fishing rod does have durability, a
// wooden sword does out-hit a hand, an armor stand does fall, a pig is pushed
// and hurt.

import {
  type Container,
  Difficulty,
  type Entity,
  EntityComponentTypes,
  EnchantmentTypes,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { ORBITAL_CANNON, WEB_SWORD } from "../legendary/registry";
import * as state from "../legendary/state";
import { attackTag } from "../orbital/charge";

const STRUCTURE = "andrew:platform";
const CHARGE_ID = "andrew:orbital_charge";

const log = (msg: string): void => console.warn(`[gametest] orbital-item ${msg}`);

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    throw new Error(`${player.name} has no inventory container`);
  }
  return container;
}

function healthOf(entity: Entity): number {
  const health = entity.getComponent(EntityComponentTypes.Health);
  if (health === undefined) {
    throw new Error(`${entity.typeId} has no health component`);
  }
  return health.currentValue;
}

/** Whether `stack` takes `id`, answering false for a stack that is not enchantable at all. */
function acceptsEnchantment(stack: ItemStack, id: string): boolean {
  const type = EnchantmentTypes.get(id) ?? EnchantmentTypes.get(`minecraft:${id}`);
  if (type === undefined) {
    throw new Error(`enchantment ${id} is unknown to the engine`);
  }
  const enchantable = stack.getComponent("minecraft:enchantable");
  return enchantable !== undefined && enchantable.canAddEnchantment({ type, level: 1 });
}

// -------------------------------------------------------------- AC#5: components

registerAsync("andrew", "orbital_item_components", async (test: Test): Promise<void> => {
  const cannon = new ItemStack(ORBITAL_CANNON.itemId, 1);
  const rod = new ItemStack("minecraft:fishing_rod", 1);
  const sword = new ItemStack(WEB_SWORD.itemId, 1);

  const cannonDurability = cannon.getComponent("minecraft:durability");
  const cannonEnchantable = cannon.getComponent("minecraft:enchantable");
  const cannonTakes = ["sharpness", "unbreaking"].map((id) => `${id}=${acceptsEnchantment(cannon, id)}`);
  log(
    `components RESULT ${ORBITAL_CANNON.itemId}: durability=${cannonDurability === undefined ? "undefined" : "present"} ` +
      `enchantable=${cannonEnchantable === undefined ? "undefined" : "present"} ${cannonTakes.join(" ")} maxAmount=${cannon.maxAmount}; ` +
      `controls: fishing_rod durability=${rod.getComponent("minecraft:durability")?.maxDurability} ` +
      `sharpness=${acceptsEnchantment(sword, "sharpness")} on ${WEB_SWORD.itemId}`
  );

  test.assert(rod.getComponent("minecraft:durability") !== undefined, "control: a vanilla fishing rod reads no durability — the probe reads nothing");
  test.assert(rod.getComponent("minecraft:enchantable") !== undefined, "control: a vanilla fishing rod reads no enchantable — the probe reads nothing");
  test.assert(acceptsEnchantment(sword, "sharpness"), `control: ${WEB_SWORD.itemId} refuses sharpness — canAddEnchantment answers false for everything`);

  test.assert(cannonDurability === undefined, `${ORBITAL_CANNON.itemId} has minecraft:durability — it would wear out`);
  if (cannonEnchantable !== undefined) {
    test.assert(!acceptsEnchantment(cannon, "sharpness"), `${ORBITAL_CANNON.itemId} accepts sharpness`);
    test.assert(!acceptsEnchantment(cannon, "unbreaking"), `${ORBITAL_CANNON.itemId} accepts unbreaking`);
  }
  test.assert(cannon.maxAmount === 1, `${ORBITAL_CANNON.itemId} stacks to ${cannon.maxAmount}, not 1`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(40)
  .tag("andrew");

// -------------------------------------------------------------- AC#6: punch and wear

const PUNCHER_STAND: Vector3 = { x: 3, y: 2, z: 5 };
const ZOMBIE_CELL: Vector3 = { x: 3, y: 2, z: 3 };
const CANNON_SLOT = 0;
const EMPTY_SLOT = 1;
const SWORD_SLOT = 2;
const CONTROL_WEAPON_ID = "minecraft:wooden_sword";
/** Past the 10-tick hurt immunity, so every swing lands in full. */
const BETWEEN_HITS_TICKS = 20;
const USES = 50;

/** One swing from `slot` at `zombie`, put back on its cell first; the health it cost. */
async function hitFrom(test: Test, player: SimulatedPlayer, slot: number, zombie: Entity): Promise<number> {
  zombie.teleport(test.worldLocation({ x: ZOMBIE_CELL.x + 0.5, y: ZOMBIE_CELL.y, z: ZOMBIE_CELL.z + 0.5 }));
  zombie.clearVelocity();
  player.selectedSlotIndex = slot;
  await test.idle(BETWEEN_HITS_TICKS);
  const before = healthOf(zombie);
  test.assert(player.attackEntity(zombie), `the swing from slot ${slot} did not reach the zombie`);
  await test.idle(4);
  return before - healthOf(zombie);
}

registerAsync("andrew", "orbital_punch_matches_hand", async (test: Test): Promise<void> => {
  const difficulty = world.getDifficulty();
  const leftovers: Entity[] = [];
  try {
    // A zombie is deleted on Peaceful, where the checks world runs.
    world.setDifficulty(Difficulty.Easy);
    const player = test.spawnSimulatedPlayer(PUNCHER_STAND, "andrew_orbital_puncher", GameMode.Survival);
    await test.idle(4);

    const inventory = inventoryOf(player);
    const mark = state.makeMark("admin", player);
    inventory.setItem(CANNON_SLOT, state.markItem(ORBITAL_CANNON, new ItemStack(ORBITAL_CANNON.itemId, 1), mark));
    inventory.setItem(EMPTY_SLOT, undefined);
    inventory.setItem(SWORD_SLOT, new ItemStack(CONTROL_WEAPON_ID, 1));

    // No AI: it neither walks off nor fights back, and the same zombie takes
    // every hit, so its armor roll is the same for all of them.
    const zombie = test.spawnWithoutBehaviors("minecraft:zombie", ZOMBIE_CELL);
    leftovers.push(zombie);
    zombie.addEffect("fire_resistance", 2000, { showParticles: false });

    const hand = await hitFrom(test, player, EMPTY_SLOT, zombie);
    const cannon = await hitFrom(test, player, CANNON_SLOT, zombie);
    const handAgain = await hitFrom(test, player, EMPTY_SLOT, zombie);
    const control = await hitFrom(test, player, SWORD_SLOT, zombie);
    log(`punch RESULT empty hand ${hand}, ${ORBITAL_CANNON.itemId} ${cannon}, empty hand again ${handAgain}, ${CONTROL_WEAPON_ID} ${control}`);

    test.assert(hand > 0, `an empty-hand hit cost the zombie ${hand} health — the setup measures nothing`);
    test.assert(handAgain === hand, `the two empty-hand hits differ (${hand} vs ${handAgain}) — the setup is not stable`);
    test.assert(control > hand, `control: ${CONTROL_WEAPON_ID} hit for ${control}, no more than a hand's ${hand} — the setup cannot tell weapons apart`);
    test.assert(cannon === hand, `${ORBITAL_CANNON.itemId} hit for ${cannon}, an empty hand for ${hand}`);
    zombie.remove();

    // Uses and swings at the open sky: nothing to hit, nothing to target.
    player.selectedSlotIndex = CANNON_SLOT;
    player.lookAtLocation({ x: PUNCHER_STAND.x, y: PUNCHER_STAND.y + 40, z: PUNCHER_STAND.z - 1 });
    await test.idle(2);
    for (let i = 0; i < USES; i++) {
      player.useItemInSlot(CANNON_SLOT);
      await test.idle(1);
      player.attack();
      await test.idle(1);
    }
    await test.idle(4);

    const held = inventory.getItem(CANNON_SLOT);
    const heldMark = held === undefined ? undefined : state.getMark(ORBITAL_CANNON, held);
    let copies = 0;
    for (let slot = 0; slot < inventory.size; slot++) {
      if (inventory.getItem(slot)?.typeId === ORBITAL_CANNON.itemId) copies++;
    }
    log(
      `wear RESULT after ${USES} uses and ${USES} swings: slot ${CANNON_SLOT} holds ${held?.typeId ?? "nothing"} ` +
        `x${held?.amount ?? 0}, mark id ${heldMark?.id ?? "none"} (given ${mark.id}), ` +
        `durability ${held?.getComponent("minecraft:durability") === undefined ? "undefined" : "present"}, copies ${copies}`
    );
    test.assert(held?.typeId === ORBITAL_CANNON.itemId && held.amount === 1, `slot ${CANNON_SLOT} holds ${held?.typeId ?? "nothing"} x${held?.amount ?? 0}`);
    test.assert(heldMark?.id === mark.id, `the held Cannon carries mark id ${heldMark?.id ?? "none"}, not the one given (${mark.id})`);
    test.assert(held?.getComponent("minecraft:durability") === undefined, "the held Cannon has a durability component — it wears");
    test.assert(copies === 1, `the inventory holds ${copies} Cannons`);
    test.succeed();
  } finally {
    world.setDifficulty(difficulty);
    for (const entity of leftovers) if (entity.isValid) entity.remove();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// -------------------------------------------------------------- AC#7: the charge is inert

/** One block above the floor top: inside a standing player's body, with room to fall. */
const CHARGE_CELL: Vector3 = { x: 3.5, y: 3, z: 3.5 };
const RMB_CHARGE_CELL: Vector3 = { x: 5.5, y: 3, z: 5.5 };
const FALLER_CELL: Vector3 = { x: 1.5, y: 3, z: 1.5 };
/** On the walker's line, past the charge, so the charge is crossed first. */
const PIG_CELL: Vector3 = { x: 3.5, y: 2, z: 1.5 };
const WALKER_STAND: Vector3 = { x: 3, y: 2, z: 6 };
const HOVER_TICKS = 20;
const BLAST_RADIUS = 3;

const moved = (a: Vector3, b: Vector3): number => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
const fmt = (v: Vector3): string => `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;

registerAsync("andrew", "orbital_charge_inert", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const leftovers: Entity[] = [];
  try {
    const charge = dim.spawnEntity(CHARGE_ID, test.worldLocation(CHARGE_CELL), { spawnEvent: "andrew:scale_lmb" });
    const rmbCharge = dim.spawnEntity(CHARGE_ID, test.worldLocation(RMB_CHARGE_CELL), { spawnEvent: "andrew:scale_rmb" });
    // A charge no attack holds is an orphan and is swept at once; a scope no runtime owns keeps these two.
    charge.addTag(attackTag("probe-inert"));
    rmbCharge.addTag(attackTag("probe-inert"));
    const faller = dim.spawnEntity("minecraft:armor_stand", test.worldLocation(FALLER_CELL));
    leftovers.push(charge, rmbCharge, faller);
    const at = charge.location;
    const fallerAt = faller.location;

    // The BP scale path (tests/orbital-item.test.mjs): both modes, then a switch.
    const scaleOf = (entity: Entity): number | undefined => entity.getComponent("minecraft:scale")?.value;
    const lmbScale = scaleOf(charge);
    const lmbProperty = charge.getProperty("andrew:scale");
    const rmbScale = scaleOf(rmbCharge);
    const rmbProperty = rmbCharge.getProperty("andrew:scale");
    rmbCharge.triggerEvent("andrew:scale_lmb");
    await test.idle(1);
    const switchedScale = scaleOf(rmbCharge);
    const switchedProperty = rmbCharge.getProperty("andrew:scale");
    log(
      `scale RESULT lmb spawn ${lmbScale} property ${lmbProperty}; rmb spawn ${rmbScale} property ${rmbProperty}; ` +
        `rmb after andrew:scale_lmb ${switchedScale} property ${switchedProperty}`
    );
    test.assert(lmbScale !== undefined && Math.abs(lmbScale - 1.2) < 1e-6 && lmbProperty === 1, `lmb charge: scale ${lmbScale}, property ${lmbProperty}`);
    test.assert(rmbScale !== undefined && Math.abs(rmbScale - 1.0) < 1e-6 && rmbProperty === 0, `rmb charge: scale ${rmbScale}, property ${rmbProperty}`);
    test.assert(switchedScale !== undefined && Math.abs(switchedScale - 1.2) < 1e-6 && switchedProperty === 1, `switched charge: scale ${switchedScale}, property ${switchedProperty}`);

    // 1. No gravity: HOVER_TICKS with nothing moving it.
    let drift = 0;
    for (let tick = 0; tick < HOVER_TICKS; tick++) {
      await test.idle(1);
      drift = Math.max(drift, moved(charge.location, at));
    }
    const fell = fallerAt.y - faller.location.y;
    log(`hover RESULT charge ${fmt(at)} -> ${fmt(charge.location)}, max drift ${drift} over ${HOVER_TICKS} ticks; control armor_stand fell ${fell.toFixed(3)}`);
    test.assert(fell > 0.5, `control: an armor stand fell only ${fell} in ${HOVER_TICKS} ticks — the window cannot see a fall`);
    test.assert(drift === 0, `the charge moved ${drift} by itself in ${HOVER_TICKS} ticks`);

    // 2. A player walking through it, then into a pig on the same line.
    // A spawnWithoutBehaviors pig is never pushed (0.000, BDS 1.26.51.1), so
    // the witness is an ordinary pig that Slowness 255 keeps from walking.
    const pig = dim.spawnEntity("minecraft:pig", test.worldLocation(PIG_CELL));
    leftovers.push(pig);
    pig.addEffect("slowness", 600, { amplifier: 255, showParticles: false });
    await test.idle(4);
    const pigAt = pig.location;
    const walker = test.spawnSimulatedPlayer(WALKER_STAND, "andrew_orbital_walker", GameMode.Survival);
    await test.idle(4);
    walker.moveToLocation({ x: CHARGE_CELL.x, y: 2, z: 0.5 });
    let closest = Number.POSITIVE_INFINITY;
    let pigPushed = 0;
    for (let tick = 0; tick < 60; tick++) {
      await test.idle(1);
      const w = test.relativeLocation(walker.location);
      closest = Math.min(closest, Math.hypot(w.x - CHARGE_CELL.x, w.z - CHARGE_CELL.z));
      drift = Math.max(drift, moved(charge.location, at));
      pigPushed = Math.max(pigPushed, moved(pig.location, pigAt));
    }
    walker.stopMoving();
    log(`walk RESULT walker passed within ${closest.toFixed(3)} of the charge column; charge max drift ${drift}; control pig pushed ${pigPushed.toFixed(3)}`);
    test.assert(closest < 0.3, `the walker never crossed the charge (closest ${closest})`);
    test.assert(pigPushed > 0.05, `control: a player walking into a pig moved it only ${pigPushed} — the probe cannot see a push`);
    test.assert(drift === 0, `the charge moved ${drift} while a player walked through it`);
    test.removeSimulatedPlayer(walker);
    await test.idle(2);

    // 3. A blast next to it, with the pig as the witness that it hurts.
    pig.teleport(test.worldLocation({ x: CHARGE_CELL.x - 1.5, y: 2, z: CHARGE_CELL.z }));
    await test.idle(2);
    const pigHealth = healthOf(pig);
    const blastAt = test.worldLocation({ x: CHARGE_CELL.x + 1.5, y: CHARGE_CELL.y, z: CHARGE_CELL.z });
    test.assert(dim.createExplosion(blastAt, BLAST_RADIUS, { breaksBlocks: false, causesFire: false }), "createExplosion refused to explode");
    await test.idle(10);
    const pigLost = pig.isValid ? pigHealth - healthOf(pig) : pigHealth;
    const chargeHealth = charge.isValid ? charge.getComponent(EntityComponentTypes.Health)?.currentValue : undefined;
    log(
      `blast RESULT charge valid ${charge.isValid} at ${charge.isValid ? fmt(charge.location) : "-"} health ${chargeHealth}; ` +
        `control pig lost ${pigLost} (valid ${pig.isValid})`
    );
    test.assert(pigLost > 0, "control: the blast did not hurt a pig beside the charge — it reached nothing");
    test.assert(charge.isValid, "the charge was destroyed by a blast next to it");
    test.assert(moved(charge.location, at) === 0, `the blast moved the charge to ${fmt(charge.location)}`);
    test.succeed();
  } finally {
    for (const entity of leftovers) if (entity.isValid) entity.remove();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");
