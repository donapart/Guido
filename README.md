# 🎤 Guido Model Router - Intelligente AI-Modell-Auswahl mit Sprachsteuerung

**Guido** ist eine fortschrittliche VSCode/Cursor Extension für intelligente AI-Modell-Auswahl mit experimenteller Sprachsteuerung und erweiterten Features.

## ✨ Features

### 🎯 Intelligente Modell-Auswahl
- **Automatisches Routing** basierend auf Prompt-Inhalt und Kontext
- **Kostenbewusste Auswahl** mit Budget-Management
- **Performance-basierte Optimierung** mit adaptivem Lernen
- **Multi-Provider Support** (OpenAI, DeepSeek, Grok, Phi, Ollama)

### 🎤 Sprachsteuerung "Guido"
- **Wake Word Detection** ("Guido" als Aktivierungswort)
- **Voice Commands** für alle Extension-Features
- **Sprachausgabe** (außer Code)
- **Mehrsprachige Unterstützung** (DE, EN, FR, ES, IT, PT, NL, PL, RU)
- **Emotionale Erkennung** und kontextbewusste Antworten

### 🧪 Experimentelle Features
- **Emotionale Erkennung** aus Voice-Input
- **Kontextbewusstsein** mit Projekt- und Datei-Analyse
- **Adaptive Interface** basierend auf Benutzerverhalten
- **Persönlichkeitsanpassung** für individuelle Kommunikation
- **Mehrschichtige Intent-Erkennung** für präzise Befehle
- **Konversationsgedächtnis** für kontinuierliche Verbesserung

### 🔧 Erweiterte Konfiguration
- **YAML-basierte Konfiguration** für maximale Flexibilität
- **Sichere API-Key-Verwaltung** mit VSCode SecretStorage
- **GDPR-konforme Datenschutz-Einstellungen**
- **Umfangreiche Voice-Einstellungen** und Berechtigungen

## 🚀 Installation

### Automatische Installation
```bash
# In VSCode/Cursor Terminal
code --install-extension model-router-0.1.7.vsix
cursor --install-extension model-router-0.1.7.vsix
```

### Manuelle Installation
1. **Extension herunterladen** und in VSCode/Cursor installieren
2. **Workspace öffnen** (für Konfiguration)
3. **API-Keys konfigurieren** über Command Palette
4. **Sprachsteuerung aktivieren** mit "Model Router: Start Voice Control"

## 🎯 Schnellstart

### 1. Grundlegende Nutzung
```bash
# Command Palette öffnen (Ctrl+Shift+P)
# "Model Router: Chat" auswählen
# Prompt eingeben: "Erkläre mir TypeScript"
```

### 2. Sprachsteuerung aktivieren
```bash
# "Model Router: Start Voice Control (Guido)" ausführen
# "Guido" sagen (leiser Beep)
# Befehl sprechen: "Erkläre mir diesen Code"
# "Stop" sagen
```

### 3. Experimentelle Features testen
```bash
# "🧪 Experimental: Show UI" ausführen
# Verschiedene experimentelle Features testen
# "🧪 Experimental: Test All Features" für vollständigen Test
```

## 🎤 Voice Commands

### System-Befehle
- **"Guido, starte Sprachsteuerung"** - Voice Control aktivieren
- **"Guido, stoppe Sprachsteuerung"** - Voice Control deaktivieren
- **"Guido, Einstellungen öffnen"** - Voice-Einstellungen anzeigen

### Entwicklungs-Befehle
- **"Guido, erkläre mir diesen Code"** - Code-Erklärung
- **"Guido, generiere Tests für diese Funktion"** - Test-Generierung
- **"Guido, optimiere diesen Code"** - Code-Optimierung
- **"Guido, finde Bugs in diesem Code"** - Bug-Detection

### Experimentelle Befehle
- **"Guido, teste Emotion-Erkennung"** - Emotion-Analyse
- **"Guido, analysiere Kontext"** - Kontext-Analyse
- **"Guido, erkenne Intent"** - Intent-Erkennung
- **"Guido, adaptive Antwort"** - Adaptive Antworten

## ⚙️ Konfiguration

### router.config.yaml
```yaml
version: 1
activeProfile: default
profiles:
  default:
    mode: auto
    voice:
      enabled: true
      wakeWord: "Guido"
      language:
        recognition: "de"
        response: "de"
      experimental:
        enabled: true
        emotionDetection: true
        contextAwareness: true
    providers:
      - id: openai
        kind: openai-compat
        baseUrl: https://api.openai.com/v1
        apiKeyRef: OPENAI_API_KEY
        models:
          - name: gpt-4o-mini
            context: 128000
    routing:
      rules:
        - id: default
          if: {}
          then:
            prefer: ["openai:gpt-4o-mini"]
            target: chat
```

## 🧪 Experimentelle Features

### Emotionale Erkennung
- **Real-time Emotion Analysis** aus Voice-Input
- **Adaptive Antworten** basierend auf erkannten Emotionen
- **Visualisierung** der Emotionen in der UI

### Kontextbewusstsein
- **Projekt-Analyse** für bessere Modell-Auswahl
- **Datei-Kontext** Integration
- **Benutzer-Expertise** Erkennung
- **Konversations-Historie** für kontinuierliche Verbesserung

### Adaptive Interface
- **Benutzerverhalten-basierte Anpassung**
- **Expertise-Level Erkennung**
- **Dynamische UI-Anpassung**
- **Performance-basierte Optimierung**

### Mehrsprachige Verarbeitung
- **Automatische Sprach-Erkennung**
- **Echtzeit-Übersetzung**
- **Lokalisierte Antworten**
- **Kulturspezifische Anpassungen**

## 🔒 Datenschutz & Sicherheit

### GDPR-Konformität
- **Benutzer-Consent** für Datensammlung
- **Anonymisierung** von persönlichen Daten
- **Daten-Export** und Löschung
- **Lokale Verarbeitung** Option

### Sichere API-Key-Verwaltung
- **VSCode SecretStorage** Integration
- **Verschlüsselte Speicherung**
- **Automatische Bereinigung**
- **Audit-Logs** für Zugriffe

## 🛠️ Entwicklung

### Projekt-Struktur
```
src/
├── extension.ts              # Haupt-Extension
├── config.ts                 # Konfigurations-Management
├── router.ts                 # Modell-Routing-Engine
├── providers/                # AI-Provider-Implementierungen
├── voice/                    # Sprachsteuerung
│   ├── voiceController.ts    # Haupt-Controller
│   ├── experimental/         # Experimentelle Features
│   ├── webview/              # Webview-UI
│   └── commands/             # Voice-Commands
└── experimental-features.yaml # Experimentelle Konfiguration
```

### Lokale Entwicklung
```bash
# Dependencies installieren
npm install

# Kompilieren
npm run compile

# Extension packen
npx @vscode/vsce package

# In VSCode/Cursor installieren
code --install-extension model-router-0.1.7.vsix
```

## 🎯 Roadmap

### Version 0.2.0
- [ ] **Erweiterte MCP-Integration** für Tool-Calls
- [ ] **Multi-Modal Support** (Bild + Text)
- [ ] **Collaborative Learning** zwischen Benutzern
- [ ] **Advanced Analytics** Dashboard

### Version 0.3.0
- [ ] **Real-time Collaboration** Features
- [ ] **Custom Model Training** Integration
- [ ] **Advanced Security** Features
- [ ] **Enterprise** Features

## 🤝 Beitragen

Wir freuen uns über Beiträge! Bitte öffnen Sie Issues oder Pull Requests für Feedback und Verbesserungen.

### Experimentelle Features testen
1. **Feature aktivieren** in `experimental-features.yaml`
2. **Tests ausführen** mit "🧪 Experimental: Test All Features"
3. **Feedback geben** über Issues oder Pull Requests

## 📄 Lizenz

MIT License - siehe LICENSE-Datei für Details.

## 🙏 Danksagungen

- **VSCode Team** für die großartige Extension-API
- **Cursor Team** für die Kompatibilität
- **OpenAI, DeepSeek, Grok, Phi** für die AI-Modelle
- **Community** für Feedback und Beiträge

---

**🎤 Guido** - Ihr intelligenter AI-Assistent mit Sprachsteuerung! ✨
