import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions } from '../src/utils/version.js';

test('compara versões semver usadas no OTA', () => {
  assert.equal(compareVersions('v1.4.0', '1.3.9'), 1);
  assert.equal(compareVersions('1.0.0', '1.0'), 0);
  assert.equal(compareVersions('2.0.0-beta.1', '2.0.0'), 0);
  assert.equal(compareVersions('1.9.9', '2.0.0'), -1);
});
