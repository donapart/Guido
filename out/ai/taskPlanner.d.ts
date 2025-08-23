/**
 * AI Task Planner for breaking down complex objectives into actionable tasks
 */
import { ModelRouter } from '../router';
import { Provider } from '../providers/base';
export interface TaskPlanRequest {
    objective: string;
    context: {
        projectType?: string;
        language?: string;
        framework?: string;
        constraints?: string[];
    };
    preferences: {
        qualityLevel: 'fast' | 'balanced' | 'thorough';
        maxTasks?: number;
        estimatedTimeTotal?: number;
    };
}
export interface Task {
    id: string;
    title: string;
    description: string;
    estimatedTime: number;
    dependencies: string[];
    priority: 'low' | 'medium' | 'high';
    category: string;
    subtasks?: Task[];
}
export interface TaskPlan {
    id: string;
    title: string;
    description: string;
    objective: string;
    tasks: Task[];
    totalEstimatedTime: number;
    createdAt: Date;
    status: 'draft' | 'active' | 'completed';
    metadata: {
        qualityLevel: string;
        projectType: string;
        language: string;
    };
}
export interface TaskExecutionResult {
    taskId: string;
    status: 'success' | 'failure' | 'partial';
    result: string;
    artifacts: string[];
    duration: number;
    confidence: number;
}
export declare class AITaskPlanner {
    private router;
    private providers;
    private activePlans;
    constructor(router: ModelRouter, providers: Map<string, Provider>);
    createPlan(request: TaskPlanRequest): Promise<TaskPlan>;
    executePlan(planId: string): Promise<TaskExecutionResult[]>;
    executeTask(task: Task, plan: TaskPlan, completedTasks: Set<string>): Promise<TaskExecutionResult>;
    private buildPlanningPrompt;
    private buildExecutionPrompt;
    private parsePlanFromResponse;
    private getExecutionOrder;
    private extractArtifacts;
}
//# sourceMappingURL=taskPlanner.d.ts.map