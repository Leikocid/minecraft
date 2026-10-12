// spec v3 §2–§3, R-uwbw-004, ADR-uwbw-rc, ASM-L0-39/43: two additional vanilla
// recipes (Mace, Firework Rocket) beside the ones the engine already ships,
// written as plain `minecraft:recipe_shaped` data with no script and no token.
// Proven here, on the live engine: both new recipes coexist with their vanilla
// look-alikes, a fixed-position probe measures whether Bedrock trims the blank
// border of a full 3x3 pattern (xasm43), and the recipe's own rocket is timed on
// an Elytra against vanilla flight 1 and 3. That raw result carries no firework
// data; src/rocket-flight.ts turns it into flight 1 in a player's inventory
// (src/gametest/recipes-rocket.ts).

import {
  BlockPermutation,
  EntityComponentTypes,
  EquipmentSlot,
  GameMode,
  ItemComponentTypes,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const CRAFTER: Vector3 = { x: 3, y: 2, z: 4 };
const POWER: Vector3 = { x: 2, y: 2, z: 4 };
const SETTLE_TICKS = 20;
/** Well above the platform's own 5-tall footprint: open flat-world air, no chunk reload (same column). */
const ALOFT_Y = 2 + 60;

const log = (msg: string): void => console.warn(`[gametest] recipes-vanilla ${msg}`);
const f2 = (v: number): string => v.toFixed(2);

// ---------------------------------------------------------------- inventory

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

/** Moves the first stack of `typeId` found anywhere in the inventory into hotbar `slot`, replacing it there. */
function moveToSlot(player: Player, typeId: string, slot: number): ItemStack {
  const container = inventoryOf(player);
  for (let i = 0; i < container.size; i++) {
    const stack = container.getItem(i);
    if (stack?.typeId === typeId) {
      if (i !== slot) {
        container.setItem(i, undefined);
        container.setItem(slot, stack);
      }
      return stack;
    }
  }
  throw new Error(`no ${typeId} found in ${player.name}'s inventory`);
}

const arrivals = new Map<string, number>();
const TRACKED = ["minecraft:mace", "minecraft:firework_rocket"];

world.afterEvents.playerInventoryItemChange.subscribe((event) => {
  const player: Player | undefined = event.player;
  const typeId = event.itemStack?.typeId;
  if (player === undefined || typeId === undefined || !TRACKED.includes(typeId)) return;
  const key = `${player.name} ${typeId}`;
  arrivals.set(key, (arrivals.get(key) ?? 0) + 1);
});

const arrivalsOf = (player: Player, typeId: string): number => arrivals.get(`${player.name} ${typeId}`) ?? 0;

// ---------------------------------------------------------------- crafter

interface Cell {
  readonly item: string;
  readonly amount?: number;
}
/** Row-major, 9 slots; `undefined` is an empty slot. */
type Grid = ReadonlyArray<Cell | undefined>;

function placeCrafter(test: Test): void {
  test.setBlockPermutation(BlockPermutation.resolve("minecraft:crafter", { orientation: "south_up" }), CRAFTER);
}

/** Fills every one of the 9 crafter slots, blanks included, so no attempt leaks into the next. */
function loadGrid(test: Test, grid: Grid): void {
  const at = test.worldBlockLocation(CRAFTER);
  grid.forEach((cell, slot) => {
    const cmd = cell === undefined
      ? `replaceitem block ${at.x} ${at.y} ${at.z} slot.container ${slot} minecraft:air`
      : `replaceitem block ${at.x} ${at.y} ${at.z} slot.container ${slot} ${cell.item} ${cell.amount ?? 1}`;
    const ok = test.getDimension().runCommand(cmd).successCount;
    test.assert(ok > 0, `${cmd} failed`);
  });
}

async function craft(test: Test, grid: Grid, label: string): Promise<void> {
  loadGrid(test, grid);
  test.pulseRedstone(POWER, 2);
  await test.idle(SETTLE_TICKS);
  log(`${label}: craft pulsed`);
}

// Declared positions (xasm43: a full 3x3 pattern, centre over below-centre — row-major index 4/7).
const MACE_NEW: Grid = [undefined, undefined, undefined, undefined, { item: "minecraft:iron_block" }, undefined, undefined, { item: "minecraft:breeze_rod" }, undefined];
const MACE_OLD: Grid = [undefined, undefined, undefined, undefined, { item: "minecraft:heavy_core" }, undefined, undefined, { item: "minecraft:breeze_rod" }, undefined];
const ROCKET_NEW: Grid = [undefined, undefined, undefined, undefined, { item: "minecraft:paper" }, undefined, undefined, { item: "minecraft:string" }, undefined];
/** Shapeless: paper + N gunpowder, one per slot — a single slot holding N gunpowder spends one and crafts flight 1. */
const rocketOld = (gunpowder: number): Grid => [
  { item: "minecraft:paper" },
  ...Array.from({ length: gunpowder }, () => ({ item: "minecraft:gunpowder" })),
  ...Array<undefined>(8 - gunpowder).fill(undefined),
];
const MACE_NEGATIVE: Grid = [undefined, undefined, undefined, undefined, { item: "minecraft:iron_ingot" }, undefined, undefined, { item: "minecraft:breeze_rod" }, undefined];
const ROCKET_NEGATIVE: Grid = [undefined, undefined, undefined, undefined, { item: "minecraft:paper" }, undefined, undefined, { item: "minecraft:stick" }, undefined];

// ---------------------------------------------------------------- AC#1/#2: new recipes beside the old ones

registerAsync("andrew", "vanilla_recipe_mace_new_and_old", async (test: Test): Promise<void> => {
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "vr_mace", GameMode.Survival);
  await test.idle(4);

  for (let i = 1; i <= 3; i++) await craft(test, MACE_NEW, `new mace #${i}`);
  test.assert(arrivalsOf(player, "minecraft:mace") === 3, `expected 3 arrivals of minecraft:mace from the new recipe, got ${arrivalsOf(player, "minecraft:mace")}`);
  test.assert(countOf(player, "minecraft:mace") === 3, `expected 3 accumulated minecraft:mace, got ${countOf(player, "minecraft:mace")}`);

  const held = inventoryOf(player);
  let maceStack: ItemStack | undefined;
  for (let i = 0; i < held.size; i++) {
    const s = held.getItem(i);
    if (s?.typeId === "minecraft:mace") { maceStack = s; break; }
  }
  if (maceStack === undefined) throw new Error("no minecraft:mace found after the new recipe crafted one");
  test.assert(
    maceStack.getLore().length === 0 && maceStack.getDynamicPropertyIds().length === 0,
    "a mace from the new recipe carries lore or dynamic properties — it must be a bare vanilla item"
  );
  const durability = maceStack.getComponent(ItemComponentTypes.Durability);
  log(`new mace durability: ${durability === undefined ? "none" : `damage=${durability.damage} max=${durability.maxDurability}`}`);
  test.assert(durability !== undefined, "a vanilla mace reads no minecraft:durability component");
  test.assert(durability !== undefined && durability.damage === 0, `a freshly crafted mace reads damage ${durability?.damage}, not 0`);

  // Clear the inventory of maces before proving the old recipe still works independently.
  for (let i = 0; i < held.size; i++) {
    if (held.getItem(i)?.typeId === "minecraft:mace") held.setItem(i, undefined);
  }
  arrivals.delete(`${player.name} minecraft:mace`);

  await craft(test, MACE_OLD, "old mace (heavy core)");
  test.assert(arrivalsOf(player, "minecraft:mace") === 1, `old Heavy Core recipe: expected 1 arrival, got ${arrivalsOf(player, "minecraft:mace")}`);
  test.assert(countOf(player, "minecraft:mace") === 1, `old Heavy Core recipe: expected 1 minecraft:mace, got ${countOf(player, "minecraft:mace")}`);
  log("RESULT both the new Iron Block/Breeze Rod recipe and the old Heavy Core recipe produced a vanilla mace");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(700)
  .tag("andrew");

registerAsync("andrew", "vanilla_recipe_rocket_new_and_old", async (test: Test): Promise<void> => {
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "vr_rocket", GameMode.Survival);
  await test.idle(4);

  await craft(test, ROCKET_NEW, "new rocket (paper/string)");
  test.assert(countOf(player, "minecraft:firework_rocket") === 3, `new recipe: expected 3 minecraft:firework_rocket, got ${countOf(player, "minecraft:firework_rocket")}`);

  const held = inventoryOf(player);
  for (let i = 0; i < held.size; i++) {
    if (held.getItem(i)?.typeId === "minecraft:firework_rocket") held.setItem(i, undefined);
  }
  arrivals.delete(`${player.name} minecraft:firework_rocket`);

  await craft(test, rocketOld(1), "old rocket (paper/gunpowder, duration 1)");
  test.assert(countOf(player, "minecraft:firework_rocket") === 3, `old recipe: expected 3 minecraft:firework_rocket, got ${countOf(player, "minecraft:firework_rocket")}`);
  log("RESULT both the new Paper/String recipe and the old Paper/Gunpowder recipe produced 3 vanilla firework rockets");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(700)
  .tag("andrew");

registerAsync("andrew", "vanilla_recipe_mace_rocket_negative_controls", async (test: Test): Promise<void> => {
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "vr_neg", GameMode.Survival);
  await test.idle(4);

  await craft(test, MACE_NEGATIVE, "iron ingot (not block) over breeze rod");
  await craft(test, ROCKET_NEGATIVE, "paper over stick (not string)");

  test.assert(arrivalsOf(player, "minecraft:mace") === 0, "an Iron Ingot over a Breeze Rod produced a Mace");
  test.assert(arrivalsOf(player, "minecraft:firework_rocket") === 0, "Paper over a Stick produced a Firework Rocket");
  test.assert(countOf(player, "minecraft:mace") === 0 && countOf(player, "minecraft:firework_rocket") === 0, "a negative-control layout reached the player's inventory");
  log("RESULT neither negative control matched");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ---------------------------------------------------------------- AC#5: fixed-position probe (xasm43)

/** All 9 placements of a vertically-adjacent pair, labelled; index 4/7 is the declared position. */
const SHIFTS: ReadonlyArray<{ label: string; top: number; bottom: number }> = [
  { label: "left column (same rows)", top: 3, bottom: 6 },
  { label: "right column (same rows)", top: 5, bottom: 8 },
  { label: "shifted up one row (centre column)", top: 1, bottom: 4 },
  { label: "top-left corner (2x2 inventory proxy)", top: 0, bottom: 3 },
];

function gridAt(topItem: string, bottomItem: string, top: number, bottom: number): Grid {
  const cells: (Cell | undefined)[] = Array(9).fill(undefined);
  cells[top] = { item: topItem };
  cells[bottom] = { item: bottomItem };
  return cells;
}

registerAsync("andrew", "vanilla_recipe_fixed_position_probe", async (test: Test): Promise<void> => {
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "vr_shift", GameMode.Survival);
  await test.idle(4);

  const results: string[] = [];
  let anyMatched = false;

  for (const recipe of [
    { name: "mace", top: "minecraft:iron_block", bottom: "minecraft:breeze_rod", resultId: "minecraft:mace" },
    { name: "rocket", top: "minecraft:paper", bottom: "minecraft:string", resultId: "minecraft:firework_rocket" },
  ]) {
    for (const shift of SHIFTS) {
      const before = countOf(player, recipe.resultId);
      await craft(test, gridAt(recipe.top, recipe.bottom, shift.top, shift.bottom), `${recipe.name} shifted: ${shift.label}`);
      const after = countOf(player, recipe.resultId);
      const matched = after > before;
      if (matched) anyMatched = true;
      results.push(`${recipe.name}/${shift.label}=${matched ? "CRAFTED" : "nothing"}`);
      if (matched) {
        // Clear the unexpected result so it cannot mask the next probe's count.
        const held = inventoryOf(player);
        for (let i = 0; i < held.size; i++) if (held.getItem(i)?.typeId === recipe.resultId) held.setItem(i, undefined);
      }
    }
  }

  log(`MEASURE fixed-position probe: ${results.join(", ")}`);
  test.assert(
    !anyMatched,
    `Bedrock trims the declared blank border and matches a shifted/2x2 layout — fixed positions are a reportable limitation (C-16), not a guarantee: ${results.join(", ")}`
  );
  log("RESULT a full 3x3 pattern with an explicit blank border is NOT trimmed by the engine: every shifted and 2x2-proxy layout crafted nothing");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");

// ---------------------------------------------------------------- AC#2/#3: boost measured, duration inferred from the launched entity's own lifetime

function speedOf(player: Player): number {
  const v = player.getVelocity();
  return Math.hypot(v.x, v.y, v.z);
}

async function sendAloftAndGlide(test: Test, player: SimulatedPlayer, label: string): Promise<void> {
  player.teleport(test.worldLocation({ x: STAND.x + 0.5, y: ALOFT_Y, z: STAND.z + 0.5 }), { rotation: { x: 0, y: 0 } });
  await test.idle(3);
  test.assert(!player.isOnGround, `${label}: the player is on the ground, cannot glide`);
  const started = player.glide();
  test.assert(started, `${label}: glide() refused (no Elytra equipped, in water, or already gliding)`);
  await test.idle(2);
  test.assert(player.isGliding, `${label}: not gliding right after glide()`);
}

/** The Crafter ejects its result "at the player" (header note), so the player must be back at the
 * crafter before the next craft, not still up in the sky from the previous measurement. */
async function returnToStand(test: Test, player: SimulatedPlayer): Promise<void> {
  player.teleport(test.worldLocation({ x: STAND.x + 0.5, y: STAND.y, z: STAND.z + 0.5 }), { rotation: { x: 0, y: 0 } });
  await test.idle(3);
}

/** Every entity the world spawns while a launch is being measured, so the rocket actually launched can be told apart from stray spawns. */
interface Spawn { id: string; typeId: string; tick: number }
const spawns: Spawn[] = [];
world.afterEvents.entitySpawn.subscribe((e) => spawns.push({ id: e.entity.id, typeId: e.entity.typeId, tick: system.currentTick }));

const FIREWORK_ENTITY = /firework/i;
/** Comfortably past the vanilla duration-3 lifetime band (~40-51 ticks: 10*(duration+1)+rand(0..5)+rand(0..6)). */
const MAX_LIFETIME_TICKS = 70;
const BOOST_THRESHOLD = 0.3;

/**
 * Stable 2.10.0 cannot read a `minecraft:firework_rocket` ItemStack's Flight Duration (no fireworks
 * item component, xasm39) — so Duration is inferred from the entity the rocket spawns when used while
 * gliding: that entity's own lifetime in ticks is the vanilla 10*(duration+1)+jitter formula, which a
 * velocity snapshot cannot discriminate once glide speed has converged to the same plateau regardless
 * of duration (observed: a fixed-checkpoint velocity compare gave near-identical deltas for every
 * duration tested). Returns the pre-use speed, the peak speed reached while the entity was alive (the
 * boost itself, AC#3), and that entity's lifetime in ticks (the Duration signal, AC#2).
 */
async function measureLaunch(test: Test, player: SimulatedPlayer, slot: number, label: string): Promise<{ before: number; peak: number; lifetimeTicks: number }> {
  await sendAloftAndGlide(test, player, label);
  await test.idle(3);
  const before = speedOf(player);
  const seenBefore = spawns.length;
  player.selectedSlotIndex = slot;
  const used = player.useItemInSlot(slot);
  test.assert(used, `${label}: useItemInSlot(${slot}) refused`);
  await test.idle(1);
  const launched = spawns.slice(seenBefore).find((s) => FIREWORK_ENTITY.test(s.typeId));
  test.assert(
    launched !== undefined,
    `${label}: no firework entity observed after use (spawned: ${spawns.slice(seenBefore).map((s) => s.typeId).join(", ") || "-"})`
  );

  let peak = before;
  let lifetimeTicks = MAX_LIFETIME_TICKS;
  const vy: string[] = [];
  for (let t = 0; t < MAX_LIFETIME_TICKS; t++) {
    const entity = launched && world.getEntity(launched.id);
    if (entity === undefined || !entity.isValid) {
      lifetimeTicks = t;
      break;
    }
    if (player.isValid) {
      peak = Math.max(peak, speedOf(player));
      vy.push(f2(player.getVelocity().y));
    }
    await test.idle(1);
  }
  log(`${label}: before=${f2(before)} peak=${f2(peak)} delta=${f2(peak - before)} entity=${launched?.typeId} lifetime=${lifetimeTicks}t vy=[${vy.join(" ")}]`);
  player.stopGliding();
  return { before, peak, lifetimeTicks };
}

registerAsync("andrew", "vanilla_recipe_rocket_boosts_elytra", async (test: Test): Promise<void> => {
  placeCrafter(test);
  const player = test.spawnSimulatedPlayer(STAND, "vr_boost", GameMode.Survival);
  await test.idle(4);
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  if (equippable === undefined) throw new Error(`${player.name} has no equippable component`);
  test.assert(equippable.setEquipment(EquipmentSlot.Chest, new ItemStack("minecraft:elytra", 1)), "the Elytra was refused in the chest slot");

  // The rocket this task's own recipe produces, taken from the crafted stack itself (not a fresh one).
  await craft(test, ROCKET_NEW, "rocket for the boost measurement");
  moveToSlot(player, "minecraft:firework_rocket", 0);
  const ours = await measureLaunch(test, player, 0, "new recipe rocket (claimed duration 1)");

  // Reference: an explicit duration-1 rocket from the unchanged vanilla recipe.
  const held = inventoryOf(player);
  for (let i = 0; i < held.size; i++) if (held.getItem(i)?.typeId === "minecraft:firework_rocket") held.setItem(i, undefined);
  await returnToStand(test, player);
  await craft(test, rocketOld(1), "reference rocket, duration 1");
  moveToSlot(player, "minecraft:firework_rocket", 1);
  const ref1 = await measureLaunch(test, player, 1, "reference duration-1 rocket");

  // Reference: an explicit duration-3 rocket — a visibly longer-lived launch if durations differ at all.
  for (let i = 0; i < held.size; i++) if (held.getItem(i)?.typeId === "minecraft:firework_rocket") held.setItem(i, undefined);
  await returnToStand(test, player);
  await craft(test, rocketOld(3), "reference rocket, duration 3");
  moveToSlot(player, "minecraft:firework_rocket", 2);
  const ref3 = await measureLaunch(test, player, 2, "reference duration-3 rocket");

  const oursDelta = ours.peak - ours.before;
  log(`MEASURE boost & lifetime: ours delta=${f2(oursDelta)} lifetime=${ours.lifetimeTicks}t; ref1 delta=${f2(ref1.peak - ref1.before)} lifetime=${ref1.lifetimeTicks}t; ref3 delta=${f2(ref3.peak - ref3.before)} lifetime=${ref3.lifetimeTicks}t`);

  test.assert(oursDelta > BOOST_THRESHOLD, `the new recipe's rocket produced no measurable Elytra boost (peak delta ${f2(oursDelta)})`);

  // Flight 1 lives 22–32 ticks on an Elytra and flight 3 41–51 (docs/feedback/rocket-duration.md): one sample each separates them.
  test.assert(ref3.lifetimeTicks > ref1.lifetimeTicks + 5, `control: the flight-3 reference (${ref3.lifetimeTicks}t) does not outlast flight 1 (${ref1.lifetimeTicks}t)`);
  log(`RESULT the new recipe's raw rocket boosts a gliding Elytra (peak delta ${f2(oursDelta)}) for ${ours.lifetimeTicks}t; vanilla flight 1 ${ref1.lifetimeTicks}t, flight 3 ${ref3.lifetimeTicks}t`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");
