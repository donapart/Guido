/**
 * Split View Provider for Code + AI Side-by-Side
 */

import * as vscode from 'vscode';
import { ChatSession, SessionManager } from './sessionManager';

export class SplitViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'modelRouter.splitView';
  
  private _view?: vscode.WebviewView;
  private sessionManager: SessionManager;
  private currentEditor?: vscode.TextEditor;
  private isListening = false;

  constructor(private readonly _extensionUri: vscode.Uri) {
    this.sessionManager = SessionManager.getInstance();
    this.setupEditorListeners();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'chat:send':
          await this.handleChatMessage(data.message, data.includeCode);
          break;
        case 'code:insert':
          await this.insertCodeIntoEditor(data.code);
          break;
        case 'code:replace':
          await this.replaceCodeInEditor(data.code, data.selection);
          break;
        case 'split:toggle':
          await this.toggleSplitMode();
          break;
        case 'context:update':
          this.updateContext();
          break;
      }
    });

    // Initialize with current editor context
    this.updateContext();
  }

  private setupEditorListeners() {
    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      this.currentEditor = editor;
      this.updateContext();
    });

    // Listen for text selection changes
    vscode.window.onDidChangeTextEditorSelection((event) => {
      if (event.textEditor === vscode.window.activeTextEditor) {
        this.updateContext();
      }
    });
  }

  private updateContext() {
    if (!this._view) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this._view.webview.postMessage({
        type: 'context:updated',
        data: { hasEditor: false }
      });
      return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    const language = editor.document.languageId;
    const fileName = editor.document.fileName;
    const lineCount = editor.document.lineCount;
    const cursorPosition = editor.selection.active;

    // Get surrounding context (10 lines before and after selection)
    const contextRange = new vscode.Range(
      Math.max(0, selection.start.line - 10),
      0,
      Math.min(lineCount - 1, selection.end.line + 10),
      editor.document.lineAt(Math.min(lineCount - 1, selection.end.line + 10)).text.length
    );
    const contextText = editor.document.getText(contextRange);

    this._view.webview.postMessage({
      type: 'context:updated',
      data: {
        hasEditor: true,
        fileName,
        language,
        selectedText,
        hasSelection: !selection.isEmpty,
        cursorPosition: { line: cursorPosition.line, character: cursorPosition.character },
        contextText,
        lineCount
      }
    });
  }

  private async handleChatMessage(message: string, includeCode: boolean) {
    const session = this.sessionManager.getActiveSession() || this.sessionManager.createSession();
    
    let fullMessage = message;
    
    if (includeCode && this.currentEditor) {
      const selection = this.currentEditor.selection;
      const selectedText = this.currentEditor.document.getText(selection);
      const language = this.currentEditor.document.languageId;
      
      if (selectedText) {
        fullMessage = `${message}\n\n**Selected ${language} code:**\n\`\`\`${language}\n${selectedText}\n\`\`\``;
      } else {
        // Include visible editor content
        const visibleRange = this.currentEditor.visibleRanges[0];
        const visibleText = this.currentEditor.document.getText(visibleRange);
        fullMessage = `${message}\n\n**Current ${language} file context:**\n\`\`\`${language}\n${visibleText}\n\`\`\``;
      }
    }

    // Send to main chat system
    await vscode.commands.executeCommand('modelRouter.chat.sendFromWebview', fullMessage);
  }

  private async insertCodeIntoEditor(code: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor to insert code');
      return;
    }

    const position = editor.selection.active;
    await editor.edit(editBuilder => {
      editBuilder.insert(position, code);
    });

    // Show success message
    this._view?.webview.postMessage({
      type: 'notification',
      data: { message: 'Code inserted successfully', type: 'success' }
    });
  }

  private async replaceCodeInEditor(code: string, selectionData?: any) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor to replace code');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty && !selectionData) {
      vscode.window.showErrorMessage('No code selected to replace');
      return;
    }

    await editor.edit(editBuilder => {
      editBuilder.replace(selection, code);
    });

    // Show success message
    this._view?.webview.postMessage({
      type: 'notification',
      data: { message: 'Code replaced successfully', type: 'success' }
    });
  }

  private async toggleSplitMode() {
    // Toggle between split view and normal view
    const config = vscode.workspace.getConfiguration('modelRouter');
    const currentMode = config.get('splitView.enabled', false);
    await config.update('splitView.enabled', !currentMode, vscode.ConfigurationTarget.Global);

    this._view?.webview.postMessage({
      type: 'split:toggled',
      data: { enabled: !currentMode }
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; 
          style-src ${webview.cspSource} 'unsafe-inline'; 
          script-src 'nonce-${nonce}' https://cdn.jsdelivr.net; 
          connect-src https:;">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Split View</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 8px;
            font-size: 13px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
            margin-bottom: 12px;
        }
        
        .context-info {
            background: var(--vscode-editorWidget-background);
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 12px;
            font-size: 11px;
            border-left: 3px solid var(--vscode-focusBorder);
        }
        
        .context-info.no-editor {
            border-left-color: var(--vscode-editorWarning-foreground);
            background: var(--vscode-editorWarning-background);
        }
        
        .chat-input {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .input-group {
            display: flex;
            gap: 8px;
        }
        
        #messageInput {
            flex: 1;
            min-height: 60px;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            resize: vertical;
            font-family: inherit;
        }
        
        .button-group {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }
        
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s;
        }
        
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        button.secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        button.secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .suggestions {
            background: var(--vscode-editorHoverWidget-background);
            border: 1px solid var(--vscode-editorHoverWidget-border);
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 12px;
        }
        
        .suggestions h4 {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .suggestion-item {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 8px;
            margin: 2px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            display: inline-block;
        }
        
        .suggestion-item:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .code-actions {
            background: var(--vscode-editorWidget-background);
            border-radius: 4px;
            padding: 12px;
            margin-top: 12px;
        }
        
        .code-actions h4 {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .notifications {
            position: fixed;
            top: 8px;
            right: 8px;
            z-index: 1000;
        }
        
        .notification {
            background: var(--vscode-notifications-background);
            border: 1px solid var(--vscode-notifications-border);
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 8px;
            font-size: 12px;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        }
        
        .notification.success {
            border-left: 3px solid var(--vscode-editorInfo-foreground);
        }
        
        .notification.error {
            border-left: 3px solid var(--vscode-editorError-foreground);
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 8px 0;
        }
        
        input[type="checkbox"] {
            margin: 0;
        }
        
        label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h3>🔀 Split View</h3>
        <button id="toggleSplit" class="secondary">Toggle Mode</button>
    </div>
    
    <div id="contextInfo" class="context-info">
        <div id="contextText">No active editor</div>
    </div>
    
    <div class="suggestions">
        <h4>💡 Quick Actions</h4>
        <button class="suggestion-item" data-prompt="Explain this code">Explain Code</button>
        <button class="suggestion-item" data-prompt="Find bugs in this code">Find Bugs</button>
        <button class="suggestion-item" data-prompt="Refactor this code">Refactor</button>
        <button class="suggestion-item" data-prompt="Add comments to this code">Add Comments</button>
        <button class="suggestion-item" data-prompt="Generate tests for this code">Generate Tests</button>
        <button class="suggestion-item" data-prompt="Optimize this code for performance">Optimize</button>
    </div>
    
    <div class="chat-input">
        <textarea id="messageInput" placeholder="Ask about your code or request modifications..."></textarea>
        
        <div class="checkbox-group">
            <input type="checkbox" id="includeCode" checked>
            <label for="includeCode">Include selected/visible code in prompt</label>
        </div>
        
        <div class="button-group">
            <button id="sendMessage">💬 Send</button>
            <button id="refreshContext" class="secondary">🔄 Refresh Context</button>
        </div>
    </div>
    
    <div class="code-actions" id="codeActions" style="display: none;">
        <h4>🛠️ Code Actions</h4>
        <div class="button-group">
            <button id="insertCode" class="secondary">📝 Insert at Cursor</button>
            <button id="replaceCode" class="secondary">🔄 Replace Selection</button>
            <button id="copyCode" class="secondary">📋 Copy Code</button>
        </div>
    </div>
    
    <div class="notifications" id="notifications"></div>
    
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        
        let currentContext = null;
        let lastResponse = null;
        
        // Elements
        const messageInput = document.getElementById('messageInput');
        const includeCodeCheckbox = document.getElementById('includeCode');
        const contextInfo = document.getElementById('contextInfo');
        const contextText = document.getElementById('contextText');
        const codeActions = document.getElementById('codeActions');
        const notifications = document.getElementById('notifications');
        
        // Event listeners
        document.getElementById('sendMessage').addEventListener('click', sendMessage);
        document.getElementById('toggleSplit').addEventListener('click', () => {
            vscode.postMessage({ type: 'split:toggle' });
        });
        document.getElementById('refreshContext').addEventListener('click', () => {
            vscode.postMessage({ type: 'context:update' });
        });
        
        document.getElementById('insertCode').addEventListener('click', () => {
            if (lastResponse) {
                vscode.postMessage({ type: 'code:insert', code: lastResponse });
            }
        });
        
        document.getElementById('replaceCode').addEventListener('click', () => {
            if (lastResponse) {
                vscode.postMessage({ type: 'code:replace', code: lastResponse });
            }
        });
        
        document.getElementById('copyCode').addEventListener('click', () => {
            if (lastResponse) {
                navigator.clipboard.writeText(lastResponse);
                showNotification('Code copied to clipboard', 'success');
            }
        });
        
        // Suggestion buttons
        document.querySelectorAll('.suggestion-item').forEach(button => {
            button.addEventListener('click', () => {
                messageInput.value = button.getAttribute('data-prompt');
                messageInput.focus();
            });
        });
        
        // Keyboard shortcuts
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;
            
            vscode.postMessage({
                type: 'chat:send',
                message: message,
                includeCode: includeCodeCheckbox.checked
            });
            
            messageInput.value = '';
        }
        
        function updateContextDisplay(context) {
            currentContext = context;
            
            if (!context.hasEditor) {
                contextInfo.className = 'context-info no-editor';
                contextText.textContent = '⚠️ No active editor - Open a file to enable context-aware assistance';
                codeActions.style.display = 'none';
                return;
            }
            
            contextInfo.className = 'context-info';
            
            let contextStr = \`📁 \${context.fileName.split('/').pop()} (\${context.language})\`;
            contextStr += \`\\n📍 Line \${context.cursorPosition.line + 1}, Column \${context.cursorPosition.character + 1}\`;
            
            if (context.hasSelection) {
                contextStr += \`\\n✂️ Text selected (\${context.selectedText.length} chars)\`;
            }
            
            contextStr += \`\\n📊 \${context.lineCount} lines total\`;
            
            contextText.textContent = contextStr;
            codeActions.style.display = 'block';
        }
        
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = \`notification \${type}\`;
            notification.textContent = message;
            
            notifications.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
        
        // Message handler
        window.addEventListener('message', event => {
            const { type, data } = event.data;
            
            switch (type) {
                case 'context:updated':
                    updateContextDisplay(data);
                    break;
                    
                case 'response:received':
                    lastResponse = data.code;
                    if (data.code) {
                        codeActions.style.display = 'block';
                    }
                    break;
                    
                case 'notification':
                    showNotification(data.message, data.type);
                    break;
                    
                case 'split:toggled':
                    showNotification(\`Split mode \${data.enabled ? 'enabled' : 'disabled'}\`, 'success');
                    break;
            }
        });
        
        // Initialize
        vscode.postMessage({ type: 'context:update' });
    </script>
</body>
</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
