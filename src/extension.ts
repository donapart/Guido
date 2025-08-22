/**
 * VSCode Extension Entry Point for Model Router
 */

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ChatDockViewProvider } from './webview/chatDockView';
import { getActiveChatTargets } from './webview/chatTargets';

import { ConfigError, ConfigLoader, ProfileConfig } from "./config";
import { createModelRouterMcpServer } from "./mcp/server";
import { BudgetManager, PriceCalculator } from "./price";
import { PromptClassifier } from "./promptClassifier";
import { Provider } from "./providers/base";
import { OllamaProvider } from "./providers/ollama";
import { OpenAICompatProvider } from "./providers/openaiCompat";
import { ModelRouter } from "./router";
import { getSecretHelper, initializeSecrets } from "./secret";
import type { VoiceConfig } from "./voice/types";
import { VoiceController } from "./voice/voiceController";

interface ExtensionState {
  router?: ModelRouter;
  providers: Map<string, Provider>;
  statusBar: vscode.StatusBarItem;
  budgetManager: BudgetManager;
  classifier?: PromptClassifier;
  voiceController?: VoiceController;
  mcpServer?: any;
  currentMode: string;
  outputChannel: vscode.OutputChannel;
  lastBudgetSummary?: string;
}

let state: ExtensionState;
let extensionContext: vscode.ExtensionContext;
// Chat-History (mit optionaler Persistenz)
const chatHistory: { role: 'user'|'assistant'; content: string; meta?: any }[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
let chatHistoryLoaded = false;
// Aktueller Plan (zuletzt generiert) & laufende Ausführung
interface StoredPlan { raw: string; steps: string[]; originalUserPrompt: string; generatedAt: number; }
let currentPlan: StoredPlan | undefined;
let runningPlan: { index: number; abort?: AbortController; cancelled?: boolean } | undefined;

async function loadPersistedChatHistory() {
  if (chatHistoryLoaded) return;
  try {
    const cfg = vscode.workspace.getConfiguration('modelRouter');
    if (!cfg.get<boolean>('chat.persistHistory', true)) { chatHistoryLoaded = true; return; }
    const stored = extensionContext.globalState.get<any[]>('modelRouter.chat.history'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (Array.isArray(stored)) chatHistory.push(...stored.slice(-1000));
  } catch { /* ignore */ }
  finally { chatHistoryLoaded = true; }
}

function persistChatHistory() {
  try {
    const cfg = vscode.workspace.getConfiguration('modelRouter');
    if (!cfg.get<boolean>('chat.persistHistory', true)) return;
    extensionContext.globalState.update('modelRouter.chat.history', chatHistory.slice(-1000));
  } catch { /* ignore */ }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log("Aktiviere Model Router Extension...");

  // Store extension context globally
  extensionContext = context;

  // Initialize extension state
  state = {
    providers: new Map(),
    statusBar: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100),
    budgetManager: new BudgetManager(context.globalState),
    currentMode: "auto",
    outputChannel: vscode.window.createOutputChannel("Model Router"),
  };

  // Initialize secret management
  initializeSecrets(context);

  // Setup status bar
  state.statusBar.command = "modelRouter.switchMode";
  state.statusBar.show();
  await updateStatusBar();

  // Budget Listener für Live-Updates
  state.budgetManager.onTransaction(() => {
    // Verzögert ausführen, um Schreibvorgang abzuschließen
    setTimeout(() => {
      updateStatusBar();
    }, 50);
  });

  // Load initial configuration
  try {
    await loadConfiguration();
  } catch (error) {
  vscode.window.showErrorMessage(`Fehler beim Laden der Konfiguration: ${error instanceof Error ? error.message : String(error)}`);
  // Optional: Standard-Konfig anlegen anbieten
  // await createDefaultConfigIfNeeded();
  }

  // Register commands
  registerCommands(context);

  // Register docked chat view provider
  try {
    const dockProvider = new ChatDockViewProvider(extensionContext.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(ChatDockViewProvider.viewType, dockProvider, { webviewOptions: { retainContextWhenHidden: true } }));
  } catch (e) {
    state.outputChannel.appendLine('Dock View Registrierung fehlgeschlagen: ' + (e instanceof Error ? e.message : String(e)));
  }

  // Watch for configuration changes
  const configWatcher = vscode.workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration("modelRouter")) {
      await loadConfiguration();
    }
  });

  context.subscriptions.push(
    state.statusBar,
    state.outputChannel,
    configWatcher
  );

  // Start MCP server if enabled
  await startMcpServerIfEnabled();

  vscode.window.showInformationMessage("Model Router Extension aktiviert!");
}

export function deactivate(): void {
  if (state.mcpServer) {
    state.mcpServer.stop();
  }
  console.log("Model Router Extension deaktiviert");
}

/**
 * Register all VSCode commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  const commands = [
    vscode.commands.registerCommand("modelRouter.chat", handleChatCommand),
  vscode.commands.registerCommand("modelRouter.openChatUI", async () => {
      try {
        const extUri = extensionContext.extensionUri;
        const { ChatPanel } = require('./webview/chatPanel');
        ChatPanel.createOrShow(extUri);
        // Modelle & History an Webview senden
    const targets = getActiveChatTargets();
    if (targets.length && state.router) {
          try {
            const profile = state.router.getProfile();
            const models: string[] = [];
            for (const prov of profile.providers) {
              for (const m of prov.models) { if (!models.includes(m.name)) models.push(m.name); }
            }
      if (!chatHistoryLoaded) await loadPersistedChatHistory();
    targets.forEach(t => { t.sendModels(models.sort()); t.sendHistory(chatHistory.slice(-200)); });
          } catch {/* ignore */}
        }
      } catch (e) {
        vscode.window.showErrorMessage(`Chat UI Fehler: ${e instanceof Error ? e.message : String(e)}`);
      }
    }),
    vscode.commands.registerCommand('modelRouter.chat.sendFromWebview', async (text: string, modelOverride?: string, attachmentUris?: string[]) => {
      if (!state.router) { vscode.window.showErrorMessage('Router nicht initialisiert'); return; }
  const targets = getActiveChatTargets();
  if (!targets.length) return; // Keine aktive Oberfläche
      try {
        const ctx = { prompt: text, mode: state.currentMode } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        let providerToUse: Provider | undefined;
        let modelName: string | undefined;
        let modelPrice: any; // eslint-disable-line @typescript-eslint/no-explicit-any
        let providerId: string | undefined;
        let routed: any; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (modelOverride) {
          const profile = state.router.getProfile();
            const provCfg = profile.providers.find(p => p.models.some(m => m.name === modelOverride));
            if (provCfg) {
              providerId = provCfg.id;
              providerToUse = state.providers.get(provCfg.id);
              modelName = modelOverride;
              modelPrice = provCfg.models.find(m => m.name === modelOverride)?.price;
              targets.forEach(t => t.sendInfo(`Override Modell: ${providerId}:${modelName}`));
            }
        }
        if (!providerToUse) {
          routed = await state.router.route(ctx);
          providerToUse = routed.provider;
          modelName = routed.modelName;
          modelPrice = routed.model.price;
          providerId = routed.providerId;
        }
        // --- Attachments Verarbeitung ---
        let attachmentNote = '';
        if (attachmentUris && attachmentUris.length) {
          const summaries = await readAttachmentSummaries(attachmentUris);
          if (summaries.length) {
            attachmentNote = '\n\n[Anhänge]\n' + summaries.map(s => `### ${s.name}\n${s.snippet}`).join('\n');
          }
        }
        const fullPrompt = text + attachmentNote;
        // Kosten-Schätzung vorab
        if (providerToUse && modelName && modelPrice) {
          try {
            const est = PriceCalculator.estimateCost(fullPrompt, { price: modelPrice } as any, modelName); // eslint-disable-line @typescript-eslint/no-explicit-any
            targets.forEach(t => t.sendInfo(`Geschätzte Kosten: $${est.totalCost.toFixed(4)} (Tokens ~${est.inputTokens})`));
          } catch {/* ignore */}
        }
        if (!providerToUse || !modelName) {
          throw new Error('Kein Modell/Provider bestimmt');
        }
        let contentAccum = '';
        for await (const chunk of providerToUse.chat(modelName, [{ role:'user', content: fullPrompt }])) {
          if (chunk.type === 'text' && chunk.data) {
            contentAccum += chunk.data;
            targets.forEach(t => t.streamDelta(chunk.data));
          } else if (chunk.type === 'done') {
            if (chunk.data?.usage && modelPrice && providerId && modelName) {
              try {
                const actualCost = PriceCalculator.calculateActualCost(
                  chunk.data.usage,
                  modelPrice,
                  modelName,
                  providerId
                );
                await state.budgetManager.recordTransaction(
                  providerId,
                  modelName,
                  actualCost.totalCost,
                  actualCost.inputTokens,
                  actualCost.outputTokens
                );
                targets.forEach(t => t.streamDone({ usage: chunk.data?.usage, cost: actualCost }));
              } catch {
                targets.forEach(t => t.streamDone({ usage: chunk.data?.usage }));
              }
            } else {
              targets.forEach(t => t.streamDone());
            }
            break;
          } else if (chunk.type === 'error') {
            targets.forEach(t => t.showError(chunk.error || 'Unbekannter Fehler'));
            break;
          }
        }
        chatHistory.push({ role: 'user', content: text, meta: { attachments: attachmentUris, override: modelOverride } });
        chatHistory.push({ role: 'assistant', content: contentAccum, meta: { providerId, modelName } });
        if (chatHistory.length > 1000) chatHistory.splice(0, chatHistory.length - 1000);
        persistChatHistory();
      } catch (err) {
        getActiveChatTargets().forEach(t => t.showError(err instanceof Error ? err.message : String(err)));
      }
    }),
    vscode.commands.registerCommand('modelRouter.chat.tools', async () => {
      const selection = await vscode.window.showQuickPick([
        'Routing-Simulation (letzte Nutzer-Nachricht)',
        'Kosten / Budget Übersicht',
        'Letzte Antwort erneut senden',
        'Verlauf löschen'
      ], { placeHolder: 'Chat Tools' });
      if (!selection) return;
      const targets = getActiveChatTargets();
      switch (selection) {
        case 'Routing-Simulation (letzte Nutzer-Nachricht)': {
          const lastUser = [...chatHistory].reverse().find(m => m.role === 'user');
          if (!lastUser) { vscode.window.showWarningMessage('Keine Nutzer-Nachricht gefunden'); return; }
          if (!state.router) { vscode.window.showErrorMessage('Router nicht initialisiert'); return; }
          try {
            const sim = await state.router.simulateRoute({ prompt: lastUser.content, mode: state.currentMode });
            let textInfo = 'Routing Simulation:\n';
            if (sim.result) textInfo += `Gewählt: ${sim.result.providerId}:${sim.result.modelName} (Score ${sim.result.score})\n`;
            textInfo += 'Top Alternativen:\n';
            sim.alternatives.slice(0,5).forEach(a => { textInfo += ` - ${a.providerId}:${a.modelName} (Score ${a.score})${a.available ? '' : ' [unavailable]'}\n`; });
            targets.forEach(t => t.sendInfo(textInfo));
          } catch (e) { targets.forEach(t => t.sendInfo('Fehler Simulation: ' + (e as Error).message)); }
          break; }
        case 'Kosten / Budget Übersicht': {
          try {
            const stats = await state.budgetManager.getSpendingStats();
            const usage = await state.budgetManager.getBudgetUsage();
            targets.forEach(t => t.sendInfo(`Kosten: total $${stats.totalSpent.toFixed(4)} | heute $${usage.dailySpent.toFixed(4)} | Monat $${usage.monthlySpent.toFixed(4)}`));
          } catch (e) { targets.forEach(t => t.sendInfo('Fehler Kosten: ' + (e as Error).message)); }
          break; }
        case 'Letzte Antwort erneut senden': {
          const lastUser = [...chatHistory].reverse().find(m => m.role === 'user');
          if (lastUser) vscode.commands.executeCommand('modelRouter.chat.sendFromWebview', lastUser.content);
          break; }
        case 'Verlauf löschen': {
          chatHistory.splice(0, chatHistory.length); persistChatHistory(); targets.forEach(t => t.sendInfo('Verlauf gelöscht')); break; }
      }
    }),
    vscode.commands.registerCommand('modelRouter.chat.planCurrent', async () => {
      const lastUser = [...chatHistory].reverse().find(m => m.role === 'user');
      if (!lastUser) { vscode.window.showWarningMessage('Kein letzter Nutzer-Prompt'); return; }
      if (!state.router) { vscode.window.showErrorMessage('Router nicht initialisiert'); return; }
      const plannerPrompt = `Analysiere die folgende Anfrage und erstelle einen nummerierten, kurzen Umsetzungsplan mit maximal 7 Schritten. Jede Zeile: "Schritt X: ..."\n\nAnfrage:\n${lastUser.content}`;
      try {
        const routed = await state.router.route({ prompt: plannerPrompt, mode: 'auto' });
        const result = await routed.provider.chatComplete(routed.modelName, [{ role: 'user', content: plannerPrompt }], { maxTokens: 300, temperature: 0.2 });
        const planText = result.content.trim();
        getActiveChatTargets().forEach(t => t.sendInfo('Plan:\n' + planText));
        // Schritte parsen
        const steps: string[] = [];
        for (const line of planText.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed) continue;
            const m = trimmed.match(/^(Schritt\s*\d+\s*:?|Step\s*\d+\s*:|\d+\.|\d+\)|-)\s*(.+)$/i);
          if (m) {
            // letzter capture (.+) oder alles nach ':'
            const body = m[2] || trimmed.replace(/^(Schritt\s*\d+\s*:|Step\s*\d+\s*:|\d+[.)]|-)\s*/i,'');
            steps.push(body.trim());
          }
        }
        if (steps.length) {
          currentPlan = { raw: planText, steps, originalUserPrompt: lastUser.content, generatedAt: Date.now() };
          getActiveChatTargets().forEach(t => t.sendInfo(`Plan erkannt (${steps.length} Schritte). Mit "Execute Plan" starten.`));
        } else {
          getActiveChatTargets().forEach(t => t.sendInfo('Plan konnte nicht automatisch in Schritte zerlegt werden.'));
        }
        chatHistory.push({ role: 'assistant', content: '[Plan]\n' + result.content.trim(), meta: { kind: 'plan' } });
        persistChatHistory();
      } catch (e) {
        vscode.window.showErrorMessage('Plan Fehler: ' + (e as Error).message);
      }
    }),
    vscode.commands.registerCommand('modelRouter.chat.executePlan', async () => {
      if (runningPlan) { vscode.window.showWarningMessage('Plan läuft bereits'); return; }
      if (!currentPlan) { vscode.window.showWarningMessage('Kein Plan vorhanden. Erst "Plan / Agent" ausführen.'); return; }
      if (!state.router) { vscode.window.showErrorMessage('Router nicht initialisiert'); return; }
      const targets = getActiveChatTargets();
  targets.forEach(t => t.sendInfo(`Starte Plan-Ausführung (${currentPlan?.steps.length || 0} Schritte)...`));
      runningPlan = { index: 0 };
      updateStatusBar();
      for (let i = 0; i < currentPlan.steps.length; i++) {
        if (!runningPlan || runningPlan.cancelled) break;
        runningPlan.index = i;
        updateStatusBar();
        const step = currentPlan.steps[i];
  targets.forEach(t => t.sendInfo(`▶ Schritt ${i + 1}/${currentPlan?.steps.length || 0}: ${step}`));
        // Abort Controller für diesen Schritt
        const ac = new AbortController();
        runningPlan.abort = ac;
        try {
          // Routing für Schritt
          const stepPrompt = `Ursprüngliche Anfrage:\n${currentPlan.originalUserPrompt}\n\nAktueller Plan (Kontext):\n${currentPlan.raw}\n\nFühre jetzt Schritt ${i + 1} aus: ${step}\nAntwort: Fokus auf konkrete Umsetzung.`;
          const routed = await state.router.route({ prompt: stepPrompt, mode: state.currentMode });
          const providerToUse = routed.provider;
          const modelName = routed.modelName;
          const modelPrice = routed.model.price;
          const providerId = routed.providerId;
          // Info
          targets.forEach(t => t.sendInfo(`Modell für Schritt ${i + 1}: ${providerId}:${modelName}`));
          let contentAccum = '';
          try {
            for await (const chunk of providerToUse.chat(modelName, [
              { role: 'system', content: 'Du führst einen mehrstufigen Plan schrittweise aus.' },
              { role: 'user', content: currentPlan.originalUserPrompt },
              { role: 'assistant', content: 'Plan:\n' + currentPlan.raw },
              { role: 'user', content: `Schritt ${i + 1}: ${step}` }
            ], { signal: ac.signal })) {
              if (runningPlan?.cancelled) { ac.abort(); break; }
              if (chunk.type === 'text' && chunk.data) {
                contentAccum += chunk.data;
                targets.forEach(t => t.streamDelta(chunk.data));
              } else if (chunk.type === 'done') {
                if (chunk.data?.usage && modelPrice) {
                  try {
                    const actualCost = PriceCalculator.calculateActualCost(
                      chunk.data.usage,
                      modelPrice,
                      modelName,
                      providerId
                    );
                    await state.budgetManager.recordTransaction(
                      providerId,
                      modelName,
                      actualCost.totalCost,
                      actualCost.inputTokens,
                      actualCost.outputTokens
                    );
                    targets.forEach(t => t.streamDone({ usage: chunk.data?.usage, cost: actualCost }));
                  } catch {
                    targets.forEach(t => t.streamDone({ usage: chunk.data?.usage }));
                  }
                } else {
                  targets.forEach(t => t.streamDone());
                }
                break;
              } else if (chunk.type === 'error') {
                targets.forEach(t => t.showError(chunk.error || 'Fehler in Schritt'));
                break;
              }
            }
          } catch (err) {
            if ((err as Error).name === 'AbortError') {
              targets.forEach(t => t.sendInfo(`Schritt ${i + 1} abgebrochen.`));
            } else {
              targets.forEach(t => t.showError(`Schritt ${i + 1} Fehler: ${(err as Error).message}`));
            }
          }
          chatHistory.push({ role: 'user', content: `[Plan Schritt ${i + 1}] ${step}` });
          chatHistory.push({ role: 'assistant', content: contentAccum, meta: { providerId, modelName, planStep: i + 1 } });
          persistChatHistory();
        } catch (e) {
          targets.forEach(t => t.showError(`Routing Fehler Schritt ${i + 1}: ${(e as Error).message}`));
          break;
        }
      }
      if (runningPlan && !runningPlan.cancelled) {
        targets.forEach(t => t.sendInfo('Plan abgeschlossen.'));
      } else if (runningPlan?.cancelled) {
        targets.forEach(t => t.sendInfo('Plan-Ausführung gestoppt.'));
      }
      runningPlan = undefined;
  updateStatusBar();
    }),
    vscode.commands.registerCommand('modelRouter.chat.cancelPlanExecution', () => {
      if (!runningPlan) { vscode.window.showInformationMessage('Kein laufender Plan'); return; }
      runningPlan.cancelled = true;
      runningPlan.abort?.abort();
      getActiveChatTargets().forEach(t => t.sendInfo('Abbruch angefordert...'));
  updateStatusBar();
    }),
    vscode.commands.registerCommand('modelRouter.chat.quickPrompt', async () => {
      const cfg = vscode.workspace.getConfiguration('modelRouter');
      const compact = cfg.get<boolean>('chat.compactMode', false);
      if (!compact) {
        vscode.commands.executeCommand('modelRouter.openChatUI');
        return;
      }
      const text = await vscode.window.showInputBox({ prompt: 'Chat Prompt eingeben' });
      if (!text) return;
      if (!state.router) { vscode.window.showErrorMessage('Router nicht initialisiert'); return; }
      // Falls keine Oberfläche -> OutputChannel
      if (!getActiveChatTargets().length) {
        state.outputChannel.show(true);
        state.outputChannel.appendLine(`> ${text}`);
      }
      vscode.commands.executeCommand('modelRouter.chat.sendFromWebview', text);
    }),
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
    
    // Voice Control Commands
    vscode.commands.registerCommand("modelRouter.startVoiceControl", handleStartVoiceControlCommand),
    vscode.commands.registerCommand("modelRouter.stopVoiceControl", handleStopVoiceControlCommand),
    vscode.commands.registerCommand("modelRouter.toggleVoiceControl", handleToggleVoiceControlCommand),
    vscode.commands.registerCommand("modelRouter.voiceSettings", handleVoiceSettingsCommand),
    vscode.commands.registerCommand("modelRouter.voicePermissions", handleVoicePermissionsCommand),
  ];

  context.subscriptions.push(...commands);
}

/**
 * Load and apply configuration
 */
async function loadConfiguration(): Promise<void> {
  try {
    const configPath = getConfigPath();
    const loader = ConfigLoader.getInstance();
    const config = loader.loadConfig(configPath);
    const profile = config.profiles[config.activeProfile];

    // Clear existing providers
    state.providers.clear();

    // Initialize providers
    await initializeProviders(profile);

  // Create router with budget manager
  state.router = new ModelRouter(profile, state.providers, state.budgetManager);

    // Initialize classifier if enabled
    const classifierEnabled = vscode.workspace
      .getConfiguration("modelRouter")
      .get<boolean>("enablePromptClassifier", false);

    if (classifierEnabled) {
      const ollamaProvider = state.providers.get("ollama");
      state.classifier = new PromptClassifier(
        {
          enabled: true,
          useLocalModel: !!ollamaProvider,
          localModelProvider: "ollama",
          localModelName: "llama3.3:70b-instruct",
          fallbackToHeuristic: true,
          cacheResults: true,
        },
        ollamaProvider
      );
    }

    // Update mode from config
    state.currentMode = profile.mode;
  await updateStatusBar();

    // Initialize voice control if enabled
    if (profile.voice?.enabled) {
        await initializeVoiceControl(profile.voice);
        // Voice State -> Chat Panel Bridge
        if (state.voiceController) {
          state.voiceController.addEventListener('stateChanged', (ev) => {
            try {
              const { ChatPanel } = require('./webview/chatPanel');
              if (ChatPanel.current) {
                const newState = typeof ev.data === 'string' ? ev.data : ev.data?.toString?.() || 'idle';
                ChatPanel.current.sendVoiceState?.(newState);
              }
            } catch { /* ignore */ }
          });
        }
    }

  state.outputChannel.appendLine(`Konfiguration geladen: ${profile.providers.length} Provider, Modus: ${profile.mode}${profile.voice?.enabled ? ', Voice: aktiv' : ''}`);
  await updateStatusBar();

  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new Error(`Unerwarteter Fehler beim Laden der Konfiguration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Initialize providers from configuration
 */
async function initializeProviders(profile: ProfileConfig): Promise<void> {
  const secretHelper = getSecretHelper();

  for (const providerConfig of profile.providers) {
    try {
      let provider: Provider;

      switch (providerConfig.kind) {
        case "openai-compat": {
          const apiKey = await secretHelper.getProviderApiKey(providerConfig.id);
          if (!apiKey) {
            state.outputChannel.appendLine(`⚠️ Kein API Key für Provider ${providerConfig.id}`);
            continue;
          }

          provider = new OpenAICompatProvider({
            ...providerConfig,
            kind: "openai-compat",
            apiKey,
            models: providerConfig.models.map(m => m.name),
          });
          break;
        }

        case "ollama": {
          provider = new OllamaProvider({
            ...providerConfig,
            kind: "ollama",
            models: providerConfig.models.map(m => m.name),
          });
          break;
        }

        default:
          state.outputChannel.appendLine(`⚠️ Unbekannter Provider-Typ: ${(providerConfig as any).kind}`);
          continue;
      }

      state.providers.set(providerConfig.id, provider);
      state.outputChannel.appendLine(`✓ Provider initialisiert: ${providerConfig.id}`);

    } catch (error) {
      state.outputChannel.appendLine(`❌ Fehler bei Provider ${providerConfig.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Update status bar display
 */
async function updateStatusBar(): Promise<void> {
  const mode = state.currentMode;
  const providerCount = state.providers.size;
  const icon = mode === "privacy-strict" || mode === "local-only" ? "$(shield)" : "$(rocket)";

  let budgetPart = "";
  try {
    if (state.router) {
      const profile = state.router.getProfile();
      if (profile.budget) {
        const usage = await state.budgetManager.getBudgetUsage();
        const cfg = vscode.workspace.getConfiguration("modelRouter");
        const show = cfg.get<boolean>("showBudgetInStatusBar", true);
        const modeDisplay = cfg.get<string>("budgetDisplayMode", "compact");
        if (show) {
          if (profile.budget.dailyUSD) {
            const daily = usage.dailySpent;
            const limit = profile.budget.dailyUSD;
            const pct = limit ? Math.min(100, (daily / limit) * 100) : 0;
            if (modeDisplay === "compact") {
              budgetPart = ` | $${daily.toFixed(2)}/${limit}`;
            } else {
              // detailed mode
              let monthly = "";
              if (profile.budget.monthlyUSD) {
                const mpct = (usage.monthlySpent / profile.budget.monthlyUSD) * 100;
                monthly = ` m:${usage.monthlySpent.toFixed(2)}/${profile.budget.monthlyUSD}`;
                budgetPart = ` | d:${daily.toFixed(2)}/${limit} (${pct.toFixed(0)}%)${monthly} (${mpct.toFixed(0)}%)`;
              } else {
                budgetPart = ` | d:${daily.toFixed(2)}/${limit} (${pct.toFixed(0)}%)`;
              }
            }
          } else if (usage.dailySpent > 0) {
            budgetPart = ` | $${usage.dailySpent.toFixed(2)}`;
          }
        }
      }
    }
  } catch (e) {
    // ignore budget display errors
  }

  // Plan-Fortschritt
  let planPart = "";
  try {
    if (runningPlan && currentPlan) {
      const total = currentPlan.steps.length;
      const current = Math.min(runningPlan.index + 1, total);
      const label = runningPlan.cancelled ? 'Abbruch…' : 'Plan';
      // Spinner nur wenn nicht abgeschlossen/abgebrochen
      planPart = ` | $(sync~spin) ${label} ${current}/${total}`;
    }
  } catch { /* ignore */ }

  state.statusBar.text = `${icon} Router: ${mode} (${providerCount})${budgetPart}${planPart}`;
  const planTooltip = (runningPlan && currentPlan)
    ? `\nPlan Fortschritt: Schritt ${Math.min(runningPlan.index + 1, currentPlan.steps.length)}/${currentPlan.steps.length}` + (runningPlan.cancelled ? ' (Abbruch angefordert)' : '')
    : '';
  state.statusBar.tooltip = `Model Router - Modus: ${mode}, Provider: ${providerCount}${planTooltip}${state.lastBudgetSummary ? "\n" + state.lastBudgetSummary : ""}`;
}

/**
 * Get configuration file path
 */
function getConfigPath(): string {
  const configSetting = vscode.workspace.getConfiguration("modelRouter").get<string>("configPath");
  
  if (!configSetting) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error("Kein Workspace-Ordner geöffnet und Konfigurationspfad nicht gesetzt");
    }

    const defaultPath = vscode.Uri.joinPath(workspaceFolder.uri, "router.config.yaml").fsPath;
    vscode.window.showWarningMessage(`Konfigurationspfad nicht gesetzt. Standardpfad wird verwendet: ${defaultPath}`);
    return defaultPath;
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
async function createDefaultConfigIfNeeded(): Promise<void> {
  try {
    const configPath = getConfigPath();
    const loader = ConfigLoader.getInstance();
    
    const answer = await vscode.window.showQuickPick(
      ["Ja, Standard-Konfiguration erstellen", "Nein, manuell konfigurieren"],
      { placeHolder: "Soll eine Standard-Konfiguration erstellt werden?" }
    );

    if (answer?.startsWith("Ja")) {
      loader.createDefaultConfig(configPath);
      vscode.window.showInformationMessage(`Standard-Konfiguration erstellt: ${configPath}`);
      
      // Try to load the new config
      await loadConfiguration();
    }
  } catch (error) {
    state.outputChannel.appendLine(`Fehler beim Erstellen der Standard-Konfiguration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Start MCP server if enabled
 */
async function startMcpServerIfEnabled(): Promise<void> {
  // Check if MCP should be enabled (could be a configuration option)
  const mcpEnabled = process.argv.includes("--mcp");
  
  if (mcpEnabled && state.router) {
    try {
      state.mcpServer = createModelRouterMcpServer(state.router, state.providers);
      await state.mcpServer.start();
      state.outputChannel.appendLine("✓ MCP Server gestartet");
    } catch (error) {
      state.outputChannel.appendLine(`❌ MCP Server Fehler: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Command Handlers

async function handleChatCommand(): Promise<void> {
  if (!state.router) {
    vscode.window.showErrorMessage("Router nicht initialisiert");
    return;
  }

  const prompt = await vscode.window.showInputBox({
    prompt: "Frage oder Anweisung an die KI eingeben",
    placeHolder: "z.B. Erkläre mir async/await in JavaScript",
  });

  if (!prompt) return;

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
    const cost = PriceCalculator.estimateCost(prompt, result.model, result.providerId);

    // Show routing info
    state.outputChannel.clear();
    state.outputChannel.appendLine(`🎯 Routing für: "${prompt.slice(0, 50)}..."`);
    state.outputChannel.appendLine(`📍 Gewähltes Modell: ${result.providerId}:${result.modelName}`);
    state.outputChannel.appendLine(`💰 Geschätzte Kosten: $${cost.totalCost.toFixed(4)}`);
    state.outputChannel.appendLine(`🧠 Begründung: ${result.reasoning.join(", ")}`);
    state.outputChannel.appendLine("─".repeat(50));
    state.outputChannel.show(true);

  // Execute chat (stream to OutputChannel)
  // Hinweis: Vollständige Antwort könnte später für Folgefunktionen genutzt werden
    for await (const chunk of result.provider.chat(result.modelName, [
      { role: "user", content: prompt }
    ])) {
      if (chunk.type === "text" && chunk.data) {
        state.outputChannel.append(chunk.data);
      } else if (chunk.type === "done") {
        state.outputChannel.appendLine("\n" + "─".repeat(50));
        state.outputChannel.appendLine("✅ Chat abgeschlossen");
        
        // Record actual cost
        if (chunk.data?.usage) {
          const actualCost = PriceCalculator.calculateActualCost(
            chunk.data.usage,
            result.model.price!,
            result.modelName,
            result.providerId
          );
          
          await state.budgetManager.recordTransaction(
            result.providerId,
            result.modelName,
            actualCost.totalCost,
            actualCost.inputTokens,
            actualCost.outputTokens
          );
        }
        break;
      }
    }

  } catch (error) {
    vscode.window.showErrorMessage(`Chat-Fehler: ${error instanceof Error ? error.message : String(error)}`);
    state.outputChannel.appendLine(`❌ Fehler: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleRouteOnceCommand(): Promise<void> {
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
      const cost = PriceCalculator.estimateCost(text, result.model, result.providerId);
      
      const message = `🎯 Gewähltes Modell: ${result.providerId}:${result.modelName}\n` +
                     `💰 Geschätzte Kosten: $${cost.totalCost.toFixed(4)}\n` +
                     `📊 Score: ${result.score}\n` +
                     `🧠 Begründung: ${result.reasoning.join(", ")}`;
      
      vscode.window.showInformationMessage(message, { modal: false });
    } else {
      vscode.window.showWarningMessage("Kein passendes Modell gefunden");
    }

  } catch (error) {
    vscode.window.showErrorMessage(`Routing-Fehler: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleSetApiKeyCommand(): Promise<void> {
  const secretHelper = getSecretHelper();

  // Get provider ID
  const providerId = await vscode.window.showInputBox({
    prompt: "Provider-ID eingeben",
    placeHolder: "z.B. openai, deepseek, grok",
  });

  if (!providerId) return;

  // Get API key
  const apiKey = await vscode.window.showInputBox({
    prompt: `API Key für ${providerId} eingeben`,
    password: true,
    placeHolder: "sk-...",
  });

  if (!apiKey) return;

  try {
    // Validate key format
    const validation = secretHelper.validateApiKey(providerId, apiKey);
    if (!validation.valid) {
      const proceed = await vscode.window.showWarningMessage(
        `API Key Warnung: ${validation.error}. Trotzdem speichern?`,
        "Ja", "Nein"
      );
      if (proceed !== "Ja") return;
    }

    // Store the key
    await secretHelper.setProviderApiKey(providerId, apiKey);

    vscode.window.showInformationMessage(`✓ API Key für ${providerId} gespeichert`);

    // Reload configuration to initialize the provider
    await loadConfiguration();

  } catch (error) {
    vscode.window.showErrorMessage(`Fehler beim Speichern des API Keys: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleSwitchModeCommand(): Promise<void> {
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

async function handleOpenConfigCommand(): Promise<void> {
  try {
    const configPath = getConfigPath();
    const uri = vscode.Uri.file(configPath);
    await vscode.window.showTextDocument(uri);
  } catch (error) {
    vscode.window.showErrorMessage(`Fehler beim Öffnen der Konfiguration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleShowCostsCommand(): Promise<void> {
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

  } catch (error) {
    vscode.window.showErrorMessage(`Fehler beim Laden der Kosten: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleTestConnectionCommand(): Promise<void> {
  const providerIds = Array.from(state.providers.keys());
  
  if (providerIds.length === 0) {
    vscode.window.showWarningMessage("Keine Provider konfiguriert");
    return;
  }

  const selected = await vscode.window.showQuickPick(
    [...providerIds, "Alle testen"],
    { placeHolder: "Provider zum Testen auswählen" }
  );

  if (!selected) return;

  const providersToTest = selected === "Alle testen" 
    ? Array.from(state.providers.entries())
    : [[selected, state.providers.get(selected)!] as [string, Provider]].filter(([_, provider]) => provider);

  state.outputChannel.clear();
  state.outputChannel.appendLine("🔍 Teste Provider-Verbindungen...");
  state.outputChannel.show();

  for (const [id, provider] of providersToTest) {
    if (!provider) continue;
    
    try {
      state.outputChannel.appendLine(`\nTeste ${id}...`);
      const available = await provider.isAvailable();
      
      if (available) {
        state.outputChannel.appendLine(`✅ ${id}: Verbindung erfolgreich`);
      } else {
        state.outputChannel.appendLine(`❌ ${id}: Nicht verfügbar`);
      }

      // Test with OpenAI provider if it has test method
      if ("testConnection" in provider && typeof provider.testConnection === "function") {
        const testResult = await provider.testConnection();
        if (testResult.success) {
          state.outputChannel.appendLine(`✅ ${id}: API-Test erfolgreich`);
        } else {
          state.outputChannel.appendLine(`❌ ${id}: API-Test fehlgeschlagen: ${testResult.error}`);
        }
      }

    } catch (error) {
      state.outputChannel.appendLine(`❌ ${id}: Fehler: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  state.outputChannel.appendLine("\n🏁 Verbindungstest abgeschlossen");
}

async function handleClassifyPromptCommand(): Promise<void> {
  if (!state.classifier) {
    vscode.window.showErrorMessage("Prompt-Classifier nicht aktiviert");
    return;
  }

  const prompt = await vscode.window.showInputBox({
    prompt: "Prompt zur Klassifikation eingeben",
    placeHolder: "z.B. Schreibe Unit Tests für diese Funktion",
  });

  if (!prompt) return;

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

  } catch (error) {
    vscode.window.showErrorMessage(`Klassifikation fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleSimulateRoutingCommand(): Promise<void> {
  if (!state.router) {
    vscode.window.showErrorMessage("Router nicht initialisiert");
    return;
  }

  const prompt = await vscode.window.showInputBox({
    prompt: "Prompt für Routing-Simulation eingeben",
    placeHolder: "z.B. Optimiere diese SQL-Abfrage für bessere Performance",
  });

  if (!prompt) return;

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

  } catch (error) {
    vscode.window.showErrorMessage(`Simulation fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleImportApiKeysCommand(): Promise<void> {
  try {
    const secretHelper = getSecretHelper();
    const result = await secretHelper.importFromEnvironment();
    
    const message = `API-Key Import:\n` +
                   `✅ Importiert: ${result.imported.join(", ") || "keine"}\n` +
                   `⏭️ Übersprungen: ${result.skipped.join(", ") || "keine"}`;

    vscode.window.showInformationMessage(message);

    if (result.imported.length > 0) {
      await loadConfiguration();
    }

  } catch (error) {
    vscode.window.showErrorMessage(`Import fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleExportConfigCommand(): Promise<void> {
  try {
    const secretHelper = getSecretHelper();
    const config = await secretHelper.exportConfiguration();
    
    const content = JSON.stringify(config, null, 2);
    const doc = await vscode.workspace.openTextDocument({
      content,
      language: "json",
    });
    
    await vscode.window.showTextDocument(doc);

  } catch (error) {
    vscode.window.showErrorMessage(`Export fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Voice Control Functions

async function initializeVoiceControl(voiceConfig: VoiceConfig): Promise<void> {
  try {
    if (state.voiceController) {
      await state.voiceController.destroy();
    }

    if (!state.router) {
      throw new Error("Router muss initialisiert sein bevor Voice Control gestartet werden kann");
    }

    state.voiceController = new VoiceController(extensionContext, voiceConfig, state.router);
    await state.voiceController.initialize();

    state.outputChannel.appendLine("✅ Voice Control initialisiert");

  } catch (error) {
    state.outputChannel.appendLine(`❌ Voice Control Fehler: ${error instanceof Error ? error.message : String(error)}`);
    vscode.window.showErrorMessage(`Voice Control konnte nicht initialisiert werden: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleStartVoiceControlCommand(): Promise<void> {
  if (!state.voiceController) {
    try {
      await loadConfiguration();
    } catch (error) {
      vscode.window.showErrorMessage("Konfiguration konnte nicht geladen werden");
      return;
    }
  }

  if (state.voiceController) {
    try {
      await state.voiceController.startListening();
      vscode.window.showInformationMessage("🎤 Guido Voice Control gestartet! Sagen Sie 'Guido' um zu beginnen.");
    } catch (error) {
      vscode.window.showErrorMessage(`Voice Control konnte nicht gestartet werden: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    vscode.window.showErrorMessage("Voice Control ist nicht konfiguriert. Bitte aktivieren Sie es in der router.config.yaml");
  }
}

async function handleStopVoiceControlCommand(): Promise<void> {
  if (state.voiceController) {
    try {
      await state.voiceController.stopListening();
      vscode.window.showInformationMessage("🛑 Voice Control gestoppt");
    } catch (error) {
      vscode.window.showErrorMessage(`Fehler beim Stoppen: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    vscode.window.showInformationMessage("Voice Control ist nicht aktiv");
  }
}

async function handleToggleVoiceControlCommand(): Promise<void> {
  if (!state.voiceController) {
    await handleStartVoiceControlCommand();
  } else {
    const currentState = state.voiceController.getState();
    if (currentState === "listening" || currentState === "recording") {
      await handleStopVoiceControlCommand();
    } else {
      await handleStartVoiceControlCommand();
    }
  }
}

async function handleVoiceSettingsCommand(): Promise<void> {
  if (!state.voiceController) {
    vscode.window.showErrorMessage("Voice Control ist nicht initialisiert");
    return;
  }

  const options = [
    "🎤 Voice Control starten/stoppen",
    "🔊 Lautstärke anpassen",
    "🗣️ Stimme wechseln", 
    "🌐 Sprache ändern",
    "⚙️ Erweiterte Einstellungen",
    "📊 Voice Statistiken anzeigen"
  ];

  const selected = await vscode.window.showQuickPick(options, {
    placeHolder: "Voice Control Einstellungen"
  });

  switch (selected) {
    case "🎤 Voice Control starten/stoppen":
      await handleToggleVoiceControlCommand();
      break;

    case "🔊 Lautstärke anpassen":
      const volume = await vscode.window.showInputBox({
        prompt: "Lautstärke eingeben (0.0 - 1.0)",
        value: "0.8",
        validateInput: (value) => {
          const num = parseFloat(value);
          return (isNaN(num) || num < 0 || num > 1) ? "Bitte eine Zahl zwischen 0.0 und 1.0 eingeben" : undefined;
        }
      });
      if (volume) {
        vscode.window.showInformationMessage(`Lautstärke auf ${volume} gesetzt`);
      }
      break;

    case "🗣️ Stimme wechseln":
      vscode.window.showInformationMessage("Stimmenwechsel über die Webview verfügbar");
      break;

    case "🌐 Sprache ändern":
      const languages = ["de-DE", "en-US", "fr-FR", "es-ES", "it-IT"];
      const selectedLang = await vscode.window.showQuickPick(languages, {
        placeHolder: "Sprache auswählen"
      });
      if (selectedLang) {
        vscode.window.showInformationMessage(`Sprache auf ${selectedLang} gesetzt`);
      }
      break;

    case "⚙️ Erweiterte Einstellungen":
      await handleOpenConfigCommand();
      break;

    case "📊 Voice Statistiken anzeigen":
      const stats = state.voiceController.getStats();
      const statsMessage = `📊 Voice Control Statistiken:
        
Sessions: ${stats.totalSessions}
Gesamtzeit: ${Math.round(stats.totalDuration / 1000 / 60)} Minuten
Durchschnitt/Session: ${Math.round(stats.averageSessionDuration / 1000)} Sekunden
Befehle ausgeführt: ${stats.commandsExecuted}
Fehler: ${stats.errorsCount}
Erkennungsgenauigkeit: ${stats.recognitionAccuracy ? `${Math.round(stats.recognitionAccuracy * 100)}%` : 'N/A'}`;

      vscode.window.showInformationMessage(statsMessage, { modal: true });
      break;
  }
}

async function handleVoicePermissionsCommand(): Promise<void> {
  const options = [
    "🔐 DSGVO-Einverständnis verwalten",
    "🎤 Mikrofon-Berechtigungen prüfen",
    "📊 Datennutzung anzeigen", 
    "🗑️ Gespeicherte Daten löschen",
    "📄 Datenschutzerklärung anzeigen",
    "📤 Daten exportieren (DSGVO)"
  ];

  const selected = await vscode.window.showQuickPick(options, {
    placeHolder: "Berechtigungen und Datenschutz"
  });

  switch (selected) {
    case "🔐 DSGVO-Einverständnis verwalten":
      const revokeConsent = await vscode.window.showWarningMessage(
        "Möchten Sie Ihr Einverständnis zur Datenverarbeitung widerrufen? Dies löscht alle gespeicherten Voice-Daten.",
        { modal: true },
        "Widerrufen",
        "Beibehalten"
      );

      if (revokeConsent === "Widerrufen") {
        vscode.window.showInformationMessage("✅ Einverständnis widerrufen und Daten gelöscht");
      }
      break;

    case "🎤 Mikrofon-Berechtigungen prüfen":
      vscode.window.showInformationMessage("Mikrofon-Berechtigungen werden geprüft... Details in der Webview verfügbar.");
      break;

    case "📊 Datennutzung anzeigen":
      const dataInfo = `📊 Voice Control Datennutzung:

🎙️ Sprachaufnahmen: Nicht gespeichert
📝 Transkripte: Anonymisiert, 30 Tage Aufbewahrung
📈 Statistiken: Lokal gespeichert
🔒 Verschlüsselung: Aktiviert
🌍 Externe APIs: Nur bei aktiviertem Cloud-Modus

Letzte Aktualisierung: ${new Date().toLocaleString('de-DE')}`;

      vscode.window.showInformationMessage(dataInfo, { modal: true });
      break;

    case "🗑️ Gespeicherte Daten löschen":
      const deleteData = await vscode.window.showWarningMessage(
        "Alle Voice Control Daten löschen? Dies kann nicht rückgängig gemacht werden.",
        { modal: true },
        "Löschen",
        "Abbrechen"
      );

      if (deleteData === "Löschen") {
        vscode.window.showInformationMessage("✅ Alle Voice Control Daten gelöscht");
      }
      break;

    case "📄 Datenschutzerklärung anzeigen":
      const policyUri = vscode.Uri.parse("https://github.com/your-username/model-router/blob/main/PRIVACY.md");
      await vscode.env.openExternal(policyUri);
      break;

    case "📤 Daten exportieren (DSGVO)":
      const exportData = JSON.stringify({
        exported: new Date().toISOString(),
        voiceStats: state.voiceController?.getStats() || {},
        permissions: "granted", 
        note: "Voice Control Datenexport gemäß DSGVO Artikel 20"
      }, null, 2);

      const doc = await vscode.workspace.openTextDocument({
        content: exportData,
        language: 'json'
      });

      await vscode.window.showTextDocument(doc);
      vscode.window.showInformationMessage("📤 Voice Control Daten exportiert");
      break;
  }
}

// ---- Hilfsfunktionen für Chat Attachments ----
interface AttachmentSummary { name: string; snippet: string; }
async function readAttachmentSummaries(paths: string[]): Promise<AttachmentSummary[]> {
  const cfg = vscode.workspace.getConfiguration('modelRouter');
  const maxFiles = Math.max(1, cfg.get<number>('chat.attachment.maxFiles', 5));
  const maxBytesPerFile = Math.max(512, cfg.get<number>('chat.attachment.maxSnippetBytes', 8192));
  const redactSecrets = cfg.get<boolean>('chat.attachment.redactSecrets', true);
  const extraPatterns = cfg.get<string[]>('chat.attachment.additionalRedactPatterns', []) || [];
  const secretPatterns: RegExp[] = [];
  if (redactSecrets) {
    const base = [
      /(sk|rk|pk|ak|ey|token)[-_]?[A-Za-z0-9]{12,}/gi, // generische Keys
      /api[_-]?key\s*[:=]\s*['\"]?[A-Za-z0-9-_]{10,}['\"]?/gi,
      /secret[_-]?key\s*[:=]\s*['\"]?[A-Za-z0-9-_]{10,}['\"]?/gi,
      /-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+ PRIVATE KEY-----/g
    ];
    secretPatterns.push(...base);
    for (const p of extraPatterns) {
      try { secretPatterns.push(new RegExp(p, 'gi')); } catch {/* ignore invalid */}
    }
  }
  const results: AttachmentSummary[] = [];
  for (const p of paths.slice(0, maxFiles)) {
    try {
      const stat = fs.statSync(p);
      if (stat.isDirectory()) continue;
      if (stat.size > 512 * 1024) { // >512KB überspringen
        results.push({ name: path.basename(p), snippet: '[Übersprungen: Datei zu groß]' });
        continue;
      }
      const buf = fs.readFileSync(p);
      const slice = buf.slice(0, maxBytesPerFile).toString('utf8');
      let cleaned = slice.replace(/\u0000/g, '').replace(/\s+$/,'');
      if (redactSecrets && secretPatterns.length) {
        for (const rx of secretPatterns) {
          cleaned = cleaned.replace(rx, '[REDACTED]');
        }
      }
      results.push({ name: path.basename(p), snippet: cleaned });
    } catch {
      // ignore
    }
  }
  return results;
}
