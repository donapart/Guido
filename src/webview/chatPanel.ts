import * as vscode from 'vscode';
import { SessionManager, ChatSession, ChatMessage } from './sessionManager';
import { HistoryNavigator } from './historyNavigator';

interface OutboundMessage { type: string; data?: any } // eslint-disable-line @typescript-eslint/no-explicit-any
interface InboundMessage {
  type: string;
  text?: string;
  modelOverride?: string;
  attachmentUris?: string[];
  name?: string;
  sessionId?: string;
  newName?: string;
  query?: string;
}

export class ChatPanel {
  public static current: ChatPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private sessionManager: SessionManager;
  private historyNavigator: HistoryNavigator;
  private currentSessionId: string | null = null;
  static readonly viewType = 'modelRouter.chatPanel';

  static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor?.viewColumn;
    if (ChatPanel.current) { ChatPanel.current.panel.reveal(column); return; }
    const panel = vscode.window.createWebviewPanel(ChatPanel.viewType,'Model Router Chat',column ?? vscode.ViewColumn.One,{ enableScripts: true, retainContextWhenHidden: true });
    ChatPanel.current = new ChatPanel(panel, extensionUri);
  }
  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.sessionManager = SessionManager.getInstance();
    this.historyNavigator = new HistoryNavigator();
    this.panel.iconPath = vscode.Uri.joinPath(extensionUri,'assets','icon.png');
    this.panel.webview.html = this.renderHtml();
    this.panel.onDidDispose(()=> this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(this.handleMessage, this, this.disposables);
    
    // Initialize with active session or create new one
    const activeSession = this.sessionManager.getActiveSession();
    if (activeSession) {
      this.currentSessionId = activeSession.id;
      this.loadSessionHistory(activeSession);
    } else {
      const newSession = this.sessionManager.createSession();
      this.currentSessionId = newSession.id;
    }
  }
  private post(msg: OutboundMessage){ this.panel.webview.postMessage(msg); }
  streamDelta(t: string){ this.post({ type:'delta', data:t }); }
  streamDone(meta?: any){ this.post({ type:'done', data: meta }); } // eslint-disable-line @typescript-eslint/no-explicit-any
  showError(m: string){ this.post({ type:'error', data: m }); }
  focusInput(){ this.post({ type:'focus'}); }
  sendInfo(message: string){ this.post({ type:'info', data: message }); }
  sendHistory(history: { role:'user'|'assistant'; content:string; meta?:any }[]){ this.post({ type:'history', data: history }); } // eslint-disable-line @typescript-eslint/no-explicit-any
  addUserMessage(text: string){ this.post({ type:'injectUser', data:text }); }
  sendModels(models:string[]){ this.post({ type:'models', data: models }); }
  sendVoiceState(state:string){ this.post({ type:'voiceState', data: state }); }
  private handleMessage(msg: InboundMessage){
    switch(msg.type){
      case 'chat:send': 
        this.addMessageToSession(msg.text || '', 'user');
        vscode.commands.executeCommand('modelRouter.chat.sendFromWebview', msg.text, msg.modelOverride, msg.attachmentUris); 
        break;
      case 'chat:tools': vscode.commands.executeCommand('modelRouter.chat.tools'); break;
      case 'chat:plan': vscode.commands.executeCommand('modelRouter.chat.planCurrent'); break;
      case 'chat:settings': vscode.commands.executeCommand('workbench.action.openSettings','modelRouter'); break;
      case 'chat:mic': vscode.commands.executeCommand('modelRouter.startVoiceControl'); break;
      case 'chat:ttsToggle': this.post({ type:'info', data:'TTS toggle (nicht implementiert)' }); break;
      case 'chat:attach': vscode.window.showOpenDialog({ canSelectMany:true }).then(files=>{ if(!files) return; this.post({ type:'attachments', data: files.map(f=>f.fsPath)}); }); break;
      case 'chat:minimize': this.panel.dispose(); break;
      case 'session:create': 
        if (msg.name !== undefined) this.createNewSession(msg.name); 
        break;
      case 'session:switch': 
        if (msg.sessionId) this.switchSession(msg.sessionId); 
        break;
      case 'session:delete': 
        if (msg.sessionId) this.deleteSession(msg.sessionId); 
        break;
      case 'session:rename': 
        if (msg.sessionId && msg.newName) this.renameSession(msg.sessionId, msg.newName); 
        break;
      case 'history:search': 
        if (msg.query !== undefined) this.searchHistory(msg.query); 
        break;
    }
  }

  private addMessageToSession(content: string, role: 'user' | 'assistant', meta?: any) {
    if (this.currentSessionId) {
      const message: ChatMessage = {
        role,
        content,
        timestamp: new Date(),
        meta
      };
      this.sessionManager.addMessage(this.currentSessionId, message);
    }
  }

  private loadSessionHistory(session: ChatSession) {
    const history = session.history.map(msg => ({
      role: msg.role,
      content: msg.content,
      meta: msg.meta
    }));
    this.post({ type: 'history', data: history });
  }

  private createNewSession(name?: string) {
    const session = this.sessionManager.createSession(name);
    this.currentSessionId = session.id;
    this.post({ type: 'session:created', data: session });
    this.sendSessionsList();
  }

  private switchSession(sessionId: string) {
    if (this.sessionManager.setActiveSession(sessionId)) {
      this.currentSessionId = sessionId;
      const session = this.sessionManager.getSession(sessionId);
      if (session) {
        this.loadSessionHistory(session);
        this.post({ type: 'session:switched', data: session });
      }
    }
  }

  private deleteSession(sessionId: string) {
    if (this.sessionManager.deleteSession(sessionId)) {
      if (this.currentSessionId === sessionId) {
        const activeSession = this.sessionManager.getActiveSession();
        if (activeSession) {
          this.currentSessionId = activeSession.id;
          this.loadSessionHistory(activeSession);
        } else {
          const newSession = this.sessionManager.createSession();
          this.currentSessionId = newSession.id;
        }
      }
      this.sendSessionsList();
      this.post({ type: 'session:deleted', data: { sessionId } });
    }
  }

  private renameSession(sessionId: string, newName: string) {
    if (this.sessionManager.renameSession(sessionId, newName)) {
      this.sendSessionsList();
      this.post({ type: 'session:renamed', data: { sessionId, newName } });
    }
  }

  private searchHistory(query: string) {
    const results = this.historyNavigator.search(query);
    this.post({ type: 'history:results', data: results });
  }

  private sendSessionsList() {
    const sessions = this.sessionManager.getAllSessions();
    this.post({ type: 'sessions:list', data: sessions });
  }
  dispose(){ while(this.disposables.length){ try{ this.disposables.pop()?.dispose(); }catch{/*ignore*/} } if(ChatPanel.current===this) ChatPanel.current=undefined; }
  private renderHtml(): string {
    const csp = [
      "default-src 'none'",
      "img-src data: https:",
      "style-src 'unsafe-inline'",
      "script-src 'unsafe-inline' https://cdn.jsdelivr.net",
      "connect-src https:"
    ].join('; ');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta http-equiv="Content-Security-Policy" content="${csp}"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <script src="https://cdn.jsdelivr.net/npm/marked@9.1.2/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.css" rel="stylesheet">
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 0;
            margin: 0;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 10px;
            background: var(--vscode-titleBar-activeBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 10px;
            cursor: pointer;
            border-radius: 4px;
            font-size: 12px;
            transition: background 0.2s;
        }
        
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        #messages {
            padding: 12px;
            height: calc(100vh - 180px);
            overflow-y: auto;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .msg {
            margin: 12px 0;
            padding: 12px 16px;
            border-radius: 8px;
            position: relative;
        }
        
        .msg.user {
            background: var(--vscode-editorHoverWidget-background);
            border-left: 4px solid var(--vscode-button-background);
        }
        
        .msg.assistant {
            background: var(--vscode-editorWidget-background);
            border-left: 4px solid var(--vscode-focusBorder);
        }
        
        .msg pre {
            background: var(--vscode-textBlockQuote-background);
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 8px 0;
            border-left: 3px solid var(--vscode-focusBorder);
        }
        
        .msg code:not(pre code) {
            background: var(--vscode-textBlockQuote-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
        }
        
        .msg h1, .msg h2, .msg h3, .msg h4, .msg h5, .msg h6 {
            margin-top: 0;
            margin-bottom: 8px;
            color: var(--vscode-symbolIcon-colorForeground);
        }
        
        .msg ul, .msg ol {
            margin: 8px 0;
            padding-left: 20px;
        }
        
        .msg li {
            margin: 4px 0;
        }
        
        .msg blockquote {
            margin: 8px 0;
            padding: 8px 12px;
            border-left: 4px solid var(--vscode-focusBorder);
            background: var(--vscode-textBlockQuote-background);
            font-style: italic;
        }
        
        .msg table {
            border-collapse: collapse;
            width: 100%;
            margin: 8px 0;
        }
        
        .msg th, .msg td {
            border: 1px solid var(--vscode-panel-border);
            padding: 8px 12px;
            text-align: left;
        }
        
        .msg th {
            background: var(--vscode-editorHoverWidget-background);
            font-weight: bold;
        }
        
        #inputBar {
            display: flex;
            gap: 8px;
            padding: 12px;
            border-top: 1px solid var(--vscode-panel-border);
            background: var(--vscode-editor-background);
        }
        
        #prompt {
            flex: 1;
            resize: vertical;
            min-height: 40px;
            font-family: inherit;
            font-size: 14px;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }
        
        #prompt:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        #toolbar {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }
        
        #attachments {
            font-size: 11px;
            opacity: 0.8;
            padding: 4px 12px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 4px;
            margin: 0 12px;
        }
        
        #modelSelect {
            max-width: 180px;
            padding: 4px 8px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }
        
        footer {
            font-size: 11px;
            opacity: 0.7;
            padding: 6px 12px;
            border-top: 1px solid var(--vscode-panel-border);
            background: var(--vscode-statusBar-background);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .info {
            font-style: italic;
            opacity: 0.8;
            padding: 8px 12px;
            background: var(--vscode-editorInfo-background);
            border-left: 4px solid var(--vscode-editorInfo-foreground);
            border-radius: 4px;
            margin: 8px 0;
        }
        
        #voiceIndicator {
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 12px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            transition: all 0.3s;
        }
        
        .state-recording {
            background: #b30000 !important;
            color: #fff;
            animation: pulse 1s infinite;
        }
        
        .state-processing {
            background: #8a6d00 !important;
            animation: spin 2s linear infinite;
        }
        
        .state-listening {
            background: #005a8a !important;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .copy-button {
            position: absolute;
            top: 8px;
            right: 8px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .msg:hover .copy-button {
            opacity: 1;
        }
    </style>
</head>
<body>
    <header>
        <div id="toolbar">
            <select id="modelSelect" title="Modell Override">
                <option value="">🤖 auto</option>
            </select>
            <button id="btnTools" title="Tools">🛠️ Tools</button>
            <button id="btnMic" title="Mikrofon">🎤 Mic</button>
            <button id="btnSpeaker" title="Sprachausgabe">🔊 TTS</button>
            <button id="btnAttach" title="Anhänge">📎 Attach</button>
            <button id="btnPlan" title="Plan / Agent">🚀 Plan</button>
            <button id="btnSettings" title="Settings">⚙️ Settings</button>
            <button id="btnMin" title="Minimieren">➖ Min</button>
        </div>
        <span id="voiceIndicator" class="state-idle">💤 idle</span>
    </header>
    
    <main id="messages"></main>
    <div id="attachments"></div>
    
    <div id="inputBar">
        <textarea id="prompt" placeholder="Nachricht eingeben... (Strg+Enter zum Senden)"></textarea>
        <button id="send">📤 Senden</button>
    </div>
    
    <footer id="footer">
        <span id="tokenInfo"></span>
        <span id="costInfo"></span>
    </footer>
    
    <script>
        const vscode = acquireVsCodeApi();
        const messagesEl = document.getElementById('messages');
        const promptEl = document.getElementById('prompt');
        const attachmentsEl = document.getElementById('attachments');
        const modelSelect = document.getElementById('modelSelect');
        const tokenInfo = document.getElementById('tokenInfo');
        const costInfo = document.getElementById('costInfo');
        const voiceIndicator = document.getElementById('voiceIndicator');
        
        let currentAssistantBlock;
        let attachments = [];
        
        // Configure marked for better rendering
        marked.setOptions({
            highlight: function(code, lang) {
                if (Prism.languages[lang]) {
                    return Prism.highlight(code, Prism.languages[lang], lang);
                }
                return code;
            },
            breaks: true,
            gfm: true
        });
        
        function addUser(text) {
            const div = document.createElement('div');
            div.className = 'msg user';
            div.innerHTML = marked.parse(text);
            addCopyButton(div);
            messagesEl.appendChild(div);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }
        
        function ensureAssistant() {
            if (!currentAssistantBlock) {
                currentAssistantBlock = document.createElement('div');
                currentAssistantBlock.className = 'msg assistant';
                currentAssistantBlock.innerHTML = '';
                messagesEl.appendChild(currentAssistantBlock);
            }
        }
        
        function appendAssistant(text) {
            ensureAssistant();
            const currentContent = currentAssistantBlock.getAttribute('data-content') || '';
            const newContent = currentContent + text;
            currentAssistantBlock.setAttribute('data-content', newContent);
            currentAssistantBlock.innerHTML = marked.parse(newContent);
            addCopyButton(currentAssistantBlock);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }
        
        function doneAssistant() {
            if (currentAssistantBlock) {
                // Final syntax highlighting pass
                Prism.highlightAllUnder(currentAssistantBlock);
            }
            currentAssistantBlock = null;
        }
        
        function addCopyButton(msgElement) {
            // Remove existing copy button
            const existing = msgElement.querySelector('.copy-button');
            if (existing) existing.remove();
            
            const button = document.createElement('button');
            button.className = 'copy-button';
            button.textContent = '📋 Copy';
            button.onclick = () => {
                const content = msgElement.getAttribute('data-content') || msgElement.textContent;
                navigator.clipboard.writeText(content).then(() => {
                    button.textContent = '✅ Copied';
                    setTimeout(() => button.textContent = '📋 Copy', 2000);
                });
            };
            msgElement.style.position = 'relative';
            msgElement.appendChild(button);
        }
        
        function sendMessage() {
            const text = promptEl.value.trim();
            if (!text) return;
            
            addUser(text);
            vscode.postMessage({
                type: 'chat:send',
                text,
                modelOverride: modelSelect.value || undefined,
                attachmentUris: attachments
            });
            promptEl.value = '';
            attachments = [];
            attachmentsEl.textContent = '';
        }
        
        // Event Listeners
        document.getElementById('send').addEventListener('click', sendMessage);
        
        promptEl.addEventListener('keydown', e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        document.getElementById('btnTools').addEventListener('click', () => 
            vscode.postMessage({type: 'chat:tools'}));
        document.getElementById('btnPlan').addEventListener('click', () => 
            vscode.postMessage({type: 'chat:plan'}));
        document.getElementById('btnSettings').addEventListener('click', () => 
            vscode.postMessage({type: 'chat:settings'}));
        document.getElementById('btnMic').addEventListener('click', () => 
            vscode.postMessage({type: 'chat:mic'}));
        document.getElementById('btnSpeaker').addEventListener('click', () => 
            vscode.postMessage({type: 'chat:ttsToggle'}));
        document.getElementById('btnAttach').addEventListener('click', () => 
            vscode.postMessage({type: 'chat:attach'}));
        document.getElementById('btnMin').addEventListener('click', () => 
            vscode.postMessage({type: 'chat:minimize'}));
        
        function updateVoiceState(state) {
            const stateEmojis = {
                'idle': '💤 idle',
                'listening': '👂 listening',
                'recording': '🎤 recording',
                'processing': '🤔 processing'
            };
            
            voiceIndicator.textContent = stateEmojis[state] || state;
            voiceIndicator.className = 'state-' + state;
        }
        
        // Message Handler
        window.addEventListener('message', event => {
            const msg = event.data;
            
            switch (msg.type) {
                case 'delta':
                    appendAssistant(msg.data);
                    break;
                    
                case 'done':
                    if (msg.data?.usage) {
                        tokenInfo.textContent = \`Tokens: \${msg.data.usage.inputTokens || 0}/\${msg.data.usage.outputTokens || 0}\`;
                        if (msg.data.cost) {
                            costInfo.textContent = \`Cost: $\${msg.data.cost.totalCost.toFixed(4)}\`;
                        }
                    }
                    doneAssistant();
                    break;
                    
                case 'error':
                    ensureAssistant();
                    appendAssistant(\`\\n**❌ Fehler:** \${msg.data}\\n\`);
                    doneAssistant();
                    break;
                    
                case 'attachments':
                    attachments = msg.data;
                    attachmentsEl.textContent = \`📎 Anhänge: \${msg.data.length} Datei(en)\`;
                    break;
                    
                case 'focus':
                    promptEl.focus();
                    break;
                    
                case 'info':
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'info';
                    infoDiv.innerHTML = marked.parse(\`ℹ️ \${msg.data}\`);
                    messagesEl.appendChild(infoDiv);
                    messagesEl.scrollTop = messagesEl.scrollHeight;
                    break;
                    
                case 'injectUser':
                    addUser(msg.data);
                    break;
                    
                case 'history':
                    msg.data.forEach(m => {
                        if (m.role === 'user') {
                            addUser(m.content);
                        } else {
                            ensureAssistant();
                            appendAssistant(m.content);
                            doneAssistant();
                        }
                    });
                    break;
                    
                case 'models':
                    while (modelSelect.options.length > 1) {
                        modelSelect.remove(1);
                    }
                    msg.data.forEach(id => {
                        const option = document.createElement('option');
                        option.value = id;
                        option.textContent = id;
                        modelSelect.appendChild(option);
                    });
                    break;
                    
                case 'voiceState':
                    updateVoiceState(msg.data);
                    break;
            }
        });
        
        // Initialize
        promptEl.focus();
    </script>
</body>
</html>`;
  }
}
