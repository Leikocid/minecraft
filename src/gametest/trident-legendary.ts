// The Above-Water Trident (def #7) under the legendary rules (L0-trdt-a005; L0-trdt-adcl T1–T7; spec §01, §02 last
// item). The framework's own scenarios run with def #7 — death and the chest, the Void to the last holder online,
// offline and dead, a destroyed minecart — and the hazard grid in legendary-fireproof.ts runs every def in
// LEGENDARIES. The scenarios below hold what is the trident's own: the Loyalty and Riptide scrub, a chest destroyed
// around it, the custody fallback through deliverToLastHolder, the departure watch against a throw, and the magnet
// against a custody entity.
//
// The throw itself belongs to src/trident/ (TRDT-THROW-01-AA). Where a scenario needs a copy in custody it applies
// the throw's own write order to the slot (L0-trdt-adcl §2: record, clear the hand slot, spawn and launch); once the
// product throw is armed and takes the release first, the departure scenario reads that and judges the product throw.
// Each scenario logs "[gametest] trident-lgnd <name> RESULT …" lines.

import {
  type Container,
  Difficulty,
  EnchantmentType,
  EntityComponentTypes,
  EntityTypes,
  EquipmentSlot,
  type Entity,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { FORBIDDEN_ENCHANTMENTS, type ScrubReport, enchantmentsOf, observeScrubs } from "../legendary/enchant";
import { deliverToLastHolder, forgetWatched } from "../legendary/recovery";
import { STORM_BLADE, TRIDENT, genLedgerKey } from "../legendary/registry";
import type { Mark } from "../legendary/rules";
import * as state from "../legendary/state";
import { IRON_TAG } from "../ufo/event";
import { GROUND, HOLDER, STACK, magnetOn } from "../ufo/magnet-select";
import { chestStays } from "./legendary-fireproof";
import { type Dress, PICKUP_TICKS, VOID_RETURN_TICKS, WAIT_TICKS, deathRetention, holderDeadRedeemed, holderOffline, transferThenVoid, voidThrown } from "./legendary-recovery";
import { MINECART, holderScenario } from "./legendary-ufo";
import { assertClean, clearItems, containerAt, describe, dress, host, middle, at as onPad, pad, removeAll, setBlock, spawnStill, stackOf } from "./ufo-magnet-select";

const STRUCTURE = "andrew:platform";

const log = (msg: string): void => console.warn(`[gametest] trident-lgnd ${msg}`);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

type Enchants = ReadonlyArray<readonly [string, number]>;

/** Recorded besides the mark on every copy that comes back: kept trident enchantments, an anvil name and lore. */
const TRIDENT_DRESS: Dress = {
  enchants: [
    ["unbreaking", 3],
    ["impaling", 5],
  ],
  nameTag: "Undertow",
  lore: ["tr retention"],
};

// ------------------------------------------------ the framework's scenarios with def #7 (T1)

deathRetention(TRIDENT, "legendary_trident_death_kill", "kill", false, "main", TRIDENT_DRESS);
deathRetention(TRIDENT, "legendary_trident_death_lava", "lava", false, "main", TRIDENT_DRESS);
deathRetention(TRIDENT, "legendary_trident_death_offhand", "kill", false, "off", TRIDENT_DRESS);
chestStays("legendary_trident_in_a_chest_stays_there", TRIDENT, "andrew_tr_chest_keeper");
voidThrown(TRIDENT, "legendary_trident_void_thrown", "trlg_void_thrower", TRIDENT_DRESS);

registerAsync("andrew", "legendary_trident_hold_void_after_transfer", transferThenVoid("tr_online", false, TRIDENT))
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + VOID_RETURN_TICKS + 200)
  .tag("andrew");

registerAsync("andrew", "legendary_trident_hold_void_holder_offline", holderOffline("tr_off", TRIDENT))
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + WAIT_TICKS + 120)
  .tag("andrew");

registerAsync("andrew", "legendary_trident_hold_void_holder_dead_redeemed", holderDeadRedeemed("tr_dead", TRIDENT))
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + WAIT_TICKS + VOID_RETURN_TICKS + 200)
  .tag("andrew");

holderScenario("legendary_trident_holder_chest_minecart", "tr_chest_cart", "minecraft:chest_minecart", MINECART, TRIDENT);

// ------------------------------------------------ shared reads

function inventoryOf(player: Player): Container {
  const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
  if (container === undefined) throw new Error(`${player.name} has no inventory container`);
  return container;
}

/** Records what the modules under test print, so a missing line is an observation, not an inference. */
function captureWarnings(): { lines: string[]; stop(): void } {
  const original = console.warn;
  const lines: string[] = [];
  console.warn = (...args: unknown[]): void => {
    lines.push(args.map(String).join(" "));
    original(...args);
  };
  return { lines, stop: () => void (console.warn = original) };
}

function markOf(stack: ItemStack | undefined): Mark | undefined {
  return state.isItemOf(TRIDENT, stack) ? state.getMark(TRIDENT, stack) : undefined;
}

/** Every copy of instance `id` a player carries, inventory and off hand, with its generation. */
function carriedGens(player: Player, id: string): number[] {
  const gens: number[] = [];
  const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
  for (let slot = 0; container !== undefined && slot < container.size; slot++) {
    const mark = markOf(container.getItem(slot));
    if (mark?.id === id) gens.push(mark.gen);
  }
  const off = markOf(state.offhandOf(player));
  if (off?.id === id) gens.push(off.gen);
  return gens;
}

/** Item entities of instance `id` within `radius` of `at`. */
function groundOf(test: Test, at: Vector3, id: string, radius = 32): Array<{ entity: Entity; gen: number }> {
  return test
    .getDimension()
    .getEntities({ type: "minecraft:item", location: at, maxDistance: radius })
    .flatMap((entity) => {
      const mark = markOf(entity.isValid ? entity.getComponent("minecraft:item")?.itemStack : undefined);
      return mark?.id === id ? [{ entity, gen: mark.gen }] : [];
    });
}

/** Return targets whose owed entry names instance `id`. */
function owedTargets(id: string): string[] {
  return Object.entries(state.readOwed(TRIDENT))
    .filter(([, entries]) => entries.some((e) => e.mark.id === id))
    .map(([target]) => target);
}

/** Lines in which recovery reads `id` as lost: every loss path prints "now gen" or "already stale". */
const lossLines = (lines: string[], id: string): string[] =>
  lines.filter((l) => l.includes("legendary recovery:") && l.includes(`id ${id}`) && (l.includes("now gen") || l.includes("already stale")));

/** The departure watch's verdicts on `id`: resolved as a drop, either found or lost (T3). */
const departureLines = (lines: string[], id: string): string[] =>
  lines.filter((l) => l.includes("legendary recovery:") && l.includes(`id ${id}`) && l.includes("left an inventory"));

function enchanted(typeId: string, enchants: Enchants): { stack: ItemStack; refused: string[] } {
  const stack = new ItemStack(typeId, 1);
  const enchantable = stack.getComponent("minecraft:enchantable");
  const refused: string[] = [];
  for (const [id, level] of enchants) {
    try {
      if (enchantable === undefined) throw new Error("no minecraft:enchantable");
      enchantable.addEnchantment({ type: new EnchantmentType(id), level });
    } catch (err) {
      refused.push(`${id}${level} (${errText(err)})`);
    }
  }
  return { stack, refused };
}

const show = (stack: ItemStack | undefined): string =>
  stack === undefined ? "empty" : `${stack.typeId.replace("minecraft:", "").replace("andrew:", "")}[${enchantmentsOf(stack).join("+") || "none"}]`;

const FORBIDDEN = FORBIDDEN_ENCHANTMENTS.get(TRIDENT.itemId) ?? [];
const carriesForbidden = (stack: ItemStack | undefined): boolean =>
  FORBIDDEN.some((id) => stack?.getComponent("minecraft:enchantable")?.hasEnchantment(id) === true);

// ------------------------------------------------ R-trdt-003: Loyalty and Riptide never stay, everything else does

const SCRUB_STAND: Vector3 = { x: 3, y: 2, z: 3 };
const SCRUB_CHEST: Vector3 = { x: 5, y: 2, z: 5 };
/** The samples after the put: the scrub has landed by the first, and nothing puts the enchantment back by the last. */
const SAMPLES = [1, 2, 5, 20];

interface ScrubCase {
  name: string;
  typeId: string;
  /** Enchantments of the stack before it is put in. */
  enters: Enchants;
  /** What the stack must carry once it settled, sorted `id` + level. */
  expect: string[];
  /** Whether the scrub must act. */
  scrubs: boolean;
  prep?: (player: SimulatedPlayer, inv: Container, stack: ItemStack) => void;
  /** Puts the stack in; a command answers with its result. */
  put: (test: Test, player: SimulatedPlayer, inv: Container, stack: ItemStack) => string | void;
}

function enchantCommand(test: Test, player: Player, enchantment: string, level: number): string {
  try {
    return `success=${test.getDimension().runCommand(`enchant "${player.name}" ${enchantment} ${level}`).successCount}`;
  } catch (err) {
    return `threw(${errText(err)})`;
  }
}

const inHand = (player: SimulatedPlayer, inv: Container, stack: ItemStack): void => {
  player.selectedSlotIndex = 0;
  inv.setItem(0, stack);
};

const SCRUB_CASES: ReadonlyArray<ScrubCase> = [
  {
    name: "setItem_hotbar_loyalty",
    typeId: TRIDENT.itemId,
    enters: [
      ["loyalty", 3],
      ["unbreaking", 3],
      ["impaling", 5],
    ],
    expect: ["impaling5", "unbreaking3"],
    scrubs: true,
    put: (_t, _p, inv, s) => void inv.setItem(0, s),
  },
  {
    name: "setItem_slot20_riptide",
    typeId: TRIDENT.itemId,
    enters: [
      ["riptide", 3],
      ["unbreaking", 3],
      ["impaling", 5],
    ],
    expect: ["impaling5", "unbreaking3"],
    scrubs: true,
    put: (_t, _p, inv, s) => void inv.setItem(20, s),
  },
  {
    name: "addItem_loyalty_channeling",
    typeId: TRIDENT.itemId,
    enters: [
      ["loyalty", 3],
      ["channeling", 1],
      ["unbreaking", 3],
    ],
    expect: ["channeling1", "unbreaking3"],
    scrubs: true,
    put: (_t, _p, inv, s) => void inv.addItem(s),
  },
  {
    name: "chest_transfer_riptide",
    typeId: TRIDENT.itemId,
    enters: [
      ["riptide", 3],
      ["unbreaking", 3],
    ],
    expect: ["unbreaking3"],
    scrubs: true,
    put: (test, _p, inv, s) => {
      const chest = test.getBlock(SCRUB_CHEST).getComponent("minecraft:inventory")?.container;
      if (chest === undefined) throw new Error("the chest has no inventory container");
      chest.setItem(0, s);
      chest.transferItem(0, inv);
    },
  },
  {
    name: "pickup_loyalty_mending",
    typeId: TRIDENT.itemId,
    enters: [
      ["loyalty", 3],
      ["mending", 1],
      ["unbreaking", 3],
    ],
    expect: ["mending1", "unbreaking3"],
    scrubs: true,
    put: (test, player, _inv, s) => void test.getDimension().spawnItem(s, player.location),
  },
  {
    // The anvil's own shape: the stack the player already holds gains the enchantment.
    name: "enchant_in_place_loyalty",
    typeId: TRIDENT.itemId,
    enters: [["unbreaking", 3]],
    expect: ["unbreaking3"],
    scrubs: true,
    prep: inHand,
    put: (test, player) => enchantCommand(test, player, "loyalty", 3),
  },
  {
    name: "enchant_in_place_riptide",
    typeId: TRIDENT.itemId,
    enters: [
      ["unbreaking", 3],
      ["impaling", 5],
    ],
    expect: ["impaling5", "unbreaking3"],
    scrubs: true,
    prep: inHand,
    put: (test, player) => enchantCommand(test, player, "riptide", 3),
  },
  {
    // Loyalty, Riptide and Unbreaking III together (L0-trdt-a005); whether the engine admits the pair is logged.
    name: "loyalty_riptide_unbreaking",
    typeId: TRIDENT.itemId,
    enters: [
      ["loyalty", 3],
      ["riptide", 3],
      ["unbreaking", 3],
    ],
    expect: ["unbreaking3"],
    scrubs: true,
    put: (_t, _p, inv, s) => void inv.setItem(0, s),
  },
  // Controls: the trident's other enchantments pass untouched, and a vanilla trident keeps Loyalty — which also shows
  // the stacks above really carried it.
  {
    name: "kept_untouched",
    typeId: TRIDENT.itemId,
    enters: [
      ["unbreaking", 3],
      ["impaling", 5],
      ["channeling", 1],
      ["mending", 1],
    ],
    expect: ["channeling1", "impaling5", "mending1", "unbreaking3"],
    scrubs: false,
    put: (_t, _p, inv, s) => void inv.setItem(0, s),
  },
  {
    name: "vanilla_keeps_loyalty",
    typeId: "minecraft:trident",
    enters: [
      ["loyalty", 3],
      ["unbreaking", 3],
    ],
    expect: ["loyalty3", "unbreaking3"],
    scrubs: false,
    put: (_t, _p, inv, s) => void inv.setItem(0, s),
  },
];

/** Every stack of `typeId` the player carries, with where it is. */
function stacksOf(player: Player, typeId: string): Array<{ where: number | "offhand"; stack: ItemStack }> {
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

registerAsync("andrew", "trident_enchant_scrub", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(SCRUB_STAND, "trlg_scrub", GameMode.Survival);
  test.setBlockType("minecraft:chest", SCRUB_CHEST);
  await test.idle(10);
  const inv = inventoryOf(player);
  const scrubs: ScrubReport[] = [];
  const arrivals: Array<{ tick: number; slot: number; forbidden: boolean }> = [];
  const stopScrubs = observeScrubs((r) => {
    if (r.playerId === player.id) scrubs.push(r);
  });
  const arrival = world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    const who: Player | undefined = event.player;
    const typeId = event.itemStack?.typeId;
    if (who?.id === player.id && (typeId === TRIDENT.itemId || typeId === "minecraft:trident")) {
      arrivals.push({ tick: system.currentTick, slot: event.slot, forbidden: carriesForbidden(event.itemStack) });
    }
  });
  const faults: string[] = [];
  try {
    for (const c of SCRUB_CASES) {
      inv.clearAll();
      const mark: Mark = state.makeMark("admin", player);
      const made = enchanted(c.typeId, c.enters);
      const entered = enchantmentsOf(made.stack);
      const stack = c.typeId === TRIDENT.itemId ? state.markItem(TRIDENT, made.stack, mark) : made.stack;
      c.prep?.(player, inv, stack);
      await test.idle(3);
      scrubs.length = 0;
      arrivals.length = 0;

      const t0 = system.currentTick;
      let put: string | void;
      try {
        put = c.put(test, player, inv, stack);
      } catch (err) {
        put = `threw(${errText(err)})`;
      }
      const sync = stacksOf(player, c.typeId).map((x) => show(x.stack)).join(",") || "none";
      const samples: string[] = [];
      let elapsed = 0;
      for (const d of SAMPLES) {
        await test.idle(d - elapsed);
        elapsed = d;
        samples.push(`+${system.currentTick - t0}=${stacksOf(player, c.typeId).map((x) => `${x.where}:${show(x.stack)}`).join(",") || "none"}`);
      }

      const held = stacksOf(player, c.typeId);
      const got = held.length === 1 ? enchantmentsOf(held[0].stack) : [];
      const now = held.length === 1 ? markOf(held[0].stack) : undefined;
      const flagged = arrivals.find((a) => a.forbidden);
      log(
        `scrub ${c.name} RESULT built [${entered.join("+")}]${made.refused.length > 0 ? ` (refused ${made.refused.join(", ")})` : ""}; put ${put || "ok"}; ` +
          `sync after the put ${sync}; inventory events [${arrivals.map((a) => `+${a.tick - t0}#${a.slot}:forbidden=${a.forbidden}`).join(" ") || "none"}]; ` +
          `scrubs [${scrubs.map((s) => `+${s.tick - t0}:${s.where}:${s.trigger}:-${s.removed.join("+")}:kept ${s.kept.join("+")}`).join(" ") || "none"}]; ` +
          `${samples.join(" ")}; mark ${c.typeId !== TRIDENT.itemId ? "n/a" : now === undefined ? "LOST" : `id ${now.id === mark.id ? "same" : now.id} gen ${now.gen}/${mark.gen}`}`
      );

      const fault = (msg: string): void => void faults.push(`${c.name}: ${msg}`);
      if (held.length !== 1) fault(`the player carries ${held.length} copies, expected exactly 1`);
      if (got.join("+") !== c.expect.join("+")) fault(`the stack settled as [${got.join("+")}], expected [${c.expect.join("+")}]`);
      if (c.typeId === TRIDENT.itemId && (now === undefined || now.id !== mark.id || now.gen !== mark.gen)) fault("the instance mark did not survive");
      if (c.scrubs) {
        if (flagged === undefined) fault("no inventory event reported the stack with Loyalty or Riptide, so nothing was put to the scrub");
        if (scrubs.length !== 1) fault(`${scrubs.length} scrubs, expected exactly 1`);
        else if (flagged !== undefined && scrubs[0].tick !== flagged.tick) fault(`scrubbed ${scrubs[0].tick - flagged.tick} tick(s) after the inventory event reported it, expected the same tick`);
        else if (scrubs[0].kept.join("+") !== c.expect.join("+")) fault(`the scrub kept [${scrubs[0].kept.join("+")}], expected [${c.expect.join("+")}]`);
      } else if (scrubs.length !== 0) {
        fault(`${scrubs.length} scrub(s) on a stack the scrub must leave alone`);
      }
      // Only the in-place cases hold the stack before the put, and their put is an /enchant.
      if (c.prep !== undefined && !String(put).startsWith("success=1")) fault(`the /enchant that adds the enchantment answered ${String(put)}`);
    }

    // The second trigger: no inventory event names the off hand, so a trident that reaches it with Loyalty is
    // scrubbed when the player next changes the hotbar slot.
    inv.clearAll();
    player.selectedSlotIndex = 0;
    await test.idle(2);
    const mark = state.makeMark("admin", player);
    const off = enchanted(TRIDENT.itemId, [
      ["loyalty", 3],
      ["unbreaking", 3],
    ]);
    state.setOffhand(player, state.markItem(TRIDENT, off.stack, mark));
    await test.idle(5);
    const before = state.offhandOf(player);
    scrubs.length = 0;
    const t0 = system.currentTick;
    player.selectedSlotIndex = 3;
    await test.idle(2);
    const after = state.offhandOf(player);
    const now = markOf(after);
    log(
      `scrub offhand_hand_change RESULT off hand 5 ticks after the put ${show(before)}; scrubs [${scrubs
        .map((s) => `+${s.tick - t0}:${s.where}:${s.trigger}:-${s.removed.join("+")}`)
        .join(" ") || "none"}]; off hand after ${show(after)}; mark ${now === undefined ? "LOST" : `id ${now.id === mark.id ? "same" : now.id} gen ${now.gen}/${mark.gen}`}`
    );
    if (!carriesForbidden(before)) faults.push("offhand: the off-hand trident had no Loyalty before the hand change, so the case proves nothing");
    if (enchantmentsOf(after).join("+") !== "unbreaking3") faults.push(`offhand: the off-hand trident settled as ${show(after)}, expected [unbreaking3]`);
    if (scrubs.length !== 1 || scrubs[0].where !== "offhand" || scrubs[0].trigger !== "hand") faults.push("offhand: the scrub did not come from the hand trigger on the off hand");
    if (now === undefined || now.id !== mark.id || now.gen !== mark.gen) faults.push("offhand: the instance mark did not survive the scrub");
  } finally {
    stopScrubs();
    world.afterEvents.playerInventoryItemChange.unsubscribe(arrival);
    inv.clearAll();
    player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Offhand, undefined);
    test.setBlockType("minecraft:air", SCRUB_CHEST);
  }
  test.assert(faults.length === 0, faults.join(" | "));
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

/**
 * The death restore mints a new stack from the pending entry's look (retention `grant`). A trident that reached the
 * off hand with Loyalty — no inventory event names it — dies with Loyalty in its look; the restored copy enters the
 * inventory, and the scrub takes Loyalty off there. Same id, same generation, Unbreaking kept.
 */
registerAsync("andrew", "trident_enchant_scrub_death_restore", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(SCRUB_STAND, "trlg_scrub_death", GameMode.Survival);
  await test.idle(6);
  const scrubs: ScrubReport[] = [];
  const stopScrubs = observeScrubs((r) => {
    if (r.playerId === player.id) scrubs.push(r);
  });
  const capture = captureWarnings();
  let died = false;
  const dieSub = world.afterEvents.entityDie.subscribe((event) => {
    if (event.deadEntity?.id === player.id) died = true;
  });
  try {
    const mark = state.makeMark("admin", player);
    const made = enchanted(TRIDENT.itemId, [
      ["loyalty", 3],
      ["unbreaking", 3],
    ]);
    state.setOffhand(player, state.markItem(TRIDENT, made.stack, mark));
    await test.idle(5);
    const before = state.offhandOf(player);
    test.assert(carriesForbidden(before), `the off-hand trident reads ${show(before)} before the death: no Loyalty, so the case proves nothing`);

    player.kill();
    for (let t = 0; t < 40 && !died; t++) await test.idle(1);
    test.assert(died, `${player.name} did not die`);
    await test.idle(10);
    scrubs.length = 0;
    player.respawn();
    let gens: number[] = [];
    for (let t = 0; t < 100 && gens.length === 0; t++) {
      await test.idle(1);
      gens = carriedGens(player, mark.id);
    }
    await test.idle(5);
    gens = carriedGens(player, mark.id);
    const back = stacksOf(player, TRIDENT.itemId).find((x) => markOf(x.stack)?.id === mark.id);
    const granted = capture.lines.filter((l) => l.includes("legendary retention: returned") && l.includes(`id ${mark.id}`));
    log(
      `scrub death_restore RESULT off hand before the death ${show(before)}; restore: ${granted.join(" | ") || "none"}; ` +
        `held gens [${gens.join(" ")}] at ${back?.where ?? "-"} as ${show(back?.stack)}; scrubs [${scrubs.map((s) => `${s.where}:${s.trigger}:-${s.removed.join("+")}`).join(" ") || "none"}]; ` +
        `ledger ${state.ledgerGen(TRIDENT, mark.id)}`
    );
    test.assert(gens.join() === String(mark.gen), `the restored trident is held at gens [${gens.join(" ")}], expected once at gen ${mark.gen}`);
    test.assert(granted.length === 1 && granted[0].includes("loyalty3"), `the restore did not mint the copy with Loyalty from its look: ${granted.join(" | ") || "none"}`);
    test.assert(enchantmentsOf(back?.stack).join("+") === "unbreaking3", `the restored trident settled as ${show(back?.stack)}, expected [unbreaking3]`);
    test.assert(scrubs.length === 1 && scrubs[0].removed.join("+") === "loyalty3", `expected one scrub taking loyalty3 off the restored copy, got ${scrubs.length}`);
  } finally {
    stopScrubs();
    capture.stop();
    world.afterEvents.entityDie.unsubscribe(dieSub);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ------------------------------------------------ custody stand-in: the throw's write order (L0-trdt-adcl §2)

/** The product's custody entity (no gravity, no collision, invulnerable); its snowball runtime where a build lacks it. */
const CUSTODY_TYPE = "andrew:trident_in_flight";
const custodyType = (): string => (EntityTypes.get(CUSTODY_TYPE) !== undefined ? CUSTODY_TYPE : "minecraft:snowball");

interface Custody {
  /** The record: an in-memory clone of the thrown stack, mark and look included. */
  stack: ItemStack;
  mark: Mark;
  entity: Entity | undefined;
  tick: number;
  note: string;
}

/** Record, clear the hand slot, spawn and launch — in one synchronous turn. Undefined when the slot holds no trident. */
function standInThrow(player: Player, slot: number): Custody | undefined {
  const container = inventoryOf(player);
  const held = container.getItem(slot);
  const mark = markOf(held);
  if (held === undefined || mark === undefined) return undefined;
  const custody: Custody = { stack: held.clone(), mark: state.withLook(mark, held), entity: undefined, tick: system.currentTick, note: "" };
  container.setItem(slot, undefined);
  try {
    const head = player.getHeadLocation();
    const view = player.getViewDirection();
    const type = custodyType();
    const entity = player.dimension.spawnEntity(type, { x: head.x + view.x, y: head.y + view.y, z: head.z + view.z });
    entity.getComponent("minecraft:projectile")?.shoot({ x: view.x * 1.5, y: view.y * 1.5 + 0.2, z: view.z * 1.5 });
    custody.entity = entity;
    custody.note = `${type} ${entity.id}`;
  } catch (err) {
    custody.note = `no entity (${errText(err)})`;
  }
  return custody;
}

/** The normal return (L0-trdt-adcl §3): the entity goes, the clone goes back into the selected slot if it is empty. */
function standInReturn(player: Player, custody: Custody): string {
  if (custody.entity?.isValid === true) custody.entity.remove();
  const container = inventoryOf(player);
  const slot = player.selectedSlotIndex;
  if (container.getItem(slot) === undefined) {
    container.setItem(slot, custody.stack);
    return `selected slot ${slot}`;
  }
  return container.addItem(custody.stack) === undefined ? "addItem" : "inventory full";
}

// ------------------------------------------------ T3 (L0-trdt-a005): a throw is not a departure the watch resolves

const THROW_STAND: Vector3 = { x: 3, y: 2, z: 1 };
/** Charge before the release: the throw needs 10 ticks (L0-trdt-pmov). */
const CHARGE_TICKS = 12;
/** Two recovery check periods after the release: the departure is resolved by the first check past its grace. */
const OBSERVE_TICKS = 80;
const PRODUCT_RETURN_TICKS = 200;

registerAsync("andrew", "trident_throw_departure_not_a_loss", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const player = test.spawnSimulatedPlayer(THROW_STAND, "trlg_thrower", GameMode.Survival);
  await test.idle(4);
  const mark = state.makeMark("admin", player);
  player.setItem(state.markItem(TRIDENT, new ItemStack(TRIDENT.itemId, 1), mark), 0, true);
  await test.idle(6);

  const capture = captureWarnings();
  const swings: string[] = [];
  const swingSub = world.afterEvents.playerSwingStart.subscribe((event) => {
    const who: Player | undefined = event.player;
    if (who?.id === player.id) swings.push(`${event.swingSource}@${system.currentTick}`);
  });
  let custody: Custody | undefined;
  let release: { tick: number; by: string } | undefined;
  const releaseSub = world.afterEvents.itemReleaseUse.subscribe((event) => {
    if (event.source.id !== player.id || release !== undefined) return;
    custody = standInThrow(player, player.selectedSlotIndex);
    release = { tick: system.currentTick, by: custody === undefined ? "the product throw (the slot was already empty)" : `the stand-in (${custody.note})` };
  });
  const liveCopies = (): number => {
    const ledger = state.ledgerGen(TRIDENT, mark.id);
    const held = carriedGens(player, mark.id).filter((g) => g === ledger).length;
    const ground = groundOf(test, player.location, mark.id).filter((g) => g.gen === ledger).length;
    return held + ground + (custody !== undefined && custody.mark.gen === ledger ? 1 : 0);
  };
  try {
    const t0 = system.currentTick;
    let used = player.useItemInSlot(0);
    if (!used) {
      await test.idle(2);
      used = player.useItemInSlot(0);
    }
    await test.idle(CHARGE_TICKS);
    player.stopUsingItem();
    await test.idle(1);
    test.assert(release !== undefined, `no itemReleaseUse for the trident after a ${CHARGE_TICKS}-tick charge (useItemInSlot=${used})`);
    const released = release as { tick: number; by: string };

    const counts: number[] = [];
    for (let t = 0; t < OBSERVE_TICKS; t++) {
      counts.push(liveCopies());
      await test.idle(1);
    }
    const departures = departureLines(capture.lines, mark.id);
    const losses = lossLines(capture.lines, mark.id);
    const drops = swings.filter((s) => s.startsWith("DropItem"));
    const ledger = state.ledgerGen(TRIDENT, mark.id);
    const inFlight = `held [${carriedGens(player, mark.id).join(" ")}] ground ${groundOf(test, player.location, mark.id).length} custody ${custody === undefined ? "product" : "stand-in"}`;
    log(
      `throw RESULT release at +${released.tick - t0} by ${released.by}; swings [${swings.join(" ") || "none"}]; ` +
        `${OBSERVE_TICKS} ticks after the release: live copies per tick min ${Math.min(...counts)} max ${Math.max(...counts)}; ${inFlight}; ` +
        `ledger ${ledger} (was ${mark.gen}); owed [${owedTargets(mark.id).join(" ")}] pending ${state.readPending(TRIDENT, player).length}; ` +
        `departure lines: ${departures.join(" | ") || "none"}; loss lines: ${losses.join(" | ") || "none"}; ` +
        `recovery lines for the stand-in: ${capture.lines.filter((l) => custody?.entity !== undefined && l.includes(custody.entity.id)).join(" | ") || "none"}`
    );
    test.assert(drops.length === 0, `the release raised a DropItem swing: [${drops.join(" ")}]`);
    test.assert(departures.length === 0, `the throw produced a departure verdict: ${departures.join(" | ")}`);
    test.assert(losses.length === 0, `recovery read the throw as a loss: ${losses.join(" | ")}`);
    test.assert(Math.max(...counts) <= 1, `${Math.max(...counts)} live copies at once during the flight`);
    test.assert(ledger === mark.gen, `the ledger moved to gen ${ledger}: a copy was minted for a trident in flight`);
    test.assert(owedTargets(mark.id).length === 0 && state.readPending(TRIDENT, player).length === 0, "a return was queued for a trident in flight");

    // The return: the stand-in puts the clone back; the product throw returns on its own.
    let how = "product";
    if (custody !== undefined) how = standInReturn(player, custody);
    let back: number[] = [];
    for (let t = 0; t < PRODUCT_RETURN_TICKS && back.length === 0; t++) {
      back = carriedGens(player, mark.id);
      if (back.length === 0) await test.idle(1);
    }
    await test.idle(60);
    back = carriedGens(player, mark.id);
    const after = departureLines(capture.lines, mark.id).length + lossLines(capture.lines, mark.id).length;
    log(`throw RESULT return via ${how}: held gens [${back.join(" ")}] 60 ticks later, ledger ${state.ledgerGen(TRIDENT, mark.id)}, departure or loss lines ${after}`);
    test.assert(back.join() === String(mark.gen), `after the return the thrower holds gens [${back.join(" ")}], expected once at gen ${mark.gen}`);
    test.assert(after === 0, "the return produced a departure or loss verdict");

    // Control: the same departure with a DropItem swing in its window is a drop the watch resolves — the instrument
    // sees the line, and the swing is the only thing that kept the throw silent.
    const container = inventoryOf(player);
    let tridentSlot = -1;
    for (let slot = 0; slot < container.size && tridentSlot < 0; slot++) if (markOf(container.getItem(slot))?.id === mark.id) tridentSlot = slot;
    test.assert(tridentSlot >= 0 && tridentSlot < 9, `the returned trident is in slot ${tridentSlot}, not on the hotbar`);
    const stickSlot = (tridentSlot + 1) % 9;
    container.setItem(stickSlot, new ItemStack("minecraft:stick", 1));
    player.selectedSlotIndex = stickSlot;
    await test.idle(4);
    const c0 = system.currentTick;
    test.assert(player.dropSelectedItem(), "dropSelectedItem refused the stick");
    container.setItem(tridentSlot, undefined);
    let controlGens: number[] = [];
    for (let t = 0; t < OBSERVE_TICKS + 40 && controlGens.length === 0; t++) {
      await test.idle(1);
      controlGens = carriedGens(player, mark.id);
    }
    const controlLines = departureLines(capture.lines, mark.id);
    log(
      `throw control RESULT stick dropped and the trident slot cleared in one tick at +${c0 - t0}; swings since [${swings.filter((s) => Number(s.split("@")[1]) >= c0).join(" ") || "none"}]; ` +
        `departure lines: ${controlLines.join(" | ") || "none"}; held gens [${controlGens.join(" ")}], ledger ${state.ledgerGen(TRIDENT, mark.id)}`
    );
    test.assert(
      controlLines.length === 1 && controlLines[0].includes("nowhere to be found"),
      `control: a departure inside a DropItem swing window did not produce the loss line (${controlLines.join(" | ") || "none"}), so the silence above proves nothing`
    );
    test.assert(controlGens.join() === String(mark.gen + 1), `control: the lost trident came back at gens [${controlGens.join(" ")}], expected once at gen ${mark.gen + 1}`);
    for (const e of dim.getEntities({ type: "minecraft:item", location: player.location, maxDistance: 8 })) e.remove();
  } finally {
    capture.stop();
    world.afterEvents.playerSwingStart.unsubscribe(swingSub);
    world.afterEvents.itemReleaseUse.unsubscribe(releaseSub);
    if (custody?.entity?.isValid === true) custody.entity.remove();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(CHARGE_TICKS + OBSERVE_TICKS * 2 + PRODUCT_RETURN_TICKS + 200)
  .tag("andrew");

// ------------------------------------------------ T2 and T4: custody fallbacks through deliverToLastHolder

const FALLBACK_STANDS: readonly Vector3[] = [
  { x: 1, y: 2, z: 1 },
  { x: 3, y: 2, z: 1 },
  { x: 5, y: 2, z: 1 },
];

/** A Survival player at `at` holding a marked, dressed trident in the selected slot 0. */
async function thrower(test: Test, at: Vector3, name: string): Promise<{ player: SimulatedPlayer; mark: Mark }> {
  const player = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  await test.idle(4);
  const mark = state.makeMark("admin", player);
  const made = enchanted(TRIDENT.itemId, TRIDENT_DRESS.enchants ?? []);
  made.stack.nameTag = TRIDENT_DRESS.nameTag;
  made.stack.setLore(TRIDENT_DRESS.lore ?? []);
  player.selectedSlotIndex = 0;
  inventoryOf(player).setItem(0, state.markItem(TRIDENT, made.stack, mark));
  await test.idle(4);
  return { player, mark };
}

const lookLine = (stack: ItemStack | undefined): string => `${enchantmentsOf(stack).join("+") || "-"} name ${stack?.nameTag ?? "-"} lore ${stack?.getLore().join("/") || "-"}`;

function heldStack(player: Player, id: string): ItemStack | undefined {
  const container = inventoryOf(player);
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (markOf(stack)?.id === id) return stack;
  }
  return undefined;
}

registerAsync("andrew", "trident_custody_fallback", async (test: Test): Promise<void> => {
  const capture = captureWarnings();
  const custodies: Custody[] = [];
  let dieSub: ReturnType<typeof world.afterEvents.entityDie.subscribe> | undefined;
  try {
    // Online and alive: delivered at once, at the next generation, with its look.
    const online = await thrower(test, FALLBACK_STANDS[0], "trlg_fb_online");
    const lookBefore = lookLine(heldStack(online.player, online.mark.id));
    const c1 = standInThrow(online.player, 0);
    test.assert(c1 !== undefined, "online: the stand-in throw found no trident in slot 0");
    custodies.push(c1 as Custody);
    await test.idle(5);
    test.assert(carriedGens(online.player, online.mark.id).length === 0, "online: the thrower still holds the trident in flight");
    deliverToLastHolder(TRIDENT, (c1 as Custody).mark, "custody fallback: entity unresolvable (scenario)");
    await test.idle(2);
    const onlineGens = carriedGens(online.player, online.mark.id);
    const lookAfter = lookLine(heldStack(online.player, online.mark.id));
    log(`fallback online RESULT held gens [${onlineGens.join(" ")}], ledger ${state.ledgerGen(TRIDENT, online.mark.id)}, owed [${owedTargets(online.mark.id).join(" ")}]; look [${lookBefore}] -> [${lookAfter}]`);
    test.assert(onlineGens.join() === String(online.mark.gen + 1), `online: held gens [${onlineGens.join(" ")}], expected once at gen ${online.mark.gen + 1}`);
    test.assert(owedTargets(online.mark.id).length === 0, "online: the delivery was also owed");
    test.assert(lookAfter === lookBefore, `online: the trident came back as [${lookAfter}], was [${lookBefore}]`);

    // A stale record delivers nothing: a second fallback for the same throw cannot mint a second copy.
    deliverToLastHolder(TRIDENT, (c1 as Custody).mark, "custody fallback: a second call (scenario)");
    await test.idle(2);
    const again = carriedGens(online.player, online.mark.id);
    const staleLine = capture.lines.some((l) => l.includes(`id ${online.mark.id}`) && l.includes("already stale"));
    log(`fallback stale RESULT held gens [${again.join(" ")}]; stale line ${staleLine}`);
    test.assert(again.join() === String(online.mark.gen + 1) && staleLine, `stale: held gens [${again.join(" ")}], stale line ${staleLine}`);

    // T4: the thrower dies mid-flight. The slot is empty, so retention stashes nothing and leaves nothing on the
    // ground; the fallback owes the dead thrower, paid once on respawn.
    const dead = await thrower(test, FALLBACK_STANDS[1], "trlg_fb_dead");
    let died: Vector3 | undefined;
    dieSub = world.afterEvents.entityDie.subscribe((event) => {
      if (event.deadEntity?.id === dead.player.id) died = { ...event.deadEntity.location };
    });
    const c2 = standInThrow(dead.player, 0);
    test.assert(c2 !== undefined, "dead: the stand-in throw found no trident in slot 0");
    custodies.push(c2 as Custody);
    await test.idle(2);
    dead.player.kill();
    for (let t = 0; t < 40 && died === undefined; t++) await test.idle(1);
    test.assert(died !== undefined, `${dead.player.name} did not die`);
    await test.idle(10);
    const pendingAtDeath = state.readPending(TRIDENT, dead.player).length;
    const groundAtDeath = groundOf(test, died as Vector3, dead.mark.id, 16).length;
    deliverToLastHolder(TRIDENT, (c2 as Custody).mark, "custody fallback: the thrower died mid-flight (scenario)");
    await test.idle(2);
    const owedWhileDead = owedTargets(dead.mark.id);
    dead.player.respawn();
    let paid: number[] = [];
    for (let t = 0; t < 100 && paid.length === 0; t++) {
      await test.idle(1);
      paid = carriedGens(dead.player, dead.mark.id);
    }
    await test.idle(20);
    paid = carriedGens(dead.player, dead.mark.id);
    log(
      `fallback dead RESULT at death pending ${pendingAtDeath} ground ${groundAtDeath}; owed while dead [${owedWhileDead.map((t) => (t === dead.player.id ? "thrower" : t)).join(" ")}]; ` +
        `after respawn held gens [${paid.join(" ")}], owed [${owedTargets(dead.mark.id).join(" ")}], ledger ${state.ledgerGen(TRIDENT, dead.mark.id)}`
    );
    test.assert(pendingAtDeath === 0 && groundAtDeath === 0, `T4: the death of a thrower with an empty slot stashed ${pendingAtDeath} and dropped ${groundAtDeath}`);
    test.assert(owedWhileDead.length === 1 && owedWhileDead[0] === dead.player.id, `dead: the debt is not the thrower's alone: [${owedWhileDead.join(" ")}]`);
    test.assert(paid.join() === String(dead.mark.gen + 1), `dead: after respawn held gens [${paid.join(" ")}], expected once at gen ${dead.mark.gen + 1}`);
    test.assert(owedTargets(dead.mark.id).length === 0, "dead: the debt survived its payment");

    // Offline: owed to the thrower, kept for their next join (the join itself is a node test: a SimulatedPlayer
    // cannot come back with the same id).
    const away = await thrower(test, FALLBACK_STANDS[2], "trlg_fb_offline");
    const awayId = away.player.id;
    const c3 = standInThrow(away.player, 0);
    test.assert(c3 !== undefined, "offline: the stand-in throw found no trident in slot 0");
    custodies.push(c3 as Custody);
    await test.idle(2);
    away.player.disconnect();
    await test.idle(4);
    deliverToLastHolder(TRIDENT, (c3 as Custody).mark, "custody fallback: the thrower left mid-flight (scenario)");
    await test.idle(2);
    const owedAway = state.readOwed(TRIDENT)[awayId] ?? [];
    log(`fallback offline RESULT owed[thrower] ${JSON.stringify(owedAway.map((e) => ({ id: e.mark.id === away.mark.id ? "same" : e.mark.id, gen: e.mark.gen, look: e.mark.look })))}`);
    test.assert(owedAway.length === 1 && owedAway[0].mark.id === away.mark.id && owedAway[0].mark.gen === away.mark.gen + 1, "offline: the thrower is not owed the trident once at the next generation");
    test.assert(owedAway[0].mark.look?.nameTag === TRIDENT_DRESS.nameTag, "offline: the owed entry lost the trident's look");
  } finally {
    capture.stop();
    if (dieSub !== undefined) world.afterEvents.entityDie.unsubscribe(dieSub);
    for (const c of custodies) if (c.entity?.isValid === true) c.entity.remove();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC-3: a chest destroyed around the trident

const OWNER_CORNER: Vector3 = { x: 0, y: 2, z: 6 };
const CHEST_CELL: Vector3 = { x: 4, y: 2, z: 2 };
const TNT_FUSE_TICKS = 100;
const SETTLE_TICKS = 60;

registerAsync("andrew", "trident_chest_destroyed", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  // Creative: the blast would kill a Survival owner on the 7-wide platform, and a dead owner is owed, not handed.
  const owner = test.spawnSimulatedPlayer(OWNER_CORNER, "trlg_chest_owner", GameMode.Creative);
  await test.idle(4);
  const capture = captureWarnings();
  const centre = test.worldLocation({ x: 3, y: 2, z: 3 });
  const census = (id: string): { held: number[]; ground: number[]; chest: number[]; text: string } => {
    const held = carriedGens(owner, id);
    const ground = groundOf(test, centre, id, 40).map((g) => g.gen);
    const box = dim.getBlock(test.worldBlockLocation(CHEST_CELL))?.getComponent("minecraft:inventory")?.container;
    const chest: number[] = [];
    for (let slot = 0; box !== undefined && slot < box.size; slot++) {
      const mark = markOf(box.getItem(slot));
      if (mark?.id === id) chest.push(mark.gen);
    }
    return { held, ground, chest, text: `held [${held.join(" ")}] ground [${ground.join(" ")}] chest [${chest.join(" ")}] ledger ${state.ledgerGen(TRIDENT, id)}` };
  };
  const loadChest = (): Mark => {
    test.setBlockType("minecraft:chest", CHEST_CELL);
    const box = test.getBlock(CHEST_CELL).getComponent("minecraft:inventory")?.container;
    if (box === undefined) throw new Error("the chest has no inventory container");
    const mark = state.makeMark("admin", owner);
    box.setItem(0, state.markItem(TRIDENT, new ItemStack(TRIDENT.itemId, 1), mark));
    box.setItem(1, new ItemStack("minecraft:diamond_sword", 1));
    return mark;
  };
  try {
    // Broken the way a player breaks it: the chest spills, the trident lies on the ground with the same id and
    // generation, watched; nothing is owed.
    const broken = loadChest();
    await test.idle(4);
    const at = test.worldBlockLocation(CHEST_CELL);
    const result = dim.runCommand(`setblock ${at.x} ${at.y} ${at.z} air destroy`).successCount;
    await test.idle(SETTLE_TICKS);
    const b = census(broken.id);
    const watching = capture.lines.some((l) => l.includes(`watching ${TRIDENT.itemId} id ${broken.id}`));
    log(`chest broken RESULT setblock destroy -> ${result}; ${b.text}; watched ${watching}; owed [${owedTargets(broken.id).join(" ")}]`);
    test.assert(b.ground.join() === String(broken.gen) && b.held.length === 0 && b.chest.length === 0, `broken: ${b.text}, expected once on the ground at gen ${broken.gen}`);
    test.assert(state.ledgerGen(TRIDENT, broken.id) === broken.gen && owedTargets(broken.id).length === 0, "broken: the spilled trident was returned instead of lying where it fell");
    test.assert(watching, "broken: recovery never watched the spilled trident");
    // Taken away, not lost: unwatched first, or recovery returns it to the owner mid-scenario.
    for (const g of groundOf(test, centre, broken.id, 40)) {
      forgetWatched(g.entity.id);
      g.entity.remove();
    }
    await test.idle(SETTLE_TICKS);

    // Someone else's TNT: the chest goes and the trident with it — whatever the blast does to the spill, exactly one
    // live copy remains: on the ground at the same generation, or back with the owner at the next one.
    const blasted = loadChest();
    await test.idle(4);
    const tnt = dim.spawnEntity("minecraft:tnt", test.worldLocation({ x: CHEST_CELL.x + 0.5, y: CHEST_CELL.y, z: CHEST_CELL.z + 1.5 }));
    tnt.clearVelocity();
    await test.idle(TNT_FUSE_TICKS + SETTLE_TICKS);
    const chestType = dim.getBlock(test.worldBlockLocation(CHEST_CELL))?.typeId ?? "unreadable";
    const t = census(blasted.id);
    const ledger = state.ledgerGen(TRIDENT, blasted.id);
    const live = [...t.held, ...t.ground, ...t.chest].filter((g) => g === ledger).length;
    const stale = [...t.held, ...t.ground, ...t.chest].filter((g) => g !== ledger).length;
    log(`chest tnt RESULT chest cell now ${chestType}; ${t.text}; live ${live} stale ${stale}; owed [${owedTargets(blasted.id).join(" ")}]; loss lines: ${lossLines(capture.lines, blasted.id).join(" | ") || "none"}`);
    test.assert(chestType !== "minecraft:chest", "the TNT left the chest standing, so the case proves nothing");
    test.assert(live === 1 && stale === 0, `tnt: ${live} live and ${stale} stale copies (${t.text}), expected exactly one live`);
    test.assert(owedTargets(blasted.id).length === 0, "tnt: the trident is also owed");
  } finally {
    capture.stop();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(TNT_FUSE_TICKS + SETTLE_TICKS * 3 + 200)
  .tag("andrew");

// ------------------------------------------------ T6 (L0-trdt-a005): the magnet takes the trident like the others, never a custody entity

/**
 * Custody entity ids: the product's, the two names L0-trdt gives the flying and the returning one, and the snowball
 * runtime they share. A vanilla thrown_trident is not summonable (is_summonable false), so it cannot stand in.
 */
const CUSTODY_CANDIDATES = [CUSTODY_TYPE, "andrew:thrown_above_water_trident", "andrew:returning_above_water_trident", "minecraft:snowball"];

registerAsync("andrew", "trident_magnet_legendary", async (test: Test): Promise<void> => {
  const owner = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 3 }, "trlg_magnet_owner");
  const difficulty = world.getDifficulty();
  const time = world.getTimeOfDay();
  const p = await pad(test, "andrew_gt_magn_t", 8);
  const extras: Entity[] = [];
  try {
    assertClean(test, p);
    // A zombie is deleted on Peaceful, where the checks world runs; noon keeps others from spawning.
    world.setDifficulty(Difficulty.Easy);
    world.setTimeOfDay(6000);
    const groundMark = state.makeMark("admin", owner);
    const ground = p.dim.spawnItem(state.markItem(TRIDENT, new ItemStack(TRIDENT.itemId, 1), groundMark), middle(onPad(p, 1, 0)));
    const stormMark = state.makeMark("admin", owner);
    const storm = p.dim.spawnItem(state.markItem(STORM_BLADE, new ItemStack(STORM_BLADE.itemId, 1), stormMark), middle(onPad(p, -1, 0)));
    const chest = onPad(p, 0, -10);
    setBlock(p, chest, "minecraft:chest");
    const box = containerAt(p, chest);
    box.setItem(0, state.markItem(TRIDENT, new ItemStack(TRIDENT.itemId, 1), state.makeMark("admin", owner)));
    box.setItem(2, new ItemStack("minecraft:dirt", 3));
    // A mob more than 128 blocks from every player despawns at once, and the owner stands on the platform, far from
    // the pad; with nobody online the mobs stay (ufo_magnet_holders).
    test.removeSimulatedPlayer(owner);
    const zombie = spawnStill(p, "minecraft:zombie", onPad(p, -10, -4));
    const stand = p.dim.spawnEntity("minecraft:armor_stand", middle(onPad(p, -8, 4)));
    extras.push(ground, storm, zombie, stand);
    await test.idle(2);
    dress(zombie, { mainhand: TRIDENT.itemId });
    dress(stand, { offhand: TRIDENT.itemId });

    // The custody entities: every candidate the engine knows, in the zone, alive when the magnet scans.
    const known = CUSTODY_CANDIDATES.filter((id) => EntityTypes.get(id) !== undefined);
    const unknown = CUSTODY_CANDIDATES.filter((id) => !known.includes(id));
    await test.idle(2);
    const refused: string[] = [];
    const custody = known.flatMap((id, i) => {
      try {
        const e = p.dim.spawnEntity(id, { x: p.cx + 4 + 2 * i + 0.5, y: p.top + 4, z: p.cz + 4.5 });
        e.clearVelocity();
        return [e];
      } catch (err) {
        refused.push(`${id} (${errText(err)})`);
        return [];
      }
    });
    extras.push(...custody);
    const before = custody.map((e) => ({ ...e.location }));
    const groundGen = world.getDynamicProperty(genLedgerKey(TRIDENT, groundMark.id));
    test.assert(custody.every((e) => e.isValid) && zombie.isValid, "a custody entity or the zombie is gone before the scan");

    const sel = magnetOn(p.dim, p.centre, p.hoverY, host);
    const ids = new Set(sel.elements.map((e) => e.entity.id));
    const made = sel.elements.filter((e) => sel.spawned.has(e.entity.id));
    const takenCustody = custody.filter((e) => ids.has(e.id) || e.hasTag(IRON_TAG));
    const moved = custody.filter((e, i) => e.isValid && Math.hypot(e.location.x - before[i].x, e.location.z - before[i].z) > 1e-6);
    log(
      `magnet RESULT [${describe(sel)}]; custody entities [${custody.map((e) => e.typeId).join(" ")}], unknown to this build [${unknown.join(" ")}], refused [${refused.join(" ")}]; ` +
        `custody taken or tagged [${takenCustody.map((e) => e.typeId).join(" ") || "none"}], moved [${moved.map((e) => e.typeId).join(" ") || "none"}]; ` +
        `from the chest [${made.map((e) => stackOf(e.entity)?.typeId ?? "gone").join(" ")}], chest slot 0 ${box.getItem(0)?.typeId ?? "empty"}; ` +
        `zombie holds a trident ${zombie.hasTag(IRON_TAG)}, stand ${stand.hasTag(IRON_TAG)}${sel.failures.length > 0 ? `; failures ${sel.failures.join(" | ")}` : ""}`
    );
    test.assert(sel.failures.length === 0, `failures: ${sel.failures.join(" | ")}`);
    test.assert(sel.elements.some((e) => e.cls === GROUND && e.entity.id === ground.id), "the ground trident was not taken");
    test.assert(sel.elements.some((e) => e.cls === GROUND && e.entity.id === storm.id), "the ground Storm Blade (the parity control) was not taken");
    test.assert(made.length === 1 && made[0].cls === STACK && stackOf(made[0].entity)?.typeId === TRIDENT.itemId, `the chest stack taken is [${made.map((e) => stackOf(e.entity)?.typeId).join(" ")}], not the trident`);
    test.assert(box.getItem(0) === undefined && box.getItem(2)?.typeId === "minecraft:dirt", "the chest kept its trident, or lost its dirt");
    test.assert(sel.elements.some((e) => e.cls === HOLDER && e.entity.id === zombie.id) && zombie.hasTag(IRON_TAG), "the zombie holding the trident was not taken");
    test.assert(sel.elements.some((e) => e.cls === HOLDER && e.entity.id === stand.id) && stand.hasTag(IRON_TAG), "the stand holding the trident in its off hand was not taken");
    test.assert(custody.length >= 2, `only [${custody.map((e) => e.typeId).join(" ")}] of the custody candidates could be spawned, the case proves too little`);
    test.assert(takenCustody.length === 0, `the magnet took or tagged a custody entity: [${takenCustody.map((e) => e.typeId).join(" ")}]`);
    test.assert(world.getDynamicProperty(genLedgerKey(TRIDENT, groundMark.id)) === groundGen, "the ground trident's ledger moved");
  } finally {
    world.setDifficulty(difficulty);
    world.setTimeOfDay(time);
    for (const e of extras) if (e.isValid) e.removeTag(IRON_TAG);
    removeAll(extras);
    clearItems(p);
    p.unload();
    if (owner.isValid) test.removeSimulatedPlayer(owner);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");
