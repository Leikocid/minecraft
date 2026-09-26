// The Windmill's body (L0-wind): its template, its 25 chests on the shared
// custom table and its 10 field guards (§4.5, §6). Generation, persistence and
// loot rules are strf's and loot's; this file only names the Windmill's points.
// Pure data: node tests bundle it without a @minecraft/server stub.

import { CUSTOM_TABLE } from "../loot";
import type { GuardPoint, InitCtx } from "../place";
import type { Vec3 } from "../registry";
import { CHESTS, WINDMILL_ID, WINDMILL_SIZE } from "../templates/windmill";
import type { TypeBody } from "../bodies";

export const GUARD_ENTITY = "minecraft:zombie_villager_v2";
export const GUARD_COUNT = 10;
/** The name keeps a guard from despawning; a cured villager keeps it, which the spec allows (L0-wind-r005). */
export const GUARD_NAME = "Страж полей";

/** `andrew:guard:<instanceId>` (L0-wind-e003): the only way to tell a guard from a spawner's zombie villager. */
export const guardTag = (instanceId: string): string => `andrew:guard:${instanceId}`;

/**
 * Template-local cells on the wheat fields, clear of the fence, the ditches,
 * the paths and the field cobwebs of windmill-fields.ts; the mob stands at y=1.
 */
export const GUARD_POINTS: readonly Vec3[] = [
  [2, 1, 2],
  [8, 1, 2],
  [26, 1, 2],
  [32, 1, 2],
  [2, 1, 14],
  [32, 1, 14],
  [2, 1, 22],
  [32, 1, 22],
  [8, 1, 32],
  [26, 1, 32],
];

export const guardPoints = (instanceId: string): GuardPoint[] =>
  GUARD_POINTS.map((local) => ({ entity: GUARD_ENTITY, local, tags: [guardTag(instanceId)], name: GUARD_NAME, fireproof: true }));

/**
 * Chest order is floor by floor, as CHESTS lists them. No `clear`: a normal
 * Windmill never reshapes the land around it; the template's own air cells
 * are all it writes.
 */
export const WINDMILL_BODY: TypeBody = {
  templateId: WINDMILL_ID,
  standIn: false,
  size: [...WINDMILL_SIZE],
  chests: CHESTS.flat().map((c) => ({ local: [...c.at] as Vec3, table: CUSTOM_TABLE })),
  guards(ctx: InitCtx): void {
    guardPoints(ctx.instance.id).forEach((g, i) => ctx.spawnGuard(i, g));
  },
};
