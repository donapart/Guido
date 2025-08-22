# Model Router für VSCode/Cursor mit Guido Voice Control 🎤

> Sprache / Language: **Deutsch** | [English](./README.en.md)

<!-- TOC START -->
<!-- TOC END -->

Eine intelligente VSCode-Extension, die **automatisch das optimale KI-Modell** für jede Aufgabe auswählt. Mit **vollständiger Sprachsteuerung "Guido"**, Unterstützung für OpenAI, DeepSeek, Grok, Phi, Ollama und anderen Providern.

## 🎯 Features

### ⚡ Intelligentes Routing

- Automatische Modellauswahl (Prompt-Inhalt, Dateityp, Kontext)
- Regelbasiertes System + optionaler LLM-Classifier
- Fallback-Mechanismen (Ausfälle, Rate Limits)

### 🌐 Multi-Provider-Unterstützung

- OpenAI (GPT‑4o, GPT‑4o-mini, GPT‑4.1)
- DeepSeek (v3, r1 Reasoning)
- Grok (xAI)
- Microsoft Phi (4, 4-mini)
- Ollama (lokal: Llama, Qwen, CodeLlama)
- Beliebige OpenAI-kompatible APIs

### 💰 Kostenbewusstsein

- Live-Kostenschätzung vor Ausführung
- Budget (Tag/Monat) + Hard-Stop + Warnschwelle
- Ausgaben-Tracking & Statistiken
- Preisvergleich je Modell

### 🔒 Sicherheit & Datenschutz

- Sichere SecretStorage API-Key Ablage
- Privacy-Modi: `privacy-strict`, `local-only`, `offline`
- Redaktions-Filter & Pfad-Regeln
- Keine Klartext-Speicherung sensibler Werte

### 🎨 UI & Bedienung

- Floating Chat Panel & Dock-View (synchron)
- Model Override Dropdown
- Anhänge-Zusammenfassung + Secret-Redaktion
- Kosten-Footer (tatsächliche Usage)
- Tools-Menü (Simulation, Budget, Resend, Clear)
- Plan / Agent: Plan erzeugen & Schritte sequenziell ausführen (Streaming & Abbruch)
- Statusbar: Modus, Budget, Plan-Fortschritt `$(sync~spin) Plan 2/5`
- Voice-State Indikator (idle/listening/recording/processing)
- QuickPrompt Kompaktmodus
- Vollständige Command-Palette Integration

## 🚀 Installation

### 1. Voraussetzungen

- VSCode 1.90.0+
- Node.js 20+
- Optional: Ollama für lokale Modelle

### 2. Entwicklungsversion

```bash
git clone <repository-url>
cd model-router
npm install
npm run compile
# F5 in VSCode (Run Extension)
```

### 3. Aus VSIX

```bash
npm run package
# VSCode: Extensions: Install from VSIX
```

### 4. Struktur

```text
workspace/
├── router.config.yaml
└── .vscode/settings.json
```

## ⚙️ Konfiguration

### Beispiel `router.config.yaml`

```yaml
version: 1
activeProfile: default

profiles:
  default:
    mode: auto
    budget:
      dailyUSD: 2.50
      monthlyUSD: 50
      hardStop: true
      warningThreshold: 80
    privacy:
      redactPaths: ["**/secrets/**", "**/.env*"]
      stripFileContentOverKB: 256
      allowExternal: true
    providers:
      - id: openai
        kind: openai-compat
        baseUrl: https://api.openai.com/v1
        apiKeyRef: OPENAI_API_KEY
        models:
          - name: gpt-4o-mini
            context: 128000
            caps: ["cheap","tools","json"]
            price:
              inputPerMTok: 0.15
              outputPerMTok: 0.60
      - id: ollama
        kind: ollama
        baseUrl: http://127.0.0.1:11434
        models:
          - name: llama3.3:70b-instruct
            context: 32768
            caps: ["local","long","tools"]
    routing:
      rules:
        - id: cheap-tests
          if:
            anyKeyword: ["test","unit test","boilerplate"]
            fileLangIn: ["ts","js","py"]
          then:
            prefer: ["openai:gpt-4o-mini"]
            target: chat
        - id: privacy
          if:
            privacyStrict: true
          then:
            prefer: ["ollama:llama3.3:70b-instruct"]
            target: chat
      default:
        prefer: ["openai:gpt-4o-mini","ollama:llama3.3:70b-instruct"]
        target: chat
```

### VSCode Settings (`settings.json`)

```json
{
  "modelRouter.configPath": "${workspaceFolder}/router.config.yaml",
  "modelRouter.mode": "auto",
  "modelRouter.enablePromptClassifier": false
}
```

## 🔑 API-Keys

### Methode 1 (Command Palette)
1. Ctrl+Shift+P → "Model Router: Set API Key"
2. Provider-ID (z.B. `openai`)
3. Key eingeben

### Methode 2 (Environment)

```bash
export OPENAI_API_KEY="sk-..."
export DEEPSEEK_API_KEY="sk-..."
```

Dann: Ctrl+Shift+P → "Model Router: Import API Keys"

## 🎮 Nutzung

### Chat Varianten

Floating Panel: Command "Model Router: Open Chat UI"

Docked View: aktiv bei Setting `modelRouter.chat.showDockView`.

**Funktionen:** Streaming, Modell-Override, Anhänge (Snippet + Redaction), Kosten-Footer, Tools, Plan, Voice-State.

### QuickPrompt

```text
Setting "modelRouter.chat.compactMode": true
Command "Model Router: Quick Prompt (Kompaktmodus)"
```

### Plan / Agent

1. "Plan / Agent aus letztem Prompt" → nummerierter Plan (≤7)
2. "Ausgeführten Plan starten" → sequentielle Ausführung
3. "Plan-Ausführung abbrechen" → Abort aktueller Schritt

Währenddessen:
- Jeder Schritt eigenes Routing & Streaming
- Kosten pro Schritt erfasst (Budget aktiv)
- Verlaufseinträge: `[Plan Schritt X]` + Antwort
- Statusbar: `$(sync~spin) Plan X/N`

Nach Abschluss / Abbruch verschwindet der Indikator.

### Anhänge Einstellungen

```json
{
  "modelRouter.chat.attachment.maxFiles": 5,
  "modelRouter.chat.attachment.maxSnippetBytes": 8192,
  "modelRouter.chat.attachment.redactSecrets": true,
  "modelRouter.chat.attachment.additionalRedactPatterns": [
    "(?i)password\\s*[:=]\\s*['\"]?[A-Za-z0-9!@#$%^&*_-]{6,}"
  ]
}
```

### Persistenter Verlauf
`modelRouter.chat.persistHistory` speichert letzte 1000 Nachrichten (abschaltbar).

### Relevante Commands

| Command | Zweck |
|---------|-------|
| Open Chat UI | Chat Panel öffnen |
| Quick Prompt (Kompaktmodus) | Schneller Prompt ohne Panel |
| Chat Tools | Tools-Menü |
| Plan / Agent aus letztem Prompt | Plan generieren |
| Ausgeführten Plan starten | Plan ausführen |
| Plan-Ausführung abbrechen | Laufende Ausführung abbrechen |
| Show Costs | Kostenübersicht |
| Switch Mode | Modus wechseln |

## 📊 Routing-Regeln

Beispiel siehe oben (Konfiguration). Bedingungen: `anyKeyword`, `fileLangIn`, `privacyStrict`, Größenbeschränkungen etc.

## 💰 Budget & Statusbar

Statusbar zeigt Modus + optional Budget + Plan-Fortschritt.

Settings:
```json
{
  "modelRouter.showBudgetInStatusBar": true,
  "modelRouter.budgetDisplayMode": "compact"
}
```

Plan-Beispiel:
```text
$(rocket) Router: auto (2) | $0.12/2.50 | $(sync~spin) Plan 2/5
```

## 🔒 Datenschutz

`privacy-strict` erzwingt lokale Modelle, blockt externe Calls, redaktiert Pfade.

```yaml
privacy:
  redactPaths:
    - "**/secrets/**"
    - "**/.env*"
  stripFileContentOverKB: 256
  allowExternal: false
```

## 🛠 Entwicklung

```bash
npm install
npm run watch
# F5 Development Host
```

Struktur:
```text
src/
├── extension.ts
├── config.ts
├── router.ts
├── secret.ts
├── price.ts
├── promptClassifier.ts
├── providers/
└── mcp/server.ts
```

## 🔧 Problembehandlung

**Router nicht initialisiert**: Config prüfen, API-Key setzen, Fenster reload.

**Provider nicht verfügbar**: Verbindung testen, Key prüfen, Proxy/Firewall.

**Kein Modell gefunden**: Routing-Regeln / Fallbacks anpassen.

**Ollama**:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.3:70b-instruct
ollama serve
```

## 📋 Roadmap

### v0.2.0
- Tool-Calling
- MCP-Vertiefung
- Team-Konfigurationen

### v0.3.0
- Anthropic Claude
- Azure OpenAI
- Benchmarks / A-B Tests

### v0.4.0
- Workflow-Automatisierung
- Enterprise / Telemetrie Dashboard

## 📄 Lizenz

MIT – siehe [LICENSE](LICENSE).

## 🙏 Danksagungen

VSCode Team · OpenAI · DeepSeek · xAI · Ollama Community · MCP Contributors

---

Fragen? Issue oder Discussions öffnen.

## 🖼️ Neue UI-Assets

### Marketplace-Icon
Das Marketplace-Icon ist ein 512×512 PNG und wird in der Datei `images/extension-icon-512.png` gespeichert.

### Activity Bar Icons
Die Activity Bar verwendet monochrome SVGs für Dark- und Light-Themes:
- Light Theme: `resources/activity/light/guido_activity_light.svg`
- Dark Theme: `resources/activity/dark/guido_activity_dark.svg`

### Statusbar und Webview
Für die Statusbar und Webview-Buttons werden PNGs in den Größen 32×32 oder 48×48 verwendet.

## Version 0.1.3

### Änderungen
- Fallback-Mechanismus für Konfigurationspfad hinzugefügt.
- Verbesserte Sprachsteuerung mit Mikrofonberechtigungsprüfung.

### Neue Funktionen
- Unterstützung für Cursor-Modell-Router.

### Installation
1. Laden Sie die VSIX-Datei herunter.
2. Installieren Sie die Erweiterung in VSCode über `Extensions > Install from VSIX`.

### Cursor-Modell-Router
Der Cursor-Modell-Router ermöglicht eine präzise Steuerung von Modellen basierend auf Cursor-Positionen.
