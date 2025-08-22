/**
 * Voice Permission Manager - Handles all permission-related functionality
 * Including GDPR compliance, data retention, and access controls
 */
import { PermissionStatus, VoiceConfig } from "../types";
export declare class VoicePermissionManager {
    private config;
    private permissions;
    private dataStorage;
    private consentGiven;
    private lastConsentCheck?;
    constructor(voiceConfig: VoiceConfig);
    /**
     * Request all necessary permissions
     */
    requestAllPermissions(): Promise<PermissionStatus>;
    /**
     * Request GDPR consent
     */
    requestGDPRConsent(): Promise<boolean>;
    /**
   * Request microphone permission (Stub - handled by webview)
   */
    requestMicrophonePermission(): Promise<void>;
    /**
     * Request notification permission (Stub - handled by webview)
     */
    requestNotificationPermission(): Promise<void>;
    /**
     * Check if action is allowed
     */
    isActionAllowed(action: string): boolean;
    /**
     * Request confirmation for restricted action
     */
    requestActionConfirmation(action: string, description: string): Promise<boolean>;
    /**
     * Check working hours restrictions
     */
    isWithinWorkingHours(): boolean;
    /**
     * Check if in quiet hours
     */
    isInQuietHours(): boolean;
    /**
     * Store user data with privacy controls
     */
    storeUserData(key: string, data: any): Promise<void>;
    /**
     * Retrieve user data with privacy controls
     */
    getUserData(key: string): Promise<any>;
    /**
     * Delete user data
     */
    deleteUserData(key?: string): Promise<void>;
    /**
     * Export user data (GDPR right to data portability)
     */
    exportUserData(): Promise<string>;
    /**
     * Show privacy policy
     */
    private showPrivacyPolicy;
    /**
     * Store consent data
     */
    private storeConsentData;
    /**
     * Check if consent is still valid
     */
    private isConsentStillValid;
    /**
     * Anonymize sensitive data
     */
    private anonymizeData;
    /**
     * Encrypt data for storage
     */
    private encryptData;
    /**
     * Decrypt stored data
     */
    private decryptData;
    /**
     * Schedule automatic data cleanup
     */
    private scheduleDataCleanup;
    /**
   * Log security-related actions for audit
   */
    private logSecurityAction;
    /**
     * Check working hours on startup
     */
    private checkWorkingHours;
    /**
     * Get permission summary for user
     */
    getPermissionSummary(): any;
    /**
     * Revoke consent and delete all data
     */
    revokeConsent(): Promise<void>;
}
//# sourceMappingURL=voicePermissionManager.d.ts.map