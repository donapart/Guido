"use strict";
/**
 * Configuration loader and validation for Model Router
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = exports.ConfigError = void 0;
exports.loadConfiguration = loadConfiguration;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const yaml_1 = __importDefault(require("yaml"));
class ConfigError extends Error {
    path;
    constructor(message, path) {
        super(message);
        this.path = path;
        this.name = "ConfigError";
    }
}
exports.ConfigError = ConfigError;
class ConfigLoader {
    static instance;
    cachedConfig = null;
    configPath = "";
    lastModified = 0;
    static getInstance() {
        if (!ConfigLoader.instance) {
            ConfigLoader.instance = new ConfigLoader();
        }
        return ConfigLoader.instance;
    }
    /**
     * Load configuration from YAML file
     */
    loadConfig(filePath) {
        const absolutePath = path.resolve(filePath);
        if (!fs.existsSync(absolutePath)) {
            throw new ConfigError(`Configuration file not found: ${absolutePath}`, absolutePath);
        }
        try {
            const stats = fs.statSync(absolutePath);
            // Return cached config if file hasn't changed
            if (this.cachedConfig &&
                this.configPath === absolutePath &&
                this.lastModified === stats.mtimeMs) {
                return this.cachedConfig;
            }
            const rawContent = fs.readFileSync(absolutePath, "utf8");
            const config = yaml_1.default.parse(rawContent);
            this.validateConfig(config);
            // Cache the config
            this.cachedConfig = config;
            this.configPath = absolutePath;
            this.lastModified = stats.mtimeMs;
            return config;
        }
        catch (error) {
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
    watchConfig(filePath, callback) {
        const absolutePath = path.resolve(filePath);
        fs.watchFile(absolutePath, { interval: 1000 }, () => {
            try {
                const config = this.loadConfig(absolutePath);
                callback(config);
            }
            catch (error) {
                console.error("Error reloading configuration:", error);
            }
        });
    }
    /**
     * Stop watching configuration file
     */
    unwatchConfig(filePath) {
        fs.unwatchFile(path.resolve(filePath));
    }
    /**
     * Validate configuration structure and values
     */
    validateConfig(config) {
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
            this.validateProfile(profile, profileName);
        }
    }
    validateProfile(profile, profileName) {
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
        if (!profile.routing.default ||
            !Array.isArray(profile.routing.default.prefer)) {
            throw new ConfigError(`${prefix} routing must have default.prefer array`);
        }
        // Validate routing rules
        for (let i = 0; i < profile.routing.rules.length; i++) {
            this.validateRoutingRule(profile.routing.rules[i], `${prefix} routing rule[${i}]`);
        }
    }
    validateProvider(provider, prefix) {
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
    validateModel(model, prefix) {
        if (!model || typeof model !== "object") {
            throw new ConfigError(`${prefix} must be an object`);
        }
        if (!model.name || typeof model.name !== "string") {
            throw new ConfigError(`${prefix} must have a non-empty name`);
        }
        if (model.context !== undefined &&
            (typeof model.context !== "number" || model.context <= 0)) {
            throw new ConfigError(`${prefix} context must be a positive number`);
        }
        if (model.caps !== undefined && !Array.isArray(model.caps)) {
            throw new ConfigError(`${prefix} caps must be an array`);
        }
        if (model.price !== undefined) {
            this.validateModelPrice(model.price, `${prefix} price`);
        }
    }
    validateModelPrice(price, prefix) {
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
            (typeof price.cachedInputPerMTok !== "number" ||
                price.cachedInputPerMTok < 0)) {
            throw new ConfigError(`${prefix} cachedInputPerMTok must be a non-negative number`);
        }
    }
    validateRoutingRule(rule, prefix) {
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
    /**
     * Get default configuration for creating new config files
     */
    getDefaultConfig() {
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
    createDefaultConfig(filePath) {
        const absolutePath = path.resolve(filePath);
        const dir = path.dirname(absolutePath);
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const defaultConfig = this.getDefaultConfig();
        const yamlContent = yaml_1.default.stringify(defaultConfig, { indent: 2 });
        fs.writeFileSync(absolutePath, yamlContent, "utf8");
    }
}
exports.ConfigLoader = ConfigLoader;
/**
 * Load configuration from the default location
 */
async function loadConfiguration() {
    const configLoader = ConfigLoader.getInstance();
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        throw new ConfigError("No workspace folder found");
    }
    const configPath = path.join(workspaceRoot, "router.config.yaml");
    try {
        const config = configLoader.loadConfig(configPath);
        return config.profiles[config.activeProfile];
    }
    catch (error) {
        if (error instanceof ConfigError && error.message.includes("not found")) {
            // Create default config if it doesn't exist
            configLoader.createDefaultConfig(configPath);
            const config = configLoader.loadConfig(configPath);
            return config.profiles[config.activeProfile];
        }
        throw error;
    }
}
//# sourceMappingURL=config.js.map