import { Provider } from '../providers/base';
import { ModelRouter } from '../router';
export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    category: 'analysis' | 'generation' | 'reasoning' | 'creative' | 'technical' | 'review';
    template: string;
    variables: string[];
    examples?: PromptExample[];
    metadata?: {
        effectiveness?: number;
        usage_count?: number;
        success_rate?: number;
        preferred_models?: string[];
    };
}
export interface PromptExample {
    input: Record<string, string>;
    expected_output: string;
    context?: string;
}
export interface PromptingStrategy {
    name: string;
    description: string;
    techniques: string[];
    best_for: string[];
    implementation: (prompt: string, context?: any) => string;
}
export interface PromptOptimizationRequest {
    original_prompt: string;
    objective: string;
    context?: {
        domain?: string;
        target_model?: string;
        expected_format?: string;
        quality_criteria?: string[];
    };
    constraints?: {
        max_length?: number;
        style?: string;
        formality?: 'formal' | 'casual' | 'technical';
    };
}
export interface OptimizedPrompt {
    optimized_prompt: string;
    improvements: string[];
    strategy_used: string;
    confidence: number;
    expected_quality_gain: number;
    reasoning: string;
}
export declare class AdvancedPromptingManager {
    private router;
    private providers;
    private templates;
    private strategies;
    constructor(router: ModelRouter, providers: Map<string, Provider>);
    /**
     * Optimize a prompt using advanced techniques
     */
    optimizePrompt(request: PromptOptimizationRequest): Promise<OptimizedPrompt>;
    /**
     * Apply chain-of-thought prompting
     */
    applyChainOfThought(prompt: string, complexity?: 'simple' | 'moderate' | 'complex'): string;
    /**
     * Apply few-shot learning with examples
     */
    applyFewShotLearning(prompt: string, examples: PromptExample[], task_description?: string): string;
    /**
     * Apply role-based prompting
     */
    applyRoleBasedPrompting(prompt: string, role: string, expertise_level?: 'beginner' | 'intermediate' | 'expert'): string;
    /**
     * Apply context injection for better understanding
     */
    injectContext(prompt: string, context: {
        codebase_info?: string;
        project_structure?: string;
        technologies?: string[];
        constraints?: string[];
        goals?: string[];
    }): string;
    /**
     * Apply recursive prompting for complex problems
     */
    applyRecursivePrompting(prompt: string, max_depth?: number, current_depth?: number): Promise<string>;
    /**
     * Get template by ID
     */
    getTemplate(templateId: string): PromptTemplate | undefined;
    /**
     * Apply template with variables
     */
    applyTemplate(templateId: string, variables: Record<string, string>): string;
    /**
     * Analyze prompt effectiveness
     */
    analyzePromptEffectiveness(prompt: string, expected_outcome?: string): Promise<{
        clarity_score: number;
        specificity_score: number;
        completeness_score: number;
        suggestions: string[];
        overall_score: number;
    }>;
    /**
     * Initialize built-in prompt templates
     */
    private initializeTemplates;
    /**
     * Initialize prompting strategies
     */
    private initializeStrategies;
    /**
     * Build prompt optimization request
     */
    private buildOptimizationPrompt;
    /**
     * Fallback optimization when AI optimization fails
     */
    private fallbackOptimization;
    /**
     * Get all available templates
     */
    getAllTemplates(): PromptTemplate[];
    /**
     * Get all available strategies
     */
    getAllStrategies(): PromptingStrategy[];
}
//# sourceMappingURL=promptingManager.d.ts.map