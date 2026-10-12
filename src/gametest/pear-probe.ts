// PEAR-PROBE-01 probes on BDS 1.26.51.1 (spec v3 §6–§8, L0-pear-ac07): the vanilla fishing hook against every pressure
// plate, the hook's owner, a cancelled cast, durability write-back, far ticking areas, cross-dimension teleports and the
// 3×3 recipe grid, measured before any Pearl Rod code exists. The answers are the "[probe] PEAR … RESULT" lines, recorded
// in docs/feedback/probe-pearl.md; the Q8 grids are packs/gametest/recipes/probe_pearl_grid_*.json.

import {
  type Block,
  BlockPermutation,
  BlockTypes,
  BlockVolume,
  type Container,
  type Dimension,
  type Entity,
  GameMode,
  ItemStack,
  Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";
const ROD = "minecraft:fishing_rod";
const HOOK = "minecraft:fishing_hook";
const ROD_SLOT = 0;
const EMPTY_SLOT = 5;

/** The caster stands on the platform edge; the plate field is the rest of the 7×7 floor in front of it. */
const CAST_FROM: Vector3 = { x: 3, y: 2, z: 0 };
const FIELD_MIN: Vector3 = { x: 0, y: 2, z: 1 };
const FIELD_MAX: Vector3 = { x: 6, y: 2, z: 6 };
/** A hook falls below the line of sight, so aiming at a floor point lands it short of that point, inside the field. */
const AIMS: readonly Vector3[] = [
  { x: 3.5, y: 2, z: 5.5 },
  { x: 2.5, y: 2, z: 6.5 },
];
const STILL_TICKS = 5;
/** L0-pear-pr02 default binding threshold above the plate cell floor. */
const BIND_DY = 0.25;

const log = (msg: string): void => console.warn(`[probe] PEAR ${msg}`);
const short = (id: string): string => id.replace("minecraft:", "");
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0].slice(0, 200);
const f2 = (n: number): string => n.toFixed(2);
const f4 = (n: number): string => n.toFixed(4);
const v2 = (v: Vector3): string => `${f2(v.x)},${f2(v.y)},${f2(v.z)}`;
const v4 = (v: Vector3): string => `${f4(v.x)},${f4(v.y)},${f4(v.z)}`;
const sub = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const len = (v: Vector3): number => Math.hypot(v.x, v.y, v.z);
const cellOf = (v: Vector3): Vector3 => ({ x: Math.floor(v.x), y: Math.floor(v.y), z: Math.floor(v.z) });
const isPlate = (id: string): boolean => id.endsWith("pressure_plate");

function inventoryOf(player: Player): Container {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) throw new Error(`${player.name} has no inventory container`);
  return container;
}

function typeAt(dim: Dimension, at: Vector3): string {
  try {
    return dim.getBlock(at)?.typeId ?? "unloaded";
  } catch (err) {
    return `threw(${errText(err)})`;
  }
}

function ownerOf(e: Entity): string {
  try {
    const c = e.getComponent("minecraft:projectile");
    if (c === undefined) return "no-projectile-component";
    const o = c.owner;
    if (o === undefined) return "undefined";
    return o instanceof Player ? o.name : short(o.typeId);
  } catch (err) {
    return `threw(${errText(err)})`;
  }
}

function nameOf(e: Entity | undefined): string {
  if (e === undefined) return "undefined";
  try {
    return e instanceof Player ? e.name : short(e.typeId);
  } catch (err) {
    return `threw(${errText(err)})`;
  }
}

async function survivor(test: Test, at: Vector3, name: string): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  await test.idle(2);
  p.addEffect("resistance", 20000, { amplifier: 4, showParticles: false });
  p.addEffect("fire_resistance", 20000, { amplifier: 0, showParticles: false });
  await test.idle(1);
  return p;
}

// ------------------------------------------------------------------ recorder

interface HookRec {
  e: Entity;
  id: string;
  tick: number;
  at: Vector3;
  owner: string;
  nearest: string;
  dists: string;
}

interface HitRec {
  tick: number;
  projId: string;
  projType: string;
  text: string;
  block: string;
}

interface Mark {
  tick: number;
  name: string;
  who: string;
  item: string;
}

/** Records hooks, projectile hits and item-use signals for the players `players()` returns, until close(). */
class Recorder {
  readonly hooks: HookRec[] = [];
  readonly hits: HitRec[] = [];
  readonly marks: Mark[] = [];
  readonly removed = new Map<string, number>();
  private readonly undo: Array<() => void> = [];

  constructor(
    private readonly test: Test,
    private readonly players: () => Player[],
    private readonly onHook?: (h: HookRec) => void
  ) {
    const a = world.afterEvents;
    const spawn = a.entitySpawn.subscribe((ev) => {
      if (ev.entity.typeId !== HOOK) return;
      const at = ev.entity.location;
      let nearest = "none";
      let best = 3;
      const dists: string[] = [];
      for (const p of this.players()) {
        const d = len(sub(p.getHeadLocation(), at));
        dists.push(`${p.name}:${f2(d)}`);
        if (d <= best) {
          best = d;
          nearest = p.name;
        }
      }
      const h: HookRec = { e: ev.entity, id: ev.entity.id, tick: system.currentTick, at, owner: ownerOf(ev.entity), nearest, dists: dists.join(" ") };
      this.hooks.push(h);
      this.onHook?.(h);
    });
    this.undo.push(() => a.entitySpawn.unsubscribe(spawn));
    const remove = a.entityRemove.subscribe((ev) => {
      if (ev.typeId === HOOK) this.removed.set(ev.removedEntityId, system.currentTick);
    });
    this.undo.push(() => a.entityRemove.unsubscribe(remove));
    const hitBlock = a.projectileHitBlock.subscribe((ev) => {
      let block = "?";
      let text: string;
      try {
        const hit = ev.getBlockHit();
        block = short(hit.block.typeId);
        const rel = this.test.relativeBlockLocation(hit.block.location);
        text = `${block}@rel${rel.x},${rel.y},${rel.z} face=${hit.face} faceLoc=${v4(hit.faceLocation)} at_rel=${v4(this.test.relativeLocation(ev.location))} source=${nameOf(ev.source)}`;
      } catch (err) {
        text = `getBlockHit threw ${errText(err)}`;
      }
      this.hits.push({ tick: system.currentTick, projId: ev.projectile.id, projType: ev.projectile.typeId, text: `block ${text}`, block });
    });
    this.undo.push(() => a.projectileHitBlock.unsubscribe(hitBlock));
    const hitEntity = a.projectileHitEntity.subscribe((ev) => {
      let text: string;
      try {
        text = `entity ${nameOf(ev.getEntityHit().entity)} source=${nameOf(ev.source)}`;
      } catch (err) {
        text = `entity getEntityHit threw ${errText(err)}`;
      }
      this.hits.push({ tick: system.currentTick, projId: ev.projectile.id, projType: ev.projectile.typeId, text, block: "-" });
    });
    this.undo.push(() => a.projectileHitEntity.unsubscribe(hitEntity));
    const mark = (name: string) => (ev: { source: Entity; itemStack?: ItemStack }): void => {
      this.marks.push({ tick: system.currentTick, name, who: nameOf(ev.source), item: short(ev.itemStack?.typeId ?? "none") });
    };
    for (const [name, signal] of [
      ["after.itemUse", a.itemUse],
      ["after.itemStartUse", a.itemStartUse],
      ["after.itemStopUse", a.itemStopUse],
      ["after.itemReleaseUse", a.itemReleaseUse],
      ["after.itemCompleteUse", a.itemCompleteUse],
    ] as const) {
      const cb = mark(name);
      signal.subscribe(cb);
      this.undo.push(() => signal.unsubscribe(cb));
    }
    const before = mark("before.itemUse");
    world.beforeEvents.itemUse.subscribe(before);
    this.undo.push(() => world.beforeEvents.itemUse.unsubscribe(before));
  }

  hookOf(p: Player, since: number): HookRec | undefined {
    return this.hooks.find((h) => h.tick >= since && (h.owner === p.name || h.nearest === p.name));
  }

  marksOf(p: Player, from: number, to = Number.MAX_SAFE_INTEGER): string {
    return (
      this.marks
        .filter((m) => m.who === p.name && m.tick >= from && m.tick <= to)
        .map((m) => `${m.name}(${m.item})+${m.tick - from}`)
        .join(",") || "none"
    );
  }

  hitsOf(id: string, from: number): HitRec[] {
    return this.hits.filter((h) => h.projId === id && h.tick >= from);
  }

  close(): void {
    for (const u of this.undo) u();
  }
}

// ------------------------------------------------------------------ casting

interface Rest {
  restTick: number;
  at: Vector3;
  vel: Vector3;
  ground: boolean;
  cell: string;
  below: string;
  dy: number;
  power: string;
  lowTick: number;
  minPlateDy: number;
  path: string;
  gone: string;
  drift: string;
}

function plateState(block: Block | undefined): string {
  if (block === undefined || !isPlate(block.typeId)) return "-";
  let power = "?";
  try {
    power = String(block.getRedstonePower() ?? "undefined");
  } catch (err) {
    power = `threw(${errText(err)})`;
  }
  const signal = block.permutation.getAllStates()["redstone_signal"];
  return `power=${power} redstone_signal=${String(signal)}`;
}

/** Samples the hook every tick from `spawnTick` until it lies still for STILL_TICKS ticks, then 20 more for drift. */
async function watchHook(test: Test, hook: HookRec, maxTicks: number): Promise<Rest> {
  const dim = test.getDimension();
  const ys: string[] = [];
  let last: Vector3 | undefined;
  let still = 0;
  let lowTick = -1;
  let minPlateDy = Number.POSITIVE_INFINITY;
  let restTick = -1;
  let gone = "";
  for (let i = 0; i < maxTicks; i++) {
    if (!hook.e.isValid) {
      gone = `invalid at +${system.currentTick - hook.tick}`;
      break;
    }
    const t = system.currentTick - hook.tick;
    const at = hook.e.location;
    const cell = cellOf(at);
    const type = typeAt(dim, cell);
    const dy = at.y - cell.y;
    ys.push(`${t}:${f2(test.relativeLocation(at).y)}${isPlate(type) ? "p" : ""}`);
    if (isPlate(type)) {
      minPlateDy = Math.min(minPlateDy, dy);
      if (lowTick < 0 && dy <= BIND_DY) lowTick = t;
    }
    const moved = last === undefined ? 1 : len(sub(at, last));
    last = at;
    still = moved < 1e-4 && len(hook.e.getVelocity()) < 1e-3 ? still + 1 : 0;
    if (still >= STILL_TICKS) {
      restTick = t - STILL_TICKS;
      break;
    }
    await test.idle(1);
  }
  if (!hook.e.isValid) {
    return { restTick, at: last ?? hook.at, vel: { x: 0, y: 0, z: 0 }, ground: false, cell: "-", below: "-", dy: Number.NaN, power: "-", lowTick, minPlateDy, path: ys.join(" "), gone: gone || "invalid", drift: "-" };
  }
  const at = hook.e.location;
  const cell = cellOf(at);
  const block = dim.getBlock(cell);
  const rest: Rest = {
    restTick,
    at,
    vel: hook.e.getVelocity(),
    ground: hook.e.isOnGround,
    cell: short(typeAt(dim, cell)),
    below: short(typeAt(dim, { x: cell.x, y: cell.y - 1, z: cell.z })),
    dy: at.y - cell.y,
    power: plateState(block),
    lowTick,
    minPlateDy,
    path: ys.join(" "),
    gone,
    drift: "",
  };
  await test.idle(20);
  rest.drift = hook.e.isValid ? `moved ${f4(len(sub(hook.e.location, at)))} in 20 ticks` : `gone within 20 ticks after rest`;
  return rest;
}

async function use(test: Test, p: SimulatedPlayer, slot: number): Promise<string> {
  if (p.useItemInSlot(slot)) return "true";
  await test.idle(2);
  return p.useItemInSlot(slot) ? "true(retry)" : "false";
}

/** A fresh rod in the slot first, then the aim: setItem with selectSlot turns a SimulatedPlayer's head back to its body. */
async function arm(test: Test, p: SimulatedPlayer, aim: Vector3, rod: ItemStack = new ItemStack(ROD)): Promise<void> {
  p.setItem(rod, ROD_SLOT, true);
  await test.idle(2);
  p.lookAtLocation(aim, LookDuration.Instant);
  await test.idle(2);
}

interface Cast {
  used: string;
  from: number;
  hook: HookRec | undefined;
}

async function cast(test: Test, p: SimulatedPlayer, rec: Recorder): Promise<Cast> {
  const from = system.currentTick;
  const used = await use(test, p, ROD_SLOT);
  for (let i = 0; i < 10 && rec.hookOf(p, from) === undefined; i++) await test.idle(1);
  return { used, from, hook: rec.hookOf(p, from) };
}

function damageOf(p: Player, slot = ROD_SLOT): string {
  const s = inventoryOf(p).getItem(slot);
  if (s === undefined) return "empty";
  const d = s.getComponent("minecraft:durability");
  return d === undefined ? `${short(s.typeId)}:no-durability` : String(d.damage);
}

/** Second use of the rod: the reel. Returns what happened to the hook and the rod's damage. */
async function reel(test: Test, p: SimulatedPlayer, rec: Recorder, hook: HookRec | undefined): Promise<string> {
  const from = system.currentTick;
  const before = damageOf(p);
  const used = await use(test, p, ROD_SLOT);
  await test.idle(3);
  const removedAt = hook === undefined ? undefined : rec.removed.get(hook.id);
  const newHook = rec.hookOf(p, from);
  return (
    `reel use=${used} hook=${hook === undefined ? "none" : hook.e.isValid ? "STILL VALID" : `removed${removedAt === undefined ? "" : `+${removedAt - from}`}`} ` +
    `new_hook=${newHook === undefined ? "no" : "YES"} damage ${before}->${damageOf(p)} signals=${rec.marksOf(p, from)}`
  );
}

function fillField(test: Test, typeId: string): void {
  const dim = test.getDimension();
  dim.fillBlocks(new BlockVolume(test.worldBlockLocation(FIELD_MIN), test.worldBlockLocation(FIELD_MAX)), typeId);
}

function plateTypes(): string[] {
  return BlockTypes.getAll()
    .map((t) => t.id)
    .filter((id) => id.startsWith("minecraft:") && isPlate(id))
    .sort();
}

// ------------------------------------- Q1 + Q2 (+ Q3 owner per cast): the hook on every plate type

/** The long cast's field: the platform floor plus a stone floor laid past its far edge (relative y=1 there is air). */
const LONG_FLOOR_MIN: Vector3 = { x: 0, y: 1, z: 7 };
const LONG_FLOOR_MAX: Vector3 = { x: 6, y: 1, z: 16 };
const LONG_FIELD_MAX: Vector3 = { x: 6, y: 2, z: 16 };
const LONG_AIM: Vector3 = { x: 3.5, y: 2, z: 15.5 };

interface CastStats {
  row: string;
  dy: string;
  spawned: boolean;
  hit: boolean;
  inPlate: boolean;
  blocks: string[];
  components: string;
}

async function measureCast(test: Test, p: SimulatedPlayer, rec: Recorder, aim: Vector3, label: string, showPath: boolean): Promise<CastStats> {
  await arm(test, p, aim);
  const k = await cast(test, p, rec);
  if (k.hook === undefined) {
    return { row: `${label}: use=${k.used} NO HOOK within 10 ticks signals=${rec.marksOf(p, k.from)}`, dy: "none", spawned: false, hit: false, inPlate: false, blocks: [], components: "-" };
  }
  const h = k.hook;
  const ownerLater = ownerOf(h.e);
  const components = h.e.getComponents().map((x) => x.typeId).sort().join(",");
  const r = await watchHook(test, h, 160);
  const hits = rec.hitsOf(h.id, h.tick);
  if (showPath) log(`Q2 ${label} path(+t:rel_y, p = inside a plate cell)=${r.path}`);
  const row =
    `${label}: use=${k.used} spawn+${h.tick - k.from} at=${v2(test.relativeLocation(h.at))} owner@spawn=${h.owner} owner@+1=${ownerLater} ` +
    `nearest=${h.nearest}(${h.dists}) signals=${rec.marksOf(p, k.from, h.tick)} | rest+${r.restTick} rel=${v4(test.relativeLocation(r.at))} ` +
    `dy=${r.dy.toFixed(6)} cell=${r.cell} below=${r.below} ground=${r.ground} |v|=${f4(len(r.vel))} ${r.power} ` +
    `first_dy<=${BIND_DY}_in_plate=+${r.lowTick} min_plate_dy=${Number.isFinite(r.minPlateDy) ? r.minPlateDy.toFixed(6) : "never-in-plate"} ` +
    `${r.gone} ${r.drift} | hits=${hits.length === 0 ? "NONE" : hits.map((x) => `+${x.tick - h.tick} ${x.text}`).join(" ; ")} || ${await reel(test, p, rec, h)}`;
  await test.idle(12);
  return {
    row,
    dy: Number.isNaN(r.dy) ? "gone" : r.dy.toFixed(6),
    spawned: true,
    hit: hits.length > 0,
    inPlate: isPlate(`minecraft:${r.cell}`),
    blocks: hits.map((x) => x.block),
    components,
  };
}

registerAsync("andrew", "probe_pearl_hook_plates", async (test: Test): Promise<void> => {
  const p = await survivor(test, CAST_FROM, "pear_q2");
  const rec = new Recorder(test, () => [p]);
  const dim = test.getDimension();
  const types = plateTypes();
  log(`Q2 plate types from BlockTypes.getAll() /pressure_plate$/: n=${types.length} [${types.map(short).join(",")}]`);
  let hookHits = 0;
  let hookCasts = 0;
  let restsInPlate = 0;
  let plateCasts = 0;
  const hitBlocks = new Map<string, number>();
  const tally = (st: CastStats, onPlate: boolean): void => {
    if (!st.spawned) return;
    hookCasts++;
    if (st.hit) hookHits++;
    if (onPlate) plateCasts++;
    if (st.inPlate) restsInPlate++;
    for (const b of st.blocks) hitBlocks.set(b, (hitBlocks.get(b) ?? 0) + 1);
  };
  try {
    const cases: Array<{ label: string; field: string }> = [{ label: "control_bare_floor", field: "minecraft:air" }, ...types.map((t) => ({ label: short(t), field: t }))];
    for (const [n, c] of cases.entries()) {
      fillField(test, c.field);
      await test.idle(2);
      const stats: CastStats[] = [];
      for (const [i, aim] of AIMS.entries()) stats.push(await measureCast(test, p, rec, aim, `cast${i}`, n < 2));
      for (const st of stats) tally(st, c.field !== "minecraft:air");
      if (n === 0) log(`Q3 hook components=[${stats[0].components}]`);
      log(`Q2 ${c.label} RESULT rest_dy=[${stats.map((st) => st.dy).join(",")}] ${stats.map((st) => st.row).join(" || ")}`);
    }

    // A long, shallow cast over a wider field: the rest height must not be an artefact of the steep short cast.
    const plate = types.find((t) => t === "minecraft:wooden_pressure_plate") ?? types[0];
    dim.fillBlocks(new BlockVolume(test.worldBlockLocation(LONG_FLOOR_MIN), test.worldBlockLocation(LONG_FLOOR_MAX)), "minecraft:stone");
    dim.fillBlocks(new BlockVolume(test.worldBlockLocation(FIELD_MIN), test.worldBlockLocation(LONG_FIELD_MAX)), plate);
    await test.idle(2);
    const long = await measureCast(test, p, rec, LONG_AIM, "long_cast", true);
    tally(long, true);
    log(`Q2 long_cast_${short(plate)} RESULT rest_dy=[${long.dy}] ${long.row}`);

    // Positive control for the hit subscription: a thrown snowball on the plate field and on the bare floor.
    for (const field of [types.find((t) => t.includes("stone_pressure")) ?? types[0], "minecraft:air"]) {
      fillField(test, field);
      p.setItem(new ItemStack("minecraft:snowball", 4), 1, true);
      await test.idle(2);
      p.lookAtLocation(AIMS[0], LookDuration.Instant);
      await test.idle(2);
      const from = system.currentTick;
      const used = await use(test, p, 1);
      await test.idle(30);
      const hits = rec.hits.filter((x) => x.tick >= from && x.projType === "minecraft:snowball");
      log(`Q1 control snowball on ${short(field)} RESULT use=${used} hits=${hits.length === 0 ? "NONE" : hits.map((x) => `+${x.tick - from} ${x.text}`).join(" ; ")}`);
    }
  } finally {
    rec.close();
    dim.fillBlocks(new BlockVolume(test.worldBlockLocation(FIELD_MIN), test.worldBlockLocation(LONG_FIELD_MAX)), "minecraft:air");
    dim.fillBlocks(new BlockVolume(test.worldBlockLocation(LONG_FLOOR_MIN), test.worldBlockLocation(LONG_FLOOR_MAX)), "minecraft:air");
  }
  log(
    `Q1 RESULT projectileHitBlock fired for ${hookHits} of ${hookCasts} hook casts; blocks named: ` +
      `${[...hitBlocks].map(([b, n]) => `${b}×${n}`).join(",") || "none"}; casts over plates resting inside a plate cell: ${restsInPlate} of ${plateCasts}`
  );
  test.assert(hookCasts > 0, "no fishing_hook spawned from any cast — the cast itself is broken");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(8000)
  .tag("andrew");

// ------------------------------------- Q3: owner, and the itemUse + entitySpawn correlation with two casters

registerAsync("andrew", "probe_pearl_hook_owner", async (test: Test): Promise<void> => {
  const pairs: ReadonlyArray<{ label: string; a: Vector3; b: Vector3 }> = [
    { label: "two_apart", a: { x: 1, y: 2, z: 0 }, b: { x: 5, y: 2, z: 0 } },
    { label: "adjacent", a: { x: 2, y: 2, z: 0 }, b: { x: 3, y: 2, z: 0 } },
  ];
  let ownerReadable = 0;
  let ownerRight = 0;
  let nearestRight = 0;
  let total = 0;
  let n = 0;
  for (const pair of pairs) {
    const a = await survivor(test, pair.a, `pear_q3a${n}`);
    const b = await survivor(test, pair.b, `pear_q3b${n++}`);
    const rec = new Recorder(test, () => [a, b]);
    try {
      for (let round = 0; round < 3; round++) {
        a.setItem(new ItemStack(ROD), ROD_SLOT, true);
        b.setItem(new ItemStack(ROD), ROD_SLOT, true);
        await test.idle(2);
        a.lookAtLocation({ x: pair.a.x + 0.5, y: 2, z: 5.5 }, LookDuration.Instant);
        b.lookAtLocation({ x: pair.b.x + 0.5, y: 2, z: 5.5 }, LookDuration.Instant);
        await test.idle(2);
        const from = system.currentTick;
        const ua = a.useItemInSlot(ROD_SLOT);
        const ub = b.useItemInSlot(ROD_SLOT);
        await test.idle(6);
        const hooks = rec.hooks.filter((h) => h.tick >= from);
        const uses = rec.marks.filter((m) => m.tick >= from && m.name === "after.itemUse").map((m) => `${m.who}@+${m.tick - from}`);
        const rows = hooks.map((h) => {
          total++;
          if (h.owner === a.name || h.owner === b.name) ownerReadable++;
          return `hook@+${h.tick - from} owner=${h.owner} nearest=${h.nearest} dists(${h.dists}) at=${v2(test.relativeLocation(h.at))}`;
        });
        // Which hook is whose, independently of both rules: the one that came to rest in front of its caster.
        await test.idle(30);
        const truth = hooks.map((h) => {
          if (!h.e.isValid) return "gone";
          const x = test.relativeLocation(h.e.location).x;
          return Math.abs(x - (pair.a.x + 0.5)) < Math.abs(x - (pair.b.x + 0.5)) ? a.name : b.name;
        });
        hooks.forEach((h, i) => {
          if (h.owner === truth[i]) ownerRight++;
          if (h.nearest === truth[i]) nearestRight++;
        });
        log(
          `Q3 ${pair.label} round${round} RESULT use a=${ua} b=${ub} hooks=${hooks.length} after.itemUse=[${uses.join(",")}] ` +
            `${rows.join(" ; ")} landed_in_front_of=[${truth.join(",")}]`
        );
        for (const p of [a, b]) p.useItemInSlot(ROD_SLOT);
        await test.idle(14);
      }
    } finally {
      rec.close();
      test.removeSimulatedPlayer(a);
      test.removeSimulatedPlayer(b);
    }
  }
  log(
    `Q3 RESULT projectile owner readable on ${ownerReadable} of ${total} hooks, matching the caster on ${ownerRight}; ` +
      `nearest-head-within-3 rule matched the caster on ${nearestRight} of ${total}`
  );
  test.assert(total > 0, "no hook spawned — the cast is broken");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1500)
  .tag("andrew");

// ------------------------------------- Q4: a cancelled cast on a real rod, and hook.remove() at entitySpawn +0

registerAsync("andrew", "probe_pearl_cast_cancel", async (test: Test): Promise<void> => {
  const p = await survivor(test, CAST_FROM, "pear_q4");
  let mode: "none" | "cancel" | "remove" = "none";
  const removals: string[] = [];
  const rec = new Recorder(
    test,
    () => [p],
    (h) => {
      if (mode !== "remove" || (h.owner !== p.name && h.nearest !== p.name)) return;
      try {
        h.e.remove();
        removals.push(`removed in entitySpawn at +0 (valid after=${h.e.isValid})`);
      } catch (err) {
        removals.push(`remove threw ${errText(err)}`);
      }
    }
  );
  const veto = (ev: { source: Player; itemStack: ItemStack; cancel: boolean }): void => {
    if (mode === "cancel" && ev.source.name === p.name && ev.itemStack.typeId === ROD) ev.cancel = true;
  };
  world.beforeEvents.itemUse.subscribe(veto);
  const hooksOf = (from: number): HookRec[] => rec.hooks.filter((h) => h.tick >= from && (h.owner === p.name || h.nearest === p.name));
  const alive = (): number => test.getDimension().getEntities({ type: HOOK }).length;
  const steps: Array<{ step: string; mode: "none" | "cancel" | "remove" }> = [
    { step: "control_cast", mode: "none" },
    { step: "control_reel", mode: "none" },
    { step: "cancelled_use_1", mode: "cancel" },
    { step: "cancelled_use_2", mode: "cancel" },
    { step: "after_cancel_cast", mode: "none" },
    { step: "after_cancel_reel", mode: "none" },
    { step: "remove_at_spawn", mode: "remove" },
    { step: "next_use_after_remove", mode: "none" },
    { step: "third_use_after_remove", mode: "none" },
    { step: "fourth_use_after_remove", mode: "none" },
  ];
  let cancelSpawned = -1;
  let controlSpawned = -1;
  try {
    await arm(test, p, AIMS[0]);
    for (const s of steps) {
      mode = s.mode;
      removals.length = 0;
      const from = system.currentTick;
      const dmg = damageOf(p);
      const used = await use(test, p, ROD_SLOT);
      const counts: string[] = [];
      for (const t of [0, 1, 5, 20]) {
        if (t > 0) await test.idle(t === 1 ? 1 : t === 5 ? 4 : 15);
        counts.push(`+${system.currentTick - from}:${alive()}`);
      }
      const spawned = hooksOf(from).length;
      if (s.step === "cancelled_use_1") cancelSpawned = spawned;
      if (s.step === "control_cast") controlSpawned = spawned;
      log(
        `Q4 ${s.step} RESULT mode=${s.mode} use=${used} hooks_spawned=${spawned} hooks_alive=[${counts.join(" ")}] ` +
          `damage ${dmg}->${damageOf(p)} signals=${rec.marksOf(p, from)} ${removals.join(" ")}`
      );
      mode = "none";
      await test.idle(8);
    }
  } finally {
    world.beforeEvents.itemUse.unsubscribe(veto);
    rec.close();
  }
  test.assert(controlSpawned === 1, `control: an uncancelled cast spawned ${controlSpawned} hooks, not 1`);
  log(`Q4 RESULT cancelled beforeEvents.itemUse on a vanilla rod spawned ${cancelSpawned} hook(s) (control spawned ${controlSpawned})`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1500)
  .tag("andrew");

// ------------------------------------- Q7: durability.damage = 0 written back to a real rod

const DP_KEY = "andrew:pr_probe";

function rodText(s: ItemStack | undefined): string {
  if (s === undefined) return "empty";
  const d = s.getComponent("minecraft:durability");
  let dp: string;
  try {
    dp = String(s.getDynamicProperty(DP_KEY));
  } catch (err) {
    dp = `threw(${errText(err)})`;
  }
  return `${short(s.typeId)} damage=${d?.damage ?? "-"}/${d?.maxDurability ?? "-"} dp=${dp} name=${s.nameTag ?? "none"} lore=[${s.getLore().join("|")}]`;
}

function findRod(p: Player): { slot: number; stack: ItemStack } | undefined {
  const inv = inventoryOf(p);
  for (let i = 0; i < inv.size; i++) {
    const s = inv.getItem(i);
    if (s?.typeId === ROD) return { slot: i, stack: s };
  }
  return undefined;
}

/** setItem of a copy with damage = `to`; then the damage read every tick for `ticks` ticks. */
async function writeDamage(test: Test, p: Player, to: number, ticks: number, changes: () => number): Promise<string> {
  const inv = inventoryOf(p);
  const s = inv.getItem(ROD_SLOT);
  const d = s?.getComponent("minecraft:durability");
  if (s === undefined || d === undefined) return "no rod with durability in the slot";
  const was = d.damage;
  const c0 = changes();
  d.damage = to;
  inv.setItem(ROD_SLOT, s);
  const reads: string[] = [`+0:${damageOf(p)}`];
  let reverted = "none";
  for (let t = 1; t <= ticks; t++) {
    await test.idle(1);
    const now = damageOf(p);
    if (now !== String(to) && reverted === "none") reverted = `+${t}:${now}`;
    if (t === 1 || t === 5 || t === ticks) reads.push(`+${t}:${now}`);
  }
  return `write ${was}->${to}: reads=[${reads.join(" ")}] first_deviation=${reverted} playerInventoryItemChange_slot0=${changes() - c0} ${rodText(inv.getItem(ROD_SLOT))}`;
}

const liveHooks = (rec: Recorder, p: Player): HookRec[] => rec.hooks.filter((h) => (h.owner === p.name || h.nearest === p.name) && h.e.isValid);

/** Reels until none of the player's hooks is left, so every step starts from a rod that is not cast. */
async function noHookOut(test: Test, p: SimulatedPlayer, rec: Recorder): Promise<void> {
  for (let i = 0; i < 3 && liveHooks(rec, p).length > 0; i++) {
    await use(test, p, ROD_SLOT);
    await test.idle(12);
  }
}

/** Cast, wait for the hook to rest; the hook or undefined. */
async function castToRest(test: Test, p: SimulatedPlayer, rec: Recorder): Promise<HookRec | undefined> {
  await noHookOut(test, p, rec);
  const k = await cast(test, p, rec);
  if (k.hook !== undefined) await watchHook(test, k.hook, 80);
  return k.hook;
}

registerAsync("andrew", "probe_pearl_durability", async (test: Test): Promise<void> => {
  const p = await survivor(test, CAST_FROM, "pear_q7");
  const rec = new Recorder(test, () => [p]);
  const dim = test.getDimension();
  let slotChanges = 0;
  const change = world.afterEvents.playerInventoryItemChange.subscribe((ev) => {
    if (ev.player.name === p.name && ev.slot === ROD_SLOT) slotChanges++;
  });
  let held = false;
  try {
    const rod = new ItemStack(ROD);
    rod.setDynamicProperty(DP_KEY, "rod-1");
    rod.nameTag = "Перовый сокровятель";
    rod.setLore(["Pearl Rod", "unbound"]);
    await arm(test, p, AIMS[0], rod);
    log(`Q7 given RESULT ${rodText(inventoryOf(p).getItem(ROD_SLOT))}`);

    const k1 = await castToRest(test, p, rec);
    log(`Q7 reel_from_ground RESULT ${await reel(test, p, rec, k1)} after: ${rodText(inventoryOf(p).getItem(ROD_SLOT))}`);
    await test.idle(12);

    await noHookOut(test, p, rec);
    const write = await writeDamage(test, p, 0, 40, () => slotChanges);
    held = /first_deviation=none/.test(write) && damageOf(p) === "0";
    log(`Q7 write_back_idle RESULT hooks_out=${liveHooks(rec, p).length} ${write}`);

    // A write while the hook is out, on a damaged rod so the write is a visible change.
    const k2 = await castToRest(test, p, rec);
    log(`Q7 reel_to_damage RESULT ${await reel(test, p, rec, k2)}`);
    await test.idle(12);
    const k3 = await castToRest(test, p, rec);
    const whileCast = damageOf(p);
    const wrote = await writeDamage(test, p, 0, 20, () => slotChanges);
    const hookAfter = k3 === undefined ? "no hook" : k3.e.isValid ? "hook STILL VALID 20 ticks after the write" : `hook GONE (entityRemove +${(rec.removed.get(k3.id) ?? 0) - k3.tick} after its spawn)`;
    log(`Q7 write_while_cast RESULT damage_while_cast=${whileCast} ${wrote}; ${hookAfter}; next use: ${await reel(test, p, rec, k3)}`);
    await test.idle(12);

    // The rod switched away while the hook is out.
    const k4 = await castToRest(test, p, rec);
    const switchAt = system.currentTick;
    p.selectedSlotIndex = EMPTY_SLOT;
    let goneAt = "still valid after 40 ticks";
    for (let t = 1; t <= 40; t++) {
      await test.idle(1);
      if (k4 !== undefined && !k4.e.isValid) {
        goneAt = `gone at +${system.currentTick - switchAt}`;
        break;
      }
    }
    p.selectedSlotIndex = ROD_SLOT;
    await test.idle(4);
    log(`Q7 slot_switch_while_cast RESULT hook ${k4 === undefined ? "never spawned" : goneAt}; rod: ${rodText(inventoryOf(p).getItem(ROD_SLOT))}`);
    await noHookOut(test, p, rec);

    // The mark through a drop and a pick-up.
    const before = rodText(inventoryOf(p).getItem(ROD_SLOT));
    p.selectedSlotIndex = ROD_SLOT;
    const dropped = p.dropSelectedItem();
    await test.idle(2);
    const item = dim
      .getEntities({ type: "minecraft:item", location: p.location, maxDistance: 8 })
      .find((e) => e.getComponent("minecraft:item")?.itemStack.typeId === ROD);
    const onGround = item === undefined ? "no item entity" : rodText(item.getComponent("minecraft:item")?.itemStack);
    await test.idle(20);
    if (item?.isValid === true) p.teleport(item.location);
    let back: { slot: number; stack: ItemStack } | undefined;
    let t = 0;
    for (; t < 100 && back === undefined; t++) {
      await test.idle(1);
      back = findRod(p);
    }
    log(`Q7 drop_pickup RESULT dropped=${dropped} before: ${before} | on the ground: ${onGround} | picked_up=${back === undefined ? "no (100 ticks)" : `+${t} slot ${back.slot}`} after: ${rodText(back?.stack)}`);
  } finally {
    world.afterEvents.playerInventoryItemChange.unsubscribe(change);
    rec.close();
  }
  log(`Q7 RESULT durability.damage=0 written back to a vanilla rod ${held ? "HOLDS" : "does NOT hold"} on every read for 40 ticks`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2500)
  .tag("andrew");

// ------------------------------------- Q5: a ticking area over a far plate

/** The product's preload box (L0-pear-pr03 §2): the plate cell and its 8 neighbours. */
function addArea(dim: Dimension, x: number, z: number, name: string): string {
  try {
    return `successCount=${dim.runCommand(`tickingarea add ${x - 1} 0 ${z - 1} ${x + 1} 0 ${z + 1} ${name}`).successCount}`;
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

function removeArea(dim: Dimension, name: string): string {
  try {
    return `successCount=${dim.runCommand(`tickingarea remove ${name}`).successCount}`;
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

function nineLoaded(dim: Dimension, x: number, y: number, z: number): boolean {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!dim.isChunkLoaded({ x: x + dx, y, z: z + dz })) return false;
  return true;
}

/** Polls every tick until the 9 cells read loaded and getBlock answers; ticks and wall-clock ms, or -1. */
async function waitLoaded(test: Test, dim: Dimension, x: number, y: number, z: number, maxTicks: number): Promise<{ ticks: number; ms: number }> {
  const t0 = system.currentTick;
  const ms0 = Date.now();
  for (let i = 0; i <= maxTicks; i++) {
    if (nineLoaded(dim, x, y, z) && dim.getBlock({ x, y, z }) !== undefined) return { ticks: system.currentTick - t0, ms: Date.now() - ms0 };
    await test.idle(1);
  }
  return { ticks: -1, ms: Date.now() - ms0 };
}

/** A 3×3 stone floor at y-1, three cells of air above it, and a stone plate on the centre: a safe landing pad. */
function buildPad(dim: Dimension, x: number, y: number, z: number, plate: string): void {
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      dim.setBlockType({ x: x + dx, y: y - 1, z: z + dz }, "minecraft:stone");
      for (let dy = 0; dy <= 2; dy++) dim.setBlockType({ x: x + dx, y: y + dy, z: z + dz }, "minecraft:air");
    }
  dim.setBlockPermutation({ x, y, z }, BlockPermutation.resolve(plate));
}

interface Site {
  label: string;
  dim: Dimension;
  dx: number;
  /** A fixed standing height; undefined = one above the topmost block. */
  y?: number;
}

function standY(dim: Dimension, x: number, z: number, fixed: number | undefined): number {
  if (fixed !== undefined) return fixed;
  const top = dim.getTopmostBlock({ x, z });
  return top === undefined ? 0 : top.location.y + 1;
}

registerAsync("andrew", "probe_pearl_area_load", async (test: Test): Promise<void> => {
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const overworld = test.getDimension();
  const sites: Site[] = [
    { label: "overworld_10k", dim: overworld, dx: 10_000 },
    { label: "overworld_100k", dim: overworld, dx: 100_000 },
    { label: "overworld_1m", dim: overworld, dx: 1_000_000 },
    { label: "nether_10k", dim: world.getDimension("nether"), dx: 10_000, y: 70 },
    { label: "end_10k", dim: world.getDimension("the_end"), dx: 10_000, y: 70 },
  ];
  const name = "andrew_probe_pear_load";
  let readBack = 0;
  for (const s of sites) {
    const x = origin.x + s.dx;
    const z = origin.z;
    const probeY = s.y ?? 0;
    const before = s.dim.isChunkLoaded({ x, y: probeY, z });
    const add1 = addArea(s.dim, x, z, name);
    const load1 = await waitLoaded(test, s.dim, x, probeY, z, 1200);
    if (load1.ticks < 0) {
      log(`Q5 ${s.label} RESULT before=${before} add=${add1} NOT loaded within 1200 ticks (${load1.ms} ms); remove ${removeArea(s.dim, name)}`);
      await test.idle(2);
      continue;
    }
    const y = standY(s.dim, x, z, s.y);
    const ground = typeAt(s.dim, { x, y: y - 1, z });
    buildPad(s.dim, x, y, z, "minecraft:stone_pressure_plate");
    const placed = typeAt(s.dim, { x, y, z });
    const rem1 = removeArea(s.dim, name);
    let unload = -1;
    for (let t = 0; t <= 600; t++) {
      if (!s.dim.isChunkLoaded({ x, y, z })) {
        unload = t;
        break;
      }
      await test.idle(1);
    }
    const whileUnloaded = typeAt(s.dim, { x, y, z });
    const add2 = addArea(s.dim, x, z, name);
    const load2 = await waitLoaded(test, s.dim, x, y, z, 1200);
    const after = typeAt(s.dim, { x, y, z });
    if (after === placed && isPlate(after)) readBack++;
    const rem2 = removeArea(s.dim, name);
    log(
      `Q5 ${s.label} RESULT at x=${x} z=${z} y=${y} before=${before} add=${add1} fresh_load=${load1.ticks} ticks/${load1.ms} ms ` +
        `ground_below=${short(ground)} plate_placed=${short(placed)} | remove=${rem1} unloaded_after=${unload < 0 ? ">600" : unload} ticks read_while_unloaded=${whileUnloaded} ` +
        `| re-add=${add2} reload=${load2.ticks} ticks/${load2.ms} ms plate_read_after_reload=${short(after)} | remove=${rem2}`
    );
    // A same-name add in the tick of its remove is refused (probe_pearl_area_budget); the next site waits.
    await test.idle(2);
  }
  log(`Q5 RESULT the plate read back after an unload and a fresh preload at ${readBack} of ${sites.length} far sites`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(12000)
  .tag("andrew");

/** How many ticking areas the world gives, and whether the cap is per dimension or world-wide. */
registerAsync("andrew", "probe_pearl_area_budget", async (test: Test): Promise<void> => {
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const dims = { overworld: test.getDimension(), nether: world.getDimension("nether"), the_end: world.getDimension("the_end") };
  const held: Array<{ dim: Dimension; name: string }> = [];
  let serial = 0;
  const addOne = (dim: Dimension, i: number): string => {
    const name = `andrew_probe_pear_cap_${serial++}`;
    const r = addArea(dim, origin.x + 3000 + i * 64, origin.z + 3000, name);
    if (r === "successCount=1") held.push({ dim, name });
    return r;
  };
  const fill = (dim: Dimension): { added: number; refusal: string } => {
    for (let i = 0; i < 40; i++) {
      const r = addOne(dim, i);
      if (r !== "successCount=1") return { added: i, refusal: `attempt ${i + 1}: ${r}` };
    }
    return { added: 40, refusal: "none within 40" };
  };
  const clear = (): number => {
    let n = 0;
    for (const h of held.splice(0)) if (removeArea(h.dim, h.name) === "successCount=1") n++;
    return n;
  };
  try {
    const ow = fill(dims.overworld);
    const netherWhenFull = addOne(dims.nether, 100);
    const endWhenFull = addOne(dims.the_end, 100);
    log(`Q5 budget overworld_first RESULT overworld added=${ow.added} (${ow.refusal}); then nether=${netherWhenFull} end=${endWhenFull}; removed ${clear()}`);
    const ne = fill(dims.nether);
    const owWhenNetherFull = addOne(dims.overworld, 200);
    log(`Q5 budget nether_first RESULT nether added=${ne.added} (${ne.refusal}); then overworld=${owWhenNetherFull}; removed ${clear()}`);
    const again = addOne(dims.overworld, 300);
    log(`Q5 budget RESULT world cap=${ow.added} areas in a fresh GameTest world with no other areas; after freeing all, one more add: ${again}; removed ${clear()}`);
    await test.idle(2);

    // Remove and add inside one tick, under one name: at the same spot, then at another spot.
    const x = origin.x + 5000;
    const z = origin.z + 5000;
    const SAME = "andrew_probe_pear_same";
    for (const [label, x2] of [
      ["same_spot", x],
      ["other_spot", x + 4000],
    ] as const) {
      const first = addArea(dims.overworld, x, z, SAME);
      const remSame = removeArea(dims.overworld, SAME);
      const sameTick = addArea(dims.overworld, x2, z, SAME);
      await test.idle(1);
      const nextTick = sameTick === "successCount=1" ? "not needed" : addArea(dims.overworld, x2, z, SAME);
      log(`Q5 budget same_name_${label} RESULT add=${first} remove=${remSame} add_same_name_same_tick=${sameTick} add_same_name_next_tick=${nextTick}; remove ${removeArea(dims.overworld, SAME)}`);
      await test.idle(2);
    }
    // The area_load sequence: the first area has loaded its chunk before it is removed.
    for (const [label, x2] of [
      ["after_load_same_spot", x + 8000],
      ["after_load_other_spot", x + 12000],
    ] as const) {
      const x1 = label === "after_load_same_spot" ? x2 : x + 10000;
      const first = addArea(dims.overworld, x1, z, SAME);
      const load = await waitLoaded(test, dims.overworld, x1, 0, z, 600);
      const remSame = removeArea(dims.overworld, SAME);
      const sameTick = addArea(dims.overworld, x2, z, SAME);
      await test.idle(1);
      const nextTick = sameTick === "successCount=1" ? "not needed" : addArea(dims.overworld, x2, z, SAME);
      const load2 = await waitLoaded(test, dims.overworld, x2, 0, z, 600);
      log(
        `Q5 budget same_name_${label} RESULT add=${first} loaded=${load.ticks} ticks remove=${remSame} add_same_name_same_tick=${sameTick} ` +
          `add_same_name_next_tick=${nextTick} second_area_loaded=${load2.ticks} ticks; remove ${removeArea(dims.overworld, SAME)}`
      );
      await test.idle(2);
    }
    await test.idle(2);
    const full = fill(dims.overworld);
    const victim = held.shift();
    const remFull = victim === undefined ? "nothing held" : removeArea(victim.dim, victim.name);
    const otherSameTick = addOne(dims.overworld, 400);
    await test.idle(1);
    const otherNextTick = otherSameTick === "successCount=1" ? "not needed" : addOne(dims.overworld, 401);
    log(`Q5 budget full_swap RESULT filled=${full.added}; remove one=${remFull}; add another name same tick=${otherSameTick}; next tick=${otherNextTick}; removed ${clear()}`);
    await test.idle(2);
    const full2 = fill(dims.overworld);
    await test.idle(20);
    const loadedNow = held.filter((h) => h.dim.isChunkLoaded({ x: origin.x + 3000, y: 0, z: origin.z + 3000 })).length;
    const victim2 = held.shift();
    const remFull2 = victim2 === undefined ? "nothing held" : removeArea(victim2.dim, victim2.name);
    const loadedSameTick = addOne(dims.overworld, 500);
    await test.idle(1);
    const loadedNextTick = loadedSameTick === "successCount=1" ? "not needed" : addOne(dims.overworld, 501);
    log(
      `Q5 budget full_swap_after_load RESULT filled=${full2.added}, 20 ticks later first area's chunk loaded=${loadedNow > 0}; remove one=${remFull2}; ` +
        `add another name same tick=${loadedSameTick}; next tick=${loadedNextTick}; removed ${clear()}`
    );
  } finally {
    clear();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");

// ------------------------------------- Q6: cross-dimension (and far) teleports after a preload

interface Trip {
  label: string;
  dim: Dimension;
  dx: number;
  y?: number;
}

registerAsync("andrew", "probe_pearl_dimension_trip", async (test: Test): Promise<void> => {
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const overworld = test.getDimension();
  const nether = world.getDimension("nether");
  const end = world.getDimension("the_end");
  const p = await survivor(test, CAST_FROM, "pear_q6");
  const cycle: Trip[] = [
    { label: "nether_2k", dim: nether, dx: 2000, y: 70 },
    { label: "end_2k", dim: end, dx: 2000, y: 70 },
    { label: "overworld_100k", dim: overworld, dx: 100_000 },
    { label: "overworld_101k", dim: overworld, dx: 101_000 },
  ];
  const area = "andrew_probe_pear_trip";
  let ok = 0;
  let crossOk = 0;
  let crossTotal = 0;
  let total = 0;
  const forced: string[] = [];
  try {
    for (let round = 0; round < 3; round++) {
      const force = round === 1;
      for (const t of cycle) {
        const x = origin.x + t.dx + round * 32;
        const z = origin.z;
        const fromDim = p.dimension.id;
        const add = addArea(t.dim, x, z, area);
        const load = await waitLoaded(test, t.dim, x, t.y ?? 0, z, 1200);
        if (load.ticks < 0) {
          log(`Q6 round${round} ${t.label} RESULT preload add=${add} NOT loaded within 1200 ticks; remove ${removeArea(t.dim, area)}`);
          total++;
          if (fromDim !== t.dim.id) crossTotal++;
          continue;
        }
        const y = standY(t.dim, x, z, t.y);
        buildPad(t.dim, x, y, z, "minecraft:stone_pressure_plate");
        const want = { x: x + 0.5, y, z: z + 0.5 };
        let threw = "";
        try {
          p.teleport(want, force ? { dimension: t.dim, forceProvidedPositionOnDimensionChange: true } : { dimension: t.dim });
        } catch (err) {
          threw = `teleport threw ${errText(err)}`;
        }
        const dim0 = p.dimension.id;
        const off0 = len(sub(p.location, want));
        const good = threw === "" && dim0 === t.dim.id && off0 < 0.5;
        // The product releases its area on a matching read-back (L0-pear-pr03 §5).
        const rem = removeArea(t.dim, area);
        const t0 = system.currentTick;
        const later: string[] = [];
        for (const wait of [1, 4, 15, 40]) {
          await test.idle(wait);
          later.push(`+${system.currentTick - t0}:${short(p.dimension.id)}/${f2(len(sub(p.location, want)))}/${p.isOnGround ? "g" : "air"}`);
        }
        const settled = p.dimension.id === t.dim.id && len(sub(p.location, want)) < 0.5;
        total++;
        if (fromDim !== t.dim.id) crossTotal++;
        if (good && settled) {
          ok++;
          if (fromDim !== t.dim.id) crossOk++;
        }
        if (force) forced.push(`${t.label}:${good && settled ? "ok" : "FAIL"}`);
        log(
          `Q6 round${round} ${short(fromDim)}->${t.label} RESULT force=${force} preload=${load.ticks} ticks/${load.ms} ms add=${add} y=${y} ` +
            `readback+0 dim=${short(dim0)} off=${f4(off0)} ${threw} | area remove=${rem} | samples(dim/off/ground) ${later.join(" ")} ` +
            `| hp=${p.getComponent("minecraft:health")?.currentValue ?? "?"} pass=${good && settled}`
        );
      }
    }

    // Negative control: no preload. The destination chunk in the Nether was never loaded.
    const nx = origin.x + 30_000;
    const nz = origin.z;
    const loadedBefore = nether.isChunkLoaded({ x: nx, y: 70, z: nz });
    const want = { x: nx + 0.5, y: 70, z: nz + 0.5 };
    let threw = "";
    try {
      p.teleport(want, { dimension: nether });
    } catch (err) {
      threw = `teleport threw ${errText(err)}`;
    }
    const t0 = system.currentTick;
    const samples = [`+0:${short(p.dimension.id)}/${f2(len(sub(p.location, want)))}/loaded=${nether.isChunkLoaded(want)}`];
    for (const wait of [1, 4, 15, 40, 60]) {
      await test.idle(wait);
      samples.push(`+${system.currentTick - t0}:${short(p.dimension.id)}/${f2(len(sub(p.location, want)))}/y=${f2(p.location.y)}/loaded=${nether.isChunkLoaded(want)}/block=${short(typeAt(nether, cellOf(want)))}`);
    }
    log(`Q6 control_no_preload RESULT nether x=${nx} loaded_before=${loadedBefore} ${threw} samples(dim/off/…) ${samples.join(" ")}`);
  } finally {
    p.teleport(test.worldLocation({ x: 3.5, y: 2, z: 0.5 }), { dimension: overworld });
    await test.idle(2);
    log(`Q6 home RESULT back in ${short(p.dimension.id)} at ${v2(test.relativeLocation(p.location))}`);
    removeArea(nether, area);
    removeArea(end, area);
    removeArea(overworld, area);
  }
  log(`Q6 RESULT ${ok} of ${total} preloaded trips arrived and stayed (cross-dimension ${crossOk} of ${crossTotal}); forceProvidedPositionOnDimensionChange round: [${forced.join(",")}]`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(12000)
  .tag("andrew");

// ------------------------------------- Q8: are blank rows and columns of a 3×3 pattern trimmed

const CRAFTER: Vector3 = { x: 3, y: 2, z: 4 };
const POWER: Vector3 = { x: 2, y: 2, z: 4 };

interface Layout {
  label: string;
  cells: ReadonlyArray<readonly [number, string]>;
  expect: string;
}

/** probe_pearl_grid_top = [" A ", " B ", "   "] → emerald; probe_pearl_grid_corner = ["   ", "  C", "  D"] → lapis. */
const A = "minecraft:amethyst_shard";
const B = "minecraft:blaze_rod";
const C = "minecraft:prismarine_crystals";
const D = "minecraft:rabbit_hide";
const LAYOUTS: readonly Layout[] = [
  { label: "top_declared(1,4)", cells: [[1, A], [4, B]], expect: "emerald" },
  { label: "top_down(4,7)", cells: [[4, A], [7, B]], expect: "emerald" },
  { label: "top_left(0,3)", cells: [[0, A], [3, B]], expect: "emerald" },
  { label: "top_right(2,5)", cells: [[2, A], [5, B]], expect: "emerald" },
  { label: "top_left_down(3,6)", cells: [[3, A], [6, B]], expect: "emerald" },
  { label: "corner_declared(5,8)", cells: [[5, C], [8, D]], expect: "lapis_lazuli" },
  { label: "corner_up(2,5)", cells: [[2, C], [5, D]], expect: "lapis_lazuli" },
  { label: "corner_left(4,7)", cells: [[4, C], [7, D]], expect: "lapis_lazuli" },
  { label: "corner_top_left(0,3)", cells: [[0, C], [3, D]], expect: "lapis_lazuli" },
  { label: "control_vanilla_sticks(0,3)", cells: [[0, "minecraft:oak_planks"], [3, "minecraft:oak_planks"]], expect: "stick" },
  { label: "control_vanilla_sticks(4,7)", cells: [[4, "minecraft:oak_planks"], [7, "minecraft:oak_planks"]], expect: "stick" },
  { label: "control_one_ingredient(1)", cells: [[1, A]], expect: "nothing" },
];

registerAsync("andrew", "probe_pearl_recipe_grid", async (test: Test): Promise<void> => {
  test.setBlockPermutation(BlockPermutation.resolve("minecraft:crafter", { orientation: "south_up" }), CRAFTER);
  const dim = test.getDimension();
  const at = test.worldBlockLocation(CRAFTER);
  const out: Array<{ tick: number; e: Entity; type: string; n: number }> = [];
  const spawn = world.afterEvents.entitySpawn.subscribe((ev) => {
    if (ev.entity.typeId !== "minecraft:item") return;
    const s = ev.entity.getComponent("minecraft:item")?.itemStack;
    out.push({ tick: system.currentTick, e: ev.entity, type: short(s?.typeId ?? "?"), n: s?.amount ?? 0 });
  });
  const crafted = new Map<string, string>();
  try {
    await test.idle(2);
    for (const l of LAYOUTS) {
      for (let slot = 0; slot < 9; slot++) {
        const item = l.cells.find(([s]) => s === slot)?.[1] ?? "minecraft:air";
        const ok = dim.runCommand(`replaceitem block ${at.x} ${at.y} ${at.z} slot.container ${slot} ${item} 1`).successCount;
        test.assert(ok > 0, `replaceitem slot ${slot} ${item} failed`);
      }
      const from = system.currentTick;
      test.pulseRedstone(POWER, 2);
      await test.idle(12);
      const got = out.filter((o) => o.tick >= from);
      const text = got.map((o) => `${o.type}×${o.n}`).join(",") || "nothing";
      crafted.set(l.label, text);
      log(`Q8 ${l.label} RESULT crafter ejected=${text} (a match would give ${l.expect})`);
      for (const o of got) if (o.e.isValid) o.e.remove();
      await test.idle(4);
    }
  } finally {
    world.afterEvents.entitySpawn.unsubscribe(spawn);
  }
  test.assert(crafted.get("top_declared(1,4)")?.includes("emerald") === true, "control: the declared top layout crafted nothing — the probe recipe did not load");
  test.assert(crafted.get("control_vanilla_sticks(4,7)")?.includes("stick") === true, "control: vanilla sticks did not craft — the crafter is not matching at all");
  const shifted = [...crafted].filter(([k, v]) => !k.includes("declared") && !k.startsWith("control") && v !== "nothing");
  log(`Q8 RESULT shifted layouts that crafted: ${shifted.length === 0 ? "none — blank rows and columns are NOT trimmed" : shifted.map(([k, v]) => `${k}=${v}`).join(",")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");
