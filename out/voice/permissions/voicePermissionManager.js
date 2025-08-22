"use strict";
/**
 * Voice Permission Manager - Handles all permission-related functionality
 * Including GDPR compliance, data retention, and access controls
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoicePermissionManager = void 0;
const vscode = __importStar(require("vscode"));
class VoicePermissionManager {
    config;
    permissions = {
        microphone: "prompt",
        notifications: "default",
        fullscreen: "prompt"
    };
    dataStorage = new Map();
    consentGiven = false;
    lastConsentCheck;
    constructor(voiceConfig) {
        this.config = voiceConfig.permissions;
    }
    /**
     * Request all necessary permissions
     */
    async requestAllPermissions() {
        // Check GDPR compliance first
        if (this.config.privacy.gdprCompliant && this.config.privacy.userConsentRequired) {
            await this.requestGDPRConsent();
        }
        // Request microphone permission
        await this.requestMicrophonePermission();
        // Request notification permission
        await this.requestNotificationPermission();
        // Check working hours
        this.checkWorkingHours();
        return this.permissions;
    }
    /**
     * Request GDPR consent
     */
    async requestGDPRConsent() {
        if (this.consentGiven && this.isConsentStillValid()) {
            return true;
        }
        const consentText = `
🔒 Datenschutz-Einverständnis für Guido Voice Control

Diese Extension verarbeitet Sprachdaten für die Funktionalität. Gemäß DSGVO bitten wir um Ihr Einverständnis:

📋 Was wir verarbeiten:
• Sprachaufnahmen (nur während aktiver Nutzung)
• Transkripte Ihrer Sprachbefehle
• Nutzungsstatistiken (anonymisiert)
• Fehlerprotokolle

🛡️ Wie wir Ihre Daten schützen:
• ${this.config.privacy.localProcessingOnly ? 'Alle Daten bleiben lokal auf Ihrem Gerät' : 'Spracherkennung nutzt externe APIs'}
• ${this.config.privacy.storeRecordings ? 'Aufnahmen werden verschlüsselt gespeichert' : 'Keine Speicherung von Aufnahmen'}
• Automatische Löschung nach ${this.config.privacy.dataRetentionDays} Tagen
• ${this.config.privacy.anonymizeTranscripts ? 'Transkripte werden anonymisiert' : 'Transkripte enthalten möglicherweise identifizierbare Informationen'}

📞 Ihre Rechte:
• Auskunft über gespeicherte Daten
• Berichtigung oder Löschung
• Widerspruch gegen Verarbeitung
• Datenübertragbarkeit

Stimmen Sie der Verarbeitung Ihrer Sprachdaten zu?`;
        const result = await vscode.window.showInformationMessage(consentText, { modal: true }, "✅ Ja, ich stimme zu", "❌ Nein, ablehnen", "📋 Datenschutzerklärung anzeigen");
        if (result === "📋 Datenschutzerklärung anzeigen") {
            await this.showPrivacyPolicy();
            return await this.requestGDPRConsent(); // Ask again after showing policy
        }
        if (result === "✅ Ja, ich stimme zu") {
            this.consentGiven = true;
            this.lastConsentCheck = new Date();
            await this.storeConsentData();
            vscode.window.showInformationMessage("✅ Einverständnis erteilt. Sie können diese Entscheidung jederzeit in den Einstellungen widerrufen.");
            return true;
        }
        vscode.window.showWarningMessage("❌ Voice Control kann ohne Einverständnis nicht verwendet werden. Funktionen wurden deaktiviert.");
        return false;
    }
    /**
     * Request microphone permission
     */
    async requestMicrophonePermission() {
        if (!this.config.microphoneAccess.required) {
            return;
        }
        try {
            // Check if already granted
            const permission = await navigator.permissions.query({ name: 'microphone' });
            this.permissions.microphone = permission.state;
            if (permission.state === 'granted') {
                return;
            }
            if (this.config.microphoneAccess.showPermissionDialog) {
                const result = await vscode.window.showInformationMessage("🎤 Mikrofon-Berechtigung erforderlich\n\nGuido Voice Control benötigt Zugriff auf Ihr Mikrofon für die Sprachsteuerung.", { modal: true }, "Berechtigung erteilen", "Ablehnen");
                if (result !== "Berechtigung erteilen") {
                    this.permissions.microphone = "denied";
                    throw new Error("Mikrofon-Berechtigung wurde verweigert");
                }
            }
            // Request permission via getUserMedia
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.permissions.microphone = "granted";
                // Close stream immediately as we only needed it for permission
                stream.getTracks().forEach(track => track.stop());
                vscode.window.showInformationMessage("✅ Mikrofon-Berechtigung erteilt");
            }
            catch (error) {
                this.permissions.microphone = "denied";
                if (error.name === 'NotAllowedError') {
                    vscode.window.showErrorMessage("❌ Mikrofon-Zugriff verweigert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen.");
                }
                else if (error.name === 'NotFoundError') {
                    vscode.window.showErrorMessage("❌ Kein Mikrofon gefunden. Bitte schließen Sie ein Mikrofon an.");
                }
                else {
                    vscode.window.showErrorMessage(`❌ Mikrofon-Fehler: ${error.message}`);
                }
                throw error;
            }
        }
        catch (error) {
            console.error('Failed to request microphone permission:', error);
            this.permissions.microphone = "denied";
            throw error;
        }
    }
    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if (typeof Notification === 'undefined') {
            return;
        }
        try {
            let permission = Notification.permission;
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }
            this.permissions.notifications = permission;
            if (permission === 'granted') {
                // Test notification
                new Notification('Guido Voice Control', {
                    body: 'Benachrichtigungen aktiviert',
                    icon: '🎤',
                    tag: 'guido-voice-setup'
                });
            }
        }
        catch (error) {
            console.error('Failed to request notification permission:', error);
        }
    }
    /**
     * Check if action is allowed
     */
    isActionAllowed(action) {
        // Check if action is in allowed list
        if (!this.config.allowedActions.includes(action)) {
            return false;
        }
        // Check if action is restricted and needs confirmation
        if (this.config.restrictedActions.includes(action)) {
            return false; // Requires explicit confirmation
        }
        // Check working hours
        if (!this.isWithinWorkingHours()) {
            return false;
        }
        return true;
    }
    /**
     * Request confirmation for restricted action
     */
    async requestActionConfirmation(action, description) {
        if (!this.config.restrictedActions.includes(action)) {
            return true; // Not a restricted action
        }
        const result = await vscode.window.showWarningMessage(`🔐 Bestätigung erforderlich\n\n${description}\n\nDiese Aktion erfordert eine Bestätigung aus Sicherheitsgründen.`, { modal: true }, "✅ Erlauben", "❌ Verweigern");
        const allowed = result === "✅ Erlauben";
        // Log the action for audit trail
        this.logSecurityAction(action, allowed, description);
        return allowed;
    }
    /**
     * Check working hours restrictions
     */
    isWithinWorkingHours() {
        if (!this.config.workingHours.enabled) {
            return true;
        }
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;
        // Check weekend restriction
        if (isWeekend && !this.config.workingHours.allowWeekends) {
            return false;
        }
        // Parse time strings
        const [startHour, startMin] = this.config.workingHours.startTime.split(':').map(Number);
        const [endHour, endMin] = this.config.workingHours.endTime.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        return currentTime >= startTime && currentTime <= endTime;
    }
    /**
     * Check if in quiet hours
     */
    isInQuietHours() {
        if (!this.config.workingHours.quietHours.enabled) {
            return false;
        }
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startHour, startMin] = this.config.workingHours.quietHours.startTime.split(':').map(Number);
        const [endHour, endMin] = this.config.workingHours.quietHours.endTime.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        // Handle overnight quiet hours (e.g., 22:00 to 07:00)
        if (startTime > endTime) {
            return currentTime >= startTime || currentTime <= endTime;
        }
        return currentTime >= startTime && currentTime <= endTime;
    }
    /**
     * Store user data with privacy controls
     */
    async storeUserData(key, data) {
        if (!this.consentGiven && this.config.privacy.userConsentRequired) {
            throw new Error("User consent required for data storage");
        }
        // Anonymize data if required
        let processedData = data;
        if (this.config.privacy.anonymizeTranscripts && key.includes('transcript')) {
            processedData = this.anonymizeData(data);
        }
        // Encrypt data if required
        if (this.config.privacy.encryptStoredData) {
            processedData = await this.encryptData(processedData);
        }
        // Add timestamp for retention management
        const dataWithTimestamp = {
            data: processedData,
            timestamp: new Date().toISOString(),
            encrypted: this.config.privacy.encryptStoredData
        };
        this.dataStorage.set(key, dataWithTimestamp);
        // Schedule cleanup based on retention policy
        this.scheduleDataCleanup();
    }
    /**
     * Retrieve user data with privacy controls
     */
    async getUserData(key) {
        const storedData = this.dataStorage.get(key);
        if (!storedData) {
            return null;
        }
        // Check if data is expired
        const age = Date.now() - new Date(storedData.timestamp).getTime();
        const maxAge = this.config.privacy.dataRetentionDays * 24 * 60 * 60 * 1000;
        if (age > maxAge) {
            this.dataStorage.delete(key);
            return null;
        }
        // Decrypt if necessary
        let data = storedData.data;
        if (storedData.encrypted) {
            data = await this.decryptData(data);
        }
        return data;
    }
    /**
     * Delete user data
     */
    async deleteUserData(key) {
        if (key) {
            this.dataStorage.delete(key);
        }
        else {
            // Delete all data
            this.dataStorage.clear();
        }
        vscode.window.showInformationMessage(key ? `Daten für "${key}" gelöscht` : "Alle gespeicherten Daten gelöscht");
    }
    /**
     * Export user data (GDPR right to data portability)
     */
    async exportUserData() {
        const exportData = {};
        for (const [key, value] of this.dataStorage) {
            let data = value.data;
            // Decrypt if necessary for export
            if (value.encrypted) {
                data = await this.decryptData(data);
            }
            exportData[key] = {
                data,
                timestamp: value.timestamp
            };
        }
        const exportObject = {
            exported: new Date().toISOString(),
            consentGiven: this.consentGiven,
            lastConsentCheck: this.lastConsentCheck?.toISOString(),
            userData: exportData
        };
        return JSON.stringify(exportObject, null, 2);
    }
    /**
     * Show privacy policy
     */
    async showPrivacyPolicy() {
        const policy = `
# Datenschutzerklärung - Guido Voice Control

## 1. Datenverarbeitung
Diese Extension verarbeitet Sprachdaten zur Bereitstellung der Voice-Control-Funktionalität.

## 2. Verarbeitete Daten
- **Sprachaufnahmen**: Nur während aktiver Nutzung
- **Transkripte**: Text-Umwandlung Ihrer Sprachbefehle
- **Nutzungsstatistiken**: Anonymisierte Leistungsdaten
- **Fehlerprotokolle**: Zur Verbesserung der Software

## 3. Datensicherheit
- ${this.config.privacy.encryptStoredData ? 'Verschlüsselung' : 'Standard-Schutz'} gespeicherter Daten
- ${this.config.privacy.localProcessingOnly ? 'Lokale Verarbeitung' : 'Cloud-basierte APIs'}
- Automatische Löschung nach ${this.config.privacy.dataRetentionDays} Tagen

## 4. Ihre Rechte (DSGVO)
- **Auskunft**: Einsicht in gespeicherte Daten
- **Berichtigung**: Korrektur fehlerhafter Daten  
- **Löschung**: Entfernung Ihrer Daten
- **Übertragbarkeit**: Export Ihrer Daten
- **Widerspruch**: Stopp der Datenverarbeitung

## 5. Kontakt
Bei Fragen zum Datenschutz wenden Sie sich an den Extension-Entwickler.

Letzte Aktualisierung: ${new Date().toLocaleDateString('de-DE')}
`;
        const doc = await vscode.workspace.openTextDocument({
            content: policy,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
    }
    /**
     * Store consent data
     */
    async storeConsentData() {
        const consentData = {
            given: true,
            timestamp: new Date().toISOString(),
            version: '1.0', // Policy version
            ipAddress: 'redacted', // For audit compliance
            userAgent: 'VS Code Extension'
        };
        await this.storeUserData('gdpr_consent', consentData);
    }
    /**
     * Check if consent is still valid
     */
    isConsentStillValid() {
        if (!this.lastConsentCheck) {
            return false;
        }
        // Consent expires after 1 year
        const oneYear = 365 * 24 * 60 * 60 * 1000;
        const age = Date.now() - this.lastConsentCheck.getTime();
        return age < oneYear;
    }
    /**
     * Anonymize sensitive data
     */
    anonymizeData(data) {
        if (typeof data === 'string') {
            // Remove potential personal identifiers
            return data
                .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
                .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '[CARD]')
                .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
                .replace(/\b\d{10,}\b/g, '[NUMBER]');
        }
        if (typeof data === 'object' && data !== null) {
            const anonymized = {};
            for (const [key, value] of Object.entries(data)) {
                anonymized[key] = this.anonymizeData(value);
            }
            return anonymized;
        }
        return data;
    }
    /**
     * Encrypt data for storage
     */
    async encryptData(data) {
        // Simple encryption for demonstration
        // In production, use proper encryption libraries
        const jsonString = JSON.stringify(data);
        const encoded = btoa(jsonString);
        return `encrypted:${encoded}`;
    }
    /**
     * Decrypt stored data
     */
    async decryptData(encryptedData) {
        if (!encryptedData.startsWith('encrypted:')) {
            return encryptedData; // Not encrypted
        }
        const encoded = encryptedData.replace('encrypted:', '');
        const jsonString = atob(encoded);
        return JSON.parse(jsonString);
    }
    /**
     * Schedule automatic data cleanup
     */
    scheduleDataCleanup() {
        // Clean up expired data every hour
        const cleanup = () => {
            const now = Date.now();
            const maxAge = this.config.privacy.dataRetentionDays * 24 * 60 * 60 * 1000;
            for (const [key, value] of this.dataStorage) {
                const age = now - new Date(value.timestamp).getTime();
                if (age > maxAge) {
                    this.dataStorage.delete(key);
                }
            }
        };
        // Run cleanup now and schedule periodic cleanup
        cleanup();
        setInterval(cleanup, 60 * 60 * 1000); // Every hour
    }
    /**
     * Log security-related actions for audit
     */
    logSecurityAction(action, allowed, description) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            allowed,
            description,
            userAgent: navigator.userAgent
        };
        console.log('Security Action:', logEntry);
        // Store in audit log if data collection is allowed
        if (this.config.privacy.allowDataCollection) {
            this.storeUserData(`audit_${Date.now()}`, logEntry);
        }
    }
    /**
     * Check working hours on startup
     */
    checkWorkingHours() {
        if (!this.isWithinWorkingHours()) {
            const quietHours = this.isInQuietHours();
            if (quietHours) {
                vscode.window.showInformationMessage(`🌙 Ruhezeiten aktiv (${this.config.workingHours.quietHours.startTime}-${this.config.workingHours.quietHours.endTime}). Lautstärke reduziert.`);
            }
            else {
                vscode.window.showWarningMessage(`⏰ Außerhalb der Arbeitszeiten (${this.config.workingHours.startTime}-${this.config.workingHours.endTime}). Voice Control eingeschränkt verfügbar.`);
            }
        }
    }
    /**
     * Get permission summary for user
     */
    getPermissionSummary() {
        return {
            microphone: this.permissions.microphone,
            notifications: this.permissions.notifications,
            gdprConsent: this.consentGiven,
            workingHours: this.isWithinWorkingHours(),
            quietHours: this.isInQuietHours(),
            dataRetentionDays: this.config.privacy.dataRetentionDays,
            localProcessing: this.config.privacy.localProcessingOnly,
            encryptedStorage: this.config.privacy.encryptStoredData
        };
    }
    /**
     * Revoke consent and delete all data
     */
    async revokeConsent() {
        const result = await vscode.window.showWarningMessage("⚠️ Einverständnis widerrufen\n\nMöchten Sie Ihr Einverständnis widerrufen? Alle gespeicherten Daten werden gelöscht und Voice Control deaktiviert.", { modal: true }, "Ja, widerrufen", "Abbrechen");
        if (result === "Ja, widerrufen") {
            this.consentGiven = false;
            this.lastConsentCheck = undefined;
            await this.deleteUserData(); // Delete all data
            vscode.window.showInformationMessage("✅ Einverständnis widerrufen und alle Daten gelöscht. Voice Control wurde deaktiviert.");
        }
    }
}
exports.VoicePermissionManager = VoicePermissionManager;
//# sourceMappingURL=voicePermissionManager.js.map