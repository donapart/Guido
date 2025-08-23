/**
 * Context-Aware Voice Commands
 * Erweiterte Sprachsteuerung mit Unterstützung für aktuell selektierten Text/Code
 */
import * as vscode from 'vscode';
import { VoiceController } from './voiceController';
import { ModelRouter } from '../router';
export interface ContextVoiceCommand {
    pattern: RegExp;
    description: string;
    handler: (match: RegExpMatchArray, context: VoiceCommandContext) => Promise<void>;
    requiresSelection?: boolean;
    supportedLanguages?: string[];
}
export interface VoiceCommandContext {
    activeEditor?: vscode.TextEditor;
    selectedText?: string;
    currentFile?: string;
    language?: string;
    lineNumber?: number;
    workspaceFolder?: string;
}
export interface CustomVoiceCommand {
    phrase: string;
    command: string;
    type: 'vscode' | 'shell' | 'router';
    description?: string;
    requiresSelection?: boolean;
    confirmationRequired?: boolean;
}
export declare class ContextAwareVoiceCommands {
    private router;
    private voiceController;
    private contextCommands;
    private customCommands;
    constructor(router: ModelRouter, voiceController: VoiceController);
    private initializeDefaultCommands;
    loadCustomCommands(commands: CustomVoiceCommand[]): void;
    processVoiceCommand(transcript: string): Promise<boolean>;
    private getCurrentContext;
    private executeCustomCommand;
    private interpolateCommand;
    private executeRouterCommand;
    private handleExplainSelection;
    private handleGenerateTests;
    private handleRefactorCode;
    private handleFindBugs;
    private handleDocumentCode;
    private handleOptimizeCode;
    private handleGoToLine;
    private handleSearchInFile;
    private handleSaveFile;
    private handleCompareModels;
    getAvailableCommands(): Array<{
        pattern: string;
        description: string;
        requiresSelection: boolean;
    }>;
    getCustomCommands(): CustomVoiceCommand[];
}
//# sourceMappingURL=contextAwareVoiceCommands.d.ts.map