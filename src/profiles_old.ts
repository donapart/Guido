// src/profiles.ts
// Implementierung für Profile und Presets

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
        
        // Erstelle Profiles-Verzeichnis, wenn es nicht existiert
        if (!fs.existsSync(this.profilesDir)) {
            fs.mkdirSync(this.profilesDir, { recursive: true });
        }
    }

    /**
     * Initialisiert den Profile-Manager und lädt verfügbare Profile
     */
    public async initialize(): Promise<void> {
        try {
            logger.info('Initialisiere Profile-Manager');
            await this.loadProfiles();
            
            // Lade aktuelles Profil aus den Einstellungen
            const config = vscode.workspace.getConfiguration('modelRouter');
            this.currentProfile = config.get<string>('profiles.defaultProfile', 'standard');
            
            logger.info(`Aktuelles Profil: ${this.currentProfile}`);
        } catch (error) {
            logger.error('Fehler bei der Initialisierung des Profile-Managers:', error);
        }
    }

    /**
     * Lädt alle verfügbaren Profile
     */
    private async loadProfiles(): Promise<void> {
        try {
            // Lade Standard-Profile
            this.loadStandardProfiles();
            
            // Lade benutzerdefinierte Profile aus dem Profiles-Verzeichnis
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

    /**
     * Lädt die Standard-Profile
     */
    private loadStandardProfiles(): void {
        // Standard-Profil
        const standardProfile: ProfileConfig = {
            mode: "auto",
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
        
        // Leistungs-Profil
        const performanceProfile: ProfileConfig = {
            mode: "quality",
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
        
        // Schnelles Profil
        const fastProfile: ProfileConfig = {
            mode: "speed",
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

    /**
     * Gibt alle verfügbaren Profile zurück
     */
    public getAvailableProfiles(): string[] {
        return Array.from(this.profilesMap.keys());
    }

    /**
     * Gibt ein bestimmtes Profil zurück
     * @param profileName Name des Profils
     */
    public getProfile(profileName: string): ProfileConfig | undefined {
        return this.profilesMap.get(profileName);
    }

    /**
     * Gibt das aktuelle Profil zurück
     */
    public getCurrentProfile(): ProfileConfig | undefined {
        return this.profilesMap.get(this.currentProfile);
    }

    /**
     * Setzt das aktuelle Profil
     * @param profileName Name des Profils
     */
    public async setCurrentProfile(profileName: string): Promise<boolean> {
        if (!this.profilesMap.has(profileName)) {
            logger.error(`Profil ${profileName} nicht gefunden`);
            return false;
        }
        
        this.currentProfile = profileName;
        
        // Speichern in den Einstellungen
        const config = vscode.workspace.getConfiguration('modelRouter');
        await config.update('profiles.defaultProfile', profileName, vscode.ConfigurationTarget.Global);
        
        logger.info(`Aktuelles Profil geändert zu: ${profileName}`);
        return true;
    }

    /**
     * Speichert ein benutzerdefiniertes Profil
     * @param profileName Name des Profils
     * @param profileConfig Profil-Konfiguration
     */
    public async saveProfile(profileName: string, profileConfig: ProfileConfig): Promise<boolean> {
        try {
            // Speichern im Map
            this.profilesMap.set(profileName, profileConfig);
            
            // Speichern in Datei
            const profilePath = path.join(this.profilesDir, `${profileName}.json`);
            fs.writeFileSync(profilePath, JSON.stringify(profileConfig, null, 2), 'utf8');
            
            logger.info(`Profil ${profileName} gespeichert`);
            return true;
        } catch (error) {
            logger.error(`Fehler beim Speichern des Profils ${profileName}:`, error);
            return false;
        }
    }

    /**
     * Löscht ein benutzerdefiniertes Profil
     * @param profileName Name des Profils
     */
    public async deleteProfile(profileName: string): Promise<boolean> {
        // Standard-Profile können nicht gelöscht werden
        if (['standard', 'performance', 'fast'].includes(profileName)) {
            logger.error(`Standard-Profil ${profileName} kann nicht gelöscht werden`);
            return false;
        }
        
        try {
            // Aus Map entfernen
            this.profilesMap.delete(profileName);
            
            // Datei löschen
            const profilePath = path.join(this.profilesDir, `${profileName}.json`);
            if (fs.existsSync(profilePath)) {
                fs.unlinkSync(profilePath);
            }
            
            // Wenn das gelöschte Profil das aktuelle war, wechsle zu standard
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
