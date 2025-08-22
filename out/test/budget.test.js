"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const assert_1 = require("assert");
const price_1 = require("../price");
// Lightweight in-memory storage mock
class MemStore {
    data = new Map();
    get(key) { return this.data.get(key); }
    update(key, val) { this.data.set(key, val); }
}
const store = new MemStore();
const bm = new price_1.BudgetManager(store);
(0, node_test_1.default)('BudgetManager records and enforces daily limit', async () => {
    const before = await bm.getBudgetUsage();
    assert_1.strict.equal(before.dailySpent, 0);
    await bm.recordTransaction('p', 'm', 0.5, 10, 10, 'chat');
    const after = await bm.getBudgetUsage();
    assert_1.strict.ok(after.dailySpent >= 0.5);
    const check = await bm.checkBudget(10, { dailyUSD: 1, hardStop: true });
    assert_1.strict.equal(check.allowed, false);
});
(0, node_test_1.default)('BudgetManager warnings near threshold', async () => {
    // Reset by creating new manager
    const ms = new MemStore();
    const local = new price_1.BudgetManager(ms);
    await local.recordTransaction('p', 'm', 0.8, 10, 10, 'chat');
    const warnings = await local.getBudgetWarnings({ dailyUSD: 1, warningThreshold: 70 });
    assert_1.strict.ok(warnings.length > 0);
});
//# sourceMappingURL=budget.test.js.map