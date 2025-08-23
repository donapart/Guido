/**
 * Integration test suite for ModelRouter
 */

import { ModelRouter } from '../../src/router';
import { AnthropicProvider } from '../../src/providers/anthropic';
import { CohereProvider } from '../../src/providers/cohere';
import { mockVSCode } from '../setup';
import * as vscode from 'vscode';

jest.mock('vscode', () => mockVSCode);

describe('ModelRouter Integration Tests', () => {
  let router: ModelRouter;
  let mockProviders: any;

  beforeEach(() => {
    // Mock configuration
    mockVSCode.workspace.getConfiguration.mockReturnValue({
      get: jest.fn((key: string) => {
        const config = {
          'openaiApiKey': 'test-openai-key',
          'anthropicApiKey': 'test-anthropic-key',
          'cohereApiKey': 'test-cohere-key',
          'ollamaBaseUrl': 'http://localhost:11434',
          'defaultProvider': 'auto',
          'routingMode': 'auto',
          'maxCostPerDay': 5.0
        };
        return config[key as keyof typeof config];
      }),
      update: jest.fn(),
      has: jest.fn().mockReturnValue(true)
    });

    // Create router instance
    router = new ModelRouter();

    // Mock provider responses
    mockProviders = {
      anthropic: {
        chat: jest.fn().mockResolvedValue({
          content: 'Anthropic response',
          usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
          cost: 0.001
        }),
        validateApiKey: jest.fn().mockResolvedValue(true),
        getAvailableModels: jest.fn().mockResolvedValue([
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' }
        ])
      },
      cohere: {
        chat: jest.fn().mockResolvedValue({
          content: 'Cohere response',
          usage: { inputTokens: 8, outputTokens: 15, totalTokens: 23 },
          cost: 0.0005
        }),
        validateApiKey: jest.fn().mockResolvedValue(true),
        getAvailableModels: jest.fn().mockResolvedValue([
          { id: 'command-r-plus', name: 'Command R+' }
        ])
      }
    };
  });

  describe('Provider Integration', () => {
    test('should initialize with multiple providers', async () => {
      // Mock the provider constructors
      jest.spyOn(AnthropicProvider.prototype, 'validateApiKey')
        .mockResolvedValue(true);
      jest.spyOn(CohereProvider.prototype, 'validateApiKey')
        .mockResolvedValue(true);

      await router.initialize();

      expect(router.getAvailableProviders()).toContain('anthropic');
      expect(router.getAvailableProviders()).toContain('cohere');
    });

    test('should route to appropriate provider based on prompt', async () => {
      // Mock provider selection
      jest.spyOn(router as any, 'selectProvider')
        .mockResolvedValue({ provider: 'anthropic', model: 'claude-3-sonnet-20240229' });
      
      jest.spyOn(router as any, 'getProvider')
        .mockReturnValue(mockProviders.anthropic);

      const response = await router.routePrompt('Explain this code');

      expect(mockProviders.anthropic.chat).toHaveBeenCalled();
      expect(response.content).toBe('Anthropic response');
    });

    test('should handle provider failures with fallback', async () => {
      // Mock primary provider failure
      jest.spyOn(router as any, 'selectProvider')
        .mockResolvedValueOnce({ provider: 'anthropic', model: 'claude-3-sonnet-20240229' })
        .mockResolvedValueOnce({ provider: 'cohere', model: 'command-r-plus' });

      const anthropicProvider = { ...mockProviders.anthropic };
      anthropicProvider.chat.mockRejectedValueOnce(new Error('API Error'));

      jest.spyOn(router as any, 'getProvider')
        .mockReturnValueOnce(anthropicProvider)
        .mockReturnValueOnce(mockProviders.cohere);

      const response = await router.routePrompt('Test prompt');

      expect(anthropicProvider.chat).toHaveBeenCalled();
      expect(mockProviders.cohere.chat).toHaveBeenCalled();
      expect(response.content).toBe('Cohere response');
    });

    test('should track usage across providers', async () => {
      jest.spyOn(router as any, 'selectProvider')
        .mockResolvedValue({ provider: 'anthropic', model: 'claude-3-sonnet-20240229' });
      
      jest.spyOn(router as any, 'getProvider')
        .mockReturnValue(mockProviders.anthropic);

      await router.routePrompt('First prompt');
      await router.routePrompt('Second prompt');

      const usage = router.getUsageStats();
      expect(usage.totalRequests).toBe(2);
      expect(usage.totalCost).toBeCloseTo(0.002, 6);
    });
  });

  describe('Multi-Model Operations', () => {
    beforeEach(() => {
      jest.spyOn(router as any, 'getProvider')
        .mockImplementation((providerName: string) => {
          return mockProviders[providerName];
        });
    });

    test('should execute parallel requests', async () => {
      const providers = [
        { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
        { provider: 'cohere', model: 'command-r-plus' }
      ];

      const responses = await router.executeParallel('Test prompt', providers);

      expect(responses).toHaveLength(2);
      expect(responses[0].content).toBe('Anthropic response');
      expect(responses[1].content).toBe('Cohere response');
      expect(mockProviders.anthropic.chat).toHaveBeenCalled();
      expect(mockProviders.cohere.chat).toHaveBeenCalled();
    });

    test('should execute sequential requests', async () => {
      const providers = [
        { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
        { provider: 'cohere', model: 'command-r-plus' }
      ];

      const responses = await router.executeSequential('Test prompt', providers);

      expect(responses).toHaveLength(2);
      expect(responses[0].content).toBe('Anthropic response');
      expect(responses[1].content).toBe('Cohere response');
    });

    test('should generate consensus from multiple responses', async () => {
      // Mock different responses for consensus
      mockProviders.anthropic.chat.mockResolvedValue({
        content: 'This is a function that adds two numbers',
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        cost: 0.001
      });

      mockProviders.cohere.chat.mockResolvedValue({
        content: 'This function performs addition of two parameters',
        usage: { inputTokens: 8, outputTokens: 18, totalTokens: 26 },
        cost: 0.0008
      });

      const providers = [
        { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
        { provider: 'cohere', model: 'command-r-plus' }
      ];

      const consensus = await router.generateConsensus('What does this function do?', providers);

      expect(consensus.content).toContain('consensus');
      expect(consensus.sourceResponses).toHaveLength(2);
    });

    test('should compare responses from different models', async () => {
      mockProviders.anthropic.chat.mockResolvedValue({
        content: 'Anthropic explanation',
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        cost: 0.001
      });

      mockProviders.cohere.chat.mockResolvedValue({
        content: 'Cohere explanation',
        usage: { inputTokens: 8, outputTokens: 18, totalTokens: 26 },
        cost: 0.0008
      });

      const providers = [
        { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
        { provider: 'cohere', model: 'command-r-plus' }
      ];

      const comparison = await router.compareResponses('Explain this code', providers);

      expect(comparison.responses).toHaveLength(2);
      expect(comparison.analysis).toContain('comparison');
      expect(comparison.responses[0].content).toBe('Anthropic explanation');
      expect(comparison.responses[1].content).toBe('Cohere explanation');
    });
  });

  describe('Cost Management', () => {
    test('should track daily costs', async () => {
      jest.spyOn(router as any, 'selectProvider')
        .mockResolvedValue({ provider: 'anthropic', model: 'claude-3-sonnet-20240229' });
      
      jest.spyOn(router as any, 'getProvider')
        .mockReturnValue(mockProviders.anthropic);

      await router.routePrompt('Test prompt');

      const usage = router.getUsageStats();
      expect(usage.dailyCost).toBeGreaterThan(0);
      expect(usage.totalCost).toBeGreaterThan(0);
    });

    test('should enforce daily cost limits', async () => {
      // Set a very low daily limit
      const lowLimitRouter = new ModelRouter();
      (lowLimitRouter as any).config.maxCostPerDay = 0.0001;

      jest.spyOn(lowLimitRouter as any, 'selectProvider')
        .mockResolvedValue({ provider: 'anthropic', model: 'claude-3-sonnet-20240229' });
      
      jest.spyOn(lowLimitRouter as any, 'getProvider')
        .mockReturnValue(mockProviders.anthropic);

      // First request should work
      await lowLimitRouter.routePrompt('Test prompt');

      // Second request should fail due to cost limit
      await expect(
        lowLimitRouter.routePrompt('Another prompt')
      ).rejects.toThrow('Daily cost limit exceeded');
    });

    test('should provide cost estimates', async () => {
      jest.spyOn(router as any, 'getProvider')
        .mockReturnValue({
          estimateCost: jest.fn().mockReturnValue(0.005)
        });

      const estimate = await router.estimateCost('anthropic', 'claude-3-sonnet-20240229', 1000, 500);
      expect(estimate).toBe(0.005);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      jest.spyOn(router as any, 'selectProvider')
        .mockResolvedValue({ provider: 'anthropic', model: 'claude-3-sonnet-20240229' });
      
      const failingProvider = {
        chat: jest.fn().mockRejectedValue(new Error('Network error'))
      };
      
      jest.spyOn(router as any, 'getProvider')
        .mockReturnValue(failingProvider);

      await expect(
        router.routePrompt('Test prompt')
      ).rejects.toThrow('Network error');
    });

    test('should handle invalid API keys', async () => {
      jest.spyOn(AnthropicProvider.prototype, 'validateApiKey')
        .mockResolvedValue(false);

      await expect(
        router.initialize()
      ).rejects.toThrow('Invalid API key');
    });

    test('should handle provider initialization failures', async () => {
      jest.spyOn(AnthropicProvider.prototype, 'validateApiKey')
        .mockRejectedValue(new Error('Validation failed'));

      await expect(
        router.initialize()
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('Configuration Management', () => {
    test('should update routing mode', async () => {
      await router.updateRoutingMode('speed');
      expect((router as any).config.routingMode).toBe('speed');
    });

    test('should enable/disable providers', async () => {
      await router.toggleProvider('anthropic', false);
      expect(router.getAvailableProviders()).not.toContain('anthropic');
      
      await router.toggleProvider('anthropic', true);
      expect(router.getAvailableProviders()).toContain('anthropic');
    });

    test('should update cost limits', async () => {
      await router.updateCostLimit(10.0);
      expect((router as any).config.maxCostPerDay).toBe(10.0);
    });
  });
});
