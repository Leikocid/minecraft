// One assembly of the generation pipeline (L0-strf-p001..p005): registry, site
// check, discovery, placement and loot. Natural generation and the operator's
// `place` share it, so a structure built by hand goes through the same plan →
// place → loot → guard → done steps as one found by the roll. Engine objects
// come in through StrfEngine; node tests drive it over fakes.

import type {
  BlockTypes,
  BlockVolume,
  Dimension,
  EnchantmentType,
  ItemStack,
  StructureRotation,
  World,
} from "@minecraft/server";
import { type TypeBody, BODIES, naturalDefs } from "./bodies";
import type { RollDef, StructureId } from "./config";
import { Discovery, type PlayerPos, type SiteVerdict } from "./discovery";
import { Loot } from "./loot";
import { type PlaceHooks, type PlaceWorld, Placer, engineWorld } from "./place";
import { type DimShort, type Instance, type Rotation, type Vec3, Registry } from "./registry";
import { type Candidate, effectiveChance, rotatedSize } from "./roll";
import { type BlockView, SiteChecker, SiteGate, dimensionView } from "./site";
import type { KeyValueStore } from "./store";

const CHUNK = 16;
/** Queued natural placements run per pump; each is a template place plus its chests. */
const PLACE_PER_PUMP = 1;

export interface StrfEngine {
  view(dim: DimShort): BlockView | undefined;
  placeWorld(dim: DimShort): PlaceWorld | undefined;
  hooks(dim: DimShort): PlaceHooks;
}

export type PlaceOutcome =
  | { kind: "wrong-dimension"; need: DimShort }
  | { kind: "not-loaded" }
  | { kind: "rejected"; reason: string }
  | { kind: "blocked"; by: Instance }
  | { kind: "failed"; reason: string; instance: Instance }
  | { kind: "placed"; instance: Instance };

interface Queued {
  id: string;
  dim: DimShort;
  origin: Vec3;
}

export interface StrfOptions {
  bodies?: Readonly<Record<string, TypeBody>>;
  log?: (msg: string) => void;
}

export class StrfRuntime {
  readonly registry: Registry;
  readonly checker: SiteChecker;
  readonly gate: SiteGate;
  readonly discovery: Discovery;
  readonly defs: readonly RollDef[];
  private readonly bodies: Readonly<Record<string, TypeBody>>;
  private readonly log: (msg: string) => void;
  private readonly placers = new Map<DimShort, Placer>();
  private readonly queue = new Map<string, Queued>();

  constructor(
    store: KeyValueStore,
    private readonly engine: StrfEngine,
    opts: StrfOptions = {}
  ) {
    this.bodies = opts.bodies ?? BODIES;
    this.log = opts.log ?? (() => {});
    this.registry = new Registry(store, this.log);
    this.checker = new SiteChecker((d) => engine.view(d), () => this.registry.salt(), { registry: this.registry, log: this.log });
    this.gate = new SiteGate(this.checker, this.registry, () => this.discovery.stats.slices, this.log);
    this.defs = naturalDefs(this.bodies);
    this.discovery = new Discovery(this.registry, this.site, { defs: this.defs, log: this.log });
  }

  /** The Site handed to discovery: the gate's check, plus a note of what to place once reserved. */
  private readonly site = (cand: Candidate): SiteVerdict => {
    const v = this.gate.site(cand);
    if (v.kind === "valid") this.queue.set(cand.id, { id: cand.id, dim: cand.dim, origin: [cand.x, v.y, cand.z] });
    return v;
  };

  /** Whether any type can roll a hit at all; with none, discovery would only mark chunks as misses. */
  generating(): boolean {
    return this.defs.some((d) => effectiveChance(d) > 0);
  }

  discover(players: Iterable<PlayerPos>, runJob: (job: Generator<void, void, void>) => unknown): void {
    if (!this.generating()) return;
    this.discovery.discover(players);
    this.discovery.pump(runJob);
  }

  /** Records a restart left between `planned` and `done` are queued again. */
  resumeUnfinished(): number {
    let n = 0;
    for (const inst of this.registry.allInstances()) {
      if (inst.state === "done" || inst.state === "failed") continue;
      this.queue.set(inst.id, { id: inst.id, dim: inst.dim, origin: inst.origin });
      n++;
    }
    return n;
  }

  get queued(): number {
    return this.queue.size;
  }

  /** Run queued placements; one whose area is not loaded stays queued. */
  pumpPlacement(limit = PLACE_PER_PUMP): void {
    let ran = 0;
    for (const q of [...this.queue.values()]) {
      if (ran >= limit) return;
      const inst = this.registry.get(q.dim, q.origin, q.id);
      if (inst === undefined || inst.state === "done" || inst.state === "failed") {
        this.queue.delete(q.id);
        continue;
      }
      const placer = this.placer(q.dim);
      if (placer === undefined) continue;
      ran++;
      try {
        const r = placer.run(inst, this.gate);
        if (r.state !== "pending") this.queue.delete(q.id);
      } catch (e) {
        // A throw leaves the record in its last state; the next pump resumes it.
        this.log(`strf runtime: ${q.id} placement threw ${String(e)}`);
      }
    }
  }

  private placer(dim: DimShort): Placer | undefined {
    const hit = this.placers.get(dim);
    if (hit !== undefined) return hit;
    const world = this.engine.placeWorld(dim);
    if (world === undefined) return undefined;
    const p = new Placer(this.registry, world, this.bodies, this.engine.hooks(dim), this.log);
    this.placers.set(dim, p);
    return p;
  }

  isStandIn(type: StructureId): boolean {
    return this.bodies[type]?.standIn !== false;
  }

  /**
   * The operator's `place`: the roll's candidate with the spot given instead
   * of rolled, centred on (x, z). Site check, reservation before the first
   * world write, then the same placement and init steps natural generation
   * runs — in one call, since the caller's area is loaded around them.
   */
  placeAt(type: StructureId, dim: DimShort, x: number, z: number, rot: Rotation): PlaceOutcome {
    const def = this.defs.find((d) => d.id === type);
    if (def === undefined) throw new Error(`strf runtime: no roll def "${type}"`);
    if (def.dim !== dim) return { kind: "wrong-dimension", need: def.dim };
    const size = rotatedSize(def.size, rot);
    const ox = Math.floor(x) - Math.floor(size[0] / 2);
    const oz = Math.floor(z) - Math.floor(size[2] / 2);
    const cx = Math.floor(ox / CHUNK);
    const cz = Math.floor(oz / CHUNK);
    const id = `${type}:${dim}:${cx}:${cz}`;
    const cand: Candidate = { id, def, dim, cx, cz, rot, size, x: ox, z: oz };

    // The site check skips the candidate's own id, so a record that already
    // holds this id is reported here, not silently reused by plan().
    const same = this.registry.get(dim, [ox, 0, oz], id);
    if (same !== undefined) return { kind: "blocked", by: same };

    const v = this.gate.site(cand);
    if (v.kind === "pending") return { kind: "not-loaded" };
    if (v.kind === "rejected") return { kind: "rejected", reason: v.reason };
    const planned = this.registry.plan({ def: type, dim, origin: [ox, v.y, oz], rot, size, id });
    if (!planned.ok) return { kind: "blocked", by: planned.blockedBy };

    const placer = this.placer(dim);
    if (placer === undefined) return { kind: "not-loaded" };
    const r = placer.run(planned.instance, this.gate);
    const now = this.registry.get(dim, planned.instance.origin, id) ?? planned.instance;
    if (now.state === "failed") return { kind: "failed", reason: String(now.extras.why ?? r.place), instance: now };
    if (now.state !== "done") this.queue.set(id, { id, dim, origin: now.origin });
    return { kind: "placed", instance: now };
  }

  /** Every created instance (anything not failed) of a type, or of every type. */
  instances(type?: string): Instance[] {
    return this.registry.allInstances().filter((i) => i.state !== "failed" && (type === undefined || i.def === type));
  }
}

/** Centre of the instance's box, in block coordinates. */
export const centreOf = (inst: Instance): Vec3 => [
  inst.origin[0] + Math.floor(inst.size[0] / 2),
  inst.origin[1],
  inst.origin[2] + Math.floor(inst.size[2] / 2),
];

export function nearest(instances: readonly Instance[], dim: DimShort, at: { x: number; y: number; z: number }): { instance: Instance; distance: number } | undefined {
  let best: { instance: Instance; distance: number } | undefined;
  for (const inst of instances) {
    if (inst.dim !== dim) continue;
    const c = centreOf(inst);
    const distance = Math.hypot(c[0] - at.x, c[1] - at.y, c[2] - at.z);
    if (best === undefined || distance < best.distance) best = { instance: inst, distance };
  }
  return best;
}

// ------------------------------------------------------------ engine adapter

export interface StrfEngineApi {
  world: World;
  BlockVolume: typeof BlockVolume;
  BlockTypes: typeof BlockTypes;
  StructureRotation: typeof StructureRotation;
  ItemStack: typeof ItemStack;
  EnchantmentType: typeof EnchantmentType;
}

const DIMENSION_ID: Readonly<Record<DimShort, string>> = { o: "minecraft:overworld", n: "minecraft:nether" };

/** world.structureManager throws in early execution: build this after worldLoad. */
export function engineStrf(api: StrfEngineApi): StrfEngine {
  const dims = new Map<DimShort, Dimension>();
  const dimension = (d: DimShort): Dimension => {
    let dim = dims.get(d);
    if (dim === undefined) {
      dim = api.world.getDimension(DIMENSION_ID[d]);
      dims.set(d, dim);
    }
    return dim;
  };
  const views = new Map<DimShort, BlockView>();
  return {
    view(d) {
      let v = views.get(d);
      if (v === undefined) {
        v = dimensionView(dimension(d), api);
        views.set(d, v);
      }
      return v;
    },
    placeWorld: (d) => engineWorld(dimension(d), { structureManager: api.world.structureManager, BlockVolume: api.BlockVolume, StructureRotation: api.StructureRotation }),
    hooks: (d) => new Loot(dimension(d), api).hooks,
  };
}
