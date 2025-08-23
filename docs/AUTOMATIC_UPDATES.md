# Automatische Updates für Guido

Guido Model Router unterstützt jetzt automatische Update-Benachrichtigungen, um sicherzustellen, dass Sie immer die neueste Version verwenden.

## Funktionsweise

1. **Auto-Check**: Bei jedem Start prüft Guido, ob eine neue Version verfügbar ist
2. **Benachrichtigung**: Wenn eine neue Version verfügbar ist, werden Sie benachrichtigt
3. **Ein-Klick-Update**: Mit einem Klick können Sie zur Download-Seite der neuen Version navigieren

## Einstellungen

Die automatischen Updates können in den VS Code-Einstellungen konfiguriert werden:

```json
"modelRouter.updates.autoCheck": true,
"modelRouter.updates.notifyOnStart": true
```

- `autoCheck`: Aktiviert oder deaktiviert die automatische Prüfung auf Updates
- `notifyOnStart`: Legt fest, ob beim Start eine Benachrichtigung angezeigt werden soll

## Manuelles Prüfen

Sie können auch manuell nach Updates suchen:

1. Öffnen Sie die Befehlspalette (`Strg+Shift+P`)
2. Führen Sie den Befehl "Model Router: Check for Updates" aus

## Überspringen von Versionen

Wenn Sie eine bestimmte Update-Benachrichtigung erhalten und die Version überspringen möchten:

1. Klicken Sie auf "Diese Version überspringen" in der Benachrichtigung
2. Guido wird Sie nicht mehr über diese Version informieren
3. Sie werden erst wieder benachrichtigt, wenn eine neuere Version verfügbar ist

## Warum Updates wichtig sind

Regelmäßige Updates bieten:

- **Neue Funktionen**: Zugang zu den neuesten Funktionen und Verbesserungen
- **Fehlerbehebungen**: Korrekturen für bekannte Probleme
- **Sicherheit**: Wichtige Sicherheitsupdates
- **Performance**: Verbesserungen der Leistung und Stabilität

## Probleme mit Updates

Sollten Sie Probleme mit dem Update-Prozess haben:

1. Überprüfen Sie Ihre Internetverbindung
2. Prüfen Sie die Guido-Logs auf Fehlermeldungen
3. Versuchen Sie, die Extension manuell zu aktualisieren über den VS Code Marketplace
