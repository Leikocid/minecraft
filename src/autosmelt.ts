// Auto-smelt prototype for the Miner's Pickaxe.
//
// Breaking one of seven ore blocks with andrew:miners_pickaxe drops the smelted
// product directly, skipping the raw-material stage. Every other block, and
// every other tool, keeps vanilla breaking behavior — the override is a closed
// allow-list, not a general transformation.

import { ItemStack, system, world } from "@minecraft/server";

const MINERS_PICKAXE_ID = "andrew:miners_pickaxe";

/**
 * The closed allow-list from the spec: iron/gold/copper ore and their deepslate
 * variants, plus ancient debris. A Map rather than an object literal so that a
 * lookup of "constructor" or "toString" cannot reach Object.prototype.
 */
const SMELTED_DROPS = new Map<string, string>([
  ["minecraft:iron_ore", "minecraft:iron_ingot"],
  ["minecraft:deepslate_iron_ore", "minecraft:iron_ingot"],
  ["minecraft:gold_ore", "minecraft:gold_ingot"],
  ["minecraft:deepslate_gold_ore", "minecraft:gold_ingot"],
  ["minecraft:copper_ore", "minecraft:copper_ingot"],
  ["minecraft:deepslate_copper_ore", "minecraft:copper_ingot"],
  ["minecraft:ancient_debris", "minecraft:netherite_scrap"],
]);

export interface SmeltedDrop {
  itemId: string;
  count: number;
}

/**
 * The smelted drop for a block, or undefined when the block is not in the
 * allow-list. Pure — no engine access, so it is testable off the game.
 *
 * Count is always 1: Fortune is deliberately deferred by the spec, and the
 * spec's wording ("copper ore -> copper ingot") is taken literally even though
 * vanilla copper yields 2-5 raw copper.
 */
export function smeltedDropFor(blockTypeId: string): SmeltedDrop | undefined {
  const itemId = SMELTED_DROPS.get(blockTypeId);
  return itemId === undefined ? undefined : { itemId, count: 1 };
}

/**
 * Subscribe the auto-smelt handler.
 *
 * No experience is granted. All seven blocks on the allow-list yield zero
 * experience when mined in vanilla — iron, gold and copper ore drop raw
 * materials, and ancient debris has never dropped any — so "roughly like
 * vanilla ore" is exactly nothing, and cancelling the break takes nothing away.
 * The experience a player would earn is at the furnace; paying that out here
 * would be a balance decision the spec does not authorise.
 */
export function registerAutoSmelt(): void {
  world.beforeEvents.playerBreakBlock.subscribe((event) => {
    if (event.itemStack?.typeId !== MINERS_PICKAXE_ID) {
      return;
    }

    const drop = smeltedDropFor(event.block.typeId);
    if (drop === undefined) {
      return;
    }

    event.cancel = true;

    // Read everything needed off the event synchronously, as plain values: the
    // Block handle may be stale by the next tick.
    const dimension = event.dimension;
    const { x, y, z } = event.block.location;

    // A before-event must never mutate the world synchronously — the engine
    // forbids it, so the break and the drop are deferred by one tick.
    system.run(() => {
      dimension.setBlockType({ x, y, z }, "minecraft:air");
      dimension.spawnItem(new ItemStack(drop.itemId, drop.count), {
        x: x + 0.5,
        y: y + 0.5,
        z: z + 0.5,
      });
    });
  });
}
