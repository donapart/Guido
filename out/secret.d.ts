/**
 * Secure API Key and Secret Management for Model Router
 * Uses VSCode SecretStorage (backed by system keychain)
 */
import * as vscode from "vscode";
export interface SecretManager {
    store(key: string, value: string): Promise<void>;
    get(key: string): Promise<string | undefined>;
    delete(key: string): Promise<void>;
    list(): Promise<string[]>;
}
export declare class VSCodeSecretManager implements SecretManager {
    private context;
    private keyPrefix;
    constructor(context: vscode.ExtensionContext);
    /**
     * Store a secret securely
     */
    store(key: string, value: string): Promise<void>;
    /**
     * Retrieve a secret
     */
    get(key: string): Promise<string | undefined>;
    /**
     * Delete a secret
     */
    delete(key: string): Promise<void>;
    /**
     * List all stored secret keys (without values)
     */
    list(): Promise<string[]>;
    /**
     * Normalize key name and track it
     */
    private normalizeKey;
    /**
     * Track a key for listing purposes
     */
    private trackKey;
    /**
     * Remove key from tracking
     */
    private untrackKey;
}
export declare class SecretError extends Error {
    operation: string;
    constructor(message: string, operation: string);
}
/**
 * Helper functions for common secret operations
 */
export declare class SecretHelper {
    private manager;
    constructor(manager: SecretManager);
    /**
     * Set API key for a provider
     */
    setProviderApiKey(providerId: string, apiKey: string): Promise<void>;
    /**
     * Get API key for a provider
     */
    getProviderApiKey(providerId: string): Promise<string | undefined>;
    /**
     * Delete API key for a provider
     */
    deleteProviderApiKey(providerId: string): Promise<void>;
    /**
     * Check if API key exists for a provider
     */
    hasProviderApiKey(providerId: string): Promise<boolean>;
    /**
     * Get all configured providers (those with API keys)
     */
    getConfiguredProviders(): Promise<string[]>;
    /**
     * Validate API key format for different providers
     */
    validateApiKey(providerId: string, apiKey: string): {
        valid: boolean;
        error?: string;
    };
    /**
     * Test API key by making a simple request
     */
    testApiKey(providerId: string, apiKey: string, baseUrl: string): Promise<{
        valid: boolean;
        error?: string;
    }>;
    /**
     * Mask API key for display (show only first/last chars)
     */
    maskApiKey(apiKey: string): string;
    /**
     * Import API keys from environment variables
     */
    importFromEnvironment(): Promise<{
        imported: string[];
        skipped: string[];
    }>;
    /**
     * Export configuration for backup (without secrets)
     */
    exportConfiguration(): Promise<{
        providers: string[];
        timestamp: string;
        hasSecrets: boolean;
    }>;
    /**
     * Clear all stored secrets (use with caution)
     */
    clearAllSecrets(): Promise<number>;
}
export declare function initializeSecrets(context: vscode.ExtensionContext): SecretHelper;
export declare function getSecretHelper(): SecretHelper;
//# sourceMappingURL=secret.d.ts.map