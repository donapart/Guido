/**
 * Experimentelles Advanced Routing System für Guido
 * Dynamische Modell-Auswahl und kontextbewusstes Routing
 */

import { Provider } from "../../providers/base";
import { ModelRouter } from "../../router";

export interface RoutingDecision {
  model: string;
  provider: string;
  reasoning: string;
  confidence: number;
  estimatedCost: number;
  performanceScore: number;
}

export interface PerformanceHistory {
  model: string;
  provider: string;
  successRate: number;
  averageResponseTime: number;
  costEfficiency: number;
  lastUsed: Date;
  usageCount: number;
}

export interface ContextAwareRouting {
  userContext: {
    expertise: string;
    preferences: Record<string, any>;
    recentModels: string[];
  };
  projectContext: {
    type: string;
    complexity: string;
    language: string;
    requirements: string[];
  };
  taskContext: {
    type: string;
    urgency: string;
    complexity: string;
    constraints: string[];
  };
}

export class ExperimentalRouting {
  private performanceHistory: Map<string, PerformanceHistory> = new Map();
  private costHistory: Map<string, number[]> = new Map();
  private userPreferences: Map<string, any> = new Map();
  private router: ModelRouter;
  private providers: Map<string, Provider>;

  constructor(router: ModelRouter, providers: Map<string, Provider>) {
    this.router = router;
    this.providers = providers;
    this.initializePerformanceTracking();
  }

  /**
   * Dynamische Modell-Auswahl basierend auf Performance
   */
  async dynamicModelSelection(prompt: string, context: any): Promise<string> {
    try {
      const performanceHistory = await this.getPerformanceHistory();
      const taskComplexity = this.analyzeTaskComplexity(prompt);
      const userContext = await this.analyzeUserContext(context);
      
      const candidates = this.getModelCandidates(performanceHistory, taskComplexity);
      const bestModel = this.selectBestPerformingModel(candidates, userContext);
      
      // Performance-Tracking aktualisieren
      this.updatePerformanceTracking(bestModel, 'selected');
      
      return bestModel;
    } catch (error) {
      console.warn('Dynamic model selection failed:', error);
      return 'gpt-4o-mini'; // Fallback
    }
  }

  /**
   * Kontext-basierte Routing-Regeln
   */
  async contextAwareRouting(prompt: string, context: any): Promise<RoutingDecision> {
    try {
      const userContext = await this.analyzeUserContext(context);
      const projectContext = await this.analyzeProjectContext(context);
      const taskContext = await this.analyzeTaskContext(prompt, context);
      
      const routingContext: ContextAwareRouting = {
        userContext,
        projectContext,
        taskContext
      };

      const decision = this.makeContextAwareDecision(routingContext);
      
      return {
        model: decision.model,
        provider: decision.provider,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
        estimatedCost: decision.estimatedCost,
        performanceScore: decision.performanceScore
      };
    } catch (error) {
      console.warn('Context-aware routing failed:', error);
      return {
        model: 'gpt-4o-mini',
        provider: 'openai',
        reasoning: 'Fallback due to error',
        confidence: 0.5,
        estimatedCost: 0.01,
        performanceScore: 0.5
      };
    }
  }

  /**
   * Adaptive Kostenoptimierung
   */
  async adaptiveCostOptimization(prompt: string, budget: number): Promise<string> {
    try {
      const costHistory = await this.getCostHistory();
      const promptComplexity = this.analyzePromptComplexity(prompt);
      const optimalModel = this.findOptimalModel(prompt, budget, costHistory);
      
      // Kosten-Tracking aktualisieren
      this.updateCostTracking(optimalModel, promptComplexity);
      
      return optimalModel;
    } catch (error) {
      console.warn('Adaptive cost optimization failed:', error);
      return 'gpt-4o-mini';
    }
  }

  /**
   * Intelligente Modell-Kombination
   */
  async intelligentModelCombination(prompt: string, context: any): Promise<string[]> {
    try {
      const taskParts = this.decomposeTask(prompt);
      const modelCombination = this.selectModelCombination(taskParts, context);
      
      return modelCombination;
    } catch (error) {
      console.warn('Intelligent model combination failed:', error);
      return ['gpt-4o-mini'];
    }
  }

  /**
   * Performance-basierte Modell-Auswahl
   */
  async performanceBasedSelection(prompt: string): Promise<RoutingDecision> {
    try {
      const performanceScores = await this.calculatePerformanceScores();
      const promptRequirements = this.analyzePromptRequirements(prompt);
      
      const bestModel = this.selectByPerformance(performanceScores, promptRequirements);
      
      return {
        model: bestModel.model,
        provider: bestModel.provider,
        reasoning: `Performance-basiert: ${bestModel.score.toFixed(2)}`,
        confidence: bestModel.confidence,
        estimatedCost: bestModel.estimatedCost,
        performanceScore: bestModel.score
      };
    } catch (error) {
      console.warn('Performance-based selection failed:', error);
      return {
        model: 'gpt-4o-mini',
        provider: 'openai',
        reasoning: 'Performance selection failed',
        confidence: 0.5,
        estimatedCost: 0.01,
        performanceScore: 0.5
      };
    }
  }

  // Private Hilfsmethoden
  private initializePerformanceTracking() {
    // Initialisiere Performance-Tracking mit Standard-Werten
    const defaultModels = ['gpt-4o', 'gpt-4o-mini', 'deepseek-coder', 'phi-3.5'];
    
    defaultModels.forEach(model => {
      this.performanceHistory.set(model, {
        model,
        provider: 'openai',
        successRate: 0.95,
        averageResponseTime: 2000,
        costEfficiency: 0.8,
        lastUsed: new Date(),
        usageCount: 0
      });
    });
  }

  private async getPerformanceHistory(): Promise<PerformanceHistory[]> {
    return Array.from(this.performanceHistory.values());
  }

  private async getCostHistory(): Promise<Map<string, number[]>> {
    return this.costHistory;
  }

  private analyzeTaskComplexity(prompt: string): string {
    const complexityIndicators = {
      simple: ['erkläre', 'was ist', 'definiere', 'beschreibe'],
      medium: ['analysiere', 'vergleiche', 'erkläre warum', 'zeige'],
      complex: ['optimiere', 'debugge', 'refactore', 'architekturiere', 'designe']
    };

    const words = prompt.toLowerCase().split(' ');
    
    for (const [complexity, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => words.some(word => word.includes(indicator)))) {
        return complexity;
      }
    }

    return 'medium';
  }

  private async analyzeUserContext(context: any): Promise<any> {
    return {
      expertise: context.userExpertise || 'intermediate',
      preferences: context.preferences || {},
      recentModels: context.recentModels || []
    };
  }

  private async analyzeProjectContext(context: any): Promise<any> {
    return {
      type: context.projectType || 'unknown',
      complexity: context.projectComplexity || 'medium',
      language: context.projectLanguage || 'unknown',
      requirements: context.requirements || []
    };
  }

  private async analyzeTaskContext(prompt: string, context: any): Promise<any> {
    return {
      type: this.detectTaskType(prompt),
      urgency: context.urgency || 'normal',
      complexity: this.analyzeTaskComplexity(prompt),
      constraints: context.constraints || []
    };
  }

  private detectTaskType(prompt: string): string {
    const taskTypes = {
      coding: ['code', 'programm', 'funktion', 'klasse', 'methode'],
      analysis: ['analysiere', 'bewerte', 'prüfe', 'teste'],
      explanation: ['erkläre', 'was ist', 'wie funktioniert'],
      optimization: ['optimiere', 'verbessere', 'beschleunige'],
      debugging: ['debug', 'fehler', 'problem', 'bug']
    };

    const words = prompt.toLowerCase().split(' ');
    
    for (const [type, keywords] of Object.entries(taskTypes)) {
      if (keywords.some(keyword => words.some(word => word.includes(keyword)))) {
        return type;
      }
    }

    return 'general';
  }

  private getModelCandidates(history: PerformanceHistory[], complexity: string): PerformanceHistory[] {
    // Filtere Modelle basierend auf Komplexität
    const complexityModels = {
      simple: ['gpt-4o-mini', 'phi-3.5'],
      medium: ['gpt-4o-mini', 'deepseek-coder', 'gpt-4o'],
      complex: ['gpt-4o', 'deepseek-coder']
    };

    const allowedModels = complexityModels[complexity as keyof typeof complexityModels] || ['gpt-4o-mini'];
    
    return history.filter(h => allowedModels.includes(h.model));
  }

  private selectBestPerformingModel(candidates: PerformanceHistory[], userContext: any): string {
    // Bewerte Kandidaten basierend auf Performance und Benutzer-Präferenzen
    const scoredCandidates = candidates.map(candidate => ({
      ...candidate,
      score: this.calculateModelScore(candidate, userContext)
    }));

    const bestCandidate = scoredCandidates.sort((a, b) => b.score - a.score)[0];
    return bestCandidate.model;
  }

  private calculateModelScore(candidate: PerformanceHistory, userContext: any): number {
    const performanceWeight = 0.4;
    const costWeight = 0.3;
    const preferenceWeight = 0.3;

    const performanceScore = candidate.successRate * candidate.costEfficiency;
    const costScore = 1 - (candidate.costEfficiency * 0.5); // Niedrigere Kosten = höherer Score
    const preferenceScore = userContext.recentModels.includes(candidate.model) ? 0.8 : 0.5;

    return (performanceScore * performanceWeight) + 
           (costScore * costWeight) + 
           (preferenceScore * preferenceWeight);
  }

  private makeContextAwareDecision(context: ContextAwareRouting): any {
    // Entscheidungslogik basierend auf Kontext
    const { userContext, projectContext, taskContext } = context;

    let model = 'gpt-4o-mini';
    let provider = 'openai';
    let reasoning = 'Standard-Auswahl';

    // Benutzer-Expertise-basierte Auswahl
    if (userContext.expertise === 'expert' && taskContext.complexity === 'complex') {
      model = 'gpt-4o';
      reasoning = 'Experte + komplexe Aufgabe = GPT-4o';
    } else if (userContext.expertise === 'beginner') {
      model = 'gpt-4o-mini';
      reasoning = 'Anfänger = einfaches Modell';
    }

    // Projekt-spezifische Auswahl
    if (projectContext.language === 'python' && taskContext.type === 'coding') {
      model = 'deepseek-coder';
      reasoning = 'Python + Coding = DeepSeek Coder';
    }

    // Kosten-bewusste Auswahl
    if (taskContext.urgency === 'low' && projectContext.complexity === 'simple') {
      model = 'phi-3.5';
      reasoning = 'Niedrige Priorität + einfach = kostengünstiges Modell';
    }

    const estimatedCost = this.estimateCost(model, 0.5); // Use default complexity
    const performanceScore = this.getPerformanceScore(model);

    return {
      model,
      provider,
      reasoning,
      confidence: 0.85,
      estimatedCost,
      performanceScore
    };
  }

  private analyzePromptComplexity(prompt: string): number {
    const words = prompt.split(' ').length;
    const hasCode = prompt.includes('```') || prompt.includes('function') || prompt.includes('class');
    const hasComplexTerms = prompt.includes('optimize') || prompt.includes('analyze') || prompt.includes('debug');

    let complexity = 0.5; // Basis-Komplexität

    if (words > 50) complexity += 0.2;
    if (hasCode) complexity += 0.3;
    if (hasComplexTerms) complexity += 0.2;

    return Math.min(complexity, 1.0);
  }

  private findOptimalModel(prompt: string, budget: number, costHistory: Map<string, number[]>): string {
    const complexity = this.analyzePromptComplexity(prompt);
    const availableModels = ['gpt-4o-mini', 'phi-3.5', 'deepseek-coder', 'gpt-4o'];
    
    // Bewerte Modelle basierend auf Kosten und Qualität
    const modelScores = availableModels.map(model => ({
      model,
      cost: this.estimateCost(model, complexity),
      quality: this.estimateQuality(model, complexity),
      score: this.calculateOptimalScore(model, complexity, budget)
    }));

    const bestModel = modelScores.sort((a, b) => b.score - a.score)[0];
    return bestModel.model;
  }

  private estimateCost(model: string, complexity: number): number {
    const baseCosts: Record<string, number> = {
      'gpt-4o-mini': 0.001,
      'phi-3.5': 0.0005,
      'deepseek-coder': 0.002,
      'gpt-4o': 0.005
    };

    const baseCost = baseCosts[model] || 0.001;
    return baseCost * complexity * 100; // Skaliere mit Komplexität
  }

  private estimateQuality(model: string, complexity: number): number {
    const baseQuality: Record<string, number> = {
      'gpt-4o-mini': 0.7,
      'phi-3.5': 0.6,
      'deepseek-coder': 0.8,
      'gpt-4o': 0.9
    };

    return baseQuality[model] || 0.7;
  }

  private calculateOptimalScore(model: string, complexity: number, budget: number): number {
    const cost = this.estimateCost(model, complexity);
    const quality = this.estimateQuality(model, complexity);

    if (cost > budget) return 0; // Über Budget

    const costEfficiency = 1 - (cost / budget);
    const qualityWeight = 0.7;
    const costWeight = 0.3;

    return (quality * qualityWeight) + (costEfficiency * costWeight);
  }

  private decomposeTask(prompt: string): string[] {
    // Einfache Task-Zerlegung basierend auf Schlüsselwörtern
    const tasks: string[] = [];
    
    if (prompt.includes('analysiere') && prompt.includes('optimiere')) {
      tasks.push('analysis', 'optimization');
    } else if (prompt.includes('erkläre') && prompt.includes('code')) {
      tasks.push('explanation', 'code_generation');
    } else {
      tasks.push('general');
    }

    return tasks;
  }

  private selectModelCombination(taskParts: string[], context: any): string[] {
    const modelMapping: Record<string, string> = {
      'analysis': 'gpt-4o',
      'optimization': 'deepseek-coder',
      'explanation': 'gpt-4o-mini',
      'code_generation': 'deepseek-coder',
      'general': 'gpt-4o-mini'
    };

    return taskParts.map(task => modelMapping[task] || 'gpt-4o-mini');
  }

  private async calculatePerformanceScores(): Promise<any[]> {
    const history = await this.getPerformanceHistory();
    
    return history.map(entry => ({
      model: entry.model,
      provider: entry.provider,
      score: entry.successRate * entry.costEfficiency,
      confidence: Math.min(entry.usageCount / 10, 1.0),
      estimatedCost: this.estimateCost(entry.model, 0.5)
    }));
  }

  private analyzePromptRequirements(prompt: string): string[] {
    const requirements: string[] = [];
    
    if (prompt.includes('code')) requirements.push('code_generation');
    if (prompt.includes('analysiere')) requirements.push('analysis');
    if (prompt.includes('erkläre')) requirements.push('explanation');
    if (prompt.includes('optimiere')) requirements.push('optimization');
    
    return requirements.length > 0 ? requirements : ['general'];
  }

  private selectByPerformance(scores: any[], requirements: string[]): any {
    // Filtere nach Anforderungen und wähle das beste Modell
    const relevantScores = scores.filter(score => 
      requirements.some(req => score.model.includes(req) || req === 'general')
    );

    return relevantScores.sort((a, b) => b.score - a.score)[0] || scores[0];
  }

  private getPerformanceScore(model: string): number {
    const history = this.performanceHistory.get(model);
    return history ? history.successRate * history.costEfficiency : 0.7;
  }

  private updatePerformanceTracking(model: string, action: string) {
    const history = this.performanceHistory.get(model);
    if (history) {
      history.lastUsed = new Date();
      history.usageCount++;
      this.performanceHistory.set(model, history);
    }
  }

  private updateCostTracking(model: string, complexity: number) {
    const cost = this.estimateCost(model, complexity);
    const currentCosts = this.costHistory.get(model) || [];
    currentCosts.push(cost);
    
    // Behalte nur die letzten 100 Einträge
    if (currentCosts.length > 100) {
      currentCosts.splice(0, currentCosts.length - 100);
    }
    
    this.costHistory.set(model, currentCosts);
  }
}
