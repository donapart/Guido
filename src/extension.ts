/**
 * Main extension entry point
 */

import * as vscode from 'vscode';
import { ModelRouter } from './router';
import { loadConfiguration, ProfileConfig } from './config';
import { VSCodeSecretManager } from './secret';
import { OpenAICompatProvider } from './providers/openaiCompat';
import { OllamaProvider } from './providers/ollama';
import { VoiceController } from './voice/voiceController';
import type { VoiceConfig } from './voice/types';
import { ExperimentalVoiceFeatures } from './voice/experimental/advancedVoiceFeatures';
import { ExperimentalRouting } from './router/experimental/advancedRouting';
import { ExperimentalNLP } from './voice/experimental/naturalLanguageProcessor';
import { ExperimentalUI } from './voice/webview/experimentalUI';

interface ExtensionState {
  router: ModelRouter;
  providers: Map<string, any>;
  config: ProfileConfig;
  secretManager: VSCodeSecretManager;
  voiceController?: VoiceController;
  experimentalFeatures?: ExperimentalVoiceFeatures;
  experimentalRouting?: ExperimentalRouting;
  experimentalNLP?: ExperimentalNLP;
  experimentalUI?: ExperimentalUI;
}

let extensionContext: vscode.ExtensionContext;
let state: ExtensionState;

export async function activate(context: vscode.ExtensionContext) {
  extensionContext = context;
  
  try {
    await initializeExtension();
    
    // Register commands
    registerCommands(context);
    
    // Initialize voice control if enabled
    if (state.config.voice?.enabled) {
      await initializeVoiceControl();
    }
    
    // Initialize experimental features
    await initializeExperimentalFeatures();
    
    vscode.window.showInformationMessage('Guido Model Router Extension aktiviert! 🎤✨');
  } catch (error) {
    vscode.window.showErrorMessage(`Fehler beim Aktivieren der Extension: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function deactivate() {
  // Cleanup
  if (state.voiceController) {
    state.voiceController.stopListening();
  }
  
  vscode.window.showInformationMessage('Guido Model Router Extension deaktiviert.');
}

async function initializeExtension() {
  // Load configuration
  const config = await loadConfiguration();
  
  // Initialize secret manager
  const secretManager = new VSCodeSecretManager(extensionContext);
  
  // Initialize providers
  const providers = new Map();
  for (const providerConfig of config.providers) {
    try {
      let provider;
      if (providerConfig.kind === 'openai-compat') {
        provider = new OpenAICompatProvider(providerConfig as any);
      } else if (providerConfig.kind === 'ollama') {
        provider = new OllamaProvider(providerConfig as any);
      } else {
        console.warn(`Unknown provider kind: ${providerConfig.kind}`);
        continue;
      }
      providers.set(providerConfig.id, provider);
    } catch (error) {
      console.warn(`Failed to initialize provider ${providerConfig.id}:`, error);
    }
  }
  
  // Initialize router
  const router = new ModelRouter(config, providers);
  
  state = {
    router,
    providers,
    config,
    secretManager
  };
}

async function initializeVoiceControl() {
  if (!state.config.voice) {
    return;
  }
  
  try {
    state.voiceController = new VoiceController(extensionContext, state.config.voice, state.router);
    await state.voiceController.initialize();
    
    vscode.window.showInformationMessage('Guido Voice Control initialisiert! 🎤');
  } catch (error) {
    console.warn('Voice control initialization failed:', error);
    vscode.window.showWarningMessage('Voice Control konnte nicht initialisiert werden.');
  }
}

async function initializeExperimentalFeatures() {
  try {
    // Initialize experimental voice features
    state.experimentalFeatures = new ExperimentalVoiceFeatures();
    
    // Initialize experimental routing
    state.experimentalRouting = new ExperimentalRouting(state.router, state.providers);
    
    // Initialize experimental NLP
    state.experimentalNLP = new ExperimentalNLP();
    
    vscode.window.showInformationMessage('🧪 Experimentelle Features aktiviert!');
  } catch (error) {
    console.warn('Experimental features initialization failed:', error);
    vscode.window.showWarningMessage('Experimentelle Features konnten nicht initialisiert werden.');
  }
}

function registerCommands(context: vscode.ExtensionContext) {
  // Core commands
  context.subscriptions.push(
    vscode.commands.registerCommand('modelRouter.chat', async () => {
      await handleChatCommand();
    }),
    
    vscode.commands.registerCommand('modelRouter.openConfig', async () => {
      await handleOpenConfigCommand();
    }),
    
    vscode.commands.registerCommand('modelRouter.estimateCost', async () => {
      await handleEstimateCostCommand();
    })
  );
  
  // Voice control commands
  context.subscriptions.push(
    vscode.commands.registerCommand('modelRouter.startVoiceControl', async () => {
      await handleStartVoiceControl();
    }),
    
    vscode.commands.registerCommand('modelRouter.stopVoiceControl', async () => {
      await handleStopVoiceControl();
    }),
    
    vscode.commands.registerCommand('modelRouter.toggleVoiceControl', async () => {
      await handleToggleVoiceControl();
    }),
    
    vscode.commands.registerCommand('modelRouter.voiceSettings', async () => {
      await handleVoiceSettings();
    }),
    
    vscode.commands.registerCommand('modelRouter.voicePermissions', async () => {
      await handleVoicePermissions();
    })
  );
  
  // Experimental commands
  context.subscriptions.push(
    vscode.commands.registerCommand('modelRouter.experimental.emotionAnalysis', async () => {
      await handleExperimentalEmotionAnalysis();
    }),
    
    vscode.commands.registerCommand('modelRouter.experimental.contextEnhancement', async () => {
      await handleExperimentalContextEnhancement();
    }),
    
    vscode.commands.registerCommand('modelRouter.experimental.adaptiveRouting', async () => {
      await handleExperimentalAdaptiveRouting();
    }),
    
    vscode.commands.registerCommand('modelRouter.experimental.intentRecognition', async () => {
      await handleExperimentalIntentRecognition();
    }),
    
    vscode.commands.registerCommand('modelRouter.experimental.personalityAdaptation', async () => {
      await handleExperimentalPersonalityAdaptation();
    }),
    
    vscode.commands.registerCommand('modelRouter.experimental.multilingualProcessing', async () => {
      await handleExperimentalMultilingualProcessing();
    }),
    
    vscode.commands.registerCommand('modelRouter.experimental.performanceMetrics', async () => {
      await handleExperimentalPerformanceMetrics();
    }),
    
    vscode.commands.registerCommand('modelRouter.experimental.showUI', async () => {
      await handleExperimentalShowUI();
    }),
    
    vscode.commands.registerCommand('modelRouter.experimental.testFeatures', async () => {
      await handleExperimentalTestFeatures();
    })
  );
}

// Command handlers
async function handleChatCommand() {
  const prompt = await vscode.window.showInputBox({
    prompt: 'Geben Sie Ihre Nachricht ein:',
    placeHolder: 'z.B. "Erkläre mir TypeScript"'
  });
  
  if (!prompt) return;
  
  try {
    const routingContext = {
      prompt,
      lang: 'de',
      mode: 'auto'
    };
    
    const result = await state.router.route(routingContext);
    await displayChatResult(result);
  } catch (error) {
    vscode.window.showErrorMessage(`Fehler: ${error instanceof Error ? error.message : String(error)}`);
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
  
  if (!prompt) return;
  
  try {
    const estimates = await Promise.all(
      Array.from(state.providers.values()).map(async (provider) => {
        const models = await provider.getAvailableModels();
        return models.map((model: string) => ({
          provider: provider.id(),
          model,
          estimatedCost: provider.estimateTokens(prompt) * 0.001 // Simplified cost estimation
        }));
      })
    );
    
    const flatEstimates = estimates.flat();
    const cheapest = flatEstimates.reduce((min, current) => 
      current.estimatedCost < min.estimatedCost ? current : min
    );
    
    vscode.window.showInformationMessage(
      `Geschätzte Kosten: ${cheapest.estimatedCost.toFixed(4)}€ (${cheapest.provider}/${cheapest.model})`
    );
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    vscode.window.showErrorMessage(`Fehler beim Umschalten der Sprachsteuerung: ${error instanceof Error ? error.message : String(error)}`);
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
  
  if (!selected) return;
  
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
  
  if (!selected) return;
  
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
  
  if (!testText) return;
  
  try {
    const emotion = await state.experimentalFeatures.detectEmotion(testText);
    vscode.window.showInformationMessage(
      `🧠 Emotion: ${emotion.primary} (Confidence: ${(emotion.confidence * 100).toFixed(1)}%)`
    );
  } catch (error) {
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
  
  if (!testText) return;
  
  try {
    const context = {
      project: vscode.workspace.name || 'unknown',
      file: vscode.window.activeTextEditor?.document.fileName || 'unknown',
      userExpertise: 'intermediate',
      recentCommands: ['code_review', 'explanation']
    };
    
    const enhanced = await state.experimentalFeatures.enhanceContext(testText, context);
    vscode.window.showInformationMessage(
      `🔍 Erweiterter Text: ${enhanced.transcript}`
    );
  } catch (error) {
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
  
  if (!prompt) return;
  
  try {
    const context = {
      userExpertise: 'intermediate',
      projectType: 'web_application',
      urgency: 'normal'
    };
    
    const decision = await state.experimentalRouting.contextAwareRouting(prompt, context);
    vscode.window.showInformationMessage(
      `🎯 Routing-Entscheidung: ${decision.model} (${decision.reasoning})`
    );
  } catch (error) {
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
  
  if (!testText) return;
  
  try {
    const intent = await state.experimentalNLP.detectIntent(testText);
    vscode.window.showInformationMessage(
      `🎯 Intent: ${intent.primary} (Confidence: ${(intent.confidence * 100).toFixed(1)}%)`
    );
  } catch (error) {
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
      communicationStyle: 'casual',
      preferences: {
        formality: 0.3,
        verbosity: 0.6,
        humor: 0.4
      }
    };
    
    const personality = await state.experimentalNLP.adaptPersonality(userPreferences);
    vscode.window.showInformationMessage(
      `🎭 Angepasste Persönlichkeit: ${personality.style} (Formalität: ${personality.formality})`
    );
  } catch (error) {
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
  
  if (!testText) return;
  
  try {
    const result = await state.experimentalFeatures.processMultilingual(testText);
    vscode.window.showInformationMessage(
      `🌍 Sprache: ${result.detectedLanguage} → ${result.translated ? 'Übersetzt' : 'Keine Übersetzung nötig'}`
    );
  } catch (error) {
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
  } catch (error) {
    vscode.window.showErrorMessage(`Performance-Metriken fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleExperimentalShowUI() {
  try {
    const panel = vscode.window.createWebviewPanel(
      'experimentalUI',
      '🧪 Guido Experimentelle Features',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );
    
    state.experimentalUI = new ExperimentalUI(panel);
    
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
  } catch (error) {
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
      } catch (error) {
        console.warn(`Test ${test.name} failed:`, error);
      }
    }
    
    vscode.window.showInformationMessage('✅ Experimentelle Feature-Tests abgeschlossen!');
  } catch (error) {
    vscode.window.showErrorMessage(`Feature-Tests fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function displayChatResult(result: any) {
  const panel = vscode.window.createWebviewPanel(
    'chatResult',
    'Guido Chat Result',
    vscode.ViewColumn.One,
    {
      enableScripts: true
    }
  );
  
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
