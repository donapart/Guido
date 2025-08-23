/**
 * Advanced History Navigator with Search and Filtering
 */
import { ChatMessage } from './sessionManager';
export interface HistoryFilter {
    dateRange?: {
        start: Date;
        end: Date;
    };
    models?: string[];
    tags?: string[];
    messageType?: 'user' | 'assistant' | 'system';
    hasAttachments?: boolean;
    minTokens?: number;
    maxTokens?: number;
    costRange?: {
        min: number;
        max: number;
    };
}
export interface SearchResult {
    sessionId: string;
    sessionName: string;
    messageIndex: number;
    message: ChatMessage;
    excerpt: string;
    relevanceScore: number;
}
export declare class HistoryNavigator {
    private sessionManager;
    private searchIndex;
    constructor();
    /**
     * Search through all chat history
     */
    search(query: string, filters?: HistoryFilter): SearchResult[];
    /**
     * Get conversation context around a specific message
     */
    getContext(sessionId: string, messageIndex: number, contextSize?: number): ChatMessage[];
    /**
     * Find similar conversations based on content similarity
     */
    findSimilarConversations(sessionId: string, messageIndex: number, limit?: number): SearchResult[];
    /**
     * Get statistics about chat history
     */
    getHistoryStats(): {
        totalSessions: number;
        totalMessages: number;
        totalTokens: number;
        totalCost: number;
        averageSessionLength: number;
        mostUsedModels: Array<{
            model: string;
            count: number;
        }>;
        timeRanges: {
            earliest: Date;
            latest: Date;
        };
    };
    /**
     * Export filtered history
     */
    exportHistory(filters?: HistoryFilter, format?: 'json' | 'markdown' | 'csv'): string;
    private buildSearchIndex;
    private tokenizeQuery;
    private isStopWord;
    private calculateRelevance;
    private calculateSimilarity;
    private createExcerpt;
    private sessionMatchesFilter;
    private messageMatchesFilter;
    private exportToMarkdown;
    private exportToCSV;
}
//# sourceMappingURL=historyNavigator.d.ts.map