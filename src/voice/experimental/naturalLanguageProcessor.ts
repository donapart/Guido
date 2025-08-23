/**
 * Experimenteller Natural Language Processor für Guido
 * Intent-Erkennung, Konversationsgedächtnis und Persönlichkeitsanpassung
 */

import * as vscode from 'vscode';

export interface Intent {
  primary: string;
  confidence: number;
  entities: Entity[];
  context: IntentContext;
  secondary?: string[];
}

export interface Entity {
  type: string;
  value: string;
  confidence: number;
  start: number;
  end: number;
}

export interface IntentContext {
  domain: string;
  action: string;
  target: string;
  modifiers: string[];
}

export interface Personality {
  style: string;
  formality: number;
  verbosity: number;
  technicalLevel: number;
  humor: number;
  patience: number;
}

export interface ConversationMemory {
  sessionId: string;
  interactions: Interaction[];
  userPreferences: UserPreferences;
  contextHistory: ContextEntry[];
  lastUpdated: Date;
}

export interface Interaction {
  timestamp: Date;
  userInput: string;
  systemResponse: string;
  intent: Intent;
  emotion: string;
  satisfaction: number;
}

export interface UserPreferences {
  language: string;
  technicalLevel: string;
  responseStyle: string;
  preferredModels: string[];
  communicationStyle: string;
}

export interface ContextEntry {
  timestamp: Date;
  context: string;
  relevance: number;
  tags: string[];
}

export class ExperimentalNLP {
  private conversationMemories: Map<string, ConversationMemory> = new Map();
  private personalityProfiles: Map<string, Personality> = new Map();
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private entityExtractors: Map<string, RegExp[]> = new Map();

  constructor() {
    this.initializeNLP();
  }

  private initializeNLP() {
    this.setupIntentPatterns();
    this.setupEntityExtractors();
    this.setupDefaultPersonalities();
  }

  /**
   * Intent-Erkennung
   */
  async detectIntent(transcript: string): Promise<Intent> {
    try {
      const primaryIntent = await this.analyzePrimaryIntent(transcript);
      const entities = await this.extractEntities(transcript);
      const context = await this.analyzeIntentContext(transcript, primaryIntent);
      const secondaryIntents = await this.detectSecondaryIntents(transcript);

      return {
        primary: primaryIntent.intent,
        confidence: primaryIntent.confidence,
        entities,
        context,
        secondary: secondaryIntents
      };
    } catch (error) {
      console.warn('Intent detection failed:', error);
      return {
        primary: 'general',
        confidence: 0.5,
        entities: [],
        context: {
          domain: 'general',
          action: 'help',
          target: 'user',
          modifiers: []
        }
      };
    }
  }

  /**
   * Konversationsgedächtnis
   */
  async enhanceWithMemory(transcript: string, sessionId: string): Promise<string> {
    try {
      const memory = await this.getConversationMemory(sessionId);
      const enhanced = await this.enhanceTranscript(transcript, memory);
      
      // Memory aktualisieren
      await this.updateMemory(sessionId, transcript, enhanced);
      
      return enhanced;
    } catch (error) {
      console.warn('Memory enhancement failed:', error);
      return transcript;
    }
  }

  /**
   * Persönlichkeitsanpassung
   */
  async adaptPersonality(userPreferences: any): Promise<Personality> {
    try {
      const personality = await this.analyzeUserPreferences(userPreferences);
      const adaptivePersonality = this.createAdaptivePersonality(personality);
      
      return adaptivePersonality;
    } catch (error) {
      console.warn('Personality adaptation failed:', error);
      return this.getDefaultPersonality();
    }
  }

  /**
   * Kontext-basierte Antwortgenerierung
   */
  async generateContextualResponse(
    transcript: string, 
    intent: Intent, 
    memory: ConversationMemory,
    personality: Personality
  ): Promise<string> {
    try {
      const contextualInfo = this.extractContextualInfo(memory, intent);
      const responseTemplate = this.selectResponseTemplate(intent, personality);
      const personalizedResponse = this.personalizeResponse(responseTemplate, personality);
      
      return this.fillResponseTemplate(personalizedResponse, contextualInfo);
    } catch (error) {
      console.warn('Contextual response generation failed:', error);
      return transcript;
    }
  }

  /**
   * Mehrschichtige Intent-Analyse
   */
  async analyzeMultiLayerIntent(transcript: string): Promise<Intent[]> {
    try {
      const layers = await Promise.all([
        this.analyzeSurfaceIntent(transcript),
        this.analyzeDeepIntent(transcript),
        this.analyzeContextualIntent(transcript)
      ]);

      return layers.filter(layer => layer.confidence > 0.3);
    } catch (error) {
      console.warn('Multi-layer intent analysis failed:', error);
      return [];
    }
  }

  // Private Hilfsmethoden
  private setupIntentPatterns() {
    // Coding-bezogene Intents
    this.intentPatterns.set('code_generation', [
      /(?:schreibe|erstelle|generiere|mache)\s+(?:code|programm|funktion|klasse)/i,
      /(?:implementiere|entwickle)\s+(?:eine|ein)\s+(?:funktion|klasse|programm)/i
    ]);

    this.intentPatterns.set('code_review', [
      /(?:prüfe|bewerte|analysiere|review)\s+(?:den|die|das)\s+(?:code|programm)/i,
      /(?:code|programm)\s+(?:review|prüfung|analyse)/i
    ]);

    this.intentPatterns.set('code_optimization', [
      /(?:optimiere|verbessere|beschleunige)\s+(?:den|die|das)\s+(?:code|programm)/i,
      /(?:performance|geschwindigkeit)\s+(?:verbessern|optimieren)/i
    ]);

    this.intentPatterns.set('debugging', [
      /(?:debug|fehler|problem|bug)\s+(?:finden|beheben|lösen)/i,
      /(?:warum|weshalb)\s+(?:funktioniert|geht)\s+(?:nicht)/i
    ]);

    this.intentPatterns.set('explanation', [
      /(?:erkläre|was|wie|warum)\s+(?:ist|funktioniert|bedeutet)/i,
      /(?:verstehe|verstehen)\s+(?:nicht|nicht ganz)/i
    ]);

    // System-bezogene Intents
    this.intentPatterns.set('system_help', [
      /(?:hilfe|help|unterstützung|support)/i,
      /(?:was|wie)\s+(?:kann|funktioniert)/i
    ]);

    this.intentPatterns.set('settings', [
      /(?:einstellungen|settings|konfiguration|config)/i,
      /(?:ändern|anpassen|setzen)\s+(?:einstellung)/i
    ]);

    // Voice-bezogene Intents
    this.intentPatterns.set('voice_control', [
      /(?:stimme|voice|sprechen|sprach)/i,
      /(?:mikrofon|aufnahme|recording)/i
    ]);
  }

  private setupEntityExtractors() {
    // Programmiersprachen
    this.entityExtractors.set('programming_language', [
      /(?:javascript|js|typescript|ts|python|py|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin)/i
    ]);

    // Dateitypen
    this.entityExtractors.set('file_type', [
      /\.(?:js|ts|py|java|cpp|cs|php|rb|go|rs|swift|kt|html|css|json|xml|yaml|md)/i
    ]);

    // VSCode-spezifische Entitäten
    this.entityExtractors.set('vscode_feature', [
      /(?:terminal|debugger|git|extensions|explorer|search|replace|snippets)/i
    ]);

    // Emotionen
    this.entityExtractors.set('emotion', [
      /(?:frustriert|wütend|verwirrt|glücklich|zufrieden|enttäuscht|begeistert)/i
    ]);
  }

  private setupDefaultPersonalities() {
    // Standard-Persönlichkeiten
    this.personalityProfiles.set('beginner', {
      style: 'helpful',
      formality: 0.3,
      verbosity: 0.8,
      technicalLevel: 0.2,
      humor: 0.4,
      patience: 0.9
    });

    this.personalityProfiles.set('expert', {
      style: 'efficient',
      formality: 0.7,
      verbosity: 0.4,
      technicalLevel: 0.9,
      humor: 0.2,
      patience: 0.6
    });

    this.personalityProfiles.set('casual', {
      style: 'friendly',
      formality: 0.2,
      verbosity: 0.6,
      technicalLevel: 0.5,
      humor: 0.8,
      patience: 0.7
    });
  }

  private async analyzePrimaryIntent(transcript: string): Promise<{intent: string, confidence: number}> {
    const scores: Record<string, number> = {};

    for (const [intent, patterns] of this.intentPatterns.entries()) {
      const matches = patterns.filter(pattern => pattern.test(transcript));
      scores[intent] = matches.length / patterns.length;
    }

    const primaryIntent = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      intent: primaryIntent?.[0] || 'general',
      confidence: primaryIntent?.[1] || 0.5
    };
  }

  private async extractEntities(transcript: string): Promise<Entity[]> {
    const entities: Entity[] = [];

    for (const [entityType, patterns] of this.entityExtractors.entries()) {
      for (const pattern of patterns) {
        const matches = transcript.matchAll(pattern);
        for (const match of matches) {
          if (match.index !== undefined) {
            entities.push({
              type: entityType,
              value: match[0],
              confidence: 0.8,
              start: match.index,
              end: match.index + match[0].length
            });
          }
        }
      }
    }

    return entities;
  }

  private async analyzeIntentContext(transcript: string, primaryIntent: {intent: string, confidence: number}): Promise<IntentContext> {
    const context: IntentContext = {
      domain: 'general',
      action: 'help',
      target: 'user',
      modifiers: []
    };

    // Domain-Erkennung
    if (primaryIntent.intent.includes('code')) {
      context.domain = 'programming';
    } else if (primaryIntent.intent.includes('system')) {
      context.domain = 'system';
    } else if (primaryIntent.intent.includes('voice')) {
      context.domain = 'voice';
    }

    // Action-Erkennung
    if (transcript.includes('erkläre') || transcript.includes('was')) {
      context.action = 'explain';
    } else if (transcript.includes('mache') || transcript.includes('erstelle')) {
      context.action = 'create';
    } else if (transcript.includes('prüfe') || transcript.includes('analysiere')) {
      context.action = 'analyze';
    }

    // Modifier-Erkennung
    if (transcript.includes('schnell') || transcript.includes('fast')) {
      context.modifiers.push('urgent');
    }
    if (transcript.includes('detailliert') || transcript.includes('detailed')) {
      context.modifiers.push('detailed');
    }

    return context;
  }

  private async detectSecondaryIntents(transcript: string): Promise<string[]> {
    const secondaryIntents: string[] = [];
    
    // Suche nach sekundären Intents mit niedrigerer Priorität
    for (const [intent, patterns] of this.intentPatterns.entries()) {
      const matches = patterns.filter(pattern => pattern.test(transcript));
      if (matches.length > 0 && matches.length < patterns.length) {
        secondaryIntents.push(intent);
      }
    }

    return secondaryIntents.slice(0, 2); // Maximal 2 sekundäre Intents
  }

  private async getConversationMemory(sessionId: string): Promise<ConversationMemory> {
    let memory = this.conversationMemories.get(sessionId);
    
    if (!memory) {
      memory = {
        sessionId,
        interactions: [],
        userPreferences: {
          language: 'de',
          technicalLevel: 'intermediate',
          responseStyle: 'helpful',
          preferredModels: ['gpt-4o-mini'],
          communicationStyle: 'casual'
        },
        contextHistory: [],
        lastUpdated: new Date()
      };
      this.conversationMemories.set(sessionId, memory);
    }

    return memory;
  }

  private async enhanceTranscript(transcript: string, memory: ConversationMemory): Promise<string> {
    // Erweitere Transcript mit Kontext aus Memory
    const recentInteractions = memory.interactions.slice(-3);
    const relevantContext = memory.contextHistory
      .filter(entry => entry.relevance > 0.5)
      .slice(-2);

    let enhanced = transcript;

    // Füge Kontext aus vorherigen Interaktionen hinzu
    if (recentInteractions.length > 0) {
      const lastIntent = recentInteractions[recentInteractions.length - 1].intent;
      if (lastIntent.primary === 'code_generation') {
        enhanced = `[Vorheriger Kontext: Code-Generierung] ${enhanced}`;
      }
    }

    // Füge relevante Kontext-Informationen hinzu
    if (relevantContext.length > 0) {
      const contextInfo = relevantContext.map(entry => entry.context).join(', ');
      enhanced = `[Relevanter Kontext: ${contextInfo}] ${enhanced}`;
    }

    return enhanced;
  }

  private async updateMemory(sessionId: string, transcript: string, enhanced: string) {
    const memory = await this.getConversationMemory(sessionId);
    const intent = await this.detectIntent(transcript);

    // Neue Interaktion hinzufügen
    memory.interactions.push({
      timestamp: new Date(),
      userInput: transcript,
      systemResponse: enhanced,
      intent,
      emotion: 'neutral', // Wird später durch Emotion-Detection ersetzt
      satisfaction: 0.7 // Standard-Wert
    });

    // Kontext-Historie aktualisieren
    memory.contextHistory.push({
      timestamp: new Date(),
      context: intent.context.domain,
      relevance: intent.confidence,
      tags: [intent.primary, intent.context.action]
    });

    // Memory bereinigen (alte Einträge entfernen)
    this.cleanupMemory(memory);

    memory.lastUpdated = new Date();
    this.conversationMemories.set(sessionId, memory);
  }

  private cleanupMemory(memory: ConversationMemory) {
    const maxInteractions = 50;
    const maxContextEntries = 100;
    const maxAge = 24 * 60 * 60 * 1000; // 24 Stunden

    const now = new Date();

    // Alte Interaktionen entfernen
    memory.interactions = memory.interactions
      .filter(interaction => now.getTime() - interaction.timestamp.getTime() < maxAge)
      .slice(-maxInteractions);

    // Alte Kontext-Einträge entfernen
    memory.contextHistory = memory.contextHistory
      .filter(entry => now.getTime() - entry.timestamp.getTime() < maxAge)
      .slice(-maxContextEntries);
  }

  private async analyzeUserPreferences(userPreferences: any): Promise<any> {
    // Analysiere Benutzer-Präferenzen aus verschiedenen Quellen
    const preferences = {
      technicalLevel: this.determineTechnicalLevel(userPreferences),
      communicationStyle: this.determineCommunicationStyle(userPreferences),
      responseStyle: this.determineResponseStyle(userPreferences),
      language: userPreferences.language || 'de',
      preferredModels: userPreferences.preferredModels || ['gpt-4o-mini']
    };

    return preferences;
  }

  private createAdaptivePersonality(preferences: any): Personality {
    const basePersonality = this.personalityProfiles.get(preferences.technicalLevel) || 
                           this.getDefaultPersonality();

    // Passe Persönlichkeit basierend auf Präferenzen an
    const adaptivePersonality: Personality = {
      style: preferences.communicationStyle,
      formality: this.calculateFormality(preferences),
      verbosity: this.calculateVerbosity(preferences),
      technicalLevel: this.calculateTechnicalLevel(preferences),
      humor: this.calculateHumor(preferences),
      patience: this.calculatePatience(preferences)
    };

    return adaptivePersonality;
  }

  private getDefaultPersonality(): Personality {
    return {
      style: 'helpful',
      formality: 0.5,
      verbosity: 0.6,
      technicalLevel: 0.5,
      humor: 0.3,
      patience: 0.7
    };
  }

  private determineTechnicalLevel(preferences: any): string {
    if (preferences.expertise === 'expert' || preferences.complexCommands > 5) {
      return 'expert';
    } else if (preferences.expertise === 'beginner' || preferences.complexCommands < 2) {
      return 'beginner';
    }
    return 'intermediate';
  }

  private determineCommunicationStyle(preferences: any): string {
    if (preferences.formality > 0.7) return 'formal';
    if (preferences.casualness > 0.7) return 'casual';
    return 'balanced';
  }

  private determineResponseStyle(preferences: any): string {
    if (preferences.detailed > 0.7) return 'detailed';
    if (preferences.concise > 0.7) return 'concise';
    return 'balanced';
  }

  private calculateFormality(preferences: any): number {
    const baseFormality = preferences.formality || 0.5;
    const technicalAdjustment = preferences.technicalLevel === 'expert' ? 0.2 : -0.1;
    return Math.max(0, Math.min(1, baseFormality + technicalAdjustment));
  }

  private calculateVerbosity(preferences: any): number {
    const baseVerbosity = preferences.verbosity || 0.6;
    const styleAdjustment = preferences.responseStyle === 'detailed' ? 0.3 : -0.2;
    return Math.max(0, Math.min(1, baseVerbosity + styleAdjustment));
  }

  private calculateTechnicalLevel(preferences: any): number {
    const technicalLevels = { beginner: 0.2, intermediate: 0.5, expert: 0.9 };
    return technicalLevels[preferences.technicalLevel as keyof typeof technicalLevels] || 0.5;
  }

  private calculateHumor(preferences: any): number {
    const baseHumor = preferences.humor || 0.3;
    const styleAdjustment = preferences.communicationStyle === 'casual' ? 0.3 : -0.1;
    return Math.max(0, Math.min(1, baseHumor + styleAdjustment));
  }

  private calculatePatience(preferences: any): number {
    const basePatience = preferences.patience || 0.7;
    const expertiseAdjustment = preferences.technicalLevel === 'beginner' ? 0.2 : -0.1;
    return Math.max(0, Math.min(1, basePatience + expertiseAdjustment));
  }

  private extractContextualInfo(memory: ConversationMemory, intent: Intent): any {
    return {
      recentTopics: memory.interactions.slice(-3).map(i => i.intent.primary),
      userPreferences: memory.userPreferences,
      currentContext: intent.context,
      sessionDuration: Date.now() - memory.lastUpdated.getTime()
    };
  }

  private selectResponseTemplate(intent: Intent, personality: Personality): string {
    const templates: Record<string, string> = {
      code_generation: 'Ich erstelle {target} für Sie...',
      code_review: 'Ich analysiere {target} und gebe Ihnen Feedback...',
      explanation: 'Ich erkläre Ihnen {target} in {style} Weise...',
      debugging: 'Ich helfe Ihnen dabei, das Problem mit {target} zu lösen...',
      general: 'Ich helfe Ihnen gerne bei {target}...'
    };

    return templates[intent.primary] || templates.general;
  }

  private personalizeResponse(template: string, personality: Personality): string {
    let personalized = template;

    // Passe Stil basierend auf Persönlichkeit an
    if (personality.formality > 0.7) {
      personalized = personalized.replace('Ich', 'Ich werde');
    }

    if (personality.verbosity > 0.7) {
      personalized += ' Lassen Sie mich das detailliert erklären.';
    }

    if (personality.humor > 0.6) {
      personalized += ' 😊';
    }

    return personalized;
  }

  private fillResponseTemplate(template: string, contextualInfo: any): string {
    let filled = template;

    // Ersetze Platzhalter mit kontextuellen Informationen
    filled = filled.replace('{target}', contextualInfo.currentContext.target);
    filled = filled.replace('{style}', contextualInfo.userPreferences.responseStyle);

    return filled;
  }

  private async analyzeSurfaceIntent(transcript: string): Promise<Intent> {
    // Oberflächliche Intent-Analyse basierend auf Schlüsselwörtern
    return this.detectIntent(transcript);
  }

  private async analyzeDeepIntent(transcript: string): Promise<Intent> {
    // Tiefere Intent-Analyse basierend auf Kontext und Semantik
    const surfaceIntent = await this.detectIntent(transcript);
    
    // Erweitere mit tieferer Analyse
    const deepIntent = {
      ...surfaceIntent,
      confidence: surfaceIntent.confidence * 0.8, // Reduziere Confidence für Deep Intent
      context: {
        ...surfaceIntent.context,
        domain: this.analyzeDeepDomain(transcript, surfaceIntent)
      }
    };

    return deepIntent;
  }

  private async analyzeContextualIntent(transcript: string): Promise<Intent> {
    // Kontext-basierte Intent-Analyse
    const baseIntent = await this.detectIntent(transcript);
    
    // Füge kontextuelle Informationen hinzu
    const contextualIntent = {
      ...baseIntent,
      confidence: baseIntent.confidence * 0.9,
      context: {
        ...baseIntent.context,
        modifiers: [...baseIntent.context.modifiers, 'contextual']
      }
    };

    return contextualIntent;
  }

  private analyzeDeepDomain(transcript: string, surfaceIntent: Intent): string {
    // Analysiere tieferen Domain-Kontext
    if (transcript.includes('architektur') || transcript.includes('design pattern')) {
      return 'software_architecture';
    }
    if (transcript.includes('performance') || transcript.includes('optimierung')) {
      return 'performance_optimization';
    }
    if (transcript.includes('security') || transcript.includes('sicherheit')) {
      return 'security';
    }
    
    return surfaceIntent.context.domain;
  }
}
