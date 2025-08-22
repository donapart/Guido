/**
 * Prompt Classifier for Model Router
 * Analyzes prompts to determine optimal model characteristics
 */
import { Provider } from "./providers/base";
export type PromptClass = "boilerplate" | "tests" | "bug" | "refactor" | "docs" | "optimization" | "architecture" | "creative" | "analysis" | "conversation" | "reasoning" | "general";
export interface ClassificationResult {
    class: PromptClass;
    confidence: number;
    reasoning: string[];
    characteristics: {
        complexity: "low" | "medium" | "high";
        creativity: "low" | "medium" | "high";
        technical: "low" | "medium" | "high";
        contextSize: "small" | "medium" | "large";
    };
    suggestedCapabilities: string[];
}
export interface ClassifierConfig {
    enabled: boolean;
    useLocalModel: boolean;
    localModelProvider?: string;
    localModelName?: string;
    fallbackToHeuristic: boolean;
    cacheResults: boolean;
}
export declare class PromptClassifier {
    private cache;
    private config;
    private localProvider?;
    constructor(config: ClassifierConfig, localProvider?: Provider);
    /**
     * Classify a prompt to determine its characteristics
     */
    classify(prompt: string, context?: {
        filePath?: string;
        language?: string;
        fileSize?: number;
    }): Promise<ClassificationResult>;
    /**
     * Heuristic-based classification using pattern matching
     */
    private heuristicClassification;
    /**
     * LLM-based classification using a local model
     */
    private llmClassification;
    /**
     * Build prompt for LLM-based classification
     */
    private buildClassificationPrompt;
    /**
     * Adjust characteristics based on classification
     */
    private adjustCharacteristics;
    /**
     * Generate cache key for a prompt and context
     */
    private getCacheKey;
    /**
     * Simple hash function for caching
     */
    private simpleHash;
    /**
     * Clear classification cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        hitRate?: number;
    };
    /**
     * Get suggested models based on classification
     */
    getSuggestedModelsForClass(classification: PromptClass, availableModels: Array<{
        name: string;
        provider: string;
        caps?: string[];
        price?: {
            inputPerMTok: number;
            outputPerMTok: number;
        };
    }>): Array<{
        name: string;
        provider: string;
        score: number;
        reason: string;
    }>;
}
//# sourceMappingURL=promptClassifier.d.ts.map