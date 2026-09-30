// The RMB rings on a real engine (L0-ring-ac11…ac18, as01…as05; RG-1…RG-3).
//
// Shots go through activate() with the event's block, so the charges fly with
// orbc; the owner is moved off the pad in the firing tick unless the scenario
// is about the owner. Every site is its own stone pad away from the platform,
// under ticking areas. The probes call createExplosion themselves, or detonate
// through the registered RMB effect, the call the flight makes on contact.

import {
  BlockVolume,
  type Container,
  Difficulty,
  Dimension,
  Direction,
  Entity,
  type ExplosionOptions,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import * as cooldown from "../legendary/cooldown";
import { type LegendaryDef, ORBITAL_CANNON, SCYTHE_OF_CALAMITY, WEB_SWORD } from "../legendary/registry";
import * as state from "../legendary/state";
import { activate } from "../orbital/activation";
import { CHARGE_ENTITY_ID, type Effect, attackTag, effectFor, registerEffect } from "../orbital/charge";
import { type Attack, flightLoop, observeChargeEnds } from "../orbital/flight";
import { RING_EFFECT, RING_MAX_BLASTS_PER_TICK, type RingReport, observeRingReports, ringLoop } from "../orbital/ring";
import { RING_LAYOUT, layout } from "../orbital/ring-layout";
import { STUB_EFFECTS } from "../orbital/stub-effect";
import { arm, goTo } from "./orbital-core";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const KEY = ORBITAL_CANNON.abilityKey;
const FILL_CELLS = 32768;
/** The shipped layout's own half-width, so the pad follows the diameter table instead of a copy of it. */
const FOOTPRINT = Math.max(...RING_LAYOUT.columns.map((c) => Math.max(Math.abs(c.x), Math.abs(c.z))));
/** Footprint + the protection margin, the far edge a blast of this attack can still touch. */
const REACH = FOOTPRINT + 8;
/** Pad half-width: everything a blast reaches, plus the drop-spot rings around it. */
const PAD = REACH + 6;
const LOAD = PAD + 20;
const PAD_LAYERS = 9;

const log = (msg: string): void => console.warn(`[gametest] ring ${msg}`);
const fmt = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const fmt1 = (v: Vector3): string => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;
const BLOCK_DROPS: ReadonlySet<string> = new Set(["minecraft:stone", "minecraft:cobblestone", "minecraft:dirt", "minecraft:grass_block", "minecraft:oak_planks", "minecraft:chest"]);

// ---------------------------------------------------------------- helpers

function fill(dim: Dimension, min: Vector3, max: Vector3, type: string): void {
  const area = (max.x - min.x + 1) * (max.z - min.z + 1);
  const slab = Math.max(1, Math.floor(FILL_CELLS / area));
  for (let y = min.y; y <= max.y; y += slab) {
    dim.fillBlocks(new BlockVolume({ x: min.x, y, z: min.z }, { x: max.x, y: Math.min(max.y, y + slab - 1), z: max.z }), type);
  }
}

interface Site {
  dim: Dimension;
  cx: number;
  cz: number;
  /** The pad's top layer: the target block's y. */
  top: number;
  target: Vector3;
  /** Off the pad, on the flat ground, far from every blast and every drop spot. */
  park: Vector3;
  unload: () => void;
}

/** A stone pad at site `k` (each 150 blocks apart on −z), `half` around the centre and `wideX` more on each side in x, loaded with a margin. */
async function site(test: Test, name: string, k: number, half = PAD, wideX = 0): Promise<Site> {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const cx = origin.x;
  const cz = origin.z - 200 - 150 * k;
  const min = dim.heightRange.min;
  const top = min + PAD_LAYERS;
  const unload = await loadBox(test, dim, name, { min: [cx - LOAD - wideX, 0, cz - LOAD], max: [cx + LOAD + wideX, 0, cz + LOAD] });
  fill(dim, { x: cx - half - wideX, y: min + 1, z: cz - half }, { x: cx + half + wideX, y: top, z: cz + half }, "minecraft:stone");
  fill(dim, { x: cx - half - wideX, y: top + 1, z: cz - half }, { x: cx + half + wideX, y: top + 40, z: cz + half }, "minecraft:air");
  return { dim, cx, cz, top, target: { x: cx, y: top, z: cz }, park: { x: cx, y: min + 4, z: cz - 40 }, unload };
}

function watchReports(): { of: (id: string) => RingReport | undefined; stop: () => void } {
  const seen = new Map<string, RingReport>();
  const stop = observeRingReports((r) => seen.set(r.attackId, { ...r, blastsByTick: [...r.blastsByTick] }));
  return { of: (id) => seen.get(id), stop };
}

async function untilReport(test: Test, reports: { of: (id: string) => RingReport | undefined }, attackId: string, limit = 300): Promise<RingReport> {
  for (let t = 0; t < limit; t++) {
    const r = reports.of(attackId);
    if (r !== undefined) return r;
    await test.idle(1);
  }
  throw new Error(`attack ${attackId}: no ring report ${limit} ticks later`);
}

function brief(r: RingReport): string {
  return (
    `charges ${r.charges} blasts ${r.blasts} underwater ${r.underwater} lost ${r.lost} failed ${r.failed} maxBlastsInTick ${r.maxBlastsInTick} ` +
    `ticksToDrain ${r.ticksToDrain} maxQueueTicks ${r.maxQueueTicks} itemsSuppressed ${r.itemsSuppressed} legendariesMoved ${r.legendariesMoved} ` +
    `handedBack ${r.legendariesHandedBack} protectCalls ${r.protectCalls} blastsByTick [${r.blastsByTick.join(",")}]`
  );
}

function captureWarnings(): { lines: string[]; stop(): void } {
  const original = console.warn;
  const lines: string[] = [];
  console.warn = (...args: unknown[]): void => {
    lines.push(args.map(String).join(" "));
    original(...args);
  };
  return { lines, stop: () => void (console.warn = original) };
}

/** What registerOrbitalCannon registered for RMB, captured before the other scenarios get the stub back. */
let cannonRmb: Effect | undefined;

export function parkRing(): void {
  cannonRmb = effectFor("rmb");
  registerEffect("rmb", STUB_EFFECTS.rmb);
}

/** The rings as the RMB effect for one scenario; returns the restore. */
function useRealRmb(test: Test): () => void {
  test.assert(cannonRmb === RING_EFFECT, "registerOrbitalCannon did not register the rings for RMB");
  const was = effectFor("rmb");
  registerEffect("rmb", RING_EFFECT);
  return () => {
    if (was !== undefined) registerEffect("rmb", was);
  };
}

interface Blast {
  at: Vector3;
  radius: number;
  options: ExplosionOptions | undefined;
  tick: number;
}

/** Every createExplosion this runtime makes on any dimension while armed and the engine accepts; a call that throws is not a blast. */
function spyExplosions(): { calls: Blast[]; restore: () => void } {
  const calls: Blast[] = [];
  const proto = Dimension.prototype;
  const original = proto.createExplosion;
  proto.createExplosion = function (this: Dimension, location: Vector3, radius: number, options?: ExplosionOptions): boolean {
    const made = original.call(this, location, radius, options);
    calls.push({ at: { ...location }, radius, options: options === undefined ? undefined : { ...options }, tick: system.currentTick });
    return made;
  };
  return { calls, restore: () => void (proto.createExplosion = original) };
}

async function owner(test: Test, s: Site, name: string, stand: Vector3): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(STAND, name, GameMode.Survival);
  await test.idle(4);
  arm(p);
  cooldown.clearCooldown(p, KEY);
  await goTo(test, p, s.dim, stand);
  return p;
}

function fireRmb(player: Player, dim: Dimension, at: Vector3): Attack {
  const block = dim.getBlock(at);
  if (block === undefined) throw new Error(`no loaded block at ${fmt(at)}`);
  const attack = activate(player, "rmb", block, Direction.Up);
  if (attack === undefined) throw new Error(`${player.name} did not fire RMB at ${fmt(at)}`);
  return attack;
}

function itemsIn(dim: Dimension, s: { cx: number; cz: number; top: number }, reach = REACH): Entity[] {
  return dim.getEntities({ type: "minecraft:item", location: { x: s.cx - reach, y: s.top - 12, z: s.cz - reach }, volume: { x: 2 * reach, y: 24, z: 2 * reach } });
}

function stackOf(e: Entity): ItemStack | undefined {
  try {
    return e.getComponent("minecraft:item")?.itemStack;
  } catch {
    return undefined;
  }
}

/** Item amounts and orb counts by type. */
function amounts(xs: Spawned[]): string {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x.item, (m.get(x.item) ?? 0) + x.amount);
  return [...m].map(([k, n]) => `${k.replace("minecraft:", "")} ${n}`).join(", ") || "none";
}

function countBy<T>(xs: T[], key: (x: T) => string): string {
  const m = new Map<string, number>();
  for (const x of xs) m.set(key(x), (m.get(key(x)) ?? 0) + 1);
  return [...m].map(([k, n]) => `${k.replace("minecraft:", "")}×${n}`).join(" ") || "none";
}

interface Spawned {
  id: string;
  type: string;
  item: string;
  amount: number;
  at: Vector3;
  tick: number;
}

function readDrop(en: Entity): Spawned | undefined {
  try {
    if (!en.isValid || (en.typeId !== "minecraft:item" && en.typeId !== "minecraft:xp_orb")) return undefined;
    const stack = en.typeId === "minecraft:item" ? stackOf(en) : undefined;
    return { id: en.id, type: en.typeId, item: stack?.typeId ?? en.typeId, amount: stack?.amount ?? 1, at: { ...en.location }, tick: system.currentTick };
  } catch {
    return undefined;
  }
}

/**
 * Items and XP orbs that appeared while armed, not counting `known` ids. A drop
 * that a later blast of the same step destroys is gone before its spawn event
 * is read, so it is read as it is removed instead.
 */
function watchSpawns(known: ReadonlySet<string> = new Set()): { spawns: Spawned[]; removed: Spawned[]; stop: () => void } {
  const seen = new Map<string, Spawned>();
  const removed: Spawned[] = [];
  const add = (d: Spawned | undefined): void => {
    if (d !== undefined && !known.has(d.id) && !seen.has(d.id)) seen.set(d.id, d);
  };
  const spawn = world.afterEvents.entitySpawn.subscribe((e) => add(readDrop(e.entity)));
  const remove = world.beforeEvents.entityRemove.subscribe((e) => {
    const d = readDrop(e.removedEntity);
    add(d);
    if (d !== undefined) removed.push(d);
  });
  return {
    get spawns() {
      return [...seen.values()];
    },
    removed,
    stop: () => {
      world.afterEvents.entitySpawn.unsubscribe(spawn);
      world.beforeEvents.entityRemove.unsubscribe(remove);
    },
  };
}

interface Hurt {
  id: string;
  cause: string;
  damage: number;
  tick: number;
}

function watchHarm(): { hurts: Hurt[]; deaths: Map<string, { cause: string; by: string | undefined; tick: number }>; stop: () => void } {
  const hurts: Hurt[] = [];
  const deaths = new Map<string, { cause: string; by: string | undefined; tick: number }>();
  const h = world.afterEvents.entityHurt.subscribe((e) => hurts.push({ id: e.hurtEntity.id, cause: e.damageSource.cause, damage: e.damage, tick: system.currentTick }));
  const d = world.afterEvents.entityDie.subscribe((e) => {
    let by: string | undefined;
    try {
      by = e.damageSource.damagingEntity?.id;
    } catch {
      by = "unreadable";
    }
    deaths.set(e.deadEntity.id, { cause: e.damageSource.cause, by, tick: system.currentTick });
  });
  return {
    hurts,
    deaths,
    stop: () => {
      world.afterEvents.entityHurt.unsubscribe(h);
      world.afterEvents.entityDie.unsubscribe(d);
    },
  };
}

/**
 * What the blasts cost `id`: all it had if it died, else the explosion damage
 * its hurt events carry. Hits landing together do not each report their full
 * damage, so a sum undercounts a death.
 */
function blastLoss(hurts: Hurt[], id: string, before: number, died: boolean): number {
  if (died) return before;
  return Math.min(before, hurts.filter((h) => h.id === id && /xplosion/i.test(h.cause)).reduce((n, h) => n + h.damage, 0));
}

function hitsOf(hurts: Hurt[], id: string): string {
  return hurts.filter((h) => h.id === id).map((h) => `${h.cause.replace("Explosion", "X")}:${h.damage.toFixed(2)}`).join(" ") || "none";
}

function health(e: Entity): number {
  try {
    return e.isValid ? (e.getComponent("minecraft:health")?.currentValue ?? 0) : 0;
  } catch {
    return 0;
  }
}

let zombieSeq = 0;

/**
 * A zombie that stays put and does not burn. Summoned with a name: a spawned
 * mob far from every player despawns within ticks, and only a summon's name
 * keeps it (a script nameTag does not).
 */
function zombie(dim: Dimension, at: Vector3): Entity {
  const name = `ring_z${++zombieSeq}`;
  dim.runCommand(`summon minecraft:zombie "${name}" ${at.x} ${at.y} ${at.z}`);
  const z = dim.getEntities({ type: "minecraft:zombie", name })[0];
  if (z === undefined) throw new Error(`summon zombie at ${fmt1(at)} made nothing`);
  z.addEffect("slowness", 2400, { amplifier: 255, showParticles: false });
  z.addEffect("fire_resistance", 2400, { amplifier: 0, showParticles: false });
  return z;
}

async function continuationTicks(test: Test, ticks: number, first?: () => void): Promise<number[]> {
  const out: number[] = [];
  let last = Date.now();
  first?.();
  for (let i = 0; i < ticks; i++) {
    await test.idle(1);
    const now = Date.now();
    out.push(now - last);
    last = now;
  }
  return out;
}

function longestRunOver(ticks: number[], limit: number): number {
  let run = 0;
  let longest = 0;
  for (const ms of ticks) {
    run = ms > limit ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return longest;
}

const cellAt = (s: Site, c: { x: number; z: number }, dy = 0): Vector3 => ({ x: s.cx + c.x, y: s.top + dy, z: s.cz + c.z });
const typeAt = (dim: Dimension, at: Vector3): string => dim.getBlock(at)?.typeId ?? "unloaded";

// ---------------------------------------------------------------- engine facts the README cites (as01–as04)

registerAsync("andrew", "probe_ring_drops", async (test: Test): Promise<void> => {
  const restore = useRealRmb(test);
  const difficulty = world.getDifficulty();
  const spawns = watchSpawns();
  const harm = watchHarm();
  const reports = watchReports();
  const sites: Site[] = [];
  const extras: Entity[] = [];
  const probe = (msg: string): void => console.warn(`[gametest] [probe] ring ${msg}`);
  try {
    world.setDifficulty(Difficulty.Easy);
    probe(`RESULT gamerules at start: doTileDrops ${world.gameRules.doTileDrops} doMobLoot ${world.gameRules.doMobLoot} keepInventory ${world.gameRules.keepInventory} doEntityDrops ${world.gameRules.doEntityDrops}`);

    // as01: a script explosion with the rule on drops what it breaks, and a destroyed chest spills.
    const a = await site(test, "andrew_gt_ring_p1", 0, 8);
    sites.push(a);
    fill(a.dim, { x: a.cx - 4, y: a.top - 1, z: a.cz - 4 }, { x: a.cx + 4, y: a.top, z: a.cz + 4 }, "minecraft:dirt");
    a.dim.setBlockType({ x: a.cx + 2, y: a.top + 1, z: a.cz }, "minecraft:chest");
    a.dim.getBlock({ x: a.cx + 2, y: a.top + 1, z: a.cz })?.getComponent("minecraft:inventory")?.container?.setItem(0, new ItemStack("minecraft:cobblestone", 10));
    await test.idle(2);
    let from = spawns.spawns.length;
    a.dim.createExplosion({ x: a.cx + 0.5, y: a.top + 1.5, z: a.cz + 0.5 }, 4, { breaksBlocks: true, allowUnderwater: true, causesFire: false });
    await test.idle(10);
    probe(
      `as01 RESULT script createExplosion power 4, doTileDrops ${world.gameRules.doTileDrops}, 9×9 dirt-over-stone pad + chest(10 cobblestone): ` +
        `spawned [${amounts(spawns.spawns.slice(from))}]; ` +
        `on the ground now [${countBy(itemsIn(a.dim, a, 10), (e) => stackOf(e)?.typeId ?? "?")}]; chest cell ${typeAt(a.dim, { x: a.cx + 2, y: a.top + 1, z: a.cz })}`
    );

    // as02: the same through the ring's window, with a zombie and a player carrying 5 diamonds next to it.
    const b = await site(test, "andrew_gt_ring_p2", 1, 8);
    sites.push(b);
    fill(b.dim, { x: b.cx - 4, y: b.top - 1, z: b.cz - 4 }, { x: b.cx + 4, y: b.top, z: b.cz + 4 }, "minecraft:dirt");
    b.dim.setBlockType({ x: b.cx + 2, y: b.top + 1, z: b.cz }, "minecraft:chest");
    b.dim.getBlock({ x: b.cx + 2, y: b.top + 1, z: b.cz })?.getComponent("minecraft:inventory")?.container?.setItem(0, new ItemStack("minecraft:cobblestone", 10));
    const v = test.spawnSimulatedPlayer(STAND, "ring_probe_v", GameMode.Survival);
    await test.idle(4);
    v.getComponent("minecraft:inventory")?.container?.addItem(new ItemStack("minecraft:diamond", 5));
    await goTo(test, v, b.dim, { x: b.cx, y: b.top + 1, z: b.cz + 2 });
    const z = zombie(b.dim, { x: b.cx - 1.5, y: b.top + 1, z: b.cz + 0.5 });
    extras.push(z);
    await test.idle(10);
    from = spawns.spawns.length;
    const pid = `gt-ringprobe-${system.currentTick}`;
    const before = world.gameRules.doTileDrops;
    RING_EFFECT.onDetonate(b.dim, { x: b.cx, y: b.top, z: b.cz }, "nobody", "rmb", pid);
    const r2 = await untilReport(test, reports, pid, 40);
    await test.idle(20);
    const got = spawns.spawns.slice(from);
    probe(
      `as02 RESULT one ring blast (window: doTileDrops ${before} -> false -> ${world.gameRules.doTileDrops}) over dirt/stone + chest(10 cobblestone) + zombie + player(5 diamonds): ` +
        `${brief(r2)}; spawned [${amounts(got)}]; on the ground now [${countBy(itemsIn(b.dim, b, 10), (e) => stackOf(e)?.typeId ?? "?")}]; ` +
        `zombie ${harm.deaths.has(z.id) ? `died (${harm.deaths.get(z.id)?.cause})` : `alive hp ${health(z)}`}, player ${harm.deaths.has(v.id) ? `died (${harm.deaths.get(v.id)?.cause})` : `alive hp ${health(v)}`}; ` +
        `chest cell ${typeAt(b.dim, { x: b.cx + 2, y: b.top + 1, z: b.cz })}`
    );

    // as03: does `source` spare its entity? Zombies 4 blocks from no-break blasts 16 apart (12 from the next), with and without
    // being the source; then whether the engine takes a SimulatedPlayer as a source at all.
    const c = await site(test, "andrew_gt_ring_p3", 2, 30);
    sites.push(c);
    const loss: string[] = [];
    for (const [i, withSource] of [true, false, true, false].entries()) {
      const x = c.cx - 24 + 16 * i;
      const zz = zombie(c.dim, { x: x + 4.5, y: c.top + 1, z: c.cz + 0.5 });
      extras.push(zz);
      await test.idle(10);
      const hp = health(zz);
      const opts: ExplosionOptions = { breaksBlocks: false, allowUnderwater: true, causesFire: false };
      if (withSource) opts.source = zz;
      c.dim.createExplosion({ x: x + 0.5, y: c.top + 1.5, z: c.cz + 0.5 }, 4, opts);
      await test.idle(10);
      const d = harm.deaths.get(zz.id);
      loss.push(`zombie ${withSource ? "source=self" : "no source"}: hp ${hp} -> ${d !== undefined ? `dead (${d.cause}, by ${d.by === zz.id ? "self" : d.by})` : health(zz)}, hurt [${harm.hurts.filter((h) => h.id === zz.id).map((h) => `${h.cause}:${h.damage.toFixed(1)}`).join(" ")}]`);
    }
    const sp = test.spawnSimulatedPlayer(STAND, "ring_probe_src", GameMode.Survival);
    await test.idle(4);
    let simSource = "accepted";
    try {
      c.dim.createExplosion({ x: c.cx + 0.5, y: c.top + 30.5, z: c.cz + 0.5 }, 1, { breaksBlocks: false, source: sp });
    } catch (err) {
      simSource = `refused: ${String(err)}`;
    }
    let simById = "accepted";
    try {
      c.dim.createExplosion({ x: c.cx + 0.5, y: c.top + 30.5, z: c.cz + 0.5 }, 1, { breaksBlocks: false, source: world.getEntity(sp.id) });
    } catch (err) {
      simById = `refused: ${String(err)}`;
    }
    probe(`as03 RESULT power 4 at 4 blocks, breaksBlocks false: ${loss.join(" | ")}; a SimulatedPlayer as source: ${simSource}; the same via world.getEntity: ${simById}`);

    // as04: centred in water 2.5 below the surface of a 5-deep pool, both allowUnderwater values.
    for (const allow of [true, false]) {
      const w = await site(test, allow ? "andrew_gt_ring_p4" : "andrew_gt_ring_p5", allow ? 3 : 4, 12);
      sites.push(w);
      fill(w.dim, { x: w.cx - 6, y: w.top - 4, z: w.cz - 6 }, { x: w.cx + 6, y: w.top, z: w.cz + 6 }, "minecraft:water");
      const zz = zombie(w.dim, { x: w.cx + 2.5, y: w.top - 4, z: w.cz + 0.5 });
      extras.push(zz);
      const p = test.spawnSimulatedPlayer(STAND, allow ? "ring_probe_sea" : "ring_probe_sea_off", GameMode.Survival);
      await test.idle(4);
      p.teleport({ x: w.cx - 3.5, y: w.top - 4, z: w.cz + 0.5 }, { dimension: w.dim });
      await test.idle(10);
      const snap = new BlockVolume({ x: w.cx - 7, y: Math.max(w.dim.heightRange.min, w.top - 10), z: w.cz - 7 }, { x: w.cx + 7, y: w.top + 3, z: w.cz + 7 });
      const beforeTypes = [...snap.getBlockLocationIterator()].map((l) => typeAt(w.dim, l));
      const hp = { z: health(zz), p: health(p) };
      w.dim.createExplosion({ x: w.cx + 0.5, y: w.top - 2.5, z: w.cz + 0.5 }, 4, { breaksBlocks: false, allowUnderwater: allow, causesFire: false });
      await test.idle(10);
      const afterTypes = [...snap.getBlockLocationIterator()].map((l) => typeAt(w.dim, l));
      const changed = afterTypes.filter((t, i) => t !== beforeTypes[i]).length;
      const hurt = (e: Entity): string => harm.hurts.filter((h) => h.id === e.id).map((h) => `${h.cause}:${h.damage.toFixed(1)}`).join(" ") || "none";
      probe(
        `as04 RESULT blast in water (breaksBlocks false, allowUnderwater ${allow}): cells changed ${changed} of ${beforeTypes.length}; ` +
          `zombie 2.0 away hp ${hp.z} -> ${harm.deaths.has(zz.id) ? "dead" : health(zz)} hurt [${hurt(zz)}]; player 4.0 away hp ${hp.p} -> ${harm.deaths.has(p.id) ? "dead" : health(p)} hurt [${hurt(p)}]`
      );
    }

    // Blast height at the edge of reach: a player 7 blocks out from a power-4 script explosion 1.0 and 1.5 above the pad,
    // from primed vanilla TNT resting on the pad, and from primed TNT resting on a bottom slab (0.5 higher).
    const hsite = await site(test, "andrew_gt_ring_p7", 20, PAD, 100);
    sites.push(hsite);
    const script = (dx: number, dy: number, options: ExplosionOptions) => (): void => void hsite.dim.createExplosion({ x: hsite.cx + dx + 0.5, y: hsite.top + dy, z: hsite.cz + 0.5 }, 4, options);
    const heights: Array<{ name: string; blast: () => void; dx: number }> = [
      { name: "script +1.0 {breaksBlocks:false}", dx: -120, blast: script(-120, 1.0, { breaksBlocks: false }) },
      { name: "script +1.5 {breaksBlocks:false}", dx: -90, blast: script(-90, 1.5, { breaksBlocks: false }) },
      { name: "script +1.5 {}", dx: -60, blast: script(-60, 1.5, {}) },
      { name: "script +1.5 {breaksBlocks:true}", dx: -30, blast: script(-30, 1.5, { breaksBlocks: true }) },
      { name: "script +1.5 {allowUnderwater:true}", dx: 0, blast: script(0, 1.5, { allowUnderwater: true }) },
      { name: "script +1.5 {causesFire:false}", dx: 30, blast: script(30, 1.5, { causesFire: false }) },
      { name: "script +1.5 ring's {breaksBlocks:true, allowUnderwater:true, causesFire:false}", dx: 60, blast: script(60, 1.5, { breaksBlocks: true, allowUnderwater: true, causesFire: false }) },
      { name: "TNT on the pad", dx: 90, blast: () => extras.push(primedTnt(hsite.dim, { x: hsite.cx + 90 + 0.5, y: hsite.top + 1, z: hsite.cz + 0.5 })) },
      {
        name: "TNT on a bottom slab",
        dx: 120,
        blast: () => {
          hsite.dim.setBlockType({ x: hsite.cx + 120, y: hsite.top + 1, z: hsite.cz }, "minecraft:smooth_stone_slab");
          extras.push(primedTnt(hsite.dim, { x: hsite.cx + 120 + 0.5, y: hsite.top + 1.5, z: hsite.cz + 0.5 }));
        },
      },
    ];
    const edge: SimulatedPlayer[] = [];
    for (const [i, hgt] of heights.entries()) {
      const pl = test.spawnSimulatedPlayer(STAND, `ring_probe_h${i}`, GameMode.Survival);
      await test.idle(2);
      await goTo(test, pl, hsite.dim, { x: hsite.cx + hgt.dx, y: hsite.top + 1, z: hsite.cz + 7 });
      edge.push(pl);
    }
    await test.idle(10);
    const hp0 = edge.map((pl) => health(pl));
    for (const hgt of heights) hgt.blast();
    await test.idle(100);
    probe(`height RESULT a player 7 blocks out, explosion damage taken: ${heights.map((hgt, i) => `${hgt.name} ${blastLoss(harm.hurts, edge[i].id, hp0[i], harm.deaths.has(edge[i].id)).toFixed(2)} [${hitsOf(harm.hurts, edge[i].id)}]`).join(", ")}`);

    // XP reference (L0-ring-r006 "XP stays vanilla"): a zombie killed by TNT a player lit, by TNT nobody lit, and by a ring blast.
    const x = await site(test, "andrew_gt_ring_p6", 19, PAD, 20);
    sites.push(x);
    const xpWatch = watchSpawns();
    const lighter = test.spawnSimulatedPlayer(STAND, "ring_probe_lighter", GameMode.Survival);
    await test.idle(4);
    const cases = ["player-lit TNT", "script-primed TNT", "ring blast"].map((name, i) => ({ name, at: { x: x.cx - 30 + 30 * i, y: x.top + 1, z: x.cz } }));
    const victims = cases.map((c) => zombie(x.dim, { x: c.at.x + 2.5, y: c.at.y, z: c.at.z + 0.5 }));
    extras.push(...victims);
    x.dim.setBlockType(cases[0].at, "minecraft:tnt");
    lighter.getComponent("minecraft:inventory")?.container?.setItem(0, new ItemStack("minecraft:flint_and_steel", 1));
    lighter.selectedSlotIndex = 0;
    await goTo(test, lighter, x.dim, { x: cases[0].at.x - 2, y: x.top + 1, z: cases[0].at.z });
    const lit = lighter.useItemInSlotOnBlock(0, test.relativeBlockLocation(cases[0].at), Direction.Up);
    await test.idle(2);
    lighter.teleport(x.park);
    extras.push(x.dim.spawnEntity("minecraft:tnt", { x: cases[1].at.x + 0.5, y: cases[1].at.y, z: cases[1].at.z + 0.5 }));
    const xpRing = `gt-ringxp-${system.currentTick}`;
    RING_EFFECT.onDetonate(x.dim, { x: cases[2].at.x, y: x.top, z: cases[2].at.z }, lighter.id, "rmb", xpRing);
    await test.idle(110);
    xpWatch.stop();
    const near = (sp: Spawned, at: Vector3): boolean => Math.hypot(sp.at.x - at.x, sp.at.z - at.z) <= 8;
    probe(
      `xp RESULT a zombie 2 blocks from each: ` +
        cases
          .map((c, i) => {
            const d = harm.deaths.get(victims[i].id);
            const orbs = xpWatch.spawns.filter((sp) => sp.type === "minecraft:xp_orb" && near(sp, c.at)).length;
            const loot = xpWatch.spawns.filter((sp) => sp.type === "minecraft:item" && near(sp, c.at));
            return `${c.name}${i === 0 ? ` (flint and steel used: ${lit})` : ""}: ${d === undefined ? `alive hp ${health(victims[i])}` : `died ${d.cause}, killer ${d.by === lighter.id ? "the lighter" : (d.by ?? "none")}`}, xp orbs ${orbs}, items [${amounts(loot)}]`;
          })
          .join(" | ")
    );
    test.succeed();
  } finally {
    restore();
    spawns.stop();
    harm.stop();
    reports.stop();
    world.setDifficulty(difficulty);
    for (const e of extras) if (e.isValid) e.remove();
    for (const s of sites) s.unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ---------------------------------------------------------------- AC#1 — L0-ring-ac11

registerAsync("andrew", "ring_layout_craters", async (test: Test): Promise<void> => {
  const restore = useRealRmb(test);
  const reports = watchReports();
  const s = await site(test, "andrew_gt_ring_1", 5);
  try {
    const a = await owner(test, s, "ring_ac1_a", { x: s.cx + 2, y: s.top + 1, z: s.cz + 1 });
    const tick = system.currentTick;
    const attack = fireRmb(a, s.dim, s.target);
    const charges = s.dim.getEntities({ type: CHARGE_ENTITY_ID, tags: [attackTag(attack.attackId)] });
    const inTick = system.currentTick === tick;
    a.teleport(s.park);
    const cols = layout(s.target);
    const want = new Set(cols.map((c) => `${c.x},${c.z}`));
    const got = charges.map((e) => ({ x: Math.floor(e.location.x), z: Math.floor(e.location.z), y: e.location.y }));
    const offColumn = got.filter((g) => !want.has(`${g.x},${g.z}`));
    const distinct = new Set(got.map((g) => `${g.x},${g.z}`)).size;
    const wrongY = got.filter((g) => g.y !== s.top + 30);
    const r = await untilReport(test, reports, attack.attackId);
    await test.idle(10);
    const craters = cols.filter((c) => s.dim.getBlock({ x: c.x, y: s.top, z: c.z })?.isAir === true);
    // Corners past everything a blast can touch, still on the stone pad.
    const corner = REACH + 4;
    const far = [
      { x: corner, z: corner },
      { x: -corner, z: corner },
      { x: corner, z: -corner },
      { x: -corner, z: -corner },
    ].filter((c) => typeAt(s.dim, cellAt(s, c)) !== "minecraft:stone");
    log(
      `ac1 RESULT attack ${attack.attackId}: in the activation tick ${inTick}, charges ${charges.length}, layout().length ${cols.length}, distinct columns ${distinct}, ` +
        `off-layout ${offColumn.length}, y != target.y+30 (${s.top + 30}) ${wrongY.length}; ${brief(r)}; cratered columns ${craters.length}/${cols.length}; far corner cells not stone ${far.length}`
    );
    test.assert(inTick, "the charges were counted after the activation tick");
    test.assert(charges.length === cols.length && cols.length === RING_LAYOUT.count, `charges ${charges.length}, layout ${cols.length}`);
    test.assert(distinct === cols.length && offColumn.length === 0, `columns: ${distinct} distinct, ${offColumn.length} off the layout`);
    test.assert(wrongY.length === 0, `${wrongY.length} charge(s) not at y ${s.top + 30}: ${wrongY.slice(0, 3).map((g) => g.y).join(",")}`);
    test.assert(r.blasts === cols.length && r.lost === 0 && r.failed === 0, brief(r));
    test.assert(craters.length === cols.length, `${cols.length - craters.length} layout column(s) with no crater: ${cols.filter((c) => !craters.includes(c)).slice(0, 5).map((c) => `${c.x - s.cx},${c.z - s.cz}`).join(" ")}`);
    test.assert(far.length === 0, "a cell 16 blocks out on a diagonal changed");
    test.succeed();
  } finally {
    restore();
    reports.stop();
    s.unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ---------------------------------------------------------------- AC#2 — L0-ring-ac12

registerAsync("andrew", "ring_independent_stepped", async (test: Test): Promise<void> => {
  const restore = useRealRmb(test);
  const reports = watchReports();
  const spy = spyExplosions();
  const ends = new Map<string, { outcome: string; tick: number; point: Vector3 | undefined }>();
  const unwatch = observeChargeEnds((e) => {
    try {
      ends.set(e.charge.entity.id, { outcome: e.outcome, tick: e.tick, point: e.point });
    } catch {
      // A removed entity whose id cannot be read is counted as missing below.
    }
  });
  const s = await site(test, "andrew_gt_ring_2", 6);
  let sampler: number | undefined;
  try {
    fill(s.dim, { x: s.cx - PAD, y: s.top + 1, z: s.cz - PAD }, { x: s.cx - 1, y: s.top + 6, z: s.cz + PAD }, "minecraft:stone");
    const a = await owner(test, s, "ring_ac2_a", { x: s.cx + 2, y: s.top + 1, z: s.cz + 1 });
    const attack = fireRmb(a, s.dim, s.target);
    a.teleport(s.park);
    const tracked = new Map<string, { e: Entity; x0: number; z0: number; drift: number; gone: number }>();
    for (const e of s.dim.getEntities({ type: CHARGE_ENTITY_ID, tags: [attackTag(attack.attackId)] })) {
      tracked.set(e.id, { e, x0: e.location.x, z0: e.location.z, drift: 0, gone: -1 });
    }
    // Registered after the flight's interval, so it samples after each fall step.
    sampler = system.runInterval(() => {
      for (const t of tracked.values()) {
        if (t.gone >= 0) continue;
        if (!t.e.isValid) {
          t.gone = system.currentTick;
          continue;
        }
        t.drift = Math.max(t.drift, Math.abs(t.e.location.x - t.x0), Math.abs(t.e.location.z - t.z0));
      }
    }, 1);
    const r = await untilReport(test, reports, attack.attackId);
    await test.idle(4);
    const list = [...tracked.entries()];
    const drift = Math.max(...list.map(([, t]) => t.drift));
    const early = list.filter(([id, t]) => {
      const end = ends.get(id);
      return end === undefined || t.gone < end.tick;
    });
    const detonated = list.filter(([id]) => ends.get(id)?.outcome === "detonated");
    const points = detonated.map(([id]) => ends.get(id)?.point as Vector3);
    const contactTicks = [...new Set(detonated.map(([id]) => ends.get(id)?.tick as number))].sort((x, y) => x - y);
    const calls = spy.calls.filter((c) => c.tick >= contactTicks[0]);
    const callCols = calls.map((c) => `${Math.floor(c.at.x)},${Math.floor(c.at.z)}`);
    const pointCols = points.map((p) => `${p.x},${p.z}`);
    const unmatched = pointCols.filter((k) => !callCols.includes(k));
    const perTick = new Map<number, number>();
    for (const c of calls) perTick.set(c.tick, (perTick.get(c.tick) ?? 0) + 1);
    const lowSide = detonated.filter(([id]) => (ends.get(id)?.point?.y ?? 0) === s.top).length;
    const highSide = detonated.filter(([id]) => (ends.get(id)?.point?.y ?? 0) === s.top + 6).length;
    log(
      `ac2 RESULT attack ${attack.attackId}: charges ${tracked.size}, max x/z drift ${drift.toFixed(4)}, removed before their contact tick ${early.length}, ` +
        `outcomes [${countBy(list, ([id]) => ends.get(id)?.outcome ?? "none")}], contacts on the raised half ${highSide} / lower half ${lowSide} in ticks [${contactTicks.join(",")}]; ` +
        `createExplosion calls ${calls.length} (radius ${[...new Set(calls.map((c) => c.radius))].join(",")}), distinct centres ${new Set(callCols).size}, contacts without their own call ${unmatched.length}; ` +
        `calls per tick [${[...perTick.values()].join(",")}]; ${brief(r)}`
    );
    test.assert(drift <= 0.001, `a charge drifted ${drift} in x/z`);
    test.assert(early.length === 0, `${early.length} charge(s) gone before their contact tick`);
    test.assert(detonated.length === tracked.size, `${tracked.size - detonated.length} charge(s) did not detonate`);
    test.assert(contactTicks.length >= 2 && contactTicks[contactTicks.length - 1] - contactTicks[0] >= 6, `contact ticks [${contactTicks.join(",")}]: the step did not separate them`);
    test.assert(calls.length === detonated.length && r.blasts === detonated.length, `createExplosion ${calls.length}, detonated ${detonated.length}, report ${r.blasts}`);
    test.assert(new Set(callCols).size === calls.length && unmatched.length === 0, "blasts merged or missing: one call per contact column");
    test.assert(calls.every((c) => c.radius === 4), "a blast is not power 4");
    test.assert(r.maxBlastsInTick <= RING_MAX_BLASTS_PER_TICK && [...perTick.values()].every((n) => n <= RING_MAX_BLASTS_PER_TICK), `maxBlastsInTick ${r.maxBlastsInTick}`);
    test.succeed();
  } finally {
    if (sampler !== undefined) system.clearRun(sampler);
    unwatch();
    spy.restore();
    restore();
    reports.stop();
    s.unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(700)
  .tag("andrew");

// ---------------------------------------------------------------- AC#3 — L0-ring-ac13, r004, as03

interface Subject {
  name: string;
  rel: Vector3;
  kind: "player" | "zombie";
}

/** A 2 blocks outside the ring-5 line, B 2 inside the ring-15 line, a zombie on ring 10 (L0-ring-ac13). */
const SUBJECTS: Subject[] = [
  { name: "A", rel: { x: 5, y: 1, z: 0 }, kind: "player" },
  { name: "B", rel: { x: -6, y: 1, z: 0 }, kind: "player" },
  { name: "Z", rel: { x: 0, y: 1, z: -5 }, kind: "zombie" },
];

/**
 * One blast per subject, 24 apart, a player and a zombie at 3, 5 and 7 blocks:
 * the ring's explosion against one primed vanilla TNT, where nothing dies
 * outright. The full rings kill A, B and the zombie in both runs, so they
 * alone cannot tell a weaker blast from an equal one.
 */
const SINGLES: Subject[] = [3, 5, 7].flatMap((d, i) => [
  { name: `P${d}`, rel: { x: -60 + 48 * i, y: 1, z: d }, kind: "player" as const },
  { name: `Z${d}`, rel: { x: -36 + 48 * i, y: 1, z: d }, kind: "zombie" as const },
]);
/** The zombie owner of the run where the source is one the engine takes, at A's spot. */
const OWNER_ZOMBIE: Subject = { name: "O", rel: { x: 5, y: 1, z: 0 }, kind: "zombie" };

/** Vanilla primed TNT held on its cell: its ignition hop would move the reference blast by a fraction of a block. */
function primedTnt(dim: Dimension, at: Vector3): Entity {
  const tnt = dim.spawnEntity("minecraft:tnt", at);
  tnt.clearVelocity();
  return tnt;
}

async function placeSubjects(test: Test, s: Site, tag: string, subjects: Subject[], reuseA?: SimulatedPlayer): Promise<Map<string, Entity>> {
  const out = new Map<string, Entity>();
  for (const sub of subjects) {
    const at = { x: s.cx + sub.rel.x, y: s.top + sub.rel.y, z: s.cz + sub.rel.z };
    if (sub.kind === "zombie") {
      out.set(sub.name, zombie(s.dim, { x: at.x + 0.5, y: at.y, z: at.z + 0.5 }));
      continue;
    }
    if (sub.name === "A" && reuseA !== undefined) {
      await goTo(test, reuseA, s.dim, at);
      out.set("A", reuseA);
      continue;
    }
    const p = test.spawnSimulatedPlayer(STAND, `ring_ac3_${tag}_${sub.name}`, GameMode.Survival);
    await test.idle(2);
    await goTo(test, p, s.dim, at);
    out.set(sub.name, p);
  }
  await test.idle(10);
  return out;
}

registerAsync("andrew", "ring_tnt_damage", async (test: Test): Promise<void> => {
  const restore = useRealRmb(test);
  const reports = watchReports();
  const harm = watchHarm();
  const spy = spyExplosions();
  const warnings = captureWarnings();
  const difficulty = world.getDifficulty();
  const sites: Site[] = [];
  const extras: Entity[] = [];
  // Health lost to explosions, from the hurt events themselves: a SimulatedPlayer regenerates while a
  // scenario waits, so a later health reading undercounts by whole hearts.
  const lossOf = (m: Map<string, Entity>, hp: Map<string, number>, name: string): number => {
    const id = (m.get(name) as Entity).id;
    return blastLoss(harm.hurts, id, hp.get(name) ?? 20, harm.deaths.has(id));
  };
  const hits = (m: Map<string, Entity>, name: string): string => hitsOf(harm.hurts, (m.get(name) as Entity).id);
  const same = (x: number, y: number): boolean => Math.abs(x - y) <= Math.max(4, 0.35 * Math.max(x, y));
  const zombies = (m: Map<string, Entity>): void => {
    for (const e of m.values()) if (e.typeId === "minecraft:zombie") extras.push(e);
  };
  try {
    world.setDifficulty(Difficulty.Easy);
    // Run 1: the SimulatedPlayer A fires and stays where the AC puts the owner.
    const s = await site(test, "andrew_gt_ring_3a", 7);
    sites.push(s);
    const a = await owner(test, s, "ring_ac3_ring_A", { x: s.cx + 5, y: s.top + 1, z: s.cz });
    const ring = await placeSubjects(test, s, "ring", SUBJECTS, a);
    zombies(ring);
    const hpRing = new Map([...ring].map(([n, e]) => [n, health(e)]));
    const attack = fireRmb(a, s.dim, s.target);
    const r = await untilReport(test, reports, attack.attackId);
    await test.idle(60);

    // Run 2: the same rings detonated in one tick for a zombie owner — an entity the engine would take as a source.
    const u = await site(test, "andrew_gt_ring_3d", 16);
    sites.push(u);
    const own = await placeSubjects(test, u, "own", [OWNER_ZOMBIE]);
    zombies(own);
    const ownerZombie = own.get("O") as Entity;
    const hpOwn = new Map([["O", health(ownerZombie)]]);
    const ownId = `gt-ringown-${system.currentTick}`;
    const callsOwn = spy.calls.length;
    for (const c of layout(u.target)) RING_EFFECT.onDetonate(u.dim, { x: c.x, y: u.top, z: c.z }, ownerZombie.id, "rmb", ownId);
    const rOwn = await untilReport(test, reports, ownId);
    const ownCalls = spy.calls.slice(callsOwn);
    const sourced = ownCalls.filter((c) => c.options?.source !== undefined).length;
    await test.idle(60);

    // The control: vanilla primed TNT at the same centres, the same subjects on an identical pad.
    const t = await site(test, "andrew_gt_ring_3b", 8);
    sites.push(t);
    const control = await placeSubjects(test, t, "tnt", [...SUBJECTS, { ...OWNER_ZOMBIE, name: "OZ" }]);
    zombies(control);
    const hpTnt = new Map([...control].map(([n, e]) => [n, health(e)]));
    for (const c of layout(t.target)) extras.push(primedTnt(t.dim, { x: c.x + 0.5, y: t.top + 1, z: c.z + 0.5 }));
    await test.idle(140);

    // Single blasts: one ring explosion per subject, then one vanilla TNT per subject on a twin pad.
    const g = await site(test, "andrew_gt_ring_3e", 17, PAD, 40);
    sites.push(g);
    const singles = await placeSubjects(test, g, "one", SINGLES);
    zombies(singles);
    const hpOne = new Map([...singles].map(([n, e]) => [n, health(e)]));
    const oneId = `gt-ringone-${system.currentTick}`;
    for (const sub of SINGLES) RING_EFFECT.onDetonate(g.dim, { x: g.cx + sub.rel.x, y: g.top, z: g.cz }, "nobody", "rmb", oneId);
    const rOne = await untilReport(test, reports, oneId);
    await test.idle(40);
    const h = await site(test, "andrew_gt_ring_3f", 18, PAD, 40);
    sites.push(h);
    const vanilla = await placeSubjects(test, h, "one_tnt", SINGLES);
    zombies(vanilla);
    const hpVan = new Map([...vanilla].map(([n, e]) => [n, health(e)]));
    for (const sub of SINGLES) extras.push(primedTnt(h.dim, { x: h.cx + sub.rel.x + 0.5, y: h.top + 1, z: h.cz + 0.5 }));
    await test.idle(120);
    const one = SINGLES.map((sub) => {
      const lr = lossOf(singles, hpOne, sub.name);
      const lt = lossOf(vanilla, hpVan, sub.name);
      return { name: sub.name, lr, lt, same: Math.abs(lr - lt) <= Math.max(2, 0.3 * Math.max(lr, lt)), hr: hits(singles, sub.name), ht: hits(vanilla, sub.name) };
    });

    const rows = SUBJECTS.map((sub) => {
      const lr = lossOf(ring, hpRing, sub.name);
      const lt = lossOf(control, hpTnt, sub.name);
      return { name: sub.name, lr, lt, same: same(lr, lt) };
    });
    const ownLoss = { lr: lossOf(own, hpOwn, "O"), lt: lossOf(control, hpTnt, "OZ") };
    const aDeath = harm.deaths.get(a.id);
    const oDeath = harm.deaths.get(ownerZombie.id);

    // Run 3: the owner in another dimension — no error, no source, every blast still happens.
    const o = await site(test, "andrew_gt_ring_3c", 9);
    sites.push(o);
    const a2 = await owner(test, o, "ring_ac3_away", { x: o.cx + 2, y: o.top + 1, z: o.cz + 1 });
    const callsBefore = spy.calls.length;
    const linesBefore = warnings.lines.length;
    const away = fireRmb(a2, o.dim, o.target);
    const nether = world.getDimension("nether");
    a2.teleport({ x: o.cx + 0.5, y: 120, z: o.cz + 0.5 }, { dimension: nether, forceProvidedPositionOnDimensionChange: true });
    const r2 = await untilReport(test, reports, away.attackId);
    const awayCalls = spy.calls.slice(callsBefore);
    const awayErrors = warnings.lines.slice(linesBefore).filter((l) => l.includes("orbital ring") && !l.includes(" done: ") && /threw|lost|refused/.test(l));

    log(
      `ac3 RESULT run 1 (SimulatedPlayer owner) ${brief(r)}, blasts with a source ${spy.calls.filter((c) => c.options?.source !== undefined).length}; health lost ring vs vanilla TNT: ${rows.map((x) => `${x.name} ${x.lr.toFixed(1)}/${x.lt.toFixed(1)}${x.same ? "" : " DIFFERS"}`).join(", ")}; ` +
        `one blast each (${brief(rOne)}), lost ring vs one vanilla TNT: ${one.map((x) => `${x.name} ${x.lr.toFixed(2)}/${x.lt.toFixed(2)}${x.same ? "" : " DIFFERS"} [${x.hr} | ${x.ht}]`).join(", ")}; ` +
        `A ${aDeath === undefined ? `alive hp ${health(a)}` : `died: ${aDeath.cause}, by ${aDeath.by === a.id ? "A" : aDeath.by}`}; ` +
        `run 2 (zombie owner) ${brief(rOwn)}, blasts with the owner as source ${sourced}/${ownCalls.length}, owner lost ${ownLoss.lr.toFixed(1)} vs a zombie there under vanilla TNT ${ownLoss.lt.toFixed(1)}, ` +
        `owner ${oDeath === undefined ? "alive" : `died: ${oDeath.cause}, by ${oDeath.by === ownerZombie.id ? "itself" : oDeath.by}`}; ` +
        `run 3 owner in ${a2.dimension.id} at the blasts: ${brief(r2)}, calls ${awayCalls.length}, with a source ${awayCalls.filter((c) => c.options?.source !== undefined).length}, ring errors ${awayErrors.length}`
    );
    test.assert(r.blasts === r.charges && r.lost === 0 && r.failed === 0, `run 1 ${brief(r)}`);
    for (const x of rows) test.assert(x.lr > 0, `${x.name} took no damage from the rings`);
    for (const x of rows) test.assert(x.same, `${x.name} lost ${x.lr} to the rings, ${x.lt} to vanilla TNT`);
    test.assert(rOne.blasts === SINGLES.length && rOne.lost + rOne.failed === 0, `single blasts ${brief(rOne)}`);
    for (const x of one) test.assert(x.same && (x.lr > 0 || x.lt === 0), `${x.name}: one ring blast took ${x.lr}, one vanilla TNT ${x.lt}`);
    test.assert(rOwn.blasts === RING_LAYOUT.count && rOwn.lost + rOwn.failed === 0, `run 2 ${brief(rOwn)}`);
    test.assert(sourced === 0 && spy.calls.every((c) => c.options?.source === undefined), "a ring blast carried a source: the source entity is spared the damage (as03)");
    test.assert(ownLoss.lr > 0 && same(ownLoss.lr, ownLoss.lt), `run 2: the owner lost ${ownLoss.lr}, a zombie there ${ownLoss.lt} under vanilla TNT`);
    test.assert(a2.dimension.id === "minecraft:nether", `run 3: the owner was in ${a2.dimension.id} at the blasts`);
    test.assert(r2.blasts === r2.charges && r2.charges === RING_LAYOUT.count && r2.lost === 0 && r2.failed === 0, `run 3 ${brief(r2)}`);
    test.assert(awayCalls.length === r2.blasts && awayCalls.every((c) => c.options?.source === undefined), "run 3: a blast carried a source from another dimension");
    test.assert(awayErrors.length === 0, `run 3: ring logged ${awayErrors.length} error(s): ${awayErrors.slice(0, 2).join(" | ")}`);
    test.succeed();
  } finally {
    warnings.stop();
    spy.restore();
    restore();
    reports.stop();
    harm.stop();
    world.setDifficulty(difficulty);
    for (const e of extras) if (e.isValid) e.remove();
    for (const s of sites) s.unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(1600)
  .tag("andrew");

// ---------------------------------------------------------------- AC#4 — L0-ring-ac14

async function resistanceRun(test: Test, k: number, initial: boolean): Promise<{ ok: string[]; line: string }> {
  const reports = watchReports();
  const s = await site(test, `andrew_gt_ring_4${initial ? "t" : "f"}`, k);
  try {
    const { dim, cx, cz, top } = s;
    fill(dim, { x: cx - PAD, y: top - 2, z: cz - PAD }, { x: cx - 1, y: top, z: cz + PAD }, "minecraft:dirt");
    fill(dim, { x: cx, y: top - 2, z: cz + 1 }, { x: cx + PAD, y: top, z: cz + PAD }, "minecraft:oak_planks");
    const material = (c: { x: number; z: number }): string => (c.x < 0 ? "minecraft:dirt" : c.z > 0 ? "minecraft:oak_planks" : "minecraft:stone");
    // Rings by their place from the centre, never by diameter: the table is retuned between releases.
    const [, second, third] = RING_LAYOUT.rings;
    const pillars = second.cells.filter((_, i) => i % 4 === 0).map((c, i) => ({ c, type: i % 2 === 0 ? "minecraft:obsidian" : "minecraft:reinforced_deepslate" }));
    for (const p of pillars) for (let dy = 1; dy <= 3; dy++) dim.setBlockType(cellAt(s, p.c, dy), p.type);
    const chestCol = third.cells[Math.floor(third.cells.length / 4)];
    dim.setBlockType(cellAt(s, chestCol, 1), "minecraft:chest");
    dim.getBlock(cellAt(s, chestCol, 1))?.getComponent("minecraft:inventory")?.container?.setItem(0, new ItemStack("minecraft:cobblestone", 10));
    if (!initial) dim.runCommand("gamerule dotiledrops false");
    const before = world.gameRules.doTileDrops;
    const a = await owner(test, s, `ring_ac4_${initial ? "t" : "f"}`, { x: cx + 2, y: top + 1, z: cz + 1 });
    const attack = fireRmb(a, dim, s.target);
    a.teleport(s.park);
    const r = await untilReport(test, reports, attack.attackId);
    const afterDrain = world.gameRules.doTileDrops;
    await test.idle(20);

    const skip = new Set([...pillars.map((p) => `${p.c.x},${p.c.z}`), `${chestCol.x},${chestCol.z}`]);
    const sectors = new Map<string, { cols: number; craters: number }>();
    for (const c of RING_LAYOUT.columns) {
      if (skip.has(`${c.x},${c.z}`)) continue;
      const m = material(c);
      const row = sectors.get(m) ?? { cols: 0, craters: 0 };
      row.cols++;
      if (dim.getBlock(cellAt(s, c))?.isAir === true) row.craters++;
      sectors.set(m, row);
    }
    const pillarLeft = pillars.flatMap((p) => [1, 2, 3].map((dy) => typeAt(dim, cellAt(s, p.c, dy)) === p.type)).filter(Boolean).length;
    const chestNow = typeAt(dim, cellAt(s, chestCol, 1));
    const items = itemsIn(dim, s);
    const box = new BlockVolume({ x: cx - REACH, y: top - 10, z: cz - REACH }, { x: cx + REACH, y: top + 10, z: cz + REACH });
    const fire = [...dim.getBlocks(box, { includeTypes: ["minecraft:fire", "minecraft:soul_fire"] }, true).getBlockLocationIterator()].length;
    const line =
      `ac4 RESULT doTileDrops initially ${before} (after the drain ${afterDrain}, now ${world.gameRules.doTileDrops}): ${brief(r)}; ` +
      `craters ${[...sectors].map(([m, x]) => `${m.replace("minecraft:", "")} ${x.craters}/${x.cols}`).join(", ")}; ` +
      `obsidian+reinforced deepslate standing ${pillarLeft}/${pillars.length * 3}; chest cell ${chestNow}; items within ±8 ${items.length} [${countBy(items, (e) => stackOf(e)?.typeId ?? "?")}]; fire blocks ${fire}`;
    const ok: string[] = [];
    if (before !== initial) ok.push(`setup: doTileDrops ${before}, wanted ${initial}`);
    if (afterDrain !== before || world.gameRules.doTileDrops !== before) ok.push(`doTileDrops ${before} -> ${afterDrain} / ${world.gameRules.doTileDrops}`);
    if (r.blasts !== r.charges || r.lost + r.failed > 0) ok.push(brief(r));
    for (const [m, x] of sectors) if (x.craters !== x.cols) ok.push(`${m}: ${x.cols - x.craters} column(s) without a crater`);
    if (sectors.size !== 3) ok.push(`only ${sectors.size} materials under the rings`);
    if (pillarLeft !== pillars.length * 3) ok.push(`${pillars.length * 3 - pillarLeft} resistant block(s) gone`);
    if (chestNow === "minecraft:chest") ok.push("the chest stands");
    if (items.length !== 0) ok.push(`${items.length} item(s) within ±8`);
    if (fire !== 0) ok.push(`${fire} fire block(s)`);
    return { ok, line };
  } finally {
    if (!initial) world.getDimension("overworld").runCommand("gamerule dotiledrops true");
    reports.stop();
    s.unload();
  }
}

registerAsync("andrew", "ring_resistance_no_drops", async (test: Test): Promise<void> => {
  const restore = useRealRmb(test);
  try {
    const on = await resistanceRun(test, 10, true);
    log(on.line);
    const off = await resistanceRun(test, 11, false);
    log(off.line);
    test.assert(on.ok.length === 0, `doTileDrops true: ${on.ok.join("; ")}`);
    test.assert(off.ok.length === 0, `doTileDrops false: ${off.ok.join("; ")}`);
    test.assert(world.gameRules.doTileDrops, "doTileDrops is not back to true after the test");
    test.succeed();
  } finally {
    restore();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ---------------------------------------------------------------- AC#5 — L0-ring-ac15

registerAsync("andrew", "ring_underwater_damage_only", async (test: Test): Promise<void> => {
  const restore = useRealRmb(test);
  const reports = watchReports();
  const harm = watchHarm();
  const difficulty = world.getDifficulty();
  const extras: Entity[] = [];
  const s = await site(test, "andrew_gt_ring_5", 12);
  try {
    world.setDifficulty(Difficulty.Easy);
    const { dim, cx, cz, top } = s;
    // x < 0: a basin 4 deep (seabed top − 4); x ≥ 0: dry stone flush with the water's surface.
    fill(dim, { x: cx - PAD + 1, y: top - 3, z: cz - PAD + 1 }, { x: cx - 1, y: top, z: cz + PAD - 1 }, "minecraft:water");
    const seabed = top - 4;
    const zb = zombie(dim, { x: cx - 3 + 0.5, y: seabed + 1, z: cz + 0.5 });
    extras.push(zb);
    const a = await owner(test, s, "ring_ac5_a", { x: cx + 2, y: top + 1, z: cz + 1 });
    await test.idle(10);
    const snap = new BlockVolume({ x: cx - 16, y: Math.max(dim.heightRange.min, seabed - 6), z: cz - 16 }, { x: cx - 2, y: top + 6, z: cz + 16 });
    const cells = [...snap.getBlockLocationIterator()].map((l) => ({ x: l.x, y: l.y, z: l.z }));
    const before = cells.map((l) => typeAt(dim, l));
    const zHp = health(zb);
    const attack = fireRmb(a, dim, s.target);
    a.teleport(s.park);
    const r = await untilReport(test, reports, attack.attackId);
    await test.idle(20);
    const changed = cells.filter((l, i) => typeAt(dim, l) !== before[i]);
    const dry = RING_LAYOUT.columns.filter((c) => c.x >= 1);
    const dryCraters = dry.filter((c) => {
      const t = typeAt(dim, cellAt(s, c));
      return t !== "minecraft:stone";
    });
    const hurt = harm.hurts.filter((h) => h.id === zb.id);
    const died = harm.deaths.get(zb.id);
    const wet = RING_LAYOUT.columns.filter((c) => c.x <= -1).length;
    log(
      `ac5 RESULT ${brief(r)}; wet-half columns ${wet}; cells within ±6 with x ≤ −2 changed ${changed.length}/${cells.length} [${changed.slice(0, 5).map((l) => `${l.x - cx},${l.y - top},${l.z - cz}:${typeAt(dim, l)}`).join(" ")}]; ` +
        `dry-half ring columns cratered ${dryCraters.length}/${dry.length}; seabed zombie hp ${zHp} -> ${died !== undefined ? `dead (${died.cause})` : health(zb)}, hurt [${hurt.map((h) => `${h.cause}:${h.damage.toFixed(1)}`).join(" ")}]`
    );
    test.assert(r.blasts === r.charges && r.lost + r.failed === 0, brief(r));
    test.assert(r.underwater >= wet && r.underwater < r.blasts, `underwater ${r.underwater}: the classification is not per blast (wet columns ${wet})`);
    test.assert(changed.length === 0, `${changed.length} cell(s) under the water changed`);
    test.assert(dryCraters.length === dry.length, `${dry.length - dryCraters.length} dry column(s) without a crater`);
    test.assert(died !== undefined || hurt.length > 0, "the seabed zombie took no damage");
    test.succeed();
  } finally {
    restore();
    reports.stop();
    harm.stop();
    world.setDifficulty(difficulty);
    for (const e of extras) if (e.isValid) e.remove();
    s.unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(700)
  .tag("andrew");

// ---------------------------------------------------------------- AC#6 — L0-ring-ac16

function copies(dim: Dimension, center: Vector3, def: LegendaryDef, id: string): Array<{ entity: Entity; gen: number }> {
  return dim.getEntities({ type: "minecraft:item", location: center, maxDistance: 64 }).flatMap((e) => {
    const stack = stackOf(e);
    const mark = stack !== undefined && state.isItemOf(def, stack) ? state.getMark(def, stack) : undefined;
    return mark?.id === id ? [{ entity: e, gen: mark.gen }] : [];
  });
}

function held(container: Container | undefined, def: LegendaryDef, id: string): number {
  let n = 0;
  for (let slot = 0; container !== undefined && slot < container.size; slot++) {
    const st = container.getItem(slot);
    if (st !== undefined && state.isItemOf(def, st) && state.getMark(def, st)?.id === id) n++;
  }
  return n;
}

registerAsync("andrew", "ring_legendaries_survive", async (test: Test): Promise<void> => {
  const restore = useRealRmb(test);
  const reports = watchReports();
  const warnings = captureWarnings();
  const s = await site(test, "andrew_gt_ring_6", 13);
  try {
    const { dim, cx, cz, top } = s;
    const a = await owner(test, s, "ring_ac6_a", { x: cx + 2, y: top + 1, z: cz + 1 });
    const chestAt = { x: cx + 3, y: top + 1, z: cz };
    dim.setBlockType(chestAt, "minecraft:chest");
    const chest = dim.getBlock(chestAt)?.getComponent("minecraft:inventory")?.container;
    chest?.setItem(0, new ItemStack("minecraft:cobblestone", 32));
    const swordMark = state.makeMark("craft", a);
    chest?.setItem(5, state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), swordMark));
    const scytheMark = state.makeMark("craft", a);
    dim.spawnItem(state.markItem(SCYTHE_OF_CALAMITY, new ItemStack(SCYTHE_OF_CALAMITY.itemId, 1), scytheMark), { x: cx + 16.5, y: top + 1, z: cz + 0.5 }).clearVelocity();
    await test.idle(10);
    const scytheBefore = copies(dim, s.target, SCYTHE_OF_CALAMITY, scytheMark.id);
    test.assert(scytheBefore.length === 1 && Math.floor(scytheBefore[0].entity.location.x) - cx === 16, "setup: the Scythe is not on the ground 6 blocks outside ring 20");
    const attack = fireRmb(a, dim, s.target);
    a.teleport(s.park);
    const r = await untilReport(test, reports, attack.attackId);
    await test.idle(60);
    const inv = a.getComponent("minecraft:inventory")?.container;
    const rows = [
      { name: "Web Sword", def: WEB_SWORD, mark: swordMark },
      { name: "Scythe", def: SCYTHE_OF_CALAMITY, mark: scytheMark },
    ].map((x) => {
      const ground = copies(dim, s.target, x.def, x.mark.id);
      const inHand = held(inv, x.def, x.mark.id);
      const outside = ground.every((g) => Math.abs(Math.floor(g.entity.location.x) - cx) > REACH || Math.abs(Math.floor(g.entity.location.z) - cz) > REACH);
      const returned = warnings.lines.some((l) => l.includes(x.mark.id) && l.includes("now gen"));
      const owed = JSON.stringify(state.readOwed(x.def)).includes(x.mark.id);
      return { ...x, ground, inHand, outside, returned, owed, ledger: state.ledgerGen(x.def, x.mark.id) };
    });
    log(
      `ac6 RESULT ${brief(r)}; ` +
        rows
          .map((x) => `${x.name} id ${x.mark.id}: on the ground [${x.ground.map((g) => `${fmt1(g.entity.location)}@gen${g.gen}`).join(" ")}], held ${x.inHand}, outside ±8 ${x.outside}, ledger gen ${x.ledger}, returned ${x.returned}, owed ${x.owed}`)
          .join("; ") +
        `; chest cell ${typeAt(dim, chestAt)}`
    );
    test.assert(typeAt(dim, chestAt) !== "minecraft:chest", "the chest on ring 5 was not destroyed: nothing was at stake");
    for (const x of rows) {
      test.assert(x.ground.length === 1 && x.inHand === 0, `${x.name}: ${x.ground.length} on the ground, ${x.inHand} held`);
      test.assert(x.ground[0].gen === x.mark.gen && x.ledger === x.mark.gen, `${x.name}: gen ${x.ground[0].gen}, ledger ${x.ledger}, marked ${x.mark.gen}`);
      test.assert(x.ground[0].entity.dimension.id === dim.id, `${x.name} is in ${x.ground[0].entity.dimension.id}`);
      test.assert(x.outside, `${x.name} lies inside the footprint ± 8`);
      test.assert(!x.returned && !x.owed, `${x.name} went through loss recovery`);
    }
    test.assert(r.legendariesHandedBack === 0 && r.legendariesMoved >= 2, `moved ${r.legendariesMoved}, handedBack ${r.legendariesHandedBack}`);
    test.succeed();
  } finally {
    warnings.stop();
    restore();
    reports.stop();
    s.unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(700)
  .tag("andrew");

// ---------------------------------------------------------------- AC#7 — L0-ring-ac17, RG-1…RG-3, as05

registerAsync("andrew", "ring_three_budget", async (test: Test): Promise<void> => {
  const restore = useRealRmb(test);
  const reports = watchReports();
  const s = await site(test, "andrew_gt_ring_7", 14, PAD, 16);
  const sites = [s];
  try {
    const { dim, cx, cz, top } = s;
    // Three targets 16 apart, so the footprints overlap: the queue is shared, not per attack.
    const targets = [-16, 0, 16].map((dx) => ({ x: cx + dx, y: top, z: cz }));
    const players: SimulatedPlayer[] = [];
    for (const [i, t] of targets.entries()) players.push(await owner(test, s, `ring_ac7_${i}`, { x: t.x + 2, y: top + 1, z: t.z + 1 }));
    await test.idle(40);
    const idle = await continuationTicks(test, 200);
    let fired: Attack[] = [];
    let fireTick = -1;
    const ticks = await continuationTicks(test, 50, () => {
      fireTick = system.currentTick;
      fired = players.map((p, i) => fireRmb(p, dim, targets[i]));
      players.forEach((p, i) => p.teleport({ x: s.park.x + 4 * i, y: s.park.y, z: s.park.z }));
    });
    const rs: RingReport[] = [];
    for (const f of fired) rs.push(await untilReport(test, reports, f.attackId));
    while (system.currentTick < fireTick + 60) await test.idle(1);
    const loops = { ring: ringLoop(), flight: flightLoop() };
    const first = Math.min(...rs.map((r) => r.firstTick));
    const last = Math.max(...rs.map((r) => r.lastTick));
    const drain = last - first + 1;
    const window = ticks.slice(first - fireTick, last - fireTick + 3);
    const idleMax = Math.max(...idle);
    // Tick wall time is paced to 50 ms, so an idle server already jitters over it (53 ms, 4 in a row, measured):
    // a tick counts as slow only above both 50 ms and the idle server's own worst tick (the PNTR-JOB bar).
    const slow = Math.max(50, idleMax);
    const run50 = longestRunOver(window, 50);
    const runSlow = longestRunOver(window, slow);
    const max = Math.max(...window);
    const maxBlasts = Math.max(...rs.map((r) => r.maxBlastsInTick));
    log(
      `[measure] RING-BLAST as05 MEASURED cap ${RING_MAX_BLASTS_PER_TICK}: three RMB in tick ${fireTick}, contacts from tick ${first}, last blast ${last}: drain ${drain} tick(s); ` +
        `maxBlastsInTick ${maxBlasts}; per attack ${rs.map((r) => `[${r.blastsByTick.join(",")}] from ${r.firstTick}`).join(" ")}; ` +
        `server tick wall ms from the first contact tick [${window.join(",")}]: max ${max}, longest run over 50 ms ${run50}, over the idle-calibrated ${slow} ms ${runSlow}; ` +
        `idle control ${idle.length} ticks: max ${idleMax}, over 50 ms ${idle.filter((ms) => ms > 50).length}, longest run over 50 ${longestRunOver(idle, 50)}; ` +
        `at fire+60: ring loop running ${loops.ring.running} (queued ${loops.ring.queued}), flight loop running ${loops.flight.running}; ` +
        `reports ${rs.map(brief).join(" || ")}`
    );
    test.assert(rs.every((r) => r.blasts === r.charges && r.lost + r.failed === 0), "a blast was lost or failed");
    test.assert(maxBlasts <= 48 && loops.ring.maxBlastsInTick <= 48, `maxBlastsInTick ${maxBlasts} (loop ${loops.ring.maxBlastsInTick})`);
    test.assert(drain <= 13, `RG-2: the queue took ${drain} ticks for three attacks`);
    test.assert(runSlow <= 3, `RG-3: ${runSlow} consecutive ticks over ${slow} ms [${window.join(",")}]`);
    test.assert(max <= 150, `RG-3: a tick took ${max} ms [${window.join(",")}]`);
    test.assert(!loops.ring.running && loops.ring.queued === 0, "the ring queue interval is still running 60 ticks after the shots");
    test.assert(!loops.flight.running, "the flight interval is still running 60 ticks after the shots");
    test.succeed();
  } finally {
    restore();
    reports.stop();
    for (const x of sites) x.unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ---------------------------------------------------------------- AC#8 — L0-ring-ac18

registerAsync("andrew", "ring_no_leftovers_vanilla_drops", async (test: Test): Promise<void> => {
  const restore = useRealRmb(test);
  const reports = watchReports();
  const harm = watchHarm();
  const difficulty = world.getDifficulty();
  const extras: Entity[] = [];
  const s = await site(test, "andrew_gt_ring_8", 15);
  const proto = Entity.prototype;
  const originalRemove = proto.remove;
  const removed: string[] = [];
  let spawns: ReturnType<typeof watchSpawns> | undefined;
  try {
    world.setDifficulty(Difficulty.Easy);
    const { dim, cx, cz, top } = s;
    test.assert(!world.gameRules.keepInventory, "setup: keepInventory is on");
    const b = test.spawnSimulatedPlayer(STAND, "ring_ac8_b", GameMode.Survival);
    await test.idle(4);
    b.getComponent("minecraft:inventory")?.container?.addItem(new ItemStack("minecraft:diamond", 5));
    await goTo(test, b, dim, { x: cx + 5, y: top + 1, z: cz });
    // Rings by their place from the centre, never by diameter: the table is retuned between releases.
    const [inner, , third, outer] = RING_LAYOUT.rings;
    const pick = <T>(xs: T[], n: number, off: number): T[] => Array.from({ length: n }, (_, i) => xs[(off + Math.floor((i * xs.length) / n)) % xs.length]);
    const zombies = [...pick(inner.cells, 3, 1), ...pick(third.cells, 3, 2)].map((c) => zombie(dim, { x: cx + c.x + 0.5, y: top + 1, z: cz + c.z + 0.5 }));
    extras.push(...zombies);
    const dirt = pick(outer.cells, 4, 3).map((c) => dim.spawnItem(new ItemStack("minecraft:dirt", 1), { x: cx + c.x + 0.5, y: top + 1, z: cz + c.z + 0.5 }));
    dirt.forEach((d) => d.clearVelocity());
    const dirtIds = new Set(dirt.map((d) => d.id));
    const a = await owner(test, s, "ring_ac8_a", { x: cx + 2, y: top + 1, z: cz + 1 });
    await test.idle(10);
    const victims = new Map<string, string>([[b.id, "B"], ...zombies.map((z, i): [string, string] => [z.id, `Z${i}`])]);

    proto.remove = function (this: Entity): void {
      try {
        if (this.typeId === "minecraft:item") removed.push(`${stackOf(this)?.typeId ?? "?"}@${system.currentTick}`);
      } catch {
        removed.push("unreadable");
      }
      originalRemove.call(this);
    };
    spawns = watchSpawns(new Set(itemsIn(dim, s).map((e) => e.id)));
    const attack = fireRmb(a, dim, s.target);
    a.teleport(s.park);
    const r = await untilReport(test, reports, attack.attackId);
    await test.idle(40);
    proto.remove = originalRemove;
    spawns.stop();

    const charges = dim.getEntities({ type: CHARGE_ENTITY_ID }).length;
    const died = [...victims].filter(([id]) => harm.deaths.has(id)).map(([, n]) => n);
    // B carries only diamonds and A is off the pad, so every other non-block item is zombie loot, and every orb is theirs.
    const got = spawns.spawns;
    const blockDrops = got.filter((sp) => sp.type === "minecraft:item" && BLOCK_DROPS.has(sp.item));
    const diamonds = got.filter((sp) => sp.item === "minecraft:diamond").reduce((n, sp) => n + sp.amount, 0);
    const loot = got.filter((sp) => sp.type === "minecraft:item" && !BLOCK_DROPS.has(sp.item) && sp.item !== "minecraft:diamond");
    const xp = got.filter((sp) => sp.type === "minecraft:xp_orb");
    const deathDropIds = new Set(got.filter((sp) => sp.type === "minecraft:item" && !BLOCK_DROPS.has(sp.item)).map((sp) => sp.id));
    const now = itemsIn(dim, s);
    const stray = now.filter((e) => !dirtIds.has(e.id) && !deathDropIds.has(e.id));
    const dirtLeft = now.filter((e) => dirtIds.has(e.id)).length;
    log(
      `ac8 RESULT ${brief(r)}; charges left ${charges}; died [${died.join(",")}] causes [${[...victims].map(([id, n]) => `${n}:${harm.deaths.get(id)?.cause ?? "alive"}`).join(" ")}]; ` +
        `appeared during the attack [${amounts(got)}], of them removed again [${amounts(spawns.removed)}]; B's diamonds ${diamonds}; zombie loot [${amounts(loot)}], xp orbs ${xp.length}; ` +
        `block-drop spawns ${blockDrops.length}; item remove() calls ${removed.length} [${removed.slice(0, 5).join(" ")}]; ` +
        `items within ±8 now ${now.length} (pre-existing dirt left ${dirtLeft}/4, death drops ${now.length - dirtLeft - stray.length}, other ${stray.length})`
    );
    test.assert(charges === 0, `${charges} andrew:orbital_charge left`);
    test.assert(r.blasts === r.charges && r.lost + r.failed === 0, brief(r));
    test.assert(died.includes("B") && died.length === victims.size, `not everything at stake died: [${died.join(",")}]`);
    test.assert(diamonds === 5, `B's diamonds spawned ${diamonds}, not 5`);
    // XP needs a kill credited to a player, and no ring blast carries a source (README.md, deviation 6; probe_ring_drops xp):
    // the orbs are counted, not required.
    test.assert(loot.length > 0, `zombie loot ${loot.length}`);
    test.assert(removed.length === 0, `ring-time remove() on ${removed.length} item(s)`);
    test.assert(blockDrops.length === 0, `block drops spawned: ${countBy(blockDrops, (sp) => sp.item)}`);
    test.assert(stray.length === 0, `${stray.length} item(s) in the area are neither death drops nor the dirt laid out before`);
    test.succeed();
  } finally {
    proto.remove = originalRemove;
    spawns?.stop();
    restore();
    reports.stop();
    harm.stop();
    world.setDifficulty(difficulty);
    for (const e of extras) if (e.isValid) e.remove();
    s.unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(700)
  .tag("andrew");
