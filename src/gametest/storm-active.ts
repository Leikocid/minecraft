// STRM-ACTIVE-01 scenarios: the Storm Blade active on a real engine (spec §02; L0-strm-pact, L0-strm-rcd,
// L0-strm-rvis, L0-strm-act, L0-strm-acv, L0-adr-sblt, L0-adr-sbkb). src/gametest/main.ts arms its own copy of
// src/storm/active.ts: the release pack cannot read a SimulatedPlayer. Every scenario builds its arena east of the 7×7
// platform and puts back each cell it saved; `gametest clearall` resets only the platform. Each check that could pass
// vacuously has its negative control in the same scenario: the naive rays that would hit through the wall or stop at
// grass, a real vanilla bolt for the harm check, and a live hand reading for the press that belongs to the Katana.
// Every scenario logs "[gametest] storm-active <tag> …" rows and fails on the first check that does not hold, after
// printing all of them.

import {
  type Block,
  BlockPermutation,
  Difficulty,
  type Entity,
  EntityComponentTypes,
  EntityDamageCause,
  type EntityHurtAfterEvent,
  type EntityHurtBeforeEvent,
  EquipmentSlot,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { type Activation as KatanaActivation, observeActivations as observeKatana } from "../katana";
import { TRACE_FLAGS } from "../katana/plan";
import { clearCooldown, startCooldown } from "../legendary/cooldown";
import { resolveActivation } from "../legendary/hands";
import { DRAGON_KATANA, STORM_BLADE, cooldownKey, genLedgerKey } from "../legendary/registry";
import { bumpGen, makeMark, markItem } from "../legendary/state";
import { type StormActivation, activate, observeReleases } from "../storm/active";
import { ACTIVE_DAMAGE } from "../storm/damage";
import { ACTIVE_RANGE } from "../storm/trace";
import { ACTIVE_STRIKE_DELAYS, visualStats } from "../storm/visuals";

const STRUCTURE = "andrew:platform";
const PREFIX = "stra_";
const SLOT = 0;
/** The wielder's feet cell on the platform floor; it faces +x down the runway. */
const START: Vector3 = { x: 2, y: 2, z: 3 };
const FLOOR_Y = 1;
const SB_CD = cooldownKey(STORM_BLADE.abilityKey);
const DK_CD = cooldownKey(DRAGON_KATANA.abilityKey);
/** The cooldown left right after a release, read in its tick. */
const COOLDOWN_LEFT_MS: readonly [number, number] = [29_500, 30_000];
/** Ticks after a release by which every strike has played and every knock has settled. */
const SETTLE = 20;
const TOL = 0.01;
const LIGHTNING = "minecraft:lightning_bolt";
const FIRE_IDS = new Set(["minecraft:fire", "minecraft:soul_fire"]);

const log = (msg: string): void => console.warn(`[gametest] storm-active ${msg}`);
const f2 = (n: number | undefined): string => (n === undefined ? "-" : Number.isFinite(n) ? n.toFixed(2) : String(n));
const f3 = (v: Vector3): string => `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
const cellKey = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const sub = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const len = (v: Vector3): number => Math.hypot(v.x, v.y, v.z);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

// ---------------------------------------------------------------- witnesses

interface Hurt {
  tick: number;
  damage: number;
  cause: string;
  by: string;
}

const hurts = new Map<string, Hurt[]>();
const deaths = new Map<string, string[]>();

world.afterEvents.entityHurt.subscribe((e: EntityHurtAfterEvent) => {
  let id: string;
  try {
    id = e.hurtEntity.id;
  } catch {
    return;
  }
  const list = hurts.get(id);
  if (list === undefined) return;
  let by = "none";
  try {
    by = e.damageSource.damagingEntity?.id ?? "none";
  } catch {
    by = "?";
  }
  list.push({ tick: system.currentTick, damage: e.damage, cause: e.damageSource.cause, by });
});

world.afterEvents.entityDie.subscribe((e) => {
  let id: string;
  try {
    id = e.deadEntity.id;
  } catch {
    return;
  }
  deaths.get(id)?.push(`${e.damageSource.cause}/${e.damageSource.damagingEntity?.id ?? "none"}`);
});

function watch(e: Entity): void {
  hurts.set(e.id, []);
  deaths.set(e.id, []);
}

const hurtsSince = (e: Entity | string, from: number): Hurt[] => (hurts.get(typeof e === "string" ? e : e.id) ?? []).filter((h) => h.tick >= from);
const hurtText = (list: Hurt[]): string => `[${list.map((h) => `${f2(h.damage)}/${h.cause}/${h.by}`).join(" ")}]`;

type Input = "itemUse" | "itemStartUseOn";
const inputs = new Map<string, { kind: Input; tick: number }[]>();

function witness(player: Player | undefined, kind: Input): void {
  if (player === undefined || !player.isValid || !player.name.startsWith(PREFIX)) return;
  const list = inputs.get(player.id) ?? [];
  list.push({ kind, tick: system.currentTick });
  inputs.set(player.id, list);
}

world.afterEvents.itemUse.subscribe((e) => witness(e.source, "itemUse"));
world.afterEvents.itemStartUseOn.subscribe((e) => witness(e.source, "itemStartUseOn"));

interface Seen {
  activation: StormActivation;
  tick: number;
  cooldownLeft: number | undefined;
}

const releases: Seen[] = [];
observeReleases((activation) => {
  if (!activation.player.name.startsWith(PREFIX)) return;
  const raw = activation.player.getDynamicProperty(SB_CD);
  releases.push({ activation, tick: system.currentTick, cooldownLeft: typeof raw === "number" ? raw - Date.now() : undefined });
});
const releasesBy = (p: Player): Seen[] => releases.filter((s) => s.activation.player.id === p.id);

const jumps: KatanaActivation[] = [];
observeKatana((a) => {
  if (a.player.name.startsWith(PREFIX)) jumps.push(a);
});
const jumpsBy = (p: Player): KatanaActivation[] => jumps.filter((a) => a.player.id === p.id);

// ---------------------------------------------------------------- presses and aim

/** A Use with the selected slot, repeated until its itemUse is seen (SimulatedPlayer swallows every second use). */
async function press(test: Test, player: SimulatedPlayer): Promise<number> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const from = (inputs.get(player.id) ?? []).length;
    player.useItemInSlot(player.selectedSlotIndex);
    for (let t = 0; t < 4; t++) {
      await test.idle(1);
      const hit = (inputs.get(player.id) ?? []).slice(from).find((e) => e.kind === "itemUse");
      if (hit !== undefined) return hit.tick;
    }
    await test.idle(1);
  }
  throw new Error(`${player.name}: no itemUse after 3 presses`);
}

/** Turns `player` so its view ray from getHeadLocation() passes through test-relative `at` (lookAt aims from 1.62, the head is 1.52). */
async function aim(test: Test, player: SimulatedPlayer, at: Vector3): Promise<void> {
  player.lookAtLocation(at);
  await test.idle(4);
  const head = test.relativeLocation(player.getHeadLocation());
  const view = player.getViewDirection();
  const flat = Math.hypot(view.x, view.z);
  if (flat < 1e-6) return;
  const lookEye = at.y - (view.y / flat) * Math.hypot(at.x - head.x, at.z - head.z);
  const lift = lookEye - head.y;
  if (Math.abs(lift) < 1e-4) return;
  player.lookAtLocation({ x: at.x, y: at.y + lift, z: at.z });
  await test.idle(4);
}

/** A level aim along yaw `deg` (from +x toward +z), 30 blocks out. */
async function aimLevel(test: Test, player: SimulatedPlayer, deg: number): Promise<void> {
  const head = test.relativeLocation(player.getHeadLocation());
  const r = (deg * Math.PI) / 180;
  await aim(test, player, { x: head.x + 30 * Math.cos(r), y: head.y, z: head.z + 30 * Math.sin(r) });
}

/** The test-relative point `d` blocks out from the wielder's head along yaw `deg`, level. */
function outAlong(test: Test, player: Player, deg: number, d: number): Vector3 {
  const head = test.relativeLocation(player.getHeadLocation());
  const r = (deg * Math.PI) / 180;
  return { x: head.x + d * Math.cos(r), y: head.y, z: head.z + d * Math.sin(r) };
}

// ---------------------------------------------------------------- arena

type States = Record<string, string | number | boolean>;

class Arena {
  private readonly saved = new Map<string, { at: Vector3; permutation: BlockPermutation }>();

  constructor(private readonly test: Test) {}

  private blockAt(rel: Vector3): Block {
    const at = this.test.worldBlockLocation(rel);
    const block = this.test.getDimension().getBlock(at);
    if (block === undefined) throw new Error(`arena cell ${cellKey(rel)} is not loaded`);
    return block;
  }

  set(rel: Vector3, id: string, states?: States): void {
    const block = this.blockAt(rel);
    const k = cellKey(block.location);
    if (!this.saved.has(k)) this.saved.set(k, { at: block.location, permutation: block.permutation });
    if (!block.permutation.matches(id, states)) block.setPermutation(BlockPermutation.resolve(id, states));
  }

  fill(from: Vector3, to: Vector3, id: string, states?: States): void {
    for (let x = from.x; x <= to.x; x++) for (let y = from.y; y <= to.y; y++) for (let z = from.z; z <= to.z; z++) this.set({ x, y, z }, id, states);
  }

  restore(): string[] {
    const failures: string[] = [];
    const dim = this.test.getDimension();
    for (const { at, permutation } of this.saved.values()) {
      try {
        dim.getBlock(at)?.setPermutation(permutation);
      } catch (err) {
        failures.push(`${cellKey(at)}: ${errText(err)}`);
      }
    }
    return failures;
  }
}

/** A stone floor at y=1 and clear air above it over x 0..`toX`, z `z0`..`z1`. */
function runway(arena: Arena, toX: number, z0 = 0, z1 = 6, height = 7): void {
  arena.fill({ x: 0, y: FLOOR_Y, z: z0 }, { x: toX, y: FLOOR_Y, z: z1 }, "minecraft:stone");
  arena.fill({ x: 0, y: FLOOR_Y + 1, z: z0 }, { x: toX, y: FLOOR_Y + height, z: z1 }, "minecraft:air");
}

function snapshot(test: Test, from: Vector3, to: Vector3): Map<string, string> {
  const out = new Map<string, string>();
  const dim = test.getDimension();
  for (let x = from.x; x <= to.x; x++)
    for (let y = from.y; y <= to.y; y++)
      for (let z = from.z; z <= to.z; z++) {
        const block = dim.getBlock(test.worldBlockLocation({ x, y, z }));
        out.set(cellKey({ x, y, z }), block === undefined ? "unloaded" : `${block.typeId}${JSON.stringify(block.permutation.getAllStates())}`);
      }
  return out;
}

/** Every block in the box as it stands now, to be put back with putBack(). */
function capture(test: Test, from: Vector3, to: Vector3): { at: Vector3; permutation: BlockPermutation }[] {
  const out: { at: Vector3; permutation: BlockPermutation }[] = [];
  const dim = test.getDimension();
  for (let x = from.x; x <= to.x; x++)
    for (let y = from.y; y <= to.y; y++)
      for (let z = from.z; z <= to.z; z++) {
        const block = dim.getBlock(test.worldBlockLocation({ x, y, z }));
        if (block !== undefined) out.push({ at: block.location, permutation: block.permutation });
      }
  return out;
}

function putBack(test: Test, cells: { at: Vector3; permutation: BlockPermutation }[]): number {
  let written = 0;
  const dim = test.getDimension();
  for (const { at, permutation } of cells) {
    const block = dim.getBlock(at);
    if (block !== undefined && !block.permutation.matches(permutation.type.id, permutation.getAllStates())) {
      block.setPermutation(permutation);
      written++;
    }
  }
  return written;
}

function diff(before: Map<string, string>, after: Map<string, string>): string[] {
  const out: string[] = [];
  for (const [k, v] of before) if (after.get(k) !== v) out.push(`${k}: ${v} -> ${after.get(k) ?? "missing"}`);
  return out;
}

/** Fire cells within 3 of a world point. */
function fireNear(test: Test, at: Vector3): string[] {
  const dim = test.getDimension();
  const c = { x: Math.floor(at.x), y: Math.floor(at.y), z: Math.floor(at.z) };
  const out: string[] = [];
  for (let x = -3; x <= 3; x++)
    for (let y = -3; y <= 3; y++)
      for (let z = -3; z <= 3; z++) {
        const b = dim.getBlock({ x: c.x + x, y: c.y + y, z: c.z + z });
        if (b !== undefined && FIRE_IDS.has(b.typeId)) out.push(cellKey(test.relativeBlockLocation(b.location)));
      }
  return out;
}

// ---------------------------------------------------------------- players and mobs

function hp(e: Entity): number {
  try {
    return e.getComponent(EntityComponentTypes.Health)?.currentValue ?? Number.NaN;
  } catch {
    return Number.NaN;
  }
}

function setHp(e: Entity, v: number): void {
  e.getComponent(EntityComponentTypes.Health)?.setCurrentValue(v);
}

function onFire(e: Entity): boolean {
  try {
    return e.getComponent(EntityComponentTypes.OnFire) !== undefined;
  } catch {
    return false;
  }
}

function equippable(player: Player) {
  const c = player.getComponent(EntityComponentTypes.Equippable);
  if (c === undefined) throw new Error(`${player.name} has no equippable`);
  return c;
}

interface Hands {
  main?: string;
  off?: string;
}

/** A Survival wielder on START holding `hands` (the blade in the main hand by default), both timers clear. */
async function wielder(test: Test, players: SimulatedPlayer[], name: string, hands: Hands = { main: STORM_BLADE.itemId }, at: Vector3 = START): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(at, `${PREFIX}${name}`, GameMode.Survival);
  players.push(p);
  await test.idle(4);
  p.selectedSlotIndex = SLOT;
  if (hands.main !== undefined) p.setItem(new ItemStack(hands.main, 1), SLOT, true);
  if (hands.off !== undefined) test.assert(equippable(p).setEquipment(EquipmentSlot.Offhand, new ItemStack(hands.off, 1)), `the off hand refused ${hands.off}`);
  clearCooldown(p, STORM_BLADE.abilityKey);
  clearCooldown(p, DRAGON_KATANA.abilityKey);
  await test.idle(2);
  return p;
}

/** Puts the wielder back on START facing +x and clears both timers. */
async function reset(test: Test, p: SimulatedPlayer): Promise<void> {
  p.teleport(test.worldLocation({ x: START.x + 0.5, y: START.y, z: START.z + 0.5 }), { rotation: { x: 0, y: -90 } });
  clearCooldown(p, STORM_BLADE.abilityKey);
  clearCooldown(p, DRAGON_KATANA.abilityKey);
  await test.idle(2);
}

/** A 40-HP Survival SimulatedPlayer target standing at test-relative feet `at`. */
async function target(test: Test, players: SimulatedPlayer[], name: string, at: Vector3): Promise<SimulatedPlayer> {
  const t = test.spawnSimulatedPlayer({ x: Math.floor(at.x), y: at.y, z: Math.floor(at.z) }, `${PREFIX}${name}`, GameMode.Survival);
  players.push(t);
  watch(t);
  await test.idle(2);
  t.addEffect("health_boost", 20000, { amplifier: 4, showParticles: false });
  await test.idle(2);
  await place(test, t, at);
  return t;
}

/** Back to `at`, at rest, at full health. */
async function place(test: Test, e: Entity, at: Vector3): Promise<void> {
  e.teleport(test.worldLocation(at));
  await test.idle(2);
  e.getComponent(EntityComponentTypes.Health)?.resetToMaxValue();
}

/** A mob without behaviours at test-relative `at`. */
function mob(test: Test, leftovers: Entity[], typeId: string, at: Vector3): Entity {
  const e = test.spawnWithoutBehaviorsAtLocation(typeId, at);
  leftovers.push(e);
  watch(e);
  return e;
}

/** The one release `p` made since `before`, or a failure. */
function oneRelease(fails: string[], tag: string, p: Player, before: number): Seen | undefined {
  const made = releasesBy(p).slice(before);
  if (made.length !== 1) {
    fails.push(`${tag}: ${made.length} activations, expected one`);
    return undefined;
  }
  if (!made[0].activation.released) fails.push(`${tag}: refused (${made[0].activation.refused})`);
  return made[0];
}

function cooldownOk(fails: string[], tag: string, s: Seen | undefined): void {
  const left = s?.cooldownLeft;
  if (left === undefined || left < COOLDOWN_LEFT_MS[0] || left > COOLDOWN_LEFT_MS[1]) fails.push(`${tag}: cooldown left ${String(left)} ms, expected 29.5–30 s`);
}

function describe(test: Test, s: Seen | undefined): string {
  if (s === undefined) return "none";
  const a = s.activation;
  const line = a.line;
  return (
    `slot=${a.slot} released=${a.released}${a.refused === undefined ? "" : ` refused=${a.refused}`} ` +
    (line === undefined ? "" : `stop=${line.stoppedBy}@${f2(line.length)} face=${line.face ?? "-"} end=${a.end === undefined ? "-" : f3(test.relativeLocation(a.end))} `) +
    `target=${a.targetType ?? "none"}@${f2(a.hitDistance)} strike=${a.strike === undefined ? "-" : `${a.strike.path} ${f2(a.strike.hpBefore)}->${f2(a.strike.hpAfter)}`} ` +
    `cdLeft=${f2(s.cooldownLeft)}`
  );
}

/** Hit exactly once by the wielder for 10.00 (a bare target out of any hurt window), nothing else. */
function hitOnce(fails: string[], tag: string, t: Entity, w: Player, from: number): void {
  const got = hurtsSince(t, from);
  const ok = got.length === 1 && got[0].by === w.id && got[0].cause === EntityDamageCause.entityAttack && Math.abs(got[0].damage - ACTIVE_DAMAGE) <= TOL;
  if (!ok) fails.push(`${tag}: target hurts ${hurtText(got)}, expected one 10.00/entityAttack by the wielder`);
}

function untouched(fails: string[], tag: string, t: Entity, from: number): void {
  const got = hurtsSince(t, from);
  if (got.length > 0) fails.push(`${tag}: ${t.typeId} took ${hurtText(got)}`);
}

// ---------------------------------------------------------------- the scenario frame

interface Frame {
  test: Test;
  arena: Arena;
  players: SimulatedPlayer[];
  leftovers: Entity[];
  fails: string[];
}

function scenario(name: string, maxTicks: number, body: (f: Frame) => Promise<void>): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const f: Frame = { test, arena: new Arena(test), players: [], leftovers: [], fails: [] };
    const regen = world.gameRules.naturalRegeneration;
    const pvp = world.gameRules.pvp;
    world.gameRules.naturalRegeneration = false;
    world.gameRules.pvp = true;
    try {
      log(`${name} START difficulty=${world.getDifficulty()} doFireTick=${world.gameRules.doFireTick}`);
      await body(f);
    } catch (err) {
      log(`${name} ERROR ${errText(err)}`);
      throw err;
    } finally {
      world.gameRules.naturalRegeneration = regen;
      world.gameRules.pvp = pvp;
      for (const p of f.players) if (p.isValid) test.removeSimulatedPlayer(p);
      for (const e of f.leftovers) if (e.isValid) e.remove();
      const failures = f.arena.restore();
      if (failures.length > 0) log(`${name} RESTORE failed for ${failures.length} cells: ${failures.slice(0, 3).join("; ")}`);
    }
    for (const x of f.fails) log(`${name} CHECK FAILED ${x}`);
    log(`${name} RESULT ${f.fails.length === 0 ? "ok" : `FAIL ${f.fails.length}`}`);
    test.assert(f.fails.length === 0, `${f.fails.length} check(s) failed: ${f.fails.join("; ").slice(0, 700)}`);
    test.succeed();
  })
    .structureName(STRUCTURE)
    .maxTicks(maxTicks)
    .tag("andrew");
}

// ---------------------------------------------------------------- AC1: 10 blocks, Euclidean, on the axis and the diagonal

scenario("storm_active_range", 900, async ({ test, arena, players, fails }) => {
  runway(arena, 16, 0, 14);
  const w = await wielder(test, players, "range_w");
  const t = await target(test, players, "range_t", { x: 12.5, y: START.y, z: START.z + 0.5 });
  for (const [deg, label] of [
    [0, "axis"],
    [45, "diagonal"],
  ] as const) {
    for (const d of [9.5, 10.5]) {
      const tag = `RANGE ${label} ${d}`;
      await reset(test, w);
      const centre = outAlong(test, w, deg, d);
      await place(test, t, { x: centre.x, y: START.y, z: centre.z });
      await aimLevel(test, w, deg);
      const before = releasesBy(w).length;
      const from = system.currentTick;
      await press(test, w);
      await test.idle(SETTLE);
      const s = oneRelease(fails, tag, w, before);
      const a = s?.activation;
      if (a?.line !== undefined && (a.line.stoppedBy !== "range" || Math.abs(a.line.length - ACTIVE_RANGE) > 1e-3)) fails.push(`${tag}: line ${a.line.stoppedBy}@${a.line.length}, expected the 10-block cap`);
      if (d < ACTIVE_RANGE) {
        hitOnce(fails, tag, t, w, from);
        if (a?.targetId !== t.id) fails.push(`${tag}: release named ${a?.targetId ?? "no target"}`);
        if (a?.hitDistance !== undefined && a.hitDistance > ACTIVE_RANGE) fails.push(`${tag}: hit at ${a.hitDistance}`);
      } else {
        untouched(fails, tag, t, from);
        if (a?.targetId !== undefined) fails.push(`${tag}: release named ${a.targetId} past 10 blocks`);
      }
      cooldownOk(fails, tag, s);
      log(`${tag} ROW ${describe(test, s)} targetCentre=${f3(centre)} hurts=${hurtText(hurtsSince(t, from))}`);
    }
  }
});

// ---------------------------------------------------------------- AC1: a wall stops it; passable blocks do not

scenario("storm_active_wall", 900, async ({ test, arena, players, fails }) => {
  runway(arena, 16, 0, 14);
  const w = await wielder(test, players, "wall_w");
  const t = await target(test, players, "wall_t", { x: 9.5, y: START.y, z: START.z + 0.5 });
  const dim = test.getDimension();

  // Axis: a one-block stone wall 4.5 out (cell x=7), the target 7 out behind it.
  {
    const tag = "WALL axis";
    arena.fill({ x: 7, y: FLOOR_Y + 1, z: 2 }, { x: 7, y: FLOOR_Y + 3, z: 4 }, "minecraft:stone");
    await reset(test, w);
    await place(test, t, { x: 9.5, y: START.y, z: START.z + 0.5 });
    await aimLevel(test, w, 0);
    const before = releasesBy(w).length;
    const from = system.currentTick;
    await press(test, w);
    await test.idle(SETTLE);
    const s = oneRelease(fails, tag, w, before);
    const line = s?.activation.line;
    if (line?.stoppedBy !== "block" || Math.abs(line.length - 4.5) > 0.05) fails.push(`${tag}: line ${line?.stoppedBy}@${f2(line?.length)}, expected the wall face at 4.50`);
    untouched(fails, tag, t, from);
    cooldownOk(fails, tag, s);
    log(`${tag} ROW ${describe(test, s)} hurts=${hurtText(hurtsSince(t, from))}`);
    arena.fill({ x: 7, y: FLOOR_Y + 1, z: 2 }, { x: 7, y: FLOOR_Y + 3, z: 4 }, "minecraft:air");
  }

  // Diagonal: a stepped wall across the xz diagonal at ~7.8 (probe-storm P5 B), the target 10 out behind it.
  {
    const tag = "WALL diagonal";
    for (let i = -3; i <= 3; i++)
      for (const dz of [0, -1]) arena.fill({ x: 8 + i, y: FLOOR_Y + 1, z: 9 - i + dz }, { x: 8 + i, y: FLOOR_Y + 3, z: 9 - i + dz }, "minecraft:stone");
    await reset(test, w);
    const centre = outAlong(test, w, 45, 10);
    await place(test, t, { x: centre.x, y: START.y, z: centre.z });
    await aimLevel(test, w, 45);
    const head = w.getHeadLocation();
    const dir = w.getViewDirection();
    // Negative controls: the naive block ray misses the wall, the naive entity ray sees the target through it.
    const naiveBlock = dim.getBlockFromRay(head, dir, { ...TRACE_FLAGS, maxDistance: ACTIVE_RANGE });
    const naiveEntities = dim.getEntitiesFromRay(head, dir, { maxDistance: ACTIVE_RANGE }).filter((h) => h.entity.id !== w.id);
    const before = releasesBy(w).length;
    const from = system.currentTick;
    await press(test, w);
    await test.idle(SETTLE);
    const s = oneRelease(fails, tag, w, before);
    const line = s?.activation.line;
    if (line?.stoppedBy !== "block" || line.length < 7 || line.length > 8.5) fails.push(`${tag}: line ${line?.stoppedBy}@${f2(line?.length)}, expected the wall at ~7.8`);
    untouched(fails, tag, t, from);
    cooldownOk(fails, tag, s);
    const throughWall = naiveEntities.some((h) => h.entity.id === t.id);
    if (naiveBlock !== undefined) fails.push(`${tag} control: a maxDistance-10 block ray met ${naiveBlock.block.typeId}; the cell-step trap is not reproduced here`);
    if (!throughWall) fails.push(`${tag} control: the naive entity ray did not reach the target behind the wall`);
    log(
      `${tag} ROW ${describe(test, s)} hurts=${hurtText(hurtsSince(t, from))} control: naiveBlock=${naiveBlock === undefined ? "none" : naiveBlock.block.typeId} ` +
        `naiveEntities=[${naiveEntities.map((h) => `${h.entity.typeId}@${f2(h.distance)}`).join(" ")}]`
    );
    for (let i = -3; i <= 3; i++)
      for (const dz of [0, -1]) arena.fill({ x: 8 + i, y: FLOOR_Y + 1, z: 9 - i + dz }, { x: 8 + i, y: FLOOR_Y + 3, z: 9 - i + dz }, "minecraft:air");
  }

  // Passable blocks at head height: grass on dirt, a torch on stone and cobweb; the target 6 out is hit.
  {
    const tag = "WALL passable";
    arena.set({ x: 4, y: FLOOR_Y + 1, z: 3 }, "minecraft:dirt");
    arena.set({ x: 4, y: FLOOR_Y + 2, z: 3 }, "minecraft:short_grass");
    arena.set({ x: 5, y: FLOOR_Y + 1, z: 3 }, "minecraft:stone");
    arena.set({ x: 5, y: FLOOR_Y + 2, z: 3 }, "minecraft:torch", { torch_facing_direction: "top" });
    arena.set({ x: 6, y: FLOOR_Y + 2, z: 3 }, "minecraft:web");
    await reset(test, w);
    const centre = outAlong(test, w, 0, 6);
    await place(test, t, { x: centre.x, y: START.y, z: centre.z });
    await aimLevel(test, w, 0);
    const head = w.getHeadLocation();
    const dir = w.getViewDirection();
    const kept = ["minecraft:short_grass", "minecraft:torch", "minecraft:web"].map((id, i) => dim.getBlock(test.worldBlockLocation({ x: 4 + i, y: FLOOR_Y + 2, z: 3 }))?.typeId === id);
    const naive = dim.getEntitiesFromRay(head, dir, { maxDistance: ACTIVE_RANGE }).filter((h) => h.entity.id !== w.id);
    const before = releasesBy(w).length;
    const from = system.currentTick;
    await press(test, w);
    await test.idle(SETTLE);
    const s = oneRelease(fails, tag, w, before);
    hitOnce(fails, tag, t, w, from);
    if (s?.activation.line?.stoppedBy !== "range") fails.push(`${tag}: the line stopped at ${s?.activation.line?.stoppedBy}`);
    if (kept.includes(false)) fails.push(`${tag}: a passable block did not stay put: ${kept.join(",")}`);
    if (naive.some((h) => h.entity.id === t.id)) fails.push(`${tag} control: the naive entity ray reached the target; the passables prove nothing here`);
    log(`${tag} ROW ${describe(test, s)} hurts=${hurtText(hurtsSince(t, from))} blocksKept=${kept.join(",")} control: naiveEntities=[${naive.map((h) => `${h.entity.typeId}@${f2(h.distance)}`).join(" ")}]`);
  }
});

// ---------------------------------------------------------------- AC2: only the first living entity on the line

scenario("storm_active_first_only", 700, async ({ test, arena, players, leftovers, fails }) => {
  runway(arena, 14);
  const w = await wielder(test, players, "first_w");
  const second = await target(test, players, "first_second", { x: 8.5, y: START.y, z: START.z + 0.5 });

  {
    const tag = "FIRST two players";
    const first = await target(test, players, "first_first", { x: 6.5, y: START.y, z: START.z + 0.5 });
    await reset(test, w);
    await place(test, second, { x: 8.5, y: START.y, z: START.z + 0.5 });
    await aimLevel(test, w, 0);
    const before = releasesBy(w).length;
    const from = system.currentTick;
    await press(test, w);
    await test.idle(SETTLE);
    const s = oneRelease(fails, tag, w, before);
    hitOnce(fails, tag, first, w, from);
    untouched(fails, tag, second, from);
    if (s?.activation.targetId !== first.id) fails.push(`${tag}: release named ${s?.activation.targetId ?? "none"}`);
    log(`${tag} ROW ${describe(test, s)} first=${hurtText(hurtsSince(first, from))} second=${hurtText(hurtsSince(second, from))}`);
    test.removeSimulatedPlayer(first);
  }

  {
    const tag = "FIRST dies";
    const villager = mob(test, leftovers, "minecraft:villager_v2", { x: 6.5, y: START.y, z: START.z + 0.5 });
    await test.idle(2);
    setHp(villager, 5);
    await reset(test, w);
    await place(test, second, { x: 8.5, y: START.y, z: START.z + 0.5 });
    await aimLevel(test, w, 0);
    const before = releasesBy(w).length;
    const from = system.currentTick;
    await press(test, w);
    await test.idle(SETTLE);
    const s = oneRelease(fails, tag, w, before);
    const died = deaths.get(villager.id) ?? [];
    if (died.length !== 1) fails.push(`${tag}: the villager at 5 HP did not die from the hit: ${died.join(",")}`);
    untouched(fails, tag, second, from);
    if (s?.activation.targetId !== villager.id) fails.push(`${tag}: release named ${s?.activation.targetId ?? "none"}`);
    log(`${tag} ROW ${describe(test, s)} villager=${hurtText(hurtsSince(villager.id, from))} died=${died.join(",")} second=${hurtText(hurtsSince(second, from))}`);
  }
});

// ---------------------------------------------------------------- AC4 + AC8 evidence: the strikes act on nothing; a vanilla bolt does

interface Bystanders {
  pig: Entity;
  villager: Entity;
  player: SimulatedPlayer;
}

interface Harm {
  rows: string[];
  harms: string[];
}

/** Everything that can tell a harmless strike from a harmful one, measured from `from` to now. */
function judgeHarm(
  test: Test,
  label: string,
  b: Bystanders,
  start: Map<string, { at: Vector3; v: Vector3 }>,
  from: number,
  points: Vector3[],
  blocksBefore: Map<string, string>,
  area: [Vector3, Vector3],
  idsBefore: Set<string>,
  centre: Vector3
): Harm {
  const rows: string[] = [];
  const harms: string[] = [];
  for (const [name, e] of Object.entries(b) as [string, Entity][]) {
    if (!e.isValid) {
      harms.push(`${name} is gone (converted or killed)`);
      rows.push(`${name}=gone`);
      continue;
    }
    const s = start.get(e.id);
    const moved = s === undefined ? 0 : len(sub(e.location, s.at));
    const dv = s === undefined ? 0 : len(sub(e.getVelocity(), s.v));
    const h = hurtsSince(e, from);
    const burning = onFire(e);
    if (h.length > 0) harms.push(`${name} hurt ${hurtText(h)}`);
    if (moved > TOL) harms.push(`${name} moved ${f2(moved)}`);
    if (dv > TOL) harms.push(`${name} velocity changed ${f2(dv)}`);
    if (burning) harms.push(`${name} on fire`);
    rows.push(`${name}{hurt=${hurtText(h)} moved=${moved.toFixed(3)} dv=${dv.toFixed(3)} fire=${burning}}`);
  }
  const fire = [...new Set(points.flatMap((p) => fireNear(test, p)))];
  if (fire.length > 0) harms.push(`fire at ${fire.slice(0, 4).join(" ")}`);
  const changed = diff(blocksBefore, snapshot(test, area[0], area[1]));
  if (changed.length > 0) harms.push(`${changed.length} blocks changed: ${changed.slice(0, 3).join("; ")}`);
  const dim = test.getDimension();
  const bolts = dim.getEntities({ type: LIGHTNING }).length;
  const near = dim.getEntities({ location: centre, maxDistance: 16 }).filter((e) => !idsBefore.has(e.id) && e.typeId !== LIGHTNING);
  if (near.length > 0) harms.push(`new entities ${near.map((e) => e.typeId).join(",")}`);
  rows.push(`fire=[${fire.join(" ")}] blocksChanged=${changed.length} newEntities=[${near.map((e) => e.typeId).join(",")}] boltsLeft=${bolts}`);
  log(`HARMLESS ${label} ROW ${rows.join(" ")}`);
  return { rows, harms };
}

scenario("storm_active_harmless", 1200, async ({ test, arena, players, leftovers, fails }) => {
  const difficulty = world.getDifficulty();
  const spawning = world.gameRules.doMobSpawning;
  try {
    // Peaceful (the checks world's default) deletes hostile mobs a bolt converts; Normal keeps whatever it makes.
    world.setDifficulty(Difficulty.Normal);
    world.gameRules.doMobSpawning = false;
    runway(arena, 14, 0, 8, 9);
    // Flammable ground around the strike point.
    arena.fill({ x: 6, y: FLOOR_Y, z: 0 }, { x: 11, y: FLOOR_Y, z: 7 }, "minecraft:oak_planks");
    const area: [Vector3, Vector3] = [
      { x: 0, y: FLOOR_Y, z: 0 },
      { x: 14, y: FLOOR_Y + 9, z: 8 },
    ];
    const w = await wielder(test, players, "harm_w");
    const T_AT: Vector3 = { x: 8.5, y: START.y, z: START.z + 0.5 };
    const t = await target(test, players, "harm_t", T_AT);
    const PIG_AT: Vector3 = { x: 8.5, y: START.y, z: 1.5 };
    const VILLAGER_AT: Vector3 = { x: 8.5, y: START.y, z: 5.3 };
    const PLAYER_AT: Vector3 = { x: 5.5, y: START.y, z: 4.6 };
    const pig = mob(test, leftovers, "minecraft:pig", PIG_AT);
    const villager = mob(test, leftovers, "minecraft:villager_v2", VILLAGER_AT);
    const bystander = await target(test, players, "harm_by", PLAYER_AT);
    const b: Bystanders = { pig, villager, player: bystander };
    const centre = test.worldLocation({ x: 7, y: START.y + 1, z: 3.5 });
    const strikeFoot = test.worldLocation(T_AT);
    const built = capture(test, area[0], area[1]);

    const rest = async (): Promise<Map<string, { at: Vector3; v: Vector3 }>> => {
      await place(test, t, T_AT);
      await place(test, b.player, PLAYER_AT);
      await place(test, b.pig, PIG_AT);
      await place(test, b.villager, VILLAGER_AT);
      await test.idle(10);
      return new Map(Object.values(b).map((e: Entity) => [e.id, { at: { ...e.location }, v: e.getVelocity() }]));
    };
    const ids = (): Set<string> => new Set(test.getDimension().getEntities({ location: centre, maxDistance: 16 }).map((e) => e.id));

    // The blade.
    {
      await reset(test, w);
      await aimLevel(test, w, 0);
      const start = await rest();
      const blocks = snapshot(test, area[0], area[1]);
      const idsBefore = ids();
      const before = releasesBy(w).length;
      const from = system.currentTick;
      await press(test, w);
      const tAt = { ...t.location };
      await test.idle(SETTLE);
      const s = oneRelease(fails, "HARMLESS blade", w, before);
      hitOnce(fails, "HARMLESS blade", t, w, from);
      if (onFire(t)) fails.push("HARMLESS blade: the target is on fire");
      const knock = len(sub({ ...t.location, y: 0 }, { ...tAt, y: 0 }));
      const points = [strikeFoot, s?.activation.end ?? strikeFoot];
      const verdict = judgeHarm(test, "blade", b, start, from, points, blocks, area, idsBefore, centre);
      for (const h of verdict.harms) fails.push(`HARMLESS blade: ${h}`);
      if (test.getDimension().getEntities({ type: LIGHTNING }).length > 0) fails.push("HARMLESS blade: a lightning entity exists");
      log(`HARMLESS blade ROW ${describe(test, s)} target=${hurtText(hurtsSince(t, from))} targetKnock=${f2(knock)} (L0-adr-sbkb: the hit's own, probe P4 1.79)`);
    }

    // The control: a vanilla bolt at the same point, in the same layout, must be seen by the same check.
    const control = async (label: string, cancel: boolean): Promise<Harm> => {
      const start = await rest();
      const blocks = snapshot(test, area[0], area[1]);
      const idsBefore = ids();
      const cancelled: string[] = [];
      const guard = (e: EntityHurtBeforeEvent): void => {
        const cause = e.damageSource.cause;
        if (cause === EntityDamageCause.lightning || cause === EntityDamageCause.fire || cause === EntityDamageCause.fireTick) {
          e.cancel = true;
          cancelled.push(cause);
        }
      };
      if (cancel) world.beforeEvents.entityHurt.subscribe(guard);
      const from = system.currentTick;
      try {
        test.getDimension().spawnEntity(LIGHTNING, strikeFoot);
        await test.idle(SETTLE + 20);
      } finally {
        if (cancel) world.beforeEvents.entityHurt.unsubscribe(guard);
      }
      const verdict = judgeHarm(test, label, b, start, from, [strikeFoot], blocks, area, idsBefore, centre);
      const target = hurtsSince(t, from);
      log(`HARMLESS ${label} ROW target=${hurtText(target)} targetOnFire=${onFire(t)} cancelledHurts=${cancelled.length}[${[...new Set(cancelled)].join(",")}] harms=${verdict.harms.length}: ${verdict.harms.join(" | ")}`);
      // Put the arena and the cast back for the next run.
      for (const e of test.getDimension().getEntities({ location: centre, maxDistance: 16 })) if (!idsBefore.has(e.id) && e.isValid) leftovers.push(e);
      log(`HARMLESS ${label} put back ${putBack(test, built)} cells`);
      if (t.isValid) t.extinguishFire();
      if (bystander.isValid) bystander.extinguishFire();
      return verdict;
    };
    const plain = await control("vanilla-bolt", false);
    if (plain.harms.length === 0) fails.push("HARMLESS control: a vanilla bolt in the same layout left no harm the check can see; the blade's clean result proves nothing");
    // A bolt converts what it strikes; the cancelled run gets a fresh pig and villager either way.
    for (const e of [b.pig, b.villager]) if (e.isValid) e.remove();
    b.pig = mob(test, leftovers, "minecraft:pig", PIG_AT);
    b.villager = mob(test, leftovers, "minecraft:villager_v2", VILLAGER_AT);
    await test.idle(2);
    const guarded = await control("vanilla-bolt-damage-cancelled", true);
    if (guarded.harms.length === 0) fails.push("HARMLESS control: a vanilla bolt with every lightning and fire hurt cancelled left no harm; the deviation's reason needs rewording");
  } finally {
    world.setDifficulty(difficulty);
    world.gameRules.doMobSpawning = spawning;
  }
});

// ---------------------------------------------------------------- AC5: the cooldown is spent by every valid release and by nothing else

scenario("storm_active_cooldown", 1600, async ({ test, arena, players, fails }) => {
  runway(arena, 14);
  const w = await wielder(test, players, "cd_w");
  const t = await target(test, players, "cd_t", { x: 6.5, y: START.y, z: START.z + 0.5 });
  const park = async (): Promise<void> => place(test, t, { x: 6.5, y: START.y, z: 6.5 });

  // A miss into open air is a valid release.
  {
    const tag = "CD miss";
    await park();
    await reset(test, w);
    await aimLevel(test, w, 0);
    const before = releasesBy(w).length;
    await press(test, w);
    const s = oneRelease(fails, tag, w, before);
    if (s?.activation.targetId !== undefined || s?.activation.line?.stoppedBy !== "range") fails.push(`${tag}: ${describe(test, s)}`);
    cooldownOk(fails, tag, s);
    log(`${tag} ROW ${describe(test, s)}`);

    // One second later, with a target in front: nothing, and the timer is not rewritten.
    const tag2 = "CD on cooldown";
    await test.idle(20);
    await place(test, t, { x: 6.5, y: START.y, z: START.z + 0.5 });
    await aimLevel(test, w, 0);
    const cdBefore = w.getDynamicProperty(SB_CD);
    const before2 = releasesBy(w).length;
    const from = system.currentTick;
    await press(test, w);
    await test.idle(SETTLE);
    const cdAfter = w.getDynamicProperty(SB_CD);
    if (releasesBy(w).length !== before2) fails.push(`${tag2}: the press on cooldown reached the blade`);
    if (!Object.is(cdBefore, cdAfter)) fails.push(`${tag2}: the timer was rewritten ${String(cdBefore)} -> ${String(cdAfter)}`);
    untouched(fails, tag2, t, from);
    log(`${tag2} ROW activations=${releasesBy(w).length - before2} cooldown ${String(cdBefore)} -> ${String(cdAfter)} hurts=${hurtText(hurtsSince(t, from))}`);

    // After 30 s of real time the next press fires again; just before it, it does not.
    const tag3 = "CD expiry";
    const deadline = cdAfter as number;
    while (Date.now() < deadline - 3000) await test.idle(10);
    const early = releasesBy(w).length;
    await press(test, w);
    await test.idle(2);
    const earlyMade = releasesBy(w).length - early;
    while (Date.now() < deadline + 100) await test.idle(2);
    await place(test, t, { x: 6.5, y: START.y, z: START.z + 0.5 });
    await aimLevel(test, w, 0);
    const late = releasesBy(w).length;
    const from3 = system.currentTick;
    await press(test, w);
    await test.idle(SETTLE);
    const s3 = oneRelease(fails, tag3, w, late);
    if (earlyMade !== 0) fails.push(`${tag3}: a press 3 s before the deadline released`);
    hitOnce(fails, tag3, t, w, from3);
    cooldownOk(fails, tag3, s3);
    log(`${tag3} ROW earlyReleases=${earlyMade} ${describe(test, s3)}`);
  }

  // A wall half a block from the eye is a valid release.
  {
    const tag = "CD wall at 0.5";
    await park();
    arena.fill({ x: 3, y: FLOOR_Y + 1, z: 2 }, { x: 3, y: FLOOR_Y + 3, z: 4 }, "minecraft:stone");
    await reset(test, w);
    await aimLevel(test, w, 0);
    const before = releasesBy(w).length;
    await press(test, w);
    const s = oneRelease(fails, tag, w, before);
    const line = s?.activation.line;
    if (line?.stoppedBy !== "block" || Math.abs(line.length - 0.5) > 0.05) fails.push(`${tag}: line ${line?.stoppedBy}@${f2(line?.length)}`);
    cooldownOk(fails, tag, s);
    log(`${tag} ROW ${describe(test, s)}`);
    arena.fill({ x: 3, y: FLOOR_Y + 1, z: 2 }, { x: 3, y: FLOOR_Y + 3, z: 4 }, "minecraft:air");
  }

  // Invalid attempts spend nothing: a spectator, a stale copy, a blade in neither hand, a dead wielder.
  const invalid = async (tag: string, setup: () => Promise<void>, attempt: () => Promise<StormActivation | undefined>, expect: StormActivation["refused"] | "none"): Promise<void> => {
    await reset(test, w);
    await place(test, t, { x: 6.5, y: START.y, z: START.z + 0.5 });
    await setup();
    await aimLevel(test, w, 0);
    const before = w.getDynamicProperty(SB_CD);
    const from = system.currentTick;
    const got = await attempt();
    await test.idle(SETTLE);
    const after = w.isValid ? w.getDynamicProperty(SB_CD) : undefined;
    const outcome = got === undefined ? "none" : got.released ? "released" : got.refused;
    if (outcome !== expect) fails.push(`${tag}: outcome ${outcome}, expected ${expect}`);
    if (!Object.is(before, after)) fails.push(`${tag}: the timer was written ${String(before)} -> ${String(after)}`);
    untouched(fails, tag, t, from);
    log(`${tag} ROW outcome=${outcome} cooldown ${String(before)} -> ${String(after)} hurts=${hurtText(hurtsSince(t, from))}`);
  };

  await invalid(
    "CD spectator",
    async () => w.setGameMode(GameMode.Spectator),
    async () => activate(w),
    "spectator"
  );
  w.setGameMode(GameMode.Survival);

  let staleId: string | undefined;
  await invalid(
    "CD stale copy",
    async () => {
      const stack = new ItemStack(STORM_BLADE.itemId, 1);
      const mark = makeMark("admin", w);
      staleId = mark.id;
      bumpGen(STORM_BLADE, mark.id);
      w.setItem(markItem(STORM_BLADE, stack, mark), SLOT, true);
      await test.idle(2);
    },
    async () => activate(w),
    "none"
  );
  if (staleId !== undefined) world.setDynamicProperty(genLedgerKey(STORM_BLADE, staleId), undefined);

  await invalid(
    "CD neither hand",
    async () => {
      w.setItem(new ItemStack("minecraft:diamond_sword", 1), SLOT, true);
      equippable(w).setEquipment(EquipmentSlot.Offhand, undefined);
      await test.idle(2);
    },
    async () => activate(w),
    "none"
  );

  // keepInventory leaves the blade in the dead wielder's hand; without it the hand is empty and the press is nobody's.
  const keep = world.gameRules.keepInventory;
  world.gameRules.keepInventory = true;
  try {
    w.setItem(new ItemStack(STORM_BLADE.itemId, 1), SLOT, true);
    await invalid(
      "CD dead wielder",
      async () => {
        await test.idle(2);
      },
      async () => {
        w.applyDamage(1000, { cause: EntityDamageCause.override });
        return activate(w);
      },
      "dead"
    );
  } finally {
    world.gameRules.keepInventory = keep;
  }
});

// ---------------------------------------------------------------- AC6: melee on cooldown, and the shared hand priority

scenario("storm_active_hands_and_melee", 1400, async ({ test, arena, players, fails }) => {
  runway(arena, 26, 0, 6);

  // A melee with the blade on cooldown is the diamond sword's own, and leaves the timer alone.
  {
    const tag = "MELEE on cooldown";
    // The Katana (minecraft:damage 7) is the witness of how a custom item's damage value adds to the hand's base.
    const blade = await wielder(test, players, "melee_blade", { main: STORM_BLADE.itemId }, { x: 3, y: START.y, z: 0 });
    const sword = await wielder(test, players, "melee_sword", { main: "minecraft:diamond_sword" }, { x: 3, y: START.y, z: 3 });
    const katana = await wielder(test, players, "melee_katana", { main: DRAGON_KATANA.itemId }, { x: 3, y: START.y, z: 6 });
    const tb = await target(test, players, "melee_tb", { x: 4.5, y: START.y, z: 0.5 });
    const ts = await target(test, players, "melee_ts", { x: 4.5, y: START.y, z: 3.5 });
    const tk = await target(test, players, "melee_tk", { x: 4.5, y: START.y, z: 6.5 });
    startCooldown(blade, STORM_BLADE.abilityKey);
    await test.idle(2);
    blade.lookAtEntity(tb);
    sword.lookAtEntity(ts);
    katana.lookAtEntity(tk);
    await test.idle(2);
    const cdBefore = blade.getDynamicProperty(SB_CD);
    const swing = (a: SimulatedPlayer, t: Entity): { ok: boolean; d: number } => {
      const before = hp(t);
      const ok = a.attackEntity(t);
      return { ok, d: before - hp(t) };
    };
    const b = swing(blade, tb);
    const sw = swing(sword, ts);
    const k = swing(katana, tk);
    await test.idle(4);
    const cdAfter = blade.getDynamicProperty(SB_CD);
    if (!b.ok || !(b.d > 0) || Math.abs(b.d - sw.d) > TOL) fails.push(`${tag}: the blade's melee took ${f2(b.d)} (swing ${b.ok}), the diamond sword's ${f2(sw.d)} (swing ${sw.ok})`);
    if (!Object.is(cdBefore, cdAfter)) fails.push(`${tag}: the melee rewrote the blade's timer`);
    log(`${tag} ROW blade=${f2(b.d)} sword=${f2(sw.d)} katana(damage 7)=${f2(k.d)} cooldown ${String(cdBefore)} -> ${String(cdAfter)}`);
    for (const p of [blade, sword, katana, tb, ts, tk]) test.removeSimulatedPlayer(p);
  }

  const w = await wielder(test, players, "hands_w", { main: STORM_BLADE.itemId, off: DRAGON_KATANA.itemId });
  const setHands = async (main: string, off: string): Promise<void> => {
    w.setItem(new ItemStack(main, 1), SLOT, true);
    test.assert(equippable(w).setEquipment(EquipmentSlot.Offhand, new ItemStack(off, 1)), `the off hand refused ${off}`);
    await test.idle(2);
  };

  interface Case {
    tag: string;
    main: string;
    off: string;
    cooling: string[];
    storm: "Mainhand" | "Offhand" | "none";
    katana: boolean;
  }
  const cases: Case[] = [
    { tag: "HANDS blade ready beats a ready off-hand Katana", main: STORM_BLADE.itemId, off: DRAGON_KATANA.itemId, cooling: [], storm: "Mainhand", katana: false },
    { tag: "HANDS Katana cooling hands the press to the off-hand blade", main: DRAGON_KATANA.itemId, off: STORM_BLADE.itemId, cooling: [DRAGON_KATANA.abilityKey], storm: "Offhand", katana: false },
    { tag: "HANDS blade cooling hands the press to the off-hand Katana", main: STORM_BLADE.itemId, off: DRAGON_KATANA.itemId, cooling: [STORM_BLADE.abilityKey], storm: "none", katana: true },
    { tag: "HANDS a ready main-hand Katana keeps the press from the off-hand blade", main: DRAGON_KATANA.itemId, off: STORM_BLADE.itemId, cooling: [], storm: "none", katana: true },
  ];
  for (const c of cases) {
    await reset(test, w);
    await setHands(c.main, c.off);
    for (const key of c.cooling) startCooldown(w, key);
    await aimLevel(test, w, 0);
    const sbBefore = w.getDynamicProperty(SB_CD);
    const dkBefore = w.getDynamicProperty(DK_CD);
    const r0 = releasesBy(w).length;
    const j0 = jumpsBy(w).length;
    // In-test control: what a module reading the hands live after the Katana's handler would resolve.
    let liveAfterKatana = "unread";
    const late = world.afterEvents.itemUse.subscribe((e) => {
      const src: Player | undefined = e.source;
      if (src?.id !== w.id) return;
      const r = resolveActivation(w);
      liveAfterKatana = r === undefined ? "none" : `${r.slot}/${r.def.itemId}`;
    });
    try {
      await press(test, w);
      await test.idle(4);
    } finally {
      world.afterEvents.itemUse.unsubscribe(late);
    }
    const made = releasesBy(w).slice(r0);
    const jumped = jumpsBy(w)
      .slice(j0)
      .filter((a) => a.jumped).length;
    const stormSlot = made.length === 0 ? "none" : made.length === 1 && made[0].activation.released ? made[0].activation.slot : `${made.length} activations`;
    const sbAfter = w.getDynamicProperty(SB_CD);
    if (stormSlot !== c.storm) fails.push(`${c.tag}: the blade fired from ${stormSlot}, expected ${c.storm}`);
    if ((jumped === 1) !== c.katana || jumped > 1) fails.push(`${c.tag}: the Katana jumped ${jumped} times, expected ${c.katana ? 1 : 0}`);
    if (c.storm === "none" && !Object.is(sbBefore, sbAfter)) fails.push(`${c.tag}: the blade's timer was written ${String(sbBefore)} -> ${String(sbAfter)}`);
    if (c.storm !== "none") cooldownOk(fails, c.tag, made[0]);
    if (c.tag.startsWith("HANDS a ready main-hand Katana") && liveAfterKatana !== `${EquipmentSlot.Offhand}/${STORM_BLADE.itemId}`) {
      fails.push(`${c.tag} control: after the Katana's handler the live hands read ${liveAfterKatana}, not the off-hand blade; the case proves nothing`);
    }
    log(
      `${c.tag} ROW storm=${stormSlot} katanaJumps=${jumped} liveAfterKatana=${liveAfterKatana} sb ${String(sbBefore)} -> ${String(sbAfter)} dk ${String(dkBefore)} -> ${String(w.getDynamicProperty(DK_CD))}`
    );
  }
});

// ---------------------------------------------------------------- AC7: one shared interval, nothing while idle

scenario("storm_active_one_interval", 400, async ({ test, arena, players, fails }) => {
  runway(arena, 14);
  const a = await wielder(test, players, "loop_a", { main: STORM_BLADE.itemId }, { x: 2, y: START.y, z: 1 });
  const b = await wielder(test, players, "loop_b", { main: STORM_BLADE.itemId }, { x: 2, y: START.y, z: 5 });
  const ta = await target(test, players, "loop_ta", { x: 7.5, y: START.y, z: 1.5 });
  await aimLevel(test, a, 0);
  await aimLevel(test, b, 0);
  await test.idle(SETTLE);
  const idle0 = visualStats();
  await test.idle(20);
  const idle1 = visualStats();
  if (idle0.running || idle1.loopRuns !== idle0.loopRuns) fails.push(`IDLE: the visuals loop ran without a release (${idle0.loopRuns} -> ${idle1.loopRuns}, running=${idle0.running})`);

  // Two releases in one tick: one hits, one misses.
  const tick = system.currentTick;
  const ra = activate(a);
  const rb = activate(b);
  const same = system.currentTick === tick;
  const during = visualStats();
  const runs: number[] = [];
  for (let i = 0; i < 10; i++) {
    await test.idle(1);
    const s = visualStats();
    runs.push(s.running ? 1 : 0);
  }
  const after = visualStats();
  await test.idle(40);
  const late = visualStats();
  if (!(ra?.released === true && rb?.released === true && same)) fails.push(`LOOP: releases ${ra?.released}/${rb?.released} in one tick=${same}`);
  if (during.loopStarts - idle1.loopStarts !== 1) fails.push(`LOOP: ${during.loopStarts - idle1.loopStarts} intervals for two releases, expected one`);
  if (during.particles !== idle1.particles) fails.push("LOOP: particles were drawn in the release tick, outside the interval");
  if (after.running || after.queued !== 0) fails.push(`LOOP: still running after 10 ticks (queued ${after.queued})`);
  if (late.loopRuns !== after.loopRuns) fails.push(`LOOP: the loop kept running after the last strike (${after.loopRuns} -> ${late.loopRuns})`);
  if (after.particles - idle1.particles <= 0 || after.sounds - idle1.sounds !== ACTIVE_STRIKE_DELAYS.length) {
    fails.push(`LOOP: ${after.particles - idle1.particles} particles and ${after.sounds - idle1.sounds} sounds, expected some and ${ACTIVE_STRIKE_DELAYS.length}`);
  }
  log(
    `LOOP ROW releases a=${ra?.targetType ?? "none"} b=${rb?.targetType ?? "none"} sameTick=${same} loopStarts+${during.loopStarts - idle1.loopStarts} ` +
      `runningByTick=${runs.join("")} loopRuns+${after.loopRuns - idle1.loopRuns} particles+${after.particles - idle1.particles} sounds+${after.sounds - idle1.sounds} ` +
      `refused+${after.refused - idle1.refused} idleRuns+${late.loopRuns - after.loopRuns} target=${hurtText(hurtsSince(ta, tick))}`
  );
});
