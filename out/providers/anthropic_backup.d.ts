/**
 * Anthropic Claude Provider
 * Supports Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku models
 */
import { Provider, ChatMessage, ProviderConfig } from './base';
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
export interface AnthropicResponse {
    id: string;
    type: 'message';
    role: 'assistant';
    content: Array<{
        type: 'text';
        text: string;
    }>;
    model: string;
    stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
    stop_sequence?: string;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}
export declare class AnthropicProvider implements Provider {
    private config;
    private baseUrl;
    constructor(config: AnthropicConfig);
    id(): string;
    supports(model: string): boolean;
    estimateTokens(input: string): number;
    isAvailable(): Promise<boolean>;
    chat(model: string, messages: ChatMessage[], opts?: any): AsyncIterable<any>;
    chatComplete(model: string, messages: ChatMessage[], opts?: any): Promise<any>;
    const model: any;
    const anthropicMessages: any;
    const requestBody: {
        model: any;
        messages: any;
        max_tokens: number;
        temperature: number;
        top_p: number;
        top_k: number;
        stop_sequences: string[];
        stream: any;
    };
    const response: Response;
    if(: any, response: any, ok: any): void;
    const result: AnthropicResponse;
}
//# sourceMappingURL=anthropic_backup.d.ts.map