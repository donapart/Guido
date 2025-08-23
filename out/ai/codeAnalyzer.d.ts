import { Provider } from '../providers/base';
import { ModelRouter } from '../router';
export interface CodeContext {
    file: string;
    content: string;
    language: string;
    dependencies: string[];
    imports: string[];
    exports: string[];
    functions: FunctionInfo[];
    classes: ClassInfo[];
    interfaces: InterfaceInfo[];
    types: TypeInfo[];
}
export interface FunctionInfo {
    name: string;
    parameters: ParameterInfo[];
    returnType: string;
    line: number;
    documentation?: string;
    complexity?: number;
}
export interface ClassInfo {
    name: string;
    extends?: string;
    implements: string[];
    methods: FunctionInfo[];
    properties: PropertyInfo[];
    line: number;
    documentation?: string;
}
export interface InterfaceInfo {
    name: string;
    extends: string[];
    properties: PropertyInfo[];
    methods: FunctionInfo[];
    line: number;
    documentation?: string;
}
export interface TypeInfo {
    name: string;
    definition: string;
    line: number;
    documentation?: string;
}
export interface PropertyInfo {
    name: string;
    type: string;
    visibility: 'public' | 'private' | 'protected';
    line: number;
    documentation?: string;
}
export interface ParameterInfo {
    name: string;
    type: string;
    optional: boolean;
    default?: string;
}
export interface ProjectStructure {
    rootPath: string;
    files: string[];
    directories: string[];
    packageJson?: any;
    tsConfig?: any;
    framework?: string;
    dependencies: string[];
    devDependencies: string[];
}
export interface AnalysisRequest {
    type: 'single_file' | 'project_wide' | 'function_specific' | 'class_specific';
    target: string;
    focus: 'quality' | 'security' | 'performance' | 'architecture' | 'documentation' | 'testing';
    depth: 'shallow' | 'medium' | 'deep';
    includeContext: boolean;
}
export interface AnalysisResult {
    summary: string;
    findings: Finding[];
    recommendations: Recommendation[];
    metrics: CodeMetrics;
    context: CodeContext[];
    confidence: number;
}
export interface Finding {
    type: 'issue' | 'improvement' | 'warning' | 'info';
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    location: {
        file: string;
        line: number;
        column?: number;
    };
    description: string;
    examples?: string[];
}
export interface Recommendation {
    type: 'refactor' | 'optimize' | 'security' | 'documentation' | 'testing';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    implementation: string;
    estimated_effort: 'small' | 'medium' | 'large';
    benefits: string[];
}
export interface CodeMetrics {
    lines_of_code: number;
    cyclomatic_complexity: number;
    maintainability_index: number;
    technical_debt: number;
    test_coverage?: number;
    duplication_percentage?: number;
}
export declare class ContextAwareCodeAnalyzer {
    private router;
    private providers;
    private contextCache;
    private projectStructure?;
    constructor(router: ModelRouter, providers: Map<string, Provider>);
    /**
     * Analyze code with full context awareness
     */
    analyzeCode(request: AnalysisRequest): Promise<AnalysisResult>;
    /**
     * Get project structure and context
     */
    getProjectStructure(rootPath: string): Promise<ProjectStructure>;
    /**
     * Analyze single file with context
     */
    analyzeFile(filePath: string): Promise<CodeContext>;
    /**
     * Build comprehensive analysis context
     */
    private buildAnalysisContext;
    /**
     * Build analysis prompt with context
     */
    private buildAnalysisPrompt;
    /**
     * Find files related to the target file
     */
    private findRelatedFiles;
    /**
     * Identify key files in the project
     */
    private identifyKeyFiles;
    /**
     * Detect programming language from file extension
     */
    private detectLanguage;
    /**
     * Detect framework from dependencies
     */
    private detectFramework;
    /**
     * Scan directory structure recursively
     */
    private scanDirectory;
    /**
     * Extract basic code elements (simplified implementations)
     */
    private extractDependencies;
    private extractImports;
    private extractExports;
    private extractFunctions;
    private extractClasses;
    private extractInterfaces;
    private extractTypes;
    /**
     * Parse findings from AI response
     */
    private parseFindings;
    /**
     * Parse recommendations from AI response
     */
    private parseRecommendations;
    /**
     * Calculate basic code metrics
     */
    private calculateMetrics;
    /**
     * Calculate cyclomatic complexity (simplified)
     */
    private calculateCyclomaticComplexity;
    /**
     * Fallback analysis when AI analysis fails
     */
    private fallbackAnalysis;
}
//# sourceMappingURL=codeAnalyzer.d.ts.map