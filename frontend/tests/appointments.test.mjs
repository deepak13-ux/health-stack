import assert from 'node:assert/strict';
import test from 'node:test';
import { billBalance } from '../src/lib/appointments.js';
test('paid bills have no outstanding balance and unpaid bills show the full amount', () => {
  assert.equal(billBalance({total:210,paid:0,status:'unpaid'}),210);
  assert.equal(billBalance({total:210,paid:210,status:'paid'}),0);
});
