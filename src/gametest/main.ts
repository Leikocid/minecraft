// GameTest scenarios for the Miner's Pickaxe and the Web Sword craft gate,
// driven by SimulatedPlayers.
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

import { Container, GameMode, ItemStack, Player, Vector3 } from "@minecraft/server";
import { Test, register } from "@minecraft/server-gametest";
import { registerCraftGate } from "../websword/craftgate";
import { WEB_SWORD_ID, findMarkedSword, isCrafted, resetCrafted } from "../websword/state";

console.warn("[gametest] script loaded");

// The release pack arms this same gate, and in this world it can do nothing:
// the engine cannot hand a pack without @minecraft/server-gametest a
// SimulatedPlayer object, so `playerInventoryItemChange.player` arrives
// undefined there. Measured on BDS 1.26.51.1 — `world.getAllPlayers()` in the
// release pack returned the right count (1, then 2, then 1, matching what the
// scenarios below spawn) with zero entries readable, so there is no route for
// it at all. [src: concept-constraint C-2]
//
// This pack owns the binding, so arming the *production* gate here is what lets
// the scenarios drive the real chain end to end — the same subscription, queue,
// once-per-tick flush and settle logic the release pack runs for a human.
registerCraftGate();

const PICKAXE_ID = "andrew:miners_pickaxe";

/** Must match the structure written by scripts/bds-gametest.mjs. */
const STRUCTURE = "andrew:platform";

// Relative to the structure corner. The engine places the structure's bottom
// layer — the stone floor the generator writes — at y=1, not y=0, so y=1 is the
// floor itself and y=2 is the first air block above it. Measured on BDS
// 1.26.51.1: stone is present at 3,1,3 and 2,1,3, absent at 3,2,3.
const TARGET: Vector3 = { x: 3, y: 1, z: 3 };
const STAND: Vector3 = { x: 3, y: 2, z: 5 };

// The platform is 7x7 and the craft-race scenario needs two players that are
// not standing on top of each other.
const STAND_A: Vector3 = { x: 2, y: 2, z: 5 };
const STAND_B: Vector3 = { x: 4, y: 2, z: 5 };

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

// ------------------------------------------------- Web Sword: one per world
//
// A SimulatedPlayer cannot operate a crafting grid, so the craft is imitated by
// putting an *unmarked* andrew:web_sword into the player's inventory. That is
// not a shortcut around the gate — it is the same path a real craft takes: the
// gate has no "before craft" event to hook and reacts to an unmarked sword
// appearing in an inventory, whatever put it there.
// [src: decision-q-008-blocked-craft-refund-a-obnaruzhit-i-vernut]
//
// The gate itself lives in the *release* behavior pack, which this world loads
// alongside the gametest pack; only src/websword/state.ts is bundled in here,
// to read the world flag and the instance marks the gate writes.

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    throw new Error(`${player.name} has no inventory container`);
  }
  return container;
}

/** Total amount per item id across the whole container. */
function countByType(container: Container): Map<string, number> {
  const counts = new Map<string, number>();
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack === undefined) continue;
    counts.set(stack.typeId, (counts.get(stack.typeId) ?? 0) + stack.amount);
  }
  return counts;
}

function countOf(container: Container, itemId: string): number {
  return countByType(container).get(itemId) ?? 0;
}

/** Hand the player an unmarked sword — the stand-in for a completed craft. */
function fakeCraft(player: Player): void {
  inventoryOf(player).addItem(new ItemStack(WEB_SWORD_ID, 1));
}

// The world flag is durable by design, so it survives from one test to the
// next — and every scenario below starts from "nobody has crafted yet".
// Clearing it up front is what makes the three independent of run order.

register("andrew", "websword_first_claim", (test: Test): void => {
  resetCrafted();

  const player = test.spawnSimulatedPlayer(STAND_A, "andrew_crafter", GameMode.Survival);

  // The player is not observable on the tick it is spawned.
  test.runAfterDelay(4, () => {
    fakeCraft(player);
  });

  test.succeedWhen(() => {
    const found = findMarkedSword(inventoryOf(player));
    test.assert(found !== undefined, "no marked Web Sword in the crafter's inventory");
    test.assert(
      found?.mark.origin === "craft",
      `mark origin is ${String(found?.mark.origin)}, expected "craft"`
    );
    test.assert(
      found?.mark.owner === player.id,
      `mark owner is ${String(found?.mark.owner)}, expected ${player.id}`
    );
    // The half that proves the *world* changed, not just the item: without it
    // a gate that marked swords and never spent the budget would pass.
    test.assert(isCrafted(), "the world craft flag was not claimed");
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

register("andrew", "websword_second_refund", (test: Test): void => {
  resetCrafted();

  const first = test.spawnSimulatedPlayer(STAND_A, "andrew_first", GameMode.Survival);
  const second = test.spawnSimulatedPlayer(STAND_B, "andrew_second", GameMode.Survival);

  test.runAfterDelay(4, () => {
    fakeCraft(first);
    // Far enough after the first claim that the flag is already set — the
    // same-tick race is a separate concern and is settled inside one flush.
    test.runAfterDelay(10, () => {
      fakeCraft(second);
    });
  });

  test.succeedWhen(() => {
    test.assert(
      findMarkedSword(inventoryOf(first)) !== undefined,
      "the first player's craft was never claimed, so the second one proves nothing"
    );

    const inventory = inventoryOf(second);
    const swords = countOf(inventory, WEB_SWORD_ID);
    test.assert(swords === 0, `the second player kept ${swords} Web Sword(s) — the craft was not blocked`);

    const cobweb = countOf(inventory, "minecraft:web");
    test.assert(cobweb === 4, `the second player was returned ${cobweb} cobweb, expected 4`);

    const diamondSword = countOf(inventory, "minecraft:diamond_sword");
    test.assert(
      diamondSword === 1,
      `the second player was returned ${diamondSword} diamond sword(s), expected 1`
    );
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

register("andrew", "websword_creative_ignored", (test: Test): void => {
  resetCrafted();

  const player = test.spawnSimulatedPlayer(STAND_A, "andrew_builder", GameMode.Creative);

  test.runAfterDelay(4, () => {
    fakeCraft(player);
  });

  // A negative claim cannot be proven by succeedWhen — "nothing happened" is
  // true on the first tick whether the gate is exempting Creative or simply has
  // not run yet. So the assertions wait until long after the gate would have
  // acted (the claim path is one tick) and then check once.
  // [src: decision-q-015-gate-game-modes-survival-i-adventure]
  test.runAfterDelay(40, () => {
    const inventory = inventoryOf(player);
    test.assert(!isCrafted(), "a Creative copy spent the world's one survival craft");
    test.assert(
      findMarkedSword(inventory) === undefined,
      "the gate stamped an instance mark on a Creative copy"
    );
    const swords = countOf(inventory, WEB_SWORD_ID);
    test.assert(swords === 1, `the Creative player holds ${swords} Web Sword(s), expected the 1 they were given`);
    test.succeed();
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

console.warn("[gametest] registered 5 test(s) under tag 'andrew'");
