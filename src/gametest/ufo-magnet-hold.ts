// The UFO magnet's hold and release on a real engine (src/ufo/magnet.ts,
// magnet-hold.ts): players lifted by knockback, the cloud ring, the drop
// exemption, the one-tick release and its vanilla fall, and what a full magnet
// phase costs. A product pack reads a SimulatedPlayer as undefined, so every
// scenario builds the product core and magnet over an env whose players are the
// test's own (L0-ufoc-ad01), around a stand-in saucer at the hover point, on a
// pad of its own far from every other test. The continuation ticks the core:
// GameTest continuations run before intervals, so a sample taken at the top of
// an iteration shows where the previous tick's step and physics left things.

import {
  BlockPermutation,
  BlockVolume,
  type Container,
  Difficulty,
  type Dimension,
  Entity,
  EquipmentSlot,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { FIRST_MAX_MS, FIRST_MIN_MS, PAUSE_MS, type UfoDurations, type UfoEnv, type UfoPlayer } from "../ufo/env";
import { IRON_TAG, type Magnet, type Saucer, UfoCore, hoverHeight } from "../ufo/event";
import { IRON_DOOR, SCAN_TYPES } from "../ufo/iron";
import { UfoMagnet } from "../ufo/magnet";
import { EXEMPT, PLAYER_DEPTH, PLAYER_SPEED, RING_DEPTH, RING_RADIUS, holdPoint } from "../ufo/magnet-hold";
import { BLOCK, HOLDER, type MagnetHost, STACK, type Zone, inZone, reach, zoneMiddle, zoneOf } from "../ufo/magnet-select";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 3 };
const FILL_CELLS = 32768;

const log = (msg: string): void => console.warn(`[gametest] magnet ${msg}`);
const fmt = (v: Vector3): string => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
const dist = (a: Vector3, b: Vector3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const flat = (a: Vector3, b: Vector3): number => Math.hypot(a.x - b.x, a.z - b.z);

const host: MagnetHost = {
  itemStack: (typeId, amount) => new ItemStack(typeId, amount),
  volume: (from, to) => new BlockVolume(from, to),
  now: () => Date.now(),
  log: (msg) => console.warn(`[gametest] ${msg}`),
};

function fill(dim: Dimension, min: Vector3, max: Vector3, type: string): void {
  const area = (max.x - min.x + 1) * (max.z - min.z + 1);
  const slab = Math.max(1, Math.floor(FILL_CELLS / area));
  for (let y = min.y; y <= max.y; y += slab) {
    dim.fillBlocks(new BlockVolume({ x: min.x, y, z: min.z }, { x: max.x, y: Math.min(max.y, y + slab - 1), z: max.z }), type);
  }
}

// ---------------------------------------------------------------- the pads

/** On −x like the magnet-on pads, one row further out in z; one pad per scenario. */
const SITE_DX = -1200;
const SITE_STEP = -240;
const SITE_DZ = 1100;
const PAD_HALF = 14;
const PAD_DEPTH = 24;
const LOAD_MARGIN = 6;

interface Pad {
  dim: Dimension;
  cx: number;
  cz: number;
  top: number;
  centre: Vector3;
  hoverY: number;
  zone: Zone;
  unload: () => void;
}

async function pad(test: Test, name: string, k: number): Promise<Pad> {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const cx = origin.x + SITE_DX + SITE_STEP * k;
  const cz = origin.z + SITE_DZ;
  const top = dim.heightRange.min + PAD_DEPTH + 10;
  const r = PAD_HALF + LOAD_MARGIN;
  const unload = await loadBox(test, dim, name, { min: [cx - r, 0, cz - r], max: [cx + r, 0, cz + r] });
  const centre = { x: cx, y: top, z: cz };
  const hoverY = hoverHeight(top, dim.heightRange.max);
  fill(dim, { x: cx - PAD_HALF, y: top - PAD_DEPTH, z: cz - PAD_HALF }, { x: cx + PAD_HALF, y: top, z: cz + PAD_HALF }, "minecraft:stone");
  // Clear up past the saucer: the lift and the cloud need open air.
  fill(dim, { x: cx - PAD_HALF, y: top + 1, z: cz - PAD_HALF }, { x: cx + PAD_HALF, y: hoverY + 2, z: cz + PAD_HALF }, "minecraft:air");
  return { dim, cx, cz, top, centre, hoverY, zone: zoneOf(centre, hoverY, dim.heightRange), unload };
}

const at = (p: Pad, dx: number, dz: number, dy = 1): Vector3 => ({ x: p.cx + dx, y: p.top + dy, z: p.cz + dz });
const middle = (b: Vector3): Vector3 => ({ x: b.x + 0.5, y: b.y, z: b.z + 0.5 });

function itemsIn(p: Pad): Entity[] {
  return p.dim.getEntities({ type: "minecraft:item", location: zoneMiddle(p.zone), maxDistance: reach(p.zone) }).filter((e) => e !== undefined && e.isValid && inZone(p.zone, e.location));
}

function removeAll(entities: Iterable<Entity | undefined>): void {
  for (const e of entities) if (e?.isValid) e.remove();
}

/** Kept still and unburnt for the ticks between seeding and the magnet. */
function spawnStill(p: Pad, typeId: string, b: Vector3): Entity {
  const e = p.dim.spawnEntity(typeId, middle(b));
  e.addEffect("slowness", 2400, { amplifier: 255, showParticles: false });
  e.addEffect("fire_resistance", 2400, { amplifier: 0, showParticles: false });
  return e;
}

/** Zombies roll random gear; every armour and hand slot is set by hand. */
function dress(e: Entity, head: string): void {
  for (const [slot, item] of [["slot.armor.head", head], ["slot.armor.chest", "air"], ["slot.armor.legs", "air"], ["slot.armor.feet", "air"], ["slot.weapon.mainhand", "air"], ["slot.weapon.offhand", "air"]]) {
    e.runCommand(`replaceitem entity @s ${slot} 0 ${item}`);
  }
}

// ---------------------------------------------------------------- the rig

class MemoryStore {
  readonly data = new Map<string, number | boolean>();
  get(key: string): unknown {
    return this.data.get(key);
  }
  set(key: string, value: number | boolean | undefined): void {
    if (value === undefined) this.data.delete(key);
    else this.data.set(key, value);
  }
}

interface Rig {
  readonly core: UfoCore;
  readonly magnet: UfoMagnet;
  readonly players: SimulatedPlayer[];
  readonly saucer: Vector3;
  readonly durations: UfoDurations;
  /** Script ms of every magnetStep, by Date.now — the only clock the BDS runtime has. */
  readonly steps: number[];
  readonly released: { tick: number; wall: number }[];
  readonly target: UfoPlayer;
}

/** The product core and magnet over this pad; `saucer` defaults to the hover point the stub saucer holds. */
function rig(p: Pad, scope: string, durations: UfoDurations, saucer?: Vector3): Rig {
  const S = saucer ?? { x: p.cx + 0.5, y: p.hoverY, z: p.cz + 0.5 };
  const players: SimulatedPlayer[] = [];
  const magnet = new UfoMagnet({
    overworld: () => p.dim,
    players: () => players,
    saucerPosition: () => S,
    spawns: world.afterEvents.entitySpawn,
    host,
  });
  const steps: number[] = [];
  const released: { tick: number; wall: number }[] = [];
  const timed: Magnet = {
    onPhase(phase, payload) {
      magnet.onPhase(phase, payload);
      if (phase === "release") released.push({ tick: system.currentTick, wall: Date.now() });
    },
    magnetStep(tick) {
      const start = Date.now();
      magnet.magnetStep(tick);
      steps.push(Date.now() - start);
    },
  };
  const standIn: Saucer = { onPhase() {}, saucerStep() {}, saucerPosition: () => S };
  const target: UfoPlayer = { id: `gt-hold-${scope}`, name: `hold ${scope}`, location: { x: p.cx + 0.5, y: p.top + 1, z: p.cz + 0.5 }, sendMessage() {} };
  const env: UfoEnv = {
    now: () => Date.now(),
    durations,
    pauseMs: PAUSE_MS,
    firstMinMs: FIRST_MIN_MS,
    firstMaxMs: FIRST_MAX_MS,
    overworldPlayers: () => [target],
    random: () => 0.5,
    store: new MemoryStore(),
    ceiling: () => p.dim.heightRange.max,
    log: (msg) => console.warn(`[gametest] ${msg}`),
  };
  return { core: new UfoCore(env, { scope, saucer: standIn, magnet: timed }), magnet, players, saucer: S, durations, steps, released, target };
}

/**
 * Ticks the core through the arrival; returns right after the tick that turned
 * the magnet on (its first hold step included). `twoBefore` runs two ticks
 * before that one.
 */
async function startMagnet(test: Test, rigs: readonly Rig[], twoBefore?: () => void): Promise<number> {
  for (const r of rigs) test.assert(r.core.command("come", r.target.id).ok, `come was refused for ${r.target.name}`);
  for (let t = 0; t < 40; t++) {
    const s = rigs[0].core.session();
    if (s?.phase === "arrival" && s.phaseTick === rigs[0].durations.arrival - 2) twoBefore?.();
    for (const r of rigs) r.core.tick();
    if (rigs.every((r) => r.magnet.view() !== undefined)) return system.currentTick;
    await test.idle(1);
  }
  throw new Error("the magnet phase never started");
}

function spawnPlayer(test: Test, r: Rig, name: string, mode: GameMode): SimulatedPlayer {
  const pl = test.spawnSimulatedPlayer(STAND, name, mode);
  r.players.push(pl);
  return pl;
}

function inventory(pl: Player): Container | undefined {
  return pl.getComponent("minecraft:inventory")?.container;
}

function give(pl: Player, slot: number, typeId: string, amount = 1): void {
  inventory(pl)?.setItem(slot, new ItemStack(typeId, amount));
}

/** Everything the player carries, hands and armour included; a pickup changes it. */
function carried(pl: Player): string {
  const parts: string[] = [];
  const c = inventory(pl);
  if (c !== undefined) for (let k = 0; k < c.size; k++) parts.push(`${c.getItem(k)?.typeId ?? ""}*${c.getItem(k)?.amount ?? 0}`);
  const eq = pl.getComponent("minecraft:equippable");
  for (const slot of [EquipmentSlot.Offhand, EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet]) parts.push(eq?.getEquipment(slot)?.typeId ?? "");
  return parts.join("|");
}

function removePlayers(test: Test, r: Rig): void {
  for (const pl of r.players) if (pl.isValid) test.removeSimulatedPlayer(pl);
}

interface Harm {
  readonly falls: Map<string, number[]>;
  readonly deaths: Map<string, { cause: string; tick: number; at: Vector3 }>;
  stop(): void;
}

function watchHarm(): Harm {
  const falls = new Map<string, number[]>();
  const deaths = new Map<string, { cause: string; tick: number; at: Vector3 }>();
  const h = world.afterEvents.entityHurt.subscribe((e) => {
    const hurt = e.hurtEntity as Entity | undefined;
    if (hurt === undefined || e.damageSource.cause !== "fall") return;
    const list = falls.get(hurt.id) ?? [];
    list.push(e.damage);
    falls.set(hurt.id, list);
  });
  const d = world.afterEvents.entityDie.subscribe((e) => {
    const dead = e.deadEntity as Entity | undefined;
    if (dead !== undefined) deaths.set(dead.id, { cause: e.damageSource.cause, tick: system.currentTick, at: dead.location });
  });
  return {
    falls,
    deaths,
    stop: () => {
      world.afterEvents.entityHurt.unsubscribe(h);
      world.afterEvents.entityDie.unsubscribe(d);
    },
  };
}

const D_SHORT = (magnet: number): UfoDurations => ({ arrival: 3, magnet, departure: 2, downed: 4 });
const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);

// ------------------------------------------------ AC-1: two Survival players (main hand, off hand) and an Adventure one rise and hold

registerAsync("andrew", "ufo_hold_players_lift", async (test: Test): Promise<void> => {
  const p = await pad(test, "andrew_gt_hold_l", 0);
  const r = rig(p, "hl", D_SHORT(160));
  try {
    const a = spawnPlayer(test, r, "hold_a_main", GameMode.Survival);
    const b = spawnPlayer(test, r, "hold_b_off", GameMode.Survival);
    const c = spawnPlayer(test, r, "hold_c_adv", GameMode.Adventure);
    await test.idle(4);
    const starts = [at(p, -6, -6), at(p, 6, -6), at(p, 0, 7)].map(middle);
    [a, b, c].forEach((pl, i) => pl.teleport(starts[i]));
    give(a, 0, "minecraft:iron_ingot");
    a.selectedSlotIndex = 0;
    // L0-magn-a04: shears are not allow_off_hand, so only /replaceitem puts them there.
    b.runCommand("replaceitem entity @s slot.weapon.offhand 0 shears");
    b.selectedSlotIndex = 0;
    give(c, 0, "minecraft:iron_pickaxe");
    c.selectedSlotIndex = 0;
    await test.idle(10);
    test.assert(a.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId === "minecraft:iron_ingot", "A does not hold the ingot");
    const bHands = b.getComponent("minecraft:equippable");
    test.assert(bHands?.getEquipment(EquipmentSlot.Offhand)?.typeId === "minecraft:shears" && bHands.getEquipment(EquipmentSlot.Mainhand) === undefined, "B does not hold shears in the off hand alone");

    const target = holdPoint(r.saucer);
    const who = [a, b, c];
    const prev = who.map((pl) => pl.location);
    const depth = who.map((pl) => dist(pl.location, target));
    const maxStep = [0, 0, 0];
    const reached = [-1, -1, -1];
    const maxDev = [0, 0, 0];
    const pulledAll: boolean[] = [];
    await startMagnet(test, [r]);
    let t = 0;
    for (; r.released.length === 0 && t < 400; t++) {
      await test.idle(1);
      who.forEach((pl, i) => {
        const q = pl.location;
        maxStep[i] = Math.max(maxStep[i], dist(q, prev[i]));
        prev[i] = q;
        const dev = dist(q, target);
        if (reached[i] < 0 && dev <= 0.5) reached[i] = t + 1;
        if (reached[i] >= 0) maxDev[i] = Math.max(maxDev[i], dev);
      });
      r.core.tick();
      const pulled = r.magnet.view()?.last?.pulled ?? [];
      if (r.released.length === 0) pulledAll.push(who.every((pl) => pulled.includes(pl.id)));
    }
    const bound = depth.map((d) => d / PLAYER_SPEED + 20);
    log(
      `lift RESULT target ${fmt(target)} (saucer − ${PLAYER_DEPTH}); ` +
        who.map((pl, i) => `${pl.name}: from ${depth[i].toFixed(1)} away, max step ${maxStep[i].toFixed(3)}/tick, within 0.5 after ${reached[i]} ticks (bound ${bound[i].toFixed(0)}), max deviation then ${maxDev[i].toFixed(3)}`).join("; ") +
        `; released after ${t} hold samples, pulled every step ${pulledAll.every((x) => x)}`
    );
    test.assert(r.released.length === 1, "the magnet did not release");
    test.assert(pulledAll.length > 0 && pulledAll.every((x) => x), "a player was not pulled in some hold step");
    who.forEach((pl, i) => {
      test.assert(maxStep[i] <= PLAYER_SPEED + 0.01, `${pl.name} moved ${maxStep[i].toFixed(3)} in one tick, more than ${PLAYER_SPEED}`);
      test.assert(reached[i] >= 0 && reached[i] <= bound[i], `${pl.name} reached the hold point after ${reached[i]} ticks, bound ${bound[i].toFixed(0)}`);
      test.assert(maxDev[i] <= 0.5, `${pl.name} strayed ${maxDev[i].toFixed(3)} from the hold point before the release`);
    });
  } finally {
    removePlayers(test, r);
    removeAll(itemsIn(p));
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

// ------------------------------------------------ AC-2: iron only in the inventory, worn armour, Creative and Spectator stay down

registerAsync("andrew", "ufo_hold_players_ignored", async (test: Test): Promise<void> => {
  const p = await pad(test, "andrew_gt_hold_i", 1);
  const r = rig(p, "hi", D_SHORT(80));
  try {
    const control = spawnPlayer(test, r, "hold_control", GameMode.Survival);
    const pack = spawnPlayer(test, r, "hold_c_inventory", GameMode.Survival);
    const armour = spawnPlayer(test, r, "hold_d_armour", GameMode.Survival);
    const creative = spawnPlayer(test, r, "hold_e_creative", GameMode.Creative);
    const spectator = spawnPlayer(test, r, "hold_f_spectator", GameMode.Spectator);
    await test.idle(4);
    const spots = [at(p, 0, -7), at(p, -7, 4), at(p, 7, 4), at(p, -4, 9), at(p, 4, 9)].map(middle);
    r.players.forEach((pl, i) => pl.teleport(spots[i]));
    give(control, 0, "minecraft:iron_ingot");
    control.selectedSlotIndex = 0;
    give(pack, 5, "minecraft:iron_ingot", 16);
    pack.selectedSlotIndex = 0;
    const eq = armour.getComponent("minecraft:equippable");
    const worn = (
      [
        [EquipmentSlot.Head, "minecraft:iron_helmet"],
        [EquipmentSlot.Chest, "minecraft:iron_chestplate"],
        [EquipmentSlot.Legs, "minecraft:iron_leggings"],
        [EquipmentSlot.Feet, "minecraft:iron_boots"],
      ] as const
    ).map(([slot, id]) => eq?.setEquipment(slot, new ItemStack(id, 1)) === true);
    give(armour, 0, "minecraft:dirt");
    armour.selectedSlotIndex = 0;
    give(creative, 0, "minecraft:iron_ingot");
    creative.selectedSlotIndex = 0;
    give(spectator, 0, "minecraft:iron_sword");
    spectator.selectedSlotIndex = 0;
    await test.idle(10);
    test.assert(worn.every((x) => x), `the iron armour did not go on: ${worn.join(" ")}`);
    test.assert(inventory(pack)?.getItem(5)?.amount === 16 && pack.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand) === undefined, "C's hands are not empty, or its ingots are missing");
    test.assert(creative.getGameMode() === GameMode.Creative && spectator.getGameMode() === GameMode.Spectator, "the game modes did not take");

    const still = [pack, armour, creative, spectator];
    const start = still.map((pl) => pl.location);
    const controlStart = control.location;
    const pulledEver = new Set<string>();
    await startMagnet(test, [r]);
    for (let t = 0; t < 60; t++) {
      await test.idle(1);
      r.core.tick();
      for (const id of r.magnet.view()?.last?.pulled ?? []) pulledEver.add(id);
    }
    const rise = still.map((pl, i) => pl.location.y - start[i].y);
    const closer = still.map((pl, i) => flat(start[i], r.saucer) - flat(pl.location, r.saucer));
    const controlRise = control.location.y - controlStart.y;
    log(`ignored RESULT control rose ${controlRise.toFixed(2)}; ` + still.map((pl, i) => `${pl.name}: rose ${rise[i].toFixed(3)}, closer to the axis by ${closer[i].toFixed(3)}`).join("; ") + `; pulled ever [${[...pulledEver].map((id) => r.players.find((pl) => pl.id === id)?.name).join(" ")}]`);
    test.assert(controlRise > 20, `the control player rose only ${controlRise.toFixed(2)}: the magnet was not pulling`);
    test.assert(pulledEver.size === 1 && pulledEver.has(control.id), "a player other than the control was pulled");
    still.forEach((pl, i) => {
      test.assert(rise[i] <= 0.1, `${pl.name} rose ${rise[i].toFixed(3)}`);
      test.assert(closer[i] <= 0.1, `${pl.name} moved ${closer[i].toFixed(3)} toward the saucer`);
    });
  } finally {
    removePlayers(test, r);
    removeAll(itemsIn(p));
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC-3: a held player drops its ingot — the pull stops that tick, the ingot joins as the 11th

registerAsync("andrew", "ufo_hold_drop_exempt", async (test: Test): Promise<void> => {
  const p = await pad(test, "andrew_gt_hold_d", 2);
  const r = rig(p, "hd", D_SHORT(400));
  let groundDrop: Entity | undefined;
  try {
    // Eleven iron items: the ten nearest fill the limit, the eleventh stays.
    const kinds = ["iron_ingot", "iron_nugget", "raw_iron", "iron_sword", "iron_pickaxe", "iron_axe", "iron_shovel", "iron_hoe", "shears", "bucket", "compass"];
    const seeded = kinds.map((k, i) => p.dim.spawnItem(new ItemStack(`minecraft:${k}`, 1), middle(at(p, -10 + 2 * i, 10 + (i === 10 ? 3 : 0)))));
    const a = spawnPlayer(test, r, "hold_dropper", GameMode.Survival);
    const b = spawnPlayer(test, r, "hold_switcher", GameMode.Survival);
    const g = spawnPlayer(test, r, "hold_ground", GameMode.Survival);
    await test.idle(4);
    a.teleport(middle(at(p, -4, -4)));
    b.teleport(middle(at(p, 4, -4)));
    g.teleport(middle(at(p, 10, -10)));
    give(a, 0, "minecraft:iron_ingot");
    a.selectedSlotIndex = 0;
    give(b, 0, "minecraft:iron_ingot");
    give(b, 1, "minecraft:dirt");
    b.selectedSlotIndex = 0;
    g.selectedSlotIndex = 0;
    await test.idle(10);

    const target = holdPoint(r.saucer);
    await startMagnet(test, [r]);
    const first = r.magnet.view();
    test.assert(first !== undefined && first.elements.length === 10, `${first?.elements.length} elements at magnet-on, expected 10`);
    const farthest = seeded[10];
    test.assert(!(first?.elements ?? []).some((e) => e.entity.id === farthest.id), "the eleventh item took a place");

    const DROP = 80;
    const SWITCH_OFF = 100;
    const SWITCH_ON = 112;
    const SHOT = 200;
    let dropped: Entity | undefined;
    let dropTickPulled: string[] = [];
    let admittedAt = -1;
    let ringAt = -1;
    const ay: number[] = [];
    let aLanded = -1;
    const bOff: number[] = [];
    let bOffPulled = true;
    let bBack = -1;
    let gPulled = false;
    let groundAt: Vector3 | undefined;
    let xSlot: Vector3 | undefined;
    const harm = watchHarm();
    try {
      for (let t = 1; t <= SHOT + 2 && r.core.session() !== undefined; t++) {
        await test.idle(1);
        if (t === DROP) {
          test.assert(dist(a.location, target) <= 0.5 && dist(b.location, target) <= 0.5, `not both held before the drop: A ${fmt(a.location)}, B ${fmt(b.location)}`);
          test.assert(a.dropSelectedItem(), "dropSelectedItem refused");
        }
        if (t === DROP + 10) {
          // In one continuation: the hold step of this tick never sees iron in G's hand.
          give(g, 0, "minecraft:iron_ingot");
          test.assert(g.dropSelectedItem(), "G's dropSelectedItem refused");
          g.teleport(middle(at(p, 4, -12)));
        }
        if (t === SWITCH_OFF) b.selectedSlotIndex = 1;
        if (t === SWITCH_ON) b.selectedSlotIndex = 0;
        if (t === SHOT) r.core.reportShotDown({ eventId: r.core.session()?.eventId ?? "", ownerId: "gt", ownerName: "gametest" });
        if (t > DROP && aLanded < 0) {
          ay.push(a.isValid ? a.location.y : Number.NaN);
          if (!a.isValid || (ay.length > 3 && Math.abs(ay[ay.length - 1] - ay[ay.length - 2]) < 1e-4) || harm.deaths.has(a.id)) aLanded = t;
        }
        if (t > SWITCH_OFF && t <= SWITCH_ON) bOff.push(b.location.y);
        r.core.tick();
        const v = r.magnet.view();
        if (v === undefined) continue;
        const pulled = v.last?.pulled ?? [];
        if (t === DROP) dropTickPulled = pulled;
        if (t === SWITCH_OFF) bOffPulled = pulled.includes(b.id);
        if (t > SWITCH_ON && bBack < 0 && dist(b.location, target) <= 0.5) bBack = t;
        if (pulled.includes(g.id)) gPulled = true;
        const x = v.elements.find((e) => e.cls === EXEMPT && e.from === "minecraft:iron_ingot" && e.origin.y > p.top + 10);
        if (x !== undefined && admittedAt < 0) {
          admittedAt = t;
          dropped = x.entity;
        }
        if (x !== undefined && ringAt < 0 && x.entity.isValid) {
          const q = x.entity.location;
          if (Math.abs(q.y - (r.saucer.y - RING_DEPTH)) < 0.25 && Math.abs(flat(q, r.saucer) - RING_RADIUS) < 0.25) {
            ringAt = t;
            xSlot = q;
          }
        }
        if (t === DROP + 40) {
          groundDrop = itemsIn(p).find((e) => e.getComponent("minecraft:item")?.itemStack.typeId === "minecraft:iron_ingot" && flat(e.location, middle(at(p, 10, -10))) < 4 && e.location.y < p.top + 3 && !v.elements.some((el) => el.entity.id === e.id));
          groundAt = groundDrop?.location;
        }
      }
    } finally {
      harm.stop();
    }
    const v = r.magnet.lastSummary();
    const aFalls = ay.filter((y) => !Number.isNaN(y));
    const aMono = aFalls.slice(1).every((y, i) => y <= aFalls[i] + 1e-3);
    log(
      `drop RESULT drop tick pulled [${dropTickPulled.map((id) => r.players.find((pl) => pl.id === id)?.name).join(" ")}]; A fell ${aFalls.length > 0 ? (aFalls[0] - aFalls[aFalls.length - 1]).toFixed(1) : "?"} over ${aFalls.length} ticks, monotonic ${aMono}, landed/died at +${aLanded - DROP} (death ${harm.deaths.get(a.id)?.cause ?? "none"}); ` +
        `ingot ${dropped?.id ?? "none"} admitted at +${admittedAt - DROP}, on the ring at +${ringAt - DROP} ${xSlot === undefined ? "" : fmt(xSlot)}; ` +
        `B off-hand pulled ${bOffPulled}, fell ${bOff.length > 0 ? (bOff[0] - bOff[bOff.length - 1]).toFixed(2) : "?"} while off, held again at +${bBack - SWITCH_ON}; ` +
        `G pulled ${gPulled}, its ingot ${groundDrop === undefined ? "NOT FOUND" : `${groundDrop.id} on the ground at ${fmt(groundAt as Vector3)}`}; ` +
        `release ${v?.reason} after ${v?.steps} steps, ${v?.held} held (${v?.exempt} exempt)`
    );
    test.assert(!dropTickPulled.includes(a.id), "A was still pulled in the tick it dropped the ingot");
    test.assert(dropTickPulled.includes(b.id), "B was not pulled in A's drop tick (the step did not run)");
    test.assert(aFalls.length >= 10 && aMono && aFalls[0] - aFalls[aFalls.length - 1] > 10, `A did not fall: ${aFalls.slice(0, 8).map((y) => y.toFixed(2)).join(" ")} …`);
    test.assert(admittedAt >= DROP && admittedAt <= DROP + 2, `the dropped ingot became an element at +${admittedAt - DROP}`);
    test.assert(ringAt > 0, "the dropped ingot never reached the ring");
    test.assert(v?.held === 11 && v.exempt === 1, `${v?.held} elements held at the release (${v?.exempt} exempt), expected 10 + 1`);
    test.assert(farthest.isValid && farthest.location.y < p.top + 2, "the eleventh item left the ground");
    test.assert(!bOffPulled, "B was pulled in the tick it switched to dirt");
    test.assert(bOff.length > 5 && bOff[0] - bOff[bOff.length - 1] > 1, `B did not fall while off iron: ${bOff.map((y) => y.toFixed(2)).join(" ")}`);
    test.assert(bBack > 0, "B was not pulled back after switching to the ingot");
    test.assert(!gPulled, "the ground player was pulled");
    test.assert(groundDrop !== undefined, "the ground player's ingot is not lying where it fell");
    test.assert(v?.reason === "release", `the shoot-down released through ${v?.reason}`);
  } finally {
    removePlayers(test, r);
    removeAll(itemsIn(p));
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ------------------------------------------------ AC-4: held 34 up for the whole 60 s — dies on release; held 2 up — no damage

registerAsync("andrew", "ufo_hold_release_fall", async (test: Test): Promise<void> => {
  const high = await pad(test, "andrew_gt_hold_h", 3);
  const low = await pad(test, "andrew_gt_hold_g", 4);
  const MAGNET = 1200;
  const rh = rig(high, "hh", D_SHORT(MAGNET));
  // The same knockback hold, aimed 2 above the ground: the stand-in saucer hangs PLAYER_DEPTH + 2 over the surface.
  const rl = rig(low, "hg", D_SHORT(MAGNET), { x: low.cx + 0.5, y: low.top + 1 + 2 + PLAYER_DEPTH, z: low.cz + 0.5 });
  const harm = watchHarm();
  try {
    const h = spawnPlayer(test, rh, "hold_high", GameMode.Survival);
    const l = spawnPlayer(test, rl, "hold_low", GameMode.Survival);
    await test.idle(4);
    h.teleport(middle(at(high, 3, 3)));
    l.teleport(middle(at(low, 3, 3)));
    for (const pl of [h, l]) {
      give(pl, 0, "minecraft:iron_ingot");
      pl.selectedSlotIndex = 0;
    }
    await test.idle(10);
    test.assert(h.getComponent("minecraft:health")?.currentValue === 20, "the high player does not start at 20 HP");
    test.assert(h.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Chest) === undefined, "the high player wears armour");
    const th = holdPoint(rh.saucer);
    const tl = holdPoint(rl.saucer);
    // Already at the hold points when the magnet comes on: held there the whole minute.
    await startMagnet(test, [rh, rl], () => {
      h.teleport(th);
      l.teleport(tl);
    });
    const on = { tick: system.currentTick, wall: Date.now() };
    let minHigh = Number.POSITIVE_INFINITY;
    let devHigh = 0;
    let devLow = 0;
    let held = 0;
    for (let t = 0; t < MAGNET + 5 && rh.released.length === 0; t++) {
      await test.idle(1);
      minHigh = Math.min(minHigh, h.location.y - high.centre.y);
      devHigh = Math.max(devHigh, dist(h.location, th));
      devLow = Math.max(devLow, dist(l.location, tl));
      held++;
      rh.core.tick();
      rl.core.tick();
    }
    test.assert(rh.released.length === 1 && rl.released.length === 1, "the magnets did not both release");
    const off = rh.released[0];
    const releaseY = { high: h.location.y, low: l.location.y };
    const hurtBefore = (harm.falls.get(h.id)?.length ?? 0) + (harm.falls.get(l.id)?.length ?? 0);
    let lowRest = -1;
    for (let t = 0; t < 160 && !(harm.deaths.has(h.id) && lowRest >= 0); t++) {
      await test.idle(1);
      if (lowRest < 0 && l.location.y - (low.top + 1) < 0.05) lowRest = t;
    }
    await test.idle(20);
    const hFalls = harm.falls.get(h.id) ?? [];
    const lFalls = harm.falls.get(l.id) ?? [];
    const death = harm.deaths.get(h.id);
    log(
      `release fall RESULT magnet ${off.tick - on.tick} ticks (${((off.wall - on.wall) / 1000).toFixed(1)} s), ${held} samples; high: lowest ${minHigh.toFixed(2)} above the centre block, ` +
        `deviation ${devHigh.toFixed(3)}, released at y ${releaseY.high.toFixed(2)} (${(releaseY.high - (high.top + 1)).toFixed(2)} above the surface), fall damage [${hFalls.map((d) => d.toFixed(1)).join(" ")}], ` +
        `death ${death === undefined ? "none" : `${death.cause} at +${death.tick - off.tick}`}; low: deviation ${devLow.toFixed(3)}, released ${(releaseY.low - (low.top + 1)).toFixed(2)} above the surface, ` +
        `at rest at +${lowRest}, fall damage [${lFalls.map((d) => d.toFixed(1)).join(" ")}], health ${l.getComponent("minecraft:health")?.currentValue}`
    );
    test.assert(off.tick - on.tick >= MAGNET - 1, `the magnet lasted ${off.tick - on.tick} ticks, not the full ${MAGNET}`);
    test.assert(hurtBefore === 0, "fall damage before the release");
    test.assert(minHigh >= 34 - 0.5 && devHigh <= 0.5, `the high player was not held at 34 the whole minute (lowest ${minHigh.toFixed(2)}, deviation ${devHigh.toFixed(3)})`);
    test.assert(devLow <= 0.5, `the low player strayed ${devLow.toFixed(3)} from its hold point`);
    test.assert(hFalls.length > 0 && sum(hFalls) >= 20, `the high player took fall damage [${hFalls.join(" ")}], not a lethal fall`);
    test.assert(death?.cause === "fall", `the high player ${death === undefined ? "did not die" : `died of ${death.cause}`}`);
    test.assert(lowRest >= 0, "the low player did not come to rest on the ground");
    test.assert(lFalls.length === 0, `the low player took fall damage [${lFalls.join(" ")}]: the hold accumulated fall distance`);
  } finally {
    harm.stop();
    removePlayers(test, rh);
    removePlayers(test, rl);
    removeAll(itemsIn(high));
    removeAll(itemsIn(low));
    high.unload();
    low.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1900)
  .tag("andrew");

// ------------------------------------------------ AC-5: 10 elements and a player released in one tick, vanilla fall, nothing picked up

/** Counts script teleports of the watched entities; Entity.prototype is shared by every entity of this runtime. */
function watchTeleports(ids: ReadonlySet<string>): { count(): number; stop(): void } {
  const proto = Entity.prototype as unknown as { teleport: (this: Entity, ...args: unknown[]) => void };
  const original = proto.teleport;
  let n = 0;
  proto.teleport = function (this: Entity, ...args: unknown[]): void {
    if (ids.has(this.id)) n++;
    original.apply(this, args);
  };
  return {
    count: () => n,
    stop: () => {
      proto.teleport = original;
    },
  };
}

registerAsync("andrew", "ufo_hold_release_together", async (test: Test): Promise<void> => {
  const difficulty = world.getDifficulty();
  const time = world.getTimeOfDay();
  const p = await pad(test, "andrew_gt_hold_t", 5);
  const r = rig(p, "ht", D_SHORT(400));
  const extras: Entity[] = [];
  const harm = watchHarm();
  let teleports: { count(): number; stop(): void } | undefined;
  try {
    // A zombie is deleted on Peaceful, where the checks world runs; noon keeps others from spawning.
    world.setDifficulty(Difficulty.Easy);
    world.setTimeOfDay(6000);
    // The player first: a hostile mob more than 128 blocks from every player despawns at once.
    const h = spawnPlayer(test, r, "hold_together", GameMode.Survival);
    await test.idle(4);
    h.teleport(middle(at(p, 0, 0)));
    give(h, 0, "minecraft:iron_ingot");
    h.selectedSlotIndex = 0;
    await test.idle(4);
    const kinds = ["iron_ingot", "iron_nugget", "raw_iron", "iron_sword", "bucket", "shears", "compass"];
    const items = kinds.map((k, i) => p.dim.spawnItem(new ItemStack(`minecraft:${k}`, 1), middle(at(p, -9 + 3 * i, 9))));
    // Golem, then minecart, then zombie by distance: their ring slots 7, 8, 9 keep the golem off the zombie.
    const golem = spawnStill(p, "minecraft:iron_golem", at(p, -10, -6));
    const cart = p.dim.spawnEntity("minecraft:minecart", middle(at(p, 11, -6)));
    const zombie = spawnStill(p, "minecraft:zombie", at(p, 0, -13));
    extras.push(golem, cart, zombie);
    await test.idle(2);
    dress(zombie, "iron_helmet");
    await test.idle(8);
    test.assert(extras.every((e) => e.isValid) && items.every((e) => e.isValid), "an element is gone before the magnet");

    await startMagnet(test, [r]);
    const v0 = r.magnet.view();
    const els = v0?.elements ?? [];
    const names = new Map<string, string>([[golem.id, "golem"], [cart.id, "minecart"], [zombie.id, "zombie"], ...items.map((e, i): [string, string] => [e.id, kinds[i]])]);
    test.assert(els.length === 10, `${els.length} elements, expected 10: ${els.map((e) => e.from).join(" ")}`);
    test.assert(els.map((e) => e.cls).join("") === "1111111333", `classes ${els.map((e) => e.cls).join("")}`);
    test.assert(els.every((e) => names.has(e.entity.id)), "an element is not one of the seeded ten");
    const ids = new Set(els.map((e) => e.entity.id));
    teleports = watchTeleports(ids);
    const before = carried(h);
    const target = holdPoint(r.saucer);
    let changed = "";
    let heldAt = -1;
    for (let t = 1; t < 400 && r.released.length === 0; t++) {
      await test.idle(1);
      if (changed === "" && carried(h) !== before) changed = `at +${t}: ${carried(h)}`;
      if (heldAt < 0 && dist(h.location, target) <= 0.5) heldAt = t;
      if (heldAt > 0 && t === heldAt + 120) test.assert(r.core.command("stop").ok, "stop was refused");
      r.core.tick();
    }
    test.assert(r.released.length === 1, "the magnet did not release");
    const during = teleports.count();
    // In the release tick: every element still there, at rest from the last step.
    const valid = els.filter((e) => e.entity.isValid).length;
    const speed = els.map((e) => (e.entity.isValid ? Math.hypot(e.entity.getVelocity().x, e.entity.getVelocity().y, e.entity.getVelocity().z) : Number.NaN));
    const from = els.map((e) => e.entity.location);
    const fromPlayer = h.location;
    const track = els.map((e) => [e.entity.location.y]);
    const rest = els.map(() => -1);
    const land: (Vector3 | undefined)[] = els.map(() => undefined);
    const pTrack = [h.location.y];
    for (let t = 1; t <= 120; t++) {
      await test.idle(1);
      els.forEach((e, i) => {
        if (rest[i] >= 0) return;
        if (!e.entity.isValid) {
          rest[i] = t;
          return;
        }
        const y = e.entity.location.y;
        const ys = track[i];
        ys.push(y);
        land[i] = e.entity.location;
        if (ys.length > 3 && Math.abs(ys[ys.length - 1] - ys[ys.length - 4]) < 1e-3) rest[i] = t;
      });
      if (h.isValid && !harm.deaths.has(h.id)) pTrack.push(h.location.y);
      if (rest.every((x) => x >= 0) && harm.deaths.has(h.id)) break;
    }
    const after = teleports.count() - during;
    teleports.stop();
    teleports = undefined;
    const mono = track.map((ys) => ys.slice(1).every((y, k) => y <= ys[k] + 1e-3));
    const drift = els.map((_, i) => (land[i] === undefined ? Number.NaN : flat(land[i] as Vector3, from[i])));
    const pMono = pTrack.slice(1).every((y, k) => y <= pTrack[k] + 1e-3);

    // The fallen items are ordinary: a player walking onto each picks it up.
    const picker = spawnPlayer(test, r, "hold_picker", GameMode.Survival);
    await test.idle(2);
    const picked: string[] = [];
    for (const e of els.filter((el) => el.cls !== HOLDER)) {
      if (!e.entity.isValid) continue;
      picker.teleport(e.entity.location);
      for (let t = 0; t < 30 && e.entity.isValid; t++) await test.idle(1);
      if (!e.entity.isValid) picked.push(names.get(e.entity.id) ?? e.from);
    }
    const zombieFall = harm.falls.get(zombie.id) ?? [];
    const golemFall = harm.falls.get(golem.id) ?? [];
    log(
      `together RESULT player held at +${heldAt}, inventory ${changed === "" ? "unchanged" : `CHANGED ${changed}`}; ${during} element teleports during the hold, ${after} after the release; ` +
        `release tick: ${valid}/10 valid, speeds [${speed.map((s) => s.toFixed(3)).join(" ")}]; ` +
        els.map((e, i) => `${names.get(e.entity.id)} fell ${(track[i][0] - track[i][track[i].length - 1]).toFixed(1)} monotonic ${mono[i]} drift ${drift[i].toFixed(2)} rest +${rest[i]}`).join("; ") +
        `; player fell ${(pTrack[0] - pTrack[pTrack.length - 1]).toFixed(1)} monotonic ${pMono} from ${fmt(fromPlayer)}, death ${harm.deaths.get(h.id)?.cause ?? "none"}; ` +
        `zombie fall [${zombieFall.map((d) => d.toFixed(1)).join(" ")}] death ${harm.deaths.get(zombie.id)?.cause ?? "none"}, golem fall [${golemFall.join(" ")}]; picked up [${picked.join(" ")}]`
    );
    test.assert(heldAt > 0, "the player never reached the hold point");
    test.assert(changed === "", `the held player picked something up ${changed}`);
    test.assert(during > 0, "the teleport witness saw no hold step: it proves nothing about the release");
    test.assert(valid === 10, `${valid} of the 10 elements were there at the release`);
    test.assert(speed.every((s) => s < 0.2), `an element was moving in the release tick: ${speed.map((s) => s.toFixed(3)).join(" ")}`);
    test.assert(after === 0, `${after} script teleports of elements after the release`);
    test.assert(mono.every((x) => x), `an element rose after the release: ${els.filter((_, i) => !mono[i]).map((e) => names.get(e.entity.id)).join(" ")}`);
    test.assert(
      track.every((ys) => ys[0] - ys[ys.length - 1] > 25),
      `an element did not fall to the ground: ${els.map((e, i) => `${names.get(e.entity.id)} ${(track[i][0] - track[i][track[i].length - 1]).toFixed(1)}`).join(" ")}`
    );
    test.assert(drift.every((d) => d <= 1.5), `an element landed away from its last slot: ${drift.map((d) => d.toFixed(2)).join(" ")}`);
    test.assert(pMono && pTrack[0] - pTrack[pTrack.length - 1] > 25, "the held player did not fall with the rest");
    test.assert(zombieFall.length > 0, "the zombie took no fall damage");
    test.assert(golemFall.length === 0, `the golem took fall damage [${golemFall.join(" ")}]`);
    test.assert(picked.length === 7, `${picked.length} of the 7 items could be picked up: [${picked.join(" ")}]`);
  } finally {
    teleports?.stop();
    harm.stop();
    world.setDifficulty(difficulty);
    world.setTimeOfDay(time);
    for (const e of extras) if (e.isValid) e.removeTag(IRON_TAG);
    removeAll(extras);
    removePlayers(test, r);
    removeAll(itemsIn(p));
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ------------------------------------------------ the DoD cost: a full magnet phase over 200 chests, the whole type list, 2 players, 10 + 2 elements

function pct(sorted: readonly number[], q: number): number {
  return sorted.length === 0 ? Number.NaN : sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)];
}

registerAsync("andrew", "ufo_hold_tps_measured", async (test: Test): Promise<void> => {
  const difficulty = world.getDifficulty();
  const time = world.getTimeOfDay();
  const p = await pad(test, "andrew_gt_hold_s", 6);
  const MAGNET = 1200;
  const r = rig(p, "hs", D_SHORT(MAGNET));
  const extras: Entity[] = [];
  try {
    world.setDifficulty(Difficulty.Easy);
    world.setTimeOfDay(6000);
    // 200 single chests on every other cell around a free middle; iron only in the four corners, so class 2 reads them all.
    const chests: Vector3[] = [];
    for (let dx = -14; dx <= 14; dx += 2) for (let dz = -14; dz <= 14; dz += 2) if (Math.abs(dx) > 4 || Math.abs(dz) > 4) chests.push(at(p, dx, dz));
    for (const b of chests) p.dim.getBlock(b)?.setType("minecraft:chest");
    await test.idle(2);
    for (const b of chests) {
      const c = p.dim.getBlock(b)?.getComponent("minecraft:inventory")?.container;
      c?.setItem(0, new ItemStack("minecraft:dirt", 3));
      c?.setItem(26, new ItemStack("minecraft:cobblestone", 5));
      if (Math.abs(b.x - p.cx) === 14 && Math.abs(b.z - p.cz) === 14) c?.setItem(13, new ItemStack("minecraft:iron_ingot", 4));
    }
    // Every type the scan asks for, once, under the pad: built blocks, ore and empty containers.
    const types = SCAN_TYPES.filter((id) => id !== "minecraft:chest");
    // Read back at once: an unfuelled lit_* furnace goes out a few ticks later.
    const typed = new Set<string>(["minecraft:chest"]);
    types.forEach((id, i) => {
      const b = at(p, -13 + 2 * (i % 14), -13 + 4 * Math.floor(i / 14), -4);
      if (id === IRON_DOOR) {
        p.dim.getBlock(b)?.setPermutation(BlockPermutation.resolve(IRON_DOOR, { upper_block_bit: false }));
        p.dim.getBlock({ ...b, y: b.y + 1 })?.setPermutation(BlockPermutation.resolve(IRON_DOOR, { upper_block_bit: true }));
      } else p.dim.getBlock(b)?.setType(id);
      if (p.dim.getBlock(b)?.typeId === id) typed.add(id);
    });
    // The players first: a hostile mob more than 128 blocks from every player despawns at once.
    const a = spawnPlayer(test, r, "hold_tps_a", GameMode.Survival);
    const b = spawnPlayer(test, r, "hold_tps_b", GameMode.Survival);
    await test.idle(4);
    a.teleport(middle(at(p, -3, 1)));
    b.teleport(middle(at(p, 3, -1)));
    give(a, 0, "minecraft:iron_ingot");
    a.selectedSlotIndex = 0;
    give(b, 0, "minecraft:iron_sword");
    b.selectedSlotIndex = 0;
    await test.idle(4);
    const golem = spawnStill(p, "minecraft:iron_golem", at(p, -9, 1));
    const cart = p.dim.spawnEntity("minecraft:minecart", middle(at(p, 9, -1)));
    const zombie = spawnStill(p, "minecraft:zombie", at(p, 1, 9));
    extras.push(golem, cart, zombie);
    await test.idle(2);
    dress(zombie, "iron_helmet");
    await test.idle(8);
    // Whatever popped while the rows were built would take the ground class.
    removeAll(itemsIn(p));
    const placed = chests.filter((c) => p.dim.getBlock(c)?.typeId === "minecraft:chest").length;
    test.assert(placed >= 200, `${placed} chests placed`);

    const IDLE = 200;
    const idle0 = { tick: system.currentTick, wall: Date.now() };
    for (let t = 0; t < IDLE; t++) await test.idle(1);
    const idleTps = ((system.currentTick - idle0.tick) * 1000) / (Date.now() - idle0.wall);

    await startMagnet(test, [r]);
    const on = { tick: system.currentTick, wall: Date.now() };
    const sel = r.magnet.view()?.selection;
    for (let t = 1; t <= MAGNET + 5 && r.released.length === 0; t++) {
      await test.idle(1);
      if (t === 100) {
        // Two iron drops near the saucer: the + 2.
        p.dim.spawnItem(new ItemStack("minecraft:iron_nugget", 1), { x: r.saucer.x - 3, y: r.saucer.y - 4, z: r.saucer.z });
        p.dim.spawnItem(new ItemStack("minecraft:iron_ingot", 1), { x: r.saucer.x + 3, y: r.saucer.y - 4, z: r.saucer.z });
      }
      r.core.tick();
    }
    test.assert(r.released.length === 1, "the magnet did not release");
    const off = r.released[0];
    const phaseTps = ((off.tick - on.tick) * 1000) / (off.wall - on.wall);
    const s = r.magnet.lastSummary();
    const samples = r.steps.slice(0, MAGNET);
    const sorted = [...samples].sort((x, y) => x - y);
    const mean = sum(samples) / Math.max(1, samples.length);
    const classes = (sel?.elements ?? []).map((e) => e.cls).join("");
    log(
      `tps MEASURE magnet-on (scan + selection + extraction) ${sel?.ms} ms over ${placed} chests and ${typed.size}/${SCAN_TYPES.length} scan types placed, candidates ${JSON.stringify(sel?.found)}, classes ${classes}; ` +
        `hold step over ${samples.length} ticks with ${s?.maxPulled} players and ${s?.held} elements (${s?.exempt} exempt): mean ${mean.toFixed(3)} ms, p99 ${pct(sorted, 0.99)} ms, max ${sorted[sorted.length - 1]} ms (Date.now, 1 ms grain); ` +
        `TPS ${phaseTps.toFixed(2)} over the magnet (${off.tick - on.tick} ticks in ${((off.wall - on.wall) / 1000).toFixed(2)} s), idle ${idleTps.toFixed(2)}`
    );
    test.assert(sel !== undefined && Number.isFinite(sel.ms), "the magnet-on cost was not measured");
    test.assert(samples.length >= MAGNET - 1, `${samples.length} hold steps measured, expected ${MAGNET}`);
    test.assert(classes === `${STACK}${STACK}${STACK}${STACK}${HOLDER}${HOLDER}${HOLDER}${BLOCK}${BLOCK}${BLOCK}`, `classes ${classes}, expected 4 chest stacks, 3 holders, 3 blocks`);
    test.assert(s?.maxPulled === 2 && s.held === 12 && s.exempt === 2, `held ${s?.held} (${s?.exempt} exempt) with ${s?.maxPulled} players, expected 10 + 2 and 2`);
    test.assert(phaseTps >= 19.5, `the server ran ${phaseTps.toFixed(2)} TPS during the magnet`);
  } finally {
    world.setDifficulty(difficulty);
    world.setTimeOfDay(time);
    for (const e of extras) if (e.isValid) e.removeTag(IRON_TAG);
    removeAll(extras);
    removePlayers(test, r);
    removeAll(itemsIn(p));
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2000)
  .tag("andrew");
