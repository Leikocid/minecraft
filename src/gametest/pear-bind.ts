// PEAR-BIND-01 on BDS 1.26.51.1 (spec v3 §7, unbound state; L0-xasm41, L0-pear-pr02): a Pearl Rod's hook binds the
// rod to every vanilla plate type it comes to rest in, records the plate's own cell and is removed; a hook resting
// next to plates, one flying over plates and one stuck in a mob on a plate do not bind; one binding per rod. The
// "[pear-bind] … RESULT" lines are quoted in src/pearl/README.md.

import {
  BlockTypes,
  BlockVolume,
  type Container,
  type Entity,
  type EntitySpawnAfterEvent,
  GameMode,
  type ItemStack,
  type Player,
  type ProjectileHitBlockAfterEvent,
  type ProjectileHitEntityAfterEvent,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { bindStats, bindingOf, lifeEpochOf, plateGeneration, registerPearlBind } from "../pearl/bind";
import { BIND_DY, type Binding, HOOK_ID, boundLore, hookCell, hookVerdict, isPlateType } from "../pearl/bind-rules";
import { makePearlRod } from "../pearl/item";
import { MARK_KEY } from "../pearl/item-rules";

// The release pack arms the same module and cannot read a SimulatedPlayer's hook (C-2); this copy is the one the
// scenarios drive, through the same subscriptions a human's cast goes through.
registerPearlBind();

const STRUCTURE = "andrew:platform";
const ROD_SLOT = 0;
const STONE_PLATE = "minecraft:stone_pressure_plate";

/** The caster stands on the platform edge; the field is the rest of the 7×7 floor in front of it (relative y=1 is the floor). */
const CAST_FROM: Vector3 = { x: 3, y: 2, z: 0 };
const FIELD_MIN: Vector3 = { x: 0, y: 2, z: 1 };
const FIELD_MAX: Vector3 = { x: 6, y: 2, z: 6 };
/** A hook falls below the line of sight, so aiming at a floor point lands it short of that point, inside the field. */
const AIM: Vector3 = { x: 3.5, y: 2, z: 5.5 };
/** A long, shallow cast over a floor laid past the platform: two samples inside plate height before it lands (probe Q2). */
const LONG_FLOOR_MIN: Vector3 = { x: 0, y: 1, z: 7 };
const LONG_FLOOR_MAX: Vector3 = { x: 6, y: 1, z: 16 };
const LONG_FIELD_MAX: Vector3 = { x: 6, y: 2, z: 16 };
const LONG_AIM: Vector3 = { x: 3.5, y: 2, z: 15.5 };

/** A use a SimulatedPlayer drops shows as no new hook this many ticks later (it accepts one about every 11 ticks). */
const USE_EVIDENCE_TICKS = 6;
const USE_TRIES = 10;
/** How long a resting hook is watched for a binding that must not come. */
const NO_BIND_WATCH_TICKS = 30;

const log = (msg: string): void => console.warn(`[pear-bind] ${msg}`);
const short = (id: string): string => id.replace("minecraft:", "");
const f2 = (n: number): string => n.toFixed(2);
const v3 = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const same = (a: Vector3, b: Vector3): boolean => a.x === b.x && a.y === b.y && a.z === b.z;

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

function plateTypes(): string[] {
  return BlockTypes.getAll()
    .map((t) => t.id)
    .filter(isPlateType)
    .sort();
}

function fill(test: Test, min: Vector3, max: Vector3, typeId: string): void {
  test.getDimension().fillBlocks(new BlockVolume(test.worldBlockLocation(min), test.worldBlockLocation(max)), typeId);
}

function typeAtWorld(test: Test, at: Vector3): string {
  try {
    return test.getDimension().getBlock(at)?.typeId ?? "unloaded";
  } catch {
    return "out-of-range";
  }
}

const rel = (test: Test, at: Vector3): string => v3(test.relativeBlockLocation(at));

/** The rod with mark `rodId` wherever it is in `p`'s inventory. */
function rodOf(p: Player, rodId: string): ItemStack | undefined {
  const inv = inventoryOf(p);
  for (let slot = 0; slot < inv.size; slot++) {
    const s = inv.getItem(slot);
    if (s?.typeId === "minecraft:fishing_rod" && s.getDynamicProperty(MARK_KEY) === rodId) return s;
  }
  return undefined;
}

const bindingText = (test: Test, b: Binding | undefined): string =>
  b === undefined ? "none" : `${short(b.type)}@rel${rel(test, b.pos)} dim=${short(b.dim)} owner=${b.owner} epoch=${b.epoch} gen=${b.gen}`;

/** Hooks by caster name, from entitySpawn (the owner is readable at +0, probe Q3), and the support blocks they hit. */
class Hooks {
  readonly byOwner = new Map<string, Entity[]>();
  readonly hitBlock = new Map<string, { at: Vector3; type: string; tick: number }>();
  /** The first entity a hook hit, by hook id; the engine repeats the event on every tick the hook stays stuck. */
  readonly hitEntity = new Map<string, { what: string; tick: number; events: number }>();
  readonly removedAt = new Map<string, number>();
  readonly spawnedAt = new Map<string, number>();
  /** First tick a rod (by id) arrived in an inventory carrying a binding: the module's setItem. */
  readonly rodWriteAt = new Map<string, number>();
  private readonly undo: Array<() => void> = [];

  constructor() {
    const a = world.afterEvents;
    const spawn = a.entitySpawn.subscribe((ev: EntitySpawnAfterEvent) => {
      if (ev.entity.typeId !== HOOK_ID) return;
      const owner = ev.entity.getComponent("minecraft:projectile")?.owner;
      const name = owner?.isValid === true && owner.typeId === "minecraft:player" ? (owner as Player).name : "?";
      const list = this.byOwner.get(name) ?? [];
      list.push(ev.entity);
      this.byOwner.set(name, list);
      this.spawnedAt.set(ev.entity.id, system.currentTick);
    });
    this.undo.push(() => a.entitySpawn.unsubscribe(spawn));
    const inv = a.playerInventoryItemChange.subscribe((ev) => {
      const s = ev.itemStack;
      if (s?.typeId !== "minecraft:fishing_rod" || bindingOf(s) === undefined) return;
      const rodId = String(s.getDynamicProperty(MARK_KEY));
      if (!this.rodWriteAt.has(rodId)) this.rodWriteAt.set(rodId, system.currentTick);
    });
    this.undo.push(() => a.playerInventoryItemChange.unsubscribe(inv));
    const hb = a.projectileHitBlock.subscribe((ev: ProjectileHitBlockAfterEvent) => {
      if (ev.projectile.typeId !== HOOK_ID) return;
      const block = ev.getBlockHit().block;
      this.hitBlock.set(ev.projectile.id, { at: block.location, type: block.typeId, tick: system.currentTick });
    });
    this.undo.push(() => a.projectileHitBlock.unsubscribe(hb));
    const he = a.projectileHitEntity.subscribe((ev: ProjectileHitEntityAfterEvent) => {
      if (ev.projectile.typeId !== HOOK_ID) return;
      const seen = this.hitEntity.get(ev.projectile.id);
      if (seen !== undefined) seen.events++;
      else this.hitEntity.set(ev.projectile.id, { what: ev.getEntityHit().entity?.typeId ?? "?", tick: system.currentTick, events: 1 });
    });
    this.undo.push(() => a.projectileHitEntity.unsubscribe(he));
    const rm = a.entityRemove.subscribe((ev) => {
      if (ev.typeId === HOOK_ID) this.removedAt.set(ev.removedEntityId, system.currentTick);
    });
    this.undo.push(() => a.entityRemove.unsubscribe(rm));
  }

  count(p: Player): number {
    return this.byOwner.get(p.name)?.length ?? 0;
  }

  last(p: Player): Entity | undefined {
    const list = this.byOwner.get(p.name);
    return list?.[list.length - 1];
  }

  close(): void {
    for (const u of this.undo) u();
  }
}

/** A fresh Pearl Rod in `slot`, selected, then the aim (setItem with selectSlot turns a SimulatedPlayer's head back). */
async function arm(test: Test, p: SimulatedPlayer, slot: number, aim: Vector3, rod: ItemStack = makePearlRod()): Promise<string> {
  const rodId = String(rod.getDynamicProperty(MARK_KEY));
  p.setItem(rod, slot, true);
  await test.idle(2);
  p.lookAtLocation(aim, LookDuration.Instant);
  await test.idle(2);
  return rodId;
}

/** One cast, retried until a new hook shows it happened. */
async function castHook(test: Test, p: SimulatedPlayer, slot: number, hooks: Hooks): Promise<Entity> {
  for (let tries = 0; ; tries++) {
    const before = hooks.count(p);
    p.useItemInSlot(slot);
    for (let t = 0; t < USE_EVIDENCE_TICKS && hooks.count(p) === before; t++) await test.idle(1);
    const hook = hooks.last(p);
    if (hooks.count(p) > before && hook !== undefined) return hook;
    if (tries >= USE_TRIES) throw new Error(`${p.name}: no hook after ${USE_TRIES} uses`);
  }
}

interface Sample {
  t: number;
  at: Vector3;
  cell: Vector3;
  cellType: string;
  dy: number;
  speed: number;
  ground: boolean;
}

interface Follow {
  samples: Sample[];
  /** Ticks since the cast at which the hook was first seen at rest; -1 when it never was. */
  restAt: number;
  /** Ticks since the cast at which the binding was first seen; -1 when it never was. */
  boundAt: number;
  /** Ticks since the cast at which the hook was first seen invalid; -1 when it never was. */
  goneAt: number;
  /** Samples where the rod read bound while the hook was still in the world. */
  boundWithHook: number;
  binding: Binding | undefined;
  lastCell: Vector3 | undefined;
}

/**
 * Samples the hook every tick from its spawn (a GameTest continuation runs before the module's interval, so a sample
 * sees the tick's state before the check) until the rod is bound, the hook is gone, or the hook has rested
 * `afterRest` ticks. Ticks count from the hook's entitySpawn.
 */
async function follow(test: Test, hooks: Hooks, p: Player, rodId: string, hook: Entity, afterRest: number, maxTicks = 120): Promise<Follow> {
  const out: Follow = { samples: [], restAt: -1, boundAt: -1, goneAt: -1, boundWithHook: 0, binding: undefined, lastCell: undefined };
  const from = hooks.spawnedAt.get(hook.id) ?? system.currentTick;
  let last: Sample | undefined;
  for (let i = 0; i < maxTicks; i++) {
    const t = system.currentTick - from;
    const binding = bindingOf(rodOf(p, rodId));
    if (binding !== undefined && out.boundAt < 0) {
      out.boundAt = t;
      out.binding = binding;
    }
    // The module writes the rod and removes the hook in one sync block: a hook seen gone ends the follow either way.
    if (!hook.isValid) {
      out.goneAt = t;
      break;
    }
    if (binding !== undefined) out.boundWithHook++;
    const at = hook.location;
    const cell = hookCell(at);
    const v = hook.getVelocity();
    const sample: Sample = { t, at, cell, cellType: typeAtWorld(test, cell), dy: at.y - cell.y, speed: Math.hypot(v.x, v.y, v.z), ground: hook.isOnGround };
    out.samples.push(sample);
    out.lastCell = cell;
    // At rest from the first tick the hook stays where it was the tick before.
    if (last !== undefined && out.restAt < 0 && Math.hypot(at.x - last.at.x, at.y - last.at.y, at.z - last.at.z) < 1e-4) out.restAt = last.t;
    last = sample;
    if (out.restAt >= 0 && t - out.restAt >= afterRest && out.boundAt < 0) break;
    await test.idle(1);
  }
  return out;
}

const pathText = (test: Test, f: Follow): string =>
  f.samples
    .slice(0, 12)
    .map((s) => `${s.t}:${f2(test.relativeLocation(s.at).y)}${isPlateType(s.cellType) ? "p" : ""}`)
    .join(" ");

/** In-flight samples inside a plate cell above the threshold: the hook was over a plate, higher than a hit. */
const overPlates = (f: Follow): Sample[] => f.samples.filter((s) => isPlateType(s.cellType) && s.dy > BIND_DY);

function hooksOwnedBy(test: Test, p: Player): number {
  return test
    .getDimension()
    .getEntities({ type: HOOK_ID })
    .filter((h) => {
      const o = h.getComponent("minecraft:projectile")?.owner;
      return o?.isValid === true && o.id === p.id;
    }).length;
}

// ------------------------------------------------------------- every plate type (AC1, AC3, AC4)

registerAsync("andrew", "pear_bind_every_plate", async (test: Test): Promise<void> => {
  const p = await survivor(test, CAST_FROM, "pb_plates");
  const dim = test.getDimension();
  const types = plateTypes();
  log(`plates from BlockTypes.getAll(): n=${types.length} [${types.map(short).join(",")}]`);
  test.assert(types.length >= 17, `only ${types.length} plate types on this engine; the probe measured 17`);
  const hooks = new Hooks();
  const failures: string[] = [];
  let bound = 0;
  try {
    // Control: the bare floor. The hook rests in an air cell over the same stone and binds nothing.
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
    const ctrlRod = await arm(test, p, ROD_SLOT, AIM);
    const ctrlHook = await castHook(test, p, ROD_SLOT, hooks);
    const ctrl = await follow(test, hooks, p, ctrlRod, ctrlHook, NO_BIND_WATCH_TICKS);
    log(
      `control bare_floor RESULT rest+${ctrl.restAt} cell=${ctrl.lastCell === undefined ? "-" : `${short(typeAtWorld(test, ctrl.lastCell))}@rel${rel(test, ctrl.lastCell)}`} ` +
        `binding=${bindingText(test, ctrl.binding)} hook_valid=${ctrlHook.isValid}`
    );
    test.assert(ctrl.restAt >= 0 && ctrl.binding === undefined, "control: the bare floor bound the rod, or the hook never rested");
    if (ctrlHook.isValid) ctrlHook.remove();
    await test.idle(2);

    for (const type of types) {
      fill(test, FIELD_MIN, FIELD_MAX, type);
      await test.idle(1);
      const binds0 = bindStats.binds;
      const rodId = await arm(test, p, ROD_SLOT, AIM);
      const hook = await castHook(test, p, ROD_SLOT, hooks);
      const hookId = hook.id;
      const f = await follow(test, hooks, p, rodId, hook, NO_BIND_WATCH_TICKS);
      await test.idle(1);
      const left1 = hooksOwnedBy(test, p);
      await test.idle(19);
      const left20 = hooksOwnedBy(test, p);
      const b = f.binding;
      const hit = hooks.hitBlock.get(hookId);
      const spawnTick = hooks.spawnedAt.get(hookId) ?? 0;
      const removedTick = hooks.removedAt.get(hookId);
      const writeTick = hooks.rodWriteAt.get(rodId);
      const rod = rodOf(p, rodId);
      const problems: string[] = [];
      if (b === undefined) problems.push("no binding");
      else {
        if (b.type !== type) problems.push(`type ${b.type}`);
        if (b.dim !== dim.id) problems.push(`dim ${b.dim}`);
        if (f.lastCell === undefined || !same(b.pos, f.lastCell)) problems.push(`pos ${v3(b.pos)} is not the hook's cell ${f.lastCell === undefined ? "-" : v3(f.lastCell)}`);
        if (test.relativeBlockLocation(b.pos).y !== FIELD_MIN.y) problems.push(`pos relative y ${test.relativeBlockLocation(b.pos).y}, plates are at ${FIELD_MIN.y}`);
        if (typeAtWorld(test, b.pos) !== type) problems.push(`block at pos is ${typeAtWorld(test, b.pos)}`);
        const below = { x: b.pos.x, y: b.pos.y - 1, z: b.pos.z };
        if (isPlateType(typeAtWorld(test, below)) || typeAtWorld(test, below) === "minecraft:air") problems.push(`under pos is ${typeAtWorld(test, below)}`);
        if (hit !== undefined && !same(b.pos, { x: hit.at.x, y: hit.at.y + 1, z: hit.at.z })) problems.push(`pos is not the cell over the support ${v3(hit.at)}`);
        if (b.owner !== p.id) problems.push(`owner ${b.owner}`);
        if (b.epoch !== lifeEpochOf(p)) problems.push(`epoch ${b.epoch}`);
        if (b.gen !== plateGeneration(dim.id, b.pos)) problems.push(`gen ${b.gen}`);
        if (rod?.getLore().join("|") !== boundLore(b).join("|")) problems.push(`lore [${rod?.getLore().join("|")}]`);
      }
      if (f.boundWithHook > 0) problems.push(`rod read bound with the hook still out on ${f.boundWithHook} sample(s)`);
      if (writeTick === undefined || removedTick === undefined || removedTick !== writeTick) {
        problems.push(`rod write event +${writeTick === undefined ? "none" : writeTick - spawnTick}, hook removal event +${removedTick === undefined ? "none" : removedTick - spawnTick}: not the same tick`);
      }
      if (hook.isValid || left1 > 0 || left20 > 0) problems.push(`hooks left: valid=${hook.isValid} +1:${left1} +20:${left20}`);
      if (bindStats.binds - binds0 !== 1) problems.push(`${bindStats.binds - binds0} binds counted`);
      if ((rod?.getComponent("minecraft:durability")?.damage ?? -1) !== 0) problems.push(`damage ${String(rod?.getComponent("minecraft:durability")?.damage)}`);
      if (problems.length === 0) bound++;
      else failures.push(`${short(type)}: ${problems.join("; ")}`);
      log(
        `plate ${short(type)} RESULT ${problems.length === 0 ? "BOUND" : "FAILED"} path=[${pathText(test, f)}] rest+${f.restAt} bound_seen+${f.boundAt} ` +
          `hook_gone_seen+${f.goneAt} rod_write_event+${writeTick === undefined ? "-" : writeTick - spawnTick} hook_removed_event+${removedTick === undefined ? "-" : removedTick - spawnTick} ` +
          `binding=${bindingText(test, b)} support_from_hit_event=${hit === undefined ? "none" : `${short(hit.type)}@rel${rel(test, hit.at)}`} ` +
          `hooks_left +1:${left1} +20:${left20} lore=[${rod?.getLore().join("|") ?? "-"}]${problems.length === 0 ? "" : ` problems: ${problems.join("; ")}`}`
      );
    }
  } finally {
    hooks.close();
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
  }
  log(`plates RESULT bound ${bound} of ${types.length} types${failures.length === 0 ? "" : `; failed: ${failures.join(" | ")}`}`);
  test.assert(failures.length === 0, `plate types that did not bind cleanly: ${failures.join(" | ")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");

// ------------------------------------------------------------- negatives: next to a plate, over plates (AC2)

/** The eight horizontal neighbours of `cell` that have a solid block under them. */
function neighboursOnFloor(test: Test, cell: Vector3): Vector3[] {
  const out: Vector3[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue;
      const at = { x: cell.x + dx, y: cell.y, z: cell.z + dz };
      const below = typeAtWorld(test, { x: at.x, y: at.y - 1, z: at.z });
      if (typeAtWorld(test, at) === "minecraft:air" && below !== "minecraft:air" && !isPlateType(below)) out.push(at);
    }
  }
  return out;
}

/** Watches a resting hook for `ticks`: how many checks it sat beside a plate, and whether the rod got bound. */
async function watchUnbound(test: Test, p: Player, rodId: string, hook: Entity, ticks: number): Promise<{ beside: number; bound: Binding | undefined; valid: boolean }> {
  let beside = 0;
  for (let t = 0; t < ticks && hook.isValid; t++) {
    const cell = hookCell(hook.location);
    const nextTo = [-1, 0, 1].some((dx) => [-1, 0, 1].some((dz) => (dx !== 0 || dz !== 0) && isPlateType(typeAtWorld(test, { x: cell.x + dx, y: cell.y, z: cell.z + dz }))));
    if (nextTo && !isPlateType(typeAtWorld(test, cell))) beside++;
    if (bindingOf(rodOf(p, rodId)) !== undefined) break;
    await test.idle(1);
  }
  return { beside, bound: bindingOf(rodOf(p, rodId)), valid: hook.isValid };
}

/** Positive control: a plate set into the resting hook's own cell binds within a few checks. */
async function plateUnderHook(test: Test, p: Player, rodId: string, hook: Entity, type: string): Promise<{ binding: Binding | undefined; ticks: number; cell: Vector3 }> {
  const cell = hookCell(hook.location);
  test.getDimension().getBlock(cell)?.setType(type);
  for (let t = 1; t <= 6; t++) {
    await test.idle(1);
    const b = bindingOf(rodOf(p, rodId));
    if (b !== undefined) return { binding: b, ticks: t, cell };
  }
  return { binding: undefined, ticks: -1, cell };
}

const FLYOVER_ATTEMPTS = 4;

registerAsync("andrew", "pear_bind_negatives", async (test: Test): Promise<void> => {
  const p = await survivor(test, CAST_FROM, "pb_negatives");
  const hooks = new Hooks();
  try {
    // 1. Next to a plate: the hook rests on the bare floor, then plates fill every neighbouring cell around it.
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
    const rodA = await arm(test, p, ROD_SLOT, AIM);
    const hookA = await castHook(test, p, ROD_SLOT, hooks);
    const restA = await follow(test, hooks, p, rodA, hookA, 2);
    test.assert(restA.restAt >= 0 && hookA.isValid && restA.binding === undefined, `adjacent: the hook did not come to rest on the bare floor (rest+${restA.restAt})`);
    const cellA = hookCell(hookA.location);
    const around = neighboursOnFloor(test, cellA);
    for (const at of around) test.getDimension().getBlock(at)?.setType(STONE_PLATE);
    const watchA = await watchUnbound(test, p, rodA, hookA, NO_BIND_WATCH_TICKS);
    log(
      `adjacent RESULT hook at rel${rel(test, cellA)} (${short(typeAtWorld(test, cellA))}) with ${around.length} plates around it ` +
        `[${around.map((a) => rel(test, a)).join(" ")}]: ${watchA.beside} checks beside plates, binding=${bindingText(test, watchA.bound)} hook_valid=${watchA.valid}`
    );
    test.assert(around.length >= 3, `adjacent: only ${around.length} neighbouring cell(s) could take a plate`);
    test.assert(watchA.bound === undefined, `adjacent: a hook next to plates bound the rod: ${bindingText(test, watchA.bound)}`);
    test.assert(watchA.valid && watchA.beside >= NO_BIND_WATCH_TICKS - 1, `adjacent: the hook sat beside plates for only ${watchA.beside} checks`);
    const ctlA = await plateUnderHook(test, p, rodA, hookA, STONE_PLATE);
    log(`adjacent control RESULT plate set into the hook's cell rel${rel(test, ctlA.cell)}: binding=${bindingText(test, ctlA.binding)} after ${ctlA.ticks} tick(s) hook_valid=${hookA.isValid}`);
    test.assert(ctlA.binding !== undefined && same(ctlA.binding.pos, ctlA.cell), "adjacent control: a plate in the hook's own cell did not bind — the detector is not running here");
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
    await test.idle(2);

    // 2. Over plates: a long cast measured on the bare floor, then plates on every cell short of where it landed. The
    // same cast flies over them inside plate height and lands past them; an attempt that lands on a plate is re-laid.
    fill(test, LONG_FLOOR_MIN, LONG_FLOOR_MAX, "minecraft:stone");
    let proven = false;
    let landZ: number | undefined;
    for (let attempt = 1; attempt <= FLYOVER_ATTEMPTS && !proven; attempt++) {
      fill(test, FIELD_MIN, LONG_FIELD_MAX, "minecraft:air");
      if (landZ === undefined) {
        const rodM = await arm(test, p, ROD_SLOT, LONG_AIM);
        const hookM = await castHook(test, p, ROD_SLOT, hooks);
        const m = await follow(test, hooks, p, rodM, hookM, 2);
        if (m.restAt < 0 || m.lastCell === undefined) {
          log(`flyover attempt ${attempt} measure: the hook never rested (gone+${m.goneAt})`);
          continue;
        }
        landZ = test.relativeBlockLocation(m.lastCell).z;
        log(`flyover attempt ${attempt} measure RESULT bare floor path=[${pathText(test, m)}] rest at rel${rel(test, m.lastCell)}`);
        if (hookM.isValid) hookM.remove();
        await test.idle(2);
      }
      if (landZ <= FIELD_MIN.z + 1) {
        log(`flyover attempt ${attempt}: the measuring cast landed at z=${landZ}, too short to lay plates before it`);
        landZ = undefined;
        continue;
      }
      fill(test, FIELD_MIN, { x: LONG_FIELD_MAX.x, y: FIELD_MIN.y, z: landZ - 1 }, STONE_PLATE);
      await test.idle(1);
      const rod = await arm(test, p, ROD_SLOT, LONG_AIM);
      const hook = await castHook(test, p, ROD_SLOT, hooks);
      const f = await follow(test, hooks, p, rod, hook, NO_BIND_WATCH_TICKS);
      const over = overPlates(f);
      const restType = f.lastCell === undefined ? "-" : typeAtWorld(test, f.lastCell);
      const verdicts = over.map((s) => hookVerdict({ location: s.at, velocity: { x: 0, y: -s.speed, z: 0 }, onGround: s.ground, inEntity: false }, s.cellType));
      log(
        `flyover attempt ${attempt} RESULT plates on z ${FIELD_MIN.z}..${landZ - 1} path=[${pathText(test, f)}] ` +
          `over_plates=[${over.map((s) => `+${s.t} rel${rel(test, s.cell)} dy=${f2(s.dy)} |v|=${f2(s.speed)}`).join(" ")}] verdicts=[${verdicts.join(",")}] ` +
          `rest+${f.restAt} in ${short(restType)}@rel${f.lastCell === undefined ? "-" : rel(test, f.lastCell)} binding=${bindingText(test, f.binding)} hook_valid=${hook.isValid}`
      );
      if (f.binding !== undefined) {
        test.assert(isPlateType(restType) || !hook.isValid, `flyover: the rod bound while the hook rests in ${restType}`);
        log(`flyover attempt ${attempt}: the hook landed on a plate this time (a real hit, bound); laying the field again from this landing`);
        landZ = f.lastCell === undefined ? undefined : test.relativeBlockLocation(f.lastCell).z;
        continue;
      }
      if (over.length === 0 || f.restAt < 0 || !hook.isValid) {
        log(`flyover attempt ${attempt}: no sample over a plate inside plate height (${over.length}) or no rest; again`);
        if (hook.isValid) hook.remove();
        landZ = undefined;
        await test.idle(2);
        continue;
      }
      proven = true;
      const ctl = await plateUnderHook(test, p, rod, hook, STONE_PLATE);
      log(`flyover control RESULT plate set into the resting hook's cell rel${rel(test, ctl.cell)}: binding=${bindingText(test, ctl.binding)} after ${ctl.ticks} tick(s)`);
      test.assert(ctl.binding !== undefined && same(ctl.binding.pos, ctl.cell), "flyover control: a plate in the hook's own cell did not bind");
    }
    log(`negatives RESULT adjacent: no binding over ${NO_BIND_WATCH_TICKS} checks; flyover proven=${proven}`);
    test.assert(proven, `flyover: no attempt out of ${FLYOVER_ATTEMPTS} flew over a plate and landed past it`);
  } finally {
    hooks.close();
    fill(test, FIELD_MIN, LONG_FIELD_MAX, "minecraft:air");
    fill(test, LONG_FLOOR_MIN, LONG_FLOOR_MAX, "minecraft:air");
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");

// ------------------------------------------------------------- a hook stuck in a mob standing on a plate

const MOB_CELL: Vector3 = { x: 3, y: 2, z: 3 };

interface Subject {
  label: string;
  spawn: (test: Test) => Entity;
  /** Aims tried in turn until a hook hits the subject; a small target needs the arc to come down on it. */
  aims: readonly Vector3[];
}

/**
 * A pig is taller than a hit: its hook rides at 0.8 of its height, 0.72 above the plate. A baby turtle is not: its hook
 * rides inside the lowest quarter, where only the hit flag tells it from a hook lying on the plate.
 */
const SUBJECTS: readonly Subject[] = [
  { label: "pig", spawn: (test) => test.spawnWithoutBehaviors("minecraft:pig", MOB_CELL), aims: [{ x: 3.5, y: 2.45, z: 3.5 }, { x: 3.5, y: 2.3, z: 3.9 }, { x: 3.5, y: 2.6, z: 3.5 }] },
  {
    label: "baby_turtle",
    spawn: (test) => {
      const e = test.spawnWithoutBehaviors("minecraft:turtle", MOB_CELL);
      e.triggerEvent("minecraft:entity_born");
      return e;
    },
    aims: [{ x: 3.5, y: 2, z: 4.6 }, { x: 3.5, y: 2, z: 5.0 }, { x: 3.5, y: 2.1, z: 4.2 }, { x: 3.5, y: 2, z: 5.4 }],
  },
];

interface MobOutcome {
  hit: boolean;
  bound: boolean;
  unguarded: number;
  line: string;
}

async function castAtSubject(test: Test, p: SimulatedPlayer, hooks: Hooks, subject: Subject): Promise<MobOutcome> {
  const mob = subject.spawn(test);
  await test.idle(4);
  const baby = mob.getComponent("minecraft:is_baby") !== undefined;
  let last: MobOutcome = { hit: false, bound: false, unguarded: 0, line: "no cast" };
  try {
    for (const [i, aim] of subject.aims.entries()) {
      const rodId = await arm(test, p, ROD_SLOT, aim);
      const entityHits0 = bindStats.entityHits;
      const hook = await castHook(test, p, ROD_SLOT, hooks);
      const f = await follow(test, hooks, p, rodId, hook, NO_BIND_WATCH_TICKS, 60);
      const hit = hooks.hitEntity.get(hook.id);
      const spawnTick = hooks.spawnedAt.get(hook.id) ?? 0;
      const stuck = hit === undefined ? [] : f.samples.filter((s) => s.t >= hit.tick - spawnTick);
      // What the module would decide on these samples without the hit flag: the case the flag exists for.
      const unguarded = stuck.filter((s) => hookVerdict({ location: s.at, velocity: { x: s.speed, y: 0, z: 0 }, onGround: s.ground, inEntity: false }, s.cellType) === "bind");
      const dys = stuck.filter((s) => isPlateType(s.cellType)).map((s) => s.dy);
      const tail = stuck.slice(-3).map((s) => `${short(s.cellType)} dy=${f2(s.dy)} |v|=${f2(s.speed)} ground=${s.ground}`).join(" ; ");
      const toMob = mob.isValid && hook.isValid ? Math.hypot(hook.location.x - mob.location.x, hook.location.z - mob.location.z) : Number.NaN;
      last = {
        hit: hit !== undefined,
        bound: f.binding !== undefined,
        unguarded: unguarded.length,
        line:
          `${subject.label} (baby=${baby}) aim ${i + 1} hit_entity=${hit === undefined ? "none" : `${short(hit.what)} first+${hit.tick - spawnTick} events=${hit.events}`} ` +
          `module_entity_hits+${bindStats.entityHits - entityHits0} path=[${pathText(test, f)}] stuck_samples=${stuck.length} ` +
          `in_plate_dy=[${dys.length === 0 ? "-" : `${f2(Math.min(...dys))}..${f2(Math.max(...dys))}`}] last=[${tail}] hook_to_mob_xz=${f2(toMob)} ` +
          `would_bind_without_flag=${unguarded.length}/${stuck.length} binding=${bindingText(test, f.binding)}`,
      };
      log(`mob ${last.line}`);
      if (hook.isValid) hook.remove();
      await test.idle(4);
      if (last.hit) break;
    }
  } finally {
    if (mob.isValid) mob.remove();
  }
  return last;
}

registerAsync("andrew", "pear_bind_hook_in_mob", async (test: Test): Promise<void> => {
  const p = await survivor(test, CAST_FROM, "pb_mob");
  const hooks = new Hooks();
  const outcomes: MobOutcome[] = [];
  try {
    fill(test, FIELD_MIN, FIELD_MAX, STONE_PLATE);
    for (const subject of SUBJECTS) {
      fill(test, FIELD_MIN, FIELD_MAX, STONE_PLATE);
      outcomes.push(await castAtSubject(test, p, hooks, subject));
    }
    // Control: the same plates with no mob bind a fresh cast.
    fill(test, FIELD_MIN, FIELD_MAX, STONE_PLATE);
    await test.idle(2);
    const rodC = await arm(test, p, ROD_SLOT, AIM);
    const hookC = await castHook(test, p, ROD_SLOT, hooks);
    const c = await follow(test, hooks, p, rodC, hookC, NO_BIND_WATCH_TICKS);
    log(`mob control RESULT no mob: binding=${bindingText(test, c.binding)} rest+${c.restAt} bound_seen+${c.boundAt}`);
    test.assert(c.binding !== undefined, "control: the same plates bound nothing without a mob");
  } finally {
    hooks.close();
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
  }
  for (const o of outcomes) log(`mob RESULT ${o.line}`);
  const [pig, turtle] = outcomes;
  for (const o of outcomes) test.assert(o.hit, `the hook never hit the mob — nothing measured (${o.line})`);
  for (const o of outcomes) test.assert(!o.bound, `a hook stuck in a mob on a plate bound the rod: ${o.line}`);
  test.assert(pig.unguarded === 0, `the pig's hook would bind on height alone: ${pig.line}`);
  test.assert(turtle.unguarded > 0, `the baby turtle's hook never sat low enough to need the hit flag: ${turtle.line}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1500)
  .tag("andrew");

// ------------------------------------------------------------- one binding per rod; two rods, two players (AC5)

const LANE_A: Vector3 = { x: 1, y: 2, z: 0 };
const LANE_B: Vector3 = { x: 5, y: 2, z: 0 };
const AIM_A_FAR: Vector3 = { x: 1.5, y: 2, z: 5.5 };
const AIM_A_NEAR: Vector3 = { x: 1.5, y: 2, z: 3.2 };
const AIM_B: Vector3 = { x: 5.5, y: 2, z: 5.5 };
const LEFT_MIN: Vector3 = { x: 0, y: 2, z: 1 };
const LEFT_MAX: Vector3 = { x: 2, y: 2, z: 6 };
const RIGHT_MIN: Vector3 = { x: 4, y: 2, z: 1 };
const RIGHT_MAX: Vector3 = { x: 6, y: 2, z: 6 };

const sameBinding = (a: Binding | undefined, b: Binding | undefined): boolean =>
  a !== undefined && b !== undefined && a.dim === b.dim && same(a.pos, b.pos) && a.type === b.type && a.owner === b.owner && a.epoch === b.epoch && a.gen === b.gen;

registerAsync("andrew", "pear_bind_overwrite_two_rods", async (test: Test): Promise<void> => {
  const a = await survivor(test, LANE_A, "pb_rods_a");
  const b = await survivor(test, LANE_B, "pb_rods_b");
  const hooks = new Hooks();
  try {
    // Two players cast at once onto different plate types: each rod gets its own plate and its own binder.
    fill(test, LEFT_MIN, LEFT_MAX, "minecraft:acacia_pressure_plate");
    fill(test, RIGHT_MIN, RIGHT_MAX, "minecraft:heavy_weighted_pressure_plate");
    const [rodA1, rodB] = await Promise.all([arm(test, a, 0, AIM_A_FAR), arm(test, b, 0, AIM_B)]);
    const [hA1, hB] = await Promise.all([castHook(test, a, 0, hooks), castHook(test, b, 0, hooks)]);
    const [fA1, fB] = await Promise.all([follow(test, hooks, a, rodA1, hA1, NO_BIND_WATCH_TICKS), follow(test, hooks, b, rodB, hB, NO_BIND_WATCH_TICKS)]);
    const a1 = fA1.binding;
    const bb = fB.binding;
    log(`rods step1 RESULT two players at once: A rod1=${bindingText(test, a1)} B rod=${bindingText(test, bb)}`);
    test.assert(a1?.type === "minecraft:acacia_pressure_plate" && a1.owner === a.id, `A's rod 1: ${bindingText(test, a1)}`);
    test.assert(bb?.type === "minecraft:heavy_weighted_pressure_plate" && bb.owner === b.id, `B's rod: ${bindingText(test, bb)}`);

    // A second rod in A's other slot binds to a different plate; the first rod keeps its binding.
    fill(test, LEFT_MIN, LEFT_MAX, "minecraft:cherry_pressure_plate");
    const rodA2 = await arm(test, a, 1, AIM_A_FAR);
    const hA2 = await castHook(test, a, 1, hooks);
    const fA2 = await follow(test, hooks, a, rodA2, hA2, NO_BIND_WATCH_TICKS);
    const a2 = fA2.binding;
    const a1After2 = bindingOf(rodOf(a, rodA1));
    log(`rods step2 RESULT A rod2 (slot 1)=${bindingText(test, a2)} A rod1 now=${bindingText(test, a1After2)} B rod now=${bindingText(test, bindingOf(rodOf(b, rodB)))}`);
    test.assert(a2?.type === "minecraft:cherry_pressure_plate", `A's rod 2: ${bindingText(test, a2)}`);
    test.assert(sameBinding(a1After2, a1), `A's rod 1 changed when rod 2 bound: ${bindingText(test, a1After2)}`);
    test.assert(sameBinding(bindingOf(rodOf(b, rodB)), bb), "B's rod changed when A's rod 2 bound");

    // The first rod again, at a nearer cell and a third type: its binding is overwritten, the others stay.
    fill(test, LEFT_MIN, LEFT_MAX, "minecraft:mangrove_pressure_plate");
    const stack1 = rodOf(a, rodA1);
    test.assert(stack1 !== undefined, "A's rod 1 is gone from the inventory");
    if (stack1 === undefined) return;
    await arm(test, a, 0, AIM_A_NEAR, stack1);
    const hA3 = await castHook(test, a, 0, hooks);
    const fA3 = await follow(test, hooks, a, rodA1, hA3, NO_BIND_WATCH_TICKS);
    const a3 = bindingOf(rodOf(a, rodA1));
    const lore3 = rodOf(a, rodA1)?.getLore().join("|");
    log(
      `rods step3 RESULT A rod1 re-bound=${bindingText(test, a3)} (was ${bindingText(test, a1)}) lore=[${lore3}] hook_cell=rel${fA3.lastCell === undefined ? "-" : rel(test, fA3.lastCell)} ` +
        `A rod2 now=${bindingText(test, bindingOf(rodOf(a, rodA2)))} B rod now=${bindingText(test, bindingOf(rodOf(b, rodB)))}`
    );
    test.assert(a3?.type === "minecraft:mangrove_pressure_plate", `A's rod 1 was not overwritten: ${bindingText(test, a3)}`);
    test.assert(a3 !== undefined && fA3.lastCell !== undefined && same(a3.pos, fA3.lastCell), "the overwrite did not record the new hook's cell");
    test.assert(a3 !== undefined && a1 !== undefined && !same(a3.pos, a1.pos), `the overwrite landed in the same cell ${a1 === undefined ? "-" : rel(test, a1.pos)}: aim the near cast shorter`);
    test.assert(a3 !== undefined && lore3 === boundLore(a3).join("|"), `the lore still reads the old binding: [${lore3}]`);
    test.assert(sameBinding(bindingOf(rodOf(a, rodA2)), a2), "A's rod 2 changed when rod 1 was re-bound");
    test.assert(sameBinding(bindingOf(rodOf(b, rodB)), bb), "B's rod changed when A's rod 1 was re-bound");
  } finally {
    hooks.close();
    fill(test, FIELD_MIN, FIELD_MAX, "minecraft:air");
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1500)
  .tag("andrew");
