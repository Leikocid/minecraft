// The Mini Bastion's body (L0-bast): its template, 3 treasure chests on the
// vanilla chests/bastion_treasure table and 7 on chests/bastion_other, the
// 2–4 treasure gold blocks, and the one-time garrison of §14.5. Generation,
// persistence and loot rules are strf's and loot's (L0-strf-r002, r007, r008);
// the 5 % Nether roll and the `netherFloor` profile are theirs too. "Created",
// "looted" and "guarded" are registry states: the body keeps no mark of its own.
// Pure data: node tests bundle it without a @minecraft/server stub.

import type { TypeBody } from "../bodies";
import { BASTION_OTHER, BASTION_TREASURE } from "../loot";
import { seededRng } from "../loot-table";
import type { GuardPoint, InitCtx, TemplateCtx, BlockEdit } from "../place";
import type { Vec3 } from "../registry";
import { BASTION_ID, BASTION_SIZE, BRUTE_SLOTS, CHESTS, TREASURE_GOLD, treasureGoldKept } from "../templates/bastion";
import { guardTag } from "./windmill";

export const PIGLIN = "minecraft:piglin";
export const BRUTE = "minecraft:piglin_brute";
export const PIGLIN_MIN = 7;
export const PIGLIN_MAX = 10;
export const BRUTE_COUNT = 2;
/** A name keeps a mob from despawning (L0-adr-strs, probe Q5). */
export const PIGLIN_NAME = "Пиглин бастиона";
export const BRUTE_NAME = "Брут бастиона";
/** `andrew:bastion_role:<treasure|other|piglin>`: which post a guard was spawned for. */
export const roleTag = (role: "treasure" | "other" | "piglin"): string => `andrew:bastion_role:${role}`;
/** A garrison piglin or brute, by its role tag. */
export const isBastionGuard = (typeId: string, tags: readonly string[]): boolean =>
  (typeId === PIGLIN || typeId === BRUTE) && tags.some((t) => t.startsWith("andrew:bastion_role:"));

export { guardTag };

/**
 * Template-local cells a regular piglin spawns in: open and with head room,
 * on the hall ring outside the moat, in the main-level rooms and on the roof.
 * The first PIGLIN_MIN are always used.
 */
export const PIGLIN_POINTS: readonly Vec3[] = [
  [2, 2, 5],
  [17, 2, 10],
  [4, 5, 10],
  [3, 5, 3],
  [10, 5, 4],
  [15, 5, 3],
  [8, 5, 15],
  [16, 5, 16],
  [12, 9, 12],
  [4, 9, 14],
];

/** How many regular piglins an instance gets, 7..10, fixed by its id so a resume sees the same roster. */
export function piglinCount(instanceId: string): number {
  const rng = seededRng(`${instanceId}#garrison`);
  return PIGLIN_MIN + Math.min(PIGLIN_MAX - PIGLIN_MIN, Math.floor(rng() * (PIGLIN_MAX - PIGLIN_MIN + 1)));
}

/**
 * The whole one-time roster in spawn order: the two brutes first, then the
 * piglins. The index is the Placer's per-guard progress, so the order is fixed.
 * No hoglin is ever part of it (§14.5). Every guard is fireproof: the hall's
 * moat is flush with the floor, and a piglin that strolls into it dies there.
 */
export function garrison(instanceId: string): GuardPoint[] {
  const tag = guardTag(instanceId);
  const brutes = BRUTE_SLOTS.map((b): GuardPoint => ({ entity: BRUTE, local: [...b.at] as Vec3, tags: [tag, roleTag(b.slot)], name: BRUTE_NAME, fireproof: true }));
  const piglins = PIGLIN_POINTS.slice(0, piglinCount(instanceId)).map((local): GuardPoint => ({ entity: PIGLIN, local, tags: [tag, roleTag("piglin")], name: PIGLIN_NAME, fireproof: true }));
  return [...brutes, ...piglins];
}

/** The treasure gold slots an instance keeps, 2..4, fixed by its id. */
export const goldKept = (instanceId: string): readonly (readonly [number, number, number])[] => treasureGoldKept(seededRng(`${instanceId}#gold`)());

/**
 * Clears the template's gold slots this instance does not keep. A repeat after
 * a crash clears the same cells; a slot that is already air is left alone.
 * Throws on an unloaded cell: the place step is then not marked done.
 */
export function trimGold(ctx: TemplateCtx, edit: BlockEdit): Vec3[] {
  const keep = new Set(goldKept(ctx.instance.id).map((p) => p.join(",")));
  const cleared: Vec3[] = [];
  for (const g of TREASURE_GOLD) {
    if (keep.has(g.join(","))) continue;
    const at = ctx.at([...g] as Vec3);
    const t = edit.typeAt(...at);
    if (t === undefined) throw new Error(`bastion gold: ${at.join(",")} unloaded`);
    if (t === "minecraft:gold_block") edit.set(at, "minecraft:air");
    cleared.push(at);
  }
  return cleared;
}

/** Chest order is the template's: the three treasure chests first. */
export const BASTION_BODY: TypeBody = {
  templateId: BASTION_ID,
  standIn: false,
  size: [...BASTION_SIZE],
  chests: CHESTS.map((c) => ({ local: [...c.at] as Vec3, table: c.zone === "treasure" ? BASTION_TREASURE : BASTION_OTHER })),
  decorate: (ctx, edit) => void trimGold(ctx, edit),
  guards(ctx: InitCtx): void {
    garrison(ctx.instance.id).forEach((g, i) => ctx.spawnGuard(i, g));
  },
};
