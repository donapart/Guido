"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiModelManager = void 0;
class MultiModelManager {
    router;
    providers;
    constructor(router, providers) {
        this.router = router;
        this.providers = providers;
    }
    /**
     * Execute a request across multiple models
     */
    async executeMultiModel(request) {
        switch (request.strategy) {
            case 'parallel':
                return await this.executeParallel(request);
            case 'sequential':
                return await this.executeSequential(request);
            case 'consensus':
                const consensusResult = await this.buildConsensus(request);
                return consensusResult.responses;
            case 'comparison':
                return await this.executeComparison(request);
            default:
                throw new Error(`Unknown strategy: ${request.strategy}`);
        }
    }
    /**
     * Execute requests in parallel across all specified models
     */
    async executeParallel(request) {
        const promises = request.models.map(async (modelId) => {
            try {
                const startTime = Date.now();
                // Create routing context for this specific model
                const routingContext = {
                    prompt: request.prompt,
                    mode: 'auto'
                };
                const result = await this.router.route(routingContext);
                const provider = this.providers.get(result.providerId);
                if (!provider) {
                    throw new Error(`Provider ${result.providerId} not found`);
                }
                // Check if provider supports the requested model, otherwise use routed model
                const actualModel = provider.supports(modelId) ? modelId : result.modelName;
                const messages = [
                    { role: 'user', content: request.prompt }
                ];
                const response = await provider.chatComplete(actualModel, messages, {
                    maxTokens: 4000,
                    temperature: 0.7
                });
                const latency = Date.now() - startTime;
                return {
                    modelId: actualModel,
                    providerId: result.providerId,
                    response: response.content,
                    metadata: {
                        tokens: (response.usage?.inputTokens || 0) + (response.usage?.outputTokens || 0),
                        cost: this.calculateCost(response.usage?.inputTokens || 0, response.usage?.outputTokens || 0, result.model),
                        latency,
                        timestamp: new Date()
                    }
                };
            }
            catch (error) {
                console.error(`Error with model ${modelId}:`, error);
                return {
                    modelId,
                    providerId: 'unknown',
                    response: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    metadata: {
                        tokens: 0,
                        cost: 0,
                        latency: 0,
                        timestamp: new Date()
                    }
                };
            }
        });
        return await Promise.all(promises);
    }
    /**
     * Execute requests sequentially, allowing each response to inform the next
     */
    async executeSequential(request) {
        const responses = [];
        let contextPrompt = request.prompt;
        for (const modelId of request.models) {
            try {
                const startTime = Date.now();
                const routingContext = {
                    prompt: contextPrompt,
                    mode: 'auto'
                };
                const result = await this.router.route(routingContext);
                const provider = this.providers.get(result.providerId);
                if (!provider) {
                    throw new Error(`Provider ${result.providerId} not found`);
                }
                const actualModel = provider.supports(modelId) ? modelId : result.modelName;
                const messages = [
                    { role: 'user', content: contextPrompt }
                ];
                const response = await provider.chatComplete(actualModel, messages, {
                    maxTokens: 4000,
                    temperature: 0.7
                });
                const latency = Date.now() - startTime;
                const modelResponse = {
                    modelId: actualModel,
                    providerId: result.providerId,
                    response: response.content,
                    metadata: {
                        tokens: (response.usage?.inputTokens || 0) + (response.usage?.outputTokens || 0),
                        cost: this.calculateCost(response.usage?.inputTokens || 0, response.usage?.outputTokens || 0, result.model),
                        latency,
                        timestamp: new Date()
                    }
                };
                responses.push(modelResponse);
                // Update context for next model
                contextPrompt = `${request.prompt}\n\nPrevious response from ${actualModel}:\n${response.content}\n\nPlease provide your own analysis considering this previous response:`;
            }
            catch (error) {
                console.error(`Error with model ${modelId}:`, error);
                responses.push({
                    modelId,
                    providerId: 'unknown',
                    response: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    metadata: {
                        tokens: 0,
                        cost: 0,
                        latency: 0,
                        timestamp: new Date()
                    }
                });
            }
        }
        return responses;
    }
    /**
     * Build consensus from multiple model responses
     */
    async buildConsensus(request) {
        const responses = await this.executeParallel(request);
        // Analyze responses for consensus
        const consensusPrompt = `
Analyze these responses from different AI models and build a consensus:

${responses.map((r, i) => `Model ${i + 1} (${r.modelId}):\n${r.response}`).join('\n\n')}

Please:
1. Identify common themes and agreements
2. Note any significant disagreements
3. Provide a balanced consensus response
4. Rate your confidence (0-1) in this consensus
5. Explain your reasoning

Format your response as JSON:
{
  "consensus": "your consensus response",
  "confidence": 0.85,
  "agreements": ["point1", "point2"],
  "disagreements": ["point1", "point2"],
  "reasoning": "explanation of consensus building"
}`;
        try {
            const routingContext = {
                prompt: consensusPrompt,
                mode: 'quality'
            };
            const consensusResult = await this.router.route(routingContext);
            const provider = this.providers.get(consensusResult.providerId);
            if (!provider) {
                throw new Error(`Provider ${consensusResult.providerId} not found`);
            }
            const messages = [
                { role: 'user', content: consensusPrompt }
            ];
            const consensusResponse = await provider.chatComplete(consensusResult.modelName, messages, {
                maxTokens: 2000,
                temperature: 0.3
            });
            try {
                const parsed = JSON.parse(consensusResponse.content);
                return {
                    consensusResponse: parsed.consensus,
                    confidence: parsed.confidence || 0.5,
                    agreementLevel: this.calculateAgreementLevel(responses),
                    responses,
                    reasoning: parsed.reasoning || 'Consensus built from multiple model responses'
                };
            }
            catch {
                // Fallback if JSON parsing fails
                return {
                    consensusResponse: consensusResponse.content,
                    confidence: 0.5,
                    agreementLevel: this.calculateAgreementLevel(responses),
                    responses,
                    reasoning: 'Consensus built from multiple model responses'
                };
            }
        }
        catch (error) {
            // Fallback consensus building
            return this.buildSimpleConsensus(responses);
        }
    }
    /**
     * Execute comparison analysis between models
     */
    async executeComparison(request) {
        const responses = await this.executeParallel(request);
        // Add comparison analysis to each response
        for (let i = 0; i < responses.length; i++) {
            const otherResponses = responses.filter((_, idx) => idx !== i);
            const comparisonPrompt = `
Analyze and compare your response with these other responses to the same prompt:

Your response: ${responses[i].response}

Other responses:
${otherResponses.map((r, idx) => `Response ${idx + 1}: ${r.response}`).join('\n\n')}

Provide a brief analysis of:
1. Unique insights in your response
2. Areas of agreement with others
3. Areas where you differ and why
4. Overall confidence in your approach`;
            try {
                const routingContext = {
                    prompt: comparisonPrompt,
                    mode: 'auto'
                };
                const result = await this.router.route(routingContext);
                const provider = this.providers.get(result.providerId);
                if (provider && provider.supports(responses[i].modelId)) {
                    const messages = [
                        { role: 'user', content: comparisonPrompt }
                    ];
                    const comparison = await provider.chatComplete(responses[i].modelId, messages, {
                        maxTokens: 1000,
                        temperature: 0.5
                    });
                    responses[i].reasoning = comparison.content;
                }
            }
            catch (error) {
                console.error(`Comparison analysis failed for ${responses[i].modelId}:`, error);
            }
        }
        return responses;
    }
    /**
     * Calculate cost based on token usage and model pricing
     */
    calculateCost(inputTokens, outputTokens, model) {
        // Simple cost calculation - could be enhanced with actual model pricing
        const inputCostPer1k = model?.price?.inputPerMTok ? model.price.inputPerMTok / 1000 : 0.001;
        const outputCostPer1k = model?.price?.outputPerMTok ? model.price.outputPerMTok / 1000 : 0.002;
        return (inputTokens / 1000 * inputCostPer1k) + (outputTokens / 1000 * outputCostPer1k);
    }
    /**
     * Calculate agreement level between responses
     */
    calculateAgreementLevel(responses) {
        if (responses.length < 2)
            return 1.0;
        // Simple implementation - could be enhanced with semantic similarity
        const words = responses.map(r => r.response.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        let totalOverlap = 0;
        let comparisons = 0;
        for (let i = 0; i < words.length; i++) {
            for (let j = i + 1; j < words.length; j++) {
                const set1 = new Set(words[i]);
                const set2 = new Set(words[j]);
                const intersection = new Set([...set1].filter(x => set2.has(x)));
                const union = new Set([...set1, ...set2]);
                if (union.size > 0) {
                    totalOverlap += intersection.size / union.size;
                    comparisons++;
                }
            }
        }
        return comparisons > 0 ? totalOverlap / comparisons : 0;
    }
    /**
     * Simple consensus building fallback
     */
    buildSimpleConsensus(responses) {
        const validResponses = responses.filter(r => !r.response.startsWith('Error:'));
        if (validResponses.length === 0) {
            return {
                consensusResponse: 'No valid responses received from models',
                confidence: 0,
                agreementLevel: 0,
                responses,
                reasoning: 'All models failed to provide valid responses'
            };
        }
        // Use the longest response as base consensus
        const longestResponse = validResponses.reduce((prev, current) => current.response.length > prev.response.length ? current : prev);
        return {
            consensusResponse: longestResponse.response,
            confidence: 0.6,
            agreementLevel: this.calculateAgreementLevel(validResponses),
            responses,
            reasoning: 'Simple consensus using longest valid response'
        };
    }
    /**
     * Get recommended models for specific tasks
     */
    getRecommendedModels(taskType) {
        const recommendations = {
            'code-review': ['gpt-4', 'claude-3-sonnet', 'claude-3-opus'],
            'code-generation': ['gpt-4', 'claude-3-sonnet', 'codellama'],
            'explanation': ['gpt-4', 'claude-3-sonnet', 'claude-3-haiku'],
            'analysis': ['gpt-4', 'claude-3-opus', 'claude-3-sonnet'],
            'creative': ['gpt-4', 'claude-3-opus'],
            'technical': ['gpt-4', 'claude-3-sonnet'],
            'quick': ['gpt-3.5-turbo', 'claude-3-haiku']
        };
        return recommendations[taskType] || ['gpt-4', 'claude-3-sonnet'];
    }
}
exports.MultiModelManager = MultiModelManager;
//# sourceMappingURL=multiModelManager.js.map