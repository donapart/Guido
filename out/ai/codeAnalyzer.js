"use strict";
/**
 * Context-Aware Code Analyzer for comprehensive code analysis
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
exports.ContextAwareCodeAnalyzer = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ContextAwareCodeAnalyzer {
    router;
    providers;
    constructor(router, providers) {
        this.router = router;
        this.providers = providers;
    }
    async analyzeCode(request) {
        let codeContent;
        let context = {};
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
            const result = await routingResult.provider.chatComplete(routingResult.modelName, [{ role: 'user', content: analysisPrompt }], {
                maxTokens: request.depth === 'deep' ? 3000 : 2000,
                temperature: 0.2 // Low temperature for consistent analysis
            });
            return this.parseAnalysisResult(result.content, request, context);
        }
        catch (error) {
            throw new Error(`Code analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async reviewPullRequest(prUrl) {
        // This would integrate with GitHub/GitLab APIs
        // For now, return a placeholder
        return {
            summary: 'Pull Request review functionality will be implemented in a future version',
            approval: 'comment',
            findings: [],
            recommendations: ['Implement PR review integration with GitHub/GitLab APIs']
        };
    }
    async readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        }
        catch (error) {
            throw new Error(`Could not read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async readDirectory(dirPath) {
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
        }
        catch (error) {
            throw new Error(`Could not read directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async readProject(projectPath) {
        // Simplified project reading - would need more sophisticated logic
        return this.readDirectory(projectPath);
    }
    async getFileContext(filePath) {
        const ext = path.extname(filePath);
        const language = this.getLanguageFromExtension(ext);
        return {
            file_path: filePath,
            language,
            file_size: fs.statSync(filePath).size,
            last_modified: fs.statSync(filePath).mtime
        };
    }
    async getCurrentFileContext() {
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
    async getDirectoryContext(dirPath) {
        const files = fs.readdirSync(dirPath);
        const codeFiles = files.filter(f => this.isCodeFile(f));
        return {
            directory: dirPath,
            total_files: files.length,
            code_files: codeFiles.length,
            file_types: [...new Set(codeFiles.map(f => path.extname(f)))]
        };
    }
    async getProjectContext(projectPath) {
        // Look for package.json, tsconfig.json, etc.
        const configFiles = ['package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.js'];
        const foundConfigs = [];
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
    buildAnalysisPrompt(request, code, context) {
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
    parseAnalysisResult(response, request, context) {
        // Simplified parsing - in a real implementation, this would be more sophisticated
        const lines = response.split('\n');
        const result = {
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
        let currentFinding = {};
        let currentRecommendation = {};
        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('summary')) {
                currentSection = 'summary';
                continue;
            }
            else if (lowerLine.includes('finding')) {
                currentSection = 'findings';
                continue;
            }
            else if (lowerLine.includes('recommendation')) {
                currentSection = 'recommendations';
                continue;
            }
            else if (lowerLine.includes('metric')) {
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
    isCodeFile(filename) {
        const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt'];
        return codeExtensions.some(ext => filename.endsWith(ext));
    }
    getLanguageFromExtension(ext) {
        const languageMap = {
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
    inferProjectType(configFiles) {
        if (configFiles.includes('package.json')) {
            return 'node_project';
        }
        else if (configFiles.includes('tsconfig.json')) {
            return 'typescript_project';
        }
        else if (configFiles.includes('webpack.config.js') || configFiles.includes('vite.config.js')) {
            return 'web_frontend';
        }
        return 'unknown';
    }
    estimateLineCount(target) {
        try {
            if (fs.existsSync(target)) {
                const content = fs.readFileSync(target, 'utf-8');
                return content.split('\n').length;
            }
        }
        catch (error) {
            // Ignore errors
        }
        return 0;
    }
}
exports.ContextAwareCodeAnalyzer = ContextAwareCodeAnalyzer;
//# sourceMappingURL=codeAnalyzer.js.map