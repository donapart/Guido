// src/logging.ts
// Zentralisiertes Logging-System für Guido

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface LogMessage {
    timestamp: string;
    level: string;
    component: string;
    message: string;
    data?: any;
}

class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel | undefined;
    private logFile: string | undefined;
    private context: vscode.ExtensionContext | undefined;
    private detailLevel: string = 'normal';

    private constructor() {
        // Private Konstruktor für Singleton-Pattern
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public init(context: vscode.ExtensionContext): void {
        this.context = context;
        this.outputChannel = vscode.window.createOutputChannel('Guido Model Router');
        
        // Erstelle Logs-Verzeichnis im Extension-Verzeichnis
        const logDir = path.join(context.extensionPath, 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        // Logdatei mit Zeitstempel erstellen
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.logFile = path.join(logDir, `guido-${timestamp}.log`);
        
        // Log-Detail-Level aus Konfiguration lesen
        const config = vscode.workspace.getConfiguration('modelRouter');
        this.detailLevel = config.get<string>('logs.detailLevel', 'normal');
        
        // Überwache Änderungen der Konfiguration
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('modelRouter.logs.detailLevel')) {
                const config = vscode.workspace.getConfiguration('modelRouter');
                this.detailLevel = config.get<string>('logs.detailLevel', 'normal');
                this.info('LogLevel geändert', { newLevel: this.detailLevel });
            }
        });
        
        this.info('Logger initialisiert', { logFile: this.logFile });
    }

    public debug(message: string, data?: any): void {
        if (this.detailLevel === 'debug' || this.detailLevel === 'verbose') {
            this.log('DEBUG', 'Guido', message, data);
        }
    }

    public info(message: string, data?: any): void {
        if (this.detailLevel !== 'minimal') {
            this.log('INFO', 'Guido', message, data);
        }
    }

    public warn(message: string, data?: any): void {
        this.log('WARN', 'Guido', message, data);
    }

    public error(message: string, data?: any): void {
        this.log('ERROR', 'Guido', message, data);
    }

    private log(level: string, component: string, message: string, data?: any): void {
        const timestamp = new Date().toISOString();
        
        // Nachricht formatieren
        const logMessage: LogMessage = {
            timestamp,
            level,
            component,
            message,
            data
        };
        
        // In OutputChannel schreiben
        if (this.outputChannel) {
            this.outputChannel.appendLine(`[${timestamp}] [${level}] [${component}] ${message}`);
            if (data) {
                this.outputChannel.appendLine(JSON.stringify(data, null, 2));
            }
        }
        
        // In Logdatei schreiben
        if (this.logFile) {
            fs.appendFileSync(this.logFile, JSON.stringify(logMessage) + '\n');
        }
        
        // Bei Fehlern zusätzlich in der Konsole ausgeben
        if (level === 'ERROR') {
            console.error(`[Guido] ${message}`, data);
        }
    }

    public showLogs(): void {
        if (this.outputChannel) {
            this.outputChannel.show();
        }
    }

    public clearLogs(): void {
        if (this.outputChannel) {
            this.outputChannel.clear();
        }
    }
}

export function getLogger(component: string): ComponentLogger {
    return new ComponentLogger(component);
}

class ComponentLogger {
    private component: string;
    
    constructor(component: string) {
        this.component = component;
    }
    
    public debug(message: string, data?: any): void {
        const logger = Logger.getInstance();
        logger.debug(message, data ? { component: this.component, ...data } : { component: this.component });
    }
    
    public info(message: string, data?: any): void {
        const logger = Logger.getInstance();
        logger.info(message, data ? { component: this.component, ...data } : { component: this.component });
    }
    
    public warn(message: string, data?: any): void {
        const logger = Logger.getInstance();
        logger.warn(message, data ? { component: this.component, ...data } : { component: this.component });
    }
    
    public error(message: string, data?: any): void {
        const logger = Logger.getInstance();
        logger.error(message, data ? { component: this.component, ...data } : { component: this.component });
    }
}

export const logger = Logger.getInstance();
