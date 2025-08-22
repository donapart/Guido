/**
 * Ollama provider implementation for local models
 * Supports Llama, Qwen, CodeLlama and other models via Ollama
 */
import { BaseProvider, ChatMessage, ChatOptions, ChatStreamChunk, ProviderConfig } from "./base";
export interface OllamaConfig extends ProviderConfig {
    kind: "ollama";
    keepAlive?: string;
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
export declare class OllamaProvider extends BaseProvider {
    protected config: OllamaConfig;
    constructor(config: OllamaConfig);
    estimateTokens(input: string): number;
    isAvailable(): Promise<boolean>;
    chat(model: string, messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<ChatStreamChunk>;
    private handleErrorResponse;
    /**
     * Get list of available models from Ollama
     */
    getAvailableModels(): Promise<OllamaModelInfo[]>;
    /**
     * Pull a model from Ollama registry
     */
    pullModel(modelName: string, progress?: (status: string, percent?: number) => void): Promise<void>;
    /**
     * Test connection and model availability
     */
    testConnection(testModel?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Check if a specific model is pulled and available
     */
    isModelAvailable(modelName: string): Promise<boolean>;
}
//# sourceMappingURL=ollama.d.ts.map