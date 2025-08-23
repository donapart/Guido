/**
 * Hugging Face Provider
 * Access to Hugging Face Inference API and Hub models
 */
import { Provider, ChatMessage, ProviderConfig, ChatOptions, ChatStreamChunk, ChatResult } from './base';
export interface HuggingFaceConfig extends ProviderConfig {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    repetitionPenalty?: number;
    maxTime?: number;
    useCache?: boolean;
    waitForModel?: boolean;
}
export interface HuggingFaceMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export declare class HuggingFaceProvider implements Provider {
    private config;
    constructor(config: HuggingFaceConfig);
    id(): string;
    supports(model: string): boolean;
    estimateTokens(input: string): number;
    isAvailable(): Promise<boolean>;
    chat(model: string, messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<ChatStreamChunk>;
    chatComplete(model: string, messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult>;
    private convertMessagesToPrompt;
    getModelInfo(model: string): Promise<any>;
    estimateCost(model: string, inputTokens: number, outputTokens: number): number;
    supportsStreaming(model: string): boolean;
    isCodeModel(model: string): boolean;
    validateModel(model: string): boolean;
}
//# sourceMappingURL=huggingface.d.ts.map