// Loss return against pickups the recovery heuristic cannot see, and debts of
// one owner that must not overwrite each other (CX-lgnd-09 items 2–3;
// L0-lgnd-ad02, r005, ent4, p003).
//
// The oracle reads the persisted keys itself — the stack's `andrew:ws_gen`
// and the world ledger `andrew:ws_gen:<id>`, both absent = 0 — rather than
// asking src/legendary whether a copy is live, so a wrong liveness rule in the
// code under test cannot pass its own test.

import {
  BlockPermutation,
  type Container,
  Direction,
  type Dimension,
  type Entity,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { WEB_SWORD } from "../legendary/registry";
import type { Mark } from "../legendary/rules";
import * as state from "../legendary/state";

const STRUCTURE = "andrew:platform";
const STAND_A: Vector3 = { x: 2, y: 2, z: 5 };
const STAND_B: Vector3 = { x: 4, y: 2, z: 5 };

/** Four 40-tick recovery checks: a loss return, if one is coming, has landed. */
const WAIT_TICKS = 160;

const KEY = `andrew:${WEB_SWORD.keyPrefix}_`;

const log = (msg: string): void => console.warn(`[gametest] recovery-gen ${msg}`);

function ledgerGen(id: string): number {
  const raw = world.getDynamicProperty(`${KEY}gen:${id}`);
  return typeof raw === "number" ? raw : 0;
}

function stackGen(stack: ItemStack): number {
  const raw = stack.getDynamicProperty(`${KEY}gen`);
  return typeof raw === "number" ? raw : 0;
}

function isInstance(stack: ItemStack | undefined, id: string): stack is ItemStack {
  return state.isItemOf(WEB_SWORD, stack) && state.getMark(WEB_SWORD, stack)?.id === id;
}

/** Generations of every copy of `id` in `container`; undefined when there is no container. */
function gensIn(container: Container | undefined, id: string): number[] | undefined {
  if (container === undefined) return undefined;
  const gens: number[] = [];
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (isInstance(stack, id)) gens.push(stackGen(stack));
  }
  return gens;
}

function gensOnGround(test: Test, id: string): number[] {
  return test
    .getDimension()
    .getEntities({ type: "minecraft:item", location: test.worldLocation({ x: 3, y: 2, z: 3 }), maxDistance: 16 })
    .map((e) => e.getComponent("minecraft:item")?.itemStack)
    .filter((s): s is ItemStack => isInstance(s, id))
    .map(stackGen);
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
function owedFor(ownerId: string): string {
  const raw = world.getDynamicProperty(`${KEY}owed`);
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
  const gens = ids.map(ledgerGen);
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
