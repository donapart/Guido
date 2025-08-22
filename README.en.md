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

### 🎨 Usability & UI

- Webview chat panel (floating) + dockable explorer chat view
- Model override dropdown in chat
- Attachment summarization (snippet + secret redaction)
- Cost footer (actual token usage)
- Tools menu (routing simulation, budget, resend, clear)
- Plan / Agent (generate step plan – execution upcoming)
 - Plan / Agent (generate step plan & sequential execution with per-step streaming + abort)
- Voice state badge (idle / listening / recording / processing)
- Status bar integration (mode + optional budget)
- QuickPrompt compact mode
- Full command palette integration

## 🖼️ New UI Assets

### Marketplace Icon
The Marketplace icon is a 512×512 PNG stored in the file `images/extension-icon-512.png`.

### Activity Bar Icons
The Activity Bar uses monochrome SVGs for dark and light themes:
- Light Theme: `resources/activity/light/guido_activity_light.svg`
- Dark Theme: `resources/activity/dark/guido_activity_dark.svg`

### Status Bar and Webview
For the status bar and webview buttons, PNGs sized 32×32 or 48×48 are used.

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

### Chat Interfaces

1. Floating panel: `Model Router: Open Chat UI`
2. Docked view (Explorer) if `modelRouter.chat.showDockView` enabled.

Features:

- Streaming responses with token/cost footer
- Toolbar buttons: Tools, Mic, Speaker (placeholder), Attach, Plan, Settings
- Model dropdown (`auto` = router decides)
- Attachments: limited, snippet extraction + secret redaction
- Info messages (simulation, plan, budget) rendered italic

QuickPrompt (compact mode):

```text
Enable setting: "modelRouter.chat.compactMode": true
Command: "Model Router: Quick Prompt (Kompaktmodus)"
```

### Core Commands

- Chat: "Model Router: Open Chat UI"
- Quick Prompt: "Model Router: Quick Prompt (Kompaktmodus)"
- Tools: "Model Router: Chat Tools"
- Plan: "Model Router: Plan / Agent aus letztem Prompt"
- Show costs: "Model Router: Show Costs"

### Plan / Agent Execution

1. Generate plan: Command "Plan / Agent aus letztem Prompt" (max 7 steps)
2. Execute: Command "Ausgeführten Plan starten" (sequentially runs each step)
3. Abort: Command "Plan-Ausführung abbrechen" (aborts current streaming request)

During execution:

- Each step is re-routed (may use different models)
- Streaming output appended in chat
- Cost recorded per step (budget rules still enforced)
- Synthetic user entry `[Plan Schritt X]` + assistant answer stored in history
- Status bar shows spinner with progress: `$(sync~spin) Plan 2/5`
- On abort shows temporary `Plan Abbruch…` then indicator disappears

After completion the spinner is removed and a completion info message is emitted.

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

Plan progress indicator example while running:

```text
$(rocket) Router: auto (2) | $0.12/2.50 | $(sync~spin) Plan 3/6
```

## 🔒 Privacy
`privacy-strict` enforces local models only, blocks external calls, redacts paths, strips large files.

### Attachments & Redaction Settings
```json
{
  "modelRouter.chat.attachment.maxFiles": 5,
  "modelRouter.chat.attachment.maxSnippetBytes": 8192,
  "modelRouter.chat.attachment.redactSecrets": true,
  "modelRouter.chat.attachment.additionalRedactPatterns": [
    "(?i)password\\s*[:=]\\s*['\"]?[A-Za-z0-9!@#$%^&*_-]{6,}"
  ]
}
```

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
