/**
 * Price calculation and budget management for Model Router
 */

import { ModelConfig, ModelPrice } from "./config";
import { TokenUsage } from "./providers/base";

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  currency: "USD";
  model: string;
  provider: string;
}

export interface BudgetUsage {
  dailySpent: number;
  monthlySpent: number;
  dailyLimit: number;
  monthlyLimit: number;
  currency: "USD";
  lastReset: string;
  transactions: CostTransaction[];
}

export interface CostTransaction {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  operation: "chat" | "completion" | "test";
}

export interface BudgetConfig {
  dailyUSD?: number;
  monthlyUSD?: number;
  hardStop?: boolean;
  warningThreshold?: number; // Percentage (0-100)
}

export class PriceCalculator {
  private static readonly DEFAULT_OUTPUT_TOKENS = 150;
  private static readonly CHARS_PER_TOKEN = 4; // Conservative estimate

  /**
   * Estimate cost for a prompt with a specific model
   */
  static estimateCost(
    prompt: string,
    model: ModelConfig,
    provider: string,
    expectedOutputTokens?: number
  ): CostEstimate {
    if (!model.price) {
      return {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        inputTokens: 0,
        outputTokens: expectedOutputTokens || 0,
        currency: "USD",
        model: model.name,
        provider,
      };
    }

    const inputTokens = this.estimateTokens(prompt);
    const outputTokens = expectedOutputTokens || this.DEFAULT_OUTPUT_TOKENS;

    return this.calculateCost(
      inputTokens,
      outputTokens,
      model.price,
      model.name,
      provider
    );
  }

  /**
   * Calculate actual cost from token usage
   */
  static calculateActualCost(
    usage: TokenUsage,
    price: ModelPrice,
    model: string,
    provider: string
  ): CostEstimate {
    return this.calculateCost(
      usage.inputTokens,
      usage.outputTokens,
      price,
      model,
      provider,
      usage.cachedInputTokens
    );
  }

  /**
   * Calculate cost from token counts and pricing
   */
  private static calculateCost(
    inputTokens: number,
    outputTokens: number,
    price: ModelPrice,
    model: string,
    provider: string,
    cachedInputTokens?: number
  ): CostEstimate {
    const regularInputTokens = cachedInputTokens 
      ? inputTokens - cachedInputTokens 
      : inputTokens;

    // Calculate input cost
    let inputCost = (regularInputTokens / 1_000_000) * price.inputPerMTok;
    
    // Add cached input cost if applicable
    if (cachedInputTokens && price.cachedInputPerMTok) {
      inputCost += (cachedInputTokens / 1_000_000) * price.cachedInputPerMTok;
    }

    // Calculate output cost
    const outputCost = (outputTokens / 1_000_000) * price.outputPerMTok;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      inputTokens,
      outputTokens,
      currency: "USD",
      model,
      provider,
    };
  }

  /**
   * Estimate token count from text (heuristic)
   */
  static estimateTokens(text: string): number {
    // More sophisticated estimation based on text characteristics
    const words = text.split(/\s+/).length;
    const chars = text.length;
    
    // Different estimation methods
    const charBasedEstimate = Math.ceil(chars / this.CHARS_PER_TOKEN);
    const wordBasedEstimate = Math.ceil(words * 1.3); // ~1.3 tokens per word on average
    
    // Use the higher estimate for safety
    return Math.max(charBasedEstimate, wordBasedEstimate);
  }

  /**
   * Compare costs across different models
   */
  static compareCosts(
    prompt: string,
    models: Array<{ config: ModelConfig; provider: string }>,
    expectedOutputTokens?: number
  ): CostEstimate[] {
    return models
      .map(({ config, provider }) =>
        this.estimateCost(prompt, config, provider, expectedOutputTokens)
      )
      .sort((a, b) => a.totalCost - b.totalCost);
  }

  /**
   * Get cheapest model for a given prompt
   */
  static getCheapestModel(
    prompt: string,
    models: Array<{ config: ModelConfig; provider: string }>,
    expectedOutputTokens?: number
  ): { estimate: CostEstimate; index: number } | null {
    const costs = this.compareCosts(prompt, models, expectedOutputTokens);
    
    if (costs.length === 0) {
      return null;
    }

    const cheapest = costs[0];
    const index = models.findIndex(
      m => m.config.name === cheapest.model && m.provider === cheapest.provider
    );

    return { estimate: cheapest, index };
  }
}

export class BudgetManager {
  private storage: Map<string, any> = new Map();
  private readonly STORAGE_KEY = "modelRouter.budget";

  constructor(private persistentStorage?: any) {
    this.loadBudgetData();
  }

  /**
   * Record a cost transaction
   */
  async recordTransaction(
    provider: string,
    model: string,
    cost: number,
    inputTokens: number,
    outputTokens: number,
    operation: CostTransaction["operation"] = "chat"
  ): Promise<void> {
    const transaction: CostTransaction = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      provider,
      model,
      cost,
      inputTokens,
      outputTokens,
      operation,
    };

    const usage = await this.getBudgetUsage();
    usage.transactions.push(transaction);
    usage.dailySpent += cost;
    usage.monthlySpent += cost;

    await this.saveBudgetData(usage);
  }

  /**
   * Get current budget usage
   */
  async getBudgetUsage(): Promise<BudgetUsage> {
    const stored = await this.loadBudgetData();
    const today = new Date().toISOString().split("T")[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    // Reset daily/monthly counters if needed
    if (stored.lastReset !== today) {
      stored.dailySpent = 0;
      stored.lastReset = today;
    }

    // Filter transactions for current month
    const currentMonthTransactions = stored.transactions.filter(
      t => t.timestamp.slice(0, 7) === thisMonth
    );

    stored.monthlySpent = currentMonthTransactions.reduce(
      (sum, t) => sum + t.cost,
      0
    );

    return stored;
  }

  /**
   * Check if operation would exceed budget
   */
  async checkBudget(
    estimatedCost: number,
    config: BudgetConfig
  ): Promise<{
    allowed: boolean;
    reason?: string;
    currentUsage: BudgetUsage;
  }> {
    const usage = await this.getBudgetUsage();

    // Check daily limit
    if (config.dailyUSD && config.dailyUSD > 0) {
      const newDailyTotal = usage.dailySpent + estimatedCost;
      if (newDailyTotal > config.dailyUSD) {
        return {
          allowed: false,
          reason: `Would exceed daily budget ($${config.dailyUSD}). Current: $${usage.dailySpent.toFixed(4)}, Estimated: +$${estimatedCost.toFixed(4)}`,
          currentUsage: usage,
        };
      }
    }

    // Check monthly limit
    if (config.monthlyUSD && config.monthlyUSD > 0) {
      const newMonthlyTotal = usage.monthlySpent + estimatedCost;
      if (newMonthlyTotal > config.monthlyUSD) {
        return {
          allowed: false,
          reason: `Would exceed monthly budget ($${config.monthlyUSD}). Current: $${usage.monthlySpent.toFixed(4)}, Estimated: +$${estimatedCost.toFixed(4)}`,
          currentUsage: usage,
        };
      }
    }

    return { allowed: true, currentUsage: usage };
  }

  /**
   * Get budget warnings
   */
  async getBudgetWarnings(config: BudgetConfig): Promise<string[]> {
    const warnings: string[] = [];
    const usage = await this.getBudgetUsage();
    const threshold = (config.warningThreshold || 80) / 100;

    // Daily budget warnings
    if (config.dailyUSD && config.dailyUSD > 0) {
      const dailyPercent = usage.dailySpent / config.dailyUSD;
      if (dailyPercent >= threshold) {
        warnings.push(
          `Daily budget ${(dailyPercent * 100).toFixed(1)}% used ($${usage.dailySpent.toFixed(2)} of $${config.dailyUSD})`
        );
      }
    }

    // Monthly budget warnings
    if (config.monthlyUSD && config.monthlyUSD > 0) {
      const monthlyPercent = usage.monthlySpent / config.monthlyUSD;
      if (monthlyPercent >= threshold) {
        warnings.push(
          `Monthly budget ${(monthlyPercent * 100).toFixed(1)}% used ($${usage.monthlySpent.toFixed(2)} of $${config.monthlyUSD})`
        );
      }
    }

    return warnings;
  }

  /**
   * Get spending statistics
   */
  async getSpendingStats(): Promise<{
    totalSpent: number;
    transactionCount: number;
    averagePerTransaction: number;
    topProviders: Array<{ provider: string; cost: number; count: number }>;
    topModels: Array<{ model: string; cost: number; count: number }>;
    dailyTrend: Array<{ date: string; cost: number; count: number }>;
  }> {
    const usage = await this.getBudgetUsage();
    const { transactions } = usage;

    const totalSpent = transactions.reduce((sum, t) => sum + t.cost, 0);
    const transactionCount = transactions.length;
    const averagePerTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

    // Group by provider
    const providerStats = new Map<string, { cost: number; count: number }>();
    const modelStats = new Map<string, { cost: number; count: number }>();
    const dailyStats = new Map<string, { cost: number; count: number }>();

    for (const transaction of transactions) {
      // Provider stats
      const providerStat = providerStats.get(transaction.provider) || { cost: 0, count: 0 };
      providerStat.cost += transaction.cost;
      providerStat.count += 1;
      providerStats.set(transaction.provider, providerStat);

      // Model stats
      const modelStat = modelStats.get(transaction.model) || { cost: 0, count: 0 };
      modelStat.cost += transaction.cost;
      modelStat.count += 1;
      modelStats.set(transaction.model, modelStat);

      // Daily stats
      const date = transaction.timestamp.split("T")[0];
      const dailyStat = dailyStats.get(date) || { cost: 0, count: 0 };
      dailyStat.cost += transaction.cost;
      dailyStat.count += 1;
      dailyStats.set(date, dailyStat);
    }

    const topProviders = Array.from(providerStats.entries())
      .map(([provider, stats]) => ({ provider, ...stats }))
      .sort((a, b) => b.cost - a.cost);

    const topModels = Array.from(modelStats.entries())
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.cost - a.cost);

    const dailyTrend = Array.from(dailyStats.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSpent,
      transactionCount,
      averagePerTransaction,
      topProviders,
      topModels,
      dailyTrend,
    };
  }

  /**
   * Clear old transactions (keep last N days)
   */
  async cleanupOldTransactions(keepDays: number = 30): Promise<number> {
    const usage = await this.getBudgetUsage();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    const cutoffString = cutoffDate.toISOString();

    const oldCount = usage.transactions.length;
    usage.transactions = usage.transactions.filter(
      t => t.timestamp >= cutoffString
    );
    const newCount = usage.transactions.length;

    await this.saveBudgetData(usage);
    return oldCount - newCount;
  }

  /**
   * Export transaction data
   */
  async exportTransactions(): Promise<{
    transactions: CostTransaction[];
    summary: {
      totalCost: number;
      totalTransactions: number;
      dateRange: { from: string; to: string };
    };
  }> {
    const usage = await this.getBudgetUsage();
    const transactions = [...usage.transactions].sort(
      (a, b) => a.timestamp.localeCompare(b.timestamp)
    );

    const totalCost = transactions.reduce((sum, t) => sum + t.cost, 0);
    const dates = transactions.map(t => t.timestamp).sort();

    return {
      transactions,
      summary: {
        totalCost,
        totalTransactions: transactions.length,
        dateRange: {
          from: dates[0] || "",
          to: dates[dates.length - 1] || "",
        },
      },
    };
  }

  private async loadBudgetData(): Promise<BudgetUsage> {
    try {
      const stored = this.persistentStorage?.get?.(this.STORAGE_KEY) || this.storage.get(this.STORAGE_KEY);
      
      if (stored) {
        return {
          dailySpent: stored.dailySpent || 0,
          monthlySpent: stored.monthlySpent || 0,
          dailyLimit: stored.dailyLimit || 0,
          monthlyLimit: stored.monthlyLimit || 0,
          currency: "USD",
          lastReset: stored.lastReset || new Date().toISOString().split("T")[0],
          transactions: stored.transactions || [],
        };
      }
    } catch (error) {
      console.warn("Failed to load budget data:", error);
    }

    // Return default budget usage
    return {
      dailySpent: 0,
      monthlySpent: 0,
      dailyLimit: 0,
      monthlyLimit: 0,
      currency: "USD",
      lastReset: new Date().toISOString().split("T")[0],
      transactions: [],
    };
  }

  private async saveBudgetData(usage: BudgetUsage): Promise<void> {
    try {
      if (this.persistentStorage?.update) {
        await this.persistentStorage.update(this.STORAGE_KEY, usage);
      } else {
        this.storage.set(this.STORAGE_KEY, usage);
      }
    } catch (error) {
      console.error("Failed to save budget data:", error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
