// Orbital §4 / AC-2 on a real engine: a vanilla /give to a Survival player
// leaves the world's one craft alone, and a real recipe craft afterwards still
// claims it — no refund. A second real craft is refunded.
//
// A SimulatedPlayer cannot operate a crafting grid; a Crafter block can. It
// runs the shipped recipe JSON itself and ejects the result at the player, who
// picks it up — the recipe's own output reaching an inventory, not a script
// insert of it.

import { BlockPermutation, type Container, Difficulty, type Entity, GameMode, ItemStack, type Player, type Vector3, world } from "@minecraft/server";
import { type SimulatedPlayer, type Test, register, registerAsync } from "@minecraft/server-gametest";
import {
  DRAGON_KATANA,
  type LegendaryDef,
  ORBITAL_CANNON,
  SCULK_CROSSBOW,
  SCYTHE_OF_CALAMITY,
  STORM_BLADE,
  TRIDENT,
  WEB_SWORD,
  keysFor,
} from "../legendary/registry";
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
  [
    STORM_BLADE,
    [
      undefined, "minecraft:lightning_rod", undefined,
      "minecraft:wind_charge", "minecraft:diamond_sword", "minecraft:wind_charge",
      undefined, "minecraft:lightning_rod", undefined,
    ],
  ],
  [
    TRIDENT,
    [
      undefined, "minecraft:golden_apple", undefined,
      "minecraft:water_bucket", "minecraft:trident", "minecraft:water_bucket",
      undefined, "minecraft:golden_apple", undefined,
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
giveThenCraft("storm_blade", STORM_BLADE);
giveThenCraft("trident", TRIDENT);

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

// Storm Blade is def #6. Crafting it must not touch the other five defs'
// world-level craft flags, which live under their own prefixes but share the
// same gate code (AC#4).
register("andrew", "legendary_storm_blade_other_flags_untouched", (test: Test): void => {
  const others = [WEB_SWORD, SCYTHE_OF_CALAMITY, ORBITAL_CANNON, DRAGON_KATANA, SCULK_CROSSBOW];
  for (const def of [...others, STORM_BLADE]) {
    state.resetCrafted(def);
  }
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "cg_sb_flags", GameMode.Survival);
  let arrivedBefore: number | undefined;

  test.runAfterDelay(4, () => {
    arrivedBefore = arrivalsOf(STORM_BLADE, player);
    craftWithCrafter(test, STORM_BLADE);
  });

  test.succeedWhen(() => {
    test.assert(arrivedBefore !== undefined, "the crafter has not been run yet");
    test.assert(
      arrivalsOf(STORM_BLADE, player) > (arrivedBefore ?? 0),
      `no ${STORM_BLADE.craftTokenId} from the crafter has reached ${player.name} yet`
    );
    test.assert(state.isCrafted(STORM_BLADE), "the Storm Blade craft did not claim its own flag");
    for (const def of others) {
      test.assert(!state.isCrafted(def), `${def.itemId}'s craft flag changed after crafting the Storm Blade`);
    }
    console.warn("[gametest] storm blade craft left the other five legendaries' flags untouched");
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// The Above-Water Trident is def #7. Crafting it must not touch the other six
// defs' world-level craft flags (AC#5).
register("andrew", "legendary_trident_other_flags_untouched", (test: Test): void => {
  const others = [WEB_SWORD, SCYTHE_OF_CALAMITY, ORBITAL_CANNON, DRAGON_KATANA, SCULK_CROSSBOW, STORM_BLADE];
  for (const def of [...others, TRIDENT]) {
    state.resetCrafted(def);
  }
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "cg_tr_flags", GameMode.Survival);
  let arrivedBefore: number | undefined;

  test.runAfterDelay(4, () => {
    arrivedBefore = arrivalsOf(TRIDENT, player);
    craftWithCrafter(test, TRIDENT);
  });

  test.succeedWhen(() => {
    test.assert(arrivedBefore !== undefined, "the crafter has not been run yet");
    test.assert(
      arrivalsOf(TRIDENT, player) > (arrivedBefore ?? 0),
      `no ${TRIDENT.craftTokenId} from the crafter has reached ${player.name} yet`
    );
    test.assert(state.isCrafted(TRIDENT), "the Trident craft did not claim its own flag");
    for (const def of others) {
      test.assert(!state.isCrafted(def), `${def.itemId}'s craft flag changed after crafting the Trident`);
    }
    console.warn("[gametest] trident craft left the other six legendaries' flags untouched");
  });
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ---------------------------------------------------------------- the Trident's buckets (L0-trdt-a001)
//
// An add-on recipe hands no container back: the 2 water buckets are gone when
// the token appears (docs/feedback/probe-trident.md §1). The gate gives the 2
// empty buckets with a craft it keeps and the 2 water buckets with one it
// refunds, never both kinds (C-34). Every count below is the inventory plus the
// item entities around the stand, so a bucket dropped at the feet counts and a
// duplicate cannot hide on the ground.

const BUCKET = "minecraft:bucket";
const WATER_BUCKET = "minecraft:water_bucket";
/** Covers the stand, the crafter's ejection and a drop at the feet. */
const GROUND_RADIUS = 8;
/** The crafter's output reaches a player within a few ticks; this is the ceiling. */
const ARRIVAL_TICKS = 100;

function countIn(container: Container, typeId: string): number {
  let n = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack?.typeId === typeId) n += stack.amount;
  }
  return n;
}

function groundStacks(test: Test): ItemStack[] {
  return test
    .getDimension()
    .getEntities({ type: "minecraft:item", location: test.worldLocation(STAND), maxDistance: GROUND_RADIUS })
    .flatMap((e) => {
      const stack = e.isValid ? e.getComponent("minecraft:item")?.itemStack : undefined;
      return stack === undefined ? [] : [stack];
    });
}

function onGround(test: Test, typeId: string): number {
  return groundStacks(test)
    .filter((stack) => stack.typeId === typeId)
    .reduce((n, stack) => n + stack.amount, 0);
}

interface Tally {
  inv: number;
  ground: number;
}

function tally(test: Test, player: Player, typeId: string): Tally {
  return { inv: countIn(inventoryOf(player), typeId), ground: onGround(test, typeId) };
}

const sum = (t: Tally): number => t.inv + t.ground;
const show = (name: string, t: Tally): string => `${name} ${t.inv}+${t.ground}`;

async function waitFor(test: Test, ticks: number, done: () => boolean, why: string): Promise<void> {
  for (let tick = 0; tick < ticks; tick++) {
    if (done()) return;
    await test.idle(1);
  }
  test.assert(done(), why);
}

/** Runs the crafter once and waits for its token to reach `player`, then past the gate. */
async function craftAndSettle(test: Test, player: Player): Promise<void> {
  const before = arrivalsOf(TRIDENT, player);
  craftWithCrafter(test, TRIDENT);
  await waitFor(test, ARRIVAL_TICKS, () => arrivalsOf(TRIDENT, player) > before, `no ${TRIDENT.craftTokenId} reached ${player.name}`);
  await test.idle(SETTLE_TICKS);
}

registerAsync("andrew", "trident_craft_two_empty_buckets", async (test: Test): Promise<void> => {
  state.resetCrafted(TRIDENT);
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "tr_craft", GameMode.Survival);
  await test.idle(4);
  await craftAndSettle(test, player);

  const held = holdings(TRIDENT, player);
  const empty = tally(test, player, BUCKET);
  const water = tally(test, player, WATER_BUCKET);
  const tokens = held.tokens + onGround(test, TRIDENT.craftTokenId);
  console.warn(
    `[gametest] trident craft RESULT flag=${state.isCrafted(TRIDENT)} by=${String(world.getDynamicProperty(keysFor(TRIDENT).craftedBy))} ` +
      `${describe(held)} ${show("empty", empty)} ${show("water", water)} tokens=${tokens}`
  );
  test.assert(state.isCrafted(TRIDENT), "the craft did not claim the world's craft");
  test.assert(world.getDynamicProperty(keysFor(TRIDENT).craftedBy) === player.name, "the flag does not name the crafter");
  test.assert(held.crafted === 1 && held.plain === 0 && held.other === 0, `expected one Trident marked "craft": ${describe(held)}`);
  test.assert(tokens === 0, `${tokens} craft token(s) left`);
  test.assert(sum(empty) === 2, `expected exactly 2 empty buckets back, got ${show("empty", empty)}`);
  test.assert(sum(water) === 0, `a kept craft also got water buckets: ${show("water", water)}`);
  test.assert(held.refund === 0, `ingredients were handed back for a kept craft: ${describe(held)}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

registerAsync("andrew", "trident_craft_full_inventory", async (test: Test): Promise<void> => {
  state.resetCrafted(TRIDENT);
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "tr_full", GameMode.Survival);
  await test.idle(4);
  const container = inventoryOf(player);
  for (let slot = 0; slot < container.size; slot++) container.setItem(slot, new ItemStack("minecraft:dirt", 64));
  await test.idle(2);

  // Every slot full: the ejected token stays on the ground, and the gate never sees it.
  craftWithCrafter(test, TRIDENT);
  await waitFor(test, ARRIVAL_TICKS, () => onGround(test, TRIDENT.craftTokenId) === 1, "the crafter's token never reached the ground");
  await test.idle(SETTLE_TICKS);
  const waiting = { held: holdings(TRIDENT, player), token: onGround(test, TRIDENT.craftTokenId), empty: tally(test, player, BUCKET), water: tally(test, player, WATER_BUCKET) };
  console.warn(
    `[gametest] trident full inventory RESULT before room: flag=${state.isCrafted(TRIDENT)} token on the ground ${waiting.token} ` +
      `${describe(waiting.held)} ${show("empty", waiting.empty)} ${show("water", waiting.water)}`
  );
  test.assert(waiting.token === 1, `the token is not lying on the ground: ${waiting.token}`);
  test.assert(!state.isCrafted(TRIDENT), "a token nobody picked up claimed the craft");
  test.assert(waiting.held.crafted + waiting.held.plain + waiting.held.tokens === 0, `something reached the full inventory: ${describe(waiting.held)}`);
  test.assert(sum(waiting.empty) + sum(waiting.water) === 0, "buckets appeared before the craft was settled");

  // Room for exactly the token: the Trident takes that slot, so the 2 buckets have nowhere to go but the feet.
  const token = test
    .getDimension()
    .getEntities({ type: "minecraft:item", location: test.worldLocation(STAND), maxDistance: GROUND_RADIUS })
    .find((e) => e.getComponent("minecraft:item")?.itemStack.typeId === TRIDENT.craftTokenId);
  test.assert(token !== undefined, "the token entity is gone");
  container.setItem(container.size - 1, undefined);
  const before = arrivalsOf(TRIDENT, player);
  player.teleport((token as Entity).location);
  await waitFor(test, ARRIVAL_TICKS, () => arrivalsOf(TRIDENT, player) > before, "the token was never picked up into the freed slot");
  await test.idle(SETTLE_TICKS);

  const held = holdings(TRIDENT, player);
  const empty = tally(test, player, BUCKET);
  const water = tally(test, player, WATER_BUCKET);
  const tokens = held.tokens + onGround(test, TRIDENT.craftTokenId);
  console.warn(
    `[gametest] trident full inventory RESULT after room: flag=${state.isCrafted(TRIDENT)} ${describe(held)} ` +
      `${show("empty", empty)} ${show("water", water)} tokens=${tokens} dirt=${countIn(container, "minecraft:dirt")}`
  );
  test.assert(state.isCrafted(TRIDENT), "the picked-up token did not claim the craft");
  test.assert(held.crafted === 1, `the Trident is lost: ${describe(held)}`);
  test.assert(tokens === 0, `${tokens} craft token(s) left`);
  test.assert(sum(empty) === 2, `buckets in the inventory plus on the ground: ${show("empty", empty)}, expected 2`);
  test.assert(empty.ground === 2, `the full inventory took a bucket: ${show("empty", empty)}`);
  test.assert(sum(water) === 0, `water buckets appeared: ${show("water", water)}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// The pair runs across a server restart (RESTART_AFTER in scripts/bds-gametest.mjs):
// the seed spends the craft, the check crafts again on the reloaded world.
const RESTART_CRAFTER = "tr_seed";

registerAsync("andrew", "trident_blocked_restart_seed", async (test: Test): Promise<void> => {
  state.resetCrafted(TRIDENT);
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, RESTART_CRAFTER, GameMode.Survival);
  await test.idle(4);
  await craftAndSettle(test, player);

  const held = holdings(TRIDENT, player);
  console.warn(`[gametest] trident restart seed RESULT flag=${state.isCrafted(TRIDENT)} ${describe(held)} — the server restarts next`);
  test.assert(state.isCrafted(TRIDENT), "the seed craft did not claim the world's craft");
  test.assert(held.crafted === 1, `the seed craft gave no marked Trident: ${describe(held)}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

registerAsync("andrew", "trident_blocked_restart_check", async (test: Test): Promise<void> => {
  const by = world.getDynamicProperty(keysFor(TRIDENT).craftedBy);
  console.warn(`[gametest] trident restart check: after the restart flag=${state.isCrafted(TRIDENT)} by=${String(by)}`);
  test.assert(state.isCrafted(TRIDENT), "the craft flag did not survive the restart");
  test.assert(by === RESTART_CRAFTER, `the flag names ${String(by)}, not the seed's crafter`);

  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "tr_again", GameMode.Survival);
  await test.idle(4);
  await craftAndSettle(test, player);

  const held = holdings(TRIDENT, player);
  const apples = tally(test, player, "minecraft:golden_apple");
  const tridents = tally(test, player, "minecraft:trident");
  const empty = tally(test, player, BUCKET);
  const water = tally(test, player, WATER_BUCKET);
  const tokens = held.tokens + onGround(test, TRIDENT.craftTokenId);
  console.warn(
    `[gametest] trident restart check RESULT flag=${state.isCrafted(TRIDENT)} ${describe(held)} ` +
      `${show("apples", apples)} ${show("tridents", tridents)} ${show("water", water)} ${show("empty", empty)} tokens=${tokens}`
  );
  test.assert(held.crafted + held.plain + held.other === 0, `a blocked craft yielded a Trident: ${describe(held)}`);
  test.assert(tokens === 0, `${tokens} craft token(s) left`);
  test.assert(apples.inv === 2 && apples.ground === 0, `golden apples back: ${show("apples", apples)}, expected 2+0`);
  test.assert(tridents.inv === 1 && tridents.ground === 0, `vanilla tridents back: ${show("tridents", tridents)}, expected 1+0`);
  test.assert(water.inv === 2 && water.ground === 0, `water buckets back: ${show("water", water)}, expected 2+0`);
  test.assert(sum(empty) === 0, `empty buckets as well as water ones: ${show("empty", empty)}`);
  test.assert(world.getDynamicProperty(keysFor(TRIDENT).craftedBy) === RESTART_CRAFTER, "the blocked craft re-claimed the flag");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// A Creative copy, a /give and an admin copy are plain or admin-marked weapon
// stacks, and the gate acts on tokens only; a Creative player's token is
// unwrapped. None of them may touch the flag. /andrew:trident is the release
// pack's command, and only its reset can be driven from here: its give cannot
// resolve a SimulatedPlayer (C-2), so the admin copy is stamped the way give
// stamps it.
registerAsync("andrew", "trident_creative_and_commands_spend_nothing", async (test: Test): Promise<void> => {
  state.resetCrafted(TRIDENT);
  const dim = test.getDimension();
  const builder = test.spawnSimulatedPlayer(STAND, "tr_builder", GameMode.Creative);
  const tester = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 1 }, "tr_tester", GameMode.Survival);
  await test.idle(4);

  for (const player of [builder, tester]) {
    const given = dim.runCommand(`give "${player.name}" ${TRIDENT.itemId} 1`).successCount;
    test.assert(given === 1, `/give to ${player.name} reported successCount ${given}`);
  }
  inventoryOf(tester).addItem(state.markItem(TRIDENT, new ItemStack(TRIDENT.itemId, 1), state.makeMark("admin", tester)));
  inventoryOf(builder).addItem(new ItemStack(TRIDENT.craftTokenId, 1));
  await test.idle(SETTLE_TICKS);

  // The Creative copy carried into Survival is still an ordinary copy.
  builder.setGameMode(GameMode.Survival);
  await test.idle(SETTLE_TICKS);

  const b = holdings(TRIDENT, builder);
  const t = holdings(TRIDENT, tester);
  const empty = tally(test, builder, BUCKET);
  console.warn(
    `[gametest] trident creative RESULT flag=${state.isCrafted(TRIDENT)} builder ${describe(b)} ${show("empty", empty)} tester ${describe(t)}`
  );
  test.assert(!state.isCrafted(TRIDENT), "a Creative copy, a /give or an admin copy spent the world's craft");
  test.assert(b.plain === 2 && b.crafted === 0 && b.tokens === 0, `builder: ${describe(b)}, expected the /give copy and the unwrapped token, both plain`);
  test.assert(sum(empty) === 2, `the unwrapped Creative craft got ${show("empty", empty)} empty buckets, expected 2`);
  test.assert(t.plain === 1 && t.other === 1 && t.crafted === 0 && t.refund === 0, `tester: ${describe(t)}, expected one /give copy and one admin copy, untouched`);

  // def #7's operator command is registered: an unknown command throws. Its
  // reset lands in the release pack's own world properties — dynamic properties
  // are per pack — so this pack's flag cannot witness it.
  const reset = dim.runCommand(`${TRIDENT.command} reset`).successCount;
  console.warn(`[gametest] trident creative RESULT /${TRIDENT.command} reset successCount=${reset}`);
  test.assert(reset === 1, `/${TRIDENT.command} reset reported successCount ${reset}`);

  // What the engine does with one ItemStack above the max stack size, the
  // reason the gate splits its refund into stacks.
  const over = new ItemStack(WATER_BUCKET, 2);
  const before = countIn(inventoryOf(tester), WATER_BUCKET);
  const leftover = inventoryOf(tester).addItem(over);
  console.warn(
    `[gametest] trident creative RESULT ItemStack(${WATER_BUCKET}, 2): amount=${over.amount} maxAmount=${over.maxAmount}; ` +
      `addItem stored ${countIn(inventoryOf(tester), WATER_BUCKET) - before}, leftover ${leftover?.amount ?? "none"}`
  );
  test.succeed();
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

// AC#5: the Storm Blade has no minecraft:durability — infinite durability by
// omission, like every other legendary. Unlike the Sculk Crossbow (a ranged
// weapon fired by holding Use), its wear path is a landed melee hit, so the
// held copy is swung at a zombie instead.
const STORM_ZOMBIE_CELL: Vector3 = { x: 3, y: 2, z: 3 };
/** Past the 10-tick hurt immunity, so every swing lands in full. */
const STORM_HIT_SPACING_TICKS = 20;

registerAsync("andrew", "storm_blade_no_durability", async (test: Test): Promise<void> => {
  const bare = new ItemStack(STORM_BLADE.itemId, 1);
  test.assert(
    bare.getComponent("minecraft:durability") === undefined,
    `${STORM_BLADE.itemId} has minecraft:durability — it would wear out`
  );

  const difficulty = world.getDifficulty();
  const leftovers: Entity[] = [];
  try {
    // A zombie is deleted on Peaceful, where the checks world runs.
    world.setDifficulty(Difficulty.Easy);
    const player = test.spawnSimulatedPlayer(STAND, "sb_durability", GameMode.Survival);
    await test.idle(4);
    const container = inventoryOf(player);
    container.setItem(0, new ItemStack(STORM_BLADE.itemId, 1));
    player.selectedSlotIndex = 0;

    const zombie = test.spawnWithoutBehaviors("minecraft:zombie", STORM_ZOMBIE_CELL);
    leftovers.push(zombie);

    for (let hit = 0; hit < 3; hit++) {
      zombie.teleport(
        test.worldLocation({ x: STORM_ZOMBIE_CELL.x + 0.5, y: STORM_ZOMBIE_CELL.y, z: STORM_ZOMBIE_CELL.z + 0.5 })
      );
      zombie.clearVelocity();
      zombie.getComponent("minecraft:health")?.resetToMaxValue();
      await test.idle(STORM_HIT_SPACING_TICKS);
      test.assert(player.attackEntity(zombie), `swing ${hit} did not reach the zombie`);
      await test.idle(2);
    }

    const held = container.getItem(0);
    test.assert(held?.typeId === STORM_BLADE.itemId, `the Storm Blade left slot 0 after melee hits: ${held?.typeId}`);
    test.assert(
      held?.getComponent("minecraft:durability") === undefined,
      "the held Storm Blade gained a durability component after melee hits"
    );
    console.warn("[gametest] storm blade: no durability component before or after melee hits");
    test.succeed();
  } finally {
    world.setDifficulty(difficulty);
    for (const entity of leftovers) if (entity.isValid) entity.remove();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");
