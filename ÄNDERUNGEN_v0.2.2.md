# Guido Model Router - Änderungen für Version 0.2.2

In dieser Version wurden umfangreiche Verbesserungen und Fehlerbehebungen vorgenommen:

## Behobene VS Code Validierungsfehler

1. **Ungültige Kategorie entfernt**:
   - "Voice Control" war keine gültige VS Code Extension-Kategorie und wurde entfernt
   - Nur gültige Kategorien werden jetzt verwendet: "Other", "Machine Learning"

2. **Icon hinzugefügt**:
   - Das Icon-Feld wurde zur package.json hinzugefügt: `"icon": "extension-icon-512.png"`
   - Dies behebt den VS Code Validierungsfehler für fehlendes Icon

3. **Rechtschreibprüfung verbessert**:
   - cSpell-Konfiguration in `.vscode/settings.json` aktualisiert
   - Deutsche Wörter und Produktnamen zur Wörterliste hinzugefügt

## Neue Features

1. **Automatische Updates**:
   - Neue Datei `src/updates.ts` implementiert automatische Update-Checks
   - Einstellungen für Auto-Update-Kontrolle hinzugefügt
   - Update-Benachrichtigungen bei neuen Versionen

2. **Profile-System**:
   - Neue Datei `src/profiles.ts` implementiert Profile-Management
   - Vorkonfigurierte Profile: Standard, Performance, Schnell
   - Möglichkeit für benutzerdefinierte Profile

3. **Preset-Unterstützung**:
   - Vorkonfigurierte Einstellungen für bestimmte Anwendungsfälle
   - Schnelle Umschaltung zwischen Konfigurationen

4. **Erweitertes Logging**:
   - Neue Datei `src/logging.ts` für verbessertes Logging
   - Konfigurierbare Log-Level
   - Komponentenbasiertes Logging

## Erweiterte Einstellungen

Neue Konfigurationsoptionen wurden hinzugefügt:

```json
"modelRouter.updates.autoCheck": true,
"modelRouter.updates.notifyOnStart": true,
"modelRouter.profiles.enabled": true,
"modelRouter.profiles.defaultProfile": "standard",
"modelRouter.presets.enabled": true,
"modelRouter.ui.showWelcomeOnStartup": true,
"modelRouter.voice.sensitivity": "medium",
"modelRouter.voice.feedbackSounds": true,
"modelRouter.performance.cacheResults": true,
"modelRouter.logs.detailLevel": "normal"
```

## Dokumentation

Neue Dokumentationsdateien wurden erstellt:

1. `docs/PROFILES_AND_PRESETS.md` - Erklärung zu Profilen und Presets
2. `docs/AUTOMATIC_UPDATES.md` - Informationen zum Auto-Update-Feature
3. `RELEASE_NOTES_v0.2.2.md` - Ausführliche Release Notes

## Bekannte Probleme

1. TypeScript strict mode erzeugt noch einige Warnungen, die in einem zukünftigen Update behoben werden sollten
2. Das Erstellen des VSIX-Pakets könnte Probleme verursachen, die weitere Untersuchung erfordern

## Nächste Schritte

1. TypeScript strict mode Warnungen beheben
2. Packaging-Prozess debuggen
3. Weitere Unit-Tests hinzufügen
4. UI-Komponenten für Profile- und Preset-Management implementieren
