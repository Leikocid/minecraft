// The LMB penetrator on a real engine (L0-pntr-ac01…ac07, ac09; PN-1…PN-5).
//
// Effect-level scenarios detonate through the registered LMB effect, the call
// the flight makes on contact; the ones about players (two owners, the owner
// standing by) fire through activate() and the flight. Every site is built
// away from the platform under a ticking area, so columns never meet.

import {
  BlockPermutation,
  BlockTypes,
  BlockVolume,
  type Container,
  Difficulty,
  Dimension,
  Direction,
  type Entity,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import * as cooldown from "../legendary/cooldown";
import { ORBITAL_CANNON, WEB_SWORD } from "../legendary/registry";
import * as state from "../legendary/state";
import { activate } from "../orbital/activation";
import { type Effect, effectFor, registerEffect } from "../orbital/charge";
import { KEEPERS, PENETRATOR_EFFECT, type PenetratorReport, WAVE_CAP, WAVE_TICKS, observePenetratorReports, penetratorJobs, specialTypes } from "../orbital/penetrator";
import { type ColumnPlan, isPlannedCell, layerOffsets, planColumn } from "../orbital/penetrator-plan";
import { PENETRATOR_KEEP } from "../orbital/penetrator-keep";
import { STUB_EFFECTS } from "../orbital/stub-effect";
import { arm, goTo } from "./orbital-core";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const KEY = ORBITAL_CANNON.abilityKey;
const FILL_CELLS = 32768;

const log = (msg: string): void => console.warn(`[gametest] pntr ${msg}`);
const probeLog = (msg: string): void => console.warn(`[gametest] [probe] pntr ${msg}`);
const fmt = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const fmt1 = (v: Vector3): string => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;
const LIQUIDS = new Set(["minecraft:water", "minecraft:flowing_water", "minecraft:lava", "minecraft:flowing_lava"]);

// ---------------------------------------------------------------- helpers

/** fillBlocks over any box, sliced under the engine's per-call cap. */
function fill(dim: Dimension, min: Vector3, max: Vector3, type: string): void {
  const area = (max.x - min.x + 1) * (max.z - min.z + 1);
  const slab = Math.max(1, Math.floor(FILL_CELLS / area));
  for (let y = min.y; y <= max.y; y += slab) {
    dim.fillBlocks(new BlockVolume({ x: min.x, y, z: min.z }, { x: max.x, y: Math.min(max.y, y + slab - 1), z: max.z }), type);
  }
}

/** A site `r` blocks around (cx,cz) kept loaded by ticking areas; resolves to their remover. */
function loadSite(test: Test, dim: Dimension, name: string, cx: number, cz: number, r: number): Promise<() => void> {
  return loadBox(test, dim, name, { min: [cx - r, 0, cz - r], max: [cx + r, 0, cz + r] });
}

let seq = 0;
function newAttackId(label: string): string {
  return `gt-pntr${label}-${system.currentTick}-${++seq}`;
}

/** What the flight does on contact: the LMB effect's onDetonate. */
function detonate(dim: Dimension, point: Vector3, attackId: string): void {
  const effect = effectFor("lmb");
  if (effect === undefined) throw new Error("no LMB effect registered");
  effect.onDetonate(dim, point, "gametest", "lmb", attackId);
}

function watchReports(): { of: (id: string) => PenetratorReport | undefined; stop: () => void } {
  const seen = new Map<string, PenetratorReport>();
  const stop = observePenetratorReports((r) => seen.set(r.attackId, { ...r, msByTick: [...r.msByTick] }));
  return { of: (id) => seen.get(id), stop };
}

async function untilReport(test: Test, reports: { of: (id: string) => PenetratorReport | undefined }, attackId: string, limit = 200): Promise<PenetratorReport> {
  for (let t = 0; t < limit; t++) {
    const r = reports.of(attackId);
    if (r !== undefined) return r;
    await test.idle(1);
  }
  throw new Error(`attack ${attackId}: no removal report ${limit} ticks later`);
}

function planCells(plan: ColumnPlan): Vector3[] {
  const out: Vector3[] = [];
  for (let y = plan.top; y >= plan.bottom; y--) for (const o of layerOffsets(plan, y)) out.push({ x: plan.cx + o.dx, y, z: plan.cz + o.dz });
  return out;
}

const typeAt = (dim: Dimension, at: Vector3): string => dim.getBlock(at)?.typeId ?? "unloaded";

function brief(r: PenetratorReport): string {
  return (
    `scanned ${r.scanned} removed ${r.removed} kept ${r.kept} keptProtectFailed ${r.keptProtectFailed} skippedUnloaded ${r.skippedUnloaded} ` +
    `containersCleared ${r.containersCleared} legendariesProtected ${r.legendariesProtected} air ${r.air} errors ${r.errors} ` +
    `ticksUsed ${r.ticksUsed} (budget ${r.budgetTicks}) firstTickLayers ${r.firstTickLayers} msByTick [${r.msByTick.join(",")}]`
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

/** What registerOrbitalCannon registered for LMB, captured before the other scenarios get the stub back. */
let cannonLmb: Effect | undefined;

export function parkPenetrator(): void {
  cannonLmb = effectFor("lmb");
  registerEffect("lmb", STUB_EFFECTS.lmb);
}

/** The penetrator as the LMB effect for one scenario; returns the restore. */
function useRealLmb(test: Test): () => void {
  test.assert(cannonLmb === PENETRATOR_EFFECT, "registerOrbitalCannon did not register the penetrator for LMB");
  const was = effectFor("lmb");
  registerEffect("lmb", PENETRATOR_EFFECT);
  return () => {
    if (was !== undefined) registerEffect("lmb", was);
  };
}

function box9(plan: ColumnPlan): { location: Vector3; volume: Vector3 } {
  return { location: { x: plan.cx - 4, y: plan.bottom, z: plan.cz - 4 }, volume: { x: 8, y: plan.top - plan.bottom + 2, z: 8 } };
}

function dropsIn(dim: Dimension, plan: ColumnPlan): Entity[] {
  return [...dim.getEntities({ type: "minecraft:item", ...box9(plan) }), ...dim.getEntities({ type: "minecraft:xp_orb", ...box9(plan) })];
}

// ---------------------------------------------------------------- engine facts the README cites

registerAsync("andrew", "probe_pntr_holders", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const x0 = origin.x + 40;
  const z0 = origin.z + 40;
  const unload = await loadSite(test, dim, "andrew_gt_pntr_h", x0, z0, 6);
  try {
    const y = -50;
    const facing = BlockPermutation.resolve("minecraft:chest", { "minecraft:cardinal_direction": "north" });
    dim.setBlockPermutation({ x: x0, y, z: z0 }, facing);
    dim.setBlockPermutation({ x: x0 + 1, y, z: z0 }, facing);
    const places: Array<[string, Vector3]> = [
      ["minecraft:decorated_pot", { x: x0, y, z: z0 + 2 }],
      ["minecraft:oak_shelf", { x: x0 + 2, y, z: z0 + 2 }],
      ["minecraft:crafter", { x: x0 + 4, y, z: z0 + 2 }],
      ["minecraft:barrel", { x: x0 + 4, y, z: z0 }],
    ];
    for (const [id, at] of places) {
      if (BlockTypes.get(id) !== undefined) dim.setBlockType(at, id);
    }
    await test.idle(2);
    const size = (at: Vector3): string => {
      const b = dim.getBlock(at);
      const inv = b?.getComponent("minecraft:inventory");
      return `${b?.typeId ?? "unloaded"}: ${inv === undefined ? "no inventory component" : `container size ${inv.container?.size ?? "undefined"}`}`;
    };
    probeLog(`holders RESULT chest pair placed side by side: ${size({ x: x0, y, z: z0 })} | ${size({ x: x0 + 1, y, z: z0 })}`);
    for (const [id, at] of places) probeLog(`holders RESULT ${BlockTypes.get(id) === undefined ? `${id}: unknown to this engine` : size(at)}`);
    const unknown = [...PENETRATOR_KEEP].filter((id) => BlockTypes.get(id) === undefined);
    const lights = ["minecraft:light_block", "minecraft:light_block_0", "minecraft:light_block_15"].map((id) => `${id}=${BlockTypes.get(id) === undefined ? "unknown" : "known"}`);
    probeLog(`keep RESULT PENETRATOR_KEEP ids unknown to the engine: [${unknown.join(",")}]; ${lights.join(" ")}`);
    const placedAs = ["minecraft:light_block", "minecraft:light_block_7"].map((id, i) => {
      const at = { x: x0 + i, y: y + 2, z: z0 + 4 };
      dim.setBlockType(at, id);
      const read = typeAt(dim, at);
      dim.setBlockType(at, "minecraft:air");
      return `${id} placed reads back as ${read} (${PENETRATOR_KEEP.has(read) ? "kept" : "NOT in the keep set"})`;
    });
    probeLog(`keep RESULT ${placedAs.join("; ")}`);
    fill(dim, { x: x0, y, z: z0 }, { x: x0 + 4, y, z: z0 + 2 }, "minecraft:air");
    test.succeed();
  } finally {
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ---------------------------------------------------------------- AC#1 — L0-pntr-ac01

registerAsync("andrew", "pntr_column_overworld", async (test: Test): Promise<void> => {
  const restoreLmb = useRealLmb(test);
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const cx = origin.x + 64;
  const cz = origin.z;
  const top = 80;
  const min = dim.heightRange.min;
  const reports = watchReports();
  const unload = await loadSite(test, dim, "andrew_gt_pntr_1", cx, cz, 6);
  try {
    fill(dim, { x: cx - 4, y: min, z: cz - 4 }, { x: cx + 4, y: min, z: cz + 4 }, "minecraft:bedrock");
    fill(dim, { x: cx - 4, y: min + 1, z: cz - 4 }, { x: cx + 4, y: top, z: cz + 4 }, "minecraft:stone");
    fill(dim, { x: cx - 4, y: top + 1, z: cz - 4 }, { x: cx + 4, y: top + 3, z: cz + 4 }, "minecraft:air");
    fill(dim, { x: cx - 1, y: 40, z: cz - 1 }, { x: cx + 1, y: 40, z: cz + 1 }, "minecraft:water");
    dim.setBlockType({ x: cx, y: 20, z: cz }, "minecraft:bedrock");
    await test.idle(2);
    const expected = (x: number, y: number, z: number): string => {
      if (y === min) return "minecraft:bedrock";
      if (y > top) return "minecraft:air";
      if (y === 40 && Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) return "minecraft:water";
      if (y === 20 && x === cx && z === cz) return "minecraft:bedrock";
      return "minecraft:stone";
    };

    const attackId = newAttackId("1");
    const point = { x: cx, y: top, z: cz };
    detonate(dim, point, attackId);
    const r = await untilReport(test, reports, attackId);
    const plan = planColumn(attackId, point, dim.heightRange);

    const wrong: string[] = [];
    let liquidInShaft = 0;
    for (let x = cx - 4; x <= cx + 4; x++) {
      for (let z = cz - 4; z <= cz + 4; z++) {
        for (let y = min; y <= top + 1; y++) {
          const was = expected(x, y, z);
          const now = typeAt(dim, { x, y, z });
          if (!isPlannedCell(plan, x, y, z)) {
            if (now !== was) wrong.push(`outside ${x},${y},${z}: ${was} -> ${now}`);
          } else if (was === "minecraft:stone") {
            if (LIQUIDS.has(now) && y <= 40) liquidInShaft++;
            else if (now !== "minecraft:air") wrong.push(`planned ${x},${y},${z}: ${was} -> ${now}`);
          } else if (was === "minecraft:water") {
            if (now !== "minecraft:water" && now !== "minecraft:flowing_water") wrong.push(`pocket ${x},${y},${z}: water -> ${now}`);
          } else if (now !== was) {
            wrong.push(`kept ${x},${y},${z}: ${was} -> ${now}`);
          }
        }
      }
    }
    const under = typeAt(dim, { x: cx, y: 19, z: cz });
    log(
      `ac1 RESULT column ${cx},${cz} from ${top} to ${min}, attack ${attackId}: ${brief(r)}; bedrock at y=20 ${typeAt(dim, { x: cx, y: 20, z: cz })}, ` +
        `y=19 ${under}, bottom ${typeAt(dim, { x: cx, y: min, z: cz })}; pocket ${[-1, 0, 1].map((d) => typeAt(dim, { x: cx + d, y: 40, z: cz })).join(",")}; ` +
        `planned stone cells holding liquid that flowed in: ${liquidInShaft}; wrong cells ${wrong.length}: ${wrong.slice(0, 8).join(" | ")}`
    );
    test.assert(wrong.length === 0, `${wrong.length} cell(s) wrong, first: ${wrong.slice(0, 4).join(" | ")}`);
    test.assert(typeAt(dim, { x: cx, y: 20, z: cz }) === "minecraft:bedrock", "the placed bedrock at y=20 is gone");
    test.assert(under === "minecraft:air", `the stone under the placed bedrock is ${under}: the column stopped`);
    test.assert(r.errors === 0 && r.skippedUnloaded === 0 && r.keptProtectFailed === 0, `report ${brief(r)}`);
    test.assert(r.kept >= 10, `only ${r.kept} kept cells: the pocket (9) and the placed bedrock were not kept`);

    // AS-pntr-07: the pocket's water reacts to the removal and runs down the shaft.
    await test.idle(60);
    const wet = planCells(plan).filter((c) => c.y < 40 && LIQUIDS.has(typeAt(dim, c))).length;
    log(`ac1 RESULT 60 ticks later, planned cells below the pocket holding water: ${wet}`);
    test.assert(wet > 0, "the pocket's water did not flow into the shaft");
    test.succeed();
  } finally {
    restoreLmb();
    reports.stop();
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ---------------------------------------------------------------- AC#2 — L0-pntr-ac02

/** Loads a site, runs `body` there and releases it: one ticking area at a time (the world holds ten). */
async function atSite<T>(test: Test, dim: Dimension, name: string, cx: number, cz: number, body: () => Promise<T>): Promise<T> {
  const unload = await loadSite(test, dim, name, cx, cz, 6);
  try {
    return await body();
  } finally {
    unload();
    await test.idle(2);
  }
}

registerAsync("andrew", "pntr_nether_end_waterlogged", async (test: Test): Promise<void> => {
  const restoreLmb = useRealLmb(test);
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const overworld = test.getDimension();
  const nether = world.getDimension("nether");
  const end = world.getDimension("the_end");
  const reports = watchReports();
  try {
    // (a) Nether: netherrack 1..100 over the floor bedrock, a lava cell at 50.
    const nx = origin.x + 64;
    const nz = origin.z + 64;
    await atSite(test, nether, "andrew_gt_pntr_2n", nx, nz, async () => {
      fill(nether, { x: nx - 4, y: 0, z: nz - 4 }, { x: nx + 4, y: 0, z: nz + 4 }, "minecraft:bedrock");
      fill(nether, { x: nx - 4, y: 1, z: nz - 4 }, { x: nx + 4, y: 100, z: nz + 4 }, "minecraft:netherrack");
      fill(nether, { x: nx - 4, y: 101, z: nz - 4 }, { x: nx + 4, y: 104, z: nz + 4 }, "minecraft:air");
      nether.setBlockType({ x: nx, y: 50, z: nz }, "minecraft:lava");
      const id = newAttackId("2n");
      detonate(nether, { x: nx, y: 100, z: nz }, id);
      const rn = await untilReport(test, reports, id);
      const pn = planColumn(id, { x: nx, y: 100, z: nz }, nether.heightRange);
      const leftN = planCells(pn).filter((c) => typeAt(nether, c) === "minecraft:netherrack");
      const lava = typeAt(nether, { x: nx, y: 50, z: nz });
      const floorN = typeAt(nether, { x: nx, y: 0, z: nz });
      const lowest = typeAt(nether, { x: nx, y: 1, z: nz });
      log(`ac2 RESULT Nether ${nx},${nz} 100→${pn.bottom}: ${brief(rn)}; netherrack left in the plan ${leftN.length}; lava cell ${lava}; y=0 ${floorN}; y=1 ${lowest}`);
      test.assert(pn.bottom === 0 && rn.bottom === 0, `the Nether column's bottom is ${rn.bottom}`);
      test.assert(leftN.length === 0, `${leftN.length} netherrack cell(s) left in the plan: ${leftN.slice(0, 4).map(fmt).join(" ")}`);
      test.assert(lava === "minecraft:lava" || lava === "minecraft:flowing_lava", `the lava cell is ${lava}`);
      test.assert(floorN === "minecraft:bedrock", `the Nether floor is ${floorN}`);
      test.assert(lowest === "minecraft:air" || LIQUIDS.has(lowest), `y=1 under the column is ${lowest}: the column did not reach y=0`);
      test.assert(rn.errors === 0, "the Nether column reported errors");
    });

    // (b) End: end stone 40..60 with a portal frame, a barrier and a light block in the column.
    const ex = origin.x + 540;
    const ez = origin.z + 40;
    await atSite(test, end, "andrew_gt_pntr_2e", ex, ez, async () => {
      fill(end, { x: ex - 4, y: 40, z: ez - 4 }, { x: ex + 4, y: 60, z: ez + 4 }, "minecraft:end_stone");
      fill(end, { x: ex - 4, y: 61, z: ez - 4 }, { x: ex + 4, y: 64, z: ez + 4 }, "minecraft:air");
      end.setBlockType({ x: ex, y: 55, z: ez }, "minecraft:end_portal_frame");
      end.setBlockType({ x: ex, y: 50, z: ez }, "minecraft:barrier");
      end.setBlockType({ x: ex, y: 45, z: ez }, "minecraft:light_block_7");
      const id = newAttackId("2e");
      detonate(end, { x: ex, y: 60, z: ez }, id);
      const re = await untilReport(test, reports, id);
      const pe = planColumn(id, { x: ex, y: 60, z: ez }, end.heightRange);
      const leftE = planCells(pe).filter((c) => typeAt(end, c) === "minecraft:end_stone");
      const frame = typeAt(end, { x: ex, y: 55, z: ez });
      const barrier = typeAt(end, { x: ex, y: 50, z: ez });
      const belowFrame = typeAt(end, { x: ex, y: 54, z: ez });
      const belowBarrier = typeAt(end, { x: ex, y: 49, z: ez });
      const light = typeAt(end, { x: ex, y: 45, z: ez });
      const belowLight = typeAt(end, { x: ex, y: 44, z: ez });
      log(
        `ac2 RESULT End ${ex},${ez} 60→${pe.bottom}: ${brief(re)}; end stone left in the plan ${leftE.length}; frame ${frame}, under it ${belowFrame}; ` +
          `barrier ${barrier}, under it ${belowBarrier}; light block ${light}, under it ${belowLight}`
      );
      test.assert(frame === "minecraft:end_portal_frame" && barrier === "minecraft:barrier", `frame ${frame}, barrier ${barrier}`);
      test.assert(belowFrame === "minecraft:air" && belowBarrier === "minecraft:air", `under the frame ${belowFrame}, under the barrier ${belowBarrier}`);
      test.assert(light === "minecraft:light_block_7" && belowLight === "minecraft:air", `light block ${light}, under it ${belowLight}`);
      test.assert(leftE.length === 0 && re.errors === 0, `${leftE.length} end stone cell(s) left in the plan, ${re.errors} error(s)`);
    });

    // (c) Overworld: a waterlogged oak fence in stone.
    const ox = origin.x + 64;
    const oz = origin.z + 32;
    await atSite(test, overworld, "andrew_gt_pntr_2o", ox, oz, async () => {
      fill(overworld, { x: ox - 4, y: 50, z: oz - 4 }, { x: ox + 4, y: 70, z: oz + 4 }, "minecraft:stone");
      overworld.setBlockType({ x: ox, y: 65, z: oz }, "minecraft:oak_fence");
      overworld.getBlock({ x: ox, y: 65, z: oz })?.setWaterlogged(true);
      await test.idle(2);
      const fence = overworld.getBlock({ x: ox, y: 65, z: oz });
      test.assert(fence?.typeId === "minecraft:oak_fence" && fence.isWaterlogged, `setup: the fence is ${fence?.typeId} waterlogged ${String(fence?.isWaterlogged)}`);
      const id = newAttackId("2o");
      detonate(overworld, { x: ox, y: 70, z: oz }, id);
      const ro = await untilReport(test, reports, id);
      const wet = typeAt(overworld, { x: ox, y: 65, z: oz });
      log(`ac2 RESULT Overworld waterlogged fence ${ox},65,${oz} -> ${wet}; ${brief(ro)}`);
      test.assert(wet === "minecraft:water", `the waterlogged fence cell is ${wet}, not minecraft:water`);
      test.assert(ro.errors === 0, "the Overworld column reported errors");
    });
    test.succeed();
  } finally {
    restoreLmb();
    reports.stop();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ---------------------------------------------------------------- AC#3 — L0-pntr-ac03, as02

function stock(container: Container | undefined, items: Array<[string, number]>): void {
  if (container === undefined) throw new Error("no container to stock");
  items.forEach(([id, n], slot) => container.setItem(slot, new ItemStack(id, n)));
}

registerAsync("andrew", "pntr_hard_blocks_no_drops", async (test: Test): Promise<void> => {
  const restoreLmb = useRealLmb(test);
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const cx = origin.x + 96;
  const cz = origin.z;
  const top = 80;
  const reports = watchReports();
  const unload = await loadSite(test, dim, "andrew_gt_pntr_3", cx, cz, 6);
  try {
    const attackId = newAttackId("3");
    const point = { x: cx, y: top, z: cz };
    const plan = planColumn(attackId, point, dim.heightRange);
    fill(dim, { x: cx - 4, y: 40, z: cz - 4 }, { x: cx + 4, y: top, z: cz + 4 }, "minecraft:stone");
    fill(dim, { x: cx - 4, y: top + 1, z: cz - 4 }, { x: cx + 4, y: top + 3, z: cz + 4 }, "minecraft:air");

    const fixtures: Array<{ name: string; at: Vector3 }> = [];
    const put = (name: string, at: Vector3, type: string | BlockPermutation): void => {
      if (typeof type === "string") dim.setBlockType(at, type);
      else dim.setBlockPermutation(at, type);
      fixtures.push({ name, at });
    };
    put("obsidian", { x: cx - 1, y: 78, z: cz }, "minecraft:obsidian");
    put("crying obsidian", { x: cx + 1, y: 78, z: cz }, "minecraft:crying_obsidian");
    // A Nether portal frame x cx-1..cx+2, y 70..74; it is lit just before the shot.
    fill(dim, { x: cx - 1, y: 70, z: cz }, { x: cx + 2, y: 74, z: cz }, "minecraft:obsidian");
    fill(dim, { x: cx, y: 71, z: cz }, { x: cx + 1, y: 73, z: cz }, "minecraft:air");
    for (let x = cx; x <= cx + 1; x++) for (let y = 71; y <= 73; y++) fixtures.push({ name: "portal", at: { x, y, z: cz } });
    for (const at of [{ x: cx - 1, y: 72, z: cz }, { x: cx + 2, y: 72, z: cz }, { x: cx, y: 70, z: cz }, { x: cx, y: 74, z: cz }]) fixtures.push({ name: "portal frame", at });
    put("chest", { x: cx, y: 66, z: cz }, "minecraft:chest");
    stock(dim.getBlock({ x: cx, y: 66, z: cz })?.getComponent("minecraft:inventory")?.container, Array.from({ length: 27 }, () => ["minecraft:cobblestone", 64] as [string, number]));
    put("barrel", { x: cx - 1, y: 64, z: cz }, "minecraft:barrel");
    stock(dim.getBlock({ x: cx - 1, y: 64, z: cz })?.getComponent("minecraft:inventory")?.container, [["minecraft:dirt", 64], ["minecraft:iron_ingot", 10]]);
    put("shulker box", { x: cx + 1, y: 64, z: cz }, "minecraft:undyed_shulker_box");
    stock(dim.getBlock({ x: cx + 1, y: 64, z: cz })?.getComponent("minecraft:inventory")?.container, [["minecraft:diamond", 5], ["minecraft:oak_log", 32]]);
    put("furnace", { x: cx, y: 62, z: cz }, "minecraft:furnace");
    stock(dim.getBlock({ x: cx, y: 62, z: cz })?.getComponent("minecraft:inventory")?.container, [["minecraft:raw_iron", 2], ["minecraft:coal", 4]]);
    put("spawner", { x: cx, y: 60, z: cz }, "minecraft:mob_spawner");
    put("reinforced deepslate", { x: cx + 1, y: 60, z: cz }, "minecraft:reinforced_deepslate");

    // A double chest across the plan's edge: one half planned, the other not.
    let pair: { inside: Vector3; outside: Vector3 } | undefined;
    for (let y = 58; y >= 44 && pair === undefined; y--) {
      if (isPlannedCell(plan, cx + 2, y, cz) && !isPlannedCell(plan, cx + 3, y, cz)) pair = { inside: { x: cx + 2, y, z: cz }, outside: { x: cx + 3, y, z: cz } };
    }
    let pairSize = 0;
    const chest = BlockPermutation.resolve("minecraft:chest", { "minecraft:cardinal_direction": "north" });
    const fillPair = (at: Vector3, item: string): number => {
      const c = dim.getBlock(at)?.getComponent("minecraft:inventory")?.container;
      if (c !== undefined) for (let slot = 0; slot < c.size; slot++) c.setItem(slot, new ItemStack(item, 1 + (slot % 60)));
      return c?.size ?? 0;
    };
    if (pair !== undefined) {
      dim.setBlockPermutation(pair.inside, chest);
      dim.setBlockPermutation(pair.outside, chest);
      await test.idle(1);
      pairSize = fillPair(pair.inside, "minecraft:gold_ingot");
    }
    // A double chest wholly in the 3×3 core: both halves go, with everything in them.
    put("double chest half", { x: cx - 1, y: 57, z: cz }, chest);
    put("double chest half", { x: cx, y: 57, z: cz }, chest);
    await test.idle(1);
    const innerPairSize = fillPair({ x: cx, y: 57, z: cz }, "minecraft:emerald");

    // The furnace smelts for real, so it holds output and stored XP.
    let output = "";
    for (let t = 0; t < 260 && output === ""; t++) {
      await test.idle(1);
      const out = dim.getBlock({ x: cx, y: 62, z: cz })?.getComponent("minecraft:inventory")?.container?.getItem(2);
      if (out !== undefined) output = `${out.typeId} x${out.amount}`;
    }
    test.assert(output !== "", "setup: the furnace produced nothing in 260 ticks");
    dim.setBlockType({ x: cx, y: 71, z: cz }, "minecraft:fire");
    await test.idle(3);
    let lit = "fire";
    if (typeAt(dim, { x: cx, y: 72, z: cz }) !== "minecraft:portal") {
      lit = "portal permutation";
      const portal = BlockPermutation.resolve("minecraft:portal", { portal_axis: "x" });
      for (let x = cx; x <= cx + 1; x++) for (let y = 71; y <= 73; y++) dim.setBlockPermutation({ x, y, z: cz }, portal);
      await test.idle(1);
    }
    const portalCells = [cx, cx + 1].flatMap((x) => [71, 72, 73].map((y) => typeAt(dim, { x, y, z: cz })));
    log(`ac3 setup: portal lit by ${lit}: [${portalCells.join(",")}]`);
    test.assert(portalCells.every((id) => id === "minecraft:portal"), `setup: the portal is [${portalCells.join(",")}]`);
    const before = new Set(dropsIn(dim, plan).map((e) => e.id));

    detonate(dim, point, attackId);
    const r = await untilReport(test, reports, attackId);
    await test.idle(20);
    const fresh = dropsIn(dim, plan).filter((e) => !before.has(e.id));
    const standing = fixtures.filter((f) => isPlannedCell(plan, f.at.x, f.at.y, f.at.z) && typeAt(dim, f.at) !== "minecraft:air");
    const outside = fixtures.filter((f) => !isPlannedCell(plan, f.at.x, f.at.y, f.at.z)).map((f) => `${f.name}@${fmt(f.at)}=${typeAt(dim, f.at)}`);
    let pairText = `pair wholly inside: container size ${innerPairSize}; `;
    let pairOk = innerPairSize === 54;
    if (pair === undefined) pairText += "no layer puts a chest pair across the edge";
    else {
      const rest = dim.getBlock(pair.outside)?.getComponent("minecraft:inventory")?.container;
      let stacks = 0;
      for (let slot = 0; rest !== undefined && slot < rest.size; slot++) if (rest.getItem(slot) !== undefined) stacks++;
      const inner = typeAt(dim, pair.inside);
      pairText += `pair across the edge at y=${pair.inside.y}, container size ${pairSize}; inside half ${inner}, outside half ${typeAt(dim, pair.outside)}, the pair still holds ${stacks} stacks`;
      pairOk = pairOk && pairSize === 54 && inner === "minecraft:chest" && typeAt(dim, pair.outside) === "minecraft:chest" && stacks === 54;
    }
    log(
      `ac3 RESULT column ${cx},${cz}, attack ${attackId}: ${brief(r)}; furnace output before ${output}; ` +
        `planned fixtures still standing ${standing.length}: ${standing.map((f) => `${f.name}@${fmt(f.at)}=${typeAt(dim, f.at)}`).join(" ")}; ` +
        `fixtures outside the plan: ${outside.join(" ")}; new item/xp entities in the 9×9 box after the job + 20 ticks: ${fresh.length} ` +
        `[${fresh.map((e) => `${e.typeId}${e.typeId === "minecraft:item" ? `:${e.getComponent("minecraft:item")?.itemStack.typeId}` : ""}@${fmt1(e.location)}`).join(" ")}]; ${pairText}`
    );
    test.assert(standing.length === 0, `${standing.length} planned fixture(s) still standing: ${standing.map((f) => f.name).join(", ")}`);
    test.assert(fresh.length === 0, `${fresh.length} new item/xp_orb entities around the column`);
    test.assert(r.containersCleared >= 5, `only ${r.containersCleared} containers cleared`);
    test.assert(pairOk, `double chest: ${pairText}`);
    test.succeed();
  } finally {
    restoreLmb();
    reports.stop();
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ---------------------------------------------------------------- AC#4 — L0-pntr-ac04, r005, r007 (restart: two tests)

const LGND_DP = "andrew:gt_pntr_legendary";
const LGND_AREA = "andrew_gt_pntr_4r";

interface LegendaryRecord {
  id: string;
  gen: number;
  site: Vector3;
  at: Vector3;
}

function swordCopies(dim: Dimension, center: Vector3, id: string): Array<{ entity: Entity; gen: number }> {
  return dim
    .getEntities({ type: "minecraft:item", location: center, maxDistance: 64 })
    .flatMap((e) => {
      const stack = e.getComponent("minecraft:item")?.itemStack;
      const mark = stack !== undefined && state.isItemOf(WEB_SWORD, stack) ? state.getMark(WEB_SWORD, stack) : undefined;
      return mark?.id === id ? [{ entity: e, gen: mark.gen }] : [];
    });
}

function swordsIn(player: Player, id: string): number {
  const c = player.getComponent("minecraft:inventory")?.container;
  let n = 0;
  for (let slot = 0; c !== undefined && slot < c.size; slot++) {
    const s = c.getItem(slot);
    if (s !== undefined && state.isItemOf(WEB_SWORD, s) && state.getMark(WEB_SWORD, s)?.id === id) n++;
  }
  return n;
}

registerAsync("andrew", "pntr_legendary_two_columns", async (test: Test): Promise<void> => {
  const restoreLmb = useRealLmb(test);
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const ax = origin.x + 128;
  const az = origin.z;
  const bx = ax + 4;
  const top = 80;
  const reports = watchReports();
  const a = test.spawnSimulatedPlayer(STAND, "pntr_lgnd_a", GameMode.Survival);
  const b = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 5 }, "pntr_lgnd_b", GameMode.Survival);
  const unload = await loadSite(test, dim, "andrew_gt_pntr_4", ax + 2, az, 30);
  try {
    fill(dim, { x: ax - 8, y: 40, z: az - 8 }, { x: bx + 8, y: top, z: az + 8 }, "minecraft:stone");
    fill(dim, { x: ax - 8, y: top + 1, z: az - 8 }, { x: bx + 8, y: top + 40, z: az + 8 }, "minecraft:air");
    const chestX = { x: ax - 1, y: 70, z: az };
    const chestY = { x: bx + 1, y: 70, z: az };
    dim.setBlockType(chestX, "minecraft:chest");
    dim.setBlockType(chestY, "minecraft:chest");
    await test.idle(4);
    arm(a);
    arm(b);
    cooldown.clearCooldown(a, KEY);
    cooldown.clearCooldown(b, KEY);
    const mark = state.makeMark("craft", b);
    const sword = state.markItem(WEB_SWORD, new ItemStack(WEB_SWORD.itemId, 1), mark);
    stock(dim.getBlock(chestX)?.getComponent("minecraft:inventory")?.container, [["minecraft:cobblestone", 64], ["minecraft:bread", 12]]);
    dim.getBlock(chestX)?.getComponent("minecraft:inventory")?.container?.setItem(5, sword);
    stock(dim.getBlock(chestY)?.getComponent("minecraft:inventory")?.container, [["minecraft:dirt", 64], ["minecraft:apple", 3]]);
    await goTo(test, a, dim, { x: ax, y: top + 1, z: az + 6 });
    await goTo(test, b, dim, { x: bx, y: top + 1, z: az + 6 });
    await test.idle(2);

    const site = { x: ax + 2, y: top, z: az };
    const tick = system.currentTick;
    const attackA = activate(a, "lmb", dim.getBlock({ x: ax, y: top, z: az }), Direction.Up);
    const attackB = activate(b, "lmb", dim.getBlock({ x: bx, y: top, z: az }), Direction.Up);
    test.assert(attackA !== undefined && attackB !== undefined && system.currentTick === tick, "the two shots did not both fire in one tick");
    if (attackA === undefined || attackB === undefined) return;
    const ra = await untilReport(test, reports, attackA.attackId);
    const rb = await untilReport(test, reports, attackB.attackId);
    await test.idle(40);

    const pa = planColumn(attackA.attackId, { x: ax, y: top, z: az }, dim.heightRange);
    const pb = planColumn(attackB.attackId, { x: bx, y: top, z: az }, dim.heightRange);
    const ground = swordCopies(dim, site, mark.id);
    const held = swordsIn(a, mark.id) + swordsIn(b, mark.id);
    const ledger = state.ledgerGen(WEB_SWORD, mark.id);
    const owed = JSON.stringify(state.readOwed(WEB_SWORD));
    const where = ground.map((g) => `${fmt1(g.entity.location)}@gen${g.gen}`).join(" ");
    const inAPlan = (v: Vector3): boolean => isPlannedCell(pa, Math.floor(v.x), Math.floor(v.y), Math.floor(v.z));
    const inBPlan = (v: Vector3): boolean => isPlannedCell(pb, Math.floor(v.x), Math.floor(v.y), Math.floor(v.z));
    const inFootprints = (v: Vector3): boolean => [ax, bx].some((c) => Math.abs(Math.floor(v.x) - c) <= 3) && Math.abs(Math.floor(v.z) - az) <= 3;
    const ordinary = [...dropsIn(dim, pa), ...dropsIn(dim, pb)].filter((e) => {
      const s = e.getComponent("minecraft:item")?.itemStack;
      return s === undefined || !state.isItemOf(WEB_SWORD, s);
    });
    log(
      `ac4 RESULT detonations ${ra.startedTick}/${rb.startedTick}; A ${brief(ra)}; B ${brief(rb)}; ws_id ${mark.id}: on the ground [${where}], in inventories ${held}, ` +
        `ledger gen ${ledger}; owed ${owed.includes(mark.id) ? "LISTS IT" : "clear"}; chests ${typeAt(dim, chestX)}/${typeAt(dim, chestY)}; ordinary drops near the columns ${ordinary.length}`
    );
    test.assert(ra.startedTick === rb.startedTick, `the columns detonated in ticks ${ra.startedTick} and ${rb.startedTick}, not one`);
    test.assert(ground.length + held === 1, `ws_id ${mark.id} exists ${ground.length + held} times`);
    test.assert(ground.length === 1 && ground[0].gen === mark.gen && ledger === mark.gen, `the copy is not one on the ground at gen ${mark.gen}: [${where}], ledger ${ledger}`);
    const at = ground[0].entity.location;
    test.assert(!inAPlan(at) && !inBPlan(at) && !inFootprints(at), `the sword lies at ${fmt1(at)}, inside a column`);
    test.assert(!owed.includes(mark.id), "the sword is listed as owed: a second copy would be issued");
    test.assert(typeAt(dim, chestX) === "minecraft:air" && typeAt(dim, chestY) === "minecraft:air", "a chest is still standing");
    test.assert(ordinary.length === 0, `${ordinary.length} ordinary item(s) survived as drops`);
    test.assert(ra.legendariesProtected + rb.legendariesProtected === 1, `legendariesProtected ${ra.legendariesProtected}+${rb.legendariesProtected}`);

    const added = dim.runCommand(`tickingarea add ${site.x - 32} 0 ${site.z - 32} ${site.x + 32} 0 ${site.z + 32} ${LGND_AREA}`).successCount;
    test.assert(added > 0, "tickingarea add refused: the site would not load after the restart");
    const rec: LegendaryRecord = { id: mark.id, gen: mark.gen, site, at: { x: at.x, y: at.y, z: at.z } };
    world.setDynamicProperty(LGND_DP, JSON.stringify(rec));
    test.succeed();
  } finally {
    restoreLmb();
    reports.stop();
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

registerAsync("andrew", "pntr_legendary_restart_check", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  try {
    const raw = world.getDynamicProperty(LGND_DP);
    test.assert(typeof raw === "string", "no record from pntr_legendary_two_columns: it did not run in this world before the restart");
    const rec = JSON.parse(raw as string) as LegendaryRecord;
    for (let t = 0; t < 300 && !dim.isChunkLoaded(rec.site); t++) await test.idle(1);
    test.assert(dim.isChunkLoaded(rec.site), "the site did not load after the restart");
    // Three recovery checks (40 ticks each): a misread loss would have issued its copy by now.
    await test.idle(140);
    const ground = swordCopies(dim, rec.site, rec.id);
    const ledger = state.ledgerGen(WEB_SWORD, rec.id);
    const owed = JSON.stringify(state.readOwed(WEB_SWORD));
    const players = world.getAllPlayers().filter((p) => p?.isValid === true);
    const held = players.reduce((n, p) => n + swordsIn(p, rec.id), 0);
    log(
      `ac4 RESULT after the restart: ws_id ${rec.id} on the ground [${ground.map((g) => `${fmt1(g.entity.location)}@gen${g.gen}`).join(" ")}] ` +
        `(before the stop ${fmt1(rec.at)}@gen${rec.gen}); held by ${players.length} online player(s): ${held}; ledger gen ${ledger}; owed ${owed.includes(rec.id) ? "LISTS IT" : "clear"}`
    );
    test.assert(ground.length + held === 1, `ws_id ${rec.id} exists ${ground.length + held} times after the restart`);
    test.assert(ground.length === 1 && ground[0].gen === rec.gen && ledger === rec.gen, "the copy after the restart is not the same generation");
    test.assert(!owed.includes(rec.id), "the sword is listed as owed after the restart: a second copy would be issued");
    test.succeed();
  } finally {
    try {
      dim.runCommand(`tickingarea remove ${LGND_AREA}`);
    } catch (err) {
      log(`tickingarea remove ${LGND_AREA} threw ${String(err)}`);
    }
    world.setDynamicProperty(LGND_DP, undefined);
  }
})
  .structureName(STRUCTURE)
  .maxTicks(700)
  .tag("andrew");

// ---------------------------------------------------------------- AC#6 — L0-pntr-ac05, r006

registerAsync("andrew", "pntr_no_direct_damage", async (test: Test): Promise<void> => {
  const restoreLmb = useRealLmb(test);
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const cx = origin.x + 160;
  const cz = origin.z;
  const top = 80;
  const difficulty = world.getDifficulty();
  const reports = watchReports();
  const owner = test.spawnSimulatedPlayer(STAND, "pntr_dmg_owner", GameMode.Survival);
  const victim: SimulatedPlayer = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 5 }, "pntr_dmg_b", GameMode.Survival);
  const hurts: Array<{ id: string; type: string; cause: string; damage: number; tick: number }> = [];
  const sub = world.afterEvents.entityHurt.subscribe((e) => {
    hurts.push({ id: e.hurtEntity.id, type: e.hurtEntity.typeId, cause: e.damageSource.cause, damage: e.damage, tick: system.currentTick });
  });
  const extras: Entity[] = [];
  const unload = await loadSite(test, dim, "andrew_gt_pntr_6", cx, cz, 10);
  try {
    world.setDifficulty(Difficulty.Easy);
    fill(dim, { x: cx - 6, y: dim.heightRange.min + 1, z: cz - 6 }, { x: cx + 6, y: top, z: cz + 6 }, "minecraft:stone");
    fill(dim, { x: cx - 6, y: top + 1, z: cz - 6 }, { x: cx + 6, y: top + 40, z: cz + 6 }, "minecraft:air");
    await test.idle(2);
    arm(owner);
    cooldown.clearCooldown(owner, KEY);
    await goTo(test, owner, dim, { x: cx, y: top + 1, z: cz + 6 });
    await goTo(test, victim, dim, { x: cx - 1, y: top + 1, z: cz - 1 });
    const zombie = dim.spawnEntity("minecraft:zombie", { x: cx + 1.5, y: top + 1, z: cz + 1.5 });
    const cow = dim.spawnEntity("minecraft:cow", { x: cx + 5.5, y: top + 1, z: cz + 0.5 });
    extras.push(zombie, cow);
    for (const mob of [zombie, cow]) mob.addEffect("slowness", 1200, { amplifier: 255, showParticles: false });
    zombie.addEffect("fire_resistance", 1200, { amplifier: 0, showParticles: false });
    await test.idle(10);
    test.assert(zombie.isValid && cow.isValid, "setup: the zombie or the cow is gone");
    const still = { cow: { ...cow.location }, owner: { ...owner.location } };

    const attack = activate(owner, "lmb", dim.getBlock({ x: cx, y: top, z: cz }), Direction.Up);
    test.assert(attack !== undefined, "the owner did not fire");
    if (attack === undefined) return;
    const r = await untilReport(test, reports, attack.attackId, 120);
    const det = r.startedTick;
    while (system.currentTick < det + 1) await test.idle(1);
    const moved = {
      cow: cow.isValid ? Math.hypot(cow.location.x - still.cow.x, cow.location.y - still.cow.y, cow.location.z - still.cow.z) : -1,
      owner: Math.hypot(owner.location.x - still.owner.x, owner.location.y - still.owner.y, owner.location.z - still.owner.z),
    };
    const zombieId = zombie.id;
    const victimId = victim.id;
    let fell = { zombie: false, victim: false };
    for (let t = 0; t < 160 && !(fell.zombie && fell.victim); t++) {
      await test.idle(1);
      fell = {
        zombie: hurts.some((h) => h.id === zombieId && h.cause === "fall"),
        victim: hurts.some((h) => h.id === victimId && h.cause === "fall"),
      };
    }
    const early = hurts.filter((h) => h.tick === det || h.tick === det + 1);
    const show = (h: (typeof hurts)[number]): string => `${h.type}:${h.cause}:${h.damage.toFixed(1)}@+${h.tick - det}`;
    log(
      `ac5 RESULT detonation tick ${det} (attack ${attack.attackId}); hurt events in it and the next ${early.length} [${early.map(show).join(" ")}]; ` +
        `all hurt events after the shot [${hurts.map(show).join(" ")}]; cow moved ${moved.cow.toFixed(3)}, owner moved ${moved.owner.toFixed(3)}; ` +
        `fall damage: zombie ${fell.zombie}, B ${fell.victim}`
    );
    test.assert(early.length === 0, `${early.length} hurt event(s) in the detonation tick or the next: ${early.map(show).join(" ")}`);
    test.assert(moved.cow >= 0 && moved.cow < 0.05, `the cow moved ${moved.cow.toFixed(3)}`);
    test.assert(moved.owner < 0.05, `the owner moved ${moved.owner.toFixed(3)}`);
    test.assert(fell.zombie && fell.victim, `fall damage: zombie ${fell.zombie}, B ${fell.victim}`);
    test.succeed();
  } finally {
    restoreLmb();
    world.afterEvents.entityHurt.unsubscribe(sub);
    world.setDifficulty(difficulty);
    for (const e of extras) if (e.isValid) e.remove();
    reports.stop();
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ---------------------------------------------------------------- AC#7 — L0-pntr-ac06, r009, PN-3

interface Spied {
  kind: "sound" | "particle";
  id: string;
  at: Vector3;
  tick: number;
}

/** Records every playSound / spawnParticle this runtime makes on any dimension while armed. */
function spySoundAndParticles(): { calls: Spied[]; restore: () => void } {
  const calls: Spied[] = [];
  const proto = Dimension.prototype;
  const playSound = proto.playSound;
  const spawnParticle = proto.spawnParticle;
  proto.playSound = function (this: Dimension, ...args: Parameters<Dimension["playSound"]>) {
    calls.push({ kind: "sound", id: args[0], at: { ...args[1] }, tick: system.currentTick });
    return playSound.apply(this, args);
  };
  proto.spawnParticle = function (this: Dimension, ...args: Parameters<Dimension["spawnParticle"]>) {
    calls.push({ kind: "particle", id: args[0], at: { ...args[1] }, tick: system.currentTick });
    return spawnParticle.apply(this, args);
  };
  return {
    calls,
    restore: () => {
      proto.playSound = playSound;
      proto.spawnParticle = spawnParticle;
    },
  };
}

registerAsync("andrew", "pntr_one_sound_one_wave", async (test: Test): Promise<void> => {
  const restoreLmb = useRealLmb(test);
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const cx = origin.x + 64;
  const cz = origin.z + 96;
  const top = dim.heightRange.min + 139;
  const reports = watchReports();
  const unload = await loadSite(test, dim, "andrew_gt_pntr_7", cx, cz, 6);
  let spy: ReturnType<typeof spySoundAndParticles> | undefined;
  try {
    fill(dim, { x: cx - 3, y: dim.heightRange.min + 1, z: cz - 3 }, { x: cx + 3, y: top, z: cz + 3 }, "minecraft:stone");
    fill(dim, { x: cx - 3, y: top + 1, z: cz - 3 }, { x: cx + 3, y: top + 3, z: cz + 3 }, "minecraft:air");
    await test.idle(2);
    const aabb = { location: { x: cx - 3, y: dim.heightRange.min, z: cz - 3 }, volume: { x: 6, y: top - dim.heightRange.min + 2, z: 6 } };
    const entitiesBefore = new Set(dim.getEntities(aabb).map((e) => e.id));
    const attackId = newAttackId("7");
    const point = { x: cx, y: top, z: cz };
    spy = spySoundAndParticles();
    const det = system.currentTick;
    detonate(dim, point, attackId);
    const r = await untilReport(test, reports, attackId);
    while (system.currentTick < det + 25) await test.idle(1);
    spy.restore();
    const inColumn = (c: Spied): boolean => Math.abs(c.at.x - (cx + 0.5)) <= 3.5 && Math.abs(c.at.z - (cz + 0.5)) <= 3.5;
    const calls = spy.calls.filter(inColumn);
    spy = undefined;
    const sounds = calls.filter((c) => c.kind === "sound");
    const particles = calls.filter((c) => c.kind === "particle");
    const byTick = new Map<number, Spied[]>();
    for (const p of particles) byTick.set(p.tick, [...(byTick.get(p.tick) ?? []), p]);
    const ticks = [...byTick.keys()].sort((x, y) => x - y);
    const consecutive = ticks.length === WAVE_TICKS && ticks.every((t, i) => t === det + i);
    const maxPerTick = Math.max(...[...byTick.values()].map((v) => v.length));
    let rising = "";
    for (let i = 1; i < ticks.length; i++) {
      const prevMin = Math.min(...(byTick.get(ticks[i - 1]) ?? []).map((p) => p.at.y));
      const curMax = Math.max(...(byTick.get(ticks[i]) ?? []).map((p) => p.at.y));
      if (curMax > prevMin && rising === "") rising = `tick +${ticks[i] - det}: ${curMax} > ${prevMin}`;
    }
    const lastYs = (byTick.get(ticks[ticks.length - 1]) ?? []).map((p) => Math.floor(p.at.y));
    const jobsLeft = penetratorJobs().size;
    const newEntities = dim.getEntities(aabb).filter((e) => !entitiesBefore.has(e.id));
    log(
      `ac6 RESULT attack ${attackId}, detonation tick ${det}, column ${top}→${dim.heightRange.min} (${top - dim.heightRange.min + 1} layers): ${brief(r)}; ` +
        `sounds ${sounds.length} [${sounds.map((s) => `${s.id}@${fmt1(s.at)}+${s.tick - det}`).join(" ")}]; particles ${particles.length} over ticks ` +
        `[${ticks.map((t) => `+${t - det}:${byTick.get(t)?.length}`).join(" ")}], max per tick ${maxPerTick}; ` +
        `y rising ${rising === "" ? "never" : rising}; last tick ys [${lastYs.join(",")}]; pntr jobs alive at +25: ${jobsLeft}; new entities in the column ${newEntities.length}`
    );
    test.assert(sounds.length === 1, `${sounds.length} sounds`);
    test.assert(sounds[0].id === "random.explode" && sounds[0].tick === det, `the sound ${sounds[0]?.id} at +${(sounds[0]?.tick ?? det) - det}`);
    test.assert(Math.floor(sounds[0].at.x) === cx && Math.floor(sounds[0].at.y) === top && Math.floor(sounds[0].at.z) === cz, `the sound at ${fmt1(sounds[0].at)}, not the detonation cell ${fmt(point)}`);
    test.assert(consecutive, `particle ticks [${ticks.map((t) => t - det).join(",")}] are not 20 consecutive ticks from the detonation tick`);
    test.assert(maxPerTick <= WAVE_CAP, `${maxPerTick} particle calls in one tick`);
    test.assert(rising === "", `particle y rises: ${rising}`);
    test.assert(lastYs.includes(dim.heightRange.min), `the last tick's layers [${lastYs.join(",")}] miss the bottom ${dim.heightRange.min}`);
    test.assert(jobsLeft === 0, `${jobsLeft} pntr job(s) alive 25 ticks after the detonation`);
    test.assert(newEntities.length === 0, `${newEntities.length} new entities in the column: ${newEntities.map((e) => e.typeId).join(",")}`);
    test.succeed();
  } finally {
    restoreLmb();
    spy?.restore();
    reports.stop();
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ---------------------------------------------------------------- AC#8 — L0-pntr-ac07, PN-1, PN-2, AS-pntr-03

interface Measure {
  label: string;
  det: number;
  reports: PenetratorReport[];
  topInTick: boolean[];
  /** Wall ms of each tick from the detonation tick to two ticks after the last column ended. */
  ticks: number[];
}

/**
 * Detonates every point in one tick; each column's top 16 layers are checked
 * in that same tick, after the prefix ran, with one native query so the check
 * adds next to nothing to the tick it measures. Tick lengths are taken from
 * the test's own continuation, where the detonation happens (continuationTicks).
 */
async function measure(test: Test, dim: Dimension, label: string, points: Vector3[], reports: ReturnType<typeof watchReports>): Promise<Measure> {
  const ids = points.map(() => newAttackId(`8${label}`));
  let det = -1;
  let topInTick: boolean[] = [];
  const lengths = await continuationTicks(test, 14, () => {
    det = system.currentTick;
    points.forEach((p, i) => detonate(dim, p, ids[i]));
    // Queued after every detonation's own prefix, so it runs once they have.
    void Promise.resolve().then(() => {
      topInTick = points.map((p, i) => {
        const plan = planColumn(ids[i], p, dim.heightRange);
        const box = new BlockVolume({ x: plan.cx - 3, y: plan.top - 15, z: plan.cz - 3 }, { x: plan.cx + 3, y: plan.top, z: plan.cz + 3 });
        const standing = [...dim.getBlocks(box, { excludeTypes: ["minecraft:air"] }, false).getBlockLocationIterator()].filter((c) => isPlannedCell(plan, c.x, c.y, c.z));
        return system.currentTick === det && standing.length === 0;
      });
    });
  });
  const rs: PenetratorReport[] = [];
  for (const id of ids) rs.push(await untilReport(test, reports, id));
  const end = Math.max(...rs.map((r) => r.endedTick)) + 2;
  return { label, det, reports: rs, topInTick, ticks: lengths.slice(0, end - det + 1) };
}

/** Idle ticks sampled before the budget runs: the host's own worst tick is the bar a detonation tick is held to. */
const CONTROL_TICKS = 200;

function longestRunOver(ticks: number[], limit: number): number {
  let run = 0;
  let longest = 0;
  for (const ms of ticks) {
    run = ms > limit ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return longest;
}

registerAsync("andrew", "pntr_budget_measured", async (test: Test): Promise<void> => {
  const restoreLmb = useRealLmb(test);
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const x0 = origin.x + 200;
  const z0 = origin.z;
  const min = dim.heightRange.min;
  const reports = watchReports();
  const unload = await loadSite(test, dim, "andrew_gt_pntr_8", x0 + 16, z0 + 16, 24);
  try {
    const a = { x: x0, y: 76, z: z0 };
    const b = { x: x0, y: dim.heightRange.max - 1, z: z0 + 24 };
    const c = [0, 12, 24].map((dx) => ({ x: x0 + 24 + dx, y: 76, z: z0 + 8 }));
    for (const p of [a, b, ...c]) {
      fill(dim, { x: p.x - 3, y: min + 1, z: p.z - 3 }, { x: p.x + 3, y: p.y, z: p.z + 3 }, "minecraft:stone");
    }
    await test.idle(20);
    const idle = await continuationTicks(test, CONTROL_TICKS);
    // An idle server on this host already crosses 50 ms (up to 57 ms seen in 40 idle ticks): a tick counts as slow only above both.
    const limit = Math.max(50, ...idle);
    log(`[measure] PNTR-JOB control, no attack: ${idle.length} ticks, wall ms max ${Math.max(...idle)}, over 50: ${idle.filter((ms) => ms > 50).length}; a tick is slow above ${limit} ms`);

    const runs = [await measure(test, dim, "a", [a], reports), await measure(test, dim, "b", [b], reports), await measure(test, dim, "c", c, reports)];
    const pn1Limit: Record<string, number> = { a: 3, b: 6, c: 6 };
    const verdicts: string[] = [];
    for (const m of runs) {
      const used = m.reports.map((r) => r.ticksUsed);
      const slow = m.ticks.filter((ms) => ms > limit).length;
      const run = longestRunOver(m.ticks, limit);
      const pn1 = used.every((n) => n <= pn1Limit[m.label]) && m.topInTick.every(Boolean);
      const pn2 = m.label === "a" ? slow === 0 : run <= 2;
      verdicts.push(`(${m.label}) PN-1 ${pn1 ? "held" : "FAILED"}, PN-2 ${pn2 ? "held" : "FAILED"}`);
      const cols = m.reports.map(
        (r) => `${r.top}→${r.bottom}: ${r.scanned} cells, removed ${r.removed}, ticksUsed ${r.ticksUsed}, firstTickLayers ${r.firstTickLayers}, pntr ms by tick [${r.msByTick.join(",")}], cells by tick [${r.cellsByTick.join(",")}]`
      );
      log(
        `[measure] PNTR-JOB MEASURED (${m.label}) ${cols.join(" | ")}; top 16 layers gone in the detonation tick ${m.topInTick.join(",")}; ` +
          `server tick wall ms from the detonation tick [${m.ticks.join(",")}]: ${slow} slow, longest slow run ${run}; ` +
          `PN-1 (≤ ${pn1Limit[m.label]} ticks, top 16 in the detonation tick) ${pn1 ? "held" : "FAILED"}; PN-2 (${m.label === "a" ? "no slow tick" : "≤ 2 slow ticks in a row"}) ${pn2 ? "held" : "FAILED"}`
      );
      test.assert(m.topInTick.every(Boolean), `(${m.label}) the top 16 layers were not all gone in the detonation tick`);
      for (const r of m.reports) test.assert(r.errors === 0 && r.skippedUnloaded === 0 && r.removed > 0, `(${m.label}) ${brief(r)}`);
      test.assert(pn2, `(${m.label}) PN-2 failed: ticks [${m.ticks.join(",")}] against ${limit} ms`);
      test.assert(pn1, `(${m.label}) PN-1 failed: ticksUsed ${used.join(",")} against ${pn1Limit[m.label]}; see L0-pntr-as03`);
    }
    log(`[measure] PNTR-JOB VERDICT ${verdicts.join("; ")}`);
    test.succeed();
  } finally {
    restoreLmb();
    reports.stop();
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ---------------------------------------------------------------- AC#9 — L0-pntr-ac09, r008, PN-4

registerAsync("andrew", "pntr_chunk_edge", async (test: Test): Promise<void> => {
  const restoreLmb = useRealLmb(test);
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const x0 = Math.floor((origin.x + 1024) / 16) * 16;
  const z0 = Math.floor(origin.z / 16) * 16;
  const edge = x0 + 15;
  const cz = z0 + 8;
  const top = 80;
  const reports = watchReports();
  const warn = captureWarnings();
  const areaC = "andrew_gt_pntr_9c";
  const proto = Dimension.prototype;
  const runCommand = proto.runCommand;
  const manager = world.tickingAreaManager;
  const createArea = manager.createTickingArea;
  const commands: string[] = [];
  let areasCreated = 0;
  let release: (() => void) | undefined;
  try {
    release = await loadBox(test, dim, "andrew_gt_pntr_9", { min: [x0, 0, z0], max: [x0 + 31, 0, z0 + 15] });
    fill(dim, { x: edge - 4, y: 60, z: cz - 4 }, { x: edge + 4, y: top, z: cz + 4 }, "minecraft:stone");
    fill(dim, { x: edge - 4, y: top + 1, z: cz - 4 }, { x: edge + 4, y: top + 3, z: cz + 4 }, "minecraft:air");
    await test.idle(2);
    test.assert(dim.runCommand(`tickingarea add ${x0} 0 ${z0} ${x0 + 15} 0 ${z0 + 15} ${areaC}`).successCount > 0, "tickingarea add refused");
    release();
    release = undefined;
    const beside = { x: edge + 2, y: 70, z: cz };
    let waited = 0;
    for (; waited < 600 && dim.isChunkLoaded(beside); waited++) await test.idle(1);
    const neighbourGone = !dim.isChunkLoaded(beside) && dim.getBlock(beside) === undefined;
    const ownLoaded = dim.isChunkLoaded({ x: edge, y: 70, z: cz }) && dim.getBlock({ x: edge, y: 70, z: cz }) !== undefined;
    log(`ac9 setup: the chunk east of x=${edge} ${neighbourGone ? `unloaded after ${waited} ticks` : "is STILL LOADED"}; the detonation chunk ${ownLoaded ? "loaded" : "NOT loaded"}`);
    test.assert(neighbourGone && ownLoaded, "setup: no loaded chunk beside an unloaded one — the run proves nothing");

    const dpBefore = world.getDynamicPropertyIds().length;
    const dpBytes = world.getDynamicPropertyTotalByteCount();
    proto.runCommand = function (this: Dimension, ...args: Parameters<Dimension["runCommand"]>) {
      commands.push(args[0]);
      return runCommand.apply(this, args);
    };
    manager.createTickingArea = function (...args: Parameters<typeof createArea>) {
      areasCreated++;
      return createArea.apply(manager, args);
    };
    const attackId = newAttackId("9");
    const point = { x: edge, y: top, z: cz };
    let threw = "";
    try {
      detonate(dim, point, attackId);
    } catch (err) {
      threw = String(err);
    }
    const r = await untilReport(test, reports, attackId);
    while (penetratorJobs().has(attackId)) await test.idle(1);
    proto.runCommand = runCommand;
    manager.createTickingArea = createArea;
    const dpAfter = world.getDynamicPropertyIds().length;
    const dpBytesAfter = world.getDynamicPropertyTotalByteCount();
    const plan = planColumn(attackId, point, dim.heightRange);
    const loadedCells = planCells(plan).filter((c) => c.x <= edge && c.y >= 60);
    const leftLoaded = loadedCells.filter((c) => typeAt(dim, c) !== "minecraft:air");
    const jobErrors = warn.lines.filter((l) => l.includes("orbital pntr:") && l.includes(attackId) && l.includes("threw"));

    // Load the east chunk again: the planned cells there must still be stone.
    const areaE = "andrew_gt_pntr_9e";
    test.assert(dim.runCommand(`tickingarea add ${x0 + 16} 0 ${z0} ${x0 + 31} 0 ${z0 + 15} ${areaE}`).successCount > 0, "tickingarea add (east) refused");
    for (let t = 0; t < 300 && !dim.isChunkLoaded(beside); t++) await test.idle(1);
    await test.idle(2);
    const eastCells = planCells(plan).filter((c) => c.x > edge && c.y >= 60);
    const changed = eastCells.filter((c) => typeAt(dim, c) !== "minecraft:stone");
    dim.runCommand(`tickingarea remove ${areaE}`);
    log(
      `ac9 RESULT attack ${attackId} at ${fmt(point)}: ${brief(r)}; thrown out of onDetonate: ${threw === "" ? "nothing" : threw}; job error lines ${jobErrors.length}; ` +
        `planned cells in the loaded chunk not air ${leftLoaded.length}/${loadedCells.length}; planned cells in the east chunk changed ${changed.length}/${eastCells.length}; ` +
        `ticking areas created during the job ${areasCreated}, commands run ${commands.length} [${commands.join(" | ")}]; world dynamic properties ${dpBefore} -> ${dpAfter} (${dpBytes} -> ${dpBytesAfter} bytes)`
    );
    test.assert(r.skippedUnloaded > 0, "report.skippedUnloaded is 0");
    test.assert(threw === "" && r.errors === 0 && jobErrors.length === 0, `errors: thrown "${threw}", report ${r.errors}, lines ${jobErrors.length}`);
    test.assert(leftLoaded.length === 0, `${leftLoaded.length} planned cell(s) in the loaded chunk were not removed`);
    test.assert(eastCells.length > 0 && changed.length === 0, `${changed.length} of ${eastCells.length} planned cells in the unloaded chunk changed`);
    test.assert(areasCreated === 0 && !commands.some((c) => c.includes("tickingarea")), "a ticking area was created during the job");
    test.assert(dpAfter === dpBefore && dpBytesAfter === dpBytes, `world dynamic properties ${dpBefore} -> ${dpAfter}`);
    test.succeed();
  } finally {
    restoreLmb();
    proto.runCommand = runCommand;
    manager.createTickingArea = createArea;
    warn.stop();
    reports.stop();
    release?.();
    try {
      dim.runCommand(`tickingarea remove ${areaC}`);
    } catch (err) {
      log(`tickingarea remove ${areaC} threw ${String(err)}`);
    }
  }
})
  .structureName(STRUCTURE)
  .maxTicks(1600)
  .tag("andrew");

// ---------------------------------------------------------------- AS-pntr-03: what runJob gives a job on this engine

/** When a job queued inside an interval callback first runs, and how many 1 ms slices it gets per tick. */
function probeJobTiming(): Promise<{ scheduled: number; firstResume: number; resumes: Array<[number, number]> }> {
  return new Promise((resolve) => {
    const handle = system.runInterval(() => {
      system.clearRun(handle);
      const scheduled = system.currentTick;
      const resumes = new Map<number, number>();
      let firstResume = -1;
      function* slices(): Generator<void, void, void> {
        while (system.currentTick < scheduled + 6) {
          const t = system.currentTick;
          if (firstResume < 0) firstResume = t;
          resumes.set(t, (resumes.get(t) ?? 0) + 1);
          const s = Date.now();
          while (Date.now() - s < 1) {
            // One millisecond of work per slice.
          }
          yield;
        }
        resolve({ scheduled, firstResume, resumes: [...resumes] });
      }
      system.runJob(slices());
    }, 1);
  });
}

registerAsync("andrew", "probe_pntr_runjob", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const x0 = origin.x + 48;
  const z0 = origin.z;
  const y0 = -60;
  const y1 = 139;
  const unload = await loadSite(test, dim, "andrew_gt_pntr_q", x0 + 3, z0 + 3, 6);
  try {
    const timing = await probeJobTiming();
    probeLog(
      `Q1 RESULT a job queued in tick ${timing.scheduled} from a runInterval callback first ran in tick ${timing.firstResume} (+${timing.firstResume - timing.scheduled}); ` +
        `1 ms slices per tick: ${timing.resumes.map(([t, n]) => `+${t - timing.scheduled}:${n}`).join(" ")}`
    );
    const cells: Vector3[] = [];
    for (let y = y1; y >= y0; y--) for (let dz = 0; dz < 7; dz++) for (let dx = 0; dx < 7; dx++) cells.push({ x: x0 + dx, y, z: z0 + dz });
    const stone = (): void => fill(dim, { x: x0, y: y0, z: z0 }, { x: x0 + 6, y: y1, z: z0 + 6 }, "minecraft:stone");
    stone();
    await test.idle(2);
    const SYNC = 2000;
    let s = Date.now();
    for (let i = 0; i < SYNC; i++) dim.getBlock(cells[i])?.isWaterlogged;
    const readMs = Date.now() - s;
    s = Date.now();
    for (let i = 0; i < SYNC; i++) {
      const b = dim.getBlock(cells[i]);
      if (b === undefined || b.isAir || b.isLiquid || b.isWaterlogged || b.getComponent("minecraft:inventory") !== undefined) continue;
      b.setType("minecraft:air");
    }
    const writeMs = Date.now() - s;
    probeLog(`Q2 RESULT synchronous, ${SYNC} stone cells: getBlock+reads ${readMs} ms; getBlock+reads+setType(air) ${writeMs} ms (${((writeMs * 1000) / SYNC).toFixed(1)} µs/cell)`);
    stone();
    await test.idle(2);
    s = Date.now();
    fill(dim, { x: x0, y: y1 - 40, z: z0 }, { x: x0 + 6, y: y1, z: z0 + 6 }, "minecraft:air");
    probeLog(`Q3 RESULT fillBlocks(air) over 41 layers × 7×7 (${41 * 49} cells) in ${Date.now() - s} ms`);
    test.succeed();
  } finally {
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ---------------------------------------------------------------- AS-pntr-03: what the band pass's native calls cost

registerAsync("andrew", "probe_pntr_native_cost", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const x0 = origin.x + 48;
  const z0 = origin.z + 24;
  const unload = await loadSite(test, dim, "andrew_gt_pntr_n", x0 + 3, z0 + 3, 6);
  try {
    fill(dim, { x: x0, y: -60, z: z0 }, { x: x0 + 6, y: 100, z: z0 + 6 }, "minecraft:stone");
    await test.idle(2);
    const special = specialTypes();
    const keepers = [...KEEPERS];
    const band = (i: number): BlockVolume => new BlockVolume({ x: x0, y: 100 - 4 * i - 3, z: z0 }, { x: x0 + 6, y: 100 - 4 * i, z: z0 + 6 });
    const time = (n: number, f: (i: number) => void): number => {
      const s = Date.now();
      for (let i = 0; i < n; i++) f(i);
      return Date.now() - s;
    };
    const big = time(100, (i) => [...dim.getBlocks(band(i % 40), { includeTypes: special }, true).getBlockLocationIterator()]);
    const small = time(100, (i) => [...dim.getBlocks(band(i % 40), { includeTypes: keepers }, true).getBlockLocationIterator()]);
    const tall = time(10, () => [...dim.getBlocks(new BlockVolume({ x: x0, y: -60, z: z0 }, { x: x0 + 6, y: 100, z: z0 + 6 }), { includeTypes: special }, true).getBlockLocationIterator()]);
    const exclude = ["minecraft:air", ...keepers];
    const fills = time(1000, (i) => {
      const y = 100 - (i % 160);
      dim.fillBlocks(new BlockVolume({ x: x0, y, z: z0 + (i % 7) }, { x: x0 + 6, y, z: z0 + (i % 7) }), "minecraft:air", { blockFilter: { excludeTypes: exclude }, ignoreChunkBoundErrors: true });
    });
    const loaded = time(1000, (i) => dim.isChunkLoaded({ x: x0 + (i % 7), y: 0, z: z0 }));
    probeLog(
      `native RESULT specialTypes() ${special.length} ids; getBlocks over 7×7×4 with them: ${(big / 100).toFixed(2)} ms/call; with the ${keepers.length} keep ids: ${(small / 100).toFixed(2)} ms/call; ` +
        `over 7×7×161 with them: ${(tall / 10).toFixed(2)} ms/call; fillBlocks of one 7×1×1 row: ${(fills / 1000).toFixed(3)} ms/call; isChunkLoaded ${(loaded / 1000).toFixed(4)} ms/call`
    );
    test.succeed();
  } finally {
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ---------------------------------------------------------------- PN-2: what the detonation tick costs

/**
 * Wall ms of `ticks` consecutive ticks, each measured from this test's own
 * continuation to the next: GameTest resumes a test before the interval
 * callbacks run, so this is the one phase that holds work done right here.
 */
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

registerAsync("andrew", "probe_pntr_det_tick", async (test: Test): Promise<void> => {
  const restoreLmb = useRealLmb(test);
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const x0 = origin.x + 360;
  const z0 = origin.z;
  const min = dim.heightRange.min;
  const reports = watchReports();
  const unload = await loadSite(test, dim, "andrew_gt_pntr_d", x0 + 30, z0 + 24, 40);
  try {
    const kinds: Array<{ kind: string; top: number; solid: boolean }> = [
      { kind: "stone, 4 layers", top: min + 3, solid: true },
      { kind: "stone, 8 layers", top: min + 7, solid: true },
      { kind: "stone, 16 layers", top: min + 15, solid: true },
      { kind: "air, 16-layer prefix of 30", top: min + 29, solid: false },
      { kind: "stone, 141 layers", top: 76, solid: true },
    ];
    const runs: Array<{ kind: string; p: Vector3 }> = [];
    kinds.forEach((k, row) => {
      for (let i = 0; i < 4; i++) {
        const p = { x: x0 + i * 12, y: k.top, z: z0 + row * 12 };
        runs.push({ kind: k.kind, p });
        fill(dim, { x: p.x - 3, y: min + 1, z: p.z - 3 }, { x: p.x + 3, y: k.solid ? k.top : min + 4, z: p.z + 3 }, "minecraft:stone");
        if (!k.solid) fill(dim, { x: p.x - 3, y: min + 5, z: p.z - 3 }, { x: p.x + 3, y: k.top + 2, z: p.z + 3 }, "minecraft:air");
      }
    });
    await test.idle(40);
    const idle = await continuationTicks(test, 200);
    const rows = new Map<string, string[]>();
    for (const r of runs) {
      const id = newAttackId("d");
      let scriptMs = 0;
      const ticks = await continuationTicks(test, 4, () => {
        const s = Date.now();
        detonate(dim, r.p, id);
        void Promise.resolve().then(() => (scriptMs = Date.now() - s));
      });
      const rep = await untilReport(test, reports, id);
      rows.set(r.kind, [...(rows.get(r.kind) ?? []), `[${ticks.join(",")}; script ${scriptMs} ms, ticksUsed ${rep.ticksUsed}]`]);
      await test.idle(10);
    }
    probeLog(`det RESULT idle: ${idle.length} ticks, max ${Math.max(...idle)}, over 50: ${idle.filter((ms) => ms > 50).length}, mean ${(idle.reduce((a, b) => a + b, 0) / idle.length).toFixed(1)}`);
    for (const [kind, cells] of rows) probeLog(`det RESULT ${kind}: wall ms from the detonation, 4 ticks each ${cells.join(" ")}`);
    test.succeed();
  } finally {
    restoreLmb();
    reports.stop();
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");
