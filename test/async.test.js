import assert from 'node:assert/strict';
import test from 'node:test';
import { withTimeout } from '../src/utils/async.js';

test('interrompe uma operação que nunca responde', async () => {
  await assert.rejects(
    withTimeout(new Promise(() => {}), 10, () => new Error('tempo limite')),
    /tempo limite/
  );
});
