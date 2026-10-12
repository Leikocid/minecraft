// PEAR-TP-01 on BDS 1.26.51.1 (spec v3 §7, bound state; L0-xasm42, L0-pear-pr03, L0-adr-prta): the binder's next use
// of a bound Pearl Rod moves them onto the plate — next door, a million blocks out, into another dimension — and
// clears the binding; an unsafe, gone, unloadable, refused or crowded destination moves nobody and keeps or clears the
// binding as xasm42 says; the world area budget keeps the rod's slot while structure searches hold the rest; and no
// outcome leaves a ticking area behind. The "[pear-tp] … RESULT" lines are quoted in src/pearl/README.md.

import {
  BlockPermutation,
  BlockTypes,
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
import { AreaBudget, GAMETEST_AREA_CAP } from "../pearl/area-pool";
import { bindingOf, lifeEpochOf, plateGeneration } from "../pearl/bind";
import { type Binding, HOOK_ID, bindingEntries, boundLore } from "../pearl/bind-rules";
import { makePearlRod } from "../pearl/item";
import { MARK_KEY } from "../pearl/item-rules";
import { heldAreaNames, lastOutcome, pendingTrips, registerPearlTeleport, teleportStats } from "../pearl/teleport";
import { PRELOAD_TIMEOUT_TICKS } from "../pearl/teleport-rules";
import { engineRingLoader } from "../structures/search-ring";
import { engineSpawnHost } from "../structures/spawn-search";

/**
 * This pack's budget, at the cap a GameTest world gives (GameTest holds one area itself, probe Q5). The release pack
 * arms its own copy with `worldAreas` and cannot read a SimulatedPlayer's use (C-2); this copy is the one the
 * scenarios drive, through the same beforeEvents.itemUse a human's use goes through.
 */
const gtAreas = new AreaBudget(GAMETEST_AREA_CAP);
registerPearlTeleport({ areas: gtAreas, areaPrefix: "andrew_gt_pearl_" });

const STRUCTURE = "andrew:platform";
const HOME: Vector3 = { x: 3, y: 2, z: 0 };
const STONE_PLATE = "minecraft:stone_pressure_plate";
/** The plate on the platform for the outcome scenarios; the floor is relative y=1. */
const PLATE_REL: Vector3 = { x: 3, y: 2, z: 4 };
const FIELD_MIN: Vector3 = { x: 0, y: 2, z: 1 };
const FIELD_MAX: Vector3 = { x: 6, y: 2, z: 6 };
const AIM: Vector3 = { x: 3.5, y: 2, z: 5.5 };
/** Far pads float at this height: no terrain under or around them. */
const FAR_Y = 100;
/** A cell above the overworld's height range: its column loads, but the cell never answers getBlock. */
const NEVER_Y = 400;

const USE_EVIDENCE_TICKS = 6;
const USE_TRIES = 12;

const log = (msg: string): void => console.warn(`[pear-tp] ${msg}`);
const short = (id: string): string => id.replace("minecraft:", "");
const f2 = (n: number): string => n.toFixed(2);
const v2 = (v: Vector3): string => `${f2(v.x)},${f2(v.y)},${f2(v.z)}`;
const dist = (a: Vector3, b: Vector3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const centre = (c: Vector3): Vector3 => ({ x: c.x + 0.5, y: c.y, z: c.z + 0.5 });
const errText = (err: unknown): string => (err instanceof Error ? err.message : String(err)).split("\n")[0].slice(0, 160);

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) throw new Error(`${player.name} has no inventory container`);
  return container;
}

async function survivor(test: Test, at: Vector3, name: string): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  await test.idle(2);
  p.addEffect("resistance", 20000, { amplifier: 4, showParticles: false });
  await test.idle(1);
  return p;
}

function rodOf(p: Player, rodId: string): ItemStack | undefined {
  const inv = inventoryOf(p);
  for (let slot = 0; slot < inv.size; slot++) {
    const s = inv.getItem(slot);
    if (s?.typeId === "minecraft:fishing_rod" && s.getDynamicProperty(MARK_KEY) === rodId) return s;
  }
  return undefined;
}

const sameBinding = (a: Binding | undefined, b: Binding | undefined): boolean =>
  a !== undefined && b !== undefined && a.dim === b.dim && dist(a.pos, b.pos) === 0 && a.type === b.type && a.owner === b.owner && a.epoch === b.epoch && a.gen === b.gen;

const bindingText = (b: Binding | undefined): string => (b === undefined ? "none" : `${short(b.type)}@${b.pos.x},${b.pos.y},${b.pos.z} ${short(b.dim)}`);

/**
 * A fresh Pearl Rod carrying `p`'s binding to `pos`, written as bind.ts writes it, in `slot` and selected. The far,
 * cross-dimension and outcome scenarios bind this way; `pear_tp_near_clears` binds through a real cast.
 */
async function bindTo(test: Test, p: SimulatedPlayer, slot: number, dimId: string, pos: Vector3, type = STONE_PLATE): Promise<{ rodId: string; binding: Binding }> {
  const binding: Binding = { dim: dimId, pos: { x: pos.x, y: pos.y, z: pos.z }, type, owner: p.id, epoch: lifeEpochOf(p), gen: plateGeneration(dimId, pos) };
  const rod = makePearlRod();
  for (const [key, value] of bindingEntries(binding)) rod.setDynamicProperty(key, value);
  rod.setLore(boundLore(binding));
  p.setItem(rod, slot, true);
  await test.idle(2);
  return { rodId: String(rod.getDynamicProperty(MARK_KEY)), binding };
}

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

/** Hooks by caster id, from entitySpawn (the owner is readable at +0, probe Q3). */
class Hooks {
  private readonly byOwner = new Map<string, Entity[]>();
  private readonly sub: (e: EntitySpawnAfterEvent) => void;

  constructor() {
    this.sub = world.afterEvents.entitySpawn.subscribe((ev) => {
      if (ev.entity.typeId !== HOOK_ID) return;
      const owner = ev.entity.getComponent("minecraft:projectile")?.owner;
      if (owner?.isValid !== true) return;
      const list = this.byOwner.get(owner.id) ?? [];
      list.push(ev.entity);
      this.byOwner.set(owner.id, list);
    });
  }

  count(p: Player): number {
    return this.byOwner.get(p.id)?.length ?? 0;
  }

  last(p: Player): Entity | undefined {
    return this.byOwner.get(p.id)?.at(-1);
  }

  close(): void {
    world.afterEvents.entitySpawn.unsubscribe(this.sub);
  }
}

/** One vanilla cast, retried until a new hook shows it happened (a SimulatedPlayer drops uses that come too fast). */
async function castHook(test: Test, p: SimulatedPlayer, slot: number, hooks: Hooks): Promise<Entity> {
  for (let tries = 0; tries < USE_TRIES; tries++) {
    const before = hooks.count(p);
    p.useItemInSlot(slot);
    for (let t = 0; t < USE_EVIDENCE_TICKS && hooks.count(p) === before; t++) await test.idle(1);
    const hook = hooks.last(p);
    if (hooks.count(p) > before && hook !== undefined) return hook;
  }
  throw new Error(`${p.name}: no hook after ${USE_TRIES} uses`);
}

/** One bound use, retried until the module counts it; returns the tick it was counted in. */
async function boundUse(test: Test, p: SimulatedPlayer, slot: number): Promise<number> {
  for (let tries = 0; tries < USE_TRIES; tries++) {
    const uses = teleportStats.uses;
    p.useItemInSlot(slot);
    for (let t = 0; t < USE_EVIDENCE_TICKS && teleportStats.uses === uses; t++) await test.idle(1);
    if (teleportStats.uses > uses) return system.currentTick;
  }
  throw new Error(`${p.name}: no bound use counted after ${USE_TRIES} uses`);
}

/** The outcome that ends `p`'s trip, decided at `since` or later; "already travelling" ends no trip. */
async function outcomeOf(test: Test, p: Player, since: number, maxTicks = PRELOAD_TIMEOUT_TICKS + 60): Promise<{ outcome: string; tick: number; detail: string }> {
  for (let t = 0; t <= maxTicks; t++) {
    const o = lastOutcome.get(p.id);
    if (o !== undefined && o.tick >= since && o.outcome !== "travelling") return o;
    await test.idle(1);
  }
  throw new Error(`${p.name}: no outcome within ${maxTicks} ticks of the use`);
}

let serial = 0;

/** Command areas the engine still accepts: added one by one far away until refused, then all removed (probe Q5). */
function freeEngineSlots(test: Test): number {
  const dim = test.getDimension();
  const o = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const names: string[] = [];
  for (let i = 0; i < 12; i++) {
    const name = `andrew_gt_peartp_free_${serial++}`;
    const x = o.x + 50_000 + i * 64;
    let ok = 0;
    try {
      ok = dim.runCommand(`tickingarea add ${x} 0 ${o.z} ${x} 0 ${o.z} ${name}`).successCount;
    } catch {
      ok = 0;
    }
    if (ok === 0) break;
    names.push(name);
  }
  for (const name of names) dim.runCommand(`tickingarea remove ${name}`);
  return names.length;
}

/** No trip pending, no slot held, no name held, and the engine takes as many areas as it did at the start. */
function assertClean(test: Test, label: string, baseline: number): void {
  const free = freeEngineSlots(test);
  log(`${label} areas RESULT budget_held=${gtAreas.held()} trips=${pendingTrips()} names=[${heldAreaNames().join(",")}] engine_free=${free} (start ${baseline})`);
  test.assert(gtAreas.held() === 0 && pendingTrips() === 0 && heldAreaNames().length === 0, `${label}: the module still holds a trip, a slot or a name`);
  test.assert(free === baseline, `${label}: the engine accepts ${free} areas, ${baseline} at the start — an area leaked`);
}

function fill(test: Test, min: Vector3, max: Vector3, typeId: string): void {
  test.getDimension().fillBlocks(new BlockVolume(test.worldBlockLocation(min), test.worldBlockLocation(max)), typeId);
}

function setRel(test: Test, at: Vector3, typeId: string): void {
  test.getDimension().getBlock(test.worldBlockLocation(at))?.setType(typeId);
}

function typeAt(dim: Dimension, at: Vector3): string {
  try {
    return dim.getBlock(at)?.typeId ?? "unloaded";
  } catch {
    return "out-of-range";
  }
}

function nineLoaded(dim: Dimension, x: number, y: number, z: number): boolean {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!dim.isChunkLoaded({ x: x + dx, y, z: z + dz })) return false;
  return dim.getBlock({ x, y, z }) !== undefined;
}

/** A 3×3 stone floor, three cells of air above it, a plate in the middle: an open landing pad. */
function buildPad(dim: Dimension, at: Vector3, plate: string): void {
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      dim.setBlockType({ x: at.x + dx, y: at.y - 1, z: at.z + dz }, "minecraft:stone");
      for (let dy = 0; dy <= 2; dy++) dim.setBlockType({ x: at.x + dx, y: at.y + dy, z: at.z + dz }, "minecraft:air");
    }
  dim.setBlockPermutation(at, BlockPermutation.resolve(plate));
}

const SITE_AREA = "andrew_gt_peartp_site";

/** Builds a pad far away under a test-owned area, removes the area, and waits until the chunk has unloaded again. */
async function farPad(test: Test, dim: Dimension, x: number, z: number, y: number): Promise<{ at: Vector3; unloadTicks: number }> {
  const at = { x, y, z };
  test.assert(dim.runCommand(`tickingarea add ${x - 1} 0 ${z - 1} ${x + 1} 0 ${z + 1} ${SITE_AREA}`).successCount > 0, `site area refused at ${short(dim.id)} ${x} ${z}`);
  try {
    let t = 0;
    for (; t < 600 && !nineLoaded(dim, x, y, z); t++) await test.idle(1);
    test.assert(t < 600, `the site at ${short(dim.id)} ${x} ${z} never loaded`);
    buildPad(dim, at, STONE_PLATE);
  } finally {
    dim.runCommand(`tickingarea remove ${SITE_AREA}`);
  }
  let unloadTicks = 0;
  for (; unloadTicks < 600 && dim.isChunkLoaded(at); unloadTicks++) await test.idle(1);
  // The site name is free again from the next tick (probe Q5).
  await test.idle(2);
  test.assert(!dim.isChunkLoaded(at), `the site at ${short(dim.id)} ${x} ${z} is still loaded ${unloadTicks} ticks after its area went`);
  return { at, unloadTicks };
}

async function home(test: Test, p: SimulatedPlayer, at: Vector3 = HOME): Promise<void> {
  p.teleport(test.worldLocation({ x: at.x + 0.5, y: at.y, z: at.z + 0.5 }), { dimension: test.getDimension() });
  await test.idle(3);
}

interface Trip {
  outcome: string;
  detail: string;
  ticks: number;
  hooks: number;
  bars: string[];
  from: Vector3;
  fromDim: string;
  at: Vector3;
  dim: string;
  later: string;
  binding: Binding | undefined;
  lore: string;
}

/** A bound use and everything the scenarios look at afterwards, including the player 20 ticks later. */
async function trip(test: Test, p: SimulatedPlayer, slot: number, rodId: string, bars: Bars, hooks?: Hooks): Promise<Trip> {
  const from = { ...p.location };
  const fromDim = p.dimension.id;
  const hooks0 = hooks?.count(p) ?? 0;
  const t0 = await boundUse(test, p, slot);
  const o = await outcomeOf(test, p, t0);
  const at = { ...p.location };
  const dim = p.dimension.id;
  await test.idle(20);
  const below = { x: Math.floor(p.location.x), y: Math.floor(p.location.y) - 1, z: Math.floor(p.location.z) };
  const later = `+20:${short(p.dimension.id)} off=${f2(dist(p.location, at))} ground=${p.isOnGround} under=${short(typeAt(p.dimension, below))}`;
  const rod = rodOf(p, rodId);
  return {
    outcome: o.outcome,
    detail: o.detail,
    ticks: o.tick - t0,
    hooks: (hooks?.count(p) ?? 0) - hooks0,
    bars: bars.since(t0),
    from,
    fromDim,
    at,
    dim,
    later,
    binding: bindingOf(rod),
    lore: rod?.getLore().join("|") ?? "rod missing",
  };
}

const tripText = (t: Trip): string =>
  `outcome=${t.outcome} after ${t.ticks} ticks${t.detail === "" ? "" : ` (${t.detail})`} moved ${short(t.fromDim)} ${v2(t.from)} -> ${short(t.dim)} ${v2(t.at)} ` +
  `(${Math.round(dist(t.from, t.at))} blocks) ${t.later} binding=${bindingText(t.binding)} lore=[${t.lore}] bars=[${t.bars.join(",")}]`;

/** An arrival: on the plate cell's centre in its dimension, still there 20 ticks later, binding cleared, one line. */
function assertArrived(test: Test, label: string, t: Trip, plate: Vector3, dimId: string): void {
  test.assert(t.outcome === "arrived", `${label}: outcome ${t.outcome} ${t.detail}`);
  test.assert(t.dim === dimId && dist(t.at, centre(plate)) < 0.01, `${label}: at ${short(t.dim)} ${v2(t.at)}, not on the plate ${v2(centre(plate))}`);
  test.assert(t.later.includes(`${short(dimId)} off=0.00 ground=true`), `${label}: did not stay on the pad: ${t.later}`);
  test.assert(t.binding === undefined && t.lore === "Pearl Rod|unbound", `${label}: binding not cleared: ${bindingText(t.binding)} [${t.lore}]`);
  test.assert(t.bars.join(",") === "arrived", `${label}: actionbar [${t.bars.join(",")}]`);
}

/** A refusal: not moved, the same binding still on the rod, one line naming the reason and none claiming arrival. */
function assertKept(test: Test, label: string, t: Trip, outcome: string, kept: Binding): void {
  test.assert(t.outcome === outcome, `${label}: outcome ${t.outcome} ${t.detail}, expected ${outcome}`);
  test.assert(t.dim === t.fromDim && dist(t.at, t.from) < 0.01, `${label}: the player moved to ${short(t.dim)} ${v2(t.at)}`);
  test.assert(sameBinding(t.binding, kept) && t.lore === boundLore(kept).join("|"), `${label}: binding not kept: ${bindingText(t.binding)} [${t.lore}]`);
  test.assert(!t.bars.includes("arrived"), `${label}: an arrival was claimed`);
  test.assert(t.bars.at(-1) === outcome.replace("-", "_"), `${label}: last line [${t.bars.join(",")}]`);
}

// ------------------------------------------------------------- AC1: a near plate, bound by a real cast

registerAsync("andrew", "pear_tp_near_clears", async (test: Test): Promise<void> => {
  const p = await survivor(test, HOME, "ptp_near");
  const dim = test.getDimension();
  const baseline = freeEngineSlots(test);
  const bars = new Bars();
  const hooks = new Hooks();
  try {
    fill(test, FIELD_MIN, FIELD_MAX, STONE_PLATE);
    const rod = makePearlRod();
    const rodId = String(rod.getDynamicProperty(MARK_KEY));
    p.setItem(rod, 0, true);
    await test.idle(2);
    p.lookAtLocation(AIM, LookDuration.Instant);
    await test.idle(2);
    let binding: Binding | undefined;
    for (let attempt = 1; attempt <= 4 && binding === undefined; attempt++) {
      const hook = await castHook(test, p, 0, hooks);
      for (let t = 0; t < 60 && binding === undefined && hook.isValid; t++) {
        await test.idle(1);
        binding = bindingOf(rodOf(p, rodId));
      }
      binding ??= bindingOf(rodOf(p, rodId));
      if (hook.isValid) hook.remove();
      await test.idle(2);
    }
    test.assert(binding !== undefined, "the rod never bound in 4 casts onto a field of plates");
    if (binding === undefined) return;
    // Only the bound plate stays: nothing else on the field can bind the vanilla cast that follows.
    const plateRel = test.relativeBlockLocation(binding.pos);
    for (let x = FIELD_MIN.x; x <= FIELD_MAX.x; x++)
      for (let z = FIELD_MIN.z; z <= FIELD_MAX.z; z++) if (x !== plateRel.x || z !== plateRel.z) setRel(test, { x, y: FIELD_MIN.y, z }, "minecraft:air");
    await test.idle(2);
    log(`near bound RESULT by a cast: ${bindingText(binding)} rel ${plateRel.x},${plateRel.y},${plateRel.z} owner=${binding.owner === p.id ? "caster" : binding.owner}`);

    const t = await trip(test, p, 0, rodId, bars, hooks);
    log(`near trip RESULT ${tripText(t)} hooks_during_use=${t.hooks}`);
    assertArrived(test, "near", t, binding.pos, dim.id);
    test.assert(t.hooks === 0, `the bound use threw ${t.hooks} hook(s): it was not cancelled`);
    assertClean(test, "near", baseline);

    // The next use is a plain cast: a hook, no trip.
    p.lookAtLocation({ x: 0.5, y: 2, z: plateRel.z + 0.5 }, LookDuration.Instant);
    await test.idle(2);
    const uses0 = teleportStats.uses;
    const hooks0 = hooks.count(p);
    const hook = await castHook(test, p, 0, hooks);
    const castLine = `next use RESULT hook=${hooks.count(p) - hooks0} bound_uses=${teleportStats.uses - uses0} player_at=${v2(test.relativeLocation(p.location))} binding=${bindingText(bindingOf(rodOf(p, rodId)))}`;
    if (hook.isValid) hook.remove();
    log(castLine);
    test.assert(teleportStats.uses === uses0 && hooks.count(p) - hooks0 === 1, `the use after the trip was not a plain cast: ${castLine}`);
    assertClean(test, "near, after the cast", baseline);
  } finally {
    hooks.close();
    bars.close();
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1500)
  .tag("andrew");

// ------------------------------------------------------------- AC2: far plates in unloaded chunks, no distance cap

registerAsync("andrew", "pear_tp_far_unloaded", async (test: Test): Promise<void> => {
  const p = await survivor(test, HOME, "ptp_far");
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const baseline = freeEngineSlots(test);
  const bars = new Bars();
  try {
    for (const dx of [100_000, 1_000_000]) {
      const site = await farPad(test, dim, origin.x + dx, origin.z + 7, FAR_Y);
      const { rodId } = await bindTo(test, p, 0, dim.id, site.at);
      const loadedAtUse = dim.isChunkLoaded(site.at);
      const t = await trip(test, p, 0, rodId, bars);
      log(`far ${dx} RESULT unloaded ${site.unloadTicks} ticks after the site area went, loaded_at_use=${loadedAtUse}; ${tripText(t)}`);
      test.assert(!loadedAtUse, `far ${dx}: the plate chunk was loaded at the use — nothing to preload`);
      assertArrived(test, `far ${dx}`, t, site.at, dim.id);
      test.assert(dist(t.from, t.at) > dx * 0.99, `far ${dx}: travelled only ${Math.round(dist(t.from, t.at))} blocks`);
      assertClean(test, `far ${dx}`, baseline);
      await home(test, p);
    }
  } finally {
    bars.close();
    await home(test, p);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");

// ------------------------------------------------------------- AC3: an unsafe destination moves nobody

registerAsync("andrew", "pear_tp_unsafe_keeps", async (test: Test): Promise<void> => {
  const p = await survivor(test, HOME, "ptp_unsafe");
  const dim = test.getDimension();
  const baseline = freeEngineSlots(test);
  const bars = new Bars();
  const plate = test.worldBlockLocation(PLATE_REL);
  const around = (dy: number, withPlate: boolean): Vector3[] => {
    const out: Vector3[] = [];
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (withPlate || dx !== 0 || dz !== 0) out.push({ x: PLATE_REL.x + dx, y: PLATE_REL.y + dy, z: PLATE_REL.z + dz });
    return out;
  };
  const variants: Array<{ label: string; set: () => void; undo: () => void }> = [
    {
      label: "suffocation",
      set: () => around(1, true).forEach((c) => setRel(test, c, "minecraft:stone")),
      undo: () => around(1, true).forEach((c) => setRel(test, c, "minecraft:air")),
    },
    {
      label: "lava",
      set: () => {
        setRel(test, { ...PLATE_REL, y: PLATE_REL.y + 1 }, "minecraft:stone");
        around(0, false).forEach((c) => setRel(test, c, "minecraft:lava"));
      },
      undo: () => {
        around(0, false).forEach((c) => setRel(test, c, "minecraft:air"));
        setRel(test, { ...PLATE_REL, y: PLATE_REL.y + 1 }, "minecraft:air");
      },
    },
    {
      label: "void",
      set: () => {
        setRel(test, { ...PLATE_REL, y: PLATE_REL.y + 1 }, "minecraft:stone");
        around(-1, false).forEach((c) => setRel(test, c, "minecraft:air"));
      },
      undo: () => {
        around(-1, false).forEach((c) => setRel(test, c, "minecraft:stone"));
        setRel(test, { ...PLATE_REL, y: PLATE_REL.y + 1 }, "minecraft:air");
      },
    },
  ];
  try {
    setRel(test, PLATE_REL, STONE_PLATE);
    for (const v of variants) {
      v.set();
      await test.idle(2);
      const { rodId, binding } = await bindTo(test, p, 0, dim.id, plate);
      const t = await trip(test, p, 0, rodId, bars);
      log(`unsafe ${v.label} RESULT ${tripText(t)}`);
      assertKept(test, `unsafe ${v.label}`, t, "unsafe", binding);
      assertClean(test, `unsafe ${v.label}`, baseline);
      v.undo();
      await test.idle(2);
    }
    // Control: the same plate with every head blocked but west's. The search reaches the neighbours and the kept
    // binding of the last refusal still works.
    variants[0].set();
    setRel(test, { x: PLATE_REL.x - 1, y: PLATE_REL.y + 1, z: PLATE_REL.z }, "minecraft:air");
    await test.idle(2);
    const { rodId } = await bindTo(test, p, 0, dim.id, plate);
    const t = await trip(test, p, 0, rodId, bars);
    log(`unsafe control_west_open RESULT ${tripText(t)}`);
    assertArrived(test, "control: west open", t, { x: plate.x - 1, y: plate.y, z: plate.z }, dim.id);
    assertClean(test, "unsafe control", baseline);
    variants[0].undo();
  } finally {
    bars.close();
    await home(test, p);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2000)
  .tag("andrew");

// ------------------------------------------------------------- AC6 and xasm42 on the engine: every other outcome

registerAsync("andrew", "pear_tp_outcomes_no_leak", async (test: Test): Promise<void> => {
  const p = await survivor(test, HOME, "ptp_rows");
  const stranger = await survivor(test, { x: 5, y: 2, z: 0 }, "ptp_rows_q");
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const nether = world.getDimension("nether");
  const plate = test.worldBlockLocation(PLATE_REL);
  const baseline = freeEngineSlots(test);
  const bars = new Bars();
  const hooks = new Hooks();
  const fillers: string[] = [];
  try {
    // Row 2: the plate is gone, or is another type. The binding is cleared.
    for (const [label, replacement] of [
      ["missing", "minecraft:air"],
      ["other_type", "minecraft:birch_pressure_plate"],
    ] as const) {
      setRel(test, PLATE_REL, STONE_PLATE);
      const { rodId } = await bindTo(test, p, 0, dim.id, plate);
      setRel(test, PLATE_REL, replacement);
      const t = await trip(test, p, 0, rodId, bars);
      log(`row2 ${label} RESULT ${tripText(t)}`);
      test.assert(t.outcome === "plate-gone" && dist(t.at, t.from) < 0.01, `row2 ${label}: ${t.outcome}, moved ${f2(dist(t.at, t.from))}`);
      test.assert(t.binding === undefined && t.lore === "Pearl Rod|unbound", `row2 ${label}: binding not cleared`);
      test.assert(t.bars.join(",") === "plate_gone", `row2 ${label}: bars [${t.bars.join(",")}]`);
      assertClean(test, `row2 ${label}`, baseline);
    }
    setRel(test, PLATE_REL, STONE_PLATE);

    // Row 3, forced: a destination that never reads loaded times out at 200 ticks; row 5 meanwhile: a second use is
    // "already travelling" and starts nothing.
    {
      const never = { x: origin.x + 70_000, y: NEVER_Y, z: origin.z };
      const { rodId, binding } = await bindTo(test, p, 0, dim.id, never);
      const from = { ...p.location };
      const t0 = await boundUse(test, p, 0);
      const travelling0 = teleportStats.outcomes.travelling ?? 0;
      await test.idle(2);
      const heldWhileWaiting = `${heldAreaNames().join(",")} budget=${gtAreas.held("pearl")}`;
      const adds0 = teleportStats.areaAdds;
      for (let tries = 0; tries < USE_TRIES && (teleportStats.outcomes.travelling ?? 0) === travelling0; tries++) {
        p.useItemInSlot(0);
        await test.idle(USE_EVIDENCE_TICKS);
      }
      const travelled = (teleportStats.outcomes.travelling ?? 0) - travelling0;
      const o = await outcomeOf(test, p, t0);
      const rod = rodOf(p, rodId);
      const line =
        `row3 not_loaded RESULT outcome=${o.outcome} after ${o.tick - t0} ticks (${o.detail}) held_while_waiting=[${heldWhileWaiting}] ` +
        `row5 travelling_refusals=${travelled} extra_area_adds=${teleportStats.areaAdds - adds0} moved=${f2(dist(p.location, from))} ` +
        `binding=${bindingText(bindingOf(rod))} bars=[${bars.since(t0).join(",")}]`;
      log(line);
      test.assert(o.outcome === "not-loaded" && Math.abs(o.tick - t0 - PRELOAD_TIMEOUT_TICKS) <= 2, `row3: ${line}`);
      test.assert(heldWhileWaiting.startsWith("andrew_gt_pearl_") && heldWhileWaiting.endsWith("budget=1"), `row3: no area held while waiting: ${line}`);
      test.assert(travelled >= 1 && teleportStats.areaAdds === adds0, `row5: the second use was not refused as travelling, or added an area: ${line}`);
      test.assert(sameBinding(bindingOf(rod), binding) && dist(p.location, from) < 0.01, `row3: ${line}`);
      const b = bars.since(t0);
      test.assert(b.includes("travelling") && b.at(-1) === "not_loaded" && !b.includes("arrived"), `row3/5 bars: ${line}`);
      assertClean(test, "row3 not_loaded", baseline);
    }

    // Row 3: the engine refuses the area (the world is full). Busy; the binding is kept.
    {
      for (let i = 0; i < 12; i++) {
        const name = `andrew_gt_peartp_fill_${i}`;
        const x = origin.x + 60_000 + i * 64;
        if (dim.runCommand(`tickingarea add ${x} 0 ${origin.z} ${x} 0 ${origin.z} ${name}`).successCount === 0) break;
        fillers.push(name);
      }
      const { rodId, binding } = await bindTo(test, p, 0, dim.id, plate);
      const t = await trip(test, p, 0, rodId, bars);
      log(`row3 busy_engine RESULT filled ${fillers.length} raw areas; ${tripText(t)}`);
      assertKept(test, "row3 busy", t, "busy", binding);
      test.assert(t.detail.includes("engine refused"), `row3 busy: ${t.detail}`);
      for (const name of fillers.splice(0)) dim.runCommand(`tickingarea remove ${name}`);
      assertClean(test, "row3 busy", baseline);
    }

    // Row 3: a dimension the world does not have is refused with a message.
    {
      const { rodId, binding } = await bindTo(test, p, 0, "andrew:nowhere", plate);
      const t = await trip(test, p, 0, rodId, bars);
      log(`row3 dimension RESULT ${tripText(t)}`);
      assertKept(test, "row3 dimension", t, "dimension-refused", binding);
      assertClean(test, "row3 dimension", baseline);
    }

    // pr03 keep row: the rod leaves the inventory while the Nether destination loads.
    {
      const far = { x: origin.x + 30_000, y: 70, z: origin.z };
      const { rodId, binding } = await bindTo(test, p, 0, nether.id, far);
      const inv = inventoryOf(p);
      const t0 = await boundUse(test, p, 0);
      const saved = inv.getItem(0);
      inv.setItem(0, undefined);
      const o = await outcomeOf(test, p, t0);
      const line = `rod_left RESULT outcome=${o.outcome} after ${o.tick - t0} ticks dim=${short(p.dimension.id)} kept_on_rod=${sameBinding(bindingOf(saved), binding)} bars=[${bars.since(t0).join(",")}]`;
      log(line);
      test.assert(o.outcome === "rod-left" && p.dimension.id === dim.id && sameBinding(bindingOf(saved), binding), line);
      test.assert(bars.since(t0).join(",") === "rod_left", line);
      inv.setItem(0, saved);
      void rodId;
      assertClean(test, "rod_left", baseline);
    }

    // Row 7: a stranger holding the owner's bound rod casts it; the binding is left as it was.
    {
      const { binding } = await bindTo(test, p, 0, dim.id, plate);
      const copy = inventoryOf(p).getItem(0);
      test.assert(copy !== undefined, "no rod to hand over");
      if (copy === undefined) return;
      stranger.setItem(copy, 0, true);
      await test.idle(2);
      stranger.lookAtLocation({ x: 5.5, y: 2, z: 2.5 }, LookDuration.Instant);
      await test.idle(2);
      const from = { ...stranger.location };
      const uses0 = teleportStats.uses;
      const hook = await castHook(test, stranger, 0, hooks);
      await test.idle(2);
      if (hook.isValid) hook.remove();
      const held = bindingOf(inventoryOf(stranger).getItem(0));
      const line = `row7 stranger RESULT hook=1 bound_uses=${teleportStats.uses - uses0} moved=${f2(dist(stranger.location, from))} binding=${bindingText(held)} owner_is_p=${held?.owner === p.id}`;
      log(line);
      test.assert(teleportStats.uses === uses0 && dist(stranger.location, from) < 0.01 && sameBinding(held, binding), line);
      assertClean(test, "row7 stranger", baseline);
    }

    // Row 8: a riding owner is taken off the minecart and moved.
    {
      const cart = test.spawn("minecraft:minecart", { x: 1, y: 2, z: 1 });
      await test.idle(2);
      const mounted = cart.getComponent("minecraft:rideable")?.addRider(p) ?? false;
      await test.idle(2);
      const ridingBefore = p.getComponent("minecraft:riding")?.entityRidingOn?.typeId ?? "nothing";
      const { rodId } = await bindTo(test, p, 0, dim.id, plate);
      const t = await trip(test, p, 0, rodId, bars);
      const ridingAfter = p.getComponent("minecraft:riding")?.entityRidingOn?.typeId ?? "nothing";
      log(`row8 riding RESULT add_rider=${mounted} riding_before=${short(ridingBefore)} riding_after=${short(ridingAfter)} cart_valid=${cart.isValid}; ${tripText(t)}`);
      test.assert(mounted && ridingBefore === "minecraft:minecart", `row8: the player never sat in the minecart (${ridingBefore})`);
      assertArrived(test, "row8 riding", t, plate, dim.id);
      test.assert(ridingAfter === "nothing", `row8: still riding ${ridingAfter}`);
      if (cart.isValid) cart.remove();
      assertClean(test, "row8 riding", baseline);
      await home(test, p);
    }

    // Row 6: the owner dies while the trip waits. Aborted, no message, the area gone.
    {
      const never = { x: origin.x + 80_000, y: NEVER_Y, z: origin.z };
      await bindTo(test, p, 0, dim.id, never);
      const t0 = await boundUse(test, p, 0);
      await test.idle(3);
      const waiting = pendingTrips();
      p.kill();
      const o = await outcomeOf(test, p, t0, 40);
      const line = `row6 died RESULT pending_before_kill=${waiting} outcome=${o.outcome} after ${o.tick - t0} ticks bars=[${bars.since(t0).join(",")}]`;
      log(line);
      test.assert(waiting === 1 && o.outcome === "died" && o.tick - t0 < 20, line);
      test.assert(bars.since(t0).length === 0, `row6: a message was sent: ${line}`);
      assertClean(test, "row6 died", baseline);
      p.respawn();
      await test.idle(5);
    }
  } finally {
    for (const name of fillers) dim.runCommand(`tickingarea remove ${name}`);
    hooks.close();
    bars.close();
    setRel(test, PLATE_REL, "minecraft:air");
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");

// ------------------------------------------------------------- AC5: the rod's slot holds while structure searches run

registerAsync("andrew", "pear_tp_pool_reserve", async (test: Test): Promise<void> => {
  const a = await survivor(test, HOME, "ptp_pool_a");
  const b = await survivor(test, { x: 5, y: 2, z: 0 }, "ptp_pool_b");
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const baseline = freeEngineSlots(test);
  const bars = new Bars();
  const removers: Array<() => void> = [];
  const pendingLoads: Array<Promise<unknown>> = [];
  const box = (i: number): [[number, number], [number, number]] => {
    const x = origin.x + 300_000 + i * 48;
    return [
      [x, origin.z],
      [x + 15, origin.z + 15],
    ];
  };
  /** Starts `n` loads on a loader; each resolved remover is kept, and counted. */
  const start = (load: (min: [number, number], max: [number, number]) => Promise<(() => void) | undefined>, from: number, n: number): { done: number; loaded: number } => {
    const state = { done: 0, loaded: 0 };
    for (let i = from; i < from + n; i++) {
      const [min, max] = box(i);
      pendingLoads.push(
        load(min, max).then((r) => {
          state.done++;
          if (r !== undefined) {
            state.loaded++;
            removers.push(r);
          }
        })
      );
    }
    return state;
  };
  const releaseAll = async (): Promise<void> => {
    for (let t = 0; t < 400 && pendingLoads.length > 0; t++) {
      for (const r of removers.splice(0)) r();
      const settled = await Promise.race([Promise.all(pendingLoads).then(() => true), new Promise<boolean>((r) => system.runTimeout(() => r(false), 1))]);
      if (settled) pendingLoads.splice(0);
    }
    for (const r of removers.splice(0)) r();
  };
  try {
    const site = await farPad(test, dim, origin.x + 200_000, origin.z + 7, FAR_Y);
    log(`pool baseline RESULT the GameTest world accepts ${baseline} command areas`);

    // Control: the same search with no budget takes every slot the engine has, and the rod is refused by the engine.
    {
      const raw = engineRingLoader(dim, system, "andrew_gt_peartp_raw", 12);
      const s = start((min, max) => raw.load(min, max), 0, 12);
      for (let t = 0; t < 200 && s.loaded < baseline; t++) await test.idle(1);
      const { rodId, binding } = await bindTo(test, a, 0, dim.id, site.at);
      const t = await trip(test, a, 0, rodId, bars);
      log(`pool control_no_budget RESULT search loaded ${s.loaded} of 12 (engine cap ${baseline}); rod ${tripText(t)}`);
      test.assert(s.loaded === baseline, `control: the unbudgeted search holds ${s.loaded}, not every slot (${baseline})`);
      assertKept(test, "control: the search starves the rod", t, "busy", binding);
      await releaseAll();
      assertClean(test, "pool control", baseline);
    }

    // The world budget: a ring search and a find search asking for 11 areas get 8 between them; the rod gets the 9th.
    const ring = engineRingLoader(dim, system, "andrew_gt_peartp_ring", 6, gtAreas);
    const find = engineSpawnHost(dim, system, { BlockVolume, BlockTypes }, () => ({ x: origin.x, z: origin.z }), undefined, { prefix: "andrew_gt_peartp_find_", pool: 5, budget: gtAreas });
    const sRing = start((min, max) => ring.load(min, max), 20, 6);
    const sFind = start((min, max) => find.load(min, max), 30, 5);
    const cap = GAMETEST_AREA_CAP - 1;
    for (let t = 0; t < 200 && sRing.loaded + sFind.loaded < cap; t++) await test.idle(1);
    await test.idle(12);
    const searchLine = `ring ${sRing.loaded}/6 find ${sFind.loaded}/5 budget_structure=${gtAreas.held("structure")} refused_so_far=${gtAreas.refused.structure}`;
    const freeDuringSearch = freeEngineSlots(test);
    log(`pool searches RESULT ${searchLine} engine_free_during_search=${freeDuringSearch}`);
    test.assert(sRing.loaded + sFind.loaded === cap && gtAreas.held("structure") === cap, `the searches hold ${sRing.loaded + sFind.loaded}, not ${cap}: ${searchLine}`);
    test.assert(gtAreas.refused.structure > 0 && sRing.done + sFind.done < 11, `no search request is waiting: ${searchLine}`);
    test.assert(freeDuringSearch === 1, `${freeDuringSearch} engine slots free while the searches run, not the 1 reserved`);

    // A's trip takes the reserved slot while the searches hold theirs.
    {
      const { rodId } = await bindTo(test, a, 0, dim.id, site.at);
      let pearlHeld = 0;
      let structureMin = cap;
      const watch = system.runInterval(() => {
        pearlHeld = Math.max(pearlHeld, gtAreas.held("pearl"));
        structureMin = Math.min(structureMin, gtAreas.held("structure"));
      }, 1);
      const t = await trip(test, a, 0, rodId, bars);
      system.clearRun(watch);
      log(`pool trip_during_search RESULT pearl_slots_seen=${pearlHeld} structure_slots_min=${structureMin}; ${tripText(t)}`);
      assertArrived(test, "trip during the search", t, site.at, dim.id);
      test.assert(pearlHeld === 1 && structureMin === cap, `the trip did not run on the reserve: pearl ${pearlHeld}, structures ${structureMin}`);
      await home(test, a);
    }

    // With the reserve held by A's second trip (a destination that never loads), B finds the world full: busy, kept.
    {
      await bindTo(test, a, 1, dim.id, { x: origin.x + 90_000, y: NEVER_Y, z: origin.z });
      const tA = await boundUse(test, a, 1);
      await test.idle(2);
      const { rodId, binding } = await bindTo(test, b, 0, dim.id, site.at);
      const t = await trip(test, b, 0, rodId, bars);
      log(`pool second_trip RESULT A pending=${pendingTrips()} pearl=${gtAreas.held("pearl")} structure=${gtAreas.held("structure")}; B ${tripText(t)}`);
      assertKept(test, "B while A holds the reserve", t, "busy", binding);
      test.assert(t.detail.includes("budget is full"), `B was refused by the engine, not the budget: ${t.detail}`);
      const oA = await outcomeOf(test, a, tA);
      log(`pool second_trip A RESULT ${oA.outcome} after ${oA.tick - tA} ticks`);
      test.assert(oA.outcome === "not-loaded", `A's second trip: ${oA.outcome}`);
      const t2 = await trip(test, b, 0, rodId, bars);
      log(`pool second_trip B_again RESULT ${tripText(t2)}`);
      assertArrived(test, "B once the reserve is free", t2, site.at, dim.id);
      await home(test, b, { x: 5, y: 2, z: 0 });
    }
    test.assert(gtAreas.held("structure") === cap, `the searches lost slots meanwhile: ${gtAreas.held("structure")}`);
    await releaseAll();
    log(`pool searches_after RESULT ring ${sRing.loaded}/6 find ${sFind.loaded}/5 done ${sRing.done + sFind.done}/11 budget_structure=${gtAreas.held("structure")}`);
    assertClean(test, "pool", baseline);
  } finally {
    bars.close();
    await releaseAll();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(4000)
  .tag("andrew");

// ------------------------------------------------------------- AC7: across dimensions

registerAsync("andrew", "pear_tp_cross_dimension", async (test: Test): Promise<void> => {
  const p = await survivor(test, HOME, "ptp_dims");
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const baseline = freeEngineSlots(test);
  const bars = new Bars();
  const legs = [
    { dim: world.getDimension("nether"), dx: 20_000, y: 70 },
    { dim: world.getDimension("the_end"), dx: 20_000, y: 70 },
    { dim: test.getDimension(), dx: 120_000, y: FAR_Y },
  ];
  try {
    const sites: Vector3[] = [];
    for (const leg of legs) sites.push((await farPad(test, leg.dim, origin.x + leg.dx, origin.z + 7, leg.y)).at);
    for (const [i, leg] of legs.entries()) {
      const { rodId } = await bindTo(test, p, 0, leg.dim.id, sites[i]);
      const t = await trip(test, p, 0, rodId, bars);
      log(`dims ${short(t.fromDim)}->${short(leg.dim.id)} RESULT ${tripText(t)}`);
      test.assert(t.fromDim !== leg.dim.id, `leg ${i}: started in ${t.fromDim}, not another dimension`);
      assertArrived(test, `${short(t.fromDim)} -> ${short(leg.dim.id)}`, t, sites[i], leg.dim.id);
      assertClean(test, `dims ${short(leg.dim.id)}`, baseline);
    }
  } finally {
    bars.close();
    await home(test, p);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");
