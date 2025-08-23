# Guido Model Router Extension v0.2.0 - Installation Guide

## 🚀 Schnelle Installation

### Manuelle Installation der neuen Provider

Da die VSCE-Paketerstellung derzeit Probleme hat, können Sie die neuen OpenRouter und Hugging Face Provider manuell zur bestehenden Extension hinzufügen:

### Schritt 1: Extension v0.1.9 installieren
```bash
code --install-extension model-router-0.1.9.vsix
```

### Schritt 2: Neue Provider-Dateien kopieren
Die kompilierten Provider befinden sich in:
- `out/providers/openrouter.js` 
- `out/providers/huggingface.js`

Kopieren Sie diese Dateien in das Extension-Verzeichnis:
```
%USERPROFILE%\.vscode\extensions\model-router.model-router-0.1.9\out\providers\
```

### Schritt 3: VS Code neu starten
Starten Sie VS Code neu, damit die neuen Provider geladen werden.

## 🔧 Konfiguration

### API-Schlüssel einrichten
Öffnen Sie VS Code Settings (`Ctrl+,`) und fügen Sie hinzu:

```json
{
  "modelRouter.openrouterApiKey": "YOUR_OPENROUTER_API_KEY",
  "modelRouter.huggingfaceApiKey": "YOUR_HUGGINGFACE_API_KEY",
  "modelRouter.anthropicApiKey": "YOUR_ANTHROPIC_API_KEY",
  "modelRouter.cohereApiKey": "YOUR_COHERE_API_KEY"
}
```

### API-Schlüssel erhalten

#### OpenRouter API Key
1. Besuchen Sie: https://openrouter.ai/
2. Registrieren Sie sich für ein kostenloses Konto
3. Gehen Sie zu "API Keys" und erstellen Sie einen neuen Schlüssel
4. Kopieren Sie den Schlüssel in die VS Code Settings

#### Hugging Face API Key
1. Besuchen Sie: https://huggingface.co/
2. Registrieren Sie sich für ein kostenloses Konto
3. Gehen Sie zu Settings → Access Tokens
4. Erstellen Sie einen neuen Token mit "Read" Berechtigung
5. Kopieren Sie den Token in die VS Code Settings

## 🎯 Verwendung

### OpenRouter Provider
- Zugriff auf 100+ Modelle von verschiedenen Anbietern
- Modellformat: `provider/model` (z.B. `openai/gpt-4o`, `anthropic/claude-3-5-sonnet`)
- Automatische Kostenschätzung
- Streaming-Chat Unterstützung

### Hugging Face Provider
- Zugriff auf Open Source Modelle
- Unterstützt Chat-, Code- und Text-Generation-Modelle
- Kostenlose API mit Rate Limits
- Automatische Modell-Erkennung

### Commands
- `Ctrl+Shift+P` → "Model Router: Chat"
- Wählen Sie einen Provider (openrouter, huggingface, anthropic, cohere)
- Wählen Sie ein Modell
- Starten Sie den Chat!

## 📋 Verfügbare Modelle

### OpenRouter
- **OpenAI**: gpt-4o, gpt-4-turbo, gpt-3.5-turbo
- **Anthropic**: claude-3-5-sonnet, claude-3-opus, claude-3-haiku
- **Meta**: llama-3.1-70b-instruct, llama-2-chat
- **Google**: gemini-pro, palm-2
- **Mistral**: mistral-7b-instruct, mixtral-8x7b

### Hugging Face
- **Chat**: microsoft/DialoGPT-large
- **Code**: Salesforce/codegen-2B-multi, bigcode/santacoder
- **Text**: gpt2-xl, EleutherAI/gpt-j-6B
- **Instruction**: google/flan-t5-xl
- **Llama**: meta-llama/Llama-2-7b-chat-hf

## 🔧 Entwickler-Info

### Projektstruktur
```
src/providers/
├── openrouter.ts      # Universal API Gateway
├── huggingface.ts     # HF Inference API
├── anthropic.ts       # Claude Models
├── cohere.ts          # Command Models
├── ollama.ts          # Local Models
└── base.ts           # Provider Interface
```

### Kompilierung
```bash
npm run compile
```

## 🎉 Features

- ✅ Voice Control mit "Guido" Wake Word
- ✅ Advanced Dashboard
- ✅ Multi-Provider Support
- ✅ Context-Aware Commands
- ✅ Experimental Features
- ✅ **NEU**: OpenRouter Universal Gateway
- ✅ **NEU**: Hugging Face Open Source Models

---

**Viel Spaß mit den neuen AI-Providern!** 🚀🤖
