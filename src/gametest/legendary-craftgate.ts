// Orbital §4 / AC-2 on a real engine: a vanilla /give to a Survival player
// leaves the world's one craft alone, and a real recipe craft afterwards still
// claims it — no refund. A second real craft is refunded.
//
// A SimulatedPlayer cannot operate a crafting grid; a Crafter block can. It
// runs the shipped recipe JSON itself and ejects the result at the player, who
// picks it up — the recipe's own output reaching an inventory, not a script
// insert of it.

import { BlockPermutation, type Container, GameMode, ItemStack, type Player, type Vector3, world } from "@minecraft/server";
import { type SimulatedPlayer, type Test, register, registerAsync } from "@minecraft/server-gametest";
import { DRAGON_KATANA, type LegendaryDef, ORBITAL_CANNON, SCULK_CROSSBOW, SCYTHE_OF_CALAMITY, WEB_SWORD } from "../legendary/registry";
import * as state from "../legendary/state";

/** Must match the structure written by scripts/bds-gametest.mjs. */
const STRUCTURE = "andrew:platform";

// Structure-relative. The crafter's front faces south (+z), straight at the
// player one block away; the redstone pulse comes from its west side.
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const CRAFTER: Vector3 = { x: 3, y: 2, z: 4 };
const POWER: Vector3 = { x: 2, y: 2, z: 4 };

/** Past the gate's one-tick flush, with room for the engine's own event delay. */
const SETTLE_TICKS = 20;

/** Each recipe's 3×3 pattern, row by row — the crafter's slots 0–8. */
const GRIDS = new Map<LegendaryDef, ReadonlyArray<string | undefined>>([
  [
    WEB_SWORD,
    [
      undefined, "minecraft:web", undefined,
      "minecraft:web", "minecraft:diamond_sword", "minecraft:web",
      undefined, "minecraft:web", undefined,
    ],
  ],
  [
    SCYTHE_OF_CALAMITY,
    [
      undefined, "minecraft:golden_apple", undefined,
      "minecraft:obsidian", "minecraft:diamond_hoe", "minecraft:obsidian",
      undefined, "minecraft:golden_apple", undefined,
    ],
  ],
  [
    DRAGON_KATANA,
    [
      undefined, "minecraft:golden_apple", undefined,
      "minecraft:ender_pearl", "minecraft:diamond_sword", "minecraft:ender_pearl",
      undefined, "minecraft:golden_apple", undefined,
    ],
  ],
  [
    SCULK_CROSSBOW,
    [
      undefined, "minecraft:echo_shard", undefined,
      "minecraft:deepslate", "minecraft:crossbow", "minecraft:deepslate",
      undefined, "minecraft:echo_shard", undefined,
    ],
  ],
]);

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    throw new Error(`${player.name} has no inventory container`);
  }
  return container;
}

interface Holdings {
  crafted: number;
  plain: number;
  other: number;
  tokens: number;
  refund: number;
}

function holdings(def: LegendaryDef, player: Player): Holdings {
  const container = inventoryOf(player);
  const refundIds = new Set(def.refund.map(([id]) => id));
  const held: Holdings = { crafted: 0, plain: 0, other: 0, tokens: 0, refund: 0 };
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack === undefined) continue;
    if (stack.typeId === def.itemId) {
      const origin = state.getMark(def, stack)?.origin;
      if (origin === "craft") held.crafted += stack.amount;
      else if (origin === undefined) held.plain += stack.amount;
      else held.other += stack.amount;
    } else if (stack.typeId === def.craftTokenId) {
      held.tokens += stack.amount;
    } else if (refundIds.has(stack.typeId)) {
      held.refund += stack.amount;
    }
  }
  return held;
}

function describe(held: Holdings): string {
  return `crafted=${held.crafted} plain=${held.plain} other=${held.other} tokens=${held.tokens} refund=${held.refund}`;
}

/**
 * Craft tokens that reached each player's inventory. Nothing in these tests
 * inserts a token, so an arrival is the crafter's recipe output being picked
 * up. The ejected item raises no entitySpawn here (BDS 1.26.51.1), so the
 * inventory event — the one the gate itself listens to — is the witness.
 */
const tokenArrivals = new Map<string, number>();

world.afterEvents.playerInventoryItemChange.subscribe((event) => {
  const player: Player | undefined = event.player;
  const typeId = event.itemStack?.typeId;
  if (player === undefined || typeId === undefined || ![...GRIDS.keys()].some((def) => def.craftTokenId === typeId)) {
    return;
  }
  const key = `${player.name} ${typeId}`;
  tokenArrivals.set(key, (tokenArrivals.get(key) ?? 0) + 1);
  console.warn(`[gametest] craftgate token arrived: ${typeId} -> ${player.name} slot=${event.slot}`);
});

const arrivalsOf = (def: LegendaryDef, player: Player): number =>
  tokenArrivals.get(`${player.name} ${def.craftTokenId}`) ?? 0;

/** Placed ahead of loading: the block entity is not there on the tick the block is set. */
function placeCrafter(test: Test): void {
  test.setBlockPermutation(BlockPermutation.resolve("minecraft:crafter", { orientation: "south_up" }), CRAFTER);
}

/**
 * Load the recipe into the crafter and pulse it once: the engine crafts one
 * result. On BDS 1.26.51.1 the crafter has no minecraft:inventory component
 * for scripts, so its slots are filled the way an operator would.
 */
function craftWithCrafter(test: Test, def: LegendaryDef): void {
  const grid = GRIDS.get(def);
  if (grid === undefined) {
    throw new Error(`no crafter grid for ${def.itemId}`);
  }
  const at = test.worldBlockLocation(CRAFTER);
  grid.forEach((itemId, slot) => {
    if (itemId === undefined) return;
    const cmd = `replaceitem block ${at.x} ${at.y} ${at.z} slot.container ${slot} ${itemId} 1`;
    const ok = test.getDimension().runCommand(cmd).successCount;
    test.assert(ok > 0, `${cmd} failed`);
  });
  test.pulseRedstone(POWER, 2);
}

/**
 * Every one of the crafter's 9 slots, explicit: unlike `GRIDS`, `undefined`
 * here means "clear this slot" rather than "leave it alone" — negative
 * controls run one after another on the same crafter and must not inherit the
 * previous stage's ingredients.
 */
function loadFullGrid(test: Test, grid: ReadonlyArray<string | undefined>): void {
  const at = test.worldBlockLocation(CRAFTER);
  grid.forEach((itemId, slot) => {
    const cmd = `replaceitem block ${at.x} ${at.y} ${at.z} slot.container ${slot} ${itemId ?? "minecraft:air"} 1`;
    const ok = test.getDimension().runCommand(cmd).successCount;
    test.assert(ok > 0, `${cmd} failed`);
  });
}

function giveThenCraft(name: string, def: LegendaryDef): void {
  register("andrew", `legendary_give_then_craft_${name}`, (test: Test): void => {
    state.resetCrafted(def);
    placeCrafter(test);
    const player = test.spawnSimulatedPlayer(STAND, `cg_${name}`, GameMode.Survival);
    let arrivedBefore: number | undefined;

    // The player is not observable on the tick it is spawned.
    test.runAfterDelay(4, () => {
      // From a non-player origin, as the console or a command block would run it.
      const given = test.getDimension().runCommand(`give "${player.name}" ${def.itemId} 1`).successCount;
      test.assert(given === 1, `/give ${def.itemId} reported successCount ${given}`);

      // A negative claim, so it is checked once, well after the gate would have acted.
      test.runAfterDelay(SETTLE_TICKS, () => {
        const afterGive = holdings(def, player);
        console.warn(`[gametest] craftgate ${name} after /give: flag=${state.isCrafted(def)} ${describe(afterGive)}`);
        test.assert(!state.isCrafted(def), `a vanilla /give of ${def.itemId} to a Survival player spent the world's craft`);
        test.assert(afterGive.plain === 1 && afterGive.crafted === 0, `after /give: ${describe(afterGive)}, expected one plain copy`);
        test.assert(afterGive.refund === 0, `after /give: ingredients were handed out (${describe(afterGive)})`);

        arrivedBefore = arrivalsOf(def, player);
        craftWithCrafter(test, def);
      });
    });

    test.succeedWhen(() => {
      test.assert(arrivedBefore !== undefined, "the crafter has not been run yet");
      test.assert(
        arrivalsOf(def, player) > (arrivedBefore ?? 0),
        `no ${def.craftTokenId} from the crafter has reached ${player.name} yet`
      );
      const held = holdings(def, player);
      test.assert(held.refund === 0, `the real craft was refunded after a /give: ${describe(held)}`);
      test.assert(state.isCrafted(def), `the real craft did not claim the world's craft: ${describe(held)}`);
      test.assert(held.crafted === 1, `expected one crafted ${def.itemId}: ${describe(held)}`);
      test.assert(held.plain === 1, `the /give copy did not survive the craft: ${describe(held)}`);
      test.assert(held.tokens === 0, `a craft token was left in the inventory: ${describe(held)}`);
      console.warn(`[gametest] craftgate ${name} after craft: flag=true ${describe(held)}`);
    });
  })
    .structureName(STRUCTURE)
    .maxTicks(400)
    .tag("andrew");
}

giveThenCraft("web_sword", WEB_SWORD);
giveThenCraft("scythe", SCYTHE_OF_CALAMITY);
giveThenCraft("dragon_katana", DRAGON_KATANA);
giveThenCraft("sculk_crossbow", SCULK_CROSSBOW);

// The Sculk Crossbow is def #5, with its own `sk` key namespace (CNTR-LGND-
// CX15-AA). Crafting it must not touch the other four defs' world-level craft
// flags, which live under their own prefixes but share the same gate code.
register("andrew", "legendary_sculk_crossbow_other_flags_untouched", (test: Test): void => {
  const others = [WEB_SWORD, SCYTHE_OF_CALAMITY, ORBITAL_CANNON, DRAGON_KATANA];
  for (const def of [...others, SCULK_CROSSBOW]) {
    state.resetCrafted(def);
  }
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "cg_sk_flags", GameMode.Survival);
  let arrivedBefore: number | undefined;

  test.runAfterDelay(4, () => {
    arrivedBefore = arrivalsOf(SCULK_CROSSBOW, player);
    craftWithCrafter(test, SCULK_CROSSBOW);
  });

  test.succeedWhen(() => {
    test.assert(arrivedBefore !== undefined, "the crafter has not been run yet");
    test.assert(
      arrivalsOf(SCULK_CROSSBOW, player) > (arrivedBefore ?? 0),
      `no ${SCULK_CROSSBOW.craftTokenId} from the crafter has reached ${player.name} yet`
    );
    test.assert(state.isCrafted(SCULK_CROSSBOW), "the crossbow craft did not claim its own flag");
    for (const def of others) {
      test.assert(!state.isCrafted(def), `${def.itemId}'s craft flag changed after crafting the Sculk Crossbow`);
    }
    console.warn("[gametest] sculk crossbow craft left the other four legendaries' flags untouched");
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// The fix must not open the gate: a second real craft is still refunded.
register("andrew", "legendary_second_real_craft_refunded", (test: Test): void => {
  state.resetCrafted(WEB_SWORD);
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "cg_twice", GameMode.Survival);
  let stage: "first" | "second" = "first";
  let arrivedBefore = Number.POSITIVE_INFINITY;

  test.runAfterDelay(4, () => craftWithCrafter(test, WEB_SWORD));

  test.succeedWhen(() => {
    const held = holdings(WEB_SWORD, player);
    if (stage === "first") {
      test.assert(held.crafted === 1 && state.isCrafted(WEB_SWORD), `first craft not claimed yet: ${describe(held)}`);
      stage = "second";
      arrivedBefore = arrivalsOf(WEB_SWORD, player);
      craftWithCrafter(test, WEB_SWORD);
      test.assert(false, "first craft claimed; waiting for the second");
    }
    test.assert(arrivalsOf(WEB_SWORD, player) > arrivedBefore, "the second token from the crafter has not arrived yet");
    const wanted = WEB_SWORD.refund.reduce((n, [, count]) => n + count, 0);
    test.assert(held.refund === wanted, `second craft: ${describe(held)}, expected refund=${wanted}`);
    test.assert(held.crafted === 1, `second craft: ${describe(held)}, expected the one crafted sword only`);
    test.assert(held.plain === 0 && held.tokens === 0, `second craft left a weapon or token: ${describe(held)}`);
    console.warn(`[gametest] craftgate second craft: flag=${state.isCrafted(WEB_SWORD)} ${describe(held)}`);
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// AC#5: the Sculk Crossbow has no minecraft:durability — infinite durability by
// omission, like every other legendary — and firing it does not grow one.
// max_draw_duration is 1.25 s = 25 ticks (L0-sclk-ent1): a press, a hold past
// that, a release and a second press fire the loaded shot (measured CX-sclk-02).
const DRAW_TICKS = 26;

/**
 * A use right after a one-tick use returns false and starts nothing (measured
 * CX-sclk-02); a retry a few ticks later starts it.
 */
async function startDraw(test: Test, player: SimulatedPlayer, slot: number): Promise<void> {
  for (let attempt = 1; attempt <= 20; attempt++) {
    if (player.useItemInSlot(slot)) return;
    await test.idle(1);
  }
  test.assert(false, `the draw never started after 20 attempts`);
}

registerAsync("andrew", "sculk_crossbow_no_durability", async (test: Test): Promise<void> => {
  const bare = new ItemStack(SCULK_CROSSBOW.itemId, 1);
  test.assert(
    bare.getComponent("minecraft:durability") === undefined,
    `${SCULK_CROSSBOW.itemId} has minecraft:durability — it would wear out`
  );

  const player = test.spawnSimulatedPlayer(STAND, "sk_durability", GameMode.Survival);
  await test.idle(4);
  const container = inventoryOf(player);
  container.setItem(0, new ItemStack(SCULK_CROSSBOW.itemId, 1));
  container.setItem(1, new ItemStack("minecraft:arrow", 64));
  player.selectedSlotIndex = 0;

  for (let shot = 0; shot < 3; shot++) {
    await startDraw(test, player, 0);
    await test.idle(DRAW_TICKS);
    player.stopUsingItem();
    await test.idle(1);
    await startDraw(test, player, 0);
    await test.idle(4);
  }

  const held = container.getItem(0);
  test.assert(held?.typeId === SCULK_CROSSBOW.itemId, `the Sculk Crossbow left slot 0 after firing: ${held?.typeId}`);
  test.assert(
    held?.getComponent("minecraft:durability") === undefined,
    "the held Sculk Crossbow gained a durability component after firing"
  );
  console.warn("[gametest] sculk crossbow: no durability component before or after firing");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// AC-katn-01 negative controls: an iron sword at the centre, an enchanted
// golden apple instead of a plain one, and a shifted layout must not match the
// Katana recipe — none of them may eject a token or claim the world's craft.
register("andrew", "legendary_katana_recipe_negative_controls", (test: Test): void => {
  state.resetCrafted(DRAGON_KATANA);
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "cg_katana_neg", GameMode.Survival);

  const IRON_SWORD_CENTRE: ReadonlyArray<string | undefined> = [
    undefined, "minecraft:golden_apple", undefined,
    "minecraft:ender_pearl", "minecraft:iron_sword", "minecraft:ender_pearl",
    undefined, "minecraft:golden_apple", undefined,
  ];
  const ENCHANTED_APPLE: ReadonlyArray<string | undefined> = [
    undefined, "minecraft:enchanted_golden_apple", undefined,
    "minecraft:ender_pearl", "minecraft:diamond_sword", "minecraft:ender_pearl",
    undefined, "minecraft:enchanted_golden_apple", undefined,
  ];
  // Shifted one column right: the shape no longer lines up with the recipe's
  // exact 3x3 fit, and the row-1 pearl that would land in column 3 is lost off
  // the grid entirely.
  const SHIFTED_LAYOUT: ReadonlyArray<string | undefined> = [
    undefined, undefined, "minecraft:golden_apple",
    undefined, "minecraft:ender_pearl", "minecraft:diamond_sword",
    undefined, undefined, "minecraft:golden_apple",
  ];

  function pulse(label: string, grid: ReadonlyArray<string | undefined>): void {
    loadFullGrid(test, grid);
    test.pulseRedstone(POWER, 2);
    console.warn(`[gametest] katana recipe negative control: ${label}`);
  }

  test.runAfterDelay(4, () => pulse("iron sword centre", IRON_SWORD_CENTRE));
  test.runAfterDelay(4 + SETTLE_TICKS, () => pulse("enchanted golden apple", ENCHANTED_APPLE));
  test.runAfterDelay(4 + 2 * SETTLE_TICKS, () => pulse("shifted layout", SHIFTED_LAYOUT));

  test.runAfterDelay(4 + 3 * SETTLE_TICKS, () => {
    const held = holdings(DRAGON_KATANA, player);
    test.assert(arrivalsOf(DRAGON_KATANA, player) === 0, "a negative-control layout produced a Dragon Katana token");
    test.assert(held.crafted === 0 && held.tokens === 0, `a negative control crafted something: ${describe(held)}`);
    test.assert(!state.isCrafted(DRAGON_KATANA), "a negative control claimed the world's craft budget");
    console.warn(`[gametest] katana recipe negative controls: none matched, ${describe(held)}`);
    test.succeed();
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");
