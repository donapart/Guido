/**
 * OpenRouter Provider
 * Universal API gateway for hundreds of AI models from leading providers
 */

import { Provider, ChatMessage, ProviderConfig, ChatOptions, ChatStreamChunk, ChatResult } from './base';

export interface OpenRouterConfig extends ProviderConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  transforms?: string[];
  route?: 'fallback' | 'manual';
}

export class OpenRouterProvider implements Provider {
  private config: OpenRouterConfig;
  
  constructor(config: OpenRouterConfig) {
    this.config = {
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1.0,
      model: 'anthropic/claude-3.5-sonnet',
      route: 'fallback',
      ...config
    };
    
    if (!this.config.apiKey) {
      throw new Error('OpenRouter API key is required');
    }
  }

  id(): string {
    return this.config.id;
  }

  supports(model: string): boolean {
    // OpenRouter supports hundreds of models, we'll allow most common ones
    const commonModels = [
      // OpenAI Models
      'openai/gpt-4o',
      'openai/gpt-4-turbo',
      'openai/gpt-3.5-turbo',
      // Anthropic Models  
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-haiku',
      // Meta Models
      'meta-llama/llama-3.1-405b-instruct',
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-8b-instruct',
      // Google Models
      'google/gemini-pro',
      'google/gemini-1.5-pro',
      // Mistral Models
      'mistralai/mistral-large',
      'mistralai/mistral-medium',
      'mistralai/mixtral-8x7b-instruct',
      // Cohere Models
      'cohere/command-r-plus',
      'cohere/command-r',
      // Other Popular Models
      'microsoft/wizardlm-2-8x22b',
      'deepseek/deepseek-chat',
      'qwen/qwen-2.5-72b-instruct'
    ];
    return commonModels.includes(model) || model.includes('/'); // Allow provider/model format
  }

  estimateTokens(input: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(input.length / 4);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': this.config.baseUrl,
          'X-Title': 'Guido Model Router'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async *chat(model: string, messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<ChatStreamChunk> {
    const requestBody = {
      model: model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: opts?.maxTokens || this.config.maxTokens || 4096,
      temperature: opts?.temperature ?? this.config.temperature ?? 0.7,
      top_p: this.config.topP || 1.0,
      frequency_penalty: this.config.frequencyPenalty || 0,
      presence_penalty: this.config.presencePenalty || 0,
      stop: this.config.stopSequences,
      stream: true,
      transforms: this.config.transforms,
      route: this.config.route
    };

    const response = await fetch(`${this.config.baseUrl}/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': this.config.baseUrl,
        'X-Title': 'Guido Model Router'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      yield { type: 'error', error: `OpenRouter API error: ${response.status} - ${response.statusText}` };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: 'error', error: 'No response body' };
      return;
    }

    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += new TextDecoder().decode(value);
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { type: 'done' };
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                yield { type: 'text', data: parsed.choices[0].delta.content };
              }
            } catch {
              // Ignore invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async chatComplete(model: string, messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult> {
    const requestBody = {
      model: model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: opts?.maxTokens || this.config.maxTokens || 4096,
      temperature: opts?.temperature ?? this.config.temperature ?? 0.7,
      top_p: this.config.topP || 1.0,
      frequency_penalty: this.config.frequencyPenalty || 0,
      presence_penalty: this.config.presencePenalty || 0,
      stop: this.config.stopSequences,
      stream: false,
      transforms: this.config.transforms,
      route: this.config.route
    };

    const response = await fetch(`${this.config.baseUrl}/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': this.config.baseUrl,
        'X-Title': 'Guido Model Router'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    const choice = result.choices?.[0];
    
    return {
      content: choice?.message?.content || '',
      usage: {
        inputTokens: result.usage?.prompt_tokens || 0,
        outputTokens: result.usage?.completion_tokens || 0
      },
      finishReason: choice?.finish_reason === 'stop' ? 'stop' : 
                   choice?.finish_reason === 'length' ? 'length' : choice?.finish_reason
    };
  }

  // Get available models from OpenRouter
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': this.config.baseUrl,
          'X-Title': 'Guido Model Router'
        }
      });
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch {
      return [];
    }
  }

  // Cost estimation for OpenRouter (varies by model)
  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    // OpenRouter pricing varies significantly by model
    // This is a rough estimate for common models
    const modelCosts: Record<string, { input: number; output: number }> = {
      'openai/gpt-4o': { input: 0.005, output: 0.015 },
      'anthropic/claude-3.5-sonnet': { input: 0.003, output: 0.015 },
      'meta-llama/llama-3.1-405b-instruct': { input: 0.003, output: 0.003 },
      'google/gemini-1.5-pro': { input: 0.0035, output: 0.0105 }
    };
    
    const cost = modelCosts[model];
    if (!cost) {
      // Default rough estimate
      return (inputTokens / 1000) * 0.001 + (outputTokens / 1000) * 0.002;
    }
    
    return (inputTokens / 1000) * cost.input + (outputTokens / 1000) * cost.output;
  }

  // Get model information
  async getModelInfo(model: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/models/${model}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': this.config.baseUrl,
          'X-Title': 'Guido Model Router'
        }
      });
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch {
      return null;
    }
  }

  // Validate model selection
  validateModel(model: string): boolean {
    return this.supports(model);
  }
}
