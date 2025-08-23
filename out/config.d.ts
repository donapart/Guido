/**
 * Configuration loader and validation for Model Router
 */
import { VoiceConfig } from "./voice/types";
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
    keepAlive?: string;
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
        prefer: string[];
        target: "chat" | "completion";
        priority?: number;
    };
}
export interface BudgetConfig {
    dailyUSD?: number;
    monthlyUSD?: number;
    hardStop?: boolean;
    warningThreshold?: number;
}
export interface PrivacyConfig {
    redactPaths?: string[];
    stripFileContentOverKB?: number;
    allowExternal?: boolean;
    anonymizeMetadata?: boolean;
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
export declare class ConfigError extends Error {
    path?: string | undefined;
    constructor(message: string, path?: string | undefined);
}
export declare class ConfigLoader {
    private static instance;
    private cachedConfig;
    private configPath;
    private lastModified;
    static getInstance(): ConfigLoader;
    /**
     * Load configuration from YAML file
     */
    loadConfig(filePath: string): RouterConfig;
    /**
     * Watch configuration file for changes
     */
    watchConfig(filePath: string, callback: (config: RouterConfig) => void): void;
    /**
     * Stop watching configuration file
     */
    unwatchConfig(filePath: string): void;
    /**
     * Validate configuration structure and values
     */
    private validateConfig;
    private validateProfile;
    private validateProvider;
    private validateModel;
    private validateModelPrice;
    private validateRoutingRule;
    /**
     * Get default configuration for creating new config files
     */
    getDefaultConfig(): RouterConfig;
    /**
     * Create a default configuration file
     */
    createDefaultConfig(filePath: string): void;
}
/**
 * Load configuration from the default location
 */
export declare function loadConfiguration(): Promise<ProfileConfig>;
//# sourceMappingURL=config.d.ts.map