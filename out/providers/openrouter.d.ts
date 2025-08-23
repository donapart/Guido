/**
 * OpenRouter Provider
 * Universal API gateway for hundreds of AI models from leading providers
 */
import { Provider, ChatMessage, ProviderConfig, ChatOptions, ChatStreamChunk, ChatResult } from './base';
export interface OpenRouterConfig extends ProviderConfig {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
    transforms?: string[];
    route?: 'fallback' | 'manual';
}
export declare class OpenRouterProvider implements Provider {
    private config;
    constructor(config: OpenRouterConfig);
    id(): string;
    supports(model: string): boolean;
    estimateTokens(input: string): number;
    isAvailable(): Promise<boolean>;
    chat(model: string, messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<ChatStreamChunk>;
    chatComplete(model: string, messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult>;
    getAvailableModels(): Promise<string[]>;
    estimateCost(model: string, inputTokens: number, outputTokens: number): number;
    getModelInfo(model: string): Promise<any>;
    validateModel(model: string): boolean;
}
//# sourceMappingURL=openrouter.d.ts.map