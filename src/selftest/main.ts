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
import { inspectChunkApi, readLocation, scanFrontier, systemWait, tickingAreaLimit, tickingAreaLoad } from "./chunk-probe";
import { smeltedDropFor } from "../autosmelt";
import { COOLDOWN_TICKS, cooldownRemaining } from "../legendary/rules";

/**
 * Build-time flag, injected by esbuild `--define`. Always false in a normal
 * build; `npm run bds:check -- --break-selftest` re-bundles with it true to
 * prove the self-check can actually go red (otherwise an all-green run is
 * indistinguishable from a self-check that never asserts anything).
 */
declare const __SELFTEST_FIXTURE__: boolean;

const PICKAXE_ID = "andrew:miners_pickaxe";
const WEB_SWORD_ID = "andrew:web_sword";
const SCYTHE_ID = "andrew:scythe_of_calamity";
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

/** Resolve the Sharpness enchantment type — same bare/namespaced fallback as unbreakingType(). */
function sharpnessType(): EnchantmentType {
  const type =
    EnchantmentTypes.get("sharpness") ?? EnchantmentTypes.get("minecraft:sharpness");
  assert(
    type !== undefined,
    'EnchantmentTypes.get returned undefined for both "sharpness" and "minecraft:sharpness" — ' +
      "the enchantment id is wrong for this engine version, so the probe is inconclusive"
  );
  return type;
}

/** Async twin of check(): the chunk probes have to wait for ticks. */
async function checkAsync(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    passed++;
    console.warn(`[selftest] PASS ${name}`);
  } catch (err) {
    failed++;
    const why = err instanceof Error ? err.message : String(err);
    console.warn(`[selftest] FAIL ${name}: ${why}`);
  }
}

const probeLog = (msg: string): void => console.warn(`[selftest] probe ${msg}`);

/**
 * strf-p006 questions 9 and 11 in a world with no player and no GameTest —
 * the only place where "areas added before refusal" is the whole world limit.
 * These are measurements: a check fails only when it could not measure.
 */
async function runChunkProbes(): Promise<void> {
  const dim = world.getDimension("overworld");
  const spawn = world.getDefaultSpawnLocation();
  const origin = { x: spawn.x, y: 64, z: spawn.z };

  await checkAsync("probe-chunk-loaded-api", async () => {
    const present = inspectChunkApi(dim, probeLog, "Q9");
    const frontier = scanFrontier(dim, origin, 40, probeLog, "Q9");
    probeLog(`Q9 spawn ${origin.x},${origin.y},${origin.z}: ${readLocation(dim, origin)}`);
    probeLog(`Q9 RESULT player-less world: dimension.isChunkLoaded ${present ? "PRESENT" : "ABSENT"}; last loaded chunk along +x from spawn = ${frontier}`);
    assert(present, "dimension.isChunkLoaded is not a function on the Dimension object");
  });

  await checkAsync("probe-tickingarea-load", async () => {
    const center = { x: origin.x + 500, y: origin.y, z: origin.z };
    const r = await tickingAreaLoad(dim, center, "andrew_probe_q11", systemWait, probeLog, "Q11", 400);
    const limit = tickingAreaLimit(dim, { x: origin.x + 3000, y: origin.y, z: origin.z }, probeLog, "Q11");
    probeLog(
      `Q11 RESULT player-less world: add at 500 blocks ${r.addResult}; loaded before=${r.loadedBefore}; ` +
        `${r.loaded ? `loaded after ${r.ticks} tick(s) / ${r.ms} ms` : "did NOT load in 400 ticks"}; ` +
        `areas added before refusal=${limit.added} (${limit.refusal})`
    );
  });
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

  // Web Sword: same three shape-only checks as the pickaxe. Damage is not
  // checked here — the stable @minecraft/server 2.10.0 API has no
  // ItemDamageComponent, so that value is proven in tests/web-sword-item.test.mjs
  // against the raw JSON instead. [src: decision-web-sword-item-values]

  check("web-sword-item-stack", () => {
    const sword = new ItemStack(WEB_SWORD_ID);
    assert(sword.typeId === WEB_SWORD_ID, `expected typeId ${WEB_SWORD_ID}, got ${sword.typeId}`);
    assert(sword.maxAmount === 1, `expected maxAmount 1, got ${sword.maxAmount}`);
  });

  // Q-007, confirmed empirically for the pickaxe (slot "pickaxe"); the sword
  // repeats the same shape (slot "sword", no durability component).
  // [src: decision-q-007-enchantable-without-durability-podtverzhde]
  check("web-sword-enchantable", () => {
    const sword = new ItemStack(WEB_SWORD_ID);
    const enchantable = sword.getComponent("minecraft:enchantable");
    assert(enchantable !== undefined, "minecraft:enchantable component is absent from the item");
    const slots = enchantable.slots;
    assert(
      slots.includes(EnchantmentSlot.Sword),
      `enchantable slots ${JSON.stringify(slots)} do not include ${EnchantmentSlot.Sword}`
    );
    const canAdd = enchantable.canAddEnchantment({ type: sharpnessType(), level: 1 });
    assert(canAdd, "предмет без durability не зачаровывается (sharpness 1)");
  });

  check("web-sword-no-durability", () => {
    const sword = new ItemStack(WEB_SWORD_ID);
    assert(
      !sword.hasComponent("minecraft:durability"),
      "minecraft:durability is present — the web sword is no longer unbreakable by omission"
    );
  });

  // Scythe of Calamity: same three shape-only checks as the pickaxe and the
  // web sword. Melee damage parity and dig speed are engine facts that need a
  // second entity/block to compare against, so they are proven by GameTest
  // (andrew:scythe_melee_matches_netherite), not here.

  check("scythe-item-stack", () => {
    const scythe = new ItemStack(SCYTHE_ID);
    assert(scythe.typeId === SCYTHE_ID, `expected typeId ${SCYTHE_ID}, got ${scythe.typeId}`);
    assert(scythe.maxAmount === 1, `expected maxAmount 1, got ${scythe.maxAmount}`);
  });

  // Enchant slot is "sword" although the base item is a hoe (spec §1 wants
  // Netherite-sword-parity combat, and mattock chants have nothing to do with
  // combat). [src: decision-scythe-enchantments-slot-sword]
  check("scythe-enchantable", () => {
    const scythe = new ItemStack(SCYTHE_ID);
    const enchantable = scythe.getComponent("minecraft:enchantable");
    assert(enchantable !== undefined, "minecraft:enchantable component is absent from the item");
    const slots = enchantable.slots;
    assert(
      slots.includes(EnchantmentSlot.Sword),
      `enchantable slots ${JSON.stringify(slots)} do not include ${EnchantmentSlot.Sword}`
    );
    const canAdd = enchantable.canAddEnchantment({ type: sharpnessType(), level: 1 });
    assert(canAdd, "предмет без durability не зачаровывается (sharpness 1)");
  });

  check("scythe-no-durability", () => {
    const scythe = new ItemStack(SCYTHE_ID);
    assert(
      !scythe.hasComponent("minecraft:durability"),
      "minecraft:durability is present — the scythe is no longer unbreakable by omission"
    );
  });

  // WS-COOL-01: the cooldown module's pure surface is reachable and the timer
  // length matches spec §8's 30 seconds. The engine-dependent half (a player's
  // dynamic property) cannot be probed without a player — that is closed by
  // GameTest WS-TRAP-01 (isReady=false right after activation, true again 600
  // ticks later). [src: webswordspecv1ruen §8]
  check("web-sword-cooldown-ticks", () => {
    assert(
      COOLDOWN_TICKS === 600,
      `COOLDOWN_TICKS is ${COOLDOWN_TICKS}, expected 600 (30s at 20 ticks/s)`
    );
    assert(
      typeof cooldownRemaining === "function",
      "cooldownRemaining is not exported as a function from legendary/rules"
    );
    assert(
      cooldownRemaining(0, COOLDOWN_TICKS) === COOLDOWN_TICKS,
      "cooldownRemaining(0, COOLDOWN_TICKS) did not return the full timer length"
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

  // 6. The engine parses the .mcstructure our own NBT writer produced
  //    (src/structures/templates/probe.json): size, block states the Script
  //    API cannot set at runtime, and the waterlogging second layer.
  check("structure-probe", () => {
    const s = world.structureManager.get("andrew:probe");
    assert(s !== undefined, "andrew:probe is not a pack structure");
    assert(
      s.size.x === 5 && s.size.y === 3 && s.size.z === 5,
      `size is ${s.size.x}x${s.size.y}x${s.size.z}, expected 5x3x5`
    );
    const at = (x: number, y: number, z: number) => s.getBlockPermutation({ x, y, z });
    assert(at(0, 1, 0)?.type.id === "minecraft:chest", `(0,1,0) is ${at(0, 1, 0)?.type.id}`);
    assert(at(2, 1, 0)?.type.id === "minecraft:mob_spawner", `(2,1,0) is ${at(2, 1, 0)?.type.id}`);
    const shrieker = at(4, 1, 0);
    assert(shrieker?.type.id === "minecraft:sculk_shrieker", `(4,1,0) is ${shrieker?.type.id}`);
    assert(shrieker.getState("can_summon") === true, "shrieker can_summon is not true");
    assert(at(2, 1, 2)?.getState("growth") === 7, "wheat growth is not 7");
    assert(s.getIsWaterlogged({ x: 0, y: 1, z: 2 }), "stairs at (0,1,2) are not waterlogged");
  });

  // 7. The disposable stage4-probe measurement box (src/structures/templates/
  //    probe_box.json). It ships only for the strf-p006 engine questions and
  //    leaves the release structure set at the end of stage 4.
  //
  //    getPackStructureIds() is logged for visibility but not asserted on: in
  //    this one-shot, player-less bds:check world it stays empty for every
  //    pack structure — including the long-standing andrew:probe — not just
  //    this one (confirmed by polling up to 100 ticks and by checking that
  //    the list holds zero entries at all, not merely missing this id). Left
  //    as a finding for whichever task teaches the harness to force a
  //    ticking area or a player; get(id) is the reliable proof here, same as
  //    the andrew:probe check above.
  //
  //    The oak door's block id is minecraft:wooden_door; "minecraft:oak_door"
  //    is not a block type on 1.26.51 (BlockTypes.get returns undefined), and
  //    the engine loads such a palette entry as a stateless unknown block.
  check("structure-probe-box", () => {
    console.warn(
      `[selftest] getPackStructureIds() = ${JSON.stringify(world.structureManager.getPackStructureIds())}`
    );
    const s = world.structureManager.get("andrew:probe_box");
    assert(s !== undefined, "andrew:probe_box is not a pack structure");
    assert(
      s.size.x === 9 && s.size.y === 5 && s.size.z === 7,
      `size is ${s.size.x}x${s.size.y}x${s.size.z}, expected 9x5x7`
    );
    const at = (x: number, y: number, z: number) => s.getBlockPermutation({ x, y, z });
    assert(at(2, 1, 1)?.type.id === "minecraft:chest", `(2,1,1) is ${at(2, 1, 1)?.type.id}`);
    assert(at(6, 1, 1)?.type.id === "minecraft:chest", `(6,1,1) is ${at(6, 1, 1)?.type.id}`);
    assert(at(4, 1, 3)?.type.id === "minecraft:mob_spawner", `(4,1,3) is ${at(4, 1, 3)?.type.id}`);
    const shrieker = at(4, 1, 5);
    assert(shrieker?.type.id === "minecraft:sculk_shrieker", `(4,1,5) is ${shrieker?.type.id}`);
    assert(shrieker.getState("can_summon") === true, "probe_box shrieker can_summon is not true");
    const lower = at(4, 1, 0);
    const upper = at(4, 2, 0);
    assert(lower?.type.id === "minecraft:wooden_door", `(4,1,0) is ${lower?.type.id}`);
    assert(upper?.type.id === "minecraft:wooden_door", `(4,2,0) is ${upper?.type.id}`);
    assert(lower.getState("upper_block_bit") === false, `lower door half: ${JSON.stringify(lower.getAllStates())}`);
    assert(upper.getState("upper_block_bit") === true, `upper door half: ${JSON.stringify(upper.getAllStates())}`);
    assert(
      at(2, 1, 5)?.type.id === "minecraft:stone_brick_stairs",
      `(2,1,5) is ${at(2, 1, 5)?.type.id}`
    );
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

}

world.afterEvents.worldLoad.subscribe(() => {
  run();
  // DONE goes last: bds:check waits for it, so it must follow the async probes.
  void runChunkProbes().finally(() => console.warn(`[selftest] DONE passed=${passed} failed=${failed}`));
});
