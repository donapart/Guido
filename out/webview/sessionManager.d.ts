/**
 * Session Manager for Multiple Chat Sessions
 */
export interface ChatSession {
    id: string;
    name: string;
    created: Date;
    lastActivity: Date;
    history: ChatMessage[];
    context?: string;
    tags: string[];
    modelOverride?: string;
}
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    meta?: {
        attachments?: string[];
        modelUsed?: string;
        tokens?: {
            input: number;
            output: number;
        };
        cost?: number;
    };
}
export declare class SessionManager {
    private static instance;
    private sessions;
    private activeSessionId;
    private listeners;
    static getInstance(): SessionManager;
    private constructor();
    createSession(name?: string, context?: string): ChatSession;
    getSession(id: string): ChatSession | undefined;
    getActiveSession(): ChatSession | undefined;
    setActiveSession(id: string): boolean;
    deleteSession(id: string): boolean;
    renameSession(id: string, newName: string): boolean;
    addMessage(sessionId: string, message: ChatMessage): void;
    getAllSessions(): ChatSession[];
    searchSessions(query: string): ChatSession[];
    addTagToSession(sessionId: string, tag: string): void;
    removeTagFromSession(sessionId: string, tag: string): void;
    exportSession(sessionId: string): string;
    importSession(data: string): ChatSession | null;
    addEventListener(event: string, callback: (sessions: ChatSession[]) => void): void;
    removeEventListener(event: string, callback: (sessions: ChatSession[]) => void): void;
    private generateSessionId;
    private updateLastActivity;
    private notifyListeners;
    private saveSessionsToStorage;
    private loadSessionsFromStorage;
    cleanupOldSessions(): void;
}
//# sourceMappingURL=sessionManager.d.ts.map