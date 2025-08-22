import { strict as assert } from 'assert';
import test from 'node:test';
import { ModelRouter } from '../router';
import { Provider } from '../providers/base';
import { ProfileConfig } from '../config';

class DummyProvider implements Provider {
  constructor(private _id: string, private models: string[]) {}
  id() { return this._id; }
  supports(model: string) { return this.models.includes(model); }
  estimateTokens(input: string) { return Math.ceil(input.length / 4); }
  async isAvailable() { return true; }
  async *chat() { yield { type: 'done' } as any; }
  async chatComplete() { return { content: 'ok' }; }
}

const profile: ProfileConfig = {
  mode: 'auto',
  providers: [
    {
      id: 'p1',
      kind: 'ollama',
      baseUrl: 'http://localhost',
      models: [{ name: 'm1', price: { inputPerMTok: 1, outputPerMTok: 1 } }],
      routing: undefined as any
    } as any
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

test('ModelRouter routes simple prompt', async () => {
  const providers = new Map<string, Provider>([['p1', new DummyProvider('p1', ['m1'])]]);
  const router = new ModelRouter(profile, providers);
  const res = await router.route({ prompt: 'this is a test' });
  assert.equal(res.modelName, 'm1');
});
