/**
 * Test suite for CohereProvider
 */

import { CohereProvider } from '../../src/providers/cohere';

describe('CohereProvider', () => {
  let provider: CohereProvider;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    provider = new CohereProvider(mockApiKey);
  });

  describe('constructor', () => {
    test('should create instance with API key', () => {
      expect(provider).toBeInstanceOf(CohereProvider);
    });

    test('should throw error without API key', () => {
      expect(() => new CohereProvider('')).toThrow('Cohere API key is required');
    });
  });

  describe('validateApiKey', () => {
    test('should return true for valid API key', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ models: [] })
      });

      const result = await provider.validateApiKey();
      expect(result).toBe(true);
    });

    test('should return false for invalid API key', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401
      });

      const result = await provider.validateApiKey();
      expect(result).toBe(false);
    });
  });

  describe('getAvailableModels', () => {
    test('should return list of Cohere models', async () => {
      const models = await provider.getAvailableModels();
      
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      
      // Check for key Cohere models
      const modelNames = models.map(m => m.id);
      expect(modelNames).toContain('command-r-plus');
      expect(modelNames).toContain('command-r');
      expect(modelNames).toContain('command');
    });

    test('should include model capabilities', async () => {
      const models = await provider.getAvailableModels();
      const commandRPlus = models.find(m => m.id === 'command-r-plus');
      
      expect(commandRPlus).toBeDefined();
      expect(commandRPlus?.capabilities).toEqual({
        textGeneration: true,
        codeGeneration: true,
        reasoning: true,
        imageAnalysis: false,
        functionCalling: true,
        streaming: true
      });
    });
  });

  describe('estimateCost', () => {
    test('should calculate cost for Command R+', () => {
      const cost = provider.estimateCost('command-r-plus', 1000, 1000);
      
      // $3 per 1M input tokens, $15 per 1M output tokens
      const expectedCost = (1000 * 3 / 1000000) + (1000 * 15 / 1000000);
      expect(cost).toBeCloseTo(expectedCost, 6);
    });

    test('should calculate cost for Command R', () => {
      const cost = provider.estimateCost('command-r', 1000, 1000);
      
      // $0.5 per 1M input tokens, $1.5 per 1M output tokens
      const expectedCost = (1000 * 0.5 / 1000000) + (1000 * 1.5 / 1000000);
      expect(cost).toBeCloseTo(expectedCost, 6);
    });

    test('should return 0 for unknown model', () => {
      const cost = provider.estimateCost('unknown-model', 1000, 1000);
      expect(cost).toBe(0);
    });
  });

  describe('chat', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    test('should format chat request correctly', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          text: 'Test response',
          meta: { billed_units: { input_tokens: 10, output_tokens: 5 } }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const messages = [
        { role: 'user' as const, content: 'Hello' }
      ];

      await provider.chat('command-r', messages);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.cohere.ai/v1/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`
          }),
          body: expect.stringContaining('"message":"Hello"')
        })
      );
    });

    test('should handle chat history correctly', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          text: 'Test response',
          meta: { billed_units: { input_tokens: 10, output_tokens: 5 } }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const messages = [
        { role: 'user' as const, content: 'First message' },
        { role: 'assistant' as const, content: 'First response' },
        { role: 'user' as const, content: 'Second message' }
      ];

      await provider.chat('command-r', messages);

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.message).toBe('Second message');
      expect(callBody.chat_history).toEqual([
        { role: 'USER', message: 'First message' },
        { role: 'CHATBOT', message: 'First response' }
      ]);
    });

    test('should handle system messages as preamble', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          text: 'Test response',
          meta: { billed_units: { input_tokens: 10, output_tokens: 5 } }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const messages = [
        { role: 'system' as const, content: 'You are helpful' },
        { role: 'user' as const, content: 'Hello' }
      ];

      await provider.chat('command-r', messages);

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.preamble).toBe('You are helpful');
      expect(callBody.message).toBe('Hello');
    });

    test('should return formatted response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          text: 'Hello! How can I help you?',
          meta: { billed_units: { input_tokens: 5, output_tokens: 8 } }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      const response = await provider.chat('command-r', messages);

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

    test('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid API key' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const messages = [{ role: 'user' as const, content: 'Hello' }];

      await expect(
        provider.chat('command-r', messages)
      ).rejects.toThrow('Invalid API key');
    });
  });

  describe('chatStream', () => {
    test('should create streaming request', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: async () => ({ done: true, value: undefined })
          })
        }
      });

      const messages = [{ role: 'user' as const, content: 'Hello' }];
      
      await provider.chatStream('command-r', messages, () => {});

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.cohere.ai/v1/chat',
        expect.objectContaining({
          body: expect.stringContaining('"stream":true')
        })
      );
    });
  });

  describe('generate', () => {
    test('should call generate endpoint correctly', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          generations: [{ text: 'Generated text' }],
          meta: { billed_units: { input_tokens: 10, output_tokens: 5 } }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await provider.generate('command', 'Write a story');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.cohere.ai/v1/generate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`
          }),
          body: expect.stringContaining('"prompt":"Write a story"')
        })
      );

      expect(result.content).toBe('Generated text');
    });
  });

  describe('classify', () => {
    test('should call classify endpoint correctly', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          classifications: [{ prediction: 'positive', confidence: 0.95 }],
          meta: { billed_units: { input_tokens: 10 } }
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const examples = [
        { text: 'I love this', label: 'positive' },
        { text: 'I hate this', label: 'negative' }
      ];

      const result = await provider.classify(['Great product!'], examples);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.cohere.ai/v1/classify',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"inputs":["Great product!"]')
        })
      );

      expect(result.classifications[0].prediction).toBe('positive');
      expect(result.classifications[0].confidence).toBe(0.95);
    });
  });

  describe('supportsFunctionCalling', () => {
    test('should return true for Command R models', () => {
      expect(provider.supportsFunctionCalling('command-r-plus')).toBe(true);
      expect(provider.supportsFunctionCalling('command-r')).toBe(true);
    });

    test('should return false for other models', () => {
      expect(provider.supportsFunctionCalling('command')).toBe(false);
      expect(provider.supportsFunctionCalling('embed-english-v3.0')).toBe(false);
    });
  });

  describe('convertMessage', () => {
    test('should convert user message correctly', () => {
      const message = { role: 'user' as const, content: 'Hello' };
      const converted = (provider as any).convertMessage(message);
      
      expect(converted).toEqual({
        role: 'USER',
        message: 'Hello'
      });
    });

    test('should convert assistant message correctly', () => {
      const message = { role: 'assistant' as const, content: 'Hi there!' };
      const converted = (provider as any).convertMessage(message);
      
      expect(converted).toEqual({
        role: 'CHATBOT',
        message: 'Hi there!'
      });
    });

    test('should return null for system messages', () => {
      const message = { role: 'system' as const, content: 'You are helpful' };
      const converted = (provider as any).convertMessage(message);
      
      expect(converted).toBeNull();
    });
  });
});
