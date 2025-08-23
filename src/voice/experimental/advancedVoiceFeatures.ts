/**
 * Experimentelle Voice-Features für Guido
 * Erweiterte Sprachverarbeitung mit emotionaler Erkennung und Kontextbewusstsein
 */

import * as vscode from 'vscode';

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

export class ExperimentalVoiceFeatures {
  private emotionModels: Map<string, any> = new Map();
  private contextHistory: Map<string, any[]> = new Map();
  private languageDetectors: Map<string, any> = new Map();

  constructor() {
    this.initializeExperimentalFeatures();
  }

  private async initializeExperimentalFeatures() {
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
  async detectEmotion(transcript: string): Promise<EmotionAnalysis> {
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
    } catch (error) {
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
  async enhanceContext(transcript: string, context: any): Promise<ContextEnhancement> {
    try {
      const projectContext = await this.analyzeProjectContext(context);
      const userContext = await this.analyzeUserContext(context);
      const fileContext = await this.analyzeFileContext(context);

      const enhancedTranscript = await this.enhanceTranscriptWithContext(
        transcript, 
        { projectContext, userContext, fileContext }
      );

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
    } catch (error) {
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
  async processMultilingual(transcript: string): Promise<MultilingualResult> {
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
    } catch (error) {
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
  async generateAdaptiveResponse(
    transcript: string, 
    emotion: EmotionAnalysis, 
    context: ContextEnhancement
  ): Promise<string> {
    const responseStyle = this.determineResponseStyle(emotion, context);
    const enhancedPrompt = this.createEnhancedPrompt(transcript, context, responseStyle);
    
    return enhancedPrompt;
  }

  // Private Hilfsmethoden
  private async analyzeEmotionV1(transcript: string): Promise<any> {
    // Experimentelle Emotion-Analyse basierend auf Schlüsselwörtern
    const emotionKeywords = {
      happy: ['gut', 'toll', 'super', 'fantastisch', 'ausgezeichnet'],
      sad: ['schlecht', 'traurig', 'frustriert', 'enttäuscht', 'nicht gut'],
      angry: ['wütend', 'ärgerlich', 'verärgert', 'genervt', 'frustriert'],
      excited: ['aufgeregt', 'begeistert', 'spannend', 'interessant'],
      confused: ['verwirrt', 'verstehe nicht', 'unklar', 'kompliziert']
    };

    const words = transcript.toLowerCase().split(' ');
    const emotionScores: Record<string, number> = {};

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      emotionScores[emotion] = keywords.filter(keyword => 
        words.some(word => word.includes(keyword))
      ).length;
    }

    const sortedEmotions = Object.entries(emotionScores).sort(([,a], [,b]) => b - a);

    if (sortedEmotions.length > 0 && sortedEmotions[0][1] > 0) {
        const [emotion, score] = sortedEmotions[0];
        return {
            emotion,
            confidence: Math.min(score / 3, 1.0), // Normalize confidence
            intensity: score / 5
        };
    }

    return { emotion: 'neutral', confidence: 0.5, intensity: 0.1 };
  }

  private async analyzeSentiment(transcript: string): Promise<any> {
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

  private combineEmotionResults(results: any[]): any {
    // Kombiniere verschiedene Emotion-Analysen
    const emotion = results[0]?.emotion || 'neutral';
    const confidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length;
    
    return { emotion, confidence, intensity: results[0]?.intensity || 0.5 };
  }

  private async analyzeProjectContext(context: any): Promise<any> {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    return {
      name: workspace?.name || 'unknown',
      path: workspace?.uri.fsPath || 'unknown',
      type: this.detectProjectType(workspace?.uri.fsPath || '')
    };
  }

  private async analyzeUserContext(context: any): Promise<any> {
    // Analysiere Benutzerverhalten aus Kontext
    return {
      expertise: this.determineUserExpertise(context),
      recentCommands: context.recentCommands || [],
      preferences: context.preferences || {}
    };
  }

  private async analyzeFileContext(context: any): Promise<any> {
    const activeEditor = vscode.window.activeTextEditor;
    return {
      name: activeEditor?.document.fileName || 'unknown',
      language: activeEditor?.document.languageId || 'unknown',
      lineCount: activeEditor?.document.lineCount || 0
    };
  }

  private async enhanceTranscriptWithContext(transcript: string, contexts: any): Promise<string> {
    // Erweitere Transcript mit Kontext-Informationen
    const contextInfo = [
      `Projekt: ${contexts.projectContext.name}`,
      `Datei: ${contexts.fileContext.name}`,
      `Sprache: ${contexts.fileContext.language}`,
      `Expertise: ${contexts.userContext.expertise}`
    ].join(', ');

    return `${transcript} [Kontext: ${contextInfo}]`;
  }

  private async detectLanguage(transcript: string): Promise<string> {
    // Einfache Sprach-Erkennung basierend auf Schlüsselwörtern
    const languagePatterns = {
      de: ['der', 'die', 'das', 'und', 'oder', 'nicht', 'gut', 'schlecht'],
      en: ['the', 'and', 'or', 'not', 'good', 'bad', 'help', 'please'],
      fr: ['le', 'la', 'et', 'ou', 'non', 'bon', 'mauvais', 'aide'],
      es: ['el', 'la', 'y', 'o', 'no', 'bueno', 'malo', 'ayuda']
    };

    const words = transcript.toLowerCase().split(' ');
    const scores: Record<string, number> = {};

    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      scores[lang] = patterns.filter(pattern => 
        words.some(word => word.includes(pattern))
      ).length;
    }

    const sortedScores = Object.entries(scores).sort(([, a], [, b]) => b - a);

    if (sortedScores.length > 0 && sortedScores[0][1] > 0) {
        return sortedScores[0][0]; // Return language with the highest score
    }
    return 'de'; // Fallback to German
  }

  private async translateToGerman(text: string, sourceLanguage: string): Promise<string> {
    // Einfache Übersetzung (in Produktion würde hier ein echter Übersetzer stehen)
    const translations: Record<string, Record<string, string>> = {
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

  private determineResponseStyle(emotion: EmotionAnalysis, context: ContextEnhancement): string {
    if (emotion.primary === 'confused') return 'explanatory';
    if (emotion.primary === 'angry') return 'calm';
    if (emotion.primary === 'excited') return 'enthusiastic';
    if (context.context.userExpertise === 'beginner') return 'detailed';
    return 'normal';
  }

  private createEnhancedPrompt(transcript: string, context: ContextEnhancement, style: string): string {
    const stylePrefixes = {
      explanatory: 'Erkläre detailliert: ',
      calm: 'Beruhigend und hilfreich: ',
      enthusiastic: 'Begeistert und motivierend: ',
      detailed: 'Für Anfänger erklärt: ',
      normal: ''
    };

    return `${stylePrefixes[style as keyof typeof stylePrefixes] || ''}${transcript}`;
  }

  private detectProjectType(path: string): string {
    if (path.includes('node_modules')) return 'javascript';
    if (path.includes('.py')) return 'python';
    if (path.includes('.java')) return 'java';
    if (path.includes('.cs')) return 'csharp';
    return 'unknown';
  }

  private determineUserExpertise(context: any): string {
    // Bestimme Expertise basierend auf Kontext
    const recentCommands = context.recentCommands || [];
    const complexCommands = recentCommands.filter((cmd: string) => 
      cmd.includes('advanced') || cmd.includes('complex') || cmd.includes('optimize')
    ).length;

    if (complexCommands > 5) return 'expert';
    if (complexCommands > 2) return 'intermediate';
    return 'beginner';
  }
}
