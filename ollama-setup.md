# 🐳 Ollama Setup für lokale Modelle

## **Warum Ollama?**
- **Datenschutz**: Alle Daten bleiben lokal
- **Kostenlos**: Keine API-Kosten
- **Schnell**: Keine Netzwerk-Latenz
- **Offline**: Funktioniert ohne Internet

## **Installation:**

### **Windows:**
1. Besuchen Sie: https://ollama.ai/download
2. Laden Sie den Windows-Installer herunter
3. Führen Sie die Installation aus
4. Starten Sie Ollama

### **macOS:**
```bash
brew install ollama
ollama serve
```

### **Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve
```

## **Modelle herunterladen:**

### **Empfohlene Modelle:**
```bash
# Für Code-Generierung
ollama pull qwen2.5-coder:32b-instruct

# Für allgemeine Aufgaben
ollama pull llama3.3:70b-instruct

# Für schnelle Antworten
ollama pull phi:latest
```

## **Testen:**
```bash
# Testen Sie das Modell
ollama run qwen2.5-coder:32b-instruct "Schreibe eine Hello World Funktion in Python"
```

## **Guido Integration:**
1. Ollama läuft auf `http://127.0.0.1:11434`
2. Guido erkennt automatisch verfügbare Modelle
3. Verwenden Sie "Nur lokale Modelle" für Datenschutz

## **Troubleshooting:**
- **Port 11434 blockiert**: Firewall-Einstellungen prüfen
- **Nicht genug RAM**: Kleinere Modelle verwenden
- **Langsam**: GPU-Beschleunigung aktivieren
