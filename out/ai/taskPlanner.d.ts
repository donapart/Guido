import { Provider } from '../providers/base';
import { ModelRouter } from '../router';
export interface Task {
    id: string;
    title: string;
    description: string;
    type: 'analysis' | 'generation' | 'modification' | 'verification' | 'research';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
    priority: number;
    estimatedTime: number;
    dependencies: string[];
    context: {
        files?: string[];
        code?: string;
        requirements?: string[];
        constraints?: string[];
    };
    result?: TaskResult;
    assignedModel?: string;
    createdAt: Date;
    completedAt?: Date;
    metadata?: Record<string, any>;
}
export interface TaskResult {
    success: boolean;
    output: string;
    files?: {
        path: string;
        content: string;
    }[];
    metrics?: {
        executionTime: number;
        tokenUsage: number;
        cost: number;
    };
    confidence?: number;
    suggestions?: string[];
    errors?: string[];
}
export interface TaskPlan {
    id: string;
    title: string;
    description: string;
    tasks: Task[];
    status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed';
    totalEstimate: number;
    createdAt: Date;
    metadata?: Record<string, any>;
}
export interface PlanningRequest {
    objective: string;
    context: {
        projectType?: string;
        language?: string;
        framework?: string;
        files?: string[];
        constraints?: string[];
        requirements?: string[];
    };
    preferences?: {
        maxTasks?: number;
        timeLimit?: number;
        preferredModels?: string[];
        qualityLevel?: 'fast' | 'balanced' | 'thorough';
    };
}
export declare class AITaskPlanner {
    private router;
    private providers;
    private activePlans;
    private executionQueue;
    constructor(router: ModelRouter, providers: Map<string, Provider>);
    /**
     * Create a comprehensive plan for achieving an objective
     */
    createPlan(request: PlanningRequest): Promise<TaskPlan>;
    /**
     * Execute a task plan step by step
     */
    executePlan(planId: string, progressCallback?: (task: Task, progress: number) => void): Promise<TaskPlan>;
    /**
     * Execute a single task
     */
    private executeTask;
    /**
     * Build comprehensive planning prompt
     */
    private buildPlanningPrompt;
    /**
     * Build task execution prompt
     */
    private buildTaskPrompt;
    /**
     * Parse plan from AI response
     */
    private parsePlanFromResponse;
    /**
     * Create fallback plan when AI planning fails
     */
    private createFallbackPlan;
    /**
     * Sort tasks by dependencies and priority
     */
    private sortTasksByDependencies;
    /**
     * Check if task dependencies are satisfied
     */
    private areDependenciesSatisfied;
    /**
     * Select appropriate model for task type
     */
    private selectModelForTask;
    /**
     * Get routing mode for task type
     */
    private getRoutingModeForTask;
    /**
     * Get max tokens for task type
     */
    private getMaxTokensForTask;
    /**
     * Get temperature for task type
     */
    private getTemperatureForTask;
    /**
     * Parse task result from AI response
     */
    private parseTaskResult;
    /**
     * Calculate task execution cost
     */
    private calculateTaskCost;
    /**
     * Generate unique ID
     */
    private generateId;
    /**
     * Get active plans
     */
    getActivePlans(): TaskPlan[];
    /**
     * Get plan by ID
     */
    getPlan(planId: string): TaskPlan | undefined;
    /**
     * Cancel plan execution
     */
    cancelPlan(planId: string): boolean;
}
//# sourceMappingURL=taskPlanner.d.ts.map