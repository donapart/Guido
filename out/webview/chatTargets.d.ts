export interface ChatTarget {
    streamDelta(t: string): void;
    streamDone(meta?: any): void;
    showError(m: string): void;
    sendInfo(m: string): void;
    sendHistory(h: {
        role: 'user' | 'assistant';
        content: string;
        meta?: any;
    }[]): void;
    addUserMessage(t: string): void;
    sendModels(models: string[]): void;
    sendVoiceState(state: string): void;
}
export declare function getActiveChatTargets(): ChatTarget[];
//# sourceMappingURL=chatTargets.d.ts.map