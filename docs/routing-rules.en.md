# Routing Rules (Deep Dive)

<!-- TOC START -->
<!-- TOC END -->

## Rule Structure
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

## Matching Logic
- All `if` fields optional
- `anyKeyword`: true if any present
- `allKeywords`: all must appear
- `fileLangIn`: editor languageId
- `filePathMatches`: glob patterns
- Context sizes in KB (estimated)

## Scoring
Base score + rule priority + capability fit + mode modifier.

## Fallback
If top candidate unavailable (no key, timeout, budget exceeded) → next.

## Best Practices
- Place generic rules last
- Use priority for critical overrides
- Restrict expensive models to clear intent cues
