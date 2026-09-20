// GameTest scenarios for the Miner's Pickaxe, driven by a SimulatedPlayer.
//
// Dev-only: this module is the entry of packs/gametest, a behavior pack that
// only `npm run bds:gametest` installs. It is never bundled by `npm run build`
// and never enters dist/andrew.mcaddon.
//
// It is the ONE place in the repository that imports a beta module.
// @minecraft/server-gametest is beta-only — there is no stable channel for it —
// so it needs the "Beta APIs" experiment on the world, which is why this pack
// lives outside the product and runs against its own `gametest` world.
// The product packs stay on stable @minecraft/server 2.10.0.
// [src: concept-constraint C-2]
//
// Output contract, consumed by scripts/bds-gametest.mjs: the GameTest runner
// itself prints "onTestPassed: <name>" / "onTestFailed: <name> - <why>" to the
// server console. The [gametest] console.warn lines below are for a human
// reading dist/bds-gametest.log.

import { GameMode, ItemStack, Vector3 } from "@minecraft/server";
import { Test, register } from "@minecraft/server-gametest";

console.warn("[gametest] script loaded");

const PICKAXE_ID = "andrew:miners_pickaxe";

/** Must match the structure written by scripts/bds-gametest.mjs. */
const STRUCTURE = "andrew:platform";

// Relative to the structure corner. The engine places the structure's bottom
// layer — the stone floor the generator writes — at y=1, not y=0, so y=1 is the
// floor itself and y=2 is the first air block above it. Measured on BDS
// 1.26.51.1: stone is present at 3,1,3 and 2,1,3, absent at 3,2,3.
const TARGET: Vector3 = { x: 3, y: 1, z: 3 };
const STAND: Vector3 = { x: 3, y: 2, z: 5 };

/** Wide enough to catch a drop that bounced off the block it came from. */
const SEARCH_RADIUS = 4;

/**
 * Make `loc` hold `blockId`, tolerating the case where it already does.
 *
 * GameTest's setBlockType throws `gameTest.assert.couldNotSetBlock` when the
 * call would not change anything — the engine reports "no change" and "could
 * not" through the same failure. So placing stone on the stone floor is not a
 * no-op but a test failure ("Could not setBlock 'stone'"), while placing
 * iron_ore on that same block succeeds. Asking first is what separates the two.
 */
function placeBlock(test: Test, blockId: string, loc: Vector3): void {
  if (test.getBlock(loc).typeId === blockId) return;
  test.setBlockType(blockId, loc);
}

/**
 * One mining scenario: the simulated player breaks `blockId` with the pickaxe
 * and the test passes when `expectedDropId` is on the ground and
 * `forbiddenDropId` is not.
 *
 * `forbiddenDropId` is what vanilla would have dropped instead. Asserting its
 * absence is the half that actually proves the override: a test that only
 * looked for the ingot would also pass if the engine dropped both.
 */
function miningScenario(blockId: string, expectedDropId: string, forbiddenDropId: string) {
  return (test: Test): void => {
    placeBlock(test, blockId, TARGET);

    // Survival, not creative: creative suppresses vanilla block drops, so the
    // stone -> cobblestone control would prove nothing there.
    // [src: concept-constraint C-9]
    const player = test.spawnSimulatedPlayer(STAND, "andrew_tester", GameMode.Survival);

    // Giving and selecting the item is not observable on the same tick the
    // player is spawned, so the break is deferred rather than chained.
    test.runAfterDelay(4, () => {
      player.giveItem(new ItemStack(PICKAXE_ID, 1), true);
      test.runAfterDelay(4, () => {
        player.lookAtBlock(TARGET);
        player.breakBlock(TARGET);
      });
    });

    // Retried every tick until maxTicks; the last failure becomes the reported
    // reason, so a timeout says which half of the claim was missing.
    test.succeedWhen(() => {
      test.assertItemEntityPresent(expectedDropId, TARGET, SEARCH_RADIUS, true);
      test.assertItemEntityPresent(forbiddenDropId, TARGET, SEARCH_RADIUS, false);

      // Infinite durability is implemented by omitting the component, so the
      // proof that mining did not wear the tool down is that the held item is
      // still the pickaxe and still has no durability to spend.
      const held = player.getComponent("minecraft:inventory")?.container?.getItem(
        player.selectedSlotIndex
      );
      test.assert(held !== undefined, "the pickaxe left the player's hand while mining");
      test.assert(
        held?.typeId === PICKAXE_ID,
        `the selected slot holds ${held?.typeId} instead of ${PICKAXE_ID}`
      );
      test.assert(
        held?.getComponent("minecraft:durability") === undefined,
        "the pickaxe gained a durability component — it is no longer unbreakable by omission"
      );
    });
  };
}

// Iron ore is the auto-smelt claim: the override cancels the vanilla break and
// spawns the smelted product, so raw_iron must never hit the ground.
register(
  "andrew",
  "pickaxe_autosmelt",
  miningScenario("minecraft:iron_ore", "minecraft:iron_ingot", "minecraft:raw_iron")
)
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// Stone is the control: it is NOT on the allow-list, so the same pickaxe must
// leave vanilla behaviour alone and drop cobblestone.
register(
  "andrew",
  "pickaxe_keeps_vanilla_drops",
  miningScenario("minecraft:stone", "minecraft:cobblestone", "minecraft:iron_ingot")
)
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

console.warn("[gametest] registered 2 test(s) under tag 'andrew'");
