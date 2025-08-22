/**
 * Model Router Engine - Core routing logic and rule evaluation
 */
import { ModelConfig, ProfileConfig, RoutingRule } from "./config";
import { Provider } from "./providers/base";
import { BudgetManager } from "./price";
export interface RoutingContext {
    prompt: string;
    lang?: string;
    filePath?: string;
    fileSizeKB?: number;
    mode?: string;
    privacyStrict?: boolean;
    keywords?: string[];
    metadata?: Record<string, any>;
}
export interface RoutingResult {
    providerId: string;
    modelName: string;
    provider: Provider;
    model: ModelConfig;
    score: number;
    rule?: RoutingRule;
    reasoning: string[];
}
export interface RouterOptions {
    maxFallbacks?: number;
    requireAvailable?: boolean;
    budgetCheck?: boolean;
}
export declare class ModelRouter {
    private profile;
    private providers;
    private modelConfigs;
    private budgetManager?;
    constructor(profile: ProfileConfig, providers: Map<string, Provider>, budgetManager?: BudgetManager);
    /** Expose read-only profile for status/budget display */
    getProfile(): ProfileConfig;
    /**
     * Route a request to the best available model
     */
    route(context: RoutingContext, options?: RouterOptions): Promise<RoutingResult>;
    /**
     * Score all routing rules against the context
     */
    private scoreRules;
    /**
     * Score a single rule against the context
     */
    private scoreRule;
    /**
     * Expand candidate preferences with fallbacks and mode-specific overrides
     */
    private expandCandidates;
    /**
     * Validate a candidate model and create routing result
     */
    private validateCandidate;
    /**
     * Apply privacy mode overrides to context
     */
    private applyPrivacyMode;
    /**
     * Extract keywords from prompt for rule matching
     */
    private extractKeywords;
    /**
     * Check if a path matches a glob-like pattern
     */
    private matchesPattern;
    /**
     * Strip large content while preserving structure
     */
    private stripLargeContent;
    /**
     * Estimate cost for a prompt with a given model
     */
    private estimateCost;
    /**
     * Get provider configuration by ID
     */
    private getProviderConfig;
    /**
     * Get all available models with their capabilities
     */
    getAvailableModels(): Array<{
        providerId: string;
        modelName: string;
        config: ModelConfig;
        provider: Provider;
    }>;
    /**
     * Get models with specific capabilities
     */
    getModelsByCap(capability: string): Array<{
        providerId: string;
        modelName: string;
        config: ModelConfig;
    }>;
    /**
     * Simulate routing without actually executing
     */
    simulateRoute(context: RoutingContext): Promise<{
        result?: RoutingResult;
        alternatives: Array<{
            providerId: string;
            modelName: string;
            score: number;
            available: boolean;
            reasoning: string[];
        }>;
    }>;
}
//# sourceMappingURL=router.d.ts.map