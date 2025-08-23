# Guido Model Router - Enterprise Developer Guide

## 🚀 Übersicht

Guido Model Router ist eine fortschrittliche VS Code-Erweiterung, die intelligentes AI-Model-Routing, Sprachsteuerung und enterprise-taugliche Features für professionelle Entwicklungsumgebungen bietet.

## 📋 Inhaltsverzeichnis

1. [Installation & Setup](#installation--setup)
2. [Provider Konfiguration](#provider-konfiguration)
3. [Sprachsteuerung](#sprachsteuerung)
4. [Dashboard & Monitoring](#dashboard--monitoring)
5. [API Referenz](#api-referenz)
6. [Entwicklung & Testing](#entwicklung--testing)
7. [Enterprise Features](#enterprise-features)
8. [Troubleshooting](#troubleshooting)

## 🔧 Installation & Setup

### Voraussetzungen

- **VS Code**: Version 1.99.0 oder höher
- **Node.js**: Version 16.x oder höher
- **Aktive Internetverbindung** für Cloud-Provider
- **Mikrofon** für Sprachsteuerung (optional)

### Installation

1. **Aus dem Marketplace:**
   ```bash
   code --install-extension model-router.guido-model-router
   ```

2. **Manuelle Installation:**
   ```bash
   # Lade die .vsix Datei herunter
   code --install-extension model-router-0.1.9.vsix
   ```

3. **Aus dem Source:**
   ```bash
   git clone https://github.com/model-router/guido-model-router.git
   cd guido-model-router
   npm install
   npm run package
   code --install-extension model-router-0.1.9.vsix
   ```

### Erste Konfiguration

1. **Öffne VS Code Settings** (`Ctrl+,`)
2. **Suche nach "Model Router"**
3. **Konfiguriere die gewünschten Provider:**

```json
{
  "modelRouter.openaiApiKey": "sk-...",
  "modelRouter.anthropicApiKey": "sk-ant-...",
  "modelRouter.cohereApiKey": "...",
  "modelRouter.ollamaBaseUrl": "http://localhost:11434",
  "modelRouter.defaultProvider": "auto",
  "modelRouter.routingMode": "auto",
  "modelRouter.maxCostPerDay": 5.0
}
```

## 🔌 Provider Konfiguration

### OpenAI Setup

```json
{
  "modelRouter.openaiApiKey": "sk-proj-...",
  "modelRouter.openai.defaultModel": "gpt-4o",
  "modelRouter.openai.maxTokens": 4096,
  "modelRouter.openai.temperature": 0.7
}
```

**Verfügbare Modelle:**
- `gpt-4o` - Neuestes GPT-4 Optimized
- `gpt-4o-mini` - Kostengünstiges GPT-4
- `gpt-4-turbo` - Schnellere GPT-4 Variante
- `gpt-3.5-turbo` - Bewährtes Chat-Modell

### Anthropic Claude Setup

```json
{
  "modelRouter.anthropicApiKey": "sk-ant-api03-...",
  "modelRouter.anthropic.defaultModel": "claude-3-5-sonnet-20241022",
  "modelRouter.anthropic.maxTokens": 4096
}
```

**Verfügbare Modelle:**
- `claude-3-5-sonnet-20241022` - Neueste Claude 3.5 Sonnet Version
- `claude-3-opus-20240229` - Höchste Qualität für komplexe Aufgaben
- `claude-3-sonnet-20240229` - Ausgewogenes Preis-Leistungs-Verhältnis
- `claude-3-haiku-20240307` - Schnell und kostengünstig

**Beispiel für Bildanalyse:**
```typescript
// Claude 3 unterstützt Bildanalyse
const response = await router.routePrompt(
  "Analysiere dieses Bild und beschreibe was du siehst",
  {
    provider: "anthropic",
    model: "claude-3-sonnet-20240229",
    attachments: [{ type: "image", url: "data:image/jpeg;base64,..." }]
  }
);
```

### Cohere Setup

```json
{
  "modelRouter.cohereApiKey": "...",
  "modelRouter.cohere.defaultModel": "command-r-plus",
  "modelRouter.cohere.maxTokens": 4096
}
```

**Verfügbare Modelle:**
- `command-r-plus` - Fortschrittlichstes Modell mit Tool-Use
- `command-r` - Ausgewogenes Allround-Modell
- `command` - Basis Chat-Modell
- `command-nightly` - Experimentelle Features

**Spezielle Cohere Features:**
```typescript
// Klassifikation
const classification = await cohereProvider.classify(
  ["This product is amazing!"],
  [
    { text: "Great product", label: "positive" },
    { text: "Terrible quality", label: "negative" }
  ]
);

// Text-Generierung
const generation = await cohereProvider.generate(
  "command",
  "Write a story about a robot learning to paint"
);
```

### Ollama Setup (Lokale Modelle)

```json
{
  "modelRouter.ollamaBaseUrl": "http://localhost:11434",
  "modelRouter.ollama.defaultModel": "llama2:7b",
  "modelRouter.ollama.temperature": 0.7
}
```

**Installation von Ollama:**
1. **Lade Ollama herunter:** [ollama.ai](https://ollama.ai)
2. **Starte Ollama:** `ollama serve`
3. **Installiere Modelle:** `ollama pull llama2:7b`

**Beliebte Modelle:**
- `llama2:7b` - Meta's LLaMA 2 (7B Parameter)
- `codellama:13b` - Code-spezialisierte Variante
- `mistral:7b` - Mistral AI's effizientes Modell
- `neural-chat:7b` - Chat-optimiertes Modell

## 🎤 Sprachsteuerung

### Grundlegende Sprachbefehle

**Aktivierung:**
- Tastenkombination: `Ctrl+Shift+V`
- Wake-Word: "Guido" (konfigurierbar)

**Standard-Befehle:**

```typescript
// Code-Erklärung
"Guido, erkläre diesen Code"
"Was macht diese Funktion?"
"Code-Erklärung für die Auswahl"

// Test-Generierung  
"Generiere Tests für diesen Code"
"Erstelle Unit Tests"
"Test schreiben"

// Refaktorierung
"Refaktoriere diesen Code"
"Code verbessern"
"Optimiere die Auswahl"

// Dokumentation
"Dokumentiere diese Funktion"
"Erstelle JSDoc Kommentare"
"Schreibe Dokumentation"

// Code-Optimierung
"Optimiere diesen Code"
"Performance verbessern"
"Code-Optimierung durchführen"
```

### Context-Aware Voice Commands

Die neue **ContextAwareVoiceCommands** Klasse bietet erweiterte sprachgesteuerte Funktionen:

```typescript
// Beispiel für kontextbewusste Befehle
const voiceCommands = new ContextAwareVoiceCommands(router, voiceController);

// Automatische Kontext-Extraktion
await voiceCommands.processCommand("erkläre diesen Code");
// → Analysiert aktuelle Auswahl, Sprache, Dateikontext

// Custom Commands laden
const customCommands = new Map([
  ["code review", "Führe ein umfassendes Code-Review durch für {selection}"],
  ["security check", "Analysiere {selection} auf Sicherheitslücken"],
  ["performance analysis", "Analysiere die Performance von {selection}"]
]);
voiceCommands.loadCustomCommands(customCommands);
```

### Erweiterte Sprachkonfiguration

```json
{
  "modelRouter.voice.enabled": true,
  "modelRouter.voice.wakeWord": "Guido",
  "modelRouter.voice.language": "de-DE",
  "modelRouter.voice.continuous": false,
  "modelRouter.voice.confidenceThreshold": 0.8,
  "modelRouter.voice.customCommands": {
    "code review": "Führe ein Code-Review durch für {selection}",
    "explain architecture": "Erkläre die Architektur von {filename}",
    "generate docs": "Erstelle Dokumentation für {selection}"
  }
}
```

**Verfügbare Variablen für Custom Commands:**
- `{selection}` - Aktuell ausgewählter Text
- `{filename}` - Name der aktuellen Datei
- `{language}` - Programmiersprache der Datei
- `{filecontent}` - Gesamter Dateiinhalt
- `{cursor}` - Cursor-Position

## 📊 Dashboard & Monitoring

### Advanced Dashboard

Das neue **Advanced Dashboard** bietet umfassende Überwachung und Verwaltung:

**Aktivierung:**
```bash
Ctrl+Shift+P → "Guido: Advanced Dashboard"
```

### Dashboard Features

#### 1. Routing Visualizer
```typescript
// Analysiert Routing-Entscheidungen in Echtzeit
const analysis = await router.analyzeRouting("Erkläre mir diese Funktion");

// Zeigt:
// - Angewandte Routing-Regeln
// - Score pro Regel
// - Gewählter Provider/Model
// - Alternative Optionen
// - Konfidenz-Level
```

#### 2. Nutzungsstatistiken
```typescript
// Detaillierte Nutzungsanalyse
const stats = router.getUsageStats();

console.log(stats);
// {
//   daily: { requests: 42, tokens: 15420, cost: 0.23 },
//   weekly: { requests: 287, tokens: 98540, cost: 1.67 },
//   monthly: { requests: 1204, tokens: 412890, cost: 7.23 },
//   topModels: [...],
//   costBreakdown: {...}
// }
```

#### 3. Ollama Model Manager
- **Modell-Installation:** Direkt aus dem Dashboard
- **Model-Status:** Live-Überwachung laufender Modelle
- **Memory-Usage:** Speicherverbrauch pro Modell
- **Performance-Metriken:** Antwortzeiten und Erfolgsraten

#### 4. Live Monitoring
- **Aktive Verbindungen** zu Providern
- **Durchschnittliche Antwortzeiten**
- **Erfolgsraten** pro Provider
- **Echtzeit-Aktivitätsprotokoll**

### Kostenüberwachung

```typescript
// Automatische Kostenverfolgung
const costTracking = {
  dailyLimit: 5.00,     // EUR pro Tag
  weeklyLimit: 30.00,   // EUR pro Woche
  monthlyLimit: 100.00, // EUR pro Monat
  
  // Alert-Schwellenwerte
  alerts: {
    "80%": "E-Mail Warnung",
    "95%": "Stopp neuer Anfragen",
    "100%": "Komplett blockieren"
  }
};

// Budget-Management
await router.updateCostLimit(10.0);
const currentUsage = router.getDailyCost();
const remaining = router.getRemainingBudget();
```

## 🔧 API Referenz

### ModelRouter Klasse

```typescript
class ModelRouter {
  // Basis-Routing
  async routePrompt(prompt: string, options?: RoutingOptions): Promise<AIResponse>
  
  // Multi-Model Operationen
  async executeParallel(prompt: string, providers: ProviderConfig[]): Promise<AIResponse[]>
  async executeSequential(prompt: string, providers: ProviderConfig[]): Promise<AIResponse[]>
  async generateConsensus(prompt: string, providers: ProviderConfig[]): Promise<ConsensusResponse>
  async compareResponses(prompt: string, providers: ProviderConfig[]): Promise<ComparisonResponse>
  
  // Provider-Management
  async initialize(): Promise<void>
  getAvailableProviders(): string[]
  async toggleProvider(providerId: string, enabled: boolean): Promise<void>
  
  // Kosten & Usage
  getUsageStats(): UsageStatistics
  async estimateCost(provider: string, model: string, inputTokens: number, outputTokens: number): Promise<number>
  getDailyCost(): number
  getRemainingBudget(): number
  
  // Konfiguration
  async updateRoutingMode(mode: RoutingMode): Promise<void>
  async updateCostLimit(limit: number): Promise<void>
}
```

### Provider Interfaces

```typescript
interface Provider {
  // Basis-Methoden
  validateApiKey(): Promise<boolean>
  getAvailableModels(): Promise<ModelInfo[]>
  estimateCost(model: string, inputTokens: number, outputTokens: number): number
  
  // Chat-Funktionen
  chat(model: string, messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse>
  chatStream(model: string, messages: ChatMessage[], onChunk: (chunk: string) => void, options?: ChatOptions): Promise<AIResponse>
  
  // Erweiterte Features (optional)
  supportsImageAnalysis?(model: string): boolean
  supportsFunctionCalling?(model: string): boolean
  supportsStreaming?(model: string): boolean
}
```

### Routing Options

```typescript
interface RoutingOptions {
  provider?: string          // Spezifischer Provider
  model?: string            // Spezifisches Modell
  mode?: RoutingMode        // Routing-Strategie
  maxCost?: number          // Kosten-Limit für diese Anfrage
  temperature?: number      // Model-Temperature
  maxTokens?: number        // Token-Limit
  stream?: boolean          // Streaming aktivieren
  context?: ContextInfo     // Zusätzlicher Kontext
}

type RoutingMode = 
  | 'auto'          // Automatische Auswahl
  | 'speed'         // Geschwindigkeit priorisieren
  | 'quality'       // Qualität priorisieren
  | 'cheap'         // Kosten minimieren
  | 'local-only'    // Nur lokale Modelle
  | 'privacy-strict' // Strenger Datenschutz
```

### Response Types

```typescript
interface AIResponse {
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  cost: number
  provider: string
  model: string
  timestamp: Date
  responseTime: number
}

interface ConsensusResponse extends AIResponse {
  sourceResponses: AIResponse[]
  confidenceScore: number
  agreementLevel: number
}

interface ComparisonResponse {
  responses: AIResponse[]
  analysis: string
  recommendation: string
  summary: {
    fastest: AIResponse
    cheapest: AIResponse
    highestQuality: AIResponse
  }
}
```

## 🧪 Entwicklung & Testing

### Entwicklungsumgebung Setup

```bash
# Projekt klonen
git clone https://github.com/model-router/guido-model-router.git
cd guido-model-router

# Dependencies installieren
npm install

# TypeScript kompilieren
npm run compile

# Tests ausführen
npm test

# Test Coverage
npm run test:coverage

# Watch-Modus für Entwicklung
npm run watch
```

### Testing Framework (Jest)

**Test-Struktur:**
```
test/
├── setup.ts                           # Test-Setup und Mocks
├── providers/
│   ├── anthropic.test.ts              # Anthropic Provider Tests
│   ├── cohere.test.ts                 # Cohere Provider Tests
│   └── openai.test.ts                 # OpenAI Provider Tests
├── voice/
│   └── contextAwareVoiceCommands.test.ts # Voice Command Tests
├── integration/
│   └── router.integration.test.ts      # Integration Tests
└── ui/
    └── dashboard.test.ts               # UI Tests
```

**Beispiel Test:**
```typescript
// test/providers/anthropic.test.ts
describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider('test-key');
  });

  test('should estimate cost correctly', () => {
    const cost = provider.estimateCost('claude-3-sonnet-20240229', 1000, 1000);
    expect(cost).toBeCloseTo(0.018, 6);
  });

  test('should handle streaming responses', async () => {
    // Mock fetch for streaming
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: mockStreamBody
    });

    const chunks: string[] = [];
    await provider.chatStream(
      'claude-3-sonnet-20240229',
      [{ role: 'user', content: 'Hello' }],
      (chunk) => chunks.push(chunk)
    );

    expect(chunks.length).toBeGreaterThan(0);
  });
});
```

**Test-Befehle:**
```bash
# Alle Tests
npm test

# Spezifische Test-Suite
npm test -- --testPathPattern=providers

# Watch-Modus
npm run test:watch

# Coverage Report
npm run test:coverage
```

### Build & Package

```bash
# Produktions-Build
npm run vscode:prepublish

# Extension packen
npm run package

# Installation testen
code --install-extension model-router-0.1.9.vsix
```

## 🏢 Enterprise Features

### Sicherheit & Compliance

**API-Key Management:**
```typescript
// Sichere API-Key Speicherung
const keyManager = new SecureKeyManager();
await keyManager.storeKey('openai', apiKey, { encrypted: true });

// Key-Rotation
await keyManager.rotateKey('anthropic', newApiKey);

// Audit-Logging
keyManager.on('keyAccess', (event) => {
  console.log(`Key accessed: ${event.provider} at ${event.timestamp}`);
});
```

**Datenschutz-Modi:**
```json
{
  "modelRouter.privacy.mode": "strict",
  "modelRouter.privacy.localOnly": true,
  "modelRouter.privacy.noCloudStorage": true,
  "modelRouter.privacy.anonymizeRequests": true,
  "modelRouter.privacy.auditLog": true
}
```

### Team-Konfiguration

**Shared Configuration:**
```json
// .vscode/settings.json (Team-Settings)
{
  "modelRouter.team.defaultProvider": "anthropic",
  "modelRouter.team.budgetPerUser": 10.0,
  "modelRouter.team.allowedModels": [
    "claude-3-sonnet-20240229",
    "gpt-4o-mini"
  ],
  "modelRouter.team.restrictPrivateData": true
}
```

**Usage Analytics:**
```typescript
// Team-weite Nutzungsanalyse
const teamAnalytics = await router.getTeamAnalytics();

// {
//   totalUsers: 25,
//   totalCost: 156.78,
//   avgCostPerUser: 6.27,
//   topUsers: [...],
//   modelDistribution: {...},
//   peakUsageHours: [...]
// }
```

### Integration mit CI/CD

**GitHub Actions Workflow:**
```yaml
# .github/workflows/ai-code-review.yml
name: AI Code Review
on: [pull_request]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Guido Model Router
        run: |
          npm install -g @model-router/cli
          guido configure --provider anthropic --key ${{ secrets.ANTHROPIC_KEY }}
      
      - name: AI Code Review
        run: |
          guido review --files "src/**/*.ts" --output review.md
      
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('review.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: review
            });
```

### Monitoring & Alerting

**Prometheus Metriken:**
```typescript
// metrics/prometheus.ts
export const metrics = {
  requestsTotal: new Counter({
    name: 'guido_requests_total',
    help: 'Total AI requests',
    labelNames: ['provider', 'model', 'status']
  }),
  
  requestDuration: new Histogram({
    name: 'guido_request_duration_seconds',
    help: 'Request duration',
    labelNames: ['provider', 'model']
  }),
  
  costTotal: new Counter({
    name: 'guido_cost_total',
    help: 'Total cost in USD',
    labelNames: ['provider', 'model']
  })
};
```

**Alerting Rules:**
```yaml
# alerting/rules.yml
groups:
  - name: guido.rules
    rules:
      - alert: HighCostUsage
        expr: increase(guido_cost_total[1h]) > 10
        labels:
          severity: warning
        annotations:
          summary: "High AI cost usage detected"
          
      - alert: ProviderDown
        expr: up{job="guido-provider"} == 0
        labels:
          severity: critical
        annotations:
          summary: "AI Provider unavailable"
```

## 🔍 Troubleshooting

### Häufige Probleme

#### 1. API-Key Fehler
```
Error: Invalid API key for provider 'anthropic'
```

**Lösung:**
```bash
# VS Code Settings überprüfen
# Oder direkt in settings.json:
{
  "modelRouter.anthropicApiKey": "sk-ant-api03-..."
}

# Key-Validation testen
guido validate-keys
```

#### 2. Ollama Verbindungsfehler
```
Error: Could not connect to Ollama at http://localhost:11434
```

**Lösung:**
```bash
# Ollama Status prüfen
ollama serve

# Oder in VS Code Settings:
{
  "modelRouter.ollamaBaseUrl": "http://localhost:11434"
}

# Firewall/Netzwerk prüfen
curl http://localhost:11434/api/tags
```

#### 3. Spracherkennung funktioniert nicht
```
Error: Speech recognition not supported
```

**Lösung:**
```javascript
// Browser-Kompatibilität prüfen
if ('webkitSpeechRecognition' in window) {
  // Unterstützt
} else {
  // Nicht unterstützt - alternatives Interface nutzen
}

// VS Code Settings:
{
  "modelRouter.voice.enabled": true,
  "modelRouter.voice.language": "de-DE"
}
```

#### 4. Hohe Kosten
```
Warning: Daily cost limit exceeded (€5.23/€5.00)
```

**Lösung:**
```json
{
  "modelRouter.maxCostPerDay": 10.0,
  "modelRouter.routingMode": "cheap",
  "modelRouter.preferLocalModels": true
}
```

### Debug-Modus

```json
{
  "modelRouter.debug.enabled": true,
  "modelRouter.debug.logLevel": "verbose",
  "modelRouter.debug.logRequests": true,
  "modelRouter.debug.logResponses": false
}
```

**Debug-Output:**
```typescript
// Debug-Informationen im Output Panel
console.log('Router Debug:', {
  selectedProvider: 'anthropic',
  selectedModel: 'claude-3-sonnet-20240229',
  routingRules: appliedRules,
  estimatedCost: 0.023,
  responseTime: 1234
});
```

### Performance Optimierung

**Caching aktivieren:**
```json
{
  "modelRouter.cache.enabled": true,
  "modelRouter.cache.ttl": 3600,
  "modelRouter.cache.maxSize": 100
}
```

**Request Batching:**
```json
{
  "modelRouter.batching.enabled": true,
  "modelRouter.batching.maxBatchSize": 5,
  "modelRouter.batching.timeout": 1000
}
```

### Logs & Diagnostics

**Log-Locations:**
- **VS Code Output Panel:** "Guido Model Router"
- **Debug Console:** Detaillierte Debug-Informationen
- **File Logs:** `~/.vscode/extensions/model-router.guido-model-router/logs/`

**Diagnostics sammeln:**
```bash
# Vollständige Diagnose
guido diagnose --output diagnose.json

# System-Info
guido system-info

# Provider-Status
guido provider-status --all
```

## 📚 Weitere Ressourcen

### Dokumentation
- **API Docs:** [docs.guido-router.dev](https://docs.guido-router.dev)
- **Examples:** [github.com/model-router/examples](https://github.com/model-router/examples)
- **Tutorials:** [learn.guido-router.dev](https://learn.guido-router.dev)

### Community
- **GitHub Issues:** [github.com/model-router/guido-model-router/issues](https://github.com/model-router/guido-model-router/issues)
- **Discussions:** [github.com/model-router/guido-model-router/discussions](https://github.com/model-router/guido-model-router/discussions)
- **Discord:** [discord.gg/guido-router](https://discord.gg/guido-router)

### Provider-spezifische Dokumentation
- **OpenAI:** [platform.openai.com/docs](https://platform.openai.com/docs)
- **Anthropic:** [docs.anthropic.com](https://docs.anthropic.com)
- **Cohere:** [docs.cohere.ai](https://docs.cohere.ai)
- **Ollama:** [ollama.ai/docs](https://ollama.ai/docs)

---

**© 2024 Model Router Team | MIT License**
