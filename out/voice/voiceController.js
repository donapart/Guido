"use strict";
/**
 * Guido Voice Controller - Hauptsteuerung für Spracherkennung
 * Verwaltet Wake Word Detection, Recording, Processing und TTS
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
exports.VoiceController = void 0;
const vscode = __importStar(require("vscode"));
const voiceWebviewProvider_1 = require("./webview/voiceWebviewProvider");
const voiceCommandProcessor_1 = require("./commands/voiceCommandProcessor");
const voicePermissionManager_1 = require("./permissions/voicePermissionManager");
const audioManager_1 = require("./audio/audioManager");
class VoiceController {
    context;
    state = "idle";
    config;
    webviewProvider;
    commandProcessor;
    permissionManager;
    audioManager;
    router;
    // Session Management
    currentSession;
    eventListeners = new Map();
    stats;
    // State Management
    isInitialized = false;
    wakeLockRequest;
    recognitionTimeout;
    confirmationTimeout;
    constructor(context, config, router) {
        this.context = context;
        this.config = config;
        this.router = router;
        this.stats = this.initializeStats();
        // Initialize components
        this.webviewProvider = new voiceWebviewProvider_1.VoiceWebviewProvider(context, config);
        this.commandProcessor = new voiceCommandProcessor_1.VoiceCommandProcessor(config, router);
        this.permissionManager = new voicePermissionManager_1.VoicePermissionManager(config);
        this.audioManager = new audioManager_1.AudioManager(config);
        // Setup event handlers
        this.setupEventHandlers();
    }
    /**
     * Initialize the voice control system
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // 1. Check and request permissions
            const permissions = await this.permissionManager.requestAllPermissions();
            if (!permissions.microphone || permissions.microphone !== "granted") {
                throw new Error("Mikrofon-Berechtigung erforderlich");
            }
            // 2. Initialize audio system
            await this.audioManager.initialize();
            // 3. Initialize webview
            await this.webviewProvider.initialize();
            // 4. Setup wake word detection
            await this.setupWakeWordDetection();
            // 5. Register command handlers
            await this.registerDefaultCommands();
            // 6. Start listening if auto-start enabled
            if (this.config.permissions.microphoneAccess.requestOnStartup) {
                await this.startListening();
            }
            this.isInitialized = true;
            this.setState("idle");
            vscode.window.showInformationMessage("🎤 Guido Voice Control ist bereit!");
        }
        catch (error) {
            this.handleError("Initialization failed", error);
            throw error;
        }
    }
    /**
     * Start voice control (begins listening for wake word)
     */
    async startListening() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        if (this.state === "listening") {
            return;
        }
        try {
            // Check working hours
            if (!this.isWithinWorkingHours()) {
                if (this.config.permissions.workingHours.quietHours.enabled) {
                    this.audioManager.setVolume(this.config.permissions.workingHours.quietHours.reducedVolume);
                }
            }
            // Start wake word detection
            await this.webviewProvider.sendMessage({
                command: "startWakeWordDetection",
                config: {
                    wakeWord: this.config.wakeWord,
                    alternativeWakeWords: this.config.alternativeWakeWords,
                    language: this.config.language.recognition,
                    sensitivity: 0.8
                }
            });
            this.setState("listening");
            if (this.config.interface.notifications.showStartStop) {
                this.showNotification(`🎤 Höre auf "${this.config.wakeWord}"...`);
            }
        }
        catch (error) {
            this.handleError("Failed to start listening", error);
        }
    }
    /**
     * Stop voice control
     */
    async stopListening() {
        try {
            await this.webviewProvider.sendMessage({ command: "stopListening" });
            this.clearTimeouts();
            this.setState("idle");
            if (this.config.interface.notifications.showStartStop) {
                this.showNotification("🛑 Voice Control gestoppt");
            }
        }
        catch (error) {
            this.handleError("Failed to stop listening", error);
        }
    }
    /**
     * Handle wake word detection
     */
    async onWakeWordDetected() {
        try {
            // Play confirmation beep
            if (this.config.audio.enableBeep) {
                await this.audioManager.playBeep(this.config.audio.beepSound, this.config.audio.beepVolume, this.config.audio.beepDuration);
            }
            // Start recording session
            this.startSession();
            await this.startRecording();
        }
        catch (error) {
            this.handleError("Wake word handling failed", error);
        }
    }
    /**
     * Start recording user input
     */
    async startRecording() {
        this.setState("recording");
        const recordingConfig = {
            maxDuration: this.config.recording.maxRecordingSeconds * 1000,
            timeout: this.config.recording.timeoutSeconds * 1000,
            silenceTimeout: this.config.recording.silenceTimeoutSeconds * 1000,
            language: this.config.language.recognition,
            stopWords: this.config.recording.stopWords
        };
        await this.webviewProvider.sendMessage({
            command: "startRecording",
            config: recordingConfig
        });
        // Set recording timeout
        this.recognitionTimeout = setTimeout(() => {
            this.onRecordingTimeout();
        }, recordingConfig.timeout);
        this.showNotification("🔴 Aufnahme läuft - sagen Sie 'stop' zum Beenden");
    }
    /**
     * Stop recording and process transcript
     */
    async onRecordingStopped(transcript, confidence = 1.0) {
        this.clearTimeouts();
        this.setState("processing");
        try {
            // Create transcript object
            const voiceTranscript = {
                text: transcript,
                confidence,
                language: this.config.language.recognition,
                duration: 0, // Will be set by audio manager
                startTime: Date.now() - 5000, // Approximate
                endTime: Date.now(),
                isComplete: true
            };
            // Add to current session
            if (this.currentSession) {
                this.currentSession.transcripts.push(voiceTranscript);
            }
            // Process the transcript
            await this.processTranscript(voiceTranscript);
        }
        catch (error) {
            this.handleError("Recording processing failed", error);
        }
    }
    /**
     * Process voice transcript
     */
    async processTranscript(transcript) {
        try {
            this.showNotification("🧠 Verarbeite Eingabe...");
            // Create routing context
            const routingContext = {
                transcript: transcript.text,
                confidence: transcript.confidence,
                language: transcript.language,
                emotion: transcript.emotions?.[0],
                intent: transcript.intent,
                sessionContext: this.currentSession?.transcripts || [],
                userPreferences: this.getUserPreferences(),
                environmentContext: await this.getEnvironmentContext()
            };
            // Check for direct commands first
            const commandResponse = await this.commandProcessor.processCommand(routingContext);
            if (commandResponse) {
                await this.handleResponse(commandResponse);
                return;
            }
            // Generate summary if required
            if (this.config.confirmation.summaryEnabled) {
                const summary = await this.generateSummary(transcript.text);
                if (this.shouldRequireConfirmation(transcript.text)) {
                    await this.requestConfirmation(summary, transcript.text);
                    return;
                }
            }
            // Process with AI model
            const response = await this.generateAIResponse(routingContext);
            await this.handleResponse(response);
        }
        catch (error) {
            this.handleError("Transcript processing failed", error);
        }
    }
    /**
     * Generate AI response using routing
     */
    async generateAIResponse(context) {
        try {
            // Create voice-optimized prompt
            const prompt = this.createVoiceOptimizedPrompt(context);
            // Route to appropriate model
            const routingResult = await this.router.route({
                prompt,
                mode: this.config.routing.preferFast ? "speed" : "auto",
                lang: this.getLanguageFromContext(context),
                metadata: {
                    isVoiceInput: true,
                    language: context.language,
                    confidence: context.confidence
                }
            });
            // Generate response
            const startTime = Date.now();
            const aiResult = await routingResult.provider.chatComplete(routingResult.modelName, [{ role: "user", content: prompt }], {
                maxTokens: this.calculateMaxTokens(),
                temperature: 0.7
            });
            const duration = Date.now() - startTime;
            // Create voice response
            const response = {
                text: aiResult.content,
                shouldSpeak: this.config.audio.ttsEnabled,
                metadata: {
                    model: routingResult.modelName,
                    provider: routingResult.providerId,
                    cost: 0, // Will be calculated by price manager
                    duration,
                    tokens: {
                        input: aiResult.usage?.inputTokens || 0,
                        output: aiResult.usage?.outputTokens || 0
                    }
                }
            };
            return response;
        }
        catch (error) {
            throw new Error(`AI response generation failed: ${error.message}`);
        }
    }
    /**
     * Handle AI response (display and/or speak)
     */
    async handleResponse(response) {
        try {
            // Add to current session
            if (this.currentSession) {
                this.currentSession.responses.push(response);
            }
            // Display in webview
            await this.webviewProvider.sendMessage({
                command: "showResponse",
                data: {
                    text: response.text,
                    metadata: response.metadata
                }
            });
            // Speak if enabled
            if (response.shouldSpeak && this.config.audio.ttsEnabled) {
                await this.speakResponse(response.text);
            }
            // Update stats
            this.updateStats(response);
            this.setState("idle");
            this.endSession();
            // Return to listening mode
            if (this.config.processing.multiTurnConversation) {
                setTimeout(() => {
                    this.startListening();
                }, 2000);
            }
        }
        catch (error) {
            this.handleError("Response handling failed", error);
        }
    }
    /**
     * Speak text using TTS
     */
    async speakResponse(text) {
        try {
            // Filter out code blocks if configured
            let spokenText = text;
            if (this.config.routing.skipCodeInTTS) {
                spokenText = spokenText.replace(/```[\s\S]*?```/g, "[Code-Block]");
                spokenText = spokenText.replace(/`[^`]*`/g, "[Code]");
            }
            // Limit length
            if (spokenText.length > this.config.routing.maxResponseLength) {
                spokenText = spokenText.substring(0, this.config.routing.maxResponseLength) +
                    "... Vollständige Antwort im Editor sichtbar.";
            }
            // Use audio manager for TTS
            await this.audioManager.speak({
                text: spokenText,
                language: this.config.language.response,
                voice: this.config.audio.voice.name,
                speed: this.config.audio.speed,
                pitch: this.config.audio.pitch,
                volume: this.config.audio.volume
            });
        }
        catch (error) {
            console.warn("TTS failed:", error);
        }
    }
    /**
     * Request confirmation for action
     */
    async requestConfirmation(summary, originalText) {
        this.setState("confirming");
        const confirmationText = `Ich habe verstanden: ${summary}. Soll ich das ausführen?`;
        // Display confirmation
        await this.webviewProvider.sendMessage({
            command: "showConfirmation",
            data: {
                summary,
                originalText,
                confirmationText
            }
        });
        // Speak confirmation
        if (this.config.audio.ttsEnabled) {
            await this.speakResponse(confirmationText);
        }
        // Wait for confirmation
        this.confirmationTimeout = setTimeout(() => {
            this.onConfirmationTimeout();
        }, this.config.confirmation.timeoutSeconds * 1000);
        // Start listening for confirmation
        await this.webviewProvider.sendMessage({
            command: "listenForConfirmation",
            config: {
                confirmWords: this.config.confirmation.confirmWords,
                cancelWords: this.config.confirmation.cancelWords,
                language: this.config.language.recognition
            }
        });
    }
    /**
     * Handle confirmation response
     */
    async onConfirmationReceived(confirmed, text) {
        this.clearTimeouts();
        if (confirmed) {
            // Process the original command
            const transcript = {
                text,
                confidence: 1.0,
                language: this.config.language.recognition,
                duration: 0,
                startTime: Date.now(),
                endTime: Date.now(),
                isComplete: true
            };
            await this.processTranscript(transcript);
        }
        else {
            // Cancel operation
            this.setState("idle");
            this.showNotification("❌ Aktion abgebrochen");
            if (this.config.audio.ttsEnabled) {
                await this.speakResponse("Aktion abgebrochen.");
            }
        }
    }
    /**
     * Generate summary of user input
     */
    async generateSummary(text) {
        const summaryPrompt = `Erstelle eine kurze, klare Zusammenfassung dieser Benutzeranfrage in einem Satz:

"${text}"

Antworten Sie nur mit der Zusammenfassung, ohne zusätzliche Erklärungen.`;
        try {
            const result = await this.router.route({
                prompt: summaryPrompt,
                mode: "speed",
                metadata: { isVoiceInput: true, type: "summary" }
            });
            const response = await result.provider.chatComplete(result.modelName, [{ role: "user", content: summaryPrompt }], { maxTokens: 100, temperature: 0.3 });
            return response.content.trim();
        }
        catch (error) {
            return `Zusammenfassung: ${text.substring(0, 100)}...`;
        }
    }
    /**
     * Create voice-optimized prompt
     */
    createVoiceOptimizedPrompt(context) {
        const basePrompt = context.transcript;
        if (!this.config.routing.useVoiceOptimizedPrompts) {
            return basePrompt;
        }
        const languageInstruction = this.config.language.response === 'de'
            ? 'deutscher' : 'englischer';
        const voiceOptimizedPrompt = `${basePrompt}

SPRACHSTEUERUNG-KONTEXT:
- Dies ist eine Spracheingabe über Guido Voice Control
- Antworten Sie in ${languageInstruction} Sprache
- Verwenden Sie natürliche, gesprochene Sprache
- Halten Sie die Antwort unter ${this.config.routing.maxResponseLength} Zeichen
- Strukturieren Sie klar und verständlich
- Bei Code: Kurz erklären, dann separat zeigen
- Vermeiden Sie komplexe technische Details außer explizit gefragt

Persönlichkeit: ${this.config.advanced.personality.style}
Ausführlichkeit: ${this.config.routing.responseStyle.verbosity}
Formalität: ${this.config.routing.responseStyle.formality}`;
        return voiceOptimizedPrompt;
    }
    // Event Handling
    setupEventHandlers() {
        // Webview message handling
        this.webviewProvider.onMessage((message) => {
            this.handleWebviewMessage(message);
        });
        // Cleanup on extension deactivation
        this.context.subscriptions.push({
            dispose: () => {
                this.destroy();
            }
        });
    }
    async handleWebviewMessage(message) {
        try {
            switch (message.command) {
                case "wakeWordDetected":
                    await this.onWakeWordDetected();
                    break;
                case "recordingStopped":
                    await this.onRecordingStopped(message.transcript, message.confidence);
                    break;
                case "confirmationReceived":
                    await this.onConfirmationReceived(message.confirmed, message.originalText);
                    break;
                case "error":
                    this.handleError("Webview error", new Error(message.error));
                    break;
                case "stateChanged":
                    this.emitEvent({ type: "stateChanged", data: message.state, timestamp: Date.now() });
                    break;
            }
        }
        catch (error) {
            this.handleError("Message handling failed", error);
        }
    }
    // Utility Methods
    setState(newState) {
        const oldState = this.state;
        this.state = newState;
        if (this.currentSession) {
            this.currentSession.state = newState;
        }
        this.emitEvent({
            type: "stateChanged",
            data: { from: oldState, to: newState },
            timestamp: Date.now()
        });
        // Update webview
        this.webviewProvider.sendMessage({
            command: "stateChanged",
            state: newState
        });
    }
    startSession() {
        this.currentSession = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            transcripts: [],
            responses: [],
            state: this.state,
            language: this.config.language.recognition,
            context: {}
        };
        this.stats.totalSessions++;
    }
    endSession() {
        if (this.currentSession) {
            this.currentSession.endTime = Date.now();
            const duration = this.currentSession.endTime - this.currentSession.startTime;
            this.stats.totalDuration += duration;
            this.currentSession = undefined;
        }
    }
    clearTimeouts() {
        if (this.recognitionTimeout) {
            clearTimeout(this.recognitionTimeout);
            this.recognitionTimeout = undefined;
        }
        if (this.confirmationTimeout) {
            clearTimeout(this.confirmationTimeout);
            this.confirmationTimeout = undefined;
        }
    }
    onRecordingTimeout() {
        this.showNotification("⏰ Aufnahme-Timeout erreicht");
        this.setState("idle");
    }
    onConfirmationTimeout() {
        this.showNotification("⏰ Bestätigung-Timeout erreicht");
        this.setState("idle");
    }
    handleError(context, error) {
        console.error(`Voice Controller Error [${context}]:`, error);
        this.stats.errorsCount++;
        this.setState("error");
        if (this.config.interface.notifications.showErrors) {
            this.showNotification(`❌ ${context}: ${error.message}`);
        }
        // Auto-recovery
        if (this.config.emergency.errorRecovery.autoRestart) {
            setTimeout(() => {
                this.recover();
            }, 2000);
        }
    }
    async recover() {
        try {
            this.clearTimeouts();
            this.endSession();
            this.setState("idle");
            if (this.config.emergency.fallbackToText) {
                this.showNotification("🔄 Wechsel zu Text-Chat-Modus");
                vscode.commands.executeCommand("modelRouter.chat");
            }
            else {
                await this.startListening();
            }
        }
        catch (error) {
            console.error("Recovery failed:", error);
        }
    }
    showNotification(message) {
        if (this.config.interface.notifications.playAudioNotifications) {
            this.audioManager.playNotificationSound("info");
        }
        vscode.window.showInformationMessage(message);
    }
    // Public API
    async destroy() {
        try {
            await this.stopListening();
            this.clearTimeouts();
            this.endSession();
            await this.audioManager.destroy();
            await this.webviewProvider.destroy();
            this.eventListeners.clear();
        }
        catch (error) {
            console.error("Voice controller cleanup failed:", error);
        }
    }
    getState() {
        return this.state;
    }
    getStats() {
        return { ...this.stats };
    }
    getCurrentSession() {
        return this.currentSession;
    }
    // Event System
    addEventListener(eventType, listener) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(listener);
    }
    removeEventListener(eventType, listener) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    emitEvent(event) {
        const listeners = this.eventListeners.get(event.type);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(event);
                }
                catch (error) {
                    console.error("Event listener error:", error);
                }
            });
        }
    }
    // Helper methods
    initializeStats() {
        return {
            totalSessions: 0,
            totalDuration: 0,
            averageSessionDuration: 0,
            recognitionAccuracy: 0,
            commandsExecuted: 0,
            errorsCount: 0,
            mostUsedCommands: [],
            languageUsage: {},
            responseTime: {
                average: 0,
                p95: 0,
                p99: 0
            }
        };
    }
    generateSessionId() {
        return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getUserPreferences() {
        // Load from VS Code settings or local storage
        return {};
    }
    async getEnvironmentContext() {
        const editor = vscode.window.activeTextEditor;
        return {
            currentFile: editor?.document.fileName,
            selectedText: editor?.document.getText(editor.selection),
            workspaceLanguage: editor?.document.languageId,
            openTabs: vscode.window.tabGroups.all.flatMap(group => group.tabs.map(tab => tab.input?.uri?.fsPath).filter(Boolean))
        };
    }
    shouldRequireConfirmation(text) {
        if (!this.config.confirmation.required) {
            return false;
        }
        if (this.config.confirmation.smartConfirmation) {
            // Use AI to determine if confirmation is needed
            const dangerousKeywords = ["delete", "remove", "drop", "truncate", "format", "reset"];
            return dangerousKeywords.some(keyword => text.toLowerCase().includes(keyword));
        }
        return true;
    }
    isWithinWorkingHours() {
        if (!this.config.permissions.workingHours.enabled) {
            return true;
        }
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;
        if (isWeekend && !this.config.permissions.workingHours.allowWeekends) {
            return false;
        }
        const [startHour, startMin] = this.config.permissions.workingHours.startTime.split(':').map(Number);
        const [endHour, endMin] = this.config.permissions.workingHours.endTime.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        return currentTime >= startTime && currentTime <= endTime;
    }
    getLanguageFromContext(context) {
        return context.environmentContext.workspaceLanguage || 'typescript';
    }
    calculateMaxTokens() {
        return Math.max(100, Math.min(500, this.config.routing.maxResponseLength / 3));
    }
    updateStats(response) {
        this.stats.commandsExecuted++;
        // Update response time statistics
        const responseTime = response.metadata.duration;
        this.stats.responseTime.average =
            (this.stats.responseTime.average * (this.stats.commandsExecuted - 1) + responseTime) /
                this.stats.commandsExecuted;
    }
    async registerDefaultCommands() {
        // Register built-in voice commands
        const defaultCommands = [
            {
                id: "system.mute",
                patterns: ["mikrofon stumm", "mute", "stumm schalten"],
                languages: ["de-DE", "en-US"],
                handler: async () => {
                    await this.audioManager.mute();
                    return {
                        text: "Mikrofon stummgeschaltet",
                        shouldSpeak: false,
                        metadata: { model: "system", provider: "system", cost: 0, duration: 0, tokens: { input: 0, output: 0 } }
                    };
                },
                permissions: ["audioControl"],
                description: "Mikrofon stummschalten",
                examples: ["Mikrofon stumm", "mute"]
            },
            {
                id: "system.unmute",
                patterns: ["mikrofon an", "unmute", "mikrofon aktivieren"],
                languages: ["de-DE", "en-US"],
                handler: async () => {
                    await this.audioManager.unmute();
                    return {
                        text: "Mikrofon aktiviert",
                        shouldSpeak: true,
                        metadata: { model: "system", provider: "system", cost: 0, duration: 0, tokens: { input: 0, output: 0 } }
                    };
                },
                permissions: ["audioControl"],
                description: "Mikrofon aktivieren",
                examples: ["Mikrofon an", "unmute"]
            }
        ];
        for (const command of defaultCommands) {
            this.commandProcessor.registerHandler(command);
        }
    }
}
exports.VoiceController = VoiceController;
//# sourceMappingURL=voiceController.js.map