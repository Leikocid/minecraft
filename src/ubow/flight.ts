// Underwater Bow arrows fly through water and lava as through air (spec §1; L0-uwbw-adfl, C-42). The
// bow's arrow stays the vanilla minecraft:arrow, so its damage, crit, Power, Punch and Flame stay
// vanilla: in its spawn tick it is tagged and its liquid inertia is set to its air inertia. Lava never
// slows an arrow (probe §2), so water is the only liquid the write changes anything in. An Infinity
// copy's arrow is taken off when it lands, as a custom shooter's could be picked up (probe §3).

import {
  type Entity,
  EntityComponentTypes,
  type EntityLoadAfterEvent,
  type EntitySpawnAfterEvent,
  EquipmentSlot,
  ItemComponentTypes,
  type ItemStack,
  Player,
  type ProjectileHitBlockAfterEvent,
  system,
  world,
} from "@minecraft/server";
import { heldLegendaries } from "../legendary/hands";
import { UNDERWATER_BOW } from "../legendary/registry";
import { ARROW_ID, FLIGHT_TAG, INFINITY, INFINITY_TAG, liquidInertiaFor } from "./flight-rules";

let armed = false;
let liquidNeutral = true;

const log = (msg: string): void => console.warn(`[andrew] ubow flight: ${msg}`);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

/** Off only for the negative control (L0-uwbw-a003): the bow's arrows are still tagged, but keep vanilla water drag. */
export function setLiquidNeutral(on: boolean): void {
  liquidNeutral = on;
}

/** Whether `entity` is an arrow the Underwater Bow fired. A removed entity reads false. */
export function isUnderwaterBowArrow(entity: Entity): boolean {
  try {
    return entity.typeId === ARROW_ID && entity.hasTag(FLIGHT_TAG);
  } catch {
    return false;
  }
}

function ownerOf(arrow: Entity): Player | undefined {
  try {
    const owner = arrow.getComponent(EntityComponentTypes.Projectile)?.owner;
    return owner instanceof Player && owner.isValid ? owner : undefined;
  } catch {
    return undefined;
  }
}

/** The bow can be held in the off hand but only fires from the main hand; an off-hand copy must not claim a vanilla bow's arrow. */
function bowIn(player: Player): ItemStack | undefined {
  try {
    return heldLegendaries(player).find((held) => held.def === UNDERWATER_BOW && held.slot === EquipmentSlot.Mainhand)?.stack;
  } catch {
    return undefined;
  }
}

function hasInfinity(bow: ItemStack): boolean {
  try {
    return bow.getComponent(ItemComponentTypes.Enchantable)?.hasEnchantment(INFINITY) === true;
  } catch {
    return false;
  }
}

function neutralise(arrow: Entity): void {
  const projectile = arrow.getComponent(EntityComponentTypes.Projectile);
  if (projectile === undefined) {
    log(`arrow ${arrow.id} has no projectile component, left vanilla`);
    return;
  }
  projectile.liquidInertia = liquidInertiaFor(projectile.airInertia);
}

/**
 * The arrow's spawn tick is the release tick, with its owner and the owner's main hand readable (probe
 * §1: +0, 53 of 53). An arrow with no readable owner — a dispenser's, a skeleton's, a SimulatedPlayer's
 * in a pack without the gametest module — is not the bow's and is left alone.
 */
function onSpawn(event: EntitySpawnAfterEvent): void {
  const arrow = event.entity;
  if (!arrow.isValid || arrow.typeId !== ARROW_ID) return;
  const owner = ownerOf(arrow);
  const bow = owner === undefined ? undefined : bowIn(owner);
  if (owner === undefined || bow === undefined) return;
  try {
    arrow.addTag(FLIGHT_TAG);
    if (hasInfinity(bow)) arrow.addTag(INFINITY_TAG);
    if (liquidNeutral) neutralise(arrow);
  } catch (err) {
    log(`arrow ${arrow.id} of ${owner.name} left vanilla: ${errText(err)}`);
  }
}

/**
 * An Infinity arrow is taken off a tick after it lands, so other handlers of this event can still read
 * it. A tipped arrow from an Infinity copy goes too, even if the shot spent it.
 */
function onHitBlock(event: ProjectileHitBlockAfterEvent): void {
  const arrow = event.projectile;
  try {
    if (!arrow.isValid || !arrow.hasTag(INFINITY_TAG)) return;
  } catch {
    return;
  }
  system.run(() => {
    try {
      if (arrow.isValid) arrow.remove();
    } catch (err) {
      log(`infinity arrow could not be taken off: ${errText(err)}`);
    }
  });
}

/** A tagged arrow that comes back with its chunk or after a restart gets the write again. */
function onLoad(event: EntityLoadAfterEvent): void {
  const arrow = event.entity;
  if (!liquidNeutral || !isUnderwaterBowArrow(arrow)) return;
  try {
    neutralise(arrow);
  } catch (err) {
    log(`reloaded arrow ${arrow.id} left vanilla: ${errText(err)}`);
  }
}

export function registerUbowFlight(): void {
  if (armed) return;
  armed = true;
  world.afterEvents.entitySpawn.subscribe(onSpawn);
  world.afterEvents.projectileHitBlock.subscribe(onHitBlock);
  world.afterEvents.entityLoad.subscribe(onLoad);
  console.warn("[andrew] underwater bow flight armed (entitySpawn: tag + liquid inertia = air inertia; landed Infinity arrows taken off)");
}
