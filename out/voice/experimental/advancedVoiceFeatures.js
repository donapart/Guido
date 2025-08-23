"use strict";
/**
 * Experimentelle Voice-Features für Guido
 * Erweiterte Sprachverarbeitung mit emotionaler Erkennung und Kontextbewusstsein
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperimentalVoiceFeatures = void 0;
const vscode = __importStar(require("vscode"));
class ExperimentalVoiceFeatures {
    emotionModels = new Map();
    contextHistory = new Map();
    languageDetectors = new Map();
    constructor() {
        this.initializeExperimentalFeatures();
    }
    async initializeExperimentalFeatures() {
        // Emotion-Modelle initialisieren
        this.emotionModels.set('emotion-analyzer-v1', {
            analyze: this.analyzeEmotionV1.bind(this)
        });
        this.emotionModels.set('sentiment-detector', {
            analyze: this.analyzeSentiment.bind(this)
        });
        // Sprach-Erkennung initialisieren
        this.languageDetectors.set('auto-detect', {
            detect: this.detectLanguage.bind(this)
        });
    }
    /**
     * Emotionale Erkennung aus Transcript
     */
    async detectEmotion(transcript) {
        try {
            const emotionResults = await Promise.all([
                this.analyzeEmotionV1(transcript),
                this.analyzeSentiment(transcript)
            ]);
            const primary = this.combineEmotionResults(emotionResults);
            return {
                primary: primary.emotion,
                confidence: primary.confidence,
                secondary: primary.secondary,
                intensity: primary.intensity
            };
        }
        catch (error) {
            console.warn('Emotion detection failed:', error);
            return {
                primary: 'neutral',
                confidence: 0.5,
                intensity: 0.5
            };
        }
    }
    /**
     * Kontextbewusstsein erweitern
     */
    async enhanceContext(transcript, context) {
        try {
            const projectContext = await this.analyzeProjectContext(context);
            const userContext = await this.analyzeUserContext(context);
            const fileContext = await this.analyzeFileContext(context);
            const enhancedTranscript = await this.enhanceTranscriptWithContext(transcript, { projectContext, userContext, fileContext });
            return {
                transcript: enhancedTranscript,
                context: {
                    project: projectContext.name || 'unknown',
                    file: fileContext.name || 'unknown',
                    userExpertise: userContext.expertise || 'beginner',
                    recentCommands: userContext.recentCommands || []
                },
                enhanced: true
            };
        }
        catch (error) {
            console.warn('Context enhancement failed:', error);
            return {
                transcript,
                context: {
                    project: 'unknown',
                    file: 'unknown',
                    userExpertise: 'unknown',
                    recentCommands: []
                },
                enhanced: false
            };
        }
    }
    /**
     * Mehrsprachige Verarbeitung
     */
    async processMultilingual(transcript) {
        try {
            const detectedLanguage = await this.detectLanguage(transcript);
            const needsTranslation = detectedLanguage !== 'de'; // Deutsch als Standard
            if (needsTranslation) {
                const translated = await this.translateToGerman(transcript, detectedLanguage);
                return {
                    originalLanguage: detectedLanguage,
                    detectedLanguage,
                    translated: true,
                    transcript: translated,
                    confidence: 0.9
                };
            }
            return {
                originalLanguage: 'de',
                detectedLanguage: 'de',
                translated: false,
                transcript,
                confidence: 0.95
            };
        }
        catch (error) {
            console.warn('Multilingual processing failed:', error);
            return {
                originalLanguage: 'unknown',
                detectedLanguage: 'unknown',
                translated: false,
                transcript,
                confidence: 0.5
            };
        }
    }
    /**
     * Adaptive Antworten basierend auf Emotion und Kontext
     */
    async generateAdaptiveResponse(transcript, emotion, context) {
        const responseStyle = this.determineResponseStyle(emotion, context);
        const enhancedPrompt = this.createEnhancedPrompt(transcript, context, responseStyle);
        return enhancedPrompt;
    }
    // Private Hilfsmethoden
    async analyzeEmotionV1(transcript) {
        // Experimentelle Emotion-Analyse basierend auf Schlüsselwörtern
        const emotionKeywords = {
            happy: ['gut', 'toll', 'super', 'fantastisch', 'ausgezeichnet'],
            sad: ['schlecht', 'traurig', 'frustriert', 'enttäuscht', 'nicht gut'],
            angry: ['wütend', 'ärgerlich', 'verärgert', 'genervt', 'frustriert'],
            excited: ['aufgeregt', 'begeistert', 'spannend', 'interessant'],
            confused: ['verwirrt', 'verstehe nicht', 'unklar', 'kompliziert']
        };
        const words = transcript.toLowerCase().split(' ');
        const emotionScores = {};
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            emotionScores[emotion] = keywords.filter(keyword => words.some(word => word.includes(keyword))).length;
        }
        const primaryEmotion = Object.entries(emotionScores)
            .sort(([, a], [, b]) => b - a)[0];
        return {
            emotion: primaryEmotion[0] || 'neutral',
            confidence: Math.min(primaryEmotion[1] / 3, 1.0),
            intensity: primaryEmotion[1] / 5
        };
    }
    async analyzeSentiment(transcript) {
        // Einfache Sentiment-Analyse
        const positiveWords = ['gut', 'toll', 'super', 'hilfreich', 'danke'];
        const negativeWords = ['schlecht', 'nicht', 'falsch', 'problem', 'fehler'];
        const words = transcript.toLowerCase().split(' ');
        const positiveCount = positiveWords.filter(word => words.includes(word)).length;
        const negativeCount = negativeWords.filter(word => words.includes(word)).length;
        const sentiment = positiveCount > negativeCount ? 'positive' :
            negativeCount > positiveCount ? 'negative' : 'neutral';
        const confidence = Math.abs(positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);
        return { sentiment, confidence };
    }
    combineEmotionResults(results) {
        // Kombiniere verschiedene Emotion-Analysen
        const emotion = results[0]?.emotion || 'neutral';
        const confidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length;
        return { emotion, confidence, intensity: results[0]?.intensity || 0.5 };
    }
    async analyzeProjectContext(context) {
        const workspace = vscode.workspace.workspaceFolders?.[0];
        return {
            name: workspace?.name || 'unknown',
            path: workspace?.uri.fsPath || 'unknown',
            type: this.detectProjectType(workspace?.uri.fsPath || '')
        };
    }
    async analyzeUserContext(context) {
        // Analysiere Benutzerverhalten aus Kontext
        return {
            expertise: this.determineUserExpertise(context),
            recentCommands: context.recentCommands || [],
            preferences: context.preferences || {}
        };
    }
    async analyzeFileContext(context) {
        const activeEditor = vscode.window.activeTextEditor;
        return {
            name: activeEditor?.document.fileName || 'unknown',
            language: activeEditor?.document.languageId || 'unknown',
            lineCount: activeEditor?.document.lineCount || 0
        };
    }
    async enhanceTranscriptWithContext(transcript, contexts) {
        // Erweitere Transcript mit Kontext-Informationen
        const contextInfo = [
            `Projekt: ${contexts.projectContext.name}`,
            `Datei: ${contexts.fileContext.name}`,
            `Sprache: ${contexts.fileContext.language}`,
            `Expertise: ${contexts.userContext.expertise}`
        ].join(', ');
        return `${transcript} [Kontext: ${contextInfo}]`;
    }
    async detectLanguage(transcript) {
        // Einfache Sprach-Erkennung basierend auf Schlüsselwörtern
        const languagePatterns = {
            de: ['der', 'die', 'das', 'und', 'oder', 'nicht', 'gut', 'schlecht'],
            en: ['the', 'and', 'or', 'not', 'good', 'bad', 'help', 'please'],
            fr: ['le', 'la', 'et', 'ou', 'non', 'bon', 'mauvais', 'aide'],
            es: ['el', 'la', 'y', 'o', 'no', 'bueno', 'malo', 'ayuda']
        };
        const words = transcript.toLowerCase().split(' ');
        const scores = {};
        for (const [lang, patterns] of Object.entries(languagePatterns)) {
            scores[lang] = patterns.filter(pattern => words.some(word => word.includes(pattern))).length;
        }
        const detectedLang = Object.entries(scores)
            .sort(([, a], [, b]) => b - a)[0];
        return detectedLang[1] > 0 ? detectedLang[0] : 'de';
    }
    async translateToGerman(text, sourceLanguage) {
        // Einfache Übersetzung (in Produktion würde hier ein echter Übersetzer stehen)
        const translations = {
            en: {
                'help': 'hilfe',
                'please': 'bitte',
                'good': 'gut',
                'bad': 'schlecht',
                'code': 'code',
                'file': 'datei',
                'project': 'projekt'
            }
        };
        let translated = text;
        const langTranslations = translations[sourceLanguage] || {};
        for (const [en, de] of Object.entries(langTranslations)) {
            translated = translated.replace(new RegExp(en, 'gi'), de);
        }
        return translated;
    }
    determineResponseStyle(emotion, context) {
        if (emotion.primary === 'confused')
            return 'explanatory';
        if (emotion.primary === 'angry')
            return 'calm';
        if (emotion.primary === 'excited')
            return 'enthusiastic';
        if (context.context.userExpertise === 'beginner')
            return 'detailed';
        return 'normal';
    }
    createEnhancedPrompt(transcript, context, style) {
        const stylePrefixes = {
            explanatory: 'Erkläre detailliert: ',
            calm: 'Beruhigend und hilfreich: ',
            enthusiastic: 'Begeistert und motivierend: ',
            detailed: 'Für Anfänger erklärt: ',
            normal: ''
        };
        return `${stylePrefixes[style] || ''}${transcript}`;
    }
    detectProjectType(path) {
        if (path.includes('node_modules'))
            return 'javascript';
        if (path.includes('.py'))
            return 'python';
        if (path.includes('.java'))
            return 'java';
        if (path.includes('.cs'))
            return 'csharp';
        return 'unknown';
    }
    determineUserExpertise(context) {
        // Bestimme Expertise basierend auf Kontext
        const recentCommands = context.recentCommands || [];
        const complexCommands = recentCommands.filter((cmd) => cmd.includes('advanced') || cmd.includes('complex') || cmd.includes('optimize')).length;
        if (complexCommands > 5)
            return 'expert';
        if (complexCommands > 2)
            return 'intermediate';
        return 'beginner';
    }
}
exports.ExperimentalVoiceFeatures = ExperimentalVoiceFeatures;
//# sourceMappingURL=advancedVoiceFeatures.js.map