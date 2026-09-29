#!/usr/bin/env bash
# CNTR-WIND-CX01-AA, unit: the production spawn-Windmill failure, reproduced over
# the node fake world with the real engine guard hook (engineSpawnGuard, Peaceful).
#
#   check.sh prefix  — placeAt as it was before 16251e6 (no try/catch around
#                      placer.run): expected RED, with the production reason verbatim
#   check.sh head    — placeAt as in this tree: expected GREEN, record `done`
#
# Builds a throwaway copy of src/ and tests/ in a temp dir; the tree itself is not touched.
set -eo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT
cp -R "$ROOT/src" "$ROOT/tests" "$ROOT/package.json" "$T/"
ln -s "$ROOT/node_modules" "$T/node_modules"
case "${1:?usage: check.sh <prefix|head>}" in
  prefix)
    perl -0pi -e 's/let r: \{ place: PlaceResult; state: Instance\["state"\] \| "pending" \};\n    try \{\n      r = placer\.run\(planned\.instance, this\.gate\);\n    \} catch \(e\) \{.*?\n    \}\n/const r = placer.run(planned.instance, this.gate);\n/s' "$T/src/structures/runtime.ts"
    grep -q 'const r = placer.run(planned.instance, this.gate);' "$T/src/structures/runtime.ts" || { echo "patch did not apply"; exit 3; } ;;
  head) ;;
  *) echo "unknown variant $1"; exit 2 ;;
esac
F="$T/tests/prod-peaceful.test.mjs"
sed -n '1,167p' "$T/tests/windmill-spawn.test.mjs" \
  | sed "s#export { WINDMILL_BODY } from './src/structures/bodies/windmill.ts';#export { WINDMILL_BODY } from './src/structures/bodies/windmill.ts'; export { engineSpawnGuard } from './src/structures/place.ts';#" \
  | sed 's#FILL_CELL_LIMIT, cells, VOID_DEPTH, BAND, StrfRuntime, MemoryStore, SALT_KEY,#FILL_CELL_LIMIT, cells, VOID_DEPTH, BAND, StrfRuntime, MemoryStore, SALT_KEY, engineSpawnGuard,#' > "$F"
grep -q 'SALT_KEY, engineSpawnGuard,' "$F" || { echo "harness import did not apply"; exit 3; }
cat >> "$F" <<'TEST'

// ------------------------------------------------------------ CNTR-WIND-CX01: the production failure, engine guard hook
test('prod repro: engineSpawnGuard on a Peaceful world does not burn the one spawn search', async () => {
  const w = new FakeWorld();
  const store = new MemoryStore();
  store.set(SALT_KEY, 'spawn-salt-prod-peaceful');
  const placed = [];
  const commands = [];
  const dim = {
    spawnEntity: () => { throw new Error('spawnEntity must not be reached'); },
    runCommand: (c) => { commands.push(c); return { successCount: 1 }; },
    getEntities: () => [],
  };
  const rt = new StrfRuntime(store, {
    view: (d) => (d === 'o' ? w.view() : undefined),
    placeWorld: (d) => (d === 'o' ? { hasTemplate: () => true, isLoaded: () => true, place: (id, origin, rot) => placed.push({ id, origin, rot }), fill: () => {} } : undefined),
    hooks: () => ({ fillChest() {}, spawnGuard: engineSpawnGuard(dim, { peaceful: () => true }) }),
  });
  const logs = [];
  const s = new SpawnSearch(rt, store, host(w, { spawn: { x: 100, z: -40 } }), { radius: 120, log: (l) => logs.push(l) });
  const rec = await s.run();
  console.log(`RECORD ${JSON.stringify({ status: rec.status, searches: rec.searches, reason: rec.reason, stage: rec.stage })}`);
  const inst = rt.registry.get('o', rec.origin ?? [0, 0, 0], SPAWN_ID) ?? rt.registry.allInstances().find((i) => i.id === SPAWN_ID);
  console.log(`REGISTRY ${inst?.id} ${inst?.state}; placed ${placed.length}; queued ${rt.queued}; summon commands ${commands.length}`);
  assert.equal(commands.length, 0, 'no summon on Peaceful');
  assert.equal(rec.status, 'done', `record reason: ${rec.reason}`);
  assert.equal(inst.state, 'looted');
  assert.equal(rt.queued, 1);
});
TEST
cd "$T"
echo "variant: $1; 'placement threw' sites in runtime.ts: $(grep -c 'placement threw' src/structures/runtime.ts) (2 = placeAt catches, 1 = pumpPlacement only)"
set +e
node --test --test-reporter=spec tests/prod-peaceful.test.mjs > out.txt 2>&1
rc=$?
grep -E 'RECORD|REGISTRY|✔|✖|record reason|actual:|expected:' out.txt | sort -u
exit $rc
