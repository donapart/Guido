"use strict";
/**
 * Main extension entry point
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const codeAnalyzer_1 = require("./ai/codeAnalyzer");
const multiModelManager_1 = require("./ai/multiModelManager");
const promptingManager_1 = require("./ai/promptingManager");
const taskPlanner_1 = require("./ai/taskPlanner");
const config_1 = require("./config");
const anthropic_1 = require("./providers/anthropic");
const cohere_1 = require("./providers/cohere");
const huggingface_1 = require("./providers/huggingface");
const ollama_1 = require("./providers/ollama");
const openaiCompat_1 = require("./providers/openaiCompat");
const openrouter_1 = require("./providers/openrouter");
const router_1 = require("./router");
const advancedRouting_1 = require("./router/experimental/advancedRouting");
const secret_1 = require("./secret");
const advancedDashboard_1 = require("./ui/advancedDashboard");
const logger_1 = require("./utils/logger");
const contextAwareVoiceCommands_1 = require("./voice/contextAwareVoiceCommands");
const advancedVoiceFeatures_1 = require("./voice/experimental/advancedVoiceFeatures");
const naturalLanguageProcessor_1 = require("./voice/experimental/naturalLanguageProcessor");
const voiceController_1 = require("./voice/voiceController");
const experimentalUI_1 = require("./voice/webview/experimentalUI");
let extensionContext;
let state;
async function activate(context) {
    extensionContext = context;
    try {
        // Initialize logger early
        logger_1.logger.init(context);
        logger_1.logger.info("Extension activate called");
        await initializeExtension();
        // Register commands
        registerCommands(context);
        // Initialize voice control if enabled
        if (state.config.voice?.enabled) {
            await initializeVoiceControl();
        }
        // Initialize Phase 4: Enterprise Extensions
        await initializeEnterpriseProviders(state.providers);
        await initializeEnterpriseUI(context);
        await initializeEnterpriseVoiceCommands(context);
        // Initialize experimental features
        await initializeExperimentalFeatures();
        // Initialize Phase 3: Advanced AI Capabilities
        await initializePhase3Features();
        vscode.window.showInformationMessage("Guido Model Router Extension aktiviert! 🎤✨");
        logger_1.logger.info("Extension activated successfully");
    }
    catch (error) {
        const message = `Fehler beim Aktivieren der Extension: ${error instanceof Error ? error.message : String(error)}`;
        logger_1.logger.error("activate_error", {
            message,
            error: error instanceof Error ? error.stack : String(error),
        });
        vscode.window.showErrorMessage(message);
    }
}
function deactivate() {
    // Cleanup
    if (state.voiceController) {
        state.voiceController.stopListening();
    }
    vscode.window.showInformationMessage("Guido Model Router Extension deaktiviert.");
}
async function initializeExtension() {
    // Load configuration
    const config = await (0, config_1.loadConfiguration)();
    // Initialize secret manager
    const secretManager = new secret_1.VSCodeSecretManager(extensionContext);
    // Initialize providers
    const providers = new Map();
    for (const providerConfig of config.providers) {
        try {
            let provider;
            if (providerConfig.kind === "openai-compat") {
                provider = new openaiCompat_1.OpenAICompatProvider(providerConfig);
            }
            else if (providerConfig.kind === "ollama") {
                provider = new ollama_1.OllamaProvider(providerConfig);
            }
            else {
                console.warn(`Unknown provider kind: ${providerConfig.kind}`);
                continue;
            }
            providers.set(providerConfig.id, provider);
        }
        catch (error) {
            console.warn(`Failed to initialize provider ${providerConfig.id}:`, error);
        }
    }
    // Initialize enterprise providers (Phase 4)
    await initializeEnterpriseProviders(providers);
    // Initialize router
    const router = new router_1.ModelRouter(config, providers);
    state = {
        router,
        providers,
        config,
        secretManager,
    };
}
async function initializeEnterpriseProviders(providers) {
    const workspaceConfig = vscode.workspace.getConfiguration("modelRouter");
    try {
        // Initialize Anthropic Provider
        const anthropicKey = workspaceConfig.get("anthropicApiKey");
        if (anthropicKey && anthropicKey.trim()) {
            try {
                const anthropicProvider = new anthropic_1.AnthropicProvider({
                    id: "anthropic",
                    kind: "custom",
                    baseUrl: "https://api.anthropic.com",
                    apiKey: anthropicKey,
                    models: [
                        "claude-3-5-sonnet-20241022",
                        "claude-3-opus-20240229",
                        "claude-3-haiku-20240307",
                    ],
                    model: "claude-3-5-sonnet-20241022",
                    maxTokens: 4096,
                    temperature: 0.7,
                });
                providers.set("anthropic", anthropicProvider);
                console.log("✅ Anthropic Provider initialized successfully");
            }
            catch (error) {
                console.warn("❌ Anthropic initialization failed:", error);
            }
        }
        // Initialize Cohere Provider
        const cohereKey = workspaceConfig.get("cohereApiKey");
        if (cohereKey && cohereKey.trim()) {
            try {
                const cohereProvider = new cohere_1.CohereProvider({
                    id: "cohere",
                    kind: "custom",
                    baseUrl: "https://api.cohere.ai",
                    apiKey: cohereKey,
                    models: ["command-r-plus", "command-r", "command", "command-nightly"],
                    model: "command-r-plus",
                    maxTokens: 4096,
                    temperature: 0.7,
                });
                providers.set("cohere", cohereProvider);
                console.log("✅ Cohere Provider initialized successfully");
            }
            catch (error) {
                console.warn("❌ Cohere initialization failed:", error);
            }
        }
        // Initialize OpenRouter Provider
        const openrouterKey = workspaceConfig.get("openrouterApiKey");
        if (openrouterKey && openrouterKey.trim()) {
            try {
                const openrouterProvider = new openrouter_1.OpenRouterProvider({
                    id: "openrouter",
                    kind: "custom",
                    baseUrl: "https://openrouter.ai/api/v1",
                    apiKey: openrouterKey,
                    models: [
                        "openai/gpt-4o",
                        "openai/gpt-4-turbo",
                        "anthropic/claude-3-5-sonnet",
                        "meta-llama/llama-3.1-70b-instruct",
                        "google/gemini-pro",
                        "mistralai/mistral-7b-instruct",
                    ],
                    model: "openai/gpt-4o",
                    maxTokens: 4096,
                    temperature: 0.7,
                });
                providers.set("openrouter", openrouterProvider);
                console.log("✅ OpenRouter Provider initialized successfully");
            }
            catch (error) {
                console.warn("❌ OpenRouter initialization failed:", error);
            }
        }
        // Initialize Hugging Face Provider
        const huggingfaceKey = workspaceConfig.get("huggingfaceApiKey");
        if (huggingfaceKey && huggingfaceKey.trim()) {
            try {
                const huggingfaceProvider = new huggingface_1.HuggingFaceProvider({
                    id: "huggingface",
                    kind: "custom",
                    baseUrl: "https://api-inference.huggingface.co",
                    apiKey: huggingfaceKey,
                    models: [
                        "microsoft/DialoGPT-large",
                        "meta-llama/Llama-2-7b-chat-hf",
                        "mistralai/Mistral-7B-Instruct-v0.1",
                        "google/flan-t5-xl",
                        "Salesforce/codegen-2B-multi",
                    ],
                    model: "microsoft/DialoGPT-large",
                    maxTokens: 1024,
                    temperature: 0.7,
                    useCache: true,
                    waitForModel: false,
                });
                providers.set("huggingface", huggingfaceProvider);
                console.log("✅ Hugging Face Provider initialized successfully");
            }
            catch (error) {
                console.warn("❌ Hugging Face initialization failed:", error);
            }
        }
        console.log(`🚀 Initialized ${providers.size} providers total`);
    }
    catch (error) {
        console.warn("Enterprise provider initialization failed:", error);
    }
}
// Enterprise UI initialization
async function initializeEnterpriseUI(context) {
    try {
        // Register Advanced Dashboard command
        const showDashboardCommand = vscode.commands.registerCommand("modelRouter.showAdvancedDashboard", async () => {
            try {
                const dashboard = new advancedDashboard_1.AdvancedDashboardUI(state.router);
                dashboard.createDashboard();
                console.log("✅ Advanced Dashboard opened successfully");
            }
            catch (error) {
                console.error("❌ Failed to open Advanced Dashboard:", error);
                vscode.window.showErrorMessage("Fehler beim Öffnen des Advanced Dashboard");
            }
        });
        context.subscriptions.push(showDashboardCommand);
        console.log("✅ Enterprise UI commands registered");
    }
    catch (error) {
        console.warn("Enterprise UI initialization failed:", error);
    }
}
// Enterprise Voice Commands initialization
async function initializeEnterpriseVoiceCommands(context) {
    try {
        // Register voice command context command
        const contextVoiceCommand = vscode.commands.registerCommand("modelRouter.contextVoiceCommand", async () => {
            try {
                if (state.contextAwareVoice) {
                    const transcript = await vscode.window.showInputBox({
                        prompt: "Geben Sie Ihren Sprachbefehl ein:",
                        placeHolder: 'z.B. "Erkläre den ausgewählten Code"',
                    });
                    if (transcript) {
                        await state.contextAwareVoice.processVoiceCommand(transcript);
                        console.log("✅ Context-aware voice command processed");
                    }
                }
                else {
                    vscode.window.showWarningMessage("Context-aware voice commands not available");
                }
            }
            catch (error) {
                console.error("❌ Context voice command failed:", error);
                vscode.window.showErrorMessage("Fehler bei der kontext-sensitiven Sprachsteuerung");
            }
        });
        context.subscriptions.push(contextVoiceCommand);
        console.log("✅ Enterprise Voice Commands initialized");
    }
    catch (error) {
        console.warn("Enterprise Voice Commands initialization failed:", error);
    }
}
async function initializeVoiceControl() {
    if (!state.config.voice) {
        return;
    }
    try {
        state.voiceController = new voiceController_1.VoiceController(extensionContext, state.config.voice, state.router);
        await state.voiceController.initialize();
        // Initialize Context-Aware Voice Commands (Phase 4)
        state.contextAwareVoice = new contextAwareVoiceCommands_1.ContextAwareVoiceCommands(state.router, state.voiceController);
        vscode.window.showInformationMessage("Guido Voice Control mit Context-Aware Commands initialisiert! 🎤✨");
    }
    catch (error) {
        console.warn("Voice control initialization failed:", error);
        vscode.window.showWarningMessage("Voice Control konnte nicht initialisiert werden.");
    }
}
async function initializeExperimentalFeatures() {
    try {
        // Initialize experimental voice features
        state.experimentalFeatures = new advancedVoiceFeatures_1.ExperimentalVoiceFeatures();
        // Initialize experimental routing
        state.experimentalRouting = new advancedRouting_1.ExperimentalRouting(state.router, state.providers);
        // Initialize experimental NLP
        state.experimentalNLP = new naturalLanguageProcessor_1.ExperimentalNLP();
        vscode.window.showInformationMessage("🧪 Experimentelle Features aktiviert!");
    }
    catch (error) {
        console.warn("Experimental features initialization failed:", error);
        vscode.window.showWarningMessage("Experimentelle Features konnten nicht initialisiert werden.");
    }
}
/**
 * Initialize Phase 3: Advanced AI Capabilities
 */
async function initializePhase3Features() {
    try {
        // Initialize Multi-Model Manager
        state.multiModelManager = new multiModelManager_1.MultiModelManager(state.router, state.providers);
        // Initialize AI Task Planner
        state.taskPlanner = new taskPlanner_1.AITaskPlanner(state.router, state.providers);
        // Initialize Advanced Prompting Manager
        state.promptingManager = new promptingManager_1.AdvancedPromptingManager(state.router, state.providers);
        // Initialize Context-Aware Code Analyzer
        state.codeAnalyzer = new codeAnalyzer_1.ContextAwareCodeAnalyzer(state.router, state.providers);
        vscode.window.showInformationMessage("🚀 Advanced AI Capabilities aktiviert!");
    }
    catch (error) {
        console.warn("Phase 3 features initialization failed:", error);
        vscode.window.showWarningMessage("Advanced AI Capabilities konnten nicht vollständig initialisiert werden.");
    }
}
function registerCommands(context) {
    // Core commands
    context.subscriptions.push(vscode.commands.registerCommand("modelRouter.chat", async () => {
        await handleChatCommand();
    }), vscode.commands.registerCommand("modelRouter.openConfig", async () => {
        await handleOpenConfigCommand();
    }), vscode.commands.registerCommand("modelRouter.estimateCost", async () => {
        await handleEstimateCostCommand();
    }));
    // Logging commands
    context.subscriptions.push(vscode.commands.registerCommand("modelRouter.showLogs", async () => {
        try {
            await logger_1.logger.showLatestLog();
        }
        catch (error) {
            vscode.window.showErrorMessage("Konnte Logdatei nicht öffnen");
        }
    }), vscode.commands.registerCommand("modelRouter.clearLogs", async () => {
        try {
            logger_1.logger.clearLogs();
            vscode.window.showInformationMessage("Guido Logs gelöscht");
        }
        catch (error) {
            vscode.window.showErrorMessage("Konnte Logs nicht löschen");
        }
    }));
    // Voice control commands
    context.subscriptions.push(vscode.commands.registerCommand("modelRouter.startVoiceControl", async () => {
        await handleStartVoiceControl();
    }), vscode.commands.registerCommand("modelRouter.stopVoiceControl", async () => {
        await handleStopVoiceControl();
    }), vscode.commands.registerCommand("modelRouter.toggleVoiceControl", async () => {
        await handleToggleVoiceControl();
    }), vscode.commands.registerCommand("modelRouter.voiceSettings", async () => {
        await handleVoiceSettings();
    }), vscode.commands.registerCommand("modelRouter.voicePermissions", async () => {
        await handleVoicePermissions();
    }));
    // Phase 2: Workflow Optimization commands
    context.subscriptions.push(vscode.commands.registerCommand("modelRouter.newSession", async () => {
        await handleNewSessionCommand();
    }), vscode.commands.registerCommand("modelRouter.switchSession", async () => {
        await handleSwitchSessionCommand();
    }), vscode.commands.registerCommand("modelRouter.searchHistory", async () => {
        await handleSearchHistoryCommand();
    }), vscode.commands.registerCommand("modelRouter.showSplitView", async () => {
        await handleShowSplitViewCommand();
    }));
    // Phase 3: Advanced AI Capabilities commands
    context.subscriptions.push(vscode.commands.registerCommand("modelRouter.multiModelChat", async () => {
        await handleMultiModelChatCommand();
    }), vscode.commands.registerCommand("modelRouter.createTaskPlan", async () => {
        await handleCreateTaskPlanCommand();
    }), vscode.commands.registerCommand("modelRouter.executeTaskPlan", async (planId) => {
        await handleExecuteTaskPlanCommand(planId);
    }), vscode.commands.registerCommand("modelRouter.optimizePrompt", async () => {
        await handleOptimizePromptCommand();
    }), vscode.commands.registerCommand("modelRouter.analyzeCode", async () => {
        await handleAnalyzeCodeCommand();
    }), vscode.commands.registerCommand("modelRouter.reviewPullRequest", async () => {
        await handleReviewPullRequestCommand();
    }));
    // Experimental commands
    context.subscriptions.push(vscode.commands.registerCommand("modelRouter.experimental.emotionAnalysis", async () => {
        await handleExperimentalEmotionAnalysis();
    }), vscode.commands.registerCommand("modelRouter.experimental.contextEnhancement", async () => {
        await handleExperimentalContextEnhancement();
    }), vscode.commands.registerCommand("modelRouter.experimental.adaptiveRouting", async () => {
        await handleExperimentalAdaptiveRouting();
    }), vscode.commands.registerCommand("modelRouter.experimental.intentRecognition", async () => {
        await handleExperimentalIntentRecognition();
    }), vscode.commands.registerCommand("modelRouter.experimental.personalityAdaptation", async () => {
        await handleExperimentalPersonalityAdaptation();
    }), vscode.commands.registerCommand("modelRouter.experimental.multilingualProcessing", async () => {
        await handleExperimentalMultilingualProcessing();
    }), vscode.commands.registerCommand("modelRouter.experimental.performanceMetrics", async () => {
        await handleExperimentalPerformanceMetrics();
    }), vscode.commands.registerCommand("modelRouter.experimental.showUI", async () => {
        await handleExperimentalShowUI();
    }), vscode.commands.registerCommand("modelRouter.experimental.testFeatures", async () => {
        await handleExperimentalTestFeatures();
    }));
}
// Command handlers
async function handleChatCommand() {
    const prompt = await vscode.window.showInputBox({
        prompt: "Geben Sie Ihre Nachricht ein:",
        placeHolder: 'z.B. "Erkläre mir TypeScript"',
    });
    if (!prompt)
        return;
    try {
        const routingContext = {
            prompt,
            lang: "de",
            mode: "auto",
        };
        logger_1.logger.info("chat_command_route_start", { routingContext });
        const result = await state.router.route(routingContext);
        logger_1.logger.info("chat_command_route_done", {
            model: result.model,
            provider: result.provider,
        });
        await displayChatResult(result);
    }
    catch (error) {
        const message = `Fehler: ${error instanceof Error ? error.message : String(error)}`;
        logger_1.logger.error("chat_command_error", { message });
        vscode.window.showErrorMessage(message);
    }
}
async function handleOpenConfigCommand() {
    const configUri = vscode.Uri.file(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath + '/router.config.yaml');
    await vscode.window.showTextDocument(configUri);
}
async function handleEstimateCostCommand() {
    const prompt = await vscode.window.showInputBox({
        prompt: 'Geben Sie den Text ein, für den Sie die Kosten schätzen möchten:'
    });
    if (!prompt)
        return;
    try {
        const estimates = await Promise.all(Array.from(state.providers.values()).map(async (provider) => {
            const models = await provider.getAvailableModels();
            return models.map((model) => ({
                provider: provider.id(),
                model,
                estimatedCost: provider.estimateTokens(prompt) * 0.001 // Simplified cost estimation
            }));
        }));
        const flatEstimates = estimates.flat();
        const cheapest = flatEstimates.reduce((min, current) => current.estimatedCost < min.estimatedCost ? current : min);
        vscode.window.showInformationMessage(`Geschätzte Kosten: ${cheapest.estimatedCost.toFixed(4)}€ (${cheapest.provider}/${cheapest.model})`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Fehler bei der Kostenberechnung: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleStartVoiceControl() {
    if (!state.voiceController) {
        vscode.window.showErrorMessage('Voice Control ist nicht initialisiert.');
        return;
    }
    try {
        await state.voiceController.startListening();
        vscode.window.showInformationMessage('🎤 Guido hört zu... Sagen Sie "Guido"!');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Fehler beim Starten der Sprachsteuerung: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleStopVoiceControl() {
    if (!state.voiceController) {
        return;
    }
    try {
        await state.voiceController.stopListening();
        vscode.window.showInformationMessage('🔇 Sprachsteuerung gestoppt.');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Fehler beim Stoppen der Sprachsteuerung: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleToggleVoiceControl() {
    if (!state.voiceController) {
        vscode.window.showErrorMessage('Voice Control ist nicht initialisiert.');
        return;
    }
    try {
        // Simple toggle logic - if we can stop, we assume it's listening
        await state.voiceController.stopListening();
        await new Promise(resolve => setTimeout(resolve, 100));
        await state.voiceController.startListening();
        vscode.window.showInformationMessage('🔄 Sprachsteuerung umgeschaltet.');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Fehler beim Umschalten der Sprachsteuerung: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Phase 2: Workflow Optimization Command Handlers
 */
async function handleNewSessionCommand() {
    try {
        await vscode.commands.executeCommand('modelRouter.chat');
        vscode.window.showInformationMessage('Neue Chat-Session erstellt');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Fehler beim Erstellen einer neuen Session: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleSwitchSessionCommand() {
    try {
        // Hier würde normalmente eine Funktion aus dem SessionManager aufgerufen werden
        const sessions = ['Session 1', 'Session 2', 'Session 3']; // Beispiel
        const selected = await vscode.window.showQuickPick(sessions, {
            placeHolder: 'Wählen Sie eine Session'
        });
        if (selected) {
            vscode.window.showInformationMessage(`Gewechselt zu ${selected}`);
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Fehler beim Wechseln der Session: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleSearchHistoryCommand() {
    try {
        const searchTerm = await vscode.window.showInputBox({
            prompt: 'Chatverlauf durchsuchen',
            placeHolder: 'Suchbegriff eingeben'
        });
        if (searchTerm) {
            vscode.window.showInformationMessage(`Suche nach "${searchTerm}" im Chatverlauf`);
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Fehler bei der Suche: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleShowSplitViewCommand() {
    try {
        await vscode.commands.executeCommand('workbench.view.extension.modelRouterSplitView');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Fehler beim Öffnen der Split View: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleVoiceSettings() {
    const options = [
        'Sprache ändern',
        'Stimme auswählen',
        'Empfindlichkeit anpassen',
        'Timeout-Einstellungen',
        'Beep-Sound konfigurieren',
        'TTS-Einstellungen',
        'Experimentelle Features'
    ];
    const selected = await vscode.window.showQuickPick(options, {
        placeHolder: 'Wählen Sie eine Einstellung:'
    });
    if (!selected)
        return;
    switch (selected) {
        case 'Experimentelle Features':
            await handleExperimentalShowUI();
            break;
        default:
            vscode.window.showInformationMessage(`Einstellung "${selected}" wird implementiert...`);
    }
}
async function handleVoicePermissions() {
    const options = [
        'Mikrofon-Berechtigung prüfen',
        'Datenschutz-Einstellungen',
        'GDPR-Consent verwalten',
        'Daten exportieren',
        'Berechtigungen zurücksetzen',
        'Statistiken anzeigen'
    ];
    const selected = await vscode.window.showQuickPick(options, {
        placeHolder: 'Wählen Sie eine Aktion:'
    });
    if (!selected)
        return;
    switch (selected) {
        case 'Statistiken anzeigen':
            await showVoiceStatistics();
            break;
        default:
            vscode.window.showInformationMessage(`Aktion "${selected}" wird implementiert...`);
    }
}
async function showVoiceStatistics() {
    if (!state.voiceController) {
        vscode.window.showErrorMessage('Voice Controller nicht verfügbar.');
        return;
    }
    const message = `
🎤 Voice Control Statistiken:

📊 Aktivierungszeit: 0s
🎯 Wake Word Erkennungen: 0
💬 Verarbeitete Befehle: 0
🎵 TTS Ausgaben: 0
⚡ Durchschnittliche Reaktionszeit: 0ms
🔧 Experimentelle Features: 0
  `.trim();
    vscode.window.showInformationMessage(message);
}
// Experimental command handlers
async function handleExperimentalEmotionAnalysis() {
    if (!state.experimentalFeatures) {
        vscode.window.showErrorMessage('Experimentelle Features nicht verfügbar.');
        return;
    }
    const testText = await vscode.window.showInputBox({
        prompt: 'Geben Sie Text für Emotion-Analyse ein:',
        placeHolder: 'z.B. "Ich bin frustriert mit diesem Code"'
    });
    if (!testText)
        return;
    try {
        const emotion = await state.experimentalFeatures.detectEmotion(testText);
        vscode.window.showInformationMessage(`🧠 Emotion: ${emotion.primary} (Confidence: ${(emotion.confidence * 100).toFixed(1)}%)`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Emotion-Analyse fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleExperimentalContextEnhancement() {
    if (!state.experimentalFeatures) {
        vscode.window.showErrorMessage('Experimentelle Features nicht verfügbar.');
        return;
    }
    const testText = await vscode.window.showInputBox({
        prompt: 'Geben Sie Text für Kontext-Erweiterung ein:',
        placeHolder: 'z.B. "Erkläre mir diese Funktion"'
    });
    if (!testText)
        return;
    try {
        const context = {
            project: vscode.workspace.name || 'unknown',
            file: vscode.window.activeTextEditor?.document.fileName || 'unknown',
            userExpertise: 'intermediate',
            recentCommands: ['code_review', 'explanation']
        };
        const enhanced = await state.experimentalFeatures.enhanceContext(testText, context);
        vscode.window.showInformationMessage(`🔍 Erweiterter Text: ${enhanced.transcript}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Kontext-Erweiterung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleExperimentalAdaptiveRouting() {
    if (!state.experimentalRouting) {
        vscode.window.showErrorMessage('Experimentelles Routing nicht verfügbar.');
        return;
    }
    const prompt = await vscode.window.showInputBox({
        prompt: 'Geben Sie einen Prompt für adaptives Routing ein:',
        placeHolder: 'z.B. "Optimiere diesen Code für Performance"'
    });
    if (!prompt)
        return;
    try {
        const context = {
            userExpertise: 'intermediate',
            projectType: 'web_application',
            urgency: 'normal'
        };
        const decision = await state.experimentalRouting.contextAwareRouting(prompt, context);
        vscode.window.showInformationMessage(`🎯 Routing-Entscheidung: ${decision.model} (${decision.reasoning})`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Adaptives Routing fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleExperimentalIntentRecognition() {
    if (!state.experimentalNLP) {
        vscode.window.showErrorMessage('Experimenteller NLP nicht verfügbar.');
        return;
    }
    const testText = await vscode.window.showInputBox({
        prompt: 'Geben Sie Text für Intent-Erkennung ein:',
        placeHolder: 'z.B. "Schreibe eine Funktion für Array-Sortierung"'
    });
    if (!testText)
        return;
    try {
        const intent = await state.experimentalNLP.detectIntent(testText);
        vscode.window.showInformationMessage(`🎯 Intent: ${intent.primary} (Confidence: ${(intent.confidence * 100).toFixed(1)}%)`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Intent-Erkennung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleExperimentalPersonalityAdaptation() {
    if (!state.experimentalNLP) {
        vscode.window.showErrorMessage('Experimenteller NLP nicht verfügbar.');
        return;
    }
    try {
        const userPreferences = {
            expertise: 'intermediate',
            formality: 0.3,
            verbosity: 0.6,
            humor: 0.4
        };
        const personality = await state.experimentalNLP.adaptPersonality(userPreferences);
        vscode.window.showInformationMessage(`🎭 Angepasste Persönlichkeit: ${personality.style} (Formalität: ${personality.formality})`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Persönlichkeitsanpassung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleExperimentalMultilingualProcessing() {
    if (!state.experimentalFeatures) {
        vscode.window.showErrorMessage('Experimentelle Features nicht verfügbar.');
        return;
    }
    const testText = await vscode.window.showInputBox({
        prompt: 'Geben Sie Text für mehrsprachige Verarbeitung ein:',
        placeHolder: 'z.B. "Help me with this code" oder "Aide-moi avec ce code"'
    });
    if (!testText)
        return;
    try {
        const result = await state.experimentalFeatures.processMultilingual(testText);
        vscode.window.showInformationMessage(`🌍 Sprache: ${result.detectedLanguage} → ${result.translated ? 'Übersetzt' : 'Keine Übersetzung nötig'}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Mehrsprachige Verarbeitung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleExperimentalPerformanceMetrics() {
    if (!state.experimentalRouting) {
        vscode.window.showErrorMessage('Experimentelles Routing nicht verfügbar.');
        return;
    }
    try {
        const prompt = "Test prompt for performance metrics";
        const decision = await state.experimentalRouting.performanceBasedSelection(prompt);
        const message = `
📊 Performance-Metriken:

🎯 Modell: ${decision.model}
📈 Performance Score: ${(decision.performanceScore * 100).toFixed(1)}%
💰 Geschätzte Kosten: ${decision.estimatedCost.toFixed(4)}€
🎯 Confidence: ${(decision.confidence * 100).toFixed(1)}%
  `.trim();
        vscode.window.showInformationMessage(message);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Performance-Metriken fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleExperimentalShowUI() {
    try {
        const panel = vscode.window.createWebviewPanel('experimentalUI', '🧪 Guido Experimentelle Features', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        state.experimentalUI = new experimentalUI_1.ExperimentalUI(panel);
        // Set webview content
        panel.webview.html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Guido Experimentelle Features</title>
          <style>
            ${state.experimentalUI.generateExperimentalCSS()}
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: var(--vscode-editor-background);
              color: var(--vscode-editor-foreground);
              padding: 20px;
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${state.experimentalUI.generateExperimentalHTML()}
          <script>
            ${state.experimentalUI.generateExperimentalJS()}
          </script>
        </body>
      </html>
    `;
        vscode.window.showInformationMessage('🧪 Experimentelle UI geöffnet!');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Experimentelle UI fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleExperimentalTestFeatures() {
    try {
        // Test all experimental features
        const tests = [
            { name: 'Emotion Detection', handler: handleExperimentalEmotionAnalysis },
            { name: 'Context Enhancement', handler: handleExperimentalContextEnhancement },
            { name: 'Adaptive Routing', handler: handleExperimentalAdaptiveRouting },
            { name: 'Intent Recognition', handler: handleExperimentalIntentRecognition },
            { name: 'Personality Adaptation', handler: handleExperimentalPersonalityAdaptation },
            { name: 'Multilingual Processing', handler: handleExperimentalMultilingualProcessing },
            { name: 'Performance Metrics', handler: handleExperimentalPerformanceMetrics }
        ];
        vscode.window.showInformationMessage('🧪 Starte experimentelle Feature-Tests...');
        for (const test of tests) {
            try {
                await test.handler();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
            }
            catch (error) {
                console.warn(`Test ${test.name} failed:`, error);
            }
        }
        vscode.window.showInformationMessage('✅ Experimentelle Feature-Tests abgeschlossen!');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Feature-Tests fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function displayChatResult(result) {
    const panel = vscode.window.createWebviewPanel('chatResult', 'Guido Chat Result', vscode.ViewColumn.One, {
        enableScripts: true
    });
    panel.webview.html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Chat Result</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 20px;
            margin: 0;
          }
          .result {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <h2>Guido Antwort:</h2>
        <div class="result">${result.content || 'Keine Antwort erhalten'}</div>
        <p><strong>Modell:</strong> ${result.model || 'Unbekannt'}</p>
        <p><strong>Provider:</strong> ${result.provider || 'Unbekannt'}</p>
      </body>
    </html>
  `;
}
// Helper function to get active chat targets (simplified)
function getActiveChatTargets() {
    return []; // Simplified implementation
}
/**
 * Phase 3: Advanced AI Capabilities Command Handlers
 */
async function handleMultiModelChatCommand() {
    try {
        if (!state.multiModelManager) {
            vscode.window.showErrorMessage('Multi-Model Manager nicht verfügbar');
            return;
        }
        const prompt = await vscode.window.showInputBox({
            prompt: "Prompt für Multi-Model Vergleich",
            placeHolder: "Geben Sie Ihren Prompt ein..."
        });
        if (!prompt)
            return;
        const strategy = await vscode.window.showQuickPick([
            { label: 'parallel', description: 'Alle Modelle gleichzeitig ausführen' },
            { label: 'sequential', description: 'Modelle nacheinander mit Kontext' },
            { label: 'consensus', description: 'Konsens aus mehreren Antworten bilden' },
            { label: 'comparison', description: 'Vergleichende Analyse' }
        ], {
            placeHolder: 'Wählen Sie eine Strategie'
        });
        if (!strategy)
            return;
        const models = ['gpt-4', 'claude-3-sonnet', 'claude-3-haiku'];
        const response = await state.multiModelManager.executeMultiModel({
            prompt,
            models,
            strategy: strategy.label
        });
        // Display results in chat UI
        const resultMessage = `Multi-Model Ergebnis (${strategy.label}):\n\n` +
            response.map(r => `**${r.modelId}:**\n${r.response}\n\n`).join('---\n');
        vscode.window.showInformationMessage(`Multi-Model Chat ausgeführt mit ${response.length} Modellen`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Multi-Model Chat Fehler: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleCreateTaskPlanCommand() {
    try {
        if (!state.taskPlanner) {
            vscode.window.showErrorMessage('Task Planner nicht verfügbar');
            return;
        }
        const objective = await vscode.window.showInputBox({
            prompt: "Beschreiben Sie Ihr Ziel",
            placeHolder: "z.B. 'Erstelle eine React-Komponente für...' oder 'Refaktoriere diese Klasse...'"
        });
        if (!objective)
            return;
        const projectType = await vscode.window.showQuickPick([
            'web-frontend', 'web-backend', 'mobile-app', 'desktop-app', 'library', 'other'
        ], {
            placeHolder: 'Projekttyp auswählen'
        });
        const qualityLevel = await vscode.window.showQuickPick([
            { label: 'fast', description: 'Schnelle Ergebnisse' },
            { label: 'balanced', description: 'Ausgewogene Qualität und Geschwindigkeit' },
            { label: 'thorough', description: 'Höchste Qualität, mehr Zeit' }
        ], {
            placeHolder: 'Qualitätsstufe wählen'
        });
        const plan = await state.taskPlanner.createPlan({
            objective,
            context: {
                projectType,
                language: 'typescript',
                framework: 'vscode-extension'
            },
            preferences: {
                qualityLevel: qualityLevel?.label
            }
        });
        // Show plan in a new document
        const doc = await vscode.workspace.openTextDocument({
            content: `# Task Plan: ${plan.title}\n\n${plan.description}\n\n## Tasks:\n\n` +
                plan.tasks.map((task, i) => `${i + 1}. **${task.title}** (${task.estimatedTime}min)\n   ${task.description}`).join('\n\n'),
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(`Task Plan "${plan.title}" erstellt mit ${plan.tasks.length} Aufgaben`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Task Plan Fehler: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleExecuteTaskPlanCommand(planId) {
    try {
        if (!state.taskPlanner) {
            vscode.window.showErrorMessage('Task Planner nicht verfügbar');
            return;
        }
        vscode.window.showInformationMessage('Task Plan Ausführung wird simuliert...');
        // Simplified execution simulation
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Task Plan wird ausgeführt...",
            cancellable: true
        }, async (progress) => {
            for (let i = 0; i < 5; i++) {
                progress.report({ increment: 20, message: `Schritt ${i + 1} von 5` });
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        });
        vscode.window.showInformationMessage('✅ Task Plan Ausführung abgeschlossen!');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Task Plan Ausführung Fehler: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleOptimizePromptCommand() {
    try {
        if (!state.promptingManager) {
            vscode.window.showErrorMessage('Prompting Manager nicht verfügbar');
            return;
        }
        const originalPrompt = await vscode.window.showInputBox({
            prompt: "Prompt zum Optimieren",
            placeHolder: "Geben Sie Ihren ursprünglichen Prompt ein..."
        });
        if (!originalPrompt)
            return;
        const objective = await vscode.window.showInputBox({
            prompt: "Was möchten Sie mit diesem Prompt erreichen?",
            placeHolder: "Beschreiben Sie das gewünschte Ergebnis..."
        });
        if (!objective)
            return;
        const optimized = await state.promptingManager.optimizePrompt({
            original_prompt: originalPrompt,
            objective
        });
        // Show optimization results
        const resultContent = `# Prompt Optimierung\n\n` +
            `## Original:\n${originalPrompt}\n\n` +
            `## Optimiert:\n${optimized.optimized_prompt}\n\n` +
            `## Verbesserungen:\n${optimized.improvements.map(i => `- ${i}`).join('\n')}\n\n` +
            `## Strategie: ${optimized.strategy_used}\n` +
            `## Konfidenz: ${(optimized.confidence * 100).toFixed(1)}%\n` +
            `## Erwartete Qualitätssteigerung: ${(optimized.expected_quality_gain * 100).toFixed(1)}%\n\n` +
            `## Begründung:\n${optimized.reasoning}`;
        const doc = await vscode.workspace.openTextDocument({
            content: resultContent,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Prompt Optimierung Fehler: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleAnalyzeCodeCommand() {
    try {
        if (!state.codeAnalyzer) {
            vscode.window.showErrorMessage('Code Analyzer nicht verfügbar');
            return;
        }
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage('Keine aktive Datei geöffnet');
            return;
        }
        const focus = await vscode.window.showQuickPick([
            { label: 'quality', description: 'Code-Qualität und Wartbarkeit' },
            { label: 'security', description: 'Sicherheitslücken und Vulnerabilities' },
            { label: 'performance', description: 'Performance-Optimierungen' },
            { label: 'architecture', description: 'Architektur und Design-Patterns' },
            { label: 'documentation', description: 'Dokumentation und Kommentare' },
            { label: 'testing', description: 'Test-Abdeckung und Qualität' }
        ], {
            placeHolder: 'Analysefokus wählen'
        });
        if (!focus)
            return;
        const depth = await vscode.window.showQuickPick([
            { label: 'shallow', description: 'Oberflächliche Analyse' },
            { label: 'medium', description: 'Mittlere Tiefe' },
            { label: 'deep', description: 'Tiefgehende Analyse' }
        ], {
            placeHolder: 'Analysetiefe wählen'
        });
        if (!depth)
            return;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Code wird analysiert...",
            cancellable: false
        }, async () => {
            const result = await state.codeAnalyzer.analyzeCode({
                type: 'single_file',
                target: activeEditor.document.fileName,
                focus: focus.label,
                depth: depth.label,
                includeContext: true
            });
            // Show analysis results
            const resultContent = `# Code-Analyse Ergebnis\n\n` +
                `Datei: ${activeEditor.document.fileName}\n` +
                `Fokus: ${focus.description}\n` +
                `Tiefe: ${depth.description}\n` +
                `Konfidenz: ${(result.confidence * 100).toFixed(1)}%\n\n` +
                `## Zusammenfassung\n${result.summary}\n\n` +
                `## Befunde (${result.findings.length})\n\n` +
                result.findings.map(f => `### ${f.message} (${f.severity})\n` +
                    `**Kategorie:** ${f.category}\n` +
                    `**Zeile:** ${f.location.line}\n` +
                    `**Beschreibung:** ${f.description}\n`).join('\n') +
                `\n## Empfehlungen (${result.recommendations.length})\n\n` +
                result.recommendations.map(r => `### ${r.title} (${r.priority})\n` +
                    `**Typ:** ${r.type}\n` +
                    `**Aufwand:** ${r.estimated_effort}\n` +
                    `**Beschreibung:** ${r.description}\n` +
                    `**Implementierung:** ${r.implementation}\n` +
                    `**Vorteile:** ${r.benefits.join(', ')}\n`).join('\n') +
                `\n## Metriken\n` +
                `- Zeilen: ${result.metrics.lines_of_code}\n` +
                `- Zyklomatische Komplexität: ${result.metrics.cyclomatic_complexity}\n` +
                `- Wartbarkeitsindex: ${result.metrics.maintainability_index.toFixed(1)}\n` +
                `- Technische Schuld: ${result.metrics.technical_debt.toFixed(1)}\n`;
            const doc = await vscode.workspace.openTextDocument({
                content: resultContent,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
        });
    }
    catch (error) {
        vscode.window.showErrorMessage(`Code-Analyse Fehler: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleReviewPullRequestCommand() {
    try {
        vscode.window.showInformationMessage('Pull Request Review Feature wird in einer zukünftigen Version implementiert');
    }
    catch (error) {
        vscode.window.showErrorMessage(`PR Review Fehler: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=extension.js.map