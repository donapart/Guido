/**
 * Voice Command Processor - Handles voice commands and routing
 */
import { ModelRouter } from "../../router";
import { VoiceCommandHandler, VoiceConfig, VoiceResponse, VoiceRoutingContext } from "../types";
export declare class VoiceCommandProcessor {
    private commandHandlers;
    private config;
    private router;
    private lastResponse?;
    constructor(config: VoiceConfig, router: ModelRouter);
    /**
     * Process voice command and return response if handled
     */
    processCommand(context: VoiceRoutingContext): Promise<VoiceResponse | null>;
    /**
     * Register a new command handler
     */
    registerHandler(handler: VoiceCommandHandler): void;
    /**
     * Unregister a command handler
     */
    unregisterHandler(id: string): void;
    /**
     * Get all registered command handlers
     */
    getHandlers(): VoiceCommandHandler[];
    private processSystemCommands;
    private processLanguageCommands;
    private processRoutingCommands;
    private processVSCodeCommands;
    private processDevelopmentCommands;
    private explainCode;
    private reviewCode;
    private generateTests;
    private optimizeCode;
    private generateDocumentation;
    private executeAICommand;
    private createSystemResponse;
    private createLanguageResponse;
    private createRoutingResponse;
    private createVSCodeResponse;
    private createDevResponse;
    private matchesAny;
    private matchesCommandPattern;
    private getLanguageCode;
    private getLanguageFromContext;
    private registerBuiltinCommands;
}
//# sourceMappingURL=voiceCommandProcessor.d.ts.map