// The Underwater Bow (def #8) under the legendary rules (spec v3 §1; L0-uwbw responsibility 3). The framework's own
// scenarios run with def #8: death and the chest, the Void to the last holder online, offline and dead, a destroyed
// minecart. The hazard grid in legendary-fireproof.ts already runs every def in LEGENDARIES, the bow included. The
// scenarios below hold what the framework scenarios do not show for this weapon:
// - every marked copy comes back from one death;
// - a stand holding the bow falls into the Void, after a hand-over;
// - someone else's TNT;
// - the compatible bow enchantments stay, and the engine refuses the vanilla conflicts;
// - the UFO magnet holds and releases the bow without losing it;
// - a restart, with the bow on the ground and one owed.
// Each scenario logs "[gametest] ubow-lgnd <name> RESULT …" lines.

import {
  BlockVolume,
  type Container,
  type Dimension,
  Direction,
  EnchantmentType,
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
import { FORBIDDEN_ENCHANTMENTS, type ScrubReport, enchantmentsOf, observeScrubs } from "../legendary/enchant";
import { TRIDENT, UNDERWATER_BOW, keysFor } from "../legendary/registry";
import type { ItemLook, Mark, OwedEntry } from "../legendary/rules";
import * as state from "../legendary/state";
import { IRON_TAG } from "../ufo/event";
import { UfoMagnet } from "../ufo/magnet";
import { GROUND, HOLDER, STACK } from "../ufo/magnet-select";
import { chestStays } from "./legendary-fireproof";
import { type Dress, PICKUP_TICKS, VOID_RETURN_TICKS, WAIT_TICKS, deathRetention, holderDeadRedeemed, holderOffline, transferThenVoid, voidThrown } from "./legendary-recovery";
import { MINECART, holderScenario } from "./legendary-ufo";
import { assertClean, clearItems, containerAt, dress, host, middle, at as onPad, pad, removeAll, setBlock, stackOf } from "./ufo-magnet-select";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const UB = UNDERWATER_BOW;

const log = (msg: string): void => console.warn(`[gametest] ubow-lgnd ${msg}`);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const f1 = (v: Vector3): string => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;

type Enchants = ReadonlyArray<readonly [string, number]>;

/** Infinity, never beside Mending: the engine refuses that pair (ENGINE_CONFLICTS, ench_data_parity). */
const BOW_DRESS: Dress = {
  enchants: [
    ["power", 5],
    ["punch", 2],
    ["flame", 1],
    ["infinity", 1],
    ["unbreaking", 3],
  ],
  nameTag: "Deep Draw",
  lore: ["ub retention"],
};

const MENDING_DRESS: Dress = {
  enchants: [
    ["power", 5],
    ["punch", 2],
    ["flame", 1],
    ["mending", 1],
    ["unbreaking", 3],
  ],
  nameTag: "Undertow Bow",
  lore: ["ub mending"],
};

// ------------------------------------------------ the framework's scenarios with def #8

deathRetention(UB, "legendary_ubow_death_kill", "kill", false, "main", BOW_DRESS);
deathRetention(UB, "legendary_ubow_death_lava", "lava", false, "main", BOW_DRESS);
deathRetention(UB, "legendary_ubow_death_offhand", "kill", false, "off", MENDING_DRESS);
chestStays("legendary_ubow_in_a_chest_stays_there", UB, "andrew_ub_chest_keeper");
voidThrown(UB, "legendary_ubow_void_thrown", "ublg_void_thrower", BOW_DRESS);

registerAsync("andrew", "legendary_ubow_hold_void_after_transfer", transferThenVoid("ub_online", false, UB))
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + VOID_RETURN_TICKS + 200)
  .tag("andrew");

registerAsync("andrew", "legendary_ubow_hold_void_holder_offline", holderOffline("ub_off", UB))
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + WAIT_TICKS + 120)
  .tag("andrew");

registerAsync("andrew", "legendary_ubow_hold_void_holder_dead_redeemed", holderDeadRedeemed("ub_dead", UB))
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + WAIT_TICKS + VOID_RETURN_TICKS + 200)
  .tag("andrew");

holderScenario("legendary_ubow_holder_chest_minecart", "ub_chest_cart", "minecraft:chest_minecart", MINECART, UB);

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
  return state.isItemOf(UB, stack) ? state.getMark(UB, stack) : undefined;
}

/** Enchantments, anvil name and lore of a stack, as one comparable line. */
function lookText(stack: ItemStack | undefined): string {
  return `${enchantmentsOf(stack).join("+") || "-"} name ${stack?.nameTag ?? "-"} lore ${stack?.getLore().join("/") || "-"}`;
}

/** The same line for a look stored in a ledger entry. */
function storedLookText(look: ItemLook | undefined): string {
  const enchants = (look?.enchantments ?? []).map(([id, level]) => `${id}${level}`).sort();
  return `${enchants.join("+") || "-"} name ${look?.nameTag ?? "-"} lore ${look?.lore?.join("/") || "-"}`;
}

/** A bow dressed with `dress` and stamped with `mark`; enchantments the engine refuses are named, not thrown. */
function dressedBow(mark: Mark | undefined, d: Dress, typeId = UB.itemId): { stack: ItemStack; refused: string[] } {
  const stack = new ItemStack(typeId, 1);
  const enchantable = stack.getComponent("minecraft:enchantable");
  const refused: string[] = [];
  for (const [id, level] of d.enchants ?? []) {
    try {
      if (enchantable === undefined) throw new Error("no minecraft:enchantable");
      enchantable.addEnchantment({ type: new EnchantmentType(id), level });
    } catch (err) {
      refused.push(`${id}${level} (${errText(err)})`);
    }
  }
  if (d.nameTag !== undefined) stack.nameTag = d.nameTag;
  if (d.lore !== undefined) stack.setLore(d.lore);
  return { stack: mark === undefined ? stack : state.markItem(UB, stack, mark), refused };
}

interface Copy {
  where: string;
  gen: number;
  look: string;
  stack: ItemStack;
}

/** Every copy of instance `id` a player carries, inventory and off hand. */
function carriedCopies(player: Player, id: string): Copy[] {
  const out: Copy[] = [];
  const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
  for (let slot = 0; container !== undefined && slot < container.size; slot++) {
    const stack = container.getItem(slot);
    const mark = markOf(stack);
    if (stack !== undefined && mark?.id === id) out.push({ where: `slot ${slot}`, gen: mark.gen, look: lookText(stack), stack });
  }
  const off = state.offhandOf(player);
  const offMark = markOf(off);
  if (off !== undefined && offMark?.id === id) out.push({ where: "off hand", gen: offMark.gen, look: lookText(off), stack: off });
  return out;
}

/** Item entities of instance `id` within `radius` of `at`, at any height in that sphere. */
function groundCopies(dim: Dimension, at: Vector3, id: string, radius = 32): Array<{ entity: Entity; gen: number; look: string }> {
  return dim.getEntities({ type: "minecraft:item", location: at, maxDistance: radius }).flatMap((entity) => {
    const stack = entity.isValid ? entity.getComponent("minecraft:item")?.itemStack : undefined;
    const mark = markOf(stack);
    return mark?.id === id ? [{ entity, gen: mark.gen, look: lookText(stack) }] : [];
  });
}

/** Owed entries naming instance `id`, by target. */
function owedOf(id: string): Array<{ target: string; entry: OwedEntry }> {
  return Object.entries(state.readOwed(UB)).flatMap(([target, entries]) => entries.filter((e) => e.mark.id === id).map((entry) => ({ target, entry })));
}

/** Takes every owed entry for `target` off the ledger: a scenario never leaves a debt for a player who will not return. */
function clearOwed(target: string): void {
  const owed = state.readOwed(UB);
  if (owed[target] === undefined) return;
  delete owed[target];
  state.writeOwed(UB, owed);
}

/** Lines in which recovery reads `id` as lost: every loss path prints "now gen" or "already stale". */
const lossLines = (lines: string[], id: string): string[] =>
  lines.filter((l) => l.includes("legendary recovery:") && l.includes(`id ${id}`) && (l.includes("now gen") || l.includes("already stale")));

function hasInHand(holder: Entity, itemId: string, slot: "slot.weapon.mainhand" | "slot.weapon.offhand" = "slot.weapon.mainhand"): boolean {
  try {
    return holder.runCommand(`testfor @s[hasitem={item=${itemId},location=${slot}}]`).successCount > 0;
  } catch {
    return false;
  }
}

async function waitFor(test: Test, ticks: number, done: () => boolean): Promise<number> {
  let t = 0;
  for (; t < ticks && !done(); t++) await test.idle(1);
  return t;
}

// ------------------------------------------------ death: every marked copy comes back, an unmarked one stays a plain item

const STAND_A: Vector3 = { x: 1, y: 2, z: 1 };
const STAND_B: Vector3 = { x: 5, y: 2, z: 5 };
const DEATH_DEADLINE_TICKS = 100;
const RESPAWN_SETTLE_TICKS = 80;

/**
 * Two marked bows — the crafted one in the inventory, an admin copy in the off hand, each dressed differently — and
 * an unmarked copy with arrows beside it. Retention takes every marked copy (path A or B), the death spot keeps only
 * the vanilla items, and the respawn hands both marked bows back once each, same id, same generation, same look.
 */
registerAsync("andrew", "ubow_death_keeps_every_copy", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const player = test.spawnSimulatedPlayer(STAND_A, "ublg_every_copy", GameMode.Survival);
  await test.idle(4);
  const capture = captureWarnings();
  let died: Vector3 | undefined;
  const dieSub = world.afterEvents.entityDie.subscribe((event) => {
    if (event.deadEntity?.id === player.id) died = { ...event.deadEntity.location };
  });
  try {
    const inv = inventoryOf(player);
    const crafted = state.makeMark("craft", player);
    const admin = state.makeMark("admin", player);
    const a = dressedBow(crafted, BOW_DRESS);
    const b = dressedBow(admin, MENDING_DRESS);
    const plain = dressedBow(undefined, { enchants: [["power", 1]] });
    test.assert(a.refused.length + b.refused.length === 0, `the engine refused [${[...a.refused, ...b.refused].join(", ")}]`);
    inv.setItem(2, a.stack);
    inv.setItem(7, plain.stack);
    inv.setItem(8, new ItemStack("minecraft:arrow", 16));
    state.setOffhand(player, b.stack);
    await test.idle(4);
    const before = [crafted, admin].map((m) => carriedCopies(player, m.id).map((c) => `${c.where}@${c.gen} [${c.look}]`).join());
    test.assert(before.every((s) => s !== ""), `a marked bow did not reach the player: [${before.join(" | ")}]`);

    player.kill();
    await waitFor(test, DEATH_DEADLINE_TICKS, () => died !== undefined);
    test.assert(died !== undefined, `${player.name} did not die`);
    const spot = died as Vector3;
    await test.idle(10);
    const groundAtDeath = [crafted, admin].map((m) => groundCopies(dim, spot, m.id).length);
    const plainOnGround = dim
      .getEntities({ type: "minecraft:item", location: spot, maxDistance: 8 })
      .filter((e) => e.isValid && e.getComponent("minecraft:item")?.itemStack?.typeId === UB.itemId && markOf(e.getComponent("minecraft:item")?.itemStack) === undefined).length;
    const pendingAtDeath = state.readPending(UB, player).map((m) => `${m.id === crafted.id ? "crafted" : m.id === admin.id ? "admin" : m.id}@${m.gen}`);

    player.respawn();
    await waitFor(test, RESPAWN_SETTLE_TICKS, () => carriedCopies(player, crafted.id).length > 0 && carriedCopies(player, admin.id).length > 0);
    await test.idle(40);
    const after = [crafted, admin].map((m) => carriedCopies(player, m.id));
    const plainCarried = [...Array(inv.size).keys()].filter((s) => {
      const stack = inv.getItem(s);
      return stack?.typeId === UB.itemId && markOf(stack) === undefined;
    }).length;
    const ledgers = [crafted, admin].map((m) => state.ledgerGen(UB, m.id));
    const owed = [crafted, admin].map((m) => owedOf(m.id).length);
    const retention = capture.lines.filter((l) => l.includes("legendary retention:") && l.includes(UB.itemId));
    log(
      `every_copy RESULT before [${before.join(" | ")}]; died at ${f1(spot)}; marked copies on the ground at death+10 [${groundAtDeath.join(" ")}], ` +
        `unmarked bow on the ground ${plainOnGround}; pending at death [${pendingAtDeath.join(" ")}]; after respawn crafted ` +
        `[${after[0].map((c) => `${c.where}@${c.gen} [${c.look}]`).join()}] admin [${after[1].map((c) => `${c.where}@${c.gen} [${c.look}]`).join()}], ` +
        `unmarked carried ${plainCarried}; ledgers [${ledgers.join(" ")}], owed [${owed.join(" ")}], pending ${state.readPending(UB, player).length}; ` +
        `retention: ${retention.join(" | ") || "none"}`
    );
    test.assert(pendingAtDeath.length === 2, `retention kept [${pendingAtDeath.join(" ")}] at the death, expected both marked bows`);
    test.assert(groundAtDeath.every((n) => n === 0), `marked bows left on the ground at the death spot: [${groundAtDeath.join(" ")}]`);
    for (const [i, m] of [crafted, admin].entries()) {
      const name = i === 0 ? "the crafted bow" : "the admin copy";
      test.assert(after[i].length === 1 && after[i][0].gen === m.gen, `${name} is carried ${after[i].length} time(s), expected once at gen ${m.gen}`);
      test.assert(ledgers[i] === m.gen && owed[i] === 0, `${name} came back as a loss: ledger ${ledgers[i]}, owed ${owed[i]}`);
    }
    test.assert(after[0][0].look === lookText(a.stack), `the crafted bow came back as [${after[0][0].look}], was [${lookText(a.stack)}]`);
    test.assert(after[1][0].look === lookText(b.stack), `the admin copy came back as [${after[1][0].look}], was [${lookText(b.stack)}]`);
    // Measured before the respawn: a player respawning on the spot picks the vanilla drops up again.
    test.assert(plainOnGround === 1, `the unmarked bow lies ${plainOnGround} time(s) at the death spot, expected 1: retention took a plain copy`);
  } finally {
    world.afterEvents.entityDie.unsubscribe(dieSub);
    capture.stop();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(DEATH_DEADLINE_TICKS + RESPAWN_SETTLE_TICKS + 200)
  .tag("andrew");

// ------------------------------------------------ the Void from a stand's hand, to the last holder

const STAND_CELL: Vector3 = { x: 5, y: 2, z: 1 };
const FALL_DEADLINE_TICKS = 200;

/** `from` throws instance `id`; it is put down at `to`'s feet, and `to` picks it up. */
async function handOver(test: Test, from: SimulatedPlayer, to: SimulatedPlayer, id: string): Promise<void> {
  const slot = carriedCopies(from, id)[0]?.where;
  test.assert(slot?.startsWith("slot ") === true, `${from.name} does not carry ${id} in a slot`);
  from.selectedSlotIndex = Number((slot as string).slice(5));
  test.assert(from.dropSelectedItem(), `${from.name}: dropSelectedItem refused`);
  let entity: Entity | undefined;
  await waitFor(test, 10, () => (entity = groundCopies(test.getDimension(), from.location, id, 8)[0]?.entity) !== undefined);
  test.assert(entity !== undefined, `no item entity after ${from.name}'s throw`);
  (entity as Entity).teleport(to.location);
  await waitFor(test, PICKUP_TICKS, () => carriedCopies(to, id).length > 0);
  test.assert(carriedCopies(to, id).length === 1 && carriedCopies(from, id).length === 0, `the hand-over to ${to.name} failed`);
  // The pick-up's playerInventoryItemChange lands after this tick's continuations.
  await test.idle(2);
}

/** `player` gives the bow it holds in `slot` to the stand the way a player does: the stand has no equippable. */
async function giveToStand(test: Test, player: SimulatedPlayer, stand: Entity, slot: number): Promise<string> {
  const back = player.location;
  player.teleport({ x: stand.location.x - 1.5, y: stand.location.y, z: stand.location.z });
  player.selectedSlotIndex = slot;
  await test.idle(2);
  player.lookAtEntity(stand);
  let tries = 0;
  while (tries < 10 && !hasInHand(stand, UB.itemId)) {
    tries++;
    player.interactWithEntity(stand);
    await test.idle(2);
  }
  player.teleport(back);
  return `interactWithEntity x${tries}, hasitem ${hasInHand(stand, UB.itemId)}`;
}

/**
 * A crafts the bow, hands it to B, and B puts it into a stand's hand. The stand falls through a hole into the Void:
 * the watcher kills it below the floor, the spill keeps the mark, and the loss path returns the bow to B — its last
 * holder — at gen 1 with its look; A, who made it, gets nothing.
 */
registerAsync("andrew", "ubow_stand_void_last_holder", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const crafter = test.spawnSimulatedPlayer(STAND_A, "ublg_stand_crafter", GameMode.Survival);
  const holder = test.spawnSimulatedPlayer(STAND_B, "ublg_stand_holder", GameMode.Survival);
  const stand = test.spawn("minecraft:armor_stand", STAND_CELL);
  await test.idle(4);
  const capture = captureWarnings();
  const mark = state.makeMark("craft", crafter);
  // kill() on a stand raises no entityDie, and the release pack runs the same watcher, so either pack may kill it:
  // the kill is read from the spill (probe_stand_void).
  const spills: string[] = [];
  const spawnSub = world.afterEvents.entitySpawn.subscribe((event) => {
    const e = event.entity;
    if (!e.isValid || e.typeId !== "minecraft:item") return;
    const stack = e.getComponent("minecraft:item")?.itemStack;
    if (markOf(stack)?.id === mark.id) spills.push(f1(e.location));
  });
  try {
    const bow = dressedBow(mark, BOW_DRESS);
    const lookBefore = lookText(bow.stack);
    inventoryOf(crafter).setItem(0, bow.stack);
    await test.idle(2);
    await handOver(test, crafter, holder, mark.id);
    const onB = carriedCopies(holder, mark.id)[0];
    const keys = keysFor(UB);
    const holderKey = onB?.stack.getDynamicProperty(keys.holder);
    test.assert(holderKey === holder.id, `B's copy names ${String(holderKey)} as holder, not B (${holder.id})`);

    const slot = Number(onB.where.slice(5));
    const how = await giveToStand(test, holder, stand, slot);
    await test.idle(4);
    test.assert(hasInHand(stand, UB.itemId), `the stand does not hold the bow (${how})`);
    test.assert(carriedCopies(holder, mark.id).length === 0, "B still carries the bow it gave the stand");
    // Past the departure grace: giving the bow to the stand is storage, not a loss.
    await test.idle(80);
    test.assert(state.ledgerGen(UB, mark.id) === 0 && carriedCopies(holder, mark.id).length === 0, "giving the bow to the stand was read as a loss");

    spills.length = 0;
    const top = test.worldBlockLocation({ x: STAND_CELL.x, y: STAND_CELL.y - 1, z: STAND_CELL.z });
    dim.fillBlocks(new BlockVolume({ x: top.x, y: dim.heightRange.min, z: top.z }, top), "minecraft:air");
    await waitFor(test, FALL_DEADLINE_TICKS, () => !stand.isValid);
    test.assert(!stand.isValid, "the stand is still in the world");
    await waitFor(test, VOID_RETURN_TICKS, () => carriedCopies(holder, mark.id).length > 0);
    await test.idle(40);

    const toB = carriedCopies(holder, mark.id);
    const toA = carriedCopies(crafter, mark.id);
    const back = toB[0]?.stack;
    const kills = capture.lines.filter((l) => l.includes("an armour stand below the floor") && l.includes(UB.itemId));
    const losses = lossLines(capture.lines, mark.id);
    const owed = owedOf(mark.id).map((o) => (o.target === holder.id ? "B" : o.target === crafter.id ? "A" : o.target));
    log(
      `stand_void RESULT stand loaded via ${how}; B holds gens [${toB.map((c) => c.gen).join(" ")}], A holds [${toA.map((c) => c.gen).join(" ")}], ` +
        `owed [${owed.join(" ")}], ledger ${state.ledgerGen(UB, mark.id)}; returned holder=${String(back?.getDynamicProperty(keys.holder))} owner=${String(back?.getDynamicProperty(keys.owner))}; ` +
        `look [${lookBefore}] -> [${toB[0]?.look ?? "-"}]; marked spills [${spills.join(" ")}]; this pack's watcher: ${kills.join(" | ") || "no kill (the release pack's can be the one)"}; ` +
        `loss lines: ${losses.join(" | ") || "none"}`
    );
    test.assert(spills.length === 1, `the stand spilled the marked bow ${spills.length} time(s), expected once: it was not killed below the floor`);
    test.assert(toB.length === 1 && toB[0].gen === 1, `B holds the bow at gens [${toB.map((c) => c.gen).join(" ")}], expected once at gen 1`);
    test.assert(toA.length === 0, "the crafter was handed the last holder's loss");
    test.assert(owed.length === 0, `the return was also owed to [${owed.join(" ")}]`);
    test.assert(state.ledgerGen(UB, mark.id) === 1, `the ledger is at gen ${state.ledgerGen(UB, mark.id)}, expected 1`);
    test.assert(back?.getDynamicProperty(keys.holder) === holder.id && back?.getDynamicProperty(keys.owner) === crafter.id, "the returned copy lost its holder or its crafter");
    test.assert(toB[0].look === lookBefore, `the bow came back as [${toB[0].look}], was [${lookBefore}]`);
    test.assert(losses.length === 1, `expected exactly one loss return, got ${losses.length}`);
  } finally {
    world.afterEvents.entitySpawn.unsubscribe(spawnSub);
    capture.stop();
    if (stand.isValid) stand.remove();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(PICKUP_TICKS + FALL_DEADLINE_TICKS + VOID_RETURN_TICKS + 300)
  .tag("andrew");

// ------------------------------------------------ someone else's TNT

const TNT_CELL: Vector3 = { x: 3, y: 2, z: 3 };
const TNT_WAIT_TICKS = 100;
const RECOVERY_SETTLE_TICKS = 100;

/**
 * The bow's holder A lies nowhere near the fuse: B, another player, primes a TNT block beside the bow on the ground —
 * flint and steel first, a redstone block if the engine refuses that use. The blast destroys the bow and a vanilla
 * bow beside it; the bow comes back to A once, at gen 1, with its look, and B gets nothing. Both players are Creative,
 * so the blast kills neither (a dead holder is owed the return instead of handed it).
 */
registerAsync("andrew", "ubow_someones_tnt_returns", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const owner = test.spawnSimulatedPlayer({ x: 0, y: 2, z: 6 }, "ublg_tnt_owner", GameMode.Creative);
  const attacker = test.spawnSimulatedPlayer({ x: 6, y: 2, z: 1 }, "ublg_tnt_attacker", GameMode.Creative);
  await test.idle(4);
  const capture = captureWarnings();
  try {
    const mark = state.makeMark("admin", owner);
    const bow = dressedBow(mark, MENDING_DRESS);
    const lookBefore = lookText(bow.stack);
    test.setBlockType("minecraft:tnt", TNT_CELL);
    const entity = dim.spawnItem(bow.stack, test.worldLocation({ x: TNT_CELL.x + 0.5, y: TNT_CELL.y + 0.2, z: TNT_CELL.z + 1.5 }));
    const control = dim.spawnItem(new ItemStack("minecraft:bow", 1), test.worldLocation({ x: TNT_CELL.x + 1.5, y: TNT_CELL.y + 0.2, z: TNT_CELL.z + 0.5 }));
    entity.clearVelocity();
    control.clearVelocity();
    // entitySpawn must reach recovery before the entity dies, or nothing is watched.
    await test.idle(4);

    const primed = (): boolean => test.getBlock(TNT_CELL).typeId !== "minecraft:tnt";
    const inv = inventoryOf(attacker);
    inv.setItem(0, new ItemStack("minecraft:flint_and_steel", 1));
    attacker.selectedSlotIndex = 0;
    attacker.lookAtBlock(TNT_CELL);
    await test.idle(2);
    let how = `flint and steel: ${String(attacker.useItemInSlotOnBlock(0, TNT_CELL, Direction.Up))}`;
    await waitFor(test, 4, primed);
    if (!primed()) {
      inv.setItem(1, new ItemStack("minecraft:redstone_block", 1));
      const below = { x: TNT_CELL.x, y: TNT_CELL.y - 1, z: TNT_CELL.z + 1 };
      how += `; redstone block: ${String(attacker.useItemInSlotOnBlock(1, below, Direction.Up))}`;
      await waitFor(test, 4, primed);
    }
    const fuses = dim.getEntities({ type: "minecraft:tnt", location: test.worldLocation(TNT_CELL), maxDistance: 4 }).length;
    test.assert(primed() && fuses > 0, `${attacker.name} could not prime the TNT (${how}; block ${test.getBlock(TNT_CELL).typeId}, primed entities ${fuses})`);

    await waitFor(test, TNT_WAIT_TICKS, () => !entity.isValid);
    const destroyed = !entity.isValid;
    const controlDestroyed = !control.isValid;
    await waitFor(test, RECOVERY_SETTLE_TICKS, () => carriedCopies(owner, mark.id).length > 0);
    await test.idle(40);
    const toOwner = carriedCopies(owner, mark.id);
    const toAttacker = carriedCopies(attacker, mark.id);
    const owed = owedOf(mark.id);
    const losses = lossLines(capture.lines, mark.id);
    log(
      `someones_tnt RESULT primed by ${attacker.name} (${how}); bow destroyed ${destroyed}, vanilla bow destroyed ${controlDestroyed}; ` +
        `owner holds gens [${toOwner.map((c) => c.gen).join(" ")}], attacker [${toAttacker.map((c) => c.gen).join(" ")}], owed ${owed.length}, ` +
        `ledger ${state.ledgerGen(UB, mark.id)}; look [${lookBefore}] -> [${toOwner[0]?.look ?? "-"}]; loss lines: ${losses.join(" | ") || "none"}`
    );
    test.assert(controlDestroyed, "the vanilla bow survived the blast, so nothing below proves anything");
    test.assert(destroyed, "the blast did not destroy the bow's item entity, so the return path never ran");
    test.assert(toOwner.length === 1 && toOwner[0].gen === 1, `the owner holds the bow at gens [${toOwner.map((c) => c.gen).join(" ")}], expected once at gen 1`);
    test.assert(toAttacker.length === 0, "the player who lit the TNT was handed the bow");
    test.assert(owed.length === 0 && losses.length === 1, `owed ${owed.length}, loss lines ${losses.length}: expected one return, nothing owed`);
    test.assert(toOwner[0].look === lookBefore, `the bow came back as [${toOwner[0].look}], was [${lookBefore}]`);
  } finally {
    capture.stop();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(TNT_WAIT_TICKS + RECOVERY_SETTLE_TICKS + 200)
  .tag("andrew");

// ------------------------------------------------ the compatible bow enchantments stay; vanilla conflicts are the engine's

const SCRUB_STAND: Vector3 = { x: 3, y: 2, z: 3 };
const SCRUB_CHEST: Vector3 = { x: 5, y: 2, z: 5 };
/** The samples after the put: a scrub would have landed by the first, and nothing takes an enchantment off by the last. */
const SAMPLES = [1, 2, 5, 20];

interface KeepCase {
  name: string;
  enters: Enchants;
  /** What the stack must carry once it settled, sorted `id` + level. */
  expect: string[];
  prep?: (player: SimulatedPlayer, inv: Container, stack: ItemStack) => void;
  /** Puts the stack in; a command answers with its result. */
  put: (test: Test, player: SimulatedPlayer, inv: Container, stack: ItemStack) => string | void;
  /** What the command must answer: an enchantment the bow takes, or one the engine refuses as a vanilla conflict. */
  answer?: "success" | "refused";
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

const ALL_WITH_INFINITY: Enchants = BOW_DRESS.enchants ?? [];
const ALL_WITH_MENDING: Enchants = MENDING_DRESS.enchants ?? [];
const sorted = (e: Enchants): string[] => e.map(([id, level]) => `${id}${level}`).sort();

const KEEP_CASES: ReadonlyArray<KeepCase> = [
  { name: "setItem_hotbar_infinity", enters: ALL_WITH_INFINITY, expect: sorted(ALL_WITH_INFINITY), put: (_t, _p, inv, s) => void inv.setItem(0, s) },
  { name: "setItem_slot20_mending", enters: ALL_WITH_MENDING, expect: sorted(ALL_WITH_MENDING), put: (_t, _p, inv, s) => void inv.setItem(20, s) },
  {
    name: "addItem",
    enters: [
      ["power", 5],
      ["flame", 1],
      ["infinity", 1],
    ],
    expect: ["flame1", "infinity1", "power5"],
    put: (_t, _p, inv, s) => void inv.addItem(s),
  },
  {
    name: "chest_transfer",
    enters: [
      ["punch", 2],
      ["mending", 1],
      ["unbreaking", 3],
    ],
    expect: ["mending1", "punch2", "unbreaking3"],
    put: (test, _p, inv, s) => {
      const chest = test.getBlock(SCRUB_CHEST).getComponent("minecraft:inventory")?.container;
      if (chest === undefined) throw new Error("the chest has no inventory container");
      chest.setItem(0, s);
      chest.transferItem(0, inv);
    },
  },
  { name: "pickup", enters: ALL_WITH_INFINITY, expect: sorted(ALL_WITH_INFINITY), put: (test, player, _inv, s) => void test.getDimension().spawnItem(s, player.location) },
  {
    // The anvil's own shape: the stack the player already holds gains the enchantment.
    name: "enchant_in_place_flame",
    enters: [
      ["power", 5],
      ["unbreaking", 3],
    ],
    expect: ["flame1", "power5", "unbreaking3"],
    prep: inHand,
    put: (test, player) => enchantCommand(test, player, "flame", 1),
    answer: "success",
  },
  {
    name: "enchant_in_place_mending_beside_infinity",
    enters: [
      ["power", 5],
      ["infinity", 1],
    ],
    expect: ["infinity1", "power5"],
    prep: inHand,
    put: (test, player) => enchantCommand(test, player, "mending", 1),
    answer: "refused",
  },
  {
    name: "enchant_in_place_infinity_beside_mending",
    enters: [["mending", 1]],
    expect: ["mending1"],
    prep: inHand,
    put: (test, player) => enchantCommand(test, player, "infinity", 1),
    answer: "refused",
  },
];

/** Every Underwater Bow the player carries, with where it is. */
function bowsOf(player: Player): Array<{ where: number | "offhand"; stack: ItemStack }> {
  const out: Array<{ where: number | "offhand"; stack: ItemStack }> = [];
  const container = inventoryOf(player);
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack?.typeId === UB.itemId) out.push({ where: slot, stack });
  }
  const off = state.offhandOf(player);
  if (off?.typeId === UB.itemId) out.push({ where: "offhand", stack: off });
  return out;
}

const show = (stack: ItemStack | undefined): string => (stack === undefined ? "empty" : `${stack.typeId.replace("minecraft:", "").replace("andrew:", "")}[${enchantmentsOf(stack).join("+") || "none"}]`);

/**
 * Every way a bow reaches a player — a slot write in the hotbar and the inventory, addItem, a chest, a pick-up, an
 * enchantment added in place, the off hand with a hotbar change — keeps the compatible enchantments, and no scrub
 * report names the bow. The engine itself refuses Mending beside Infinity both ways, on the API and by command (the
 * vanilla conflict). The control: a trident with Loyalty in the same run is scrubbed, so the scrub is armed here.
 */
registerAsync("andrew", "ubow_enchant_kept", async (test: Test): Promise<void> => {
  const player = test.spawnSimulatedPlayer(SCRUB_STAND, "ublg_enchant", GameMode.Survival);
  test.setBlockType("minecraft:chest", SCRUB_CHEST);
  await test.idle(10);
  const inv = inventoryOf(player);
  const scrubs: ScrubReport[] = [];
  const stopScrubs = observeScrubs((r) => {
    if (r.playerId === player.id) scrubs.push(r);
  });
  const faults: string[] = [];
  try {
    test.assert(!FORBIDDEN_ENCHANTMENTS.has(UB.itemId), `FORBIDDEN_ENCHANTMENTS lists [${(FORBIDDEN_ENCHANTMENTS.get(UB.itemId) ?? []).join(", ")}] for the bow`);

    // The vanilla conflict on the API: the engine's own answer, before any scrub could act.
    const conflict = dressedBow(undefined, { enchants: [["infinity", 1]] }).stack;
    const enchantable = conflict.getComponent("minecraft:enchantable");
    // The engine answers a conflict by throwing, mislabelled as a level out of bounds, not by returning false.
    let canMending: string;
    try {
      canMending = String(enchantable?.canAddEnchantment({ type: new EnchantmentType("mending"), level: 1 }));
    } catch (err) {
      canMending = `threw(${errText(err)})`;
    }
    let addMending = "added";
    try {
      enchantable?.addEnchantment({ type: new EnchantmentType("mending"), level: 1 });
    } catch (err) {
      addMending = `threw(${errText(err)})`;
    }
    const canPower = enchantable?.canAddEnchantment({ type: new EnchantmentType("power"), level: 5 });
    log(`enchant conflict RESULT bow with infinity1: canAddEnchantment(mending1) ${canMending}, addEnchantment(mending1) ${addMending}, canAddEnchantment(power5) ${String(canPower)}; stack now [${enchantmentsOf(conflict).join("+")}]`);
    if (canMending === "true" || addMending === "added" || enchantmentsOf(conflict).includes("mending1")) faults.push("conflict: the engine let Mending onto a bow with Infinity");
    if (canPower !== true) faults.push("conflict: the engine refused Power V beside Infinity, so the refusal above proves nothing");

    for (const c of KEEP_CASES) {
      inv.clearAll();
      const mark: Mark = state.makeMark("admin", player);
      const made = dressedBow(mark, { enchants: c.enters });
      const entered = enchantmentsOf(made.stack);
      c.prep?.(player, inv, made.stack);
      await test.idle(3);
      scrubs.length = 0;

      const t0 = system.currentTick;
      let put: string | void;
      try {
        put = c.put(test, player, inv, made.stack);
      } catch (err) {
        put = `threw(${errText(err)})`;
      }
      const samples: string[] = [];
      let elapsed = 0;
      for (const d of SAMPLES) {
        await test.idle(d - elapsed);
        elapsed = d;
        samples.push(`+${system.currentTick - t0}=${bowsOf(player).map((x) => `${x.where}:${show(x.stack)}`).join(",") || "none"}`);
      }
      const held = bowsOf(player);
      const got = held.length === 1 ? enchantmentsOf(held[0].stack) : [];
      const now = held.length === 1 ? markOf(held[0].stack) : undefined;
      const bowScrubs = scrubs.filter((s) => s.itemId === UB.itemId);
      log(
        `keep ${c.name} RESULT built [${entered.join("+")}]${made.refused.length > 0 ? ` (refused ${made.refused.join(", ")})` : ""}; put ${put || "ok"}; ` +
          `scrubs on the bow [${bowScrubs.map((s) => `${s.where}:${s.trigger}:-${s.removed.join("+")}`).join(" ") || "none"}]; ${samples.join(" ")}; ` +
          `mark ${now === undefined ? "LOST" : `id ${now.id === mark.id ? "same" : now.id} gen ${now.gen}/${mark.gen}`}`
      );
      const fault = (msg: string): void => void faults.push(`${c.name}: ${msg}`);
      if (made.refused.length > 0) fault(`the engine refused [${made.refused.join(", ")}] on a bare bow`);
      if (held.length !== 1) fault(`the player carries ${held.length} bows, expected exactly 1`);
      if (got.join("+") !== c.expect.join("+")) fault(`the bow settled as [${got.join("+")}], expected [${c.expect.join("+")}]`);
      if (now === undefined || now.id !== mark.id || now.gen !== mark.gen) fault("the instance mark did not survive");
      if (bowScrubs.length > 0) fault(`${bowScrubs.length} scrub(s) took [${bowScrubs.map((s) => s.removed.join("+")).join(" ")}] off the bow`);
      if (c.answer === "success" && !String(put).startsWith("success=1")) fault(`the /enchant that adds a compatible enchantment answered ${String(put)}`);
      if (c.answer === "refused" && String(put).startsWith("success=1")) fault(`the /enchant of a conflicting enchantment answered ${String(put)}`);
    }

    // The off hand: no inventory event names it, so the scrub looks there on a hotbar change only.
    inv.clearAll();
    player.selectedSlotIndex = 0;
    await test.idle(2);
    const offMark = state.makeMark("admin", player);
    state.setOffhand(player, dressedBow(offMark, BOW_DRESS).stack);
    await test.idle(5);
    scrubs.length = 0;
    player.selectedSlotIndex = 3;
    await test.idle(4);
    const off = state.offhandOf(player);
    const offNow = markOf(off);
    log(`keep offhand_hand_change RESULT off hand ${show(off)}; scrubs [${scrubs.map((s) => `${s.itemId}:${s.where}:-${s.removed.join("+")}`).join(" ") || "none"}]; mark ${offNow === undefined ? "LOST" : `gen ${offNow.gen}`}`);
    if (enchantmentsOf(off).join("+") !== sorted(ALL_WITH_INFINITY).join("+")) faults.push(`offhand: the bow settled as ${show(off)}`);
    if (scrubs.length > 0) faults.push(`offhand: ${scrubs.length} scrub(s) on a hand change`);
    if (offNow?.id !== offMark.id) faults.push("offhand: the instance mark did not survive");
    player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Offhand, undefined);

    // The control: the same scrub, armed in this run, takes Loyalty off a trident.
    inv.clearAll();
    await test.idle(2);
    scrubs.length = 0;
    const trident = new ItemStack(TRIDENT.itemId, 1);
    trident.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType("loyalty"), level: 3 });
    trident.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType("unbreaking"), level: 3 });
    inv.setItem(0, state.markItem(TRIDENT, trident, state.makeMark("admin", player)));
    await test.idle(5);
    const kept = enchantmentsOf(inv.getItem(0));
    log(`keep control RESULT trident settled as [${kept.join("+")}]; scrubs [${scrubs.map((s) => `${s.itemId}:-${s.removed.join("+")}`).join(" ") || "none"}]`);
    if (scrubs.length !== 1 || kept.join("+") !== "unbreaking3") faults.push(`control: the trident's Loyalty was not scrubbed (${scrubs.length} scrubs, [${kept.join("+")}]) — the scrub is not armed, so the bow cases prove nothing`);
  } finally {
    stopScrubs();
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

// ------------------------------------------------ the UFO magnet holds the bow and lets it go: never swallowed

/** Room for the elements to reach the saucer and circle it. */
const HOLD_TICKS = 120;
/** From the hover height back onto the pad. */
const FALL_TICKS = 100;
/** Two 40-tick recovery checks after the fall: a loss misread would have been handed out by then. */
const MAGNET_SETTLE_TICKS = 100;

/**
 * The magnet takes a legendary like iron (operator decision 2026-10-04, de0fc68): the bow on the ground, the bow in a
 * chest and a stand holding a bow are elements. A whole magnet phase runs over them — selection, hold, release — and
 * the bow is never swallowed: each marked bow is still one copy at its generation with its look, nothing is owed, no
 * loss line names it, and the stand still holds its bow. An iron ingot rides along as the parity control.
 */
registerAsync("andrew", "ubow_magnet_not_swallowed", async (test: Test): Promise<void> => {
  const owner = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 3 }, "ublg_magnet_owner", GameMode.Survival);
  const p = await pad(test, "andrew_gt_magn_ub", 9);
  const extras: Entity[] = [];
  const capture = captureWarnings();
  let magnet: UfoMagnet | undefined;
  const saucer = { x: p.cx + 0.5, y: p.hoverY, z: p.cz + 0.5 };
  const payload = { centre: p.centre, hoverY: p.hoverY, saucerPos: saucer, eventId: "gt-ubow-magnet" };
  try {
    assertClean(test, p);
    const groundMark = state.makeMark("admin", owner);
    const groundBow = dressedBow(groundMark, BOW_DRESS).stack;
    const ground = p.dim.spawnItem(groundBow, middle(onPad(p, 3, 0)));
    const chestMark = state.makeMark("admin", owner);
    const chestBow = dressedBow(chestMark, MENDING_DRESS).stack;
    const chest = onPad(p, 0, -6);
    setBlock(p, chest, "minecraft:chest");
    const box = containerAt(p, chest);
    box.setItem(0, chestBow);
    box.setItem(2, new ItemStack("minecraft:dirt", 3));
    const stand = p.dim.spawnEntity("minecraft:armor_stand", middle(onPad(p, -6, 0)));
    const ingot = p.dim.spawnItem(new ItemStack("minecraft:iron_ingot", 1), middle(onPad(p, 0, 5)));
    extras.push(ground, stand, ingot);
    await test.idle(2);
    ground.clearVelocity();
    ingot.clearVelocity();
    dress(stand, { mainhand: UB.itemId });
    await test.idle(4);
    test.assert(hasInHand(stand, UB.itemId), "the stand does not hold the bow before the magnet");

    magnet = new UfoMagnet({ overworld: () => p.dim, players: () => [], saucerPosition: () => saucer, spawns: world.afterEvents.entitySpawn, host });
    magnet.onPhase("magnet", payload);
    const view = magnet.view();
    test.assert(view !== undefined, "the magnet phase did not start");
    const elements = view?.elements ?? [];
    const chestEntity = elements.find((e) => e.cls === STACK && markOf(stackOf(e.entity))?.id === chestMark.id)?.entity;
    const taken = {
      ground: elements.some((e) => e.cls === GROUND && e.entity.id === ground.id),
      chest: chestEntity !== undefined,
      stand: elements.some((e) => e.cls === HOLDER && e.entity.id === stand.id) && stand.hasTag(IRON_TAG),
      ingot: elements.some((e) => e.cls === GROUND && e.entity.id === ingot.id),
    };
    test.assert(taken.ground && taken.chest && taken.stand && taken.ingot, `the magnet did not take every element: ${JSON.stringify(taken)}`);
    test.assert(box.getItem(0) === undefined && box.getItem(2)?.typeId === "minecraft:dirt", "the chest kept its bow, or lost its dirt");

    const tracked: Array<[string, Entity]> = [
      ["ground bow", ground],
      ["chest bow", chestEntity as Entity],
      ["stand", stand],
      ["ingot", ingot],
    ];
    const peak = new Map<string, number>(tracked.map(([name]) => [name, -Infinity]));
    for (let t = 0; t < HOLD_TICKS; t++) {
      magnet.magnetStep(system.currentTick);
      await test.idle(1);
      for (const [name, e] of tracked) if (e.isValid) peak.set(name, Math.max(peak.get(name) ?? -Infinity, e.location.y));
    }
    magnet.onPhase("release", payload);
    magnet = undefined;
    await test.idle(FALL_TICKS + MAGNET_SETTLE_TICKS);

    const rows = [
      { name: "ground bow", mark: groundMark, look: lookText(groundBow) },
      { name: "chest bow", mark: chestMark, look: lookText(chestBow) },
    ].map(({ name, mark, look }) => {
      const onGround = groundCopies(p.dim, p.centre, mark.id, 64);
      const carried = carriedCopies(owner, mark.id);
      return {
        name,
        look,
        copies: onGround.length + carried.length,
        gens: [...onGround.map((g) => g.gen), ...carried.map((c) => c.gen)],
        looks: [...onGround.map((g) => g.look), ...carried.map((c) => c.look)],
        landed: onGround.map((g) => f1(g.entity.location)),
        ledger: state.ledgerGen(UB, mark.id),
        owed: owedOf(mark.id).length,
        losses: lossLines(capture.lines, mark.id).length,
      };
    });
    const lifted = (name: string): number => (peak.get(name) ?? -Infinity) - (p.top + 1);
    log(
      `magnet RESULT taken ${JSON.stringify(taken)}; lifted above the pad [${tracked.map(([name]) => `${name} ${lifted(name).toFixed(1)}`).join(", ")}] ` +
        `(saucer at ${(p.hoverY - p.top).toFixed(1)}); after the release: ${rows
          .map((r) => `${r.name} copies ${r.copies} gens [${r.gens.join(" ")}] at [${r.landed.join(" ")}] look [${r.looks.join(" | ")}] ledger ${r.ledger} owed ${r.owed} loss lines ${r.losses}`)
          .join("; ")}; stand valid ${stand.isValid}, holds the bow ${stand.isValid && hasInHand(stand, UB.itemId)}, tagged ${stand.isValid && stand.hasTag(IRON_TAG)}`
    );
    for (const name of ["ground bow", "chest bow", "stand", "ingot"]) test.assert(lifted(name) >= 5, `the ${name} rose only ${lifted(name).toFixed(1)} blocks: the magnet did not hold it`);
    for (const r of rows) {
      test.assert(r.copies === 1 && r.gens[0] === 0, `the ${r.name} exists ${r.copies} time(s) at gens [${r.gens.join(" ")}] after the release, expected once at gen 0`);
      test.assert(r.ledger === 0 && r.owed === 0 && r.losses === 0, `the ${r.name} was read as lost: ledger ${r.ledger}, owed ${r.owed}, loss lines ${r.losses}`);
      test.assert(r.looks[0] === r.look, `the ${r.name} lies as [${r.looks[0]}], was [${r.look}]`);
    }
    // A stand the fall breaks spills its bow as a plain item: vanilla, and still not swallowed.
    const standBow = stand.isValid
      ? hasInHand(stand, UB.itemId)
      : p.dim.getEntities({ type: "minecraft:item", location: p.centre, maxDistance: 64 }).filter((e) => e.isValid && stackOf(e)?.typeId === UB.itemId && markOf(stackOf(e)) === undefined).length === 1;
    test.assert(standBow, `the stand's bow is gone (stand valid ${stand.isValid})`);
    test.assert(!stand.isValid || !stand.hasTag(IRON_TAG), "the stand kept the held tag after the release");
  } finally {
    if (magnet !== undefined) magnet.onPhase("release", payload);
    capture.stop();
    for (const e of extras) if (e.isValid) e.removeTag(IRON_TAG);
    removeAll(extras);
    clearItems(p);
    p.unload();
    if (owner.isValid) test.removeSimulatedPlayer(owner);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(HOLD_TICKS + FALL_TICKS + MAGNET_SETTLE_TICKS + 400)
  .tag("andrew");

// ------------------------------------------------ a restart: the bow on the ground stays protected, a debt stays owed

const RESTART_FIELD: Vector3 = { x: 400, y: 1, z: -2400 };
const RESTART_AREA = "andrew_gt_ublg_rs";
const RESTART_KEY = "andrew:gt_ublg_restart";
const RESTART_HALF = 3;

interface RestartRecord {
  ownerId: string;
  ground: { id: string; gen: number; look: string };
  owed: { id: string; gen: number; look: string };
  savedAt: number;
}

/** A stone floor far from every other scenario, held loaded by a ticking area until `unload`. */
async function restartSite(test: Test): Promise<{ dim: Dimension; at(x: number, y: number, z: number): Vector3; unload(): void }> {
  const dim = test.getDimension();
  const o = test.worldBlockLocation(RESTART_FIELD);
  const unload = await loadBox(test, dim, RESTART_AREA, { min: [o.x - 16, 0, o.z - 16], max: [o.x + 16, 0, o.z + 16] });
  dim.fillBlocks(new BlockVolume({ x: o.x - RESTART_HALF, y: o.y, z: o.z - RESTART_HALF }, { x: o.x + RESTART_HALF, y: o.y + 4, z: o.z + RESTART_HALF }), "minecraft:air");
  dim.fillBlocks(new BlockVolume({ x: o.x - RESTART_HALF, y: o.y - 1, z: o.z - RESTART_HALF }, { x: o.x + RESTART_HALF, y: o.y - 1, z: o.z + RESTART_HALF }), "minecraft:stone");
  return { dim, at: (x, y, z) => ({ x: o.x + x, y: o.y + y, z: o.z + z }), unload };
}

/**
 * Before the stop: a dressed bow lies on a far floor, watched, at gen 0; a second one is lost in the Void while its
 * holder is offline, so it is owed to them at gen 1 with its look. The floor is let go before the stop, so the bow is
 * saved with its chunk and comes back through entityLoad when the check asks for it.
 */
registerAsync("andrew", "ubow_restart_seed", async (test: Test): Promise<void> => {
  world.setDynamicProperty(RESTART_KEY, undefined);
  const site = await restartSite(test);
  const owner = test.spawnSimulatedPlayer(STAND_A, "ublg_restart_owner", GameMode.Survival);
  await test.idle(4);
  const capture = captureWarnings();
  try {
    const groundMark = state.makeMark("admin", owner);
    const groundBow = dressedBow(groundMark, BOW_DRESS).stack;
    const owedMark = state.makeMark("admin", owner);
    const owedBow = dressedBow(owedMark, MENDING_DRESS).stack;
    const ground = site.dim.spawnItem(groundBow, { ...site.at(0.5, 0.2, 0.5) });
    const lost = site.dim.spawnItem(owedBow, { ...site.at(2.5, 0.2, 2.5) });
    ground.clearVelocity();
    lost.clearVelocity();
    // Watched on the floor first: an item already below the floor at its spawn is not the case under test.
    await test.idle(6);
    const ownerId = owner.id;
    owner.disconnect();
    await test.idle(2);
    lost.teleport({ ...lost.location, y: site.dim.heightRange.min - 8 });
    await waitFor(test, WAIT_TICKS, () => owedOf(owedMark.id).length > 0);
    await test.idle(40);

    const owed = owedOf(owedMark.id);
    const groundNow = groundCopies(site.dim, site.at(0, 0, 0), groundMark.id, 16);
    log(
      `restart_seed RESULT ground bow ${groundMark.id} on the floor [${groundNow.map((g) => `${f1(g.entity.location)}@gen${g.gen}`).join(" ")}], ledger ${state.ledgerGen(UB, groundMark.id)}, ` +
        `owed ${owedOf(groundMark.id).length}; lost bow ${owedMark.id}: owed [${owed.map((o) => `${o.target === ownerId ? "owner" : o.target}@gen${o.entry.mark.gen} [${storedLookText(o.entry.mark.look)}]`).join(" ")}], ` +
        `ledger ${state.ledgerGen(UB, owedMark.id)}; loss lines ${lossLines(capture.lines, owedMark.id).length}`
    );
    test.assert(groundNow.length === 1 && groundNow[0].gen === 0 && state.ledgerGen(UB, groundMark.id) === 0, "the ground bow is not one copy at gen 0");
    test.assert(owedOf(groundMark.id).length === 0, "the ground bow is owed before the restart");
    test.assert(owed.length === 1 && owed[0].target === ownerId && owed[0].entry.mark.gen === 1, "the lost bow is not owed once, at gen 1, to its offline holder");
    test.assert(storedLookText(owed[0].entry.mark.look) === lookText(owedBow), `the debt stores [${storedLookText(owed[0].entry.mark.look)}], the bow was [${lookText(owedBow)}]`);
    const record: RestartRecord = {
      ownerId,
      ground: { id: groundMark.id, gen: 0, look: lookText(groundBow) },
      owed: { id: owedMark.id, gen: 1, look: lookText(owedBow) },
      savedAt: Date.now(),
    };
    world.setDynamicProperty(RESTART_KEY, JSON.stringify(record));
  } finally {
    capture.stop();
    // Nothing may hold the floor over the stop: the bow is saved with its chunk and loads only when the check asks.
    site.unload();
  }
  await test.idle(20);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(WAIT_TICKS + 300)
  .tag("andrew");

/**
 * After the restart: the debt is still there, at gen 1 with its look; the ground bow loads with its floor as the same
 * single copy at gen 0, nothing reads it as lost, and recovery watches it again — removed (a despawn, to the script),
 * it is returned to its offline holder at gen 1 with its look.
 */
registerAsync("andrew", "ubow_restart_check", async (test: Test): Promise<void> => {
  const raw = world.getDynamicProperty(RESTART_KEY);
  test.assert(typeof raw === "string", "no record: ubow_restart_seed did not run in this world before the restart");
  const rec = JSON.parse(raw as string) as RestartRecord;
  const owedAtBoot = owedOf(rec.owed.id);
  const groundOwedAtBoot = owedOf(rec.ground.id).length;
  const ledgersAtBoot = [state.ledgerGen(UB, rec.ground.id), state.ledgerGen(UB, rec.owed.id)];
  const capture = captureWarnings();
  let site: Awaited<ReturnType<typeof restartSite>> | undefined;
  try {
    const dim = test.getDimension();
    const o = test.worldBlockLocation(RESTART_FIELD);
    const unload = await loadBox(test, dim, RESTART_AREA, { min: [o.x - 16, 0, o.z - 16], max: [o.x + 16, 0, o.z + 16] });
    site = { dim, at: (x, y, z) => ({ x: o.x + x, y: o.y + y, z: o.z + z }), unload };
    let ground = groundCopies(dim, o, rec.ground.id, 16);
    const waited = await waitFor(test, 300, () => (ground = groundCopies(dim, o, rec.ground.id, 16)).length > 0);
    // Three recovery checks: a load misread as a loss would have issued its copy by now.
    await test.idle(140);
    ground = groundCopies(dim, o, rec.ground.id, 16);
    const loadedAsLost = lossLines(capture.lines, rec.ground.id).length;
    const watchedAgain = capture.lines.filter((l) => l.includes("legendary recovery:") && l.includes(rec.ground.id));
    log(
      `restart_check RESULT ${((Date.now() - rec.savedAt) / 1000).toFixed(1)} s since the seed; at boot: owed [${owedAtBoot
        .map((x) => `${x.target === rec.ownerId ? "owner" : x.target}@gen${x.entry.mark.gen} [${storedLookText(x.entry.mark.look)}]`)
        .join(" ")}], ground bow owed ${groundOwedAtBoot}, ledgers ground/lost [${ledgersAtBoot.join(" ")}]; ground bow loaded after ${waited} tick(s): ` +
        `[${ground.map((g) => `${f1(g.entity.location)}@gen${g.gen} [${g.look}]`).join(" ")}], loss lines on load ${loadedAsLost}`
    );
    test.assert(owedAtBoot.length === 1 && owedAtBoot[0].target === rec.ownerId && owedAtBoot[0].entry.mark.gen === rec.owed.gen, "the debt did not survive the restart once, at gen 1, for the bow's holder");
    test.assert(storedLookText(owedAtBoot[0].entry.mark.look) === rec.owed.look, `the debt lost its look over the restart: [${storedLookText(owedAtBoot[0].entry.mark.look)}], was [${rec.owed.look}]`);
    test.assert(ledgersAtBoot[0] === rec.ground.gen && ledgersAtBoot[1] === rec.owed.gen, `the generation ledgers read [${ledgersAtBoot.join(" ")}] after the restart, expected [${rec.ground.gen} ${rec.owed.gen}]`);
    test.assert(groundOwedAtBoot === 0, "the ground bow is owed after the restart: a second copy would be issued");
    test.assert(ground.length === 1 && ground[0].gen === rec.ground.gen && ground[0].look === rec.ground.look, "the ground bow did not come back with its floor as the same single copy");
    test.assert(loadedAsLost === 0 && state.ledgerGen(UB, rec.ground.id) === rec.ground.gen, "loading the ground bow was read as a loss");

    // Recovery watches it again: removed, it is returned to its offline holder.
    ground[0].entity.remove();
    await waitFor(test, VOID_RETURN_TICKS, () => owedOf(rec.ground.id).length > 0);
    await test.idle(10);
    const after = owedOf(rec.ground.id);
    log(
      `restart_check RESULT after a despawn: ground bow owed [${after.map((x) => `${x.target === rec.ownerId ? "owner" : x.target}@gen${x.entry.mark.gen} [${storedLookText(x.entry.mark.look)}]`).join(" ")}], ` +
        `ledger ${state.ledgerGen(UB, rec.ground.id)}; recovery lines: ${watchedAgain.concat(lossLines(capture.lines, rec.ground.id)).join(" | ") || "none"}`
    );
    test.assert(after.length === 1 && after[0].target === rec.ownerId && after[0].entry.mark.gen === rec.ground.gen + 1, "the despawned bow is not owed once, at the next generation, to its holder: recovery did not watch it after the restart");
    test.assert(storedLookText(after[0].entry.mark.look) === rec.ground.look, `the despawned bow is owed as [${storedLookText(after[0].entry.mark.look)}], was [${rec.ground.look}]`);
  } finally {
    capture.stop();
    clearOwed(rec.ownerId);
    world.setDynamicProperty(RESTART_KEY, undefined);
    site?.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300 + 140 + VOID_RETURN_TICKS + 200)
  .tag("andrew");
