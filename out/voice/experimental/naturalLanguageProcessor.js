"use strict";
/**
 * Experimenteller Natural Language Processor für Guido
 * Intent-Erkennung, Konversationsgedächtnis und Persönlichkeitsanpassung
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperimentalNLP = void 0;
class ExperimentalNLP {
    conversationMemories = new Map();
    personalityProfiles = new Map();
    intentPatterns = new Map();
    entityExtractors = new Map();
    constructor() {
        this.initializeNLP();
    }
    initializeNLP() {
        this.setupIntentPatterns();
        this.setupEntityExtractors();
        this.setupDefaultPersonalities();
    }
    /**
     * Intent-Erkennung
     */
    async detectIntent(transcript) {
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
        }
        catch (error) {
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
    async enhanceWithMemory(transcript, sessionId) {
        try {
            const memory = await this.getConversationMemory(sessionId);
            const enhanced = await this.enhanceTranscript(transcript, memory);
            // Memory aktualisieren
            await this.updateMemory(sessionId, transcript, enhanced);
            return enhanced;
        }
        catch (error) {
            console.warn('Memory enhancement failed:', error);
            return transcript;
        }
    }
    /**
     * Persönlichkeitsanpassung
     */
    async adaptPersonality(userContext) {
        try {
            const analyzedPreferences = await this.analyzeUserPreferences(userContext);
            const adaptivePersonality = this.createAdaptivePersonality(userContext, analyzedPreferences);
            return adaptivePersonality;
        }
        catch (error) {
            console.warn('Personality adaptation failed:', error);
            return this.getDefaultPersonality();
        }
    }
    /**
     * Kontext-basierte Antwortgenerierung
     */
    async generateContextualResponse(transcript, intent, memory, personality) {
        try {
            const contextualInfo = this.extractContextualInfo(memory, intent);
            const responseTemplate = this.selectResponseTemplate(intent, personality);
            const personalizedResponse = this.personalizeResponse(responseTemplate, personality);
            return this.fillResponseTemplate(personalizedResponse, contextualInfo);
        }
        catch (error) {
            console.warn('Contextual response generation failed:', error);
            return transcript;
        }
    }
    /**
     * Mehrschichtige Intent-Analyse
     */
    async analyzeMultiLayerIntent(transcript) {
        try {
            const layers = await Promise.all([
                this.analyzeSurfaceIntent(transcript),
                this.analyzeDeepIntent(transcript),
                this.analyzeContextualIntent(transcript)
            ]);
            return layers.filter(layer => layer.confidence > 0.3);
        }
        catch (error) {
            console.warn('Multi-layer intent analysis failed:', error);
            return [];
        }
    }
    // Private Hilfsmethoden
    setupIntentPatterns() {
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
    setupEntityExtractors() {
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
    setupDefaultPersonalities() {
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
    async analyzePrimaryIntent(transcript) {
        const scores = {};
        for (const [intent, patterns] of this.intentPatterns.entries()) {
            const matches = patterns.filter(pattern => pattern.test(transcript));
            scores[intent] = matches.length / patterns.length;
        }
        const primaryIntent = Object.entries(scores)
            .sort(([, a], [, b]) => b - a)[0];
        return {
            intent: primaryIntent?.[0] || 'general',
            confidence: primaryIntent?.[1] || 0.5
        };
    }
    async extractEntities(transcript) {
        const entities = [];
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
    async analyzeIntentContext(transcript, primaryIntent) {
        const context = {
            domain: 'general',
            action: 'help',
            target: 'user',
            modifiers: []
        };
        // Domain-Erkennung
        if (primaryIntent.intent.includes('code')) {
            context.domain = 'programming';
        }
        else if (primaryIntent.intent.includes('system')) {
            context.domain = 'system';
        }
        else if (primaryIntent.intent.includes('voice')) {
            context.domain = 'voice';
        }
        // Action-Erkennung
        if (transcript.includes('erkläre') || transcript.includes('was')) {
            context.action = 'explain';
        }
        else if (transcript.includes('mache') || transcript.includes('erstelle')) {
            context.action = 'create';
        }
        else if (transcript.includes('prüfe') || transcript.includes('analysiere')) {
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
    async detectSecondaryIntents(transcript) {
        const secondaryIntents = [];
        // Suche nach sekundären Intents mit niedrigerer Priorität
        for (const [intent, patterns] of this.intentPatterns.entries()) {
            const matches = patterns.filter(pattern => pattern.test(transcript));
            if (matches.length > 0 && matches.length < patterns.length) {
                secondaryIntents.push(intent);
            }
        }
        return secondaryIntents.slice(0, 2); // Maximal 2 sekundäre Intents
    }
    async getConversationMemory(sessionId) {
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
    async enhanceTranscript(transcript, memory) {
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
    async updateMemory(sessionId, transcript, enhanced) {
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
    cleanupMemory(memory) {
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
    async analyzeUserPreferences(userContext) {
        // Analysiere Benutzer-Präferenzen aus verschiedenen Quellen
        const preferences = {
            technicalLevel: this.determineTechnicalLevel(userContext),
            communicationStyle: this.determineCommunicationStyle(userContext),
            responseStyle: this.determineResponseStyle(userContext),
        };
        return preferences;
    }
    createAdaptivePersonality(userContext, analyzedPrefs) {
        const basePersonality = this.personalityProfiles.get(analyzedPrefs.technicalLevel) ||
            this.getDefaultPersonality();
        // Passe Persönlichkeit basierend auf Präferenzen an
        const adaptivePersonality = {
            style: analyzedPrefs.communicationStyle,
            formality: this.calculateFormality(userContext, analyzedPrefs),
            verbosity: this.calculateVerbosity(userContext, analyzedPrefs),
            technicalLevel: this.calculateTechnicalLevel(analyzedPrefs),
            humor: this.calculateHumor(userContext, analyzedPrefs),
            patience: this.calculatePatience(userContext, analyzedPrefs)
        };
        return adaptivePersonality;
    }
    getDefaultPersonality() {
        return {
            style: 'balanced',
            formality: 0.5,
            verbosity: 0.6,
            technicalLevel: 0.5,
            humor: 0.3,
            patience: 0.7
        };
    }
    determineTechnicalLevel(userContext) {
        if (userContext.expertise === 'expert' || (userContext.complexCommands || 0) > 5) {
            return 'expert';
        }
        else if (userContext.expertise === 'beginner' || (userContext.complexCommands || 0) < 2) {
            return 'beginner';
        }
        return 'intermediate';
    }
    determineCommunicationStyle(userContext) {
        if ((userContext.formality || 0) > 0.7)
            return 'formal';
        if ((userContext.casualness || 0) > 0.7)
            return 'casual';
        return 'balanced';
    }
    determineResponseStyle(userContext) {
        if ((userContext.detailed || 0) > 0.7)
            return 'detailed';
        if ((userContext.concise || 0) > 0.7)
            return 'concise';
        return 'balanced';
    }
    calculateFormality(userContext, analyzedPrefs) {
        const baseFormality = userContext.formality || 0.5;
        const technicalAdjustment = analyzedPrefs.technicalLevel === 'expert' ? 0.2 : -0.1;
        return Math.max(0, Math.min(1, baseFormality + technicalAdjustment));
    }
    calculateVerbosity(userContext, analyzedPrefs) {
        const baseVerbosity = userContext.verbosity || 0.6;
        const styleAdjustment = analyzedPrefs.responseStyle === 'detailed' ? 0.3 : -0.2;
        return Math.max(0, Math.min(1, baseVerbosity + styleAdjustment));
    }
    calculateTechnicalLevel(analyzedPrefs) {
        const technicalLevels = { beginner: 0.2, intermediate: 0.5, expert: 0.9 };
        return technicalLevels[analyzedPrefs.technicalLevel] || 0.5;
    }
    calculateHumor(userContext, analyzedPrefs) {
        const baseHumor = userContext.humor || 0.3;
        const styleAdjustment = analyzedPrefs.communicationStyle === 'casual' ? 0.3 : -0.1;
        return Math.max(0, Math.min(1, baseHumor + styleAdjustment));
    }
    calculatePatience(userContext, analyzedPrefs) {
        const basePatience = userContext.patience || 0.7;
        const expertiseAdjustment = analyzedPrefs.technicalLevel === 'beginner' ? 0.2 : -0.1;
        return Math.max(0, Math.min(1, basePatience + expertiseAdjustment));
    }
    extractContextualInfo(memory, intent) {
        return {
            recentTopics: memory.interactions.slice(-3).map(i => i.intent.primary),
            userPreferences: memory.userPreferences,
            currentContext: intent.context,
            sessionDuration: Date.now() - memory.lastUpdated.getTime()
        };
    }
    selectResponseTemplate(intent, personality) {
        const templates = {
            code_generation: 'Ich erstelle {target} für Sie...',
            code_review: 'Ich analysiere {target} und gebe Ihnen Feedback...',
            explanation: 'Ich erkläre Ihnen {target} in {style} Weise...',
            debugging: 'Ich helfe Ihnen dabei, das Problem mit {target} zu lösen...',
            general: 'Ich helfe Ihnen gerne bei {target}...'
        };
        return templates[intent.primary] || templates.general;
    }
    personalizeResponse(template, personality) {
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
    fillResponseTemplate(template, contextualInfo) {
        let filled = template;
        // Ersetze Platzhalter mit kontextuellen Informationen
        filled = filled.replace('{target}', contextualInfo.currentContext.target);
        filled = filled.replace('{style}', contextualInfo.userPreferences.responseStyle);
        return filled;
    }
    async analyzeSurfaceIntent(transcript) {
        // Oberflächliche Intent-Analyse basierend auf Schlüsselwörtern
        return this.detectIntent(transcript);
    }
    async analyzeDeepIntent(transcript) {
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
    async analyzeContextualIntent(transcript) {
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
    analyzeDeepDomain(transcript, surfaceIntent) {
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
exports.ExperimentalNLP = ExperimentalNLP;
//# sourceMappingURL=naturalLanguageProcessor.js.map