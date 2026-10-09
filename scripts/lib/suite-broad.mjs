// The release gate. One scenario per shipped system, each walking that system
// end to end; everything else in EXPECTED_TESTS is deep and runs on request
// (`--all`). Splitting them is an operator decision of 2026-10-09: the whole
// 341-scenario suite takes ~50 minutes and comes back green in about one run of
// two to five, which is too slow and too noisy to stand in front of every
// release.
//
// What belongs here: the shortest scenario that fails if the system is broken
// for a player. What does not: probes (they measure the engine, not the
// product), restart pairs (they stop and start BDS), and anything on the known
// flaky list.
export const BROAD_TESTS = [
  'andrew:pickaxe_digs_at_diamond_speed',
  'andrew:websword_first_claim', // the one-per-world craft gate and its refund
  'andrew:websword_death_returns', // the framework's promise: a legendary survives its holder
  'andrew:legendary_returns_from_void', // and the other one: it comes back out of the Void
  'andrew:scythe_lethal_hit_kills',
  'andrew:katana_floor_jump',
  'andrew:pntr_column_overworld', // Orbital Cannon, left press
  'andrew:ring_layout_craters', // Orbital Cannon, right press — a separate ability, not a variant
  'andrew:ufo_saucer_flight',
  'andrew:ufo_hold_players_lift', // the magnet, which is what the UFO is for
  'andrew:sculk_hit_fixed_damage',
  'andrew:storm_active_range',
  'andrew:storm_passive_damage',
  'andrew:vanilla_recipe_elytra_unlimited',
  'andrew:vanilla_recipe_totem_unlimited',
  'andrew:strf_cmd_place', // structures reach the world at all
];
