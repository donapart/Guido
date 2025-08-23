import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Provider, ChatMessage } from '../providers/base';
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
  target: string; // file path, function name, class name
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

export class ContextAwareCodeAnalyzer {
  private router: ModelRouter;
  private providers: Map<string, Provider>;
  private contextCache: Map<string, CodeContext> = new Map();
  private projectStructure?: ProjectStructure;

  constructor(router: ModelRouter, providers: Map<string, Provider>) {
    this.router = router;
    this.providers = providers;
  }

  /**
   * Analyze code with full context awareness
   */
  async analyzeCode(request: AnalysisRequest): Promise<AnalysisResult> {
    // Build comprehensive context
    const context = await this.buildAnalysisContext(request);
    
    // Generate analysis prompt
    const analysisPrompt = this.buildAnalysisPrompt(request, context);
    
    try {
      const result = await this.router.route({
        prompt: analysisPrompt,
        mode: request.focus === 'quality' ? 'quality' : 'auto'
      });

      const provider = this.providers.get(result.providerId);
      if (!provider) {
        throw new Error(`Provider ${result.providerId} not found`);
      }

      const messages: ChatMessage[] = [
        { role: 'user', content: analysisPrompt }
      ];

      const response = await provider.chatComplete(result.modelName, messages, {
        maxTokens: 6000,
        temperature: 0.3,
        json: true
      });

      const analysisData = JSON.parse(response.content);
      
      return {
        summary: analysisData.summary || 'Analysis completed',
        findings: this.parseFindings(analysisData.findings || []),
        recommendations: this.parseRecommendations(analysisData.recommendations || []),
        metrics: this.calculateMetrics(context),
        context,
        confidence: analysisData.confidence || 0.8
      };

    } catch (error) {
      console.error('Code analysis failed:', error);
      return this.fallbackAnalysis(request, context);
    }
  }

  /**
   * Get project structure and context
   */
  async getProjectStructure(rootPath: string): Promise<ProjectStructure> {
    if (this.projectStructure?.rootPath === rootPath) {
      return this.projectStructure;
    }

    const structure: ProjectStructure = {
      rootPath,
      files: [],
      directories: [],
      dependencies: [],
      devDependencies: []
    };

    try {
      // Read package.json if it exists
      const packageJsonPath = path.join(rootPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        structure.packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        structure.dependencies = Object.keys(structure.packageJson.dependencies || {});
        structure.devDependencies = Object.keys(structure.packageJson.devDependencies || {});
        
        // Detect framework
        structure.framework = this.detectFramework(structure.dependencies);
      }

      // Read tsconfig.json if it exists
      const tsConfigPath = path.join(rootPath, 'tsconfig.json');
      if (fs.existsSync(tsConfigPath)) {
        structure.tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
      }

      // Scan directory structure
      await this.scanDirectory(rootPath, structure, 0, 3); // Max depth 3

      this.projectStructure = structure;
      return structure;

    } catch (error) {
      console.error('Failed to analyze project structure:', error);
      return structure;
    }
  }

  /**
   * Analyze single file with context
   */
  async analyzeFile(filePath: string): Promise<CodeContext> {
    if (this.contextCache.has(filePath)) {
      return this.contextCache.get(filePath)!;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const language = this.detectLanguage(filePath);
      
      const context: CodeContext = {
        file: filePath,
        content,
        language,
        dependencies: this.extractDependencies(content, language),
        imports: this.extractImports(content, language),
        exports: this.extractExports(content, language),
        functions: this.extractFunctions(content, language),
        classes: this.extractClasses(content, language),
        interfaces: this.extractInterfaces(content, language),
        types: this.extractTypes(content, language)
      };

      this.contextCache.set(filePath, context);
      return context;

    } catch (error) {
      console.error(`Failed to analyze file ${filePath}:`, error);
      return {
        file: filePath,
        content: '',
        language: 'unknown',
        dependencies: [],
        imports: [],
        exports: [],
        functions: [],
        classes: [],
        interfaces: [],
        types: []
      };
    }
  }

  /**
   * Build comprehensive analysis context
   */
  private async buildAnalysisContext(request: AnalysisRequest): Promise<CodeContext[]> {
    const context: CodeContext[] = [];

    if (request.type === 'single_file') {
      const fileContext = await this.analyzeFile(request.target);
      context.push(fileContext);

      // Include related files if requested
      if (request.includeContext) {
        const relatedFiles = await this.findRelatedFiles(request.target);
        for (const relatedFile of relatedFiles.slice(0, 5)) { // Limit to 5 related files
          const relatedContext = await this.analyzeFile(relatedFile);
          context.push(relatedContext);
        }
      }

    } else if (request.type === 'project_wide') {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (workspaceFolder) {
        const projectStructure = await this.getProjectStructure(workspaceFolder.uri.fsPath);
        
        // Analyze key files
        const keyFiles = this.identifyKeyFiles(projectStructure);
        for (const keyFile of keyFiles.slice(0, 10)) { // Limit to 10 files
          const fileContext = await this.analyzeFile(keyFile);
          context.push(fileContext);
        }
      }
    }

    return context;
  }

  /**
   * Build analysis prompt with context
   */
  private buildAnalysisPrompt(request: AnalysisRequest, context: CodeContext[]): string {
    let prompt = `You are an expert code analyzer. Perform a ${request.depth} analysis focused on ${request.focus}.

ANALYSIS REQUEST:
- Type: ${request.type}
- Target: ${request.target}
- Focus: ${request.focus}
- Depth: ${request.depth}

CODE CONTEXT:
`;

    context.forEach((ctx, index) => {
      prompt += `
File ${index + 1}: ${ctx.file}
Language: ${ctx.language}
Dependencies: ${ctx.dependencies.join(', ')}
Functions: ${ctx.functions.length}
Classes: ${ctx.classes.length}

Code:
\`\`\`${ctx.language}
${ctx.content.length > 2000 ? ctx.content.substring(0, 2000) + '...' : ctx.content}
\`\`\`

`;
    });

    const focusInstructions = {
      quality: `Focus on:
1. Code quality and readability
2. Adherence to best practices
3. Code smells and anti-patterns
4. Maintainability issues
5. Naming conventions`,

      security: `Focus on:
1. Security vulnerabilities
2. Input validation issues
3. Authentication and authorization
4. Data exposure risks
5. Injection attacks`,

      performance: `Focus on:
1. Performance bottlenecks
2. Memory usage optimization
3. Algorithm efficiency
4. Database query optimization
5. Caching opportunities`,

      architecture: `Focus on:
1. Architectural patterns
2. Design principles (SOLID)
3. Component coupling
4. Separation of concerns
5. Scalability considerations`,

      documentation: `Focus on:
1. Code documentation quality
2. Missing documentation
3. API documentation
4. Comment clarity
5. Documentation completeness`,

      testing: `Focus on:
1. Test coverage analysis
2. Test quality assessment
3. Missing test cases
4. Test maintainability
5. Testing best practices`
    };

    prompt += focusInstructions[request.focus];

    prompt += `

Please provide your analysis in the following JSON format:

{
  "summary": "High-level summary of findings",
  "findings": [
    {
      "type": "issue|improvement|warning|info",
      "category": "specific category",
      "severity": "low|medium|high|critical",
      "message": "Brief message",
      "location": {
        "file": "file path",
        "line": line_number
      },
      "description": "Detailed description",
      "examples": ["example solutions"]
    }
  ],
  "recommendations": [
    {
      "type": "refactor|optimize|security|documentation|testing",
      "priority": "low|medium|high",
      "title": "Recommendation title",
      "description": "Detailed description",
      "implementation": "How to implement",
      "estimated_effort": "small|medium|large",
      "benefits": ["benefit1", "benefit2"]
    }
  ],
  "confidence": 0.0-1.0
}`;

    return prompt;
  }

  /**
   * Find files related to the target file
   */
  private async findRelatedFiles(filePath: string): Promise<string[]> {
    const related: string[] = [];
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    
    if (!workspaceFolder) return related;

    const fileContext = await this.analyzeFile(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const dirName = path.dirname(filePath);

    // Find files with similar names
    const pattern = new vscode.RelativePattern(workspaceFolder, `**/*${baseName}*`);
    const similarFiles = await vscode.workspace.findFiles(pattern);
    
    // Find files that import this file
    const allFiles = await vscode.workspace.findFiles('**/*.{ts,js,tsx,jsx}');
    
    for (const file of allFiles) {
      if (file.fsPath === filePath) continue;
      
      try {
        const content = fs.readFileSync(file.fsPath, 'utf8');
        
        // Check if this file imports the target file
        if (content.includes(baseName) || content.includes(path.relative(path.dirname(file.fsPath), filePath))) {
          related.push(file.fsPath);
        }
      } catch (error) {
        // Ignore files we can't read
      }
    }

    return related;
  }

  /**
   * Identify key files in the project
   */
  private identifyKeyFiles(structure: ProjectStructure): string[] {
    const keyFiles: string[] = [];
    
    // Look for entry points
    const entryPoints = [
      'index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js',
      'server.ts', 'server.js', 'extension.ts'
    ];

    for (const file of structure.files) {
      const basename = path.basename(file);
      
      // Add entry points
      if (entryPoints.includes(basename)) {
        keyFiles.push(file);
      }
      
      // Add configuration files
      if (basename.includes('config') || basename.includes('settings')) {
        keyFiles.push(file);
      }
      
      // Add test files
      if (basename.includes('.test.') || basename.includes('.spec.')) {
        keyFiles.push(file);
      }
    }

    return keyFiles;
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.tsx': 'typescript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin'
    };

    return languageMap[ext] || 'unknown';
  }

  /**
   * Detect framework from dependencies
   */
  private detectFramework(dependencies: string[]): string {
    const frameworks = {
      'react': 'React',
      'vue': 'Vue.js',
      'angular': 'Angular',
      'express': 'Express.js',
      'fastify': 'Fastify',
      'next': 'Next.js',
      'nuxt': 'Nuxt.js',
      'svelte': 'Svelte',
      'ember': 'Ember.js'
    };

    for (const dep of dependencies) {
      for (const [key, framework] of Object.entries(frameworks)) {
        if (dep.includes(key)) {
          return framework;
        }
      }
    }

    return 'Unknown';
  }

  /**
   * Scan directory structure recursively
   */
  private async scanDirectory(dirPath: string, structure: ProjectStructure, currentDepth: number, maxDepth: number): Promise<void> {
    if (currentDepth >= maxDepth) return;

    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!item.startsWith('.') && item !== 'node_modules') {
            structure.directories.push(fullPath);
            await this.scanDirectory(fullPath, structure, currentDepth + 1, maxDepth);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.c', '.cpp'].includes(ext)) {
            structure.files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore directories we can't read
    }
  }

  /**
   * Extract basic code elements (simplified implementations)
   */
  private extractDependencies(content: string, language: string): string[] {
    const deps: string[] = [];
    
    if (language === 'typescript' || language === 'javascript') {
      // Extract from import statements
      const importMatches = content.match(/import .* from ['"]([^'"]+)['"]/g);
      if (importMatches) {
        importMatches.forEach(match => {
          const dep = match.match(/from ['"]([^'"]+)['"]/)?.[1];
          if (dep && !dep.startsWith('.')) {
            deps.push(dep);
          }
        });
      }
    }
    
    return [...new Set(deps)];
  }

  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];
    
    if (language === 'typescript' || language === 'javascript') {
      const importMatches = content.match(/import .* from ['"]([^'"]+)['"]/g);
      if (importMatches) {
        imports.push(...importMatches);
      }
    }
    
    return imports;
  }

  private extractExports(content: string, language: string): string[] {
    const exports: string[] = [];
    
    if (language === 'typescript' || language === 'javascript') {
      const exportMatches = content.match(/export .*/g);
      if (exportMatches) {
        exports.push(...exportMatches);
      }
    }
    
    return exports;
  }

  private extractFunctions(content: string, language: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    
    if (language === 'typescript' || language === 'javascript') {
      // Simple function extraction - could be enhanced with proper parsing
      const functionMatches = content.match(/(?:function\s+|const\s+\w+\s*=\s*(?:async\s+)?(?:\(.*?\)\s*=>|\function))\s*(\w+)/g);
      if (functionMatches) {
        functionMatches.forEach((match, index) => {
          functions.push({
            name: match.split(/\s+/)[1] || `function_${index}`,
            parameters: [],
            returnType: 'unknown',
            line: 0
          });
        });
      }
    }
    
    return functions;
  }

  private extractClasses(content: string, language: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    
    if (language === 'typescript' || language === 'javascript') {
      const classMatches = content.match(/class\s+(\w+)/g);
      if (classMatches) {
        classMatches.forEach(match => {
          const className = match.split(/\s+/)[1];
          classes.push({
            name: className,
            implements: [],
            methods: [],
            properties: [],
            line: 0
          });
        });
      }
    }
    
    return classes;
  }

  private extractInterfaces(content: string, language: string): InterfaceInfo[] {
    const interfaces: InterfaceInfo[] = [];
    
    if (language === 'typescript') {
      const interfaceMatches = content.match(/interface\s+(\w+)/g);
      if (interfaceMatches) {
        interfaceMatches.forEach(match => {
          const interfaceName = match.split(/\s+/)[1];
          interfaces.push({
            name: interfaceName,
            extends: [],
            properties: [],
            methods: [],
            line: 0
          });
        });
      }
    }
    
    return interfaces;
  }

  private extractTypes(content: string, language: string): TypeInfo[] {
    const types: TypeInfo[] = [];
    
    if (language === 'typescript') {
      const typeMatches = content.match(/type\s+(\w+)\s*=/g);
      if (typeMatches) {
        typeMatches.forEach(match => {
          const typeName = match.split(/\s+/)[1];
          types.push({
            name: typeName,
            definition: 'unknown',
            line: 0
          });
        });
      }
    }
    
    return types;
  }

  /**
   * Parse findings from AI response
   */
  private parseFindings(findingsData: any[]): Finding[] {
    return findingsData.map(finding => ({
      type: finding.type || 'info',
      category: finding.category || 'general',
      severity: finding.severity || 'medium',
      message: finding.message || 'No message',
      location: {
        file: finding.location?.file || '',
        line: finding.location?.line || 0,
        column: finding.location?.column
      },
      description: finding.description || finding.message || 'No description',
      examples: finding.examples || []
    }));
  }

  /**
   * Parse recommendations from AI response
   */
  private parseRecommendations(recommendationsData: any[]): Recommendation[] {
    return recommendationsData.map(rec => ({
      type: rec.type || 'improvement',
      priority: rec.priority || 'medium',
      title: rec.title || 'Recommendation',
      description: rec.description || 'No description',
      implementation: rec.implementation || 'No implementation details',
      estimated_effort: rec.estimated_effort || 'medium',
      benefits: rec.benefits || []
    }));
  }

  /**
   * Calculate basic code metrics
   */
  private calculateMetrics(context: CodeContext[]): CodeMetrics {
    let totalLines = 0;
    let totalComplexity = 0;
    
    context.forEach(ctx => {
      totalLines += ctx.content.split('\n').length;
      totalComplexity += this.calculateCyclomaticComplexity(ctx.content);
    });

    return {
      lines_of_code: totalLines,
      cyclomatic_complexity: totalComplexity,
      maintainability_index: Math.max(0, 171 - 5.2 * Math.log(totalLines) - 0.23 * totalComplexity),
      technical_debt: totalComplexity > 50 ? totalComplexity * 0.1 : 0
    };
  }

  /**
   * Calculate cyclomatic complexity (simplified)
   */
  private calculateCyclomaticComplexity(content: string): number {
    let complexity = 1; // Base complexity
    
    // Count decision points
    const decisionPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /do\s*{/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g // Ternary operator
    ];

    decisionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  /**
   * Fallback analysis when AI analysis fails
   */
  private fallbackAnalysis(request: AnalysisRequest, context: CodeContext[]): AnalysisResult {
    const findings: Finding[] = [];
    const recommendations: Recommendation[] = [];

    // Basic static analysis
    context.forEach(ctx => {
      // Check for long functions
      ctx.functions.forEach(func => {
        if (func.name.length > 200) { // Assuming function length check
          findings.push({
            type: 'warning',
            category: 'maintainability',
            severity: 'medium',
            message: `Function ${func.name} is too long`,
            location: { file: ctx.file, line: func.line },
            description: 'Long functions are harder to understand and maintain'
          });
        }
      });

      // Check for missing documentation
      if (ctx.functions.length > 0 && ctx.functions.filter(f => f.documentation).length === 0) {
        recommendations.push({
          type: 'documentation',
          priority: 'medium',
          title: 'Add function documentation',
          description: 'Functions lack proper documentation',
          implementation: 'Add JSDoc comments to all functions',
          estimated_effort: 'small',
          benefits: ['Improved code understanding', 'Better maintenance']
        });
      }
    });

    return {
      summary: 'Basic static analysis completed',
      findings,
      recommendations,
      metrics: this.calculateMetrics(context),
      context,
      confidence: 0.6
    };
  }
}
