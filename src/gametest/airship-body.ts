// The Airship body on a real engine (L0-airs-r003..r005, L0-airs-cx01): an
// independent candidate judged over its whole rotated footprint without
// touching the land; the one linked attempt per Windmill, its ring 40–100, the
// veto over the Windmill plot, no merging with independent Airships, no
// widening, no guards. Every test clears what it placed and restores the land.

import {
  BlockTypes,
  BlockVolume,
  Difficulty,
  type Dimension,
  EnchantmentType,
  ItemStack,
  StructureRotation,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { Test, registerAsync } from "@minecraft/server-gametest";
import { LINKED_RING, LINKED_STATUS, OVER_PARENT, linkedCandidates, overParent, parentCentre } from "../structures/bodies/airship";
import { BODIES, type TypeBody, withLinks } from "../structures/bodies";
import { type Box, boxOf, sliceBox } from "../structures/clear";
import type { RollDef } from "../structures/config";
import { GUARDS_SPAWNED, LINKED_TRIED, Placer } from "../structures/place";
import { COLLISION_MARGIN, type Instance, type Vec3, SALT_KEY, clearTestHook, installTestHook } from "../structures/registry";
import { type Candidate, buildCandidate, rollRotation, rotatedSize } from "../structures/roll";
import { toWorld } from "../structures/rotate";
import { StrfRuntime, engineStrf } from "../structures/runtime";
import { type RingCandidate, type RingLoader, engineRingLoader, footprintCentre, overlaps2d, searchRing } from "../structures/search-ring";
import { sampleColumns } from "../structures/site";
import { MemoryStore } from "../structures/store";
import { AIRSHIP_SIZE } from "../structures/templates/airship";
import { WINDMILL_SIZE } from "../structures/templates/windmill";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const CHUNK = 16;
const GUARD_TAG = "andrew:guard:";

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);
const v = (p: Vec3): Vector3 => ({ x: p[0], y: p[1], z: p[2] });

const engineApi = { world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType };

/** `ring`: the production ring loader on temporary ticking areas; without it a linked attempt waits as pending. */
function runtime(salt: string, ring: boolean): StrfRuntime {
  const store = new MemoryStore();
  store.set(SALT_KEY, salt);
  return new StrfRuntime(store, engineStrf(ring ? { ...engineApi, system, ringAreaPrefix: "andrew_gt_ring" } : engineApi), { log });
}

const unique = (label: string): string => `gt-as-${label}-${Date.now()}`;

/** Chunk `offset` chunks east of the test, clear of every other test's ground. */
function farChunk(test: Test, offset: number): [number, number] {
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  return [Math.floor(b.x / CHUNK) + offset, Math.floor(b.z / CHUNK)];
}

function fillBox(dim: Dimension, box: Box, block: string): void {
  for (const s of sliceBox(box)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), block);
}

function groundAt(dim: Dimension, x: number, z: number): number {
  const top = dim.getTopmostBlock({ x, z });
  if (top === undefined) throw new Error(`no ground at ${x},${z}`);
  return top.location.y;
}

/** Half an Airship's footprint diagonal plus a margin: how far any of its cells lies from its centre. */
const HALF_REACH = Math.ceil(Math.hypot(AIRSHIP_SIZE[0], AIRSHIP_SIZE[2]) / 2) + 2;

const airshipDef = (rt: StrfRuntime): RollDef => {
  const d = rt.defs.find((x) => x.id === "airship");
  if (d === undefined) throw new Error("no airship roll def");
  return d;
};

/** Every block of the box as "type states", a few x-slices per tick. */
async function snapshot(test: Test, dim: Dimension, box: Box, into = new Map<string, string>()): Promise<Map<string, string>> {
  for (let x = box.min[0]; x <= box.max[0]; x++) {
    for (let y = box.min[1]; y <= box.max[1]; y++)
      for (let z = box.min[2]; z <= box.max[2]; z++) {
        const b = dim.getBlock({ x, y, z });
        if (b === undefined) throw new Error(`${x},${y},${z} unloaded during the snapshot`);
        into.set(`${x},${y},${z}`, `${b.typeId} ${JSON.stringify(b.permutation.getAllStates())}`);
      }
    if ((x - box.min[0]) % 4 === 3) await test.idle(1);
  }
  return into;
}

function diff(a: Map<string, string>, b: Map<string, string>): string[] {
  const out: string[] = [];
  for (const [k, was] of a) if (b.get(k) !== was) out.push(`${k}: ${was} -> ${b.get(k)}`);
  return out;
}

/** Chests emptied first, so the air fill drops nothing; then the mobs around it. */
function removeStructure(dim: Dimension, inst: Instance, body: TypeBody, templateSize: Vec3): void {
  for (const c of body.chests) dim.getBlock(v(toWorld(inst.origin, c.local, templateSize, inst.rot)))?.getComponent("minecraft:inventory")?.container?.clearAll();
  const box = boxOf(inst.origin, inst.size);
  removeMobs(dim, box);
  fillBox(dim, box, "minecraft:air");
  removeMobs(dim, box);
}

function removeMobs(dim: Dimension, box: Box): void {
  const centre: Vec3 = [(box.min[0] + box.max[0]) / 2, (box.min[1] + box.max[1]) / 2, (box.min[2] + box.max[2]) / 2];
  for (const e of dim.getEntities({ location: v(centre), maxDistance: 64 })) if (e.typeId !== "minecraft:player") e.remove();
}

const removeAirship = (dim: Dimension, inst: Instance): void => removeStructure(dim, inst, BODIES.airship, [...AIRSHIP_SIZE]);
const removeWindmill = (dim: Dimension, inst: Instance): void => removeStructure(dim, inst, BODIES.windmill, [...WINDMILL_SIZE]);

/** AC8: entities within `reach` of the Airship's box carrying any guard tag, plus every entity carrying the Airship's own. */
function guardsAround(dim: Dimension, inst: Instance, reach = 16): { tagged: number; own: number; kinds: string } {
  const box = boxOf(inst.origin, inst.size);
  const centre: Vec3 = [(box.min[0] + box.max[0]) / 2, (box.min[1] + box.max[1]) / 2, (box.min[2] + box.max[2]) / 2];
  const near = dim.getEntities({ location: v(centre), maxDistance: Math.max(...inst.size) / 2 + reach });
  return {
    tagged: near.filter((e) => e.getTags().some((t) => t.startsWith(GUARD_TAG))).length,
    own: dim.getEntities({ tags: [`${GUARD_TAG}${inst.id}`] }).length,
    kinds: [...new Set(near.map((e) => e.typeId))].join(",") || "none",
  };
}

const hdist = (a: [number, number], b: [number, number]): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const shipCentre = (i: Instance): [number, number] => footprintCentre({ x: i.origin[0], z: i.origin[2], size: i.size });

const forceAirship = (cx: number, cz: number): void =>
  installTestHook({ outcomes: [["windmill", "o", cx, cz, false], ["airship", "o", cx, cz, true], ["warden_city", "o", cx, cz, false]] });

// ------------------------------------------------ AC1 + AC8: the independent candidate, over its whole rotated footprint

interface SiteCase {
  label: string;
  offset: number;
  /** Shapes the world under the candidate; returns the undo. */
  build(dim: Dimension, c: Candidate, ground: number): { undo: () => void; note: string };
  expect: "planned" | "rejected";
  reason?: RegExp;
}

const SITE_CASES: readonly SiteCase[] = [
  {
    label: "water",
    offset: 200,
    // A still pond under the last third of the rotated long axis: the centre column stays dry.
    build(dim, c, ground) {
      const alongZ = c.size[2] > c.size[0];
      const n = Math.ceil(Math.max(c.size[0], c.size[2]) / 3);
      const pond: Box = alongZ
        ? { min: [c.x, ground, c.z + c.size[2] - n], max: [c.x + c.size[0] - 1, ground, c.z + c.size[2] - 1] }
        : { min: [c.x + c.size[0] - n, ground, c.z], max: [c.x + c.size[0] - 1, ground, c.z + c.size[2] - 1] };
      fillBox(dim, pond, "minecraft:water");
      const [mx, mz] = footprintCentre(c);
      const centreTop = dim.getTopmostBlock({ x: mx, z: mz })?.typeId;
      return { undo: () => fillBox(dim, pond, "minecraft:grass_block"), note: `pond ${pond.min.join(",")}..${pond.max.join(",")}, centre column top ${centreTop}` };
    },
    expect: "rejected",
    reason: /^liquid$/,
  },
  {
    label: "ceiling",
    offset: 204,
    // One block near the build limit over a footprint corner: 40 blocks of clearance above it do not fit.
    build(dim, c) {
      const y = dim.heightRange.max - 20;
      const at: Vec3 = [c.x + c.size[0] - 1, y, c.z];
      dim.getBlock(v(at))?.setType("minecraft:stone");
      return { undo: () => dim.getBlock(v(at))?.setType("minecraft:air"), note: `stone at ${at.join(",")}, world top ${dim.heightRange.max}` };
    },
    expect: "rejected",
    reason: /^ceiling$/,
  },
  {
    label: "dry",
    offset: 208,
    build: () => ({ undo: () => {}, note: "flat dry land" }),
    expect: "planned",
  },
];

/** A salt whose rolled rotation for this chunk is 1 or 3, so the footprint really is turned. */
function turnedSalt(label: string, cx: number, cz: number): string {
  for (let i = 0; ; i++) {
    const s = `${unique(label)}-${i}`;
    if (rollRotation(s, "o", cx, cz, "airship") % 2 === 1) return s;
  }
}

registerAsync("andrew", "airship_body_site", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const verdicts: string[] = [];
  for (const sc of SITE_CASES) {
    const [cx, cz] = farChunk(test, sc.offset);
    const rt = runtime(turnedSalt(sc.label, cx, cz), false);
    const cand = buildCandidate(rt.registry.salt(), "o", cx, cz, airshipDef(rt));
    const fp: Box = {
      min: [cand.x - COLLISION_MARGIN, 0, cand.z - COLLISION_MARGIN],
      max: [cand.x + cand.size[0] - 1 + COLLISION_MARGIN, 0, cand.z + cand.size[2] - 1 + COLLISION_MARGIN],
    };
    const unload = await loadBox(test, dim, `andrew_gt_as_${sc.label}`, fp);
    let undo = (): void => {};
    let placed: Instance | undefined;
    try {
      const ground = groundAt(dim, cand.x, cand.z);
      const built = sc.build(dim, cand, ground);
      undo = built.undo;
      await test.idle(2);
      // The land and everything up to the lowest Airship bottom: no clearance is ever below 40.
      const land: Box = { min: [fp.min[0], ground - 3, fp.min[2]], max: [fp.max[0], ground + 39, fp.max[2]] };
      const before = await snapshot(test, dim, land);
      // Read before placement: afterwards the topmost block is the Airship itself.
      const cols = sampleColumns(cand.x, cand.z, cand.size[0], cand.size[2]);
      const maxTop = Math.max(...cols.map(([x, z]) => groundAt(dim, x, z)));

      forceAirship(cx, cz);
      let result;
      try {
        result = rt.discovery.evaluateChunk("o", cx, cz).results.find((r) => r.def === "airship");
      } finally {
        clearTestHook();
      }
      rt.pumpPlacement(10);
      await test.idle(5);
      const after = await snapshot(test, dim, land);
      const changed = diff(before, after);
      const ships = rt.instances("airship");
      placed = ships[0];
      let extra = "";
      let ok = result?.outcome === sc.expect && changed.length === 0;
      if (sc.expect === "rejected") ok = ok && sc.reason !== undefined && sc.reason.test(result?.reason ?? "") && ships.length === 0;
      else if (placed !== undefined) {
        const clearance = placed.origin[1] - maxTop;
        const g = guardsAround(dim, placed);
        extra =
          `; placed ${placed.id} state ${placed.state} bottom ${placed.origin[1]} over max top ${maxTop} (clearance ${clearance}), ${cols.length} columns sampled; ` +
          `AC8 guard-tagged mobs near it ${g.tagged}, with its own tag ${g.own}, mobs near: ${g.kinds}, gs=${String(placed.extras[GUARDS_SPAWNED])}`;
        ok = ok && ships.length === 1 && placed.state === "done" && clearance >= 40 && clearance <= 70 && g.tagged === 0 && g.own === 0 && placed.extras[GUARDS_SPAWNED] === undefined;
      } else ok = false;
      log(
        `airship site ${sc.label}: ${cand.id} rot ${cand.rot} footprint ${cand.size[0]}x${cand.size[2]} at ${cand.x},${cand.z}; ${built.note} -> ` +
          `${result?.outcome} ${result?.reason ?? ""}; records=${ships.length}; ${before.size} land blocks compared, ${changed.length} changed` +
          `${changed.length > 0 ? `: ${changed.slice(0, 5).join(" | ")}` : ""}${extra}`
      );
      verdicts.push(`${sc.label}:${ok ? "ok" : "FAIL"}`);
    } finally {
      if (placed !== undefined) removeAirship(dim, placed);
      undo();
      unload();
    }
    // A ticking area added in the tick another was removed never loads its chunks (measured on BDS 1.26.51.1).
    await test.idle(20);
  }
  log(`airship site RESULT ${verdicts.join(" ")}`);
  test.assert(verdicts.every((x) => x.endsWith(":ok")), `airship site: ${verdicts.join(" ")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");

// ------------------------------------------------ AC2 + AC3 + AC8: one linked attempt, 40–100 blocks away

/** A Windmill centred on (x, z) with its plot loaded; returns the loaded area's remover. */
async function windmillArea(test: Test, dim: Dimension, name: string, x: number, z: number): Promise<() => void> {
  return loadBox(test, dim, name, { min: [x - 24, 0, z - 24], max: [x + 24, 0, z + 24] });
}

registerAsync("andrew", "airship_linked_ring", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const difficulty = world.getDifficulty();
  const rt = runtime(unique("ring"), true);
  const [cx, cz] = farChunk(test, 240);
  const x = cx * CHUNK + 8;
  const z = cz * CHUNK + 8;
  const unloads: Array<() => void> = [await windmillArea(test, dim, "andrew_gt_as_ring_w", x, z)];
  const cleanup: Array<() => void> = [];
  try {
    world.setDifficulty(Difficulty.Easy);
    const out = rt.placeAt("windmill", "o", x, z, 0);
    test.assert(out.kind === "placed", `placeAt windmill: ${JSON.stringify(out)}`);
    if (out.kind !== "placed") return;
    const w = out.instance;
    cleanup.push(() => removeWindmill(dim, w));
    const pending = rt.linked.outcome(w.id);
    test.assert(pending !== undefined, "placing the Windmill started no linked attempt");
    const o = await pending!;
    if (o.airship !== undefined) cleanup.push(() => removeAirship(dim, o.airship!));
    const rec = rt.registry.get("o", w.origin, w.id);
    const d = o.airship === undefined ? NaN : hdist(shipCentre(o.airship), parentCentre(w));
    log(
      `airship linked RESULT windmill ${w.id} centre ${parentCentre(w).join(",")}: status ${o.status}, airship ${o.airship?.id} at ${o.airship?.origin.join(",")} ` +
        `centre ${o.airship === undefined ? "-" : shipCentre(o.airship).join(",")}; measured horizontal distance ${d.toFixed(2)} (ring ${LINKED_RING.rMin}-${LINKED_RING.rMax}); ` +
        `3D distance to the Windmill centre ${o.airship === undefined ? "-" : Math.hypot(d, o.airship.origin[1] - w.origin[1]).toFixed(2)}; ` +
        `attempts ${rt.linked.attempts.get(w.id)} la=${String(rec?.extras[LINKED_TRIED])} ${LINKED_STATUS}=${String(rec?.extras[LINKED_STATUS])}; checked ${o.result?.checked} rejects ${JSON.stringify(o.result?.rejects ?? {})}`
    );
    test.assert(o.status === "placed" && o.airship !== undefined, `linked: ${o.status}`);
    test.assert(d >= LINKED_RING.rMin && d <= LINKED_RING.rMax, `distance ${d}`);
    const over = overParent(w)({ x: o.airship!.origin[0], z: o.airship!.origin[2], size: o.airship!.size });
    log(`airship linked footprint ${o.airship!.size[0]}x${o.airship!.size[2]} rot ${o.airship!.rot} over the Windmill plot: ${over ?? "no"}`);
    test.assert(over === undefined, "the linked Airship hangs over the Windmill plot");
    test.assert(o.airship!.state === "done", `airship state ${o.airship!.state}`);
    test.assert(rt.linked.attempts.get(w.id) === 1 && rec?.extras[LINKED_TRIED] === true, "not exactly one attempt");

    // AC8: no guards around it — nothing tagged, no guard step on its record.
    const g = guardsAround(dim, o.airship!);
    log(`airship guards RESULT near ${o.airship!.id}: guard-tagged ${g.tagged}, own tag ${g.own}, mobs near: ${g.kinds}; gs=${String(o.airship!.extras[GUARDS_SPAWNED])}; body.guards ${typeof BODIES.airship.guards}`);
    test.assert(g.tagged === 0 && g.own === 0 && o.airship!.extras[GUARDS_SPAWNED] === undefined && BODIES.airship.guards === undefined, "a guard around the Airship");

    // Every route to a second attempt: nothing.
    const again = rt.placeAt("windmill", "o", x, z, 0);
    rt.resumeUnfinished();
    rt.pumpPlacement(10);
    await rt.linked.outcome(w.id);
    const ships = rt.instances("airship").length;
    log(`airship linked rerun: placeAt -> ${again.kind}; attempts ${rt.linked.attempts.get(w.id)}; airships ${ships}`);
    test.assert(again.kind === "blocked" && rt.linked.attempts.get(w.id) === 1 && ships === 1, "a second linked attempt");

    // The flag itself: the hook crashes after starting the attempt, so the finish step runs again on resume.
    const x2 = x;
    const z2 = z + 200;
    unloads.push(await windmillArea(test, dim, "andrew_gt_as_ring_w2", x2, z2));
    const eng = engineStrf({ ...engineApi, system, ringAreaPrefix: "andrew_gt_ring" });
    const crashing = withLinks(BODIES, (p) => {
      rt.linked.start(p);
      throw new Error("crash after the linked attempt started");
    });
    const placer = new Placer(rt.registry, eng.placeWorld("o")!, crashing, eng.hooks("o"), log);
    const ground2 = groundAt(dim, x2, z2);
    const plan = rt.registry.plan({ def: "windmill", dim: "o", origin: [x2 - 17, ground2 + 1, z2 - 17], rot: 0, size: [...WINDMILL_SIZE], id: "windmill:gt:crash" });
    test.assert(plan.ok, "the crash Windmill was not reserved");
    if (!plan.ok) return;
    const w2 = plan.instance;
    cleanup.push(() => removeWindmill(dim, w2));
    let threw = "";
    try {
      placer.run(w2);
    } catch (e) {
      threw = String(e);
    }
    const mid = rt.registry.get("o", w2.origin, w2.id);
    const resumed = rt.resumeUnfinished();
    rt.pumpPlacement(10);
    const o2 = await rt.linked.outcome(w2.id);
    if (o2?.airship !== undefined) cleanup.push(() => removeAirship(dim, o2.airship!));
    const end = rt.registry.get("o", w2.origin, w2.id);
    log(
      `airship linked flag RESULT crash "${threw}" left ${mid?.state} la=${String(mid?.extras[LINKED_TRIED])}; resumed ${resumed}, finish step reran -> ${end?.state}; ` +
        `attempts ${rt.linked.attempts.get(w2.id)}; its airship ${o2?.status} ${o2?.airship?.id ?? ""}`
    );
    test.assert(threw !== "" && mid?.state === "guarded" && mid.extras[LINKED_TRIED] === true, `after the crash: ${mid?.state}`);
    test.assert(end?.state === "done" && rt.linked.attempts.get(w2.id) === 1, `the flag let a second attempt through: ${rt.linked.attempts.get(w2.id)}`);
    test.succeed();
  } finally {
    world.setDifficulty(difficulty);
    for (const c of cleanup.reverse()) c();
    for (const u of unloads) u();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");

// ------------------------------------------------ AC4: over the Windmill plot is refused, whatever the height

registerAsync("andrew", "airship_linked_over_windmill", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const difficulty = world.getDifficulty();
  // No ring loader: this Windmill's own attempt waits, only the veto is exercised here.
  const rt = runtime(unique("over"), false);
  const [cx, cz] = farChunk(test, 270);
  const x = cx * CHUNK + 8;
  const z = cz * CHUNK + 8;
  const unload = await windmillArea(test, dim, "andrew_gt_as_over", x, z);
  let w: Instance | undefined;
  try {
    world.setDifficulty(Difficulty.Easy);
    const out = rt.placeAt("windmill", "o", x, z, 0);
    test.assert(out.kind === "placed", `placeAt windmill: ${JSON.stringify(out)}`);
    if (out.kind !== "placed") return;
    w = out.instance;
    const def = airshipDef(rt);
    const size = rotatedSize(def.size, 0);
    const [mx, mz] = parentCentre(w);
    // One column over the plot's east edge: the rest of the footprint is dry grass, so only the veto can refuse it.
    // Centred on the plot, a 28-long footprint crosses the field ditches and the site check refuses it on liquid first.
    const over: RingCandidate = { id: "airship:gt:over", def, dim: "o", cx, cz, rot: 0, size, x: w.origin[0] + w.size[0] - 1, z: mz - Math.floor(size[2] / 2), distance: 0 };
    const unloadOver = await loadBox(test, dim, "andrew_gt_as_over_c", { min: [over.x - 2, 0, over.z - 2], max: [over.x + size[0] + 1, 0, over.z + size[2] + 1] });
    let verdict: ReturnType<typeof rt.checker.check>;
    try {
      verdict = rt.checker.check(over);
    } finally {
      unloadOver();
    }
    // A ticking area added in the tick another was removed never loads its chunks (measured on BDS 1.26.51.1).
    await test.idle(20);
    const top = w.origin[1] + w.size[1] - 1;
    const gap = verdict.kind === "valid" ? verdict.y - top : NaN;

    // The production search over this one candidate, with the production loader counted.
    let loads = 0;
    let takes = 0;
    const real = engineRingLoader(dim, system, "andrew_gt_ring_over", 2);
    const counted: RingLoader = { load: (a, b) => (loads++, real.load(a, b)) };
    const result = await searchRing([over], { exclude: overParent(w), loader: counted, site: (c) => rt.gate.site(c), take: () => (takes++, "taken"), parallel: 2 });
    // Beside the plot, one column clear of it: the veto does not fire.
    const beside = overParent(w)({ x: w.origin[0] + w.size[0], z: over.z, size });
    const ring = linkedCandidates(rt.registry.salt(), w, def);
    const ringVetoed = ring.filter((c) => overParent(w!)(c) !== undefined).length;
    log(
      `airship over windmill RESULT candidate x ${over.x}..${over.x + size[0] - 1} over the plot edge x ${w.origin[0] + w.size[0] - 1} (windmill centre ${mx},${mz}); site check alone -> ${JSON.stringify(verdict)}, ` +
        `windmill top ${top}, height gap ${gap}; search -> ${result.kind} rejects ${JSON.stringify(result.rejects)}, loads ${loads}, takes ${takes}; ` +
        `beside the plot -> ${beside ?? "allowed"}; ring candidates vetoed ${ringVetoed}/${ring.length}; airship records ${rt.instances("airship").length}`
    );
    test.assert(verdict.kind === "valid" && gap > 0, `the site check alone must accept it above the Windmill: ${JSON.stringify(verdict)} gap ${gap}`);
    test.assert(result.kind === "none" && result.rejects[OVER_PARENT] === 1 && loads === 0 && takes === 0, `the veto did not stop it: ${JSON.stringify(result)}`);
    test.assert(beside === undefined, "a footprint beside the plot was vetoed");
    test.assert(rt.instances("airship").length === 0, "an Airship was placed");
    test.succeed();
  } finally {
    world.setDifficulty(difficulty);
    if (w !== undefined) removeWindmill(dim, w);
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ------------------------------------------------ AC5: no merging with independent Airships, either way

registerAsync("andrew", "airship_linked_no_merge", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const difficulty = world.getDifficulty();
  const rt = runtime(unique("merge"), true);
  const [cx, cz] = farChunk(test, 300);
  const x = cx * CHUNK + 8;
  const z = cz * CHUNK + 8;
  const unloads: Array<() => void> = [await windmillArea(test, dim, "andrew_gt_as_merge_w", x, z)];
  const cleanup: Array<() => void> = [];
  try {
    world.setDifficulty(Difficulty.Easy);
    // An independent Airship already inside the future ring, 60 blocks east of the Windmill centre.
    unloads.push(await loadBox(test, dim, "andrew_gt_as_merge_i", { min: [x + 60 - HALF_REACH, 0, z - HALF_REACH], max: [x + 60 + HALF_REACH, 0, z + HALF_REACH] }));
    const ind = rt.placeAt("airship", "o", x + 60, z, 0);
    test.assert(ind.kind === "placed", `independent airship: ${JSON.stringify(ind)}`);
    if (ind.kind !== "placed") return;
    cleanup.push(() => removeAirship(dim, ind.instance));

    const out = rt.placeAt("windmill", "o", x, z, 0);
    test.assert(out.kind === "placed", `placeAt windmill: ${JSON.stringify(out)}`);
    if (out.kind !== "placed") return;
    const w = out.instance;
    cleanup.push(() => removeWindmill(dim, w));
    const o = await rt.linked.outcome(w.id)!;
    if (o.airship !== undefined) cleanup.push(() => removeAirship(dim, o.airship!));
    const ships = rt.instances("airship");
    const dists = ships.map((s) => `${s.id}@${hdist(shipCentre(s), parentCentre(w)).toFixed(1)}`);
    log(`airship no-merge RESULT independent ${ind.instance.id} in the ring; linked attempt -> ${o.status} ${o.airship?.id ?? ""}; airships ${ships.length}: ${dists.join(" ")}`);
    test.assert(o.status === "placed" && o.airship !== undefined && o.airship.id !== ind.instance.id, "the independent Airship was counted as the linked one");
    test.assert(ships.length === 2, `${ships.length} airships`);
    const ship = o.airship!;

    // The linked Airship's own chunk still rolls its independent 2 %.
    const scx = Math.floor(ship.origin[0] / CHUNK);
    const scz = Math.floor(ship.origin[2] / CHUNK);
    const evaluatedBefore = rt.registry.isEvaluated("o", scx, scz);
    const cand = buildCandidate(rt.registry.salt(), "o", scx, scz, airshipDef(rt));
    unloads.push(await loadBox(test, dim, "andrew_gt_as_merge_c", { min: [cand.x - 2, 0, cand.z - 2], max: [cand.x + cand.size[0] + 1, 0, cand.z + cand.size[2] + 1] }));
    // Lift this candidate's bottom clear of the linked Airship with one tall stone column under its footprint
    // (outside the linked Airship, the Windmill plot and the other Airship), so a success is possible at all.
    const keepOut = [ship, w, ind.instance].map((i) => ({ x: i.origin[0], z: i.origin[2], size: i.size }));
    const col = sampleColumns(cand.x, cand.z, cand.size[0], cand.size[2]).find(([px, pz]) => keepOut.every((k) => !overlaps2d({ x: px, z: pz, size: [1, 1, 1] }, k)));
    let pillar: Box | undefined;
    if (col !== undefined) {
      const g = groundAt(dim, col[0], col[1]);
      pillar = { min: [col[0], g + 1, col[1]], max: [col[0], g + 45, col[1]] };
      fillBox(dim, pillar, "minecraft:stone");
      const p = pillar;
      cleanup.push(() => fillBox(dim, p, "minecraft:air"));
    }
    forceAirship(scx, scz);
    let res;
    try {
      res = rt.discovery.evaluateChunk("o", scx, scz).results.find((r) => r.def === "airship");
    } finally {
      clearTestHook();
    }
    rt.pumpPlacement(10);
    await test.idle(3);
    const own = rt.registry.get("o", [cand.x, 0, cand.z], cand.id);
    if (own !== undefined && own.state !== "failed") cleanup.push(() => removeAirship(dim, own));
    log(
      `airship roll kept RESULT linked ${ship.id} origin chunk ${scx},${scz} evaluated before ${evaluatedBefore}; its roll candidate ${cand.id} -> ${res?.outcome} ${res?.reason ?? ""}; ` +
        `record ${own?.state ?? "none"} bottom ${own?.origin[1] ?? "-"} vs linked bottom ${ship.origin[1]}; pillar ${pillar === undefined ? "none" : `${pillar.min.join(",")}..${pillar.max[1]}`}`
    );
    test.assert(!evaluatedBefore, "the linked placement marked its chunk evaluated");
    if (cand.id === ind.instance.id) {
      // The chunk's own roll is the independent Airship placed above: still there, not taken over.
      test.assert(res?.outcome === "existing", `own chunk: ${res?.outcome}`);
    } else if (pillar !== undefined) {
      test.assert(res?.outcome === "planned" && own?.state === "done", `the roll on the linked Airship's chunk did not succeed: ${res?.outcome} ${res?.reason ?? ""}`);
    } else {
      test.assert(res?.outcome === "planned" || /^collision:/.test(res?.reason ?? ""), `the roll was eaten: ${res?.outcome} ${res?.reason ?? ""}`);
    }
    test.succeed();
  } finally {
    world.setDifficulty(difficulty);
    for (const c of cleanup.reverse()) c();
    for (const u of unloads) u();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(3000)
  .tag("andrew");

// ------------------------------------------------ AC6: an all-invalid ring gives no Airship and touches nothing

/** Half-side of the square the ring's footprints can reach: 100 + half an Airship's diagonal + margin. */
const RING_REACH = LINKED_RING.rMax + HALF_REACH;
/** Half-side of the dry square kept under the Windmill plot and its margin. */
const DRY = 24;

registerAsync("andrew", "airship_linked_ring_invalid", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const difficulty = world.getDifficulty();
  const rt = runtime(unique("invalid"), true);
  const [cx, cz] = farChunk(test, 340);
  const x = cx * CHUNK + 8;
  const z = cz * CHUNK + 8;
  const quads: Box[] = [
    { min: [x - RING_REACH, 0, z - RING_REACH], max: [x - 1, 0, z - 1] },
    { min: [x, 0, z - RING_REACH], max: [x + RING_REACH, 0, z - 1] },
    { min: [x - RING_REACH, 0, z], max: [x - 1, 0, z + RING_REACH] },
    { min: [x, 0, z], max: [x + RING_REACH, 0, z + RING_REACH] },
  ];
  let ground = 0;
  const dry: Box = { min: [x - DRY, 0, z - DRY], max: [x + DRY, 0, z + DRY] };
  const clip = (q: Box, y: number): Box | undefined => {
    const min: Vec3 = [Math.max(q.min[0], dry.min[0]), y, Math.max(q.min[2], dry.min[2])];
    const max: Vec3 = [Math.min(q.max[0], dry.max[0]), y, Math.min(q.max[2], dry.max[2])];
    return min[0] <= max[0] && min[2] <= max[2] ? { min, max } : undefined;
  };
  const band = (q: Box): Box => ({ min: [q.min[0], ground - 1, q.min[2]], max: [q.max[0], ground + 1, q.max[2]] });
  /** One quadrant at a time: the loaded quadrant plus the production loader stay well under the engine's 10 areas. */
  const eachQuad = async (work: (q: Box) => Promise<void> | void): Promise<void> => {
    for (let i = 0; i < quads.length; i++) {
      const u = await loadBox(test, dim, `andrew_gt_as_inv_q${i}`, quads[i]);
      try {
        await work(quads[i]);
      } finally {
        u();
      }
    }
  };
  let flooded = false;
  let w: Instance | undefined;
  const unloadW = await windmillArea(test, dim, "andrew_gt_as_inv_w", x, z);
  try {
    world.setDifficulty(Difficulty.Easy);
    ground = groundAt(dim, x, z);
    // Water over the whole square at ground level, except the dry plot.
    await eachQuad((q) => {
      fillBox(dim, { min: [q.min[0], ground, q.min[2]], max: [q.max[0], ground, q.max[2]] }, "minecraft:water");
      const keep = clip(q, ground);
      if (keep !== undefined) fillBox(dim, keep, "minecraft:grass_block");
    });
    flooded = true;
    const before = new Map<string, string>();
    await eachQuad((q) => snapshot(test, dim, band(q), before).then(() => {}));

    const out = rt.placeAt("windmill", "o", x, z, 0);
    test.assert(out.kind === "placed", `placeAt windmill: ${JSON.stringify(out)}`);
    if (out.kind !== "placed") return;
    w = out.instance;
    const o = await rt.linked.outcome(w.id)!;
    const rec = rt.registry.get("o", w.origin, w.id);

    const after = new Map<string, string>();
    await eachQuad((q) => snapshot(test, dim, band(q), after).then(() => {}));
    // The Windmill's own template cells are its placement, not the linked attempt's.
    const wb = boxOf(w.origin, w.size);
    const inW = (k: string): boolean => {
      const [bx, by, bz] = k.split(",").map(Number);
      return bx >= wb.min[0] && bx <= wb.max[0] && by >= wb.min[1] && by <= wb.max[1] && bz >= wb.min[2] && bz <= wb.max[2];
    };
    const changed = diff(before, after).filter((line) => !inW(line.slice(0, line.indexOf(":"))));
    const ring = linkedCandidates(rt.registry.salt(), w, airshipDef(rt));
    log(
      `airship ring invalid RESULT windmill ${w.id}: linked -> ${o.status}; ${LINKED_STATUS}=${String(rec?.extras[LINKED_STATUS])} attempts ${rt.linked.attempts.get(w.id)}; ` +
        `ring ${ring.length} candidates, checked ${o.result?.checked}, rejects ${JSON.stringify(o.result?.rejects ?? {})}; airship records ${rt.instances("airship").length}; ` +
        `${before.size} land blocks compared (the Windmill box ${wb.min.join(",")}..${wb.max.join(",")} excluded), ${changed.length} changed${changed.length > 0 ? `: ${changed.slice(0, 5).join(" | ")}` : ""}`
    );
    test.assert(o.status === "none" && rec?.extras[LINKED_STATUS] === "none", `linked: ${o.status}`);
    test.assert(rt.instances("airship").length === 0, "an Airship was created");
    test.assert(o.result?.checked === ring.length && (o.result?.rejects.liquid ?? 0) === ring.length, "not every ring candidate was checked and refused on water");
    test.assert(changed.length === 0, `${changed.length} land blocks changed`);
    test.succeed();
  } finally {
    world.setDifficulty(difficulty);
    if (w !== undefined) removeWindmill(dim, w);
    if (flooded) await eachQuad((q) => fillBox(dim, { min: [q.min[0], ground, q.min[2]], max: [q.max[0], ground, q.max[2]] }, "minecraft:grass_block"));
    unloadW();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(6000)
  .tag("andrew");

export const AIRSHIP_BODY_TESTS = ["airship_body_site", "airship_linked_ring", "airship_linked_over_windmill", "airship_linked_no_merge", "airship_linked_ring_invalid"];

log(`registered ${AIRSHIP_BODY_TESTS.length} airship body test(s): ${AIRSHIP_BODY_TESTS.join(" ")}`);
