"use strict";
/**
 * OpenAI-compatible provider implementation
 * Supports OpenAI, DeepSeek, Grok, Phi and other OpenAI-compatible APIs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAICompatProvider = void 0;
const base_1 = require("./base");
class OpenAICompatProvider extends base_1.BaseProvider {
    config;
    constructor(config) {
        super(config);
        this.config = config;
    }
    estimateTokens(input) {
        // More accurate estimation for OpenAI-style tokenization
        // This is still heuristic but closer to reality
        const words = input.split(/\s+/).length;
        const chars = input.length;
        // Rough approximation: 0.75 tokens per word, but at least chars/4
        return Math.max(Math.ceil(words * 0.75), Math.ceil(chars / 4));
    }
    async isAvailable() {
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
        }
        catch {
            return false;
        }
    }
    async *chat(model, messages, opts = {}) {
        if (!this.supports(model)) {
            throw new base_1.ProviderError(`Model ${model} not supported`, this.id(), model);
        }
        if (!this.config.apiKey) {
            throw new base_1.AuthenticationError(this.id());
        }
        const request = {
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
                throw new base_1.ProviderError("No response body", this.id(), model);
            }
            let totalTokens;
            for await (const line of this.parseStreamingResponse(response)) {
                try {
                    const data = JSON.parse(line);
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
                }
                catch (parseError) {
                    // Ignore malformed JSON lines in stream
                    continue;
                }
            }
            // If we get here without a finish_reason, the stream ended unexpectedly
            yield {
                type: "done",
                data: { usage: totalTokens, finishReason: "stop" },
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
    getHeaders() {
        const headers = {
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
    async handleErrorResponse(response) {
        let errorMessage = `HTTP ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData.error?.message) {
                errorMessage = errorData.error.message;
            }
        }
        catch {
            // If we can't parse error, use status text
            errorMessage = response.statusText || errorMessage;
        }
        switch (response.status) {
            case 401:
                throw new base_1.AuthenticationError(this.id());
            case 429:
                const retryAfter = response.headers.get("Retry-After");
                throw new base_1.RateLimitError(this.id(), undefined, retryAfter ? parseInt(retryAfter) : undefined);
            default:
                throw new base_1.ProviderError(errorMessage, this.id(), undefined, response.status);
        }
    }
    /**
     * Test connection with a simple request
     */
    async testConnection() {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Get list of available models from the API
     */
    async getAvailableModels() {
        if (!this.config.apiKey) {
            throw new base_1.AuthenticationError(this.id());
        }
        try {
            const response = await fetch(`${this.config.baseUrl}/models`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) {
                await this.handleErrorResponse(response);
            }
            const data = await response.json();
            return data.data?.map((model) => model.id) || [];
        }
        catch (error) {
            if (error instanceof base_1.ProviderError) {
                throw error;
            }
            throw new base_1.ProviderError(`Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`, this.id());
        }
    }
}
exports.OpenAICompatProvider = OpenAICompatProvider;
//# sourceMappingURL=openaiCompat.js.map