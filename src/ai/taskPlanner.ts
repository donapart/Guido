import * as vscode from 'vscode';
import { Provider, ChatMessage } from '../providers/base';
import { ModelRouter } from '../router';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'analysis' | 'generation' | 'modification' | 'verification' | 'research';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
  priority: number; // 1-10
  estimatedTime: number; // minutes
  dependencies: string[]; // task IDs
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
  files?: { path: string; content: string }[];
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

export class AITaskPlanner {
  private router: ModelRouter;
  private providers: Map<string, Provider>;
  private activePlans: Map<string, TaskPlan> = new Map();
  private executionQueue: Task[] = [];

  constructor(router: ModelRouter, providers: Map<string, Provider>) {
    this.router = router;
    this.providers = providers;
  }

  /**
   * Create a comprehensive plan for achieving an objective
   */
  async createPlan(request: PlanningRequest): Promise<TaskPlan> {
    const planningPrompt = this.buildPlanningPrompt(request);
    
    try {
      const result = await this.router.route({
        prompt: planningPrompt,
        mode: 'quality'
      });

      const provider = this.providers.get(result.providerId);
      if (!provider) {
        throw new Error(`Provider ${result.providerId} not found`);
      }

      const messages: ChatMessage[] = [
        { role: 'user', content: planningPrompt }
      ];

      const response = await provider.chatComplete(result.modelName, messages, {
        maxTokens: 4000,
        temperature: 0.3,
        json: true
      });

      const planData = JSON.parse(response.content);
      const plan = this.parsePlanFromResponse(planData, request);
      
      this.activePlans.set(plan.id, plan);
      return plan;

    } catch (error) {
      console.error('Plan creation failed:', error);
      return this.createFallbackPlan(request);
    }
  }

  /**
   * Execute a task plan step by step
   */
  async executePlan(planId: string, progressCallback?: (task: Task, progress: number) => void): Promise<TaskPlan> {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    plan.status = 'executing';
    
    // Sort tasks by dependencies and priority
    const sortedTasks = this.sortTasksByDependencies(plan.tasks);
    
    for (let i = 0; i < sortedTasks.length; i++) {
      const task = sortedTasks[i];
      
      // Check if dependencies are satisfied
      if (!this.areDependenciesSatisfied(task, plan)) {
        task.status = 'blocked';
        continue;
      }

      task.status = 'running';
      progressCallback?.(task, (i / sortedTasks.length) * 100);

      try {
        const result = await this.executeTask(task, plan);
        task.result = result;
        task.status = result.success ? 'completed' : 'failed';
        task.completedAt = new Date();
      } catch (error) {
        task.result = {
          success: false,
          output: `Task execution failed: ${error instanceof Error ? error.message : String(error)}`,
          errors: [error instanceof Error ? error.message : String(error)]
        };
        task.status = 'failed';
      }
    }

    // Update plan status
    const completedTasks = plan.tasks.filter(t => t.status === 'completed').length;
    const failedTasks = plan.tasks.filter(t => t.status === 'failed').length;
    
    if (completedTasks === plan.tasks.length) {
      plan.status = 'completed';
    } else if (failedTasks > 0) {
      plan.status = 'failed';
    }

    return plan;
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: Task, plan: TaskPlan): Promise<TaskResult> {
    const startTime = Date.now();
    
    // Build task execution prompt
    const taskPrompt = this.buildTaskPrompt(task, plan);
    
    // Select appropriate model for task type
    const modelId = this.selectModelForTask(task);
    
    try {
      const result = await this.router.route({
        prompt: taskPrompt,
        mode: this.getRoutingModeForTask(task)
      });

      const provider = this.providers.get(result.providerId);
      if (!provider) {
        throw new Error(`Provider ${result.providerId} not found`);
      }

      // Use specific model if available, otherwise use routed model
      const actualModel = modelId && provider.supports(modelId) ? modelId : result.modelName;

      const messages: ChatMessage[] = [
        { role: 'user', content: taskPrompt }
      ];

      const response = await provider.chatComplete(actualModel, messages, {
        maxTokens: this.getMaxTokensForTask(task),
        temperature: this.getTemperatureForTask(task)
      });

      const executionTime = Date.now() - startTime;

      // Parse response based on task type
      const parsedResult = this.parseTaskResult(response.content, task);

      return {
        success: true,
        output: parsedResult.output,
        files: parsedResult.files,
        metrics: {
          executionTime,
          tokenUsage: (response.usage?.inputTokens || 0) + (response.usage?.outputTokens || 0),
          cost: this.calculateTaskCost(response.usage?.inputTokens || 0, response.usage?.outputTokens || 0, result.model)
        },
        confidence: parsedResult.confidence,
        suggestions: parsedResult.suggestions
      };

    } catch (error) {
      return {
        success: false,
        output: `Task execution failed: ${error instanceof Error ? error.message : String(error)}`,
        errors: [error instanceof Error ? error.message : String(error)],
        metrics: {
          executionTime: Date.now() - startTime,
          tokenUsage: 0,
          cost: 0
        }
      };
    }
  }

  /**
   * Build comprehensive planning prompt
   */
  private buildPlanningPrompt(request: PlanningRequest): string {
    return `
You are an AI task planning expert. Create a detailed, executable plan to achieve the following objective:

OBJECTIVE: ${request.objective}

CONTEXT:
${request.context.projectType ? `- Project Type: ${request.context.projectType}` : ''}
${request.context.language ? `- Programming Language: ${request.context.language}` : ''}
${request.context.framework ? `- Framework: ${request.context.framework}` : ''}
${request.context.files?.length ? `- Relevant Files: ${request.context.files.join(', ')}` : ''}
${request.context.constraints?.length ? `- Constraints: ${request.context.constraints.join(', ')}` : ''}
${request.context.requirements?.length ? `- Requirements: ${request.context.requirements.join(', ')}` : ''}

PREFERENCES:
${request.preferences?.maxTasks ? `- Max Tasks: ${request.preferences.maxTasks}` : ''}
${request.preferences?.timeLimit ? `- Time Limit: ${request.preferences.timeLimit} minutes` : ''}
${request.preferences?.qualityLevel ? `- Quality Level: ${request.preferences.qualityLevel}` : ''}

Please create a comprehensive plan with the following structure:

{
  "title": "Plan title",
  "description": "Detailed plan description",
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed task description",
      "type": "analysis|generation|modification|verification|research",
      "priority": 1-10,
      "estimatedTime": minutes,
      "dependencies": ["task_id1", "task_id2"],
      "context": {
        "files": ["relevant files"],
        "requirements": ["specific requirements"],
        "constraints": ["specific constraints"]
      },
      "assignedModel": "recommended model for this task"
    }
  ],
  "totalEstimate": total_minutes
}

Guidelines:
1. Break down complex objectives into manageable tasks
2. Establish clear dependencies between tasks
3. Consider the order of execution
4. Assign appropriate task types
5. Provide realistic time estimates
6. Include verification and testing tasks
7. Consider error handling and fallback options
`;
  }

  /**
   * Build task execution prompt
   */
  private buildTaskPrompt(task: Task, plan: TaskPlan): string {
    let prompt = `
TASK: ${task.title}
DESCRIPTION: ${task.description}
TYPE: ${task.type}

CONTEXT:
- Plan: ${plan.title}
- Plan Description: ${plan.description}
`;

    if (task.context.files?.length) {
      prompt += `- Files: ${task.context.files.join(', ')}\n`;
    }

    if (task.context.requirements?.length) {
      prompt += `- Requirements: ${task.context.requirements.join(', ')}\n`;
    }

    if (task.context.constraints?.length) {
      prompt += `- Constraints: ${task.context.constraints.join(', ')}\n`;
    }

    // Add dependency results
    if (task.dependencies.length > 0) {
      prompt += '\nDEPENDENCY RESULTS:\n';
      for (const depId of task.dependencies) {
        const depTask = plan.tasks.find(t => t.id === depId);
        if (depTask?.result?.success) {
          prompt += `- ${depTask.title}: ${depTask.result.output.substring(0, 200)}...\n`;
        }
      }
    }

    prompt += `
Please execute this task and provide your result in the following format:

{
  "output": "Your main result/answer",
  "files": [
    {
      "path": "file/path.ext",
      "content": "file content"
    }
  ],
  "confidence": 0.0-1.0,
  "suggestions": ["suggestion1", "suggestion2"],
  "nextSteps": ["next step recommendations"]
}

Focus on delivering a complete, high-quality result for this specific task.
`;

    return prompt;
  }

  /**
   * Parse plan from AI response
   */
  private parsePlanFromResponse(planData: any, request: PlanningRequest): TaskPlan {
    const planId = this.generateId();
    
    const tasks: Task[] = (planData.tasks || []).map((taskData: any, index: number) => ({
      id: `task_${index + 1}`,
      title: taskData.title || `Task ${index + 1}`,
      description: taskData.description || '',
      type: taskData.type || 'analysis',
      status: 'pending',
      priority: taskData.priority || 5,
      estimatedTime: taskData.estimatedTime || 15,
      dependencies: taskData.dependencies || [],
      context: {
        files: taskData.context?.files || [],
        code: taskData.context?.code,
        requirements: taskData.context?.requirements || [],
        constraints: taskData.context?.constraints || []
      },
      assignedModel: taskData.assignedModel,
      createdAt: new Date()
    }));

    return {
      id: planId,
      title: planData.title || request.objective,
      description: planData.description || `Plan for: ${request.objective}`,
      tasks,
      status: 'draft',
      totalEstimate: planData.totalEstimate || tasks.reduce((sum, task) => sum + task.estimatedTime, 0),
      createdAt: new Date()
    };
  }

  /**
   * Create fallback plan when AI planning fails
   */
  private createFallbackPlan(request: PlanningRequest): TaskPlan {
    const planId = this.generateId();
    
    const tasks: Task[] = [
      {
        id: 'task_1',
        title: 'Analysis',
        description: `Analyze the objective: ${request.objective}`,
        type: 'analysis',
        status: 'pending',
        priority: 8,
        estimatedTime: 10,
        dependencies: [],
        context: {
          requirements: [request.objective],
          constraints: request.context.constraints || []
        },
        createdAt: new Date()
      },
      {
        id: 'task_2',
        title: 'Implementation',
        description: 'Implement the solution based on analysis',
        type: 'generation',
        status: 'pending',
        priority: 7,
        estimatedTime: 30,
        dependencies: ['task_1'],
        context: {
          requirements: request.context.requirements || [],
          constraints: request.context.constraints || []
        },
        createdAt: new Date()
      },
      {
        id: 'task_3',
        title: 'Verification',
        description: 'Verify and test the implementation',
        type: 'verification',
        status: 'pending',
        priority: 6,
        estimatedTime: 15,
        dependencies: ['task_2'],
        context: {},
        createdAt: new Date()
      }
    ];

    return {
      id: planId,
      title: request.objective,
      description: `Fallback plan for: ${request.objective}`,
      tasks,
      status: 'draft',
      totalEstimate: 55,
      createdAt: new Date()
    };
  }

  /**
   * Sort tasks by dependencies and priority
   */
  private sortTasksByDependencies(tasks: Task[]): Task[] {
    const sorted: Task[] = [];
    const remaining = [...tasks];
    
    while (remaining.length > 0) {
      const readyTasks = remaining.filter(task => 
        task.dependencies.every(depId => 
          sorted.some(sortedTask => sortedTask.id === depId)
        )
      );
      
      if (readyTasks.length === 0) {
        // Circular dependency or unresolvable - add all remaining
        sorted.push(...remaining);
        break;
      }
      
      // Sort ready tasks by priority (higher first)
      readyTasks.sort((a, b) => b.priority - a.priority);
      
      // Add highest priority task
      const nextTask = readyTasks[0];
      sorted.push(nextTask);
      remaining.splice(remaining.indexOf(nextTask), 1);
    }
    
    return sorted;
  }

  /**
   * Check if task dependencies are satisfied
   */
  private areDependenciesSatisfied(task: Task, plan: TaskPlan): boolean {
    return task.dependencies.every(depId => {
      const depTask = plan.tasks.find(t => t.id === depId);
      return depTask?.status === 'completed';
    });
  }

  /**
   * Select appropriate model for task type
   */
  private selectModelForTask(task: Task): string | undefined {
    if (task.assignedModel) {
      return task.assignedModel;
    }

    const modelMap: Record<string, string> = {
      'analysis': 'gpt-4',
      'generation': 'claude-3-sonnet',
      'modification': 'gpt-4',
      'verification': 'claude-3-haiku',
      'research': 'gpt-4'
    };

    return modelMap[task.type];
  }

  /**
   * Get routing mode for task type
   */
  private getRoutingModeForTask(task: Task): string {
    const modeMap: Record<string, string> = {
      'analysis': 'quality',
      'generation': 'auto',
      'modification': 'quality',
      'verification': 'speed',
      'research': 'quality'
    };

    return modeMap[task.type] || 'auto';
  }

  /**
   * Get max tokens for task type
   */
  private getMaxTokensForTask(task: Task): number {
    const tokenMap: Record<string, number> = {
      'analysis': 2000,
      'generation': 4000,
      'modification': 3000,
      'verification': 1500,
      'research': 3000
    };

    return tokenMap[task.type] || 2000;
  }

  /**
   * Get temperature for task type
   */
  private getTemperatureForTask(task: Task): number {
    const tempMap: Record<string, number> = {
      'analysis': 0.3,
      'generation': 0.7,
      'modification': 0.5,
      'verification': 0.2,
      'research': 0.6
    };

    return tempMap[task.type] || 0.5;
  }

  /**
   * Parse task result from AI response
   */
  private parseTaskResult(content: string, task: Task): {
    output: string;
    files?: { path: string; content: string }[];
    confidence?: number;
    suggestions?: string[];
  } {
    try {
      const parsed = JSON.parse(content);
      return {
        output: parsed.output || content,
        files: parsed.files || [],
        confidence: parsed.confidence || 0.7,
        suggestions: parsed.suggestions || []
      };
    } catch {
      return {
        output: content,
        confidence: 0.6
      };
    }
  }

  /**
   * Calculate task execution cost
   */
  private calculateTaskCost(inputTokens: number, outputTokens: number, model: any): number {
    const inputCostPer1k = model?.price?.inputPerMTok ? model.price.inputPerMTok / 1000 : 0.001;
    const outputCostPer1k = model?.price?.outputPerMTok ? model.price.outputPerMTok / 1000 : 0.002;
    
    return (inputTokens / 1000 * inputCostPer1k) + (outputTokens / 1000 * outputCostPer1k);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active plans
   */
  getActivePlans(): TaskPlan[] {
    return Array.from(this.activePlans.values());
  }

  /**
   * Get plan by ID
   */
  getPlan(planId: string): TaskPlan | undefined {
    return this.activePlans.get(planId);
  }

  /**
   * Cancel plan execution
   */
  cancelPlan(planId: string): boolean {
    const plan = this.activePlans.get(planId);
    if (plan && plan.status === 'executing') {
      plan.status = 'failed';
      // Mark running tasks as failed
      plan.tasks.filter(t => t.status === 'running').forEach(t => {
        t.status = 'failed';
        t.result = {
          success: false,
          output: 'Task cancelled by user',
          errors: ['Execution cancelled']
        };
      });
      return true;
    }
    return false;
  }
}
