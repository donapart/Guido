import * as vscode from 'vscode';
/**
 * Docked Chat View (WebviewViewProvider) – synchronisiert weitgehend mit Panel-Version.
 * Hinweis: Aktuell einfache Duplikation der HTML-Struktur aus chatPanel.ts. Später ggf. refaktorieren.
 */
export declare class ChatDockViewProvider implements vscode.WebviewViewProvider {
    private readonly extensionUri;
    static readonly viewType = "modelRouterChatDock";
    static current: ChatDockViewProvider | undefined;
    private view;
    private disposables;
    constructor(extensionUri: vscode.Uri);
    resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void>;
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
    dispose(): void;
    private renderHtml;
}
//# sourceMappingURL=chatDockView.d.ts.map