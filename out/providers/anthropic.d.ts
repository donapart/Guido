/**
 * Anthropic Claude Provider
 * Supports Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku models
 */
import { Provider, ChatMessage, ProviderConfig, ChatOptions, ChatStreamChunk, ChatResult } from './base';
export interface AnthropicConfig extends ProviderConfig {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
}
export interface AnthropicMessage {
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{
        type: 'text' | 'image';
        text?: string;
        source?: {
            type: 'base64';
            media_type: string;
            data: string;
        };
    }>;
}
export declare class AnthropicProvider implements Provider {
    private config;
    constructor(config: AnthropicConfig);
    id(): string;
    supports(model: string): boolean;
    estimateTokens(input: string): number;
    isAvailable(): Promise<boolean>;
    chat(model: string, messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<ChatStreamChunk>;
    chatComplete(model: string, messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult>;
    private convertMessages;
    estimateCost(model: string, inputTokens: number, outputTokens: number): number;
    private detectImages;
    validateModel(model: string): boolean;
}
//# sourceMappingURL=anthropic.d.ts.map