"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const node_test_1 = __importDefault(require("node:test"));
const router_1 = require("../router");
class DummyProvider {
    _id;
    models;
    constructor(_id, models) {
        this._id = _id;
        this.models = models;
    }
    id() { return this._id; }
    supports(model) { return this.models.includes(model); }
    estimateTokens(input) { return Math.ceil(input.length / 4); }
    async isAvailable() { return true; }
    async *chat() { yield { type: 'done' }; }
    async chatComplete() { return { content: 'ok' }; }
}
const profile = {
    mode: 'auto',
    providers: [
        {
            id: 'p1',
            kind: 'ollama',
            baseUrl: 'http://localhost',
            models: [{ name: 'm1', price: { inputPerMTok: 1, outputPerMTok: 1 } }],
            routing: undefined
        }
    ],
    routing: {
        rules: [
            {
                id: 'kw',
                if: { anyKeyword: ['test'] },
                then: { prefer: ['p1:m1'], target: 'chat' }
            }
        ],
        default: { prefer: ['p1:m1'], target: 'chat' }
    }
};
(0, node_test_1.default)('ModelRouter routes simple prompt', async () => {
    const providers = new Map([['p1', new DummyProvider('p1', ['m1'])]]);
    const router = new router_1.ModelRouter(profile, providers);
    const res = await router.route({ prompt: 'this is a test' });
    assert_1.strict.equal(res.modelName, 'm1');
});
//# sourceMappingURL=router.test.js.map