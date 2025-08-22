/**
 * Configuration loader and validation for Model Router with Voice Support
 */

import * as fs from "node:fs";
import * as path from "node:path";
import YAML from "yaml";

export interface ModelPrice {
  inputPerMTok: number;
  outputPerMTok: number;
  cachedInputPerMTok?: number;
}

export interface ModelConfig {
  name: string;
  context?: number;
  caps?: string[];
  price?: ModelPrice;
}

export interface ProviderConfig {
  id: string;
  kind: "openai-compat" | "ollama";
  baseUrl: string;
  apiKeyRef?: string;
  organizationId?: string;
  models: ModelConfig[];
  timeout?: number;
  maxRetries?: number;
  defaultHeaders?: Record<string, string>;
  keepAlive?: string; // For Ollama
}

export interface RoutingRule {
  id: string;
  if: {
    anyKeyword?: string[];
    allKeywords?: string[];
    fileLangIn?: string[];
    filePathMatches?: string[];
    minContextKB?: number;
    maxContextKB?: number;
    privacyStrict?: boolean;
    mode?: string[];
  };
  then: {
    prefer: string[]; // "providerId:modelName" format
    target: "chat" | "completion";
    priority?: number;
  };
}

export interface BudgetConfig {
  dailyUSD?: number;
  monthlyUSD?: number;
  hardStop?: boolean;
  warningThreshold?: number; // Percentage (0-100)
}

export interface PrivacyConfig {
  redactPaths?: string[];
  stripFileContentOverKB?: number;
  allowExternal?: boolean;
  anonymizeMetadata?: boolean;
}

// Voice Configuration Types
export interface VoiceInfo {
  name: string;
  gender: "male" | "female" | "neutral";
  age: "child" | "young" | "adult" | "elderly";
  style: "professional" | "friendly" | "casual" | "energetic" | "calm" | "conversational";
  quality: "standard" | "premium" | "neural" | "lossless";
}

export interface VoiceAudioConfig {
  enableBeep: boolean;
  beepType: "soft" | "sharp" | "melody" | "custom";
  beepVolume: number;
  customBeepPath?: string;
  ttsEnabled: boolean;
  ttsEngine: "system" | "azure" | "google" | "amazon" | "elevenlabs" | "openai";
  ttsVoice: string;
  ttsSpeed: number;
  ttsVolume: number;
  ttsPitch: number;
  ttsEmphasis: "none" | "reduced" | "moderate" | "strong";
  noiseReduction: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  spatialAudio: boolean;
}

export interface VoiceRecordingConfig {
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
  recordingQuality: "low" | "medium" | "high" | "lossless";
}

export interface VoiceConfirmationConfig {
  required: boolean;
  summaryEnabled: boolean;
  summaryStyle: "concise" | "detailed" | "bullet";
  confirmWords: string[];
  cancelWords: string[];
  retryWords: string[];
  skipConfirmationFor: string[];
  autoConfirmAfterSeconds: number;
  visualConfirmation: boolean;
}

export interface VoiceCommand {
  trigger: string[];
  action: string;
  params?: string[];
  step?: number;
  context?: string;
  description?: string;
}

export interface VoiceCommandsConfig {
  system: VoiceCommand[];
  voice: VoiceCommand[];
  content: VoiceCommand[];
  navigation: VoiceCommand[];
}

export interface VoiceRoutingConfig {
  preferFast: boolean;
  maxResponseLength: number;
  skipCodeInTTS: boolean;
  summarizeIfLong: boolean;
  useSimpleLanguage: boolean;
  contextAware: boolean;
  fileTypeOptimization: boolean;
  prioritizeLocalForPrivacy: boolean;
}

export interface VoicePermissionsConfig {
  allowSystemCommands: boolean;
  allowFileOperations: boolean;
  allowTerminalAccess: boolean;
  allowNetworkRequests: boolean;
  allowExtensionControl: boolean;
  securityLevel: "low" | "medium" | "high" | "paranoid";
  requireConfirmationFor: string[];
  auditLog: boolean;
  auditLogPath: string;
  maxAuditEntries: number;
}

export interface VoiceAdvancedConfig {
  personality: "professional" | "friendly" | "casual" | "technical";
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
  ambientNoise: "home" | "office" | "noisy" | "quiet";
  adaptToTimeOfDay: boolean;
  energySaving: boolean;
  calendarIntegration: boolean;
  emailIntegration: boolean;
  slackIntegration: boolean;
  teamsIntegration: boolean;
}

export interface VoiceDebugConfig {
  verboseLogging: boolean;
  showRecognitionConfidence: boolean;
  audioVisualization: boolean;
  latencyMeasurement: boolean;
  performanceMetrics: boolean;
}

export interface VoiceConfig {
  enabled: boolean;
  wakeWord: string;
  alternativeWakeWords: string[];
  language: string;
  responseLanguage: string;
  voices: Record<string, VoiceInfo[]>;
  audio: VoiceAudioConfig;
  recording: VoiceRecordingConfig;
  confirmation: VoiceConfirmationConfig;
  commands: VoiceCommandsConfig;
  routing: VoiceRoutingConfig;
  permissions: VoicePermissionsConfig;
  advanced: VoiceAdvancedConfig;
  debug: VoiceDebugConfig;
}

export interface ProfileConfig {
  mode: "auto" | "speed" | "quality" | "cheap" | "local-only" | "offline" | "privacy-strict";
  budget?: BudgetConfig;
  privacy?: PrivacyConfig;
  voice?: VoiceConfig;
  providers: ProviderConfig[];
  routing: {
    rules: RoutingRule[];
    default: {
      prefer: string[];
      target: "chat" | "completion";
    };
  };
}

export interface RouterConfig {
  version: number;
  activeProfile: string;
  profiles: Record<string, ProfileConfig>;
}

export class ConfigError extends Error {
  constructor(message: string, public path?: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class ConfigLoader {
  private static instance: ConfigLoader;
  private cachedConfig: RouterConfig | null = null;
  private configPath: string = "";
  private lastModified: number = 0;

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Load configuration from YAML file
   */
  loadConfig(filePath: string): RouterConfig {
    const absolutePath = path.resolve(filePath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new ConfigError(`Configuration file not found: ${absolutePath}`, absolutePath);
    }

    try {
      const stats = fs.statSync(absolutePath);
      
      // Return cached config if file hasn't changed
      if (
        this.cachedConfig && 
        this.configPath === absolutePath && 
        this.lastModified === stats.mtimeMs
      ) {
        return this.cachedConfig;
      }

      const rawContent = fs.readFileSync(absolutePath, "utf8");
      const config = YAML.parse(rawContent) as RouterConfig;

      this.validateConfig(config);

      // Cache the config
      this.cachedConfig = config;
      this.configPath = absolutePath;
      this.lastModified = stats.mtimeMs;

      return config;
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new ConfigError(`Failed to parse configuration: ${error.message}`, absolutePath);
      }
      
      throw new ConfigError(`Unknown error loading configuration`, absolutePath);
    }
  }

  /**
   * Watch configuration file for changes
   */
  watchConfig(filePath: string, callback: (config: RouterConfig) => void): void {
    const absolutePath = path.resolve(filePath);
    
    fs.watchFile(absolutePath, { interval: 1000 }, () => {
      try {
        const config = this.loadConfig(absolutePath);
        callback(config);
      } catch (error) {
        console.error("Error reloading configuration:", error);
      }
    });
  }

  /**
   * Stop watching configuration file
   */
  unwatchConfig(filePath: string): void {
    fs.unwatchFile(path.resolve(filePath));
  }

  /**
   * Validate configuration structure and values
   */
  private validateConfig(config: any): asserts config is RouterConfig {
    if (!config || typeof config !== "object") {
      throw new ConfigError("Configuration must be an object");
    }

    if (typeof config.version !== "number" || config.version < 1) {
      throw new ConfigError("Configuration version must be a positive number");
    }

    if (!config.activeProfile || typeof config.activeProfile !== "string") {
      throw new ConfigError("activeProfile must be a non-empty string");
    }

    if (!config.profiles || typeof config.profiles !== "object") {
      throw new ConfigError("profiles must be an object");
    }

    if (!config.profiles[config.activeProfile]) {
      throw new ConfigError(`Active profile '${config.activeProfile}' not found in profiles`);
    }

    // Validate each profile
    for (const [profileName, profile] of Object.entries(config.profiles)) {
      this.validateProfile(profile as any, profileName);
    }
  }

  private validateProfile(profile: any, profileName: string): asserts profile is ProfileConfig {
    const prefix = `Profile '${profileName}'`;

    if (!profile || typeof profile !== "object") {
      throw new ConfigError(`${prefix} must be an object`);
    }

    const validModes = ["auto", "speed", "quality", "cheap", "local-only", "offline", "privacy-strict"];
    if (!profile.mode || !validModes.includes(profile.mode)) {
      throw new ConfigError(`${prefix} mode must be one of: ${validModes.join(", ")}`);
    }

    if (!Array.isArray(profile.providers) || profile.providers.length === 0) {
      throw new ConfigError(`${prefix} must have at least one provider`);
    }

    // Validate providers
    for (let i = 0; i < profile.providers.length; i++) {
      this.validateProvider(profile.providers[i], `${prefix} provider[${i}]`);
    }

    // Validate routing
    if (!profile.routing || typeof profile.routing !== "object") {
      throw new ConfigError(`${prefix} must have routing configuration`);
    }

    if (!Array.isArray(profile.routing.rules)) {
      throw new ConfigError(`${prefix} routing rules must be an array`);
    }

    if (!profile.routing.default || !Array.isArray(profile.routing.default.prefer)) {
      throw new ConfigError(`${prefix} routing must have default.prefer array`);
    }

    // Validate routing rules
    for (let i = 0; i < profile.routing.rules.length; i++) {
      this.validateRoutingRule(profile.routing.rules[i], `${prefix} routing rule[${i}]`);
    }

    // Validate voice configuration if present
    if (profile.voice) {
      this.validateVoiceConfig(profile.voice, `${prefix} voice`);
    }
  }

  private validateProvider(provider: any, prefix: string): asserts provider is ProviderConfig {
    if (!provider || typeof provider !== "object") {
      throw new ConfigError(`${prefix} must be an object`);
    }

    if (!provider.id || typeof provider.id !== "string") {
      throw new ConfigError(`${prefix} must have a non-empty id`);
    }

    const validKinds = ["openai-compat", "ollama"];
    if (!provider.kind || !validKinds.includes(provider.kind)) {
      throw new ConfigError(`${prefix} kind must be one of: ${validKinds.join(", ")}`);
    }

    if (!provider.baseUrl || typeof provider.baseUrl !== "string") {
      throw new ConfigError(`${prefix} must have a non-empty baseUrl`);
    }

    if (!Array.isArray(provider.models) || provider.models.length === 0) {
      throw new ConfigError(`${prefix} must have at least one model`);
    }

    // Validate models
    for (let i = 0; i < provider.models.length; i++) {
      this.validateModel(provider.models[i], `${prefix} model[${i}]`);
    }
  }

  private validateModel(model: any, prefix: string): asserts model is ModelConfig {
    if (!model || typeof model !== "object") {
      throw new ConfigError(`${prefix} must be an object`);
    }

    if (!model.name || typeof model.name !== "string") {
      throw new ConfigError(`${prefix} must have a non-empty name`);
    }

    if (model.context !== undefined && (typeof model.context !== "number" || model.context <= 0)) {
      throw new ConfigError(`${prefix} context must be a positive number`);
    }

    if (model.caps !== undefined && !Array.isArray(model.caps)) {
      throw new ConfigError(`${prefix} caps must be an array`);
    }

    if (model.price !== undefined) {
      this.validateModelPrice(model.price, `${prefix} price`);
    }
  }

  private validateModelPrice(price: any, prefix: string): asserts price is ModelPrice {
    if (!price || typeof price !== "object") {
      throw new ConfigError(`${prefix} must be an object`);
    }

    if (typeof price.inputPerMTok !== "number" || price.inputPerMTok < 0) {
      throw new ConfigError(`${prefix} inputPerMTok must be a non-negative number`);
    }

    if (typeof price.outputPerMTok !== "number" || price.outputPerMTok < 0) {
      throw new ConfigError(`${prefix} outputPerMTok must be a non-negative number`);
    }

    if (price.cachedInputPerMTok !== undefined && 
        (typeof price.cachedInputPerMTok !== "number" || price.cachedInputPerMTok < 0)) {
      throw new ConfigError(`${prefix} cachedInputPerMTok must be a non-negative number`);
    }
  }

  private validateRoutingRule(rule: any, prefix: string): asserts rule is RoutingRule {
    if (!rule || typeof rule !== "object") {
      throw new ConfigError(`${prefix} must be an object`);
    }

    if (!rule.id || typeof rule.id !== "string") {
      throw new ConfigError(`${prefix} must have a non-empty id`);
    }

    if (!rule.if || typeof rule.if !== "object") {
      throw new ConfigError(`${prefix} must have an 'if' condition`);
    }

    if (!rule.then || typeof rule.then !== "object") {
      throw new ConfigError(`${prefix} must have a 'then' action`);
    }

    if (!Array.isArray(rule.then.prefer) || rule.then.prefer.length === 0) {
      throw new ConfigError(`${prefix} then.prefer must be a non-empty array`);
    }

    // Validate prefer format (providerId:modelName)
    for (const preference of rule.then.prefer) {
      if (typeof preference !== "string" || !preference.includes(":")) {
        throw new ConfigError(`${prefix} then.prefer items must be in format 'providerId:modelName'`);
      }
    }
  }

  private validateVoiceConfig(voice: any, prefix: string): asserts voice is VoiceConfig {
    if (!voice || typeof voice !== "object") {
      throw new ConfigError(`${prefix} must be an object`);
    }

    if (typeof voice.enabled !== "boolean") {
      throw new ConfigError(`${prefix} enabled must be a boolean`);
    }

    if (!voice.wakeWord || typeof voice.wakeWord !== "string") {
      throw new ConfigError(`${prefix} must have a non-empty wakeWord`);
    }

    const validLanguages = ["de-DE", "en-US", "fr-FR", "es-ES", "it-IT", "pt-PT", "ru-RU", "zh-CN"];
    if (!voice.language || !validLanguages.includes(voice.language)) {
      throw new ConfigError(`${prefix} language must be one of: ${validLanguages.join(", ")}`);
    }

    const validResponseLanguages = ["de", "en", "fr", "es", "it", "pt", "ru", "zh"];
    if (!voice.responseLanguage || !validResponseLanguages.includes(voice.responseLanguage)) {
      throw new ConfigError(`${prefix} responseLanguage must be one of: ${validResponseLanguages.join(", ")}`);
    }

    // Validate sub-configurations
    if (voice.audio) {
      this.validateVoiceAudioConfig(voice.audio, `${prefix} audio`);
    }

    if (voice.recording) {
      this.validateVoiceRecordingConfig(voice.recording, `${prefix} recording`);
    }

    if (voice.permissions) {
      this.validateVoicePermissionsConfig(voice.permissions, `${prefix} permissions`);
    }

    if (voice.advanced) {
      this.validateVoiceAdvancedConfig(voice.advanced, `${prefix} advanced`);
    }
  }

  private validateVoiceAudioConfig(audio: any, prefix: string): asserts audio is VoiceAudioConfig {
    if (typeof audio.ttsSpeed !== "undefined" && (audio.ttsSpeed < 0.5 || audio.ttsSpeed > 2.0)) {
      throw new ConfigError(`${prefix} ttsSpeed must be between 0.5 and 2.0`);
    }

    if (typeof audio.ttsVolume !== "undefined" && (audio.ttsVolume < 0.0 || audio.ttsVolume > 1.0)) {
      throw new ConfigError(`${prefix} ttsVolume must be between 0.0 and 1.0`);
    }

    const validEngines = ["system", "azure", "google", "amazon", "elevenlabs", "openai"];
    if (audio.ttsEngine && !validEngines.includes(audio.ttsEngine)) {
      throw new ConfigError(`${prefix} ttsEngine must be one of: ${validEngines.join(", ")}`);
    }
  }

  private validateVoiceRecordingConfig(recording: any, prefix: string): asserts recording is VoiceRecordingConfig {
    if (typeof recording.timeoutSeconds !== "undefined" && recording.timeoutSeconds < 5) {
      throw new ConfigError(`${prefix} timeoutSeconds must be at least 5`);
    }

    if (typeof recording.wakeWordSensitivity !== "undefined" && 
        (recording.wakeWordSensitivity < 0.1 || recording.wakeWordSensitivity > 1.0)) {
      throw new ConfigError(`${prefix} wakeWordSensitivity must be between 0.1 and 1.0`);
    }
  }

  private validateVoicePermissionsConfig(permissions: any, prefix: string): asserts permissions is VoicePermissionsConfig {
    const validSecurityLevels = ["low", "medium", "high", "paranoid"];
    if (permissions.securityLevel && !validSecurityLevels.includes(permissions.securityLevel)) {
      throw new ConfigError(`${prefix} securityLevel must be one of: ${validSecurityLevels.join(", ")}`);
    }

    if (typeof permissions.maxAuditEntries !== "undefined" && permissions.maxAuditEntries < 100) {
      throw new ConfigError(`${prefix} maxAuditEntries must be at least 100`);
    }
  }

  private validateVoiceAdvancedConfig(advanced: any, prefix: string): asserts advanced is VoiceAdvancedConfig {
    const validPersonalities = ["professional", "friendly", "casual", "technical"];
    if (advanced.personality && !validPersonalities.includes(advanced.personality)) {
      throw new ConfigError(`${prefix} personality must be one of: ${validPersonalities.join(", ")}`);
    }

    const validAmbientNoise = ["home", "office", "noisy", "quiet"];
    if (advanced.ambientNoise && !validAmbientNoise.includes(advanced.ambientNoise)) {
      throw new ConfigError(`${prefix} ambientNoise must be one of: ${validAmbientNoise.join(", ")}`);
    }
  }

  /**
   * Get default configuration for creating new config files
   */
  getDefaultConfig(): RouterConfig {
    return {
      version: 1,
      activeProfile: "default",
      profiles: {
        default: {
          mode: "auto",
          budget: {
            dailyUSD: 5.0,
            hardStop: true,
            warningThreshold: 80,
          },
          privacy: {
            redactPaths: ["**/secrets/**", "**/.env*"],
            stripFileContentOverKB: 256,
            allowExternal: true,
          },
          voice: {
            enabled: true,
            wakeWord: "Guido",
            alternativeWakeWords: ["Hey Guido", "Computer"],
            language: "de-DE",
            responseLanguage: "de",
            voices: {
              "de-DE": [
                {
                  name: "Hedda",
                  gender: "female",
                  age: "adult",
                  style: "friendly",
                  quality: "premium"
                }
              ]
            },
            audio: {
              enableBeep: true,
              beepType: "soft",
              beepVolume: 0.3,
              ttsEnabled: true,
              ttsEngine: "system",
              ttsVoice: "auto",
              ttsSpeed: 1.0,
              ttsVolume: 0.8,
              ttsPitch: 1.0,
              ttsEmphasis: "moderate",
              noiseReduction: true,
              echoCancellation: true,
              autoGainControl: true,
              spatialAudio: false
            },
            recording: {
              timeoutSeconds: 30,
              stopWords: ["stop", "stopp", "Ende", "fertig"],
              minRecordingSeconds: 1,
              maxRecordingSeconds: 120,
              autoStopOnSilence: true,
              silenceTimeoutMs: 2000,
              backgroundListening: true,
              wakeWordSensitivity: 0.7,
              smartNoiseSuppression: true,
              speakerAdaptation: true,
              multiSpeakerMode: false,
              recordingQuality: "high"
            },
            confirmation: {
              required: true,
              summaryEnabled: true,
              summaryStyle: "concise",
              confirmWords: ["ja", "yes", "bestätigen", "ok"],
              cancelWords: ["nein", "no", "abbrechen"],
              retryWords: ["wiederholen", "nochmal"],
              skipConfirmationFor: ["simple_questions"],
              autoConfirmAfterSeconds: 10,
              visualConfirmation: true
            },
            commands: {
              system: [],
              voice: [],
              content: [],
              navigation: []
            },
            routing: {
              preferFast: true,
              maxResponseLength: 800,
              skipCodeInTTS: true,
              summarizeIfLong: true,
              useSimpleLanguage: true,
              contextAware: true,
              fileTypeOptimization: true,
              prioritizeLocalForPrivacy: true
            },
            permissions: {
              allowSystemCommands: true,
              allowFileOperations: true,
              allowTerminalAccess: false,
              allowNetworkRequests: true,
              allowExtensionControl: true,
              securityLevel: "medium",
              requireConfirmationFor: ["file_deletion", "terminal_commands"],
              auditLog: true,
              auditLogPath: "./voice-audit.log",
              maxAuditEntries: 1000
            },
            advanced: {
              personality: "professional",
              emotionalResponses: true,
              userAdaptation: true,
              learningMode: true,
              contextMemory: true,
              conversationHistory: 10,
              predictiveText: true,
              autoCorrection: true,
              gestureControl: false,
              eyeTracking: false,
              biometricAuth: false,
              ambientNoise: "office",
              adaptToTimeOfDay: true,
              energySaving: true,
              calendarIntegration: false,
              emailIntegration: false,
              slackIntegration: false,
              teamsIntegration: false
            },
            debug: {
              verboseLogging: false,
              showRecognitionConfidence: false,
              audioVisualization: false,
              latencyMeasurement: false,
              performanceMetrics: false
            }
          },
          providers: [
            {
              id: "openai",
              kind: "openai-compat",
              baseUrl: "https://api.openai.com/v1",
              apiKeyRef: "OPENAI_API_KEY",
              models: [
                {
                  name: "gpt-4o-mini",
                  context: 128000,
                  caps: ["cheap", "tools", "json", "voice"],
                  price: {
                    inputPerMTok: 0.15,
                    outputPerMTok: 0.60,
                    cachedInputPerMTok: 0.08,
                  },
                },
              ],
            },
          ],
          routing: {
            rules: [
              {
                id: "voice-input",
                if: {
                  anyKeyword: ["voice", "speech", "spoken"]
                },
                then: {
                  prefer: ["openai:gpt-4o-mini"],
                  target: "chat",
                },
              },
            ],
            default: {
              prefer: ["openai:gpt-4o-mini"],
              target: "chat",
            },
          },
        },
      },
    };
  }

  /**
   * Create a default configuration file
   */
  createDefaultConfig(filePath: string): void {
    const absolutePath = path.resolve(filePath);
    const dir = path.dirname(absolutePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const defaultConfig = this.getDefaultConfig();
    const yamlContent = YAML.stringify(defaultConfig, { indent: 2 });

    fs.writeFileSync(absolutePath, yamlContent, "utf8");
  }
}