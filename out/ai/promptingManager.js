"use strict";
/**
 * Advanced Prompting Manager for optimizing and enhancing AI prompts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedPromptingManager = void 0;
class AdvancedPromptingManager {
    router;
    providers;
    templates = new Map();
    constructor(router, providers) {
        this.router = router;
        this.providers = providers;
        this.initializeTemplates();
    }
    async optimizePrompt(request) {
        const optimizationPrompt = this.buildOptimizationPrompt(request);
        try {
            const routingResult = await this.router.route({
                prompt: optimizationPrompt,
                lang: 'de',
                mode: 'quality'
            });
            const result = await routingResult.provider.chatComplete(routingResult.modelName, [{ role: 'user', content: optimizationPrompt }], {
                maxTokens: 1500,
                temperature: 0.3
            });
            return this.parseOptimizationResult(result.content, request);
        }
        catch (error) {
            throw new Error(`Prompt optimization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async generatePrompt(template, variables) {
        let prompt = template;
        for (const [key, value] of Object.entries(variables)) {
            prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
        }
        return prompt;
    }
    async analyzePrompt(prompt) {
        const analysisPrompt = `Analyze this AI prompt for quality and effectiveness:

PROMPT TO ANALYZE:
"${prompt}"

Please evaluate on a scale of 1-10:
1. Clarity - How clear and unambiguous is the prompt?
2. Specificity - How specific and detailed are the instructions?
3. Completeness - Does it include all necessary information?
4. Structure - How well organized and structured is the prompt?

Also provide 3-5 specific suggestions for improvement.

Format your response with scores and bullet-pointed suggestions.`;
        try {
            const routingResult = await this.router.route({
                prompt: analysisPrompt,
                lang: 'de',
                mode: 'quality'
            });
            const result = await routingResult.provider.chatComplete(routingResult.modelName, [{ role: 'user', content: analysisPrompt }], {
                maxTokens: 1000,
                temperature: 0.2
            });
            return this.parseAnalysisResult(result.content);
        }
        catch (error) {
            return {
                clarity: 5,
                specificity: 5,
                completeness: 5,
                structure: 5,
                suggestions: [`Analysis failed: ${error instanceof Error ? error.message : String(error)}`]
            };
        }
    }
    getTemplate(templateId) {
        return this.templates.get(templateId);
    }
    getAllTemplates() {
        return Array.from(this.templates.values());
    }
    getTemplatesByCategory(category) {
        return Array.from(this.templates.values()).filter(t => t.category === category);
    }
    buildOptimizationPrompt(request) {
        return `You are an expert prompt engineer. Optimize the following AI prompt to make it more effective.

ORIGINAL PROMPT:
"${request.original_prompt}"

OBJECTIVE:
${request.objective}

TARGET AUDIENCE: ${request.target_audience || 'general'}
DOMAIN: ${request.domain || 'general'}
CONSTRAINTS: ${request.constraints?.join(', ') || 'none'}

Please provide:
1. An optimized version of the prompt
2. List of specific improvements made
3. The optimization strategy used
4. Confidence level (0-1) in the optimization
5. Expected quality improvement (0-1)
6. Detailed reasoning for the changes
7. Alternative approaches (optional)

Focus on:
- Clarity and specificity
- Proper instruction structure
- Context setting
- Output format specification
- Edge case handling

Provide your response in a structured format.`;
    }
    parseOptimizationResult(response, request) {
        // Simplified parsing - in a real implementation, this would be more sophisticated
        const lines = response.split('\n');
        let optimizedPrompt = request.original_prompt; // fallback
        let improvements = [];
        let strategy = 'general_optimization';
        let confidence = 0.7;
        let expectedQualityGain = 0.2;
        let reasoning = 'Automated optimization applied';
        let currentSection = '';
        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('optimized') && lowerLine.includes('prompt')) {
                currentSection = 'optimized';
                continue;
            }
            else if (lowerLine.includes('improvement')) {
                currentSection = 'improvements';
                continue;
            }
            else if (lowerLine.includes('strategy')) {
                currentSection = 'strategy';
                continue;
            }
            else if (lowerLine.includes('confidence')) {
                currentSection = 'confidence';
                continue;
            }
            else if (lowerLine.includes('reasoning')) {
                currentSection = 'reasoning';
                continue;
            }
            if (line.trim()) {
                switch (currentSection) {
                    case 'optimized':
                        if (!line.startsWith('#') && line.length > 10) {
                            optimizedPrompt = line.trim().replace(/^["']|["']$/g, '');
                        }
                        break;
                    case 'improvements':
                        if (line.startsWith('-') || line.startsWith('•')) {
                            improvements.push(line.substring(1).trim());
                        }
                        break;
                    case 'strategy':
                        if (line.length > 5) {
                            strategy = line.trim();
                        }
                        break;
                    case 'confidence':
                        const confMatch = line.match(/[\d.]+/);
                        if (confMatch) {
                            confidence = parseFloat(confMatch[0]);
                            if (confidence > 1)
                                confidence = confidence / 100;
                        }
                        break;
                    case 'reasoning':
                        if (line.length > 10) {
                            reasoning = line.trim();
                        }
                        break;
                }
            }
        }
        return {
            optimized_prompt: optimizedPrompt,
            improvements,
            strategy_used: strategy,
            confidence,
            expected_quality_gain: expectedQualityGain,
            reasoning
        };
    }
    parseAnalysisResult(response) {
        const lines = response.split('\n');
        const result = {
            clarity: 5,
            specificity: 5,
            completeness: 5,
            structure: 5,
            suggestions: []
        };
        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            // Look for scores
            const clarityMatch = lowerLine.match(/clarity.*?(\d+)/);
            if (clarityMatch)
                result.clarity = parseInt(clarityMatch[1]);
            const specificityMatch = lowerLine.match(/specificity.*?(\d+)/);
            if (specificityMatch)
                result.specificity = parseInt(specificityMatch[1]);
            const completenessMatch = lowerLine.match(/completeness.*?(\d+)/);
            if (completenessMatch)
                result.completeness = parseInt(completenessMatch[1]);
            const structureMatch = lowerLine.match(/structure.*?(\d+)/);
            if (structureMatch)
                result.structure = parseInt(structureMatch[1]);
            // Look for suggestions
            if (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)) {
                result.suggestions.push(line.replace(/^[-•\d.]\s*/, '').trim());
            }
        }
        return result;
    }
    initializeTemplates() {
        const templates = [
            {
                id: 'code_review',
                name: 'Code Review',
                description: 'Template for comprehensive code review',
                template: `Review the following {language} code for:
1. Code quality and best practices
2. Security vulnerabilities
3. Performance optimizations
4. Maintainability issues

Code to review:
{code}

Please provide specific feedback with line references and suggestions.`,
                variables: ['language', 'code'],
                category: 'development',
                useCase: 'Code review and analysis'
            },
            {
                id: 'bug_analysis',
                name: 'Bug Analysis',
                description: 'Template for analyzing and debugging code issues',
                template: `Analyze this {language} code issue:

Problem Description: {problem}
Error Messages: {errors}
Expected Behavior: {expected}
Actual Behavior: {actual}

Code:
{code}

Please provide:
1. Root cause analysis
2. Step-by-step debugging approach
3. Suggested fixes with code examples
4. Prevention strategies`,
                variables: ['language', 'problem', 'errors', 'expected', 'actual', 'code'],
                category: 'debugging',
                useCase: 'Bug fixing and problem solving'
            },
            {
                id: 'documentation',
                name: 'Documentation Generator',
                description: 'Template for generating comprehensive documentation',
                template: `Generate comprehensive documentation for this {type}:

{content}

Include:
1. Overview and purpose
2. Parameters/arguments
3. Return values
4. Usage examples
5. Edge cases and error handling
6. Related functions/components

Format: {format}`,
                variables: ['type', 'content', 'format'],
                category: 'documentation',
                useCase: 'Generating code documentation'
            },
            {
                id: 'optimization',
                name: 'Performance Optimization',
                description: 'Template for code performance analysis and optimization',
                template: `Optimize this {language} code for performance:

Current Code:
{code}

Context: {context}
Performance Requirements: {requirements}
Constraints: {constraints}

Provide:
1. Performance analysis of current code
2. Optimized version with explanations
3. Benchmark comparisons
4. Trade-offs and considerations`,
                variables: ['language', 'code', 'context', 'requirements', 'constraints'],
                category: 'optimization',
                useCase: 'Performance tuning and optimization'
            }
        ];
        for (const template of templates) {
            this.templates.set(template.id, template);
        }
    }
}
exports.AdvancedPromptingManager = AdvancedPromptingManager;
//# sourceMappingURL=promptingManager.js.map