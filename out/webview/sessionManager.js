"use strict";
/**
 * Session Manager for Multiple Chat Sessions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
class SessionManager {
    static instance;
    sessions = new Map();
    activeSessionId = null;
    listeners = new Map();
    static getInstance() {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }
    constructor() {
        this.loadSessionsFromStorage();
    }
    createSession(name, context) {
        const id = this.generateSessionId();
        const session = {
            id,
            name: name || `Chat ${this.sessions.size + 1}`,
            created: new Date(),
            lastActivity: new Date(),
            history: [],
            context,
            tags: [],
        };
        this.sessions.set(id, session);
        this.activeSessionId = id;
        this.saveSessionsToStorage();
        this.notifyListeners('sessionCreated');
        return session;
    }
    getSession(id) {
        return this.sessions.get(id);
    }
    getActiveSession() {
        if (!this.activeSessionId) {
            // Create default session if none exists
            return this.createSession('Default Chat');
        }
        return this.sessions.get(this.activeSessionId);
    }
    setActiveSession(id) {
        if (this.sessions.has(id)) {
            this.activeSessionId = id;
            this.updateLastActivity(id);
            this.notifyListeners('sessionChanged');
            return true;
        }
        return false;
    }
    deleteSession(id) {
        if (this.sessions.has(id)) {
            this.sessions.delete(id);
            // If deleted session was active, switch to another
            if (this.activeSessionId === id) {
                const remaining = Array.from(this.sessions.keys());
                this.activeSessionId = remaining.length > 0 ? remaining[0] : null;
            }
            this.saveSessionsToStorage();
            this.notifyListeners('sessionDeleted');
            return true;
        }
        return false;
    }
    renameSession(id, newName) {
        const session = this.sessions.get(id);
        if (session) {
            session.name = newName;
            this.updateLastActivity(id);
            this.saveSessionsToStorage();
            this.notifyListeners('sessionRenamed');
            return true;
        }
        return false;
    }
    addMessage(sessionId, message) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.history.push(message);
            this.updateLastActivity(sessionId);
            this.saveSessionsToStorage();
            this.notifyListeners('messageAdded');
        }
    }
    getAllSessions() {
        return Array.from(this.sessions.values()).sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    }
    searchSessions(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.getAllSessions().filter(session => session.name.toLowerCase().includes(lowercaseQuery) ||
            session.context?.toLowerCase().includes(lowercaseQuery) ||
            session.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
            session.history.some(msg => msg.content.toLowerCase().includes(lowercaseQuery)));
    }
    addTagToSession(sessionId, tag) {
        const session = this.sessions.get(sessionId);
        if (session && !session.tags.includes(tag)) {
            session.tags.push(tag);
            this.saveSessionsToStorage();
            this.notifyListeners('sessionUpdated');
        }
    }
    removeTagFromSession(sessionId, tag) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.tags = session.tags.filter(t => t !== tag);
            this.saveSessionsToStorage();
            this.notifyListeners('sessionUpdated');
        }
    }
    exportSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return '';
        return JSON.stringify({
            ...session,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        }, null, 2);
    }
    importSession(data) {
        try {
            const imported = JSON.parse(data);
            const session = {
                id: this.generateSessionId(),
                name: `${imported.name} (Imported)`,
                created: new Date(imported.created),
                lastActivity: new Date(),
                history: imported.history.map((msg) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                })),
                context: imported.context,
                tags: imported.tags || []
            };
            this.sessions.set(session.id, session);
            this.saveSessionsToStorage();
            this.notifyListeners('sessionImported');
            return session;
        }
        catch (error) {
            console.error('Failed to import session:', error);
            return null;
        }
    }
    addEventListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    removeEventListener(event, callback) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const index = eventListeners.indexOf(callback);
            if (index > -1) {
                eventListeners.splice(index, 1);
            }
        }
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    updateLastActivity(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
        }
    }
    notifyListeners(event) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const sessions = this.getAllSessions();
            eventListeners.forEach(callback => callback(sessions));
        }
    }
    saveSessionsToStorage() {
        try {
            const data = {
                sessions: Array.from(this.sessions.entries()),
                activeSessionId: this.activeSessionId
            };
            // In a real VS Code extension, you would use the ExtensionContext.globalState
            localStorage.setItem('modelRouter.sessions', JSON.stringify(data));
        }
        catch (error) {
            console.error('Failed to save sessions:', error);
        }
    }
    loadSessionsFromStorage() {
        try {
            const stored = localStorage.getItem('modelRouter.sessions');
            if (stored) {
                const data = JSON.parse(stored);
                this.sessions = new Map(data.sessions.map(([id, session]) => [
                    id,
                    {
                        ...session,
                        created: new Date(session.created),
                        lastActivity: new Date(session.lastActivity),
                        history: session.history.map((msg) => ({
                            ...msg,
                            timestamp: new Date(msg.timestamp)
                        }))
                    }
                ]));
                this.activeSessionId = data.activeSessionId;
            }
        }
        catch (error) {
            console.error('Failed to load sessions:', error);
        }
    }
    // Cleanup old sessions (older than 30 days)
    cleanupOldSessions() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        for (const [id, session] of this.sessions) {
            if (session.lastActivity < thirtyDaysAgo) {
                this.deleteSession(id);
            }
        }
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=sessionManager.js.map