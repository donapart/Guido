/**
 * Experimentelles Advanced Routing System für Guido
 * Dynamische Modell-Auswahl und kontextbewusstes Routing
 */
import { Provider } from "../../providers/base";
import { ModelRouter } from "../../router";
export interface RoutingDecision {
    model: string;
    provider: string;
    reasoning: string;
    confidence: number;
    estimatedCost: number;
    performanceScore: number;
}
export interface PerformanceHistory {
    model: string;
    provider: string;
    successRate: number;
    averageResponseTime: number;
    costEfficiency: number;
    lastUsed: Date;
    usageCount: number;
}
export interface ContextAwareRouting {
    userContext: {
        expertise: string;
        preferences: Record<string, any>;
        recentModels: string[];
    };
    projectContext: {
        type: string;
        complexity: string;
        language: string;
        requirements: string[];
    };
    taskContext: {
        type: string;
        urgency: string;
        complexity: string;
        constraints: string[];
    };
}
export declare class ExperimentalRouting {
    private performanceHistory;
    private costHistory;
    private userPreferences;
    private router;
    private providers;
    constructor(router: ModelRouter, providers: Map<string, Provider>);
    /**
     * Dynamische Modell-Auswahl basierend auf Performance
     */
    dynamicModelSelection(prompt: string, context: any): Promise<string>;
    /**
     * Kontext-basierte Routing-Regeln
     */
    contextAwareRouting(prompt: string, context: any): Promise<RoutingDecision>;
    /**
     * Adaptive Kostenoptimierung
     */
    adaptiveCostOptimization(prompt: string, budget: number): Promise<string>;
    /**
     * Intelligente Modell-Kombination
     */
    intelligentModelCombination(prompt: string, context: any): Promise<string[]>;
    /**
     * Performance-basierte Modell-Auswahl
     */
    performanceBasedSelection(prompt: string): Promise<RoutingDecision>;
    private initializePerformanceTracking;
    private getPerformanceHistory;
    private getCostHistory;
    private analyzeTaskComplexity;
    private analyzeUserContext;
    private analyzeProjectContext;
    private analyzeTaskContext;
    private detectTaskType;
    private getModelCandidates;
    private selectBestPerformingModel;
    private calculateModelScore;
    private makeContextAwareDecision;
    private analyzePromptComplexity;
    private findOptimalModel;
    private estimateCost;
    private estimateQuality;
    private calculateOptimalScore;
    private decomposeTask;
    private selectModelCombination;
    private calculatePerformanceScores;
    private analyzePromptRequirements;
    private selectByPerformance;
    private getPerformanceScore;
    private updatePerformanceTracking;
    private updateCostTracking;
}
//# sourceMappingURL=advancedRouting.d.ts.map