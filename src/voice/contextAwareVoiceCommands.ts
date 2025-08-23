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

export class ContextAwareVoiceCommands {
  private router: ModelRouter;
  private voiceController: VoiceController;
  private contextCommands: ContextVoiceCommand[];
  private customCommands: CustomVoiceCommand[];

  constructor(router: ModelRouter, voiceController: VoiceController) {
    this.router = router;
    this.voiceController = voiceController;
    this.contextCommands = [];
    this.customCommands = [];
    
    this.initializeDefaultCommands();
  }

  private initializeDefaultCommands(): void {
    this.contextCommands = [
      // Code explanation commands
      {
        pattern: /guido,?\s*(erkl[äa]re?|explain)\s*(diese?s?|this|the)?\s*(auswahl|selection|code)?/i,
        description: "Erklärt den aktuell ausgewählten Code",
        requiresSelection: true,
        handler: this.handleExplainSelection.bind(this)
      },
      
      // Code generation commands
      {
        pattern: /guido,?\s*(generiere?|generate|create|erstelle)\s*(test|tests?)\s*(f[üu]r|for)?\s*(diese?s?|this)?\s*(auswahl|selection|code)?/i,
        description: "Generiert Tests für den ausgewählten Code",
        requiresSelection: true,
        handler: this.handleGenerateTests.bind(this)
      },
      
      // Refactoring commands
      {
        pattern: /guido,?\s*(refactor|refaktoriere?)\s*(diese?s?|this|the)?\s*(auswahl|selection|code|function|klasse|class)?/i,
        description: "Refaktoriert den ausgewählten Code",
        requiresSelection: true,
        handler: this.handleRefactorCode.bind(this)
      },
      
      // Bug finding commands
      {
        pattern: /guido,?\s*(finde?|find|suche?|search)\s*(bugs?|fehler|problems?|probleme?)\s*(in|im)?\s*(diese?r?|this)?\s*(auswahl|selection|code|datei|file)?/i,
        description: "Sucht nach Bugs im ausgewählten Code",
        requiresSelection: false,
        handler: this.handleFindBugs.bind(this)
      },
      
      // Documentation commands
      {
        pattern: /guido,?\s*(dokumentiere?|document|kommentiere?|comment)\s*(diese?s?|this|the)?\s*(auswahl|selection|code|function)?/i,
        description: "Fügt Dokumentation zum ausgewählten Code hinzu",
        requiresSelection: true,
        handler: this.handleDocumentCode.bind(this)
      },
      
      // Code optimization commands
      {
        pattern: /guido,?\s*(optimiere?|optimize|verbessere?|improve)\s*(diese?s?|this|the)?\s*(auswahl|selection|code|performance)?/i,
        description: "Optimiert den ausgewählten Code für Performance",
        requiresSelection: true,
        handler: this.handleOptimizeCode.bind(this)
      },
      
      // Navigation commands
      {
        pattern: /guido,?\s*(gehe?\s*zu|go\s*to|navigate\s*to)\s*(zeile|line)\s*(\d+)/i,
        description: "Navigiert zu einer bestimmten Zeile",
        requiresSelection: false,
        handler: this.handleGoToLine.bind(this)
      },
      
      // Search commands
      {
        pattern: /guido,?\s*(suche?|search|find)\s*(nach|for)?\s*[\"'](.*?)[\"']/i,
        description: "Sucht nach Text in der aktuellen Datei",
        requiresSelection: false,
        handler: this.handleSearchInFile.bind(this)
      },
      
      // File operations
      {
        pattern: /guido,?\s*(speicher|save|sichern?)\s*(datei|file)?/i,
        description: "Speichert die aktuelle Datei",
        requiresSelection: false,
        handler: this.handleSaveFile.bind(this)
      },
      
      // Multi-model commands
      {
        pattern: /guido,?\s*(vergleiche?|compare)\s*(modelle?|models?)\s*(f[üu]r|for)?\s*(diese?s?|this)?\s*(auswahl|selection|prompt)?/i,
        description: "Vergleicht mehrere AI-Modelle für den ausgewählten Text",
        requiresSelection: false,
        handler: this.handleCompareModels.bind(this)
      }
    ];
  }

  public loadCustomCommands(commands: CustomVoiceCommand[]): void {
    this.customCommands = commands;
  }

  public async processVoiceCommand(transcript: string): Promise<boolean> {
    const context = this.getCurrentContext();
    
    // First, try custom commands
    for (const customCmd of this.customCommands) {
      if (transcript.toLowerCase().includes(customCmd.phrase.toLowerCase())) {
        await this.executeCustomCommand(customCmd, context);
        return true;
      }
    }
    
    // Then try built-in context commands
    for (const cmd of this.contextCommands) {
      const match = transcript.match(cmd.pattern);
      if (match) {
        if (cmd.requiresSelection && !context.selectedText) {
          vscode.window.showWarningMessage(
            `Befehl "${cmd.description}" benötigt eine Textauswahl.`
          );
          return true;
        }
        
        try {
          await cmd.handler(match, context);
          return true;
        } catch (error) {
          vscode.window.showErrorMessage(
            `Fehler beim Ausführen des Sprachbefehls: ${error instanceof Error ? error.message : String(error)}`
          );
          return true;
        }
      }
    }
    
    return false;
  }

  private getCurrentContext(): VoiceCommandContext {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return {};
    }

    const selection = activeEditor.selection;
    const selectedText = selection.isEmpty ? undefined : activeEditor.document.getText(selection);
    
    return {
      activeEditor,
      selectedText,
      currentFile: activeEditor.document.fileName,
      language: activeEditor.document.languageId,
      lineNumber: selection.active.line + 1,
      workspaceFolder: vscode.workspace.getWorkspaceFolder(activeEditor.document.uri)?.uri.fsPath
    };
  }

  private async executeCustomCommand(customCmd: CustomVoiceCommand, context: VoiceCommandContext): Promise<void> {
    if (customCmd.requiresSelection && !context.selectedText) {
      vscode.window.showWarningMessage(
        `Benutzerdefinierter Befehl "${customCmd.phrase}" benötigt eine Textauswahl.`
      );
      return;
    }

    if (customCmd.confirmationRequired) {
      const confirmed = await vscode.window.showQuickPick(['Ja', 'Nein'], {
        placeHolder: `Befehl "${customCmd.phrase}" ausführen?`
      });
      
      if (confirmed !== 'Ja') {
        return;
      }
    }

    switch (customCmd.type) {
      case 'vscode':
        await vscode.commands.executeCommand(customCmd.command);
        break;
        
      case 'shell':
        const terminal = vscode.window.createTerminal('Guido Voice Command');
        terminal.sendText(this.interpolateCommand(customCmd.command, context));
        terminal.show();
        break;
        
      case 'router':
        await this.executeRouterCommand(customCmd.command, context);
        break;
    }
  }

  private interpolateCommand(command: string, context: VoiceCommandContext): string {
    let interpolated = command;
    
    if (context.selectedText) {
      interpolated = interpolated.replace('${selection}', context.selectedText);
    }
    if (context.currentFile) {
      interpolated = interpolated.replace('${file}', context.currentFile);
    }
    if (context.language) {
      interpolated = interpolated.replace('${language}', context.language);
    }
    if (context.lineNumber) {
      interpolated = interpolated.replace('${line}', context.lineNumber.toString());
    }
    if (context.workspaceFolder) {
      interpolated = interpolated.replace('${workspace}', context.workspaceFolder);
    }
    
    return interpolated;
  }

  private async executeRouterCommand(command: string, context: VoiceCommandContext): Promise<void> {
    const interpolatedPrompt = this.interpolateCommand(command, context);
    
    try {
      const result = await this.router.route({
        prompt: interpolatedPrompt,
        mode: 'auto'
      });
      
      // Display result in a new document or notification
      const doc = await vscode.workspace.openTextDocument({
        content: (result as any).content || (result as any).response || 'Keine Antwort erhalten',
        language: 'markdown'
      });
      
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Router-Befehl fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Handler methods for built-in commands
  private async handleExplainSelection(match: RegExpMatchArray, context: VoiceCommandContext): Promise<void> {
    if (!context.selectedText) return;
    
    const prompt = `Erkläre diesen ${context.language || 'Code'} ausführlich:

\`\`\`${context.language || ''}
${context.selectedText}
\`\`\`

Bitte erkläre:
1. Was macht dieser Code?
2. Wie funktioniert er?
3. Welche Konzepte werden verwendet?
4. Gibt es Verbesserungsmöglichkeiten?`;

    await this.executeRouterCommand(prompt, context);
  }

  private async handleGenerateTests(match: RegExpMatchArray, context: VoiceCommandContext): Promise<void> {
    if (!context.selectedText) return;
    
    const prompt = `Generiere umfassende Unit Tests für diesen ${context.language || 'Code'}:

\`\`\`${context.language || ''}
${context.selectedText}
\`\`\`

Bitte erstelle Tests, die:
1. Alle wichtigen Funktionen abdecken
2. Edge Cases berücksichtigen
3. Dem Standard-Testing-Framework für ${context.language || 'diese Sprache'} entsprechen
4. Gut dokumentiert und verständlich sind`;

    await this.executeRouterCommand(prompt, context);
  }

  private async handleRefactorCode(match: RegExpMatchArray, context: VoiceCommandContext): Promise<void> {
    if (!context.selectedText) return;
    
    const prompt = `Refaktoriere diesen ${context.language || 'Code'} für bessere Lesbarkeit, Performance und Wartbarkeit:

\`\`\`${context.language || ''}
${context.selectedText}
\`\`\`

Fokussiere auf:
1. Clean Code Prinzipien
2. Performance-Optimierungen
3. Bessere Namensgebung
4. Modulare Struktur
5. Entfernung von Code-Duplikation`;

    await this.executeRouterCommand(prompt, context);
  }

  private async handleFindBugs(match: RegExpMatchArray, context: VoiceCommandContext): Promise<void> {
    const codeToAnalyze = context.selectedText || (context.activeEditor?.document.getText() || '');
    
    const prompt = `Analysiere diesen ${context.language || 'Code'} auf potentielle Bugs und Probleme:

\`\`\`${context.language || ''}
${codeToAnalyze}
\`\`\`

Suche nach:
1. Syntax-Fehlern
2. Logik-Fehlern
3. Performance-Problemen
4. Sicherheitslücken
5. Best-Practice-Verletzungen
6. Potentiellen Laufzeitfehlern`;

    await this.executeRouterCommand(prompt, context);
  }

  private async handleDocumentCode(match: RegExpMatchArray, context: VoiceCommandContext): Promise<void> {
    if (!context.selectedText) return;
    
    const prompt = `Füge professionelle Dokumentation zu diesem ${context.language || 'Code'} hinzu:

\`\`\`${context.language || ''}
${context.selectedText}
\`\`\`

Erstelle:
1. Ausführliche Funktions-/Methoden-Kommentare
2. Inline-Kommentare für komplexe Logik
3. JSDoc/entsprechende Dokumentationsstandards
4. Beschreibung der Parameter und Rückgabewerte
5. Beispiele für die Nutzung`;

    await this.executeRouterCommand(prompt, context);
  }

  private async handleOptimizeCode(match: RegExpMatchArray, context: VoiceCommandContext): Promise<void> {
    if (!context.selectedText) return;
    
    const prompt = `Optimiere diesen ${context.language || 'Code'} für bessere Performance:

\`\`\`${context.language || ''}
${context.selectedText}
\`\`\`

Fokussiere auf:
1. Algorithmus-Optimierung
2. Speicher-Effizienz
3. Reduzierung der Komplexität
4. Vermeidung redundanter Operationen
5. Nutzung effizienter Datenstrukturen`;

    await this.executeRouterCommand(prompt, context);
  }

  private async handleGoToLine(match: RegExpMatchArray, context: VoiceCommandContext): Promise<void> {
    const lineNumber = parseInt(match[3]) - 1; // Convert to 0-based
    
    if (context.activeEditor && lineNumber >= 0) {
      const position = new vscode.Position(lineNumber, 0);
      context.activeEditor.selection = new vscode.Selection(position, position);
      context.activeEditor.revealRange(new vscode.Range(position, position));
    }
  }

  private async handleSearchInFile(match: RegExpMatchArray, context: VoiceCommandContext): Promise<void> {
    const searchTerm = match[3];
    
    if (context.activeEditor) {
      await vscode.commands.executeCommand('actions.find');
      // Note: VSCode doesn't provide direct API to set search term programmatically
      vscode.window.showInformationMessage(`Suche nach: "${searchTerm}"`);
    }
  }

  private async handleSaveFile(match: RegExpMatchArray, context: VoiceCommandContext): Promise<void> {
    if (context.activeEditor) {
      await context.activeEditor.document.save();
      vscode.window.showInformationMessage('Datei gespeichert');
    }
  }

  private async handleCompareModels(match: RegExpMatchArray, context: VoiceCommandContext): Promise<void> {
    const text = context.selectedText || 'Erkläre die Grundlagen der Programmierung';
    
    await vscode.commands.executeCommand('modelRouter.multiModelChat');
    // The multi-model chat command will handle the comparison
  }

  public getAvailableCommands(): Array<{ pattern: string; description: string; requiresSelection: boolean }> {
    return this.contextCommands.map(cmd => ({
      pattern: cmd.pattern.source,
      description: cmd.description,
      requiresSelection: cmd.requiresSelection || false
    }));
  }

  public getCustomCommands(): CustomVoiceCommand[] {
    return this.customCommands;
  }
}
