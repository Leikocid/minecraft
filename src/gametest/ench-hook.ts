// The §4 hook on the live engine (src/enchanting/hook.ts, option a′). A SimulatedPlayer opens neither the enchanting
// table nor the anvil — measured, and the reason the whole feature cannot be driven end to end on BDS — so the
// scenarios feed exactly the two signals the hook works from and nothing else: an enchanted stack arriving in the
// inventory, and `player.level` dropping. The real table is Andrey's to check, on the iPad sheet.
//
// Each scenario arms its OWN copy with a fixed source of randomness, so what is asserted is the hook's decision and
// not a 20 % coin. The release pack's copy is armed too in this world and cannot interfere: it reads a SimulatedPlayer
// as an unusable entry, exactly as the craft gate and the rocket rewrite do.

import { EnchantmentType, EntityComponentTypes, GameMode, ItemStack, type Player, type Vector3 } from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { MATCH_WINDOW_TICKS } from "../enchanting/hook-rules";
import { enchStats, registerEnchantAdd } from "../enchanting/hook";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const PICKAXE = "minecraft:diamond_pickaxe";
const TREASURE = ["mending", "frost_walker", "soul_speed", "swift_sneak", "wind_burst"];

const log = (msg: string): void => console.warn(`[gametest] ench-hook ${msg}`);

function inventoryOf(player: Player) {
  const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
  if (container === undefined) throw new Error(`${player.name} has no inventory container`);
  return container;
}

/** A pickaxe the table might have just handed back: two ordinary enchantments, no treasure, no mark. */
function enchantedPickaxe(): ItemStack {
  const stack = new ItemStack(PICKAXE, 1);
  const enchantable = stack.getComponent("minecraft:enchantable");
  if (enchantable === undefined) throw new Error("diamond pickaxe reads no enchantable component");
  for (const [id, level] of [["efficiency", 4], ["unbreaking", 2]] as const) {
    enchantable.addEnchantment({ type: new EnchantmentType(id), level });
  }
  return stack;
}

function listOf(player: Player, slot: number): { ids: string[]; levels: Record<string, number> } {
  const stack = inventoryOf(player).getItem(slot);
  const list = stack?.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
  const levels: Record<string, number> = {};
  for (const e of list) levels[e.type.id] = e.level;
  return { ids: list.map((e) => e.type.id).sort(), levels };
}

/** Puts the stack in slot 0 through addItem, which raises the arrival event the hook listens to. */
function deliver(player: SimulatedPlayer, stack: ItemStack): void {
  const container = inventoryOf(player);
  container.setItem(0, undefined);
  container.addItem(stack);
}

function spend(player: SimulatedPlayer, levels: number): void {
  player.runCommand(`xp -${levels}L`);
}

function reset(): void {
  for (const key of Object.keys(enchStats) as (keyof typeof enchStats)[]) enchStats[key] = 0;
}

// ---------------------------------------------------------------- AC#4: added on top, nothing lost

registerAsync("andrew", "ench_add_rare_on_top", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(STAND, "ench_top", GameMode.Survival);
  await test.idle(4);
  reset();
  // Zero from the source makes the rare stage hit every time: what is judged here is the decision, not the coin.
  const stop = registerEnchantAdd({ rng: () => 0 });
  try {
    player.runCommand("xp 300L");
    await test.idle(4);
    deliver(player, enchantedPickaxe());
    await test.idle(2);
    spend(player, 3);
    // Past one poll of the hook (5 ticks) with room for the engine's own delay.
    await test.idle(20);

    const after = listOf(player, 0);
    log(`on top: ids=[${after.ids.join(",")}] levels=${JSON.stringify(after.levels)} stats=${JSON.stringify(enchStats)}`);
    test.assert(enchStats.generations === 1, `the two signals made ${enchStats.generations} generation(s), not 1`);
    test.assert(after.levels.efficiency === 4, `Efficiency came out at ${String(after.levels.efficiency)}, not 4`);
    test.assert(after.levels.unbreaking === 2, `Unbreaking came out at ${String(after.levels.unbreaking)}, not 2`);
    const extra = after.ids.filter((id) => id !== "efficiency" && id !== "unbreaking");
    test.assert(extra.length === 1, `expected exactly one addition, got [${extra.join(",")}]`);
    test.assert(TREASURE.includes(extra[0]), `${extra[0]} is not a treasure enchantment`);
    test.assert(enchStats.added === 1, `added=${enchStats.added}`);
    log("RESULT one treasure added on top; both of the table's own enchantments came through at their own levels");
    test.succeed();
  } finally {
    stop();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ---------------------------------------------------------------- AC#5: the three refusals

registerAsync("andrew", "ench_add_negative_controls", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(STAND, "ench_neg", GameMode.Survival);
  await test.idle(4);
  reset();
  const stop = registerEnchantAdd({ rng: () => 0 });
  try {
    player.runCommand("xp 300L");
    await test.idle(4);

    // 1. the stack arrives and no levels go
    deliver(player, enchantedPickaxe());
    await test.idle(20);
    test.assert(enchStats.generations === 0, "an arrival with no level drop was taken for a generation");
    const quiet = listOf(player, 0);
    test.assert(quiet.ids.length === 2, `an untouched arrival gained ${quiet.ids.join(",")}`);

    // 2. the levels go with the only arrival already outside the pairing window
    await test.idle(MATCH_WINDOW_TICKS + 10);
    spend(player, 2);
    await test.idle(20);
    test.assert(enchStats.generations === 0, "a drop paired with an arrival outside the window");

    // 3. an anvil-sized cost, with a fresh arrival right beside it
    deliver(player, enchantedPickaxe());
    await test.idle(2);
    spend(player, 9);
    await test.idle(20);
    test.assert(enchStats.generations === 0, "a 9-level cost was taken for a table offer");

    // 4. a real generation, and then the same stack moved with another drop
    deliver(player, enchantedPickaxe());
    await test.idle(2);
    spend(player, 3);
    await test.idle(20);
    test.assert(enchStats.generations === 1, `the real generation did not land: ${JSON.stringify(enchStats)}`);
    const once = listOf(player, 0);
    const container = inventoryOf(player);
    const marked = container.getItem(0);
    container.setItem(0, undefined);
    if (marked !== undefined) container.setItem(1, marked);
    await test.idle(2);
    spend(player, 3);
    await test.idle(20);
    test.assert(enchStats.generations === 1, "the marked stack bought a second generation by moving");
    const twice = listOf(player, 1);
    log(`controls: once=[${once.ids.join(",")}] twice=[${twice.ids.join(",")}] stats=${JSON.stringify(enchStats)}`);
    test.assert(twice.ids.join(",") === once.ids.join(","), `the moved stack changed: [${once.ids.join(",")}] -> [${twice.ids.join(",")}]`);
    log("RESULT an arrival alone, a drop with no arrival in the window, an anvil-sized cost and a marked stack all add nothing");
    test.succeed();
  } finally {
    stop();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");
