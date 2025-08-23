/**
 * Split View Provider for Code + AI Side-by-Side
 */
import * as vscode from 'vscode';
export declare class SplitViewProvider implements vscode.WebviewViewProvider {
    private readonly _extensionUri;
    static readonly viewType = "modelRouter.splitView";
    private _view?;
    private sessionManager;
    private currentEditor?;
    private isListening;
    constructor(_extensionUri: vscode.Uri);
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    private setupEditorListeners;
    private updateContext;
    private handleChatMessage;
    private insertCodeIntoEditor;
    private replaceCodeInEditor;
    private toggleSplitMode;
    private getHtmlForWebview;
}
//# sourceMappingURL=splitViewProvider.d.ts.map