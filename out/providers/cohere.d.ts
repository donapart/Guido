/**
 * Cohere Provider
 * Supports Cohere Command models for text generation and chat
 */
import { Provider, ChatMessage, ProviderConfig, ChatOptions, ChatStreamChunk, ChatResult } from './base';
export interface CohereConfig extends ProviderConfig {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
}
export interface CohereMessage {
    role: 'USER' | 'CHATBOT' | 'SYSTEM';
    message: string;
}
export declare class CohereProvider implements Provider {
    private config;
    constructor(config: CohereConfig);
    id(): string;
    supports(model: string): boolean;
    estimateTokens(input: string): number;
    isAvailable(): Promise<boolean>;
    chat(model: string, messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<ChatStreamChunk>;
    chatComplete(model: string, messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult>;
    private convertMessages;
    estimateCost(model: string, inputTokens: number, outputTokens: number): number;
    private detectClassification;
    private detectFunctionCalling;
    validateModel(model: string): boolean;
}
//# sourceMappingURL=cohere.d.ts.map