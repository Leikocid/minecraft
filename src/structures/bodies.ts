// What each structure type places (L0-strf-e001). A type whose real template is
// not in the add-on yet stands in with the probe box and its two chests, filled
// from the type's own loot tables. A stand-in never generates on its own: its
// natural chance is 0 until `/andrew:structure chance` lifts it for the
// session, so an operator's world is not littered with probe boxes.

import { AIRSHIP_BODY } from "./bodies/airship";
import { BASTION_BODY } from "./bodies/bastion";
import { WARDEN_CITY_BODY } from "./bodies/warden-city";
import { WINDMILL_BODY } from "./bodies/windmill";
import { type RollDef, ROLL_DEFS, type StructureId } from "./config";
import type { InitCtx, StructureBody } from "./place";
import type { Instance, Vec3 } from "./registry";
import type { ExtraSpot } from "./site";

export interface TypeBody extends StructureBody {
  /** True while the type has no real template and places the probe box instead. */
  standIn: boolean;
  /**
   * Unrotated template size when it differs from the roll table's footprint.
   * The Placer maps chest cells through the record's box, so a record must
   * reserve exactly what its template fills.
   */
  size?: Vec3;
  /** A second area the type writes besides its box; the site gate checks it with the box. */
  spot?: ExtraSpot;
}

export const STAND_IN_TEMPLATE = "andrew:probe_box";

export const STAND_IN_SIZE: Vec3 = [9, 5, 7];

/** Chest cells of src/structures/templates/probe_box.json, template-local. */
export const STAND_IN_CHESTS: readonly Vec3[] = [
  [2, 1, 1],
  [6, 1, 1],
];

export const standIn = (tables: readonly [string, string]): TypeBody => ({
  templateId: STAND_IN_TEMPLATE,
  standIn: true,
  size: STAND_IN_SIZE,
  chests: STAND_IN_CHESTS.map((local, i) => ({ local, table: tables[i] })),
});

export const BODIES: Readonly<Record<StructureId, TypeBody>> = {
  windmill: WINDMILL_BODY,
  airship: AIRSHIP_BODY,
  warden_city: WARDEN_CITY_BODY,
  bastion: BASTION_BODY,
};

/**
 * The roll table generation uses: a stand-in type rolls at 0 unless
 * overridden, and reserves its template's size.
 */
export const naturalDefs = (bodies: Readonly<Record<string, TypeBody>> = BODIES): RollDef[] =>
  ROLL_DEFS.map((d) => {
    const b = bodies[d.id];
    return { ...d, chance: b?.standIn === false ? d.chance : 0, size: b?.size ?? d.size };
  });

/** Type → extra spot, for the SiteChecker. */
export const spotsOf = (bodies: Readonly<Record<string, TypeBody>>): Record<string, ExtraSpot> =>
  Object.fromEntries(Object.entries(bodies).flatMap(([id, b]) => (b.spot === undefined ? [] : [[id, b.spot]])));

/** Parent type → the type it makes one linked attempt for (§5.6). */
export const LINKS: Readonly<Partial<Record<StructureId, StructureId>>> = { windmill: "airship" };

/**
 * The bodies the Placer runs: a parent gets its `linked` hook only while both
 * it and its child are real bodies, so a stand-in never triggers a search.
 */
export function withLinks(bodies: Readonly<Record<string, TypeBody>>, start: (parent: Instance) => void): Record<string, TypeBody> {
  const out: Record<string, TypeBody> = { ...bodies };
  for (const [parent, child] of Object.entries(LINKS)) {
    const p = bodies[parent];
    const c = child === undefined ? undefined : bodies[child];
    if (p === undefined || c === undefined || p.standIn || c.standIn) continue;
    out[parent] = { ...p, linked: (ctx: InitCtx) => start(ctx.instance) };
  }
  return out;
}
