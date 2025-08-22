import test from 'node:test';
import { strict as assert } from 'assert';
import { BudgetManager } from '../price';

// Lightweight in-memory storage mock
class MemStore {
  private data = new Map<string, any>();
  get(key: string) { return this.data.get(key); }
  update(key: string, val: any) { this.data.set(key, val); }
}

const store = new MemStore();
const bm = new BudgetManager(store);

test('BudgetManager records and enforces daily limit', async () => {
  const before = await bm.getBudgetUsage();
  assert.equal(before.dailySpent, 0);
  await bm.recordTransaction('p','m', 0.5, 10, 10, 'chat');
  const after = await bm.getBudgetUsage();
  assert.ok(after.dailySpent >= 0.5);
  const check = await bm.checkBudget(10, { dailyUSD: 1, hardStop: true });
  assert.equal(check.allowed, false);
});

test('BudgetManager warnings near threshold', async () => {
  // Reset by creating new manager
  const ms = new MemStore();
  const local = new BudgetManager(ms);
  await local.recordTransaction('p','m', 0.8, 10, 10, 'chat');
  const warnings = await local.getBudgetWarnings({ dailyUSD: 1, warningThreshold: 70 });
  assert.ok(warnings.length > 0);
});
