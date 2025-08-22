/**
 * Ollama provider implementation for local models
 * Supports Llama, Qwen, CodeLlama and other models via Ollama
 */

import {
    BaseProvider,
    ChatMessage,
    ChatOptions,
    ChatStreamChunk,
    ProviderConfig,
    ProviderError,
    TokenUsage,
} from "./base";

export interface OllamaConfig extends ProviderConfig {
  kind: "ollama";
  keepAlive?: string; // e.g., "5m", "30s"
}

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
  };
  keep_alive?: string;
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message?: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export class OllamaProvider extends BaseProvider {
  protected config: OllamaConfig;

  constructor(config: OllamaConfig) {
    super(config);
    this.config = config;
  }

  estimateTokens(input: string): number {
    // Ollama models typically use similar tokenization to Llama
    // Slightly more efficient than OpenAI models
    const words = input.split(/\s+/).length;
    const chars = input.length;
    
    // Llama tokenization is typically more efficient
    return Math.max(Math.ceil(words * 0.7), Math.ceil(chars / 3.5));
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
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

    const request: OllamaChatRequest = {
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
      keep_alive: this.config.keepAlive || "5m",
    };

    if (opts.temperature !== undefined || opts.maxTokens !== undefined) {
      request.options = {};
      
      if (opts.temperature !== undefined) {
        request.options.temperature = opts.temperature;
      }
      
      if (opts.maxTokens !== undefined) {
        request.options.num_predict = opts.maxTokens;
      }
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: opts.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, model);
      }

      if (!response.body) {
        throw new ProviderError("No response body", this.id(), model);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const data: OllamaChatResponse = JSON.parse(trimmed);

              if (data.message?.content) {
                yield {
                  type: "text",
                  data: data.message.content,
                };
              }

              if (data.done) {
                const usage: TokenUsage = {
                  inputTokens: data.prompt_eval_count || 0,
                  outputTokens: data.eval_count || 0,
                };

                yield {
                  type: "done",
                  data: {
                    usage,
                    finishReason: "stop",
                    performance: {
                      totalDuration: data.total_duration,
                      loadDuration: data.load_duration,
                      promptEvalDuration: data.prompt_eval_duration,
                      evalDuration: data.eval_duration,
                    },
                  },
                };
                return;
              }
            } catch (parseError) {
              // Skip malformed JSON lines
              continue;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // If we exit the loop without receiving done=true
      yield {
        type: "done",
        data: { finishReason: "stop" },
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

  private async handleErrorResponse(response: Response, model?: string): Promise<never> {
    let errorMessage = `HTTP ${response.status}`;
    
    try {
      const errorData = await response.json() as any;
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    // Check for common Ollama errors
    if (response.status === 404) {
      errorMessage = `Model '${model}' not found. Make sure it's pulled in Ollama.`;
    }

    throw new ProviderError(errorMessage, this.id(), model, response.status);
  }

  /**
   * Get list of available models from Ollama
   */
  async getAvailableModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json() as any;
      return data.models || [];
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

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string, progress?: (status: string, percent?: number) => void): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: modelName, stream: true }),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, modelName);
      }

      if (!response.body) {
        throw new ProviderError("No response body", this.id(), modelName);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const lines = decoder.decode(value).split("\n");
          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              const data = JSON.parse(line);
              if (progress && data.status) {
                const percent = data.completed && data.total 
                  ? Math.round((data.completed / data.total) * 100) 
                  : undefined;
                progress(data.status, percent);
              }
            } catch {
              // Ignore malformed JSON
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `Failed to pull model: ${error instanceof Error ? error.message : String(error)}`,
        this.id(),
        modelName
      );
    }
  }

  /**
   * Test connection and model availability
   */
  async testConnection(testModel?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return { success: false, error: "Ollama server not available" };
      }

      // Check if we have any models
      const models = await this.getAvailableModels();
      if (models.length === 0) {
        return { success: false, error: "No models available in Ollama" };
      }

      // Try a test model if specified, otherwise use the first available
      const modelToTest = testModel || models[0].name;
      
      if (!this.supports(modelToTest)) {
        return { success: false, error: `Model ${modelToTest} not configured` };
      }

      // Test with a simple chat
      const result = await this.chatComplete(modelToTest, [
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
   * Check if a specific model is pulled and available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.getAvailableModels();
      return models.some(m => m.name === modelName);
    } catch {
      return false;
    }
  }
}
