/**
 * Advanced Dashboard UI for Model Router
 * Enhanced experimental UI with interactive elements and visualizations
 */
import { ModelRouter } from '../router';
export interface RouteVisualization {
    prompt: string;
    rules: Array<{
        rule: string;
        score: number;
        matched: boolean;
        reasoning: string;
    }>;
    selectedProvider: string;
    selectedModel: string;
    confidence: number;
    alternatives: Array<{
        provider: string;
        model: string;
        score: number;
    }>;
}
export interface UsageStatistics {
    daily: {
        requests: number;
        tokens: number;
        cost: number;
        providers: Record<string, number>;
    };
    weekly: {
        requests: number;
        tokens: number;
        cost: number;
        trends: Array<{
            date: string;
            requests: number;
            cost: number;
        }>;
    };
    monthly: {
        requests: number;
        tokens: number;
        cost: number;
        budget: number;
        budgetUsed: number;
    };
    topModels: Array<{
        model: string;
        provider: string;
        usage: number;
        avgCost: number;
    }>;
    costBreakdown: Record<string, {
        requests: number;
        cost: number;
    }>;
}
export interface OllamaModelInfo {
    name: string;
    tag: string;
    size: number;
    digest: string;
    modified: string;
    details: {
        format: string;
        family: string;
        families: string[];
        parameter_size: string;
        quantization_level: string;
    };
    isRunning: boolean;
    memoryUsage?: number;
}
export declare class AdvancedDashboardUI {
    private panel;
    private router;
    private updateInterval;
    constructor(router: ModelRouter);
    createDashboard(): void;
    private generateDashboardHTML;
    private generateDashboardCSS;
    private generateDashboardJS;
    private setupMessageHandling;
    private sendUsageStatistics;
    private analyzeRouting;
    private sendOllamaModels;
    private refreshOllamaModels;
    private pullOllamaModel;
    private startOllamaModel;
    private stopOllamaModel;
    private deleteOllamaModel;
    private sendConfiguration;
    private updateRouterMode;
    private updateBudget;
    private toggleProvider;
    private updateDashboard;
    dispose(): void;
}
//# sourceMappingURL=advancedDashboard.d.ts.map