# Architektur Übersicht

<!-- TOC START -->
<!-- TOC END -->

## Ziele
- Einheitliche Routing-Engine für mehrere Provider (lokal + Cloud)
- Kosten- & Budgetbewusstsein als First-Class Concern
- Privacy-Modi die externe Calls unterbinden können
- Erweiterbar (neue Provider, neue Routing-Regeln, Voice, MCP)

## Hauptkomponenten
| Komponente | Zweck |
|------------|------|
| `extension.ts` | Einstieg, Commands, Statusbar, Lifecycle |
| `router.ts` | Kern-Routing (Regeln, Scoring, Fallback) |
| `price.ts` | Token-/Kosten-Schätzung & Budget Manager |
| `providers/*` | Provider Implementierungen (OpenAI-kompatibel, Ollama) |
| `config.ts` | YAML Laden/Validieren, Profile |
| `secret.ts` | API-Key Verwaltung (VSCode SecretStorage) |
| `promptClassifier.ts` | Optionale Heuristik/LLM Klassifikation |
| `voice/*` | Guido Voice Control Subsystem |
| `mcp/server.ts` | MCP Server für externe Tools |

## Datenfluss (Chat)
1. Nutzer Command → Prompt
2. Kontext (Datei, Größe, Modus) gesammelt
3. Router bewertet Regeln → Kandidaten (Provider+Modell)
4. Budget- / Privacy-Validierung filtert
5. Gewählter Provider streamt Antwort
6. Token Usage → Kosten → BudgetManager
7. Statusbar aktualisiert (Listener)

## Routing Score Faktoren
- Regel-Priorität & Treffer (Keywords, Sprache, Dateigröße)
- Modus Modifier (`speed`, `quality`, `cheap`)
- Modell-Fähigkeiten (Caps) vs. gewünschte Merkmale
- Verfügbarkeit (Ping / API-Key vorhanden)

## Erweiterbarkeit
Neue Provider → Klasse die `BaseProvider` erweitert und in `initializeProviders()` registriert wird.

## Fehler- & Fallback-Strategie
- ProviderError → nächster Kandidat
- RateLimit → Backoff möglich (TODO)
- Hard Budget Stop → Abbruch vor API Call

## Sicherheit & Privacy
- Secrets niemals in YAML gespeichert
- Privacy-Strict: nur lokale Provider + Redaction

## MCP Integration
- Stellt Routing als Tool bereit
- Kann später Tool-Calling Inputs validieren

## Voice Integration
- VoiceController nutzt Router identisch wie Chat-Command
- Zusätzliche Intent Mapping Schicht

## Nächste Architektur-Schritte
- Tool Aufrufe strukturieren (funktionale Kern-API)
- Caching (Classifier & Cost) persistenter gestalten
- Telemetrie abstrahieren (optional)
