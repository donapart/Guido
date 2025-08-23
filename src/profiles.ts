// src/profiles.ts
// Profile-Manager für Guido Model Router

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from './utils/logger';
import { ProfileConfig } from './config';

/**
 * Profile-Manager für Guido Model Router
 */
export class ProfileManager {
    private profilesMap: Map<string, ProfileConfig> = new Map();
    private context: vscode.ExtensionContext;
    private profilesDir: string;
    private currentProfile: string = 'standard';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.profilesDir = path.join(context.extensionPath, 'profiles');
        
        if (!fs.existsSync(this.profilesDir)) {
            fs.mkdirSync(this.profilesDir, { recursive: true });
        }
    }

    public async initialize(): Promise<void> {
        try {
            logger.info('Initialisiere Profile-Manager');
            await this.loadProfiles();
            
            const config = vscode.workspace.getConfiguration('modelRouter');
            this.currentProfile = config.get<string>('profiles.defaultProfile', 'standard');
            
            logger.info(`Aktuelles Profil: ${this.currentProfile}`);
        } catch (error) {
            logger.error('Fehler bei der Initialisierung des Profile-Managers:', error);
        }
    }

    private async loadProfiles(): Promise<void> {
        try {
            this.loadStandardProfiles();
            
            if (fs.existsSync(this.profilesDir)) {
                const files = fs.readdirSync(this.profilesDir);
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        try {
                            const profileName = path.basename(file, '.json');
                            const profilePath = path.join(this.profilesDir, file);
                            const profileContent = fs.readFileSync(profilePath, 'utf8');
                            const profileConfig = JSON.parse(profileContent) as ProfileConfig;
                            
                            this.profilesMap.set(profileName, profileConfig);
                            logger.info(`Benutzerdefiniertes Profil geladen: ${profileName}`);
                        } catch (err) {
                            logger.error(`Fehler beim Laden des Profils ${file}:`, err);
                        }
                    }
                }
            }
            
            logger.info(`${this.profilesMap.size} Profile geladen`);
        } catch (error) {
            logger.error('Fehler beim Laden der Profile:', error);
        }
    }

    private loadStandardProfiles(): void {
        // Standard-Voice-Konfiguration für alle Profile
        const standardVoiceConfig = {
            enabled: true,
            wakeWord: "Guido",
            alternativeWakeWords: ["Hey Guido", "OK Guido"],
            language: {
                recognition: "de-DE" as const,
                response: "de" as const,
                autoDetect: true,
                supportedLanguages: ["de-DE" as const, "en-US" as const]
            },
            audio: {
                enableBeep: true,
                beepSound: "success" as const,
                inputDevice: "default",
                outputDevice: "default",
                volume: 0.8,
                mute: false,
                customVoice: undefined,
                ttsEngine: "system" as const,
                ttsOptions: {
                    speed: 1.0,
                    pitch: 1.0,
                    volume: 0.8
                }
            },
            recording: {
                maxDuration: 30,
                enableVAD: true,
                vadSensitivity: 0.5,
                noiseReduction: true,
                echoCancellation: true,
                autoGainControl: true
            },
            confirmation: {
                required: false,
                summaryEnabled: true,
                smartConfirmation: true,
                confirmWords: {
                    de: ["ja", "ok", "bestätigen"],
                    en: ["yes", "ok", "confirm"],
                    fr: ["oui", "ok", "confirmer"],
                    es: ["sí", "ok", "confirmar"]
                },
                cancelWords: {
                    de: ["nein", "abbrechen", "stop"],
                    en: ["no", "cancel", "stop"],
                    fr: ["non", "annuler", "stop"],
                    es: ["no", "cancelar", "stop"]
                },
                timeoutSeconds: 5,
                repeatSummary: false,
                askForClarification: true
            },
            processing: {
                contextAwareness: true,
                emotionDetection: false,
                intentRecognition: true,
                multiTurnConversation: true,
                memoryEnabled: false,
                personalityMode: "professional" as const,
                grammarCorrection: true,
                slangDetection: false,
                abbreviationExpansion: true
            },
            routing: {
                mode: "auto" as const,
                rules: [],
                fallback: "text",
                priorityProvider: "openai"
            },
            permissions: {
                required: [],
                whitelist: [],
                blacklist: []
            },
            commands: {
                basic: {
                    enabled: true,
                    commands: ["start", "stop", "help", "status"]
                }
            },
            interface: {
                showStatus: true,
                visualFeedback: true,
                statusPosition: "bottomRight" as const
            },
            analytics: {
                enabled: false,
                anonymous: true,
                includeAudio: false,
                performanceMetrics: false
            },
            advanced: {
                debug: false,
                experimental: {
                    enabled: false,
                    features: []
                },
                customWakeWords: {
                    enabled: false,
                    sensitivity: 0.7
                }
            },
            emergency: {
                panicMode: "stop",
                debugMode: false,
                verboseLogging: false,
                fallbackToText: true,
                errorRecovery: {
                    maxRetries: 3,
                    backoffStrategy: "exponential" as const,
                    resetTimeout: 60000
                }
            }
        };

        // Standard-Profil: Automatische Auswahl
        const standardProfile: ProfileConfig = {
            mode: "auto",
            voice: standardVoiceConfig,
            providers: [],
            routing: {
                rules: [],
                default: {
                    prefer: ['openai:gpt-4o-mini'],
                    target: 'chat'
                }
            }
        };
        this.profilesMap.set('standard', standardProfile);
        
        // Leistungs-Profil: Beste Qualität
        const performanceProfile: ProfileConfig = {
            mode: "quality",
            voice: {
                ...standardVoiceConfig,
                processing: {
                    ...standardVoiceConfig.processing,
                    timeout: 10000 // Längere Timeouts für bessere Qualität
                }
            },
            providers: [],
            routing: {
                rules: [],
                default: {
                    prefer: ['openai:gpt-4o'],
                    target: 'chat'
                }
            }
        };
        this.profilesMap.set('performance', performanceProfile);
        
        // Schnelles Profil: Schnelle Antworten
        const fastProfile: ProfileConfig = {
            mode: "speed",
            voice: {
                ...standardVoiceConfig,
                processing: {
                    ...standardVoiceConfig.processing,
                    timeout: 2000 // Kürzere Timeouts für Geschwindigkeit
                },
                confirmation: {
                    ...standardVoiceConfig.confirmation,
                    required: false // Keine Bestätigung für Geschwindigkeit
                }
            },
            providers: [],
            routing: {
                rules: [],
                default: {
                    prefer: ['openai:gpt-3.5-turbo'],
                    target: 'chat'
                }
            }
        };
        this.profilesMap.set('fast', fastProfile);
        
        logger.info('Standard-Profile geladen');
    }

    public getAvailableProfiles(): string[] {
        return Array.from(this.profilesMap.keys());
    }

    public getProfile(profileName: string): ProfileConfig | undefined {
        return this.profilesMap.get(profileName);
    }

    public getCurrentProfile(): ProfileConfig | undefined {
        return this.profilesMap.get(this.currentProfile);
    }

    public async setCurrentProfile(profileName: string): Promise<boolean> {
        if (!this.profilesMap.has(profileName)) {
            logger.error(`Profil ${profileName} nicht gefunden`);
            return false;
        }
        
        this.currentProfile = profileName;
        
        const config = vscode.workspace.getConfiguration('modelRouter');
        await config.update('profiles.defaultProfile', profileName, vscode.ConfigurationTarget.Global);
        
        logger.info(`Aktuelles Profil geändert zu: ${profileName}`);
        return true;
    }

    public async saveProfile(profileName: string, profileConfig: ProfileConfig): Promise<boolean> {
        try {
            this.profilesMap.set(profileName, profileConfig);
            
            const profilePath = path.join(this.profilesDir, `${profileName}.json`);
            fs.writeFileSync(profilePath, JSON.stringify(profileConfig, null, 2), 'utf8');
            
            logger.info(`Profil ${profileName} gespeichert`);
            return true;
        } catch (error) {
            logger.error(`Fehler beim Speichern des Profils ${profileName}:`, error);
            return false;
        }
    }

    public async deleteProfile(profileName: string): Promise<boolean> {
        if (['standard', 'performance', 'fast'].includes(profileName)) {
            logger.error(`Standard-Profil ${profileName} kann nicht gelöscht werden`);
            return false;
        }
        
        try {
            this.profilesMap.delete(profileName);
            
            const profilePath = path.join(this.profilesDir, `${profileName}.json`);
            if (fs.existsSync(profilePath)) {
                fs.unlinkSync(profilePath);
            }
            
            if (this.currentProfile === profileName) {
                await this.setCurrentProfile('standard');
            }
            
            logger.info(`Profil ${profileName} gelöscht`);
            return true;
        } catch (error) {
            logger.error(`Fehler beim Löschen des Profils ${profileName}:`, error);
            return false;
        }
    }
}
