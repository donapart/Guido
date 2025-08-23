# Guido Troubleshooting Guide

## Diagnose und Fehlerbehebung

Dieser Guide hilft Ihnen, häufige Probleme mit der Guido Extension zu beheben.

## ✅ Schritt 1: VS Code Developer Tools öffnen

1. Drücken Sie `Ctrl+Shift+P`, um die Command Palette zu öffnen
2. Geben Sie `Developer: Toggle Developer Tools` ein und drücken Sie Enter
3. Wechseln Sie zur Registerkarte "Console"
4. Schauen Sie nach Fehlermeldungen mit "Guido" oder "model-router"

## ✅ Schritt 2: Extension Output prüfen

1. Wählen Sie im VS Code-Menü `View > Output`
2. Wählen Sie im Dropdown-Menü "Guido Model Router" aus
3. Prüfen Sie die Ausgabe auf Fehlermeldungen oder Warnungen

## ✅ Schritt 3: Konfiguration prüfen

1. Stellen Sie sicher, dass `router.config.yaml` im Workspace-Verzeichnis existiert
2. Prüfen Sie, ob alle erforderlichen API-Keys konfiguriert sind
3. Vergewissern Sie sich, dass die Extension aktiviert ist

## ✅ Schritt 4: Neuinstallation

1. Deinstallieren Sie die Extension: `code --uninstall-extension model-router.model-router`
2. Löschen Sie den Extension-Cache: `%USERPROFILE%\.vscode\extensions\model-router.model-router-*`
3. Installieren Sie die Extension neu: `code --install-extension model-router-0.2.1.vsix`

## ✅ Schritt 5: Debuggen im Entwicklermodus

1. Öffnen Sie das Guido-Projekt in VS Code
2. Drücken Sie `F5`, um die Extension im Entwickler-Host zu starten
3. Überprüfen Sie die Entwicklertools auf zusätzliche Debug-Ausgaben

## 🔧 Bekannte Probleme und Lösungen

1. **Extension startet nicht**
   - Problem: Konfigurationsdatei fehlt oder ist ungültig
   - Lösung: Stellen Sie sicher, dass `router.config.yaml` existiert und korrekt formatiert ist

2. **API-Calls schlagen fehl**
   - Problem: API-Keys fehlen oder sind ungültig
   - Lösung: Überprüfen Sie die API-Keys in den Einstellungen

3. **Sprachsteuerung funktioniert nicht**
   - Problem: Mikrofon-Berechtigungen oder Audio-API-Probleme
   - Lösung: Erteilen Sie die Berechtigungen und verwenden Sie Chrome/Edge als Host-Browser

4. **Workspace-Probleme**
   - Problem: Kein Workspace geöffnet oder Extension kann keinen Workspace finden
   - Lösung: Öffnen Sie einen Workspace-Ordner in VS Code, nicht nur eine einzelne Datei

5. **Leistungsprobleme**
   - Problem: Extension reagiert langsam oder belegt zu viel Speicher
   - Lösung: Deaktivieren Sie experimentelle Features oder reduzieren Sie die Modell-Komplexität
