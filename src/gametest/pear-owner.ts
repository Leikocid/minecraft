// PEAR-OWNER-01 on BDS 1.26.51.1 (spec v3 §7; C-45, L0-pear-ru01, L0-pear-ac04): a binding belongs to its binder's
// life. The binder's death voids every rod they bound — dropped, in a chest, in a stranger's hand — with no search, and
// ends a trip under way; a stranger holding a bound rod casts as usual, and their own hit binds the rod to them. The
// trips are the release teleport.ts, armed in this pack by src/gametest/pear-teleport.ts. The "[pear-owner] … RESULT"
// lines are quoted in src/pearl/README.md.

import {
  BlockVolume,
  type Container,
  type Dimension,
  type Entity,
  type EntitySpawnAfterEvent,
  GameMode,
  type ItemStack,
  type Player,
  ScreenDisplay,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { bindingOf, lifeEpochOf } from "../pearl/bind";
import { type Binding, HOOK_ID } from "../pearl/bind-rules";
import { makePearlRod } from "../pearl/item";
import { MARK_KEY } from "../pearl/item-rules";
import { honourFor, ownerStats, registerPearlOwner } from "../pearl/owner";
import { honourOf } from "../pearl/owner-rules";
import { heldAreaNames, lastOutcome, pendingTrips, teleportStats } from "../pearl/teleport";

// The release pack arms the same module and cannot read a SimulatedPlayer's death (C-2); this copy is the one the
// scenarios drive, through the same entityDie a human's death goes through.
registerPearlOwner();

const STRUCTURE = "andrew:platform";
const STONE_PLATE = "minecraft:stone_pressure_plate";

const CAST_FROM: Vector3 = { x: 3, y: 2, z: 0 };
const FIELD_MIN: Vector3 = { x: 0, y: 2, z: 1 };
const FIELD_MAX: Vector3 = { x: 6, y: 2, z: 6 };
/** A hook falls below the line of sight: aimed at this floor point it rests in the plate cell rel 3,2,3 (PEAR-BIND-01). */
const AIM: Vector3 = { x: 3.5, y: 2, z: 5.5 };
const CHEST_AT: Vector3 = { x: 6, y: 2, z: 0 };
/** Far from the death spot, so A's spilled rod cannot roll into B's pick-up range. */
const BYSTANDER_AT: Vector3 = { x: 6, y: 2, z: 6 };
/** Where A's spilled rod is put to wait for A: on the platform, off every cast path. */
const DROP_REST: Vector3 = { x: 0.5, y: 2, z: 0.5 };

const LANE_A: Vector3 = { x: 1, y: 2, z: 0 };
const LANE_B: Vector3 = { x: 5, y: 2, z: 0 };
const AIM_A: Vector3 = { x: 1.5, y: 2, z: 5.5 };
const AIM_B: Vector3 = { x: 5.5, y: 2, z: 5.5 };
const LEFT_MIN: Vector3 = { x: 0, y: 2, z: 1 };
const LEFT_MAX: Vector3 = { x: 2, y: 2, z: 6 };
const RIGHT_MIN: Vector3 = { x: 4, y: 2, z: 1 };
const RIGHT_MAX: Vector3 = { x: 6, y: 2, z: 6 };

/** A use a SimulatedPlayer drops shows as no new hook this many ticks later (it accepts one about every 11 ticks). */
const USE_EVIDENCE_TICKS = 6;
const USE_TRIES = 10;
const BIND_WAIT_TICKS = 60;
const PICKUP_TICKS = 100;
const DEATH_WAIT_TICKS = 20;
const RESPAWN_TICKS = 20;
/** A near plate arrives within a few ticks; the preload timeout is 200 (PRELOAD_TIMEOUT_TICKS). */
const TRIP_WAIT_TICKS = 260;

const log = (msg: string): void => console.warn(`[pear-owner] ${msg}`);
const short = (id: string): string => id.replace("minecraft:", "");
const v3 = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const dist = (a: Vector3, b: Vector3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
/** `at` stands in the block cell `cell`. */
const inCell = (at: Vector3, cell: Vector3): boolean => Math.floor(at.x) === cell.x && Math.floor(at.y) === cell.y && Math.floor(at.z) === cell.z;

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) throw new Error(`${player.name} has no inventory container`);
  return container;
}

async function survivor(test: Test, at: Vector3, name: string): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  await test.idle(3);
  return p;
}

function fill(test: Test, min: Vector3, max: Vector3, typeId: string): void {
  test.getDimension().fillBlocks(new BlockVolume(test.worldBlockLocation(min), test.worldBlockLocation(max)), typeId);
}

const rel = (test: Test, at: Vector3): string => v3(test.relativeBlockLocation(at));
const rodIdOf = (stack: ItemStack | undefined): string | undefined => {
  const id = stack?.typeId === "minecraft:fishing_rod" ? stack.getDynamicProperty(MARK_KEY) : undefined;
  return typeof id === "string" ? id : undefined;
};

/** The slot of the rod with mark `rodId` in `p`'s inventory, or undefined. */
function slotOf(p: Player, rodId: string): number | undefined {
  const inv = inventoryOf(p);
  for (let slot = 0; slot < inv.size; slot++) if (rodIdOf(inv.getItem(slot)) === rodId) return slot;
  return undefined;
}

function rodOf(p: Player, rodId: string): ItemStack | undefined {
  const slot = slotOf(p, rodId);
  return slot === undefined ? undefined : inventoryOf(p).getItem(slot);
}

const bindingText = (test: Test, b: Binding | undefined): string =>
  b === undefined ? "none" : `${short(b.type)}@rel${rel(test, b.pos)} owner=${b.owner} epoch=${b.epoch}`;

const sameBinding = (a: Binding | undefined, b: Binding | undefined): boolean =>
  a !== undefined && b !== undefined && a.dim === b.dim && v3(a.pos) === v3(b.pos) && a.type === b.type && a.owner === b.owner && a.epoch === b.epoch && a.gen === b.gen;

/** The honour `p` gets from `stack`, as the use gate reads it: this player's id and current life epoch. */
const honourText = (p: Player, stack: ItemStack | undefined): string => `${p.name}:${honourFor(p, stack)}(epoch ${lifeEpochOf(p)})`;

/** Hooks by caster name from entitySpawn (the owner is readable at +0, probe Q3), and player deaths by id. */
class Witness {
  readonly hooks = new Map<string, Entity[]>();
  readonly deaths = new Map<string, { tick: number; cause: string; count: number }>();
  private readonly undo: Array<() => void> = [];

  constructor() {
    const a = world.afterEvents;
    const spawn = a.entitySpawn.subscribe((ev: EntitySpawnAfterEvent) => {
      if (ev.entity.typeId !== HOOK_ID) return;
      const owner = ev.entity.getComponent("minecraft:projectile")?.owner;
      const name = owner?.isValid === true && owner.typeId === "minecraft:player" ? (owner as Player).name : "?";
      const list = this.hooks.get(name) ?? [];
      list.push(ev.entity);
      this.hooks.set(name, list);
    });
    this.undo.push(() => a.entitySpawn.unsubscribe(spawn));
    const die = a.entityDie.subscribe((ev) => {
      const dead: Entity | undefined = ev.deadEntity;
      if (dead === undefined || dead.typeId !== "minecraft:player") return;
      const seen = this.deaths.get(dead.id);
      this.deaths.set(dead.id, { tick: system.currentTick, cause: ev.damageSource.cause, count: (seen?.count ?? 0) + 1 });
    });
    this.undo.push(() => a.entityDie.unsubscribe(die));
  }

  count(p: Player): number {
    return this.hooks.get(p.name)?.length ?? 0;
  }

  last(p: Player): Entity | undefined {
    const list = this.hooks.get(p.name);
    return list?.[list.length - 1];
  }

  close(): void {
    for (const u of this.undo) u();
  }
}

/** Puts `rod` into `slot`, selects it and aims (setItem with selectSlot turns a SimulatedPlayer's head back). */
async function arm(test: Test, p: SimulatedPlayer, slot: number, aim: Vector3, rod?: ItemStack): Promise<void> {
  if (rod !== undefined) p.setItem(rod, slot, true);
  else p.selectedSlotIndex = slot;
  await test.idle(2);
  p.lookAtLocation(aim, LookDuration.Instant);
  await test.idle(2);
}

/** One use of the selected rod, retried until a new hook of `p` shows the cast happened; undefined after USE_TRIES. */
async function tryCast(test: Test, p: SimulatedPlayer, w: Witness): Promise<Entity | undefined> {
  for (let tries = 0; tries < USE_TRIES; tries++) {
    const before = w.count(p);
    p.useItemInSlot(p.selectedSlotIndex);
    for (let t = 0; t < USE_EVIDENCE_TICKS && w.count(p) === before; t++) await test.idle(1);
    if (w.count(p) > before) return w.last(p);
  }
  return undefined;
}

async function cast(test: Test, p: SimulatedPlayer, w: Witness): Promise<Entity> {
  const hook = await tryCast(test, p, w);
  if (hook === undefined) throw new Error(`${p.name}: no hook after ${USE_TRIES} uses`);
  return hook;
}

/** Waits for the rod `rodId` in `p`'s inventory to carry a binding that differs from `before`. */
async function awaitBinding(test: Test, p: Player, rodId: string, before: Binding | undefined): Promise<Binding | undefined> {
  for (let t = 0; t < BIND_WAIT_TICKS; t++) {
    const b = bindingOf(rodOf(p, rodId));
    if (b !== undefined && !sameBinding(b, before)) return b;
    await test.idle(1);
  }
  return undefined;
}

/** A fresh Pearl Rod in `slot`, cast into the plate field and bound; returns its id and record. */
async function bindFresh(test: Test, p: SimulatedPlayer, slot: number, aim: Vector3, w: Witness): Promise<{ rodId: string; binding: Binding }> {
  const rod = makePearlRod();
  const rodId = rodIdOf(rod) as string;
  await arm(test, p, slot, aim, rod);
  await cast(test, p, w);
  const binding = await awaitBinding(test, p, rodId, undefined);
  if (binding === undefined) throw new Error(`${p.name}: rod ${rodId} in slot ${slot} never bound`);
  return { rodId, binding };
}

async function droppedRod(test: Test, near: Vector3, rodId: string): Promise<Entity | undefined> {
  for (let t = 0; t < 10; t++) {
    const found = test
      .getDimension()
      .getEntities({ type: "minecraft:item", location: near, maxDistance: 8 })
      .find((e) => rodIdOf(e.getComponent("minecraft:item")?.itemStack) === rodId);
    if (found !== undefined) return found;
    await test.idle(1);
  }
  return undefined;
}

async function waitToCarry(test: Test, p: Player, rodId: string): Promise<number | undefined> {
  for (let t = 0; t < PICKUP_TICKS; t++) {
    const slot = slotOf(p, rodId);
    if (slot !== undefined) return slot;
    await test.idle(1);
  }
  return undefined;
}

/** A dropped rod entity is put at `to`'s feet and picked up; returns the slot it landed in. */
async function pickUp(test: Test, to: SimulatedPlayer, entity: Entity, rodId: string): Promise<number> {
  entity.teleport(to.location);
  const slot = await waitToCarry(test, to, rodId);
  if (slot === undefined) throw new Error(`${to.name} never picked up rod ${rodId}`);
  // The pick-up's playerInventoryItemChange reaches scripts after the GameTest continuations of its tick.
  await test.idle(2);
  return slot;
}

/** `from` throws the rod and `to` picks it up: the transfer the spec names (§7). Returns `to`'s slot. */
async function handOver(test: Test, from: SimulatedPlayer, to: SimulatedPlayer, rodId: string): Promise<number> {
  const slot = slotOf(from, rodId);
  if (slot === undefined) throw new Error(`${from.name} does not carry rod ${rodId}`);
  from.selectedSlotIndex = slot;
  await test.idle(1);
  if (!from.dropSelectedItem()) throw new Error(`${from.name}: dropSelectedItem refused`);
  const entity = await droppedRod(test, from.location, rodId);
  if (entity === undefined) throw new Error(`no item entity after ${from.name}'s throw of rod ${rodId}`);
  return pickUp(test, to, entity, rodId);
}

/** Kills `p` and waits for its entityDie; returns the epoch before and after. */
async function killAndWait(test: Test, p: SimulatedPlayer, w: Witness): Promise<{ before: number; after: number; died: boolean; cause: string }> {
  const before = lifeEpochOf(p);
  const seen = w.deaths.get(p.id)?.count ?? 0;
  p.kill();
  for (let t = 0; t < DEATH_WAIT_TICKS && (w.deaths.get(p.id)?.count ?? 0) === seen; t++) await test.idle(1);
  const death = w.deaths.get(p.id);
  return { before, after: lifeEpochOf(p), died: (death?.count ?? 0) > seen, cause: death?.cause ?? "none" };
}

/** Respawns `p` at the spawn point set before its death, back on the platform. */
async function respawnAt(test: Test, p: SimulatedPlayer, at: Vector3): Promise<void> {
  p.respawn();
  await test.idle(RESPAWN_TICKS);
  const want = test.worldLocation(at);
  if (Math.hypot(p.location.x - (want.x + 0.5), p.location.z - (want.z + 0.5)) > 1.5) p.teleport({ x: want.x + 0.5, y: want.y, z: want.z + 0.5 });
  await test.idle(2);
}

function setSpawnHere(test: Test, p: Player, at: Vector3): void {
  const w = test.worldLocation(at);
  p.setSpawnPoint({ dimension: test.getDimension(), x: Math.floor(w.x), y: Math.floor(w.y), z: Math.floor(w.z) });
}

function chestOf(test: Test): Container {
  const container = test.getDimension().getBlock(test.worldBlockLocation(CHEST_AT))?.getComponent("minecraft:inventory")?.container;
  if (container === undefined) throw new Error("the chest has no inventory container");
  return container;
}

function chestRod(test: Test, rodId: string): ItemStack | undefined {
  const chest = chestOf(test);
  for (let slot = 0; slot < chest.size; slot++) {
    const s = chest.getItem(slot);
    if (rodIdOf(s) === rodId) return s;
  }
  return undefined;
}

/** Moves the rod `rodId` from `p`'s inventory into the chest's first free slot. */
function stashInChest(test: Test, p: Player, rodId: string): void {
  const slot = slotOf(p, rodId);
  if (slot === undefined) throw new Error(`${p.name} does not carry rod ${rodId}`);
  const inv = inventoryOf(p);
  const stack = inv.getItem(slot);
  chestOf(test).addItem(stack as ItemStack);
  inv.setItem(slot, undefined);
}

/** Moves the rod `rodId` from the chest into `p`'s `slot`. */
function takeFromChest(test: Test, p: Player, rodId: string, slot: number): void {
  const chest = chestOf(test);
  for (let i = 0; i < chest.size; i++) {
    const s = chest.getItem(i);
    if (rodIdOf(s) !== rodId) continue;
    inventoryOf(p).setItem(slot, s);
    chest.setItem(i, undefined);
    return;
  }
  throw new Error(`rod ${rodId} is not in the chest`);
}

function clearChest(test: Test): void {
  test.getDimension().getBlock(test.worldBlockLocation(CHEST_AT))?.getComponent("minecraft:inventory")?.container?.clearAll();
}

function removeHooksOf(test: Test, p: Player): void {
  for (const h of test.getDimension().getEntities({ type: HOOK_ID })) {
    const o = h.getComponent("minecraft:projectile")?.owner;
    if (o?.isValid === true && o.id === p.id) h.remove();
  }
}

async function home(test: Test, p: SimulatedPlayer, at: Vector3): Promise<void> {
  p.teleport(test.worldLocation({ x: at.x + 0.5, y: at.y, z: at.z + 0.5 }), { dimension: test.getDimension() });
  await test.idle(3);
}

interface Use {
  kind: "trip" | "cast" | "none";
  /** The tick the gate took the use, or the tick its hook was seen. */
  tick: number;
  hook: Entity | undefined;
  /** Where the hook was when it was seen; the hook itself may be gone by the time anyone reads it. */
  hookAt: Vector3 | undefined;
}

/**
 * One use of the selected rod, retried past the uses a SimulatedPlayer drops, until the use gate takes it as a trip or
 * a new hook shows a cast. The gate counts in beforeEvents.itemUse, so a trip is seen in the tick of the use.
 */
async function useRod(test: Test, p: SimulatedPlayer, w: Witness): Promise<Use> {
  for (let tries = 0; tries < USE_TRIES; tries++) {
    const uses = teleportStats.uses;
    const hooks = w.count(p);
    p.useItemInSlot(p.selectedSlotIndex);
    for (let t = 0; t <= USE_EVIDENCE_TICKS; t++) {
      if (teleportStats.uses > uses) return { kind: "trip", tick: system.currentTick, hook: undefined, hookAt: undefined };
      const hook = w.last(p);
      if (w.count(p) > hooks) return { kind: "cast", tick: system.currentTick, hook, hookAt: hook?.isValid === true ? { ...hook.location } : undefined };
      if (t < USE_EVIDENCE_TICKS) await test.idle(1);
    }
  }
  return { kind: "none", tick: system.currentTick, hook: undefined, hookAt: undefined };
}

/** The outcome that ends `p`'s trip, decided at `since` or later; "already travelling" ends no trip. */
async function tripOutcome(test: Test, p: Player, since: number, maxTicks: number): Promise<{ outcome: string; tick: number; detail: string } | undefined> {
  for (let t = 0; t <= maxTicks; t++) {
    const o = lastOutcome.get(p.id);
    if (o !== undefined && o.tick >= since && o.outcome !== "travelling") return o;
    await test.idle(1);
  }
  return undefined;
}

interface Seen {
  kind: Use["kind"];
  outcome: string;
  ticks: number;
  moved: number;
  at: Vector3;
  hook: Entity | undefined;
  hookAt: Vector3 | undefined;
}

/** A use and what came of it: a cast and its hook, or a trip and its outcome, and how far the user moved. */
async function useAndSee(test: Test, p: SimulatedPlayer, w: Witness): Promise<Seen> {
  const from = { ...p.location };
  const use = await useRod(test, p, w);
  const o = use.kind === "trip" ? await tripOutcome(test, p, use.tick, TRIP_WAIT_TICKS) : undefined;
  const at = { ...p.location };
  return { kind: use.kind, outcome: o?.outcome ?? "-", ticks: o === undefined ? -1 : o.tick - use.tick, moved: dist(from, at), at, hook: use.hook, hookAt: use.hookAt };
}

const seenText = (test: Test, u: Seen): string =>
  u.kind === "trip"
    ? `trip ${u.outcome} after ${u.ticks} ticks, moved ${u.moved.toFixed(2)} to rel${rel(test, u.at)}`
    : `${u.kind}${u.hookAt === undefined ? "" : ` (hook at rel${rel(test, u.hookAt)})`}, moved ${u.moved.toFixed(2)}`;

/** A trip that arrived on the plate cell `plate`. */
const arrivedOn = (u: Seen, plate: Vector3): boolean => u.kind === "trip" && u.outcome === "arrived" && inCell(u.at, plate);

/** A plain cast: a hook, no trip, the user where they stood. */
const plainCast = (u: Seen): boolean => u.kind === "cast" && u.moved < 0.01;

// ------------------------------------------------------------- the binder's death voids every binding (AC1, AC4)

registerAsync("andrew", "pear_owner_death_voids", async (test: Test): Promise<void> => {
  const a = await survivor(test, CAST_FROM, "po_binder");
  const b = await survivor(test, BYSTANDER_AT, "po_bystander");
  setSpawnHere(test, a, CAST_FROM);
  const w = new Witness();
  try {
    fill(test, FIELD_MIN, FIELD_MAX, STONE_PLATE);
    test.getDimension().getBlock(test.worldBlockLocation(CHEST_AT))?.setType("minecraft:chest");
    await test.idle(2);

    // Three rods bound by A in one life: one stays in A's inventory, one goes to a chest, one to a stranger.
    const r1 = await bindFresh(test, a, 0, AIM, w);
    const r2 = await bindFresh(test, a, 1, AIM, w);
    const r3 = await bindFresh(test, a, 2, AIM, w);
    stashInChest(test, a, r2.rodId);
    await handOver(test, a, b, r3.rodId);
    const epoch0 = lifeEpochOf(a);
    const alive = {
      inventory: honourFor(a, rodOf(a, r1.rodId)),
      chest: honourFor(a, chestRod(test, r2.rodId)),
      stranger: honourFor(a, rodOf(b, r3.rodId)),
      strangerSelf: honourFor(b, rodOf(b, r3.rodId)),
    };
    log(
      `death alive RESULT epoch=${epoch0} A on rod1(inventory)=${alive.inventory} rod2(chest)=${alive.chest} rod3(B's hand)=${alive.stranger}; ` +
        `B on rod3=${alive.strangerSelf} binding=${bindingText(test, r1.binding)}`
    );
    test.assert(
      alive.inventory === "honoured" && alive.chest === "honoured" && alive.stranger === "honoured",
      `before the death A's own bindings are not all honoured: ${JSON.stringify(alive)} — the control fails, nothing below would mean anything`
    );
    test.assert(alive.strangerSelf === "foreign", `B is not a stranger to A's binding before the death: ${alive.strangerSelf}`);

    // Control: the gate honours A's binding in this life — a fourth rod, bound alike, takes A to the plate.
    const r0 = await bindFresh(test, a, 3, AIM, w);
    const ctl = await useAndSee(test, a, w);
    log(`death control RESULT A's use of rod0 in life ${epoch0}: ${seenText(test, ctl)} binding after=${bindingText(test, bindingOf(rodOf(a, r0.rodId)))}`);
    test.assert(arrivedOn(ctl, r0.binding.pos), `control: A's own binding did not take A to the plate (${seenText(test, ctl)}) — nothing below would mean anything`);
    await home(test, a, CAST_FROM);

    // The death. Nothing touches the rods: the drop spills on its own, the chest and B's hand are left alone.
    const deaths0 = ownerStats.deaths;
    const died = await killAndWait(test, a, w);
    const dropped = await droppedRod(test, test.worldLocation(CAST_FROM), r1.rodId);
    // The death spills it with a random push, off the platform edge in some runs; where it lies is not under test.
    const spilledAt = dropped === undefined ? "none" : `rel${rel(test, dropped.location)}`;
    dropped?.teleport(test.worldLocation(DROP_REST));
    const droppedStack = dropped?.getComponent("minecraft:item")?.itemStack;
    const holderA = { id: a.id, epoch: lifeEpochOf(a) };
    const dead = {
      dropped: honourOf(bindingOf(droppedStack), holderA),
      chest: honourFor(a, chestRod(test, r2.rodId)),
      stranger: honourFor(a, rodOf(b, r3.rodId)),
      strangerSelf: honourFor(b, rodOf(b, r3.rodId)),
    };
    const records = [bindingOf(droppedStack), bindingOf(chestRod(test, r2.rodId)), bindingOf(rodOf(b, r3.rodId))];
    log(
      `death dead RESULT died=${died.died} cause=${died.cause} epoch ${died.before}->${died.after} module_deaths+${ownerStats.deaths - deaths0} rod1 spilled at ${spilledAt} ` +
        `A on rod1(dropped)=${dead.dropped} rod2(chest)=${dead.chest} rod3(B's hand)=${dead.stranger}; B on rod3=${dead.strangerSelf}; ` +
        `records kept=[${records.map((r) => bindingText(test, r)).join(" | ")}]`
    );
    test.assert(died.died, `A never died (no entityDie): nothing was asked of the module`);
    test.assert(died.after === died.before + 1 && ownerStats.deaths - deaths0 === 1, `the death moved the epoch ${died.before}->${died.after} (module deaths +${ownerStats.deaths - deaths0}), not by one`);
    test.assert(dropped !== undefined, "rod 1 did not drop at A's death: it is a plain item and must spill (C-46)");
    test.assert(dead.dropped === "past-life" && dead.chest === "past-life" && dead.stranger === "past-life", `a binding survived the binder's death: ${JSON.stringify(dead)}`);
    test.assert(dead.strangerSelf === "foreign", `B on rod 3 after A's death: ${dead.strangerSelf}`);
    test.assert(
      sameBinding(records[0], r1.binding) && sameBinding(records[1], r2.binding) && sameBinding(records[2], r3.binding),
      "the death rewrote a rod: the void comes from the epoch alone, no rod is searched or touched"
    );

    // A stranger holds the rod after the death: a plain cast.
    await arm(test, b, slotOf(b, r3.rodId) as number, { x: 6.5, y: 2, z: 2.5 });
    const useB = await useAndSee(test, b, w);
    log(`death stranger_cast RESULT B on rod3: ${seenText(test, useB)} binding=${bindingText(test, bindingOf(rodOf(b, r3.rodId)))}`);
    test.assert(plainCast(useB), `B's use of A's rod after A's death was not a plain cast: ${seenText(test, useB)}`);
    removeHooksOf(test, b);
    await test.idle(2);

    // The rod passes through B's inventory again with its binder online and dead since: the record is erased.
    const cleared0 = ownerStats.cleared;
    await handOver(test, b, b, r3.rodId);
    const rod3 = rodOf(b, r3.rodId);
    const bRods = [r1.rodId, r2.rodId, r3.rodId].filter((id) => slotOf(b, id) !== undefined).length;
    log(
      `death stranger_repick RESULT B re-picked rod3: binding=${bindingText(test, bindingOf(rod3))} lore=[${rod3?.getLore().join("|")}] cleared+${ownerStats.cleared - cleared0} ` +
        `B carries rods [${[r1, r2, r3].map((r, i) => (slotOf(b, r.rodId) === undefined ? "" : `rod${i + 1}`)).join("")}] (${bRods}) at rel${rel(test, b.location)}; ` +
        `rod1 on the ground: ${dropped?.isValid === true ? `rel${rel(test, dropped.location)}` : "gone"}`
    );
    test.assert(bindingOf(rod3) === undefined && rod3?.getLore()[1] === "unbound", `B's copy kept A's dead record: ${bindingText(test, bindingOf(rod3))}`);

    // A respawns and gets rod 1 back from the ground and rod 2 from the chest: both need a new binding.
    await respawnAt(test, a, CAST_FROM);
    test.assert(dropped?.isValid === true, `rod 1 left the ground before A came back for it (spilled at ${spilledAt})`);
    const slot1 = await pickUp(test, a, dropped as Entity, r1.rodId);
    takeFromChest(test, a, r2.rodId, 1);
    await test.idle(2);
    const back = { rod1: honourFor(a, rodOf(a, r1.rodId)), rod2: honourFor(a, rodOf(a, r2.rodId)) };
    const lore = [r1.rodId, r2.rodId].map((id) => rodOf(a, id)?.getLore().join("|"));
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
    await arm(test, a, slot1, AIM);
    const use1 = await useAndSee(test, a, w);
    const after1 = bindingOf(rodOf(a, r1.rodId));
    removeHooksOf(test, a);
    await test.idle(2);
    await arm(test, a, 1, AIM);
    const use2 = await useAndSee(test, a, w);
    removeHooksOf(test, a);
    await test.idle(2);
    log(
      `death returned RESULT epoch=${lifeEpochOf(a)} A on rod1(picked up)=${back.rod1} [${lore[0]}] rod2(from chest)=${back.rod2} [${lore[1]}]; ` +
        `rod1 use: ${seenText(test, use1)} binding=${bindingText(test, after1)}; rod2 use: ${seenText(test, use2)}`
    );
    test.assert(back.rod1 === "unbound" && back.rod2 === "unbound", `a rod back in A's hands after the death still carries its dead record: ${JSON.stringify(back)}`);
    test.assert(lore.every((l) => l === "Pearl Rod|unbound"), `the lore of a rod back in A's hands does not read unbound: ${lore.join(" ; ")}`);
    test.assert(plainCast(use1) && plainCast(use2), `A's use of a rod bound in the past life was not a plain cast: ${seenText(test, use1)} ; ${seenText(test, use2)}`);

    // The new binding: A's own hit in the new life binds rod 1 afresh, and that one is honoured.
    fill(test, FIELD_MIN, FIELD_MAX, STONE_PLATE);
    await test.idle(1);
    await arm(test, a, slot1, AIM);
    await cast(test, a, w);
    const fresh = await awaitBinding(test, a, r1.rodId, r1.binding);
    const freshHonour = honourFor(a, rodOf(a, r1.rodId));
    const tripNew = await useAndSee(test, a, w);
    log(`death rebound RESULT rod1 new binding=${bindingText(test, fresh)} A=${freshHonour}; A's next use: ${seenText(test, tripNew)}`);
    test.assert(fresh !== undefined && fresh.epoch === lifeEpochOf(a) && fresh.epoch === epoch0 + 1, `the new binding is not in the new life: ${bindingText(test, fresh)}`);
    test.assert(freshHonour === "honoured", `A's own binding in the new life is not honoured: ${freshHonour}`);
    test.assert(fresh !== undefined && arrivedOn(tripNew, fresh.pos), `A's own binding in the new life did not take A to the plate: ${seenText(test, tripNew)}`);
  } finally {
    w.close();
    removeHooksOf(test, a);
    removeHooksOf(test, b);
    clearChest(test);
    test.getDimension().getBlock(test.worldBlockLocation(CHEST_AT))?.setType("minecraft:air");
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");

// ------------------------------------------------------------- a stranger casts; their own hit binds it to them (AC2, AC3)

registerAsync("andrew", "pear_owner_stranger", async (test: Test): Promise<void> => {
  const a = await survivor(test, LANE_A, "po_owner");
  const b = await survivor(test, LANE_B, "po_stranger");
  const w = new Witness();
  try {
    fill(test, LEFT_MIN, LEFT_MAX, "minecraft:acacia_pressure_plate");
    fill(test, RIGHT_MIN, RIGHT_MAX, "minecraft:air");
    test.getDimension().getBlock(test.worldBlockLocation(CHEST_AT))?.setType("minecraft:chest");
    await test.idle(2);

    // A binds the rod, then throws it; B picks it up.
    const r = await bindFresh(test, a, 0, AIM_A, w);
    const slotB = await handOver(test, a, b, r.rodId);
    const held = { b: honourFor(b, rodOf(b, r.rodId)), a: honourFor(a, rodOf(b, r.rodId)) };
    log(`stranger held RESULT A bound ${bindingText(test, r.binding)}; in B's hand: ${honourText(b, rodOf(b, r.rodId))}, A would be ${held.a}`);
    test.assert(held.b === "foreign" && held.a === "honoured", `after the hand-over: ${JSON.stringify(held)}`);

    // B uses it: a plain cast onto a bare floor — no trip to A's plate — and A's binding stays as it was.
    await arm(test, b, slotB, AIM_B);
    const uses0 = teleportStats.uses;
    const useB = await useAndSee(test, b, w);
    await test.idle(10);
    const afterCast = bindingOf(rodOf(b, r.rodId));
    log(
      `stranger cast RESULT B's use: ${seenText(test, useB)} gate trips+${teleportStats.uses - uses0} hook_valid=${useB.hook?.isValid === true} ` +
        `binding=${bindingText(test, afterCast)} (A's: ${sameBinding(afterCast, r.binding)})`
    );
    test.assert(plainCast(useB) && teleportStats.uses === uses0, `B's use of A's bound rod was not a plain cast: ${seenText(test, useB)}`);
    test.assert(sameBinding(afterCast, r.binding), `B's cast changed A's binding: ${bindingText(test, afterCast)}`);
    removeHooksOf(test, b);
    await test.idle(4);

    // B's own hook lands in a plate: the binding is B's now, in B's life; A is the stranger.
    fill(test, RIGHT_MIN, RIGHT_MAX, "minecraft:heavy_weighted_pressure_plate");
    await test.idle(1);
    await arm(test, b, slotB, AIM_B);
    await cast(test, b, w);
    const mine = await awaitBinding(test, b, r.rodId, r.binding);
    const flipped = { b: honourFor(b, rodOf(b, r.rodId)), a: honourFor(a, rodOf(b, r.rodId)) };
    log(`stranger rebind RESULT B's hit: binding=${bindingText(test, mine)} B=${flipped.b} A=${flipped.a}`);
    test.assert(mine !== undefined && mine.owner === b.id && mine.epoch === lifeEpochOf(b), `B's hit did not bind the rod to B: ${bindingText(test, mine)}`);
    test.assert(mine?.type === "minecraft:heavy_weighted_pressure_plate", `B's binding names ${mine?.type}, not B's plate`);
    test.assert(flipped.b === "honoured" && flipped.a === "foreign", `after B's binding: ${JSON.stringify(flipped)}`);
    const tripB = await useAndSee(test, b, w);
    log(`stranger trip RESULT B's next use: ${seenText(test, tripB)}`);
    test.assert(mine !== undefined && arrivedOn(tripB, mine.pos), `B's own binding did not take B to B's plate: ${seenText(test, tripB)}`);

    // Control (L0-pear-ac04): A's own rod, alive, through a chest and a ground drop, is still A's.
    const own = await bindFresh(test, a, 1, AIM_A, w);
    stashInChest(test, a, own.rodId);
    await test.idle(2);
    takeFromChest(test, a, own.rodId, 2);
    await test.idle(2);
    a.selectedSlotIndex = 2;
    await test.idle(1);
    test.assert(a.dropSelectedItem(), "A: dropSelectedItem refused");
    const ground = await droppedRod(test, a.location, own.rodId);
    test.assert(ground !== undefined, "no item entity after A's throw");
    if (ground === undefined) return;
    await pickUp(test, a, ground, own.rodId);
    const roundTrip = honourFor(a, rodOf(a, own.rodId));
    const ownText = honourText(a, rodOf(a, own.rodId));
    a.selectedSlotIndex = slotOf(a, own.rodId) as number;
    await test.idle(1);
    const tripA = await useAndSee(test, a, w);
    log(`stranger control RESULT A's own rod after chest + ground drop: ${ownText} binding=${bindingText(test, own.binding)}; A's use: ${seenText(test, tripA)}`);
    test.assert(roundTrip === "honoured", `A's own rod lost its binding on a chest and a drop: ${roundTrip}`);
    test.assert(arrivedOn(tripA, own.binding.pos), `A's own rod after a chest and a drop did not take A to the plate: ${seenText(test, tripA)}`);
  } finally {
    w.close();
    removeHooksOf(test, a);
    removeHooksOf(test, b);
    clearChest(test);
    test.getDimension().getBlock(test.worldBlockLocation(CHEST_AT))?.setType("minecraft:air");
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");


// ------------------------------------------------------------- a death while the trip is under way ends it (AC5)

/** The Pearl Rod lines of the actionbar, from a spy on the native setActionBar every module sends through. */
class Bars {
  private readonly lines: Array<{ key: string; tick: number }> = [];
  private readonly original = ScreenDisplay.prototype.setActionBar;

  constructor() {
    const lines = this.lines;
    const original = this.original;
    ScreenDisplay.prototype.setActionBar = function (this: ScreenDisplay, ...args: Parameters<ScreenDisplay["setActionBar"]>): void {
      const m = args[0];
      const key = typeof m === "object" && m !== null && !Array.isArray(m) && typeof m.translate === "string" ? m.translate : "";
      if (key.startsWith("andrew.pearl_rod.")) lines.push({ key: key.slice("andrew.pearl_rod.".length), tick: system.currentTick });
      original.apply(this, args);
    };
  }

  since(tick: number): string[] {
    return this.lines.filter((l) => l.tick >= tick).map((l) => l.key);
  }

  close(): void {
    ScreenDisplay.prototype.setActionBar = this.original;
  }
}

function nineLoaded(dim: Dimension, at: Vector3): boolean {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!dim.isChunkLoaded({ x: at.x + dx, y: at.y, z: at.z + dz })) return false;
  return dim.getBlock(at) !== undefined;
}

interface DeathCase {
  label: string;
  keepInventory: boolean;
  /**
   * `taken`: in the tick the gate took the use, before the trip's first step. `ready`: in the first tick the trip holds
   * its area with the plate loaded — the tick's interval would move the player; a death reads health 0 at once, but
   * its entityDie arrives after that interval (BDS 1.26.51.1, a GameTest continuation runs before the interval).
   */
  when: "taken" | "ready";
}

const DEATH_CASES: readonly DeathCase[] = [
  { label: "taken", keepInventory: false, when: "taken" },
  { label: "ready", keepInventory: false, when: "ready" },
  { label: "ready_keep", keepInventory: true, when: "ready" },
];

registerAsync("andrew", "pear_owner_death_mid_trip", async (test: Test): Promise<void> => {
  const a = await survivor(test, CAST_FROM, "po_traveller");
  setSpawnHere(test, a, CAST_FROM);
  const w = new Witness();
  const bars = new Bars();
  const keep = world.gameRules.keepInventory;
  const dim = test.getDimension();
  const failures: string[] = [];
  try {
    fill(test, FIELD_MIN, FIELD_MAX, STONE_PLATE);
    await test.idle(2);

    // Control: the same trip with nobody dying arrives on the plate.
    const c = await bindFresh(test, a, 0, AIM, w);
    const ctl = await useAndSee(test, a, w);
    log(`mid_trip control RESULT ${seenText(test, ctl)} bars=[${bars.since(0).join(",")}]`);
    test.assert(arrivedOn(ctl, c.binding.pos), `control: the trip did not arrive (${seenText(test, ctl)}) — a death could not interrupt anything`);
    await home(test, a, CAST_FROM);
    inventoryOf(a).setItem(0, undefined);

    for (const k of DEATH_CASES) {
      world.gameRules.keepInventory = k.keepInventory;
      const r = await bindFresh(test, a, 0, AIM, w);
      removeHooksOf(test, a);
      await test.idle(2);
      const from = { ...a.location };
      const epoch0 = lifeEpochOf(a);
      const arrived0 = teleportStats.outcomes.arrived ?? 0;
      const use = await useRod(test, a, w);
      if (use.kind !== "trip") {
        failures.push(`${k.label}: the gate did not take A's use as a trip (${use.kind})`);
        continue;
      }
      const ended = (): string | undefined => {
        const o = lastOutcome.get(a.id);
        return o !== undefined && o.tick >= use.tick ? o.outcome : undefined;
      };
      for (let t = 0; k.when === "ready" && t < 5 && heldAreaNames().length === 0 && ended() === undefined; t++) await test.idle(1);
      const holding = pendingTrips() === 1 && heldAreaNames().length === 1 && ended() === undefined;
      const state = `pending=${pendingTrips()} areas=[${heldAreaNames().join(",")}] plate_loaded=${nineLoaded(dim, r.binding.pos)} ended=${ended() ?? "no"}`;
      const killAt = system.currentTick;
      a.kill();
      const hp = a.getComponent("minecraft:health")?.currentValue;
      const o = await tripOutcome(test, a, use.tick, 40);
      const at = { ...a.location };
      await test.idle(DEATH_WAIT_TICKS);
      const kept = k.keepInventory ? bindingOf(rodOf(a, r.rodId)) : undefined;
      const line =
        `mid_trip ${k.label} RESULT keepInventory=${k.keepInventory} kill at use+${killAt - use.tick} (${state}) hp_after_kill=${hp}; ` +
        `outcome=${o?.outcome ?? "none"} at use+${o === undefined ? "-" : o.tick - use.tick}${o?.detail ? ` (${o.detail})` : ""} moved ${dist(from, at).toFixed(2)} ` +
        `bars=[${bars.since(use.tick).join(",")}] arrivals+${(teleportStats.outcomes.arrived ?? 0) - arrived0} after: trips=${pendingTrips()} areas=[${heldAreaNames().join(",")}] ` +
        `epoch ${epoch0}->${lifeEpochOf(a)}${k.keepInventory ? ` rod in the dead hand: ${bindingText(test, kept)}` : ""}`;
      log(line);
      const problems: string[] = [];
      if (k.when === "ready" && !holding) problems.push("setup: the trip was not holding its area when A died");
      if (k.when === "taken" && killAt !== use.tick) problems.push(`setup: the kill came ${killAt - use.tick} tick(s) after the use`);
      if (o?.outcome !== "died") problems.push(`outcome ${o?.outcome ?? "none"}`);
      if (dist(from, at) >= 0.01) problems.push(`moved ${dist(from, at).toFixed(2)}`);
      if (bars.since(use.tick).length > 0) problems.push(`told [${bars.since(use.tick).join(",")}]`);
      if ((teleportStats.outcomes.arrived ?? 0) !== arrived0) problems.push("an arrival was counted");
      if (pendingTrips() !== 0 || heldAreaNames().length !== 0) problems.push("a trip or an area outlived the death");
      if (lifeEpochOf(a) !== epoch0 + 1) problems.push(`epoch ${epoch0}->${lifeEpochOf(a)}`);
      if (problems.length > 0) failures.push(`${k.label}: ${problems.join("; ")}`);

      // Back in a new life: the rod (picked up, or kept through the death) reads unbound and casts.
      await respawnAt(test, a, CAST_FROM);
      if (slotOf(a, r.rodId) === undefined) {
        const drop = await droppedRod(test, test.worldLocation(CAST_FROM), r.rodId);
        if (drop !== undefined) await pickUp(test, a, drop, r.rodId);
      }
      const slot = slotOf(a, r.rodId);
      if (slot === undefined) {
        failures.push(`${k.label}: the rod is neither in A's inventory nor on the ground after the death`);
        continue;
      }
      await arm(test, a, slot, { x: 0.5, y: 2, z: 0.5 });
      const lore = rodOf(a, r.rodId)?.getLore().join("|");
      const again = await useAndSee(test, a, w);
      log(`mid_trip ${k.label} back RESULT epoch=${lifeEpochOf(a)} rod lore=[${lore}] use: ${seenText(test, again)}`);
      if (lore !== "Pearl Rod|unbound" || !plainCast(again)) failures.push(`${k.label}: back in a new life the rod reads [${lore}] and its use is ${seenText(test, again)}`);
      removeHooksOf(test, a);
      inventoryOf(a).setItem(slot, undefined);
      await home(test, a, CAST_FROM);
    }
  } finally {
    world.gameRules.keepInventory = keep;
    bars.close();
    w.close();
    removeHooksOf(test, a);
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
  }
  log(`mid_trip RESULT ${failures.length === 0 ? "every death ended its trip" : failures.join(" | ")}`);
  test.assert(failures.length === 0, failures.join(" | "));
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");
