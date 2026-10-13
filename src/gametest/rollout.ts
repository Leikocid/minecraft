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
// The Underwater Bow goes first and is the control: three zeros prove nothing until
// something in the same Crafter proves the harness crafts at all. Counted as the token
// AND the finished bow together: src/gametest/main.ts arms its own craft gate, and that
// copy — unlike the release pack's, which cannot see a SimulatedPlayer — swaps the token
// for the bow on the tick it arrives.

import { BlockPermutation, EntityComponentTypes, GameMode, type Player, type Vector3 } from "@minecraft/server";
import { type Test, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const CRAFTER: Vector3 = { x: 3, y: 2, z: 4 };
const POWER: Vector3 = { x: 2, y: 2, z: 4 };
const SETTLE_TICKS = 20;

const log = (msg: string): void => console.warn(`[gametest] rollout ${msg}`);

/** Row-major, 9 slots; `undefined` is an empty slot. Bedrock does not trim a blank row, so the rows are as written. */
type Grid = ReadonlyArray<string | undefined>;

// " R " / "WBW" / " S "
const UBOW: Grid = [undefined, "minecraft:lightning_rod", undefined, "minecraft:water_bucket", "minecraft:bow", "minecraft:water_bucket", undefined, "minecraft:sand", undefined];
// "   " / " I " / " Z "
const MACE: Grid = [undefined, undefined, undefined, undefined, "minecraft:iron_block", undefined, undefined, "minecraft:breeze_rod", undefined];
// "   " / " P " / " S "
const ROCKET: Grid = [undefined, undefined, undefined, undefined, "minecraft:paper", undefined, undefined, "minecraft:string", undefined];
// " P " / " R " / "   "
const PEARL_ROD: Grid = [undefined, "minecraft:ender_pearl", undefined, undefined, "minecraft:fishing_rod", undefined, undefined, undefined, undefined];

function inventoryOf(player: Player) {
  const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
  if (container === undefined) throw new Error(`${player.name} has no inventory container`);
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

  await craft(test, UBOW, "the Underwater Bow (rolled out)");
  const token = countOf(player, "andrew:underwater_bow_crafted");
  const bow = countOf(player, "andrew:underwater_bow");
  log(`control: andrew:underwater_bow_crafted = ${token}, andrew:underwater_bow = ${bow}`);
  test.assert(
    token + bow === 1,
    `the control craft produced ${token} token(s) and ${bow} bow(s), not one of the two — the harness or the ` +
      "release pack is broken, and the three zeros below would mean nothing"
  );

  await craft(test, MACE, "the Mace recipe (withheld)");
  await craft(test, ROCKET, "the Firework Rocket recipe (withheld)");
  await craft(test, PEARL_ROD, "the Pearl Rod recipe (withheld)");

  const mace = countOf(player, "minecraft:mace");
  const rocket = countOf(player, "minecraft:firework_rocket");
  const rod = countOf(player, "andrew:pearl_rod_token");
  log(`withheld: minecraft:mace = ${mace}, minecraft:firework_rocket = ${rocket}, andrew:pearl_rod_token = ${rod}`);

  test.assert(mace === 0, `the withheld Mace recipe crafted ${mace} mace(s) — its file is in the archive`);
  test.assert(rocket === 0, `the withheld Rocket recipe crafted ${rocket} rocket(s) — its file is in the archive`);
  test.assert(rod === 0, `the withheld Pearl Rod recipe crafted ${rod} token(s) — its file is in the archive`);
  log("RESULT the release pack crafts the Underwater Bow and offers no way to the Mace, the rockets or the Pearl Rod");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(700)
  .tag("andrew");
