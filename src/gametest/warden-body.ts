// The Mini Warden City body on a real engine (§13.2, §13.4, §13.6, L0-wrdn):
// the natural roll on a buried site built in the flat test world, its top on
// Y −45…−35 and its bottom over the world floor measured from the blocks, a
// draw that would reach the floor rejected before any write; both spots — the city and the surface
// marker — loaded and judged before the first write, either one cancelling the
// candidate; 40 chests of vanilla chests/ancient_city judged by their
// contents; no Warden and no guard; a restart that neither adds chests nor
// refills a plundered one. Every test restores the flat world it built on.

import { BlockTypes, BlockVolume, type Dimension, EnchantmentType, ItemStack, StructureRotation, type Vector3, world } from "@minecraft/server";
import { Test, registerAsync } from "@minecraft/server-gametest";
import { protectLegendariesIn } from "../legendary/recovery";
import { MARKER_SPOT, markerCells } from "../structures/bodies/warden-city";
import { BODIES } from "../structures/bodies";
import { type Box, boxOf, sliceBox } from "../structures/clear";
import { ROLL_DEFS, type RollDef } from "../structures/config";
import { ANCIENT_CITY } from "../structures/loot";
import { ARMOR_SLOTS, CATEGORIES } from "../structures/loot-table";
import { CHESTS_FILLED, GUARDS_SPAWNED } from "../structures/place";
import { COLLISION_MARGIN, type Instance, type Vec3, SALT_KEY, clearTestHook, installTestHook } from "../structures/registry";
import { PROFILES, depth } from "../structures/profiles";
import { type Candidate, buildCandidate, rollUnit } from "../structures/roll";
import { toWorld } from "../structures/rotate";
import { type StrfEngine, StrfRuntime, engineStrf } from "../structures/runtime";
import { centreRing, coveredChunks } from "../structures/site";
import { MemoryStore } from "../structures/store";
import wardenCityTemplate, { WARDEN_CITY_SIZE } from "../structures/templates/warden-city";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const CHUNK = 16;
const GUARD_TAG = "andrew:guard:";
/** The flat world's grass; everything above it is built by the test and removed again. */
const FLAT_GRASS = -61;
/** The Overworld's lowest block: the flat world's bedrock, never touched. A city may reach down to one above it. */
const WORLD_FLOOR = -64;
/** Grass of the built site: six blocks of rock and one of dirt over the highest possible city top. */
const SURFACE = -28;
const SIZE: Vec3 = [...WARDEN_CITY_SIZE];

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);
const v = (p: Vec3): Vector3 => ({ x: p[0], y: p[1], z: p[2] });
const engineApi = { world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType, protectLegendaries: protectLegendariesIn };

/** Every block name the template writes: a block of one of these in the world is the city. */
const CITY_TYPES: string[] = [...new Set(Object.values(wardenCityTemplate().blocks).map((b) => b.name))].filter(
  (n) => n !== "minecraft:air" && n !== "minecraft:structure_void"
);
const MARKER_TYPES = ["minecraft:sculk", "minecraft:sculk_vein"];

/** Everything the custom table of loot-table.ts can put in a chest. */
const CUSTOM_ITEMS: ReadonlySet<string> = new Set(
  CATEGORIES.flatMap((c) =>
    c.items !== undefined ? [...c.items] : ["iron", "diamond"].flatMap((mat) => (c.gear === "armor" ? ARMOR_SLOTS : [c.gear ?? ""]).map((k) => `minecraft:${mat}_${k}`))
  )
);

/** Items only chests/ancient_city gives among the tables this add-on uses (§13.6). */
const ANCIENT_MARKS = new Set([
  "minecraft:echo_shard",
  "minecraft:disc_fragment_5",
  "minecraft:sculk_catalyst",
  "minecraft:sculk_sensor",
  "minecraft:sculk",
  "minecraft:music_disc_otherside",
  "minecraft:recovery_compass",
  "minecraft:ward_armor_trim_smithing_template",
  "minecraft:silence_armor_trim_smithing_template",
  "minecraft:soul_torch",
  "minecraft:amethyst_shard",
  "minecraft:candle",
  "minecraft:glow_berries",
]);

function fillBox(dim: Dimension, box: Box, block: string): void {
  for (const s of sliceBox(box)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), block);
}

const unique = (label: string): string => `gt-wr-${label}-${Date.now()}`;

function farChunk(test: Test, offset: number): [number, number] {
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  return [Math.floor(b.x / CHUNK) + offset, Math.floor(b.z / CHUNK)];
}

/** What the engine saw at the first world write of each record, and every chest fill. */
interface Watch {
  firstWrites: string[];
  fills: string[];
}

/**
 * The production engine with the Placer's writes observed: at the template
 * write, the record's state and the loaded state of every chunk of both spots
 * are read from the engine itself.
 */
function watched(dim: Dimension, rtRef: { rt?: StrfRuntime }, watch: Watch): StrfEngine {
  const base = engineStrf(engineApi);
  return {
    ...base,
    placeWorld(d) {
      const pw = base.placeWorld(d);
      if (pw === undefined) return undefined;
      return {
        ...pw,
        place(id, origin, rot) {
          const rec = rtRef.rt?.registry.allInstances().find((i) => i.origin.join() === origin.join());
          const size = rec?.size ?? SIZE;
          const city = coveredChunks(origin[0], origin[2], size[0], size[2]);
          const marker = markerCells({ x: origin[0], z: origin[2], rot });
          const loadedCity = city.filter(([cx, cz]) => dim.isChunkLoaded({ x: cx * CHUNK, y: 0, z: cz * CHUNK })).length;
          const loadedMarker = marker.filter((k) => dim.isChunkLoaded({ x: k.x, y: 0, z: k.z })).length;
          watch.firstWrites.push(`${rec?.id} record=${rec?.state} city chunks loaded ${loadedCity}/${city.length} marker columns loaded ${loadedMarker}/${marker.length}`);
          pw.place(id, origin, rot);
        },
      };
    },
    hooks(d) {
      const h = base.hooks(d);
      return { ...h, fillChest: (ctx) => (watch.fills.push(`${ctx.instance.id}#${ctx.index} ${ctx.table}`), h.fillChest(ctx)) };
    },
  };
}

function runtime(salt: string, watch: Watch, dim: Dimension, store = new MemoryStore()): StrfRuntime {
  if (store.get(SALT_KEY) === undefined) store.set(SALT_KEY, salt);
  const ref: { rt?: StrfRuntime } = {};
  ref.rt = new StrfRuntime(store, watched(dim, ref, watch), { log });
  return ref.rt;
}

const cityDef = (rt: StrfRuntime): RollDef => {
  const d = rt.defs.find((x) => x.id === "warden_city");
  if (d === undefined) throw new Error("no warden_city roll def");
  return d;
};

/**
 * The worked area of a candidate: its footprint plus the margin and two more
 * columns, from just over the bedrock up: a 20-high city reaches through the
 * flat world's own dirt and grass, which restore() lays back.
 */
const areaOf = (c: Candidate): Box => ({
  min: [c.x - COLLISION_MARGIN - 2, WORLD_FLOOR + 1, c.z - COLLISION_MARGIN - 2],
  max: [c.x + c.size[0] + COLLISION_MARGIN + 1, SURFACE + 3, c.z + c.size[2] + COLLISION_MARGIN + 1],
});

/** Stone over the flat world's grass up to a dirt layer and a grass surface at `surface`. */
function buildSite(dim: Dimension, area: Box, surface: number): void {
  fillBox(dim, area, "minecraft:air");
  fillBox(dim, { min: area.min, max: [area.max[0], surface - 2, area.max[2]] }, "minecraft:stone");
  fillBox(dim, { min: [area.min[0], surface - 1, area.min[2]], max: [area.max[0], surface - 1, area.max[2]] }, "minecraft:dirt");
  fillBox(dim, { min: [area.min[0], surface, area.min[2]], max: [area.max[0], surface, area.max[2]] }, "minecraft:grass_block");
}

/** The flat world's layers from the area's bottom to its grass, read before the site is built over them. */
function flatLayers(dim: Dimension, area: Box): string[] {
  const out: string[] = [];
  for (let y = area.min[1]; y <= FLAT_GRASS; y++) {
    const t = dim.getBlock({ x: area.min[0], y, z: area.min[2] })?.typeId;
    if (t === undefined) throw new Error(`flat layer ${y} unloaded`);
    out.push(t);
  }
  return out;
}

/** Chests emptied first so the air fill drops nothing; the flat layers laid back; then every mob and item in reach. */
function restore(dim: Dimension, area: Box, inst: Instance | undefined, layers: readonly string[]): void {
  if (inst !== undefined) for (const p of chestCells(inst)) dim.getBlock(v(p))?.getComponent("minecraft:inventory")?.container?.clearAll();
  fillBox(dim, area, "minecraft:air");
  layers.forEach((t, i) => {
    const y = area.min[1] + i;
    if (t !== "minecraft:air") fillBox(dim, { min: [area.min[0], y, area.min[2]], max: [area.max[0], y, area.max[2]] }, t);
  });
  const centre: Vec3 = [(area.min[0] + area.max[0]) / 2, (area.min[1] + area.max[1]) / 2, (area.min[2] + area.max[2]) / 2];
  for (const e of dim.getEntities({ location: v(centre), maxDistance: 64 })) if (e.typeId !== "minecraft:player") e.remove();
}

const chestCells = (inst: Instance): Vec3[] => BODIES.warden_city.chests.map((c) => toWorld(inst.origin, c.local, SIZE, inst.rot));

/** Whether any block of `types` stands in the box. */
const anyOf = (dim: Dimension, box: Box, types: string[]): boolean =>
  sliceBox(box).some((s) => dim.containsBlock(new BlockVolume(v(s.min), v(s.max)), { includeTypes: types }, false));

/** The highest and lowest Y of the footprint where a city block stands, one layer query per Y. */
function measureCity(dim: Dimension, c: Pick<Candidate, "x" | "z" | "size">): { top: number; bottom: number } | undefined {
  const layer = (y: number): boolean => anyOf(dim, { min: [c.x, y, c.z], max: [c.x + c.size[0] - 1, y, c.z + c.size[2] - 1] }, CITY_TYPES);
  let top = SURFACE - 1;
  while (top > WORLD_FLOOR && !layer(top)) top--;
  if (top === WORLD_FLOOR) return undefined;
  let bottom = top;
  while (bottom - 1 >= WORLD_FLOOR && layer(bottom - 1)) bottom--;
  return { top, bottom };
}

/**
 * A fresh salt whose depth draw for the chunk's city either fits over the
 * world floor (`fits`) or would reach it: the check itself reads the same draw.
 */
function saltFor(label: string, cx: number, cz: number, fits: boolean): string {
  const def = ROLL_DEFS.find((d) => d.id === "warden_city");
  const spec = PROFILES.warden_city.depth;
  if (def === undefined || spec === undefined) throw new Error("no warden_city def or depth profile");
  for (let i = 0; i < 500; i++) {
    const salt = unique(`${label}${i}`);
    const c = buildCandidate(salt, "o", cx, cz, def);
    if (depth(c.size[1], rollUnit(salt, "o", c.x, c.z, def.id, "depth"), WORLD_FLOOR, spec).ok === fits) return salt;
  }
  throw new Error(`no salt ${fits ? "fits" : "reaches the floor"} for ${cx},${cz}`);
}

/** One chest's stacks, "typeId x amount" plus enchantments, sorted: slot order is random and does not count as different loot. */
function chestLoot(dim: Dimension, p: Vec3): string[] {
  const c = dim.getBlock(v(p))?.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error(`no chest at ${p.join(",")}`);
  const out: string[] = [];
  for (let i = 0; i < c.size; i++) {
    const s = c.getItem(i);
    if (s === undefined) continue;
    const ench = s.getComponent("minecraft:enchantable")?.getEnchantments().map((e) => `${e.type.id}${e.level}`).join("+");
    out.push(`${s.typeId}x${s.amount}${ench ? `[${ench}]` : ""}`);
  }
  return out.sort();
}

/** "minecraft:experience_bottlex3[…]" → "minecraft:experience_bottle": the amount's x is the last one before the digits. */
const itemOf = (stack: string): string => /^(.*)x\d+(\[.*\])?$/.exec(stack)?.[1] ?? stack;

function force(cx: number, cz: number): void {
  installTestHook({ outcomes: [["windmill", "o", cx, cz, false], ["airship", "o", cx, cz, false], ["warden_city", "o", cx, cz, true]] });
}

/** Natural generation of the chunk: its roll forced to hit, then the placement queue drained. */
function generate(rt: StrfRuntime, cx: number, cz: number): { outcome: string; reason?: string } {
  force(cx, cz);
  let r;
  try {
    r = rt.discovery.evaluateChunk("o", cx, cz).results.find((x) => x.def === "warden_city");
  } finally {
    clearTestHook();
  }
  rt.pumpPlacement(10);
  return { outcome: r?.outcome ?? "none", reason: r?.reason };
}

// ------------------------------------------------ AC1 + AC3 + AC4 + AC5 + AC6: one city, start to restart

registerAsync("andrew", "warden_body_generate", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const [cx, cz] = farChunk(test, 420);
  const watch: Watch = { firstWrites: [], fills: [] };
  const store = new MemoryStore();
  const rt = runtime(saltFor("gen", cx, cz, true), watch, dim, store);
  const cand = buildCandidate(rt.registry.salt(), "o", cx, cz, cityDef(rt));
  const area = areaOf(cand);
  const unload = await loadBox(test, dim, "andrew_gt_wr_gen", area);
  const layers = flatLayers(dim, area);
  let inst: Instance | undefined;
  try {
    buildSite(dim, area, SURFACE);
    await test.idle(2);
    const res = generate(rt, cx, cz);
    inst = rt.instances("warden_city")[0];
    test.assert(res.outcome === "planned" && inst !== undefined, `roll: ${JSON.stringify(res)}`);
    const city = inst!;
    test.assert(city.state === "done", `state ${city.state}`);

    // AC1: the top read from the blocks.
    const m = measureCity(dim, cand);
    const recTop = city.origin[1] + city.size[1] - 1;
    log(
      `warden generate AC1 RESULT ${city.id} rot ${city.rot} origin ${city.origin.join(",")}: measured city top Y=${m?.top} bottom Y=${m?.bottom} ` +
        `(height ${m === undefined ? "-" : m.top - m.bottom + 1} of ${SIZE[1]}), record top ${recTop}, allowed −45…−35, floor ${WORLD_FLOOR}; surface ${SURFACE}; first write: ${watch.firstWrites.join(" | ")}`
    );
    test.assert(m !== undefined && m.top >= -45 && m.top <= -35 && m.top === recTop, `measured top ${m?.top}, record ${recTop}`);
    // Whole, not cut by the floor: every layer of the template stands in the world, over the bedrock.
    test.assert(m !== undefined && m.bottom > WORLD_FLOOR && m.top - m.bottom + 1 === SIZE[1] && m.bottom === city.origin[1], `measured ${m?.bottom}…${m?.top}, origin ${city.origin[1]}`);

    // The marker on the surface, over the centre.
    const cells = markerCells({ x: city.origin[0], z: city.origin[2], rot: city.rot });
    const markerOk = cells.filter((k) =>
      k.kind === "sculk" ? dim.getBlock({ x: k.x, y: SURFACE, z: k.z })?.typeId === "minecraft:sculk" : dim.getBlock({ x: k.x, y: SURFACE + 1, z: k.z })?.typeId === "minecraft:sculk_vein"
    ).length;
    log(`warden generate marker: ${markerOk}/${cells.length} cells on the surface at Y=${SURFACE}, centre ${cells.find((k) => k.center)?.x},${cells.find((k) => k.center)?.z}`);
    test.assert(markerOk === cells.length, `marker ${markerOk}/${cells.length}`);

    // AC3 + AC4: the chests by their contents.
    const loot = chestCells(city).map((p) => chestLoot(dim, p));
    loot.forEach((l, i) => log(`warden chest ${i} at ${chestCells(city)[i].join(",")}: ${l.join(" ")}`));
    const empty = loot.filter((l) => l.length === 0).length;
    const distinct = new Set(loot.map((l) => l.join(" "))).size;
    const items = new Set(loot.flat().map(itemOf));
    const marks = [...items].filter((i) => ANCIENT_MARKS.has(i));
    const notCustom = [...items].filter((i) => !CUSTOM_ITEMS.has(i));
    const tables = new Set(watch.fills.map((f) => f.split(" ")[1]));
    log(
      `warden chests AC3 RESULT ${loot.length} chests, ${empty} empty, ${distinct} distinct contents; fills ${watch.fills.length} tables ${[...tables].join(",")}; ` +
        `ancient-city items ${marks.join(",") || "none"}; record lc=${String(city.extras[CHESTS_FILLED])}`
    );
    log(`warden chests AC4 RESULT items the custom table cannot give: ${notCustom.length}/${items.size}: ${notCustom.join(",")}`);
    test.assert(loot.length === 40 && empty === 0, `${empty} empty of ${loot.length}`);
    test.assert(distinct === 40, `only ${distinct} distinct chest contents`);
    test.assert(watch.fills.length === 40 && tables.size === 1 && tables.has(ANCIENT_CITY), `fills: ${watch.fills.join(" | ")}`);
    test.assert(marks.length > 0, "no item of the Ancient City table in any chest");
    test.assert(notCustom.length > 0, "every item could have come from the custom table");

    // AC5: after full initialisation and a while of ticking, no Warden and no guard.
    await test.idle(40);
    const box = boxOf(city.origin, city.size);
    const centre: Vec3 = [(box.min[0] + box.max[0]) / 2, (box.min[1] + box.max[1]) / 2, (box.min[2] + box.max[2]) / 2];
    const near = dim.getEntities({ location: v(centre), maxDistance: 64 }).filter((e) => e.typeId !== "minecraft:player" && e.typeId !== "minecraft:item");
    const wardens = dim.getEntities({ location: v(centre), maxDistance: 64, type: "minecraft:warden" }).length;
    const guards = dim.getEntities({ location: v(centre), maxDistance: 64 }).filter((e) => e.getTags().some((t) => t.startsWith(GUARD_TAG))).length;
    const ownTag = dim.getEntities({ tags: [`${GUARD_TAG}${city.id}`] }).length;
    log(
      `warden guards AC5 RESULT wardens within 64 ${wardens}, guard-tagged mobs near ${guards}, with the city's own tag ${ownTag}, ` +
        `mobs near: ${[...new Set(near.map((e) => e.typeId))].join(",") || "none"}; gs=${String(city.extras[GUARDS_SPAWNED])}; body.guards ${typeof BODIES.warden_city.guards}`
    );
    test.assert(wardens === 0 && guards === 0 && ownTag === 0 && city.extras[GUARDS_SPAWNED] === undefined && BODIES.warden_city.guards === undefined, "a Warden or a guard");

    // AC6: plunder one chest, then a script restart over the same records.
    const plundered = chestCells(city)[3];
    dim.getBlock(v(plundered))?.getComponent("minecraft:inventory")?.container?.clearAll();
    const before = chestCells(city).map((p) => chestLoot(dim, p).join(" "));
    const watch2: Watch = { firstWrites: [], fills: [] };
    const rt2 = runtime("unused", watch2, dim, store);
    const resumed = rt2.resumeUnfinished();
    rt2.pumpPlacement(10);
    const again = generate(rt2, cx, cz);
    const byHand = rt2.placeAt("warden_city", "o", cand.x + (SIZE[0] - 1) / 2, cand.z + (SIZE[2] - 1) / 2, city.rot, { id: city.id });
    await test.idle(5);
    const after = chestCells(city).map((p) => chestLoot(dim, p).join(" "));
    let chestBlocks = 0;
    for (let x = box.min[0]; x <= box.max[0]; x++) {
      for (let y = box.min[1]; y <= box.max[1]; y++)
        for (let z = box.min[2]; z <= box.max[2]; z++) if (dim.getBlock({ x, y, z })?.typeId === "minecraft:chest") chestBlocks++;
      await test.idle(1);
    }
    const changed = before.filter((b, i) => after[i] !== b).length;
    log(
      `warden restart AC6 RESULT resumed ${resumed}; roll again -> ${again.outcome}; place by hand -> ${byHand.kind}; writes ${watch2.firstWrites.length}, fills ${watch2.fills.length}; ` +
        `chest blocks in the box ${chestBlocks}; plundered chest ${plundered.join(",")} now ${after[3] === "" ? "empty" : after[3]}; chests changed ${changed}; records ${rt2.instances("warden_city").length}`
    );
    test.assert(resumed === 0 && again.outcome === "existing" && byHand.kind === "blocked", `restart: ${resumed} ${again.outcome} ${byHand.kind}`);
    test.assert(watch2.firstWrites.length === 0 && watch2.fills.length === 0, "the restart wrote or filled");
    test.assert(chestBlocks === 40 && after[3] === "" && changed === 0, `chests ${chestBlocks}, plundered ${after[3]}, changed ${changed}`);
    test.succeed();
  } finally {
    restore(dim, area, inst, layers);
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");

// ------------------------------------------------ AC1 + AC2: both spots gate the candidate, before any write

interface SiteCase {
  label: string;
  offset: number;
  surface: number;
  /** Shapes the built site; returns a note for the log. */
  build(dim: Dimension, c: Candidate): string;
  expect: "planned" | "rejected" | "pending";
  reason?: string;
  /** Whether the salt's depth draw fits over the world floor; every case but "floor" needs it to. */
  fits?: false;
}

const centreOf = (c: Candidate): { x: number; z: number } => {
  const k = markerCells(c).find((m) => m.center);
  if (k === undefined) throw new Error("marker has no centre");
  return k;
};

const SITE_CASES: readonly SiteCase[] = [
  {
    label: "marker_water",
    offset: 430,
    surface: SURFACE,
    // Water in one marker cell the box's own centre-ring sampling never reads.
    build(dim, c) {
      const ring = new Set(centreRing(c.x, c.z, c.size[0], c.size[2]).map((p) => p.join(",")));
      const k = markerCells(c).find((m) => !m.center && !ring.has(`${m.x},${m.z}`));
      if (k === undefined) throw new Error("every marker cell is sampled by the ring");
      dim.getBlock({ x: k.x, y: SURFACE, z: k.z })?.setType("minecraft:water");
      return `water at ${k.x},${SURFACE},${k.z}`;
    },
    expect: "rejected",
    reason: "marker:liquid",
  },
  {
    label: "marker_build",
    offset: 436,
    surface: SURFACE,
    // Planks on the surface next to the marker: far above the city box and its margin.
    build(dim, c) {
      const k = centreOf(c);
      dim.getBlock({ x: k.x + 3, y: SURFACE + 1, z: k.z })?.setType("minecraft:oak_planks");
      return `oak_planks at ${k.x + 3},${SURFACE + 1},${k.z}`;
    },
    expect: "rejected",
    reason: "marker:collision:player",
  },
  {
    label: "city_build",
    offset: 442,
    surface: SURFACE,
    // Planks deep in the city box: the marker is fine, the city is not.
    build(dim, c) {
      const k = centreOf(c);
      // −45 lies between every possible bottom (−63…−54) and top (−44…−35).
      dim.getBlock({ x: k.x, y: -45, z: k.z })?.setType("minecraft:oak_planks");
      return `oak_planks at ${k.x},-45,${k.z}`;
    },
    expect: "rejected",
    reason: "collision:player",
  },
  {
    label: "shallow",
    offset: 448,
    // Ground at −50: the city's top would stand above it, the marker has nothing to cover.
    surface: -50,
    build: () => "ground at -50",
    expect: "rejected",
    reason: "marker:no-cover",
  },
  {
    label: "floor",
    offset: 460,
    surface: SURFACE,
    // Flat dry land, but the draw puts the top at −45: the 20-high city would reach the bedrock.
    build: () => "flat dry land, top drawn at -45",
    expect: "rejected",
    reason: "floor",
    fits: false,
  },
  {
    label: "dry",
    offset: 454,
    surface: SURFACE,
    build: () => "flat dry land",
    expect: "planned",
  },
];

registerAsync("andrew", "warden_body_site", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const verdicts: string[] = [];

  // Unloaded: the candidate waits, reads nothing, writes nothing.
  {
    const [cx, cz] = farChunk(test, 470);
    const watch: Watch = { firstWrites: [], fills: [] };
    const rt = runtime(unique("unloaded"), watch, dim);
    const cand = buildCandidate(rt.registry.salt(), "o", cx, cz, cityDef(rt));
    const cityLoaded = coveredChunks(cand.x, cand.z, cand.size[0], cand.size[2]).filter(([x, z]) => dim.isChunkLoaded({ x: x * CHUNK, y: 0, z: z * CHUNK })).length;
    const markerLoaded = MARKER_SPOT.columns(cand).filter(([x, z]) => dim.isChunkLoaded({ x, y: 0, z })).length;
    const res = generate(rt, cx, cz);
    const ok = res.outcome === "pending" && cityLoaded === 0 && markerLoaded === 0 && rt.instances().length === 0 && watch.firstWrites.length === 0;
    log(`warden site unloaded: ${cand.id} city chunks loaded ${cityLoaded}, marker columns loaded ${markerLoaded} -> ${res.outcome}; records ${rt.instances().length}; writes ${watch.firstWrites.length}`);
    verdicts.push(`unloaded:${ok ? "ok" : "FAIL"}`);
  }

  for (const sc of SITE_CASES) {
    const [cx, cz] = farChunk(test, sc.offset);
    const watch: Watch = { firstWrites: [], fills: [] };
    const rt = runtime(saltFor(sc.label, cx, cz, sc.fits ?? true), watch, dim);
    const cand = buildCandidate(rt.registry.salt(), "o", cx, cz, cityDef(rt));
    const area = areaOf(cand);
    const unload = await loadBox(test, dim, `andrew_gt_wr_${sc.label}`, area);
    const layers = flatLayers(dim, area);
    let inst: Instance | undefined;
    try {
      buildSite(dim, area, sc.surface);
      const note = sc.build(dim, cand);
      await test.idle(2);
      const res = generate(rt, cx, cz);
      await test.idle(2);
      inst = rt.instances("warden_city")[0];
      const written = anyOf(dim, area, [...CITY_TYPES, ...MARKER_TYPES]);
      let ok = res.outcome === sc.expect;
      let extra = "";
      if (sc.expect === "rejected") ok = ok && res.reason === sc.reason && inst === undefined && !written && watch.firstWrites.length === 0;
      else if (inst !== undefined) {
        const m = measureCity(dim, cand);
        const top = inst.origin[1] + inst.size[1] - 1;
        extra = `; ${inst.id} state ${inst.state}, measured top Y=${m?.top} (record ${top}); first write: ${watch.firstWrites.join(" | ")}`;
        const allLoaded = /city chunks loaded (\d+)\/\1 marker columns loaded (\d+)\/\2$/.test(watch.firstWrites[0] ?? "");
        ok = ok && inst.state === "done" && m?.top === top && top >= -45 && top <= -35 && watch.firstWrites.length === 1 && / record=planned /.test(watch.firstWrites[0]) && allLoaded;
      } else ok = false;
      log(
        `warden site ${sc.label}: ${cand.id} rot ${cand.rot} at ${cand.x},${cand.z}; ${note} -> ${res.outcome} ${res.reason ?? ""}; ` +
          `records ${rt.instances().length}; city or marker blocks in the area ${written}${extra}`
      );
      verdicts.push(`${sc.label}:${ok ? "ok" : "FAIL"}`);
    } finally {
      restore(dim, area, inst, layers);
      unload();
    }
    // A ticking area added in the tick another was removed never loads its chunks (measured on BDS 1.26.51.1).
    await test.idle(20);
  }
  log(`warden site AC2 RESULT ${verdicts.join(" ")}`);
  test.assert(verdicts.every((x) => x.endsWith(":ok")), `warden site: ${verdicts.join(" ")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(4000)
  .tag("andrew");

export const WARDEN_BODY_TESTS = ["warden_body_generate", "warden_body_site"];

log(`registered ${WARDEN_BODY_TESTS.length} warden body test(s): ${WARDEN_BODY_TESTS.join(" ")}`);
