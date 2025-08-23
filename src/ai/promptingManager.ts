import * as vscode from 'vscode';
import { Provider, ChatMessage } from '../providers/base';
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

export class AdvancedPromptingManager {
  private router: ModelRouter;
  private providers: Map<string, Provider>;
  private templates: Map<string, PromptTemplate> = new Map();
  private strategies: Map<string, PromptingStrategy> = new Map();

  constructor(router: ModelRouter, providers: Map<string, Provider>) {
    this.router = router;
    this.providers = providers;
    this.initializeTemplates();
    this.initializeStrategies();
  }

  /**
   * Optimize a prompt using advanced techniques
   */
  async optimizePrompt(request: PromptOptimizationRequest): Promise<OptimizedPrompt> {
    const optimizationPrompt = this.buildOptimizationPrompt(request);
    
    try {
      const result = await this.router.route({
        prompt: optimizationPrompt,
        mode: 'quality'
      });

      const provider = this.providers.get(result.providerId);
      if (!provider) {
        throw new Error(`Provider ${result.providerId} not found`);
      }

      const messages: ChatMessage[] = [
        { role: 'user', content: optimizationPrompt }
      ];

      const response = await provider.chatComplete(result.modelName, messages, {
        maxTokens: 3000,
        temperature: 0.3,
        json: true
      });

      const parsed = JSON.parse(response.content);
      
      return {
        optimized_prompt: parsed.optimized_prompt || request.original_prompt,
        improvements: parsed.improvements || [],
        strategy_used: parsed.strategy_used || 'general_optimization',
        confidence: parsed.confidence || 0.7,
        expected_quality_gain: parsed.expected_quality_gain || 0.2,
        reasoning: parsed.reasoning || 'Prompt optimized using best practices'
      };

    } catch (error) {
      console.error('Prompt optimization failed:', error);
      return this.fallbackOptimization(request);
    }
  }

  /**
   * Apply chain-of-thought prompting
   */
  applyChainOfThought(prompt: string, complexity: 'simple' | 'moderate' | 'complex' = 'moderate'): string {
    const strategy = this.strategies.get('chain_of_thought');
    if (strategy) {
      return strategy.implementation(prompt, { complexity });
    }

    // Fallback implementation
    const cot_instruction = complexity === 'complex' 
      ? "Let's work through this step-by-step with detailed reasoning for each step:"
      : complexity === 'moderate'
      ? "Let's think through this step by step:"
      : "Think step by step:";

    return `${prompt}\n\n${cot_instruction}`;
  }

  /**
   * Apply few-shot learning with examples
   */
  applyFewShotLearning(prompt: string, examples: PromptExample[], task_description?: string): string {
    let enhanced_prompt = task_description ? `${task_description}\n\n` : '';
    
    enhanced_prompt += "Here are some examples:\n\n";
    
    examples.forEach((example, index) => {
      enhanced_prompt += `Example ${index + 1}:\n`;
      Object.entries(example.input).forEach(([key, value]) => {
        enhanced_prompt += `${key}: ${value}\n`;
      });
      enhanced_prompt += `Output: ${example.expected_output}\n\n`;
    });

    enhanced_prompt += `Now, please handle this request:\n${prompt}`;
    
    return enhanced_prompt;
  }

  /**
   * Apply role-based prompting
   */
  applyRoleBasedPrompting(prompt: string, role: string, expertise_level: 'beginner' | 'intermediate' | 'expert' = 'expert'): string {
    const role_definitions = {
      'senior_developer': 'You are a senior software developer with 10+ years of experience in multiple programming languages and frameworks.',
      'code_reviewer': 'You are an experienced code reviewer who focuses on code quality, security, and best practices.',
      'architect': 'You are a software architect who designs scalable and maintainable systems.',
      'security_expert': 'You are a cybersecurity expert who specializes in identifying and mitigating security vulnerabilities.',
      'performance_analyst': 'You are a performance optimization expert who analyzes and improves system efficiency.',
      'documentation_specialist': 'You are a technical writing expert who creates clear, comprehensive documentation.',
      'testing_expert': 'You are a quality assurance expert who designs comprehensive testing strategies.',
      'devops_engineer': 'You are a DevOps engineer who specializes in CI/CD, infrastructure, and deployment strategies.'
    };

    const role_definition = role_definitions[role as keyof typeof role_definitions] || 
                           `You are an ${expertise_level} ${role} with extensive experience in your field.`;

    return `${role_definition}\n\n${prompt}\n\nPlease respond with the expertise and perspective of your role.`;
  }

  /**
   * Apply context injection for better understanding
   */
  injectContext(prompt: string, context: {
    codebase_info?: string;
    project_structure?: string;
    technologies?: string[];
    constraints?: string[];
    goals?: string[];
  }): string {
    let context_section = "\nCONTEXT:\n";
    
    if (context.codebase_info) {
      context_section += `Codebase: ${context.codebase_info}\n`;
    }
    
    if (context.project_structure) {
      context_section += `Project Structure: ${context.project_structure}\n`;
    }
    
    if (context.technologies?.length) {
      context_section += `Technologies: ${context.technologies.join(', ')}\n`;
    }
    
    if (context.constraints?.length) {
      context_section += `Constraints: ${context.constraints.join(', ')}\n`;
    }
    
    if (context.goals?.length) {
      context_section += `Goals: ${context.goals.join(', ')}\n`;
    }

    return `${prompt}${context_section}\n`;
  }

  /**
   * Apply recursive prompting for complex problems
   */
  async applyRecursivePrompting(
    prompt: string, 
    max_depth: number = 3, 
    current_depth: number = 0
  ): Promise<string> {
    if (current_depth >= max_depth) {
      return prompt;
    }

    // Analyze the prompt for complexity
    const analysis_prompt = `
Analyze this prompt and determine if it would benefit from being broken down into smaller, more focused sub-prompts:

PROMPT: ${prompt}

Respond with JSON:
{
  "needs_breakdown": true/false,
  "complexity_score": 1-10,
  "suggested_subprompts": ["subprompt1", "subprompt2"],
  "reasoning": "explanation"
}`;

    try {
      const result = await this.router.route({
        prompt: analysis_prompt,
        mode: 'quality'
      });

      const provider = this.providers.get(result.providerId);
      if (!provider) {
        return prompt;
      }

      const messages: ChatMessage[] = [
        { role: 'user', content: analysis_prompt }
      ];

      const response = await provider.chatComplete(result.modelName, messages, {
        maxTokens: 1000,
        temperature: 0.3,
        json: true
      });

      const analysis = JSON.parse(response.content);
      
      if (analysis.needs_breakdown && analysis.suggested_subprompts?.length > 0) {
        // Process sub-prompts recursively
        const subprompt_results = await Promise.all(
          analysis.suggested_subprompts.map((subprompt: string) =>
            this.applyRecursivePrompting(subprompt, max_depth, current_depth + 1)
          )
        );

        // Combine results
        return `Original task: ${prompt}\n\nBreakdown approach:\n${subprompt_results.join('\n\n')}`;
      }

    } catch (error) {
      console.error('Recursive prompting analysis failed:', error);
    }

    return prompt;
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Apply template with variables
   */
  applyTemplate(templateId: string, variables: Record<string, string>): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let result = template.template;
    
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  }

  /**
   * Analyze prompt effectiveness
   */
  async analyzePromptEffectiveness(prompt: string, expected_outcome?: string): Promise<{
    clarity_score: number;
    specificity_score: number;
    completeness_score: number;
    suggestions: string[];
    overall_score: number;
  }> {
    const analysis_prompt = `
Analyze the effectiveness of this prompt for achieving high-quality AI responses:

PROMPT: ${prompt}
${expected_outcome ? `EXPECTED OUTCOME: ${expected_outcome}` : ''}

Rate the prompt on:
1. Clarity (1-10): How clear and unambiguous is the prompt?
2. Specificity (1-10): How specific and detailed are the requirements?
3. Completeness (1-10): Does it include all necessary context and constraints?

Provide response in JSON format:
{
  "clarity_score": 1-10,
  "specificity_score": 1-10,
  "completeness_score": 1-10,
  "suggestions": ["improvement suggestion 1", "improvement suggestion 2"],
  "overall_score": 1-10,
  "reasoning": "detailed analysis"
}`;

    try {
      const result = await this.router.route({
        prompt: analysis_prompt,
        mode: 'quality'
      });

      const provider = this.providers.get(result.providerId);
      if (!provider) {
        throw new Error(`Provider ${result.providerId} not found`);
      }

      const messages: ChatMessage[] = [
        { role: 'user', content: analysis_prompt }
      ];

      const response = await provider.chatComplete(result.modelName, messages, {
        maxTokens: 2000,
        temperature: 0.3,
        json: true
      });

      return JSON.parse(response.content);

    } catch (error) {
      console.error('Prompt analysis failed:', error);
      return {
        clarity_score: 5,
        specificity_score: 5,
        completeness_score: 5,
        suggestions: ['Consider adding more specific requirements', 'Provide additional context'],
        overall_score: 5
      };
    }
  }

  /**
   * Initialize built-in prompt templates
   */
  private initializeTemplates(): void {
    const templates: PromptTemplate[] = [
      {
        id: 'code_review',
        name: 'Code Review Template',
        description: 'Comprehensive code review with focus on quality, security, and best practices',
        category: 'review',
        template: `Please perform a comprehensive code review of the following {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

Focus on:
1. Code quality and readability
2. Security vulnerabilities
3. Performance implications
4. Best practices adherence
5. Potential bugs or edge cases

Provide specific, actionable feedback with examples where applicable.`,
        variables: ['language', 'code']
      },
      {
        id: 'architecture_analysis',
        name: 'Architecture Analysis Template',
        description: 'Analyze software architecture and design patterns',
        category: 'analysis',
        template: `Analyze the software architecture described below:

SYSTEM: {{system_description}}
REQUIREMENTS: {{requirements}}
CONSTRAINTS: {{constraints}}

Please provide:
1. Architecture assessment
2. Identified patterns and anti-patterns
3. Scalability considerations
4. Recommendations for improvement
5. Alternative architectural approaches`,
        variables: ['system_description', 'requirements', 'constraints']
      },
      {
        id: 'test_generation',
        name: 'Test Generation Template',
        description: 'Generate comprehensive test cases for code',
        category: 'generation',
        template: `Generate comprehensive test cases for this {{language}} function:

\`\`\`{{language}}
{{code}}
\`\`\`

Include:
1. Unit tests for normal functionality
2. Edge case tests
3. Error condition tests
4. Performance tests (if applicable)
5. Integration tests (if applicable)

Use {{test_framework}} testing framework.`,
        variables: ['language', 'code', 'test_framework']
      },
      {
        id: 'documentation_generation',
        name: 'Documentation Generation Template',
        description: 'Generate comprehensive technical documentation',
        category: 'generation',
        template: `Generate comprehensive documentation for:

{{content_type}}: {{content}}

Requirements:
- Clear and concise explanations
- Code examples where applicable
- Usage instructions
- API documentation (if applicable)
- Troubleshooting section

Target audience: {{target_audience}}
Documentation format: {{format}}`,
        variables: ['content_type', 'content', 'target_audience', 'format']
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Initialize prompting strategies
   */
  private initializeStrategies(): void {
    const strategies: PromptingStrategy[] = [
      {
        name: 'chain_of_thought',
        description: 'Step-by-step reasoning approach',
        techniques: ['sequential_reasoning', 'explicit_steps', 'intermediate_results'],
        best_for: ['complex_problems', 'mathematical_reasoning', 'logical_analysis'],
        implementation: (prompt: string, context?: any) => {
          const complexity = context?.complexity || 'moderate';
          const instructions = {
            simple: "Think step by step:",
            moderate: "Let's work through this step-by-step:",
            complex: "Let's break this down into clear, logical steps with detailed reasoning:"
          };
          return `${prompt}\n\n${instructions[complexity as keyof typeof instructions]}`;
        }
      },
      {
        name: 'few_shot_learning',
        description: 'Learning from examples',
        techniques: ['example_demonstration', 'pattern_recognition', 'analogical_reasoning'],
        best_for: ['pattern_matching', 'format_specification', 'style_mimicking'],
        implementation: (prompt: string, context?: any) => {
          if (!context?.examples) {
            return prompt;
          }
          
          let enhanced = "Here are some examples:\n\n";
          context.examples.forEach((example: any, index: number) => {
            enhanced += `Example ${index + 1}:\nInput: ${example.input}\nOutput: ${example.output}\n\n`;
          });
          enhanced += `Now handle this:\n${prompt}`;
          return enhanced;
        }
      },
      {
        name: 'role_prompting',
        description: 'Adopting specific expertise roles',
        techniques: ['expertise_simulation', 'perspective_taking', 'domain_knowledge'],
        best_for: ['specialized_tasks', 'expert_opinions', 'domain_specific_analysis'],
        implementation: (prompt: string, context?: any) => {
          const role = context?.role || 'expert';
          return `You are a ${role}. ${prompt}`;
        }
      },
      {
        name: 'constraint_prompting',
        description: 'Explicit constraint and requirement specification',
        techniques: ['requirement_specification', 'boundary_setting', 'format_enforcement'],
        best_for: ['structured_output', 'format_compliance', 'requirement_adherence'],
        implementation: (prompt: string, context?: any) => {
          const constraints = context?.constraints || [];
          if (constraints.length === 0) {
            return prompt;
          }
          
          let enhanced = `${prompt}\n\nCONSTRAINTS:\n`;
          constraints.forEach((constraint: string, index: number) => {
            enhanced += `${index + 1}. ${constraint}\n`;
          });
          return enhanced;
        }
      }
    ];

    strategies.forEach(strategy => {
      this.strategies.set(strategy.name, strategy);
    });
  }

  /**
   * Build prompt optimization request
   */
  private buildOptimizationPrompt(request: PromptOptimizationRequest): string {
    return `
You are an expert prompt engineer. Optimize the following prompt to achieve better AI responses:

ORIGINAL PROMPT:
${request.original_prompt}

OBJECTIVE: ${request.objective}

${request.context ? `CONTEXT:
- Domain: ${request.context.domain || 'General'}
- Target Model: ${request.context.target_model || 'Any'}
- Expected Format: ${request.context.expected_format || 'Any'}
- Quality Criteria: ${request.context.quality_criteria?.join(', ') || 'General quality'}` : ''}

${request.constraints ? `CONSTRAINTS:
- Max Length: ${request.constraints.max_length || 'No limit'}
- Style: ${request.constraints.style || 'Any'}
- Formality: ${request.constraints.formality || 'Any'}` : ''}

Please provide an optimized version that:
1. Improves clarity and specificity
2. Reduces ambiguity
3. Enhances the likelihood of getting the desired response
4. Applies advanced prompting techniques where appropriate

Respond in JSON format:
{
  "optimized_prompt": "The improved prompt",
  "improvements": ["List of specific improvements made"],
  "strategy_used": "Primary optimization strategy employed",
  "confidence": 0.0-1.0,
  "expected_quality_gain": 0.0-1.0,
  "reasoning": "Detailed explanation of the optimization approach"
}`;
  }

  /**
   * Fallback optimization when AI optimization fails
   */
  private fallbackOptimization(request: PromptOptimizationRequest): OptimizedPrompt {
    let optimized = request.original_prompt;
    const improvements: string[] = [];

    // Basic improvements
    if (!optimized.includes('Please')) {
      optimized = `Please ${optimized.toLowerCase()}`;
      improvements.push('Added polite language');
    }

    if (!optimized.includes(':')) {
      optimized += ':';
      improvements.push('Added clear instruction delimiter');
    }

    if (request.context?.expected_format) {
      optimized += `\n\nPlease provide your response in ${request.context.expected_format} format.`;
      improvements.push('Added format specification');
    }

    return {
      optimized_prompt: optimized,
      improvements,
      strategy_used: 'basic_enhancement',
      confidence: 0.6,
      expected_quality_gain: 0.2,
      reasoning: 'Applied basic prompt enhancement techniques'
    };
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get all available strategies
   */
  getAllStrategies(): PromptingStrategy[] {
    return Array.from(this.strategies.values());
  }
}
