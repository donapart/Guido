# Guido Model Router - Profile und Presets

Guido Model Router unterstützt jetzt Profile und Presets, die Ihnen ermöglichen, schnell zwischen verschiedenen Konfigurationen zu wechseln.

## Profile

Profile sind vordefinierte Konfigurationen für Guido, die verschiedene Einstellungen für den AI Model Router, Sprachsteuerung und experimentelle Features beinhalten. Sie können zwischen diesen Profilen wechseln, um die Funktionalität von Guido an Ihre aktuellen Bedürfnisse anzupassen.

### Standardprofile

Guido wird mit den folgenden vordefinierten Profilen ausgeliefert:

1. **Standard** - Ausgewogene Konfiguration für allgemeine Nutzung
   - Modell: gpt-4o-mini
   - Alle experimentellen Features aktiviert
   - Standard-Spracheinstellungen

2. **Performance** - Konfiguration für beste Ergebnisse
   - Modell: gpt-4o
   - Alle experimentellen Features aktiviert
   - Erhöhte Sprachempfindlichkeit

3. **Schnell** - Konfiguration für schnellere Reaktionszeit
   - Modell: gpt-3.5-turbo
   - Die meisten experimentellen Features deaktiviert
   - Minimalistische Einstellungen für schnellste Performance

### Eigene Profile erstellen

Sie können Ihre eigenen Profile erstellen, indem Sie:

1. Im Befehlsmenü (`Strg+Shift+P`) den Befehl "Model Router: Create Profile" ausführen
2. Einen Namen für das neue Profil eingeben
3. Die gewünschten Einstellungen konfigurieren
4. Das Profil speichern

### Profile wechseln

Um zwischen den Profilen zu wechseln:

1. Im Befehlsmenü (`Strg+Shift+P`) den Befehl "Model Router: Switch Profile" ausführen
2. Das gewünschte Profil aus der Liste auswählen

## Presets

Presets sind vordefinierte Konfigurationen für spezifische Aufgaben. Anders als Profile, die die gesamte Erweiterungskonfiguration ändern, werden Presets in bestimmten Kontexten verwendet, um schnell Einstellungen für spezifische Anwendungsfälle anzuwenden.

### Verfügbare Presets

1. **Code-Assistent** - Optimiert für Programmierassistenz
2. **Text-Übersetzer** - Optimiert für Übersetzungsaufgaben
3. **Dokumentations-Helper** - Optimiert für das Erstellen von Dokumentation
4. **Fehler-Analyse** - Optimiert für das Debuggen und Analysieren von Fehlern

### Presets verwenden

Presets können direkt im Chat-Interface ausgewählt werden:

1. Model Router Chat öffnen
2. Im Dropdown-Menü ein Preset auswählen
3. Die Einstellungen werden automatisch für den aktuellen Chat angewendet

## Konfiguration

Die Konfiguration von Profilen und Presets kann in den VS Code-Einstellungen angepasst werden:

```json
"modelRouter.profiles.enabled": true,
"modelRouter.profiles.defaultProfile": "standard",
"modelRouter.presets.enabled": true
```

## Erweiterte Anpassung

Erfahrene Benutzer können Profilkonfigurationen direkt in den JSON-Dateien bearbeiten, die sich im `profiles`-Verzeichnis der Erweiterung befinden. Dies ermöglicht eine noch feinere Kontrolle über alle Aspekte von Guido.

## Fehlersuche

Wenn Sie Probleme mit Profilen oder Presets haben:

1. Überprüfen Sie das Guido-Logfenster (Befehl "Model Router: Show Logs")
2. Stellen Sie sicher, dass alle erforderlichen API-Schlüssel korrekt konfiguriert sind
3. Versuchen Sie, zum Standardprofil zurückzukehren, falls ein benutzerdefiniertes Profil Probleme verursacht
