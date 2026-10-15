// The rollout list, judged on the pack that actually ships (rollout.json,
// docs/dev/rollout.md). A withheld product keeps its code, its unit tests and its
// own scenarios — what it loses is the recipe file in dist/andrew.mcaddon, and the
// only way to prove that is to craft on a server installed from that archive:
//
//   npm run bds:gametest -- --release-pack --only andrew:rollout_withheld_recipes
//
// Every other run restores the withheld files before installing, so this scenario is
// out of the gate and out of --all; under that install it fails by design.
//
// The scenario asks `isRolledOut` instead of naming what it expects to fail: rolling
// the next part out then needs no edit here, and a mistake in the list is visible
// from both sides at once. A product that is rolled out is also the control — four
// zeros would otherwise prove only that the stand is broken.
//
// The Underwater Bow is counted as its craft token AND the finished bow together:
// src/gametest/main.ts arms its own craft gate, and that copy — unlike the release
// pack's, which cannot see a SimulatedPlayer — swaps the token on the tick it arrives.

import { BlockPermutation, EntityComponentTypes, GameMode, type Player, type Vector3 } from "@minecraft/server";
import { type Test, registerAsync } from "@minecraft/server-gametest";
import { type ProductId, isRolledOut } from "../rollout";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const CRAFTER: Vector3 = { x: 3, y: 2, z: 4 };
const POWER: Vector3 = { x: 2, y: 2, z: 4 };
const SETTLE_TICKS = 20;

const log = (msg: string): void => console.warn(`[gametest] rollout ${msg}`);

/** Row-major, 9 slots; `undefined` is an empty slot. Bedrock does not trim a blank row, so the rows are as written. */
type Grid = ReadonlyArray<string | undefined>;

interface Product {
  readonly id: ProductId;
  readonly label: string;
  readonly grid: Grid;
  /** What one craft leaves in the player's inventory, counted together: no two products share a type. */
  readonly results: ReadonlyArray<string>;
  readonly amount: number;
}

const PRODUCTS: ReadonlyArray<Product> = [
  {
    id: "underwater_bow",
    label: "the Underwater Bow",
    // " R " / "WBW" / " S "
    grid: [undefined, "minecraft:lightning_rod", undefined, "minecraft:water_bucket", "minecraft:bow", "minecraft:water_bucket", undefined, "minecraft:sand", undefined],
    results: ["andrew:underwater_bow_crafted", "andrew:underwater_bow"],
    amount: 1,
  },
  {
    id: "vanilla_mace_recipe",
    label: "the Mace recipe",
    // "   " / " I " / " Z "
    grid: [undefined, undefined, undefined, undefined, "minecraft:iron_block", undefined, undefined, "minecraft:breeze_rod", undefined],
    results: ["minecraft:mace"],
    amount: 1,
  },
  {
    id: "vanilla_rocket_recipe",
    label: "the Firework Rocket recipe",
    // "   " / " P " / " S "
    grid: [undefined, undefined, undefined, undefined, "minecraft:paper", undefined, undefined, "minecraft:string", undefined],
    results: ["minecraft:firework_rocket"],
    amount: 3,
  },
  {
    id: "pearl_rod",
    label: "the Pearl Rod recipe",
    // " P " / " R " / "   " — the token, or the marked vanilla rod the swap leaves instead
    grid: [undefined, "minecraft:ender_pearl", undefined, undefined, "minecraft:fishing_rod", undefined, undefined, undefined, undefined],
    results: ["andrew:pearl_rod_token", "minecraft:fishing_rod"],
    amount: 1,
  },
];

function inventoryOf(player: Player) {
  const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
  if (container === undefined) throw new Error(`${player.name} has no inventory container`);
  return container;
}

function countOf(player: Player, typeIds: ReadonlyArray<string>): number {
  const container = inventoryOf(player);
  let total = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack !== undefined && typeIds.includes(stack.typeId)) total += stack.amount;
  }
  return total;
}

/** Fills all 9 slots, blanks included, so one attempt cannot leak into the next. */
function loadGrid(test: Test, grid: Grid): void {
  const at = test.worldBlockLocation(CRAFTER);
  grid.forEach((item, slot) => {
    const cmd = `replaceitem block ${at.x} ${at.y} ${at.z} slot.container ${slot} ${item ?? "minecraft:air"} 1`;
    test.assert(test.getDimension().runCommand(cmd).successCount > 0, `${cmd} failed`);
  });
}

async function craft(test: Test, grid: Grid, label: string): Promise<void> {
  loadGrid(test, grid);
  test.pulseRedstone(POWER, 2);
  await test.idle(SETTLE_TICKS);
  log(`${label}: craft pulsed`);
}

registerAsync("andrew", "rollout_withheld_recipes", async (test: Test): Promise<void> => {
  test.setBlockPermutation(BlockPermutation.resolve("minecraft:crafter", { orientation: "south_up" }), CRAFTER);
  const player = test.spawnSimulatedPlayer(STAND, "rollout", GameMode.Survival);
  await test.idle(4);

  test.assert(
    PRODUCTS.some((p) => isRolledOut(p.id)),
    "every product in the list is withheld, so nothing here can tell a shut door from a broken stand"
  );

  const got = new Map<ProductId, number>();
  for (const product of PRODUCTS) {
    const out = isRolledOut(product.id);
    await craft(test, product.grid, `${product.label} (${out ? "rolled out" : "withheld"})`);
    got.set(product.id, countOf(player, product.results));
    log(`${product.label}: ${product.results.join(" + ")} = ${String(got.get(product.id))}, expected ${out ? product.amount : 0}`);
  }

  for (const product of PRODUCTS) {
    const out = isRolledOut(product.id);
    const want = out ? product.amount : 0;
    const have = got.get(product.id) ?? -1;
    test.assert(
      have === want,
      out
        ? `${product.label} is rolled out but crafted ${have} of ${product.amount} — its file is missing from the archive`
        : `${product.label} is withheld but crafted ${have} — its file is in the archive`
    );
  }
  log(`RESULT the release pack offers exactly what the list rolls out: ${PRODUCTS.filter((p) => isRolledOut(p.id)).map((p) => p.id).join(", ")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");
