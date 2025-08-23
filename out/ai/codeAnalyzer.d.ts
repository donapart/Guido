/**
 * Context-Aware Code Analyzer for comprehensive code analysis
 */
import { ModelRouter } from '../router';
import { Provider } from '../providers/base';
export interface CodeAnalysisRequest {
    type: 'single_file' | 'directory' | 'project' | 'selection';
    target: string;
    focus: 'quality' | 'security' | 'performance' | 'architecture' | 'documentation' | 'testing';
    depth: 'shallow' | 'medium' | 'deep';
    includeContext: boolean;
    language?: string;
}
export interface CodeFinding {
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    message: string;
    description: string;
    location: {
        file: string;
        line: number;
        column?: number;
        endLine?: number;
        endColumn?: number;
    };
    suggestion?: string;
    codeSnippet?: string;
}
export interface CodeRecommendation {
    type: 'refactoring' | 'optimization' | 'security' | 'best_practice' | 'architecture';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    implementation: string;
    benefits: string[];
    estimated_effort: string;
    impact: 'low' | 'medium' | 'high';
}
export interface CodeMetrics {
    lines_of_code: number;
    cyclomatic_complexity: number;
    maintainability_index: number;
    technical_debt: number;
    test_coverage?: number;
    duplication_ratio?: number;
}
export interface CodeAnalysisResult {
    summary: string;
    confidence: number;
    findings: CodeFinding[];
    recommendations: CodeRecommendation[];
    metrics: CodeMetrics;
    context: {
        project_type?: string;
        language: string;
        framework?: string;
        patterns_detected: string[];
    };
}
export declare class ContextAwareCodeAnalyzer {
    private router;
    private providers;
    constructor(router: ModelRouter, providers: Map<string, Provider>);
    analyzeCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResult>;
    reviewPullRequest(prUrl: string): Promise<{
        summary: string;
        approval: 'approve' | 'request_changes' | 'comment';
        findings: CodeFinding[];
        recommendations: string[];
    }>;
    private readFile;
    private readDirectory;
    private readProject;
    private getFileContext;
    private getCurrentFileContext;
    private getDirectoryContext;
    private getProjectContext;
    private buildAnalysisPrompt;
    private parseAnalysisResult;
    private isCodeFile;
    private getLanguageFromExtension;
    private inferProjectType;
    private estimateLineCount;
}
//# sourceMappingURL=codeAnalyzer.d.ts.map