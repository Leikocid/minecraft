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
  'andrew:vanilla_recipe_rocket_boosts_elytra', // craft + the recipe's whole point: it must actually boost an Elytra
  'andrew:strf_cmd_place', // structures reach the world at all
  'andrew:trident_craft_two_empty_buckets', // the refund an addon recipe cannot do by data
  'andrew:trident_dash_distance',
  'andrew:trident_throw_wall_return', // throw, block, visible return — the first legendary that leaves the inventory
  'andrew:vanilla_recipe_mace_new_and_old', // the new Mace recipe, beside the Heavy Core one it must not replace
  'andrew:ubow_craft_two_empty_buckets', // the bow's craft and the two buckets an addon recipe cannot hand back by data
  'andrew:ubow_flight_water', // what the bow is for: an arrow that keeps its air speed under water
  'andrew:ubow_ability_exact', // the armed shot whole: exactly 14 before armour, one spectacle, Super Fire, the cooldown
  'andrew:pear_item_craft_unlimited', // the Pearl Rod exists and crafts without a limit
  'andrew:pear_tp_near_clears', // bind, travel, and the binding is spent — the rod's whole point in one scenario
];
