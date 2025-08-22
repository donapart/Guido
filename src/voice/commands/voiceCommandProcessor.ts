/**
 * Voice Command Processor - Handles voice commands and routing
 */

import * as vscode from "vscode";
import {
  VoiceConfig,
  VoiceResponse,
  VoiceRoutingContext,
  VoiceCommandHandler,
  SupportedLanguage
} from "../types";
import { ModelRouter } from "../../router";

export class VoiceCommandProcessor {
  private commandHandlers: Map<string, VoiceCommandHandler> = new Map();
  private config: VoiceConfig;
  private router: ModelRouter;
  private lastResponse?: VoiceResponse;

  constructor(config: VoiceConfig, router: ModelRouter) {
    this.config = config;
    this.router = router;
    this.registerBuiltinCommands();
  }

  /**
   * Process voice command and return response if handled
   */
  async processCommand(context: VoiceRoutingContext): Promise<VoiceResponse | null> {
    const transcript = context.transcript.toLowerCase();
    
    // Check system commands first
    const systemResponse = await this.processSystemCommands(transcript, context);
    if (systemResponse) {
      return systemResponse;
    }

    // Check language commands
    const languageResponse = await this.processLanguageCommands(transcript, context);
    if (languageResponse) {
      return languageResponse;
    }

    // Check routing commands
    const routingResponse = await this.processRoutingCommands(transcript, context);
    if (routingResponse) {
      return routingResponse;
    }

    // Check VSCode commands
    const vscodeResponse = await this.processVSCodeCommands(transcript, context);
    if (vscodeResponse) {
      return vscodeResponse;
    }

    // Check development commands
    const devResponse = await this.processDevelopmentCommands(transcript, context);
    if (devResponse) {
      return devResponse;
    }

    // Check registered command handlers
    for (const [id, handler] of this.commandHandlers) {
      if (this.matchesCommandPattern(transcript, handler, context.language)) {
        try {
          return await handler.handler(context);
        } catch (error) {
          console.error(`Command handler error [${id}]:`, error);
        }
      }
    }

    return null; // No command matched, will be processed as regular AI query
  }

  /**
   * Register a new command handler
   */
  registerHandler(handler: VoiceCommandHandler): void {
    this.commandHandlers.set(handler.id, handler);
  }

  /**
   * Unregister a command handler
   */
  unregisterHandler(id: string): void {
    this.commandHandlers.delete(id);
  }

  /**
   * Get all registered command handlers
   */
  getHandlers(): VoiceCommandHandler[] {
    return Array.from(this.commandHandlers.values());
  }

  // System Commands
  private async processSystemCommands(
    transcript: string,
    context: VoiceRoutingContext
  ): Promise<VoiceResponse | null> {
    const commands = this.config.commands.system;
    const langCode = this.getLanguageCode(context.language);

    // Guido aufwachen/schlafen
    if (this.matchesAny(transcript, ["guido aufwachen", "guido wake up", "start listening"])) {
      return this.createSystemResponse("Ich bin bereits aktiv und höre zu.", "startListening");
    }

    if (this.matchesAny(transcript, ["guido schlafen", "guido sleep", "stop listening"])) {
      return this.createSystemResponse("Gehe in Ruhemodus. Sagen Sie 'Guido aufwachen' um mich zu aktivieren.", "stopListening");
    }

    // Audio-Steuerung
    if (this.matchesAny(transcript, ["mikrofon stumm", "mute microphone", "stumm schalten"])) {
      return this.createSystemResponse("Mikrofon stummgeschaltet.", "muteAudio");
    }

    if (this.matchesAny(transcript, ["mikrofon an", "unmute microphone", "mikrofon aktivieren"])) {
      return this.createSystemResponse("Mikrofon aktiviert.", "unmuteAudio");
    }

    // Lautstärke
    if (this.matchesAny(transcript, ["lauter sprechen", "increase volume", "plus lauter"])) {
      return this.createSystemResponse("Lautstärke erhöht.", "increaseVolume");
    }

    if (this.matchesAny(transcript, ["leiser sprechen", "decrease volume", "weniger laut"])) {
      return this.createSystemResponse("Lautstärke verringert.", "decreaseVolume");
    }

    // Geschwindigkeit
    if (this.matchesAny(transcript, ["schneller sprechen", "speak faster", "tempo erhöhen"])) {
      return this.createSystemResponse("Sprechgeschwindigkeit erhöht.", "increaseSpeed");
    }

    if (this.matchesAny(transcript, ["langsamer sprechen", "speak slower", "tempo verringern"])) {
      return this.createSystemResponse("Sprechgeschwindigkeit verringert.", "decreaseSpeed");
    }

    return null;
  }

  // Language Commands
  private async processLanguageCommands(
    transcript: string,
    context: VoiceRoutingContext
  ): Promise<VoiceResponse | null> {
    if (this.matchesAny(transcript, ["wechsle zu englisch", "switch to english", "english please"])) {
      return this.createLanguageResponse("Switching to English language.", "switchToEnglish");
    }

    if (this.matchesAny(transcript, ["switch to german", "wechsle zu deutsch", "deutsch bitte"])) {
      return this.createLanguageResponse("Wechsle zur deutschen Sprache.", "switchToGerman");
    }

    if (this.matchesAny(transcript, ["parlez français", "wechsle zu französisch", "switch to french"])) {
      return this.createLanguageResponse("Je passe au français.", "switchToFrench");
    }

    if (this.matchesAny(transcript, ["habla español", "wechsle zu spanisch", "switch to spanish"])) {
      return this.createLanguageResponse("Cambiando al español.", "switchToSpanish");
    }

    if (this.matchesAny(transcript, ["parla italiano", "wechsle zu italienisch", "switch to italian"])) {
      return this.createLanguageResponse("Passaggio all'italiano.", "switchToItalian");
    }

    return null;
  }

  // Routing Commands
  private async processRoutingCommands(
    transcript: string,
    context: VoiceRoutingContext
  ): Promise<VoiceResponse | null> {
    if (this.matchesAny(transcript, ["benutze schnelles modell", "use fast model", "speed mode"])) {
      return this.createRoutingResponse("Wechsle zu schnellen Modellen für bessere Performance.", "setModeSpeed");
    }

    if (this.matchesAny(transcript, ["benutze bestes modell", "use best model", "quality mode"])) {
      return this.createRoutingResponse("Wechsle zu hochwertigen Modellen für beste Ergebnisse.", "setModeQuality");
    }

    if (this.matchesAny(transcript, ["benutze günstiges modell", "use cheap model", "economy mode"])) {
      return this.createRoutingResponse("Wechsle zu kostengünstigen Modellen.", "setModeCheap");
    }

    if (this.matchesAny(transcript, ["nur lokale modelle", "local only", "offline mode"])) {
      return this.createRoutingResponse("Verwende nur lokale Modelle für maximalen Datenschutz.", "setModeLocal");
    }

    if (this.matchesAny(transcript, ["datenschutz modus", "privacy mode", "private mode"])) {
      return this.createRoutingResponse("Datenschutz-Modus aktiviert. Alle Daten bleiben lokal.", "setModePrivacy");
    }

    return null;
  }

  // VSCode Commands
  private async processVSCodeCommands(
    transcript: string,
    context: VoiceRoutingContext
  ): Promise<VoiceResponse | null> {
    // File operations
    if (this.matchesAny(transcript, ["öffne datei", "open file", "datei öffnen"])) {
      await vscode.commands.executeCommand("workbench.action.quickOpen");
      return this.createVSCodeResponse("Datei-Auswahl geöffnet.", "openFile");
    }

    if (this.matchesAny(transcript, ["neue datei", "new file", "datei erstellen"])) {
      await vscode.commands.executeCommand("workbench.action.files.newUntitledFile");
      return this.createVSCodeResponse("Neue Datei erstellt.", "newFile");
    }

    if (this.matchesAny(transcript, ["speichern", "save file", "datei speichern"])) {
      await vscode.commands.executeCommand("workbench.action.files.save");
      return this.createVSCodeResponse("Datei gespeichert.", "saveFile");
    }

    // Code operations
    if (this.matchesAny(transcript, ["code formatieren", "format code", "format document"])) {
      await vscode.commands.executeCommand("editor.action.formatDocument");
      return this.createVSCodeResponse("Code formatiert.", "formatCode");
    }

    // Search operations
    if (this.matchesAny(transcript, ["suche nach", "search for", "find in files"])) {
      await vscode.commands.executeCommand("workbench.action.findInFiles");
      return this.createVSCodeResponse("Suche in Dateien geöffnet.", "searchInFiles");
    }

    if (this.matchesAny(transcript, ["ersetze", "replace", "find and replace"])) {
      await vscode.commands.executeCommand("editor.action.startFindReplaceAction");
      return this.createVSCodeResponse("Suchen und Ersetzen geöffnet.", "replaceInFiles");
    }

    // Git operations
    if (this.matchesAny(transcript, ["git status", "source control", "versionskontrolle"])) {
      await vscode.commands.executeCommand("workbench.view.scm");
      return this.createVSCodeResponse("Git Status angezeigt.", "gitStatus");
    }

    // Terminal
    if (this.matchesAny(transcript, ["terminal öffnen", "open terminal", "terminal"])) {
      await vscode.commands.executeCommand("workbench.action.terminal.new");
      return this.createVSCodeResponse("Neues Terminal geöffnet.", "openTerminal");
    }

    return null;
  }

  // Development Commands
  private async processDevelopmentCommands(
    transcript: string,
    context: VoiceRoutingContext
  ): Promise<VoiceResponse | null> {
    const editor = vscode.window.activeTextEditor;
    const selectedText = editor?.document.getText(editor.selection);
    const currentFile = editor?.document.fileName;

    if (this.matchesAny(transcript, ["erkläre diesen code", "explain this code", "was macht dieser code"])) {
      if (!selectedText && !currentFile) {
        return this.createDevResponse("Bitte wählen Sie Code aus oder öffnen Sie eine Datei.", "explainCode");
      }

      const codeToExplain = selectedText || editor?.document.getText() || "";
      const explanation = await this.explainCode(codeToExplain, context);
      return explanation;
    }

    if (this.matchesAny(transcript, ["finde bugs", "find bugs", "code review"])) {
      if (!selectedText && !currentFile) {
        return this.createDevResponse("Bitte wählen Sie Code aus oder öffnen Sie eine Datei.", "findBugs");
      }

      const codeToReview = selectedText || editor?.document.getText() || "";
      const review = await this.reviewCode(codeToReview, context);
      return review;
    }

    if (this.matchesAny(transcript, ["schreibe tests", "write tests", "generate tests"])) {
      if (!selectedText && !currentFile) {
        return this.createDevResponse("Bitte wählen Sie Code aus oder öffnen Sie eine Datei.", "writeTests");
      }

      const codeForTests = selectedText || editor?.document.getText() || "";
      const tests = await this.generateTests(codeForTests, context);
      return tests;
    }

    if (this.matchesAny(transcript, ["optimiere code", "optimize code", "improve performance"])) {
      if (!selectedText && !currentFile) {
        return this.createDevResponse("Bitte wählen Sie Code aus oder öffnen Sie eine Datei.", "optimizeCode");
      }

      const codeToOptimize = selectedText || editor?.document.getText() || "";
      const optimization = await this.optimizeCode(codeToOptimize, context);
      return optimization;
    }

    if (this.matchesAny(transcript, ["dokumentation erstellen", "generate docs", "create documentation"])) {
      if (!selectedText && !currentFile) {
        return this.createDevResponse("Bitte wählen Sie Code aus oder öffnen Sie eine Datei.", "generateDocs");
      }

      const codeForDocs = selectedText || editor?.document.getText() || "";
      const docs = await this.generateDocumentation(codeForDocs, context);
      return docs;
    }

    return null;
  }

  // AI-powered development helpers
  private async explainCode(code: string, context: VoiceRoutingContext): Promise<VoiceResponse> {
    const prompt = `Erkläre diesen Code in einfachen, verständlichen Worten. Fokussiere dich auf die Hauptfunktionalität und wichtige Details:

\`\`\`
${code}
\`\`\`

Antworten Sie auf Deutsch und strukturiert für Sprachausgabe.`;

    return await this.executeAICommand(prompt, context, "Code-Erklärung");
  }

  private async reviewCode(code: string, context: VoiceRoutingContext): Promise<VoiceResponse> {
    const prompt = `Führe eine Code-Review durch und finde potentielle Bugs, Verbesserungen und Best-Practice-Verletzungen:

\`\`\`
${code}
\`\`\`

Fokussiere dich auf:
- Potentielle Bugs und Fehler
- Performance-Probleme  
- Sicherheitslücken
- Code-Qualität und Lesbarkeit

Antworten Sie strukturiert auf Deutsch.`;

    return await this.executeAICommand(prompt, context, "Code-Review");
  }

  private async generateTests(code: string, context: VoiceRoutingContext): Promise<VoiceResponse> {
    const prompt = `Generiere sinnvolle Unit Tests für diesen Code:

\`\`\`
${code}
\`\`\`

Erstelle Tests die:
- Die Hauptfunktionalität abdecken
- Edge Cases testen
- Fehlerbehandlung prüfen
- Gut lesbar und wartbar sind

Verwende das passende Test-Framework für die Sprache.`;

    return await this.executeAICommand(prompt, context, "Test-Generierung");
  }

  private async optimizeCode(code: string, context: VoiceRoutingContext): Promise<VoiceResponse> {
    const prompt = `Optimiere diesen Code für bessere Performance, Lesbarkeit und Wartbarkeit:

\`\`\`
${code}
\`\`\`

Fokussiere dich auf:
- Performance-Optimierungen
- Code-Struktur verbessern
- Bessere Algorithmen vorschlagen
- Best Practices anwenden

Erkläre die Änderungen kurz auf Deutsch.`;

    return await this.executeAICommand(prompt, context, "Code-Optimierung");
  }

  private async generateDocumentation(code: string, context: VoiceRoutingContext): Promise<VoiceResponse> {
    const prompt = `Erstelle ausführliche Dokumentation für diesen Code:

\`\`\`
${code}
\`\`\`

Inkludiere:
- Funktionsbeschreibung
- Parameter-Dokumentation
- Rückgabewerte
- Verwendungsbeispiele
- Mögliche Exceptions

Verwende den passenden Dokumentations-Stil für die Sprache (JSDoc, DocString, etc.).`;

    return await this.executeAICommand(prompt, context, "Dokumentation");
  }

  // Helper methods
  private async executeAICommand(
    prompt: string,
    context: VoiceRoutingContext,
    operation: string
  ): Promise<VoiceResponse> {
    try {
      const routingResult = await this.router.route({
        prompt,
        mode: this.config.routing.preferFast ? "speed" : "auto",
        lang: this.getLanguageFromContext(context),
        metadata: { 
          isVoiceInput: true,
          operation: operation.toLowerCase()
        }
      });

      const startTime = Date.now();
      const aiResult = await routingResult.provider.chatComplete(
        routingResult.modelName,
        [{ role: "user", content: prompt }],
        { maxTokens: 800, temperature: 0.7 }
      );
      const duration = Date.now() - startTime;

      return {
        text: aiResult.content,
        shouldSpeak: this.config.audio.ttsEnabled,
        metadata: {
          model: routingResult.modelName,
          provider: routingResult.providerId,
          cost: 0, // Will be calculated by price manager
          duration,
          tokens: {
            input: aiResult.usage?.inputTokens || 0,
            output: aiResult.usage?.outputTokens || 0
          }
        }
      };
    } catch (error) {
      return {
        text: `Fehler bei ${operation}: ${error.message}`,
        shouldSpeak: true,
        metadata: {
          model: "error",
          provider: "system",
          cost: 0,
          duration: 0,
          tokens: { input: 0, output: 0 }
        }
      };
    }
  }

  private createSystemResponse(message: string, action: string): VoiceResponse {
    // Execute the action via VSCode commands
    vscode.commands.executeCommand(`modelRouter.voice.${action}`);
    
    return {
      text: message,
      shouldSpeak: this.config.audio.ttsEnabled,
      metadata: {
        model: "system",
        provider: "voice-commands",
        cost: 0,
        duration: 0,
        tokens: { input: 0, output: 0 }
      }
    };
  }

  private createLanguageResponse(message: string, action: string): VoiceResponse {
    // Execute language change
    vscode.commands.executeCommand(`modelRouter.voice.${action}`);
    
    return {
      text: message,
      shouldSpeak: this.config.audio.ttsEnabled,
      metadata: {
        model: "system",
        provider: "voice-commands",
        cost: 0,
        duration: 0,
        tokens: { input: 0, output: 0 }
      }
    };
  }

  private createRoutingResponse(message: string, action: string): VoiceResponse {
    // Execute routing change
    vscode.commands.executeCommand(`modelRouter.${action.replace('setMode', 'switchMode').toLowerCase()}`);
    
    return {
      text: message,
      shouldSpeak: this.config.audio.ttsEnabled,
      metadata: {
        model: "system",
        provider: "voice-commands",
        cost: 0,
        duration: 0,
        tokens: { input: 0, output: 0 }
      }
    };
  }

  private createVSCodeResponse(message: string, action: string): VoiceResponse {
    return {
      text: message,
      shouldSpeak: this.config.audio.ttsEnabled,
      metadata: {
        model: "system",
        provider: "vscode-commands",
        cost: 0,
        duration: 0,
        tokens: { input: 0, output: 0 }
      }
    };
  }

  private createDevResponse(message: string, action: string): VoiceResponse {
    return {
      text: message,
      shouldSpeak: this.config.audio.ttsEnabled,
      metadata: {
        model: "system",
        provider: "dev-commands",
        cost: 0,
        duration: 0,
        tokens: { input: 0, output: 0 }
      }
    };
  }

  private matchesAny(transcript: string, patterns: string[]): boolean {
    return patterns.some(pattern => 
      transcript.includes(pattern.toLowerCase())
    );
  }

  private matchesCommandPattern(
    transcript: string,
    handler: VoiceCommandHandler,
    language: SupportedLanguage
  ): boolean {
    if (!handler.languages.includes(language)) {
      return false;
    }

    return handler.patterns.some(pattern =>
      transcript.includes(pattern.toLowerCase())
    );
  }

  private getLanguageCode(language: SupportedLanguage): string {
    return language.split('-')[0];
  }

  private getLanguageFromContext(context: VoiceRoutingContext): string {
    return context.environmentContext.workspaceLanguage || 'typescript';
  }

  // Register built-in commands
  private registerBuiltinCommands(): void {
    // System commands
    this.registerHandler({
      id: "system.status",
      patterns: ["status", "wie geht es dir", "how are you"],
      languages: ["de-DE", "en-US"],
      handler: async () => ({
        text: "Ich bin bereit und funktionsfähig. Wie kann ich Ihnen helfen?",
        shouldSpeak: true,
        metadata: { model: "system", provider: "builtin", cost: 0, duration: 0, tokens: { input: 0, output: 0 } }
      }),
      permissions: [],
      description: "System-Status abfragen",
      examples: ["Status", "Wie geht es dir?"]
    });

    this.registerHandler({
      id: "system.help",
      patterns: ["hilfe", "help", "was kannst du", "what can you do"],
      languages: ["de-DE", "en-US"],
      handler: async () => ({
        text: "Ich kann Ihnen bei Code-Entwicklung helfen, Dateien verwalten, Git-Operationen ausführen und vieles mehr. Sagen Sie zum Beispiel 'Erkläre diesen Code' oder 'Öffne Datei'.",
        shouldSpeak: true,
        metadata: { model: "system", provider: "builtin", cost: 0, duration: 0, tokens: { input: 0, output: 0 } }
      }),
      permissions: [],
      description: "Hilfe und verfügbare Befehle anzeigen",
      examples: ["Hilfe", "Was kannst du?"]
    });

    this.registerHandler({
      id: "system.time",
      patterns: ["uhrzeit", "zeit", "what time", "current time"],
      languages: ["de-DE", "en-US"],
      handler: async () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('de-DE');
        return {
          text: `Es ist ${timeString} Uhr.`,
          shouldSpeak: true,
          metadata: { model: "system", provider: "builtin", cost: 0, duration: 0, tokens: { input: 0, output: 0 } }
        };
      },
      permissions: [],
      description: "Aktuelle Uhrzeit anzeigen",
      examples: ["Uhrzeit", "Wie spät ist es?"]
    });
  }
}
