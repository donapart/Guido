/**
 * Experimentelle Voice-Features für Guido
 * Erweiterte Sprachverarbeitung mit emotionaler Erkennung und Kontextbewusstsein
 */
export interface EmotionAnalysis {
    primary: string;
    confidence: number;
    secondary?: string;
    intensity: number;
}
export interface ContextEnhancement {
    transcript: string;
    context: {
        project: string;
        file: string;
        userExpertise: string;
        recentCommands: string[];
    };
    enhanced: boolean;
}
export interface MultilingualResult {
    originalLanguage: string;
    detectedLanguage: string;
    translated: boolean;
    transcript: string;
    confidence: number;
}
export declare class ExperimentalVoiceFeatures {
    private emotionModels;
    private contextHistory;
    private languageDetectors;
    constructor();
    private initializeExperimentalFeatures;
    /**
     * Emotionale Erkennung aus Transcript
     */
    detectEmotion(transcript: string): Promise<EmotionAnalysis>;
    /**
     * Kontextbewusstsein erweitern
     */
    enhanceContext(transcript: string, context: any): Promise<ContextEnhancement>;
    /**
     * Mehrsprachige Verarbeitung
     */
    processMultilingual(transcript: string): Promise<MultilingualResult>;
    /**
     * Adaptive Antworten basierend auf Emotion und Kontext
     */
    generateAdaptiveResponse(transcript: string, emotion: EmotionAnalysis, context: ContextEnhancement): Promise<string>;
    private analyzeEmotionV1;
    private analyzeSentiment;
    private combineEmotionResults;
    private analyzeProjectContext;
    private analyzeUserContext;
    private analyzeFileContext;
    private enhanceTranscriptWithContext;
    private detectLanguage;
    private translateToGerman;
    private determineResponseStyle;
    private createEnhancedPrompt;
    private detectProjectType;
    private determineUserExpertise;
}
//# sourceMappingURL=advancedVoiceFeatures.d.ts.map