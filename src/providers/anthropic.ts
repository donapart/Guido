/**
 * Anthropic Claude Provider
 * Supports Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku models
 */

import { Provider, ChatMessage, ProviderConfig, ChatOptions, ChatStreamChunk, ChatResult } from './base';

export interface AnthropicConfig extends ProviderConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
}

export interface AnthropicMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }>;
}

export class AnthropicProvider implements Provider {
  private config: AnthropicConfig;
  
  constructor(config: AnthropicConfig) {
    this.config = {
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1.0,
      topK: 40,
      model: 'claude-3-5-sonnet-20241022',
      ...config
    };
    
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required');
    }
  }

  id(): string {
    return this.config.id;
  }

  supports(model: string): boolean {
    const supportedModels = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
    return supportedModels.includes(model);
  }

  estimateTokens(input: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(input.length / 4);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/models`, {
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async *chat(model: string, messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<ChatStreamChunk> {
    // Convert messages to Anthropic format
    const anthropicMessages = this.convertMessages(messages);
    
    const requestBody = {
      model: model,
      messages: anthropicMessages,
      max_tokens: opts?.maxTokens || this.config.maxTokens || 4096,
      temperature: opts?.temperature ?? this.config.temperature ?? 0.7,
      stream: true
    };

    const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      yield { type: 'error', error: `Anthropic API error: ${response.status}` };
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
              if (parsed.delta?.text) {
                yield { type: 'text', data: parsed.delta.text };
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
    // Convert messages to Anthropic format
    const anthropicMessages = this.convertMessages(messages);
    
    const requestBody = {
      model: model,
      messages: anthropicMessages,
      max_tokens: opts?.maxTokens || this.config.maxTokens || 4096,
      temperature: opts?.temperature ?? this.config.temperature ?? 0.7,
      stream: false
    };

    const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    return {
      content: result.content[0]?.text || '',
      usage: {
        inputTokens: result.usage?.input_tokens || 0,
        outputTokens: result.usage?.output_tokens || 0
      },
      finishReason: result.stop_reason === 'end_turn' ? 'stop' : result.stop_reason
    };
  }

  private convertMessages(messages: ChatMessage[]): AnthropicMessage[] {
    return messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role as 'user' | 'assistant',
      content: msg.content
    }));
  }

  // Cost estimation methods
  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costs: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
    };
    
    const cost = costs[model];
    if (!cost) return 0;
    
    return (inputTokens / 1000) * cost.input + (outputTokens / 1000) * cost.output;
  }

  // Detect if input contains images
  private detectImages(content: string): boolean {
    return /data:image\/[^;]+;base64,/.test(content);
  }

  // Validate model selection
  validateModel(model: string): boolean {
    return this.supports(model);
  }
}
