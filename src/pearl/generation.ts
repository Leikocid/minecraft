// The plate generation (spec v3 §7–§8; L0-xcx34, L0-pear-ru03): a binding claims its cell's generation, the observed
// replacement paths end it, and a binding whose generation is gone does not take its rod anywhere. The decisions are
// in generation-rules.ts; this module is the engine half — world events in, world dynamic properties out.

import { type ItemStack, type PistonActivateAfterEvent, type PlayerInventoryItemChangeAfterEvent, system, world } from "@minecraft/server";
import { type Binding, type Vec3, isPlateType, readBinding } from "./bind-rules";
import {
  type ClaimResult,
  type PlateVerdict,
  type Store,
  bump,
  cellsBroken,
  claim,
  forgetOwner,
  generationOf,
  PISTON_FALLBACK_REACH,
  pistonCells,
  plateVerdict,
  release,
  sameCell,
  watchedCells,
} from "./generation-rules";
import { MARK_KEY } from "./item-rules";
import { isPearlRodStack } from "./item";

/** Counters a GameTest reads to tell which path ended a generation. */
export const genStats = { claims: 0, created: 0, evicted: 0, bumps: 0, releases: 0, pruned: 0, ownerPrunes: 0, pistonChecks: 0, errors: 0 };

/** The world's dynamic properties of this pack (each pack has its own). */
const store: Store = {
  get: (key) => world.getDynamicProperty(key),
  set: (key, value) => world.setDynamicProperty(key, value),
  ids: () => world.getDynamicPropertyIds(),
};

/** Ticks after pistonActivate when the move has settled and a destroyed plate reads gone. */
export const PISTON_SETTLE_TICKS = 4;

function warn(what: string, err: unknown): void {
  genStats.errors++;
  console.warn(`[andrew] pearl rod: ${what} failed: ${err instanceof Error ? err.message : String(err)}`);
}

function bindingOfStack(stack: ItemStack | undefined): Binding | undefined {
  if (stack === undefined || !isPearlRodStack(stack)) return undefined;
  return readBinding((key) => stack.getDynamicProperty(key));
}

/** The generation a binding to `cell` records; called by the binding in the tick it writes the rod. */
export function claimGeneration(dim: string, cell: Vec3, rodId: string, owner: string, previous: Binding | undefined): number {
  const r: ClaimResult = claim(store, dim, cell, rodId, owner, previous);
  genStats.claims++;
  if (r.created) genStats.created++;
  genStats.evicted += r.evicted.length;
  for (const e of r.evicted) console.warn(`[andrew] pearl rod: ${e.dim} ${e.pos.x} ${e.pos.y} ${e.pos.z} dropped from the plate watch (over the cell limit)`);
  return r.gen;
}

export const plateGenerationNow = (dim: string, cell: Vec3): number => generationOf(store, dim, cell);

/**
 * Whether `b` still names the plate it was bound to: the block at the cell (undefined when unloaded or outside the
 * height range) against the recorded type, and the cell's generation against the recorded one. Only "same" travels.
 */
export function plateCheck(b: Binding): PlateVerdict {
  let typeNow: string | undefined;
  try {
    typeNow = world.getDimension(b.dim).getBlock(b.pos)?.typeId;
  } catch {
    typeNow = undefined;
  }
  return plateVerdict(b, typeNow, generationOf(store, b.dim, b.pos));
}

export const watchedNow = (): ReturnType<typeof watchedCells> => watchedCells(store);

function bumpAll(dim: string, cells: readonly Vec3[]): void {
  for (const c of cells) if (bump(store, dim, c)) genStats.bumps++;
}

function onPiston(event: PistonActivateAfterEvent): void {
  const dimension = event.dimension;
  let attached: Vec3[] | undefined;
  try {
    attached = event.piston.getAttachedBlocksLocations();
  } catch {
    // Throws on some activations on 1.26.51 (seen on a retraction, 1 run of 2); the wider box stands in for the list.
    attached = undefined;
  }
  const around = attached === undefined ? pistonCells(event.block.location, [], PISTON_FALLBACK_REACH) : pistonCells(event.block.location, attached);
  const cells = around.filter((c) => generationOf(store, dimension.id, c) !== 0);
  if (cells.length === 0) return;
  system.runTimeout(() => {
    genStats.pistonChecks++;
    for (const c of cells) {
      let typeId: string | undefined;
      try {
        typeId = dimension.getBlock(c)?.typeId;
      } catch {
        typeId = undefined;
      }
      if (typeId !== undefined && !isPlateType(typeId)) bumpAll(dimension.id, [c]);
    }
  }, PISTON_SETTLE_TICKS);
}

/** The same rod in the same slot, its binding cleared or moved: it no longer holds its cell's generation. */
function onInventoryChange(event: PlayerInventoryItemChangeAfterEvent): void {
  const old = bindingOfStack(event.beforeItemStack);
  if (old === undefined) return;
  const after = event.itemStack;
  if (after === undefined || !isPearlRodStack(after)) return;
  const rodId = event.beforeItemStack?.getDynamicProperty(MARK_KEY);
  if (typeof rodId !== "string" || after.getDynamicProperty(MARK_KEY) !== rodId) return;
  const now = bindingOfStack(after);
  if (now !== undefined && now.dim === old.dim && now.gen === old.gen && sameCell(now.pos, old.pos)) return;
  const r = release(store, old.dim, old.pos, old.gen, rodId);
  if (r !== "none") genStats.releases++;
  if (r === "pruned") genStats.pruned++;
}

let armed = false;

/** Arms the listeners once per pack. */
export function registerPearlGeneration(): void {
  if (armed) return;
  armed = true;
  const guard =
    <E>(what: string, fn: (e: E) => void) =>
    (e: E): void => {
      try {
        fn(e);
      } catch (err) {
        warn(what, err);
      }
    };
  const a = world.afterEvents;
  a.playerBreakBlock.subscribe(guard("the break check", (e) => bumpAll(e.dimension.id, cellsBroken(e.block.location))));
  a.playerPlaceBlock.subscribe(guard("the place check", (e) => bumpAll(e.dimension.id, [e.block.location])));
  a.blockExplode.subscribe(guard("the explosion check", (e) => bumpAll(e.dimension.id, cellsBroken(e.block.location))));
  a.pistonActivate.subscribe(guard("the piston check", onPiston));
  a.playerInventoryItemChange.subscribe(guard("the release check", onInventoryChange));
  a.entityDie.subscribe(
    guard("the death check", (e) => {
      // After-events can carry an entity that is already gone; its id is still the binder's.
      const id = e.deadEntity?.id;
      if (id === undefined) return;
      const r = forgetOwner(store, id);
      genStats.releases += r.released;
      genStats.ownerPrunes += r.pruned;
    }),
    { entityTypes: ["minecraft:player"] }
  );
  console.warn("[andrew] pearl rod plate generation armed");
}
