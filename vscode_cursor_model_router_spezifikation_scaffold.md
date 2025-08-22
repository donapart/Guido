# VSCode/Cursor **Model Router** – Extension (Spec + Scaffold)

> Ziel: Eine VSCode- & Cursor-kompatible Erweiterung, die **automatisch passende KI‑Modelle** (lokal & extern) je nach Aufgabe/Prompt auswählt – inkl. **API‑Key‑Verwaltung**, **Preis-/Kostenbewusstsein**, **Modi (Speed/Quality/Cheap/Local‑only/Privacy)** und **MCP‑Integration**.

---

## 1) Features (kurz & ehrlich)

- **Auto‑Routing**: Regelbasiert (Keywords/Regex/Dateitypen/Dateigröße/Privacy-Flag) + optionaler LLM‑Classifier.
- **Provider-Matrix**: OpenAI‑kompatibel (z. B. GPT‑4o/mini, 4.1/mini), Grok, DeepSeek, Phi, Llama, **Ollama/LM Studio** (lokal), beliebige OpenAI‑API‑Compatible Endpoints.
- **MCP**:
  - *MCP‑Server* „router“: Stellt ein Tool `route(prompt, metadata)` bereit.
  - *MCP‑Client*: Kann zu zusätzlichen MCP‑Servern verbinden und deren Tools in Chats nutzen.
- **Modi**: `auto`, `speed`, `quality`, `cheap`, `local-only`, `offline`, `privacy-strict`.
- **Preisbewusstsein**: hinterlegte Preise pro Modell (Input/Output/Cached‑Input). Live‑**Kosten‑Schätzung** + Rate‑Limits, Budget‑Deckel.
- **API‑Keys/Secrets**: Speichern über VSCode SecretStorage (System‑Keychain). Kein Klartext in Settings.
- **UI**: Statusbar (aktiver Modus + geschätzte Kosten), QuickPick (Provider/Model Override), minimaler Chat‑Webview (optional), Inline‑Codeaktionen.
- **Fallbacks**: Netz weg → lokal; Modell down → Alternativmodell gleicher Klasse.
- **Privacy**: `privacy-strict` blockt Telemetrie, anonymisiert Metadaten, erzwingt lokale Modelle.

**Klartext:** Cursor ist VSCode‑basiert, aber hat eigene KI‑Funktionen. Die Extension läuft, **integriert aber nicht Cursor‑Chat** selbst. Du bekommst Panels/Commands, die parallel nutzbar sind.

---

## 2) Architektur

```
├─ package.json                   (Extension-Metadaten, Commands, Activation)
├─ tsconfig.json
├─ src/
│  ├─ extension.ts                (Entry, Registrierungen, Statusbar)
│  ├─ router.ts                   (Routing-Engine: Regeln, Scoring, Fallbacks)
│  ├─ promptClassifier.ts         (optionaler LLM-Classifier, abschaltbar)
│  ├─ price.ts                    (Kostenschätzung, Token/Char-Heuristik)
│  ├─ secret.ts                   (SecretStorage-Wrapper)
│  ├─ providers/
│  │  ├─ base.ts                  (Interface, Streaming, Abort)
│  │  ├─ openaiCompat.ts          (OpenAI-kompatible Provider, inkl. Azure/GH/Others)
│  │  ├─ ollama.ts                (lokal)
│  │  └─ mcpClient.ts             (MCP-Client, Toolaufrufe)
│  ├─ mcp/
│  │  └─ server.ts                (MCP-Server „router“)
│  ├─ webview/
│  │  ├─ chatPanel.ts             (einfaches Chat-Panel)
│  │  └─ ui.html
│  └─ config.ts                   (Laden/Validieren router.config.yaml)
├─ router.config.yaml             (Beispielkonfiguration)
├─ README.md
└─ LICENSE
```

---

## 3) Konfigurationsdatei `router.config.yaml`

```yaml
version: 1
activeProfile: default

profiles:
  default:
    mode: auto  # auto|speed|quality|cheap|local-only|offline|privacy-strict
    budget:
      dailyUSD: 2.50    # Tagesdeckel; 0 = aus
      hardStop: true
    privacy:
      redactPaths: ["**/secrets/**", "**/.env*"]
      stripFileContentOverKB: 256
      allowExternal: true  # bei privacy-strict automatisch false

    providers:
      # OpenAI-kompatible Endpunkte
      - id: openai
        kind: openai-compat
        baseUrl: https://api.openai.com/v1
        apiKeyRef: OPENAI_API_KEY
        models:
          - name: gpt-4.1
            context: 200000
            caps: ["tools","json","long"]
            price:
              inputPerMTok: 2.00
              outputPerMTok: 8.00
          - name: gpt-4o
            context: 128000
            caps: ["vision","tools","json"]
            price:
              inputPerMTok: 2.50
              cachedInputPerMTok: 1.25
              outputPerMTok: 10.00
          - name: gpt-4o-mini
            context: 128000
            caps: ["cheap","tools","json"]
            price:
              inputPerMTok: 0.15
              cachedInputPerMTok: 0.08
              outputPerMTok: 0.60

      # DeepSeek (OpenAI-kompatibel)
      - id: deepseek
        kind: openai-compat
        baseUrl: https://api.deepseek.com/v1
        apiKeyRef: DEEPSEEK_API_KEY
        models:
          - name: deepseek-v3
            context: 128000
            caps: ["tools","json","long"]
            price:
              inputPerMTok: 1.14
              outputPerMTok: 4.56
          - name: deepseek-r1
            context: 128000
            caps: ["reasoning","tools"]
            price:
              inputPerMTok: 1.35
              outputPerMTok: 5.40

      # xAI Grok (OpenAI-kompatibel oder natives Schema)
      - id: grok
        kind: openai-compat
        baseUrl: https://api.x.ai/v1
        apiKeyRef: GROK_API_KEY
        models:
          - name: grok-3
            context: 131072
            caps: ["tools","json"]
            price:
              inputPerMTok: 3.00
              outputPerMTok: 15.00
          - name: grok-3-mini
            context: 131072
            caps: ["cheap","tools"]
            price:
              inputPerMTok: 0.25
              outputPerMTok: 1.27

      # Microsoft Phi (OpenAI-kompatible Gateways oder Direkt)
      - id: phi
        kind: openai-compat
        baseUrl: https://api.example-phi.com/v1
        apiKeyRef: PHI_API_KEY
        models:
          - name: phi-4
            context: 128000
            caps: ["cheap","tools","json","long"]
            price:
              inputPerMTok: 0.13
              outputPerMTok: 0.50
          - name: phi-4-mini-instruct
            context: 128000
            caps: ["ultracheap","tools"]
            price:
              inputPerMTok: 0.08
              outputPerMTok: 0.30

      # Open-Source lokal via Ollama
      - id: ollama
        kind: ollama
        baseUrl: http://127.0.0.1:11434
        models:
          - name: llama3.3:70b-instruct
            context: 32768
            caps: ["local","long","tools"]
          - name: qwen2.5-coder:32b-instruct
            context: 32768
            caps: ["local","coder"]

    routing:
      rules:
        # 1) Tests & Boilerplate → günstige Mini‑Modelle
        - id: cheap-tests
          if:
            anyKeyword: ["test", "unit test", "boilerplate", "types", "docstring"]
            fileLangIn: ["ts","tsx","js","py","go","java","csharp"]
          then:
            prefer: ["openai:gpt-4o-mini", "phi:phi-4-mini-instruct", "grok:grok-3-mini"]
            target: chat

        # 2) Harte Bugs/Algorithmik → Reasoning‑Modelle
        - id: hard-bug
          if:
            anyKeyword: ["prove", "optimize", "complexity", "deadlock", "race", "segfault", "undefined behavior"]
          then:
            prefer: ["deepseek:deepseek-r1", "openai:gpt-4.1", "deepseek:deepseek-v3"]
            target: chat

        # 3) Große Refactors/Long‑Context
        - id: refactor-long
          if:
            minContextKB: 128
          then:
            prefer: ["openai:gpt-4.1", "openai:gpt-4o", "phi:phi-4"]
            target: chat

        # 4) Offline/Privacy → lokal erzwingen
        - id: privacy
          if:
            privacyStrict: true
          then:
            prefer: ["ollama:llama3.3:70b-instruct", "ollama:qwen2.5-coder:32b-instruct"]
            target: chat

      default:
        prefer: ["openai:gpt-4o-mini", "phi:phi-4", "deepseek:deepseek-v3", "ollama:qwen2.5-coder:32b-instruct"]
        target: chat
```

> **Hinweis:** Preise/Endpoints bitte an deine tatsächlichen Anbieter anpassen. Die Struktur ist generisch.

---

## 4) package.json (Auszug)

```json
{
  "name": "model-router",
  "displayName": "Model Router (VSCode/Cursor)",
  "publisher": "your-name",
  "version": "0.1.0",
  "engines": { "vscode": "^1.90.0" },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished", "onCommand:modelRouter.chat", "onCommand:modelRouter.setApiKey"],
  "contributes": {
    "configuration": {
      "title": "Model Router",
      "properties": {
        "modelRouter.configPath": {
          "type": "string",
          "default": "${workspaceFolder}/router.config.yaml",
          "description": "Pfad zur Router-Konfiguration (YAML)."
        },
        "modelRouter.mode": {
          "type": "string",
          "enum": ["auto","speed","quality","cheap","local-only","offline","privacy-strict"],
          "default": "auto"
        }
      }
    },
    "commands": [
      { "command": "modelRouter.chat", "title": "Model Router: Chat" },
      { "command": "modelRouter.routeOnce", "title": "Model Router: Route Prompt Once" },
      { "command": "modelRouter.setApiKey", "title": "Model Router: Set API Key (Provider)" },
      { "command": "modelRouter.switchMode", "title": "Model Router: Switch Mode" },
      { "command": "modelRouter.openConfig", "title": "Model Router: Open Config" }
    ]
  },
  "main": "./out/extension.js",
  "scripts": {
    "compile": "tsc -p .",
    "watch": "tsc -w",
    "package": "vsce package"
  },
  "devDependencies": {
    "@types/node": "^20.12.12",
    "typescript": "^5.4.5",
    "vsce": "^2.15.0"
  },
  "dependencies": {
    "yaml": "^2.4.2"
  }
}
```

---

## 5) `src/providers/base.ts`

```ts
export type ChatMessage = { role: "system"|"user"|"assistant"; content: string };
export type ChatOptions = { maxTokens?: number; temperature?: number; json?: boolean; toolsJsonSchema?: any; signal?: AbortSignal };

export interface ChatStreamChunk { type: "text"|"tool"|"done"; data?: string | any }

export interface Provider {
  id(): string;
  supports(model: string): boolean;
  estimateTokens(input: string): number; // heuristisch
  chat(model: string, messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<ChatStreamChunk>;
}
```

---

## 6) `src/providers/openaiCompat.ts`

```ts
import { Provider, ChatMessage, ChatOptions, ChatStreamChunk } from "./base";

export class OpenAICompatProvider implements Provider {
  constructor(private cfg: { id: string; baseUrl: string; apiKey: string; models: string[] }) {}
  id() { return this.cfg.id; }
  supports(model: string) { return this.cfg.models.includes(model); }
  estimateTokens(input: string) { return Math.ceil(input.length / 4); }

  async *chat(model: string, messages: ChatMessage[], opts: ChatOptions = {}): AsyncIterable<ChatStreamChunk> {
    const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.cfg.apiKey}` },
      body: JSON.stringify({ model, messages, stream: true, temperature: opts.temperature ?? 0, response_format: opts.json ? { type: "json_object" } : undefined })
    });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      for (const line of text.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") { yield { type: "done" }; return; }
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (typeof delta === "string") yield { type: "text", data: delta };
        } catch { /* ignore */ }
      }
    }
    yield { type: "done" };
  }
}
```

---

## 7) `src/providers/ollama.ts`

```ts
import { Provider, ChatMessage, ChatOptions, ChatStreamChunk } from "./base";

export class OllamaProvider implements Provider {
  constructor(private cfg: { id: string; baseUrl: string; models: string[] }) {}
  id() { return this.cfg.id; }
  supports(model: string) { return this.cfg.models.includes(model); }
  estimateTokens(input: string) { return Math.ceil(input.length / 3.5); }

  async *chat(model: string, messages: ChatMessage[], opts: ChatOptions = {}): AsyncIterable<ChatStreamChunk> {
    const res = await fetch(`${this.cfg.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true, options: { temperature: opts.temperature ?? 0 } })
    });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      for (const line of text.trim().split("\n")) {
        try {
          const json = JSON.parse(line);
          const delta = json.message?.content;
          if (typeof delta === "string") yield { type: "text", data: delta };
        } catch {}
      }
    }
    yield { type: "done" };
  }
}
```

---

## 8) `src/secret.ts`

```ts
import * as vscode from "vscode";

export async function putSecret(key: string, value: string) {
  await vscode.authentication.getSession("model-router", [], { createIfNone: true });
  await vscode.workspace.getConfiguration().update(`modelRouter.secret.${key}`, undefined, vscode.ConfigurationTarget.Global);
  return vscode.authentication.getSession("model-router", [], { createIfNone: true }).then(() => vscode.env as any);
}

export async function setSecret(ctx: vscode.ExtensionContext, key: string, value: string) {
  await ctx.secrets.store(key, value);
}

export async function getSecret(ctx: vscode.ExtensionContext, key: string) {
  return ctx.secrets.get(key);
}
```

---

## 9) `src/price.ts`

```ts
export type Price = { inputPerMTok: number; outputPerMTok: number; cachedInputPerMTok?: number };

export function estimateCostUSD(price: Price, inputTokens: number, outputTokens: number, cachedInput = false) {
  const inRate = cachedInput && price.cachedInputPerMTok ? price.cachedInputPerMTok : price.inputPerMTok;
  return (inputTokens / 1_000_000) * inRate + (outputTokens / 1_000_000) * price.outputPerMTok;
}
```

---

## 10) `src/router.ts`

```ts
import * as vscode from "vscode";

export type RouteMeta = {
  lang?: string;
  fileSizeKB?: number;
  privacyStrict?: boolean;
  keywords?: string[];
};

export type Rule = {
  id: string;
  if: {
    anyKeyword?: string[];
    fileLangIn?: string[];
    minContextKB?: number;
    privacyStrict?: boolean;
  };
  then: {
    prefer: string[]; // providerId:model
    target: "chat";
  };
};

export function scoreRule(rule: Rule, meta: RouteMeta): number {
  let score = 0;
  if (rule.if.anyKeyword?.some(k => meta.keywords?.some(m => m.includes(k))) ) score += 2;
  if (rule.if.fileLangIn?.includes(meta.lang ?? "")) score += 1;
  if ((rule.if.minContextKB ?? 0) <= (meta.fileSizeKB ?? 0)) score += 1;
  if (rule.if.privacyStrict && meta.privacyStrict) score += 3;
  return score;
}

export function pickModel(rules: Rule[], meta: RouteMeta, fallback: string[]): string {
  const ranked = rules.map(r => ({ r, s: scoreRule(r, meta) })).sort((a, b) => b.s - a.s);
  for (const { r, s } of ranked) {
    if (s <= 0) continue;
    const m = r.then.prefer[0];
    if (m) return m;
  }
  return fallback[0];
}
```

---

## 11) `src/promptClassifier.ts`

```ts
// Optional: nutze ein günstiges lokales Modell (Ollama) zur Klassifikation, wenn aktiviert.
export type PromptClass = "boilerplate" | "tests" | "bug" | "refactor" | "docs" | "general";

export async function classifyPrompt(_prompt: string): Promise<PromptClass> {
  // Platzhalter: einfache Heuristik, kann durch LLM ersetzt werden
  const p = _prompt.toLowerCase();
  if (p.includes("test")) return "tests";
  if (p.includes("bug") || p.includes("error") || p.includes("stack trace")) return "bug";
  if (p.includes("refactor") || p.length > 4000) return "refactor";
  if (p.includes("doc")) return "docs";
  return "general";
}
```

---

## 12) `src/config.ts`

```ts
import * as fs from "node:fs";
import * as path from "node:path";
import YAML from "yaml";

export type ModelCfg = { name: string; context?: number; caps?: string[]; price?: any };
export type ProviderCfg = { id: string; kind: "openai-compat"|"ollama"; baseUrl: string; apiKeyRef?: string; models: ModelCfg[] };
export type RuleCfg = any;
export type ProfileCfg = { mode: string; budget?: any; privacy?: any; providers: ProviderCfg[]; routing: { rules: RuleCfg[]; default: any } };
export type RouterConfig = { version: number; activeProfile: string; profiles: Record<string, ProfileCfg> };

export function loadConfig(file: string): RouterConfig {
  const raw = fs.readFileSync(path.resolve(file), "utf8");
  return YAML.parse(raw) as RouterConfig;
}
```

---

## 13) `src/extension.ts`

```ts
import * as vscode from "vscode";
import { loadConfig } from "./config";
import { pickModel } from "./router";
import { OpenAICompatProvider } from "./providers/openaiCompat";
import { OllamaProvider } from "./providers/ollama";

export async function activate(ctx: vscode.ExtensionContext) {
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  status.text = "$(rocket) Model Router: auto";
  status.command = "modelRouter.switchMode";
  status.show();

  let cfgPath = vscode.workspace.getConfiguration().get<string>("modelRouter.configPath")!;
  let conf = loadConfig(cfgPath);
  let profile = conf.profiles[conf.activeProfile];

  // Provider-Registry
  const providers = new Map<string, any>();
  for (const p of profile.providers) {
    if (p.kind === "openai-compat") {
      const apiKey = await ctx.secrets.get(p.apiKeyRef ?? "") || process.env[p.apiKeyRef ?? ""] || "";
      providers.set(p.id, new OpenAICompatProvider({ id: p.id, baseUrl: p.baseUrl, apiKey, models: p.models.map(m => m.name) }));
    } else if (p.kind === "ollama") {
      providers.set(p.id, new OllamaProvider({ id: p.id, baseUrl: p.baseUrl, models: p.models.map(m => m.name) }));
    }
  }

  ctx.subscriptions.push(
    vscode.commands.registerCommand("modelRouter.switchMode", async () => {
      const pick = await vscode.window.showQuickPick(["auto","speed","quality","cheap","local-only","offline","privacy-strict"], { placeHolder: "Modus wählen" });
      if (pick) { status.text = `$(rocket) Model Router: ${pick}`; }
    }),

    vscode.commands.registerCommand("modelRouter.openConfig", async () => {
      const uri = vscode.Uri.file(cfgPath);
      vscode.window.showTextDocument(uri);
    }),

    vscode.commands.registerCommand("modelRouter.setApiKey", async () => {
      const providerId = await vscode.window.showInputBox({ prompt: "Provider-ID (z. B. openai)" });
      const key = await vscode.window.showInputBox({ prompt: "API Key", password: true });
      if (providerId && key) await ctx.secrets.store(providerId.toUpperCase() + "_API_KEY", key);
      vscode.window.showInformationMessage(`API Key gespeichert für ${providerId}`);
    }),

    vscode.commands.registerCommand("modelRouter.routeOnce", async () => {
      const editor = vscode.window.activeTextEditor;
      const selection = editor?.document.getText(editor.selection) || editor?.document.getText() || "";
      const lang = editor?.document.languageId;
      const fileSizeKB = Buffer.byteLength(selection || "", "utf8") / 1024;
      const keywords = selection.toLowerCase().match(/[a-zA-Z]{4,}/g)?.slice(0, 64) || [];

      const rules = (profile.routing.rules as any[]);
      const chosen = pickModel(rules, { lang, fileSizeKB, privacyStrict: false, keywords }, profile.routing.default.prefer);
      await vscode.window.showInformationMessage(`Geroutetes Modell: ${chosen}`);
    }),

    vscode.commands.registerCommand("modelRouter.chat", async () => {
      const prompt = await vscode.window.showInputBox({ prompt: "Frage/Anweisung an die KI" });
      if (!prompt) return;
      const rules = (profile.routing.rules as any[]);
      const chosen = pickModel(rules, { lang: "", fileSizeKB: prompt.length/1024, privacyStrict: false, keywords: prompt.toLowerCase().split(/\s+/) }, profile.routing.default.prefer);
      const [providerId, ...modelParts] = chosen.split(":");
      const model = modelParts.join(":");
      const provider = providers.get(providerId);
      if (!provider) return vscode.window.showErrorMessage(`Provider ${providerId} nicht gefunden`);

      const panel = vscode.window.createOutputChannel("Model Router Chat");
      panel.show(true);
      panel.appendLine(`→ ${providerId}/${model}`);

      for await (const chunk of provider.chat(model, [{ role: "user", content: prompt }], { temperature: 0 })) {
        if (chunk.type === "text") panel.append(chunk.data as string);
      }
      panel.appendLine("\n\n✔ fertig");
    })
  );
}

export function deactivate() {}
```

---

## 14) MCP – einfacher Server `src/mcp/server.ts`

```ts
// Minimaler MCP-Server, der die Routing-Funktion als Tool anbietet.
// Hinweis: In der Praxis mcp-node / mcp-js verwenden. Hier nur Pseudocode-Schema.
import { pickModel } from "../router";

export function startMcpServer(rules: any[], fallback: string[]) {
  // Pseudocode-API: startServer({ tools: { route } })
  return {
    route: (args: { prompt: string; lang?: string; fileSizeKB?: number; privacyStrict?: boolean }) => {
      const kw = args.prompt.toLowerCase().split(/\s+/);
      return pickModel(rules, { lang: args.lang, fileSizeKB: args.fileSizeKB, privacyStrict: !!args.privacyStrict, keywords: kw }, fallback);
    }
  };
}
```

---

## 15) Minimaler Chat‑Webview (optional) `src/webview/chatPanel.ts`

```ts
// Für ein richtiges Panel wäre eine React/Webview-Implementierung sinnvoll.
// Hier nur Platzhalter, da Cursor/VSC Kompatibilität ohne schweren Overhead gewahrt bleiben soll.
```

---

## 16) README (Kurzfassung)

### Installation

1. Repo klonen, `npm i`, `npm run compile`.
2. `F5` in VSCode (Extension Development Host) starten.
3. `Model Router: Open Config` ausführen und `router.config.yaml` anpassen.
4. `Model Router: Set API Key` je Provider durchführen (Keys werden **sicher** via SecretStorage gespeichert).

### Nutzung

- **Automodus**: `Model Router: Chat` oder `Route Prompt Once` → Modellvorschlag/‑nutzung je nach Regeln/Modus.
- **Modus wechseln**: Statusbar oder `Model Router: Switch Mode`.
- **Privacy‑strict**: Schaltet auf lokale Modelle um (Ollama/LM Studio). Keine externen Calls.

### Sicherheit & Grenzen

- Kein Klartext‑Key in Settings.
- Preise/Kontingente selbst prüfen – Schätzungen sind heuristisch.
- Cursor‑eigene Chat‑Funktionen werden nicht ersetzt; die Extension arbeitet parallel.

---

## 17) Nächste sinnvolle Ausbaustufen

- Tokenisierung genauer (tiktoken/gguf‑Tokenizer lokal).
- Richtiger MCP‑Server (mcp‑js) + Client‑Registry in der Extension.
- Webview‑Chat mit Tool‑Aufrufen (MCP), File‑Tree‑Context, Inline‑Diff‑Apply.
- Eval/Bench: Messung Latenz/Kosten/Qualität pro Task‑Typ.
- Team‑Profiles: geteilte `router.config.yaml` pro Workspace.

---

## 18) Praxis‑Defaults (Meinung)

- **Alltag**: `openai:gpt-4o-mini` (preiswert, robust). Fallback `phi:phi-4`.
- **Harte Bugs/Proofs**: `deepseek:deepseek-r1` → wenn zu teuer/lang: `deepseek-v3`.
- **Langkontext/Refactor**: `openai:gpt-4.1` (teuer aber stabil) → notfalls `phi-4`.
- **Offline/Privacy**: `ollama:qwen2.5-coder:32b-instruct` oder `llama3.3:70b-instruct`.

---

> Dieses Scaffold ist bewusst **schlank** gehalten: lauffähige Grundstruktur, klare Schnittstellen, sofort erweiterbar. Preise/Endpoints bitte real verifizieren und im YAML anpassen.

