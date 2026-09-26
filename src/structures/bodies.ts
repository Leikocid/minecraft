// What each structure type places (L0-strf-e001). A type whose real template is
// not in the add-on yet stands in with the probe box and its two chests, filled
// from the type's own loot tables. A stand-in never generates on its own: its
// natural chance is 0 until `/andrew:structure chance` lifts it for the
// session, so an operator's world is not littered with probe boxes.

import { WINDMILL_BODY } from "./bodies/windmill";
import { type RollDef, ROLL_DEFS, type StructureId } from "./config";
import { ANCIENT_CITY, BASTION_OTHER, BASTION_TREASURE, CUSTOM_TABLE } from "./loot";
import type { StructureBody } from "./place";
import type { Vec3 } from "./registry";

export interface TypeBody extends StructureBody {
  /** True while the type has no real template and places the probe box instead. */
  standIn: boolean;
  /**
   * Unrotated template size when it differs from the roll table's footprint.
   * The Placer maps chest cells through the record's box, so a record must
   * reserve exactly what its template fills.
   */
  size?: Vec3;
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
  airship: standIn([CUSTOM_TABLE, CUSTOM_TABLE]),
  warden_city: standIn([ANCIENT_CITY, ANCIENT_CITY]),
  bastion: standIn([BASTION_TREASURE, BASTION_OTHER]),
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
