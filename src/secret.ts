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

export class VSCodeSecretManager implements SecretManager {
  private context: vscode.ExtensionContext;
  private keyPrefix = "modelRouter.";

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Store a secret securely
   */
  async store(key: string, value: string): Promise<void> {
    if (!key || !value) {
      throw new Error("Key and value must be non-empty");
    }

    const secretKey = this.normalizeKey(key);
    await this.context.secrets.store(secretKey, value);
  }

  /**
   * Retrieve a secret
   */
  async get(key: string): Promise<string | undefined> {
    if (!key) {
      return undefined;
    }

    const secretKey = this.normalizeKey(key);
    return await this.context.secrets.get(secretKey);
  }

  /**
   * Delete a secret
   */
  async delete(key: string): Promise<void> {
    if (!key) {
      return;
    }

    const secretKey = this.normalizeKey(key);
    await this.context.secrets.delete(secretKey);
  }

  /**
   * List all stored secret keys (without values)
   */
  async list(): Promise<string[]> {
    // VSCode doesn't provide a direct way to list secrets
    // We maintain a list in extension state
    const stored = this.context.globalState.get<string[]>(`${this.keyPrefix}keys`, []);
    return stored.map(key => key.replace(this.keyPrefix, ""));
  }

  /**
   * Normalize key name and track it
   */
  private normalizeKey(key: string): string {
    const normalized = `${this.keyPrefix}${key.toUpperCase()}`;
    
    // Track the key for listing
    this.trackKey(normalized);
    
    return normalized;
  }

  /**
   * Track a key for listing purposes
   */
  private async trackKey(normalizedKey: string): Promise<void> {
    const stored = this.context.globalState.get<string[]>(`${this.keyPrefix}keys`, []);
    if (!stored.includes(normalizedKey)) {
      stored.push(normalizedKey);
      await this.context.globalState.update(`${this.keyPrefix}keys`, stored);
    }
  }

  /**
   * Remove key from tracking
   */
  private async untrackKey(normalizedKey: string): Promise<void> {
    const stored = this.context.globalState.get<string[]>(`${this.keyPrefix}keys`, []);
    const filtered = stored.filter(key => key !== normalizedKey);
    await this.context.globalState.update(`${this.keyPrefix}keys`, filtered);
  }
}

export class SecretError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = "SecretError";
  }
}

/**
 * Helper functions for common secret operations
 */
export class SecretHelper {
  private manager: SecretManager;

  constructor(manager: SecretManager) {
    this.manager = manager;
  }

  /**
   * Set API key for a provider
   */
  async setProviderApiKey(providerId: string, apiKey: string): Promise<void> {
    const key = `${providerId.toUpperCase()}_API_KEY`;
    await this.manager.store(key, apiKey);
  }

  /**
   * Get API key for a provider
   */
  async getProviderApiKey(providerId: string): Promise<string | undefined> {
    const key = `${providerId.toUpperCase()}_API_KEY`;
    
    // Try direct lookup first
    let value = await this.manager.get(key);
    
    // Fallback to environment variable
    if (!value) {
      value = process.env[key];
    }
    
    return value;
  }

  /**
   * Delete API key for a provider
   */
  async deleteProviderApiKey(providerId: string): Promise<void> {
    const key = `${providerId.toUpperCase()}_API_KEY`;
    await this.manager.delete(key);
  }

  /**
   * Check if API key exists for a provider
   */
  async hasProviderApiKey(providerId: string): Promise<boolean> {
    const apiKey = await this.getProviderApiKey(providerId);
    return !!apiKey;
  }

  /**
   * Get all configured providers (those with API keys)
   */
  async getConfiguredProviders(): Promise<string[]> {
    const keys = await this.manager.list();
    const providerKeys = keys.filter(key => key.endsWith("_API_KEY"));
    return providerKeys.map(key => 
      key.replace("_API_KEY", "").toLowerCase()
    );
  }

  /**
   * Validate API key format for different providers
   */
  validateApiKey(providerId: string, apiKey: string): { valid: boolean; error?: string } {
    if (!apiKey || apiKey.trim().length === 0) {
      return { valid: false, error: "API key cannot be empty" };
    }

    const trimmed = apiKey.trim();

    switch (providerId.toLowerCase()) {
      case "openai":
        if (!trimmed.startsWith("sk-")) {
          return { valid: false, error: "OpenAI API keys should start with 'sk-'" };
        }
        if (trimmed.length < 50) {
          return { valid: false, error: "OpenAI API key appears too short" };
        }
        break;

      case "deepseek":
        if (!trimmed.startsWith("sk-")) {
          return { valid: false, error: "DeepSeek API keys should start with 'sk-'" };
        }
        break;

      case "grok":
      case "xai":
        // Grok/xAI keys might have different format
        if (trimmed.length < 20) {
          return { valid: false, error: "API key appears too short" };
        }
        break;

      default:
        // Generic validation
        if (trimmed.length < 10) {
          return { valid: false, error: "API key appears too short" };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Test API key by making a simple request
   */
  async testApiKey(
    providerId: string, 
    apiKey: string, 
    baseUrl: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Store temporarily for testing
      const testKey = `TEST_${providerId.toUpperCase()}_API_KEY`;
      await this.manager.store(testKey, apiKey);

      // Try a simple request to validate the key
      const response = await fetch(`${baseUrl}/models`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "User-Agent": "VSCode-Model-Router/0.1.0",
        },
        signal: AbortSignal.timeout(10000),
      });

      // Clean up test key
      await this.manager.delete(testKey);

      if (response.ok) {
        return { valid: true };
      } else if (response.status === 401) {
        return { valid: false, error: "Authentication failed - invalid API key" };
      } else if (response.status === 403) {
        return { valid: false, error: "Access forbidden - check API key permissions" };
      } else {
        return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { valid: false, error: "Request timeout - check network connection" };
      }
      
      return { 
        valid: false, 
        error: `Network error: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Mask API key for display (show only first/last chars)
   */
  maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return "****";
    }

    const firstPart = apiKey.slice(0, 4);
    const lastPart = apiKey.slice(-4);
    const maskedLength = Math.max(4, apiKey.length - 8);
    const masked = "*".repeat(maskedLength);

    return `${firstPart}${masked}${lastPart}`;
  }

  /**
   * Import API keys from environment variables
   */
  async importFromEnvironment(): Promise<{ imported: string[]; skipped: string[] }> {
    const imported: string[] = [];
    const skipped: string[] = [];

    const envKeyPattern = /^(.+)_API_KEY$/;
    
    for (const [envKey, envValue] of Object.entries(process.env)) {
      const match = envKey.match(envKeyPattern);
      if (match && envValue) {
        const providerId = match[1].toLowerCase();
        
        // Check if we already have this key stored
        const existing = await this.getProviderApiKey(providerId);
        if (existing) {
          skipped.push(providerId);
          continue;
        }

        // Validate the key
        const validation = this.validateApiKey(providerId, envValue);
        if (validation.valid) {
          await this.setProviderApiKey(providerId, envValue);
          imported.push(providerId);
        } else {
          skipped.push(providerId);
        }
      }
    }

    return { imported, skipped };
  }

  /**
   * Export configuration for backup (without secrets)
   */
  async exportConfiguration(): Promise<{
    providers: string[];
    timestamp: string;
    hasSecrets: boolean;
  }> {
    const providers = await this.getConfiguredProviders();
    
    return {
      providers,
      timestamp: new Date().toISOString(),
      hasSecrets: providers.length > 0,
    };
  }

  /**
   * Clear all stored secrets (use with caution)
   */
  async clearAllSecrets(): Promise<number> {
    const keys = await this.manager.list();
    let deleted = 0;

    for (const key of keys) {
      try {
        await this.manager.delete(key);
        deleted++;
      } catch (error) {
        // Continue with other keys
        console.warn(`Failed to delete secret key: ${key}`, error);
      }
    }

    return deleted;
  }
}

/**
 * Global secret management functions for easy access
 */
let globalSecretHelper: SecretHelper | null = null;

export function initializeSecrets(context: vscode.ExtensionContext): SecretHelper {
  const manager = new VSCodeSecretManager(context);
  globalSecretHelper = new SecretHelper(manager);
  return globalSecretHelper;
}

export function getSecretHelper(): SecretHelper {
  if (!globalSecretHelper) {
    throw new SecretError("Secret management not initialized", "getHelper");
  }
  return globalSecretHelper;
}
