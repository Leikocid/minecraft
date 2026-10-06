// T15 (L0-sclk-ac15, r005, adr-scpi): Piercing does not stay on a Sculk Crossbow. A SimulatedPlayer has no anvil or
// enchanting-table screen, so the stack carrying Piercing enters the inventory by every server-side path
// CNTR-SCLK-CX01 measured, the in-place /enchant among them; the strip must land in the tick the inventory event
// reports it and leave Quick Charge, Multishot, Unbreaking and the instance mark alone. Each scenario logs
// "[gametest] sculk-enchant <name> RESULT …" lines.

import {
  type Container,
  EnchantmentType,
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
import { SCULK_CROSSBOW } from "../legendary/registry";
import type { Mark } from "../legendary/rules";
import * as state from "../legendary/state";
import { PIERCING, type StripReport, enchantmentsOf, observeStrips } from "../sculk";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 3 };
const CHEST: Vector3 = { x: 5, y: 2, z: 5 };
const VANILLA = "minecraft:crossbow";
/** What the pierced stacks carry besides Piercing, and must still carry after the strip. */
const KEPT = ["quick_charge3", "unbreaking3"];
/** Piercing and Multishot exclude each other in the engine (CNTR-SCLK-CX01 §2): this one never reaches the strip. */
const MULTISHOT = ["multishot1", "quick_charge3", "unbreaking3"];
/** The samples after the put: the strip has landed by the first, and nothing puts Piercing back by the last. */
const SAMPLES = [1, 2, 5, 20];

const log = (msg: string): void => console.warn(`[gametest] sculk-enchant ${msg}`);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const show = (stack: ItemStack | undefined): string => (stack === undefined ? "empty" : `${stack.typeId.replace("minecraft:", "")}[${enchantmentsOf(stack).join("+") || "none"}]`);

function enchanted(id: string, enchants: ReadonlyArray<readonly [string, number]>): ItemStack {
  const stack = new ItemStack(id, 1);
  const enchantable = stack.getComponent("minecraft:enchantable");
  if (enchantable === undefined) throw new Error(`${id} has no minecraft:enchantable`);
  for (const [e, level] of enchants) enchantable.addEnchantment({ type: new EnchantmentType(e), level });
  return stack;
}

function inventoryOf(player: Player): Container {
  const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
  if (container === undefined) throw new Error(`${player.name} has no inventory container`);
  return container;
}

function hasPiercing(stack: ItemStack | undefined): boolean {
  return stack?.getComponent("minecraft:enchantable")?.hasEnchantment(PIERCING) === true;
}

/** Every crossbow stack the player carries, with where it is. */
function crossbows(player: Player, typeId: string): Array<{ where: number | "offhand"; stack: ItemStack }> {
  const out: Array<{ where: number | "offhand"; stack: ItemStack }> = [];
  const container = inventoryOf(player);
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack?.typeId === typeId) out.push({ where: slot, stack });
  }
  const off = state.offhandOf(player);
  if (off?.typeId === typeId) out.push({ where: "offhand", stack: off });
  return out;
}

function enchantCommand(test: Test, player: Player, enchantment: string, level: number): string {
  try {
    return `success=${test.getDimension().runCommand(`enchant "${player.name}" ${enchantment} ${level}`).successCount}`;
  } catch (err) {
    return `threw(${errText(err)})`;
  }
}

interface Case {
  name: string;
  typeId: string;
  /** Enchantments of the stack that enters, Piercing included when it has it. */
  enters: ReadonlyArray<readonly [string, number]>;
  /** What the stack must carry once it settled. */
  expect: string[];
  /** Whether the strip must act. */
  strips: boolean;
  prep?: (player: SimulatedPlayer, inv: Container, stack: ItemStack) => void;
  /** Puts the stack in; a command answers with its result. */
  put: (test: Test, player: SimulatedPlayer, inv: Container, stack: ItemStack) => string | void;
}

const PIERCED: ReadonlyArray<readonly [string, number]> = [
  [PIERCING, 4],
  ["quick_charge", 3],
  ["unbreaking", 3],
];
const MULTI: ReadonlyArray<readonly [string, number]> = [
  ["multishot", 1],
  ["quick_charge", 3],
  ["unbreaking", 3],
];

const CASES: ReadonlyArray<Case> = [
  { name: "setItem_hotbar", typeId: SCULK_CROSSBOW.itemId, enters: PIERCED, expect: KEPT, strips: true, put: (_t, _p, inv, s) => void inv.setItem(0, s) },
  { name: "setItem_slot20", typeId: SCULK_CROSSBOW.itemId, enters: PIERCED, expect: KEPT, strips: true, put: (_t, _p, inv, s) => void inv.setItem(20, s) },
  { name: "addItem", typeId: SCULK_CROSSBOW.itemId, enters: PIERCED, expect: KEPT, strips: true, put: (_t, _p, inv, s) => void inv.addItem(s) },
  {
    name: "chest_transfer",
    typeId: SCULK_CROSSBOW.itemId,
    enters: PIERCED,
    expect: KEPT,
    strips: true,
    put: (test, _p, inv, s) => {
      const chest = test.getBlock(CHEST).getComponent("minecraft:inventory")?.container;
      if (chest === undefined) throw new Error("the chest has no inventory container");
      chest.setItem(0, s);
      chest.transferItem(0, inv);
    },
  },
  {
    name: "pickup",
    typeId: SCULK_CROSSBOW.itemId,
    enters: PIERCED,
    expect: KEPT,
    strips: true,
    put: (test, player, _inv, s) => void test.getDimension().spawnItem(s, player.location),
  },
  {
    // Piercing appears on a stack already in the hand: the anvil's own shape, where the stack the player owns gains it.
    name: "enchant_in_place",
    typeId: SCULK_CROSSBOW.itemId,
    enters: [
      ["quick_charge", 3],
      ["unbreaking", 3],
    ],
    expect: KEPT,
    strips: true,
    prep: (player, inv, s) => {
      player.selectedSlotIndex = 0;
      inv.setItem(0, s);
    },
    put: (test, player) => enchantCommand(test, player, PIERCING, 4),
  },
  // Controls: a Multishot crossbow passes untouched, the engine refuses Piercing on it, and a vanilla crossbow keeps
  // Piercing, which also shows the pierced stacks above really carried it.
  { name: "multishot_untouched", typeId: SCULK_CROSSBOW.itemId, enters: MULTI, expect: MULTISHOT, strips: false, put: (_t, _p, inv, s) => void inv.setItem(0, s) },
  {
    name: "multishot_enchant_piercing_refused",
    typeId: SCULK_CROSSBOW.itemId,
    enters: MULTI,
    expect: MULTISHOT,
    strips: false,
    prep: (player, inv, s) => {
      player.selectedSlotIndex = 0;
      inv.setItem(0, s);
    },
    put: (test, player) => enchantCommand(test, player, PIERCING, 1),
  },
  { name: "vanilla_keeps_piercing", typeId: VANILLA, enters: PIERCED, expect: [`${PIERCING}4`, ...KEPT], strips: false, put: (_t, _p, inv, s) => void inv.setItem(0, s) },
];

registerAsync("andrew", "sculk_enchant_piercing_stripped", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(STAND, "sclk_enchant", GameMode.Survival);
  test.setBlockType("minecraft:chest", CHEST);
  await test.idle(10);
  const inv = inventoryOf(player);
  const strips: StripReport[] = [];
  const arrivals: Array<{ tick: number; slot: number; piercing: boolean }> = [];
  const stopStrips = observeStrips((r) => {
    if (r.playerId === player.id) strips.push(r);
  });
  const arrival = world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    const who: Player | undefined = event.player;
    if (who?.id === player.id && event.itemStack !== undefined && (event.itemStack.typeId === SCULK_CROSSBOW.itemId || event.itemStack.typeId === VANILLA)) {
      arrivals.push({ tick: system.currentTick, slot: event.slot, piercing: hasPiercing(event.itemStack) });
    }
  });
  const faults: string[] = [];
  try {
    for (const c of CASES) {
      inv.clearAll();
      const mark: Mark = state.makeMark("admin", player);
      const fresh = enchanted(c.typeId, c.enters);
      const stack = c.typeId === SCULK_CROSSBOW.itemId ? state.markItem(SCULK_CROSSBOW, fresh, mark) : fresh;
      c.prep?.(player, inv, stack);
      await test.idle(3);
      strips.length = 0;
      arrivals.length = 0;

      const t0 = system.currentTick;
      let put: string | void;
      try {
        put = c.put(test, player, inv, stack);
      } catch (err) {
        put = `threw(${errText(err)})`;
      }
      const sync = crossbows(player, c.typeId).map((x) => show(x.stack)).join(",") || "none";
      const samples: string[] = [];
      let elapsed = 0;
      for (const d of SAMPLES) {
        await test.idle(d - elapsed);
        elapsed = d;
        samples.push(`+${system.currentTick - t0}=${crossbows(player, c.typeId).map((x) => `${x.where}:${show(x.stack)}`).join(",") || "none"}`);
      }

      const held = crossbows(player, c.typeId);
      const got = held.length === 1 ? enchantmentsOf(held[0].stack) : [];
      const now = held.length === 1 && c.typeId === SCULK_CROSSBOW.itemId ? state.getMark(SCULK_CROSSBOW, held[0].stack) : undefined;
      const pierced = arrivals.find((a) => a.piercing);
      log(
        `strip ${c.name} RESULT put ${put || "ok"}; sync after the put ${sync}; ` +
          `inventory events [${arrivals.map((a) => `+${a.tick - t0}#${a.slot}:piercing=${a.piercing}`).join(" ") || "none"}]; ` +
          `strips [${strips.map((s) => `+${s.tick - t0}:${s.where}:${s.trigger}:piercing${s.level}:kept ${s.kept.join("+")}`).join(" ") || "none"}]; ` +
          `${samples.join(" ")}; mark ${c.typeId !== SCULK_CROSSBOW.itemId ? "n/a" : now === undefined ? "LOST" : `id ${now.id === mark.id ? "same" : now.id} gen ${now.gen}/${mark.gen}`}`
      );

      const fault = (msg: string): void => void faults.push(`${c.name}: ${msg}`);
      if (held.length !== 1) fault(`the player carries ${held.length} copies, expected exactly 1`);
      if (got.join("+") !== c.expect.join("+")) fault(`the stack settled as [${got.join("+")}], expected [${c.expect.join("+")}]`);
      if (c.typeId === SCULK_CROSSBOW.itemId && (now === undefined || now.id !== mark.id || now.gen !== mark.gen)) fault("the instance mark did not survive");
      if (c.strips) {
        if (pierced === undefined) fault("no inventory event reported the stack with piercing, so nothing was put to the strip");
        if (strips.length !== 1) fault(`${strips.length} strips, expected exactly 1`);
        else if (pierced !== undefined && strips[0].tick !== pierced.tick) fault(`stripped ${strips[0].tick - pierced.tick} tick(s) after the inventory event reported it, expected the same tick`);
        else if (strips[0].level !== 4) fault(`stripped piercing ${strips[0].level}, expected 4`);
      } else if (strips.length !== 0) {
        fault(`${strips.length} strip(s) on a stack the strip must leave alone`);
      }
    }
  } finally {
    stopStrips();
    world.afterEvents.playerInventoryItemChange.unsubscribe(arrival);
    inv.clearAll();
    test.setBlockType("minecraft:air", CHEST);
  }
  test.assert(faults.length === 0, faults.join(" | "));
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// The second trigger (r005): no inventory event names the off hand, so a crossbow that reaches it with Piercing is
// stripped when the player next changes the hotbar slot.
registerAsync("andrew", "sculk_enchant_piercing_hand_change", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(STAND, "sclk_enchant_hand", GameMode.Survival);
  await test.idle(10);
  const strips: StripReport[] = [];
  const stopStrips = observeStrips((r) => {
    if (r.playerId === player.id) strips.push(r);
  });
  const changes: number[] = [];
  const change = world.afterEvents.playerHotbarSelectedSlotChange.subscribe((event) => {
    const who: Player | undefined = event.player;
    if (who?.id === player.id) changes.push(system.currentTick);
  });
  try {
    const mark = state.makeMark("admin", player);
    player.selectedSlotIndex = 0;
    await test.idle(2);
    const equippable = player.getComponent(EntityComponentTypes.Equippable);
    test.assert(equippable !== undefined, "the player has no equippable component");
    const put = equippable?.setEquipment(EquipmentSlot.Offhand, state.markItem(SCULK_CROSSBOW, enchanted(SCULK_CROSSBOW.itemId, PIERCED), mark));
    test.assert(put === true, "the off hand refused the Sculk Crossbow");
    await test.idle(5);
    const before = show(state.offhandOf(player));
    const stripsBefore = strips.length;

    const t0 = system.currentTick;
    player.selectedSlotIndex = 3;
    await test.idle(2);
    const after = state.offhandOf(player);
    const now = after === undefined ? undefined : state.getMark(SCULK_CROSSBOW, after);
    log(
      `hand RESULT off hand 5 ticks after the put ${before} (strips ${stripsBefore}); hotbar change events [${changes.map((t) => `+${t - t0}`).join(" ") || "none"}]; ` +
        `strips [${strips.map((s) => `+${s.tick - t0}:${s.where}:${s.trigger}:piercing${s.level}`).join(" ") || "none"}]; off hand after ${show(after)}; ` +
        `mark ${now === undefined ? "LOST" : `id ${now.id === mark.id ? "same" : now.id} gen ${now.gen}/${mark.gen}`}`
    );
    test.assert(hasPiercing(state.offhandOf(player)) === false, `the off-hand crossbow still has piercing after the hand change: ${show(after)}`);
    test.assert(enchantmentsOf(after).join("+") === KEPT.join("+"), `the off-hand crossbow settled as ${show(after)}, expected [${KEPT.join("+")}]`);
    test.assert(strips.length - stripsBefore === 1 && strips[strips.length - 1].where === "offhand" && strips[strips.length - 1].trigger === "hand", "the strip did not come from the hand trigger on the off hand");
    test.assert(now !== undefined && now.id === mark.id && now.gen === mark.gen, "the instance mark did not survive the strip");
  } finally {
    stopStrips();
    world.afterEvents.playerHotbarSelectedSlotChange.unsubscribe(change);
    player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Offhand, undefined);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");
