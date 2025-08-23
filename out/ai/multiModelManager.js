"use strict";
/**
 * Multi-Model Manager for parallel and sequential AI model execution
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiModelManager = void 0;
class MultiModelManager {
    router;
    providers;
    constructor(router, providers) {
        this.router = router;
        this.providers = providers;
    }
    async executeMultiModel(request) {
        switch (request.strategy) {
            case "parallel":
                return this.executeParallel(request);
            case "sequential":
                return this.executeSequential(request);
            case "consensus":
                return this.executeConsensus(request);
            case "comparison":
                return this.executeComparison(request);
            default:
                throw new Error(`Unknown strategy: ${request.strategy}`);
        }
    }
    async executeParallel(request) {
        const promises = request.models.map(async (model) => {
            const startTime = Date.now();
            try {
                // Find provider for this model
                const [providerId, modelName] = model.split(":");
                const provider = this.providers.get(providerId);
                if (!provider) {
                    throw new Error(`Provider ${providerId} not found`);
                }
                const result = await provider.chatComplete(modelName, [{ role: "user", content: request.prompt }], {
                    maxTokens: request.options?.maxTokens || 1000,
                    temperature: request.options?.temperature || 0.7,
                });
                return {
                    modelId: model,
                    response: result.content,
                    metadata: {
                        duration: Date.now() - startTime,
                        tokens: (result.usage?.inputTokens || 0) +
                            (result.usage?.outputTokens || 0),
                        cost: 0.001 *
                            ((result.usage?.inputTokens || 0) +
                                (result.usage?.outputTokens || 0)),
                    },
                };
            }
            catch (error) {
                return {
                    modelId: model,
                    response: `Fehler: ${error instanceof Error ? error.message : String(error)}`,
                    metadata: {
                        duration: Date.now() - startTime,
                        tokens: 0,
                        cost: 0,
                    },
                };
            }
        });
        return Promise.all(promises);
    }
    async executeSequential(request) {
        const results = [];
        let context = request.prompt;
        for (const model of request.models) {
            const startTime = Date.now();
            try {
                const [providerId, modelName] = model.split(":");
                const provider = this.providers.get(providerId);
                if (!provider) {
                    throw new Error(`Provider ${providerId} not found`);
                }
                const result = await provider.chatComplete(modelName, [{ role: "user", content: context }], {
                    maxTokens: request.options?.maxTokens || 1000,
                    temperature: request.options?.temperature || 0.7,
                });
                const response = {
                    modelId: model,
                    response: result.content,
                    metadata: {
                        duration: Date.now() - startTime,
                        tokens: (result.usage?.inputTokens || 0) +
                            (result.usage?.outputTokens || 0),
                        cost: 0.001 *
                            ((result.usage?.inputTokens || 0) +
                                (result.usage?.outputTokens || 0)),
                    },
                };
                results.push(response);
                // Add this response to context for next model
                context += `\n\nPrevious response from ${model}:\n${result.content}`;
            }
            catch (error) {
                results.push({
                    modelId: model,
                    response: `Fehler: ${error instanceof Error ? error.message : String(error)}`,
                    metadata: {
                        duration: Date.now() - startTime,
                        tokens: 0,
                        cost: 0,
                    },
                });
            }
        }
        return results;
    }
    async executeConsensus(request) {
        // First get all responses in parallel
        const responses = await this.executeParallel(request);
        // Then create a consensus response
        const consensusPrompt = `Analyze these responses and create a consensus answer:

Original question: ${request.prompt}

Responses:
${responses
            .map((r, i) => `Response ${i + 1} (${r.modelId}):\n${r.response}`)
            .join("\n\n")}

Provide a consensus answer that combines the best aspects of all responses.`;
        // Use the first available model to generate consensus
        if (request.models.length > 0) {
            const [providerId, modelName] = request.models[0].split(":");
            const provider = this.providers.get(providerId);
            if (provider) {
                const startTime = Date.now();
                try {
                    const consensusResult = await provider.chatComplete(modelName, [{ role: "user", content: consensusPrompt }], {
                        maxTokens: request.options?.maxTokens || 1000,
                        temperature: 0.3, // Lower temperature for consensus
                    });
                    responses.push({
                        modelId: "consensus",
                        response: consensusResult.content,
                        metadata: {
                            duration: Date.now() - startTime,
                            tokens: (consensusResult.usage?.inputTokens || 0) +
                                (consensusResult.usage?.outputTokens || 0),
                            cost: 0.001 *
                                ((consensusResult.usage?.inputTokens || 0) +
                                    (consensusResult.usage?.outputTokens || 0)),
                        },
                    });
                }
                catch (error) {
                    responses.push({
                        modelId: "consensus",
                        response: `Consensus generation failed: ${error instanceof Error ? error.message : String(error)}`,
                        metadata: {
                            duration: Date.now() - startTime,
                            tokens: 0,
                            cost: 0,
                        },
                    });
                }
            }
        }
        return responses;
    }
    async executeComparison(request) {
        // Get parallel responses
        const responses = await this.executeParallel(request);
        // Create a comparison analysis
        const comparisonPrompt = `Compare and analyze these AI responses:

Original question: ${request.prompt}

Responses:
${responses
            .map((r, i) => `Response ${i + 1} (${r.modelId}):\n${r.response}`)
            .join("\n\n")}

Provide a detailed comparison analyzing:
1. Accuracy and correctness
2. Completeness of the answer
3. Clarity and readability
4. Unique insights or perspectives
5. Overall quality rating (1-10)

Rank the responses from best to worst with reasoning.`;
        // Use the first available model for comparison
        if (request.models.length > 0) {
            const [providerId, modelName] = request.models[0].split(":");
            const provider = this.providers.get(providerId);
            if (provider) {
                const startTime = Date.now();
                try {
                    const comparisonResult = await provider.chatComplete(modelName, [{ role: "user", content: comparisonPrompt }], {
                        maxTokens: request.options?.maxTokens || 1500,
                        temperature: 0.3,
                    });
                    responses.push({
                        modelId: "comparison",
                        response: comparisonResult.content,
                        metadata: {
                            duration: Date.now() - startTime,
                            tokens: (comparisonResult.usage?.inputTokens || 0) +
                                (comparisonResult.usage?.outputTokens || 0),
                            cost: 0.001 *
                                ((comparisonResult.usage?.inputTokens || 0) +
                                    (comparisonResult.usage?.outputTokens || 0)),
                        },
                    });
                }
                catch (error) {
                    responses.push({
                        modelId: "comparison",
                        response: `Comparison analysis failed: ${error instanceof Error ? error.message : String(error)}`,
                        metadata: {
                            duration: Date.now() - startTime,
                            tokens: 0,
                            cost: 0,
                        },
                    });
                }
            }
        }
        return responses;
    }
}
exports.MultiModelManager = MultiModelManager;
//# sourceMappingURL=multiModelManager.js.map