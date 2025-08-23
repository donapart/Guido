"use strict";
/**
 * Advanced History Navigator with Search and Filtering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryNavigator = void 0;
const sessionManager_1 = require("./sessionManager");
class HistoryNavigator {
    sessionManager;
    searchIndex = new Map();
    constructor() {
        this.sessionManager = sessionManager_1.SessionManager.getInstance();
        this.buildSearchIndex();
        // Rebuild index when sessions change
        this.sessionManager.addEventListener('messageAdded', () => this.buildSearchIndex());
        this.sessionManager.addEventListener('sessionImported', () => this.buildSearchIndex());
    }
    /**
     * Search through all chat history
     */
    search(query, filters) {
        const results = [];
        const queryTerms = this.tokenizeQuery(query);
        for (const session of this.sessionManager.getAllSessions()) {
            if (!this.sessionMatchesFilter(session, filters))
                continue;
            session.history.forEach((message, index) => {
                if (!this.messageMatchesFilter(message, filters))
                    return;
                const relevanceScore = this.calculateRelevance(message.content, queryTerms);
                if (relevanceScore > 0) {
                    results.push({
                        sessionId: session.id,
                        sessionName: session.name,
                        messageIndex: index,
                        message,
                        excerpt: this.createExcerpt(message.content, queryTerms),
                        relevanceScore
                    });
                }
            });
        }
        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    /**
     * Get conversation context around a specific message
     */
    getContext(sessionId, messageIndex, contextSize = 3) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session)
            return [];
        const start = Math.max(0, messageIndex - contextSize);
        const end = Math.min(session.history.length, messageIndex + contextSize + 1);
        return session.history.slice(start, end);
    }
    /**
     * Find similar conversations based on content similarity
     */
    findSimilarConversations(sessionId, messageIndex, limit = 5) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session || !session.history[messageIndex])
            return [];
        const targetMessage = session.history[messageIndex];
        const queryTerms = this.tokenizeQuery(targetMessage.content);
        const results = [];
        for (const otherSession of this.sessionManager.getAllSessions()) {
            if (otherSession.id === sessionId)
                continue;
            otherSession.history.forEach((message, index) => {
                if (message.role === targetMessage.role) {
                    const similarity = this.calculateSimilarity(targetMessage.content, message.content);
                    if (similarity > 0.3) { // Threshold for similarity
                        results.push({
                            sessionId: otherSession.id,
                            sessionName: otherSession.name,
                            messageIndex: index,
                            message,
                            excerpt: this.createExcerpt(message.content, queryTerms),
                            relevanceScore: similarity
                        });
                    }
                }
            });
        }
        return results
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);
    }
    /**
     * Get statistics about chat history
     */
    getHistoryStats() {
        const sessions = this.sessionManager.getAllSessions();
        let totalMessages = 0;
        let totalTokens = 0;
        let totalCost = 0;
        const modelCounts = new Map();
        let earliest = new Date();
        let latest = new Date(0);
        for (const session of sessions) {
            totalMessages += session.history.length;
            if (session.created < earliest)
                earliest = session.created;
            if (session.lastActivity > latest)
                latest = session.lastActivity;
            for (const message of session.history) {
                if (message.meta?.tokens) {
                    totalTokens += message.meta.tokens.input + message.meta.tokens.output;
                }
                if (message.meta?.cost) {
                    totalCost += message.meta.cost;
                }
                if (message.meta?.modelUsed) {
                    const count = modelCounts.get(message.meta.modelUsed) || 0;
                    modelCounts.set(message.meta.modelUsed, count + 1);
                }
            }
        }
        const mostUsedModels = Array.from(modelCounts.entries())
            .map(([model, count]) => ({ model, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return {
            totalSessions: sessions.length,
            totalMessages,
            totalTokens,
            totalCost,
            averageSessionLength: sessions.length > 0 ? totalMessages / sessions.length : 0,
            mostUsedModels,
            timeRanges: { earliest, latest }
        };
    }
    /**
     * Export filtered history
     */
    exportHistory(filters, format = 'json') {
        const sessions = this.sessionManager.getAllSessions()
            .filter(session => this.sessionMatchesFilter(session, filters));
        switch (format) {
            case 'markdown':
                return this.exportToMarkdown(sessions, filters);
            case 'csv':
                return this.exportToCSV(sessions, filters);
            default:
                return JSON.stringify({
                    exportedAt: new Date().toISOString(),
                    filters,
                    sessions: sessions.map(session => ({
                        ...session,
                        history: session.history.filter(msg => this.messageMatchesFilter(msg, filters))
                    }))
                }, null, 2);
        }
    }
    buildSearchIndex() {
        this.searchIndex.clear();
        for (const session of this.sessionManager.getAllSessions()) {
            const tokens = new Set();
            // Index session metadata
            this.tokenizeQuery(session.name).forEach(token => tokens.add(token));
            if (session.context) {
                this.tokenizeQuery(session.context).forEach(token => tokens.add(token));
            }
            session.tags.forEach(tag => tokens.add(tag.toLowerCase()));
            // Index message content
            for (const message of session.history) {
                this.tokenizeQuery(message.content).forEach(token => tokens.add(token));
            }
            this.searchIndex.set(session.id, Array.from(tokens));
        }
    }
    tokenizeQuery(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(term => term.length > 2) // Ignore very short terms
            .filter(term => !this.isStopWord(term));
    }
    isStopWord(word) {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
            'this', 'that', 'these', 'those', 'what', 'where', 'when', 'how', 'why'
        ]);
        return stopWords.has(word);
    }
    calculateRelevance(content, queryTerms) {
        const contentTerms = this.tokenizeQuery(content);
        const matches = queryTerms.filter(term => contentTerms.some(contentTerm => contentTerm.includes(term) || term.includes(contentTerm)));
        return matches.length / queryTerms.length;
    }
    calculateSimilarity(text1, text2) {
        const terms1 = new Set(this.tokenizeQuery(text1));
        const terms2 = new Set(this.tokenizeQuery(text2));
        const intersection = new Set([...terms1].filter(term => terms2.has(term)));
        const union = new Set([...terms1, ...terms2]);
        return intersection.size / union.size; // Jaccard similarity
    }
    createExcerpt(content, queryTerms, maxLength = 200) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        // Find sentence with most query term matches
        let bestSentence = sentences[0] || '';
        let maxMatches = 0;
        for (const sentence of sentences) {
            const sentenceTerms = this.tokenizeQuery(sentence);
            const matches = queryTerms.filter(term => sentenceTerms.some(sTerm => sTerm.includes(term))).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                bestSentence = sentence;
            }
        }
        // Truncate if too long
        if (bestSentence.length > maxLength) {
            bestSentence = bestSentence.substring(0, maxLength - 3) + '...';
        }
        return bestSentence.trim();
    }
    sessionMatchesFilter(session, filters) {
        if (!filters)
            return true;
        if (filters.dateRange) {
            if (session.created < filters.dateRange.start || session.created > filters.dateRange.end) {
                return false;
            }
        }
        if (filters.tags && filters.tags.length > 0) {
            if (!filters.tags.some(tag => session.tags.includes(tag))) {
                return false;
            }
        }
        return true;
    }
    messageMatchesFilter(message, filters) {
        if (!filters)
            return true;
        if (filters.messageType && message.role !== filters.messageType) {
            return false;
        }
        if (filters.hasAttachments !== undefined) {
            const hasAttachments = message.meta?.attachments && message.meta.attachments.length > 0;
            if (filters.hasAttachments !== hasAttachments) {
                return false;
            }
        }
        if (filters.models && filters.models.length > 0) {
            if (!message.meta?.modelUsed || !filters.models.includes(message.meta.modelUsed)) {
                return false;
            }
        }
        if (filters.minTokens || filters.maxTokens) {
            const totalTokens = (message.meta?.tokens?.input || 0) + (message.meta?.tokens?.output || 0);
            if (filters.minTokens && totalTokens < filters.minTokens)
                return false;
            if (filters.maxTokens && totalTokens > filters.maxTokens)
                return false;
        }
        if (filters.costRange) {
            const cost = message.meta?.cost || 0;
            if (cost < filters.costRange.min || cost > filters.costRange.max)
                return false;
        }
        return true;
    }
    exportToMarkdown(sessions, filters) {
        let markdown = `# Chat History Export\n\n`;
        markdown += `**Exported:** ${new Date().toISOString()}\n\n`;
        if (filters) {
            markdown += `**Filters Applied:** ${JSON.stringify(filters, null, 2)}\n\n`;
        }
        for (const session of sessions) {
            markdown += `## ${session.name}\n\n`;
            markdown += `**Created:** ${session.created.toISOString()}\n`;
            markdown += `**Last Activity:** ${session.lastActivity.toISOString()}\n`;
            if (session.tags.length > 0) {
                markdown += `**Tags:** ${session.tags.join(', ')}\n`;
            }
            if (session.context) {
                markdown += `**Context:** ${session.context}\n`;
            }
            markdown += `\n### Messages\n\n`;
            const filteredMessages = session.history.filter(msg => this.messageMatchesFilter(msg, filters));
            for (const message of filteredMessages) {
                markdown += `**${message.role.toUpperCase()}** (${message.timestamp.toISOString()})\n\n`;
                markdown += `${message.content}\n\n`;
                if (message.meta) {
                    markdown += `*Meta: ${JSON.stringify(message.meta)}*\n\n`;
                }
                markdown += `---\n\n`;
            }
        }
        return markdown;
    }
    exportToCSV(sessions, filters) {
        const headers = [
            'Session ID', 'Session Name', 'Message Role', 'Content', 'Timestamp',
            'Model Used', 'Input Tokens', 'Output Tokens', 'Cost', 'Has Attachments'
        ];
        const rows = [headers.join(',')];
        for (const session of sessions) {
            const filteredMessages = session.history.filter(msg => this.messageMatchesFilter(msg, filters));
            for (const message of filteredMessages) {
                const row = [
                    `"${session.id}"`,
                    `"${session.name}"`,
                    `"${message.role}"`,
                    `"${message.content.replace(/"/g, '""')}"`,
                    `"${message.timestamp.toISOString()}"`,
                    `"${message.meta?.modelUsed || ''}"`,
                    `"${message.meta?.tokens?.input || 0}"`,
                    `"${message.meta?.tokens?.output || 0}"`,
                    `"${message.meta?.cost || 0}"`,
                    `"${message.meta?.attachments && message.meta.attachments.length > 0 ? 'Yes' : 'No'}"`
                ];
                rows.push(row.join(','));
            }
        }
        return rows.join('\n');
    }
}
exports.HistoryNavigator = HistoryNavigator;
//# sourceMappingURL=historyNavigator.js.map