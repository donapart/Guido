/**
 * OpenAI-compatible provider implementation
 * Supports OpenAI, DeepSeek, Grok, Phi and other OpenAI-compatible APIs
 */

import {
    AuthenticationError,
    BaseProvider,
    ChatMessage,
    ChatOptions,
    ChatStreamChunk,
    ProviderConfig,
    ProviderError,
    RateLimitError,
    TokenUsage,
} from "./base";

export interface OpenAICompatConfig extends ProviderConfig {
  kind: "openai-compat";
  organizationId?: string;
  defaultHeaders?: Record<string, string>;
}

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  response_format?: { type: "json_object" };
  tools?: any[];
  tool_choice?: string | object;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message?: {
      role: string;
      content: string;
      tool_calls?: any[];
    };
    delta?: {
      role?: string;
      content?: string;
      tool_calls?: any[];
    };
    finish_reason?: "stop" | "length" | "tool_calls" | "content_filter";
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAICompatProvider extends BaseProvider {
  protected config: OpenAICompatConfig;

  constructor(config: OpenAICompatConfig) {
    super(config);
    this.config = config;
  }

  estimateTokens(input: string): number {
    // More accurate estimation for OpenAI-style tokenization
    // This is still heuristic but closer to reality
    const words = input.split(/\s+/).length;
    const chars = input.length;
    
    // Rough approximation: 0.75 tokens per word, but at least chars/4
    return Math.max(Math.ceil(words * 0.75), Math.ceil(chars / 4));
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async *chat(
    model: string,
    messages: ChatMessage[],
    opts: ChatOptions = {}
  ): AsyncIterable<ChatStreamChunk> {
    if (!this.supports(model)) {
      throw new ProviderError(`Model ${model} not supported`, this.id(), model);
    }

    if (!this.config.apiKey) {
      throw new AuthenticationError(this.id());
    }

    const request: OpenAIRequest = {
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      max_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 0.0,
      stream: true,
    };

    if (opts.json) {
      request.response_format = { type: "json_object" };
    }

    if (opts.toolsJsonSchema) {
      request.tools = opts.toolsJsonSchema;
      request.tool_choice = "auto";
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(request),
        signal: opts.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      if (!response.body) {
        throw new ProviderError("No response body", this.id(), model);
      }

      let totalTokens: TokenUsage | undefined;

      for await (const line of this.parseStreamingResponse(response)) {
        try {
          const data: OpenAIResponse = JSON.parse(line);
          
          if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0];
            
            if (choice.delta?.content) {
              yield {
                type: "text",
                data: choice.delta.content,
              };
            }

            if (choice.delta?.tool_calls) {
              yield {
                type: "tool",
                data: choice.delta.tool_calls,
              };
            }

            if (choice.finish_reason) {
              if (data.usage) {
                totalTokens = {
                  inputTokens: data.usage.prompt_tokens,
                  outputTokens: data.usage.completion_tokens,
                };
              }

              yield {
                type: "done",
                data: {
                  usage: totalTokens,
                  finishReason: choice.finish_reason,
                },
              };
              return;
            }
          }
        } catch (parseError) {
          // Ignore malformed JSON lines in stream
          continue;
        }
      }

      // If we get here without a finish_reason, the stream ended unexpectedly
      yield {
        type: "done",
        data: { usage: totalTokens, finishReason: "stop" },
      };

    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        yield { type: "error", error: "Request cancelled" };
      } else if (error instanceof ProviderError) {
        yield { type: "error", error: error.message };
      } else {
        yield { 
          type: "error", 
          error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiKey}`,
      "User-Agent": "VSCode-Model-Router/0.1.0",
    };

    if (this.config.organizationId) {
      headers["OpenAI-Organization"] = this.config.organizationId;
    }

    if (this.config.defaultHeaders) {
      Object.assign(headers, this.config.defaultHeaders);
    }

    return headers;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}`;
    
    try {
      const errorData = await response.json() as any;
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // If we can't parse error, use status text
      errorMessage = response.statusText || errorMessage;
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(this.id());
      case 429:
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError(
          this.id(),
          undefined,
          retryAfter ? parseInt(retryAfter) : undefined
        );
      default:
        throw new ProviderError(errorMessage, this.id(), undefined, response.status);
    }
  }

  /**
   * Test connection with a simple request
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return { success: false, error: "Provider not available" };
      }

      // Try a minimal chat request
      const testModel = this.config.models[0];
      if (!testModel) {
        return { success: false, error: "No models configured" };
      }

      const result = await this.chatComplete(testModel, [
        { role: "user", content: "Hi" }
      ], { maxTokens: 5 });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * Get list of available models from the API
   */
  async getAvailableModels(): Promise<string[]> {
    if (!this.config.apiKey) {
      throw new AuthenticationError(this.id());
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json() as any;
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`,
        this.id()
      );
    }
  }
}
