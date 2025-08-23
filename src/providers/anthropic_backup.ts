/**
 * Anthropic Claude Provider
 * Supports Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku models
 */

import { Provider, ChatMessage, ProviderConfig } from './base';

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

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicProvider implements Provider {
  private config: AnthropicConfig;
  private baseUrl: string;
  
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

  async *chat(model: string, messages: ChatMessage[], opts?: any): AsyncIterable<any> {
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
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';
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
  }

  async chatComplete(model: string, messages: ChatMessage[], opts?: any): Promise<any> {
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
    const model = options?.model || this.config.model!;
    
    // Convert messages to Anthropic format
    const anthropicMessages = this.convertMessages(messages);
    
    const requestBody = {
      model,
      messages: anthropicMessages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      top_p: this.config.topP,
      top_k: this.config.topK,
      stop_sequences: this.config.stopSequences,
      stream: options?.stream || false
    };

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    if (options?.stream) {
      return response.body;
    }

    const result: AnthropicResponse = await response.json();
    
    return {
      content: result.content[0]?.text || '',
      model: result.model,
      usage: {
        promptTokens: result.usage.input_tokens,
        completionTokens: result.usage.output_tokens,
        totalTokens: result.usage.input_tokens + result.usage.output_tokens
      },
      finishReason: result.stop_reason
    };
  }

  async streamChat(messages: ChatMessage[], onChunk: StreamHandler, options?: { model?: string }): Promise<void> {
    const model = options?.model || this.config.model!;
    const anthropicMessages = this.convertMessages(messages);
    
    const requestBody = {
      model,
      messages: anthropicMessages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      top_p: this.config.topP,
      top_k: this.config.topK,
      stop_sequences: this.config.stopSequences,
      stream: true
    };

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                onChunk(parsed.delta.text);
              }
            } catch (e) {
              // Ignore parsing errors for partial chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for Claude
    return Math.ceil(text.length / 4);
  }

  estimateCost(promptTokens: number, completionTokens: number, model?: string): number {
    const modelName = model || this.config.model!;
    
    // Anthropic pricing (as of 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
      'claude-3-5-haiku-20241022': { input: 0.0008, output: 0.004 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
    };
    
    const rates = pricing[modelName] || pricing['claude-3-5-sonnet-20241022'];
    
    return (promptTokens / 1000) * rates.input + (completionTokens / 1000) * rates.output;
  }

  supportsStreaming(): boolean {
    return true;
  }

  supportsImages(): boolean {
    return true;
  }

  supportsJsonMode(): boolean {
    return false;
  }

  supportsFunctionCalling(): boolean {
    return false;
  }

  getMaxContextLength(model?: string): number {
    const modelName = model || this.config.model!;
    
    // Context lengths for different Claude models
    const contextLengths: Record<string, number> = {
      'claude-3-5-sonnet-20241022': 200000,
      'claude-3-5-haiku-20241022': 200000,
      'claude-3-opus-20240229': 200000,
      'claude-3-sonnet-20240229': 200000,
      'claude-3-haiku-20240307': 200000
    };
    
    return contextLengths[modelName] || 200000;
  }

  private convertMessages(messages: ChatMessage[]): AnthropicMessage[] {
    const converted: AnthropicMessage[] = [];
    
    for (const msg of messages) {
      // Skip system messages in the messages array - handle separately if needed
      if (msg.role === 'system') continue;
      
      converted.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      });
    }
    
    return converted;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      });
      
      return response.status === 200 || response.status === 400; // 400 might be expected for minimal request
    } catch (error) {
      console.error('Anthropic connection validation failed:', error);
      return false;
    }
  }

  getModelCapabilities(model?: string): {
    maxContextLength: number;
    supportsImages: boolean;
    supportsFunctions: boolean;
    supportsStreaming: boolean;
  } {
    const modelName = model || this.config.model!;
    
    return {
      maxContextLength: this.getMaxContextLength(modelName),
      supportsImages: this.supportsImages(),
      supportsFunctions: this.supportsFunctionCalling(),
      supportsStreaming: this.supportsStreaming()
    };
  }
}
