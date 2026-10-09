// Loss return against pickups the recovery heuristic cannot see, and debts of
// one owner that must not overwrite each other (CX-lgnd-09 items 2–3;
// L0-lgnd-ad02, r005, ent4, p003); a loss going back to the last holder, not
// to the crafter (CX-lgnd-16, L0-lgnd-ad11), for the Web Sword and the Storm
// Blade. The Dragon Katana's death, Void and jump cases of L0-lgnd-ac24, and
// the Sculk Crossbow's and the Storm Blade's death and Void cases (L0-lgnd-ac27,
// L0-strm-acr) through the same scenarios, close the file.
//
// The oracle reads the persisted keys itself — the stack's `andrew:<p>_gen`
// and the world ledger `andrew:<p>_gen:<id>`, both absent = 0 — rather than
// asking src/legendary whether a copy is live, so a wrong liveness rule in the
// code under test cannot pass its own test.

import {
  BlockPermutation,
  BlockVolume,
  type Container,
  Direction,
  EnchantmentType,
  type Dimension,
  type Entity,
  EntityComponentTypes,
  EquipmentSlot,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { type Activation, observeActivations } from "../katana";
import { clearCooldown } from "../legendary/cooldown";
import { DRAGON_KATANA, type LegendaryDef, SCULK_CROSSBOW, STORM_BLADE, WEB_SWORD, hasAbility } from "../legendary/registry";
import type { Mark } from "../legendary/rules";
import { type BlockBox, forgetWatched, protectLegendariesIn } from "../legendary/recovery";
import * as state from "../legendary/state";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const STAND_A: Vector3 = { x: 2, y: 2, z: 5 };
const STAND_B: Vector3 = { x: 4, y: 2, z: 5 };

/** Four 40-tick recovery checks: a loss return, if one is coming, has landed. */
const WAIT_TICKS = 160;

/** How long a Void return may take to reach the player it goes to. */
const VOID_RETURN_TICKS = 200;

/** The raw key prefix of `def`'s persisted keys, read past src/legendary. */
const keyOf = (def: LegendaryDef): string => `andrew:${def.keyPrefix}_`;
const KEY = keyOf(WEB_SWORD);

const log = (msg: string): void => console.warn(`[gametest] recovery-gen ${msg}`);

function ledgerGen(id: string, def: LegendaryDef = WEB_SWORD): number {
  const raw = world.getDynamicProperty(`${keyOf(def)}gen:${id}`);
  return typeof raw === "number" ? raw : 0;
}

function stackGen(stack: ItemStack, def: LegendaryDef = WEB_SWORD): number {
  const raw = stack.getDynamicProperty(`${keyOf(def)}gen`);
  return typeof raw === "number" ? raw : 0;
}

function isInstance(stack: ItemStack | undefined, id: string, def: LegendaryDef = WEB_SWORD): stack is ItemStack {
  return state.isItemOf(def, stack) && state.getMark(def, stack)?.id === id;
}

/** Generations of every copy of `id` in `container`; undefined when there is no container. */
function gensIn(container: Container | undefined, id: string, def: LegendaryDef = WEB_SWORD): number[] | undefined {
  if (container === undefined) return undefined;
  const gens: number[] = [];
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (isInstance(stack, id, def)) gens.push(stackGen(stack, def));
  }
  return gens;
}

function gensOnGround(test: Test, id: string): number[] {
  return test
    .getDimension()
    .getEntities({ type: "minecraft:item", location: test.worldLocation({ x: 3, y: 2, z: 3 }), maxDistance: 16 })
    .map((e) => e.getComponent("minecraft:item")?.itemStack)
    .filter((s): s is ItemStack => isInstance(s, id))
    .map((s) => stackGen(s));
}

function inventoryOf(player: Player): Container | undefined {
  return player.getComponent("minecraft:inventory")?.container;
}

function blockInventory(test: Test, at: Vector3): Container | undefined {
  return test.getBlock(at).getComponent("minecraft:inventory")?.container;
}

interface Census {
  live: number;
  copies: number;
  where: string;
}

/** Every place `id` can be, with the generation of each copy there. */
function census(id: string, places: Record<string, number[] | undefined>): Census {
  const gen = ledgerGen(id);
  let live = 0;
  let copies = 0;
  for (const gens of Object.values(places)) {
    for (const g of gens ?? []) {
      copies++;
      if (g === gen) live++;
    }
  }
  return { live, copies, where: `ledger gen ${gen}; ${JSON.stringify(places)}` };
}

function dropMarked(test: Test, owner: Player, at: Vector3): string {
  const mark = state.makeMark("admin", owner);
  test.getDimension().spawnItem(state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), mark), test.worldLocation(at));
  return mark.id;
}

/** The owner's slice of the owed ledger as raw JSON, whatever shape it is stored in. */
function owedFor(ownerId: string, def: LegendaryDef = WEB_SWORD): string {
  const raw = world.getDynamicProperty(`${keyOf(def)}owed`);
  if (typeof raw !== "string") return "";
  const owed = JSON.parse(raw) as Record<string, unknown>;
  const entry = owed[ownerId];
  return entry === undefined ? "" : JSON.stringify(entry);
}

const HOPPER: Vector3 = { x: 5, y: 3, z: 1 };
const CHEST: Vector3 = { x: 5, y: 2, z: 1 };
const DROP_OVER_HOPPER: Vector3 = { x: 5.5, y: 4.3, z: 1.5 };

// A hopper facing down into a chest pulls the sword and pushes it on within
// 8 ticks, so the 40-tick check finds neither the spot nor the cell below
// holding it and reads a loss. The owner gets a copy; the chest keeps one.
registerAsync("andrew", "legendary_cx09_hopper_to_chest", async (test: Test): Promise<void> => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "cx09_chest_owner", GameMode.Survival);
  const finder = test.spawnSimulatedPlayer(STAND_B, "cx09_chest_finder", GameMode.Survival);
  test.setBlockType("minecraft:chest", CHEST);
  test.setBlockPermutation(BlockPermutation.resolve("minecraft:hopper", { facing_direction: 0 }), HOPPER);
  await test.idle(4);

  const id = dropMarked(test, owner, DROP_OVER_HOPPER);
  await test.idle(WAIT_TICKS);

  const after = census(id, {
    owner: gensIn(inventoryOf(owner), id),
    chest: gensIn(blockInventory(test, CHEST), id),
    hopper: gensIn(blockInventory(test, HOPPER), id),
    ground: gensOnGround(test, id),
  });
  log(`hopper_to_chest: ws_id ${id} live=${after.live} copies=${after.copies} ${after.where}`);
  test.assert(after.live === 1, `${after.live} live copies of ws_id ${id}, expected exactly 1 (${after.where})`);

  // The survivor, if the loss was misread, is stale: it must not outlive its
  // first trip into a player's inventory (R-lgnd-005).
  const chest = blockInventory(test, CHEST);
  const gen = ledgerGen(id);
  let staleSlot = -1;
  for (let slot = 0; chest !== undefined && slot < chest.size; slot++) {
    const stack = chest.getItem(slot);
    if (isInstance(stack, id) && stackGen(stack) !== gen) staleSlot = slot;
  }
  if (staleSlot < 0) {
    log(`hopper_to_chest: no stale copy in the chest — the loss was not misread this run`);
    test.succeed();
    return;
  }
  const stale = (chest as Container).getItem(staleSlot) as ItemStack;
  (chest as Container).setItem(staleSlot, undefined);
  inventoryOf(finder)?.addItem(stale);
  await test.idle(10);

  const voided = census(id, {
    owner: gensIn(inventoryOf(owner), id),
    finder: gensIn(inventoryOf(finder), id),
    chest: gensIn(chest, id),
  });
  log(`hopper_to_chest: stale copy handed to the finder; live=${voided.live} copies=${voided.copies} ${voided.where}`);
  test.assert(voided.copies === 1 && voided.live === 1, `the stale copy survived a player inventory (${voided.where})`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(WAIT_TICKS + 80)
  .tag("andrew");

// Control: a hopper with no container in front keeps the sword at dy=-1, which
// the heuristic does scan — a pickup, so no return and no generation bump.
registerAsync("andrew", "legendary_cx09_hopper_alone", async (test: Test): Promise<void> => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "cx09_alone_owner", GameMode.Survival);
  test.setBlockPermutation(BlockPermutation.resolve("minecraft:hopper", { facing_direction: 2 }), HOPPER);
  await test.idle(4);

  const id = dropMarked(test, owner, DROP_OVER_HOPPER);
  await test.idle(WAIT_TICKS);

  const owned = gensIn(inventoryOf(owner), id) ?? [];
  const after = census(id, {
    owner: owned,
    hopper: gensIn(blockInventory(test, HOPPER), id),
    ground: gensOnGround(test, id),
  });
  log(`hopper_alone: ws_id ${id} live=${after.live} copies=${after.copies} ${after.where}`);
  test.assert(after.copies === 1 && after.live === 1, `expected one live copy in the hopper (${after.where})`);
  test.assert(owned.length === 0, `the owner was handed a copy of a sword a hopper holds (${after.where})`);
  test.assert(ledgerGen(id) === 0, `a pickup bumped the generation (${after.where})`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(WAIT_TICKS + 40)
  .tag("andrew");

// A hopper minecart is an entity inventory, which the heuristic never scans.
registerAsync("andrew", "legendary_cx09_hopper_minecart", async (test: Test): Promise<void> => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "cx09_cart_owner", GameMode.Survival);
  test.setBlockType("minecraft:rail", { x: 5, y: 2, z: 3 });
  const cart: Entity = test.spawn("minecraft:hopper_minecart", { x: 5, y: 2, z: 3 });
  await test.idle(4);

  const id = dropMarked(test, owner, { x: 5.5, y: 3.6, z: 3.5 });
  await test.idle(WAIT_TICKS);

  const after = census(id, {
    owner: gensIn(inventoryOf(owner), id),
    minecart: cart.isValid ? gensIn(cart.getComponent("minecraft:inventory")?.container, id) : undefined,
    ground: gensOnGround(test, id),
  });
  log(`hopper_minecart: ws_id ${id} live=${after.live} copies=${after.copies} ${after.where}`);
  test.assert(after.live === 1, `${after.live} live copies of ws_id ${id}, expected exactly 1 (${after.where})`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(WAIT_TICKS + 40)
  .tag("andrew");

/** Drops each marked copy on the platform, then sends them into the Void. */
async function loseInVoid(test: Test, marks: Mark[]): Promise<string[]> {
  const entities = marks.map((mark, i) =>
    test
      .getDimension()
      .spawnItem(
        state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), mark),
        test.worldLocation({ x: 1.5 + 4 * i, y: 2.2, z: 1.5 })
      )
  );
  // Watched on the platform first: an item already below the floor at its
  // spawn reads as unloaded with its chunk, not as lost.
  await test.idle(3);
  for (const entity of entities) {
    const floor = entity.dimension.heightRange.min;
    entity.teleport({ x: entity.location.x, y: floor - 8, z: entity.location.z });
  }
  return marks.map((mark) => mark.id);
}

// Two different copies of one offline owner are lost: each is a debt of its own.
registerAsync("andrew", "legendary_cx09_owed_two_losses", async (test: Test): Promise<void> => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "cx09_offline_owner", GameMode.Survival);
  const ownerId = owner.id;
  const marks = [state.makeMark("admin", owner), state.makeMark("admin", owner)];
  await test.idle(4);
  owner.disconnect();
  await test.idle(4);

  const ids = await loseInVoid(test, marks);
  log(`owed_two_losses: owner ${ownerId} offline, lost ws_id ${ids.join(" and ")}`);
  await test.idle(WAIT_TICKS);

  const entry = owedFor(ownerId);
  const kept = ids.filter((id) => entry.includes(id));
  const gens = ids.map((id) => ledgerGen(id));
  log(`owed_two_losses: owed[${ownerId}] = ${entry || "(none)"}; debts kept ${kept.length} of 2; ledger gens ${gens.join(",")}`);
  test.assert(kept.length === 2, `owed keeps ${kept.length} of 2 debts for the offline owner: ${entry || "(none)"}`);
  test.assert(gens.every((g) => g === 1), `each loss must bump its instance to gen 1, ledger reads ${gens.join(",")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(WAIT_TICKS + 60)
  .tag("andrew");

// The owner dies holding copy A (retained as the pending death token), and
// while dead loses copies B and C. On respawn all three come back, each once.
registerAsync("andrew", "legendary_cx09_owed_redeemed_on_respawn", async (test: Test): Promise<void> => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "cx09_dead_owner", GameMode.Survival);
  const ownerId = owner.id;
  await test.idle(4);
  const a = state.makeMark("admin", owner);
  inventoryOf(owner)?.addItem(state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), a));
  await test.idle(4);
  owner.kill();
  // Past the death sweep, which would take anything marked lying near the body.
  await test.idle(10);

  const [b, c] = await loseInVoid(test, [state.makeMark("admin", owner), state.makeMark("admin", owner)]);
  log(`owed_redeemed_on_respawn: ${owner.name} dead holding ${a.id}; lost ${b} and ${c}`);
  await test.idle(WAIT_TICKS);
  log(`owed_redeemed_on_respawn: before respawn owed[${ownerId}] = ${owedFor(ownerId) || "(none)"}`);

  owner.respawn();
  await test.idle(20);

  const rows = [a.id, b, c].map((id) => {
    const gens = gensIn(inventoryOf(owner), id) ?? [];
    const live = gens.filter((g) => g === ledgerGen(id)).length;
    return { id, gens, live };
  });
  const summary = rows.map((r) => `${r.id}: gens=[${r.gens.join(",")}] live=${r.live}`).join("; ");
  log(`owed_redeemed_on_respawn: ${summary}; owed left = ${owedFor(ownerId) || "(none)"}`);
  for (const row of rows) {
    test.assert(row.gens.length === 1 && row.live === 1, `ws_id ${row.id} came back ${row.gens.length} time(s) (${summary})`);
  }
  test.assert(owedFor(ownerId) === "" || owedFor(ownerId) === "[]", `debts survived the redemption: ${owedFor(ownerId)}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(WAIT_TICKS + 100)
  .tag("andrew");

// ------------------------------------------------ CX-lgnd-16: a lost legendary goes back to its last holder (L0-lgnd-ad11)
//
// A holds the instance, it reaches B through the ground, and B loses it in the
// Void. B gets it back; A, who made it, stays its owner and gets nothing. The
// oracle reads the stack's raw keys and the raw owed ledger. The Storm Blade
// runs the online, holder-offline and holder-dead cases as the Web Sword does
// (L0-strm-acr item 6).

const PICKUP_TICKS = 100;

const hlog = (msg: string): void => console.warn(`[gametest] hold ${msg}`);

/** A stack's raw dynamic property, read past src/legendary. */
const rawKey = (stack: ItemStack | undefined, suffix: string, def: LegendaryDef = WEB_SWORD): unknown => stack?.getDynamicProperty(`${keyOf(def)}${suffix}`);

/** The slots of `player`'s inventory holding instance `id`. */
function slotsOf(player: Player, id: string, def: LegendaryDef = WEB_SWORD): number[] {
  const container = inventoryOf(player);
  const slots: number[] = [];
  for (let slot = 0; container !== undefined && slot < container.size; slot++) {
    if (isInstance(container.getItem(slot), id, def)) slots.push(slot);
  }
  return slots;
}

/** The first stack of instance `id` in `player`'s inventory. */
function stackOf(player: Player, id: string, def: LegendaryDef = WEB_SWORD): ItemStack | undefined {
  const slot = slotsOf(player, id, def)[0];
  return slot === undefined ? undefined : inventoryOf(player)?.getItem(slot);
}

/** Return targets whose raw owed entry names instance `id`. */
function owedTargetsOf(id: string, def: LegendaryDef = WEB_SWORD): string[] {
  const value = world.getDynamicProperty(`${keyOf(def)}owed`);
  if (typeof value !== "string") return [];
  return Object.entries(JSON.parse(value) as Record<string, unknown>)
    .filter(([, entry]) => JSON.stringify(entry).includes(id))
    .map(([target]) => target);
}

/** The stack's crafter and holder fields, raw. */
function describeKeys(stack: ItemStack | undefined, def: LegendaryDef = WEB_SWORD): string {
  return ["origin", "owner", "owner_name", "holder", "holder_name", "gen"].map((k) => `${k}=${String(rawKey(stack, k, def))}`).join(" ");
}

async function waitToCarry(test: Test, player: Player, id: string, ticks: number, def: LegendaryDef = WEB_SWORD): Promise<number[]> {
  let slots = slotsOf(player, id, def);
  for (let t = 0; t < ticks && slots.length === 0; t++) {
    await test.idle(1);
    slots = slotsOf(player, id, def);
  }
  return slots;
}

async function droppedNear(test: Test, at: Vector3, id: string, def: LegendaryDef = WEB_SWORD): Promise<Entity | undefined> {
  for (let t = 0; t < 10; t++) {
    await test.idle(1);
    const found = test
      .getDimension()
      .getEntities({ type: "minecraft:item", location: at, maxDistance: 8 })
      .find((e) => isInstance(e.getComponent("minecraft:item")?.itemStack, id, def));
    if (found !== undefined) return found;
  }
  return undefined;
}

/** `from` throws instance `id`; it is put down at `to`'s feet, and `to` picks it up. */
async function handOver(test: Test, from: SimulatedPlayer, to: SimulatedPlayer, id: string, def: LegendaryDef = WEB_SWORD): Promise<void> {
  const slot = slotsOf(from, id, def)[0];
  test.assert(slot !== undefined, `${from.name} does not carry ${id}`);
  from.selectedSlotIndex = slot as number;
  test.assert(from.dropSelectedItem(), `${from.name}: dropSelectedItem refused`);
  const entity = await droppedNear(test, from.location, id, def);
  test.assert(entity !== undefined, `no item entity after ${from.name}'s throw`);
  (entity as Entity).teleport(to.location);
  const got = await waitToCarry(test, to, id, PICKUP_TICKS, def);
  test.assert(
    got.length === 1 && slotsOf(from, id, def).length === 0,
    `hand-over failed: ${to.name} carries ${got.length}, ${from.name} ${slotsOf(from, id, def).length}`
  );
  // The pick-up's playerInventoryItemChange reaches scripts after the GameTest
  // continuations of its tick. A player cannot throw in the tick they picked
  // up in, so the scenario lets the event land as play would.
  await test.idle(2);
}

/**
 * `player` throws instance `id`; once it is watched on the platform, `beforeVoid`
 * runs and the entity is sent below the floor in the same tick.
 */
async function throwIntoVoid(test: Test, player: SimulatedPlayer, id: string, beforeVoid?: () => void, def: LegendaryDef = WEB_SWORD): Promise<void> {
  const slot = slotsOf(player, id, def)[0];
  test.assert(slot !== undefined, `${player.name} does not carry ${id}`);
  player.selectedSlotIndex = slot as number;
  test.assert(player.dropSelectedItem(), `${player.name}: dropSelectedItem refused`);
  const entity = await droppedNear(test, player.location, id, def);
  test.assert(entity !== undefined, `no item entity after ${player.name}'s throw`);
  // Watched on the platform first: an item already below the floor at its
  // spawn reads as unloaded with its chunk, not as lost.
  await test.idle(3);
  const e = entity as Entity;
  const floor = e.dimension.heightRange.min;
  beforeVoid?.();
  e.teleport({ x: e.location.x, y: floor - 8, z: e.location.z });
}

/** A Survival crafter at STAND_A holding a freshly made `def`, and a Survival receiver at STAND_B. */
async function crafterAndReceiver(
  test: Test,
  tag: string,
  def: LegendaryDef = WEB_SWORD
): Promise<{ crafter: SimulatedPlayer; receiver: SimulatedPlayer; id: string }> {
  const crafter = test.spawnSimulatedPlayer(STAND_A, `hold_crafter_${tag}`, GameMode.Survival);
  const receiver = test.spawnSimulatedPlayer(STAND_B, `hold_receiver_${tag}`, GameMode.Survival);
  await test.idle(4);
  const mark = state.makeMark("craft", crafter);
  inventoryOf(crafter)?.setItem(0, state.markItem(def, new ItemStack(def.itemId, 1), mark));
  await test.idle(2);
  return { crafter, receiver, id: mark.id };
}

/** Waits for the return to land, then 40 ticks more, and reads where every copy is. */
async function settleReturn(test: Test, to: Player, id: string, def: LegendaryDef = WEB_SWORD): Promise<void> {
  await waitToCarry(test, to, id, VOID_RETURN_TICKS, def);
  await test.idle(40);
}

function transferThenVoid(tag: string, crafterOffline: boolean, def: LegendaryDef = WEB_SWORD) {
  return async (test: Test): Promise<void> => {
    const { crafter, receiver, id } = await crafterAndReceiver(test, tag, def);
    const [crafterId, crafterName, receiverId] = [crafter.id, crafter.name, receiver.id];
    await handOver(test, crafter, receiver, id, def);
    const onB = stackOf(receiver, id, def);
    hlog(`${tag}: B holds ${def.keyPrefix}_id ${id}; B's stack ${describeKeys(onB, def)} (A=${crafterId}, B=${receiverId})`);
    if (crafterOffline) crafter.disconnect();

    await throwIntoVoid(test, receiver, id, undefined, def);
    await settleReturn(test, receiver, id, def);

    const toB = gensIn(inventoryOf(receiver), id, def) ?? [];
    const toA = crafterOffline ? undefined : (gensIn(inventoryOf(crafter), id, def) ?? []);
    const owed = owedTargetsOf(id, def).map((t) => (t === crafterId ? "A" : t === receiverId ? "B" : t));
    const back = stackOf(receiver, id, def);
    const result =
      `holder(B) gens=[${toB.join(",")}] crafter(A) ${toA === undefined ? "offline" : `gens=[${toA.join(",")}]`} ` +
      `owed targets=[${owed.join(",")}] ledger gen=${ledgerGen(id, def)}; returned ${describeKeys(back, def)}`;
    hlog(`${tag} RESULT ${result}`);
    test.assert(toB.join() === "1", `the holder who lost it did not get it back once at gen 1: ${result}`);
    test.assert(toA === undefined || toA.length === 0, `the crafter was handed the holder's loss: ${result}`);
    test.assert(owed.length === 0, `the return was also owed: ${result}`);
    test.assert(ledgerGen(id, def) === 1, `the loss did not move the ledger to gen 1: ${result}`);
    test.assert(rawKey(back, "holder", def) === receiverId, `the returned copy does not name B as holder: ${result}`);
    test.assert(rawKey(back, "owner", def) === crafterId && rawKey(back, "owner_name", def) === crafterName, `the returned copy lost its crafter: ${result}`);
    test.succeed();
  };
}

registerAsync("andrew", "legendary_hold_void_after_transfer", transferThenVoid("online", false))
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + VOID_RETURN_TICKS + 200)
  .tag("andrew");

registerAsync("andrew", "legendary_hold_void_after_transfer_crafter_offline", transferThenVoid("crafter_off", true))
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + VOID_RETURN_TICKS + 200)
  .tag("andrew");

registerAsync("andrew", "legendary_storm_blade_hold_void_after_transfer", transferThenVoid("sb_online", false, STORM_BLADE))
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + VOID_RETURN_TICKS + 200)
  .tag("andrew");

// The holder leaves the server with the instance on the ground; it falls into
// the Void while they are away. The debt is theirs, not the crafter's.
function holderOffline(tag: string, def: LegendaryDef = WEB_SWORD) {
  return async (test: Test): Promise<void> => {
    const { crafter, receiver, id } = await crafterAndReceiver(test, tag, def);
    const [crafterId, receiverId] = [crafter.id, receiver.id];
    await handOver(test, crafter, receiver, id, def);
    await throwIntoVoid(test, receiver, id, () => receiver.disconnect(), def);
    await test.idle(WAIT_TICKS);

    const owed = owedTargetsOf(id, def);
    const toA = gensIn(inventoryOf(crafter), id, def) ?? [];
    const result =
      `owed targets=[${owed.map((t) => (t === crafterId ? "A" : t === receiverId ? "B" : t)).join(",")}] crafter(A) gens=[${toA.join(",")}] ` +
      `ledger gen=${ledgerGen(id, def)}; owed[B]=${owedFor(receiverId, def) || "(none)"}`;
    hlog(`${tag === "off" ? "holder_offline" : `${tag} holder_offline`} RESULT ${result}`);
    test.assert(owed.length === 1 && owed[0] === receiverId, `the debt is not B's alone: ${result}`);
    test.assert(toA.length === 0, `the crafter was handed the offline holder's loss: ${result}`);
    test.assert(ledgerGen(id, def) === 1 && owedFor(receiverId, def).includes('"gen":1'), `the debt is not at gen 1: ${result}`);
    test.succeed();
  };
}

registerAsync("andrew", "legendary_hold_void_holder_offline", holderOffline("off"))
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + WAIT_TICKS + 120)
  .tag("andrew");

registerAsync("andrew", "legendary_storm_blade_hold_void_holder_offline", holderOffline("sb_off", STORM_BLADE))
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + WAIT_TICKS + 120)
  .tag("andrew");

// The holder is dead when the instance falls: it is owed to them, and paid on
// their next spawn — the same playerSpawn handler that pays on joining.
function holderDeadRedeemed(tag: string, def: LegendaryDef = WEB_SWORD) {
  return async (test: Test): Promise<void> => {
    const { crafter, receiver, id } = await crafterAndReceiver(test, tag, def);
    const [crafterId, receiverId] = [crafter.id, receiver.id];
    const who = tag === "dead" ? "holder_dead" : `${tag} holder_dead`;
    await handOver(test, crafter, receiver, id, def);
    // Killed in the tick the entity leaves the platform, so the death sweep
    // (8 blocks round the body) cannot reach it.
    await throwIntoVoid(test, receiver, id, () => receiver.kill(), def);
    await test.idle(WAIT_TICKS);

    const owedWhileDead = owedTargetsOf(id, def).map((t) => (t === crafterId ? "A" : t === receiverId ? "B" : t));
    const toAWhileDead = gensIn(inventoryOf(crafter), id, def) ?? [];
    hlog(`${who}: while B is dead owed targets=[${owedWhileDead.join(",")}] crafter(A) gens=[${toAWhileDead.join(",")}]`);
    test.assert(owedWhileDead.join() === "B", `while B is dead the debt is not B's alone: [${owedWhileDead.join(",")}]`);
    test.assert(toAWhileDead.length === 0, `the crafter was handed the dead holder's loss: gens=[${toAWhileDead.join(",")}]`);

    receiver.respawn();
    await settleReturn(test, receiver, id, def);
    const toB = gensIn(inventoryOf(receiver), id, def) ?? [];
    const toA = gensIn(inventoryOf(crafter), id, def) ?? [];
    const result =
      `after respawn holder(B) gens=[${toB.join(",")}] crafter(A) gens=[${toA.join(",")}] ` +
      `owed targets=[${owedTargetsOf(id, def).join(",")}] ledger gen=${ledgerGen(id, def)}`;
    hlog(`${who} RESULT ${result}`);
    test.assert(toB.join() === "1", `B was not paid exactly once at gen 1: ${result}`);
    test.assert(toA.length === 0 && owedTargetsOf(id, def).length === 0, `the debt survived or went to A: ${result}`);
    test.succeed();
  };
}

registerAsync("andrew", "legendary_hold_void_holder_dead_redeemed", holderDeadRedeemed("dead"))
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + WAIT_TICKS + VOID_RETURN_TICKS + 200)
  .tag("andrew");

registerAsync("andrew", "legendary_storm_blade_hold_void_holder_dead_redeemed", holderDeadRedeemed("sb_dead", STORM_BLADE))
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + WAIT_TICKS + VOID_RETURN_TICKS + 200)
  .tag("andrew");

/** A Web Sword stamped the way stacks were before holders: no holder keys at all. */
function legacySword(owner: Player, id: string): ItemStack {
  const stack = new ItemStack(WEB_SWORD.itemId, 1);
  stack.setDynamicProperty(`${KEY}origin`, "craft");
  stack.setDynamicProperty(`${KEY}owner`, owner.id);
  stack.setDynamicProperty(`${KEY}id`, id);
  stack.setDynamicProperty(`${KEY}owner_name`, owner.name);
  return stack;
}

const LEGACY_DROP: Vector3 = { x: 5.5, y: 2.2, z: 1.5 };

// An old world's instance that never entered an inventory since: no holder, so
// its loss goes to its owner, as before holders existed.
registerAsync("andrew", "legendary_hold_legacy_mark_owner", async (test: Test): Promise<void> => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "hold_legacy_owner", GameMode.Survival);
  const bystander = test.spawnSimulatedPlayer(STAND_B, "hold_legacy_bystander", GameMode.Survival);
  await test.idle(4);
  const id = `legacy-${system.currentTick}`;
  const old = legacySword(owner, id);
  test.assert(rawKey(old, "holder") === undefined, "the legacy stack carries a holder");
  const entity = test.getDimension().spawnItem(old, test.worldLocation(LEGACY_DROP));
  entity.clearVelocity();
  await test.idle(3);
  entity.teleport({ x: entity.location.x, y: entity.dimension.heightRange.min - 8, z: entity.location.z });
  await settleReturn(test, owner, id);

  const toOwner = gensIn(inventoryOf(owner), id) ?? [];
  const toBystander = gensIn(inventoryOf(bystander), id) ?? [];
  const back = stackOf(owner, id);
  const result = `owner gens=[${toOwner.join(",")}] bystander gens=[${toBystander.join(",")}] owed targets=[${owedTargetsOf(id).join(",")}] ledger gen=${ledgerGen(id)}; returned ${describeKeys(back)}`;
  hlog(`legacy_owner RESULT ${result}`);
  test.assert(toOwner.join() === "1", `the owner of a holder-less stack did not get it back once at gen 1: ${result}`);
  test.assert(toBystander.length === 0 && owedTargetsOf(id).length === 0, `the return went elsewhere too: ${result}`);
  test.assert(rawKey(back, "owner") === owner.id && rawKey(back, "owner_name") === owner.name, `the returned copy lost its owner: ${result}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(VOID_RETURN_TICKS + 120)
  .tag("andrew");

// The same old stack, picked up by somebody else: the first inventory it
// enters becomes its holder, and a later loss goes there.
registerAsync("andrew", "legendary_hold_legacy_mark_stamped", async (test: Test): Promise<void> => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "hold_legacy_maker", GameMode.Survival);
  const taker = test.spawnSimulatedPlayer(STAND_B, "hold_legacy_taker", GameMode.Survival);
  await test.idle(4);
  const id = `legacy-${system.currentTick}`;
  test.getDimension().spawnItem(legacySword(owner, id), taker.location);
  const got = await waitToCarry(test, taker, id, PICKUP_TICKS);
  test.assert(got.length === 1, `the taker never picked the legacy stack up`);
  await test.idle(2);
  const taken = stackOf(taker, id);
  hlog(`legacy_stamped: taker's stack ${describeKeys(taken)} (owner=${owner.id}, taker=${taker.id})`);

  await throwIntoVoid(test, taker, id);
  await settleReturn(test, taker, id);
  const toTaker = gensIn(inventoryOf(taker), id) ?? [];
  const toOwner = gensIn(inventoryOf(owner), id) ?? [];
  const result = `taker gens=[${toTaker.join(",")}] owner gens=[${toOwner.join(",")}] owed targets=[${owedTargetsOf(id).join(",")}] ledger gen=${ledgerGen(id)}; at pick-up ${describeKeys(taken)}`;
  hlog(`legacy_stamped RESULT ${result}`);
  test.assert(toTaker.join() === "1" && toOwner.length === 0, `the loss did not go to the stack's last holder: ${result}`);
  test.assert(rawKey(taken, "holder") === taker.id && rawKey(taken, "owner") === owner.id, `the pick-up did not record the holder, or rewrote the owner: ${result}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + VOID_RETURN_TICKS + 160)
  .tag("andrew");

const HOLD_CRAFTER: Vector3 = { x: 3, y: 2, z: 4 };
const HOLD_SMITH: Vector3 = { x: 3, y: 2, z: 5 };
const HOLD_POWER: Vector3 = { x: 2, y: 2, z: 4 };
const HOLD_RECEIVER: Vector3 = { x: 5, y: 2, z: 5 };
const WEB_SWORD_GRID: ReadonlyArray<string | undefined> = [
  undefined, "minecraft:web", undefined,
  "minecraft:web", "minecraft:diamond_sword", "minecraft:web",
  undefined, "minecraft:web", undefined,
];

// What needs the crafter keeps the crafter: a real recipe craft announces its
// maker once, and after a hand-over and a loss the copy B gets back still names
// A as owner and the world still records A as the one who made it.
registerAsync("andrew", "legendary_hold_crafter_stays_owner", async (test: Test): Promise<void> => {
  state.resetCrafted(WEB_SWORD);
  test.setBlockPermutation(BlockPermutation.resolve("minecraft:crafter", { orientation: "south_up" }), HOLD_CRAFTER);
  const smith = test.spawnSimulatedPlayer(HOLD_SMITH, "hold_smith", GameMode.Survival);
  const capture = captureWarnings();
  // Only the craft gate's own lines: this test's log lines quote them.
  const announcements = (): string[] => capture.lines.filter((l) => l.startsWith(`[andrew] ${WEB_SWORD.itemId} first craft by`));
  try {
    await test.idle(4);
    const at = test.worldBlockLocation(HOLD_CRAFTER);
    WEB_SWORD_GRID.forEach((itemId, slot) => {
      if (itemId === undefined) return;
      const cmd = `replaceitem block ${at.x} ${at.y} ${at.z} slot.container ${slot} ${itemId} 1`;
      test.assert(test.getDimension().runCommand(cmd).successCount > 0, `${cmd} failed`);
    });
    test.pulseRedstone(HOLD_POWER, 2);

    let crafted: state.MarkedSlot | undefined;
    for (let t = 0; t < PICKUP_TICKS && crafted === undefined; t++) {
      await test.idle(1);
      const container = inventoryOf(smith);
      crafted = container === undefined ? undefined : state.findAllMarked(WEB_SWORD, container).find((m) => m.mark.origin === "craft");
    }
    test.assert(crafted !== undefined, "the crafter's Web Sword never reached the smith as a crafted instance");
    const id = (crafted as state.MarkedSlot).mark.id;
    const made = stackOf(smith, id);
    const craftedBy = (): unknown => world.getDynamicProperty(`${KEY}crafted_by`);
    hlog(`crafter_stays_owner: crafted ws_id ${id}; ${describeKeys(made)}; crafted_by=${String(craftedBy())}; announced: ${announcements().join(" | ")}`);
    test.assert(announcements().length === 1 && announcements()[0].includes(smith.name), `the first craft was not announced once by its maker: ${announcements().join(" | ")}`);
    test.assert(rawKey(made, "owner") === smith.id && rawKey(made, "owner_name") === smith.name, `the craft did not stamp its maker: ${describeKeys(made)}`);

    const receiver = test.spawnSimulatedPlayer(HOLD_RECEIVER, "hold_heir", GameMode.Survival);
    await test.idle(4);
    await handOver(test, smith, receiver, id);
    const onB = stackOf(receiver, id);
    await throwIntoVoid(test, receiver, id);
    await settleReturn(test, receiver, id);

    const back = stackOf(receiver, id);
    const toB = gensIn(inventoryOf(receiver), id) ?? [];
    const toSmith = gensIn(inventoryOf(smith), id) ?? [];
    const result =
      `heir gens=[${toB.join(",")}] smith gens=[${toSmith.join(",")}]; on the heir ${describeKeys(onB)}; returned ${describeKeys(back)}; ` +
      `crafted=${String(world.getDynamicProperty(`${KEY}crafted`))} crafted_by=${String(craftedBy())}; announcements ${announcements().length}`;
    hlog(`crafter_stays_owner RESULT ${result}`);
    test.assert(toB.join() === "1" && toSmith.length === 0, `the loss did not go back to the heir alone: ${result}`);
    for (const [where, stack] of [["on the heir", onB], ["returned", back]] as const) {
      test.assert(rawKey(stack, "origin") === "craft", `${where}: the origin is no longer craft: ${result}`);
      test.assert(rawKey(stack, "owner") === smith.id && rawKey(stack, "owner_name") === smith.name, `${where}: the crafter was replaced: ${result}`);
      test.assert(rawKey(stack, "holder") === receiver.id, `${where}: the heir is not the holder: ${result}`);
    }
    test.assert(craftedBy() === smith.name && world.getDynamicProperty(`${KEY}crafted`) === true, `the world forgot who made it: ${result}`);
    test.assert(announcements().length === 1, `the hand-over or the loss announced a craft again: ${result}`);
  } finally {
    capture.stop();
    state.resetCrafted(WEB_SWORD);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2 * PICKUP_TICKS + VOID_RETURN_TICKS + 200)
  .tag("andrew");

// ------------------------------------------------ probe L0-xasm11 P1: item frames spill on `setblock … destroy`

const FRAME_AT: Vector3 = { x: 2, y: 2, z: 3 };
const FRAME_TYPES = ["minecraft:frame", "minecraft:glow_frame"] as const;

const probe = (msg: string): void => console.warn(`[probe] xasm11 ${msg}`);

function itemsNear(dimension: Dimension, at: Vector3, radius: number): Entity[] {
  return dimension.getEntities({ type: "minecraft:item", location: { x: at.x + 0.5, y: at.y + 0.5, z: at.z + 0.5 }, maxDistance: radius });
}

/** "typeId[ws_id@gen]" per item entity; the mark is read back so a lost mark shows. */
function describeItems(entities: Entity[]): string {
  const parts = entities.map((e) => {
    const stack = e.getComponent("minecraft:item")?.itemStack;
    if (stack === undefined) return "?";
    const mark = state.isItemOf(WEB_SWORD, stack) ? state.getMark(WEB_SWORD, stack) : undefined;
    return mark === undefined ? stack.typeId : `${stack.typeId}[${mark.id}@${stackGen(stack)}]`;
  });
  return `${entities.length}{${parts.join(",")}}`;
}

/** Places a frame on the floor and has `player` put a marked sword into it; true when the hand emptied. */
async function frameASword(test: Test, player: SimulatedPlayer, frameType: string, mark: Mark): Promise<{ inserted: boolean; via: string }> {
  try {
    test.setBlockPermutation(BlockPermutation.resolve(frameType, { facing_direction: 1 }), FRAME_AT);
  } catch {
    test.setBlockType(frameType, FRAME_AT);
  }
  const inventory = inventoryOf(player);
  inventory?.setItem(0, state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), mark));
  player.selectedSlotIndex = 0;
  await test.idle(4);
  const routes: Array<[string, () => boolean]> = [
    ["useItemInSlotOnBlock", () => player.useItemInSlotOnBlock(0, FRAME_AT, Direction.Up)],
    ["interactWithBlock", () => player.interactWithBlock(FRAME_AT, Direction.Up)],
  ];
  for (const [via, use] of routes) {
    const answered = use();
    await test.idle(4);
    if (isInstance(inventory?.getItem(0), mark.id) === false) {
      return { inserted: true, via: `${via} (returned ${answered})` };
    }
  }
  return { inserted: false, via: "neither route emptied the hand" };
}

// P1 of L0-xasm11 (L0-adr-oprt §3): does `setblock x y z air destroy` spill a
// frame and the item in it as item entities, keeping the item's dynamic
// properties, and when can getEntities see them? The answers are the RESULT
// lines; the test fails only when the harness could not frame the sword.
registerAsync("andrew", "probe_xasm11_frames", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(STAND_A, "xasm11_framer", GameMode.Survival);
  const dimension = test.getDimension();
  await test.idle(4);

  for (const frameType of FRAME_TYPES) {
    const mark = state.makeMark("admin", player);
    const { inserted, via } = await frameASword(test, player, frameType, mark);
    const cell = test.worldBlockLocation(FRAME_AT);
    const placed = test.getBlock(FRAME_AT).typeId;
    const before = describeItems(itemsNear(dimension, cell, 3));
    test.assert(inserted, `${frameType}: the sword did not go into the frame (${via}; block ${placed}; items ${before})`);

    const result = dimension.runCommand(`setblock ${cell.x} ${cell.y} ${cell.z} air destroy`);
    const sameTick = describeItems(itemsNear(dimension, cell, 3));
    const afterBlock = dimension.getBlock(cell)?.typeId ?? "unloaded";
    let afterRun = "(system.run never ran)";
    system.run(() => {
      afterRun = describeItems(itemsNear(dimension, cell, 3));
    });
    await test.idle(1);
    const tick1 = describeItems(itemsNear(dimension, cell, 3));
    await test.idle(4);
    const tick5 = describeItems(itemsNear(dimension, cell, 3));
    probe(
      `P1 RESULT ${frameType}: framed via ${via}; before=${before} setblock successCount=${result.successCount} ` +
        `block after=${afterBlock} sameTick=${sameTick} afterSystemRun=${afterRun} tick+1=${tick1} tick+5=${tick5} (ws_id ${mark.id})`
    );
    for (const e of itemsNear(dimension, cell, 4)) e.remove();
    await test.idle(2);
  }

  // How getEntities reads `volume`: one item resting in cell (4,2,3), queried
  // from cell (2,2,3) with the extent max−min and with max−min+1.
  const resting = dimension.spawnItem(new ItemStack("minecraft:stick", 1), test.worldLocation({ x: 4.5, y: 2.05, z: 3.5 }));
  resting.clearVelocity();
  await test.idle(10);
  const from = test.worldBlockLocation({ x: 2, y: 2, z: 3 });
  const seen = (volume: Vector3): boolean => dimension.getEntities({ type: "minecraft:item", location: from, volume }).some((e) => e.id === resting.id);
  const at = resting.location;
  probe(
    `P1 RESULT volume: item at ${at.x.toFixed(2)},${at.y.toFixed(2)},${at.z.toFixed(2)} (cell ${Math.floor(at.x)},${Math.floor(at.y)},${Math.floor(at.z)}), ` +
      `query from ${from.x},${from.y},${from.z}: volume(2,0,0)=${seen({ x: 2, y: 0, z: 0 })} volume(3,1,1)=${seen({ x: 3, y: 1, z: 1 })} ` +
      `volume(1,0,0)=${seen({ x: 1, y: 0, z: 0 })} volume(2,1,1)=${seen({ x: 2, y: 1, z: 1 })}`
  );
  resting.remove();
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

// ------------------------------------------------ protectLegendariesIn on the engine (L0-lgnd-p008 steps 2b and 3)

/** Records what the modules under test print, so a missing loss line is an observation, not an inference. */
function captureWarnings(): { lines: string[]; stop(): void } {
  const original = console.warn;
  const lines: string[] = [];
  console.warn = (...args: unknown[]): void => {
    lines.push(args.map(String).join(" "));
    original(...args);
  };
  return { lines, stop: () => void (console.warn = original) };
}

function worldBox(test: Test, min: Vector3, max: Vector3): BlockBox {
  return { min: test.worldBlockLocation(min), max: test.worldBlockLocation(max) };
}

const insideBox = (at: Vector3, box: BlockBox): boolean =>
  (["x", "y", "z"] as const).every((a) => Math.floor(at[a]) >= box.min[a] && Math.floor(at[a]) <= box.max[a]);

interface Whereabouts {
  onGround: Array<{ at: Vector3; gen: number }>;
  inInventories: number;
  text: string;
}

/** Every copy of `id` on the ground near the test and in the players' inventories. */
function whereabouts(test: Test, id: string, players: Player[]): Whereabouts {
  const onGround = test
    .getDimension()
    .getEntities({ type: "minecraft:item", location: test.worldLocation({ x: 3, y: 2, z: 3 }), maxDistance: 32 })
    .flatMap((e) => {
      const stack = e.getComponent("minecraft:item")?.itemStack;
      return isInstance(stack, id) ? [{ at: e.location, gen: stackGen(stack) }] : [];
    });
  const inInventories = players.reduce((n, p) => n + (gensIn(inventoryOf(p), id)?.length ?? 0), 0);
  const ground = onGround.map((g) => `${g.at.x.toFixed(1)},${g.at.y.toFixed(1)},${g.at.z.toFixed(1)}@${g.gen}`).join(" ");
  return { onGround, inInventories, text: `ground [${ground}] inventories ${inInventories} ledger gen ${ledgerGen(id)}` };
}

/** Exactly one copy, on the ground outside `volume`, at generation 0 on the stack and in the ledger. */
function assertMovedOnce(test: Test, id: string, volume: BlockBox, players: Player[], when: string): string {
  const w = whereabouts(test, id, players);
  test.assert(w.onGround.length + w.inInventories === 1, `${when}: ws_id ${id} exists ${w.onGround.length + w.inInventories} times, expected once (${w.text})`);
  test.assert(w.onGround.length === 1, `${when}: ws_id ${id} is not on the ground (${w.text})`);
  test.assert(!insideBox(w.onGround[0].at, volume), `${when}: ws_id ${id} is still inside the protected volume (${w.text})`);
  test.assert(w.onGround[0].gen === 0 && ledgerGen(id) === 0, `${when}: ws_id ${id} changed generation (${w.text})`);
  return w.text;
}

/** Lines in which recovery reads `id` as lost: every loss path prints "now gen" or "already stale". */
const lossLines = (lines: string[], id: string): string[] =>
  lines.filter((l) => l.includes("legendary recovery:") && l.includes(`id ${id}`) && (l.includes("now gen") || l.includes("already stale")));

// P-lgnd-008 step 3 / L0-ring-ac16: a legendary lying inside the volume exists
// exactly once afterwards, outside the volume, same id and generation, and the
// removal is never read as a loss.
registerAsync("andrew", "legendary_protect_ground_item", async (test: Test): Promise<void> => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "protect_ground_owner", GameMode.Survival);
  const other = test.spawnSimulatedPlayer(STAND_B, "protect_ground_other", GameMode.Survival);
  const players = [owner, other];
  await test.idle(4);
  const id = dropMarked(test, owner, { x: 3.5, y: 2.2, z: 2.5 });
  // Watched and settled before the call, as a legendary dropped earlier would be.
  await test.idle(10);
  const volume = worldBox(test, { x: 1, y: 2, z: 1 }, { x: 5, y: 4, z: 3 });
  const before = whereabouts(test, id, players);
  test.assert(before.onGround.length === 1 && insideBox(before.onGround[0].at, volume), `setup: the sword is not lying inside the volume (${before.text})`);

  const capture = captureWarnings();
  try {
    const result = protectLegendariesIn(test.getDimension(), volume, { reason: "gametest ground item" });
    const now = assertMovedOnce(test, id, volume, players, "same tick");
    log(`protect_ground_item: ws_id ${id} moved=${result.moved} handedBack=${result.handedBack}; same tick: ${now}`);
    test.assert(result.moved === 1 && result.handedBack === 0, `expected moved=1 handedBack=0, got ${JSON.stringify(result)}`);

    await test.idle(WAIT_TICKS);
    const later = assertMovedOnce(test, id, volume, players, `after ${WAIT_TICKS} ticks`);
    const losses = lossLines(capture.lines, id);
    const protectLines = capture.lines.filter((l) => l.includes(`legendary protect: moved ${WEB_SWORD.itemId} id ${id}`));
    log(`protect_ground_item: after ${WAIT_TICKS} ticks: ${later}; recovery loss lines: ${losses.length}; protect lines seen: ${protectLines.length}`);
    test.assert(protectLines.length === 1, `the capture missed protect's own line, so it cannot vouch for silence (${protectLines.length})`);
    test.assert(losses.length === 0, `recovery read the move as a loss: ${losses.join(" | ")}`);
  } finally {
    capture.stop();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(WAIT_TICKS + 80)
  .tag("andrew");

// L0-adr-oprt §3 (p008 step 2b), path chosen by probe P1: a legendary in a
// frame or glow frame inside the volume ends up once, outside it; the call
// does not throw, and the frame is gone.
registerAsync("andrew", "legendary_protect_framed", async (test: Test): Promise<void> => {
  const owner = test.spawnSimulatedPlayer(STAND_A, "protect_frame_owner", GameMode.Survival);
  const other = test.spawnSimulatedPlayer(STAND_B, "protect_frame_other", GameMode.Survival);
  const players = [owner, other];
  await test.idle(4);
  const volume = worldBox(test, { x: 1, y: 2, z: 2 }, { x: 3, y: 3, z: 4 });

  const capture = captureWarnings();
  try {
    const ids: string[] = [];
    for (const frameType of FRAME_TYPES) {
      const mark = state.makeMark("admin", owner);
      const { inserted, via } = await frameASword(test, owner, frameType, mark);
      test.assert(inserted, `${frameType}: the sword did not go into the frame (${via})`);
      const framed = whereabouts(test, mark.id, players);
      test.assert(framed.onGround.length + framed.inInventories === 0, `${frameType}: the sword is not only in the frame (${framed.text})`);

      let result;
      try {
        result = protectLegendariesIn(test.getDimension(), volume, { reason: `gametest ${frameType}` });
      } catch (e) {
        throw new Error(`${frameType}: protectLegendariesIn threw: ${String(e)}`);
      }
      const block = test.getBlock(FRAME_AT).typeId;
      const now = assertMovedOnce(test, mark.id, volume, players, `${frameType}, same tick`);
      log(`protect_framed: ${frameType} ws_id ${mark.id} moved=${result.moved} handedBack=${result.handedBack} block now ${block}; ${now}`);
      test.assert(result.moved === 1 && result.handedBack === 0, `${frameType}: expected moved=1 handedBack=0, got ${JSON.stringify(result)}`);
      test.assert(block === "minecraft:air", `${frameType}: the frame is still there (${block})`);
      ids.push(mark.id);
      await test.idle(4);
    }

    await test.idle(WAIT_TICKS);
    for (const id of ids) {
      const later = assertMovedOnce(test, id, volume, players, `after ${WAIT_TICKS} ticks`);
      const losses = lossLines(capture.lines, id);
      log(`protect_framed: ws_id ${id} after ${WAIT_TICKS} ticks: ${later}; recovery loss lines: ${losses.length}`);
      test.assert(losses.length === 0, `recovery read the move as a loss: ${losses.join(" | ")}`);
    }
  } finally {
    capture.stop();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(WAIT_TICKS + 120)
  .tag("andrew");

// ------------------------------------------------ the Dragon Katana under the legendary rules (L0-lgnd-ac24 T16, T18; L0-lgnd-r017)

const KATANA_SLOT = 0;
/** Two 40-tick recovery checks: a loss return, if one is coming, has landed. */
const KATANA_SETTLE_TICKS = 100;
/** Twice the retention sweep radius: also sees what the sweep left behind. */
const KATANA_GROUND_RADIUS = 16;
/** T06: a jump through open air moves the head 19–20 blocks; positions are single precision. */
const JUMP_HEAD_MOVE: readonly [number, number] = [19, 20 + 1e-4];

const klog = (msg: string): void => console.warn(`[gametest] katana-lgnd ${msg}`);
const f1 = (v: Vector3): string => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;

/** Every stack `player` carries: inventory, then the off hand. */
function carried(player: Player): ItemStack[] {
  const stacks: ItemStack[] = [];
  const container = inventoryOf(player);
  for (let slot = 0; container !== undefined && slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack !== undefined) stacks.push(stack);
  }
  const off = state.offhandOf(player);
  if (off !== undefined) stacks.push(off);
  return stacks;
}

/** Generations of every copy of instance `id` among `stacks`. */
function gensOf(def: LegendaryDef, stacks: ItemStack[], id: string): number[] {
  return stacks.flatMap((stack) => {
    const mark = state.isItemOf(def, stack) ? state.getMark(def, stack) : undefined;
    return mark?.id === id ? [mark.gen] : [];
  });
}

function groundCopies(dim: Dimension, at: Vector3, def: LegendaryDef, id: string): Array<{ entity: Entity; gen: number }> {
  return dim.getEntities({ type: "minecraft:item", location: at, maxDistance: KATANA_GROUND_RADIUS }).flatMap((entity) => {
    const stack = entity.isValid ? entity.getComponent("minecraft:item")?.itemStack : undefined;
    return stack === undefined ? [] : gensOf(def, [stack], id).map((gen) => ({ entity, gen }));
  });
}

/** Entries of `def`'s owed ledger, any owner, that name instance `id`. */
function owedEntries(def: LegendaryDef, id: string): number {
  return Object.values(state.readOwed(def))
    .flat()
    .filter((entry) => entry.mark.id === id).length;
}

/** Every recovery line about `ids` that a loss or a stale copy would print. */
function recoveryVerdicts(lines: string[], ids: string[]): string[] {
  return lines.filter(
    (l) => l.includes("legendary recovery:") && ids.some((id) => l.includes(`id ${id}`)) && /now gen|already stale|removed a stale|owed/.test(l)
  );
}

type Hand = "main" | "off";

/** What a returned copy must carry again besides its mark (L0-sclk-ac19). */
interface Dress {
  enchants?: ReadonlyArray<readonly [string, number]>;
  nameTag?: string;
  lore?: string[];
}

/** Enchantments, anvil name and lore of a stack, as one comparable line. */
function lookText(stack: ItemStack | undefined): string {
  const list = stack?.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
  const enchants = list
    .map((e) => `${e.type.id}${e.level}`)
    .sort()
    .join("+");
  return `${enchants || "-"} name ${stack?.nameTag ?? "-"} lore ${stack?.getLore().join("/") || "-"}`;
}

/** Generation and look of every copy of instance `id` the player carries. */
function copiesOf(def: LegendaryDef, player: Player, id: string): Array<{ gen: number; look: string }> {
  return carried(player).flatMap((stack) => gensOf(def, [stack], id).map((gen) => ({ gen, look: lookText(stack) })));
}

/** A Survival player at `at` holding a marked `def` in `hand`, dressed with `dress`, its cooldown clear. */
async function armedHolder(
  test: Test,
  at: Vector3,
  name: string,
  def: LegendaryDef = DRAGON_KATANA,
  hand: Hand = "main",
  dress: Dress = {}
): Promise<{ player: SimulatedPlayer; mark: Mark }> {
  const player = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  await test.idle(4);
  const mark = state.makeMark("admin", player);
  const stack = new ItemStack(def.itemId, 1);
  for (const [id, level] of dress.enchants ?? []) stack.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType(id), level });
  if (dress.nameTag !== undefined) stack.nameTag = dress.nameTag;
  if (dress.lore !== undefined) stack.setLore(dress.lore);
  player.selectedSlotIndex = KATANA_SLOT;
  if (hand === "main") inventoryOf(player)?.setItem(KATANA_SLOT, state.markItem(def, stack, mark));
  else state.setOffhand(player, state.markItem(def, stack, mark));
  if (hasAbility(def)) clearCooldown(player, def.abilityKey);
  await test.idle(2);
  return { player, mark };
}

/** Cells written outside the platform, put back by restore(): `gametest clearall` resets only the platform. */
class Cells {
  private readonly saved = new Map<string, { at: Vector3; permutation: BlockPermutation }>();

  constructor(private readonly test: Test) {}

  fill(from: Vector3, to: Vector3, typeId: string): void {
    const dim = this.test.getDimension();
    for (let x = from.x; x <= to.x; x++)
      for (let y = from.y; y <= to.y; y++)
        for (let z = from.z; z <= to.z; z++) {
          const block = dim.getBlock(this.test.worldBlockLocation({ x, y, z }));
          if (block === undefined) throw new Error(`cell ${x},${y},${z} is not loaded`);
          const key = `${block.location.x},${block.location.y},${block.location.z}`;
          if (!this.saved.has(key)) this.saved.set(key, { at: block.location, permutation: block.permutation });
          if (block.typeId !== typeId) block.setType(typeId);
        }
  }

  restore(): void {
    const dim = this.test.getDimension();
    for (const { at, permutation } of this.saved.values()) {
      try {
        dim.getBlock(at)?.setPermutation(permutation);
      } catch (err) {
        klog(`restore ${f1(at)} threw ${String(err)}`);
      }
    }
    this.saved.clear();
  }
}

interface Jump {
  activation: Activation;
  /** Read in the activation's tick, right after the teleport. */
  head: Vector3;
  dimensionId: string;
}

/** Turns `player` level along +x, 40 blocks out from its head. */
async function faceEast(test: Test, player: SimulatedPlayer): Promise<void> {
  const head = player.getHeadLocation();
  player.lookAtLocation(test.relativeLocation({ x: head.x + 40, y: head.y, z: head.z }));
  await test.idle(4);
}

/**
 * One Katana jump through the real press, repeated until an activation arrives:
 * a SimulatedPlayer swallows every second use (CNTR-XCX14). `inTick` runs in
 * the activation's own tick, after the teleport and the cooldown.
 */
async function jumpOnce(test: Test, player: SimulatedPlayer, inTick?: () => void): Promise<Jump> {
  let got: Jump | undefined;
  const stop = observeActivations((activation) => {
    if (activation.player.id !== player.id || got !== undefined) return;
    got = { activation, head: { ...player.getHeadLocation() }, dimensionId: player.dimension.id };
    inTick?.();
  });
  try {
    for (let attempt = 1; attempt <= 3 && got === undefined; attempt++) {
      player.useItemInSlot(KATANA_SLOT);
      for (let t = 0; t < 4 && got === undefined; t++) await test.idle(1);
    }
  } finally {
    stop();
  }
  if (got === undefined) throw new Error(`${player.name}: no Katana activation after 3 presses`);
  return got;
}

/** What is wrong with `jump` as a 20-block jump in the dimension it started in. */
function jumpFaults(jump: Jump, dimensionBefore: string): string[] {
  const a = jump.activation;
  const moved = Math.hypot(jump.head.x - a.plan.head.x, jump.head.y - a.plan.head.y, jump.head.z - a.plan.head.z);
  const faults: string[] = [];
  if (!a.jumped) faults.push(`refused (trace stopped by ${a.plan.stoppedBy})`);
  if (a.dimensionId !== dimensionBefore || jump.dimensionId !== dimensionBefore) faults.push(`dimension ${dimensionBefore} -> ${a.dimensionId}/${jump.dimensionId}`);
  if (a.jumped && (moved < JUMP_HEAD_MOVE[0] || moved > JUMP_HEAD_MOVE[1])) faults.push(`head moved ${moved.toFixed(4)}, not 19–20 (trace stopped by ${a.plan.stoppedBy})`);
  return faults;
}

function describeJump(jump: Jump): string {
  const a = jump.activation;
  const moved = Math.hypot(jump.head.x - a.plan.head.x, jump.head.y - a.plan.head.y, jump.head.z - a.plan.head.z);
  return `${f1(a.plan.origin)} -> ${a.plan.feet === undefined ? "refused" : f1(a.plan.feet)} head moved ${moved.toFixed(3)} stoppedBy ${a.plan.stoppedBy} dim ${a.dimensionId}/${jump.dimensionId}`;
}

// T16 (L0-lgnd-ac24, L0-katn-ac07): a death keeps the Katana with the SAME id
// and generation — retention restores the stack, it is not a loss return.
// The jump variants build a level runway east of the platform; a kill in the
// activation's own tick is the earliest "right after a jump" there is.

/** Feet cell of the runway jumps, on the platform floor; the runway runs east from it. */
const RUNWAY_START: Vector3 = { x: 2, y: 2, z: 3 };
const RUNWAY_FLOOR_Y = 1;
const RUNWAY_TO_X = 26;
/** Lava starts well above any regeneration: a low-health player dies in it within a few hurts. */
const LAVA_HEALTH = 4;
const DEATH_DEADLINE_TICKS = 300;

/** `afterJump` is the Katana's own; every def dies by `cause` with the stack in `hand`. */
function deathRetention(
  def: LegendaryDef,
  name: string,
  cause: "kill" | "lava",
  afterJump: boolean,
  hand: Hand = "main",
  dress: Dress = {}
): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const dim = test.getDimension();
    const cells = new Cells(test);
    const capture = captureWarnings();
    let dieSub: ReturnType<typeof world.afterEvents.entityDie.subscribe> | undefined;
    try {
      if (afterJump) {
        cells.fill({ x: 0, y: RUNWAY_FLOOR_Y, z: RUNWAY_START.z - 1 }, { x: RUNWAY_TO_X, y: RUNWAY_FLOOR_Y, z: RUNWAY_START.z + 1 }, "minecraft:stone");
        cells.fill({ x: 0, y: RUNWAY_FLOOR_Y + 1, z: RUNWAY_START.z - 1 }, { x: RUNWAY_TO_X, y: RUNWAY_FLOOR_Y + 5, z: RUNWAY_START.z + 1 }, "minecraft:air");
      }
      const { player, mark } = await armedHolder(test, afterJump ? RUNWAY_START : STAND_A, `lg_${name.replace("legendary_", "")}`, def, hand, dress);
      const lookBefore = copiesOf(def, player, mark.id)
        .map((c) => c.look)
        .join();
      const startedAt = { ...player.location };
      let death: { cause: string; at: Vector3; tick: number } | undefined;
      dieSub = world.afterEvents.entityDie.subscribe((event) => {
        const dead: Entity | undefined = event.deadEntity;
        if (dead !== undefined && dead.id === player.id) death = { cause: event.damageSource.cause, at: { ...dead.location }, tick: system.currentTick };
      });

      let jump: Jump | undefined;
      const dimensionBefore = player.dimension.id;
      if (afterJump) {
        await faceEast(test, player);
        jump = await jumpOnce(test, player, cause === "kill" ? () => player.kill() : undefined);
        const faults = jumpFaults(jump, dimensionBefore);
        test.assert(faults.length === 0, `the jump before the death: ${faults.join("; ")}`);
      } else if (cause === "kill") {
        player.kill();
      }
      if (cause === "lava") {
        player.getComponent(EntityComponentTypes.Health)?.setCurrentValue(LAVA_HEALTH);
        const feet = test.relativeBlockLocation(player.location);
        cells.fill(feet, { ...feet, y: feet.y + 1 }, "minecraft:lava");
      }
      for (let t = 0; t < DEATH_DEADLINE_TICKS && death === undefined; t++) await test.idle(1);
      test.assert(death !== undefined, `${player.name} did not die within ${DEATH_DEADLINE_TICKS} ticks (${cause})`);
      const died = death as NonNullable<typeof death>;

      // Past retention's next-tick sweep, before the respawn: what lies there now stays.
      await test.idle(10);
      const atDeath = groundCopies(dim, died.at, def, mark.id).length;
      cells.restore();
      player.respawn();
      await test.idle(KATANA_SETTLE_TICKS);

      const copies = copiesOf(def, player, mark.id);
      const held = copies.map((c) => c.gen);
      const lookAfter = copies.map((c) => c.look).join();
      const ground = groundCopies(dim, died.at, def, mark.id).length + groundCopies(dim, startedAt, def, mark.id).length;
      const ledger = state.ledgerGen(def, mark.id);
      const pending = state.readPending(def, player).length;
      const owed = owedEntries(def, mark.id);
      const verdicts = recoveryVerdicts(capture.lines, [mark.id]);
      klog(
        `${name} RESULT ${jump === undefined ? "no jump" : `jump ${describeJump(jump)}, died ${died.tick - jump.activation.tick} tick(s) later`}; ` +
          `died of ${died.cause} at ${f1(died.at)}; ${def.itemId} (${hand} hand) id ${mark.id}: ` +
          `on the ground at death+10 ${atDeath}, after respawn held gens [${held.join(" ")}] ground ${ground} ledger ${ledger} pending ${pending} owed ${owed}; ` +
          `look [${lookBefore}] -> [${lookAfter}]; ` +
          `recovery verdicts: ${verdicts.join(" | ") || "none"}`
      );
      if (cause === "lava") test.assert(["lava", "fire", "fireTick"].includes(died.cause), `${player.name} died of ${died.cause}, not in the lava`);
      test.assert(held.join() === String(mark.gen), `after respawn ${def.itemId} is held at gens [${held.join(" ")}], expected once at gen ${mark.gen}`);
      test.assert(ledger === mark.gen, `the ledger moved to gen ${ledger}: ${def.itemId} came back as a loss, not retained`);
      test.assert(atDeath === 0 && ground === 0, `${def.itemId} item entities left on the ground: ${atDeath} at death, ${ground} after the respawn`);
      test.assert(lookAfter === lookBefore, `${def.itemId} came back as [${lookAfter}], was [${lookBefore}]`);
      test.assert(pending === 0 && owed === 0, `a return is still outstanding (pending ${pending}, owed ${owed})`);
      test.assert(verdicts.length === 0, `recovery read the death as a loss: ${verdicts.join(" | ")}`);
    } finally {
      if (dieSub !== undefined) world.afterEvents.entityDie.unsubscribe(dieSub);
      capture.stop();
      cells.restore();
    }
    test.succeed();
  })
    .structureName(STRUCTURE)
    .maxTicks(DEATH_DEADLINE_TICKS + KATANA_SETTLE_TICKS + 200)
    .tag("andrew");
}

deathRetention(DRAGON_KATANA, "legendary_katana_death_kill", "kill", false);
deathRetention(DRAGON_KATANA, "legendary_katana_death_lava", "lava", false);
deathRetention(DRAGON_KATANA, "legendary_katana_death_after_jump", "kill", true);
deathRetention(DRAGON_KATANA, "legendary_katana_death_lava_after_jump", "lava", true);

// Crossbow T19 (L0-sclk-ac19, L0-lgnd-ac27): the same retention, in either hand,
// and the copy that comes back is the same item: Quick Charge, Multishot, the
// anvil name and the lore.
const CROSSBOW_DRESS: Dress = {
  enchants: [
    ["quick_charge", 3],
    ["multishot", 1],
  ],
  nameTag: "Echo",
  lore: ["sk retention"],
};
deathRetention(SCULK_CROSSBOW, "legendary_sculk_crossbow_death_kill", "kill", false, "main", CROSSBOW_DRESS);
deathRetention(SCULK_CROSSBOW, "legendary_sculk_crossbow_death_lava", "lava", false, "main", CROSSBOW_DRESS);
deathRetention(SCULK_CROSSBOW, "legendary_sculk_crossbow_death_offhand", "kill", false, "off", CROSSBOW_DRESS);

// Storm Blade (L0-strm-acr item 6, spec §02): the same retention in either hand,
// with sword enchantments, an anvil name and lore.
const STORM_DRESS: Dress = {
  enchants: [
    ["sharpness", 5],
    ["looting", 3],
  ],
  nameTag: "Thunder",
  lore: ["sb retention"],
};
deathRetention(STORM_BLADE, "legendary_storm_blade_death_kill", "kill", false, "main", STORM_DRESS);
deathRetention(STORM_BLADE, "legendary_storm_blade_death_lava", "lava", false, "main", STORM_DRESS);
deathRetention(STORM_BLADE, "legendary_storm_blade_death_offhand", "kill", false, "off", STORM_DRESS);

// T18 (L0-lgnd-ac24): a Katana that falls into the Void, thrown or inside a
// chest minecart, comes back to its last holder exactly once, at gen + 1.
// Crossbow T20 (L0-lgnd-ac27) and the Storm Blade (L0-strm-acr): the thrown case.

/** Waits for the owner to hold the instance, then a further 40 ticks, and judges "returned exactly once". */
async function judgeVoidReturn(
  test: Test,
  def: LegendaryDef,
  name: string,
  owner: Player,
  mark: Mark,
  lines: string[],
  near: Vector3,
  extra: string,
  lookBefore = lookText(new ItemStack(def.itemId, 1))
): Promise<void> {
  let held: number[] = [];
  let waited = 0;
  for (; waited < VOID_RETURN_TICKS && held.length === 0; waited++) {
    await test.idle(1);
    held = gensOf(def, carried(owner), mark.id);
  }
  await test.idle(40);
  held = gensOf(def, carried(owner), mark.id);
  const ledger = state.ledgerGen(def, mark.id);
  const ground = groundCopies(test.getDimension(), near, def, mark.id).length;
  const losses = lossLines(lines, mark.id);
  const owed = owedEntries(def, mark.id);
  const lookAfter = copiesOf(def, owner, mark.id)
    .map((c) => c.look)
    .join();
  klog(
    `${name} RESULT ${extra}; returned after ${waited} tick(s); owner holds gens [${held.join(" ")}] 40 ticks later, ledger ${ledger}, ` +
      `ground ${ground}, owed ${owed}; look [${lookBefore}] -> [${lookAfter}]; loss lines: ${losses.join(" | ") || "none"}`
  );
  test.assert(lookAfter === lookBefore, `${def.itemId} came back as [${lookAfter}], was [${lookBefore}]`);
  test.assert(held.join() === String(mark.gen + 1), `the owner holds ${def.itemId} at gens [${held.join(" ")}], expected once at gen ${mark.gen + 1}`);
  test.assert(ledger === mark.gen + 1, `the ledger is at gen ${ledger}, expected ${mark.gen + 1}`);
  test.assert(ground === 0, `${ground} copies of ${def.itemId} lie on the ground`);
  test.assert(owed === 0, `${def.itemId} is also owed ${owed} time(s): it would come back twice`);
  test.assert(losses.length === 1, `expected exactly one loss return, got ${losses.length}: ${losses.join(" | ") || "none"}`);
}

function voidThrown(def: LegendaryDef, name: string, who: string, dress: Dress = {}): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const dim = test.getDimension();
    const { player, mark } = await armedHolder(test, STAND_A, who, def, "main", dress);
    const lookBefore = copiesOf(def, player, mark.id)
      .map((c) => c.look)
      .join();
    const capture = captureWarnings();
    try {
      test.assert(player.dropSelectedItem(), `dropSelectedItem refused to throw ${def.itemId}`);
      let thrown: Entity | undefined;
      for (let t = 0; t < 10 && thrown === undefined; t++) {
        await test.idle(1);
        thrown = groundCopies(dim, player.location, def, mark.id)[0]?.entity;
      }
      test.assert(thrown !== undefined, `no ${def.itemId} item entity appeared after the throw`);
      // Watched on the platform first: an item already below the floor at its
      // spawn reads as unloaded with its chunk, not as lost.
      await test.idle(3);
      const entity = thrown as Entity;
      const at = { ...entity.location };
      entity.teleport({ x: at.x, y: dim.heightRange.min - 8, z: at.z });
      await judgeVoidReturn(test, def, name.replace("legendary_", ""), player, mark, capture.lines, at, `${def.itemId} thrown from ${f1(at)} below the floor`, lookBefore);
    } finally {
      capture.stop();
    }
    test.succeed();
  })
    .structureName(STRUCTURE)
    .maxTicks(VOID_RETURN_TICKS + 200)
    .tag("andrew");
}

voidThrown(DRAGON_KATANA, "legendary_katana_void_thrown", "klg_void_thrower");
voidThrown(SCULK_CROSSBOW, "legendary_sculk_crossbow_void_thrown", "sklg_void_thrower", CROSSBOW_DRESS);
voidThrown(STORM_BLADE, "legendary_storm_blade_void_thrown", "sblg_void_thrower", STORM_DRESS);

registerAsync("andrew", "legendary_katana_void_chest_minecart", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const owner = test.spawnSimulatedPlayer(STAND_A, "klg_void_cart", GameMode.Survival);
  const cart = test.spawn("minecraft:chest_minecart", { x: 5, y: 2, z: 3 });
  await test.idle(4);
  const capture = captureWarnings();
  try {
    const mark = state.makeMark("admin", owner);
    const container = cart.getComponent("minecraft:inventory")?.container;
    test.assert(container !== undefined, "the chest minecart has no readable container");
    (container as Container).setItem(0, state.markItem(DRAGON_KATANA, new ItemStack(DRAGON_KATANA.itemId, 1), mark));
    (container as Container).setItem(1, new ItemStack("minecraft:iron_ingot", 3));
    await test.idle(2);
    test.assert(gensOf(DRAGON_KATANA, carried(owner), mark.id).length === 0, "the owner already holds the Katana the minecart is meant to carry");
    const at = { ...cart.location };
    cart.teleport({ x: at.x, y: dim.heightRange.min - 8, z: at.z });
    await judgeVoidReturn(test, DRAGON_KATANA, "katana_void_chest_minecart", owner, mark, capture.lines, at, `minecart from ${f1(at)} below the floor`);
    test.assert(!cart.isValid, "the chest minecart is still in the world below the floor after the return");
  } finally {
    capture.stop();
    if (cart.isValid) cart.remove();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(VOID_RETURN_TICKS + 200)
  .tag("andrew");

// L0-lgnd-r017: a Katana jump trips no loss trigger. A marked Katana lies on the
// ground, the jumper carries a marked Web Sword in the off hand, jumps three
// times, moves on until the ground Katana's chunk unloads, and comes back.
// SimulatedPlayers load no chunks, so ticking areas stand in for "near" and
// "away": one over the ground Katana's chunk and the runway east of it, then
// one over the far end only.

/** Far from every other scenario's site, so nothing else keeps these chunks loaded. */
const R017_OFFSET = { x: -400, z: 300 };
/** The runway: the ground Katana's chunk and five more east of it. */
const R017_CHUNKS = 6;
const R017_JUMPS = 3;
/**
 * Where the jumper walks to: past the server's view distance (BDS default 32
 * chunks). A SimulatedPlayer keeps every chunk within it in memory, so the
 * ground Katana stays a valid entity, though isChunkLoaded reads false, until
 * the player is farther than that (measured: 6 chunks away it never unloaded).
 */
const R017_AWAY_CHUNKS = 48;
const R017_UNLOAD_TICKS = 1200;
const CHUNK = 16;

registerAsync("andrew", "legendary_katana_jump_keeps_recovery", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const kx = Math.floor((origin.x + R017_OFFSET.x) / CHUNK) * CHUNK;
  const kz = Math.floor((origin.z + R017_OFFSET.z) / CHUNK) * CHUNK;
  const lane = kz + 8;
  const runEndX = kx + R017_CHUNKS * CHUNK - 1;
  const runwayBox = { min: [kx, 0, kz] as [number, number, number], max: [runEndX, 0, kz + CHUNK - 1] as [number, number, number] };
  const farX = kx + R017_AWAY_CHUNKS * CHUNK;
  const capture = captureWarnings();
  let unloadRunway: (() => void) | undefined;
  let unloadFar: (() => void) | undefined;
  let ground: Entity | undefined;
  let player: SimulatedPlayer | undefined;
  try {
    const loadedBefore = dim.isChunkLoaded({ x: kx + 8, y: 0, z: lane });
    unloadRunway = await loadBox(test, dim, "andrew_gt_klg_run", runwayBox);
    const top = dim.getTopmostBlock({ x: kx + 8, z: lane });
    test.assert(top !== undefined, `no ground at ${kx + 8},${lane}`);
    const y = (top as NonNullable<typeof top>).location.y + 1;
    dim.fillBlocks(new BlockVolume({ x: kx, y, z: lane - 2 }, { x: runEndX, y: y + 5, z: lane + 2 }), "minecraft:air");

    player = test.spawnSimulatedPlayer(STAND_A, "klg_r017", GameMode.Survival);
    const p = player;
    await test.idle(4);
    const heldMark = state.makeMark("admin", p);
    p.selectedSlotIndex = KATANA_SLOT;
    inventoryOf(p)?.setItem(KATANA_SLOT, state.markItem(DRAGON_KATANA, new ItemStack(DRAGON_KATANA.itemId, 1), heldMark));
    const swordMark = state.makeMark("admin", p);
    const offhand = p.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Offhand, state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), swordMark));
    test.assert(offhand === true, "the off hand refused the marked Web Sword");
    p.teleport({ x: kx + 12.5, y, z: lane + 0.5 });
    await test.idle(4);

    const groundMark = state.makeMark("admin", p);
    const groundAt = { x: kx + 8.5, y: y + 0.2, z: lane + 0.5 };
    ground = dim.spawnItem(state.markItem(DRAGON_KATANA, new ItemStack(DRAGON_KATANA.itemId, 1), groundMark), groundAt);
    ground.clearVelocity();
    await test.idle(10);
    const ids = [groundMark.id, heldMark.id, swordMark.id];
    const watching = (via: string): number => capture.lines.findIndex((l) => l.includes(`watching ${DRAGON_KATANA.itemId} id ${groundMark.id}`) && l.includes(via));
    test.assert(watching("entitySpawn") >= 0, "recovery never started watching the ground Katana");

    const jumps: string[] = [];
    for (let i = 1; i <= R017_JUMPS; i++) {
      clearCooldown(p, DRAGON_KATANA.abilityKey);
      const before = p.dimension.id;
      await faceEast(test, p);
      const jump = await jumpOnce(test, p);
      await test.idle(10);
      const faults = jumpFaults(jump, before);
      if (p.dimension.id !== before) faults.push(`dimension ${before} -> ${p.dimension.id} after landing`);
      jumps.push(`#${i} ${describeJump(jump)}`);
      test.assert(faults.length === 0, `jump ${i}: ${faults.join("; ")}`);
    }

    // Moving on, out of view: only the far chunk stays loaded, so the ground Katana's chunk goes.
    unloadFar = await loadBox(test, dim, "andrew_gt_klg_far", { min: [farX, 0, kz], max: [farX + CHUNK - 1, 0, kz + CHUNK - 1] });
    dim.fillBlocks(new BlockVolume({ x: farX, y, z: lane - 2 }, { x: farX + CHUNK - 1, y: y + 5, z: lane + 2 }), "minecraft:air");
    p.teleport({ x: farX + 8.5, y, z: lane + 0.5 });
    unloadRunway();
    unloadRunway = undefined;
    const unloadedLine = (): number => capture.lines.findIndex((l) => l.includes(`id ${groundMark.id} unloaded with its chunk`));
    let waited = 0;
    for (; waited < R017_UNLOAD_TICKS && unloadedLine() < 0; waited++) await test.idle(1);
    const unloadedAt = unloadedLine();
    const chunkGone = !dim.isChunkLoaded(groundAt);
    test.assert(unloadedAt >= 0, `the ground Katana's chunk never unloaded (${waited} ticks; chunk loaded ${!chunkGone}, before the test ${loadedBefore})`);

    // And back.
    unloadRunway = await loadBox(test, dim, "andrew_gt_klg_run", runwayBox);
    p.teleport({ x: kx + 12.5, y, z: lane + 0.5 });
    unloadFar();
    unloadFar = undefined;
    const rewatched = (): boolean => capture.lines.some((l, i) => i > unloadedAt && l.includes(`watching ${DRAGON_KATANA.itemId} id ${groundMark.id}`) && l.includes("entityLoad"));
    for (let t = 0; t < 200 && !rewatched(); t++) await test.idle(1);
    await test.idle(KATANA_SETTLE_TICKS);

    const lying = groundCopies(dim, groundAt, DRAGON_KATANA, groundMark.id);
    ground = lying[0]?.entity ?? ground;
    const rows = [
      { name: "ground Katana", def: DRAGON_KATANA, mark: groundMark, gens: lying.map((g) => g.gen) },
      { name: "held Katana", def: DRAGON_KATANA, mark: heldMark, gens: gensOf(DRAGON_KATANA, carried(p), heldMark.id) },
      { name: "off-hand Web Sword", def: WEB_SWORD, mark: swordMark, gens: gensOf(WEB_SWORD, carried(p), swordMark.id) },
    ].map((r) => ({ ...r, ledger: state.ledgerGen(r.def, r.mark.id), owed: owedEntries(r.def, r.mark.id) }));
    const verdicts = recoveryVerdicts(capture.lines, ids);
    const katanaOwed = JSON.stringify(state.readOwed(DRAGON_KATANA));
    klog(
      `r017 RESULT jumps: ${jumps.join("; ")}; chunk unloaded after ${waited} tick(s) (isChunkLoaded ${!chunkGone}), re-watched ${rewatched()}; ` +
        rows.map((r) => `${r.name} id ${r.mark.id} gens [${r.gens.join(" ")}] ledger ${r.ledger} owed ${r.owed}`).join("; ") +
        `; dk_owed ${katanaOwed}; recovery verdicts: ${verdicts.join(" | ") || "none"}`
    );
    test.assert(verdicts.length === 0, `recovery read a loss: ${verdicts.join(" | ")}`);
    for (const r of rows) {
      test.assert(r.gens.join() === String(r.mark.gen), `${r.name}: gens [${r.gens.join(" ")}], expected once at gen ${r.mark.gen}`);
      test.assert(r.ledger === r.mark.gen, `${r.name}: the ledger moved to gen ${r.ledger}`);
      test.assert(r.owed === 0, `${r.name}: owed ${r.owed} time(s)`);
    }
    test.assert(rewatched(), "the ground Katana was not watched again after its chunk came back");
  } finally {
    capture.stop();
    if (ground?.isValid) {
      // Unwatched first: a watched item that vanishes on a loaded chunk is a loss.
      forgetWatched(ground.id);
      ground.remove();
    }
    unloadFar?.();
    unloadRunway?.();
    if (player?.isValid) test.removeSimulatedPlayer(player);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(R017_UNLOAD_TICKS + 1200)
  .tag("andrew");
