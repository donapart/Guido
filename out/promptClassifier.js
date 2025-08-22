"use strict";
/**
 * Prompt Classifier for Model Router
 * Analyzes prompts to determine optimal model characteristics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptClassifier = void 0;
class PromptClassifier {
    cache = new Map();
    config;
    localProvider;
    constructor(config, localProvider) {
        this.config = config;
        this.localProvider = localProvider;
    }
    /**
     * Classify a prompt to determine its characteristics
     */
    async classify(prompt, context) {
        if (!this.config.enabled) {
            return this.heuristicClassification(prompt, context);
        }
        // Check cache first
        const cacheKey = this.getCacheKey(prompt, context);
        if (this.config.cacheResults && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        let result;
        try {
            if (this.config.useLocalModel && this.localProvider) {
                result = await this.llmClassification(prompt, context);
            }
            else {
                result = this.heuristicClassification(prompt, context);
            }
        }
        catch (error) {
            console.warn("Classification failed, using heuristic fallback:", error);
            result = this.heuristicClassification(prompt, context);
        }
        // Cache the result
        if (this.config.cacheResults) {
            this.cache.set(cacheKey, result);
        }
        return result;
    }
    /**
     * Heuristic-based classification using pattern matching
     */
    heuristicClassification(prompt, context) {
        const lower = prompt.toLowerCase();
        const reasoning = [];
        const characteristics = {
            complexity: "medium",
            creativity: "low",
            technical: "medium",
            contextSize: "medium",
        };
        let suggestedCapabilities = [];
        let classification = "general";
        let confidence = 0.5;
        // File context analysis
        if (context?.filePath) {
            const fileName = context.filePath.toLowerCase();
            if (fileName.includes("test") || fileName.includes("spec")) {
                classification = "tests";
                confidence = 0.8;
                reasoning.push("File path suggests test file");
                suggestedCapabilities.push("tools");
            }
            if (fileName.includes("readme") || fileName.includes("doc")) {
                classification = "docs";
                confidence = 0.8;
                reasoning.push("File path suggests documentation");
                characteristics.creativity = "medium";
            }
        }
        // Language context
        if (context?.language) {
            characteristics.technical = "high";
            suggestedCapabilities.push("coder");
            reasoning.push(`Code context detected: ${context.language}`);
        }
        // File size analysis
        if (context?.fileSize) {
            if (context.fileSize > 100) {
                characteristics.contextSize = "large";
                suggestedCapabilities.push("long");
                reasoning.push("Large context detected");
            }
            else if (context.fileSize < 10) {
                characteristics.contextSize = "small";
            }
        }
        // Keyword-based classification
        const patterns = {
            boilerplate: [
                "boilerplate", "template", "scaffold", "generate", "create",
                "skeleton", "starter", "basic", "simple"
            ],
            tests: [
                "test", "unit test", "integration test", "spec", "assert",
                "mock", "stub", "jest", "pytest", "junit"
            ],
            bug: [
                "bug", "error", "fix", "debug", "issue", "problem",
                "crash", "exception", "stack trace", "segfault"
            ],
            refactor: [
                "refactor", "restructure", "reorganize", "clean up",
                "optimize structure", "improve code", "modernize"
            ],
            docs: [
                "document", "comment", "explain", "readme", "guide",
                "tutorial", "documentation", "javadoc", "docstring"
            ],
            optimization: [
                "optimize", "performance", "speed up", "efficient",
                "faster", "memory", "cpu", "benchmark"
            ],
            architecture: [
                "architecture", "design", "system", "pattern",
                "microservice", "api design", "database schema"
            ],
            creative: [
                "creative", "brainstorm", "idea", "innovative",
                "artistic", "story", "poem", "design"
            ],
            analysis: [
                "analyze", "review", "examine", "evaluate",
                "assess", "code review", "quality"
            ],
            reasoning: [
                "prove", "logic", "algorithm", "mathematical",
                "complex", "reasoning", "step by step", "solve"
            ]
        };
        let bestMatch = { class: "general", score: 0 };
        for (const [className, keywords] of Object.entries(patterns)) {
            const matches = keywords.filter(keyword => lower.includes(keyword));
            const score = matches.length;
            if (score > bestMatch.score) {
                bestMatch = { class: className, score };
                confidence = Math.min(0.9, 0.5 + score * 0.1);
                reasoning.push(`Matched ${score} keywords for ${className}: ${matches.join(", ")}`);
            }
        }
        if (bestMatch.score > 0) {
            classification = bestMatch.class;
        }
        // Adjust characteristics based on classification
        this.adjustCharacteristics(classification, characteristics, suggestedCapabilities);
        // Length-based adjustments
        if (prompt.length > 5000) {
            characteristics.contextSize = "large";
            characteristics.complexity = "high";
            suggestedCapabilities.push("long");
            reasoning.push("Long prompt detected");
        }
        else if (prompt.length < 100) {
            characteristics.complexity = "low";
            characteristics.contextSize = "small";
        }
        return {
            class: classification,
            confidence,
            reasoning,
            characteristics,
            suggestedCapabilities: Array.from(new Set(suggestedCapabilities)),
        };
    }
    /**
     * LLM-based classification using a local model
     */
    async llmClassification(prompt, context) {
        if (!this.localProvider || !this.config.localModelName) {
            throw new Error("Local LLM provider not configured");
        }
        const classificationPrompt = this.buildClassificationPrompt(prompt, context);
        try {
            const result = await this.localProvider.chatComplete(this.config.localModelName, [{ role: "user", content: classificationPrompt }], { maxTokens: 200, temperature: 0.1, json: true });
            const parsed = JSON.parse(result.content);
            return {
                class: parsed.class || "general",
                confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
                reasoning: parsed.reasoning || ["LLM classification"],
                characteristics: {
                    complexity: parsed.characteristics?.complexity || "medium",
                    creativity: parsed.characteristics?.creativity || "low",
                    technical: parsed.characteristics?.technical || "medium",
                    contextSize: parsed.characteristics?.contextSize || "medium",
                },
                suggestedCapabilities: parsed.suggestedCapabilities || [],
            };
        }
        catch (error) {
            console.warn("LLM classification failed:", error);
            if (this.config.fallbackToHeuristic) {
                return this.heuristicClassification(prompt, context);
            }
            throw error;
        }
    }
    /**
     * Build prompt for LLM-based classification
     */
    buildClassificationPrompt(prompt, context) {
        const contextInfo = context ? `
Context:
- File: ${context.filePath || "unknown"}
- Language: ${context.language || "unknown"}
- Size: ${context.fileSize || "unknown"} KB
` : "";
        return `Analyze this user prompt and classify it according to the given categories.

${contextInfo}
User Prompt:
"""
${prompt.slice(0, 2000)}${prompt.length > 2000 ? "..." : ""}
"""

Classify this prompt and respond with JSON in this exact format:
{
  "class": "one of: boilerplate, tests, bug, refactor, docs, optimization, architecture, creative, analysis, reasoning, conversation, general",
  "confidence": 0.8,
  "reasoning": ["explanation of classification"],
  "characteristics": {
    "complexity": "low/medium/high",
    "creativity": "low/medium/high", 
    "technical": "low/medium/high",
    "contextSize": "small/medium/large"
  },
  "suggestedCapabilities": ["array of: tools, json, long, cheap, local, coder, reasoning, vision"]
}`;
    }
    /**
     * Adjust characteristics based on classification
     */
    adjustCharacteristics(classification, characteristics, capabilities) {
        switch (classification) {
            case "boilerplate":
                characteristics.complexity = "low";
                characteristics.creativity = "low";
                characteristics.technical = "medium";
                capabilities.push("cheap", "tools");
                break;
            case "tests":
                characteristics.complexity = "medium";
                characteristics.creativity = "low";
                characteristics.technical = "high";
                capabilities.push("tools", "coder");
                break;
            case "bug":
                characteristics.complexity = "high";
                characteristics.creativity = "low";
                characteristics.technical = "high";
                capabilities.push("reasoning", "tools");
                break;
            case "refactor":
                characteristics.complexity = "high";
                characteristics.creativity = "medium";
                characteristics.technical = "high";
                capabilities.push("long", "tools", "coder");
                break;
            case "docs":
                characteristics.complexity = "low";
                characteristics.creativity = "high";
                characteristics.technical = "medium";
                break;
            case "optimization":
                characteristics.complexity = "high";
                characteristics.creativity = "medium";
                characteristics.technical = "high";
                capabilities.push("reasoning", "tools");
                break;
            case "architecture":
                characteristics.complexity = "high";
                characteristics.creativity = "high";
                characteristics.technical = "high";
                capabilities.push("long", "reasoning");
                break;
            case "creative":
                characteristics.complexity = "medium";
                characteristics.creativity = "high";
                characteristics.technical = "low";
                break;
            case "analysis":
                characteristics.complexity = "high";
                characteristics.creativity = "medium";
                characteristics.technical = "high";
                capabilities.push("reasoning", "long");
                break;
            case "reasoning":
                characteristics.complexity = "high";
                characteristics.creativity = "medium";
                characteristics.technical = "medium";
                capabilities.push("reasoning");
                break;
            case "conversation":
                characteristics.complexity = "low";
                characteristics.creativity = "medium";
                characteristics.technical = "low";
                capabilities.push("cheap");
                break;
        }
    }
    /**
     * Generate cache key for a prompt and context
     */
    getCacheKey(prompt, context) {
        const promptHash = this.simpleHash(prompt);
        const contextStr = context ? JSON.stringify(context) : "";
        return `${promptHash}-${this.simpleHash(contextStr)}`;
    }
    /**
     * Simple hash function for caching
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    /**
     * Clear classification cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            // TODO: Track hit rate
        };
    }
    /**
     * Get suggested models based on classification
     */
    getSuggestedModelsForClass(classification, availableModels) {
        const suggestions = [];
        for (const model of availableModels) {
            let score = 0;
            const reasons = [];
            const caps = model.caps || [];
            const price = model.price;
            // Score based on classification requirements
            switch (classification) {
                case "boilerplate":
                case "conversation":
                    if (caps.includes("cheap")) {
                        score += 3;
                        reasons.push("cheap model preferred");
                    }
                    if (caps.includes("tools")) {
                        score += 1;
                        reasons.push("tools capability");
                    }
                    break;
                case "reasoning":
                case "optimization":
                case "architecture":
                    if (caps.includes("reasoning")) {
                        score += 4;
                        reasons.push("reasoning capability");
                    }
                    if (caps.includes("long")) {
                        score += 2;
                        reasons.push("long context");
                    }
                    break;
                case "tests":
                case "bug":
                case "refactor":
                    if (caps.includes("coder")) {
                        score += 3;
                        reasons.push("coding specialist");
                    }
                    if (caps.includes("tools")) {
                        score += 2;
                        reasons.push("tools capability");
                    }
                    break;
                case "creative":
                case "docs":
                    // Prefer models without "cheap" capability for creative work
                    if (!caps.includes("cheap")) {
                        score += 2;
                        reasons.push("quality model");
                    }
                    break;
            }
            // Apply price considerations
            if (price && classification === "boilerplate") {
                if (price.outputPerMTok < 1.0) {
                    score += 2;
                    reasons.push("cost-effective");
                }
            }
            if (score > 0) {
                suggestions.push({
                    name: model.name,
                    provider: model.provider,
                    score,
                    reason: reasons.join(", "),
                });
            }
        }
        return suggestions.sort((a, b) => b.score - a.score);
    }
}
exports.PromptClassifier = PromptClassifier;
//# sourceMappingURL=promptClassifier.js.map