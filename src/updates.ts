// src/updates.ts
// Implementierung für automatische Updates und Versionsprüfung

import * as vscode from 'vscode';
import { logger } from './utils/logger';

// Version aus package.json
const CURRENT_VERSION = '0.2.2';

/**
 * Prüft nach Updates für die Guido Model Router-Erweiterung
 */
export async function checkForUpdates(context: vscode.ExtensionContext): Promise<void> {
    const config = vscode.workspace.getConfiguration('modelRouter');
    const autoCheck = config.get<boolean>('updates.autoCheck', true);
    
    if (!autoCheck) {
        logger.info('Automatische Update-Prüfung deaktiviert');
        return;
    }
    
    try {
        logger.info('Prüfe nach Updates...');
        
        // Hier würde normalerweise ein API-Aufruf erfolgen, um die neueste Version zu ermitteln
        // Da wir keinen echten Server haben, simulieren wir das Verhalten
        
        // Simuliere Verzögerung für Netzwerkanfrage
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simuliere neuere Version (in echtem Code durch API-Antwort ersetzen)
        const latestVersion = await getLatestVersion();
        
        if (isNewerVersion(latestVersion, CURRENT_VERSION)) {
            logger.info(`Neue Version verfügbar: ${latestVersion}`);
            const notifyOnStart = config.get<boolean>('updates.notifyOnStart', true);
            
            if (notifyOnStart) {
                const message = `Eine neue Version von Guido Model Router (${latestVersion}) ist verfügbar. Sie verwenden derzeit Version ${CURRENT_VERSION}.`;
                const updateNow = 'Jetzt aktualisieren';
                const skipVersion = 'Diese Version überspringen';
                const response = await vscode.window.showInformationMessage(message, updateNow, skipVersion);
                
                if (response === updateNow) {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/model-router/guido-model-router/releases/latest'));
                } else if (response === skipVersion) {
                    // Speichere in Kontext, dass diese Version übersprungen werden soll
                    context.globalState.update('skipVersion', latestVersion);
                }
            }
        } else {
            logger.info('Sie verwenden bereits die neueste Version');
        }
    } catch (error) {
        logger.error('Fehler bei der Update-Prüfung:', error);
    }
}

/**
 * Prüft, ob eine neue Version verfügbar ist
 * @param latestVersion Die neueste verfügbare Version
 * @param currentVersion Die aktuelle Version
 * @returns true, wenn die neueste Version neuer ist als die aktuelle Version
 */
function isNewerVersion(latestVersion: string, currentVersion: string): boolean {
    const latest = latestVersion.split('.').map(Number);
    const current = currentVersion.split('.').map(Number);
    
    for (let i = 0; i < Math.max(latest.length, current.length); i++) {
        const l = latest[i] || 0;
        const c = current[i] || 0;
        
        if (l > c) return true;
        if (l < c) return false;
    }
    
    return false;
}

/**
 * Holt die neueste Version von GitHub (oder anderem Server)
 * @returns Die neueste verfügbare Version als String
 */
async function getLatestVersion(): Promise<string> {
    try {
        // In einer echten Implementation würden wir die GitHub-API oder eine eigene API abfragen
        // Hier simulieren wir eine Antwort
        
        // Für Testzwecke: Gibt manchmal eine neuere Version zurück, manchmal die aktuelle
        const testVersions = ['0.2.2', '0.2.3', '0.2.2'];
        return testVersions[Math.floor(Math.random() * testVersions.length)];
        
        // Echte Implementation würde etwa so aussehen:
        /*
        const response = await axios.get('https://api.github.com/repos/model-router/guido-model-router/releases/latest');
        return response.data.tag_name.replace('v', '');
        */
    } catch (error) {
        logger.error('Fehler beim Abrufen der neuesten Version:', error);
        return CURRENT_VERSION; // Aktuelle Version zurückgeben, wenn Fehler auftritt
    }
}
