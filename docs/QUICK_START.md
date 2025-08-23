# Guido Model Router - Quick Start Guide

## 🚀 Erste Schritte in 5 Minuten

Willkommen bei Guido Model Router! Diese Anleitung führt Sie durch die wichtigsten Features in wenigen Minuten.

## 📦 Installation

### Option 1: VS Code Marketplace
1. Öffnen Sie VS Code
2. Gehen Sie zu Extensions (`Ctrl+Shift+X`)
3. Suchen Sie nach "Guido Model Router"
4. Klicken Sie auf "Install"

### Option 2: Command Line
```bash
code --install-extension model-router.guido-model-router
```

## ⚙️ Grundkonfiguration

### 1. API-Keys einrichten

Drücken Sie `Ctrl+,` um die Einstellungen zu öffnen und suchen Sie nach "Model Router":

```json
{
  "modelRouter.openaiApiKey": "sk-proj-...",
  "modelRouter.anthropicApiKey": "sk-ant-...",
  "modelRouter.cohereApiKey": "...",
  "modelRouter.defaultProvider": "auto"
}
```

### 2. Ollama für lokale Modelle (optional)

```bash
# Ollama installieren (einmalig)
curl -fsSL https://ollama.ai/install.sh | sh

# Ollama starten
ollama serve

# Ein Modell herunterladen
ollama pull llama2:7b
```

## 🎯 Grundlegende Nutzung

### 1. Chat mit AI

```typescript
// Command Palette: Ctrl+Shift+P
// Suchen Sie nach "Model Router: Chat"

// Oder verwenden Sie die API direkt:
const response = await router.routePrompt("Erkläre mir was React ist");
console.log(response.content);
```

### 2. Code erklären lassen

1. **Wählen Sie Code aus** in Ihrem Editor
2. **Drücken Sie** `Ctrl+Shift+P`
3. **Suchen Sie** "Guido: Explain Code"
4. **Der AI erklärt** den ausgewählten Code

### 3. Sprachsteuerung aktivieren

1. **Drücken Sie** `Ctrl+Shift+V` oder sagen Sie "Guido"
2. **Sprechen Sie Ihren Befehl:**
   - "Erkläre diesen Code"
   - "Generiere Tests für diese Funktion"
   - "Refaktoriere diese Auswahl"

## 🎨 Routing-Modi

```json
{
  "modelRouter.routingMode": "auto" // Optionen:
  // "auto"     - Automatische Auswahl
  // "speed"    - Schnellste Antwort
  // "quality"  - Beste Qualität
  // "cheap"    - Kostengünstig
  // "local-only" - Nur lokale Modelle
}
```

## 📊 Dashboard öffnen

```bash
# Command Palette: Ctrl+Shift+P
# Suchen nach: "Guido: Advanced Dashboard"
```

Das Dashboard zeigt:
- 📈 **Nutzungsstatistiken** (Requests, Kosten, Tokens)
- 🎯 **Routing Visualizer** (Warum welches Modell gewählt wurde)
- 🦙 **Ollama Model Manager** (Modelle installieren/verwalten)
- 💰 **Kostenüberwachung** (Tägliche/monatliche Limits)

## 🔊 Sprachbefehle

### Standard-Befehle:

| Befehl | Aktion |
|--------|--------|
| "Erkläre diesen Code" | Code-Erklärung der Auswahl |
| "Generiere Tests" | Unit-Tests erstellen |
| "Refaktoriere Code" | Code-Verbesserungen |
| "Dokumentiere Funktion" | JSDoc/Kommentare |
| "Optimiere Code" | Performance-Optimierung |

### Custom Commands hinzufügen:

```json
{
  "modelRouter.voice.customCommands": {
    "code review": "Führe ein Code-Review durch für {selection}",
    "security check": "Prüfe {selection} auf Sicherheitslücken",
    "explain architecture": "Erkläre die Architektur von {filename}"
  }
}
```

## 💰 Kostenmanagement

### Tagesbudget setzen:
```json
{
  "modelRouter.maxCostPerDay": 5.0  // €5 pro Tag
}
```

### Günstige Optionen bevorzugen:
```json
{
  "modelRouter.routingMode": "cheap",
  "modelRouter.preferLocalModels": true
}
```

## 🔧 Multi-Model Features

### Parallele Ausführung:
```typescript
const providers = [
  { provider: 'openai', model: 'gpt-4o-mini' },
  { provider: 'anthropic', model: 'claude-3-haiku-20240307' }
];

const responses = await router.executeParallel(
  "Erkläre Promises in JavaScript", 
  providers
);
```

### Konsens generieren:
```typescript
const consensus = await router.generateConsensus(
  "Was ist der beste Weg für State Management in React?",
  providers
);
```

## 🏆 Best Practices

### 1. **Provider-Auswahl optimieren**
```json
{
  "modelRouter.routingRules": {
    "code": "anthropic",      // Claude für Code-Aufgaben
    "creative": "openai",     // GPT für kreative Aufgaben
    "simple": "ollama"        // Lokale Modelle für einfache Fragen
  }
}
```

### 2. **Kosten im Auge behalten**
- Nutzen Sie das Dashboard zur Überwachung
- Setzen Sie realistische Tagesbudgets
- Verwenden Sie lokale Modelle für einfache Aufgaben

### 3. **Sprachsteuerung effektiv nutzen**
- Klare, präzise Befehle sprechen
- Kontextuelle Auswahl vor Sprachbefehl treffen
- Custom Commands für wiederkehrende Aufgaben

### 4. **Team-Setup**
```json
// .vscode/settings.json (Projekt-Ebene)
{
  "modelRouter.team.defaultProvider": "anthropic",
  "modelRouter.team.budgetPerUser": 10.0,
  "modelRouter.team.allowedModels": [
    "claude-3-sonnet-20240229",
    "gpt-4o-mini"
  ]
}
```

## 🐛 Schnelle Problemlösung

### Problem: "API Key invalid"
```bash
# Keys in VS Code Settings prüfen
# Format: sk-proj-... (OpenAI) oder sk-ant-... (Anthropic)
```

### Problem: Ollama nicht erreichbar
```bash
# Ollama starten
ollama serve

# Verbindung testen
curl http://localhost:11434/api/tags
```

### Problem: Spracherkennung funktioniert nicht
```json
{
  "modelRouter.voice.language": "de-DE",  // Sprache anpassen
  "modelRouter.voice.enabled": true       // Aktiviert?
}
```

### Problem: Hohe Kosten
```json
{
  "modelRouter.routingMode": "cheap",     // Günstige Modelle
  "modelRouter.maxCostPerDay": 2.0,       // Niedrigeres Limit
  "modelRouter.preferLocalModels": true   // Ollama bevorzugen
}
```

## 📱 Keyboard Shortcuts

| Shortcut | Aktion |
|----------|--------|
| `Ctrl+Shift+V` | Sprachsteuerung aktivieren |
| `Ctrl+Shift+G` | Dashboard öffnen |
| `Ctrl+Shift+Alt+V` | Context-Aware Voice |

## 🎓 Nächste Schritte

1. **Erkunden Sie das Dashboard** - Verstehen Sie Ihre Nutzungsmuster
2. **Probieren Sie verschiedene Provider** - Finden Sie Ihre Favoriten
3. **Experimentieren Sie mit Multi-Model** - Nutzen Sie Konsens-Features
4. **Erstellen Sie Custom Voice Commands** - Automatisieren Sie Workflows
5. **Lesen Sie die vollständige Dokumentation** - `docs/DEVELOPER_GUIDE.md`

## 💡 Tipps für den Einstieg

### Tipp 1: Beginnen Sie mit einem Provider
Starten Sie mit einem API-Key (z.B. OpenAI) und erweitern Sie später.

### Tipp 2: Nutzen Sie Auto-Routing
Lassen Sie Guido die beste Wahl treffen:
```json
{
  "modelRouter.routingMode": "auto"
}
```

### Tipp 3: Installieren Sie Ollama für kostenlose Nutzung
Lokale Modelle sind kostenlos und datenschutzfreundlich.

### Tipp 4: Aktivieren Sie das Dashboard
Das Dashboard hilft beim Verständnis der AI-Nutzung.

### Tipp 5: Experimentieren Sie mit Sprachbefehlen
Sprachsteuerung macht die Entwicklung natürlicher und effizienter.

---

🎉 **Glückwunsch!** Sie sind jetzt bereit, Guido Model Router zu nutzen. Bei Fragen schauen Sie in die vollständige Dokumentation oder besuchen Sie unsere Community.

**Weitere Ressourcen:**
- 📖 [Vollständige Dokumentation](./DEVELOPER_GUIDE.md)
- 🐛 [Issues & Support](https://github.com/model-router/guido-model-router/issues)
- 💬 [Community Discussions](https://github.com/model-router/guido-model-router/discussions)
