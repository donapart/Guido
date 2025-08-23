# Sichere API-Keys-Verwaltung für Guido

Diese Datei erklärt, wie du API-Keys sicher verwalten kannst, ohne sie versehentlich auf Git hochzuladen.

## Empfohlene Methoden zur API-Key-Speicherung

### 1. VS Code Secret Storage (am sichersten)

VS Code bietet eine sichere Secret Storage API, die mit dem VS Code-Anmeldeinformationsspeicher deines Betriebssystems integriert ist:

1. Öffne die Command Palette: `Strg+Shift+P`
2. Gib ein: "Model Router: Set API Key (Provider)"
3. Wähle den Provider und füge deinen API-Key ein

Diese Methode speichert den Key im sicheren Anmeldeinformationsspeicher deines Systems und nicht in Dateien.

### 2. Umgebungsvariablen (für temporäre Verwendung)

Setze die API-Keys direkt als Umgebungsvariablen, bevor du VS Code startest:

```powershell
# Windows PowerShell (temporär für die aktuelle Session)
$env:OPENAI_API_KEY = "dein-api-key"
$env:ANTHROPIC_API_KEY = "dein-api-key"
code  # VS Code starten
```

### 3. .env-Datei (NICHT auf Git hochladen!)

Erstelle eine `.env`-Datei im Root-Verzeichnis:

```
OPENAI_API_KEY=dein-api-key
ANTHROPIC_API_KEY=dein-api-key
HUGGINGFACE_API_KEY=dein-api-key
OPENROUTER_API_KEY=dein-api-key
COHERE_API_KEY=dein-api-key
```

Wichtig: `.env` ist bereits in der `.gitignore` eingetragen, aber überprüfe immer, bevor du Git-Commits machst!

## Überprüfen der Git-Einstellungen

Um sicherzustellen, dass keine sensitiven Daten auf Git hochgeladen werden:

1. Überprüfe, ob `.gitignore` korrekt konfiguriert ist (sollte `.env`, `.vscode/settings.json` usw. enthalten)
2. Führe vor dem Commit aus:

```bash
git status
```

3. Stelle sicher, dass keine Dateien mit API-Keys in der Liste der zu übertragenden Dateien erscheinen

## Rotation von API-Keys

Falls du versehentlich API-Keys auf Git hochgeladen hast:

1. Melde dich sofort bei den entsprechenden Diensten an (OpenAI, Anthropic, etc.)
2. Lösche die kompromittierten API-Keys
3. Erstelle neue API-Keys
4. Aktualisiere die lokalen Einstellungen mit den neuen Keys

## Referenz der API-Key-Umgebungsvariablen

- `OPENAI_API_KEY`: Für OpenAI-Modelle 
- `ANTHROPIC_API_KEY`: Für Claude-Modelle
- `HUGGINGFACE_API_KEY`: Für Hugging Face-Modelle
- `OPENROUTER_API_KEY`: Für OpenRouter-Modelle
- `COHERE_API_KEY`: Für Cohere-Modelle

Denke daran, dass es ausreicht, nur die Keys für die Provider einzurichten, die du tatsächlich verwendest.
