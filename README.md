# Model Router für VSCode/Cursor

Eine intelligente VSCode-Extension, die **automatisch das optimale KI-Modell** für jede Aufgabe auswählt. Mit Unterstützung für OpenAI, DeepSeek, Grok, Phi, Ollama und anderen Providern.

## 🎯 Features

### ⚡ Intelligentes Routing
- **Automatische Modellauswahl** basierend auf Prompt-Inhalt, Dateityp und Kontext
- **Regelbasiertes System** mit anpassbaren Routing-Regeln
- **Optionaler LLM-Classifier** für erweiterte Prompt-Analyse
- **Fallback-Mechanismen** bei Ausfällen oder Rate Limits

### 🌐 Multi-Provider-Unterstützung
- **OpenAI** (GPT-4o, GPT-4o-mini, GPT-4.1)
- **DeepSeek** (v3, r1 Reasoning)
- **Grok** (xAI)
- **Microsoft Phi** (4, 4-mini)
- **Ollama** (lokale Modelle: Llama, Qwen, CodeLlama)
- **Beliebige OpenAI-kompatible APIs**

### 💰 Kostenbewusstsein
- **Live-Kostenschätzung** vor Ausführung
- **Budget-Management** mit Tages- und Monatslimits
- **Ausgaben-Tracking** und Statistiken
- **Preisvergleich** zwischen Modellen

### 🔒 Sicherheit & Datenschutz
- **Sichere API-Key-Speicherung** über VSCode SecretStorage
- **Privacy-Modi**: `privacy-strict`, `local-only`, `offline`
- **Datenschutz-Filter** für sensible Dateipfade
- **Keine Klartext-Speicherung** von Geheimnissen

### 🎨 Benutzerfreundlichkeit
- **Statusbar-Integration** mit aktuellem Modus
- **QuickPick-Menüs** für Provider/Modell-Override
- **Output-Channel** für detaillierte Logs
- **Command Palette** Integration

## 🚀 Installation

### 1. Voraussetzungen
- VSCode 1.90.0 oder neuer
- Node.js 20+ (für Entwicklung)
- Optional: Ollama für lokale Modelle

### 2. Extension installieren

#### Entwicklungsversion (empfohlen)
```bash
# Repository klonen
git clone <repository-url>
cd model-router

# Dependencies installieren
npm install

# TypeScript kompilieren
npm run compile

# Extension in VSCode laden
# F5 drücken oder "Run Extension" in der Debug-Ansicht
```

#### Aus Package installieren
```bash
# Extension packen
npm run package

# In VSCode installieren: Ctrl+Shift+P -> "Extensions: Install from VSIX"
```

### 3. Konfiguration einrichten

Die Extension erstellt automatisch eine Standard-Konfiguration:
```
workspace/
├── router.config.yaml    # Haupt-Konfiguration
└── .vscode/
    └── settings.json     # VSCode-Einstellungen
```

## ⚙️ Konfiguration

### Basis-Konfiguration (router.config.yaml)

```yaml
version: 1
activeProfile: default

profiles:
  default:
    mode: auto  # auto|speed|quality|cheap|local-only|privacy-strict
    
    budget:
      dailyUSD: 2.50
      hardStop: true
      warningThreshold: 80
    
    privacy:
      redactPaths: ["**/secrets/**", "**/.env*"]
      stripFileContentOverKB: 256
      allowExternal: true
    
    providers:
      # OpenAI
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
      
      # Lokale Modelle via Ollama
      - id: ollama
        kind: ollama
        baseUrl: http://127.0.0.1:11434
        models:
          - name: llama3.3:70b-instruct
            context: 32768
            caps: ["local","long","tools"]
    
    routing:
      rules:
        # Tests → günstige Modelle
        - id: cheap-tests
          if:
            anyKeyword: ["test", "unit test", "boilerplate"]
            fileLangIn: ["ts","js","py"]
          then:
            prefer: ["openai:gpt-4o-mini"]
            target: chat
        
        # Privacy → lokal erzwingen
        - id: privacy
          if:
            privacyStrict: true
          then:
            prefer: ["ollama:llama3.3:70b-instruct"]
            target: chat
      
      default:
        prefer: ["openai:gpt-4o-mini", "ollama:llama3.3:70b-instruct"]
        target: chat
```

### VSCode-Einstellungen

```json
{
  "modelRouter.configPath": "${workspaceFolder}/router.config.yaml",
  "modelRouter.mode": "auto",
  "modelRouter.enablePromptClassifier": false
}
```

## 🔑 API-Keys einrichten

### Methode 1: Command Palette
1. `Ctrl+Shift+P` → "Model Router: Set API Key"
2. Provider-ID eingeben (z.B. `openai`)
3. API-Key eingeben

### Methode 2: Umgebungsvariablen
```bash
# .env oder System-Umgebung
export OPENAI_API_KEY="sk-..."
export DEEPSEEK_API_KEY="sk-..."
export GROK_API_KEY="..."
```

Dann: `Ctrl+Shift+P` → "Model Router: Import API Keys"

### Unterstützte Provider

| Provider | API-Key Format | Basis-URL |
|----------|----------------|-----------|
| OpenAI | `sk-...` | `https://api.openai.com/v1` |
| DeepSeek | `sk-...` | `https://api.deepseek.com/v1` |
| Grok (xAI) | varies | `https://api.x.ai/v1` |
| Phi | varies | provider-specific |
| Ollama | none | `http://127.0.0.1:11434` |

## 🎮 Nutzung

### Chat-Interface
```
Ctrl+Shift+P → "Model Router: Chat"
```
- Prompt eingeben
- Extension wählt automatisch das beste Modell
- Live-Kostenschätzung und Begründung
- Streaming-Response im Output-Channel

### Einmaliges Routing
```
Ctrl+Shift+P → "Model Router: Route Prompt Once"
```
- Text im Editor auswählen
- Modellvorschlag ohne Ausführung
- Zeigt Score und Begründung

### Modi wechseln
Klick auf Statusbar oder:
```
Ctrl+Shift+P → "Model Router: Switch Mode"
```

**Verfügbare Modi:**
- `auto` – Intelligente Auswahl basierend auf Kontext
- `speed` – Schnellste verfügbare Modelle
- `quality` – Hochwertigste Modelle (teurer)
- `cheap` – Günstigste Modelle
- `local-only` – Nur lokale Modelle (Ollama)
- `privacy-strict` – Strenger Datenschutz, keine externen APIs

### Weitere Commands

| Command | Beschreibung |
|---------|--------------|
| `Model Router: Open Config` | Konfigurationsdatei öffnen |
| `Model Router: Show Costs` | Ausgaben-Übersicht |
| `Model Router: Test Connection` | Provider-Verbindungen testen |
| `Model Router: Classify Prompt` | Prompt-Klassifikation anzeigen |
| `Model Router: Simulate Routing` | Routing simulieren |

## 📊 Routing-Regeln

### Regel-Struktur

```yaml
- id: regel-name
  if:
    anyKeyword: ["test", "debug"]      # Enthält eines dieser Wörter
    allKeywords: ["fix", "bug"]        # Enthält alle diese Wörter  
    fileLangIn: ["ts", "js", "py"]     # Dateityp
    filePathMatches: ["**/test/**"]    # Pfad-Pattern
    minContextKB: 128                  # Mindest-Dateigröße
    maxContextKB: 512                  # Maximal-Dateigröße
    privacyStrict: true                # Privacy-Modus
    mode: ["quality", "speed"]         # Aktiver Modus
  then:
    prefer: ["provider:model", "..."]  # Bevorzugte Modelle
    target: chat                       # Ziel-Art
    priority: 10                       # Zusätzliche Priorität
```

### Beispiel-Regeln

```yaml
# Unit Tests → günstige Modelle
- id: unit-tests
  if:
    anyKeyword: ["test", "spec", "jest", "pytest"]
    fileLangIn: ["ts", "js", "py"]
  then:
    prefer: ["openai:gpt-4o-mini", "phi:phi-4-mini"]
    target: chat

# Komplexe Algorithmen → Reasoning-Modelle  
- id: complex-algorithms
  if:
    anyKeyword: ["algorithm", "complexity", "optimize", "prove"]
  then:
    prefer: ["deepseek:deepseek-r1", "openai:gpt-4.1"]
    target: chat

# Große Refactorings → Long-Context
- id: large-refactor
  if:
    minContextKB: 200
    anyKeyword: ["refactor", "restructure"]
  then:
    prefer: ["openai:gpt-4.1", "phi:phi-4"]
    target: chat

# Privacy-Mode → nur lokal
- id: privacy-only
  if:
    privacyStrict: true
  then:
    prefer: ["ollama:llama3.3:70b-instruct"]
    target: chat
```

## 💰 Budget-Management

### Konfiguration
```yaml
budget:
  dailyUSD: 5.0        # Tagesdeckel
  monthlyUSD: 100.0    # Monatsdeckel  
  hardStop: true       # Bei Überschreitung stoppen
  warningThreshold: 80 # Warnung bei 80% Verbrauch
```

### Kosten-Tracking
- Automatische Kostenerfassung nach jeder API-Anfrage
- Aufschlüsselung nach Provider und Modell
- Export für externe Analyse
- Budget-Warnungen und Hard-Stops

### Commands
```
Model Router: Show Costs     # Ausgaben-Übersicht
```

Zeigt:
- Tagesausgaben vs. Budget
- Monatsausgaben vs. Budget  
- Transaktionsanzahl
- Top-Provider und -Modelle
- Ausgaben-Trend

## 🔒 Datenschutz & Sicherheit

### API-Key-Sicherheit
- **VSCode SecretStorage**: Nutzt System-Keychain (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- **Keine Klartext-Speicherung**: Keys werden nie in Konfigurationsdateien gespeichert
- **Umgebungsvariablen-Fallback**: Sichere Alternative für Team-Setups

### Privacy-Modi

**`privacy-strict` Modus:**
- Erzwingt lokale Modelle (Ollama)
- Blockiert alle externen API-Calls
- Redaktiert sensible Dateipfade
- Strippt große Dateien automatisch

**Datenschutz-Filter:**
```yaml
privacy:
  redactPaths: 
    - "**/secrets/**"
    - "**/.env*" 
    - "**/credentials/**"
  stripFileContentOverKB: 256
  allowExternal: false  # Bei privacy-strict
```

### Offline-Betrieb
```yaml
mode: offline  # oder local-only
```
- Nur Ollama-Provider aktiv
- Keine Internetverbindung erforderlich
- Vollständig lokale Verarbeitung

## 🛠️ Entwicklung

### Setup
```bash
git clone <repo>
cd model-router
npm install
npm run compile
```

### Struktur
```
src/
├── extension.ts           # VSCode Extension Entry Point
├── config.ts             # YAML-Konfiguration  
├── router.ts             # Routing-Engine
├── secret.ts             # API-Key-Management
├── price.ts              # Kostenberechnung
├── promptClassifier.ts   # KI-Klassifikation
├── providers/
│   ├── base.ts          # Provider-Interface
│   ├── openaiCompat.ts  # OpenAI-kompatibel
│   └── ollama.ts        # Lokale Modelle
└── mcp/
    └── server.ts        # MCP-Integration
```

### Testing
```bash
# Extension in Development Host starten
npm run watch    # Auto-compile
F5              # Launch Extension Development Host

# Provider-Verbindungen testen
Ctrl+Shift+P → "Model Router: Test Connection"

# Routing-Simulation
Ctrl+Shift+P → "Model Router: Simulate Routing"
```

### Neue Provider hinzufügen
1. Provider-Klasse in `src/providers/` erstellen
2. `BaseProvider` erweitern
3. In `extension.ts` registrieren
4. Konfiguration in `router.config.yaml` ergänzen

## 🔧 Problembehandlung

### Häufige Probleme

**"Router nicht initialisiert"**
- Konfigurationsdatei prüfen: `Model Router: Open Config`
- API-Keys setzen: `Model Router: Set API Key`
- Extension neu laden: `Developer: Reload Window`

**"Provider nicht verfügbar"**
- Verbindung testen: `Model Router: Test Connection`
- API-Key prüfen
- Firewall/Proxy-Einstellungen überprüfen

**"Kein passendes Modell gefunden"**
- Routing-Regeln in Konfiguration prüfen
- Fallback-Modelle definieren
- Provider-Verfügbarkeit testen

**Ollama-Probleme**
```bash
# Ollama installieren
curl -fsSL https://ollama.ai/install.sh | sh

# Modell laden
ollama pull llama3.3:70b-instruct
ollama pull qwen2.5-coder:32b-instruct

# Server starten
ollama serve
```

### Logs aktivieren
Output-Channel öffnen: "View" → "Output" → "Model Router"

### Debug-Mode
```json
{
  "modelRouter.debug": true
}
```

## 🤝 Beitragen

### Issues
- Bug-Reports mit reproduzierbaren Schritten
- Feature-Requests mit Use-Cases
- Provider-spezifische Probleme mit Logs

### Pull Requests
1. Fork erstellen
2. Feature-Branch: `git checkout -b feature/neue-funktion`
3. Tests hinzufügen
4. PR erstellen mit Beschreibung

### Provider-Requests
Neue Provider können angefragt werden. Benötigt:
- API-Dokumentation
- Preismodell
- Beispiel-API-Keys (für Tests)

## 📋 Roadmap

### v0.2.0
- [ ] Webview-Chat-Interface
- [ ] Tool-Calling-Unterstützung
- [ ] Vollständige MCP-Integration
- [ ] Team-Konfigurationen

### v0.3.0
- [ ] Anthropic Claude Support
- [ ] Azure OpenAI Integration
- [ ] Performance-Benchmarking
- [ ] A/B-Testing für Modelle

### v0.4.0
- [ ] Workflow-Automatisierung
- [ ] GitHub Copilot Integration
- [ ] Enterprise-Features
- [ ] Telemetrie-Dashboard

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🙏 Danksagungen

- VSCode Team für die Extension API
- OpenAI, DeepSeek, xAI für die APIs
- Ollama Community für lokale Modelle
- MCP-Protokoll Contributors

---

**Weitere Fragen?** Öffne ein [Issue](../../issues) oder schaue in die [Diskussionen](../../discussions).
