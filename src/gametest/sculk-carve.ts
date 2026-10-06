// SCLK-CARVE-01 scenarios for the block-hit crater and its sculk (L0-sclk-p005; T11 ac11, T12 ac12, T13 ac13,
// ac22; R-sclk-003, r004, r010). Real bolts are launched at stone through the swap's own path (launchBolt) and
// hit it through projectileHitBlock; the carve reports of observeCarves and the blocks in the world are the
// witnesses. Each scenario logs one or more "[gametest] sculk-carve <name> RESULT …" lines.

import { BlockVolume, type Dimension, type Entity, GameMode, ItemStack, type Vector3, system, world } from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { forgetWatched } from "../legendary/recovery";
import { DRAGON_KATANA, type LegendaryDef, WEB_SWORD } from "../legendary/registry";
import { withoutOwed } from "../legendary/rules";
import * as state from "../legendary/state";
import { BOLT_LIFETIME_TICKS, type CarveReport, type Face, SCULK, cellAt, launchBolt, liveBoltCount, observeCarves, pendingCarves } from "../sculk";
import { goTo } from "./orbital-core";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const STONE = "minecraft:stone";
const AIR = "minecraft:air";
const SHOOTER_AT: Vector3 = { x: 3, y: 2, z: 0 };
/** Block ids that are never placed by the crossbow (§7). */
const FUNCTIONAL_SCULK = ["minecraft:sculk_sensor", "minecraft:calibrated_sculk_sensor", "minecraft:sculk_shrieker", "minecraft:sculk_catalyst", "minecraft:sculk_vein"];

const log = (msg: string): void => console.warn(`[gametest] sculk-carve ${msg}`);
const f2 = (n: number): string => n.toFixed(2);
const key = (c: Vector3): string => `${c.x},${c.y},${c.z}`;
const short = (id: string): string => id.replace("minecraft:", "");
const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const typeAt = (dim: Dimension, at: Vector3): string => dim.getBlock(at)?.typeId ?? "unloaded";

const OUT: Record<Face, Vector3> = {
  Up: { x: 0, y: 1, z: 0 },
  Down: { x: 0, y: -1, z: 0 },
  North: { x: 0, y: 0, z: -1 },
  South: { x: 0, y: 0, z: 1 },
  East: { x: 1, y: 0, z: 0 },
  West: { x: -1, y: 0, z: 0 },
};

/** A bolt from an earlier scenario lives at most BOLT_LIFETIME_TICKS, and its crater drains within a few ticks. */
async function quiet(test: Test): Promise<void> {
  for (let t = 0; t < BOLT_LIFETIME_TICKS + 20 && (liveBoltCount() > 0 || pendingCarves() > 0); t++) await test.idle(1);
  test.assert(liveBoltCount() === 0 && pendingCarves() === 0, `${liveBoltCount()} bolt(s), ${pendingCarves()} crater(s) left from an earlier scenario`);
}

function fill(dim: Dimension, a: Vector3, b: Vector3, type: string): void {
  dim.fillBlocks(new BlockVolume(a, b), type);
}

/** Stone 7×7 across and 5 deep, its top face at `top`.y, centred on `top`. */
function slab(dim: Dimension, top: Vector3, type = STONE, half = 3): void {
  fill(dim, { x: top.x - half, y: top.y - 4, z: top.z - half }, { x: top.x + half, y: top.y, z: top.z + half }, type);
}

function snapshot(dim: Dimension, min: Vector3, max: Vector3): Map<string, string> {
  const out = new Map<string, string>();
  for (let x = min.x; x <= max.x; x++) for (let y = min.y; y <= max.y; y++) for (let z = min.z; z <= max.z; z++) out.set(key({ x, y, z }), typeAt(dim, { x, y, z }));
  return out;
}

function changes(before: Map<string, string>, after: Map<string, string>): Array<{ at: string; from: string; to: string }> {
  const out: Array<{ at: string; from: string; to: string }> = [];
  for (const [at, from] of before) {
    const to = after.get(at) ?? "missing";
    if (to !== from) out.push({ at, from, to });
  }
  return out;
}

const parse = (k: string): Vector3 => {
  const [x, y, z] = k.split(",").map(Number);
  return { x, y, z };
};

/** u, v across the face plane and k layers into the block, relative to `impact`. */
function local(impact: Vector3, face: Face, c: Vector3): { u: number; v: number; k: number } {
  const out = OUT[face];
  const d = { x: c.x - impact.x, y: c.y - impact.y, z: c.z - impact.z };
  const k = -(d.x * out.x + d.y * out.y + d.z * out.z);
  const rest = { x: d.x + out.x * k, y: d.y + out.y * k, z: d.z + out.z * k };
  if (out.y !== 0) return { u: rest.x, v: rest.z, k };
  if (out.z !== 0) return { u: rest.x, v: rest.y, k };
  return { u: rest.z, v: rest.y, k };
}

interface Carves {
  reports: Map<string, CarveReport>;
  stop(): void;
}

function watchCarves(): Carves {
  const reports = new Map<string, CarveReport>();
  const stop = observeCarves((r) => reports.set(r.boltId, r));
  return { reports, stop };
}

/** Fires a bolt 4 cells out of `face` straight at `cell`; resolves with the bolt id. */
function fireAt(test: Test, owner: Entity, dim: Dimension, cell: Vector3, face: Face, speed = 1.5): string {
  const out = OUT[face];
  const from = { x: cell.x + 0.5 + out.x * 4.5, y: cell.y + 0.5 + out.y * 4.5, z: cell.z + 0.5 + out.z * 4.5 };
  const record = launchBolt(owner, dim, from, { x: -out.x * speed, y: -out.y * speed, z: -out.z * speed });
  test.assert(record !== undefined, `launchBolt refused the bolt at ${key(cell)}`);
  return record!.id;
}

async function waitReports(test: Test, carves: Carves, ids: readonly string[], ticks = 60): Promise<CarveReport[]> {
  for (let t = 0; t < ticks && ids.some((id) => !carves.reports.has(id)); t++) await test.idle(1);
  const missing = ids.filter((id) => !carves.reports.has(id));
  test.assert(missing.length === 0, `no crater report for bolt(s) ${missing.join(",")}: the bolt never hit or the job never finished`);
  return ids.map((id) => carves.reports.get(id)!);
}

/** The depth of each footprint column, read from the world: a picture of the crater for the log. */
function depthMap(impact: Vector3, face: Face, air: ReadonlySet<string>): string {
  const rows: string[] = [];
  for (let v = -2; v <= 2; v++) {
    let row = "";
    for (let u = -2; u <= 2; u++) {
      let d = 0;
      while (d < 4 && air.has(key(cellAt(impact, face, u, v, d)))) d++;
      row += String(d);
    }
    rows.push(row);
  }
  return rows.join("/");
}

function items(dim: Dimension, centre: Vector3, radius: number): Entity[] {
  return dim.getEntities({ type: "minecraft:item", location: centre, maxDistance: radius });
}

// ---------------------------------------------------------------- AC#1, T11: an irregular crater ≤ 5×5 × 3

interface Site {
  label: string;
  impact: Vector3;
  face: Face;
  min: Vector3;
  max: Vector3;
}

registerAsync("andrew", "sculk_carve_crater_bounds", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const shooter = test.spawnSimulatedPlayer(SHOOTER_AT, "sk_carve_bounds", GameMode.Survival);
  const carves = watchCarves();
  const tops = [-9, 0, 9].map((x) => test.worldBlockLocation({ x, y: 6, z: 10 }));
  const wallA = test.worldBlockLocation({ x: -3, y: 2, z: 20 });
  const wallB = test.worldBlockLocation({ x: 3, y: 8, z: 24 });
  const sideImpact = test.worldBlockLocation({ x: 0, y: 5, z: 20 });
  const sites: Site[] = [
    ...tops.map((t, i) => ({ label: `top${i}`, impact: t, face: "Up" as Face, min: add(t, { x: -4, y: -5, z: -4 }), max: add(t, { x: 4, y: 3, z: 4 }) })),
    { label: "side", impact: sideImpact, face: "North" as Face, min: add(sideImpact, { x: -4, y: -4, z: -3 }), max: add(sideImpact, { x: 4, y: 4, z: 5 }) },
  ];
  const centre = test.worldLocation({ x: 0, y: 5, z: 15 });
  try {
    await quiet(test);
    for (const t of tops) slab(dim, t);
    fill(dim, wallA, wallB, STONE);
    for (const e of items(dim, centre, 30)) e.remove();
    await test.idle(3);
    const before = sites.map((s) => snapshot(dim, s.min, s.max));
    const ids = sites.map((s) => fireAt(test, shooter, dim, s.impact, s.face));
    const reports = await waitReports(test, carves, ids);
    await test.idle(10);
    const newItems = items(dim, centre, 30).length;

    const topShapes = new Set<string>();
    const verdicts: string[] = [];
    sites.forEach((s, i) => {
      const r = reports[i];
      const diff = changes(before[i], snapshot(dim, s.min, s.max));
      const air = diff.filter((d) => d.to === AIR).map((d) => d.at);
      const sculk = diff.filter((d) => d.to === SCULK).map((d) => d.at);
      const other = diff.filter((d) => d.to !== AIR && d.to !== SCULK);
      const airSet = new Set(air);
      const out = air.map((a) => local(s.impact, s.face, parse(a))).filter((l) => Math.abs(l.u) > 2 || Math.abs(l.v) > 2 || l.k < 0 || l.k > 2);
      const sculkOut = sculk.map((a) => local(s.impact, s.face, parse(a))).filter((l) => Math.abs(l.u) > 2 || Math.abs(l.v) > 2);
      const columns = new Set(air.map((a) => {
        const l = local(s.impact, s.face, parse(a));
        return `${l.u},${l.v}`;
      }));
      const centreDeep = airSet.has(key(s.impact)) && airSet.has(key(cellAt(s.impact, s.face, 0, 0, 1)));
      const reported = new Set([...r.carved, ...r.sculked].map(key));
      const unreported = [...air, ...sculk].filter((a) => !reported.has(a));
      const map = depthMap(s.impact, s.face, airSet);
      if (s.face === "Up") topShapes.add(map);
      log(
        `crater_bounds RESULT ${s.label} face ${s.face} seed ${r.seed}: air ${air.length} (planned ${r.plan.air.length}), sculk ${sculk.length} (planned ${r.plan.sculk.length}), ` +
          `other changes ${other.length} [${other.slice(0, 3).map((d) => `${d.at} ${short(d.from)}->${short(d.to)}`).join("; ")}]; depth map ${map}; ` +
          `air outside 5×5×3 ${out.length}, sculk outside 5×5 ${sculkOut.length}, footprint columns carved ${columns.size}/25, centre ≥ 2 deep ${centreDeep}, ` +
          `changes not in the report ${unreported.length}, ticks ${r.doneTick - r.hitTick + 1}`
      );
      const ok =
        out.length === 0 &&
        sculkOut.length === 0 &&
        other.length === 0 &&
        centreDeep &&
        air.length >= 12 &&
        air.length <= 75 &&
        columns.size < 25 &&
        unreported.length === 0 &&
        r.carved.length === air.length &&
        r.sculked.length === sculk.length;
      verdicts.push(`${s.label}:${ok ? "ok" : "FAIL"}`);
    });
    log(`crater_bounds RESULT distinct top-face shapes ${topShapes.size} of ${tops.length}; new item entities ${newItems}; ${verdicts.join(" ")}`);
    test.assert(verdicts.every((v) => v.endsWith(":ok")), `a crater broke its bounds: ${verdicts.join(" ")}`);
    test.assert(topShapes.size >= 2, "three bolts with three seeds carved one identical shape: not irregular");
    test.assert(newItems === 0, `${newItems} item entities appeared: the crater dropped something`);
  } finally {
    carves.stop();
    for (const t of tops) slab(dim, t, AIR);
    fill(dim, wallA, wallB, AIR);
    test.removeSimulatedPlayer(shooter);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ---------------------------------------------------------------- AC#2, T12: no damage to anyone near the crater

registerAsync("andrew", "sculk_carve_no_damage", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const impact = test.worldBlockLocation({ x: 0, y: 6, z: 10 });
  const shooter = test.spawnSimulatedPlayer(SHOOTER_AT, "sk_carve_dmg_s", GameMode.Survival);
  const outside = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 1 }, "sk_carve_dmg_out", GameMode.Survival);
  const rim = test.spawnSimulatedPlayer({ x: 2, y: 2, z: 1 }, "sk_carve_dmg_rim", GameMode.Survival);
  const carves = watchCarves();
  const hurts: string[] = [];
  const watched = new Map<string, string>();
  const hurtSub = world.afterEvents.entityHurt.subscribe((e) => {
    const who = watched.get(e.hurtEntity.id);
    if (who !== undefined) hurts.push(`${who} ${e.damageSource.cause}:${f2(e.damage)}@${system.currentTick}`);
  });
  const explosions: string[] = [];
  const boomSub = world.afterEvents.explosion.subscribe((e) => explosions.push(`${e.dimension.id}@${system.currentTick}`));
  let cow: Entity | undefined;
  try {
    await quiet(test);
    slab(dim, impact, STONE, 5);
    await test.idle(3);
    // 3 cells out: outside the 5×5 footprint. 2 cells out: on a rim column, which may be carved under it.
    await goTo(test, outside, dim, add(impact, { x: 3, y: 1, z: 0 }));
    await goTo(test, rim, dim, add(impact, { x: -2, y: 1, z: 0 }));
    cow = test.spawnWithoutBehaviors("minecraft:cow", test.relativeBlockLocation(add(impact, { x: 0, y: 1, z: 3 })));
    for (const [e, name] of [[shooter, "shooter"], [outside, "outside"], [rim, "rim"], [cow, "cow"]] as Array<[Entity, string]>) watched.set(e.id, name);
    await test.idle(10);
    const pos0 = { ...outside.location };
    const rimY0 = rim.location.y;
    const cowHp0 = cow.getComponent("minecraft:health")?.currentValue ?? -1;
    const tnt0 = dim.getEntities({ type: "minecraft:tnt", location: impact, maxDistance: 32 }).length;

    const launchTick = system.currentTick;
    const id = fireAt(test, shooter, dim, impact, "Up");
    let maxDp = 0;
    for (let t = 0; t < 60 && !carves.reports.has(id); t++) {
      await test.idle(1);
      maxDp = Math.max(maxDp, Math.hypot(outside.location.x - pos0.x, outside.location.y - pos0.y, outside.location.z - pos0.z));
    }
    const [r] = await waitReports(test, carves, [id]);
    for (let t = 0; t < 20; t++) {
      await test.idle(1);
      maxDp = Math.max(maxDp, Math.hypot(outside.location.x - pos0.x, outside.location.y - pos0.y, outside.location.z - pos0.z));
    }
    const windowHurts = [...hurts];
    const windowBooms = [...explosions];
    const tnt = dim.getEntities({ type: "minecraft:tnt", location: impact, maxDistance: 32 }).length - tnt0;
    const rimDrop = rimY0 - rim.location.y;
    const underRim = local(impact, "Up", { x: impact.x - 2, y: impact.y, z: impact.z });
    const rimCarved = r.carved.some((c) => c.x === impact.x - 2 && c.z === impact.z);
    const cowHp = cow.getComponent("minecraft:health")?.currentValue ?? -1;

    // Controls: each witness sees an event when there is one.
    outside.applyDamage(1);
    const boomAt = test.worldLocation({ x: 0, y: 30, z: -24 });
    const boomFired = dim.createExplosion(boomAt, 1, { breaksBlocks: false, causesFire: false });
    await test.idle(2);
    const hurtLive = hurts.length - windowHurts.length;
    const boomLive = explosions.length - windowBooms.length;

    log(
      `no_damage RESULT bolt ${id} seed ${r.seed} hit at +${r.hitTick - launchTick}, crater ${r.carved.length} sculk ${r.sculked.length}; ` +
        `window +0…+${system.currentTick - launchTick - 2}: entityHurt [${windowHurts.join(" ")}], explosion events [${windowBooms.join(" ")}], new tnt ${tnt}; ` +
        `outside (3 out) max |dp| ${maxDp.toFixed(4)}; rim (2 out, column ${underRim.u},${underRim.v} carved ${rimCarved}) dropped ${f2(rimDrop)}; cow hp ${cowHp0}->${cowHp}; ` +
        `controls: applyDamage(1) seen ${hurtLive}, createExplosion ${boomFired} seen ${boomLive}`
    );
    test.assert(windowHurts.length === 0, `entityHurt near the crater: ${windowHurts.join(" ")}`);
    test.assert(windowBooms.length === 0 && tnt === 0, `an explosion happened: events [${windowBooms.join(" ")}], tnt ${tnt}`);
    test.assert(maxDp <= 0.01, `the bystander outside the crater moved ${maxDp.toFixed(4)}`);
    test.assert(cowHp === cowHp0, `the cow's health went ${cowHp0} -> ${cowHp}`);
    test.assert(r.carved.length >= 12, `the crater carved ${r.carved.length} cells: nothing to be hurt by`);
    test.assert(hurtLive >= 1 && boomLive >= 1, `a control saw nothing: hurt ${hurtLive}, explosion ${boomLive}`);
  } finally {
    world.afterEvents.entityHurt.unsubscribe(hurtSub);
    world.afterEvents.explosion.unsubscribe(boomSub);
    carves.stop();
    try {
      if (cow?.isValid) cow.remove();
    } catch {
      // gone with the test
    }
    slab(dim, impact, AIR, 5);
    for (const p of [shooter, outside, rim]) test.removeSimulatedPlayer(p);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(500)
  .tag("andrew");

// ---------------------------------------------------------------- AC#3, T13: permanent plain sculk, through a chunk reload

registerAsync("andrew", "sculk_carve_sculk_survives_reload", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  // Past the spawn chunks, so releasing the ticking area really unloads the site (probe P5 measured 1 tick at 512).
  const impact = test.worldBlockLocation({ x: 704, y: 12, z: 0 });
  const box = { min: [impact.x - 8, 0, impact.z - 8] as [number, number, number], max: [impact.x + 8, 0, impact.z + 8] as [number, number, number] };
  const scanMin = add(impact, { x: -4, y: -5, z: -4 });
  const scanMax = add(impact, { x: 4, y: 3, z: 4 });
  const shooter = test.spawnSimulatedPlayer(SHOOTER_AT, "sk_carve_reload", GameMode.Survival);
  const carves = watchCarves();
  let release: (() => void) | undefined;
  try {
    await quiet(test);
    release = await loadBox(test, dim, "andrew_gt_skcv", box);
    slab(dim, impact);
    fill(dim, add(impact, { x: -3, y: 0, z: -3 }), add(impact, { x: 3, y: 0, z: 3 }), "minecraft:grass_block");
    await test.idle(3);
    const before = snapshot(dim, scanMin, scanMax);
    const id = fireAt(test, shooter, dim, impact, "Up");
    const [r] = await waitReports(test, carves, [id]);
    await test.idle(40);
    const after = snapshot(dim, scanMin, scanMax);
    const diff = changes(before, after);
    const sculk = diff.filter((d) => d.to === SCULK).map((d) => parse(d.at));
    const exposed = sculk.filter((c) => {
      const above = typeAt(dim, add(c, { x: 0, y: 1, z: 0 }));
      return above === AIR;
    });
    const functional = [...after.entries()].filter(([, t]) => FUNCTIONAL_SCULK.includes(t)).map(([at, t]) => `${at} ${short(t)}`);
    const onWhat = new Map<string, number>();
    for (const d of diff.filter((x) => x.to === SCULK)) onWhat.set(short(d.from), (onWhat.get(short(d.from)) ?? 0) + 1);

    release();
    release = undefined;
    let unloadTicks = -1;
    for (let t = 0; t < 600; t++) {
      if (!dim.isChunkLoaded(impact)) {
        unloadTicks = t;
        break;
      }
      await test.idle(1);
    }
    const whileUnloaded = typeAt(dim, impact);
    release = await loadBox(test, dim, "andrew_gt_skcv", box);
    for (let t = 0; t < 100 && !dim.isChunkLoaded(impact); t++) await test.idle(1);
    await test.idle(5);
    const reloaded = sculk.filter((c) => typeAt(dim, c) === SCULK);
    const craterKept = r.carved.filter((c) => typeAt(dim, c) === AIR);

    log(
      `sculk_reload RESULT bolt ${id} seed ${r.seed}: crater ${r.carved.length}, sculk cells ${sculk.length} (report ${r.sculked.length}), exposed ${exposed.length}, ` +
        `replaced [${[...onWhat.entries()].map(([t, n]) => `${t}×${n}`).join(", ")}]; functional sculk blocks in the box [${functional.join(", ")}]; ` +
        `chunk unloaded ${unloadTicks >= 0 ? `after ${unloadTicks} ticks` : "NEVER (600 ticks)"}, getBlock while unloaded ${whileUnloaded}; ` +
        `after reload sculk ${reloaded.length}/${sculk.length}, crater air ${craterKept.length}/${r.carved.length}`
    );
    test.assert(sculk.length >= 8, `${sculk.length} cells turned to sculk around the crater, not ≥ 8`);
    test.assert(exposed.length === sculk.length, `${sculk.length - exposed.length} sculk cell(s) are not on an exposed surface`);
    test.assert(sculk.length === r.sculked.length, "sculk appeared where the job did not place it");
    test.assert(functional.length === 0, `functional sculk blocks appeared: ${functional.join(", ")}`);
    test.assert(unloadTicks >= 0 && whileUnloaded === "unloaded", `control: the site never unloaded (${unloadTicks}, ${whileUnloaded}) — the reload proves nothing`);
    test.assert(reloaded.length === sculk.length, `${sculk.length - reloaded.length} sculk cell(s) did not survive the chunk reload`);
    test.assert(craterKept.length === r.carved.length, "the crater did not survive the chunk reload");
  } finally {
    carves.stop();
    try {
      if (release === undefined) release = await loadBox(test, dim, "andrew_gt_skcv", box);
      fill(dim, add(impact, { x: -4, y: -5, z: -4 }), add(impact, { x: 4, y: 3, z: 4 }), AIR);
    } catch (err) {
      log(`sculk_reload cleanup threw ${errText(err)}`);
    }
    release?.();
    test.removeSimulatedPlayer(shooter);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ---------------------------------------------------------------- AC#4, ac22: the shared deny list, and hard blocks that do go

interface Fixture {
  u: number;
  v: number;
  k: number;
  type: string;
  stays: boolean;
}

/** On the inner 3×3, layers 0–1, every seed carves (R-sclk-003); the impact cell is (0,0,0). */
const FIXTURES: Fixture[] = [
  { u: 0, v: 0, k: 0, type: "minecraft:obsidian", stays: false },
  { u: 0, v: 0, k: 1, type: "minecraft:reinforced_deepslate", stays: false },
  { u: 1, v: -1, k: 0, type: "minecraft:ancient_debris", stays: false },
  { u: -1, v: 1, k: 0, type: "minecraft:crying_obsidian", stays: false },
  { u: -1, v: -1, k: 1, type: "minecraft:obsidian", stays: false },
  { u: 1, v: 0, k: 0, type: "minecraft:bedrock", stays: true },
  { u: 1, v: 0, k: 1, type: STONE, stays: false },
  { u: -1, v: 0, k: 0, type: "minecraft:barrier", stays: true },
  { u: 0, v: 1, k: 0, type: "minecraft:light_block_7", stays: true },
  { u: 0, v: -1, k: 0, type: "minecraft:end_portal_frame", stays: true },
  { u: 1, v: 1, k: 1, type: "minecraft:command_block", stays: true },
];

registerAsync("andrew", "sculk_carve_keep_list", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const shooter = test.spawnSimulatedPlayer(SHOOTER_AT, "sk_carve_keep", GameMode.Survival);
  const carves = watchCarves();
  const fixtureTop = test.worldBlockLocation({ x: -8, y: 6, z: 10 });
  const bedrockTop = test.worldBlockLocation({ x: 0, y: 6, z: 10 });
  const barrierTop = test.worldBlockLocation({ x: 8, y: 6, z: 10 });
  const tops = [fixtureTop, bedrockTop, barrierTop];
  try {
    await quiet(test);
    for (const t of tops) slab(dim, t);
    const cells = FIXTURES.map((f) => ({ ...f, at: cellAt(fixtureTop, "Up", f.u, f.v, f.k) }));
    for (const c of cells) dim.setBlockType(c.at, c.type);
    dim.setBlockType(bedrockTop, "minecraft:bedrock");
    dim.setBlockType(barrierTop, "minecraft:barrier");
    await test.idle(3);
    const placed = cells.map((c) => `${short(c.type)}=${short(typeAt(dim, c.at))}`);
    const misplaced = cells.filter((c) => typeAt(dim, c.at) !== c.type);
    const beforeBedrock = snapshot(dim, add(bedrockTop, { x: -3, y: -4, z: -3 }), add(bedrockTop, { x: 3, y: 0, z: 3 }));
    const beforeBarrier = snapshot(dim, add(barrierTop, { x: -3, y: -4, z: -3 }), add(barrierTop, { x: 3, y: 0, z: 3 }));
    const ids = tops.map((t) => fireAt(test, shooter, dim, t, "Up"));
    const [rf, rb, rr] = await waitReports(test, carves, ids);
    await test.idle(5);

    const results = cells.map((c) => ({ ...c, now: typeAt(dim, c.at) }));
    const wrong = results.filter((c) => (c.stays ? c.now !== c.type : c.now !== AIR));
    const bedrockDiff = changes(beforeBedrock, snapshot(dim, add(bedrockTop, { x: -3, y: -4, z: -3 }), add(bedrockTop, { x: 3, y: 0, z: 3 })));
    const barrierDiff = changes(beforeBarrier, snapshot(dim, add(barrierTop, { x: -3, y: -4, z: -3 }), add(barrierTop, { x: 3, y: 0, z: 3 })));
    const describe = (d: ReturnType<typeof changes>): string => {
      const by = new Map<string, number>();
      for (const x of d) by.set(`${short(x.from)}->${short(x.to)}`, (by.get(`${short(x.from)}->${short(x.to)}`) ?? 0) + 1);
      return [...by.entries()].map(([k, n]) => `${k}×${n}`).join(", ") || "none";
    };

    log(`keep_list RESULT fixtures placed [${placed.join(" ")}]; misplaced ${misplaced.length}`);
    log(
      `keep_list RESULT fixture crater seed ${rf.seed}: crater ${rf.carved.length} sculk ${rf.sculked.length}; ` +
        results.map((c) => `${short(c.type)}@${c.u},${c.v},${c.k} -> ${short(c.now)} (${c.stays ? "kept" : "carved"} expected)`).join("; ")
    );
    log(
      `keep_list RESULT bolt on bedrock: now ${short(typeAt(dim, bedrockTop))}, plan air ${rb.plan.air.length}, changes [${describe(bedrockDiff)}]; ` +
        `bolt on barrier: now ${short(typeAt(dim, barrierTop))}, plan air ${rr.plan.air.length}, changes [${describe(barrierDiff)}]`
    );
    test.assert(misplaced.length === 0, `fixtures not placed as asked: ${misplaced.map((c) => short(c.type)).join(", ")}`);
    test.assert(wrong.length === 0, `wrong fixture fate: ${wrong.map((c) => `${short(c.type)}@${c.u},${c.v},${c.k}=${short(c.now)}`).join("; ")}`);
    for (const [label, top, diff] of [["bedrock", bedrockTop, bedrockDiff], ["barrier", barrierTop, barrierDiff]] as Array<[string, Vector3, ReturnType<typeof changes>]>) {
      test.assert(typeAt(dim, top) === `minecraft:${label}`, `the ${label} the bolt hit is now ${typeAt(dim, top)}`);
      test.assert(diff.every((d) => d.to === SCULK), `a bolt on ${label} carved: ${describe(diff)}`);
    }
  } finally {
    carves.stop();
    for (const t of tops) slab(dim, t, AIR);
    test.removeSimulatedPlayer(shooter);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ---------------------------------------------------------------- AC#4: a legendary in the crater zone survives

function copiesOf(dim: Dimension, centre: Vector3, def: LegendaryDef, id: string): Array<{ entity: Entity; gen: number }> {
  return items(dim, centre, 64).flatMap((e) => {
    const stack = e.getComponent("minecraft:item")?.itemStack;
    const mark = stack !== undefined && state.isItemOf(def, stack) ? state.getMark(def, stack) : undefined;
    return mark?.id === id ? [{ entity: e, gen: mark.gen }] : [];
  });
}

function heldBy(players: readonly SimulatedPlayer[], def: LegendaryDef, id: string): number {
  let n = 0;
  for (const p of players) {
    const c = p.getComponent("minecraft:inventory")?.container;
    for (let slot = 0; c !== undefined && slot < c.size; slot++) {
      const s = c.getItem(slot);
      if (s !== undefined && state.isItemOf(def, s) && state.getMark(def, s)?.id === id) n++;
    }
  }
  return n;
}

registerAsync("andrew", "sculk_carve_legendary_survives", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const shooter = test.spawnSimulatedPlayer(SHOOTER_AT, "sk_carve_lgnd", GameMode.Survival);
  const carves = watchCarves();
  const impact = test.worldBlockLocation({ x: 0, y: 6, z: 10 });
  const chestAt = cellAt(impact, "Up", 0, 0, 1);
  const onGround = cellAt(impact, "Up", 1, 0, -1);
  const marks: Array<{ def: LegendaryDef; id: string; gen: number }> = [];
  try {
    await quiet(test);
    slab(dim, impact);
    dim.setBlockType(chestAt, "minecraft:chest");
    await test.idle(2);
    const swordMark = state.makeMark("craft", shooter);
    const sword = state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), swordMark);
    const chest = dim.getBlock(chestAt)?.getComponent("minecraft:inventory")?.container;
    test.assert(chest !== undefined, "the chest has no inventory");
    chest!.setItem(0, sword);
    const katanaMark = state.makeMark("craft", shooter);
    const katana = state.markItem(DRAGON_KATANA, new ItemStack(DRAGON_KATANA.itemId, 1), katanaMark);
    dim.spawnItem(katana, { x: onGround.x + 0.5, y: onGround.y + 0.05, z: onGround.z + 0.5 }).clearVelocity();
    marks.push({ def: WEB_SWORD, id: swordMark.id, gen: swordMark.gen }, { def: DRAGON_KATANA, id: katanaMark.id, gen: katanaMark.gen });
    await test.idle(10);
    const katanaBefore = copiesOf(dim, impact, DRAGON_KATANA, katanaMark.id);
    const katanaLay = katanaBefore.length === 1 ? katanaBefore[0].entity.location : undefined;

    const id = fireAt(test, shooter, dim, impact, "Up");
    const [r] = await waitReports(test, carves, [id]);
    await test.idle(40);

    const zone = r.zone;
    const inZone = (p: Vector3): boolean =>
      zone !== undefined &&
      Math.floor(p.x) >= zone.min.x && Math.floor(p.x) <= zone.max.x &&
      Math.floor(p.y) >= zone.min.y && Math.floor(p.y) <= zone.max.y &&
      Math.floor(p.z) >= zone.min.z && Math.floor(p.z) <= zone.max.z;
    const verdicts: string[] = [];
    const lines: string[] = [];
    for (const m of marks) {
      const ground = copiesOf(dim, impact, m.def, m.id);
      const held = heldBy([shooter], m.def, m.id);
      const ledger = state.ledgerGen(m.def, m.id);
      const owed = JSON.stringify(state.readOwed(m.def)).includes(m.id);
      const where = ground.map((g) => `${f2(g.entity.location.x)},${f2(g.entity.location.y)},${f2(g.entity.location.z)}@gen${g.gen}`).join(" ");
      const ok = ground.length + held === 1 && ground.every((g) => g.gen === m.gen && !inZone(g.entity.location)) && ledger === m.gen && !owed;
      lines.push(`${m.def.itemId} ${m.id}: on the ground [${where}], held ${held}, ledger gen ${ledger} (mark ${m.gen}), owed ${owed}`);
      verdicts.push(`${m.def.itemId}:${ok ? "ok" : "FAIL"}`);
    }
    log(
      `legendary RESULT bolt ${id} seed ${r.seed}: crater ${r.carved.length} sculk ${r.sculked.length}; zone ${zone === undefined ? "-" : `${key(zone.min)}..${key(zone.max)}`}; ` +
        `protect moved ${r.protect.moved} handed back ${r.protect.handedBack} errors [${r.protectErrors.join("; ")}]; chest cell now ${short(typeAt(dim, chestAt))}; ` +
        `katana lay at ${katanaLay === undefined ? "?" : `${f2(katanaLay.x)},${f2(katanaLay.y)},${f2(katanaLay.z)}`} in zone ${katanaLay !== undefined && inZone(katanaLay)}; ` +
        `${lines.join("; ")}; ${verdicts.join(" ")}`
    );
    test.assert(katanaLay !== undefined && inZone(katanaLay), "control: the Katana did not lie in the crater zone before the hit");
    test.assert(r.carved.some((c) => key(c) === key(chestAt)) && typeAt(dim, chestAt) === AIR, "the chest in the crater was not carved: the sword was never at risk");
    test.assert(r.protect.moved + r.protect.handedBack === 2, `protect moved ${r.protect.moved} + handed back ${r.protect.handedBack}, not 2`);
    test.assert(verdicts.every((v) => v.endsWith(":ok")), `a legendary did not survive as one live copy outside the zone: ${lines.join("; ")}`);
  } finally {
    carves.stop();
    for (const m of marks) {
      for (const g of copiesOf(dim, impact, m.def, m.id)) {
        forgetWatched(g.entity.id);
        g.entity.remove();
      }
      let owed = state.readOwed(m.def);
      for (const target of Object.keys(owed)) for (const e of owed[target] ?? []) if (e.mark.id === m.id) owed = withoutOwed(owed, target, e.mark);
      state.writeOwed(m.def, owed);
    }
    slab(dim, impact, AIR);
    test.removeSimulatedPlayer(shooter);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");
