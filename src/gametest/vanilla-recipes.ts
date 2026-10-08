// §03/§04, L0-adr-sbvr: the Elytra and Totem of Undying recipes are plain
// `minecraft:recipe_shaped`, unobserved by any script. A Crafter block runs
// the shipped recipe JSON itself and ejects the result at the player — the
// recipe's own output reaching an inventory, not a script insert of it.

import { BlockPermutation, type Container, GameMode, type Player, type Vector3, world } from "@minecraft/server";
import { type Test, register } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";

const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const CRAFTER: Vector3 = { x: 3, y: 2, z: 4 };
const POWER: Vector3 = { x: 2, y: 2, z: 4 };

const SETTLE_TICKS = 20;

interface Recipe {
  readonly name: string;
  readonly resultId: string;
  /** Row-major, 9 slots; `undefined` is an empty slot. */
  readonly grid: ReadonlyArray<string | undefined>;
  /** An incomplete layout that must not match: one ingredient short. */
  readonly incompleteGrid: ReadonlyArray<string | undefined>;
}

const ELYTRA: Recipe = {
  name: "elytra",
  resultId: "minecraft:elytra",
  grid: [
    "minecraft:feather", undefined, "minecraft:feather",
    "minecraft:feather", "minecraft:diamond_chestplate", "minecraft:feather",
    "minecraft:feather", undefined, "minecraft:feather",
  ],
  incompleteGrid: [
    "minecraft:feather", undefined, "minecraft:feather",
    undefined, "minecraft:diamond_chestplate", "minecraft:feather",
    "minecraft:feather", undefined, "minecraft:feather",
  ],
};

const TOTEM: Recipe = {
  name: "totem_of_undying",
  resultId: "minecraft:totem_of_undying",
  grid: [
    "minecraft:gold_ingot", "minecraft:gold_ingot", "minecraft:gold_ingot",
    "minecraft:gold_ingot", "minecraft:emerald", "minecraft:gold_ingot",
    "minecraft:gold_ingot", "minecraft:gold_ingot", "minecraft:gold_ingot",
  ],
  incompleteGrid: [
    "minecraft:gold_ingot", "minecraft:gold_ingot", "minecraft:gold_ingot",
    undefined, "minecraft:emerald", "minecraft:gold_ingot",
    "minecraft:gold_ingot", "minecraft:gold_ingot", "minecraft:gold_ingot",
  ],
};

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    throw new Error(`${player.name} has no inventory container`);
  }
  return container;
}

function countOf(player: Player, typeId: string): number {
  const container = inventoryOf(player);
  let total = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack?.typeId === typeId) total += stack.amount;
  }
  return total;
}

const arrivals = new Map<string, number>();

world.afterEvents.playerInventoryItemChange.subscribe((event) => {
  const player: Player | undefined = event.player;
  const typeId = event.itemStack?.typeId;
  if (player === undefined || typeId === undefined || ![ELYTRA, TOTEM].some((r) => r.resultId === typeId)) {
    return;
  }
  const key = `${player.name} ${typeId}`;
  arrivals.set(key, (arrivals.get(key) ?? 0) + 1);
  console.warn(`[gametest] vanilla recipe arrived: ${typeId} -> ${player.name} slot=${event.slot}`);
});

const arrivalsOf = (player: Player, typeId: string): number => arrivals.get(`${player.name} ${typeId}`) ?? 0;

function placeCrafter(test: Test): void {
  test.setBlockPermutation(BlockPermutation.resolve("minecraft:crafter", { orientation: "south_up" }), CRAFTER);
}

function loadFullGrid(test: Test, grid: ReadonlyArray<string | undefined>): void {
  const at = test.worldBlockLocation(CRAFTER);
  grid.forEach((itemId, slot) => {
    const cmd = `replaceitem block ${at.x} ${at.y} ${at.z} slot.container ${slot} ${itemId ?? "minecraft:air"} 1`;
    const ok = test.getDimension().runCommand(cmd).successCount;
    test.assert(ok > 0, `${cmd} failed`);
  });
}

function craftTwice(name: string, recipe: Recipe): void {
  register("andrew", `vanilla_recipe_${name}_unlimited`, (test: Test): void => {
    placeCrafter(test);
    const player = test.spawnSimulatedPlayer(STAND, `vr_${name}`, GameMode.Survival);

    function craft(label: string): void {
      loadFullGrid(test, recipe.grid);
      test.pulseRedstone(POWER, 2);
      console.warn(`[gametest] vanilla recipe ${name}: ${label} craft pulsed`);
    }

    test.runAfterDelay(4, () => craft("first"));
    test.runAfterDelay(4 + SETTLE_TICKS, () => craft("second"));
    test.runAfterDelay(4 + 2 * SETTLE_TICKS, () => craft("third"));

    test.runAfterDelay(4 + 3 * SETTLE_TICKS, () => {
      test.assert(arrivalsOf(player, recipe.resultId) === 3, `expected 3 arrivals of ${recipe.resultId}, got ${arrivalsOf(player, recipe.resultId)}`);
      const held = countOf(player, recipe.resultId);
      test.assert(held === 3, `expected 3 accumulated ${recipe.resultId} after three unlimited crafts, got ${held}`);
      console.warn(`[gametest] vanilla recipe ${name}: three unlimited crafts, no flags, no messages`);
      test.succeed();
    });
  })
    .structureName(STRUCTURE)
    .maxTicks(600)
    .tag("andrew");
}

craftTwice("elytra", ELYTRA);
craftTwice("totem", TOTEM);

register("andrew", "vanilla_recipe_negative_controls", (test: Test): void => {
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "vr_neg", GameMode.Survival);

  function pulse(label: string, grid: ReadonlyArray<string | undefined>): void {
    loadFullGrid(test, grid);
    test.pulseRedstone(POWER, 2);
    console.warn(`[gametest] vanilla recipe negative control: ${label}`);
  }

  test.runAfterDelay(4, () => pulse("incomplete elytra", ELYTRA.incompleteGrid));
  test.runAfterDelay(4 + SETTLE_TICKS, () => pulse("incomplete totem", TOTEM.incompleteGrid));

  test.runAfterDelay(4 + 2 * SETTLE_TICKS, () => {
    test.assert(arrivalsOf(player, ELYTRA.resultId) === 0, "an incomplete layout produced an Elytra");
    test.assert(arrivalsOf(player, TOTEM.resultId) === 0, "an incomplete layout produced a Totem of Undying");
    test.assert(countOf(player, ELYTRA.resultId) === 0, "an Elytra reached the player's inventory from an incomplete layout");
    test.assert(countOf(player, TOTEM.resultId) === 0, "a Totem of Undying reached the player's inventory from an incomplete layout");
    console.warn("[gametest] vanilla recipe negative controls: none matched");
    test.succeed();
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");
