// L0-katn-ac08 probes on BDS 1.26.51.1: the engine facts that L0-adr-ktfl,
// L0-adr-ktob, L0-katn-ad01 and decision-katana-landing-above-lava-unsafe rest
// on, measured before any Katana code exists. A scenario passes when its
// measurement completed and its controls behaved; the answers are the
// "[probe] KATA Pn RESULT …" lines, recorded in docs/feedback/probe-katana.md.

import {
  BlockPermutation,
  type BlockRaycastOptions,
  BlockTypes,
  type Dimension,
  EntityDamageCause,
  GameMode,
  type Vector3,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";
const EPS = 0.01;
/** L0-adr-ktob §1: the Katana's trace flags; L0-katn-ad01 §1 reuses them for the fit ray. */
const TRACE: BlockRaycastOptions = { includePassableBlocks: false, includeLiquidBlocks: false };
/** decision-katana-landing-above-lava-unsafe: the downward hazard ray. */
const ALL: BlockRaycastOptions = { includePassableBlocks: true, includeLiquidBlocks: true };
const LIQUID_ONLY: BlockRaycastOptions = { includePassableBlocks: false, includeLiquidBlocks: true };
const DOWN: Vector3 = { x: 0, y: -1, z: 0 };
const EAST: Vector3 = { x: 1, y: 0, z: 0 };

const log = (msg: string): void => console.warn(`[probe] KATA ${msg}`);
const f2 = (v: Vector3): string => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
const cell = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const sameCell = (a: Vector3, b: Vector3): boolean => a.x === b.x && a.y === b.y && a.z === b.z;

type Ray = { kind: "hit"; typeId: string; at: Vector3 } | { kind: "none" } | { kind: "threw"; error: string };

// getBlockFromRay on 1.26.51: maxDistance is a budget of cell steps, not blocks
// (P2b), and a part-block the ray enters mid-cell is caught only once the ray
// steps out of its cell (P3) — every ray here runs past the cell it judges.

function cast(dim: Dimension, from: Vector3, dir: Vector3, options: BlockRaycastOptions): Ray {
  try {
    const hit = dim.getBlockFromRay(from, dir, options);
    return hit === undefined ? { kind: "none" } : { kind: "hit", typeId: hit.block.typeId, at: hit.block.location };
  } catch (err) {
    return { kind: "threw", error: errText(err) };
  }
}

/** A ray outcome with the hit cell in test-relative coordinates. */
function show(test: Test, ray: Ray): string {
  if (ray.kind === "none") return "none";
  if (ray.kind === "threw") return `threw ${ray.error}`;
  return `${ray.typeId.replace("minecraft:", "")}@${cell(test.relativeBlockLocation(ray.at))}`;
}

function relHit(test: Test, ray: Ray): Vector3 | undefined {
  return ray.kind === "hit" ? test.relativeBlockLocation(ray.at) : undefined;
}

type States = Record<string, string | number | boolean>;

/** GameTest's setBlock* throws when the call would change nothing, so ask first. */
function put(test: Test, rel: Vector3, id: string, states?: States): void {
  if (test.getBlock(rel).permutation.matches(id, states)) return;
  test.setBlockPermutation(BlockPermutation.resolve(id, states), rel);
}

/** The first id of `candidates` this engine knows — flower ids were renamed across 1.21. */
function knownId(candidates: readonly string[]): string {
  return candidates.find((id) => BlockTypes.get(id) !== undefined) ?? candidates[0];
}

// ------------------------------------------------ P1: a self-teleport mid-fall resets the fall (L0-adr-ktfl)

const FALL_HEIGHT = 25;

interface Faller {
  label: string;
  cell: Vector3;
  /** The faller teleports to its own location on the first falling tick at or below this height over the floor. */
  resetAt: number | undefined;
  player?: SimulatedPlayer;
  reset?: { tick: number; height: number; vy: number; vyAfter?: number };
  landed?: number;
}

registerAsync("andrew", "probe_katana_fall_reset", async (test: Test): Promise<void> => {
  const floor = test.worldBlockLocation({ x: 0, y: 2, z: 0 }).y;
  const fallers: Faller[] = [
    { label: "control", cell: { x: 1, y: 2, z: 1 }, resetAt: undefined },
    { label: "reset-at-2", cell: { x: 5, y: 2, z: 5 }, resetAt: 2 },
    { label: "reset-at-12", cell: { x: 1, y: 2, z: 5 }, resetAt: 12 },
  ];
  const ids = new Map<string, Faller>();
  const hurts = new Map<string, string[]>();
  const fallHurt = new Map<string, number[]>();
  const deaths = new Map<string, string>();
  const hurtSub = world.afterEvents.entityHurt.subscribe((e) => {
    const id = e.hurtEntity.id;
    if (!ids.has(id)) return;
    hurts.get(id)?.push(`${e.damageSource.cause}:${e.damage.toFixed(1)}`);
    if (e.damageSource.cause === EntityDamageCause.fall) fallHurt.get(id)?.push(e.damage);
  });
  const dieSub = world.afterEvents.entityDie.subscribe((e) => {
    const id = e.deadEntity.id;
    if (ids.has(id)) deaths.set(id, e.damageSource.cause);
  });
  try {
    for (const f of fallers) {
      const p = test.spawnSimulatedPlayer(f.cell, `kata_fall_${f.label}`, GameMode.Survival);
      f.player = p;
      ids.set(p.id, f);
      hurts.set(p.id, []);
      fallHurt.set(p.id, []);
    }
    await test.idle(10);
    for (const f of fallers) {
      const p = f.player as SimulatedPlayer;
      test.assert(p.getComponent("minecraft:health")?.currentValue === 20, `${f.label} does not start at 20 HP`);
      p.teleport(test.worldLocation({ x: f.cell.x + 0.5, y: f.cell.y + FALL_HEIGHT, z: f.cell.z + 0.5 }));
    }
    for (let t = 1; t <= 150 && fallers.some((f) => f.landed === undefined); t++) {
      await test.idle(1);
      for (const f of fallers) {
        const p = f.player as SimulatedPlayer;
        if (f.landed !== undefined || !p.isValid) continue;
        const height = p.location.y - floor;
        const vy = p.getVelocity().y;
        if (f.reset !== undefined && f.reset.vyAfter === undefined) f.reset.vyAfter = vy;
        if (f.resetAt !== undefined && f.reset === undefined && vy < 0 && height <= f.resetAt) {
          p.teleport(p.location, { rotation: p.getRotation() });
          f.reset = { tick: t, height, vy };
        }
        if (t > 2 && height < EPS) f.landed = t;
      }
    }
    await test.idle(10);

    for (const f of fallers) {
      const id = (f.player as SimulatedPlayer).id;
      const reset =
        f.reset === undefined
          ? "none"
          : `+${f.reset.tick} at ${f.reset.height.toFixed(2)} above the floor, vy ${f.reset.vy.toFixed(2)} -> ${f.reset.vyAfter?.toFixed(2) ?? "?"} next tick`;
      log(
        `P1 RESULT ${f.label}: fell ${FALL_HEIGHT}, self-teleport ${reset}, landed +${f.landed ?? "never"}, ` +
          `fallHurt=[${(fallHurt.get(id) ?? []).map((d) => d.toFixed(1)).join(" ")}] allHurt=[${(hurts.get(id) ?? []).join(" ")}] death=${deaths.get(id) ?? "none"}`
      );
    }
    const byLabel = (label: string): number[] => fallHurt.get((fallers.find((f) => f.label === label)?.player as SimulatedPlayer).id) ?? [];
    const control = byLabel("control");
    const subject = byLabel("reset-at-2");
    log(
      `P1 RESULT verdict: control fall hurt events ${control.length} (sum ${control.reduce((a, b) => a + b, 0).toFixed(1)}), ` +
        `reset-at-2 fall hurt events ${subject.length} -> self-teleport ${control.length > 0 && subject.length === 0 ? "RESETS" : "DOES NOT RESET"} the fall`
    );
    for (const f of fallers) test.assert(f.landed !== undefined, `${f.label} never reached the floor`);
    test.assert(fallers[1].reset !== undefined, "reset-at-2 never self-teleported before the floor");
    test.assert(control.length > 0, "the control fell 25 blocks without a fall entityHurt: the instrument cannot see fall damage");
    test.assert(subject.length === 0, `the self-teleported player took fall damage [${subject.join(" ")}]: L0-adr-ktfl does not hold`);
  } finally {
    world.afterEvents.entityHurt.unsubscribe(hurtSub);
    world.afterEvents.entityDie.unsubscribe(dieSub);
    for (const f of fallers) if (f.player?.isValid) test.removeSimulatedPlayer(f.player);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ------------------------------------------------ P2: what the trace ray passes and stops at (L0-adr-ktob §1)

interface Probed {
  label: string;
  id: string;
  states?: States;
  support: string;
  /** What L0-adr-ktob §1 and L0-katn-ac08 #2 expect of the trace flags. */
  adr: "passes" | "stops" | "control";
}

/** BlockTypes cannot be read in early execution, so the list is built inside the test. */
const probed = (): readonly Probed[] => [
  { label: "air", id: "minecraft:air", support: "minecraft:stone", adr: "control" },
  { label: "water", id: "minecraft:water", support: "minecraft:stone", adr: "passes" },
  { label: "lava", id: "minecraft:lava", support: "minecraft:stone", adr: "passes" },
  { label: "grass", id: "minecraft:short_grass", support: "minecraft:grass_block", adr: "passes" },
  { label: "flower", id: knownId(["minecraft:poppy", "minecraft:red_flower"]), support: "minecraft:grass_block", adr: "passes" },
  { label: "flower", id: knownId(["minecraft:dandelion", "minecraft:yellow_flower"]), support: "minecraft:grass_block", adr: "passes" },
  { label: "cobweb", id: "minecraft:web", support: "minecraft:stone", adr: "passes" },
  { label: "carpet", id: "minecraft:white_carpet", support: "minecraft:stone", adr: "passes" },
  { label: "stone", id: "minecraft:stone", support: "minecraft:stone", adr: "stops" },
  { label: "bottom slab", id: "minecraft:oak_slab", states: { "minecraft:vertical_half": "bottom" }, support: "minecraft:stone", adr: "stops" },
  { label: "fence", id: "minecraft:oak_fence", support: "minecraft:stone", adr: "stops" },
  { label: "glass pane", id: "minecraft:glass_pane", support: "minecraft:stone", adr: "stops" },
];

registerAsync("andrew", "probe_katana_ray_flags", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  // The probed cell T sits on the floor. Both rays cross the lowest 1/16 of T,
  // so every probed shape, carpet included, lies on their path.
  const T: Vector3 = { x: 3, y: 2, z: 3 };
  const S: Vector3 = { x: 3, y: 1, z: 3 };
  const BACK: Vector3 = { x: 6, y: 2, z: 3 };
  const hFrom = test.worldLocation({ x: 0.5, y: 2 + 0.03, z: 3.5 });
  const vFrom = test.worldLocation({ x: 3.5, y: 4.5, z: 3.5 });
  const H = (o: BlockRaycastOptions): Ray => cast(dim, hFrom, EAST, { ...o, maxDistance: 6.4 });
  const V = (o: BlockRaycastOptions): Ray => cast(dim, vFrom, DOWN, { ...o, maxDistance: 3 });
  const judge = (ray: Ray, backstop: Vector3): string => {
    const at = relHit(test, ray);
    if (at !== undefined && sameCell(at, T)) return "stops";
    if (at !== undefined && sameCell(at, backstop)) return "passes";
    return `broken(${show(test, ray)})`;
  };

  put(test, BACK, "minecraft:stone");
  const verdicts: string[] = [];
  const broken: string[] = [];
  const mismatched: string[] = [];
  for (const p of probed()) {
    try {
      put(test, S, p.support);
      put(test, T, p.id, p.states);
    } catch (err) {
      broken.push(`${p.id}: not placed (${errText(err)})`);
      continue;
    }
    await test.idle(1);
    const placed = test.getBlock(T).typeId;
    const trace = { h: judge(H(TRACE), BACK), v: judge(V(TRACE), S) };
    const all = { h: judge(H(ALL), BACK), v: judge(V(ALL), S) };
    const verdict = trace.h === trace.v ? trace.h : `mixed(horizontal ${trace.h}, vertical ${trace.v})`;
    const match = p.adr === "control" ? "-" : verdict === p.adr ? "matches" : "CONTRADICTS";
    log(
      `P2 RESULT ${p.label} ${p.id}: ${verdict} with the trace flags (horizontal ${trace.h}, vertical ${trace.v}); ` +
        `both flags true: horizontal ${all.h}, vertical ${all.v}; placed=${placed}; L0-adr-ktob expects ${p.adr} -> ${match}`
    );
    if (placed !== p.id) broken.push(`${p.id}: reads back as ${placed}`);
    if (verdict.includes("broken")) broken.push(`${p.id}: ${verdict}`);
    if (match === "CONTRADICTS") mismatched.push(`${p.id}=${verdict}`);
    verdicts.push(`${p.label}=${verdict}`);
    put(test, T, "minecraft:air");
    put(test, S, "minecraft:stone");
    await test.idle(p.id.endsWith("water") || p.id.endsWith("lava") ? 10 : 2);
  }
  log(`P2 RESULT summary: ${verdicts.join(", ")}; contradicting L0-adr-ktob: [${mismatched.join(" ")}]`);
  const air = verdicts.find((v) => v.startsWith("air="));
  const stone = verdicts.find((v) => v.startsWith("stone="));
  test.assert(air === "air=passes", `control: the trace ray does not cross an empty cell (${air ?? "unmeasured"})`);
  test.assert(stone === "stone=stops", `control: the trace ray does not stop at stone (${stone ?? "unmeasured"})`);
  test.assert(broken.length === 0, `unmeasured: ${broken.join("; ")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ P2b: how far maxDistance reaches off-axis (L0-adr-ktob §1)

/** L0-adr-ktob §1: the Katana trace's maxDistance. */
const KATANA_REACH = 20;
const REACH_SLACK = 40;

interface Target {
  label: string;
  /** Test-relative ray origin, aim point and the stone the ray should stop at. */
  from: Vector3;
  aim: Vector3;
  block: Vector3;
}

/** Ray parameter at which a ray enters the unit box at `box`; Infinity on a miss. */
function entry(from: Vector3, dir: Vector3, box: Vector3): number {
  let near = Number.NEGATIVE_INFINITY;
  let far = Number.POSITIVE_INFINITY;
  for (const k of ["x", "y", "z"] as const) {
    if (Math.abs(dir[k]) < 1e-9) {
      if (from[k] < box[k] || from[k] > box[k] + 1) return Number.POSITIVE_INFINITY;
      continue;
    }
    const t1 = (box[k] - from[k]) / dir[k];
    const t2 = (box[k] + 1 - from[k]) / dir[k];
    near = Math.max(near, Math.min(t1, t2));
    far = Math.min(far, Math.max(t1, t2));
  }
  return near <= far && far >= 0 ? near : Number.POSITIVE_INFINITY;
}

registerAsync("andrew", "probe_katana_ray_reach", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const targets: Target[] = [
    { label: "along x", from: { x: 0.5, y: 3.5, z: 3.5 }, aim: { x: 16.5, y: 3.5, z: 3.5 }, block: { x: 16, y: 3, z: 3 } },
    { label: "diagonal in x/z", from: { x: 0.5, y: 3.5, z: 0.5 }, aim: { x: 12.5, y: 3.5, z: 12.3 }, block: { x: 12, y: 3, z: 12 } },
    { label: "diagonal in x/y/z", from: { x: 0.5, y: 2.5, z: 0.5 }, aim: { x: 8.5, y: 10.3, z: 8.4 }, block: { x: 8, y: 10, z: 8 } },
  ];
  const failures: string[] = [];
  for (const g of targets) {
    const from = test.worldLocation(g.from);
    const aim = test.worldLocation(g.aim);
    const box = test.worldBlockLocation(g.block);
    const d = { x: aim.x - from.x, y: aim.y - from.y, z: aim.z - from.z };
    const len = Math.hypot(d.x, d.y, d.z);
    const dir = { x: d.x / len, y: d.y / len, z: d.z / len };
    const path = show(test, cast(dim, from, dir, { ...TRACE, maxDistance: 64 }));
    put(test, g.block, "minecraft:stone");
    await test.idle(1);
    const t = entry(from, dir, box);
    const cells = Math.abs(box.x - Math.floor(from.x)) + Math.abs(box.y - Math.floor(from.y)) + Math.abs(box.z - Math.floor(from.z));
    const onTarget = (ray: Ray): boolean => ray.kind === "hit" && sameCell(ray.at, box);
    let smallest: number | undefined;
    for (let md = 1; md <= 48 && smallest === undefined; md += 0.25) {
      if (onTarget(cast(dim, from, dir, { ...TRACE, maxDistance: md }))) smallest = md;
    }
    const at20 = cast(dim, from, dir, { ...TRACE, maxDistance: KATANA_REACH });
    log(
      `P2b RESULT ${g.label}: stone entered ${t.toFixed(2)} blocks along the ray, ${cells} cell steps from the start cell; ` +
        `smallest maxDistance that hits it ${smallest?.toFixed(2) ?? "none up to 48"}; maxDistance ${KATANA_REACH} -> ${show(test, at20)}; ` +
        `before the stone the path read ${path}; loaded=${dim.isChunkLoaded(box)}`
    );
    if (smallest === undefined) failures.push(`${g.label}: the stone is never hit`);
    put(test, g.block, "minecraft:air");
  }
  test.assert(failures.length === 0, failures.join("; "));
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(100)
  .tag("andrew");

// ------------------------------------------------ P3: the column ray of L0-katn-ad01 §1 sees slabs

interface Part {
  id: string;
  states?: States;
}

interface Column {
  label: string;
  feet?: Part;
  head?: Part;
  support?: string;
  /** Asserted verdict of the full-cell column ray; undefined = recorded only. */
  blocked?: boolean;
}

registerAsync("andrew", "probe_katana_column_slabs", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const F: Vector3 = { x: 3, y: 2, z: 3 };
  const UP: Vector3 = { x: 3, y: 3, z: 3 };
  const BELOW: Vector3 = { x: 3, y: 1, z: 3 };
  const slab = (half: "bottom" | "top"): Part => ({ id: "minecraft:oak_slab", states: { "minecraft:vertical_half": half } });
  const cases: Column[] = [
    { label: "empty feet and head", blocked: false },
    { label: "stone in the feet cell", feet: { id: "minecraft:stone" }, blocked: true },
    { label: "bottom slab in the feet cell", feet: slab("bottom"), blocked: true },
    { label: "top slab in the feet cell", feet: slab("top"), blocked: true },
    { label: "bottom slab in the head cell", head: slab("bottom"), blocked: true },
    { label: "top slab in the head cell", head: slab("top"), blocked: true },
    { label: "carpet in the feet cell", feet: { id: "minecraft:white_carpet" } },
    { label: "short grass in the feet cell", feet: { id: "minecraft:short_grass" }, support: "minecraft:grass_block" },
    { label: "oak fence in the feet cell", feet: { id: "minecraft:oak_fence" } },
  ];
  const feet = test.worldBlockLocation(F);
  const top = { x: feet.x + 0.5, y: feet.y + 2 - EPS, z: feet.z + 0.5 };
  // L0-katn-ad01 §1 verbatim, as diagnose-CNTR-KATN-CX01.probe.ts casts it: the segment stops EPS above the floor.
  const ad01 = (): Ray => cast(dim, top, DOWN, { ...TRACE, maxDistance: 2 - 2 * EPS });
  // The same ray run EPS into the cell below; a hit there is the floor and does not count.
  const column = (): Ray => cast(dim, top, DOWN, { ...TRACE, maxDistance: 2 });
  const inColumn = (ray: Ray): boolean => {
    const at = relHit(test, ray);
    return at !== undefined && (sameCell(at, F) || sameCell(at, UP));
  };
  // The AD-katn-01 fallback: horizontal rays at y+0.1 and y+1.9, kept inside the cell.
  const across = (y: number): Ray => cast(dim, { x: feet.x + EPS, y: feet.y + y, z: feet.z + 0.5 }, EAST, { ...TRACE, maxDistance: 1 - 2 * EPS });

  const failures: string[] = [];
  for (const c of cases) {
    put(test, BELOW, c.support ?? "minecraft:stone");
    if (c.feet !== undefined) put(test, F, c.feet.id, c.feet.states);
    if (c.head !== undefined) put(test, UP, c.head.id, c.head.states);
    await test.idle(1);
    const a = ad01();
    const col = column();
    const blocked = inColumn(col);
    log(
      `P3 RESULT ${c.label}: ad01 segment (2-2eps) ${show(test, a)} -> ${a.kind === "hit" ? "does not fit" : "fits"}; ` +
        `full-cell column (2) ${show(test, col)} -> ${blocked ? "does not fit" : "fits"}; ` +
        `fallback horizontals y+0.1 ${show(test, across(0.1))}, y+1.9 ${show(test, across(1.9))}; feet=${test.getBlock(F).typeId} head=${test.getBlock(UP).typeId}`
    );
    if (c.blocked !== undefined && (col.kind === "threw" || blocked !== c.blocked)) failures.push(`${c.label}: ${show(test, col)}`);
    put(test, F, "minecraft:air");
    put(test, UP, "minecraft:air");
    put(test, BELOW, "minecraft:stone");
    await test.idle(1);
  }

  // Why the ad01 segment loses the bottom slab: the same centre ray, cut at different lengths.
  const lengths = async (part: Part, from: number, lens: number[]): Promise<string> => {
    put(test, F, part.id, part.states);
    await test.idle(1);
    const out = lens.map((len) => `len ${len.toFixed(2)} (ends F.y${(from - len).toFixed(2)}) ${show(test, cast(dim, { ...top, y: feet.y + from }, DOWN, { ...TRACE, maxDistance: len }))}`);
    put(test, F, "minecraft:air");
    return out.join(", ");
  };
  log(`P3 RESULT segment end, bottom slab, from F.y+1.99: ${await lengths(slab("bottom"), 2 - EPS, [1.6, 2 - 2 * EPS, 2, 2.2])}`);
  log(`P3 RESULT segment end, bottom slab, from F.y+0.99: ${await lengths(slab("bottom"), 1 - EPS, [0.6, 1 - 2 * EPS, 1.2])}`);
  log(`P3 RESULT segment end, stone, from F.y+1.99: ${await lengths({ id: "minecraft:stone" }, 2 - EPS, [1, 1.2, 2 - 2 * EPS])}`);
  test.assert(failures.length === 0, `full-cell column ray: ${failures.join("; ")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

// ------------------------------------------------ P4: the hazard ray of decision-katana-landing-above-lava-unsafe

/** decision-katana-landing-above-lava-unsafe, L0-katn-as03. */
const HAZARDS = ["minecraft:lava", "minecraft:flowing_lava", "minecraft:fire", "minecraft:soul_fire"];

interface Pit {
  label: string;
  /** Column on the platform; rel y=1 is the floor cell the hazard replaces, y=0 the cell under it. */
  x: number;
  z: number;
  under: string;
  floor: string;
  /** Height of the ray origin: the centre of the candidate air cell. */
  fromY: number;
  /** Asserted first block of the downward ray with both flags true; undefined = recorded only. */
  expect?: string;
}

registerAsync("andrew", "probe_katana_lava_below", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  // diagnose-CNTR-KATN-CX01.probe.ts Part B: lava sunk into the floor at (3,1,4),
  // stone under it, the candidate air cell F=(3,2,4) above, the same three rays.
  const pits: Pit[] = [
    { label: "air over stone (control)", x: 1, z: 4, under: "", floor: "minecraft:stone", fromY: 2.5, expect: "minecraft:stone" },
    { label: "air over lava (CX01 F=(3,2,4))", x: 3, z: 4, under: "minecraft:stone", floor: "minecraft:lava", fromY: 2.5, expect: "minecraft:lava" },
    { label: "two air cells over lava", x: 5, z: 4, under: "minecraft:stone", floor: "minecraft:lava", fromY: 3.5, expect: "minecraft:lava" },
    { label: "air over fire", x: 1, z: 1, under: "minecraft:stone", floor: "minecraft:fire", fromY: 2.5 },
    { label: "air over soul fire", x: 3, z: 1, under: "minecraft:soul_soil", floor: "minecraft:soul_fire", fromY: 2.5 },
    { label: "air over water", x: 5, z: 1, under: "minecraft:stone", floor: "minecraft:water", fromY: 2.5 },
  ];
  // y=0 lies below the platform, outside what `gametest clearall` resets.
  const saved = new Map<string, Part>();
  for (const p of pits) {
    const under = { x: p.x, y: 0, z: p.z };
    const block = test.getBlock(under);
    saved.set(cell(under), { id: block.typeId, states: block.permutation.getAllStates() });
  }
  const failures: string[] = [];
  try {
    for (const p of pits) {
      if (p.under !== "") put(test, { x: p.x, y: 0, z: p.z }, p.under);
      put(test, { x: p.x, y: 1, z: p.z }, p.floor);
    }
    await test.idle(2);
    for (const p of pits) {
      const from = test.worldLocation({ x: p.x + 0.5, y: p.fromY, z: p.z + 0.5 });
      const all = cast(dim, from, DOWN, { ...ALL, maxDistance: 64 });
      const liquid = cast(dim, from, DOWN, { ...LIQUID_ONLY, maxDistance: 64 });
      const trace = cast(dim, from, DOWN, { ...TRACE, maxDistance: 64 });
      const hazard = cast(dim, from, DOWN, { ...ALL, includeTypes: HAZARDS, maxDistance: 64 });
      const above = all.kind === "hit" ? (dim.getBlock({ ...all.at, y: all.at.y + 1 })?.typeId ?? "unloaded") : "-";
      const placed = test.getBlock({ x: p.x, y: 1, z: p.z }).typeId;
      const first = all.kind === "hit" ? all.typeId : show(test, all);
      log(
        `P4 RESULT ${p.label}: first block down with both flags true = ${show(test, all)} (block above it ${above.replace("minecraft:", "")}); ` +
          `includeLiquidBlocks only = ${show(test, liquid)}; trace flags = ${show(test, trace)}; both flags + includeTypes hazards = ${show(test, hazard)}; ` +
          `floor cell reads ${placed}${p.expect === undefined ? "" : `; expected ${p.expect.replace("minecraft:", "")}`}`
      );
      if (p.expect !== undefined && first !== p.expect) failures.push(`${p.label}: ${show(test, all)}`);
      if (placed !== p.floor) failures.push(`${p.label}: the floor cell reads ${placed}, not ${p.floor}`);
    }
  } finally {
    for (const p of pits) {
      put(test, { x: p.x, y: 1, z: p.z }, "minecraft:stone");
      const under = { x: p.x, y: 0, z: p.z };
      const before = saved.get(cell(under));
      if (before !== undefined) put(test, under, before.id, before.states);
    }
  }
  test.assert(failures.length === 0, failures.join("; "));
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(100)
  .tag("andrew");

// ------------------------------------------------ P5: the trace ray reaching into an unloaded chunk (L0-adr-ktob §2)

registerAsync("andrew", "probe_katana_unloaded_ray", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 3, y: 2, z: 3 });
  let edge: number | undefined;
  let chunks = 0;
  for (let c = 1; c <= 64 && edge === undefined; c++) {
    const x = origin.x + c * 16;
    if (!dim.isChunkLoaded({ x, y: origin.y, z: origin.z })) {
      edge = Math.floor(x / 16) * 16;
      chunks = c;
    }
  }
  test.assert(edge !== undefined, "no unloaded chunk within 64 chunks along +x");
  const xs = edge as number;
  const z = origin.z + 0.5;
  const top = dim.getTopmostBlock({ x: xs - 1, z: origin.z });
  test.assert(top !== undefined, `no topmost block at x=${xs - 1}, the last loaded column`);
  const ground = (top?.location.y ?? 0) + 1;
  const loaded = (v: Vector3): string => (dim.isChunkLoaded(v) ? "L" : "U");
  const towards = (from: Vector3, to: Vector3): { dir: Vector3; len: number } => {
    const d = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z };
    const len = Math.hypot(d.x, d.y, d.z);
    return { dir: { x: d.x / len, y: d.y / len, z: d.z / len }, len };
  };
  // A sloped ray aims at the flat ground surface: the control's aim point lies
  // in a loaded chunk, the probe's 8 blocks inside the first unloaded one.
  // maxDistance carries REACH_SLACK because it counts cells, not blocks (P2b).
  const rays: Array<{ label: string; from: Vector3; to: Vector3 }> = [
    { label: "level, through air", from: { x: xs - 4, y: ground + 3.5, z }, to: { x: xs + 8, y: ground + 3.5, z } },
    { label: "sloped onto the ground", from: { x: xs - 4, y: ground + 4, z }, to: { x: xs + 8, y: ground, z } },
    { label: "control: the same slope shifted 16 back", from: { x: xs - 20, y: ground + 4, z }, to: { x: xs - 8, y: ground, z } },
    { label: "starting inside the unloaded chunk", from: { x: xs + 4, y: ground + 4, z }, to: { x: xs + 16, y: ground, z } },
  ];
  const outcomes = new Map<string, Ray>();
  for (const r of rays) {
    const { dir, len } = towards(r.from, r.to);
    const ray = cast(dim, r.from, dir, { ...TRACE, maxDistance: len + REACH_SLACK });
    outcomes.set(r.label, ray);
    const shown = ray.kind === "hit" ? `hit ${ray.typeId}@${cell(ray.at)}` : ray.kind === "none" ? "no hit" : `threw ${ray.error}`;
    log(`P5 RESULT ${r.label}: ${shown}; from ${f2(r.from)}[${loaded(r.from)}] to ${f2(r.to)}[${loaded(r.to)}]; unloaded from x=${xs} (${chunks} chunk steps out)`);
  }
  const control = outcomes.get(rays[2].label);
  test.assert(control?.kind === "hit", `control: the sloped ray in loaded chunks does not hit the ground (${control?.kind})`);
  test.assert(loaded(rays[1].to) === "U" && loaded(rays[2].from) === "L" && loaded(rays[2].to) === "L", "the probe geometry does not straddle the loaded edge");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(100)
  .tag("andrew");

// ------------------------------------------------ P6: the trail particle (Katana §8)

const CHERRY = "minecraft:cherry_leaves_particle";
const TRAIL_POINTS = 21;
const TRAIL_REPEATS = 10;

function tryParticle(dim: Dimension, id: string, at: Vector3): string {
  try {
    dim.spawnParticle(id, at);
    return "no throw";
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

registerAsync("andrew", "probe_katana_cherry_particle", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const a = test.worldLocation({ x: 0.5, y: 2.5, z: 3.5 });
  const b = test.worldLocation({ x: 6.5, y: 3.5, z: 3.5 });
  let calls = 0;
  const errors: string[] = [];
  const started = Date.now();
  for (let r = 0; r < TRAIL_REPEATS; r++) {
    for (let i = 0; i < TRAIL_POINTS; i++) {
      const k = i / (TRAIL_POINTS - 1);
      const at = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k };
      calls++;
      const answer = tryParticle(dim, CHERRY, at);
      if (answer !== "no throw") errors.push(answer);
    }
  }
  const ms = Date.now() - started;
  // Controls: does spawnParticle throw at all — for an id no pack defines, and for an unloaded location?
  const unknown = tryParticle(dim, "andrew:no_such_particle", a);
  const far = { x: a.x + 10000, y: a.y, z: a.z + 10000 };
  const unloaded = tryParticle(dim, CHERRY, far);
  log(
    `P6 RESULT ${CHERRY}: ${calls} calls in one tick, ${errors.length} threw${errors.length > 0 ? ` (${errors[0]})` : ""}, ${ms} ms wall; ` +
      `control unknown id andrew:no_such_particle: ${unknown}; control unloaded location (loaded=${dim.isChunkLoaded(far)}): ${unloaded}`
  );
  test.assert(errors.length === 0, `spawnParticle(${CHERRY}) threw: ${errors[0]}`);
  await test.idle(1);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(60)
  .tag("andrew");
