# Guido API Key Konfiguration

Diese Datei dient als Anleitung zur Konfiguration der API-Keys für Guido Model Router.

## Verfügbare Provider und API-Keys

1. **OpenAI**
   - Setting: `modelRouter.openaiApiKey`
   - Format: `sk-...`
   - URL: https://platform.openai.com/api-keys

2. **OpenRouter** 
   - Setting: `modelRouter.openrouterApiKey`
   - Format: `sk-or-...`
   - URL: https://openrouter.ai/keys

3. **Hugging Face**
   - Setting: `modelRouter.huggingfaceApiKey` 
   - Format: `hf_...`
   - URL: https://huggingface.co/settings/tokens

4. **Anthropic**
   - Setting: `modelRouter.anthropicApiKey`
   - Format: `sk-ant-...` 
   - URL: https://console.anthropic.com/keys

5. **Cohere**
   - Setting: `modelRouter.cohereApiKey`
   - Format: `...`
   - URL: https://dashboard.cohere.com/api-keys

## API-Keys konfigurieren

1. Öffne die Command Palette: `Strg+Shift+P`
2. Tippe "Preferences: Open Settings (JSON)"
3. Füge die API-Keys hinzu:

```json
{
  "modelRouter.openaiApiKey": "sk-...",
  "modelRouter.openrouterApiKey": "sk-or-...",
  "modelRouter.huggingfaceApiKey": "hf_...",
  "modelRouter.anthropicApiKey": "sk-ant-...",
  "modelRouter.cohereApiKey": "..."
}
```

HINWEIS: Es reicht ein Provider, um zu starten. Empfohlen ist OpenAI oder OpenRouter.
