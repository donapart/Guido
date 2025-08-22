/**
 * Comprehensive TypeScript Types for Guido Voice Control System
 */

export type SupportedLanguage = "de-DE" | "en-US" | "fr-FR" | "es-ES" | "it-IT";
export type ResponseLanguage = "de" | "en" | "fr" | "es" | "it";
export type VoiceGender = "male" | "female" | "neutral";
export type BeepSound = "classic" | "modern" | "sci-fi" | "gentle" | "off";
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

// Sprach-Konfiguration Interface
export interface VoiceLanguageConfig {
  recognition: SupportedLanguage;
  response: ResponseLanguage;
  autoDetect: boolean;
  supportedLanguages: SupportedLanguage[];
}

// Custom Voice Definition
export interface CustomVoice {
  name: string;
  engine: TTSEngine;
  voiceId: string;
}

// Audio & TTS Konfiguration
export interface VoiceAudioConfig {
  // Bestätigungstöne
  enableBeep: boolean;
  beepSound: BeepSound;
  beepVolume: number; // 0.0-1.0
  beepDuration: number; // Millisekunden
  
  // Text-to-Speech
  ttsEnabled: boolean;
  ttsEngine: TTSEngine;
  voice: {
    gender: VoiceGender;
    language: SupportedLanguage;
    name: string;
    customVoices: CustomVoice[];
  };
  speed: number; // 0.5-2.0
  pitch: number; // 0.5-2.0
  volume: number; // 0.0-1.0
  pauseBetweenSentences: number; // ms
  
  // Audio-Verarbeitung
  noiseReduction: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
}

// Stop-Wörter pro Sprache
export interface StopWords {
  de: string[];
  en: string[];
  fr: string[];
  es: string[];
}

// Aufnahme-Konfiguration
export interface VoiceRecordingConfig {
  timeoutSeconds: number;
  maxRecordingSeconds: number;
  minRecordingSeconds: number;
  silenceTimeoutSeconds: number;
  stopWords: StopWords;
  sensitivity: number; // 0.0-1.0
  backgroundNoiseLevel: number; // 0.0-1.0
  qualityPreset: QualityPreset;
}

// Bestätigungs-Wörter pro Sprache
export interface ConfirmationWords {
  de: string[];
  en: string[];
  fr: string[];
  es: string[];
}

// Bestätigungs-Konfiguration
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

// Intelligente Sprachverarbeitung
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

// Voice-Routing-Regel
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

// Response-Style-Konfiguration
export interface ResponseStyleConfig {
  verbosity: Verbosity;
  technicalLevel: TechnicalLevel;
  formality: Formality;
}

// Voice-Routing-Konfiguration
export interface VoiceRoutingConfig {
  preferFast: boolean;
  maxResponseLength: number;
  skipCodeInTTS: boolean;
  summarizeIfLong: boolean;
  useVoiceOptimizedPrompts: boolean;
  responseStyle: ResponseStyleConfig;
  voiceRules: VoiceRoutingRule[];
}

// Mikrofon-Zugriff-Konfiguration
export interface MicrophoneAccessConfig {
  required: boolean;
  requestOnStartup: boolean;
  showPermissionDialog: boolean;
}

// Datenschutz-Konfiguration
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

// Arbeitszeit-Beschränkungen
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

// Berechtigungs-System
export interface VoicePermissionsConfig {
  microphoneAccess: MicrophoneAccessConfig;
  privacy: VoicePrivacyConfig;
  allowedActions: string[];
  restrictedActions: string[];
  workingHours: WorkingHoursConfig;
}

// Kommando-Kategorien
export interface VoiceCommandCategories {
  system: Record<string, string>;
  language: Record<string, string>;
  routing: Record<string, string>;
  vscode: Record<string, string>;
  development: Record<string, string>;
  custom: Record<string, string>;
}

// Farb-Schema
export interface VoiceColorScheme {
  listening: string;
  recording: string;
  processing: string;
  success: string;
  error: string;
}

// Webview-Einstellungen
export interface VoiceWebviewConfig {
  position: WebviewPosition;
  autoHide: boolean;
  minimizeOnStartup: boolean;
  showWaveform: boolean;
  showTranscript: boolean;
}

// Benachrichtigungs-Einstellungen
export interface VoiceNotificationConfig {
  showStartStop: boolean;
  showErrors: boolean;
  showCostWarnings: boolean;
  playAudioNotifications: boolean;
  position: NotificationPosition;
}

// UI & UX Interface
export interface VoiceInterfaceConfig {
  showVisualFeedback: boolean;
  animationDuration: number;
  theme: Theme;
  colors: VoiceColorScheme;
  webview: VoiceWebviewConfig;
  notifications: VoiceNotificationConfig;
}

// Lokale Statistiken
export interface LocalStatsConfig {
  commandCount: boolean;
  recognitionAccuracy: boolean;
  responseTime: boolean;
  modelUsage: boolean;
}

// Analytics-Konfiguration
export interface VoiceAnalyticsConfig {
  enabled: boolean;
  trackUsage: boolean;
  trackPerformance: boolean;
  trackErrors: boolean;
  localStats: LocalStatsConfig;
}

// KI-Persönlichkeit
export interface PersonalityConfig {
  name: string;
  style: string;
  humor: HumorLevel;
  empathy: EmpathyLevel;
  proactivity: ProactivityLevel;
}

// Lern-Konfiguration
export interface LearningConfig {
  adaptToUser: boolean;
  rememberPreferences: boolean;
  improveRecognition: boolean;
  contextMemoryMinutes: number;
}

// Tool-Integrationen
export interface IntegrationsConfig {
  calendar: boolean;
  email: boolean;
  tasks: boolean;
  notes: boolean;
}

// Erweiterte Funktionen
export interface AdvancedConfig {
  personality: PersonalityConfig;
  learning: LearningConfig;
  integrations: IntegrationsConfig;
}

// Fehlerbehandlung
export interface ErrorRecoveryConfig {
  autoRestart: boolean;
  maxRetries: number;
  fallbackModel: string;
}

// Notfall & Debugging
export interface EmergencyConfig {
  panicMode: string;
  debugMode: boolean;
  verboseLogging: boolean;
  fallbackToText: boolean;
  errorRecovery: ErrorRecoveryConfig;
}

// Hauptkonfiguration Interface
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

// Voice State Management
export type VoiceState = 
  | "idle"          // Bereit, hört auf Wake Word
  | "listening"     // Hört auf Wake Word
  | "recording"     // Nimmt Benutzerinput auf
  | "processing"    // Verarbeitet Input
  | "confirming"    // Wartet auf Bestätigung
  | "responding"    // Gibt Antwort aus
  | "error"         // Fehlerzustand
  | "muted"         // Stummgeschaltet
  | "disabled";     // Deaktiviert

// Voice-Ereignisse
export interface VoiceEvent {
  type: "wakeWordDetected" | "recordingStarted" | "recordingStopped" | "transcriptReady" 
        | "confirmationRequired" | "confirmed" | "cancelled" | "responseReady" 
        | "error" | "stateChanged";
  data?: any;
  timestamp: number;
}

// Transcript mit Metadaten
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

// Voice-Response
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

// Voice-Session
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

// Voice-Statistiken
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

// Voice-Kontext für Routing
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

// Permission-Status
export interface PermissionStatus {
  microphone: "granted" | "denied" | "prompt" | "not-supported";
  notifications: "granted" | "denied" | "default";
  fullscreen: "granted" | "denied" | "prompt";
}

// Audio-Kontext
export interface AudioContext {
  sampleRate: number;
  channelCount: number;
  bitDepth: number;
  deviceId?: string;
  deviceLabel?: string;
}

// TTS-Konfiguration für eine spezifische Ausgabe
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

// Voice-Command-Handler
export interface VoiceCommandHandler {
  id: string;
  patterns: string[];
  languages: SupportedLanguage[];
  handler: (context: VoiceRoutingContext) => Promise<VoiceResponse>;
  permissions?: string[];
  description: string;
  examples: string[];
}

// Wake-Word-Detection-Konfiguration
export interface WakeWordConfig {
  sensitivity: number; // 0.0-1.0
  continuous: boolean;
  timeout: number;
  cooldownMs: number;
  requireExactMatch: boolean;
  allowVariations: boolean;
}

// Voice-Engine-Interface
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
