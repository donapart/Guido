"use strict";
/**
 * Voice Webview Provider - Manages the Speech API interface and UI
 * Handles wake word detection, recording, and visual feedback
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceWebviewProvider = void 0;
const vscode = __importStar(require("vscode"));
class VoiceWebviewProvider {
    static viewType = 'guidoVoiceControl';
    _view;
    _context;
    _config;
    _messageHandlers = [];
    _isInitialized = false;
    constructor(context, config) {
        this._context = context;
        this._config = config;
    }
    async initialize() {
        if (this._isInitialized) {
            return;
        }
        // Register webview provider
        this._context.subscriptions.push(vscode.window.registerWebviewViewProvider(VoiceWebviewProvider.viewType, this, { webviewOptions: { retainContextWhenHidden: true } }));
        this._isInitialized = true;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._context.extensionUri
            ]
        };
        webviewView.webview.html = this.getHtmlContent(webviewView.webview);
        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage((message) => {
            this._messageHandlers.forEach(handler => {
                try {
                    handler(message);
                }
                catch (error) {
                    console.error("Webview message handler error:", error);
                }
            });
        });
        // Send initial configuration
        this.sendMessage({
            command: "configure",
            config: this._config
        });
    }
    async sendMessage(message) {
        if (this._view) {
            await this._view.webview.postMessage(message);
        }
    }
    onMessage(handler) {
        this._messageHandlers.push(handler);
    }
    async destroy() {
        this._messageHandlers = [];
        this._view = undefined;
        this._isInitialized = false;
    }
    getHtmlContent(webview) {
        // Get resource paths
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'src', 'voice', 'webview', 'style.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'src', 'voice', 'webview', 'script.js'));
        const nonce = this.getNonce();
        return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; 
          style-src ${webview.cspSource} 'unsafe-inline'; 
          script-src 'nonce-${nonce}' ${webview.cspSource}; 
          media-src ${webview.cspSource}; 
          img-src ${webview.cspSource} data:;">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>🎤 Guido Voice Control</title>
</head>
<body>
    <div class="voice-control-container">
        <!-- Header -->
        <header class="voice-header">
            <h1 class="voice-title">
                <span class="voice-icon">🎤</span>
                Guido Voice Control
            </h1>
            <div class="voice-status-indicator">
                <div id="statusDot" class="status-dot idle"></div>
                <span id="statusText">Bereit</span>
            </div>
        </header>

        <!-- Main Status Display -->
        <section class="status-section">
            <div id="mainStatus" class="status-card idle">
                <div class="status-content">
                    <div class="status-emoji">🎯</div>
                    <div class="status-message">
                        Sagen Sie "<strong id="wakeWordDisplay">${this._config.wakeWord}</strong>" um zu beginnen
                    </div>
                </div>
                <div class="status-wave-container">
                    <div id="waveform" class="waveform hidden">
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Controls -->
        <section class="controls-section">
            <div class="control-buttons">
                <button id="startBtn" class="control-btn primary" title="Sprachsteuerung starten">
                    <span class="btn-icon">🎤</span>
                    Zuhören
                </button>
                <button id="stopBtn" class="control-btn danger" title="Sprachsteuerung stoppen" disabled>
                    <span class="btn-icon">⏹️</span>
                    Stopp
                </button>
                <button id="muteBtn" class="control-btn secondary" title="Stummschalten">
                    <span class="btn-icon">🔇</span>
                    Stumm
                </button>
                <button id="settingsBtn" class="control-btn secondary" title="Einstellungen">
                    <span class="btn-icon">⚙️</span>
                    Settings
                </button>
            </div>
        </section>

        <!-- Live Transcript -->
        <section class="transcript-section" id="transcriptSection">
            <div class="section-header">
                <h3>📝 Live-Transkript</h3>
                <div class="confidence-indicator">
                    <span>Vertrauen: </span>
                    <span id="confidenceLevel">--</span>
                    <div class="confidence-bar">
                        <div id="confidenceProgress" class="confidence-progress"></div>
                    </div>
                </div>
            </div>
            <div class="transcript-content">
                <div id="liveTranscript" class="transcript-text">
                    <em>Warten auf Eingabe...</em>
                </div>
            </div>
        </section>

        <!-- AI Response -->
        <section class="response-section" id="responseSection">
            <div class="section-header">
                <h3>🤖 Guido's Antwort</h3>
                <div class="response-metadata">
                    <span id="responseModel" class="metadata-item"></span>
                    <span id="responseDuration" class="metadata-item"></span>
                    <span id="responseCost" class="metadata-item"></span>
                </div>
            </div>
            <div class="response-content">
                <div id="aiResponse" class="response-text">
                    <em>Bereit für Ihre Frage...</em>
                </div>
                <div class="response-actions">
                    <button id="repeatBtn" class="action-btn" title="Antwort wiederholen">
                        <span class="btn-icon">🔄</span>
                        Wiederholen
                    </button>
                    <button id="copyBtn" class="action-btn" title="Antwort kopieren">
                        <span class="btn-icon">📋</span>
                        Kopieren
                    </button>
                    <button id="insertBtn" class="action-btn" title="In Editor einfügen">
                        <span class="btn-icon">📄</span>
                        Einfügen
                    </button>
                </div>
            </div>
        </section>

        <!-- Language & Voice Settings -->
        <section class="settings-section collapsed" id="settingsSection">
            <div class="section-header">
                <h3>🌐 Sprache & Stimme</h3>
            </div>
            <div class="settings-content">
                <div class="setting-group">
                    <label for="languageSelect">Sprachererkennung:</label>
                    <select id="languageSelect" class="setting-input">
                        <option value="de-DE">Deutsch</option>
                        <option value="en-US">English (US)</option>
                        <option value="fr-FR">Français</option>
                        <option value="es-ES">Español</option>
                        <option value="it-IT">Italiano</option>
                    </select>
                </div>

                <div class="setting-group">
                    <label for="voiceSelect">TTS-Stimme:</label>
                    <select id="voiceSelect" class="setting-input">
                        <option value="auto">Automatisch</option>
                        <!-- Will be populated by JavaScript -->
                    </select>
                </div>

                <div class="setting-group">
                    <label for="speedSlider">Sprechgeschwindigkeit:</label>
                    <div class="slider-container">
                        <input type="range" id="speedSlider" class="setting-slider" 
                               min="0.5" max="2.0" step="0.1" value="${this._config.audio.speed}">
                        <span id="speedValue" class="slider-value">${this._config.audio.speed}x</span>
                    </div>
                </div>

                <div class="setting-group">
                    <label for="volumeSlider">Lautstärke:</label>
                    <div class="slider-container">
                        <input type="range" id="volumeSlider" class="setting-slider" 
                               min="0" max="1" step="0.1" value="${this._config.audio.volume}">
                        <span id="volumeValue" class="slider-value">${Math.round(this._config.audio.volume * 100)}%</span>
                    </div>
                </div>

                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="beepToggle" 
                               ${this._config.audio.enableBeep ? 'checked' : ''}>
                        Bestätigungston aktivieren
                    </label>
                </div>

                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="ttsToggle" 
                               ${this._config.audio.ttsEnabled ? 'checked' : ''}>
                        Text-to-Speech aktivieren
                    </label>
                </div>
            </div>
        </section>

        <!-- Statistics -->
        <section class="stats-section collapsed" id="statsSection">
            <div class="section-header">
                <h3>📊 Statistiken</h3>
            </div>
            <div class="stats-content">
                <div class="stat-grid">
                    <div class="stat-item">
                        <div class="stat-value" id="totalSessions">0</div>
                        <div class="stat-label">Sessions</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="totalDuration">0m</div>
                        <div class="stat-label">Gesamtzeit</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="avgAccuracy">--</div>
                        <div class="stat-label">Genauigkeit</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="commandCount">0</div>
                        <div class="stat-label">Befehle</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Debug Panel (only in debug mode) -->
        <section class="debug-section collapsed" id="debugSection" style="display: none;">
            <div class="section-header">
                <h3>🐛 Debug</h3>
            </div>
            <div class="debug-content">
                <div class="debug-log" id="debugLog">
                    <em>Debug-Modus aktiviert...</em>
                </div>
                <div class="debug-controls">
                    <button id="clearLogBtn" class="action-btn">Log löschen</button>
                    <button id="exportLogBtn" class="action-btn">Exportieren</button>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="voice-footer">
            <div class="footer-info">
                <span class="privacy-indicator" title="Datenschutz-Status">
                    ${this._config.permissions.privacy.gdprCompliant ? '🔒 DSGVO-konform' : '⚠️ Datenschutz prüfen'}
                </span>
                <span class="connection-status" id="connectionStatus">
                    🟢 Verbunden
                </span>
            </div>
        </footer>
    </div>

    <!-- Confirmation Modal -->
    <div id="confirmationModal" class="modal hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3>🤔 Bestätigung erforderlich</h3>
            </div>
            <div class="modal-body">
                <p id="confirmationText">Soll ich das wirklich ausführen?</p>
                <div class="original-request">
                    <strong>Ursprüngliche Anfrage:</strong>
                    <p id="originalText"></p>
                </div>
            </div>
            <div class="modal-actions">
                <button id="confirmYes" class="control-btn primary">
                    ✅ Ja, ausführen
                </button>
                <button id="confirmNo" class="control-btn danger">
                    ❌ Nein, abbrechen
                </button>
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="loading-overlay hidden">
        <div class="loading-spinner">
            <div class="spinner"></div>
            <div class="loading-text" id="loadingText">Verarbeitung läuft...</div>
        </div>
    </div>

    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
exports.VoiceWebviewProvider = VoiceWebviewProvider;
//# sourceMappingURL=voiceWebviewProvider.js.map