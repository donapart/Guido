/**
 * Test suite for AnthropicProvider
 */

import { AnthropicProvider } from '../../src/providers/anthropic';

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    provider = new AnthropicProvider(mockApiKey);
  });

  describe('constructor', () => {
    test('should create instance with API key', () => {
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    test('should throw error without API key', () => {
      expect(() => new AnthropicProvider('')).toThrow('Anthropic API key is required');
    });
  });

  describe('validateApiKey', () => {
    test('should return true for valid API key format', async () => {
      const result = await provider.validateApiKey();
      expect(result).toBe(true);
    });

    test('should return false for invalid API key format', async () => {
      const invalidProvider = new AnthropicProvider('invalid-key');
      const result = await invalidProvider.validateApiKey();
      expect(result).toBe(false);
    });
  });

  describe('getAvailableModels', () => {
    test('should return list of Claude models', async () => {
      const models = await provider.getAvailableModels();
      
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      
      // Check for key Claude models
      const modelNames = models.map(m => m.id);
      expect(modelNames).toContain('claude-3-5-sonnet-20241022');
      expect(modelNames).toContain('claude-3-opus-20240229');
      expect(modelNames).toContain('claude-3-haiku-20240307');
    });

    test('should include model capabilities', async () => {
      const models = await provider.getAvailableModels();
      const sonnetModel = models.find(m => m.id === 'claude-3-5-sonnet-20241022');
      
      expect(sonnetModel).toBeDefined();
      expect(sonnetModel?.capabilities).toEqual({
        textGeneration: true,
        codeGeneration: true,
        reasoning: true,
        imageAnalysis: true,
        functionCalling: false,
        streaming: true
      });
    });
  });

  describe('estimateCost', () => {
    test('should calculate cost for Claude 3.5 Sonnet', () => {
      const cost = provider.estimateCost('claude-3-5-sonnet-20241022', 1000, 1000);
      
      // $3 per 1M input tokens, $15 per 1M output tokens
      const expectedCost = (1000 * 3 / 1000000) + (1000 * 15 / 1000000);
      expect(cost).toBeCloseTo(expectedCost, 6);
    });

    test('should calculate cost for Claude 3 Opus', () => {
      const cost = provider.estimateCost('claude-3-opus-20240229', 1000, 1000);
      
      // $15 per 1M input tokens, $75 per 1M output tokens
      const expectedCost = (1000 * 15 / 1000000) + (1000 * 75 / 1000000);
      expect(cost).toBeCloseTo(expectedCost, 6);
    });

    test('should return 0 for unknown model', () => {
      const cost = provider.estimateCost('unknown-model', 1000, 1000);
      expect(cost).toBe(0);
    });
  });

  describe('chat', () => {
    beforeEach(() => {
      // Mock fetch for API calls
      global.fetch = jest.fn();
    });

    test('should format messages correctly', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [{ text: 'Test response' }],
          usage: { input_tokens: 10, output_tokens: 5 }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const messages = [
        { role: 'user' as const, content: 'Hello' }
      ];

      await provider.chat('claude-3-sonnet-20240229', messages);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': mockApiKey,
            'anthropic-version': '2023-06-01'
          }),
          body: expect.stringContaining('"messages":[{"role":"user","content":"Hello"}]')
        })
      );
    });

    test('should handle system messages correctly', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [{ text: 'Test response' }],
          usage: { input_tokens: 10, output_tokens: 5 }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const messages = [
        { role: 'system' as const, content: 'You are helpful' },
        { role: 'user' as const, content: 'Hello' }
      ];

      await provider.chat('claude-3-sonnet-20240229', messages);

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.system).toBe('You are helpful');
      expect(callBody.messages).toEqual([{ role: 'user', content: 'Hello' }]);
    });

    test('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];

      await expect(
        provider.chat('claude-3-sonnet-20240229', messages)
      ).rejects.toThrow('Invalid API key');
    });

    test('should return formatted response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [{ text: 'Hello! How can I help you?' }],
          usage: { input_tokens: 5, output_tokens: 8 }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      const response = await provider.chat('claude-3-sonnet-20240229', messages);

      expect(response).toEqual({
        content: 'Hello! How can I help you?',
        usage: {
          inputTokens: 5,
          outputTokens: 8,
          totalTokens: 13
        },
        cost: expect.any(Number)
      });
    });
  });

  describe('chatStream', () => {
    test('should create streaming request with correct headers', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: async () => ({ done: true, value: undefined })
          })
        }
      });

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      
      await provider.chatStream('claude-3-sonnet-20240229', messages, () => {});

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': mockApiKey,
            'anthropic-version': '2023-06-01'
          }),
          body: expect.stringContaining('"stream":true')
        })
      );
    });
  });

  describe('supportsImageAnalysis', () => {
    test('should return true for Claude 3 models', () => {
      expect(provider.supportsImageAnalysis('claude-3-sonnet-20240229')).toBe(true);
      expect(provider.supportsImageAnalysis('claude-3-opus-20240229')).toBe(true);
      expect(provider.supportsImageAnalysis('claude-3-haiku-20240307')).toBe(true);
    });

    test('should return false for non-Claude 3 models', () => {
      expect(provider.supportsImageAnalysis('claude-2.1')).toBe(false);
      expect(provider.supportsImageAnalysis('unknown-model')).toBe(false);
    });
  });

  describe('convertMessage', () => {
    test('should convert user message correctly', () => {
      const message = { role: 'user' as const, content: 'Hello' };
      const converted = (provider as any).convertMessage(message);
      
      expect(converted).toEqual({
        role: 'user',
        content: 'Hello'
      });
    });

    test('should convert assistant message correctly', () => {
      const message = { role: 'assistant' as const, content: 'Hi there!' };
      const converted = (provider as any).convertMessage(message);
      
      expect(converted).toEqual({
        role: 'assistant',
        content: 'Hi there!'
      });
    });

    test('should skip system messages', () => {
      const message = { role: 'system' as const, content: 'You are helpful' };
      const converted = (provider as any).convertMessage(message);
      
      expect(converted).toBeNull();
    });
  });
});
