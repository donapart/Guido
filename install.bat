@echo off
echo ================================================
echo Guido Model Router v0.2.0 Installation
echo ================================================
echo.

echo Schritt 1: Extension installieren...
code --install-extension model-router-0.1.9.vsix --force

echo.
echo Schritt 2: Warten auf VS Code...
timeout /t 3 /nobreak >nul

echo.
echo Schritt 3: Provider-Dateien kopieren...

set "TARGET_DIR=%USERPROFILE%\.vscode\extensions"
for /d %%i in ("%TARGET_DIR%\model-router.model-router-*") do (
    if exist "%%i\out\providers" (
        echo Kopiere OpenRouter Provider...
        copy /y "out\providers\openrouter.js" "%%i\out\providers\" >nul
        copy /y "out\providers\openrouter.d.ts" "%%i\out\providers\" >nul
        
        echo Kopiere Hugging Face Provider...
        copy /y "out\providers\huggingface.js" "%%i\out\providers\" >nul
        copy /y "out\providers\huggingface.d.ts" "%%i\out\providers\" >nul
        
        echo Aktualisiere Extension...
        copy /y "out\extension.js" "%%i\out\" >nul
        
        echo Provider erfolgreich installiert in: %%i
        set "INSTALLED=1"
    )
)

if not defined INSTALLED (
    echo FEHLER: Extension-Verzeichnis nicht gefunden!
    echo Bitte installieren Sie die Extension manuell mit:
    echo code --install-extension model-router-0.1.9.vsix
    pause
    exit /b 1
)

echo.
echo ================================================
echo Installation erfolgreich abgeschlossen!
echo ================================================
echo.
echo Nächste Schritte:
echo 1. VS Code neu starten
echo 2. Settings öffnen (Ctrl+,)
echo 3. API-Schlüssel konfigurieren:
echo    - modelRouter.openrouterApiKey
echo    - modelRouter.huggingfaceApiKey
echo 4. Extension testen: Ctrl+Shift+P > "Model Router: Chat"
echo.
echo Dokumentation: INSTALLATION_GUIDE.md
echo.
pause
