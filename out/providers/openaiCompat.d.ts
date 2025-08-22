/**
 * OpenAI-compatible provider implementation
 * Supports OpenAI, DeepSeek, Grok, Phi and other OpenAI-compatible APIs
 */
import { BaseProvider, ChatMessage, ChatOptions, ChatStreamChunk, ProviderConfig } from "./base";
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
    response_format?: {
        type: "json_object";
    };
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
export declare class OpenAICompatProvider extends BaseProvider {
    protected config: OpenAICompatConfig;
    constructor(config: OpenAICompatConfig);
    estimateTokens(input: string): number;
    isAvailable(): Promise<boolean>;
    chat(model: string, messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<ChatStreamChunk>;
    private getHeaders;
    private handleErrorResponse;
    /**
     * Test connection with a simple request
     */
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get list of available models from the API
     */
    getAvailableModels(): Promise<string[]>;
}
//# sourceMappingURL=openaiCompat.d.ts.map