# Datenschutz (Deep Dive)

<!-- TOC START -->
<!-- TOC END -->

## Ziele
- Minimale Exposition sensibler Daten
- Kontrollierte externe Kommunikation

## Privacy Modi
| Modus | Verhalten |
|-------|-----------|
| `privacy-strict` | Nur lokale Modelle, `allowExternal=false` |
| `local-only` | Lokale Modelle bevorzugt, remote möglich |
| `offline` | Nur lokale Modelle, kein Netz notwendig |

## Redaction
```yaml
privacy:
  redactPaths: ["**/secret/**","**/.env*"]
  stripFileContentOverKB: 256
  allowExternal: true
```

## Mechanismen
- Pfad-Masking vor Routing / Logging
- Größe > Limit → Inhalt entfernt (nur Metadaten)
- Strikter Modus erzwingt `allowExternal: false`

## Empfehlungen
- Sensible Ordner immer whitelisten / maskieren
- Code vor Versand minimieren (Snippets statt komplette Dateien)
