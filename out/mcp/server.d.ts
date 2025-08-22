/**
 * MCP Server implementation for Model Router
 * Provides routing and model selection capabilities as MCP tools
 */
import { ModelRouter } from "../router";
import { Provider } from "../providers/base";
export interface McpToolRequest {
    name: string;
    arguments: Record<string, any>;
}
export interface McpToolResponse {
    content: Array<{
        type: "text";
        text: string;
    }>;
}
export interface McpTool {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: Record<string, any>;
        required?: string[];
    };
}
/**
 * MCP Server for Model Router
 *
 * Note: This is a simplified MCP implementation for demonstration.
 * In production, use a proper MCP library like @modelcontextprotocol/sdk-typescript
 */
export declare class ModelRouterMcpServer {
    private router;
    private providers;
    constructor(router: ModelRouter, providers: Map<string, Provider>);
    /**
     * Get list of available MCP tools
     */
    getTools(): McpTool[];
    /**
     * Handle MCP tool call
     */
    handleToolCall(request: McpToolRequest): Promise<McpToolResponse>;
    /**
     * Route a model based on prompt and context
     */
    private routeModel;
    /**
     * Estimate costs for different models
     */
    private estimateCost;
    /**
     * List available models with their capabilities
     */
    private listModels;
    /**
     * Simulate routing to show alternatives
     */
    private simulateRouting;
    /**
     * Check provider availability status
     */
    private checkProviderStatus;
    /**
     * Start MCP server (placeholder for actual MCP implementation)
     */
    start(): Promise<void>;
    /**
     * Stop MCP server
     */
    stop(): Promise<void>;
    /**
     * Get server capabilities for MCP protocol
     */
    getCapabilities(): any;
}
/**
 * Factory function to create MCP server
 */
export declare function createModelRouterMcpServer(router: ModelRouter, providers: Map<string, Provider>): ModelRouterMcpServer;
/**
 * Utility to create MCP server configuration for external clients
 */
export declare function createMcpConfig(serverExecutable: string): any;
//# sourceMappingURL=server.d.ts.map