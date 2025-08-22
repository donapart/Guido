import * as vscode from 'vscode';

interface OutboundMessage { type: string; data?: any } // eslint-disable-line @typescript-eslint/no-explicit-any
interface InboundMessage { type: string; text?: string; attachmentUris?: string[]; modelOverride?: string; }

/**
 * Docked Chat View (WebviewViewProvider) – synchronisiert weitgehend mit Panel-Version.
 * Hinweis: Aktuell einfache Duplikation der HTML-Struktur aus chatPanel.ts. Später ggf. refaktorieren.
 */
export class ChatDockViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'modelRouterChatDock';
  public static current: ChatDockViewProvider | undefined;
  private view: vscode.WebviewView | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;
    ChatDockViewProvider.current = this;
  webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.renderHtml();
    webviewView.onDidDispose(() => this.dispose());
    webviewView.webview.onDidReceiveMessage(this.handleMessage, this, this.disposables);
  }

  private post(msg: OutboundMessage) { this.view?.webview.postMessage(msg); }
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
      case 'chat:send': vscode.commands.executeCommand('modelRouter.chat.sendFromWebview', msg.text, msg.modelOverride, msg.attachmentUris); break;
      case 'chat:tools': vscode.commands.executeCommand('modelRouter.chat.tools'); break;
      case 'chat:plan': vscode.commands.executeCommand('modelRouter.chat.planCurrent'); break;
      case 'chat:settings': vscode.commands.executeCommand('workbench.action.openSettings','modelRouter'); break;
      case 'chat:mic': vscode.commands.executeCommand('modelRouter.startVoiceControl'); break;
      case 'chat:ttsToggle': this.post({ type:'info', data:'TTS toggle (nicht implementiert)' }); break;
      case 'chat:attach': vscode.window.showOpenDialog({ canSelectMany:true }).then(files=>{ if(!files) return; this.post({ type:'attachments', data: files.map(f=>f.fsPath)}); }); break;
      case 'chat:minimize': /* Dock-View kann nicht geschlossen werden wie Panel – Info zeigen */ this.post({ type:'info', data:'Zum Ausblenden: Rechtsklick auf Titel -> Hide' }); break;
    }
  }

  dispose(){
    while(this.disposables.length){ try{ this.disposables.pop()?.dispose(); }catch{/*ignore*/} }
    if (ChatDockViewProvider.current === this) ChatDockViewProvider.current = undefined;
  }

  private renderHtml(): string {
    const csp = ["default-src 'none'","img-src data:","style-src 'unsafe-inline'","script-src 'unsafe-inline'"].join('; ');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta http-equiv="Content-Security-Policy" content="${csp}"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>
    body{font-family:var(--vscode-font-family);padding:0;margin:0;background:var(--vscode-sideBar-background);color:var(--vscode-sideBar-foreground);}
    header{display:flex;justify-content:space-between;align-items:center;padding:4px 6px;background:var(--vscode-titleBar-activeBackground);}
    button{background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;padding:3px 6px;cursor:pointer;border-radius:4px;font-size:11px;}button:hover{background:var(--vscode-button-hoverBackground);} 
    #messages{padding:6px;height:calc(100vh - 140px);overflow:auto;font-size:12px;line-height:1.35;} .msg.user{background:var(--vscode-editorHoverWidget-background);padding:4px 6px;border-radius:6px;margin:3px 0;} .msg.assistant{background:var(--vscode-editorWidget-background);padding:4px 6px;border-radius:6px;margin:3px 0;}#inputBar{display:flex;gap:4px;padding:6px;border-top:1px solid var(--vscode-panel-border);}#prompt{flex:1;resize:vertical;min-height:38px;font-family:inherit;font-size:12px;}#toolbar{display:flex;gap:3px;flex-wrap:wrap;}#attachments{font-size:10px;opacity:.8;padding:0 6px;}#modelSelect{max-width:150px;}footer{font-size:10px;opacity:.7;padding:4px 6px;border-top:1px solid var(--vscode-panel-border);} .info{font-style:italic;opacity:.75;}#voiceIndicator{font-size:10px;opacity:.8;margin-left:auto;padding:2px 4px;border-radius:4px;background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);} .state-recording{background:#b30000 !important;color:#fff;} .state-processing{background:#8a6d00 !important;} .state-listening{background:#005a8a !important;}
    </style></head><body>
    <header><div id="toolbar"><select id="modelSelect" title="Modell Override"><option value="">auto</option></select><button id="btnTools" title="Tools">$(tools)</button><button id="btnMic" title="Mikrofon">$(mic)</button><button id="btnSpeaker" title="Sprachausgabe">$(unmute)</button><button id="btnAttach" title="Anhänge">$(mail)</button><button id="btnPlan" title="Plan / Agent">$(rocket)</button><button id="btnSettings" title="Settings">$(gear)</button></div><span id="voiceIndicator" class="state-idle">idle</span></header>
    <main id="messages"></main><div id="attachments"></div><div id="inputBar"><textarea id="prompt" placeholder="Nachricht eingeben..."></textarea><button id="send">Senden $(send)</button></div><footer id="footer"></footer>
    <script>const vscode=acquireVsCodeApi();const messagesEl=document.getElementById('messages');const promptEl=document.getElementById('prompt');const attachmentsEl=document.getElementById('attachments');const modelSelect=document.getElementById('modelSelect');const footerEl=document.getElementById('footer');const voiceIndicator=document.getElementById('voiceIndicator');let currentAssistantBlock;let attachments=[];function addUser(t){const d=document.createElement('div');d.className='msg user';d.textContent=t;messagesEl.appendChild(d);messagesEl.scrollTop=messagesEl.scrollHeight;}function ensureAssistant(){if(!currentAssistantBlock){currentAssistantBlock=document.createElement('div');currentAssistantBlock.className='msg assistant';messagesEl.appendChild(currentAssistantBlock);}}function appendAssistant(t){ensureAssistant();currentAssistantBlock.textContent+=t;messagesEl.scrollTop=messagesEl.scrollHeight;}function doneAssistant(){currentAssistantBlock=null;}document.getElementById('send').addEventListener('click',()=>{const text=promptEl.value.trim();if(!text)return;addUser(text);vscode.postMessage({type:'chat:send',text,modelOverride:modelSelect.value||undefined,attachmentUris:attachments});promptEl.value='';});document.getElementById('btnTools').addEventListener('click',()=>vscode.postMessage({type:'chat:tools'}));document.getElementById('btnPlan').addEventListener('click',()=>vscode.postMessage({type:'chat:plan'}));document.getElementById('btnSettings').addEventListener('click',()=>vscode.postMessage({type:'chat:settings'}));document.getElementById('btnMic').addEventListener('click',()=>vscode.postMessage({type:'chat:mic'}));document.getElementById('btnSpeaker').addEventListener('click',()=>vscode.postMessage({type:'chat:ttsToggle'}));promptEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();document.getElementById('send').click();}});document.getElementById('btnAttach').addEventListener('click',()=>vscode.postMessage({type:'chat:attach'}));function updateVoiceState(st){voiceIndicator.textContent=st;voiceIndicator.className='';const cls='state-'+st;voiceIndicator.classList.add(cls);}window.addEventListener('message',ev=>{const msg=ev.data;switch(msg.type){case'delta':appendAssistant(msg.data);break;case'done':if(msg.data&&msg.data.usage){footerEl.textContent='Tokens: '+(msg.data.usage.inputTokens||0)+'/'+(msg.data.usage.outputTokens||0)+(msg.data.cost?'  Cost: $'+msg.data.cost.totalCost.toFixed(4):'');}doneAssistant();break;case'error':ensureAssistant();appendAssistant('\n[Fehler] '+msg.data+'\n');doneAssistant();break;case'attachments':attachments=msg.data;attachmentsEl.textContent='Anhänge: '+msg.data.join(', ');break;case'focus':promptEl.focus();break;case'info':{const div=document.createElement('div');div.className='info';div.textContent=msg.data;messagesEl.appendChild(div);messagesEl.scrollTop=messagesEl.scrollHeight;}break;case'injectUser':addUser(msg.data);break;case'history':msg.data.forEach(m=>{if(m.role==='user')addUser(m.content);else{ensureAssistant();appendAssistant(m.content);doneAssistant();}});break;case'models':{while(modelSelect.options.length>1)modelSelect.remove(1);msg.data.forEach(id=>{const o=document.createElement('option');o.value=id;o.textContent=id;modelSelect.appendChild(o);});}break;case'voiceState':updateVoiceState(msg.data);break;}});
    </script></body></html>`;
  }
}
