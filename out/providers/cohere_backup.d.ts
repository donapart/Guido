/**
 * Cohere Provider
 * Supports Cohere Command models for text generation and chat
 */
import { Provider, ChatMessage, ProviderConfig } from './base';
export interface CohereConfig extends ProviderConfig {
    apiKey: string;
    baseUrl?: string;
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
export interface CohereResponse {
    response_id: string;
    text: string;
    generation_id: string;
    citations?: any[];
    documents?: any[];
    is_search_required?: boolean;
    search_queries?: any[];
    search_results?: any[];
    finish_reason: 'COMPLETE' | 'MAX_TOKENS' | 'ERROR' | 'ERROR_TOXIC';
    token_count: {
        prompt_tokens: number;
        response_tokens: number;
        total_tokens: number;
        billed_tokens: number;
    };
    meta?: {
        api_version: {
            version: string;
        };
        billed_units: {
            input_tokens: number;
            output_tokens: number;
        };
    };
}
export declare class CohereProvider implements Provider {
    private config;
    private baseUrl;
    constructor(config: CohereConfig);
    id(): string;
    name(): string;
    getAvailableModels(): Promise<string[]>;
    chat(messages: ChatMessage[], options?: {
        stream?: boolean;
        model?: string;
    }): Promise<any>;
    streamChat(messages: ChatMessage[], onChunk: StreamHandler, options?: {
        model?: string;
    }): Promise<void>;
    estimateTokens(text: string): number;
    estimateCost(promptTokens: number, completionTokens: number, model?: string): number;
    supportsStreaming(): boolean;
    supportsImages(): boolean;
    supportsJsonMode(): boolean;
    supportsFunctionCalling(): boolean;
    getMaxContextLength(model?: string): number;
    private convertMessages;
    validateConnection(): Promise<boolean>;
    getModelCapabilities(model?: string): {
        maxContextLength: number;
        supportsImages: boolean;
        supportsFunctions: boolean;
        supportsStreaming: boolean;
    };
    generateText(prompt: string, options?: {
        model?: string;
        maxTokens?: number;
        temperature?: number;
        stopSequences?: string[];
    }): Promise<{
        text: string;
        likelihood?: number;
        tokenLikelihood?: Array<{
            token: string;
            likelihood: number;
        }>;
    }>;
    classify(inputs: string[], examples: Array<{
        text: string;
        label: string;
    }>): Promise<Array<{
        input: string;
        prediction: string;
        confidence: number;
        labels: Record<string, number>;
    }>>;
}
//# sourceMappingURL=cohere_backup.d.ts.map