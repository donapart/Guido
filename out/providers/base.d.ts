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
    chat(model: string, messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<ChatStreamChunk>;
    /**
     * Non-streaming chat completion
     */
    chatComplete(model: string, messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult>;
}
/**
 * Abstract base class providing common functionality
 */
export declare abstract class BaseProvider implements Provider {
    protected config: ProviderConfig;
    constructor(config: ProviderConfig);
    id(): string;
    supports(model: string): boolean;
    estimateTokens(input: string): number;
    isAvailable(): Promise<boolean>;
    abstract chat(model: string, messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<ChatStreamChunk>;
    chatComplete(model: string, messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult>;
    /**
     * Utility method to handle streaming response parsing
     */
    protected parseStreamingResponse(response: Response): AsyncIterable<string>;
}
/**
 * Error types for provider operations
 */
export declare class ProviderError extends Error {
    provider: string;
    model?: string | undefined;
    statusCode?: number | undefined;
    constructor(message: string, provider: string, model?: string | undefined, statusCode?: number | undefined);
}
export declare class RateLimitError extends ProviderError {
    constructor(provider: string, model?: string, retryAfter?: number);
}
export declare class AuthenticationError extends ProviderError {
    constructor(provider: string);
}
//# sourceMappingURL=base.d.ts.map