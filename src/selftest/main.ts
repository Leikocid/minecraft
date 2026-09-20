// In-engine self-check. Dev-only: this module is the entry of packs/selftest,
// a behavior pack that is installed by `npm run bds:check` and never packaged
// into dist/andrew.mcaddon.
//
// Why it exists: bds:check used to prove only "the pack loaded and the script
// ran". Loading proves nothing about whether an item exists or is configured as
// the spec says — that needed an iPad and a human. These checks run inside the
// real engine on BDS, so the add-on's own claims about itself are machine-
// checkable.
//
// Output contract, consumed by scripts/bds-check.mjs:
//   [selftest] PASS <name>
//   [selftest] FAIL <name>: <why>
//   [selftest] DONE passed=N failed=M
//
// Only the stable @minecraft/server 2.10.0 surface is used — no beta modules.
// [src: concept-constraint C-2]

import {
  EnchantmentSlot,
  EnchantmentType,
  EnchantmentTypes,
  ItemStack,
  world,
} from "@minecraft/server";
import { smeltedDropFor } from "../autosmelt";

/**
 * Build-time flag, injected by esbuild `--define`. Always false in a normal
 * build; `npm run bds:check -- --break-selftest` re-bundles with it true to
 * prove the self-check can actually go red (otherwise an all-green run is
 * indistinguishable from a self-check that never asserts anything).
 */
declare const __SELFTEST_FIXTURE__: boolean;

const PICKAXE_ID = "andrew:miners_pickaxe";
const TEST_ITEM_ID = "andrew:test_item";

/**
 * The auto-smelt allow-list restated independently of src/autosmelt.ts. The
 * duplication is the point: a check that imported the table and compared it to
 * itself would pass no matter what the table said.
 */
const EXPECTED_SMELT: ReadonlyArray<readonly [string, string]> = [
  ["minecraft:iron_ore", "minecraft:iron_ingot"],
  ["minecraft:deepslate_iron_ore", "minecraft:iron_ingot"],
  ["minecraft:gold_ore", "minecraft:gold_ingot"],
  ["minecraft:deepslate_gold_ore", "minecraft:gold_ingot"],
  ["minecraft:copper_ore", "minecraft:copper_ingot"],
  ["minecraft:deepslate_copper_ore", "minecraft:copper_ingot"],
  ["minecraft:ancient_debris", "minecraft:netherite_scrap"],
];

let passed = 0;
let failed = 0;

function assert(condition: unknown, why: string): asserts condition {
  if (!condition) {
    throw new Error(why);
  }
}

/**
 * Run one named check. Every check is isolated: a throw is reported and the
 * remaining checks still run, so one broken probe cannot hide the others.
 */
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.warn(`[selftest] PASS ${name}`);
  } catch (err) {
    failed++;
    const why = err instanceof Error ? err.message : String(err);
    console.warn(`[selftest] FAIL ${name}: ${why}`);
  }
}

/**
 * Resolve the Unbreaking enchantment type.
 *
 * Both the bare and the namespaced id are tried because the docs give the
 * namespaced form ("minecraft:flame") while item JSON uses the bare one, and an
 * unresolvable id would otherwise be reported as "the engine refuses to
 * enchant" — the wrong conclusion from the right observation.
 */
function unbreakingType(): EnchantmentType {
  const type =
    EnchantmentTypes.get("unbreaking") ?? EnchantmentTypes.get("minecraft:unbreaking");
  assert(
    type !== undefined,
    'EnchantmentTypes.get returned undefined for both "unbreaking" and "minecraft:unbreaking" — ' +
      "the enchantment id is wrong for this engine version, so the probe is inconclusive"
  );
  return type;
}

function run(): void {
  // 1. The pickaxe exists as an item and stacks to one.
  check("pickaxe-item-stack", () => {
    const pickaxe = new ItemStack(PICKAXE_ID);
    assert(
      pickaxe.typeId === PICKAXE_ID,
      `expected typeId ${PICKAXE_ID}, got ${pickaxe.typeId}`
    );
    assert(pickaxe.maxAmount === 1, `expected maxAmount 1, got ${pickaxe.maxAmount}`);
  });

  // 2. ASM-004, decided empirically: does an item with no durability component
  //    still accept pickaxe enchantments? A false here is the probe's answer,
  //    not a defect in this script — it means the pickaxe spec has to change.
  //    [src: decision-zacharovanie-bez-durability-pro]
  check("pickaxe-enchantable", () => {
    const pickaxe = new ItemStack(PICKAXE_ID);
    const enchantable = pickaxe.getComponent("minecraft:enchantable");
    assert(
      enchantable !== undefined,
      "minecraft:enchantable component is absent from the item"
    );
    const slots = enchantable.slots;
    assert(
      slots.includes(EnchantmentSlot.Pickaxe),
      `enchantable slots ${JSON.stringify(slots)} do not include ${EnchantmentSlot.Pickaxe}`
    );
    const canAdd = enchantable.canAddEnchantment({ type: unbreakingType(), level: 1 });
    assert(canAdd, "предмет без durability не зачаровывается");
  });

  // 3. Infinite durability is implemented by omitting the component, not by a
  //    large value — so its absence is the thing to assert.
  check("pickaxe-no-durability", () => {
    const pickaxe = new ItemStack(PICKAXE_ID);
    assert(
      !pickaxe.hasComponent("minecraft:durability"),
      "minecraft:durability is present — the pickaxe is no longer unbreakable by omission"
    );
  });

  // 4. The stage-0 placeholder item still resolves.
  check("test-item-item-stack", () => {
    const item = new ItemStack(TEST_ITEM_ID);
    assert(
      item.typeId === TEST_ITEM_ID,
      `expected typeId ${TEST_ITEM_ID}, got ${item.typeId}`
    );
  });

  // 5. The auto-smelt table covers all seven ores, and every product it names
  //    is a real item id in this version of the game.
  check("autosmelt-table", () => {
    for (const [blockId, expectedItemId] of EXPECTED_SMELT) {
      const drop = smeltedDropFor(blockId);
      assert(drop !== undefined, `${blockId} is not covered by smeltedDropFor`);
      assert(
        drop.itemId === expectedItemId,
        `${blockId} smelts to ${drop.itemId}, expected ${expectedItemId}`
      );
      const stack = new ItemStack(drop.itemId, drop.count);
      assert(
        stack.typeId === expectedItemId,
        `ItemStack(${drop!.itemId}) resolved to ${stack.typeId}`
      );
    }
  });

  if (__SELFTEST_FIXTURE__) {
    // Only reachable under --break-selftest. Deliberately expects an item that
    // does not exist, so the FAIL path and the non-zero exit of bds:check are
    // exercised end to end.
    check("fixture-deliberate-failure", () => {
      new ItemStack("andrew:no_such_item");
      assert(false, "andrew:no_such_item was created — the fixture cannot fail");
    });
  }

  console.warn(`[selftest] DONE passed=${passed} failed=${failed}`);
}

world.afterEvents.worldLoad.subscribe(() => {
  run();
});
