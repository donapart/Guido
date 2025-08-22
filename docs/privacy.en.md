# Privacy (Deep Dive)

<!-- TOC START -->
<!-- TOC END -->

## Goals
- Minimize exposure of sensitive data
- Controlled external communication

## Modes
| Mode | Behavior |
|------|----------|
| `privacy-strict` | Local models only, `allowExternal=false` |
| `local-only` | Prefer local, remote allowed |
| `offline` | Local only, no network required |

## Redaction
```yaml
privacy:
  redactPaths: ["**/secret/**","**/.env*"]
  stripFileContentOverKB: 256
  allowExternal: true
```

## Mechanisms
- Path masking before routing/logging
- Size > limit → content stripped
- Strict mode forces `allowExternal: false`

## Tips
- Mask sensitive folders early
- Send minimal context snippets
