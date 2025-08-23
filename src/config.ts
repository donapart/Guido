/**
 * Configuration loader and validation for Model Router
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import YAML from "yaml";
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

export interface ProfileConfig {
  mode:
    | "auto"
    | "speed"
    | "quality"
    | "cheap"
    | "local-only"
    | "offline"
    | "privacy-strict";
  budget?: BudgetConfig;
  privacy?: PrivacyConfig;
  voice?: VoiceConfig; // Voice configuration
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
      throw new ConfigError(
        `Configuration file not found: ${absolutePath}`,
        absolutePath
      );
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
        throw new ConfigError(
          `Failed to parse configuration: ${error.message}`,
          absolutePath
        );
      }

      throw new ConfigError(
        `Unknown error loading configuration`,
        absolutePath
      );
    }
  }

  /**
   * Watch configuration file for changes
   */
  watchConfig(
    filePath: string,
    callback: (config: RouterConfig) => void
  ): void {
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
      throw new ConfigError(
        `Active profile '${config.activeProfile}' not found in profiles`
      );
    }

    // Validate each profile
    for (const [profileName, profile] of Object.entries(config.profiles)) {
      this.validateProfile(profile as any, profileName);
    }
  }

  private validateProfile(
    profile: any,
    profileName: string
  ): asserts profile is ProfileConfig {
    const prefix = `Profile '${profileName}'`;

    if (!profile || typeof profile !== "object") {
      throw new ConfigError(`${prefix} must be an object`);
    }

    const validModes = [
      "auto",
      "speed",
      "quality",
      "cheap",
      "local-only",
      "offline",
      "privacy-strict",
    ];
    if (!profile.mode || !validModes.includes(profile.mode)) {
      throw new ConfigError(
        `${prefix} mode must be one of: ${validModes.join(", ")}`
      );
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

    if (
      !profile.routing.default ||
      !Array.isArray(profile.routing.default.prefer)
    ) {
      throw new ConfigError(`${prefix} routing must have default.prefer array`);
    }

    // Validate routing rules
    for (let i = 0; i < profile.routing.rules.length; i++) {
      this.validateRoutingRule(
        profile.routing.rules[i],
        `${prefix} routing rule[${i}]`
      );
    }
  }

  private validateProvider(
    provider: any,
    prefix: string
  ): asserts provider is ProviderConfig {
    if (!provider || typeof provider !== "object") {
      throw new ConfigError(`${prefix} must be an object`);
    }

    if (!provider.id || typeof provider.id !== "string") {
      throw new ConfigError(`${prefix} must have a non-empty id`);
    }

    const validKinds = ["openai-compat", "ollama"];
    if (!provider.kind || !validKinds.includes(provider.kind)) {
      throw new ConfigError(
        `${prefix} kind must be one of: ${validKinds.join(", ")}`
      );
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

  private validateModel(
    model: any,
    prefix: string
  ): asserts model is ModelConfig {
    if (!model || typeof model !== "object") {
      throw new ConfigError(`${prefix} must be an object`);
    }

    if (!model.name || typeof model.name !== "string") {
      throw new ConfigError(`${prefix} must have a non-empty name`);
    }

    if (
      model.context !== undefined &&
      (typeof model.context !== "number" || model.context <= 0)
    ) {
      throw new ConfigError(`${prefix} context must be a positive number`);
    }

    if (model.caps !== undefined && !Array.isArray(model.caps)) {
      throw new ConfigError(`${prefix} caps must be an array`);
    }

    if (model.price !== undefined) {
      this.validateModelPrice(model.price, `${prefix} price`);
    }
  }

  private validateModelPrice(
    price: any,
    prefix: string
  ): asserts price is ModelPrice {
    if (!price || typeof price !== "object") {
      throw new ConfigError(`${prefix} must be an object`);
    }

    if (typeof price.inputPerMTok !== "number" || price.inputPerMTok < 0) {
      throw new ConfigError(
        `${prefix} inputPerMTok must be a non-negative number`
      );
    }

    if (typeof price.outputPerMTok !== "number" || price.outputPerMTok < 0) {
      throw new ConfigError(
        `${prefix} outputPerMTok must be a non-negative number`
      );
    }

    if (
      price.cachedInputPerMTok !== undefined &&
      (typeof price.cachedInputPerMTok !== "number" ||
        price.cachedInputPerMTok < 0)
    ) {
      throw new ConfigError(
        `${prefix} cachedInputPerMTok must be a non-negative number`
      );
    }
  }

  private validateRoutingRule(
    rule: any,
    prefix: string
  ): asserts rule is RoutingRule {
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
        throw new ConfigError(
          `${prefix} then.prefer items must be in format 'providerId:modelName'`
        );
      }
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
                  caps: ["cheap", "tools", "json"],
                  price: {
                    inputPerMTok: 0.15,
                    outputPerMTok: 0.6,
                    cachedInputPerMTok: 0.08,
                  },
                },
              ],
            },
          ],
          routing: {
            rules: [
              {
                id: "default-rule",
                if: {},
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

/**
 * Load configuration from the default location
 */
export async function loadConfiguration(): Promise<ProfileConfig> {
  const configLoader = ConfigLoader.getInstance();
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!workspaceRoot) {
    throw new ConfigError("No workspace folder found");
  }

  const configPath = path.join(workspaceRoot, "router.config.yaml");

  try {
    const config = configLoader.loadConfig(configPath);
    return config.profiles[config.activeProfile];
  } catch (error) {
    if (error instanceof ConfigError && error.message.includes("not found")) {
      // Create default config if it doesn't exist
      configLoader.createDefaultConfig(configPath);
      const config = configLoader.loadConfig(configPath);
      return config.profiles[config.activeProfile];
    }
    throw error;
  }
}
