#!/usr/bin/env bash
# CX-L0-23 on BDS: what a sneaking SimulatedPlayer's shield does to a vanilla
# arrow, a vanilla snowball and four snowball-runtime bolts
# (diagnose-CNTR-X23.bolts.json), what a script sees of it, which applyDamage
# causes get through the shield, and what the shipped Scythe strike does to it.
#
# Exit 0: all three probe tests ran to the end with their controls holding (an
# arrow, an entityAttack applyDamage and the Scythe hurt an unshielded player, bolt_zero
# raises projectileHitEntity on one, isSneaking reads back as set). The answers
# are the "[probe] XCX23" lines.
#
# The probe is not part of the shipped gametest pack: this script copies it into
# src/gametest/, the bolts into packs/gametest/entities/, and restores main.ts
# and bds-gametest.mjs on exit. ANDREW_BDS_DIR picks the BDS instance (default
# bds-ci); agents of one wave share andrew-bds-ci, so give each a private copy.

set -u
cd "$(dirname "$0")/../.."
export ANDREW_BDS_DIR="${ANDREW_BDS_DIR:-bds-ci}"
log=dist/bds-gametest.log
probe=src/gametest/probe-xcx23-shield.ts
entities=packs/gametest/entities

[ -e "$entities" ] && { echo "$entities already exists; this script would delete it on exit"; exit 1; }
cp docs/feedback/diagnose-CNTR-X23.probe.ts "$probe"
cp src/gametest/main.ts src/gametest/main.ts.bak
cp scripts/bds-gametest.mjs scripts/bds-gametest.mjs.bak
trap 'rm -rf "$probe" "$entities"; mv src/gametest/main.ts.bak src/gametest/main.ts; mv scripts/bds-gametest.mjs.bak scripts/bds-gametest.mjs' EXIT

echo 'import "./probe-xcx23-shield";' >> src/gametest/main.ts
node -e '
  const fs = require("fs");
  const bolts = JSON.parse(fs.readFileSync("docs/feedback/diagnose-CNTR-X23.bolts.json", "utf8"));
  fs.mkdirSync("packs/gametest/entities", { recursive: true });
  for (const [file, body] of Object.entries(bolts)) fs.writeFileSync(`packs/gametest/entities/${file}`, JSON.stringify(body, null, 2));
  const f = "scripts/bds-gametest.mjs";
  const s = fs.readFileSync(f, "utf8");
  const marker = "const EXPECTED_TESTS = [";
  if (!s.includes(marker)) { console.error("EXPECTED_TESTS not found"); process.exit(1); }
  fs.writeFileSync(f, s.replace(marker, marker + "\n  \"andrew:probe_xcx23_shield\",\n  \"andrew:probe_xcx23_damage\",\n  \"andrew:probe_xcx23_scythe\","));
' || exit 1
ls "$entities"

npx tsc --noEmit -p . || exit 1
echo "tsc: probe compiles against the stable typings"

node scripts/bds-gametest.mjs --only andrew:probe_xcx23_shield --only andrew:probe_xcx23_damage --only andrew:probe_xcx23_scythe || exit 1
# Detail first, verdicts last: a run-check artifact keeps only the tail of stdout.
grep -E "\[probe\] XCX23 (TRIAL|setup|respawn)" "$log" | sed 's/.*\[probe\] //'
echo "--- engine lines naming the probe bolts (none expected):"
grep -E "x23_bolt" "$log" | grep -v "\[probe\]" || true
grep -E "\[andrew\] scythe volley" "$log" | sed 's/.*\[andrew\] //'
grep -E "\[probe\] XCX23 (SUMMARY|DMG|SCYTHE|CONTROL|RESULT)" "$log" | sed 's/.*\[probe\] //'
grep -q "onTestPassed: andrew:probe_xcx23_shield" "$log" && grep -q "onTestPassed: andrew:probe_xcx23_damage" "$log" \
  && grep -q "onTestPassed: andrew:probe_xcx23_scythe" "$log"
