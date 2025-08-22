"use strict";
/**
 * MCP Server implementation for Model Router
 * Provides routing and model selection capabilities as MCP tools
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRouterMcpServer = void 0;
exports.createModelRouterMcpServer = createModelRouterMcpServer;
exports.createMcpConfig = createMcpConfig;
const price_1 = require("../price");
/**
 * MCP Server for Model Router
 *
 * Note: This is a simplified MCP implementation for demonstration.
 * In production, use a proper MCP library like @modelcontextprotocol/sdk-typescript
 */
class ModelRouterMcpServer {
    router;
    providers;
    constructor(router, providers) {
        this.router = router;
        this.providers = providers;
    }
    /**
     * Get list of available MCP tools
     */
    getTools() {
        return [
            {
                name: "route_model",
                description: "Route a prompt to the optimal model based on content and context",
                inputSchema: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "The user prompt to route",
                        },
                        context: {
                            type: "object",
                            properties: {
                                lang: { type: "string", description: "Programming language" },
                                filePath: { type: "string", description: "File path for context" },
                                fileSizeKB: { type: "number", description: "File size in KB" },
                                mode: { type: "string", description: "Routing mode (auto, speed, quality, etc.)" },
                                privacyStrict: { type: "boolean", description: "Require privacy-strict routing" },
                            },
                        },
                    },
                    required: ["prompt"],
                },
            },
            {
                name: "estimate_cost",
                description: "Estimate the cost of running a prompt with different models",
                inputSchema: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "The prompt to estimate cost for",
                        },
                        expectedOutputTokens: {
                            type: "number",
                            description: "Expected number of output tokens (optional)",
                        },
                        providers: {
                            type: "array",
                            items: { type: "string" },
                            description: "Specific providers to estimate for (optional)",
                        },
                    },
                    required: ["prompt"],
                },
            },
            {
                name: "list_models",
                description: "List all available models with their capabilities",
                inputSchema: {
                    type: "object",
                    properties: {
                        capability: {
                            type: "string",
                            description: "Filter by capability (tools, json, long, cheap, etc.)",
                        },
                        provider: {
                            type: "string",
                            description: "Filter by provider",
                        },
                    },
                },
            },
            {
                name: "simulate_routing",
                description: "Simulate routing without executing to see alternatives",
                inputSchema: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "The prompt to simulate routing for",
                        },
                        context: {
                            type: "object",
                            properties: {
                                lang: { type: "string" },
                                filePath: { type: "string" },
                                fileSizeKB: { type: "number" },
                                mode: { type: "string" },
                                privacyStrict: { type: "boolean" },
                            },
                        },
                    },
                    required: ["prompt"],
                },
            },
            {
                name: "check_provider_status",
                description: "Check the availability status of providers",
                inputSchema: {
                    type: "object",
                    properties: {
                        provider: {
                            type: "string",
                            description: "Specific provider to check (optional)",
                        },
                    },
                },
            },
        ];
    }
    /**
     * Handle MCP tool call
     */
    async handleToolCall(request) {
        try {
            switch (request.name) {
                case "route_model":
                    return await this.routeModel(request.arguments);
                case "estimate_cost":
                    return await this.estimateCost(request.arguments);
                case "list_models":
                    return await this.listModels(request.arguments);
                case "simulate_routing":
                    return await this.simulateRouting(request.arguments);
                case "check_provider_status":
                    return await this.checkProviderStatus(request.arguments);
                default:
                    throw new Error(`Unknown tool: ${request.name}`);
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    /**
     * Route a model based on prompt and context
     */
    async routeModel(args) {
        const { prompt, context = {} } = args;
        if (!prompt || typeof prompt !== "string") {
            throw new Error("Prompt is required and must be a string");
        }
        const routingContext = {
            prompt,
            ...context,
        };
        const result = await this.router.route(routingContext);
        const response = {
            provider: result.providerId,
            model: result.modelName,
            score: result.score,
            reasoning: result.reasoning,
            rule: result.rule?.id,
            capabilities: result.model.caps || [],
            estimatedCost: result.model.price
                ? price_1.PriceCalculator.estimateCost(prompt, result.model, result.providerId)
                : undefined,
        };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(response, null, 2),
                },
            ],
        };
    }
    /**
     * Estimate costs for different models
     */
    async estimateCost(args) {
        const { prompt, expectedOutputTokens, providers: requestedProviders } = args;
        if (!prompt || typeof prompt !== "string") {
            throw new Error("Prompt is required and must be a string");
        }
        const availableModels = this.router.getAvailableModels();
        const filteredModels = requestedProviders
            ? availableModels.filter(m => requestedProviders.includes(m.providerId))
            : availableModels;
        const estimates = filteredModels
            .filter(m => m.config.price)
            .map(m => {
            const estimate = price_1.PriceCalculator.estimateCost(prompt, m.config, m.providerId, expectedOutputTokens);
            return {
                ...estimate,
                provider: m.providerId,
                model: m.modelName,
            };
        })
            .sort((a, b) => a.totalCost - b.totalCost);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(estimates, null, 2),
                },
            ],
        };
    }
    /**
     * List available models with their capabilities
     */
    async listModels(args) {
        const { capability, provider: filterProvider } = args;
        let models = this.router.getAvailableModels();
        if (capability) {
            models = models.filter(m => m.config.caps?.includes(capability));
        }
        if (filterProvider) {
            models = models.filter(m => m.providerId === filterProvider);
        }
        const modelList = models.map(m => ({
            provider: m.providerId,
            model: m.modelName,
            context: m.config.context,
            capabilities: m.config.caps || [],
            hasPrice: !!m.config.price,
            price: m.config.price || null,
        }));
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(modelList, null, 2),
                },
            ],
        };
    }
    /**
     * Simulate routing to show alternatives
     */
    async simulateRouting(args) {
        const { prompt, context = {} } = args;
        if (!prompt || typeof prompt !== "string") {
            throw new Error("Prompt is required and must be a string");
        }
        const routingContext = {
            prompt,
            ...context,
        };
        const simulation = await this.router.simulateRoute(routingContext);
        const response = {
            chosen: simulation.result
                ? {
                    provider: simulation.result.providerId,
                    model: simulation.result.modelName,
                    score: simulation.result.score,
                    reasoning: simulation.result.reasoning,
                }
                : null,
            alternatives: simulation.alternatives.slice(0, 5), // Limit to top 5
        };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(response, null, 2),
                },
            ],
        };
    }
    /**
     * Check provider availability status
     */
    async checkProviderStatus(args) {
        const { provider: filterProvider } = args;
        const providers = filterProvider
            ? [this.providers.get(filterProvider)].filter(Boolean)
            : Array.from(this.providers.values());
        const statusChecks = await Promise.allSettled(providers.map(async (provider) => {
            if (!provider)
                return null;
            const available = await provider.isAvailable();
            const supportedModels = this.router
                .getAvailableModels()
                .filter(m => m.providerId === provider.id())
                .map(m => m.modelName);
            return {
                provider: provider.id(),
                available,
                models: supportedModels,
            };
        }));
        const results = statusChecks
            .map(result => (result.status === "fulfilled" ? result.value : null))
            .filter(Boolean);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    }
    /**
     * Start MCP server (placeholder for actual MCP implementation)
     */
    async start() {
        // In a real implementation, this would:
        // 1. Set up MCP transport (stdio, HTTP, etc.)
        // 2. Register tool handlers
        // 3. Handle MCP protocol messages
        console.log("MCP Server started with tools:", this.getTools().map(t => t.name));
    }
    /**
     * Stop MCP server
     */
    async stop() {
        console.log("MCP Server stopped");
    }
    /**
     * Get server capabilities for MCP protocol
     */
    getCapabilities() {
        return {
            tools: {},
            // Add other MCP capabilities as needed
        };
    }
}
exports.ModelRouterMcpServer = ModelRouterMcpServer;
/**
 * Factory function to create MCP server
 */
function createModelRouterMcpServer(router, providers) {
    return new ModelRouterMcpServer(router, providers);
}
/**
 * Utility to create MCP server configuration for external clients
 */
function createMcpConfig(serverExecutable) {
    return {
        name: "model-router",
        description: "AI Model Router with intelligent model selection",
        executable: serverExecutable,
        args: ["--mcp"],
        tools: [
            "route_model",
            "estimate_cost",
            "list_models",
            "simulate_routing",
            "check_provider_status",
        ],
    };
}
//# sourceMappingURL=server.js.map