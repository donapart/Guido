/**
 * Guido Voice Controller - Hauptsteuerung für Spracherkennung
 * Verwaltet Wake Word Detection, Recording, Processing und TTS
 */
import * as vscode from "vscode";
import { VoiceConfig, VoiceState, VoiceEvent, VoiceSession, VoiceStats } from "./types";
import { ModelRouter } from "../router";
export declare class VoiceController {
    private context;
    private state;
    private config;
    private webviewProvider;
    private commandProcessor;
    private permissionManager;
    private audioManager;
    private router;
    private currentSession?;
    private eventListeners;
    private stats;
    private isInitialized;
    private wakeLockRequest?;
    private recognitionTimeout?;
    private confirmationTimeout?;
    constructor(context: vscode.ExtensionContext, config: VoiceConfig, router: ModelRouter);
    /**
     * Initialize the voice control system
     */
    initialize(): Promise<void>;
    /**
     * Start voice control (begins listening for wake word)
     */
    startListening(): Promise<void>;
    /**
     * Stop voice control
     */
    stopListening(): Promise<void>;
    /**
     * Handle wake word detection
     */
    onWakeWordDetected(): Promise<void>;
    /**
     * Start recording user input
     */
    private startRecording;
    /**
     * Stop recording and process transcript
     */
    onRecordingStopped(transcript: string, confidence?: number): Promise<void>;
    /**
     * Process voice transcript
     */
    private processTranscript;
    /**
     * Generate AI response using routing
     */
    private generateAIResponse;
    /**
     * Handle AI response (display and/or speak)
     */
    private handleResponse;
    /**
     * Speak text using TTS
     */
    private speakResponse;
    /**
     * Request confirmation for action
     */
    private requestConfirmation;
    /**
     * Handle confirmation response
     */
    onConfirmationReceived(confirmed: boolean, text: string): Promise<void>;
    /**
     * Generate summary of user input
     */
    private generateSummary;
    /**
     * Create voice-optimized prompt
     */
    private createVoiceOptimizedPrompt;
    private setupEventHandlers;
    private handleWebviewMessage;
    private setState;
    private startSession;
    private endSession;
    private clearTimeouts;
    private onRecordingTimeout;
    private onConfirmationTimeout;
    private handleError;
    private recover;
    private showNotification;
    destroy(): Promise<void>;
    getState(): VoiceState;
    getStats(): VoiceStats;
    getCurrentSession(): VoiceSession | undefined;
    addEventListener(eventType: string, listener: (event: VoiceEvent) => void): void;
    removeEventListener(eventType: string, listener: (event: VoiceEvent) => void): void;
    private emitEvent;
    private initializeStats;
    private generateSessionId;
    private getUserPreferences;
    private getEnvironmentContext;
    private shouldRequireConfirmation;
    private isWithinWorkingHours;
    private getLanguageFromContext;
    private calculateMaxTokens;
    private updateStats;
    private registerDefaultCommands;
}
//# sourceMappingURL=voiceController.d.ts.map