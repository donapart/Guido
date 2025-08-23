/**
 * Context-Aware Code Analyzer for comprehensive code analysis
 */

import { ModelRouter } from '../router';
import { Provider } from '../providers/base';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface CodeAnalysisRequest {
  type: 'single_file' | 'directory' | 'project' | 'selection';
  target: string; // file path, directory path, or code snippet
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

export class ContextAwareCodeAnalyzer {
  private router: ModelRouter;
  private providers: Map<string, Provider>;

  constructor(router: ModelRouter, providers: Map<string, Provider>) {
    this.router = router;
    this.providers = providers;
  }

  async analyzeCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResult> {
    let codeContent: string;
    let context: any = {};

    // Get code content based on request type
    switch (request.type) {
      case 'single_file':
        codeContent = await this.readFile(request.target);
        context = await this.getFileContext(request.target);
        break;
      case 'selection':
        codeContent = request.target; // target is the code snippet
        context = await this.getCurrentFileContext();
        break;
      case 'directory':
        codeContent = await this.readDirectory(request.target);
        context = await this.getDirectoryContext(request.target);
        break;
      case 'project':
        codeContent = await this.readProject(request.target);
        context = await this.getProjectContext(request.target);
        break;
      default:
        throw new Error(`Unknown analysis type: ${request.type}`);
    }

    const analysisPrompt = this.buildAnalysisPrompt(request, codeContent, context);
    
    try {
      const routingResult = await this.router.route({
        prompt: analysisPrompt,
        lang: 'de',
        mode: request.depth === 'deep' ? 'quality' : 'balanced'
      });

      const result = await routingResult.provider.chatComplete(
        routingResult.modelName,
        [{ role: 'user', content: analysisPrompt }],
        { 
          maxTokens: request.depth === 'deep' ? 3000 : 2000,
          temperature: 0.2 // Low temperature for consistent analysis
        }
      );

      return this.parseAnalysisResult(result.content, request, context);
    } catch (error) {
      throw new Error(`Code analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async reviewPullRequest(prUrl: string): Promise<{
    summary: string;
    approval: 'approve' | 'request_changes' | 'comment';
    findings: CodeFinding[];
    recommendations: string[];
  }> {
    // This would integrate with GitHub/GitLab APIs
    // For now, return a placeholder
    return {
      summary: 'Pull Request review functionality will be implemented in a future version',
      approval: 'comment',
      findings: [],
      recommendations: ['Implement PR review integration with GitHub/GitLab APIs']
    };
  }

  private async readFile(filePath: string): Promise<string> {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Could not read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async readDirectory(dirPath: string): Promise<string> {
    // Read all code files in directory (simplified implementation)
    try {
      const files = fs.readdirSync(dirPath);
      let content = '';
      
      for (const file of files) {
        if (this.isCodeFile(file)) {
          const fullPath = path.join(dirPath, file);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');
          content += `\n\n--- File: ${file} ---\n${fileContent}`;
        }
      }
      
      return content;
    } catch (error) {
      throw new Error(`Could not read directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async readProject(projectPath: string): Promise<string> {
    // Simplified project reading - would need more sophisticated logic
    return this.readDirectory(projectPath);
  }

  private async getFileContext(filePath: string): Promise<any> {
    const ext = path.extname(filePath);
    const language = this.getLanguageFromExtension(ext);
    
    return {
      file_path: filePath,
      language,
      file_size: fs.statSync(filePath).size,
      last_modified: fs.statSync(filePath).mtime
    };
  }

  private async getCurrentFileContext(): Promise<any> {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return { language: 'unknown' };
    }
    
    return {
      file_path: activeEditor.document.fileName,
      language: activeEditor.document.languageId,
      line_count: activeEditor.document.lineCount
    };
  }

  private async getDirectoryContext(dirPath: string): Promise<any> {
    const files = fs.readdirSync(dirPath);
    const codeFiles = files.filter(f => this.isCodeFile(f));
    
    return {
      directory: dirPath,
      total_files: files.length,
      code_files: codeFiles.length,
      file_types: [...new Set(codeFiles.map(f => path.extname(f)))]
    };
  }

  private async getProjectContext(projectPath: string): Promise<any> {
    // Look for package.json, tsconfig.json, etc.
    const configFiles = ['package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.js'];
    const foundConfigs: string[] = [];
    
    for (const config of configFiles) {
      const configPath = path.join(projectPath, config);
      if (fs.existsSync(configPath)) {
        foundConfigs.push(config);
      }
    }
    
    return {
      project_path: projectPath,
      config_files: foundConfigs,
      project_type: this.inferProjectType(foundConfigs)
    };
  }

  private buildAnalysisPrompt(request: CodeAnalysisRequest, code: string, context: any): string {
    const focusInstructions = {
      quality: 'Focus on code quality, maintainability, readability, and adherence to best practices.',
      security: 'Focus on security vulnerabilities, potential exploits, and secure coding practices.',
      performance: 'Focus on performance bottlenecks, optimization opportunities, and efficiency.',
      architecture: 'Focus on software architecture, design patterns, and structural improvements.',
      documentation: 'Focus on code documentation, comments, and self-documenting code practices.',
      testing: 'Focus on test coverage, test quality, and testability of the code.'
    };

    const depthInstructions = {
      shallow: 'Provide a quick overview with major issues only.',
      medium: 'Provide a balanced analysis with moderate detail.',
      deep: 'Provide a comprehensive, detailed analysis with in-depth explanations.'
    };

    return `You are an expert code reviewer and software architect. Analyze the following code.

ANALYSIS FOCUS: ${focusInstructions[request.focus]}
ANALYSIS DEPTH: ${depthInstructions[request.depth]}

CONTEXT:
${JSON.stringify(context, null, 2)}

CODE TO ANALYZE:
${code}

Please provide a structured analysis with:

1. SUMMARY: Overall assessment and key insights
2. FINDINGS: Specific issues found with severity levels (critical, high, medium, low)
3. RECOMMENDATIONS: Actionable improvement suggestions with priority and effort estimates
4. METRICS: Code metrics and quality indicators
5. PATTERNS: Detected patterns and architectural insights

For each finding, include:
- Severity level
- Category
- Description
- Location (line numbers if applicable)
- Suggested fix

For each recommendation, include:
- Type and priority
- Description and benefits
- Implementation approach
- Estimated effort

Be specific and actionable in your feedback.`;
  }

  private parseAnalysisResult(response: string, request: CodeAnalysisRequest, context: any): CodeAnalysisResult {
    // Simplified parsing - in a real implementation, this would be more sophisticated
    const lines = response.split('\n');
    
    const result: CodeAnalysisResult = {
      summary: 'Code analysis completed',
      confidence: 0.8,
      findings: [],
      recommendations: [],
      metrics: {
        lines_of_code: this.estimateLineCount(request.target),
        cyclomatic_complexity: 5, // placeholder
        maintainability_index: 70, // placeholder
        technical_debt: 2.5 // placeholder
      },
      context: {
        language: request.language || context.language || 'unknown',
        patterns_detected: []
      }
    };
    
    let currentSection = '';
    let currentFinding: Partial<CodeFinding> = {};
    let currentRecommendation: Partial<CodeRecommendation> = {};
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('summary')) {
        currentSection = 'summary';
        continue;
      } else if (lowerLine.includes('finding')) {
        currentSection = 'findings';
        continue;
      } else if (lowerLine.includes('recommendation')) {
        currentSection = 'recommendations';
        continue;
      } else if (lowerLine.includes('metric')) {
        currentSection = 'metrics';
        continue;
      }
      
      if (line.trim()) {
        switch (currentSection) {
          case 'summary':
            if (line.length > 10 && !line.startsWith('#')) {
              result.summary = line.trim();
            }
            break;
          case 'findings':
            if (line.startsWith('-') || line.startsWith('•')) {
              if (currentFinding.message) {
                result.findings.push({
                  severity: currentFinding.severity || 'medium',
                  category: currentFinding.category || 'general',
                  message: currentFinding.message || 'Issue found',
                  description: currentFinding.description || 'No description',
                  location: currentFinding.location || {
                    file: request.target,
                    line: 1
                  }
                });
              }
              currentFinding = {
                message: line.substring(1).trim(),
                severity: 'medium',
                category: 'general'
              };
            }
            break;
          case 'recommendations':
            if (line.startsWith('-') || line.startsWith('•')) {
              if (currentRecommendation.title) {
                result.recommendations.push({
                  type: currentRecommendation.type || 'best_practice',
                  priority: currentRecommendation.priority || 'medium',
                  title: currentRecommendation.title || 'Improvement',
                  description: currentRecommendation.description || 'No description',
                  implementation: currentRecommendation.implementation || 'No implementation details',
                  benefits: currentRecommendation.benefits || ['Improved code quality'],
                  estimated_effort: currentRecommendation.estimated_effort || 'medium',
                  impact: currentRecommendation.impact || 'medium'
                });
              }
              currentRecommendation = {
                title: line.substring(1).trim(),
                type: 'best_practice',
                priority: 'medium'
              };
            }
            break;
        }
      }
    }
    
    // Add the last finding/recommendation
    if (currentFinding.message) {
      result.findings.push({
        severity: currentFinding.severity || 'medium',
        category: currentFinding.category || 'general',
        message: currentFinding.message || 'Issue found',
        description: currentFinding.description || 'No description',
        location: currentFinding.location || {
          file: request.target,
          line: 1
        }
      });
    }
    
    if (currentRecommendation.title) {
      result.recommendations.push({
        type: currentRecommendation.type || 'best_practice',
        priority: currentRecommendation.priority || 'medium',
        title: currentRecommendation.title || 'Improvement',
        description: currentRecommendation.description || 'No description',
        implementation: currentRecommendation.implementation || 'No implementation details',
        benefits: currentRecommendation.benefits || ['Improved code quality'],
        estimated_effort: currentRecommendation.estimated_effort || 'medium',
        impact: currentRecommendation.impact || 'medium'
      });
    }
    
    return result;
  }

  private isCodeFile(filename: string): boolean {
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt'];
    return codeExtensions.some(ext => filename.endsWith(ext));
  }

  private getLanguageFromExtension(ext: string): string {
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin'
    };

    return languageMap[ext] || 'unknown';
  }

  private inferProjectType(configFiles: string[]): string {
    if (configFiles.includes('package.json')) {
      return 'node_project';
    } else if (configFiles.includes('tsconfig.json')) {
      return 'typescript_project';
    } else if (configFiles.includes('webpack.config.js') || configFiles.includes('vite.config.js')) {
      return 'web_frontend';
    }
    return 'unknown';
  }

  private estimateLineCount(target: string): number {
    try {
      if (fs.existsSync(target)) {
        const content = fs.readFileSync(target, 'utf-8');
        return content.split('\n').length;
      }
    } catch (error) {
      // Ignore errors
    }
    return 0;
  }
}