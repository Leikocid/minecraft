import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

import { COMPOSE_MAX_BUFFER } from '../scripts/bds-lib.mjs';

const TWO_MIB = 2 * 1024 * 1024;

/** A child that writes `bytes` to stdout, like `docker compose logs` does. */
function emit(bytes, opts) {
  return spawnSync('node', ['-e', `process.stdout.write('x'.repeat(${bytes}))`], {
    encoding: 'utf-8',
    ...opts,
  });
}

test('negative control: the default buffer loses the tail and signals it only as ENOBUFS', () => {
  const res = emit(TWO_MIB, {});
  // spawnSync kills the child once the buffer is over the limit, so the cut
  // lands a chunk past 1 MiB rather than exactly on it — short either way.
  assert.ok(res.stdout.length < TWO_MIB);
  assert.equal(res.error?.code, 'ENOBUFS');
  // The text itself carries no mark of the loss. That is what made the stall silent.
  assert.ok(!res.stdout.includes('truncat'));
});

test('COMPOSE_MAX_BUFFER carries output that the default cuts', () => {
  const res = emit(TWO_MIB, { maxBuffer: COMPOSE_MAX_BUFFER });
  assert.equal(res.stdout.length, TWO_MIB);
  assert.equal(res.error, undefined);
});

test('COMPOSE_MAX_BUFFER leaves room above a full-suite server log', () => {
  // The run that stalled on 2026-10-09 held 1 053 457 bytes at 323 of 341
  // scenarios (dist/bds-gametest-stalled-1053k.log): the default buffer
  // returned 1 049 010 of them and the last two verdicts were invisible.
  const STALLED_LOG_BYTES = 1_053_457;
  assert.ok(COMPOSE_MAX_BUFFER > STALLED_LOG_BYTES * 50);
});
