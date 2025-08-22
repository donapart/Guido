/**
 * Voice Webview Provider - Manages the Speech API interface and UI
 * Handles wake word detection, recording, and visual feedback
 */
import * as vscode from "vscode";
import { VoiceConfig } from "../types";
export declare class VoiceWebviewProvider implements vscode.WebviewViewProvider {
    static readonly viewType = "guidoVoiceControl";
    private _view?;
    private _context;
    private _config;
    private _messageHandlers;
    private _isInitialized;
    constructor(context: vscode.ExtensionContext, config: VoiceConfig);
    initialize(): Promise<void>;
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    sendMessage(message: any): Promise<void>;
    onMessage(handler: (message: any) => void): void;
    destroy(): Promise<void>;
    private getHtmlContent;
    private getNonce;
}
//# sourceMappingURL=voiceWebviewProvider.d.ts.map