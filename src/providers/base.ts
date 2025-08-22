/**
 * Base types and interfaces for Model Router providers
 */

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
  toolsJsonSchema?: any;
  signal?: AbortSignal;
}

export interface ChatStreamChunk {
  type: "text" | "tool" | "done" | "error";
  data?: string | any;
  error?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
}

export interface ChatResult {
  content: string;
  usage?: TokenUsage;
  finishReason?: "stop" | "length" | "tool_calls" | "cancelled";
}

export interface ProviderConfig {
  id: string;
  kind: "openai-compat" | "ollama" | "custom";
  baseUrl: string;
  apiKey?: string;
  models: string[];
  timeout?: number;
  maxRetries?: number;
}

/**
 * Base Provider interface that all model providers must implement
 */
export interface Provider {
  /**
   * Unique identifier for this provider
   */
  id(): string;

  /**
   * Check if provider supports a specific model
   */
  supports(model: string): boolean;

  /**
   * Estimate token count for given input (heuristic)
   */
  estimateTokens(input: string): number;

  /**
   * Check if provider is available (network, API key, etc.)
   */
  isAvailable(): Promise<boolean>;

  /**
   * Stream chat completion
   */
  chat(
    model: string,
    messages: ChatMessage[],
    opts?: ChatOptions
  ): AsyncIterable<ChatStreamChunk>;

  /**
   * Non-streaming chat completion
   */
  chatComplete(
    model: string,
    messages: ChatMessage[],
    opts?: ChatOptions
  ): Promise<ChatResult>;
}

/**
 * Abstract base class providing common functionality
 */
export abstract class BaseProvider implements Provider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  id(): string {
    return this.config.id;
  }

  supports(model: string): boolean {
    return this.config.models.includes(model);
  }

  estimateTokens(input: string): number {
    // Basic heuristic: ~4 chars per token for English text
    return Math.ceil(input.length / 4);
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Basic connectivity check - subclasses can override
      const response = await fetch(this.config.baseUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  abstract chat(
    model: string,
    messages: ChatMessage[],
    opts?: ChatOptions
  ): AsyncIterable<ChatStreamChunk>;

  async chatComplete(
    model: string,
    messages: ChatMessage[],
    opts?: ChatOptions
  ): Promise<ChatResult> {
    let content = "";
    let usage: TokenUsage | undefined;
    let finishReason: ChatResult["finishReason"] = "stop";

    try {
      for await (const chunk of this.chat(model, messages, opts)) {
        switch (chunk.type) {
          case "text":
            if (chunk.data) {
              content += chunk.data;
            }
            break;
          case "done":
            if (chunk.data && typeof chunk.data === "object") {
              usage = chunk.data.usage;
              finishReason = chunk.data.finishReason || "stop";
            }
            break;
          case "error":
            throw new Error(chunk.error || "Chat completion failed");
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        finishReason = "cancelled";
      } else {
        throw error;
      }
    }

    return {
      content,
      usage,
      finishReason,
    };
  }

  /**
   * Utility method to handle streaming response parsing
   */
  protected async *parseStreamingResponse(
    response: Response
  ): AsyncIterable<string> {
    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);
            if (data === "[DONE]") return;
            yield data;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * Error types for provider operations
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public model?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export class RateLimitError extends ProviderError {
  constructor(provider: string, model?: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}:${model}`, provider, model, 429);
    this.name = "RateLimitError";
  }
}

export class AuthenticationError extends ProviderError {
  constructor(provider: string) {
    super(`Authentication failed for ${provider}`, provider, undefined, 401);
    this.name = "AuthenticationError";
  }
}
