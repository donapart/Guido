/**
 * Advanced Prompting Manager for optimizing and enhancing AI prompts
 */
import { ModelRouter } from '../router';
import { Provider } from '../providers/base';
export interface PromptOptimizationRequest {
    original_prompt: string;
    objective: string;
    target_audience?: string;
    domain?: string;
    constraints?: string[];
}
export interface OptimizedPrompt {
    optimized_prompt: string;
    improvements: string[];
    strategy_used: string;
    confidence: number;
    expected_quality_gain: number;
    reasoning: string;
    alternatives?: string[];
}
export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    template: string;
    variables: string[];
    category: string;
    useCase: string;
}
export declare class AdvancedPromptingManager {
    private router;
    private providers;
    private templates;
    constructor(router: ModelRouter, providers: Map<string, Provider>);
    optimizePrompt(request: PromptOptimizationRequest): Promise<OptimizedPrompt>;
    generatePrompt(template: string, variables: Record<string, string>): Promise<string>;
    analyzePrompt(prompt: string): Promise<{
        clarity: number;
        specificity: number;
        completeness: number;
        structure: number;
        suggestions: string[];
    }>;
    getTemplate(templateId: string): PromptTemplate | undefined;
    getAllTemplates(): PromptTemplate[];
    getTemplatesByCategory(category: string): PromptTemplate[];
    private buildOptimizationPrompt;
    private parseOptimizationResult;
    private parseAnalysisResult;
    private initializeTemplates;
}
//# sourceMappingURL=promptingManager.d.ts.map