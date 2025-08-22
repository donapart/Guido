# 🎤 Guido Voice Control - Vollständige Anleitung

**"Guido" ist Ihr intelligenter Sprachassistent für VSCode/Cursor mit umfassender KI-Model-Router-Integration!**

## 🚀 Schnellstart

1. **Aktivierung**: `Ctrl+Shift+P` → "Model Router: Start Voice Control (Guido)"
2. **Wake Word**: Sagen Sie **"Guido"** um eine Sprachaufnahme zu starten
3. **Befehl geben**: Z.B. "Erkläre diesen Code" oder "Öffne neue Datei"
4. **Bestätigung**: Bei kritischen Aktionen wird nachgefragt
5. **Antwort**: Guido antwortet in Text und/oder Sprache

## 🎯 Hauptfunktionen

### Wake Word System
- **Aktivierung**: "Guido", "Hey Guido", "Computer", "Assistant"
- **Kontinuierliches Hören**: Wartet permanent auf Wake Word
- **Bestätigungston**: Kurzer Beep bei Aktivierung (anpassbar)
- **Timeout**: Automatischer Stopp nach 30-45 Sekunden ohne Input

### Mehrsprachige Unterstützung
- **Spracherkennung**: Deutsch, English, Français, Español, Italiano
- **Automatische Erkennung**: Sprache wird automatisch erkannt
- **TTS-Ausgabe**: Antworten in der gewählten Sprache
- **Sprachbefehle**: "Wechsle zu Englisch", "Switch to German"

### Intelligente Sprachbefehle

#### 🔧 System-Befehle
```
"Guido aufwachen" / "Guido wake up"
"Guido schlafen" / "Guido sleep"
"Mikrofon stumm" / "Mute microphone"
"Lauter sprechen" / "Increase volume"
"Schneller sprechen" / "Speak faster"
```

#### 📁 VSCode Integration
```
"Öffne Datei" / "Open file"
"Neue Datei" / "New file"
"Speichern" / "Save file"
"Code formatieren" / "Format code"
"Terminal öffnen" / "Open terminal"
"Git Status" / "Source control"
"Suche nach [Begriff]" / "Search for [term]"
```

#### 💻 Entwickler-Befehle
```
"Erkläre diesen Code" / "Explain this code"
"Finde Bugs" / "Find bugs"
"Schreibe Tests" / "Write tests"
"Optimiere Code" / "Optimize code"
"Dokumentation erstellen" / "Generate docs"
"Code Review" / "Review code"
```

#### 🤖 Model-Routing
```
"Benutze schnelles Modell" / "Use fast model"
"Benutze bestes Modell" / "Use best model"
"Nur lokale Modelle" / "Local only"
"Datenschutz Modus" / "Privacy mode"
```

#### 🌐 Sprache wechseln
```
"Wechsle zu Englisch" / "Switch to English"
"Switch to German" / "Wechsle zu Deutsch"
"Parlez français" / "Habla español"
```

## ⚙️ Konfiguration

### Basis-Setup (router.config.yaml)
```yaml
voice:
  enabled: true
  wakeWord: "Guido"
  alternativeWakeWords: ["Hey Guido", "Computer"]
  
  # Sprachen
  language:
    recognition: "de-DE"    # Spracherkennung
    response: "de"          # Antwortsprache
    autoDetect: true        # Automatische Erkennung
  
  # Audio & TTS
  audio:
    enableBeep: true        # Bestätigungston
    beepSound: "classic"    # classic, modern, sci-fi, gentle
    beepVolume: 0.4
    ttsEnabled: true        # Sprachausgabe
    voice:
      gender: "neutral"     # male, female, neutral
      name: "auto"          # Automatische Stimmenauswahl
    speed: 1.0              # Sprechgeschwindigkeit
    volume: 0.8             # Lautstärke
  
  # Aufnahme
  recording:
    timeoutSeconds: 45      # Aufnahme-Timeout
    stopWords:              # Stop-Kommandos
      de: ["stop", "stopp", "ende", "fertig"]
      en: ["stop", "end", "finish", "abort"]
```

### Erweiterte Konfiguration
```yaml
voice:
  # Bestätigung
  confirmation:
    required: true          # Bestätigung erforderlich
    summaryEnabled: true    # Eingabe zusammenfassen
    smartConfirmation: true # KI entscheidet über Bestätigung
  
  # Berechtigungen
  permissions:
    microphoneAccess:
      required: true
      requestOnStartup: true
    privacy:
      storeRecordings: false      # Keine Aufnahme-Speicherung
      anonymizeTranscripts: true  # Transkripte anonymisieren
      gdprCompliant: true         # DSGVO-konform
      dataRetentionDays: 30       # Daten-Aufbewahrung
  
  # Arbeitszeiten
  workingHours:
    enabled: false
    startTime: "08:00"
    endTime: "18:00"
    quietHours:
      enabled: true
      startTime: "22:00"      # Ruhezeiten
      endTime: "07:00"
      reducedVolume: 0.3
```

## 🎨 UI & Bedienung

### Webview Panel
Das Voice Control Panel zeigt:
- **Live Status**: Listening, Recording, Processing
- **Transkript**: Live-Anzeige der Spracherkennung
- **Vertrauenslevel**: Erkennungsgenauigkeit in %
- **Antworten**: KI-Responses mit Metadaten
- **Einstellungen**: Sprache, Stimme, Lautstärke
- **Statistiken**: Session-Daten und Performance

### Status-Anzeigen
- **🎯 Bereit**: Wartet auf "Guido"
- **👂 Hört zu**: Wake Word Detection aktiv
- **🔴 Aufnahme**: Nimmt Spracheingabe auf
- **🧠 Verarbeitet**: KI generiert Antwort
- **❌ Fehler**: Problem aufgetreten

### Audio-Feedback
- **Classic Beep**: 800Hz, 200ms (Standard)
- **Modern Beep**: 1000Hz, 150ms (Modern)
- **Sci-Fi Beep**: 440Hz mit Modulation (Futuristisch)
- **Gentle Beep**: 600Hz, 250ms (Sanft)

## 🔒 Datenschutz & Sicherheit

### DSGVO-Konformität
- **Einverständnis-Dialog**: Explizite Nutzerbestätigung erforderlich
- **Datenminimierung**: Nur notwendige Daten werden verarbeitet
- **Aufbewahrungszeiten**: Automatische Löschung nach 30 Tagen
- **Auskunftsrecht**: Vollständiger Datenexport möglich
- **Widerrufsrecht**: Einverständnis jederzeit widerrufbar

### Lokaler Datenschutz
```yaml
voice:
  permissions:
    privacy:
      localProcessingOnly: true   # Nur lokale Verarbeitung
      storeRecordings: false      # Keine Aufnahmen speichern
      anonymizeTranscripts: true  # Transkripte anonymisieren
      encryptStoredData: true     # Verschlüsselte Speicherung
```

### Berechtigungen
- **Mikrofon**: Erforderlich für Sprachaufnahme
- **Benachrichtigungen**: Optional für Audio-Feedback
- **Dateizugriff**: Nur mit expliziter Bestätigung
- **Netzwerk**: Nur für externe AI-APIs (abschaltbar)

## 📊 Voice-spezifisches Routing

### Intelligente Modellauswahl
```yaml
routing:
  voiceRules:
    # Kurze Fragen → Ultra-schnelle Modelle
    - id: quick-voice-questions
      if:
        anyKeyword: ["was ist", "wie", "warum"]
        maxWordCount: 10
      then:
        prefer: ["openai:gpt-4o-mini", "phi:phi-4-mini"]
    
    # Code-Fragen → Spezialmodelle  
    - id: voice-coding
      if:
        anyKeyword: ["code", "bug", "function"]
      then:
        prefer: ["deepseek:deepseek-v3", "ollama:qwen2.5-coder"]
```

### Response-Optimierung
```yaml
voice:
  routing:
    preferFast: true                # Schnelle Modelle bevorzugen
    maxResponseLength: 600          # TTS-Längenbegrenzung
    skipCodeInTTS: true             # Code nicht vorlesen
    summarizeIfLong: true           # Lange Antworten kürzen
    useVoiceOptimizedPrompts: true  # Voice-optimierte Prompts
```

## 🚨 Troubleshooting

### Häufige Probleme

**"Mikrofon-Berechtigung verweigert"**
```bash
# Browser-Einstellungen prüfen:
# Chrome: chrome://settings/content/microphone
# Firefox: about:preferences#privacy
# Edge: edge://settings/content/microphone
```

**"Wake Word wird nicht erkannt"**
- Lautstärke und Mikrofon-Position prüfen
- Hintergrundgeräusche reduzieren
- Alternative Wake Words probieren
- Spracherkennungssprache prüfen

**"TTS funktioniert nicht"**
```yaml
voice:
  audio:
    ttsEnabled: true
    voice:
      name: "auto"    # Verschiedene Stimmen testen
```

**"Hohe Latenz bei Antworten"**
```yaml
voice:
  routing:
    preferFast: true
    maxResponseLength: 300
```

### Debug-Modus
```yaml
voice:
  emergency:
    debugMode: true         # Erweiterte Logs
    verboseLogging: true    # Detaillierte Ausgaben
    fallbackToText: true    # Bei Fehlern zu Text wechseln
```

### Notfall-Funktionen
- **Alt+F4**: Sofortiger Stopp aller Voice-Funktionen
- **Escape**: Aktuelle Aufnahme/Operation abbrechen
- **Space**: Toggle Listening (wenn kein Input-Feld aktiv)

## 🎛️ Erweiterte Features

### Custom Commands
```yaml
voice:
  commands:
    custom:
      "Erstelle React Component": "generateReactComponent"
      "API Dokumentation": "generateApiDocs"
      "Deployment starten": "startDeployment"
```

### MCP Integration
Voice Control als MCP Tool:
```bash
# MCP Server starten
model-router --mcp

# Tools verfügbar:
# - route_model
# - estimate_cost  
# - voice_command
# - speech_to_text
```

### Multi-Turn Conversations
```yaml
voice:
  processing:
    multiTurnConversation: true  # Gesprächskontext beibehalten
    contextMemoryMinutes: 30     # Kontext-Gedächtnis
    memoryEnabled: true          # Session-Memory aktivieren
```

## 📈 Performance & Monitoring

### Statistiken
Verfügbar über `Model Router: Voice Settings` → `Voice Statistiken`:
- Sessions gesamt
- Durchschnittliche Session-Dauer  
- Erkennungsgenauigkeit
- Ausgeführte Befehle
- Fehlerrate
- Beliebteste Befehle

### Kostenübersicht
Voice-spezifische Kosten werden separat getrackt:
- Spracherkennung-API-Calls
- TTS-Generierung
- Model-Routing-Entscheidungen
- Zusammenfassungs-Generierung

## 🔄 Updates & Wartung

### Automatische Updates
- Konfiguration wird bei Änderungen automatisch geladen
- Voice-Modelle können während Laufzeit gewechselt werden
- TTS-Stimmen werden dynamisch geladen

### Backup & Export
```bash
# Konfiguration exportieren
Model Router: Export Config

# Voice-Daten exportieren (DSGVO)
Model Router: Voice Permissions → Daten exportieren
```

## 💡 Tipps & Best Practices

### Optimale Nutzung
1. **Ruhige Umgebung**: Minimiert Erkennungsfehler
2. **Klare Aussprache**: Verbessert Genauigkeit
3. **Kurze Befehle**: Reduziert Latenz
4. **Konsistente Wake Words**: Immer "Guido" verwenden
5. **Feedback nutzen**: Bestätigungstöne aktiviert lassen

### Entwickler-Workflow
1. **Code erklären**: Komplizierten Code auswählen → "Guido" → "Erkläre diesen Code"
2. **Tests schreiben**: Funktion auswählen → "Guido" → "Schreibe Tests"
3. **Bugs finden**: File öffnen → "Guido" → "Finde Bugs"
4. **Refactoring**: Code auswählen → "Guido" → "Optimiere Code"

### Privacy-First Setup
```yaml
voice:
  permissions:
    privacy:
      localProcessingOnly: true
      allowExternal: false
  providers:
    # Nur Ollama konfigurieren
    - id: ollama
      models: ["llama3.3:70b-instruct"]
```

---

**🎉 Viel Spaß mit Guido Voice Control! Bei Fragen öffnen Sie ein Issue oder schauen in die Diskussionen.**
