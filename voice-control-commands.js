// Einfaches Skript zur Überprüfung der VS Code-Befehle

console.log(`
===============================================================
🎙️ Guido Voice Control Command-Checker 🎙️
===============================================================

Die Befehlspalette in VS Code sollte folgende Befehle enthalten:

1. "Model Router: Start Voice Control (Guido)"
   - Interner Befehlsname: modelRouter.startVoiceControl
   
2. "Model Router: Stop Voice Control"
   - Interner Befehlsname: modelRouter.stopVoiceControl
   
3. "Model Router: Toggle Voice Control"
   - Interner Befehlsname: modelRouter.toggleVoiceControl

--------------------------------------------------------------

Um die Sprachsteuerung zu starten:

1. Öffne VS Code aus dem Terminal, in dem du das load-env.ps1-Skript ausgeführt hast:
   code .

2. Drücke Strg+Shift+P

3. Gib "Model Router: Start Voice Control" ein (nicht "Start Voice Control")
   - Die Autovervollständigung sollte "Model Router: Start Voice Control (Guido)" anzeigen

4. Drücke Enter, um die Sprachsteuerung zu starten

--------------------------------------------------------------

Wenn der Befehl nicht gefunden wird:

1. Stelle sicher, dass die Extension aktiviert ist:
   - Klicke auf das Extensions-Symbol in der Seitenleiste
   - Suche nach "Guido Model Router"
   - Stelle sicher, dass die Extension aktiviert ist

2. Versuche, VS Code neu zu starten:
   - Schließe VS Code
   - Führe das load-env.ps1-Skript aus
   - Starte VS Code erneut mit dem Befehl "code ."

3. Überprüfe die Logs:
   - Drücke Strg+Shift+U, um das Ausgabefenster zu öffnen
   - Wähle "Model Router" aus dem Dropdown-Menü
   
===============================================================
`);
