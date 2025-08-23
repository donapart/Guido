import * as vscode from 'vscode';
export declare class ChatPanel {
    static current: ChatPanel | undefined;
    private readonly panel;
    private disposables;
    private sessionManager;
    private historyNavigator;
    private currentSessionId;
    static readonly viewType = "modelRouter.chatPanel";
    static createOrShow(extensionUri: vscode.Uri): void;
    private constructor();
    private post;
    streamDelta(t: string): void;
    streamDone(meta?: any): void;
    showError(m: string): void;
    focusInput(): void;
    sendInfo(message: string): void;
    sendHistory(history: {
        role: 'user' | 'assistant';
        content: string;
        meta?: any;
    }[]): void;
    addUserMessage(text: string): void;
    sendModels(models: string[]): void;
    sendVoiceState(state: string): void;
    private handleMessage;
    private addMessageToSession;
    private loadSessionHistory;
    private createNewSession;
    private switchSession;
    private deleteSession;
    private renameSession;
    private searchHistory;
    private sendSessionsList;
    dispose(): void;
    private renderHtml;
}
//# sourceMappingURL=chatPanel.d.ts.map