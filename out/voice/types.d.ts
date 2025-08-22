/**
 * Comprehensive TypeScript Types for Guido Voice Control System
 */
export type SupportedLanguage = "de-DE" | "en-US" | "fr-FR" | "es-ES" | "it-IT";
export type ResponseLanguage = "de" | "en" | "fr" | "es" | "it";
export type VoiceGender = "male" | "female" | "neutral";
export type BeepSound = "classic" | "modern" | "sci-fi" | "gentle";
export type TTSEngine = "system" | "azure" | "elevenlabs" | "local";
export type QualityPreset = "low" | "medium" | "high" | "ultra";
export type PersonalityMode = "professional" | "friendly" | "casual" | "technical";
export type Verbosity = "brief" | "medium" | "detailed";
export type TechnicalLevel = "beginner" | "intermediate" | "advanced" | "adaptive";
export type Formality = "formal" | "casual" | "friendly";
export type Theme = "auto" | "dark" | "light";
export type WebviewPosition = "beside" | "active" | "tab";
export type NotificationPosition = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
export type HumorLevel = "none" | "subtle" | "moderate" | "witty";
export type EmpathyLevel = "low" | "medium" | "high";
export type ProactivityLevel = "low" | "medium" | "high";
export interface VoiceLanguageConfig {
    recognition: SupportedLanguage;
    response: ResponseLanguage;
    autoDetect: boolean;
    supportedLanguages: SupportedLanguage[];
}
export interface CustomVoice {
    name: string;
    engine: TTSEngine;
    voiceId: string;
}
export interface VoiceAudioConfig {
    enableBeep: boolean;
    beepSound: BeepSound;
    beepVolume: number;
    beepDuration: number;
    ttsEnabled: boolean;
    ttsEngine: TTSEngine;
    voice: {
        gender: VoiceGender;
        language: SupportedLanguage;
        name: string;
        customVoices: CustomVoice[];
    };
    speed: number;
    pitch: number;
    volume: number;
    pauseBetweenSentences: number;
    noiseReduction: boolean;
    echoCancellation: boolean;
    autoGainControl: boolean;
}
export interface StopWords {
    de: string[];
    en: string[];
    fr: string[];
    es: string[];
}
export interface VoiceRecordingConfig {
    timeoutSeconds: number;
    maxRecordingSeconds: number;
    minRecordingSeconds: number;
    silenceTimeoutSeconds: number;
    stopWords: StopWords;
    sensitivity: number;
    backgroundNoiseLevel: number;
    qualityPreset: QualityPreset;
}
export interface ConfirmationWords {
    de: string[];
    en: string[];
    fr: string[];
    es: string[];
}
export interface VoiceConfirmationConfig {
    required: boolean;
    summaryEnabled: boolean;
    smartConfirmation: boolean;
    confirmWords: ConfirmationWords;
    cancelWords: ConfirmationWords;
    timeoutSeconds: number;
    repeatSummary: boolean;
    askForClarification: boolean;
}
export interface VoiceProcessingConfig {
    contextAwareness: boolean;
    emotionDetection: boolean;
    intentRecognition: boolean;
    multiTurnConversation: boolean;
    memoryEnabled: boolean;
    personalityMode: PersonalityMode;
    grammarCorrection: boolean;
    slangDetection: boolean;
    abbreviationExpansion: boolean;
}
export interface VoiceRoutingRule {
    id: string;
    if: {
        anyKeyword?: string[];
        allKeywords?: string[];
        maxWordCount?: number;
        minWordCount?: number;
        emotion?: string[];
        intent?: string[];
    };
    then: {
        prefer: string[];
        target: "chat" | "completion";
        priority?: number;
    };
}
export interface ResponseStyleConfig {
    verbosity: Verbosity;
    technicalLevel: TechnicalLevel;
    formality: Formality;
}
export interface VoiceRoutingConfig {
    preferFast: boolean;
    maxResponseLength: number;
    skipCodeInTTS: boolean;
    summarizeIfLong: boolean;
    useVoiceOptimizedPrompts: boolean;
    responseStyle: ResponseStyleConfig;
    voiceRules: VoiceRoutingRule[];
}
export interface MicrophoneAccessConfig {
    required: boolean;
    requestOnStartup: boolean;
    showPermissionDialog: boolean;
}
export interface VoicePrivacyConfig {
    storeRecordings: boolean;
    anonymizeTranscripts: boolean;
    localProcessingOnly: boolean;
    encryptStoredData: boolean;
    gdprCompliant: boolean;
    dataRetentionDays: number;
    allowDataCollection: boolean;
    userConsentRequired: boolean;
}
export interface WorkingHoursConfig {
    enabled: boolean;
    startTime: string;
    endTime: string;
    allowWeekends: boolean;
    quietHours: {
        enabled: boolean;
        startTime: string;
        endTime: string;
        reducedVolume: number;
    };
}
export interface VoicePermissionsConfig {
    microphoneAccess: MicrophoneAccessConfig;
    privacy: VoicePrivacyConfig;
    allowedActions: string[];
    restrictedActions: string[];
    workingHours: WorkingHoursConfig;
}
export interface VoiceCommandCategories {
    system: Record<string, string>;
    language: Record<string, string>;
    routing: Record<string, string>;
    vscode: Record<string, string>;
    development: Record<string, string>;
    custom: Record<string, string>;
}
export interface VoiceColorScheme {
    listening: string;
    recording: string;
    processing: string;
    success: string;
    error: string;
}
export interface VoiceWebviewConfig {
    position: WebviewPosition;
    autoHide: boolean;
    minimizeOnStartup: boolean;
    showWaveform: boolean;
    showTranscript: boolean;
}
export interface VoiceNotificationConfig {
    showStartStop: boolean;
    showErrors: boolean;
    showCostWarnings: boolean;
    playAudioNotifications: boolean;
    position: NotificationPosition;
}
export interface VoiceInterfaceConfig {
    showVisualFeedback: boolean;
    animationDuration: number;
    theme: Theme;
    colors: VoiceColorScheme;
    webview: VoiceWebviewConfig;
    notifications: VoiceNotificationConfig;
}
export interface LocalStatsConfig {
    commandCount: boolean;
    recognitionAccuracy: boolean;
    responseTime: boolean;
    modelUsage: boolean;
}
export interface VoiceAnalyticsConfig {
    enabled: boolean;
    trackUsage: boolean;
    trackPerformance: boolean;
    trackErrors: boolean;
    localStats: LocalStatsConfig;
}
export interface PersonalityConfig {
    name: string;
    style: string;
    humor: HumorLevel;
    empathy: EmpathyLevel;
    proactivity: ProactivityLevel;
}
export interface LearningConfig {
    adaptToUser: boolean;
    rememberPreferences: boolean;
    improveRecognition: boolean;
    contextMemoryMinutes: number;
}
export interface IntegrationsConfig {
    calendar: boolean;
    email: boolean;
    tasks: boolean;
    notes: boolean;
}
export interface AdvancedConfig {
    personality: PersonalityConfig;
    learning: LearningConfig;
    integrations: IntegrationsConfig;
}
export interface ErrorRecoveryConfig {
    autoRestart: boolean;
    maxRetries: number;
    fallbackModel: string;
}
export interface EmergencyConfig {
    panicMode: string;
    debugMode: boolean;
    verboseLogging: boolean;
    fallbackToText: boolean;
    errorRecovery: ErrorRecoveryConfig;
}
export interface VoiceConfig {
    enabled: boolean;
    wakeWord: string;
    alternativeWakeWords: string[];
    language: VoiceLanguageConfig;
    audio: VoiceAudioConfig;
    recording: VoiceRecordingConfig;
    confirmation: VoiceConfirmationConfig;
    processing: VoiceProcessingConfig;
    routing: VoiceRoutingConfig;
    permissions: VoicePermissionsConfig;
    commands: VoiceCommandCategories;
    interface: VoiceInterfaceConfig;
    analytics: VoiceAnalyticsConfig;
    advanced: AdvancedConfig;
    emergency: EmergencyConfig;
}
export type VoiceState = "idle" | "listening" | "recording" | "processing" | "confirming" | "responding" | "error" | "muted" | "disabled";
export interface VoiceEvent {
    type: "wakeWordDetected" | "recordingStarted" | "recordingStopped" | "transcriptReady" | "confirmationRequired" | "confirmed" | "cancelled" | "responseReady" | "error" | "stateChanged";
    data?: any;
    timestamp: number;
}
export interface VoiceTranscript {
    text: string;
    confidence: number;
    language: SupportedLanguage;
    duration: number;
    startTime: number;
    endTime: number;
    isComplete: boolean;
    emotions?: string[];
    intent?: string;
    entities?: Record<string, any>;
}
export interface VoiceResponse {
    text: string;
    audio?: ArrayBuffer;
    shouldSpeak: boolean;
    metadata: {
        model: string;
        provider: string;
        cost: number;
        duration: number;
        tokens: {
            input: number;
            output: number;
        };
    };
}
export interface VoiceSession {
    id: string;
    startTime: number;
    endTime?: number;
    transcripts: VoiceTranscript[];
    responses: VoiceResponse[];
    state: VoiceState;
    language: SupportedLanguage;
    context: Record<string, any>;
}
export interface VoiceStats {
    totalSessions: number;
    totalDuration: number;
    averageSessionDuration: number;
    recognitionAccuracy: number;
    commandsExecuted: number;
    errorsCount: number;
    mostUsedCommands: Array<{
        command: string;
        count: number;
    }>;
    languageUsage: Record<SupportedLanguage, number>;
    responseTime: {
        average: number;
        p95: number;
        p99: number;
    };
}
export interface VoiceRoutingContext {
    transcript: string;
    confidence: number;
    language: SupportedLanguage;
    emotion?: string;
    intent?: string;
    sessionContext: any[];
    userPreferences: Record<string, any>;
    environmentContext: {
        currentFile?: string;
        selectedText?: string;
        openTabs?: string[];
        workspaceLanguage?: string;
    };
}
export interface PermissionStatus {
    microphone: "granted" | "denied" | "prompt" | "not-supported";
    notifications: "granted" | "denied" | "default";
    fullscreen: "granted" | "denied" | "prompt";
}
export interface AudioContext {
    sampleRate: number;
    channelCount: number;
    bitDepth: number;
    deviceId?: string;
    deviceLabel?: string;
}
export interface TTSOptions {
    text: string;
    voice?: string;
    language?: SupportedLanguage;
    speed?: number;
    pitch?: number;
    volume?: number;
    emotion?: string;
    style?: string;
}
export interface VoiceCommandHandler {
    id: string;
    patterns: string[];
    languages: SupportedLanguage[];
    handler: (context: VoiceRoutingContext) => Promise<VoiceResponse>;
    permissions?: string[];
    description: string;
    examples: string[];
}
export interface WakeWordConfig {
    sensitivity: number;
    continuous: boolean;
    timeout: number;
    cooldownMs: number;
    requireExactMatch: boolean;
    allowVariations: boolean;
}
export interface VoiceEngine {
    initialize(config: VoiceConfig): Promise<void>;
    startListening(): Promise<void>;
    stopListening(): Promise<void>;
    processTranscript(transcript: VoiceTranscript): Promise<VoiceResponse>;
    speak(options: TTSOptions): Promise<void>;
    getState(): VoiceState;
    getStats(): VoiceStats;
    destroy(): Promise<void>;
}
//# sourceMappingURL=types.d.ts.map