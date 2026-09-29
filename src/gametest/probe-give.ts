// CX-L0-09 probe: does a legendary that did not come out of a crafting grid
// touch the one-per-world craft flag? Each test sets the scene, waits past the
// gate's one-tick flush and logs one "XCX9 <case> RESULT …" line; the verdict is
// read from those lines by docs/feedback/diagnose-CNTR-XCX9-AA.repro.sh, so the
// tests themselves always pass.

import { type Container, GameMode, ItemStack, type Player } from "@minecraft/server";
import { type Test, register } from "@minecraft/server-gametest";
import { type LegendaryDef, SCYTHE_OF_CALAMITY, WEB_SWORD } from "../legendary/registry";
import * as state from "../legendary/state";

/** Must match the structure written by scripts/bds-gametest.mjs. */
const STRUCTURE = "andrew:platform";
const STAND_A = { x: 2, y: 2, z: 5 };
const STAND_B = { x: 4, y: 2, z: 5 };
const SETTLE_TICKS = 40;

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    throw new Error(`${player.name} has no inventory container`);
  }
  return container;
}

function measure(def: LegendaryDef, player: Player): string {
  const container = inventoryOf(player);
  const refundIds = new Set(def.refund.map(([id]) => id));
  let held = 0;
  const marks: string[] = [];
  const refunded = new Map<string, number>();
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack === undefined) continue;
    if (stack.typeId === def.itemId) {
      held += stack.amount;
      marks.push(state.getMark(def, stack)?.origin ?? "none");
    } else if (refundIds.has(stack.typeId)) {
      refunded.set(stack.typeId, (refunded.get(stack.typeId) ?? 0) + stack.amount);
    }
  }
  const refund = [...refunded].map(([id, n]) => `${id}x${n}`).join(",") || "0";
  return `flag=${state.isCrafted(def)} held=${held} marks=${marks.join(",") || "-"} refund=${refund}`;
}

/** Vanilla /give from a non-player origin — the console or a command block. */
function vanillaGive(test: Test, def: LegendaryDef, player: Player): number {
  try {
    return test.getDimension().runCommand(`give "${player.name}" ${def.itemId} 1`).successCount;
  } catch (err) {
    console.warn(`XCX9 give ${def.itemId} threw: ${err instanceof Error ? err.message : String(err)}`);
    return -1;
  }
}

function giveCase(name: string, def: LegendaryDef): void {
  register("andrew", `probe_xcx9_${name}`, (test: Test): void => {
    state.resetCrafted(def);
    const player = test.spawnSimulatedPlayer(STAND_A, `xcx9_${name}`, GameMode.Survival);

    test.runAfterDelay(4, () => {
      const given = vanillaGive(test, def, player);
      test.runAfterDelay(SETTLE_TICKS, () => {
        console.warn(`XCX9 ${name} RESULT mode=${player.getGameMode()} give_success=${given} ${measure(def, player)}`);
        test.succeed();
      });
    });
  })
    .structureName(STRUCTURE)
    .maxTicks(200)
    .tag("andrew");
}

giveCase("give_websword", WEB_SWORD);
giveCase("give_scythe", SCYTHE_OF_CALAMITY);

// A /give first, then a craft by somebody else. The craft stand-in is the one the
// websword_* gate tests use: an unmarked sword added to a Survival inventory.
register("andrew", "probe_xcx9_give_then_craft", (test: Test): void => {
  state.resetCrafted(WEB_SWORD);
  const tester = test.spawnSimulatedPlayer(STAND_A, "xcx9_tester", GameMode.Survival);
  const crafter = test.spawnSimulatedPlayer(STAND_B, "xcx9_crafter", GameMode.Survival);

  test.runAfterDelay(4, () => {
    const given = vanillaGive(test, WEB_SWORD, tester);
    test.runAfterDelay(SETTLE_TICKS, () => {
      const afterGive = measure(WEB_SWORD, tester);
      inventoryOf(crafter).addItem(new ItemStack(WEB_SWORD.itemId, 1));
      test.runAfterDelay(SETTLE_TICKS, () => {
        console.warn(
          `XCX9 give_then_craft RESULT give_success=${given} tester[${afterGive}] crafter[${measure(WEB_SWORD, crafter)}]`
        );
        test.succeed();
      });
    });
  });
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

// The world's craft is already spent; the operator then hands out a test copy.
register("andrew", "probe_xcx9_give_after_craft", (test: Test): void => {
  state.setCrafted(WEB_SWORD, "xcx9_somebody");
  const player = test.spawnSimulatedPlayer(STAND_A, "xcx9_late", GameMode.Survival);

  test.runAfterDelay(4, () => {
    const given = vanillaGive(test, WEB_SWORD, player);
    test.runAfterDelay(SETTLE_TICKS, () => {
      console.warn(`XCX9 give_after_craft RESULT give_success=${given} ${measure(WEB_SWORD, player)}`);
      state.resetCrafted(WEB_SWORD);
      test.succeed();
    });
  });
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

// A Creative copy carries no mark (Q-006); here one lands at a Survival player's
// feet the way a Creative teammate's throw would, and is picked up.
register("andrew", "probe_xcx9_creative_copy_pickup", (test: Test): void => {
  state.resetCrafted(WEB_SWORD);
  const player = test.spawnSimulatedPlayer(STAND_A, "xcx9_taker", GameMode.Survival);

  test.runAfterDelay(4, () => {
    test.getDimension().spawnItem(new ItemStack(WEB_SWORD.itemId, 1), player.location);
    test.runAfterDelay(SETTLE_TICKS * 2, () => {
      console.warn(`XCX9 creative_copy_pickup RESULT ${measure(WEB_SWORD, player)}`);
      test.succeed();
    });
  });
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");
