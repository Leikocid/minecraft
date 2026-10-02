// The charge's flight on a real engine (L0-orbc-p002, -p003, -ad02, -ad03):
// entities and liquids never stop it, the End's Void and an unload end it with
// no effect, the owner is never consulted, a restart leaves no charge and no
// late blast, and three RMB attacks at once share one loop and leave nothing.
//
// Shots go through activate() with the event's block: the input path is the
// core's (orbital-core.ts); what is under test here starts at the spawn.

import { type Dimension, Direction, type Entity, GameMode, type Player, type Vector3, system, world } from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import * as cooldown from "../legendary/cooldown";
import { ORBITAL_CANNON, cooldownKey } from "../legendary/registry";
import { activate } from "../orbital/activation";
import { CHARGE_ENTITY_ID, type Mode, attackTag } from "../orbital/charge";
import { type Attack, type Outcome, activeAttacks, flightLoop, observeChargeEnds } from "../orbital/flight";
import { Blocks, arm, goTo, recordDetonations, sweepCharges } from "./orbital-core";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const NAME = "orbfl";
const KEY = ORBITAL_CANNON.abilityKey;
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
/** The platform's stone floor, two blocks in front of STAND. */
const FLOOR_T: Vector3 = { x: 3, y: 1, z: 3 };
const DIMENSIONS = ["overworld", "nether", "the_end"];

const log = (msg: string): void => console.warn(`[gametest] orbital-flight ${msg}`);
const fmt = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const fmt3 = (v: Vector3): string => `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
const same = (a: Vector3, b: Vector3): boolean => a.x === b.x && a.y === b.y && a.z === b.z;
const moved = (a: Vector3, b: Vector3): number => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));

function fire(player: Player, mode: Mode, dim: Dimension, at: Vector3): Attack {
  const block = dim.getBlock(at);
  if (block === undefined) throw new Error(`no loaded block at ${fmt(at)} to fire at`);
  const attack = activate(player, mode, block, Direction.Up);
  if (attack === undefined) throw new Error(`${player.name} did not fire ${mode} at ${fmt(at)}`);
  return attack;
}

interface Ended {
  attackId: string;
  outcome: Outcome;
  point: Vector3 | undefined;
  tick: number;
}

function watchEnds(): { ends: Ended[]; of: (attackId: string) => Ended[]; stop: () => void } {
  const ends: Ended[] = [];
  const stop = observeChargeEnds((e) => ends.push({ attackId: e.attack.attackId, outcome: e.outcome, point: e.point, tick: e.tick }));
  return { ends, of: (id) => ends.filter((e) => e.attackId === id), stop };
}

/** Feet Y of `entity` each tick, read after the flight's step, until it is gone. */
function trackY(entity: Entity): { samples: Array<{ tick: number; y: number }>; stop: () => void } {
  const samples: Array<{ tick: number; y: number }> = [{ tick: system.currentTick, y: entity.location.y }];
  const handle = system.runInterval(() => {
    if (!entity.isValid) {
      system.clearRun(handle);
      return;
    }
    samples.push({ tick: system.currentTick, y: entity.location.y });
  }, 1);
  return { samples, stop: () => system.clearRun(handle) };
}

/**
 * Ticks a charge needs to fall from its spawn to `targetY`, plus a margin for the
 * contact tick and the blast queue. Read from the attack rather than written as a
 * number: the spawn offset is tuned per release, and a fixed wait that fits one
 * offset silently measures nothing after the next (measured — a 60-tick wait met
 * a 60-block fall exactly and the probe read "never detonated").
 */
function fallWindow(attack: Attack, targetY: number): number {
  return attack.spawnY - targetY + 40;
}

async function untilEnded(test: Test, attackId: string, limit: number): Promise<number> {
  for (let t = 0; t < limit; t++) {
    if (!activeAttacks().has(attackId)) return system.currentTick;
    await test.idle(1);
  }
  throw new Error(`attack ${attackId} still has charges ${limit} ticks later`);
}

function chargesOfAttack(dim: Dimension, attackId: string): number {
  return dim.getEntities({ type: CHARGE_ENTITY_ID, tags: [attackTag(attackId)] }).length;
}

function chargesEverywhere(): number {
  return DIMENSIONS.reduce((n, id) => n + world.getDimension(id).getEntities({ type: CHARGE_ENTITY_ID }).length, 0);
}

function strictlyFalling(samples: Array<{ y: number }>): boolean {
  return samples.every((s, i) => i === 0 || s.y < samples[i - 1].y);
}

// ---------------------------------------------------------------- charge entity witness (restart run, AC#6/#7)

/**
 * Charge entities loaded and removed since this script started, by entity id.
 * entityRemove is a world event, so a removal by the release pack's copy of
 * the flight module is seen here too.
 */
const boot = { worldLoadTick: -1, loaded: new Map<string, number>(), removed: new Map<string, number>() };

world.afterEvents.worldLoad.subscribe(() => {
  boot.worldLoadTick = system.currentTick;
});
world.afterEvents.entityLoad.subscribe((e) => {
  try {
    if (e.entity.typeId === CHARGE_ENTITY_ID && !boot.loaded.has(e.entity.id)) boot.loaded.set(e.entity.id, system.currentTick);
  } catch {
    // An entity removed before this handler ran reads as invalid; its removal is still counted below.
  }
});
world.afterEvents.entityRemove.subscribe((e) => {
  if (e.typeId === CHARGE_ENTITY_ID) boot.removed.set(e.removedEntityId, system.currentTick);
});

// ---------------------------------------------------------------- AC#1: entities do not stop a charge

const PLAYER_HALF = 0.3;
const COW_HALF = 0.45;
const BOAT_HALF = 0.7;

registerAsync("andrew", "orbital_flight_through_entities", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const blocks = new Blocks(test);
  const record = recordDetonations("lmb");
  const ends = watchEnds();
  const p = test.spawnSimulatedPlayer(STAND, `${NAME}_ent_p`, GameMode.Survival);
  const q = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 5 }, `${NAME}_ent_q`, GameMode.Creative);
  const extras: Entity[] = [];
  try {
    await test.idle(4);
    arm(p);
    const t = test.worldBlockLocation(FLOOR_T);
    const cx = t.x + 0.5;
    const cz = t.z + 0.5;

    // Ledges one column east hold the boat and the cow; each box still covers the charge's column.
    blocks.setWorld(dim, { x: t.x + 1, y: t.y + 3, z: t.z }, "minecraft:stone");
    blocks.setWorld(dim, { x: t.x + 1, y: t.y + 7, z: t.z }, "minecraft:stone");
    const boat = dim.spawnEntity("minecraft:boat", { x: cx + 0.6, y: t.y + 4, z: cz });
    extras.push(boat);
    const cowName = `${NAME}_cow`;
    dim.runCommand(`summon minecraft:cow "${cowName}" ${cx + 0.3} ${t.y + 8} ${cz}`);
    const cow = dim.getEntities({ type: "minecraft:cow", name: cowName })[0];
    test.assert(cow !== undefined, "the named cow was not summoned");
    extras.push(cow);
    cow.addEffect("slowness", 600, { amplifier: 255, showParticles: false });
    q.teleport({ x: cx, y: t.y + 12, z: cz });
    q.fly();
    await test.idle(10);
    q.teleport({ x: cx, y: t.y + 12, z: cz });
    await test.idle(10);

    const hosts: Array<{ name: string; entity: Entity; half: number; height: number }> = [
      { name: "Q (Creative, flying)", entity: q, half: PLAYER_HALF, height: 1.8 },
      { name: "named cow", entity: cow, half: COW_HALF, height: 1.3 },
      { name: "boat", entity: boat, half: BOAT_HALF, height: 0.455 },
    ];
    // Control: the same window with no charge, so a drift of the hosts' own is told apart from the charge's.
    const still = hosts.map((h) => ({ ...h.entity.location }));
    let control = hosts.map(() => 0);
    for (let n = 0; n < 40; n++) {
      await test.idle(1);
      control = control.map((d, i) => Math.max(d, moved(hosts[i].entity.location, still[i])));
    }
    const start = hosts.map((h) => ({ ...h.entity.location }));
    hosts.forEach((h, i) => {
      const at = start[i];
      log(`entities RESULT ${h.name} at ${fmt3(at)} (40 ticks earlier ${fmt3(still[i])}, control drift ${control[i].toFixed(4)}), column ${cx},${cz}`);
      test.assert(Math.abs(at.x - cx) < h.half && Math.abs(at.z - cz) < h.half, `${h.name} at ${fmt3(at)} does not cover the charge's column — it is not in the path`);
    });

    const attack = fire(p, "lmb", dim, t);
    const charge = attack.charges[0].entity;
    const track = trackY(charge);
    let drift = hosts.map(() => 0);
    for (let n = 0; n < 60 && activeAttacks().has(attack.attackId); n++) {
      await test.idle(1);
      drift = drift.map((d, i) => Math.max(d, moved(hosts[i].entity.location, start[i])));
    }
    await test.idle(2);
    drift = drift.map((d, i) => Math.max(d, moved(hosts[i].entity.location, start[i])));
    track.stop();
    hosts.forEach((h, i) => log(`entities RESULT ${h.name} ${fmt3(start[i])} -> ${fmt3(h.entity.location)} over the pass`));
    const ys = track.samples.map((s) => s.y);
    const mine = record.calls.filter((c) => c.attackId === attack.attackId);
    log(
      `entities RESULT detonations ${mine.map((c) => `${fmt(c.point)}@${c.tick}`).join(" ")} (target ${fmt(t)}); ` +
        `charge y by tick ${ys.join(" ")}; drift ${hosts.map((h, i) => `${h.name} ${drift[i].toFixed(4)}`).join(", ")}`
    );
    test.assert(mine.length === 1 && same(mine[0].point, t), `onDetonate at [${mine.map((c) => fmt(c.point)).join(" ")}], not once at the target ${fmt(t)}`);
    test.assert(strictlyFalling(track.samples), `the charge's y did not fall every tick: ${ys.join(" ")}`);
    const top = Math.max(...start.map((s, i) => s.y + hosts[i].height));
    const bottom = Math.min(...start.map((s) => s.y));
    test.assert(ys[0] > top && ys[ys.length - 1] < bottom, `the samples ${ys[0]}..${ys[ys.length - 1]} do not span the entities' y ${bottom}..${top}`);
    hosts.forEach((h, i) => test.assert(drift[i] < 0.05, `${h.name} moved ${drift[i].toFixed(4)} while the charge passed`));
    test.assert(ends.of(attack.attackId).map((e) => e.outcome).join() === "detonated", `the charge ended ${ends.of(attack.attackId).map((e) => e.outcome).join()}`);

    // Variant: water 5 deep over a floor cell, walled in so it cannot flow.
    const wt = test.worldBlockLocation({ x: 1, y: 1, z: 1 });
    for (let dy = 1; dy <= 5; dy++) {
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) blocks.setWorld(dim, { x: wt.x + dx, y: wt.y + dy, z: wt.z + dz }, "minecraft:glass");
    }
    for (let dy = 1; dy <= 5; dy++) blocks.setWorld(dim, { x: wt.x, y: wt.y + dy, z: wt.z }, "minecraft:water");
    await test.idle(2);
    const column = [1, 2, 3, 4, 5].map((dy) => dim.getBlock({ x: wt.x, y: wt.y + dy, z: wt.z })?.typeId ?? "unloaded");
    test.assert(column.every((id) => id === "minecraft:water"), `the water column is ${column.join(",")}`);
    cooldown.clearCooldown(p, KEY);
    await test.idle(1);
    const wet = fire(p, "lmb", dim, wt);
    await untilEnded(test, wet.attackId, fallWindow(wet, wt.y));
    const wetCalls = record.calls.filter((c) => c.attackId === wet.attackId);
    log(`entities RESULT water 5 deep over ${fmt(wt)}: onDetonate at ${wetCalls.map((c) => fmt(c.point)).join(" ")}; water surface at y=${wt.y + 5}`);
    test.assert(wetCalls.length === 1 && same(wetCalls[0].point, wt), `under water: onDetonate at [${wetCalls.map((c) => fmt(c.point)).join(" ")}], not on the stone ${fmt(wt)}`);
    test.succeed();
  } finally {
    record.restore();
    ends.stop();
    for (const e of extras) if (e.isValid) e.remove();
    blocks.restore();
    sweepCharges();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ---------------------------------------------------------------- AC#3: control to AC-5, air at the spawn cell

registerAsync("andrew", "orbital_flight_air_control", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const record = recordDetonations("lmb");
  const p = test.spawnSimulatedPlayer(STAND, `${NAME}_air_p`, GameMode.Survival);
  try {
    await test.idle(4);
    arm(p);
    const t = test.worldBlockLocation(FLOOR_T);
    await test.idle(1);
    const attack = fire(p, "lmb", dim, t);
    const shotTick = system.currentTick;
    const spawnCell = dim.getBlock({ x: t.x, y: attack.spawnY, z: t.z });
    const entity = attack.charges[0]?.entity;
    test.assert(spawnCell?.isAir === true && entity !== undefined, `the spawn cell at y=${attack.spawnY} is ${spawnCell?.typeId ?? "unloaded"}, not air`);
    let detTick = -1;
    for (let n = 0, window = fallWindow(attack, t.y); n < window && detTick < 0; n++) {
      await test.idle(1);
      const call = record.calls.find((c) => c.attackId === attack.attackId);
      if (call !== undefined) detTick = call.tick;
    }
    const inTick = system.currentTick === detTick ? chargesOfAttack(dim, attack.attackId) : -1;
    await test.idle(1);
    const after = chargesOfAttack(dim, attack.attackId);
    const calls = record.calls.filter((c) => c.attackId === attack.attackId);
    log(
      `air RESULT shot at tick ${shotTick}, spawn y ${attack.spawnY}, onDetonate ${calls.length}x at ${calls.map((c) => `${fmt(c.point)}@${c.tick}`).join(" ")} ` +
        `(+${detTick - shotTick} ticks); charges of the attack one tick later: ${after}, entity valid ${entity.isValid}`
    );
    test.assert(calls.length === 1 && same(calls[0].point, t), `onDetonate [${calls.map((c) => fmt(c.point)).join(" ")}], not once at the target ${fmt(t)}`);
    test.assert(detTick - shotTick >= 1, `the open-air charge went off ${detTick - shotTick} tick(s) after the shot`);
    test.assert(after === 0 && !entity.isValid, `a tick after the detonation ${after} charge entit(ies) of the attack remain`);
    test.assert(inTick <= 0, `in the detonation tick ${inTick} charge entit(ies) remained`);
    test.succeed();
  } finally {
    record.restore();
    sweepCharges();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

// ---------------------------------------------------------------- AC#2: the End's Void

registerAsync("andrew", "orbital_flight_void_end", async (test: Test): Promise<void> => {
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const overworld = test.getDimension();
  const end = world.getDimension("the_end");
  const record = recordDetonations("lmb");
  const ends = watchEnds();
  const p = test.spawnSimulatedPlayer(STAND, `${NAME}_void_p`, GameMode.Survival);
  // Clear of orbital-core's End room at origin.x+400.
  const x0 = origin.x + 460;
  const z0 = origin.z;
  const stand = { x: x0 + 1, y: 59, z: z0 + 1 };
  const target = { x: x0 + 4, y: 60, z: z0 + 1 };
  const placed: Vector3[] = [];
  let unload: (() => void) | undefined;
  try {
    await test.idle(4);
    arm(p);
    unload = await loadBox(test, end, "andrew_gt_orbfl_e", { min: [x0 - 2, 0, z0 - 2], max: [x0 + 6, 96, z0 + 6] });
    for (let dx = 0; dx < 3; dx++) {
      for (let dz = 0; dz < 3; dz++) {
        const at = { x: x0 + dx, y: 58, z: z0 + dz };
        end.setBlockType(at, "minecraft:end_stone");
        placed.push(at);
      }
    }
    end.setBlockType(target, "minecraft:end_stone");
    placed.push(target);
    const below: string[] = [];
    for (let y = end.heightRange.min; y < target.y; y++) {
      const id = end.getBlock({ x: target.x, y, z: target.z })?.typeId ?? "unloaded";
      if (id !== "minecraft:air") below.push(`${y}:${id}`);
    }
    test.assert(below.length === 0, `the End column under ${fmt(target)} is not empty: ${below.slice(0, 5).join(" ")}`);
    await goTo(test, p, end, stand);

    const attack = fire(p, "lmb", end, target);
    // The lock stays on the column; with its block gone the column is empty down to heightRange.min.
    end.setBlockType(target, "minecraft:air");
    const entity = attack.charges[0].entity;
    const track = trackY(entity);
    await untilEnded(test, attack.attackId, 200);
    await test.idle(2);
    track.stop();
    const ys = track.samples.map((s) => s.y);
    const outcomes = ends.of(attack.attackId);
    const calls = record.calls.filter((c) => c.attackId === attack.attackId);
    const remaining = cooldown.remainingTicks(p, KEY);
    const left = end.getEntities({ type: CHARGE_ENTITY_ID }).length;
    log(
      `void RESULT End column ${target.x},${target.z} from y=${attack.spawnY}, heightRange.min ${end.heightRange.min}: ` +
        `last y ${ys[ys.length - 1]} at tick ${track.samples[track.samples.length - 1].tick}, ended ${outcomes.map((o) => `${o.outcome}@${o.tick}`).join(" ")}; ` +
        `onDetonate ${calls.length}; cooldown remaining ${remaining} ticks; charges left in the End ${left}`
    );
    test.assert(calls.length === 0, `onDetonate ran ${calls.length} time(s) for a charge in an empty column`);
    test.assert(outcomes.length === 1 && outcomes[0].outcome === "voided", `the charge ended ${outcomes.map((o) => o.outcome).join()}, not voided`);
    test.assert(ys[ys.length - 1] === end.heightRange.min, `the charge's last y was ${ys[ys.length - 1]}, not the floor ${end.heightRange.min}: it vanished early or late`);
    test.assert(strictlyFalling(track.samples), "the charge's y did not fall every tick");
    test.assert(!entity.isValid && remaining > 0 && left === 0, `entity valid ${entity.isValid}, cooldown ${remaining}, End charges ${left}`);
    await goTo(test, p, overworld, test.worldBlockLocation(STAND));
    test.succeed();
  } finally {
    record.restore();
    ends.stop();
    for (const at of placed) {
      try {
        end.setBlockType(at, "minecraft:air");
      } catch (err) {
        log(`void cleanup at ${fmt(at)} threw ${String(err)}`);
      }
    }
    unload?.();
    sweepCharges();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ---------------------------------------------------------------- AC#4: the owner dies, leaves, changes dimension

type OwnerRun = "control" | "death" | "leave" | "nether";

registerAsync("andrew", "orbital_flight_owner_events", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const nether = world.getDimension("nether");
  const blocks = new Blocks(test);
  const record = recordDetonations("rmb");
  const ends = watchEnds();
  const q = test.spawnSimulatedPlayer({ x: 5, y: 2, z: 6 }, `${NAME}_own_q`, GameMode.Survival);
  const runs = new Map<OwnerRun, { points: string; owners: Set<string>; dims: Set<string>; outcomes: string; pid: string; netherMax: number; effect: string }>();
  try {
    await test.idle(4);
    const t = blocks.set({ x: 3, y: 2, z: 3 }, "minecraft:stone");
    for (const run of ["control", "death", "leave", "nether"] as OwnerRun[]) {
      const p: SimulatedPlayer = test.spawnSimulatedPlayer(STAND, `${NAME}_own_${run}`, GameMode.Survival);
      await test.idle(4);
      arm(p);
      await test.idle(1);
      const pid = p.id;
      const attack = fire(p, "rmb", dim, t);
      await test.idle(1);
      let effect = "none";
      if (run === "death") effect = `kill() ${p.kill()}`;
      if (run === "leave") p.disconnect();
      if (run === "nether") p.teleport({ x: origin.x + 0.5, y: 80, z: origin.z + 0.5 }, { dimension: nether, forceProvidedPositionOnDimensionChange: true });
      let netherMax = 0;
      for (let n = 0; n < 80 && activeAttacks().has(attack.attackId); n++) {
        netherMax = Math.max(netherMax, nether.getEntities({ type: CHARGE_ENTITY_ID }).length);
        await test.idle(1);
      }
      test.assert(!activeAttacks().has(attack.attackId), `${run}: the attack still flies 80 ticks later`);
      if (run === "death") effect += `, health ${p.isValid ? String(p.getComponent("minecraft:health")?.currentValue) : "invalid"}`;
      if (run === "leave") effect = `disconnect(), valid after ${p.isValid}`;
      if (run === "nether") effect = `teleport, now in ${p.isValid ? p.dimension.id : "invalid"}`;
      const calls = record.calls.filter((c) => c.attackId === attack.attackId);
      runs.set(run, {
        points: calls.map((c) => fmt(c.point)).sort().join(" "),
        owners: new Set(calls.map((c) => c.ownerId)),
        dims: new Set(calls.map((c) => c.dimensionId)),
        outcomes: [...new Set(ends.of(attack.attackId).map((e) => e.outcome))].join(),
        pid,
        netherMax,
        effect,
      });
      const r = runs.get(run);
      log(`owner RESULT ${run}: ${effect}; ${calls.length}/${attack.charges.length + ends.of(attack.attackId).length} detonations, outcomes ${r?.outcomes}, owners [${[...(r?.owners ?? [])].join(",")}] (P ${pid}), dims [${[...(r?.dims ?? [])].join(",")}], Nether charges max ${netherMax}`);
      if (run === "death") test.assert(!p.isValid || p.getComponent("minecraft:health")?.currentValue === 0, "death: P did not die — the run proves nothing");
      if (run === "leave") test.assert(!p.isValid, "leave: P is still in the world — the run proves nothing");
      if (run === "nether") test.assert(p.isValid && p.dimension.id === "minecraft:nether", "nether: P did not reach the Nether — the run proves nothing");
    }
    const control = runs.get("control");
    test.assert(control !== undefined && control.points.split(" ").length === 160, `control: ${control?.points.split(" ").length} detonation points, not 160`);
    for (const [run, r] of runs) {
      test.assert(r.points === control?.points, `${run}: the detonation points differ from the control run`);
      test.assert(r.owners.size === 1 && r.owners.has(r.pid), `${run}: ownerId [${[...r.owners].join(",")}] is not P's id ${r.pid}`);
      test.assert(r.dims.size === 1 && r.dims.has("minecraft:overworld"), `${run}: detonations in [${[...r.dims].join(",")}]`);
      test.assert(r.outcomes === "detonated", `${run}: outcomes ${r.outcomes}`);
      test.assert(r.netherMax === 0, `${run}: ${r.netherMax} charge(s) appeared in the Nether`);
    }
    test.succeed();
  } finally {
    record.restore();
    ends.stop();
    blocks.restore();
    if (q.isValid) q.teleport(test.worldLocation({ x: 5.5, y: 2, z: 6.5 }));
    sweepCharges();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

// ---------------------------------------------------------------- AC#5: unload

const UNLOAD_OFFSET = 1000;
const UNLOAD_AREA = "andrew_gt_orbfl_u";

/**
 * A SimulatedPlayer does not load chunks: one teleported 1000 blocks out
 * waited 400 ticks with its chunk unloaded (BDS 1.26.51.1). A ticking area
 * stands in for the player's presence at the site, and leaves with it.
 */
async function loadSite(test: Test, dim: Dimension, x: number, z: number): Promise<() => void> {
  return loadBox(test, dim, UNLOAD_AREA, { min: [x - 4, 0, z - 4], max: [x + 4, 0, z + 8] });
}

registerAsync("andrew", "orbital_flight_unload", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const record = recordDetonations("lmb");
  const ends = watchEnds();
  const p = test.spawnSimulatedPlayer(STAND, `${NAME}_unl_p`, GameMode.Survival);
  const site = { x: origin.x + UNLOAD_OFFSET, z: origin.z + 3 };
  let target: Vector3 | undefined;
  let release: (() => void) | undefined;
  try {
    await test.idle(4);
    arm(p);
    release = await loadSite(test, dim, site.x, site.z);
    const ground = dim.getTopmostBlock({ x: site.x, z: site.z });
    if (ground === undefined) throw new Error("no ground at the unload site");
    const tgt = { x: site.x, y: ground.y + 1, z: site.z };
    target = tgt;
    dim.setBlockType(tgt, "minecraft:gold_block");
    await goTo(test, p, dim, { x: site.x, y: tgt.y, z: site.z + 3 });
    await test.idle(4);
    const players = world.getAllPlayers().filter((pl) => pl?.isValid === true);
    const attack = fire(p, "lmb", dim, tgt);
    const shotTick = system.currentTick;
    const deadline = p.getDynamicProperty(cooldownKey(KEY));
    const entity = attack.charges[0].entity;
    const chargeId = entity.id;
    await test.idle(1);
    // Every player online goes more than 300 blocks away, and the site's last loader with them.
    for (const pl of players) pl.teleport(test.worldLocation({ x: 3.5, y: 2, z: 5.5 }));
    release();
    release = undefined;
    let unloadedAt = -1;
    let invalidAt = -1;
    while (system.currentTick < shotTick + 200) {
      await test.idle(1);
      if (unloadedAt < 0 && !dim.isChunkLoaded(tgt)) unloadedAt = system.currentTick - shotTick;
      if (invalidAt < 0 && !entity.isValid) invalidAt = system.currentTick - shotTick;
    }
    const outcome = ends.of(attack.attackId).map((e) => `${e.outcome}@+${e.tick - shotTick}`).join(",");
    const far = Math.min(...players.map((pl) => Math.hypot(pl.location.x - tgt.x, pl.location.z - tgt.z)));
    log(`unload RESULT ${players.length} player(s) moved away (nearest ${far.toFixed(0)} blocks), the ticking area removed; chunk unloaded at +${unloadedAt}, charge invalid at +${invalidAt}, attack ended ${outcome}; onDetonate so far ${record.calls.filter((c) => c.attackId === attack.attackId).length}`);
    test.assert(far > 300, `the nearest player is ${far.toFixed(0)} blocks from the target`);
    test.assert(unloadedAt > 0 && unloadedAt < attack.spawnY - tgt.y, `the site unloaded at +${unloadedAt}, the charge needed ${attack.spawnY - tgt.y} ticks to land: the run proves nothing`);

    const returnTick = system.currentTick;
    release = await loadSite(test, dim, site.x, site.z);
    await goTo(test, p, dim, { x: site.x, y: tgt.y, z: site.z + 3 });
    await test.idle(20);
    const volume = { location: { x: tgt.x - 1, y: tgt.y, z: tgt.z - 1 }, volume: { x: 2, y: 40, z: 2 } };
    const there = dim.getEntities({ type: CHARGE_ENTITY_ID, ...volume }).length;
    const reloaded = boot.loaded.get(chargeId);
    const removed = boot.removed.get(chargeId);
    const calls = record.calls.filter((c) => c.attackId === attack.attackId);
    const block = dim.getBlock(tgt)?.typeId;
    const nowDeadline = p.getDynamicProperty(cooldownKey(KEY));
    const remaining = cooldown.remainingTicks(p, KEY);
    log(
      `unload RESULT back at +${returnTick - shotTick}: charges in the column ${there}; the charge ${chargeId} ` +
        `reloaded at ${reloaded === undefined ? "never" : `+${reloaded - shotTick}`}, last removed at ${removed === undefined ? "never" : `+${removed - shotTick}`}; ` +
        `onDetonate ${calls.length}; target ${block}; ${cooldownKey(KEY)} ${String(deadline)} -> ${String(nowDeadline)} (${remaining} ticks left)`
    );
    test.assert(calls.length === 0, `onDetonate ran ${calls.length} time(s) for the unloaded attack`);
    test.assert(outcome.startsWith("lost@"), `the charge ended ${outcome}, not lost`);
    test.assert(there === 0, `${there} charge entit(ies) in the column after the return`);
    test.assert(block === "minecraft:gold_block", `the target is ${block}`);
    test.assert(nowDeadline === deadline && remaining > 0, `the cooldown moved: ${String(deadline)} -> ${String(nowDeadline)}, ${remaining} ticks left`);
    await goTo(test, p, dim, test.worldBlockLocation(STAND));
    test.succeed();
  } finally {
    record.restore();
    ends.stop();
    if (target !== undefined) {
      try {
        dim.setBlockType(target, "minecraft:air");
      } catch (err) {
        log(`unload cleanup threw ${String(err)}`);
      }
    }
    release?.();
    sweepCharges();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(1600)
  .tag("andrew");

// ---------------------------------------------------------------- AC#7, AC#8: 480 charges, one loop, nothing left

const THREE_STANDS: Vector3[] = [
  { x: 1, y: 2, z: 5 },
  { x: 3, y: 2, z: 5 },
  { x: 5, y: 2, z: 5 },
];
const THREE_TARGETS: Vector3[] = [
  { x: 1, y: 1, z: 3 },
  { x: 3, y: 1, z: 3 },
  { x: 5, y: 1, z: 3 },
];
const CONTROL_TICKS = 40;

interface Window {
  ms: number;
  tick: number;
}
const mark = (): Window => ({ ms: Date.now(), tick: system.currentTick });
const perTick = (a: Window, b: Window): number => (b.ms - a.ms) / Math.max(1, b.tick - a.tick);

registerAsync("andrew", "orbital_flight_load_480", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const record = recordDetonations("rmb");
  const ends = watchEnds();
  const players = THREE_STANDS.map((s, i) => test.spawnSimulatedPlayer(s, `${NAME}_480_${i}`, GameMode.Survival));
  const probes: Entity[] = [];
  try {
    await test.idle(4);
    players.forEach((pl) => arm(pl));
    await test.idle(4);
    test.assert(chargesEverywhere() === 0 && activeAttacks().size === 0, `${chargesEverywhere()} charge(s) and ${activeAttacks().size} attack(s) before the shot`);

    const c0 = mark();
    await test.idle(CONTROL_TICKS);
    const c1 = mark();
    const loop0 = flightLoop();

    const targets = THREE_TARGETS.map((t) => test.worldBlockLocation(t));
    const tick = system.currentTick;
    const attacks = players.map((pl, i) => fire(pl, "rmb", dim, targets[i]));
    const sameTick = system.currentTick === tick;
    const live = dim.getEntities({ type: CHARGE_ENTITY_ID }).filter((e) => attacks.some((a) => e.hasTag(attackTag(a.attackId)))).length;
    const held = [...activeAttacks().values()].reduce((n, a) => n + a.charges.length, 0);
    const heldBy = activeAttacks().size;
    const l0 = mark();
    const running = flightLoop().running;
    let lastEnd = tick;
    for (let n = 0; n < 120 && attacks.some((a) => activeAttacks().has(a.attackId)); n++) {
      await test.idle(1);
      lastEnd = system.currentTick;
    }
    const l1 = mark();
    const loop1 = flightLoop();
    await test.idle(1);
    const outcomes = new Map<string, number>();
    for (const a of attacks) for (const e of ends.of(a.attackId)) outcomes.set(e.outcome, (outcomes.get(e.outcome) ?? 0) + 1);
    const left = chargesEverywhere();
    const control = perTick(c0, c1);
    const loaded = perTick(l0, l1);
    const stepMean = (loop1.ms - loop0.ms) / Math.max(1, loop1.steps - loop0.steps);
    log(
      `load RESULT three RMB in tick ${tick} (same tick ${sameTick}): ${live} charge entities in the spawn tick, ${held} held by ${heldBy} attacks; ` +
        `last ended at +${lastEnd - tick}; outcomes ${[...outcomes].map(([k, v]) => `${k}=${v}`).join(" ")}; after: ${left} charges, ${activeAttacks().size} attacks, ` +
        `loop running ${flightLoop().running} (starts ${loop0.starts}->${flightLoop().starts}, stops ${loop0.stops}->${flightLoop().stops}); onDetonate ${record.calls.length}`
    );
    log(
      `[measure] ORBC-FLIGHT MEASURED ms per tick by currentTick deltas: control ${control.toFixed(2)} over ${c1.tick - c0.tick} ticks, ` +
        `480 charges live ${loaded.toFixed(2)} over ${l1.tick - l0.tick} ticks, added ${(loaded - control).toFixed(2)} ms/tick; ` +
        `flight step ${stepMean.toFixed(2)} ms mean over ${loop1.steps - loop0.steps} steps (${loop1.ms - loop0.ms} ms total)`
    );
    test.assert(sameTick, "the three shots straddled a tick");
    test.assert(live === 480 && held === 480, `${live} charge entities and ${held} held charges in the spawn tick, not 480`);
    test.assert(running, "no flight loop was running with 480 charges in the air");
    test.assert(left === 0 && activeAttacks().size === 0, `${left} charge(s) and ${activeAttacks().size} attack(s) left after the last one ended`);
    test.assert(!flightLoop().running && flightLoop().stops === loop0.stops + 1 && flightLoop().starts === loop0.starts + 1, "the interval was not started once and cleared once");
    test.assert((outcomes.get("detonated") ?? 0) + (outcomes.get("voided") ?? 0) === 480, `outcomes ${[...outcomes].map(([k, v]) => `${k}=${v}`).join(" ")}`);
    test.assert(Number.isFinite(loaded) && Number.isFinite(control) && loop1.steps > loop0.steps, "the measurement did not complete");

    // A charge no attack holds, as a crash would leave one: gone within a second. A foreign scope is left alone.
    const at = test.worldLocation({ x: 3.5, y: 4, z: 1.5 });
    const keep = dim.spawnEntity(CHARGE_ENTITY_ID, test.worldLocation({ x: 5.5, y: 4, z: 1.5 }));
    keep.addTag(attackTag("probe-keep"));
    probes.push(keep);
    dim.runCommand(`summon ${CHARGE_ENTITY_ID} ${at.x} ${at.y} ${at.z}`);
    const summoned = dim.getEntities({ type: CHARGE_ENTITY_ID, location: at, maxDistance: 0.5 })[0];
    test.assert(summoned !== undefined, "the summoned charge is not in the world");
    const summonTick = system.currentTick;
    let goneAt = -1;
    for (let n = 0; n < 20 && goneAt < 0; n++) {
      await test.idle(1);
      if (!summoned.isValid) goneAt = system.currentTick - summonTick;
    }
    log(`load RESULT a stray charge was removed after ${goneAt} tick(s); the foreign-scope control is ${keep.isValid ? "still there" : "GONE"}`);
    test.assert(goneAt > 0 && goneAt <= 20, `a stray charge was still there ${goneAt < 0 ? "20+" : goneAt} ticks later`);
    test.assert(keep.isValid, "the sweep removed a charge of another scope — it would kill the other runtime's live charges");
    test.succeed();
  } finally {
    record.restore();
    ends.stop();
    for (const e of probes) if (e.isValid) e.remove();
    sweepCharges();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(500)
  .tag("andrew");

// ---------------------------------------------------------------- AC#6: restart (two tests, a server restart between them)

const RESTART_DP = "andrew:gt_orbfl_restart";
const RESTART_AREA = "andrew_gt_orbfl_rs";
/**
 * The runner stops the server once it reads the pass line, a few seconds
 * later; each held tick stalls the server this long so that lands within 10
 * ticks of the shot. The charges fall per tick, so the flight is unchanged.
 */
const HOLD_MS = 750;
const HOLD_LIMIT = 14;

interface RestartRecord {
  name: string;
  id: string;
  deadline: number;
  shotTick: number;
  attackId: string;
  charges: number;
  target: Vector3;
  held: number;
  live: number;
  lowestY: number;
}

function holdUntilStopped(rec: RestartRecord): void {
  const handle = system.runInterval(() => {
    const until = Date.now() + HOLD_MS;
    while (Date.now() < until) {
      // Stalls the server tick; see HOLD_MS.
    }
    const attack = activeAttacks().get(rec.attackId);
    rec.held = system.currentTick - rec.shotTick;
    rec.live = attack?.charges.length ?? 0;
    rec.lowestY = Math.min(...(attack?.charges.map((c) => c.y) ?? [rec.lowestY]));
    world.setDynamicProperty(RESTART_DP, JSON.stringify(rec));
    log(`restart hold +${rec.held}: ${rec.live} charge(s) in flight, lowest y ${rec.lowestY}`);
    if (rec.held >= HOLD_LIMIT) system.clearRun(handle);
  }, 1);
}

registerAsync("andrew", "orbital_flight_restart_fire", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const p = test.spawnSimulatedPlayer(STAND, `${NAME}_rs_p`, GameMode.Survival);
  await test.idle(4);
  arm(p);
  const t = test.worldBlockLocation(FLOOR_T);
  const added = dim.runCommand(`tickingarea add ${t.x - 9} 0 ${t.z - 9} ${t.x + 9} 0 ${t.z + 9} ${RESTART_AREA}`).successCount;
  test.assert(added > 0, "tickingarea add refused: the site would not load after the restart");
  world.setDynamicProperty(RESTART_DP, undefined);
  await test.idle(2);
  const attack = fire(p, "rmb", dim, t);
  const deadline = p.getDynamicProperty(cooldownKey(KEY));
  test.assert(typeof deadline === "number", `${cooldownKey(KEY)} is ${String(deadline)} after the shot`);
  const rec: RestartRecord = {
    name: p.name,
    id: p.id,
    deadline: deadline as number,
    shotTick: system.currentTick,
    attackId: attack.attackId,
    charges: attack.charges.length,
    target: t,
    held: 0,
    live: attack.charges.length,
    lowestY: attack.spawnY,
  };
  world.setDynamicProperty(RESTART_DP, JSON.stringify(rec));
  log(`restart RESULT armed: ${JSON.stringify(rec)}`);
  holdUntilStopped(rec);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(100)
  .tag("andrew");

registerAsync("andrew", "orbital_flight_restart_check", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const lmb = recordDetonations("lmb");
  const rmb = recordDetonations("rmb");
  try {
    const raw = world.getDynamicProperty(RESTART_DP);
    test.assert(typeof raw === "string", "no record from orbital_flight_restart_fire: it did not run in this world before the restart");
    const rec = JSON.parse(raw as string) as RestartRecord;
    const t = rec.target;
    const startTick = system.currentTick;
    const removedAfterBoot = [...boot.removed].filter(([, tick]) => tick >= boot.worldLoadTick);
    const lateRemovals = removedAfterBoot.filter(([id, tick]) => tick - (boot.loaded.get(id) ?? boot.worldLoadTick) > 20);
    log(
      `restart RESULT before the stop: shot at ${rec.shotTick}, held +${rec.held} tick(s), ${rec.live} of ${rec.charges} charge(s) in flight, lowest y ${rec.lowestY}; ` +
        `after the start (world loaded at tick ${boot.worldLoadTick}): ${boot.loaded.size} charge load event(s), ${removedAfterBoot.length} charge removal(s) at ticks ` +
        `${[...new Set(removedAfterBoot.map(([, tick]) => tick))].join(",")}, ${lateRemovals.length} later than 20 ticks after their load`
    );
    test.assert(rec.held <= 10, `the server stopped ${rec.held} ticks after the shot, not within 10`);
    test.assert(rec.live > 0, "no charge was in flight at the stop: the run proves nothing");
    test.assert(removedAfterBoot.length >= rec.live, `${removedAfterBoot.length} leftover charge(s) removed after the start, ${rec.live} were in flight at the stop`);
    test.assert(lateRemovals.length === 0, `${lateRemovals.length} leftover charge(s) removed more than 20 ticks after they loaded`);

    const area = { location: { x: t.x - 9, y: t.y - 2, z: t.z - 9 }, volume: { x: 18, y: 40, z: 18 } };
    let most = 0;
    for (let n = 0; n < 100; n++) {
      most = Math.max(most, dim.getEntities({ type: CHARGE_ENTITY_ID, ...area }).length, chargesEverywhere());
      await test.idle(1);
    }
    const late = lmb.calls.length + rmb.calls.length;
    log(`restart RESULT over ${system.currentTick - startTick} ticks: charges seen at most ${most}, detonations ${late}, attacks live ${activeAttacks().size}`);
    test.assert(most === 0, `${most} charge entit(ies) in the loaded area after the restart`);
    test.assert(late === 0 && activeAttacks().size === 0, `${late} late detonation(s), ${activeAttacks().size} live attack(s)`);

    // P's deadline is readable only if the player survived the stop. A SimulatedPlayer is a new
    // player after a restart (new id, no dynamic properties), so there the equality is not measurable.
    const p = test.spawnSimulatedPlayer(STAND, rec.name, GameMode.Survival);
    await test.idle(4);
    const now = p.getDynamicProperty(cooldownKey(KEY));
    const samePlayer = p.id === rec.id;
    log(
      `restart RESULT ${rec.name}: id ${p.id} (before the stop ${rec.id}), ${cooldownKey(KEY)} ${String(now)} (before the stop ${rec.deadline}); ` +
        (samePlayer ? "the same player: deadline compared" : "NOT MEASURABLE: a SimulatedPlayer does not survive a stop, so P's deadline cannot be read back")
    );
    if (samePlayer) test.assert(now === rec.deadline, `${cooldownKey(KEY)} is ${String(now)} after the restart, ${rec.deadline} before it`);
    test.succeed();
  } finally {
    lmb.restore();
    rmb.restore();
    try {
      dim.runCommand(`tickingarea remove ${RESTART_AREA}`);
    } catch (err) {
      log(`tickingarea remove ${RESTART_AREA} threw ${String(err)}`);
    }
    world.setDynamicProperty(RESTART_DP, undefined);
    sweepCharges();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");
