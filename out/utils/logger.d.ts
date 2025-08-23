import * as vscode from 'vscode';
declare class GuidoLogger {
    private initialized;
    private logDir;
    private output;
    init(context: vscode.ExtensionContext): void;
    getLatestLogFile(): string;
    showLatestLog(): Promise<void>;
    clearLogs(): void;
    debug(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
    private write;
    private today;
    private safeString;
}
export declare const logger: GuidoLogger;
export {};
//# sourceMappingURL=logger.d.ts.map