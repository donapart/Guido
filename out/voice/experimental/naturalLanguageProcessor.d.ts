/**
 * Experimenteller Natural Language Processor für Guido
 * Intent-Erkennung, Konversationsgedächtnis und Persönlichkeitsanpassung
 */
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
/**
 * Represents the raw user context and preferences used for personality adaptation.
 * This is the input for the analysis.
 */
export interface UserContextForPersonality {
    expertise?: 'beginner' | 'intermediate' | 'expert';
    complexCommands?: number;
    formality?: number;
    casualness?: number;
    detailed?: number;
    concise?: number;
    verbosity?: number;
    humor?: number;
    patience?: number;
    language?: string;
    preferredModels?: string[];
}
export declare class ExperimentalNLP {
    private conversationMemories;
    private personalityProfiles;
    private intentPatterns;
    private entityExtractors;
    constructor();
    private initializeNLP;
    /**
     * Intent-Erkennung
     */
    detectIntent(transcript: string): Promise<Intent>;
    /**
     * Konversationsgedächtnis
     */
    enhanceWithMemory(transcript: string, sessionId: string): Promise<string>;
    /**
     * Persönlichkeitsanpassung
     */
    adaptPersonality(userContext: UserContextForPersonality): Promise<Personality>;
    /**
     * Kontext-basierte Antwortgenerierung
     */
    generateContextualResponse(transcript: string, intent: Intent, memory: ConversationMemory, personality: Personality): Promise<string>;
    /**
     * Mehrschichtige Intent-Analyse
     */
    analyzeMultiLayerIntent(transcript: string): Promise<Intent[]>;
    private setupIntentPatterns;
    private setupEntityExtractors;
    private setupDefaultPersonalities;
    private analyzePrimaryIntent;
    private extractEntities;
    private analyzeIntentContext;
    private detectSecondaryIntents;
    private getConversationMemory;
    private enhanceTranscript;
    private updateMemory;
    private cleanupMemory;
    private analyzeUserPreferences;
    private createAdaptivePersonality;
    private getDefaultPersonality;
    private determineTechnicalLevel;
    private determineCommunicationStyle;
    private determineResponseStyle;
    private calculateFormality;
    private calculateVerbosity;
    private calculateTechnicalLevel;
    private calculateHumor;
    private calculatePatience;
    private extractContextualInfo;
    private selectResponseTemplate;
    private personalizeResponse;
    private fillResponseTemplate;
    private analyzeSurfaceIntent;
    private analyzeDeepIntent;
    private analyzeContextualIntent;
    private analyzeDeepDomain;
}
//# sourceMappingURL=naturalLanguageProcessor.d.ts.map