# Model Router für VSCode/Cursor mit Guido Voice Control 🎤

> Sprache / Language: **Deutsch** | [English](./README.en.md)

<!-- TOC START -->
<!-- TOC END -->

Eine intelligente VSCode-Extension, die **automatisch das optimale KI-Modell** für jede Aufgabe auswählt. Mit **vollständiger Sprachsteuerung "Guido"**, Unterstützung für OpenAI, DeepSeek, Grok, Phi, Ollama und anderen Providern.

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

### 🎨 Benutzerfreundlichkeit & UI

- **Webview Chat Panel** (floating) & **andockbare Chat-View** im Explorer
- **Model Override Dropdown** direkt im Chat
- **Anhänge-Zusammenfassung** (Snippet, Secret-Redaktion konfigurierbar)
- **Kosten-Footer** mit tatsächlichen Tokenwerten
- **Tools-Menü** (Routing-Simulation, Budget, Resend, Clear)
- **Plan / Agent**: Schrittplan generieren (Ausbau geplant: Ausführung)
- **Voice-State Indikator** (idle / listening / recording / processing)
- **Statusbar-Integration** (Modus + optional Budget)
- **QuickPrompt-Kompaktmodus** für schnelle Prompts ohne Panel
- **Command Palette** Integration kompletter Funktionen

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

### Chat-Interface Varianten

1. Panel (floating):

```text
Ctrl+Shift+P → "Model Router: Open Chat UI"
```

1. Docked View (Explorer): automatisch sichtbar falls Einstellung aktiv (`modelRouter.chat.showDockView`).

Funktionen im Chat:

- Eingabefeld mit Shift+Enter = Zeilenumbruch, Enter = Senden
- Toolbar Buttons: Tools, Mikrofon (Voice starten), Speaker (Placeholder), Attach (Dateien auswählen), Plan, Settings
- Modell-Auswahl (Override) oben links (`auto` = Router entscheidet)
- Anhänge werden vor Versand auf max. Anzahl/Größe gekürzt und Geheimnisse (Regex) geschwärzt
- Streaming der Antwort in Nachricht, Abschluss zeigt Token & Kosten
- Info-Messages (Simulation, Plan, Budget) erscheinen kursiv

QuickPrompt (Kompaktmodus):

```text
Einstellung: "modelRouter.chat.compactMode": true
Command: "Model Router: Quick Prompt (Kompaktmodus)"
```
Sendet Prompt ohne zuerst Panel zu öffnen. Falls Chat offen ist, wird dort gestreamt, sonst Output-Channel.
### Docked Chat View

Die andockbare Ansicht (`💬 Model Router Chat (Dock)`) zeigt denselben Verlauf wie das Panel. Beide Oberflächen sind synchron (Modelle, History, Streaming). Zum Ausblenden: Rechtsklick auf Titel → Hide oder Einstellung `modelRouter.chat.showDockView` deaktivieren.

### Tools-Menü

Command oder Toolbar → Optionen:

- Routing-Simulation (zeigt ausgewähltes Modell + Alternativen)
- Kosten / Budget Übersicht (heute / Monat / total)
- Letzte Antwort erneut senden
- Verlauf löschen (auch Persistenz zurückgesetzt)

### Plan / Agent

Erzeugt einen nummerierten Plan (max 7 Schritte). Aktuell nur Planung; zukünftige Version führt Schritte sequenziell aus mit Zwischen-Feedback.

### Anhänge & Redaktion

Konfigurierbar über Einstellungen:

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
Zu große Dateien (>512KB) werden übersprungen. Nur die ersten N Bytes (Snippet) werden angezeigt. Geheimnisse durch Regex → `[REDACTED]`.

### Persistenter Verlauf

`modelRouter.chat.persistHistory`: speichert die letzten 1000 Nachrichten (user/assistant) in globalState. Abschaltbar für Privacy.

### Voice-State Integration

Wenn Voice aktiviert ist (Konfig), wird der Zustand live im Chat angezeigt (idle/listening/recording/processing). Wechsel per Voice Commands / Toolbar.

### Neue Commands (Zusatz)

| Command | Zweck |
|---------|-------|
| Model Router: Open Chat UI | Panel öffnen |
| Model Router: Quick Prompt (Kompaktmodus) | Schneller Prompt ohne Panel |
| Model Router: Chat Tools | Tools-Menü |
| Model Router: Plan / Agent aus letztem Prompt | Plan generieren |
| Model Router: Ausgeführten Plan starten | (Platzhalter zukünftige Ausführung) |
| Model Router: Plan-Ausführung abbrechen | Stoppt geplante Ausführung (geplant) |

### Relevante Einstellungen (Erweiterung)

| Einstellung | Beschreibung |
|------------|--------------|
| modelRouter.chat.compactMode | QuickPrompt statt Panel-Fluss |
| modelRouter.chat.persistHistory | Verlauf zwischen Sessions speichern |
| modelRouter.chat.showDockView | Docked Chat im Explorer |
| modelRouter.chat.attachment.maxFiles | Max. Anzahl Anhänge |
| modelRouter.chat.attachment.maxSnippetBytes | Snippet-Limit pro Datei |
| modelRouter.chat.attachment.redactSecrets | Aktiviert automatische Geheimnis-Redaktion |
| modelRouter.chat.attachment.additionalRedactPatterns | Zusätzliche Regexe |

### Einmaliges Routing

```text
Ctrl+Shift+P → "Model Router: Route Prompt Once"
```

- Text im Editor auswählen
- Modellvorschlag ohne Ausführung
- Zeigt Score und Begründung

### Modi wechseln

Klick auf Statusbar oder:

```text
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

```text
Model Router: Show Costs     # Ausgaben-Übersicht
```

### Statusbar-Anzeige (Budget)

Die Statusleiste zeigt – sofern aktiviert – den aktuellen Modus und optional den Budgetverbrauch an.

Einstellungen (`settings.json`):
```json
{
  "modelRouter.showBudgetInStatusBar": true,
  "modelRouter.budgetDisplayMode": "compact" // oder "detailed"
}
```

Modi:
- `compact`: `Router: auto (2) | $0.12/2.50`
- `detailed`: `Router: auto (2) | d:0.12/2.50 (5%) m:2.30/100 (2%)`

Legende:
- `d:` Tagesverbrauch / Tageslimit (+ Prozent)
- `m:` Monatsverbrauch / Monatslimit (+ Prozent)
- Fehlt ein Monatsbudget, wird nur der Tageswert angezeigt.

Farbanpassung erfolgt aktuell nicht dynamisch; Warnungen (z.B. 80% erreicht) erscheinen als VSCode-Notification und im Output-Channel. Hard-Stops verhindern weitere Aufrufe über dem Limit, sofern `hardStop: true` gesetzt ist.

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
