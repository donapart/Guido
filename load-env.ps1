# Guido API-Keys aus .env-Datei laden
# Dieses Skript lädt die API-Keys aus der .env-Datei und setzt sie als Umgebungsvariablen
# Führe es aus mit: . .\load-env.ps1

function Import-EnvFile {
    param (
        [string]$EnvFilePath
    )
    
    if (Test-Path $EnvFilePath) {
        Write-Host "✅ Lade Umgebungsvariablen aus $EnvFilePath" -ForegroundColor Green
        
        Get-Content $EnvFilePath | ForEach-Object {
            $line = $_.Trim()
            
            # Ignoriere Kommentarzeilen und leere Zeilen
            if (-not [string]::IsNullOrWhiteSpace($line) -and -not $line.StartsWith("#")) {
                $keyValue = $line -split "=", 2
                
                if ($keyValue.Length -eq 2) {
                    $key = $keyValue[0].Trim()
                    $value = $keyValue[1].Trim()
                    
                    # Entferne Anführungszeichen, falls vorhanden
                    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                        $value = $value.Substring(1, $value.Length - 2)
                    } elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
                        $value = $value.Substring(1, $value.Length - 2)
                    }
                    
                    # Setze die Umgebungsvariable
                    Set-Item -Path "env:$key" -Value $value
                    
                    # Zeige maskierte Version des Wertes
                    if ($value.Length -gt 8 -and $key -like "*API_KEY*" -or $key -like "*APIKEY*") {
                        $maskedValue = $value.Substring(0, 4) + "..." + $value.Substring($value.Length - 4)
                        Write-Host "   $key = $maskedValue" -ForegroundColor Cyan
                    } else {
                        Write-Host "   $key = gesetzt" -ForegroundColor Cyan
                    }
                }
            }
        }
    } else {
        Write-Host "❌ .env-Datei nicht gefunden: $EnvFilePath" -ForegroundColor Red
    }
}

# Lade die .env-Datei
$envPath = Join-Path $PSScriptRoot ".env"
Import-EnvFile -EnvFilePath $envPath

Write-Host "`n🚀 Umgebungsvariablen wurden geladen. Du kannst jetzt VS Code in diesem Terminal starten mit:" -ForegroundColor Yellow
Write-Host "   code ." -ForegroundColor Yellow
Write-Host "`n💡 Hinweis: Dieses Terminal muss geöffnet bleiben, damit die Umgebungsvariablen erhalten bleiben." -ForegroundColor Yellow
