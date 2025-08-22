/**
 * Advanced Voice Controller for Guido Model Router
 * Handles wake word detection, speech recognition, TTS, and voice commands
 */

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ModelRouter } from "../router";
import { AudioManager } from "./audioManager";
import { VoiceCommandProcessor } from "./voiceCommandProcessor";
import { PermissionManager } from "./permissionManager";

export interface VoiceConfig {
  enabled: boolean;
  wakeWord: string;
  alternativeWakeWords: string[];
  language: string;
  responseLanguage: string;
  
  audio: {
    enableBeep: boolean;
    beepType: string;
    beepVolume: number;
    customBeepPath: string;
    ttsEnabled: boolean;
    ttsEngine: string;
    ttsVoice: string;
    ttsSpeed: number;
    ttsVolume: number;
    ttsPitch: number;
    ttsEmphasis: string;
    noiseReduction: boolean;
    echoCancellation: boolean;
    autoGainControl: boolean;
    spatialAudio: boolean;
  };
  
  voices: Record<string, Array<{
    name: string;
    gender: string;
    age: string;
    style: string;
    quality: string;
  }>>;
  
  recording: {
    timeoutSeconds: number;
    stopWords: string[];
    minRecordingSeconds: number;
    maxRecordingSeconds: number;
    autoStopOnSilence: boolean;
    silenceTimeoutMs: number;
    backgroundListening: boolean;
    wakeWordSensitivity: number;
    smartNoiseSuppression: boolean;
    speakerAdaptation: boolean;
    multiSpeakerMode: boolean;
    recordingQuality: string;
  };
  
  confirmation: {
    required: boolean;
    summaryEnabled: boolean;
    summaryStyle: string;
    confirmWords: string[];
    cancelWords: string[];
    retryWords: string[];
    skipConfirmationFor: string[];
    autoConfirmAfterSeconds: number;
    visualConfirmation: boolean;
  };
  
  commands: {
    system: Array<{ trigger: string[]; action: string; params?: string[]; step?: number; }>;
    voice: Array<{ trigger: string[]; action: string; step?: number; }>;
    content: Array<{ trigger: string[]; action: string; context?: string; }>;
    navigation: Array<{ trigger: string[]; action: string; }>;
  };
  
  routing: {
    preferFast: boolean;
    maxResponseLength: number;
    skipCodeInTTS: boolean;
    summarizeIfLong: boolean;
    useSimpleLanguage: boolean;
    contextAware: boolean;
    fileTypeOptimization: boolean;
    prioritizeLocalForPrivacy: boolean;
  };
  
  permissions: {
    allowSystemCommands: boolean;
    allowFileOperations: boolean;
    allowTerminalAccess: boolean;
    allowNetworkRequests: boolean;
    allowExtensionControl: boolean;
    securityLevel: string;
    requireConfirmationFor: string[];
    auditLog: boolean;
    auditLogPath: string;
    maxAuditEntries: number;
  };
  
  advanced: {
    personality: string;
    emotionalResponses: boolean;
    userAdaptation: boolean;
    learningMode: boolean;
    contextMemory: boolean;
    conversationHistory: number;
    predictiveText: boolean;
    autoCorrection: boolean;
    gestureControl: boolean;
    eyeTracking: boolean;
    biometricAuth: boolean;
    ambientNoise: string;
    adaptToTimeOfDay: boolean;
    energySaving: boolean;
    calendarIntegration: boolean;
    emailIntegration: boolean;
    slackIntegration: boolean;
    teamsIntegration: boolean;
  };
  
  debug: {
    verboseLogging: boolean;
    showRecognitionConfidence: boolean;
    audioVisualization: boolean;
    latencyMeasurement: boolean;
    performanceMetrics: boolean;
  };
}

export interface VoiceSession {
  id: string;
  startTime: Date;
  isActive: boolean;
  transcript: string;
  confidence: number;
  language: string;
  speakerId?: string;
  context?: any;
}

export class VoiceController {
  private isListening = false;
  private isRecording = false;
  private webviewPanel?: vscode.WebviewPanel;
  private audioManager: AudioManager;
  private commandProcessor: VoiceCommandProcessor;
  private permissionManager: PermissionManager;
  private currentSession?: VoiceSession;
  private conversationHistory: string[] = [];
  private wakeWordBuffer: string[] = [];
  private auditLog: Array<{ timestamp: Date; action: string; details: any }> = [];

  constructor(
    private context: vscode.ExtensionContext,
    private config: VoiceConfig,
    private router: ModelRouter
  ) {
    this.audioManager = new AudioManager(config.audio);
    this.commandProcessor = new VoiceCommandProcessor(config, router);
    this.permissionManager = new PermissionManager(config.permissions);
    
    this.loadAuditLog();
    this.setupEventListeners();
  }

  async startVoiceControl(): Promise<void> {
    if (!this.config.enabled) {
      vscode.window.showWarningMessage("Sprachsteuerung ist deaktiviert");
      return;
    }

    this.log("Voice control started");

    // Erstelle Voice Control Webview
    this.webviewPanel = vscode.window.createWebviewPanel(
      'guidoVoice',
      '🎤 Guido Advanced Voice Control',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.context.extensionPath, 'assets'))
        ]
      }
    );

    this.webviewPanel.webview.html = this.getAdvancedWebviewContent();
    this.setupWebviewMessageHandling();
    
    // Starte erweiterte Wake Word Detection
    await this.startAdvancedWakeWordDetection();
    
    // Initiale TTS Begrüßung
    if (this.config.audio.ttsEnabled) {
      await this.speak(this.getGreeting());
    }
  }

  async stopVoiceControl(): Promise<void> {
    this.isListening = false;
    this.isRecording = false;
    
    if (this.currentSession?.isActive) {
      this.currentSession.isActive = false;
    }

    this.log("Voice control stopped");
    
    if (this.webviewPanel) {
      this.webviewPanel.dispose();
    }

    if (this.config.audio.ttsEnabled) {
      await this.speak("Auf Wiedersehen!");
    }
  }

  private async startAdvancedWakeWordDetection(): Promise<void> {
    this.isListening = true;
    this.updateStatus("listening", `Höre auf "${this.config.wakeWord}" und Alternativen...`);
    
    // Send initialization to webview
    this.sendToWebview({
      command: 'initializeVoice',
      config: {
        wakeWords: [this.config.wakeWord, ...this.config.alternativeWakeWords],
        language: this.config.language,
        sensitivity: this.config.recording.wakeWordSensitivity,
        backgroundListening: this.config.recording.backgroundListening,
        noiseReduction: this.config.recording.smartNoiseSuppression,
        debug: this.config.debug
      }
    });
  }

  private getAdvancedWebviewContent(): string {
    const assetPath = vscode.Uri.file(path.join(this.context.extensionPath, 'assets'));
    const assetUri = this.webviewPanel!.webview.asWebviewUri(assetPath);

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Guido Advanced Voice Control</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%);
          color: #d4d4d4;
          padding: 20px;
          min-height: 100vh;
          overflow-x: hidden;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          background: rgba(0, 120, 212, 0.1);
          padding: 20px;
          border-radius: 15px;
          border: 1px solid rgba(0, 120, 212, 0.3);
        }
        
        .header h1 {
          font-size: 2.5em;
          margin-bottom: 10px;
          background: linear-gradient(45deg, #0078d4, #00bcf2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .header .subtitle {
          font-size: 1.1em;
          opacity: 0.8;
        }
        
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
          .main-grid { grid-template-columns: 1fr; }
        }
        
        .card {
          background: rgba(45, 45, 48, 0.8);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }
        
        .status-card {
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .status {
          padding: 20px;
          border-radius: 10px;
          margin: 15px 0;
          font-size: 1.2em;
          font-weight: 600;
          position: relative;
          transition: all 0.3s ease;
        }
        
        .status.listening { 
          background: linear-gradient(45deg, #0078d4, #106ebe);
          animation: pulse 2s infinite;
        }
        .status.recording { 
          background: linear-gradient(45deg, #d73a49, #cb2431);
          animation: recording-pulse 1s infinite;
        }
        .status.idle { 
          background: linear-gradient(45deg, #28a745, #20a83a);
        }
        .status.processing { 
          background: linear-gradient(45deg, #ffc107, #e0a800);
          animation: processing 1.5s infinite;
        }
        .status.error {
          background: linear-gradient(45deg, #dc3545, #c82333);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        
        @keyframes recording-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(215, 58, 73, 0.7); }
          50% { opacity: 0.7; box-shadow: 0 0 0 20px rgba(215, 58, 73, 0); }
        }
        
        @keyframes processing {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .controls {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
          margin: 20px 0;
        }
        
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .btn-primary { background: linear-gradient(45deg, #28a745, #20a83a); color: white; }
        .btn-danger { background: linear-gradient(45deg, #dc3545, #c82333); color: white; }
        .btn-secondary { background: linear-gradient(45deg, #6c757d, #5a6268); color: white; }
        .btn-info { background: linear-gradient(45deg, #17a2b8, #138496); color: white; }
        
        .transcript-area {
          background: rgba(30, 30, 30, 0.9);
          padding: 20px;
          border-radius: 10px;
          margin: 15px 0;
          border-left: 4px solid #0078d4;
          min-height: 100px;
          position: relative;
        }
        
        .transcript-area h3 {
          margin-bottom: 15px;
          color: #0078d4;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .confidence-meter {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          margin: 10px 0;
          overflow: hidden;
        }
        
        .confidence-fill {
          height: 100%;
          background: linear-gradient(90deg, #dc3545, #ffc107, #28a745);
          transition: width 0.3s ease;
        }
        
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }
        
        .setting-group {
          background: rgba(255, 255, 255, 0.05);
          padding: 15px;
          border-radius: 8px;
        }
        
        .setting-group h4 {
          margin-bottom: 10px;
          color: #0078d4;
        }
        
        .slider-container {
          margin: 10px 0;
        }
        
        .slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.2);
          outline: none;
        }
        
        .voice-visualizer {
          width: 100%;
          height: 60px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          margin: 15px 0;
          position: relative;
          overflow: hidden;
        }
        
        .wave-bar {
          position: absolute;
          bottom: 0;
          width: 3px;
          background: linear-gradient(to top, #0078d4, #00bcf2);
          border-radius: 1px;
          transition: height 0.1s ease;
        }
        
        .commands-list {
          max-height: 300px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 15px;
        }
        
        .command-item {
          padding: 8px 12px;
          margin: 5px 0;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          border-left: 3px solid #0078d4;
        }
        
        .command-trigger {
          font-weight: bold;
          color: #00bcf2;
        }
        
        .command-desc {
          font-size: 0.9em;
          opacity: 0.8;
          margin-top: 4px;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          margin: 15px 0;
        }
        
        .metric {
          text-align: center;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }
        
        .metric-value {
          font-size: 1.5em;
          font-weight: bold;
          color: #0078d4;
        }
        
        .metric-label {
          font-size: 0.8em;
          opacity: 0.7;
        }
        
        .language-selector {
          display: flex;
          gap: 10px;
          margin: 15px 0;
          flex-wrap: wrap;
        }
        
        .lang-btn {
          padding: 8px 16px;
          border: 2px solid rgba(0, 120, 212, 0.3);
          background: transparent;
          color: #d4d4d4;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .lang-btn.active {
          background: #0078d4;
          border-color: #0078d4;
        }
        
        .lang-btn:hover {
          border-color: #0078d4;
          background: rgba(0, 120, 212, 0.1);
        }
        
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 15px 20px;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          z-index: 1000;
          transform: translateX(400px);
          transition: transform 0.3s ease;
        }
        
        .notification.show {
          transform: translateX(0);
        }
        
        .notification.success { background: #28a745; }
        .notification.error { background: #dc3545; }
        .notification.info { background: #17a2b8; }
        .notification.warning { background: #ffc107; color: #000; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎤 Guido</h1>
        <div class="subtitle">Advanced AI Voice Assistant</div>
      </div>
      
      <div class="main-grid">
        <!-- Status & Control -->
        <div class="card status-card">
          <div id="status" class="status idle">
            Bereit - Sagen Sie "${this.config.wakeWord}" um zu beginnen
          </div>
          
          <div class="confidence-meter" style="display: none;">
            <div id="confidenceFill" class="confidence-fill" style="width: 0%"></div>
          </div>
          
          <div class="controls">
            <button id="startBtn" class="btn btn-primary" onclick="startListening()">
              🎤 Zuhören starten
            </button>
            <button id="stopBtn" class="btn btn-danger" onclick="stopListening()">
              ⏹️ Stopp
            </button>
            <button id="settingsBtn" class="btn btn-secondary" onclick="toggleSettings()">
              ⚙️ Einstellungen
            </button>
          </div>
          
          ${this.config.debug.audioVisualization ? `
          <div class="voice-visualizer" id="visualizer">
            <!-- Audio-Wellenform wird hier angezeigt -->
          </div>
          ` : ''}
        </div>
        
        <!-- Transcript & Response -->
        <div class="card">
          <div class="transcript-area">
            <h3>📝 Ihre Eingabe:</h3>
            <div id="transcript">Hier erscheint Ihre Spracheingabe...</div>
          </div>
          
          <div class="transcript-area">
            <h3>🤖 Guidos Antwort:</h3>
            <div id="response">Hier erscheint die Antwort...</div>
          </div>
          
          ${this.config.debug.performanceMetrics ? `
          <div class="metrics-grid">
            <div class="metric">
              <div id="latency" class="metric-value">0ms</div>
              <div class="metric-label">Latenz</div>
            </div>
            <div class="metric">
              <div id="confidence" class="metric-value">0%</div>
              <div class="metric-label">Konfidenz</div>
            </div>
            <div class="metric">
              <div id="words-per-min" class="metric-value">0</div>
              <div class="metric-label">WPM</div>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Einstellungen Panel -->
      <div id="settingsPanel" class="card" style="display: none;">
        <h3>🎛️ Voice Einstellungen</h3>
        
        <div class="settings-grid">
          <!-- Sprache -->
          <div class="setting-group">
            <h4>🌍 Sprache</h4>
            <div class="language-selector">
              <button class="lang-btn active" onclick="setLanguage('de-DE')">🇩🇪 Deutsch</button>
              <button class="lang-btn" onclick="setLanguage('en-US')">🇺🇸 English</button>
              <button class="lang-btn" onclick="setLanguage('fr-FR')">🇫🇷 Français</button>
              <button class="lang-btn" onclick="setLanguage('es-ES')">🇪🇸 Español</button>
            </div>
          </div>
          
          <!-- Audio -->
          <div class="setting-group">
            <h4>🔊 Audio</h4>
            <div class="slider-container">
              <label>TTS Lautstärke: <span id="volumeValue">${this.config.audio.ttsVolume}</span></label>
              <input type="range" class="slider" min="0" max="1" step="0.1" 
                     value="${this.config.audio.ttsVolume}" 
                     oninput="updateVolume(this.value)">
            </div>
            <div class="slider-container">
              <label>TTS Geschwindigkeit: <span id="speedValue">${this.config.audio.ttsSpeed}</span></label>
              <input type="range" class="slider" min="0.5" max="2" step="0.1" 
                     value="${this.config.audio.ttsSpeed}" 
                     oninput="updateSpeed(this.value)">
            </div>
            <div class="slider-container">
              <label>Beep Lautstärke: <span id="beepValue">${this.config.audio.beepVolume}</span></label>
              <input type="range" class="slider" min="0" max="1" step="0.1" 
                     value="${this.config.audio.beepVolume}" 
                     oninput="updateBeepVolume(this.value)">
            </div>
          </div>
          
          <!-- Aufnahme -->
          <div class="setting-group">
            <h4>🎙️ Aufnahme</h4>
            <div class="slider-container">
              <label>Wake Word Sensitivität: <span id="sensitivityValue">${this.config.recording.wakeWordSensitivity}</span></label>
              <input type="range" class="slider" min="0.1" max="1" step="0.1" 
                     value="${this.config.recording.wakeWordSensitivity}" 
                     oninput="updateSensitivity(this.value)">
            </div>
            <div class="slider-container">
              <label>Timeout (Sekunden): <span id="timeoutValue">${this.config.recording.timeoutSeconds}</span></label>
              <input type="range" class="slider" min="5" max="120" step="5" 
                     value="${this.config.recording.timeoutSeconds}" 
                     oninput="updateTimeout(this.value)">
            </div>
          </div>
          
          <!-- Stimmen -->
          <div class="setting-group">
            <h4>🗣️ Stimme</h4>
            <select id="voiceSelect" onchange="updateVoice(this.value)">
              ${this.getVoiceOptions()}
            </select>
          </div>
        </div>
      </div>
      
      <!-- Befehls-Referenz -->
      <div class="card">
        <h3>📋 Verfügbare Sprachbefehle</h3>
        <div class="commands-list">
          ${this.getCommandsList()}
        </div>
      </div>

      <script>
        const vscode = acquireVsCodeApi();
        let recognition;
        let synthesis = window.speechSynthesis;
        let isRecording = false;
        let currentConfig = ${JSON.stringify(this.config)};
        let audioContext;
        let analyser;
        let dataArray;
        let animationId;
        
        // Notification System
        function showNotification(message, type = 'info') {
          const notification = document.createElement('div');
          notification.className = 'notification ' + type;
          notification.textContent = message;
          document.body.appendChild(notification);
          
          setTimeout(() => notification.classList.add('show'), 100);
          setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
          }, 3000);
        }
        
        // Speech Recognition Setup
        ${this.getSpeechRecognitionScript()}
        
        // Audio Visualization
        ${this.config.debug.audioVisualization ? this.getAudioVisualizationScript() : ''}
        
        // UI Functions
        function updateStatus(type, text) {
          const status = document.getElementById('status');
          status.className = 'status ' + type;
          status.textContent = text;
        }
        
        function updateConfidence(confidence) {
          if (currentConfig.debug.showRecognitionConfidence) {
            const fill = document.getElementById('confidenceFill');
            const meter = fill?.parentElement;
            if (fill && meter) {
              fill.style.width = (confidence * 100) + '%';
              meter.style.display = 'block';
            }
          }
          
          if (currentConfig.debug.performanceMetrics) {
            const confidenceElement = document.getElementById('confidence');
            if (confidenceElement) {
              confidenceElement.textContent = Math.round(confidence * 100) + '%';
            }
          }
        }
        
        function toggleSettings() {
          const panel = document.getElementById('settingsPanel');
          panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
        
        // Settings Functions
        function setLanguage(lang) {
          currentConfig.language = lang;
          if (recognition) {
            recognition.lang = lang;
          }
          
          document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
          event.target.classList.add('active');
          
          vscode.postMessage({
            command: 'updateConfig',
            key: 'language',
            value: lang
          });
          
          showNotification('Sprache geändert zu ' + lang, 'success');
        }
        
        function updateVolume(value) {
          document.getElementById('volumeValue').textContent = value;
          currentConfig.audio.ttsVolume = parseFloat(value);
          vscode.postMessage({
            command: 'updateConfig',
            key: 'audio.ttsVolume',
            value: parseFloat(value)
          });
        }
        
        function updateSpeed(value) {
          document.getElementById('speedValue').textContent = value;
          currentConfig.audio.ttsSpeed = parseFloat(value);
          vscode.postMessage({
            command: 'updateConfig',
            key: 'audio.ttsSpeed',
            value: parseFloat(value)
          });
        }
        
        function updateBeepVolume(value) {
          document.getElementById('beepValue').textContent = value;
          currentConfig.audio.beepVolume = parseFloat(value);
          vscode.postMessage({
            command: 'updateConfig',
            key: 'audio.beepVolume',
            value: parseFloat(value)
          });
        }
        
        function updateSensitivity(value) {
          document.getElementById('sensitivityValue').textContent = value;
          currentConfig.recording.wakeWordSensitivity = parseFloat(value);
          vscode.postMessage({
            command: 'updateConfig',
            key: 'recording.wakeWordSensitivity',
            value: parseFloat(value)
          });
        }
        
        function updateTimeout(value) {
          document.getElementById('timeoutValue').textContent = value;
          currentConfig.recording.timeoutSeconds = parseInt(value);
          vscode.postMessage({
            command: 'updateConfig',
            key: 'recording.timeoutSeconds',
            value: parseInt(value)
          });
        }
        
        function updateVoice(voiceId) {
          currentConfig.audio.ttsVoice = voiceId;
          vscode.postMessage({
            command: 'updateConfig',
            key: 'audio.ttsVoice',
            value: voiceId
          });
          showNotification('Stimme geändert', 'success');
        }
        
        // Performance Metrics
        ${this.config.debug.performanceMetrics ? `
        let startTime = 0;
        let wordCount = 0;
        
        function updateMetrics(transcript) {
          if (startTime > 0) {
            const latency = Date.now() - startTime;
            document.getElementById('latency').textContent = latency + 'ms';
          }
          
          wordCount = transcript.split(' ').filter(word => word.length > 0).length;
          const timeElapsed = (Date.now() - startTime) / 1000 / 60; // minutes
          const wpm = timeElapsed > 0 ? Math.round(wordCount / timeElapsed) : 0;
          document.getElementById('words-per-min').textContent = wpm;
        }
        ` : ''}
        
        // Message handling from extension
        window.addEventListener('message', event => {
          const message = event.data;
          
          switch (message.command) {
            case 'showResponse':
              document.getElementById('response').textContent = message.text;
              speakResponse(message.text);
              updateStatus('idle', 'Bereit für nächste Eingabe');
              break;
              
            case 'confirmationRequired':
              updateStatus('processing', 'Bestätigung erforderlich');
              showNotification('Bestätigung erforderlich: ' + message.summary, 'warning');
              speakResponse('Ich habe verstanden: ' + message.summary + '. Soll ich das ausführen?');
              break;
              
            case 'error':
              updateStatus('error', 'Fehler: ' + message.message);
              showNotification('Fehler: ' + message.message, 'error');
              break;
              
            case 'configUpdated':
              currentConfig = message.config;
              showNotification('Konfiguration aktualisiert', 'success');
              break;
          }
        });
        
        // Auto-start
        setTimeout(() => {
          if (currentConfig.recording.backgroundListening) {
            startListening();
          }
        }, 1000);
      </script>
    </body>
    </html>`;
  }

  private getSpeechRecognitionScript(): string {
    return `
    // Speech Recognition Setup
    if ('webkitSpeechRecognition' in window) {
      recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      recognition = new SpeechRecognition();
    }
    
    if (recognition) {
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = currentConfig.language;
      recognition.maxAlternatives = 3;
      
      recognition.onstart = () => {
        updateStatus('listening', 'Höre auf Wake Words...');
        if (currentConfig.debug.performanceMetrics) {
          startTime = Date.now();
        }
      };
      
      recognition.onresult = (event) => {
        let transcript = '';
        let confidence = 0;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          transcript += result[0].transcript;
          confidence = Math.max(confidence, result[0].confidence || 0);
        }
        
        updateConfidence(confidence);
        
        if (currentConfig.debug.performanceMetrics) {
          updateMetrics(transcript);
        }
        
        // Check for wake words
        const wakeWords = [currentConfig.wakeWord, ...currentConfig.alternativeWakeWords];
        const lowerTranscript = transcript.toLowerCase();
        
        const wakeWordDetected = wakeWords.some(word => 
          lowerTranscript.includes(word.toLowerCase())
        );
        
        if (wakeWordDetected && !isRecording) {
          playBeep();
          startRecording();
        }
        
        // Check for stop words during recording
        if (isRecording) {
          const stopWords = currentConfig.recording.stopWords;
          const stopWordDetected = stopWords.some(word => 
            lowerTranscript.includes(word.toLowerCase())
          );
          
          if (stopWordDetected) {
            stopRecording();
          }
        }
        
        document.getElementById('transcript').textContent = transcript;
        
        // Auto-stop on silence
        if (isRecording && currentConfig.recording.autoStopOnSilence) {
          clearTimeout(window.silenceTimeout);
          window.silenceTimeout = setTimeout(() => {
            if (isRecording) stopRecording();
          }, currentConfig.recording.silenceTimeoutMs);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        updateStatus('error', 'Spracherkennungs-Fehler: ' + event.error);
        showNotification('Spracherkennungs-Fehler: ' + event.error, 'error');
      };
      
      recognition.onend = () => {
        if (currentConfig.recording.backgroundListening && !isRecording) {
          setTimeout(startListening, 1000);
        }
      };
    }
    
    function startListening() {
      if (recognition && !isRecording) {
        try {
          recognition.start();
          updateStatus('listening', 'Höre auf "' + currentConfig.wakeWord + '"...');
        } catch (e) {
          console.error('Failed to start recognition:', e);
        }
      }
    }
    
    function stopListening() {
      if (recognition) {
        recognition.stop();
        updateStatus('idle', 'Gestoppt');
      }
      isRecording = false;
    }
    
    function startRecording() {
      isRecording = true;
      updateStatus('recording', '🔴 Aufnahme läuft - sagen Sie "stop" zum Beenden');
      
      if (currentConfig.debug.audioVisualization) {
        startAudioVisualization();
      }
      
      // Timeout
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, currentConfig.recording.timeoutSeconds * 1000);
      
      vscode.postMessage({
        command: 'recordingStarted'
      });
    }
    
    function stopRecording() {
      isRecording = false;
      updateStatus('processing', 'Verarbeite Eingabe...');
      
      if (currentConfig.debug.audioVisualization) {
        stopAudioVisualization();
      }
      
      const transcript = document.getElementById('transcript').textContent;
      
      vscode.postMessage({
        command: 'recordingStopped',
        transcript: transcript,
        confidence: confidence || 0,
        timestamp: Date.now()
      });
    }
    
    function playBeep() {
      if (currentConfig.audio.enableBeep) {
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // Different beep types
        switch (currentConfig.audio.beepType) {
          case 'soft':
            oscillator.frequency.value = 600;
            break;
          case 'sharp':
            oscillator.frequency.value = 1000;
            break;
          case 'melody':
            // Simple melody
            oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
            break;
          default:
            oscillator.frequency.value = 800;
        }
        
        gainNode.gain.value = currentConfig.audio.beepVolume;
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      }
    }
    
    function speakResponse(text) {
      if (currentConfig.audio.ttsEnabled && synthesis) {
        // Filter out code blocks
        if (currentConfig.routing.skipCodeInTTS) {
          text = text.replace(/\`\`\`[\\s\\S]*?\`\`\`/g, '[Code-Block]');
          text = text.replace(/\`[^`]*\`/g, '[Code]');
        }
        
        // Limit length
        if (text.length > currentConfig.routing.maxResponseLength) {
          text = text.substring(0, currentConfig.routing.maxResponseLength) + '... Antwort gekürzt für Sprachausgabe.';
        }
        
        // Simple language processing
        if (currentConfig.routing.useSimpleLanguage) {
          text = text.replace(/\\b(jedoch|allerdings|dementsprechend)\\b/g, 'aber');
          text = text.replace(/\\b(implementieren|realisieren)\\b/g, 'umsetzen');
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentConfig.language;
        utterance.rate = currentConfig.audio.ttsSpeed;
        utterance.volume = currentConfig.audio.ttsVolume;
        utterance.pitch = currentConfig.audio.ttsPitch;
        
        // Voice selection
        if (currentConfig.audio.ttsVoice !== 'auto') {
          const voices = synthesis.getVoices();
          const selectedVoice = voices.find(voice => voice.name === currentConfig.audio.ttsVoice);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }
        
        utterance.onstart = () => {
          updateStatus('processing', '🗣️ Spreche Antwort...');
        };
        
        utterance.onend = () => {
          updateStatus('idle', 'Bereit für nächste Eingabe');
        };
        
        synthesis.speak(utterance);
      }
    }`;
  }

  private getAudioVisualizationScript(): string {
    return `
    function startAudioVisualization() {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          audioContext = new AudioContext();
          analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          
          source.connect(analyser);
          analyser.fftSize = 256;
          
          const bufferLength = analyser.frequencyBinCount;
          dataArray = new Uint8Array(bufferLength);
          
          const visualizer = document.getElementById('visualizer');
          visualizer.innerHTML = '';
          
          for (let i = 0; i < 32; i++) {
            const bar = document.createElement('div');
            bar.className = 'wave-bar';
            bar.style.left = (i * 8) + 'px';
            visualizer.appendChild(bar);
          }
          
          animate();
        })
        .catch(err => console.error('Audio visualization error:', err));
    }
    
    function animate() {
      if (!isRecording) return;
      
      animationId = requestAnimationFrame(animate);
      
      analyser.getByteFrequencyData(dataArray);
      
      const bars = document.querySelectorAll('.wave-bar');
      bars.forEach((bar, i) => {
        const height = (dataArray[i * 8] / 255) * 60;
        bar.style.height = height + 'px';
      });
    }
    
    function stopAudioVisualization() {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (audioContext) {
        audioContext.close();
      }
    }`;
  }

  private getVoiceOptions(): string {
    const voices = this.config.voices[this.config.language] || [];
    return voices.map(voice => 
      `<option value="${voice.name}">${voice.name} (${voice.gender}, ${voice.style})</option>`
    ).join('');
  }

  private getCommandsList(): string {
    const allCommands = [
      ...this.config.commands.system,
      ...this.config.commands.voice,
      ...this.config.commands.content,
      ...this.config.commands.navigation
    ];

    return allCommands.map(cmd => `
      <div class="command-item">
        <div class="command-trigger">"${cmd.trigger.join('" oder "')}"</div>
        <div class="command-desc">${this.getCommandDescription(cmd.action)}</div>
      </div>
    `).join('');
  }

  private getCommandDescription(action: string): string {
    const descriptions: Record<string, string> = {
      'switchMode': 'Wechselt den Router-Modus',
      'showBudget': 'Zeigt die Kostenübersicht',
      'testProviders': 'Testet Provider-Verbindungen',
      'openConfig': 'Öffnet die Konfigurationsdatei',
      'decreaseVolume': 'Verringert die Lautstärke',
      'increaseVolume': 'Erhöht die Lautstärke',
      'cycleVoice': 'Wechselt die TTS-Stimme',
      'cycleLanguage': 'Wechselt die Sprache',
      'explainCode': 'Erklärt den ausgewählten Code',
      'optimizeCode': 'Optimiert den ausgewählten Code',
      'writeTests': 'Schreibt Tests für die Datei',
      'generateDocs': 'Generiert Dokumentation',
      'refactorCode': 'Refaktoriert den Code',
      'openFile': 'Öffnet eine Datei',
      'openTerminal': 'Öffnet das Terminal',
      'showProblems': 'Zeigt Probleme an',
      'globalSearch': 'Startet eine globale Suche'
    };
    
    return descriptions[action] || `Führt ${action} aus`;
  }

  private setupWebviewMessageHandling(): void {
    this.webviewPanel!.webview.onDidReceiveMessage(async (message) => {
      try {
        switch (message.command) {
          case 'recordingStarted':
            await this.handleRecordingStarted();
            break;
            
          case 'recordingStopped':
            await this.handleRecordingStopped(message.transcript, message.confidence, message.timestamp);
            break;
            
          case 'updateConfig':
            await this.handleConfigUpdate(message.key, message.value);
            break;
            
          default:
            this.log(`Unknown webview message: ${message.command}`);
        }
      } catch (error) {
        this.log(`Error handling webview message: ${error.message}`);
        this.sendToWebview({
          command: 'error',
          message: error.message
        });
      }
    });
  }

  private async handleRecordingStarted(): Promise<void> {
    this.currentSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      isActive: true,
      transcript: '',
      confidence: 0,
      language: this.config.language
    };

    this.log('Recording started', { sessionId: this.currentSession.id });
  }

  private async handleRecordingStopped(transcript: string, confidence: number, timestamp: number): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.transcript = transcript;
    this.currentSession.confidence = confidence;
    this.currentSession.isActive = false;

    this.log('Recording stopped', { 
      sessionId: this.currentSession.id, 
      transcript: transcript.substring(0, 100),
      confidence 
    });

    // Process the voice input
    const response = await this.commandProcessor.processVoiceInput(transcript, this.currentSession);
    
    // Add to conversation history
    if (this.config.advanced.contextMemory) {
      this.conversationHistory.push(transcript);
      if (this.conversationHistory.length > this.config.advanced.conversationHistory) {
        this.conversationHistory.shift();
      }
    }

    this.sendToWebview({
      command: 'showResponse',
      text: response
    });
  }

  private async handleConfigUpdate(key: string, value: any): Promise<void> {
    // Update local config
    const keys = key.split('.');
    let current = this.config as any;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    this.log('Config updated', { key, value });

    // Persist to file (optional)
    // await this.saveConfigToFile();

    this.sendToWebview({
      command: 'configUpdated',
      config: this.config
    });
  }

  private sendToWebview(message: any): void {
    if (this.webviewPanel) {
      this.webviewPanel.webview.postMessage(message);
    }
  }

  private updateStatus(type: string, message: string): void {
    this.sendToWebview({
      command: 'updateStatus',
      type,
      message
    });
  }

  private async speak(text: string): Promise<void> {
    return this.audioManager.speak(text, this.config.audio);
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    const personality = this.config.advanced.personality;
    
    const greetings = {
      professional: {
        morning: "Guten Morgen! Guido ist bereit für Ihre Anfragen.",
        afternoon: "Guten Tag! Wie kann ich Ihnen helfen?",
        evening: "Guten Abend! Ich stehe für Ihre Fragen bereit."
      },
      friendly: {
        morning: "Hallo! Schön, dass Sie da sind. Was kann ich heute für Sie tun?",
        afternoon: "Hi! Bereit für neue Herausforderungen?",
        evening: "Hallo! Auch am Abend noch produktiv? Wie kann ich helfen?"
      },
      casual: {
        morning: "Moin! Auf geht's!",
        afternoon: "Hey! Was steht an?",
        evening: "Hi! Noch am Coden?"
      }
    };

    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    return greetings[personality]?.[timeOfDay] || "Hallo! Ich bin Guido, Ihr Sprach-Assistent.";
  }

  private setupEventListeners(): void {
    // VSCode window state changes
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (this.config.routing.contextAware && this.currentSession?.isActive) {
        this.currentSession.context = {
          fileName: editor?.document.fileName,
          language: editor?.document.languageId,
          lineCount: editor?.document.lineCount
        };
      }
    });
  }

  private loadAuditLog(): void {
    if (!this.config.permissions.auditLog) return;

    try {
      const logPath = path.resolve(this.config.permissions.auditLogPath);
      if (fs.existsSync(logPath)) {
        const logData = fs.readFileSync(logPath, 'utf8');
        this.auditLog = JSON.parse(logData);
      }
    } catch (error) {
      console.warn('Failed to load audit log:', error);
    }
  }

  private log(action: string, details?: any): void {
    if (this.config.debug.verboseLogging) {
      console.log(`[VoiceController] ${action}:`, details);
    }

    if (this.config.permissions.auditLog) {
      this.auditLog.push({
        timestamp: new Date(),
        action,
        details
      });

      // Trim log if too large
      if (this.auditLog.length > this.config.permissions.maxAuditEntries) {
        this.auditLog = this.auditLog.slice(-this.config.permissions.maxAuditEntries);
      }

      // Save to file
      this.saveAuditLog();
    }
  }

  private saveAuditLog(): void {
    try {
      const logPath = path.resolve(this.config.permissions.auditLogPath);
      fs.writeFileSync(logPath, JSON.stringify(this.auditLog, null, 2));
    } catch (error) {
      console.warn('Failed to save audit log:', error);
    }
  }
}
