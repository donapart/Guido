/**
 * AI Task Planner for breaking down complex objectives into actionable tasks
 */

import { Provider } from '../providers/base';
import { ModelRouter } from '../router';

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
  estimatedTime: number; // in minutes
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

export class AITaskPlanner {
  private router: ModelRouter;
  private providers: Map<string, Provider>;
  private activePlans: Map<string, TaskPlan> = new Map();

  constructor(router: ModelRouter, providers: Map<string, Provider>) {
    this.router = router;
    this.providers = providers;
  }

  async createPlan(request: TaskPlanRequest): Promise<TaskPlan> {
    const planningPrompt = this.buildPlanningPrompt(request);
    
    try {
      const routingResult = await this.router.route({
        prompt: planningPrompt,
        lang: 'de',
        mode: 'quality'
      });

      const result = await routingResult.provider.chatComplete(
        routingResult.modelName,
        [{ role: 'user', content: planningPrompt }],
        { 
          maxTokens: 2000,
          temperature: 0.3 // Lower temperature for more consistent planning
        }
      );

      const plan = this.parsePlanFromResponse(result.content, request);
      this.activePlans.set(plan.id, plan);
      
      return plan;
    } catch (error) {
      throw new Error(`Task planning failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async executePlan(planId: string): Promise<TaskExecutionResult[]> {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const results: TaskExecutionResult[] = [];
    const executedTasks = new Set<string>();

    // Execute tasks in dependency order
    for (const task of this.getExecutionOrder(plan.tasks)) {
      const result = await this.executeTask(task, plan, executedTasks);
      results.push(result);
      
      if (result.status === 'success') {
        executedTasks.add(task.id);
      }
    }

    return results;
  }

  async executeTask(task: Task, plan: TaskPlan, completedTasks: Set<string>): Promise<TaskExecutionResult> {
    const startTime = Date.now();

    // Check dependencies
    for (const depId of task.dependencies) {
      if (!completedTasks.has(depId)) {
        return {
          taskId: task.id,
          status: 'failure',
          result: `Dependency ${depId} not completed`,
          artifacts: [],
          duration: Date.now() - startTime,
          confidence: 0
        };
      }
    }

    const executionPrompt = this.buildExecutionPrompt(task, plan);

    try {
      const routingResult = await this.router.route({
        prompt: executionPrompt,
        lang: 'de',
        mode: plan.metadata.qualityLevel === 'fast' ? 'speed' : 'quality'
      });

      const result = await routingResult.provider.chatComplete(
        routingResult.modelName,
        [{ role: 'user', content: executionPrompt }],
        { 
          maxTokens: 1500,
          temperature: 0.5
        }
      );

      return {
        taskId: task.id,
        status: 'success',
        result: result.content,
        artifacts: this.extractArtifacts(result.content),
        duration: Date.now() - startTime,
        confidence: 0.8
      };
    } catch (error) {
      return {
        taskId: task.id,
        status: 'failure',
        result: `Execution failed: ${error instanceof Error ? error.message : String(error)}`,
        artifacts: [],
        duration: Date.now() - startTime,
        confidence: 0
      };
    }
  }

  private buildPlanningPrompt(request: TaskPlanRequest): string {
    return `You are an expert AI task planner. Break down the following objective into a detailed, actionable plan.

OBJECTIVE: ${request.objective}

CONTEXT:
- Project Type: ${request.context.projectType || 'unknown'}
- Programming Language: ${request.context.language || 'unknown'}
- Framework: ${request.context.framework || 'unknown'}
- Constraints: ${request.context.constraints?.join(', ') || 'none'}

PREFERENCES:
- Quality Level: ${request.preferences.qualityLevel}
- Max Tasks: ${request.preferences.maxTasks || 'no limit'}
- Time Estimate: ${request.preferences.estimatedTimeTotal || 'flexible'}

Please provide a structured plan with:
1. Overall plan title and description
2. Detailed task breakdown with:
   - Task title and description
   - Estimated time in minutes
   - Dependencies (task IDs)
   - Priority level
   - Category

Format your response as a structured list with clear task identifiers.

Focus on creating actionable, specific tasks that can be executed by an AI assistant.`;
  }

  private buildExecutionPrompt(task: Task, plan: TaskPlan): string {
    return `Execute the following task as part of a larger project plan.

PROJECT: ${plan.title}
OBJECTIVE: ${plan.objective}

TASK TO EXECUTE:
- Title: ${task.title}
- Description: ${task.description}
- Category: ${task.category}
- Priority: ${task.priority}

CONTEXT:
- Project Type: ${plan.metadata.projectType}
- Programming Language: ${plan.metadata.language}
- Quality Level: ${plan.metadata.qualityLevel}

Please execute this task and provide:
1. The completed work/solution
2. Any code, documentation, or artifacts generated
3. Testing or validation steps taken
4. Next steps or recommendations

Be thorough and ensure the output is production-ready.`;
  }

  private parsePlanFromResponse(response: string, request: TaskPlanRequest): TaskPlan {
    // Simplified parsing - in a real implementation, this would be more sophisticated
    const planId = `plan-${Date.now()}`;
    const lines = response.split('\n');
    
    let title = 'Generated Plan';
    let description = 'Auto-generated task plan';
    const tasks: Task[] = [];
    
    let currentTask: Partial<Task> = {};
    let taskCounter = 1;

    for (const line of lines) {
      if (line.toLowerCase().includes('title:')) {
        title = line.split(':').slice(1).join(':').trim();
      } else if (line.toLowerCase().includes('description:')) {
        description = line.split(':').slice(1).join(':').trim();
      } else if (line.match(/^\d+\./)) {
        // New task
        if (currentTask.title) {
          tasks.push({
            id: `task-${taskCounter}`,
            title: currentTask.title || 'Untitled Task',
            description: currentTask.description || 'No description',
            estimatedTime: currentTask.estimatedTime || 30,
            dependencies: currentTask.dependencies || [],
            priority: currentTask.priority || 'medium',
            category: currentTask.category || 'general'
          });
          taskCounter++;
        }
        
        currentTask = {
          title: line.replace(/^\d+\./, '').trim(),
          description: '',
          estimatedTime: 30,
          dependencies: [],
          priority: 'medium',
          category: 'general'
        };
      }
    }

    // Add the last task
    if (currentTask.title) {
      tasks.push({
        id: `task-${taskCounter}`,
        title: currentTask.title || 'Untitled Task',
        description: currentTask.description || 'No description',
        estimatedTime: currentTask.estimatedTime || 30,
        dependencies: currentTask.dependencies || [],
        priority: currentTask.priority || 'medium',
        category: currentTask.category || 'general'
      });
    }

    return {
      id: planId,
      title,
      description,
      objective: request.objective,
      tasks,
      totalEstimatedTime: tasks.reduce((total, task) => total + task.estimatedTime, 0),
      createdAt: new Date(),
      status: 'draft',
      metadata: {
        qualityLevel: request.preferences.qualityLevel,
        projectType: request.context.projectType || 'unknown',
        language: request.context.language || 'unknown'
      }
    };
  }

  private getExecutionOrder(tasks: Task[]): Task[] {
    // Simple topological sort based on dependencies
    const sorted: Task[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (task: Task) => {
      if (visiting.has(task.id)) {
        throw new Error(`Circular dependency detected involving task ${task.id}`);
      }
      if (visited.has(task.id)) {
        return;
      }

      visiting.add(task.id);
      
      for (const depId of task.dependencies) {
        const depTask = tasks.find(t => t.id === depId);
        if (depTask) {
          visit(depTask);
        }
      }
      
      visiting.delete(task.id);
      visited.add(task.id);
      sorted.push(task);
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        visit(task);
      }
    }

    return sorted;
  }

  private extractArtifacts(content: string): string[] {
    const artifacts: string[] = [];
    
    // Look for code blocks
    const codeBlocks = content.match(/```[\s\S]*?```/g);
    if (codeBlocks) {
      artifacts.push(...codeBlocks);
    }
    
    // Look for file paths or names
    const filePaths = content.match(/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+/g);
    if (filePaths) {
      artifacts.push(...filePaths);
    }
    
    return artifacts;
  }
}
