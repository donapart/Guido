"use strict";
/**
 * Base types and interfaces for Model Router providers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationError = exports.RateLimitError = exports.ProviderError = exports.BaseProvider = void 0;
/**
 * Abstract base class providing common functionality
 */
class BaseProvider {
    config;
    constructor(config) {
        this.config = config;
    }
    id() {
        return this.config.id;
    }
    supports(model) {
        return this.config.models.includes(model);
    }
    estimateTokens(input) {
        // Basic heuristic: ~4 chars per token for English text
        return Math.ceil(input.length / 4);
    }
    async isAvailable() {
        try {
            // Basic connectivity check - subclasses can override
            const response = await fetch(this.config.baseUrl, {
                method: "HEAD",
                signal: AbortSignal.timeout(5000),
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async chatComplete(model, messages, opts) {
        let content = "";
        let usage;
        let finishReason = "stop";
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
        }
        catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                finishReason = "cancelled";
            }
            else {
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
    async *parseStreamingResponse(response) {
        if (!response.body) {
            throw new Error("No response body");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const text = decoder.decode(value, { stream: true });
                const lines = text.split("\n");
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed && trimmed.startsWith("data: ")) {
                        const data = trimmed.slice(6);
                        if (data === "[DONE]")
                            return;
                        yield data;
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
}
exports.BaseProvider = BaseProvider;
/**
 * Error types for provider operations
 */
class ProviderError extends Error {
    provider;
    model;
    statusCode;
    constructor(message, provider, model, statusCode) {
        super(message);
        this.provider = provider;
        this.model = model;
        this.statusCode = statusCode;
        this.name = "ProviderError";
    }
}
exports.ProviderError = ProviderError;
class RateLimitError extends ProviderError {
    constructor(provider, model, retryAfter) {
        super(`Rate limit exceeded for ${provider}:${model}`, provider, model, 429);
        this.name = "RateLimitError";
    }
}
exports.RateLimitError = RateLimitError;
class AuthenticationError extends ProviderError {
    constructor(provider) {
        super(`Authentication failed for ${provider}`, provider, undefined, 401);
        this.name = "AuthenticationError";
    }
}
exports.AuthenticationError = AuthenticationError;
//# sourceMappingURL=base.js.map