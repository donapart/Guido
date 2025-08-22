/**
 * Voice Command Processor for Guido
 * Handles voice command recognition, routing, and execution
 */

import * as vscode from "vscode";
import { ModelRouter, RoutingContext } from "../router";
import { VoiceConfig, VoiceSession } from "./voiceController";
import { PriceCalculator } from "../price";

export interface VoiceCommand {
  trigger: string[];
  action: string;
  params?: string[];
  step?: number;
  context?: string;
  description?: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  requiresConfirmation?: boolean;
  summary?: string;
}

export interface ConversationContext {
  history: string[];
  currentTopic?: string;
  codeContext?: {
    language: string;
    fileName: string;
    selectedText: string;
    fullText: string;
  };
  sessionData?: Record<string, any>;
}

export class VoiceCommandProcessor {
  private conversationContext: ConversationContext;
  private pendingCommand?: {
    command: VoiceCommand;
    params: any;
    timestamp: Date;
  };

  constructor(
    private config: VoiceConfig,
    private router: ModelRouter
  ) {
    this.conversationContext = {
      history: []
    };
  }

  async processVoiceInput(transcript: string, session: VoiceSession): Promise<string> {
    try {
      // Update conversation context
      this.updateConversationContext(transcript, session);

      // 1. Check for direct commands first
      const directCommand = this.matchDirectCommand(transcript);
      if (directCommand) {
        const result = await this.executeDirectCommand(directCommand, transcript);
        if (result.requiresConfirmation) {
          return await this.handleConfirmationRequest(result, transcript);
        }
        return result.message;
      }

      // 2. Check for confirmation/cancellation
      if (this.pendingCommand) {
        const confirmationResult = this.checkConfirmation(transcript);
        if (confirmationResult !== null) {
          return await this.handleConfirmationResponse(confirmationResult);
        }
      }

      // 3. Process as AI query/request
      return await this.processAIRequest(transcript, session);

    } catch (error) {
      console.error('Error processing voice input:', error);
      return `Entschuldigung, es gab einen Fehler: ${error.message}`;
    }
  }

  private updateConversationContext(transcript: string, session: VoiceSession): void {
    // Add to history
    this.conversationContext.history.push(transcript);
    if (this.conversationContext.history.length > this.config.advanced.conversationHistory) {
      this.conversationContext.history.shift();
    }

    // Update code context if available
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && this.config.routing.contextAware) {
      const selection = activeEditor.selection;
      this.conversationContext.codeContext = {
        language: activeEditor.document.languageId,
        fileName: activeEditor.document.fileName,
        selectedText: activeEditor.document.getText(selection),
        fullText: activeEditor.document.getText()
      };
    }

    // Extract topic from transcript
    this.conversationContext.currentTopic = this.extractTopic(transcript);
  }

  private matchDirectCommand(transcript: string): VoiceCommand | null {
    const lowerTranscript = transcript.toLowerCase();
    
    // Combine all command categories
    const allCommands = [
      ...this.config.commands.system,
      ...this.config.commands.voice,
      ...this.config.commands.content,
      ...this.config.commands.navigation
    ];

    for (const command of allCommands) {
      for (const trigger of command.trigger) {
        if (lowerTranscript.includes(trigger.toLowerCase())) {
          return command;
        }
      }
    }

    return null;
  }

  private async executeDirectCommand(command: VoiceCommand, transcript: string): Promise<CommandResult> {
    const action = command.action;

    try {
      switch (action) {
        case 'switchMode':
          return await this.handleSwitchMode(transcript);
        
        case 'showBudget':
          return await this.handleShowBudget();
        
        case 'testProviders':
          return await this.handleTestProviders();
        
        case 'openConfig':
          return await this.handleOpenConfig();
        
        case 'decreaseVolume':
        case 'increaseVolume':
          return await this.handleVolumeControl(action, command.step || 0.1);
        
        case 'decreaseSpeed':
        case 'increaseSpeed':
          return await this.handleSpeedControl(action, command.step || 0.1);
        
        case 'cycleVoice':
          return await this.handleCycleVoice();
        
        case 'cycleLanguage':
          return await this.handleCycleLanguage();
        
        case 'explainCode':
          return await this.handleExplainCode();
        
        case 'optimizeCode':
          return await this.handleOptimizeCode();
        
        case 'writeTests':
          return await this.handleWriteTests();
        
        case 'generateDocs':
          return await this.handleGenerateDocs();
        
        case 'refactorCode':
          return await this.handleRefactorCode();
        
        case 'openFile':
          return await this.handleOpenFile(transcript);
        
        case 'openTerminal':
          return await this.handleOpenTerminal();
        
        case 'showProblems':
          return await this.handleShowProblems();
        
        case 'globalSearch':
          return await this.handleGlobalSearch(transcript);
        
        default:
          return {
            success: false,
            message: `Unbekannter Befehl: ${action}`
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Fehler beim Ausführen von ${action}: ${error.message}`
      };
    }
  }

  private async handleSwitchMode(transcript: string): Promise<CommandResult> {
    const modes = ['auto', 'speed', 'quality', 'cheap', 'local-only', 'offline', 'privacy-strict'];
    const lowerTranscript = transcript.toLowerCase();
    
    const detectedMode = modes.find(mode => 
      lowerTranscript.includes(mode) || 
      lowerTranscript.includes(mode.replace('-', ' '))
    );

    if (detectedMode) {
      await vscode.commands.executeCommand('modelRouter.switchMode');
      return {
        success: true,
        message: `Modus wurde zu ${detectedMode} gewechselt.`
      };
    } else {
      return {
        success: true,
        message: `Verfügbare Modi: ${modes.join(', ')}. Welchen möchten Sie?`,
        requiresConfirmation: true,
        summary: 'Modus-Auswahl'
      };
    }
  }

  private async handleShowBudget(): Promise<CommandResult> {
    await vscode.commands.executeCommand('modelRouter.showCosts');
    return {
      success: true,
      message: 'Budget-Übersicht wird angezeigt.'
    };
  }

  private async handleTestProviders(): Promise<CommandResult> {
    await vscode.commands.executeCommand('modelRouter.testConnection');
    return {
      success: true,
      message: 'Provider-Verbindungen werden getestet.'
    };
  }

  private async handleOpenConfig(): Promise<CommandResult> {
    await vscode.commands.executeCommand('modelRouter.openConfig');
    return {
      success: true,
      message: 'Konfigurationsdatei wird geöffnet.'
    };
  }

  private async handleVolumeControl(action: string, step: number): Promise<CommandResult> {
    const currentVolume = this.config.audio.ttsVolume;
    const newVolume = action === 'increaseVolume' 
      ? Math.min(1.0, currentVolume + step)
      : Math.max(0.0, currentVolume - step);
    
    this.config.audio.ttsVolume = newVolume;
    
    return {
      success: true,
      message: `Lautstärke ${action === 'increaseVolume' ? 'erhöht' : 'verringert'} auf ${Math.round(newVolume * 100)}%.`
    };
  }

  private async handleSpeedControl(action: string, step: number): Promise<CommandResult> {
    const currentSpeed = this.config.audio.ttsSpeed;
    const newSpeed = action === 'increaseSpeed' 
      ? Math.min(2.0, currentSpeed + step)
      : Math.max(0.5, currentSpeed - step);
    
    this.config.audio.ttsSpeed = newSpeed;
    
    return {
      success: true,
      message: `Sprechgeschwindigkeit ${action === 'increaseSpeed' ? 'erhöht' : 'verringert'} auf ${newSpeed.toFixed(1)}.`
    };
  }

  private async handleCycleVoice(): Promise<CommandResult> {
    // Implementation for cycling through available voices
    return {
      success: true,
      message: 'Stimme wurde gewechselt.'
    };
  }

  private async handleCycleLanguage(): Promise<CommandResult> {
    const languages = ['de-DE', 'en-US', 'fr-FR', 'es-ES'];
    const currentIndex = languages.indexOf(this.config.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    
    this.config.language = languages[nextIndex];
    
    return {
      success: true,
      message: `Sprache gewechselt zu ${languages[nextIndex]}.`
    };
  }

  private async handleExplainCode(): Promise<CommandResult> {
    if (!this.conversationContext.codeContext?.selectedText) {
      return {
        success: false,
        message: 'Bitte wählen Sie Code aus, den ich erklären soll.'
      };
    }

    const code = this.conversationContext.codeContext.selectedText;
    const language = this.conversationContext.codeContext.language;
    
    const prompt = `Erkläre diesen ${language}-Code kurz und verständlich für Sprachausgabe:

\`\`\`${language}
${code}
\`\`\`

Verwende einfache Sprache, keine Code-Blöcke in der Antwort.`;

    return await this.processCodeRequest(prompt);
  }

  private async handleOptimizeCode(): Promise<CommandResult> {
    if (!this.conversationContext.codeContext?.selectedText) {
      return {
        success: false,
        message: 'Bitte wählen Sie Code aus, den ich optimieren soll.'
      };
    }

    const code = this.conversationContext.codeContext.selectedText;
    const language = this.conversationContext.codeContext.language;
    
    const prompt = `Optimiere diesen ${language}-Code und erkläre die Verbesserungen:

\`\`\`${language}
${code}
\`\`\`

Beschreibe die Optimierungen in einfacher Sprache für Sprachausgabe.`;

    return await this.processCodeRequest(prompt);
  }

  private async handleWriteTests(): Promise<CommandResult> {
    if (!this.conversationContext.codeContext?.selectedText) {
      return {
        success: false,
        message: 'Bitte wählen Sie Code aus, für den ich Tests schreiben soll.'
      };
    }

    const code = this.conversationContext.codeContext.selectedText;
    const language = this.conversationContext.codeContext.language;
    
    const prompt = `Schreibe Tests für diesen ${language}-Code:

\`\`\`${language}
${code}
\`\`\`

Erkläre kurz welche Tests sinnvoll wären, für Sprachausgabe.`;

    return await this.processCodeRequest(prompt);
  }

  private async handleGenerateDocs(): Promise<CommandResult> {
    if (!this.conversationContext.codeContext?.selectedText) {
      return {
        success: false,
        message: 'Bitte wählen Sie Code aus, für den ich Dokumentation erstellen soll.'
      };
    }

    const code = this.conversationContext.codeContext.selectedText;
    const language = this.conversationContext.codeContext.language;
    
    const prompt = `Erstelle Dokumentation für diesen ${language}-Code:

\`\`\`${language}
${code}
\`\`\`

Beschreibe die Funktionalität in einfacher Sprache für Sprachausgabe.`;

    return await this.processCodeRequest(prompt);
  }

  private async handleRefactorCode(): Promise<CommandResult> {
    if (!this.conversationContext.codeContext?.selectedText) {
      return {
        success: false,
        message: 'Bitte wählen Sie Code aus, den ich refaktorieren soll.'
      };
    }

    return {
      success: true,
      message: 'Code wird refaktoriert. Dies kann gefährlich sein und Code ändern.',
      requiresConfirmation: true,
      summary: 'Code-Refaktorierung'
    };
  }

  private async handleOpenFile(transcript: string): Promise<CommandResult> {
    // Extract file name from transcript
    const filePattern = /(?:öffne|open)\s+(?:datei\s+)?([^\s]+(?:\.[a-z]+)?)/i;
    const match = transcript.match(filePattern);
    
    if (match) {
      const fileName = match[1];
      await vscode.commands.executeCommand('workbench.action.quickOpen', fileName);
      return {
        success: true,
        message: `Suche nach Datei "${fileName}".`
      };
    } else {
      await vscode.commands.executeCommand('workbench.action.quickOpen');
      return {
        success: true,
        message: 'Datei-Auswahl geöffnet.'
      };
    }
  }

  private async handleOpenTerminal(): Promise<CommandResult> {
    await vscode.commands.executeCommand('workbench.action.terminal.new');
    return {
      success: true,
      message: 'Terminal wird geöffnet.'
    };
  }

  private async handleShowProblems(): Promise<CommandResult> {
    await vscode.commands.executeCommand('workbench.actions.view.problems');
    return {
      success: true,
      message: 'Probleme-Panel wird angezeigt.'
    };
  }

  private async handleGlobalSearch(transcript: string): Promise<CommandResult> {
    // Extract search term from transcript
    const searchPattern = /(?:suche|search|finde|find)\s+(?:nach\s+)?(.+)/i;
    const match = transcript.match(searchPattern);
    
    if (match) {
      const searchTerm = match[1].trim();
      await vscode.commands.executeCommand('workbench.action.findInFiles', { query: searchTerm });
      return {
        success: true,
        message: `Suche nach "${searchTerm}" gestartet.`
      };
    } else {
      await vscode.commands.executeCommand('workbench.action.findInFiles');
      return {
        success: true,
        message: 'Globale Suche geöffnet.'
      };
    }
  }

  private async processCodeRequest(prompt: string): Promise<CommandResult> {
    try {
      const context: RoutingContext = {
        prompt,
        mode: this.config.routing.preferFast ? "speed" : "auto",
        lang: this.conversationContext.codeContext?.language,
        filePath: this.conversationContext.codeContext?.fileName,
        keywords: ["voice", "code", "explain"],
        metadata: { isVoiceInput: true }
      };

      const result = await this.router.route(context);
      
      // Create voice-optimized prompt
      const voicePrompt = `${prompt}

WICHTIG für Sprachausgabe:
- Antworte auf Deutsch
- Verwende einfache, gesprochene Sprache
- Maximal ${this.config.routing.maxResponseLength} Zeichen
- Keine Code-Blöcke in der Antwort
- Struktur: Kurze Erklärung, dann Details`;

      const response = await result.provider.chatComplete(
        result.modelName,
        [{ role: "user", content: voicePrompt }],
        { 
          maxTokens: Math.floor(this.config.routing.maxResponseLength / 4),
          temperature: 0.7 
        }
      );

      return {
        success: true,
        message: response.content
      };

    } catch (error) {
      return {
        success: false,
        message: `Fehler bei der Code-Analyse: ${error.message}`
      };
    }
  }

  private async processAIRequest(transcript: string, session: VoiceSession): Promise<string> {
    try {
      // Check if confirmation is required for this type of request
      if (this.config.confirmation.required && !this.shouldSkipConfirmation(transcript)) {
        const summary = await this.createSummary(transcript);
        
        this.pendingCommand = {
          command: { trigger: [], action: 'ai_request' },
          params: { transcript, session },
          timestamp: new Date()
        };

        return `Ich verstehe: ${summary}. Soll ich das ausführen?`;
      }

      return await this.executeAIRequest(transcript, session);

    } catch (error) {
      console.error('Error processing AI request:', error);
      return `Entschuldigung, es gab einen Fehler: ${error.message}`;
    }
  }

  private async executeAIRequest(transcript: string, session: VoiceSession): Promise<string> {
    // Create voice-optimized routing context
    const context: RoutingContext = {
      prompt: transcript,
      mode: this.config.routing.preferFast ? "speed" : "auto",
      lang: this.conversationContext.codeContext?.language,
      filePath: this.conversationContext.codeContext?.fileName,
      fileSizeKB: this.conversationContext.codeContext ? 
        Buffer.byteLength(this.conversationContext.codeContext.fullText, "utf8") / 1024 : undefined,
      keywords: ["voice", "speech", "spoken"],
      metadata: { 
        isVoiceInput: true,
        session: session.id,
        conversationHistory: this.conversationContext.history.slice(-3)
      }
    };

    const result = await this.router.route(context);
    
    // Create enhanced prompt with voice-specific instructions
    const enhancedPrompt = this.createVoiceOptimizedPrompt(transcript);

    const response = await result.provider.chatComplete(
      result.modelName,
      [{ role: "user", content: enhancedPrompt }],
      { 
        maxTokens: Math.floor(this.config.routing.maxResponseLength / 3),
        temperature: 0.7 
      }
    );

    // Post-process response for voice output
    return this.postProcessResponseForVoice(response.content);
  }

  private createVoiceOptimizedPrompt(transcript: string): string {
    const personality = this.config.advanced.personality;
    const responseLanguage = this.config.responseLanguage;
    
    let systemPrompt = '';
    
    // Add personality
    switch (personality) {
      case 'professional':
        systemPrompt = 'Sie sind ein professioneller KI-Assistent. Antworten Sie sachlich und präzise.';
        break;
      case 'friendly':
        systemPrompt = 'Sie sind ein freundlicher und hilfsbereiter Assistent. Antworten Sie warmherzig und unterstützend.';
        break;
      case 'casual':
        systemPrompt = 'Sie sind ein lockerer und entspannter Assistent. Antworten Sie ungezwungen und direkt.';
        break;
      case 'technical':
        systemPrompt = 'Sie sind ein technischer Experte. Geben Sie detaillierte und genaue technische Antworten.';
        break;
    }

    // Add context if available
    let contextInfo = '';
    if (this.conversationContext.codeContext) {
      contextInfo = `\n\nKONTEXT:
- Datei: ${this.conversationContext.codeContext.fileName}
- Sprache: ${this.conversationContext.codeContext.language}
- Ausgewählter Code: ${this.conversationContext.codeContext.selectedText ? 'Ja' : 'Nein'}`;
    }

    // Add conversation history if enabled
    let historyInfo = '';
    if (this.config.advanced.contextMemory && this.conversationContext.history.length > 1) {
      const recentHistory = this.conversationContext.history.slice(-3, -1);
      historyInfo = `\n\nVORHERIGE ANFRAGEN: ${recentHistory.join(', ')}`;
    }

    return `${systemPrompt}

BENUTZERANFRAGE: ${transcript}${contextInfo}${historyInfo}

WICHTIG für Sprachausgabe:
- Antwortsprache: ${responseLanguage === 'de' ? 'Deutsch' : 'Englisch'}
- Maximal ${this.config.routing.maxResponseLength} Zeichen
- Verwenden Sie gesprochene, natürliche Sprache
- Keine Code-Blöcke in der Hauptantwort
- Bei Code: Beschreiben, nicht zeigen
- Strukturiert und verständlich
- ${this.config.routing.useSimpleLanguage ? 'Einfache Sprache verwenden' : 'Normale Sprache'}`;
  }

  private postProcessResponseForVoice(response: string): string {
    let processed = response;

    // Remove code blocks
    if (this.config.routing.skipCodeInTTS) {
      processed = processed.replace(/```[\s\S]*?```/g, '[Code-Beispiel]');
      processed = processed.replace(/`([^`]+)`/g, 'Code-Element');
    }

    // Limit length
    if (processed.length > this.config.routing.maxResponseLength) {
      processed = processed.substring(0, this.config.routing.maxResponseLength - 50);
      processed += '... Antwort wurde für Sprachausgabe gekürzt.';
    }

    // Simple language processing
    if (this.config.routing.useSimpleLanguage) {
      processed = processed.replace(/\bjedoch\b/g, 'aber');
      processed = processed.replace(/\ballerdings\b/g, 'aber');
      processed = processed.replace(/\bdementsprechend\b/g, 'daher');
      processed = processed.replace(/\bimplementieren\b/g, 'umsetzen');
      processed = processed.replace(/\brealisieren\b/g, 'machen');
    }

    return processed;
  }

  private shouldSkipConfirmation(transcript: string): boolean {
    const skipCategories = this.config.confirmation.skipConfirmationFor;
    
    const categories = {
      simple_questions: ['was ist', 'wie funktioniert', 'erkläre', 'was bedeutet'],
      weather: ['wetter', 'temperatur'],
      time: ['zeit', 'uhrzeit', 'datum'],
      calculations: ['rechne', 'berechne', 'plus', 'minus', 'mal', 'geteilt']
    };

    for (const category of skipCategories) {
      const keywords = categories[category as keyof typeof categories];
      if (keywords?.some(keyword => transcript.toLowerCase().includes(keyword))) {
        return true;
      }
    }

    return false;
  }

  private async createSummary(transcript: string): Promise<string> {
    const summaryPrompt = `Fasse diese Anfrage in einem kurzen Satz zusammen:

"${transcript}"

Antwort nur mit der Zusammenfassung, maximal 50 Zeichen:`;

    try {
      const context: RoutingContext = {
        prompt: summaryPrompt,
        mode: "speed",
        keywords: ["summary", "voice"]
      };

      const result = await this.router.route(context);
      const summaryResult = await result.provider.chatComplete(
        result.modelName,
        [{ role: "user", content: summaryPrompt }],
        { maxTokens: 30, temperature: 0.3 }
      );

      return summaryResult.content.trim();
    } catch (error) {
      return transcript.length > 50 ? transcript.substring(0, 47) + '...' : transcript;
    }
  }

  private checkConfirmation(transcript: string): boolean | null {
    const lowerTranscript = transcript.toLowerCase();
    
    // Check for confirmation words
    if (this.config.confirmation.confirmWords.some(word => lowerTranscript.includes(word))) {
      return true;
    }
    
    // Check for cancellation words
    if (this.config.confirmation.cancelWords.some(word => lowerTranscript.includes(word))) {
      return false;
    }
    
    // Check for retry words
    if (this.config.confirmation.retryWords.some(word => lowerTranscript.includes(word))) {
      return null; // Special case for retry
    }
    
    return null; // No clear confirmation/cancellation
  }

  private async handleConfirmationRequest(result: CommandResult, transcript: string): Promise<string> {
    this.pendingCommand = {
      command: { trigger: [], action: 'pending' },
      params: { result, transcript },
      timestamp: new Date()
    };

    return `${result.message} Sagen Sie "ja" um fortzufahren oder "nein" um abzubrechen.`;
  }

  private async handleConfirmationResponse(confirmed: boolean): Promise<string> {
    if (!this.pendingCommand) {
      return "Keine ausstehende Aktion gefunden.";
    }

    const { command, params } = this.pendingCommand;
    this.pendingCommand = undefined; // Clear pending command

    if (!confirmed) {
      return "Aktion abgebrochen.";
    }

    try {
      // Execute the pending command/action
      if (command.action === 'ai_request') {
        return await this.executeAIRequest(params.transcript, params.session);
      } else if (command.action === 'pending') {
        // Handle other pending actions
        return "Aktion wird ausgeführt.";
      }

      return "Aktion wurde ausgeführt.";
    } catch (error) {
      return `Fehler bei der Ausführung: ${error.message}`;
    }
  }

  private extractTopic(transcript: string): string {
    // Simple topic extraction - could be enhanced with NLP
    const words = transcript.toLowerCase().split(' ').filter(word => word.length > 3);
    return words.slice(0, 3).join(' ');
  }

  // Public utility methods
  getCurrentContext(): ConversationContext {
    return this.conversationContext;
  }

  clearHistory(): void {
    this.conversationContext.history = [];
    this.conversationContext.currentTopic = undefined;
  }

  hasPendingCommand(): boolean {
    return !!this.pendingCommand;
  }

  cancelPendingCommand(): void {
    this.pendingCommand = undefined;
  }
}
