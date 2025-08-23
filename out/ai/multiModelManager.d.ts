import { Provider } from '../providers/base';
import { ModelRouter } from '../router';
export interface ModelResponse {
    modelId: string;
    providerId: string;
    response: string;
    metadata: {
        tokens: number;
        cost: number;
        latency: number;
        timestamp: Date;
    };
    confidence?: number;
    reasoning?: string;
}
export interface MultiModelRequest {
    prompt: string;
    models: string[];
    strategy: 'parallel' | 'sequential' | 'consensus' | 'comparison';
    context?: {
        code?: string;
        language?: string;
        filePath?: string;
        projectContext?: string;
    };
}
export interface ConsensusResult {
    consensusResponse: string;
    confidence: number;
    agreementLevel: number;
    responses: ModelResponse[];
    reasoning: string;
}
export declare class MultiModelManager {
    private router;
    private providers;
    constructor(router: ModelRouter, providers: Map<string, Provider>);
    /**
     * Execute a request across multiple models
     */
    executeMultiModel(request: MultiModelRequest): Promise<ModelResponse[]>;
    /**
     * Execute requests in parallel across all specified models
     */
    private executeParallel;
    /**
     * Execute requests sequentially, allowing each response to inform the next
     */
    private executeSequential;
    /**
     * Build consensus from multiple model responses
     */
    buildConsensus(request: MultiModelRequest): Promise<ConsensusResult>;
    /**
     * Execute comparison analysis between models
     */
    private executeComparison;
    /**
     * Calculate cost based on token usage and model pricing
     */
    private calculateCost;
    /**
     * Calculate agreement level between responses
     */
    private calculateAgreementLevel;
    /**
     * Simple consensus building fallback
     */
    private buildSimpleConsensus;
    /**
     * Get recommended models for specific tasks
     */
    getRecommendedModels(taskType: string): string[];
}
//# sourceMappingURL=multiModelManager.d.ts.map