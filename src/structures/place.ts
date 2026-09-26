// The step where a reserved candidate becomes a building (L0-strf-p003) and
// the body hooks after it (L0-strf-p004): clear, place, then chests, guards,
// the linked attempt. Every step runs only from its predecessor state, so a
// chunk unload or restart mid-way resumes where it stopped. The engine comes
// in through PlaceWorld, so node tests drive the same code over a fake world.

import type { BlockVolume, Dimension, StructureManager, StructureRotation } from "@minecraft/server";
import { type Box, boxOf, clearBox } from "./clear";
import type { Instance, Registry, Vec3 } from "./registry";
import { ENGINE_ROTATION, rotatedSize, toWorld } from "./rotate";
import { type SiteGate, coveredChunks } from "./site";

const CHUNK = 16;

/** Extras keys on the instance record. */
export const CHESTS_FILLED = "lc";
export const LINKED_TRIED = "la";

export interface ChestPoint {
  /** Template-local, unrotated. */
  local: Vec3;
  table: string;
}

export interface InitCtx {
  instance: Instance;
  /** Unrotated template size. */
  templateSize: Vec3;
  /** World position of a template-local point. */
  at(local: Vec3): Vec3;
}

export interface ChestCtx extends InitCtx {
  index: number;
  table: string;
  pos: Vec3;
}

/** What a structure body registers for placement (L0-strf-e001). */
export interface StructureBody {
  templateId: string;
  /** Air-fill the box before placing; with `fromY`, only from that template-local Y up. */
  clear?: boolean | { fromY: number };
  chests: readonly ChestPoint[];
  /** Spawns the one-time guards; runs once, from `looted`. */
  guards?(ctx: InitCtx): void;
  /** The Windmill's linked Airship attempt; tried at most once per instance. */
  linked?(ctx: InitCtx): void;
}

export interface PlaceHooks {
  /** loot.fillChest: fills the chest at `ctx.pos`; must write fixed slots, a crash may repeat one chest. */
  fillChest(ctx: ChestCtx): void;
}

export interface PlaceWorld {
  hasTemplate(id: string): boolean;
  isLoaded(x: number, z: number): boolean;
  place(id: string, origin: Vec3, rot: Instance["rot"]): void;
  fill(slice: Box): void;
}

export type PlaceResult = "placed" | "pending" | "rejected" | "skipped" | "failed";

export class Placer {
  constructor(
    private readonly registry: Registry,
    private readonly world: PlaceWorld,
    private readonly bodies: Readonly<Record<string, StructureBody>>,
    private readonly hooks: PlaceHooks,
    private readonly log: (msg: string) => void = () => {}
  ) {}

  private body(inst: Pick<Instance, "def" | "id">): StructureBody {
    const b = this.bodies[inst.def];
    if (b === undefined) throw new Error(`strf place: no body for "${inst.def}" (${inst.id})`);
    return b;
  }

  /** Every chunk under the box plus the collision margin (L0-strf-r007). */
  loaded(inst: Instance): boolean {
    return coveredChunks(inst.origin[0], inst.origin[2], inst.size[0], inst.size[2]).every(([cx, cz]) =>
      this.world.isLoaded(cx * CHUNK, cz * CHUNK)
    );
  }

  /** The box the clear covers; never outside the instance's own footprint. */
  clearArea(inst: Instance): Box | undefined {
    const c = this.body(inst).clear;
    if (c === undefined || c === false) return undefined;
    const box = boxOf(inst.origin, inst.size);
    if (c !== true) box.min[1] = Math.min(box.max[1] + 1, inst.origin[1] + Math.max(0, c.fromY));
    return box.min[1] > box.max[1] ? undefined : box;
  }

  /** The world writes of the place step: clear, then place. The SiteGate.occupy callback. */
  readonly write = (inst: Instance): void => {
    const body = this.body(inst);
    const area = this.clearArea(inst);
    if (area !== undefined) clearBox(area, (s) => this.world.fill(s));
    this.world.place(body.templateId, inst.origin, inst.rot);
  };

  /**
   * The place step. A missing template fails the record before anything is
   * written; with a gate the site is rechecked first (L0-strf-r007), without
   * one only the loaded gate applies.
   */
  place(inst: Instance, gate?: SiteGate): PlaceResult {
    if (inst.state !== "planned") return "skipped";
    const body = this.body(inst);
    if (!this.world.hasTemplate(body.templateId)) {
      this.registry.fail(inst, "template-missing");
      this.log(`strf place: template ${body.templateId} not found, ${inst.id} cancelled`);
      return "failed";
    }
    if (gate !== undefined) return gate.occupy(inst, this.write).kind;
    if (!this.loaded(inst)) return "pending";
    return this.registry.runStep(inst, "place", this.write) === "ran" ? "placed" : "skipped";
  }

  /**
   * Chests, guards, the linked attempt, `done` — each from its own predecessor
   * state. Returns the state reached, or `pending` with nothing run when part
   * of the footprint is not loaded.
   */
  init(inst: Instance): Instance["state"] | "pending" {
    if (!this.loaded(inst)) return "pending";
    const body = this.body(inst);
    const ctx = (current: Instance): InitCtx => {
      const templateSize = rotatedSize(current.size, current.rot);
      return { instance: current, templateSize, at: (p) => toWorld(current.origin, p, templateSize, current.rot) };
    };

    this.registry.runStep(inst, "loot", (current) => {
      const c = ctx(current);
      // Progress is persisted per chest: a resume never hands out a second set.
      for (let i = Number(current.extras[CHESTS_FILLED] ?? 0); i < body.chests.length; i++) {
        const chest = body.chests[i];
        this.hooks.fillChest({ ...c, index: i, table: chest.table, pos: c.at(chest.local) });
        this.registry.setExtra(inst, CHESTS_FILLED, i + 1);
      }
    });
    this.registry.runStep(inst, "guard", (current) => body.guards?.(ctx(current)));
    this.registry.runStep(inst, "finish", (current) => {
      if (body.linked === undefined || current.extras[LINKED_TRIED] === true) return;
      // Marked before the attempt: "at most once" wins over "surely once".
      this.registry.setExtra(inst, LINKED_TRIED, true);
      body.linked(ctx(current));
    });
    return this.registry.get(inst.dim, inst.origin, inst.id)?.state ?? inst.state;
  }

  /** Place, then init in the same call when the place step ran now or earlier. */
  run(inst: Instance, gate?: SiteGate): { place: PlaceResult; state: Instance["state"] | "pending" } {
    const place = this.place(inst, gate);
    const now = this.registry.get(inst.dim, inst.origin, inst.id) ?? inst;
    if (now.state === "planned" || now.state === "failed") return { place, state: now.state === "failed" ? "failed" : "pending" };
    return { place, state: this.init(now) };
  }
}

// ------------------------------------------------------------ engine adapter

export interface PlaceEngineApi {
  structureManager: StructureManager;
  BlockVolume: typeof BlockVolume;
  StructureRotation: typeof StructureRotation;
}

export function engineWorld(dim: Dimension, api: PlaceEngineApi): PlaceWorld {
  const minY = dim.heightRange.min;
  return {
    // getPackStructureIds() returns [] for pack structures on 2.10.0; get() is the only existence check.
    hasTemplate: (id) => api.structureManager.get(id) !== undefined,
    isLoaded: (x, z) => dim.isChunkLoaded({ x, y: minY, z }),
    place: (id, o, rot) =>
      api.structureManager.place(id, dim, { x: o[0], y: o[1], z: o[2] }, {
        rotation: api.StructureRotation[ENGINE_ROTATION[rot]],
        includeEntities: false,
      }),
    fill: (s) =>
      dim.fillBlocks(
        new api.BlockVolume({ x: s.min[0], y: s.min[1], z: s.min[2] }, { x: s.max[0], y: s.max[1], z: s.max[2] }),
        "minecraft:air"
      ),
  };
}
