/**
 * Model Router Engine - Core routing logic and rule evaluation
 */

import { ModelConfig, ProfileConfig, ProviderConfig, RoutingRule, BudgetConfig } from "./config";
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

export class ModelRouter {
  private profile: ProfileConfig;
  private providers: Map<string, Provider>;
  private modelConfigs: Map<string, ModelConfig>;
  private budgetManager?: BudgetManager;

  constructor(profile: ProfileConfig, providers: Map<string, Provider>, budgetManager?: BudgetManager) {
    this.profile = profile;
    this.providers = providers;
    this.modelConfigs = new Map();
    this.budgetManager = budgetManager;

    // Build model lookup
    for (const providerConfig of profile.providers) {
      for (const model of providerConfig.models) {
        const key = `${providerConfig.id}:${model.name}`;
        this.modelConfigs.set(key, model);
      }
    }
  }

  /** Expose read-only profile for status/budget display */
  getProfile(): ProfileConfig {
    return this.profile;
  }

  /**
   * Route a request to the best available model
   */
  async route(
    context: RoutingContext,
    options: RouterOptions = {}
  ): Promise<RoutingResult> {
    const {
      maxFallbacks = 3,
      requireAvailable = true,
      budgetCheck = true,
    } = options;

    // Extract keywords if not provided
    if (!context.keywords) {
      context.keywords = this.extractKeywords(context.prompt);
    }

    // Apply privacy mode overrides
    const effectiveContext = this.applyPrivacyMode(context);

    // Score all rules
    const scoredRules = this.scoreRules(effectiveContext);

    // Try rules in order of score
    for (const scoredRule of scoredRules) {
      const candidates = this.expandCandidates(scoredRule.rule.then.prefer);
      
      for (const candidate of candidates) {
        try {
          const result = await this.validateCandidate(
            candidate,
            effectiveContext,
            scoredRule,
            { requireAvailable, budgetCheck }
          );
          
          if (result) {
            return result;
          }
        } catch (error) {
          // Continue to next candidate
          continue;
        }
      }
    }

    // Fallback to default preferences
    const defaultCandidates = this.expandCandidates(this.profile.routing.default.prefer);
    
    for (const candidate of defaultCandidates) {
      try {
        const result = await this.validateCandidate(
          candidate,
          effectiveContext,
          { rule: null, score: 0 },
          { requireAvailable, budgetCheck }
        );
        
        if (result) {
          result.reasoning.push("Used default fallback");
          return result;
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error("No available models found for routing");
  }

  /**
   * Score all routing rules against the context
   */
  private scoreRules(context: RoutingContext): Array<{ rule: RoutingRule; score: number }> {
    const scored = this.profile.routing.rules
      .map(rule => ({
        rule,
        score: this.scoreRule(rule, context),
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored;
  }

  /**
   * Score a single rule against the context
   */
  private scoreRule(rule: RoutingRule, context: RoutingContext): number {
    let score = 0;
    const conditions = rule.if;

    // Keyword matching
    if (conditions.anyKeyword) {
      const matches = conditions.anyKeyword.filter(keyword =>
        context.keywords?.some(contextKeyword =>
          contextKeyword.toLowerCase().includes(keyword.toLowerCase())
        ) || context.prompt.toLowerCase().includes(keyword.toLowerCase())
      );
      if (matches.length > 0) {
        score += matches.length * 2;
      }
    }

    if (conditions.allKeywords) {
      const allMatch = conditions.allKeywords.every(keyword =>
        context.keywords?.some(contextKeyword =>
          contextKeyword.toLowerCase().includes(keyword.toLowerCase())
        ) || context.prompt.toLowerCase().includes(keyword.toLowerCase())
      );
      if (allMatch) {
        score += conditions.allKeywords.length * 3;
      }
    }

    // File language matching
    if (conditions.fileLangIn && context.lang) {
      if (conditions.fileLangIn.includes(context.lang)) {
        score += 1;
      }
    }

    // File path matching
    if (conditions.filePathMatches && context.filePath) {
      const matches = conditions.filePathMatches.filter(pattern =>
        this.matchesPattern(context.filePath!, pattern)
      );
      if (matches.length > 0) {
        score += matches.length;
      }
    }

    // Context size constraints
    if (conditions.minContextKB && context.fileSizeKB) {
      if (context.fileSizeKB >= conditions.minContextKB) {
        score += 1;
      }
    }

    if (conditions.maxContextKB && context.fileSizeKB) {
      if (context.fileSizeKB <= conditions.maxContextKB) {
        score += 1;
      }
    }

    // Privacy mode matching
    if (conditions.privacyStrict !== undefined) {
      if (conditions.privacyStrict === context.privacyStrict) {
        score += 3; // High weight for privacy requirements
      }
    }

    // Mode matching
    if (conditions.mode && context.mode) {
      if (conditions.mode.includes(context.mode)) {
        score += 2;
      }
    }

    // Apply rule priority
    if (rule.then.priority) {
      score += rule.then.priority;
    }

    return score;
  }

  /**
   * Expand candidate preferences with fallbacks and mode-specific overrides
   */
  private expandCandidates(preferences: string[]): Array<{ providerId: string; modelName: string }> {
    const candidates: Array<{ providerId: string; modelName: string }> = [];

    for (const preference of preferences) {
      const [providerId, modelName] = preference.split(":", 2);
      if (providerId && modelName) {
        candidates.push({ providerId, modelName });
      }
    }

    return candidates;
  }

  /**
   * Validate a candidate model and create routing result
   */
  private async validateCandidate(
    candidate: { providerId: string; modelName: string },
    context: RoutingContext,
    scoredRule: { rule: RoutingRule | null; score: number },
    options: { requireAvailable: boolean; budgetCheck: boolean }
  ): Promise<RoutingResult | null> {
    const { providerId, modelName } = candidate;
    const modelKey = `${providerId}:${modelName}`;

    // Check if provider exists
    const provider = this.providers.get(providerId);
    if (!provider) {
      return null;
    }

    // Check if model is supported
    if (!provider.supports(modelName)) {
      return null;
    }

    // Get model configuration
    const model = this.modelConfigs.get(modelKey);
    if (!model) {
      return null;
    }

    const reasoning: string[] = [];

    // Check if provider is available
    if (options.requireAvailable) {
      const available = await provider.isAvailable();
      if (!available) {
        reasoning.push(`Provider ${providerId} not available`);
        return null;
      }
    }

    // Check budget constraints
    if (options.budgetCheck && model.price && this.profile.budget) {
      const estimatedCost = this.estimateCost(context.prompt, model);
      reasoning.push(`Estimated cost: $${estimatedCost.toFixed(4)}`);

      if (this.budgetManager) {
        try {
          const budgetCheck = await this.budgetManager.checkBudget(estimatedCost, this.profile.budget as BudgetConfig);
          if (!budgetCheck.allowed) {
            reasoning.push(`Budget block: ${budgetCheck.reason}`);
            // Hard stop? then disqualify this candidate
            if (this.profile.budget?.hardStop) {
              return null;
            }
          } else if (this.profile.budget.warningThreshold) {
            const warnings = await this.budgetManager.getBudgetWarnings(this.profile.budget);
            if (warnings.length) {
              reasoning.push(...warnings.map(w => `Warn: ${w}`));
            }
          }
        } catch (e) {
          reasoning.push(`Budget check failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    // Check privacy constraints
    if (context.privacyStrict) {
      const providerConfig = this.getProviderConfig(providerId);
      if (providerConfig?.kind !== "ollama") {
        reasoning.push("Privacy mode requires local provider");
        return null;
      }
    }

    // Add rule reasoning
    if (scoredRule.rule) {
      reasoning.push(`Matched rule: ${scoredRule.rule.id} (score: ${scoredRule.score})`);
    }

    reasoning.push(`Selected ${providerId}:${modelName}`);

    return {
      providerId,
      modelName,
      provider,
      model,
      score: scoredRule.score,
      rule: scoredRule.rule || undefined,
      reasoning,
    };
  }

  /**
   * Apply privacy mode overrides to context
   */
  private applyPrivacyMode(context: RoutingContext): RoutingContext {
    const privacy = this.profile.privacy;
    const effectiveContext = { ...context };

    // Set privacy strict based on mode
    if (this.profile.mode === "privacy-strict" || this.profile.mode === "local-only") {
      effectiveContext.privacyStrict = true;
    }

    // Redact sensitive file paths
    if (privacy?.redactPaths && context.filePath) {
      for (const pattern of privacy.redactPaths) {
        if (this.matchesPattern(context.filePath, pattern)) {
          effectiveContext.filePath = "[REDACTED]";
          break;
        }
      }
    }

    // Strip large file content
    if (privacy?.stripFileContentOverKB && context.fileSizeKB) {
      if (context.fileSizeKB > privacy.stripFileContentOverKB) {
        effectiveContext.prompt = this.stripLargeContent(context.prompt);
      }
    }

    return effectiveContext;
  }

  /**
   * Extract keywords from prompt for rule matching
   */
  private extractKeywords(prompt: string): string[] {
    // Simple keyword extraction - can be enhanced
    const words = prompt
      .toLowerCase()
      .match(/\b[a-zA-Z]{3,}\b/g) || [];
    
    // Return unique words, sorted by frequency
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word)
      .slice(0, 20); // Limit to top 20 keywords
  }

  /**
   * Check if a path matches a glob-like pattern
   */
  private matchesPattern(path: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, "[^/]");
    
    const regex = new RegExp(`^${regexPattern}$`, "i");
    return regex.test(path);
  }

  /**
   * Strip large content while preserving structure
   */
  private stripLargeContent(content: string): string {
    const lines = content.split("\n");
    if (lines.length <= 100) {
      return content;
    }

    // Keep first and last 50 lines, add summary in middle
    const firstPart = lines.slice(0, 50).join("\n");
    const lastPart = lines.slice(-50).join("\n");
    const omittedLines = lines.length - 100;

    return `${firstPart}\n\n[... ${omittedLines} lines omitted for privacy ...]\n\n${lastPart}`;
  }

  /**
   * Estimate cost for a prompt with a given model
   */
  private estimateCost(prompt: string, model: ModelConfig): number {
    if (!model.price) {
      return 0;
    }

    // Estimate input tokens (rough heuristic)
    const inputTokens = Math.ceil(prompt.length / 4);
    
    // Estimate output tokens (assume 150 for average response)
    const outputTokens = 150;

    const inputCost = (inputTokens / 1_000_000) * model.price.inputPerMTok;
    const outputCost = (outputTokens / 1_000_000) * model.price.outputPerMTok;

    return inputCost + outputCost;
  }

  /**
   * Get provider configuration by ID
   */
  private getProviderConfig(providerId: string): ProviderConfig | undefined {
    return this.profile.providers.find(p => p.id === providerId);
  }

  /**
   * Get all available models with their capabilities
   */
  getAvailableModels(): Array<{
    providerId: string;
    modelName: string;
    config: ModelConfig;
    provider: Provider;
  }> {
    const models: Array<{
      providerId: string;
      modelName: string;
      config: ModelConfig;
      provider: Provider;
    }> = [];

    for (const providerConfig of this.profile.providers) {
      const provider = this.providers.get(providerConfig.id);
      if (!provider) continue;

      for (const model of providerConfig.models) {
        models.push({
          providerId: providerConfig.id,
          modelName: model.name,
          config: model,
          provider,
        });
      }
    }

    return models;
  }

  /**
   * Get models with specific capabilities
   */
  getModelsByCap(capability: string): Array<{
    providerId: string;
    modelName: string;
    config: ModelConfig;
  }> {
    return this.getAvailableModels()
      .filter(item => item.config.caps?.includes(capability))
      .map(({ providerId, modelName, config }) => ({ providerId, modelName, config }));
  }

  /**
   * Simulate routing without actually executing
   */
  async simulateRoute(context: RoutingContext): Promise<{
    result?: RoutingResult;
    alternatives: Array<{
      providerId: string;
      modelName: string;
      score: number;
      available: boolean;
      reasoning: string[];
    }>;
  }> {
    const alternatives: Array<{
      providerId: string;
      modelName: string;
      score: number;
      available: boolean;
      reasoning: string[];
    }> = [];

    try {
      const result = await this.route(context, { requireAvailable: false });
      
      // Get alternatives
      const scoredRules = this.scoreRules(context);
      for (const { rule, score } of scoredRules.slice(0, 5)) {
        const candidates = this.expandCandidates(rule.then.prefer);
        
        for (const candidate of candidates.slice(0, 3)) {
          const provider = this.providers.get(candidate.providerId);
          const available = provider ? await provider.isAvailable() : false;
          
          alternatives.push({
            providerId: candidate.providerId,
            modelName: candidate.modelName,
            score,
            available,
            reasoning: [`Rule: ${rule.id}`, `Score: ${score}`],
          });
        }
      }

      return { result, alternatives };
    } catch (error) {
      return { alternatives };
    }
  }
}
