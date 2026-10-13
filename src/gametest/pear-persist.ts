// PEAR-PERSIST-01 on BDS 1.26.51.1 (spec v3 §7–§8; L0-pear-ac06): a binding survives a server restart and still leads
// to its plate; the life epoch survives it too, so a death after the restart still voids bindings; an unbound rod that
// went through the restart fishes; and save/load leaves the rods' mark, name, lore, durability and enchantments alone.
// scripts/bds-gametest.mjs stops and starts BDS on the same world between pear_persist_seed and pear_persist_check
// (RESTART_AFTER). The "[pear-persist] … RESULT" lines are quoted in src/pearl/README.md.

import {
  BlockVolume,
  type Container,
  type Dimension,
  type Entity,
  EnchantmentType,
  type EntitySpawnAfterEvent,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { bindingOf, lifeEpochOf, plateGeneration } from "../pearl/bind";
import { type Binding, HOOK_ID, LIFE_EPOCH_KEY, POS_KEY, bindingEntries, boundLore } from "../pearl/bind-rules";
import { plateCheck } from "../pearl/generation";
import { GEN_PREFIX, SEQ_KEY, WATCH_PREFIX } from "../pearl/generation-rules";
import { makePearlRod } from "../pearl/item";
import { MARK_KEY, ROD_ID } from "../pearl/item-rules";
import { honourFor } from "../pearl/owner";
import { honourOf } from "../pearl/owner-rules";
import { EPOCH_PREFIX, epochValue, playerKey, setPlayerKeyOverride, storedEpoch } from "../pearl/store";
import { heldAreaNames, lastOutcome, pendingTrips, teleportStats } from "../pearl/teleport";

/**
 * A SimulatedPlayer spawned again after a restart is a new entity with a new id and no dynamic properties
 * (ORBC-FLIGHT-01, measured again by pear_persist_check). The players of these two scenarios are named by their name
 * instead, which is what a client's `Player.id` is to the engine; every other player of the pack keeps its id.
 */
const ALIAS_PREFIX = "pps_";
setPlayerKeyOverride((p) => (p.name.startsWith(ALIAS_PREFIX) ? `gt-persist:${p.name}` : undefined));

const STRUCTURE = "andrew:platform";
const STONE_PLATE = "minecraft:stone_pressure_plate";
const SEED_KEY = "andrew:gt_pear_persist";
/** A world Vector3 property next to the rod's, to tell the item store from the world store; and a number one. */
const FAR_KEY = "andrew:gt_pear_persist_far";
const FAR_NUMBER_KEY = "andrew:gt_pear_persist_far_x";
const PAD_AREA = "andrew_gt_pearps_pad";
/**
 * The GameTest pack's trip areas are `andrew_gt_pearl_<0..9>` (pear-teleport.ts). One of them added in the seed and
 * held over the stop stands in for a trip that is waiting when the server stops: a SimulatedPlayer's trip cannot be,
 * since GameTest removes the player with its test.
 */
const HELD_TRIP_AREA = "andrew_gt_pearl_7";

/** The pad, far from every other scenario, floating in the air: relative y=1 is its floor, as on the platform. */
const PAD: Vector3 = { x: -43210, y: 98, z: 43210 };
const PAD_FLOOR_MIN: Vector3 = { x: -2, y: 1, z: -2 };
const PAD_FLOOR_MAX: Vector3 = { x: 9, y: 1, z: 12 };
const PAD_AIR_MIN: Vector3 = { x: -2, y: 2, z: -2 };
const PAD_AIR_MAX: Vector3 = { x: 9, y: 5, z: 12 };
const PAD_CHEST: Vector3 = { x: 8, y: 2, z: 0 };
const GROUND_ROD: Vector3 = { x: 1.5, y: 2.2, z: 10.5 };

/** The cast geometry of PEAR-BIND-01 (a rest in the plate cell rel 3,2,3), on the pad and on the platform alike. */
const CAST_FROM: Vector3 = { x: 3, y: 2, z: 0 };
const FIELD_MIN: Vector3 = { x: 0, y: 2, z: 1 };
const FIELD_MAX: Vector3 = { x: 6, y: 2, z: 6 };
const AIM: Vector3 = { x: 3.5, y: 2, z: 5.5 };

const HOME_B: Vector3 = { x: 5, y: 2, z: 0 };
/** B's foreign cast lands on the bare platform floor. */
const AIM_B_FLOOR: Vector3 = { x: 5.5, y: 2, z: 3.5 };
const PLATFORM_CHEST: Vector3 = { x: 6, y: 2, z: 0 };

/** Coordinates past 2^24, where a 32-bit float has no odd integers, and one below it. */
const FAR_POS: Vector3 = { x: 29_999_999, y: 100, z: -20_000_001 };
const NEAR_FAR_POS: Vector3 = { x: 16_777_215, y: 100, z: -1_000_001 };
/** Where an entity's own position is read back, past 2^24, with no chunk loaded there. */
const FAR_STAND: Vector3 = { x: 20_000_001.5, y: 200, z: -20_000_001.5 };
const CONTROL_DAMAGE = 37;
const CONTROL_NAME = "pps control";

const USE_EVIDENCE_TICKS = 6;
const USE_TRIES = 10;
const BIND_WAIT_TICKS = 60;
const DEATH_WAIT_TICKS = 20;
const RESPAWN_TICKS = 20;
const TRIP_WAIT_TICKS = 260;
const LOAD_WAIT_TICKS = 400;

const log = (msg: string): void => console.warn(`[pear-persist] ${msg}`);
const short = (id: string): string => id.replace("minecraft:", "");
const f2 = (n: number): string => n.toFixed(2);
const v3 = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const dist = (a: Vector3, b: Vector3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const padAt = (r: Vector3): Vector3 => ({ x: PAD.x + r.x, y: PAD.y + r.y, z: PAD.z + r.z });
const inCell = (at: Vector3, cell: Vector3): boolean => Math.floor(at.x) === cell.x && Math.floor(at.y) === cell.y && Math.floor(at.z) === cell.z;
const errText = (err: unknown): string => (err instanceof Error ? err.message : String(err)).split("\n")[0].slice(0, 160);

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) throw new Error(`${player.name} has no inventory container`);
  return container;
}

const markOf = (stack: ItemStack | undefined): string | undefined => {
  const id = stack?.typeId === ROD_ID ? stack.getDynamicProperty(MARK_KEY) : undefined;
  return typeof id === "string" ? id : undefined;
};

function slotOf(c: Container, mark: string): number | undefined {
  for (let slot = 0; slot < c.size; slot++) if (markOf(c.getItem(slot)) === mark) return slot;
  return undefined;
}

function rodIn(c: Container, mark: string): ItemStack | undefined {
  const slot = slotOf(c, mark);
  return slot === undefined ? undefined : c.getItem(slot);
}

function run(dim: Dimension, command: string): number {
  try {
    return dim.runCommand(command).successCount;
  } catch {
    return 0;
  }
}

async function survivor(test: Test, at: Vector3, name: string): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  await test.idle(3);
  return p;
}

// ------------------------------------------------------------- what an item and the world hold

/** Everything save/load could damage on a rod, as plain values. */
interface Look {
  typeId: string;
  name: string;
  lore: string;
  damage: string;
  enchants: string;
  props: Record<string, string>;
}

function lookOf(s: ItemStack | undefined): Look | undefined {
  if (s === undefined) return undefined;
  const d = s.getComponent("minecraft:durability");
  const enchants = s.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
  const props: Record<string, string> = {};
  for (const id of s.getDynamicPropertyIds().sort()) props[id] = JSON.stringify(s.getDynamicProperty(id));
  return {
    typeId: s.typeId,
    name: s.nameTag ?? "-",
    lore: s.getLore().join("|"),
    damage: `${d?.damage ?? "-"}/${d?.maxDurability ?? "-"}`,
    enchants: enchants.map((e) => `${e.type.id}${e.level}`).join(","),
    props,
  };
}

const lookText = (l: Look | undefined): string =>
  l === undefined
    ? "MISSING"
    : `${short(l.typeId)} name=${l.name} lore=[${l.lore}] damage=${l.damage} enchants=[${l.enchants}] props={${Object.entries(l.props)
        .map(([k, v]) => `${k.replace("andrew:", "")}=${v}`)
        .join(" ")}}`;

/** The fields of `want` that `got` does not repeat exactly; empty when the look survived. */
function lookDiff(want: Look, got: Look | undefined): string[] {
  if (got === undefined) return ["the rod is gone"];
  const out: string[] = [];
  for (const k of ["typeId", "name", "lore", "damage", "enchants"] as const) if (want[k] !== got[k]) out.push(`${k} ${want[k]} -> ${got[k]}`);
  const keys = new Set([...Object.keys(want.props), ...Object.keys(got.props)]);
  for (const k of keys) if (want.props[k] !== got.props[k]) out.push(`${k} ${want.props[k] ?? "none"} -> ${got.props[k] ?? "none"}`);
  return out;
}

/** This pack's world properties of the plate generations and the life epochs. */
function worldState(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of world.getDynamicPropertyIds().sort()) {
    if (id === SEQ_KEY || id.startsWith(GEN_PREFIX) || id.startsWith(WATCH_PREFIX) || id.startsWith(EPOCH_PREFIX)) out[id] = JSON.stringify(world.getDynamicProperty(id));
  }
  return out;
}

function stateDiff(want: Record<string, string>, got: Record<string, string>): string[] {
  const keys = new Set([...Object.keys(want), ...Object.keys(got)]);
  return [...keys].filter((k) => want[k] !== got[k]).map((k) => `${k} ${want[k] ?? "none"} -> ${got[k] ?? "none"}`);
}

/** Command areas the engine still accepts: added one by one far away until refused, then removed (probe Q5). */
let serial = 0;
function freeEngineSlots(test: Test): number {
  const dim = test.getDimension();
  const o = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const names: string[] = [];
  for (let i = 0; i < 12; i++) {
    const name = `andrew_gt_pearps_free_${serial++}`;
    const x = o.x + 70_000 + i * 64;
    if (run(dim, `tickingarea add ${x} 0 ${o.z} ${x} 0 ${o.z} ${name}`) === 0) break;
    names.push(name);
  }
  for (const name of names) run(dim, `tickingarea remove ${name}`);
  return names.length;
}

// ------------------------------------------------------------- the pad

function padFill(dim: Dimension, min: Vector3, max: Vector3, typeId: string): void {
  dim.fillBlocks(new BlockVolume(padAt(min), padAt(max)), typeId);
}

const padLoaded = (dim: Dimension): boolean =>
  [PAD_FLOOR_MIN, PAD_FLOOR_MAX, PAD_CHEST].every((r) => dim.isChunkLoaded(padAt(r))) && dim.getBlock(padAt(PAD_CHEST)) !== undefined;

/** Holds the pad loaded with a ticking area; returns the ticks it took. */
async function loadPad(test: Test, dim: Dimension): Promise<number> {
  const lo = padAt(PAD_FLOOR_MIN);
  const hi = padAt(PAD_FLOOR_MAX);
  test.assert(run(dim, `tickingarea add ${lo.x} 0 ${lo.z} ${hi.x} 0 ${hi.z} ${PAD_AREA}`) > 0, `${PAD_AREA} refused`);
  let t = 0;
  for (; t < LOAD_WAIT_TICKS && !padLoaded(dim); t++) await test.idle(1);
  test.assert(padLoaded(dim), `the pad never loaded in ${LOAD_WAIT_TICKS} ticks`);
  return t;
}

/** Lets the pad go; returns the ticks until its chunk read unloaded, or -1 when it never did. */
async function unloadPad(test: Test, dim: Dimension): Promise<number> {
  run(dim, `tickingarea remove ${PAD_AREA}`);
  for (let t = 0; t < LOAD_WAIT_TICKS; t++) {
    if (!dim.isChunkLoaded(padAt(PAD_CHEST))) return t;
    await test.idle(1);
  }
  return -1;
}

function padChest(dim: Dimension): Container {
  const c = dim.getBlock(padAt(PAD_CHEST))?.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error("the pad chest has no inventory container");
  return c;
}

function platformChest(test: Test): Container {
  const c = test.getDimension().getBlock(test.worldBlockLocation(PLATFORM_CHEST))?.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error("the platform chest has no inventory container");
  return c;
}

/** Moves the rod `mark` from one container to the first free slot of another; returns that slot. */
function move(from: Container, to: Container, mark: string): number {
  const at = slotOf(from, mark);
  if (at === undefined) throw new Error(`rod ${mark} is not there to move`);
  const slot = Array.from({ length: to.size }, (_, n) => n).find((n) => to.getItem(n) === undefined);
  if (slot === undefined) throw new Error("no free slot to move a rod into");
  to.setItem(slot, from.getItem(at));
  from.setItem(at, undefined);
  return slot;
}

function groundRod(dim: Dimension, mark: string): Entity | undefined {
  return dim.getEntities({ type: "minecraft:item", location: padAt(GROUND_ROD), maxDistance: 8 }).find((e) => markOf(e.getComponent("minecraft:item")?.itemStack) === mark);
}

// ------------------------------------------------------------- players

/** Hooks by caster name from entitySpawn (the owner is readable at +0, probe Q3), and player deaths by name. */
class Witness {
  private readonly hooks = new Map<string, Entity[]>();
  readonly deaths = new Map<string, number>();
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
      const name = (dead as Player).name;
      this.deaths.set(name, (this.deaths.get(name) ?? 0) + 1);
    });
    this.undo.push(() => a.entityDie.unsubscribe(die));
  }

  count(p: Player): number {
    return this.hooks.get(p.name)?.length ?? 0;
  }

  last(p: Player): Entity | undefined {
    return this.hooks.get(p.name)?.at(-1);
  }

  close(): void {
    for (const u of this.undo) u();
  }
}

/** Selects `slot` and looks at `aim`, given in the test's relative frame (a SimulatedPlayer's look takes that frame). */
async function aimAt(test: Test, p: SimulatedPlayer, slot: number, aim: Vector3): Promise<void> {
  p.selectedSlotIndex = slot;
  await test.idle(2);
  p.lookAtLocation(aim, LookDuration.Instant);
  await test.idle(2);
}

async function cast(test: Test, p: SimulatedPlayer, w: Witness): Promise<Entity> {
  for (let tries = 0; tries < USE_TRIES; tries++) {
    const before = w.count(p);
    p.useItemInSlot(p.selectedSlotIndex);
    for (let t = 0; t < USE_EVIDENCE_TICKS && w.count(p) === before; t++) await test.idle(1);
    const hook = w.last(p);
    if (w.count(p) > before && hook !== undefined) return hook;
  }
  throw new Error(`${p.name}: no hook after ${USE_TRIES} uses`);
}

/** A fresh Pearl Rod in `slot`, cast at `aim` (test-relative) into a plate field and bound. */
async function bindFresh(test: Test, p: SimulatedPlayer, slot: number, aim: Vector3, w: Witness): Promise<{ mark: string; binding: Binding }> {
  const rod = makePearlRod();
  const mark = markOf(rod) as string;
  p.setItem(rod, slot, true);
  for (let attempt = 1; attempt <= 3; attempt++) {
    await aimAt(test, p, slot, aim);
    const hook = await cast(test, p, w);
    for (let t = 0; t < BIND_WAIT_TICKS; t++) {
      const at = slotOf(inventoryOf(p), mark);
      const b = at === undefined ? undefined : bindingOf(inventoryOf(p).getItem(at));
      if (b !== undefined) return { mark, binding: b };
      if (!hook.isValid && t > 4) break;
      await test.idle(1);
    }
    if (hook.isValid) hook.remove();
    await test.idle(4);
  }
  throw new Error(`${p.name}: rod ${mark} never bound in 3 casts`);
}

async function killAndWait(test: Test, p: SimulatedPlayer, w: Witness): Promise<{ before: number; after: number; died: boolean }> {
  const before = lifeEpochOf(p);
  const seen = w.deaths.get(p.name) ?? 0;
  p.kill();
  for (let t = 0; t < DEATH_WAIT_TICKS && (w.deaths.get(p.name) ?? 0) === seen; t++) await test.idle(1);
  return { before, after: lifeEpochOf(p), died: (w.deaths.get(p.name) ?? 0) > seen };
}

async function respawnTo(test: Test, p: SimulatedPlayer, at: Vector3, dim: Dimension): Promise<void> {
  p.respawn();
  await test.idle(RESPAWN_TICKS);
  p.teleport(at, { dimension: dim });
  await test.idle(3);
}

interface Use {
  kind: "trip" | "cast" | "none";
  outcome: string;
  ticks: number;
  at: Vector3;
  moved: number;
  hook: Entity | undefined;
}

/** One use of the selected rod: a trip (counted by the use gate) and its outcome, or a cast and its hook. */
async function useRod(test: Test, p: SimulatedPlayer, w: Witness): Promise<Use> {
  const from = { ...p.location };
  for (let tries = 0; tries < USE_TRIES; tries++) {
    const uses = teleportStats.uses;
    const hooks = w.count(p);
    p.useItemInSlot(p.selectedSlotIndex);
    for (let t = 0; t <= USE_EVIDENCE_TICKS; t++) {
      if (teleportStats.uses > uses) {
        const since = system.currentTick;
        for (let u = 0; u <= TRIP_WAIT_TICKS; u++) {
          const o = lastOutcome.get(p.id);
          if (o !== undefined && o.tick >= since && o.outcome !== "travelling") {
            return { kind: "trip", outcome: o.outcome, ticks: o.tick - since, at: { ...p.location }, moved: dist(from, p.location), hook: undefined };
          }
          await test.idle(1);
        }
        return { kind: "trip", outcome: "none", ticks: -1, at: { ...p.location }, moved: dist(from, p.location), hook: undefined };
      }
      if (w.count(p) > hooks) return { kind: "cast", outcome: "-", ticks: 0, at: { ...p.location }, moved: dist(from, p.location), hook: w.last(p) };
      if (t < USE_EVIDENCE_TICKS) await test.idle(1);
    }
  }
  return { kind: "none", outcome: "-", ticks: -1, at: { ...p.location }, moved: 0, hook: undefined };
}

const useText = (u: Use): string =>
  u.kind === "trip" ? `trip ${u.outcome} after ${u.ticks} ticks, moved ${f2(u.moved)} to ${f2(u.at.x)},${f2(u.at.y)},${f2(u.at.z)}` : `${u.kind}, moved ${f2(u.moved)}`;

// ------------------------------------------------------------- the seed

interface Seed {
  savedAt: number;
  tick: number;
  baselineAreas: number;
  player: { id: string; key: string; epochOnPlayer: string; epoch: number };
  /** The rods by role, with the mark they carry. */
  marks: { dead: string; bound: string; unbound: string; plain: string; far: string; ground: string };
  looks: Record<string, Look>;
  binding: Binding;
  farBinding: Binding;
  world: Record<string, string>;
  farWorld: string;
}

registerAsync("andrew", "pear_persist_seed", async (test: Test): Promise<void> => {
  world.setDynamicProperty(SEED_KEY, undefined);
  world.setDynamicProperty(FAR_KEY, undefined);
  world.setDynamicProperty(FAR_NUMBER_KEY, undefined);
  const dim = test.getDimension();
  const baselineAreas = freeEngineSlots(test);
  const loadTicks = await loadPad(test, dim);
  padFill(dim, PAD_FLOOR_MIN, PAD_FLOOR_MAX, "minecraft:stone");
  padFill(dim, PAD_AIR_MIN, PAD_AIR_MAX, "minecraft:air");
  dim.setBlockType(padAt(PAD_CHEST), "minecraft:chest");
  padChest(dim).clearAll();
  for (const e of dim.getEntities({ type: "minecraft:item", location: padAt(GROUND_ROD), maxDistance: 12 })) e.remove();
  const w = new Witness();
  const castSpot = { x: PAD.x + CAST_FROM.x + 0.5, y: PAD.y + CAST_FROM.y, z: PAD.z + CAST_FROM.z + 0.5 };
  const aimRel = test.relativeLocation(padAt(AIM));
  let a: SimulatedPlayer | undefined;
  let seed: Seed | undefined;
  try {
    a = await survivor(test, CAST_FROM, "pps_a");
    a.setSpawnPoint({ dimension: dim, x: Math.floor(castSpot.x), y: castSpot.y, z: Math.floor(castSpot.z) });
    a.teleport(castSpot, { dimension: dim });
    await test.idle(3);
    padFill(dim, FIELD_MIN, FIELD_MAX, STONE_PLATE);
    await test.idle(2);
    const chest = padChest(dim);
    const e0 = lifeEpochOf(a);

    // Bound in one life, then the binder dies: a dead record that the restart must not bring back.
    const dead = await bindFresh(test, a, 0, aimRel, w);
    move(inventoryOf(a), chest, dead.mark);
    const death = await killAndWait(test, a, w);
    test.assert(death.died && death.after === e0 + 1, `the death did not move the epoch: ${death.before} -> ${death.after}, died=${death.died}`);
    await respawnTo(test, a, castSpot, dim);

    // Bound in the next life: the binding that must survive the restart.
    const live = await bindFresh(test, a, 0, aimRel, w);
    test.assert(live.binding.epoch === e0 + 1 && live.binding.owner === playerKey(a), `the live binding: owner ${live.binding.owner} epoch ${live.binding.epoch}`);
    const plateRel = { x: live.binding.pos.x - PAD.x, y: live.binding.pos.y - PAD.y, z: live.binding.pos.z - PAD.z };
    for (let x = FIELD_MIN.x; x <= FIELD_MAX.x; x++)
      for (let z = FIELD_MIN.z; z <= FIELD_MAX.z; z++) if (x !== plateRel.x || z !== plateRel.z) dim.setBlockType(padAt({ x, y: FIELD_MIN.y, z }), "minecraft:air");
    move(inventoryOf(a), chest, live.mark);

    const unbound = makePearlRod();
    unbound.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType("lure"), level: 3 });
    chest.addItem(unbound);

    const plain = new ItemStack(ROD_ID, 1);
    plain.nameTag = CONTROL_NAME;
    const pd = plain.getComponent("minecraft:durability");
    if (pd !== undefined) pd.damage = CONTROL_DAMAGE;
    chest.addItem(plain);

    // A record past 2^24: what the store keeps of a far plate's cell, on the item and in the world.
    const farBinding: Binding = { ...live.binding, pos: FAR_POS, gen: 0 };
    const far = makePearlRod();
    for (const [key, value] of bindingEntries(farBinding)) far.setDynamicProperty(key, value);
    far.setLore(boundLore(farBinding));
    const farOnStack = JSON.stringify(far.getDynamicProperty(POS_KEY));
    chest.addItem(far);
    const farInChest = JSON.stringify(rodIn(chest, markOf(far) as string)?.getDynamicProperty(POS_KEY));
    world.setDynamicProperty(FAR_KEY, FAR_POS);
    world.setDynamicProperty(FAR_NUMBER_KEY, FAR_POS.x);
    const farWorld = JSON.stringify(world.getDynamicProperty(FAR_KEY));
    const probe = makePearlRod();
    probe.setDynamicProperty(POS_KEY, NEAR_FAR_POS);
    // An entity's position past 2^24, read back in the tick of the teleport (it is not kept loaded there).
    a.teleport(FAR_STAND, { dimension: dim });
    const standRead = { ...a.location };
    a.teleport(castSpot, { dimension: dim });
    await test.idle(3);
    log(
      `seed vector RESULT wrote ${v3(FAR_POS)}: on the stack ${farOnStack}, in the chest ${farInChest}, world ${farWorld}, as a world number ${JSON.stringify(world.getDynamicProperty(FAR_NUMBER_KEY))}; ` +
        `wrote ${v3(NEAR_FAR_POS)}: on a stack ${JSON.stringify(probe.getDynamicProperty(POS_KEY))}; ` +
        `a player teleported to ${v3(FAR_STAND)} reads ${v3(standRead)}`
    );

    // The live record again, on a rod left lying on the pad: saved with its chunk as an item entity.
    const onGround = makePearlRod();
    for (const [key, value] of bindingEntries(live.binding)) onGround.setDynamicProperty(key, value);
    onGround.setLore(boundLore(live.binding));
    const groundEntity = dim.spawnItem(onGround, padAt(GROUND_ROD));
    groundEntity.clearVelocity();

    test.assert(run(dim, `tickingarea add ${PAD.x + 200} 0 ${PAD.z} ${PAD.x + 200} 0 ${PAD.z} ${HELD_TRIP_AREA}`) > 0, `${HELD_TRIP_AREA} refused`);
    await test.idle(4);

    const marks = { dead: dead.mark, bound: live.mark, unbound: markOf(unbound) as string, plain: "", far: markOf(far) as string, ground: markOf(onGround) as string };
    const looks: Record<string, Look> = {};
    for (let slot = 0; slot < chest.size; slot++) {
      const s = chest.getItem(slot);
      const look = lookOf(s);
      if (look === undefined) continue;
      const role = Object.entries(marks).find(([, m]) => m !== "" && m === markOf(s))?.[0] ?? (s?.nameTag === CONTROL_NAME ? "plain" : `slot${slot}`);
      looks[role] = look;
    }
    const groundLook = lookOf(groundRod(dim, marks.ground)?.getComponent("minecraft:item")?.itemStack);
    if (groundLook !== undefined) looks.ground = groundLook;
    seed = {
      savedAt: Date.now(),
      tick: system.currentTick,
      baselineAreas,
      player: { id: a.id, key: playerKey(a), epochOnPlayer: JSON.stringify(a.getDynamicProperty(LIFE_EPOCH_KEY)), epoch: lifeEpochOf(a) },
      marks,
      looks,
      binding: live.binding,
      farBinding,
      world: worldState(),
      farWorld,
    };
    log(
      `seed RESULT pad loaded in ${loadTicks} ticks; ${a.name} id=${a.id} key=${seed.player.key} epoch ${e0} -> ${seed.player.epoch} (player copy ${seed.player.epochOnPlayer}, world copy ${storedEpoch(seed.player.key)}); ` +
        `dead record ${bindingTextOf(dead.binding)}; live record ${bindingTextOf(live.binding)} plate ${short(dim.getBlock(live.binding.pos)?.typeId ?? "?")} check ${plateCheck(live.binding)}; ` +
        `engine areas free at the start ${baselineAreas}, ${HELD_TRIP_AREA} held over the stop`
    );
    for (const [role, look] of Object.entries(looks)) log(`seed rod RESULT ${role}: ${lookText(look)}`);
    log(`seed world RESULT ${Object.entries(seed.world).map(([k, v]) => `${k}=${v}`).join(" ")}`);
    test.assert(Object.keys(looks).length === 6, `the seed sees ${Object.keys(looks).length} of 6 rods: ${Object.keys(looks).join(",")}`);
    test.assert(plateCheck(live.binding) === "same", `the live binding's plate reads ${plateCheck(live.binding)} before the stop`);
    test.assert(honourFor(a, rodIn(chest, live.mark)) === "honoured", "the live binding is not honoured before the stop");
    test.assert(honourFor(a, rodIn(chest, dead.mark)) === "past-life", "the dead binding is not void before the stop");
  } finally {
    w.close();
    if (a !== undefined) test.removeSimulatedPlayer(a);
  }
  const unloadTicks = await unloadPad(test, dim);
  log(`seed unload RESULT the pad chunk read unloaded ${unloadTicks} ticks after its area went`);
  test.assert(seed !== undefined, "no seed record");
  world.setDynamicProperty(SEED_KEY, JSON.stringify(seed));
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1500)
  .tag("andrew");

function bindingTextOf(b: Binding | undefined): string {
  return b === undefined ? "none" : `${short(b.type)}@${v3(b.pos)} ${short(b.dim)} owner=${b.owner} epoch=${b.epoch} gen=${b.gen}`;
}

// ------------------------------------------------------------- the check, after the restart

/** The pool of PEAR-ITEM-01: one block deep, running past the platform's far edge onto a laid floor. */
const POOL_MIN: Vector3 = { x: 1, y: 2, z: 2 };
const POOL_MAX: Vector3 = { x: 5, y: 2, z: 10 };
const RIM_MIN: Vector3 = { x: 0, y: 2, z: 1 };
const RIM_MAX: Vector3 = { x: 6, y: 2, z: 11 };
const OUTER_FLOOR_MIN: Vector3 = { x: 0, y: 1, z: 7 };
const OUTER_FLOOR_MAX: Vector3 = { x: 6, y: 1, z: 11 };
const FISH_A: Vector3 = { x: 1, y: 2, z: 0 };
const FISH_B: Vector3 = { x: 5, y: 2, z: 0 };
const FISH_AIM_A: Vector3 = { x: 1.5, y: 2, z: 6.5 };
const FISH_AIM_B: Vector3 = { x: 5.5, y: 2, z: 6.5 };
const BITE_WAIT_TICKS = 1200;
const FISH_DEADLINE_TICKS = 3000;
const BITE_DROP = 0.3;
const BITE_SPEED = -0.25;

function eachCell(min: Vector3, max: Vector3, fn: (at: Vector3) => void): void {
  for (let x = min.x; x <= max.x; x++) for (let y = min.y; y <= max.y; y++) for (let z = min.z; z <= max.z; z++) fn({ x, y, z });
}

function setRel(test: Test, at: Vector3, typeId: string): void {
  test.getDimension().getBlock(test.worldBlockLocation(at))?.setType(typeId);
}

function fill(test: Test, min: Vector3, max: Vector3, typeId: string): void {
  test.getDimension().fillBlocks(new BlockVolume(test.worldBlockLocation(min), test.worldBlockLocation(max)), typeId);
}

function buildPool(test: Test): void {
  eachCell(OUTER_FLOOR_MIN, OUTER_FLOOR_MAX, (at) => setRel(test, at, "minecraft:stone"));
  eachCell(RIM_MIN, RIM_MAX, (at) => {
    const inPool = at.x >= POOL_MIN.x && at.x <= POOL_MAX.x && at.z >= POOL_MIN.z && at.z <= POOL_MAX.z;
    setRel(test, at, inPool ? "minecraft:water" : "minecraft:stone");
  });
}

function clearPool(test: Test): void {
  eachCell(RIM_MIN, RIM_MAX, (at) => setRel(test, at, "minecraft:air"));
  eachCell(OUTER_FLOOR_MIN, OUTER_FLOOR_MAX, (at) => setRel(test, at, "minecraft:air"));
}

function nonRodItems(p: Player): number {
  const inv = inventoryOf(p);
  let n = 0;
  for (let slot = 0; slot < inv.size; slot++) {
    const s = inv.getItem(slot);
    if (s !== undefined && s.typeId !== ROD_ID) n += s.amount;
  }
  return n;
}

/** Casts until a catch, reeling when the bobber is pulled under (pear-item.ts, `pear_item_fishes_unbound`). */
async function fishUntilCatch(test: Test, p: SimulatedPlayer, slot: number, w: Witness, label: string): Promise<{ caught: string; casts: number; ticks: number }> {
  const dim = test.getDimension();
  const start = system.currentTick;
  let casts = 0;
  while (system.currentTick - start < FISH_DEADLINE_TICKS) {
    casts++;
    const before = w.count(p);
    p.useItemInSlot(slot);
    for (let t = 0; t < USE_EVIDENCE_TICKS && w.count(p) === before; t++) await test.idle(1);
    const hook = w.last(p);
    if (hook === undefined || w.count(p) === before) {
      await test.idle(6);
      continue;
    }
    await test.idle(20);
    if (!hook.isValid) continue;
    const rest = hook.location;
    const cell = dim.getBlock({ x: Math.floor(rest.x), y: Math.floor(rest.y), z: Math.floor(rest.z) })?.typeId ?? "unloaded";
    if (cell !== "minecraft:water") {
      for (let tries = 0; tries < 3 && hook.isValid; tries++) {
        p.useItemInSlot(slot);
        for (let t = 0; t < USE_EVIDENCE_TICKS && hook.isValid; t++) await test.idle(1);
      }
      await test.idle(12);
      continue;
    }
    const ys: number[] = [];
    let bite = "";
    const watchFrom = system.currentTick;
    while (system.currentTick - watchFrom < BITE_WAIT_TICKS && hook.isValid) {
      const y = hook.location.y;
      const vy = hook.getVelocity().y;
      const top = ys.length >= 10 ? Math.max(...ys.slice(-10)) : undefined;
      if (top !== undefined && (top - y > BITE_DROP || vy < BITE_SPEED)) {
        bite = `bite at +${system.currentTick - watchFrom}`;
        break;
      }
      ys.push(y);
      await test.idle(1);
    }
    const held = nonRodItems(p);
    const reelAt = system.currentTick;
    for (let tries = 0; tries < 3 && hook.isValid; tries++) {
      p.useItemInSlot(slot);
      for (let t = 0; t < 3 && hook.isValid; t++) await test.idle(1);
    }
    let caught = "";
    for (let t = 0; t < 60 && caught === ""; t++) {
      await test.idle(1);
      if (nonRodItems(p) <= held) continue;
      const inv = inventoryOf(p);
      for (let s = 0; s < inv.size; s++) {
        const it = inv.getItem(s);
        if (it !== undefined && it.typeId !== ROD_ID) caught = `${short(it.typeId)}×${it.amount}`;
      }
      caught = `${caught} picked up +${system.currentTick - reelAt}`;
    }
    log(`fish ${label} #${casts} ${bite || "no bite seen"} -> ${caught || "nothing caught"}`);
    if (caught !== "") return { caught, casts, ticks: system.currentTick - start };
    await test.idle(12);
  }
  return { caught: "", casts, ticks: system.currentTick - start };
}

registerAsync("andrew", "pear_persist_check", async (test: Test): Promise<void> => {
  const raw = world.getDynamicProperty(SEED_KEY);
  test.assert(typeof raw === "string", "no seed: pear_persist_seed did not run in this world before the restart");
  const seed = JSON.parse(raw as string) as Seed;
  const dim = test.getDimension();
  const problems: string[] = [];
  const expect = (ok: boolean, what: string): void => {
    if (!ok) problems.push(what);
  };

  // What the restart kept and dropped, read before anything in this scenario touches it.
  const worldDiff = stateDiff(seed.world, worldState());
  const freeAreas = freeEngineSlots(test);
  const heldAreaLeft = run(dim, `tickingarea remove ${HELD_TRIP_AREA}`) > 0;
  const farWorld = JSON.stringify(world.getDynamicProperty(FAR_KEY));
  const farNumber = JSON.stringify(world.getDynamicProperty(FAR_NUMBER_KEY));
  log(
    `check boot RESULT ${((Date.now() - seed.savedAt) / 1000).toFixed(1)} s since the seed, tick ${seed.tick} -> ${system.currentTick}; ` +
      `world store ${worldDiff.length === 0 ? `unchanged (${Object.keys(seed.world).length} keys)` : `CHANGED: ${worldDiff.join("; ")}`}; ` +
      `engine areas free ${freeAreas} (seed start ${seed.baselineAreas}); ${HELD_TRIP_AREA} ${heldAreaLeft ? "STILL HELD" : "swept"}; ` +
      `trips pending ${pendingTrips()} names held [${heldAreaNames().join(",")}]; world vector ${seed.farWorld} -> ${farWorld}, world number ${farNumber}`
  );
  expect(worldDiff.length === 0, `the world store changed over the restart: ${worldDiff.join("; ")}`);
  expect(!heldAreaLeft && freeAreas >= seed.baselineAreas, `a trip area held over the stop leaked: free ${freeAreas} of ${seed.baselineAreas}, held ${heldAreaLeft}`);

  const w = new Witness();
  let a: SimulatedPlayer | undefined;
  let b: SimulatedPlayer | undefined;
  try {
    a = await survivor(test, CAST_FROM, "pps_a");
    b = await survivor(test, HOME_B, "ppx_b");
    const key = playerKey(a);
    log(
      `check player RESULT ${a.name} id ${seed.player.id} -> ${a.id}; old id resolvable ${world.getEntity(seed.player.id)?.isValid === true}; ` +
        `player copy of the epoch ${seed.player.epochOnPlayer} -> ${JSON.stringify(a.getDynamicProperty(LIFE_EPOCH_KEY))}; key ${key}; ` +
        `world copy ${storedEpoch(key)}; epoch read ${lifeEpochOf(a)} (seed ${seed.player.epoch})`
    );
    expect(key === seed.player.key && lifeEpochOf(a) === seed.player.epoch, `the epoch did not survive: ${lifeEpochOf(a)}, seed ${seed.player.epoch}`);

    // The rods: the chest on the pad and the one left on the ground, compared with what the seed saw.
    const loadTicks = await loadPad(test, dim);
    let ground: Entity | undefined;
    for (let t = 0; t < 60 && ground === undefined; t++) {
      ground = groundRod(dim, seed.marks.ground);
      if (ground === undefined) await test.idle(1);
    }
    const chest = padChest(dim);
    const now: Record<string, Look | undefined> = {};
    for (const [role, mark] of Object.entries(seed.marks)) {
      if (role === "ground") now[role] = lookOf(ground?.getComponent("minecraft:item")?.itemStack);
      else if (role === "plain") {
        let found: ItemStack | undefined;
        for (let slot = 0; slot < chest.size; slot++) if (chest.getItem(slot)?.nameTag === CONTROL_NAME) found = chest.getItem(slot);
        now[role] = lookOf(found);
      } else now[role] = lookOf(rodIn(chest, mark));
    }
    log(`check pad RESULT loaded in ${loadTicks} ticks; ground rod ${ground === undefined ? "NOT FOUND" : "found"}`);
    for (const [role, want] of Object.entries(seed.looks)) {
      const diff = lookDiff(want, now[role]);
      log(`check rod RESULT ${role}: ${diff.length === 0 ? "unchanged" : `CHANGED ${diff.join("; ")}`} — ${lookText(now[role])}`);
      expect(diff.length === 0, `${role} rod changed over the restart: ${diff.join("; ")}`);
    }

    const boundRod = rodIn(chest, seed.marks.bound);
    const deadRod = rodIn(chest, seed.marks.dead);
    const farRod = rodIn(chest, seed.marks.far);
    const kept = bindingOf(boundRod);
    const farKept = bindingOf(farRod);
    const honour = {
      bound: honourFor(a, boundRod),
      dead: honourFor(a, deadRod),
      ground: honourFor(a, ground?.getComponent("minecraft:item")?.itemStack),
      stranger: honourFor(b, boundRod),
    };
    // What the same records would mean to this player without each surviving piece: the epoch from the player copy
    // alone (the one a SimulatedPlayer loses), and the player named by the new entity's id.
    const playerCopyOnly = epochValue(a.getDynamicProperty(LIFE_EPOCH_KEY)) ?? 0;
    const without = {
      deadByPlayerCopy: honourOf(bindingOf(deadRod), { id: key, epoch: playerCopyOnly }),
      boundByPlayerCopy: honourOf(kept, { id: key, epoch: playerCopyOnly }),
      boundByNewId: honourOf(kept, { id: a.id, epoch: lifeEpochOf(a) }),
    };
    log(
      `check honour RESULT ${a.name}: bound=${honour.bound} dead=${honour.dead} ground=${honour.ground}; ${b.name}: bound=${honour.stranger}; ` +
        `controls: epoch from the player copy alone (${playerCopyOnly}) dead=${without.deadByPlayerCopy} bound=${without.boundByPlayerCopy}, keyed by the new id bound=${without.boundByNewId}; ` +
        `plate ${kept === undefined ? "-" : `${short(dim.getBlock(kept.pos)?.typeId ?? "?")} gen ${plateGeneration(kept.dim, kept.pos)} check ${plateCheck(kept)}`}; ` +
        `far record ${bindingTextOf(farKept)} (written ${v3(seed.farBinding.pos)})`
    );
    expect(honour.bound === "honoured" && honour.ground === "honoured", `the surviving bindings are not honoured: ${JSON.stringify(honour)}`);
    expect(honour.dead === "past-life", `the binding voided before the restart came back: ${honour.dead}`);
    expect(honour.stranger === "foreign", `a stranger is ${honour.stranger} to the binding`);
    expect(kept !== undefined && plateCheck(kept) === "same", "the bound plate does not read the same after the restart");
    expect(
      without.deadByPlayerCopy === "honoured" && without.boundByPlayerCopy === "past-life" && without.boundByNewId === "foreign",
      `the controls do not show what the world copy and the key hold: ${JSON.stringify(without)}`
    );

    // Into the players' hands: the bound rod to B first (a stranger's use is a cast), then to A with the rest.
    const invA = inventoryOf(a);
    const invB = inventoryOf(b);
    move(chest, invB, seed.marks.bound);
    await aimAt(test, b, slotOf(invB, seed.marks.bound) ?? 0, AIM_B_FLOOR);
    const strangerUse = await useRod(test, b, w);
    await test.idle(4);
    strangerUse.hook?.remove();
    const afterStranger = bindingOf(rodIn(invB, seed.marks.bound));
    log(`check stranger RESULT ${b.name}'s use: ${useText(strangerUse)}; record after it ${bindingTextOf(afterStranger)}`);
    expect(strangerUse.kind === "cast" && strangerUse.moved < 0.01, `the stranger's use was not a plain cast: ${useText(strangerUse)}`);
    expect(afterStranger !== undefined && JSON.stringify(afterStranger) === JSON.stringify(kept), "the stranger's cast changed the record");

    const boundSlot = move(invB, invA, seed.marks.bound);
    move(chest, invA, seed.marks.dead);
    move(chest, invA, seed.marks.unbound);
    if (ground !== undefined) ground.teleport(a.location);
    for (let t = 0; t < 100 && slotOf(invA, seed.marks.ground) === undefined; t++) await test.idle(1);
    await test.idle(3);
    let plainSlot: number | undefined;
    for (let slot = 0; slot < chest.size; slot++) if (chest.getItem(slot)?.nameTag === CONTROL_NAME) plainSlot = slot;
    if (plainSlot !== undefined) {
      const free = Array.from({ length: invB.size }, (_, n) => n).find((n) => invB.getItem(n) === undefined) ?? 8;
      invB.setItem(free, chest.getItem(plainSlot));
      chest.setItem(plainSlot, undefined);
    }
    const deadAfter = rodIn(invA, seed.marks.dead);
    const groundAfter = rodIn(invA, seed.marks.ground);
    log(
      `check hands RESULT dead record on arrival in ${a.name}'s inventory: ${bindingTextOf(bindingOf(deadAfter))} lore [${deadAfter?.getLore().join("|")}]; ` +
        `ground rod picked up: ${groundAfter === undefined ? "NO" : bindingTextOf(bindingOf(groundAfter))}`
    );
    expect(deadAfter !== undefined && bindingOf(deadAfter) === undefined && deadAfter.getLore().join("|") === "Pearl Rod|unbound", "the dead record was not erased on arrival");
    expect(groundAfter !== undefined && honourFor(a, groundAfter) === "honoured", "the ground rod is not in A's hands with its binding");

    // AC 1: the binding made before the restart takes its binder, now a new entity, to the same plate.
    const unloadTicks = await unloadPad(test, dim);
    await aimAt(test, a, boundSlot, AIM);
    const trip = await useRod(test, a, w);
    const afterTrip = rodIn(invA, seed.marks.bound);
    const onPlate = kept !== undefined && trip.kind === "trip" && trip.outcome === "arrived" && inCell(trip.at, kept.pos) && a.dimension.id === kept.dim;
    log(
      `check trip RESULT pad unloaded ${unloadTicks} ticks after its area went; ${a.name}'s use of the rod bound before the restart: ${useText(trip)}; ` +
        `cell ${v3({ x: Math.floor(trip.at.x), y: Math.floor(trip.at.y), z: Math.floor(trip.at.z) })} vs the plate ${kept === undefined ? "-" : v3(kept.pos)} ` +
        `(${dim.isChunkLoaded(kept?.pos ?? trip.at) ? short(dim.getBlock(kept?.pos ?? trip.at)?.typeId ?? "?") : "unloaded once the trip's area went"}); record after ${bindingTextOf(bindingOf(afterTrip))} lore [${afterTrip?.getLore().join("|")}]`
    );
    expect(onPlate, `the trip did not end on the plate: ${useText(trip)}`);
    expect(afterTrip !== undefined && bindingOf(afterTrip) === undefined, "the arrival did not clear the binding");

    // AC 2: the epoch read after the restart is the one a binding records and the one a death moves on.
    a.teleport(test.worldLocation({ x: CAST_FROM.x + 0.5, y: CAST_FROM.y, z: CAST_FROM.z + 0.5 }), { dimension: dim });
    a.setSpawnPoint({ dimension: dim, ...test.worldBlockLocation(CAST_FROM) });
    await test.idle(3);
    dim.setBlockType(test.worldBlockLocation(PLATFORM_CHEST), "minecraft:chest");
    fill(test, FIELD_MIN, FIELD_MAX, STONE_PLATE);
    await test.idle(2);
    const fresh = await bindFresh(test, a, 5, AIM, w);
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
    const store = platformChest(test);
    for (let slot = 0; slot < invA.size; slot++) {
      const s = invA.getItem(slot);
      if (s === undefined) continue;
      store.addItem(s);
      invA.setItem(slot, undefined);
    }
    const storedRod = (mark: string): ItemStack | undefined => rodIn(store, mark);
    const beforeDeath = { ground: honourFor(a, storedRod(seed.marks.ground)), fresh: honourFor(a, storedRod(fresh.mark)) };
    const death = await killAndWait(test, a, w);
    await respawnTo(test, a, test.worldLocation({ x: CAST_FROM.x + 0.5, y: CAST_FROM.y, z: CAST_FROM.z + 0.5 }), dim);
    const afterDeath = { ground: honourFor(a, storedRod(seed.marks.ground)), fresh: honourFor(a, storedRod(fresh.mark)) };
    const freshSlot = move(store, invA, fresh.mark);
    move(store, invA, seed.marks.ground);
    await test.idle(3);
    await aimAt(test, a, freshSlot, AIM);
    const deadUse = await useRod(test, a, w);
    await test.idle(4);
    deadUse.hook?.remove();
    const freshAfter = rodIn(invA, fresh.mark);
    const groundAfterDeath = rodIn(invA, seed.marks.ground);
    log(
      `check death RESULT a binding made after the restart: ${bindingTextOf(fresh.binding)}; before the death ground=${beforeDeath.ground} fresh=${beforeDeath.fresh}; ` +
        `death ${death.died ? "seen" : "NOT SEEN"} epoch ${death.before} -> ${death.after} (player copy ${JSON.stringify(a.getDynamicProperty(LIFE_EPOCH_KEY))}, world copy ${storedEpoch(key)}); ` +
        `after it ground=${afterDeath.ground} fresh=${afterDeath.fresh}; back in hand: fresh ${bindingTextOf(bindingOf(freshAfter))} [${freshAfter?.getLore().join("|")}], ` +
        `ground ${bindingTextOf(bindingOf(groundAfterDeath))} [${groundAfterDeath?.getLore().join("|")}]; the use: ${useText(deadUse)}`
    );
    expect(fresh.binding.epoch === seed.player.epoch && fresh.binding.owner === key, `the binding after the restart did not record the surviving epoch: ${bindingTextOf(fresh.binding)}`);
    expect(beforeDeath.ground === "honoured" && beforeDeath.fresh === "honoured", `before the death: ${JSON.stringify(beforeDeath)}`);
    expect(death.died && death.after === seed.player.epoch + 1, `the death after the restart moved the epoch ${death.before} -> ${death.after}`);
    expect(afterDeath.ground === "past-life" && afterDeath.fresh === "past-life", `after the death: ${JSON.stringify(afterDeath)}`);
    expect(bindingOf(freshAfter) === undefined && bindingOf(groundAfterDeath) === undefined, "a voided record was not erased on its way back to the binder");
    expect(deadUse.kind === "cast" && deadUse.moved < 0.01, `the voided rod's use was not a plain cast: ${useText(deadUse)}`);

    // AC 3: the unbound rod that went through the restart fishes; the plain control fishes beside it.
    const unboundSlot = move(store, invA, seed.marks.unbound);
    store.clearAll();
    buildPool(test);
    a.teleport(test.worldLocation({ x: FISH_A.x + 0.5, y: FISH_A.y, z: FISH_A.z + 0.5 }), { dimension: dim });
    b.teleport(test.worldLocation({ x: FISH_B.x + 0.5, y: FISH_B.y, z: FISH_B.z + 0.5 }), { dimension: dim });
    await test.idle(3);
    const plainB = Array.from({ length: invB.size }, (_, n) => n).find((n) => invB.getItem(n)?.nameTag === CONTROL_NAME);
    test.assert(plainB !== undefined, "the plain control rod is not in B's hands");
    await aimAt(test, a, unboundSlot, FISH_AIM_A);
    await aimAt(test, b, plainB as number, FISH_AIM_B);
    let pearl = { caught: "", casts: 0, ticks: 0 };
    let plain = { caught: "", casts: 0, ticks: 0 };
    try {
      [pearl, plain] = await Promise.all([fishUntilCatch(test, a, unboundSlot, w, "pearl"), fishUntilCatch(test, b, plainB as number, w, "plain")]);
      await test.idle(4);
    } finally {
      clearPool(test);
    }
    const fished = lookOf(invA.getItem(unboundSlot));
    const control = lookOf(invB.getItem(plainB as number));
    log(`check fish RESULT pearl (through the restart): ${pearl.caught || "NOTHING"} in ${pearl.casts} cast(s), ${pearl.ticks} ticks; rod ${lookText(fished)}`);
    log(`check fish RESULT plain control: ${plain.caught || "NOTHING"} in ${plain.casts} cast(s), ${plain.ticks} ticks; rod ${lookText(control)}`);
    const want = seed.looks.unbound;
    expect(plain.caught !== "", `control: the plain rod caught nothing in ${plain.casts} cast(s) — the pool does not fish`);
    expect(pearl.caught !== "", `the unbound Pearl Rod caught nothing in ${pearl.casts} cast(s)`);
    expect(fished !== undefined && lookDiff(want, fished).length === 0, `fishing changed the rod: ${lookDiff(want, fished).join("; ")}`);
  } catch (err) {
    problems.push(`threw ${errText(err)}`);
  } finally {
    w.close();
    world.setDynamicProperty(SEED_KEY, undefined);
    world.setDynamicProperty(FAR_KEY, undefined);
    world.setDynamicProperty(FAR_NUMBER_KEY, undefined);
    run(dim, `tickingarea remove ${PAD_AREA}`);
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
    for (const p of [a, b]) {
      if (p === undefined || !p.isValid) continue;
      for (const h of dim.getEntities({ type: HOOK_ID })) if (h.getComponent("minecraft:projectile")?.owner?.id === p.id) h.remove();
    }
  }
  log(`check RESULT ${problems.length === 0 ? "every check held" : `${problems.length} problem(s): ${problems.join(" | ")}`}`);
  test.assert(problems.length === 0, problems.join(" | "));
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(6000)
  .tag("andrew");
