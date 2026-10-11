// The Above-Water Trident's throw and return on BDS (TRDT-THROW-01; L0-trdt-a004, R-trdt-001). Every
// scenario runs the R-trdt-001 observer: at every tick it counts the live copies of the thrown instance in
// every place one can be — any player's inventory and off hand, item entities, the owed and pending
// ledgers, custody records — and the custody entities of its throws. A tick with a count other than 1
// (or two custody entities) fails the scenario. Each scenario has its own far pad, loaded by ticking areas.

import { BlockVolume, type Container, Difficulty, type Dimension, type Entity, GameMode, ItemStack, type Player, type Vector3, system, world } from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { TRIDENT } from "../legendary/registry";
import { withoutOwed } from "../legendary/rules";
import { getMark, isLive, ledgerGen, makeMark, markItem, offhandOf, readOwed, readPending, writeOwed } from "../legendary/state";
import type { Box } from "../structures/clear";
import { CUSTODY_TYPES, type CustodyEvent, custodyRecords, onCustody, throwIdOf } from "../trident/custody";
import { holdCustodyForRestart, registerTridentThrow } from "../trident/throw";
import { RETURN_CAP_TICKS } from "../trident/throw-rules";
import { loadBox } from "./structures-place";

// The release pack's copy cannot read a SimulatedPlayer's release; this runtime's copy, scope "gt", is
// the one the scenarios drive (the same binding problem as every legendary in main.ts).
registerTridentThrow("gt");

const STRUCTURE = "andrew:platform";
const DIMENSIONS = ["overworld", "nether", "the_end"];
const UNLOAD_HOWS = new Set(["custody entity unloaded", "custody entity removed", "custody entity not ticking"]);

const log = (msg: string): void => console.warn(`[gametest] trident throw ${msg}`);
const f2 = (n: number): string => n.toFixed(2);
const v2 = (v: Vector3): string => `${f2(v.x)},${f2(v.y)},${f2(v.z)}`;
const dist = (a: Vector3, b: Vector3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const hdist = (a: Vector3, b: Vector3): number => Math.hypot(a.x - b.x, a.z - b.z);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

/** Every custody transition since this script loaded; the restart check reads what happened at boot. */
const allEvents: CustodyEvent[] = [];
onCustody((event) => allEvents.push(event));

function fill(dim: Dimension, a: Vector3, b: Vector3, block: string): void {
  dim.fillBlocks(new BlockVolume(a, b), block);
}

interface Pad {
  dim: Dimension;
  /** World position of the pad origin; y=0 is the floor's top layer, players stand at y=1. */
  at(x: number, y: number, z: number): Vector3;
  /** The same point, test-relative (lookAtLocation and spawn helpers take these). */
  rel(x: number, y: number, z: number): Vector3;
  unload(): void;
  clear(): void;
}

const PAD_SIZE = { x0: -12, x1: 30, z0: -10, z1: 10, height: 10 };

/** A stone floor far from every other scenario, held loaded by ticking areas until `unload`. */
async function openPad(test: Test, area: string, field: Vector3, dim: Dimension = test.getDimension()): Promise<Pad> {
  const o = dim.id === test.getDimension().id ? test.worldBlockLocation(field) : field;
  const box: Box = { min: [o.x + PAD_SIZE.x0 - 4, 0, o.z + PAD_SIZE.z0 - 4], max: [o.x + PAD_SIZE.x1 + 4, 0, o.z + PAD_SIZE.z1 + 4] };
  const unload = await loadBox(test, dim, area, box);
  const at = (x: number, y: number, z: number): Vector3 => ({ x: o.x + x, y: o.y + y, z: o.z + z });
  const lo = at(PAD_SIZE.x0, -1, PAD_SIZE.z0);
  const hi = at(PAD_SIZE.x1, PAD_SIZE.height, PAD_SIZE.z1);
  const clear = (): void => {
    try {
      for (let x = lo.x; x <= hi.x; x += 8) fill(dim, { x, y: lo.y, z: lo.z }, { x: Math.min(hi.x, x + 7), y: hi.y, z: hi.z }, "minecraft:air");
    } catch (err) {
      log(`clearing pad ${area} threw ${errText(err)}`);
    }
  };
  clear();
  for (let x = lo.x; x <= hi.x; x += 8) fill(dim, { x, y: lo.y, z: lo.z }, { x: Math.min(hi.x, x + 7), y: lo.y + 1, z: hi.z }, "minecraft:stone");
  return {
    dim,
    at,
    rel: (x, y, z) => ({ x: field.x + x, y: field.y + y, z: field.z + z }),
    unload,
    clear,
  };
}

async function survivor(test: Test, where: Vector3, name: string): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(where, name, GameMode.Survival);
  await test.idle(2);
  p.addEffect("resistance", 20000, { amplifier: 4, showParticles: false });
  p.getComponent("minecraft:health")?.resetToMaxValue();
  return p;
}

function inventory(p: Player): Container {
  const c = p.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error(`${p.name} has no inventory`);
  return c;
}

/** A marked admin copy in slot 0, selected; returns its instance id. Give first, then aim (setItem resets the head). */
function giveMarked(p: SimulatedPlayer): string {
  const mark = makeMark("admin", p);
  p.setItem(markItem(TRIDENT, new ItemStack(TRIDENT.itemId), mark), 0, true);
  return mark.id;
}

/** Gens of this instance's live copies in `p`'s inventory and off hand. */
function heldGens(p: Player, markId: string): number[] {
  const out: number[] = [];
  const c = p.getComponent("minecraft:inventory")?.container;
  const stacks = [...Array.from({ length: c?.size ?? 0 }, (_, i) => c?.getItem(i)), offhandOf(p)];
  for (const s of stacks) {
    if (s?.typeId !== TRIDENT.itemId) continue;
    const m = getMark(TRIDENT, s);
    if (m?.id === markId && isLive(TRIDENT, m)) out.push(m.gen);
  }
  return out;
}

function tridentsIn(p: Player): number {
  const c = p.getComponent("minecraft:inventory")?.container;
  let n = offhandOf(p)?.typeId === TRIDENT.itemId ? 1 : 0;
  for (let i = 0; i < (c?.size ?? 0); i++) if (c?.getItem(i)?.typeId === TRIDENT.itemId) n++;
  return n;
}

function owedGens(markId: string): Array<{ target: string; gen: number; reason: string }> {
  const out: Array<{ target: string; gen: number; reason: string }> = [];
  for (const [target, entries] of Object.entries(readOwed(TRIDENT))) {
    for (const e of entries) if (e.mark.id === markId && isLive(TRIDENT, e.mark)) out.push({ target, gen: e.mark.gen, reason: e.reason });
  }
  return out;
}

function clearOwed(target: string, markId: string): void {
  for (const e of readOwed(TRIDENT)[target] ?? []) if (e.mark.id === markId) writeOwed(TRIDENT, withoutOwed(readOwed(TRIDENT), target, e.mark));
}

function custodyEntities(throwIds: ReadonlySet<string>): Entity[] {
  const out: Entity[] = [];
  for (const d of DIMENSIONS) {
    for (const type of CUSTODY_TYPES) {
      for (const e of world.getDimension(d).getEntities({ type })) {
        const id = throwIdOf(e);
        if (id !== undefined && throwIds.has(id)) out.push(e);
      }
    }
  }
  return out;
}

/** R-trdt-001: where the live copies of `markId` are right now. */
function liveCopies(markId: string): string[] {
  const where: string[] = [];
  const ours = (s: ItemStack | undefined): boolean => {
    if (s?.typeId !== TRIDENT.itemId) return false;
    const m = getMark(TRIDENT, s);
    return m?.id === markId && isLive(TRIDENT, m);
  };
  for (const p of world.getAllPlayers()) {
    if (p?.isValid !== true) continue;
    const c = p.getComponent("minecraft:inventory")?.container;
    for (let i = 0; i < (c?.size ?? 0); i++) if (ours(c?.getItem(i))) where.push(`${p.name} slot ${i}`);
    if (ours(offhandOf(p))) where.push(`${p.name} off hand`);
    for (const m of readPending(TRIDENT, p)) if (m.id === markId && isLive(TRIDENT, m)) where.push(`${p.name} pending`);
  }
  for (const d of DIMENSIONS) {
    for (const e of world.getDimension(d).getEntities({ type: "minecraft:item" })) {
      if (ours(e.getComponent("minecraft:item")?.itemStack)) where.push(`item entity ${e.id}`);
    }
  }
  for (const o of owedGens(markId)) where.push(`owed to ${o.target}`);
  for (const r of custodyRecords()) if (r.mark?.id === markId && isLive(TRIDENT, r.mark)) where.push(`custody ${r.state}`);
  return where;
}

interface Observer {
  readonly violations: string[];
  readonly throwIds: Set<string>;
  readonly events: CustodyEvent[];
  ticks: number;
  maxEntities: number;
  stop(): void;
  wait(test: Test, kind: CustodyEvent["kind"], maxTicks: number, from?: number): Promise<CustodyEvent | undefined>;
  summary(): string;
}

function observe(markId: string): Observer {
  const start = system.currentTick;
  const obs: Observer = {
    violations: [],
    throwIds: new Set(),
    events: [],
    ticks: 0,
    maxEntities: 0,
    stop: () => {
      system.clearRun(interval);
      unsubscribe();
    },
    wait: async (test, kind, maxTicks, from = 0) => {
      for (let t = 0; t <= maxTicks; t++) {
        const found = obs.events.slice(from).find((e) => e.kind === kind);
        if (found !== undefined) return found;
        await test.idle(1);
      }
      return undefined;
    },
    summary: () => `${obs.ticks} ticks observed, ${obs.violations.length} violation(s), max ${obs.maxEntities} custody entit(ies) at once`,
  };
  const unsubscribe = onCustody((e) => {
    if (e.kind === "thrown") obs.throwIds.add(e.throwId);
    if (obs.throwIds.has(e.throwId)) obs.events.push(e);
  });
  const interval = system.runInterval(() => {
    obs.ticks++;
    const where = liveCopies(markId);
    const entities = custodyEntities(obs.throwIds).length;
    obs.maxEntities = Math.max(obs.maxEntities, entities);
    if (where.length !== 1 || entities > 1) {
      const line = `+${system.currentTick - start}: ${where.length} live [${where.join("; ") || "nowhere"}], ${entities} custody entities`;
      if (obs.violations.length < 12) log(`OBSERVER ${line}`);
      obs.violations.push(line);
    }
  }, 1);
  return obs;
}

async function aim(test: Test, p: SimulatedPlayer, relTarget: Vector3): Promise<void> {
  p.lookAtLocation(relTarget, LookDuration.Instant);
  await test.idle(2);
}

async function release(test: Test, p: SimulatedPlayer, hold: number): Promise<boolean> {
  let ok = p.useItemInSlot(p.selectedSlotIndex);
  if (!ok) {
    await test.idle(2);
    ok = p.useItemInSlot(p.selectedSlotIndex);
  }
  await test.idle(hold);
  p.stopUsingItem();
  return ok;
}

interface Follow {
  samples: Array<{ tick: number; at: Vector3; stone: boolean }>;
  stop(): void;
}

/** Samples the return body of every observed throw once a tick, from before the turn until it is gone. */
function follow(obs: Observer, dim: Dimension): Follow {
  const samples: Follow["samples"] = [];
  const interval = system.runInterval(() => {
    for (const r of custodyRecords()) {
      if (!obs.throwIds.has(r.throwId) || r.state !== "returning" || r.entityId === undefined) continue;
      const e = world.getEntity(r.entityId);
      if (e?.isValid !== true) continue;
      const at = { ...e.location };
      let stone = false;
      try {
        stone = dim.getBlock(at)?.typeId === "minecraft:stone";
      } catch {
        // Unloaded cell.
      }
      samples.push({ tick: system.currentTick, at, stone });
    }
  }, 1);
  return { samples, stop: () => system.clearRun(interval) };
}

/**
 * The return measured from the samples alone. `t0` is the last tick the body stood at the hit point (the
 * turn's own tick when no sample caught it there); `startLag` is how many ticks after the turn the first
 * step was taken, read from the first moved sample (0.5 b per step).
 */
function measure(turned: CustodyEvent & { at: Vector3 }, samples: Follow["samples"]) {
  const still = samples.filter((x) => dist(x.at, turned.at) < 0.01);
  const t0 = still.length > 0 ? still[still.length - 1].tick : turned.tick;
  const firstMove = samples.find((x) => dist(x.at, turned.at) >= 0.01);
  const startLag = firstMove === undefined ? undefined : firstMove.tick - turned.tick - Math.round(dist(firstMove.at, turned.at) / 0.5);
  let path = 0;
  let prev = turned.at;
  let t20: number | undefined;
  for (const x of samples) {
    path += dist(prev, x.at);
    prev = x.at;
    if (t20 === undefined && path >= 20 - 1e-6) t20 = x.tick - t0;
  }
  const moving = samples.filter((x) => dist(x.at, turned.at) >= 0.01);
  const steps = moving.slice(1).map((x, i) => dist(x.at, moving[i].at));
  return { t0, firstMove, startLag, path, t20, steps, inStone: samples.filter((x) => x.stone).length };
}

function finish(test: Test, obs: Observer, label: string): void {
  log(`${label} OBSERVER ${obs.summary()}`);
  test.assert(obs.ticks > 0, `${label}: the observer never ran`);
  test.assert(obs.violations.length === 0, `${label}: live copies != 1 or two custody entities: ${obs.violations.slice(0, 3).join(" | ")}`);
}

const EAST_WALL_X = 23;

/** A wall across the throw line at x..x+1; the thrower stands at (0.5, 1, 0.5). */
function wallAt(pad: Pad, x: number): void {
  fill(pad.dim, pad.at(x, 1, -4), pad.at(x + 1, 9, 4), "minecraft:stone");
}

// ------------------------------------------------ AC 1 + 2: a wall 23 blocks out, the return through a second wall

registerAsync("andrew", "trident_throw_wall_return", async (test: Test): Promise<void> => {
  const FIELD = { x: 3200, y: 1, z: 0 };
  const pad = await openPad(test, "andrew_gt_trth_wall", FIELD);
  const hitBlockTicks: number[] = [];
  const hb = world.afterEvents.projectileHitBlock.subscribe((e) => {
    if (e.projectile.typeId === "andrew:trident_in_flight") hitBlockTicks.push(system.currentTick);
  });
  let obs: Observer | undefined;
  let body: Follow | undefined;
  let p: SimulatedPlayer | undefined;
  try {
    p = await survivor(test, pad.rel(0.5, 1, 0.5), "trth_wall");
    const markId = giveMarked(p);
    wallAt(pad, EAST_WALL_X);
    await aim(test, p, pad.rel(EAST_WALL_X, 4, 0.5));
    obs = observe(markId);
    body = follow(obs, pad.dim);
    const used = await release(test, p, 20);
    const thrown = await obs.wait(test, "thrown", 10);
    test.assert(thrown !== undefined, `the standing release after 20 ticks did not throw (useItemInSlot=${used})`);
    const turned = await obs.wait(test, "turned", 40);
    test.assert(turned !== undefined && turned.at !== undefined, "the trident never turned back");
    if (turned === undefined || turned.at === undefined) return;
    // A second wall across the return line only: the flight is already past it.
    fill(pad.dim, pad.at(10, 1, -3), pad.at(12, 6, 3), "minecraft:stone");

    // AC 2 during the return: nothing in hand, and a release does nothing.
    let heldDuring = 0;
    const handWatch = system.runInterval(() => {
      if (p?.isValid === true && custodyRecords().some((r) => r.state === "returning")) heldDuring += tridentsIn(p);
    }, 1);
    await test.idle(8);
    const recordsBefore = custodyRecords().length;
    const retry = p.useItemInSlot(0);
    await test.idle(12);
    p.stopUsingItem();
    await test.idle(1);
    const thrownCount = obs.events.filter((e) => e.kind === "thrown").length;
    const recordsAfter = custodyRecords().length;
    const arrived = await obs.wait(test, "arrived", 80);
    system.clearRun(handWatch);
    body.stop();

    const m = measure({ ...turned, at: turned.at }, body.samples);
    const gens = heldGens(p, markId);
    const slot0 = getMark(TRIDENT, inventory(p).getItem(0) ?? new ItemStack("minecraft:stick"));
    log(
      `wall RESULT hit block at ${v2(turned.at)} (${f2(hdist(turned.at, p.location))} out) on tick ${hitBlockTicks[0] ?? "-"}, turned on tick ${turned.tick} (${turned.how}); ` +
        `body last at the hit point on tick ${m.t0}, first moved sample +${m.firstMove === undefined ? "-" : m.firstMove.tick - turned.tick} t at ${f2(m.firstMove === undefined ? Number.NaN : dist(m.firstMove.at, turned.at))} from the hit (steering started ${m.startLag ?? "-"} t after the turn's next tick); ` +
        `20 blocks covered in ${m.t20 ?? "-"} t = ${m.t20 === undefined ? "-" : f2(m.t20 / 20)} s (${m.t20 === undefined ? "-" : f2(20 / (m.t20 / 20))} b/s); ` +
        `step min ${f2(Math.min(...m.steps))} max ${f2(Math.max(...m.steps))}; path ${f2(m.path)} in ${body.samples.length} samples; ${m.inStone} ticks inside the second wall; ` +
        `arrived at +${arrived === undefined ? "-" : arrived.tick - turned.tick} t into ${arrived?.how ?? "-"}; ` +
        `during the return: tridents in the thrower's slots ${heldDuring}, use on the empty slot ${retry}, throws ${thrownCount}, records ${recordsBefore} -> ${recordsAfter}; ` +
        `after: slot 0 mark ${slot0?.id === markId ? `same instance gen ${slot0.gen}` : "none"}, live gens held [${gens.join(",")}]`
    );
    test.assert(hitBlockTicks.length > 0 && hitBlockTicks[0] === turned.tick, `the return did not start on the block hit: hit ${hitBlockTicks[0]}, turned ${turned.tick}`);
    test.assert(m.startLag !== undefined && m.startLag >= 0 && m.startLag <= 1, `the return did not start on the tick after the hit (lag ${m.startLag})`);
    test.assert(m.t20 !== undefined && m.t20 >= 38 && m.t20 <= 42, `20 blocks took ${m.t20} ticks, not 40 ± 5 %`);
    test.assert(m.inStone >= 4, `the return did not pass through the 3-block wall (${m.inStone} ticks inside)`);
    test.assert(heldDuring === 0, `the thrower held a trident during the return (${heldDuring} slot-ticks)`);
    test.assert(thrownCount === 1 && recordsAfter === recordsBefore, `a release during the return threw again (throws ${thrownCount}, records ${recordsBefore} -> ${recordsAfter})`);
    test.assert(arrived !== undefined && arrived.how === "slot 0", `the trident did not come back into the selected slot: ${arrived?.how}`);
    test.assert(slot0?.id === markId && slot0.gen === 0, "slot 0 does not hold the thrown instance at its own generation");
    test.assert(custodyRecords().length === 0 && custodyEntities(obs.throwIds).length === 0, "custody outlived the return");
    finish(test, obs, "wall");
  } finally {
    obs?.stop();
    body?.stop();
    world.afterEvents.projectileHitBlock.unsubscribe(hb);
    if (p?.isValid === true) test.removeSimulatedPlayer(p);
    pad.clear();
    pad.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ------------------------------------------------ AC 3: a hit on a zombie turns back from the hit point

registerAsync("andrew", "trident_throw_zombie_return", async (test: Test): Promise<void> => {
  const FIELD = { x: 3600, y: 1, z: 0 };
  const pad = await openPad(test, "andrew_gt_trth_zomb", FIELD);
  const difficulty = world.getDifficulty();
  let obs: Observer | undefined;
  let body: Follow | undefined;
  let p: SimulatedPlayer | undefined;
  let zombie: Entity | undefined;
  const hits: Array<{ tick: number; at: Vector3; what: string }> = [];
  const he = world.afterEvents.projectileHitEntity.subscribe((e) => {
    if (e.projectile.typeId === "andrew:trident_in_flight") hits.push({ tick: system.currentTick, at: { ...e.location }, what: e.getEntityHit().entity?.typeId ?? "?" });
  });
  try {
    p = await survivor(test, pad.rel(0.5, 1, 0.5), "trth_zombie");
    const markId = giveMarked(p);
    world.setDifficulty(Difficulty.Easy);
    zombie = test.spawnWithoutBehaviors("minecraft:zombie", pad.rel(8.5, 1, 0.5));
    await test.idle(2);
    await aim(test, p, pad.rel(8.5, 2, 0.5));
    obs = observe(markId);
    body = follow(obs, pad.dim);
    const zAt = { ...zombie.location };
    await release(test, p, 20);
    const turned = await obs.wait(test, "turned", 40);
    test.assert(turned !== undefined && turned.at !== undefined, "the trident never turned back");
    if (turned === undefined || turned.at === undefined) return;
    const arrived = await obs.wait(test, "arrived", 60);
    body.stop();
    const m = measure({ ...turned, at: turned.at }, body.samples);
    const first = m.firstMove;
    const hit = hits[0];
    log(
      `zombie RESULT turned on "${turned.how}" at ${v2(turned.at)}; zombie at ${v2(zAt)} (${f2(hdist(turned.at, zAt))} horizontal, ${f2(turned.at.y - zAt.y)} up); ` +
        `projectileHitEntity ${hit === undefined ? "none" : `${hit.what} on tick ${hit.tick} at ${v2(hit.at)} (${f2(dist(hit.at, turned.at))} from the turn), turn on tick ${turned.tick}`}; ` +
        `first moved sample ${first === undefined ? "-" : `+${first.tick - turned.tick} t at ${f2(dist(first.at, turned.at))} from the hit point (lag ${m.startLag})`}; ` +
        `arrived +${arrived === undefined ? "-" : arrived.tick - turned.tick} t into ${arrived?.how ?? "-"}; held gens [${heldGens(p, markId).join(",")}]`
    );
    test.assert(turned.how === "hit minecraft:zombie", `the trident turned on ${turned.how}, not on the zombie`);
    test.assert(hdist(turned.at, zAt) <= 1.0 && turned.at.y >= zAt.y - 0.1 && turned.at.y <= zAt.y + 2.1, "the turn is not at the zombie");
    test.assert(hit !== undefined && hit.tick === turned.tick && dist(hit.at, turned.at) < 0.01, "the return body was not put at the entity hit point in the hit tick");
    test.assert(m.startLag !== undefined && m.startLag >= 0 && m.startLag <= 1, `the return did not start on the tick after the hit (lag ${m.startLag})`);
    test.assert(arrived !== undefined && heldGens(p, markId).join() === "0", "the trident did not come back from the zombie");
    finish(test, obs, "zombie");
  } finally {
    obs?.stop();
    body?.stop();
    world.afterEvents.projectileHitEntity.unsubscribe(he);
    if (zombie?.isValid === true) zombie.remove();
    world.setDifficulty(difficulty);
    if (p?.isValid === true) test.removeSimulatedPlayer(p);
    pad.clear();
    pad.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

// ------------------------------------------------ AC 4: fallbacks, each ending with exactly one live copy

registerAsync("andrew", "trident_throw_thrower_dies", async (test: Test): Promise<void> => {
  const FIELD = { x: 4000, y: 1, z: 0 };
  const pad = await openPad(test, "andrew_gt_trth_dies", FIELD);
  let obs: Observer | undefined;
  let p: SimulatedPlayer | undefined;
  let markId = "";
  try {
    p = await survivor(test, pad.rel(0.5, 1, 0.5), "trth_dies");
    p.removeEffect("resistance");
    markId = giveMarked(p);
    wallAt(pad, EAST_WALL_X);
    await aim(test, p, pad.rel(EAST_WALL_X, 4, 0.5));
    obs = observe(markId);
    await release(test, p, 20);
    const thrown = await obs.wait(test, "thrown", 10);
    test.assert(thrown !== undefined, "no throw");
    p.kill();
    const delivered = await obs.wait(test, "delivered", 20);
    await test.idle(2);
    const owedDead = owedGens(markId);
    const flyingLeft = custodyEntities(obs.throwIds).length;
    const stateDead = obs.events.map((e) => e.kind).join(">");
    p.respawn();
    for (let t = 0; t < 40 && heldGens(p, markId).length === 0; t++) await test.idle(1);
    await test.idle(2);
    const gens = heldGens(p, markId);
    log(
      `dies RESULT events ${stateDead}; delivered "${delivered?.how ?? "-"}"; while dead: owed ${owedDead.map((o) => `${o.target === p?.id ? "thrower" : o.target} gen ${o.gen}`).join(",") || "none"}, ` +
        `custody entities ${flyingLeft}, records ${custodyRecords().length}; after respawn: held gens [${gens.join(",")}], owed ${owedGens(markId).length}, ledger gen ${ledgerGen(TRIDENT, markId)}`
    );
    test.assert(delivered?.how === "thrower died", `death mid-flight was not delivered as a death: ${delivered?.how}`);
    test.assert(owedDead.length === 1 && owedDead[0].target === p.id && owedDead[0].gen === 1, "while dead, the copy is not owed to the thrower at gen 1");
    test.assert(flyingLeft === 0, "the custody entity outlived the delivery");
    test.assert(gens.join() === "1" && owedGens(markId).length === 0, "after respawn the thrower does not hold exactly the gen-1 copy");
    finish(test, obs, "dies");
  } finally {
    obs?.stop();
    if (p?.isValid === true) {
      clearOwed(p.id, markId);
      test.removeSimulatedPlayer(p);
    }
    pad.clear();
    pad.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

registerAsync("andrew", "trident_throw_thrower_leaves", async (test: Test): Promise<void> => {
  const FIELD = { x: 4400, y: 1, z: 0 };
  const pad = await openPad(test, "andrew_gt_trth_left", FIELD);
  let obs: Observer | undefined;
  let p: SimulatedPlayer | undefined;
  let ownerId = "";
  let markId = "";
  try {
    p = await survivor(test, pad.rel(0.5, 1, 0.5), "trth_leaves");
    ownerId = p.id;
    markId = giveMarked(p);
    wallAt(pad, EAST_WALL_X);
    await aim(test, p, pad.rel(EAST_WALL_X, 4, 0.5));
    obs = observe(markId);
    await release(test, p, 20);
    test.assert((await obs.wait(test, "thrown", 10)) !== undefined, "no throw");
    p.disconnect();
    const delivered = await obs.wait(test, "delivered", 20);
    await test.idle(5);
    const owed = owedGens(markId);
    log(
      `leaves RESULT delivered "${delivered?.how ?? "-"}"; owed ${owed.map((o) => `${o.target === ownerId ? "thrower" : o.target} gen ${o.gen} (${o.reason})`).join(",") || "none"}; ` +
        `custody entities ${custodyEntities(obs.throwIds).length}, records ${custodyRecords().length}. A SimulatedPlayer cannot rejoin with the same id: the payment on the next spawn is recovery's playerSpawn path (legendary_hold_void_holder_offline)`
    );
    test.assert(delivered?.how === "thrower offline", `leaving mid-flight was not delivered as offline: ${delivered?.how}`);
    test.assert(owed.length === 1 && owed[0].target === ownerId && owed[0].gen === 1, "the copy is not owed to the thrower at gen 1");
    test.assert(custodyEntities(obs.throwIds).length === 0 && custodyRecords().length === 0, "custody outlived the delivery");
    finish(test, obs, "leaves");
  } finally {
    obs?.stop();
    clearOwed(ownerId, markId);
    if (p?.isValid === true) test.removeSimulatedPlayer(p);
    pad.clear();
    pad.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

registerAsync("andrew", "trident_throw_dimension_change", async (test: Test): Promise<void> => {
  const FIELD = { x: 4800, y: 1, z: 0 };
  const pad = await openPad(test, "andrew_gt_trth_dim", FIELD);
  const nether = world.getDimension("nether");
  const N = { x: 600, y: 70, z: 0 };
  const unloadNether = await loadBox(test, nether, "andrew_gt_trth_neth", { min: [N.x - 8, 0, N.z - 8], max: [N.x + 8, 0, N.z + 8] });
  let obs: Observer | undefined;
  let p: SimulatedPlayer | undefined;
  try {
    fill(nether, { x: N.x - 2, y: N.y - 1, z: N.z - 2 }, { x: N.x + 2, y: N.y - 1, z: N.z + 2 }, "minecraft:stone");
    fill(nether, { x: N.x - 2, y: N.y, z: N.z - 2 }, { x: N.x + 2, y: N.y + 3, z: N.z + 2 }, "minecraft:air");
    p = await survivor(test, pad.rel(0.5, 1, 0.5), "trth_dimension");
    const markId = giveMarked(p);
    wallAt(pad, EAST_WALL_X);
    await aim(test, p, pad.rel(EAST_WALL_X, 4, 0.5));
    obs = observe(markId);
    await release(test, p, 20);
    const turned = await obs.wait(test, "turned", 40);
    test.assert(turned !== undefined, "the trident never turned back");
    await test.idle(4);
    p.teleport({ x: N.x + 0.5, y: N.y, z: N.z + 0.5 }, { dimension: nether });
    const delivered = await obs.wait(test, "delivered", 20);
    await test.idle(2);
    const gens = heldGens(p, markId);
    log(
      `dimension RESULT thrower in ${p.dimension.id}; delivered "${delivered?.how ?? "-"}"; held gens [${gens.join(",")}]; ` +
        `custody entities ${custodyEntities(obs.throwIds).length}, records ${custodyRecords().length}`
    );
    test.assert(p.dimension.id === nether.id, "the thrower did not reach the Nether");
    test.assert(delivered?.how === "thrower changed dimension", `the dimension change was not delivered as such: ${delivered?.how}`);
    test.assert(gens.join() === "1", `the thrower does not hold exactly the gen-1 copy in the Nether: [${gens.join(",")}]`);
    test.assert(custodyEntities(obs.throwIds).length === 0, "the return body outlived the delivery");
    finish(test, obs, "dimension");
  } finally {
    obs?.stop();
    if (p?.isValid === true) {
      p.teleport(pad.at(0.5, 1, 0.5), { dimension: test.getDimension() });
      test.removeSimulatedPlayer(p);
    }
    try {
      fill(nether, { x: N.x - 2, y: N.y - 1, z: N.z - 2 }, { x: N.x + 2, y: N.y + 3, z: N.z + 2 }, "minecraft:air");
    } catch (err) {
      log(`nether cleanup threw ${errText(err)}`);
    }
    unloadNether();
    pad.clear();
    pad.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

registerAsync("andrew", "trident_throw_chunk_unload", async (test: Test): Promise<void> => {
  const FIELD = { x: 5200, y: 1, z: 0 };
  const AREA = "andrew_gt_trth_unld";
  let pad = await openPad(test, AREA, FIELD);
  let obs: Observer | undefined;
  let p: SimulatedPlayer | undefined;
  let reopened = false;
  try {
    p = await survivor(test, pad.rel(0.5, 1, 0.5), "trth_unload");
    const markId = giveMarked(p);
    wallAt(pad, EAST_WALL_X);
    await aim(test, p, pad.rel(EAST_WALL_X, 4, 0.5));
    obs = observe(markId);
    await release(test, p, 20);
    const turned = await obs.wait(test, "turned", 40);
    test.assert(turned !== undefined, "the trident never turned back");
    // The thrower goes home, 5 200 blocks off, and nothing holds the pad any more.
    p.teleport(test.worldLocation({ x: 1.5, y: 2, z: 1.5 }));
    await test.idle(1);
    pad.unload();
    const delivered = await obs.wait(test, "delivered", 200);
    await test.idle(2);
    const gens = heldGens(p, markId);
    const resolvable = turned?.entityId === undefined ? false : world.getEntity(turned.entityId)?.isValid === true;
    // Back to the pad: whatever was saved with its chunk loads now and must not come back as a copy.
    const from = obs.events.length;
    pad = await openPad(test, AREA, FIELD);
    reopened = true;
    await test.idle(10);
    const later = obs.events.slice(from).map((e) => `${e.kind}${e.how === undefined ? "" : ` (${e.how})`}`);
    log(
      `unload RESULT delivered "${delivered?.how ?? "-"}" +${delivered === undefined || turned === undefined ? "-" : delivered.tick - turned.tick} t after the turn; ` +
        `body resolvable after it ${resolvable}; held gens [${gens.join(",")}]; after reloading the pad: ${later.join(", ") || "no custody event"}, ` +
        `custody entities ${custodyEntities(obs.throwIds).length}, records ${custodyRecords().length}`
    );
    test.assert(delivered !== undefined && UNLOAD_HOWS.has(delivered.how ?? ""), `the unload was not delivered as one: ${delivered?.how}`);
    test.assert(gens.join() === "1", `the thrower does not hold exactly the gen-1 copy: [${gens.join(",")}]`);
    test.assert(custodyEntities(obs.throwIds).length === 0 && custodyRecords().length === 0, "custody survived the unload");
    finish(test, obs, "unload");
  } finally {
    obs?.stop();
    if (p?.isValid === true) test.removeSimulatedPlayer(p);
    if (reopened) {
      pad.clear();
      pad.unload();
    }
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(500)
  .tag("andrew");

// ------------------------------------------------ AC 5: a server restart with a custody entity in the world

const RESTART_FIELD = { x: 5600, y: 1, z: 0 };
const RESTART_AREA = "andrew_gt_trth_rst";
const RESTART_KEY = "andrew:gt_trth_restart";

interface RestartSeed {
  throwId: string;
  entityId: string;
  markId: string;
  ownerId: string;
  savedAt: number;
}

registerAsync("andrew", "trident_throw_restart_seed", async (test: Test): Promise<void> => {
  world.setDynamicProperty(RESTART_KEY, undefined);
  const pad = await openPad(test, RESTART_AREA, RESTART_FIELD);
  const p = await survivor(test, pad.rel(0.5, 1, 0.5), "trth_restart");
  const markId = giveMarked(p);
  wallAt(pad, EAST_WALL_X);
  await aim(test, p, pad.rel(EAST_WALL_X, 4, 0.5));
  const obs = observe(markId);
  await release(test, p, 20);
  const turned = await obs.wait(test, "turned", 40);
  await test.idle(6);
  test.assert(turned?.entityId !== undefined, "the trident never turned back");
  const seed: RestartSeed = { throwId: turned?.throwId ?? "", entityId: turned?.entityId ?? "", markId, ownerId: p.id, savedAt: Date.now() };
  holdCustodyForRestart();
  obs.stop();
  // Nothing may hold the pad over the stop: the body is saved with its chunk and loads only when the check asks.
  test.removeSimulatedPlayer(p);
  pad.unload();
  await test.idle(20);
  world.setDynamicProperty(RESTART_KEY, JSON.stringify(seed));
  log(
    `restart_seed RESULT ${seed.throwId} held mid-return with body ${seed.entityId}; records ${custodyRecords().length}; ` +
      `body resolvable before the stop ${world.getEntity(seed.entityId)?.isValid === true}; ${obs.summary()}`
  );
  test.assert(custodyRecords().length === 1, "the seed did not leave exactly one custody record");
  test.assert(obs.violations.length === 0, `live copies != 1 before the stop: ${obs.violations[0]}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

registerAsync("andrew", "trident_throw_restart_check", async (test: Test): Promise<void> => {
  const raw = world.getDynamicProperty(RESTART_KEY);
  test.assert(typeof raw === "string", "no seed: trident_throw_restart_seed did not run in this world before the restart");
  const seed = JSON.parse(raw as string) as RestartSeed;
  const boot = allEvents.filter((e) => e.throwId === seed.throwId).map((e) => `${e.kind} (${e.how ?? "-"}) on tick ${e.tick}`);
  const recordsAtCheck = custodyRecords().filter((r) => r.throwId === seed.throwId).length;
  const owedAtCheck = owedGens(seed.markId);
  const from = allEvents.length;
  let pad: Pad | undefined;
  try {
    pad = await openPad(test, RESTART_AREA, RESTART_FIELD);
    await test.idle(20);
    const ids = new Set([seed.throwId]);
    const left = custodyEntities(ids).length;
    const onLoad = allEvents.slice(from).filter((e) => e.throwId === seed.throwId).map((e) => `${e.kind} (${e.how ?? "-"})`);
    const live = liveCopies(seed.markId);
    log(
      `restart_check RESULT ${((Date.now() - seed.savedAt) / 1000).toFixed(1)} s since the seed; at boot: ${boot.join(", ") || "no custody event"}; ` +
        `records for the throw at the check ${recordsAtCheck}; owed ${owedAtCheck.map((o) => `${o.target === seed.ownerId ? "thrower" : o.target} gen ${o.gen} (${o.reason})`).join(",") || "none"}; ` +
        `pad reloaded: ${onLoad.join(", ") || "no custody event"}, old body resolvable ${world.getEntity(seed.entityId)?.isValid === true}, custody entities of the throw ${left}; ` +
        `live copies [${live.join("; ")}]`
    );
    test.assert(recordsAtCheck === 0, "the pre-restart record survived the boot");
    test.assert(owedAtCheck.length === 1 && owedAtCheck[0].target === seed.ownerId && owedAtCheck[0].gen === 1, "the copy is not owed once, at gen 1, to the thrower");
    test.assert(left === 0, "the pre-restart custody entity is still in the world");
    test.assert(live.length === 1, `live copies after the restart: ${live.length}`);
  } finally {
    clearOwed(seed.ownerId, seed.markId);
    world.setDynamicProperty(RESTART_KEY, undefined);
    pad?.clear();
    pad?.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

// ------------------------------------------------ AC 6: the 30 s cap on a return that cannot finish

registerAsync("andrew", "trident_throw_return_cap", async (test: Test): Promise<void> => {
  const FIELD = { x: 6000, y: 1, z: 0 };
  const pad = await openPad(test, "andrew_gt_trth_cap", FIELD);
  const R = 6;
  let obs: Observer | undefined;
  let p: SimulatedPlayer | undefined;
  let flee: number | undefined;
  try {
    p = await survivor(test, pad.rel(0.5, 1, 0.5), "trth_cap");
    const markId = giveMarked(p);
    wallAt(pad, 12);
    await aim(test, p, pad.rel(12, 3, 0.5));
    obs = observe(markId);
    await release(test, p, 20);
    const turned = await obs.wait(test, "turned", 40);
    test.assert(turned?.entityId !== undefined, "the trident never turned back");
    // The thrower keeps to the far side of a circle round the centre: the body never gets within R of them.
    const centre = pad.at(0.5, 1, 0.5);
    let minGap = Number.POSITIVE_INFINITY;
    let u = { x: 1, z: 0 };
    flee = system.runInterval(() => {
      const b = turned?.entityId === undefined ? undefined : world.getEntity(turned.entityId);
      if (b?.isValid !== true || p?.isValid !== true) return;
      const dx = b.location.x - centre.x;
      const dz = b.location.z - centre.z;
      const l = Math.hypot(dx, dz);
      if (l > 0.05) u = { x: dx / l, z: dz / l };
      p.teleport({ x: centre.x - u.x * R, y: centre.y, z: centre.z - u.z * R });
      minGap = Math.min(minGap, dist(b.location, { x: p.location.x, y: p.location.y + 1.2, z: p.location.z }));
    }, 1);
    const delivered = await obs.wait(test, "delivered", RETURN_CAP_TICKS + 40);
    system.clearRun(flee);
    flee = undefined;
    await test.idle(2);
    const gens = heldGens(p, markId);
    const after = delivered === undefined || turned === undefined ? undefined : delivered.tick - turned.tick;
    log(
      `cap RESULT delivered "${delivered?.how ?? "-"}" at +${after ?? "-"} t after the turn (${after === undefined ? "-" : f2(after / 20)} s); closest the body came ${f2(minGap)}; ` +
        `arrived ${obs.events.some((e) => e.kind === "arrived")}; held gens [${gens.join(",")}]; custody entities ${custodyEntities(obs.throwIds).length}`
    );
    test.assert(delivered?.how === "return cap", `the stalled return was not delivered by the cap: ${delivered?.how}`);
    test.assert(after !== undefined && after >= RETURN_CAP_TICKS && after <= RETURN_CAP_TICKS + 5, `the cap fired at +${after} t, not at 30 s`);
    test.assert(gens.join() === "1", `the thrower does not hold exactly the gen-1 copy: [${gens.join(",")}]`);
    test.assert(custodyEntities(obs.throwIds).length === 0, "the return body outlived the cap");
    finish(test, obs, "cap");
  } finally {
    if (flee !== undefined) system.clearRun(flee);
    obs?.stop();
    if (p?.isValid === true) test.removeSimulatedPlayer(p);
    pad.clear();
    pad.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(RETURN_CAP_TICKS + 300)
  .tag("andrew");

// ------------------------------------------------ AC 8: a sneaking release does not throw

registerAsync("andrew", "trident_throw_sneak_no_throw", async (test: Test): Promise<void> => {
  const FIELD = { x: 6400, y: 1, z: 0 };
  const pad = await openPad(test, "andrew_gt_trth_snk", FIELD);
  let obs: Observer | undefined;
  let p: SimulatedPlayer | undefined;
  try {
    p = await survivor(test, pad.rel(0.5, 1, 0.5), "trth_sneak");
    const markId = giveMarked(p);
    wallAt(pad, 8);
    await aim(test, p, pad.rel(8, 3, 0.5));
    obs = observe(markId);
    p.isSneaking = true;
    await test.idle(2);
    const sneakUsed = await release(test, p, 20);
    await test.idle(10);
    const afterSneak = { throws: obs.events.filter((e) => e.kind === "thrown").length, held: heldGens(p, markId).join(), records: custodyRecords().length, sneaking: p.isSneaking };
    p.isSneaking = false;
    await test.idle(2);
    const shortUsed = await release(test, p, 5);
    await test.idle(10);
    const afterShort = { throws: obs.events.filter((e) => e.kind === "thrown").length, held: heldGens(p, markId).join() };
    await aim(test, p, pad.rel(8, 3, 0.5));
    await release(test, p, 20);
    const thrown = await obs.wait(test, "thrown", 10);
    const arrived = await obs.wait(test, "arrived", 80);
    log(
      `sneak RESULT sneaking release after 20 t (use ${sneakUsed}, sneaking ${afterSneak.sneaking}): throws ${afterSneak.throws}, held gens [${afterSneak.held}], records ${afterSneak.records}; ` +
        `standing release after 5 t (use ${shortUsed}): throws ${afterShort.throws}, held [${afterShort.held}]; control, standing after 20 t: thrown ${thrown !== undefined}, back ${arrived?.how ?? "no"}`
    );
    test.assert(afterSneak.sneaking && afterSneak.throws === 0 && afterSneak.held === "0" && afterSneak.records === 0, "a sneaking release threw");
    test.assert(afterShort.throws === 0 && afterShort.held === "0", "a release under 10 ticks threw");
    test.assert(thrown !== undefined && arrived !== undefined, "control: the standing release did not throw and come back");
    finish(test, obs, "sneak");
  } finally {
    obs?.stop();
    if (p?.isValid === true) test.removeSimulatedPlayer(p);
    pad.clear();
    pad.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

