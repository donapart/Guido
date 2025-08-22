"use strict";
/**
 * Ollama provider implementation for local models
 * Supports Llama, Qwen, CodeLlama and other models via Ollama
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
const base_1 = require("./base");
class OllamaProvider extends base_1.BaseProvider {
    config;
    constructor(config) {
        super(config);
        this.config = config;
    }
    estimateTokens(input) {
        // Ollama models typically use similar tokenization to Llama
        // Slightly more efficient than OpenAI models
        const words = input.split(/\s+/).length;
        const chars = input.length;
        // Llama tokenization is typically more efficient
        return Math.max(Math.ceil(words * 0.7), Math.ceil(chars / 3.5));
    }
    async isAvailable() {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/tags`, {
                method: "GET",
                signal: AbortSignal.timeout(3000),
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async *chat(model, messages, opts = {}) {
        if (!this.supports(model)) {
            throw new base_1.ProviderError(`Model ${model} not supported`, this.id(), model);
        }
        const request = {
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
                throw new base_1.ProviderError("No response body", this.id(), model);
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    // Keep the last incomplete line in the buffer
                    buffer = lines.pop() || "";
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed)
                            continue;
                        try {
                            const data = JSON.parse(trimmed);
                            if (data.message?.content) {
                                yield {
                                    type: "text",
                                    data: data.message.content,
                                };
                            }
                            if (data.done) {
                                const usage = {
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
                        }
                        catch (parseError) {
                            // Skip malformed JSON lines
                            continue;
                        }
                    }
                }
            }
            finally {
                reader.releaseLock();
            }
            // If we exit the loop without receiving done=true
            yield {
                type: "done",
                data: { finishReason: "stop" },
            };
        }
        catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                yield { type: "error", error: "Request cancelled" };
            }
            else if (error instanceof base_1.ProviderError) {
                yield { type: "error", error: error.message };
            }
            else {
                yield {
                    type: "error",
                    error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
    }
    async handleErrorResponse(response, model) {
        let errorMessage = `HTTP ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData.error) {
                errorMessage = errorData.error;
            }
        }
        catch {
            errorMessage = response.statusText || errorMessage;
        }
        // Check for common Ollama errors
        if (response.status === 404) {
            errorMessage = `Model '${model}' not found. Make sure it's pulled in Ollama.`;
        }
        throw new base_1.ProviderError(errorMessage, this.id(), model, response.status);
    }
    /**
     * Get list of available models from Ollama
     */
    async getAvailableModels() {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/tags`);
            if (!response.ok) {
                await this.handleErrorResponse(response);
            }
            const data = await response.json();
            return data.models || [];
        }
        catch (error) {
            if (error instanceof base_1.ProviderError) {
                throw error;
            }
            throw new base_1.ProviderError(`Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`, this.id());
        }
    }
    /**
     * Pull a model from Ollama registry
     */
    async pullModel(modelName, progress) {
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
                throw new base_1.ProviderError("No response body", this.id(), modelName);
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    const lines = decoder.decode(value).split("\n");
                    for (const line of lines) {
                        if (!line.trim())
                            continue;
                        try {
                            const data = JSON.parse(line);
                            if (progress && data.status) {
                                const percent = data.completed && data.total
                                    ? Math.round((data.completed / data.total) * 100)
                                    : undefined;
                                progress(data.status, percent);
                            }
                        }
                        catch {
                            // Ignore malformed JSON
                        }
                    }
                }
            }
            finally {
                reader.releaseLock();
            }
        }
        catch (error) {
            if (error instanceof base_1.ProviderError) {
                throw error;
            }
            throw new base_1.ProviderError(`Failed to pull model: ${error instanceof Error ? error.message : String(error)}`, this.id(), modelName);
        }
    }
    /**
     * Test connection and model availability
     */
    async testConnection(testModel) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Check if a specific model is pulled and available
     */
    async isModelAvailable(modelName) {
        try {
            const models = await this.getAvailableModels();
            return models.some(m => m.name === modelName);
        }
        catch {
            return false;
        }
    }
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=ollama.js.map