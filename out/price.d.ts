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
    warningThreshold?: number;
}
export declare class PriceCalculator {
    private static readonly DEFAULT_OUTPUT_TOKENS;
    private static readonly CHARS_PER_TOKEN;
    /**
     * Estimate cost for a prompt with a specific model
     */
    static estimateCost(prompt: string, model: ModelConfig, provider: string, expectedOutputTokens?: number): CostEstimate;
    /**
     * Calculate actual cost from token usage
     */
    static calculateActualCost(usage: TokenUsage, price: ModelPrice, model: string, provider: string): CostEstimate;
    /**
     * Calculate cost from token counts and pricing
     */
    private static calculateCost;
    /**
     * Estimate token count from text (heuristic)
     */
    static estimateTokens(text: string): number;
    /**
     * Compare costs across different models
     */
    static compareCosts(prompt: string, models: Array<{
        config: ModelConfig;
        provider: string;
    }>, expectedOutputTokens?: number): CostEstimate[];
    /**
     * Get cheapest model for a given prompt
     */
    static getCheapestModel(prompt: string, models: Array<{
        config: ModelConfig;
        provider: string;
    }>, expectedOutputTokens?: number): {
        estimate: CostEstimate;
        index: number;
    } | null;
}
export declare class BudgetManager {
    private persistentStorage?;
    private storage;
    private readonly STORAGE_KEY;
    constructor(persistentStorage?: any | undefined);
    /**
     * Record a cost transaction
     */
    recordTransaction(provider: string, model: string, cost: number, inputTokens: number, outputTokens: number, operation?: CostTransaction["operation"]): Promise<void>;
    /**
     * Get current budget usage
     */
    getBudgetUsage(): Promise<BudgetUsage>;
    /**
     * Check if operation would exceed budget
     */
    checkBudget(estimatedCost: number, config: BudgetConfig): Promise<{
        allowed: boolean;
        reason?: string;
        currentUsage: BudgetUsage;
    }>;
    /**
     * Get budget warnings
     */
    getBudgetWarnings(config: BudgetConfig): Promise<string[]>;
    /**
     * Get spending statistics
     */
    getSpendingStats(): Promise<{
        totalSpent: number;
        transactionCount: number;
        averagePerTransaction: number;
        topProviders: Array<{
            provider: string;
            cost: number;
            count: number;
        }>;
        topModels: Array<{
            model: string;
            cost: number;
            count: number;
        }>;
        dailyTrend: Array<{
            date: string;
            cost: number;
            count: number;
        }>;
    }>;
    /**
     * Clear old transactions (keep last N days)
     */
    cleanupOldTransactions(keepDays?: number): Promise<number>;
    /**
     * Export transaction data
     */
    exportTransactions(): Promise<{
        transactions: CostTransaction[];
        summary: {
            totalCost: number;
            totalTransactions: number;
            dateRange: {
                from: string;
                to: string;
            };
        };
    }>;
    private loadBudgetData;
    private saveBudgetData;
    private generateId;
}
//# sourceMappingURL=price.d.ts.map