# API-Key-Setup Script für Guido Model Router
# Dieses Skript hilft dir beim sicheren Speichern deiner API-Keys ohne sie in Dateien zu speichern

# Funktion zum Validieren von API-Keys basierend auf gängigen Formaten
function Validate-ApiKey {
    param (
        [string]$Provider,
        [string]$ApiKey
    )

    if ([string]::IsNullOrEmpty($ApiKey)) {
        return $false
    }

    switch ($Provider) {
        "OPENAI" { return $ApiKey -like "sk-*" }
        "ANTHROPIC" { return $ApiKey -like "sk-ant-*" }
        "HUGGINGFACE" { return $ApiKey -like "hf_*" }
        "OPENROUTER" { return $ApiKey -like "sk-or-*" }
        default { return $ApiKey.Length -gt 10 }
    }
}

# Banner anzeigen
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Guido Model Router - API-Key Setup Tool" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Umgebungsvariablen oder .env-Datei
$setupMethod = Read-Host "Wie möchtest du deine API-Keys speichern?`n[1] Umgebungsvariablen (temporär)`n[2] .env-Datei (permanent, nicht hochladen!)`nWähle [1/2]"

if ($setupMethod -eq "1") {
    Write-Host "`nEinrichtung von Umgebungsvariablen (nur für diese Session)..." -ForegroundColor Yellow
    
    # OpenAI
    $openaiKey = Read-Host "OpenAI API-Key eingeben (leer lassen zum Überspringen)"
    if (-not [string]::IsNullOrEmpty($openaiKey)) {
        if (Validate-ApiKey -Provider "OPENAI" -ApiKey $openaiKey) {
            $env:OPENAI_API_KEY = $openaiKey
            Write-Host "OpenAI API-Key gespeichert als Umgebungsvariable" -ForegroundColor Green
        } else {
            Write-Host "OpenAI API-Key scheint nicht das richtige Format zu haben (sollte mit sk- beginnen)" -ForegroundColor Red
        }
    }
    
    # Anthropic
    $anthropicKey = Read-Host "Anthropic API-Key eingeben (leer lassen zum Überspringen)"
    if (-not [string]::IsNullOrEmpty($anthropicKey)) {
        if (Validate-ApiKey -Provider "ANTHROPIC" -ApiKey $anthropicKey) {
            $env:ANTHROPIC_API_KEY = $anthropicKey
            Write-Host "Anthropic API-Key gespeichert als Umgebungsvariable" -ForegroundColor Green
        } else {
            Write-Host "Anthropic API-Key scheint nicht das richtige Format zu haben (sollte mit sk-ant- beginnen)" -ForegroundColor Red
        }
    }
    
    # Hugging Face
    $hfKey = Read-Host "Hugging Face API-Key eingeben (leer lassen zum Überspringen)"
    if (-not [string]::IsNullOrEmpty($hfKey)) {
        if (Validate-ApiKey -Provider "HUGGINGFACE" -ApiKey $hfKey) {
            $env:HUGGINGFACE_API_KEY = $hfKey
            Write-Host "Hugging Face API-Key gespeichert als Umgebungsvariable" -ForegroundColor Green
        } else {
            Write-Host "Hugging Face API-Key scheint nicht das richtige Format zu haben (sollte mit hf_ beginnen)" -ForegroundColor Red
        }
    }
    
    # OpenRouter
    $orKey = Read-Host "OpenRouter API-Key eingeben (leer lassen zum Überspringen)"
    if (-not [string]::IsNullOrEmpty($orKey)) {
        if (Validate-ApiKey -Provider "OPENROUTER" -ApiKey $orKey) {
            $env:OPENROUTER_API_KEY = $orKey
            Write-Host "OpenRouter API-Key gespeichert als Umgebungsvariable" -ForegroundColor Green
        } else {
            Write-Host "OpenRouter API-Key scheint nicht das richtige Format zu haben (sollte mit sk-or- beginnen)" -ForegroundColor Red
        }
    }
    
    # Cohere
    $cohereKey = Read-Host "Cohere API-Key eingeben (leer lassen zum Überspringen)"
    if (-not [string]::IsNullOrEmpty($cohereKey)) {
        if (Validate-ApiKey -Provider "COHERE" -ApiKey $cohereKey) {
            $env:COHERE_API_KEY = $cohereKey
            Write-Host "Cohere API-Key gespeichert als Umgebungsvariable" -ForegroundColor Green
        } else {
            Write-Host "Cohere API-Key scheint nicht das richtige Format zu haben" -ForegroundColor Red
        }
    }

    Write-Host "`nAPI-Keys wurden als Umgebungsvariablen gespeichert. Diese sind nur für die aktuelle Session gültig." -ForegroundColor Yellow
    Write-Host "Starte VS Code in diesem Terminal mit dem Befehl 'code .', um die gespeicherten Keys zu verwenden." -ForegroundColor Yellow

} elseif ($setupMethod -eq "2") {
    $envPath = "F:\__Backup_D_prjkt\Guido\.env"
    Write-Host "`nEinrichtung der .env-Datei..." -ForegroundColor Yellow
    
    if (-not (Test-Path $envPath)) {
        Copy-Item -Path "F:\__Backup_D_prjkt\Guido\.env.example" -Destination $envPath
        Write-Host ".env-Datei erstellt aus Vorlage" -ForegroundColor Green
    }
    
    # Datei-Inhalt einlesen
    $envContent = Get-Content $envPath

    # OpenAI
    $openaiKey = Read-Host "OpenAI API-Key eingeben (leer lassen zum Überspringen)"
    if (-not [string]::IsNullOrEmpty($openaiKey)) {
        if (Validate-ApiKey -Provider "OPENAI" -ApiKey $openaiKey) {
            $envContent = $envContent -replace "# OPENAI_API_KEY=.*", "OPENAI_API_KEY=$openaiKey"
            Write-Host "OpenAI API-Key hinzugefügt" -ForegroundColor Green
        } else {
            Write-Host "OpenAI API-Key scheint nicht das richtige Format zu haben (sollte mit sk- beginnen)" -ForegroundColor Red
        }
    }
    
    # Anthropic
    $anthropicKey = Read-Host "Anthropic API-Key eingeben (leer lassen zum Überspringen)"
    if (-not [string]::IsNullOrEmpty($anthropicKey)) {
        if (Validate-ApiKey -Provider "ANTHROPIC" -ApiKey $anthropicKey) {
            $envContent = $envContent -replace "# ANTHROPIC_API_KEY=.*", "ANTHROPIC_API_KEY=$anthropicKey"
            Write-Host "Anthropic API-Key hinzugefügt" -ForegroundColor Green
        } else {
            Write-Host "Anthropic API-Key scheint nicht das richtige Format zu haben (sollte mit sk-ant- beginnen)" -ForegroundColor Red
        }
    }
    
    # Hugging Face
    $hfKey = Read-Host "Hugging Face API-Key eingeben (leer lassen zum Überspringen)"
    if (-not [string]::IsNullOrEmpty($hfKey)) {
        if (Validate-ApiKey -Provider "HUGGINGFACE" -ApiKey $hfKey) {
            $envContent = $envContent -replace "# HUGGINGFACE_API_KEY=.*", "HUGGINGFACE_API_KEY=$hfKey"
            Write-Host "Hugging Face API-Key hinzugefügt" -ForegroundColor Green
        } else {
            Write-Host "Hugging Face API-Key scheint nicht das richtige Format zu haben (sollte mit hf_ beginnen)" -ForegroundColor Red
        }
    }
    
    # OpenRouter
    $orKey = Read-Host "OpenRouter API-Key eingeben (leer lassen zum Überspringen)"
    if (-not [string]::IsNullOrEmpty($orKey)) {
        if (Validate-ApiKey -Provider "OPENROUTER" -ApiKey $orKey) {
            $envContent = $envContent -replace "# OPENROUTER_API_KEY=.*", "OPENROUTER_API_KEY=$orKey"
            Write-Host "OpenRouter API-Key hinzugefügt" -ForegroundColor Green
        } else {
            Write-Host "OpenRouter API-Key scheint nicht das richtige Format zu haben (sollte mit sk-or- beginnen)" -ForegroundColor Red
        }
    }
    
    # Cohere
    $cohereKey = Read-Host "Cohere API-Key eingeben (leer lassen zum Überspringen)"
    if (-not [string]::IsNullOrEmpty($cohereKey)) {
        if (Validate-ApiKey -Provider "COHERE" -ApiKey $cohereKey) {
            $envContent = $envContent -replace "# COHERE_API_KEY=.*", "COHERE_API_KEY=$cohereKey"
            Write-Host "Cohere API-Key hinzugefügt" -ForegroundColor Green
        } else {
            Write-Host "Cohere API-Key scheint nicht das richtige Format zu haben" -ForegroundColor Red
        }
    }
    
    # Datei speichern
    $envContent | Set-Content $envPath
    
    Write-Host "`nAPI-Keys wurden in .env-Datei gespeichert." -ForegroundColor Yellow
    Write-Host "WICHTIG: Diese Datei ist in .gitignore aufgeführt und sollte nicht hochgeladen werden." -ForegroundColor Yellow
    Write-Host "Überprüfe mit 'git status', dass .env NICHT als zum Commit vorgemerkte Datei erscheint." -ForegroundColor Yellow
} else {
    Write-Host "Ungültige Auswahl. Setup abgebrochen." -ForegroundColor Red
}

Write-Host "`nFür weitere Informationen zur sicheren API-Key-Verwaltung siehe SICHERE_API_KEYS.md" -ForegroundColor Cyan
Write-Host "===============================================================`n" -ForegroundColor Cyan
