# Model Router for VSCode/Cursor with Guido Voice Control 🎤

> Language: **English** | [Deutsch](./README.md)

<!-- TOC START -->
<!-- TOC END -->

An intelligent VSCode extension that **automatically selects the optimal AI model** for each task. Includes **full voice control ("Guido")**, supports OpenAI, DeepSeek, Grok, Phi, Ollama and other OpenAI‑compatible providers.

## 🎯 Features

### ⚡ Smart Routing
- Automatic model selection based on prompt, file type & context
- Rule based system with customizable routing rules
- Optional LLM classifier for deeper prompt analysis
- Fallback mechanisms for outages or rate limits

### 🌐 Multi‑Provider Support
- OpenAI (GPT-4o, GPT-4o-mini, GPT-4.1)
- DeepSeek (v3, r1 reasoning)
- Grok (xAI)
- Microsoft Phi (4, 4-mini)
- Ollama (local models: Llama, Qwen, CodeLlama)
- Any OpenAI compatible API

### 💰 Cost Awareness
- Live cost estimation before execution
- Budget management with daily & monthly limits
- Spend tracking & statistics
- Price comparison across models

### 🔒 Security & Privacy
- Secure API key storage via VSCode SecretStorage
- Privacy modes: `privacy-strict`, `local-only`, `offline`
- Redaction filters for sensitive file paths
- No plaintext storage of secrets

### 🎨 Usability
- Status bar integration with current mode & optional budget
- QuickPick menus for provider/model override
- Output channel logging
- Command palette integration

## 🚀 Installation

### 1. Prerequisites
- VSCode 1.90.0+
- Node.js 20+ (for development)
- Optional: Ollama for local models

### 2. Install Extension

#### Dev Version
```bash
git clone <repository-url>
cd model-router
npm install
npm run compile
# Launch via F5 (Run Extension)
```

#### From Package
```bash
npm run package
# VSCode: Extensions: Install from VSIX
```

### 3. Configuration
A default config is created automatically.

## ⚙️ Configuration

See `README.md` (German) for the full YAML example. Core settings:
```yaml
budget:
  dailyUSD: 2.50
  monthlyUSD: 50
  hardStop: true
  warningThreshold: 80
```

VSCode settings:
```json
{
  "modelRouter.configPath": "${workspaceFolder}/router.config.yaml",
  "modelRouter.mode": "auto"
}
```

## 🔑 API Keys
Via Command Palette: "Model Router: Set API Key" or environment variables (`OPENAI_API_KEY`, etc.).

## 🎮 Usage
- Chat: "Model Router: Chat"
- One‑off routing: "Model Router: Route Prompt Once"
- Switch mode: status bar or command
- Show costs: "Model Router: Show Costs"

## 💰 Budget & Status Bar

Settings:
```json
{
  "modelRouter.showBudgetInStatusBar": true,
  "modelRouter.budgetDisplayMode": "compact" // or "detailed"
}
```

Compact example:
```
Router: auto (2) | $0.12/2.50
```
Detailed example:
```
Router: auto (2) | d:0.12/2.50 (5%) m:2.30/100 (2%)
```

Legend:
- `d:` daily spend / limit (+ percentage)
- `m:` monthly spend / limit (+ percentage)
- Warnings at threshold (e.g. 80%) via notification
- Hard stops if `hardStop: true` and limit exceeded

## 🔒 Privacy
`privacy-strict` enforces local models only, blocks external calls, redacts paths, strips large files.

## 🛠 Development
```bash
npm run watch
# F5 in VSCode to start dev host
```
Tests: `npm test`

## 🤝 Contributing
PRs welcome: add tests & description.

## 📄 License
MIT

---
For the full detailed German documentation (routing rules, examples, troubleshooting) see `README.md`.
