# Routing-Regeln (Deep Dive)

<!-- TOC START -->
<!-- TOC END -->

## Regelaufbau
```yaml
- id: id-name
  if:
    anyKeyword: ["test"]
    allKeywords: ["refactor","optimize"]
    fileLangIn: ["ts","py"]
    filePathMatches: ["**/test/**"]
    minContextKB: 10
    maxContextKB: 512
    privacyStrict: true
    mode: ["quality"]
  then:
    prefer: ["openai:gpt-4o-mini", "ollama:llama3"]
    target: chat
    priority: 5
```

## Matching Logik
- Alle `if` Felder optional
- `anyKeyword`: Match falls irgendeines im Prompt
- `allKeywords`: alle müssen vorkommen
- `fileLangIn`: Editor Sprache (VSCode languageId)
- `filePathMatches`: Glob Patterns (minimatch)
- Kontextgrößen in KB (geschätzt)

## Scoring
Basis-Score + Regel-Priority + Cap-Fit + Mode Modifier.

## Fallbacks
Wenn Top-Kandidat nicht verfügbar (kein API-Key, Timeout, Budget überschritten) → nächster.

## Best Practices
- Allgemeine Regeln unten platzieren
- Spezifischere Regeln mit höherer Priority
- Preisintensive Modelle nur bei klarer Notwendigkeit
