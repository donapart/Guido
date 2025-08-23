/**
 * Multi-Model Manager for parallel and sequential AI model execution
 */
import { Provider } from "../providers/base";
import { ModelRouter } from "../router";
export interface MultiModelRequest {
    prompt: string;
    models: string[];
    strategy: "parallel" | "sequential" | "consensus" | "comparison";
    options?: {
        temperature?: number;
        maxTokens?: number;
        timeout?: number;
    };
}
export interface MultiModelResponse {
    modelId: string;
    response: string;
    metadata: {
        duration: number;
        tokens: number;
        cost: number;
    };
}
export declare class MultiModelManager {
    private router;
    private providers;
    constructor(router: ModelRouter, providers: Map<string, Provider>);
    executeMultiModel(request: MultiModelRequest): Promise<MultiModelResponse[]>;
    private executeParallel;
    private executeSequential;
    private executeConsensus;
    private executeComparison;
}
//# sourceMappingURL=multiModelManager.d.ts.map