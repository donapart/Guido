"use strict";
/**
 * VSCode Extension Entry Point for Model Router
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
const config_1 = require("./config");
const router_1 = require("./router");
const secret_1 = require("./secret");
const price_1 = require("./price");
const promptClassifier_1 = require("./promptClassifier");
const openaiCompat_1 = require("./providers/openaiCompat");
const ollama_1 = require("./providers/ollama");
const server_1 = require("./mcp/server");
let state;
async function activate(context) {
    console.log("Aktiviere Model Router Extension...");
    // Initialize extension state
    state = {
        providers: new Map(),
        statusBar: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100),
        budgetManager: new price_1.BudgetManager(context.globalState),
        currentMode: "auto",
        outputChannel: vscode.window.createOutputChannel("Model Router"),
    };
    // Initialize secret management
    (0, secret_1.initializeSecrets)(context);
    // Setup status bar
    state.statusBar.command = "modelRouter.switchMode";
    state.statusBar.show();
    updateStatusBar();
    // Load initial configuration
    try {
        await loadConfiguration();
    }
    catch (error) {
        vscode.window.showErrorMessage(`Fehler beim Laden der Konfiguration: ${error instanceof Error ? error.message : String(error)}`);
        // Create default config if none exists
        await createDefaultConfigIfNeeded();
    }
    // Register commands
    registerCommands(context);
    // Watch for configuration changes
    const configWatcher = vscode.workspace.onDidChangeConfiguration(async (event) => {
        if (event.affectsConfiguration("modelRouter")) {
            await loadConfiguration();
        }
    });
    context.subscriptions.push(state.statusBar, state.outputChannel, configWatcher);
    // Start MCP server if enabled
    await startMcpServerIfEnabled();
    vscode.window.showInformationMessage("Model Router Extension aktiviert!");
}
function deactivate() {
    if (state.mcpServer) {
        state.mcpServer.stop();
    }
    console.log("Model Router Extension deaktiviert");
}
/**
 * Register all VSCode commands
 */
function registerCommands(context) {
    const commands = [
        vscode.commands.registerCommand("modelRouter.chat", handleChatCommand),
        vscode.commands.registerCommand("modelRouter.routeOnce", handleRouteOnceCommand),
        vscode.commands.registerCommand("modelRouter.setApiKey", handleSetApiKeyCommand),
        vscode.commands.registerCommand("modelRouter.switchMode", handleSwitchModeCommand),
        vscode.commands.registerCommand("modelRouter.openConfig", handleOpenConfigCommand),
        vscode.commands.registerCommand("modelRouter.showCosts", handleShowCostsCommand),
        vscode.commands.registerCommand("modelRouter.testConnection", handleTestConnectionCommand),
        vscode.commands.registerCommand("modelRouter.classifyPrompt", handleClassifyPromptCommand),
        vscode.commands.registerCommand("modelRouter.simulateRouting", handleSimulateRoutingCommand),
        vscode.commands.registerCommand("modelRouter.importApiKeys", handleImportApiKeysCommand),
        vscode.commands.registerCommand("modelRouter.exportConfig", handleExportConfigCommand),
    ];
    context.subscriptions.push(...commands);
}
/**
 * Load and apply configuration
 */
async function loadConfiguration() {
    try {
        const configPath = getConfigPath();
        const loader = config_1.ConfigLoader.getInstance();
        const config = loader.loadConfig(configPath);
        const profile = config.profiles[config.activeProfile];
        // Clear existing providers
        state.providers.clear();
        // Initialize providers
        await initializeProviders(profile);
        // Create router
        state.router = new router_1.ModelRouter(profile, state.providers);
        // Initialize classifier if enabled
        const classifierEnabled = vscode.workspace
            .getConfiguration("modelRouter")
            .get("enablePromptClassifier", false);
        if (classifierEnabled) {
            const ollamaProvider = state.providers.get("ollama");
            state.classifier = new promptClassifier_1.PromptClassifier({
                enabled: true,
                useLocalModel: !!ollamaProvider,
                localModelProvider: "ollama",
                localModelName: "llama3.3:70b-instruct",
                fallbackToHeuristic: true,
                cacheResults: true,
            }, ollamaProvider);
        }
        // Update mode from config
        state.currentMode = profile.mode;
        updateStatusBar();
        state.outputChannel.appendLine(`Konfiguration geladen: ${profile.providers.length} Provider, Modus: ${profile.mode}`);
    }
    catch (error) {
        if (error instanceof config_1.ConfigError) {
            throw error;
        }
        throw new Error(`Unerwarteter Fehler beim Laden der Konfiguration: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Initialize providers from configuration
 */
async function initializeProviders(profile) {
    const secretHelper = (0, secret_1.getSecretHelper)();
    for (const providerConfig of profile.providers) {
        try {
            let provider;
            switch (providerConfig.kind) {
                case "openai-compat": {
                    const apiKey = await secretHelper.getProviderApiKey(providerConfig.id);
                    if (!apiKey) {
                        state.outputChannel.appendLine(`⚠️ Kein API Key für Provider ${providerConfig.id}`);
                        continue;
                    }
                    provider = new openaiCompat_1.OpenAICompatProvider({
                        ...providerConfig,
                        kind: "openai-compat",
                        apiKey,
                        models: providerConfig.models.map(m => m.name),
                    });
                    break;
                }
                case "ollama": {
                    provider = new ollama_1.OllamaProvider({
                        ...providerConfig,
                        kind: "ollama",
                        models: providerConfig.models.map(m => m.name),
                    });
                    break;
                }
                default:
                    state.outputChannel.appendLine(`⚠️ Unbekannter Provider-Typ: ${providerConfig.kind}`);
                    continue;
            }
            state.providers.set(providerConfig.id, provider);
            state.outputChannel.appendLine(`✓ Provider initialisiert: ${providerConfig.id}`);
        }
        catch (error) {
            state.outputChannel.appendLine(`❌ Fehler bei Provider ${providerConfig.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
/**
 * Update status bar display
 */
function updateStatusBar() {
    const mode = state.currentMode;
    const providerCount = state.providers.size;
    const icon = mode === "privacy-strict" || mode === "local-only" ? "$(shield)" : "$(rocket)";
    state.statusBar.text = `${icon} Router: ${mode} (${providerCount})`;
    state.statusBar.tooltip = `Model Router - Modus: ${mode}, Provider: ${providerCount}`;
}
/**
 * Get configuration file path
 */
function getConfigPath() {
    const configSetting = vscode.workspace.getConfiguration("modelRouter").get("configPath");
    if (!configSetting) {
        throw new Error("Konfigurationspfad nicht gesetzt");
    }
    // Replace workspace folder variable
    if (configSetting.includes("${workspaceFolder}")) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error("Kein Workspace-Ordner geöffnet");
        }
        return configSetting.replace("${workspaceFolder}", workspaceFolder.uri.fsPath);
    }
    return configSetting;
}
/**
 * Create default configuration if needed
 */
async function createDefaultConfigIfNeeded() {
    try {
        const configPath = getConfigPath();
        const loader = config_1.ConfigLoader.getInstance();
        const answer = await vscode.window.showQuickPick(["Ja, Standard-Konfiguration erstellen", "Nein, manuell konfigurieren"], { placeHolder: "Soll eine Standard-Konfiguration erstellt werden?" });
        if (answer?.startsWith("Ja")) {
            loader.createDefaultConfig(configPath);
            vscode.window.showInformationMessage(`Standard-Konfiguration erstellt: ${configPath}`);
            // Try to load the new config
            await loadConfiguration();
        }
    }
    catch (error) {
        state.outputChannel.appendLine(`Fehler beim Erstellen der Standard-Konfiguration: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Start MCP server if enabled
 */
async function startMcpServerIfEnabled() {
    // Check if MCP should be enabled (could be a configuration option)
    const mcpEnabled = process.argv.includes("--mcp");
    if (mcpEnabled && state.router) {
        try {
            state.mcpServer = (0, server_1.createModelRouterMcpServer)(state.router, state.providers);
            await state.mcpServer.start();
            state.outputChannel.appendLine("✓ MCP Server gestartet");
        }
        catch (error) {
            state.outputChannel.appendLine(`❌ MCP Server Fehler: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
// Command Handlers
async function handleChatCommand() {
    if (!state.router) {
        vscode.window.showErrorMessage("Router nicht initialisiert");
        return;
    }
    const prompt = await vscode.window.showInputBox({
        prompt: "Frage oder Anweisung an die KI eingeben",
        placeHolder: "z.B. Erkläre mir async/await in JavaScript",
    });
    if (!prompt)
        return;
    const editor = vscode.window.activeTextEditor;
    const context = {
        prompt,
        lang: editor?.document.languageId,
        filePath: editor?.document.fileName,
        fileSizeKB: editor ? Buffer.byteLength(editor.document.getText(), "utf8") / 1024 : undefined,
        mode: state.currentMode,
    };
    try {
        // Route the request
        const result = await state.router.route(context);
        // Estimate cost
        const cost = price_1.PriceCalculator.estimateCost(prompt, result.model, result.providerId);
        // Show routing info
        state.outputChannel.clear();
        state.outputChannel.appendLine(`🎯 Routing für: "${prompt.slice(0, 50)}..."`);
        state.outputChannel.appendLine(`📍 Gewähltes Modell: ${result.providerId}:${result.modelName}`);
        state.outputChannel.appendLine(`💰 Geschätzte Kosten: $${cost.totalCost.toFixed(4)}`);
        state.outputChannel.appendLine(`🧠 Begründung: ${result.reasoning.join(", ")}`);
        state.outputChannel.appendLine("─".repeat(50));
        state.outputChannel.show(true);
        // Execute chat
        let responseText = "";
        for await (const chunk of result.provider.chat(result.modelName, [
            { role: "user", content: prompt }
        ])) {
            if (chunk.type === "text" && chunk.data) {
                responseText += chunk.data;
                state.outputChannel.append(chunk.data);
            }
            else if (chunk.type === "done") {
                state.outputChannel.appendLine("\n" + "─".repeat(50));
                state.outputChannel.appendLine("✅ Chat abgeschlossen");
                // Record actual cost
                if (chunk.data?.usage) {
                    const actualCost = price_1.PriceCalculator.calculateActualCost(chunk.data.usage, result.model.price, result.modelName, result.providerId);
                    await state.budgetManager.recordTransaction(result.providerId, result.modelName, actualCost.totalCost, actualCost.inputTokens, actualCost.outputTokens);
                }
                break;
            }
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Chat-Fehler: ${error instanceof Error ? error.message : String(error)}`);
        state.outputChannel.appendLine(`❌ Fehler: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleRouteOnceCommand() {
    if (!state.router) {
        vscode.window.showErrorMessage("Router nicht initialisiert");
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("Kein aktiver Editor");
        return;
    }
    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
    if (!text.trim()) {
        vscode.window.showErrorMessage("Kein Text zum Routen gefunden");
        return;
    }
    const context = {
        prompt: text,
        lang: editor.document.languageId,
        filePath: editor.document.fileName,
        fileSizeKB: Buffer.byteLength(text, "utf8") / 1024,
        mode: state.currentMode,
    };
    try {
        const simulation = await state.router.simulateRoute(context);
        if (simulation.result) {
            const result = simulation.result;
            const cost = price_1.PriceCalculator.estimateCost(text, result.model, result.providerId);
            const message = `🎯 Gewähltes Modell: ${result.providerId}:${result.modelName}\n` +
                `💰 Geschätzte Kosten: $${cost.totalCost.toFixed(4)}\n` +
                `📊 Score: ${result.score}\n` +
                `🧠 Begründung: ${result.reasoning.join(", ")}`;
            vscode.window.showInformationMessage(message, { modal: false });
        }
        else {
            vscode.window.showWarningMessage("Kein passendes Modell gefunden");
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Routing-Fehler: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleSetApiKeyCommand() {
    const secretHelper = (0, secret_1.getSecretHelper)();
    // Get provider ID
    const providerId = await vscode.window.showInputBox({
        prompt: "Provider-ID eingeben",
        placeHolder: "z.B. openai, deepseek, grok",
    });
    if (!providerId)
        return;
    // Get API key
    const apiKey = await vscode.window.showInputBox({
        prompt: `API Key für ${providerId} eingeben`,
        password: true,
        placeHolder: "sk-...",
    });
    if (!apiKey)
        return;
    try {
        // Validate key format
        const validation = secretHelper.validateApiKey(providerId, apiKey);
        if (!validation.valid) {
            const proceed = await vscode.window.showWarningMessage(`API Key Warnung: ${validation.error}. Trotzdem speichern?`, "Ja", "Nein");
            if (proceed !== "Ja")
                return;
        }
        // Store the key
        await secretHelper.setProviderApiKey(providerId, apiKey);
        vscode.window.showInformationMessage(`✓ API Key für ${providerId} gespeichert`);
        // Reload configuration to initialize the provider
        await loadConfiguration();
    }
    catch (error) {
        vscode.window.showErrorMessage(`Fehler beim Speichern des API Keys: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleSwitchModeCommand() {
    const modes = [
        { label: "auto", description: "Automatische Modellauswahl" },
        { label: "speed", description: "Schnellste Modelle bevorzugen" },
        { label: "quality", description: "Hochwertigste Modelle bevorzugen" },
        { label: "cheap", description: "Günstigste Modelle bevorzugen" },
        { label: "local-only", description: "Nur lokale Modelle verwenden" },
        { label: "offline", description: "Offline-Modus (nur lokal)" },
        { label: "privacy-strict", description: "Strenger Datenschutz-Modus" },
    ];
    const selected = await vscode.window.showQuickPick(modes, {
        placeHolder: `Aktueller Modus: ${state.currentMode}`,
    });
    if (selected) {
        state.currentMode = selected.label;
        updateStatusBar();
        vscode.window.showInformationMessage(`Modus gewechselt zu: ${selected.label}`);
    }
}
async function handleOpenConfigCommand() {
    try {
        const configPath = getConfigPath();
        const uri = vscode.Uri.file(configPath);
        await vscode.window.showTextDocument(uri);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Fehler beim Öffnen der Konfiguration: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleShowCostsCommand() {
    try {
        const stats = await state.budgetManager.getSpendingStats();
        const usage = await state.budgetManager.getBudgetUsage();
        const message = `💰 Kosten-Übersicht:\n` +
            `Gesamt ausgegeben: $${stats.totalSpent.toFixed(4)}\n` +
            `Heute: $${usage.dailySpent.toFixed(4)}\n` +
            `Diesen Monat: $${usage.monthlySpent.toFixed(4)}\n` +
            `Transaktionen: ${stats.transactionCount}\n` +
            `Durchschnitt/Transaktion: $${stats.averagePerTransaction.toFixed(4)}`;
        vscode.window.showInformationMessage(message, { modal: true });
    }
    catch (error) {
        vscode.window.showErrorMessage(`Fehler beim Laden der Kosten: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleTestConnectionCommand() {
    const providerIds = Array.from(state.providers.keys());
    if (providerIds.length === 0) {
        vscode.window.showWarningMessage("Keine Provider konfiguriert");
        return;
    }
    const selected = await vscode.window.showQuickPick([...providerIds, "Alle testen"], { placeHolder: "Provider zum Testen auswählen" });
    if (!selected)
        return;
    const providersToTest = selected === "Alle testen"
        ? Array.from(state.providers.entries())
        : [[selected, state.providers.get(selected)]].filter(([_, provider]) => provider);
    state.outputChannel.clear();
    state.outputChannel.appendLine("🔍 Teste Provider-Verbindungen...");
    state.outputChannel.show();
    for (const [id, provider] of providersToTest) {
        if (!provider)
            continue;
        try {
            state.outputChannel.appendLine(`\nTeste ${id}...`);
            const available = await provider.isAvailable();
            if (available) {
                state.outputChannel.appendLine(`✅ ${id}: Verbindung erfolgreich`);
            }
            else {
                state.outputChannel.appendLine(`❌ ${id}: Nicht verfügbar`);
            }
            // Test with OpenAI provider if it has test method
            if ("testConnection" in provider && typeof provider.testConnection === "function") {
                const testResult = await provider.testConnection();
                if (testResult.success) {
                    state.outputChannel.appendLine(`✅ ${id}: API-Test erfolgreich`);
                }
                else {
                    state.outputChannel.appendLine(`❌ ${id}: API-Test fehlgeschlagen: ${testResult.error}`);
                }
            }
        }
        catch (error) {
            state.outputChannel.appendLine(`❌ ${id}: Fehler: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    state.outputChannel.appendLine("\n🏁 Verbindungstest abgeschlossen");
}
async function handleClassifyPromptCommand() {
    if (!state.classifier) {
        vscode.window.showErrorMessage("Prompt-Classifier nicht aktiviert");
        return;
    }
    const prompt = await vscode.window.showInputBox({
        prompt: "Prompt zur Klassifikation eingeben",
        placeHolder: "z.B. Schreibe Unit Tests für diese Funktion",
    });
    if (!prompt)
        return;
    try {
        const result = await state.classifier.classify(prompt);
        const message = `🔍 Prompt-Klassifikation:\n` +
            `Kategorie: ${result.class}\n` +
            `Konfidenz: ${(result.confidence * 100).toFixed(1)}%\n` +
            `Komplexität: ${result.characteristics.complexity}\n` +
            `Kreativität: ${result.characteristics.creativity}\n` +
            `Technisch: ${result.characteristics.technical}\n` +
            `Empfohlene Fähigkeiten: ${result.suggestedCapabilities.join(", ")}`;
        vscode.window.showInformationMessage(message, { modal: true });
    }
    catch (error) {
        vscode.window.showErrorMessage(`Klassifikation fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleSimulateRoutingCommand() {
    if (!state.router) {
        vscode.window.showErrorMessage("Router nicht initialisiert");
        return;
    }
    const prompt = await vscode.window.showInputBox({
        prompt: "Prompt für Routing-Simulation eingeben",
        placeHolder: "z.B. Optimiere diese SQL-Abfrage für bessere Performance",
    });
    if (!prompt)
        return;
    try {
        const simulation = await state.router.simulateRoute({ prompt, mode: state.currentMode });
        state.outputChannel.clear();
        state.outputChannel.appendLine("🎯 Routing-Simulation");
        state.outputChannel.appendLine("=".repeat(50));
        if (simulation.result) {
            const result = simulation.result;
            state.outputChannel.appendLine(`\n✅ Gewähltes Modell: ${result.providerId}:${result.modelName}`);
            state.outputChannel.appendLine(`📊 Score: ${result.score}`);
            state.outputChannel.appendLine(`🧠 Begründung: ${result.reasoning.join(", ")}`);
        }
        state.outputChannel.appendLine("\n🎯 Alternativen:");
        simulation.alternatives.slice(0, 5).forEach((alt, i) => {
            const status = alt.available ? "✅" : "❌";
            state.outputChannel.appendLine(`${i + 1}. ${status} ${alt.providerId}:${alt.modelName} (Score: ${alt.score})`);
        });
        state.outputChannel.show();
    }
    catch (error) {
        vscode.window.showErrorMessage(`Simulation fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleImportApiKeysCommand() {
    try {
        const secretHelper = (0, secret_1.getSecretHelper)();
        const result = await secretHelper.importFromEnvironment();
        const message = `API-Key Import:\n` +
            `✅ Importiert: ${result.imported.join(", ") || "keine"}\n` +
            `⏭️ Übersprungen: ${result.skipped.join(", ") || "keine"}`;
        vscode.window.showInformationMessage(message);
        if (result.imported.length > 0) {
            await loadConfiguration();
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Import fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function handleExportConfigCommand() {
    try {
        const secretHelper = (0, secret_1.getSecretHelper)();
        const config = await secretHelper.exportConfiguration();
        const content = JSON.stringify(config, null, 2);
        const doc = await vscode.workspace.openTextDocument({
            content,
            language: "json",
        });
        await vscode.window.showTextDocument(doc);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Export fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=extension.js.map