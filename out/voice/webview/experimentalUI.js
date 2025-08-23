"use strict";
/**
 * Experimentelle UI-Komponenten für Guido Voice Control
 * Emotionale Visualisierung, Kontext-Anzeige und adaptives Interface
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperimentalUI = void 0;
class ExperimentalUI {
    webview;
    currentState;
    emotionColors = {};
    interfaceModes = {};
    constructor(webview) {
        this.webview = webview;
        this.currentState = this.getDefaultState();
        this.initializeExperimentalUI();
    }
    initializeExperimentalUI() {
        this.setupEmotionColors();
        this.setupInterfaceModes();
    }
    setupEmotionColors() {
        this.emotionColors = {
            happy: '#4CAF50',
            sad: '#2196F3',
            angry: '#F44336',
            excited: '#FF9800',
            confused: '#9C27B0',
            neutral: '#9E9E9E',
            frustrated: '#FF5722',
            satisfied: '#8BC34A'
        };
    }
    setupInterfaceModes() {
        this.interfaceModes = {
            beginner: {
                verbosity: 'high',
                technicalLevel: 'low',
                guidance: 'extensive',
                visualCues: 'many'
            },
            expert: {
                verbosity: 'low',
                technicalLevel: 'high',
                guidance: 'minimal',
                visualCues: 'few'
            },
            casual: {
                verbosity: 'medium',
                technicalLevel: 'medium',
                guidance: 'moderate',
                visualCues: 'moderate'
            }
        };
    }
    getDefaultState() {
        return {
            emotionIndicator: 'neutral',
            emotionColor: '#9E9E9E',
            confidence: 0.5,
            contextInfo: {
                project: 'unknown',
                file: 'unknown',
                userExpertise: 'intermediate',
                recentCommands: []
            },
            interfaceMode: 'casual',
            experimentalFeatures: {
                emotionDetection: true,
                contextAwareness: true,
                adaptiveInterface: true,
                multilingual: true,
                personalityAdaptation: true
            }
        };
    }
    /**
     * Emotionale Visualisierung
     */
    showEmotionVisualization(emotion, confidence) {
        const emotionColor = this.emotionColors[emotion] || '#9E9E9E';
        this.currentState.emotionIndicator = emotion;
        this.currentState.emotionColor = emotionColor;
        this.currentState.confidence = confidence;
        this.updateUI();
        this.sendEmotionToWebview(emotion, confidence, emotionColor);
    }
    /**
     * Kontext-Anzeige
     */
    showContextInfo(context) {
        this.currentState.contextInfo = {
            project: context.project || 'unknown',
            file: context.file || 'unknown',
            userExpertise: context.userExpertise || 'intermediate',
            recentCommands: context.recentCommands || []
        };
        this.updateUI();
        this.sendContextToWebview(this.currentState.contextInfo);
    }
    /**
     * Adaptives Interface
     */
    adaptInterface(userBehavior) {
        const interfaceMode = this.determineInterfaceMode(userBehavior);
        this.currentState.interfaceMode = interfaceMode;
        this.updateUI();
        this.sendInterfaceModeToWebview(interfaceMode);
    }
    /**
     * Experimentelle Features aktivieren/deaktivieren
     */
    toggleExperimentalFeature(feature, enabled) {
        this.currentState.experimentalFeatures[feature] = enabled;
        this.updateUI();
        this.sendFeatureToggleToWebview(feature, enabled);
    }
    /**
     * Intent-Visualisierung
     */
    showIntentVisualization(intent) {
        this.sendIntentToWebview(intent);
    }
    /**
     * Performance-Metriken anzeigen
     */
    showPerformanceMetrics(metrics) {
        this.sendMetricsToWebview(metrics);
    }
    /**
     * Experimentelle Status-Anzeige
     */
    showExperimentalStatus(status, type) {
        this.sendStatusToWebview(status, type);
    }
    /**
     * Adaptive Antworten visualisieren
     */
    showAdaptiveResponse(response, personality) {
        this.sendAdaptiveResponseToWebview(response, personality);
    }
    /**
     * Mehrsprachige Verarbeitung anzeigen
     */
    showMultilingualProcessing(original, detected, translated) {
        this.sendMultilingualToWebview(original, detected, translated);
    }
    // Private Hilfsmethoden
    updateUI() {
        // UI-Update-Logik
        this.webview.webview.postMessage({
            type: 'updateExperimentalUI',
            data: this.currentState
        });
    }
    determineInterfaceMode(userBehavior) {
        const { expertise, preferences, recentCommands } = userBehavior;
        if (expertise === 'expert' && preferences?.efficiency > 0.7) {
            return 'expert';
        }
        else if (expertise === 'beginner' || preferences?.guidance > 0.7) {
            return 'beginner';
        }
        else {
            return 'casual';
        }
    }
    sendEmotionToWebview(emotion, confidence, color) {
        this.webview.webview.postMessage({
            type: 'emotionVisualization',
            data: {
                emotion,
                confidence,
                color,
                timestamp: new Date().toISOString()
            }
        });
    }
    sendContextToWebview(contextInfo) {
        this.webview.webview.postMessage({
            type: 'contextInfo',
            data: {
                ...contextInfo,
                timestamp: new Date().toISOString()
            }
        });
    }
    sendInterfaceModeToWebview(mode) {
        this.webview.webview.postMessage({
            type: 'interfaceMode',
            data: {
                mode,
                settings: this.interfaceModes[mode] || this.interfaceModes.casual,
                timestamp: new Date().toISOString()
            }
        });
    }
    sendFeatureToggleToWebview(feature, enabled) {
        this.webview.webview.postMessage({
            type: 'featureToggle',
            data: {
                feature,
                enabled,
                timestamp: new Date().toISOString()
            }
        });
    }
    sendIntentToWebview(intent) {
        this.webview.webview.postMessage({
            type: 'intentVisualization',
            data: {
                primary: intent.primary,
                confidence: intent.confidence,
                entities: intent.entities,
                context: intent.context,
                timestamp: new Date().toISOString()
            }
        });
    }
    sendMetricsToWebview(metrics) {
        this.webview.webview.postMessage({
            type: 'performanceMetrics',
            data: {
                ...metrics,
                timestamp: new Date().toISOString()
            }
        });
    }
    sendStatusToWebview(status, type) {
        this.webview.webview.postMessage({
            type: 'experimentalStatus',
            data: {
                status,
                type,
                timestamp: new Date().toISOString()
            }
        });
    }
    sendAdaptiveResponseToWebview(response, personality) {
        this.webview.webview.postMessage({
            type: 'adaptiveResponse',
            data: {
                response,
                personality,
                timestamp: new Date().toISOString()
            }
        });
    }
    sendMultilingualToWebview(original, detected, translated) {
        this.webview.webview.postMessage({
            type: 'multilingualProcessing',
            data: {
                original,
                detected,
                translated,
                timestamp: new Date().toISOString()
            }
        });
    }
    /**
     * Experimentelle CSS-Styles generieren
     */
    generateExperimentalCSS() {
        return `
      .experimental-mode {
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
        border: 2px dashed #ffd93d;
        animation: experimental-pulse 2s infinite;
        border-radius: 8px;
        padding: 10px;
        margin: 5px 0;
      }

      .experimental-warning {
        color: #ff6b6b;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 0.8em;
        background: rgba(255, 107, 107, 0.1);
        padding: 5px 10px;
        border-radius: 4px;
        border-left: 3px solid #ff6b6b;
      }

      .emotion-indicator {
        display: inline-block;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        margin-right: 10px;
        animation: emotion-pulse 1s ease-in-out infinite alternate;
      }

      .context-info {
        background: rgba(33, 150, 243, 0.1);
        border: 1px solid #2196F3;
        border-radius: 4px;
        padding: 8px;
        margin: 5px 0;
        font-size: 0.9em;
      }

      .intent-visualization {
        background: rgba(76, 175, 80, 0.1);
        border: 1px solid #4CAF50;
        border-radius: 4px;
        padding: 8px;
        margin: 5px 0;
      }

      .performance-metrics {
        background: rgba(255, 152, 0, 0.1);
        border: 1px solid #FF9800;
        border-radius: 4px;
        padding: 8px;
        margin: 5px 0;
        font-family: monospace;
      }

      .multilingual-info {
        background: rgba(156, 39, 176, 0.1);
        border: 1px solid #9C27B0;
        border-radius: 4px;
        padding: 8px;
        margin: 5px 0;
      }

      .adaptive-response {
        background: rgba(0, 150, 136, 0.1);
        border: 1px solid #009688;
        border-radius: 4px;
        padding: 8px;
        margin: 5px 0;
        font-style: italic;
      }

      @keyframes experimental-pulse {
        0%, 100% { 
          opacity: 1; 
          transform: scale(1);
        }
        50% { 
          opacity: 0.7; 
          transform: scale(1.02);
        }
      }

      @keyframes emotion-pulse {
        0% { 
          transform: scale(1);
          box-shadow: 0 0 5px currentColor;
        }
        100% { 
          transform: scale(1.1);
          box-shadow: 0 0 15px currentColor;
        }
      }

      .experimental-feature-toggle {
        display: flex;
        align-items: center;
        margin: 5px 0;
        padding: 5px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.05);
      }

      .experimental-feature-toggle input[type="checkbox"] {
        margin-right: 10px;
      }

      .experimental-feature-toggle label {
        font-size: 0.9em;
        cursor: pointer;
      }

      .experimental-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
        margin: 10px 0;
      }

      .stat-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 10px;
        text-align: center;
      }

      .stat-value {
        font-size: 1.5em;
        font-weight: bold;
        color: #4CAF50;
      }

      .stat-label {
        font-size: 0.8em;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
      }

      .experimental-timeline {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 10px;
        margin: 10px 0;
      }

      .timeline-entry {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .timeline-entry:last-child {
        border-bottom: none;
      }

      .timeline-time {
        font-size: 0.8em;
        color: rgba(255, 255, 255, 0.5);
      }

      .timeline-event {
        font-size: 0.9em;
      }

      .experimental-controls {
        display: flex;
        gap: 10px;
        margin: 10px 0;
        flex-wrap: wrap;
      }

      .experimental-button {
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        color: white;
        cursor: pointer;
        font-size: 0.9em;
        transition: all 0.3s ease;
      }

      .experimental-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      .experimental-button:active {
        transform: translateY(0);
      }
    `;
    }
    /**
     * Experimentelle HTML-Struktur generieren
     */
    generateExperimentalHTML() {
        return `
      <div class="experimental-container">
        <div class="experimental-header">
          <h2>🧪 Experimentelle Features</h2>
          <div class="experimental-status">
            <span class="status-indicator">⚡ Experimental Mode</span>
          </div>
        </div>

        <div class="experimental-features">
          <div class="experimental-feature-toggle">
            <input type="checkbox" id="emotion-detection" checked>
            <label for="emotion-detection">Emotionale Erkennung</label>
          </div>
          
          <div class="experimental-feature-toggle">
            <input type="checkbox" id="context-awareness" checked>
            <label for="context-awareness">Kontextbewusstsein</label>
          </div>
          
          <div class="experimental-feature-toggle">
            <input type="checkbox" id="adaptive-interface" checked>
            <label for="adaptive-interface">Adaptives Interface</label>
          </div>
          
          <div class="experimental-feature-toggle">
            <input type="checkbox" id="multilingual" checked>
            <label for="multilingual">Mehrsprachigkeit</label>
          </div>
          
          <div class="experimental-feature-toggle">
            <input type="checkbox" id="personality-adaptation" checked>
            <label for="personality-adaptation">Persönlichkeitsanpassung</label>
          </div>
        </div>

        <div class="experimental-stats">
          <div class="stat-card">
            <div class="stat-value" id="emotion-confidence">0.5</div>
            <div class="stat-label">Emotion Confidence</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value" id="intent-accuracy">0.8</div>
            <div class="stat-label">Intent Accuracy</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value" id="context-relevance">0.7</div>
            <div class="stat-label">Context Relevance</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value" id="response-adaptation">0.6</div>
            <div class="stat-label">Response Adaptation</div>
          </div>
        </div>

        <div class="experimental-controls">
          <button class="experimental-button" onclick="testEmotionDetection()">
            Emotion Test
          </button>
          
          <button class="experimental-button" onclick="testContextAnalysis()">
            Kontext Test
          </button>
          
          <button class="experimental-button" onclick="testIntentRecognition()">
            Intent Test
          </button>
          
          <button class="experimental-button" onclick="testAdaptiveResponse()">
            Adaptive Antwort
          </button>
        </div>

        <div class="experimental-timeline" id="experimental-timeline">
          <!-- Timeline-Einträge werden dynamisch hinzugefügt -->
        </div>

        <div id="emotion-display" class="emotion-indicator" style="display: none;"></div>
        <div id="context-display" class="context-info" style="display: none;"></div>
        <div id="intent-display" class="intent-visualization" style="display: none;"></div>
        <div id="performance-display" class="performance-metrics" style="display: none;"></div>
        <div id="multilingual-display" class="multilingual-info" style="display: none;"></div>
        <div id="adaptive-display" class="adaptive-response" style="display: none;"></div>
      </div>
    `;
    }
    /**
     * Experimentelle JavaScript-Funktionen generieren
     */
    generateExperimentalJS() {
        return `
      // Experimentelle JavaScript-Funktionen
      
      function testEmotionDetection() {
        const emotions = ['happy', 'sad', 'angry', 'excited', 'confused', 'neutral'];
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        const confidence = Math.random();
        
        showEmotionVisualization(randomEmotion, confidence);
        addTimelineEntry('Emotion Detection Test', randomEmotion);
      }
      
      function testContextAnalysis() {
        const contexts = [
          { project: 'Test Project', file: 'main.ts', expertise: 'intermediate' },
          { project: 'Demo App', file: 'index.js', expertise: 'beginner' },
          { project: 'Production Code', file: 'api.ts', expertise: 'expert' }
        ];
        
        const randomContext = contexts[Math.floor(Math.random() * contexts.length)];
        showContextInfo(randomContext);
        addTimelineEntry('Context Analysis Test', randomContext.project);
      }
      
      function testIntentRecognition() {
        const intents = [
          { primary: 'code_generation', confidence: 0.9 },
          { primary: 'code_review', confidence: 0.8 },
          { primary: 'explanation', confidence: 0.7 }
        ];
        
        const randomIntent = intents[Math.floor(Math.random() * randomIntent.length)];
        showIntentVisualization(randomIntent);
        addTimelineEntry('Intent Recognition Test', randomIntent.primary);
      }
      
      function testAdaptiveResponse() {
        const responses = [
          'Ich helfe Ihnen gerne bei der Code-Generierung!',
          'Lassen Sie mich das für Sie analysieren.',
          'Hier ist eine detaillierte Erklärung...'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const personality = { style: 'helpful', formality: 0.5 };
        
        showAdaptiveResponse(randomResponse, personality);
        addTimelineEntry('Adaptive Response Test', 'Response generated');
      }
      
      function showEmotionVisualization(emotion, confidence) {
        const emotionDisplay = document.getElementById('emotion-display');
        const emotionColors = {
          happy: '#4CAF50', sad: '#2196F3', angry: '#F44336',
          excited: '#FF9800', confused: '#9C27B0', neutral: '#9E9E9E'
        };
        
        emotionDisplay.style.backgroundColor = emotionColors[emotion] || '#9E9E9E';
        emotionDisplay.style.display = 'inline-block';
        emotionDisplay.title = \`Emotion: \${emotion} (Confidence: \${(confidence * 100).toFixed(1)}%)\`;
        
        document.getElementById('emotion-confidence').textContent = (confidence * 100).toFixed(0) + '%';
      }
      
      function showContextInfo(context) {
        const contextDisplay = document.getElementById('context-display');
        contextDisplay.innerHTML = \`
          <strong>Projekt:</strong> \${context.project}<br>
          <strong>Datei:</strong> \${context.file}<br>
          <strong>Expertise:</strong> \${context.expertise}
        \`;
        contextDisplay.style.display = 'block';
      }
      
      function showIntentVisualization(intent) {
        const intentDisplay = document.getElementById('intent-display');
        intentDisplay.innerHTML = \`
          <strong>Intent:</strong> \${intent.primary}<br>
          <strong>Confidence:</strong> \${(intent.confidence * 100).toFixed(1)}%
        \`;
        intentDisplay.style.display = 'block';
        
        document.getElementById('intent-accuracy').textContent = (intent.confidence * 100).toFixed(0) + '%';
      }
      
      function showAdaptiveResponse(response, personality) {
        const adaptiveDisplay = document.getElementById('adaptive-display');
        adaptiveDisplay.innerHTML = \`
          <strong>Adaptive Antwort:</strong><br>
          "\${response}"<br>
          <small>Stil: \${personality.style}, Formalität: \${personality.formality}</small>
        \`;
        adaptiveDisplay.style.display = 'block';
      }
      
      function addTimelineEntry(event, details) {
        const timeline = document.getElementById('experimental-timeline');
        const entry = document.createElement('div');
        entry.className = 'timeline-entry';
        
        const time = new Date().toLocaleTimeString();
        entry.innerHTML = \`
          <span class="timeline-event">\${event}: \${details}</span>
          <span class="timeline-time">\${time}</span>
        \`;
        
        timeline.insertBefore(entry, timeline.firstChild);
        
        // Behalte nur die letzten 10 Einträge
        while (timeline.children.length > 10) {
          timeline.removeChild(timeline.lastChild);
        }
      }
      
      // Event-Listener für Feature-Toggles
      document.addEventListener('DOMContentLoaded', function() {
        const toggles = document.querySelectorAll('.experimental-feature-toggle input');
        toggles.forEach(toggle => {
          toggle.addEventListener('change', function() {
            const feature = this.id;
            const enabled = this.checked;
            addTimelineEntry('Feature Toggle', \`\${feature}: \${enabled ? 'enabled' : 'disabled'}\`);
          });
        });
      });
    `;
    }
}
exports.ExperimentalUI = ExperimentalUI;
//# sourceMappingURL=experimentalUI.js.map