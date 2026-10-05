// ANDREW_BDS_DIR defaults to the production LAN server, and the GameTest and
// check runners recreate their instance's container. On 2026-10-05 a run
// started without the variable took the server the players were on off the air.
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function guard(env) {
  const code =
    "import('./scripts/bds-lib.mjs').then((m) => { m.refuseProduction('a run'); console.log('PASSED ' + m.containerName); })" +
    ".catch((e) => { console.log('REFUSED ' + e.message); })";
  return execFileSync(process.execPath, ['-e', code], {
    cwd: root,
    encoding: 'utf-8',
    env: { ...process.env, ANDREW_BDS_DIR: undefined, ANDREW_BDS_ALLOW_PROD: undefined, ...env },
  }).trim();
}

test('the production instance is opt-in for runs that recreate the container', async (t) => {
  await t.test('no ANDREW_BDS_DIR is a refusal, not production', () => {
    const out = guard({});
    assert.match(out, /^REFUSED /);
    assert.match(out, /andrew-bds\b/);
    assert.match(out, /ANDREW_BDS_ALLOW_PROD=1/, 'the refusal must name its own override');
  });

  await t.test("naming 'bds' explicitly is refused too", () => {
    assert.match(guard({ ANDREW_BDS_DIR: 'bds' }), /^REFUSED /);
  });

  await t.test('the checks and QA instances pass', () => {
    assert.equal(guard({ ANDREW_BDS_DIR: 'bds-ci' }), 'PASSED andrew-bds-ci');
    assert.equal(guard({ ANDREW_BDS_DIR: 'bds-qa' }), 'PASSED andrew-bds-qa');
  });

  await t.test('the override is honoured, so production stays reachable on purpose', () => {
    assert.equal(guard({ ANDREW_BDS_DIR: 'bds', ANDREW_BDS_ALLOW_PROD: '1' }), 'PASSED andrew-bds');
  });
});
