# Architecture Overview

<!-- TOC START -->
<!-- TOC END -->

## Goals
- Unified routing engine for multiple providers (local + cloud)
- Cost & budget awareness as first class concern
- Privacy modes that can fully block external calls
- Extensible (providers, rules, voice, MCP)

## Core Components
| Component | Purpose |
|-----------|---------|
| `extension.ts` | Entry point, commands, status bar, lifecycle |
| `router.ts` | Core routing (rules, scoring, fallback) |
| `price.ts` | Token/cost estimation & budget manager |
| `providers/*` | Provider implementations (OpenAI-compatible, Ollama) |
| `config.ts` | YAML loading/validation, profiles |
| `secret.ts` | API key storage (VSCode SecretStorage) |
| `promptClassifier.ts` | Optional heuristic/LLM classifier |
| `voice/*` | Guido voice control subsystem |
| `mcp/server.ts` | MCP server interface |

## Chat Flow
1. User command → prompt
2. Collect context (file, size, mode)
3. Router evaluates rules → candidates
4. Budget / privacy validation filters
5. Selected provider streams response
6. Token usage → cost → BudgetManager
7. Status bar updates (listener)

## Scoring Factors
- Rule match & priority
- Mode modifiers (`speed`, `quality`, `cheap`)
- Model capabilities vs. required traits
- Availability (API key present, connectivity)

## Extensibility
New provider = subclass `BaseProvider` and register in `initializeProviders()`.

## Failure / Fallback
- ProviderError → next candidate
- RateLimit → (future) backoff
- Hard budget stop → pre-call abort

## Security & Privacy
- Secrets never stored in YAML
- Privacy-strict: only local providers + redaction

## MCP
- Exposes routing as a tool
- Future: unify tool calling

## Voice
- VoiceController reuses routing logic
- Intent mapping layer adds semantics

## Next Architecture Steps
- Structured tool invocation API
- Persistent caching layers
- Optional telemetry abstraction
