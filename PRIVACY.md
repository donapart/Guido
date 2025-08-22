# Datenschutzerklärung - Model Router mit Guido Voice Control

**Letzte Aktualisierung**: $(date)

## 1. Verantwortlicher

**Model Router Extension**  
VSCode/Cursor Extension für intelligente KI-Model-Auswahl mit Sprachsteuerung

## 2. Überblick

Diese Extension verarbeitet Daten zur Bereitstellung von KI-Model-Routing und Sprachsteuerungsfunktionen. Wir nehmen Ihren Datenschutz ernst und halten uns an die DSGVO.

## 3. Verarbeitete Daten

### 3.1 Sprachsteuerung (Guido Voice Control)
- **Sprachaufnahmen**: Nur während aktiver Nutzung, nicht gespeichert
- **Transkripte**: Text-Umwandlung Ihrer Sprachbefehle
- **Audio-Metadaten**: Aufnahmedauer, Spracherkennungsgenauigkeit
- **Nutzungsstatistiken**: Anonymisierte Leistungsdaten

### 3.2 Model Router
- **API-Anfragen**: Prompts an KI-Modelle (verschlüsselt übertragen)
- **Routing-Entscheidungen**: Welches Modell für welche Aufgabe gewählt wurde
- **Kosten-Tracking**: Ausgaben pro Model und Provider
- **Fehlerprotokolle**: Zur Verbesserung der Software

### 3.3 VSCode Integration
- **Editor-Kontext**: Aktuell geöffnete Dateien und ausgewählter Text
- **Workspace-Informationen**: Projektstruktur für besseres Routing
- **Einstellungen**: Ihre Extension-Konfiguration

## 4. Rechtsgrundlage der Verarbeitung

- **Art. 6 Abs. 1 lit. a DSGVO**: Einwilligung für Sprachverarbeitung
- **Art. 6 Abs. 1 lit. b DSGVO**: Vertragserfüllung (Extension-Funktionalität)
- **Art. 6 Abs. 1 lit. f DSGVO**: Berechtigtes Interesse (Fehleranalyse, Performance)

## 5. Datenspeicherung und -sicherheit

### 5.1 Lokale Speicherung
- **API-Keys**: Sicher in VSCode SecretStorage (System-Keychain)
- **Konfiguration**: Lokal in YAML-Dateien
- **Voice-Statistiken**: Verschlüsselt im Extension-Storage
- **Session-Daten**: Temporär im Arbeitsspeicher

### 5.2 Externe Übertragung
- **KI-Provider**: Prompts werden verschlüsselt an gewählte APIs gesendet
- **Spracherkennung**: Browser-basiert (lokal) oder Cloud-APIs
- **TTS**: System-TTS (lokal) oder Cloud-TTS-Services

### 5.3 Datenschutz-Modi
**Privacy-Strict Modus**: Alle Daten bleiben lokal
```yaml
mode: privacy-strict
voice:
  permissions:
    privacy:
      localProcessingOnly: true
      allowExternal: false
```

**Offline-Modus**: Keine Internetverbindung erforderlich
```yaml
mode: offline  
providers:
  - id: ollama  # Nur lokale Modelle
```

## 6. Aufbewahrungszeiten

| Datentyp | Aufbewahrung | Automatische Löschung |
|----------|--------------|----------------------|
| Sprachaufnahmen | Nicht gespeichert | Sofort nach Verarbeitung |
| Transkripte | 30 Tage | Ja |
| Voice-Statistiken | 90 Tage | Ja |
| API-Keys | Dauerhaft | Nur bei manueller Löschung |
| Fehlerprotokolle | 30 Tage | Ja |
| Session-Daten | Bis Extension-Neustart | Bei VSCode-Neustart |

## 7. Ihre Rechte (DSGVO)

### 7.1 Auskunftsrecht (Art. 15 DSGVO)
```
Command: "Model Router: Voice Permissions" 
→ "Datennutzung anzeigen"
```

### 7.2 Recht auf Berichtigung (Art. 16 DSGVO)
Konfiguration kann jederzeit in `router.config.yaml` angepasst werden.

### 7.3 Recht auf Löschung (Art. 17 DSGVO)
```
Command: "Model Router: Voice Permissions"
→ "Gespeicherte Daten löschen"
```

### 7.4 Recht auf Datenübertragbarkeit (Art. 20 DSGVO)
```
Command: "Model Router: Voice Permissions"
→ "Daten exportieren (DSGVO)"
```

### 7.5 Widerspruchsrecht (Art. 21 DSGVO)
```
Command: "Model Router: Voice Permissions"
→ "DSGVO-Einverständnis verwalten" → "Widerrufen"
```

## 8. Datenweitergabe

### 8.1 An KI-Provider (bei aktivierten Cloud-Modellen)
- **OpenAI**: Prompts für GPT-Modelle
- **DeepSeek**: Prompts für Reasoning-Modelle  
- **Grok (xAI)**: Prompts für Grok-Modelle
- **Microsoft**: Prompts für Phi-Modelle

### 8.2 Keine Weitergabe an Dritte
- Keine Verkauf von Daten
- Keine Analysedienste (außer lokal)
- Keine Werbepartner
- Keine Social Media Integration

## 9. Internationale Datenübertragung

Bei Nutzung Cloud-basierter KI-Provider können Daten in Länder außerhalb der EU übertragen werden:

- **USA**: OpenAI, Microsoft (Privacy Shield Nachfolger)
- **China**: DeepSeek (bei Nutzung erforderlich)
- **Vermeidung**: Nutzen Sie `local-only` oder `offline` Modus

## 10. Technische und organisatorische Maßnahmen

### 10.1 Technische Sicherheit
- **Verschlüsselung**: TLS 1.3 für alle API-Verbindungen
- **Lokale Verschlüsselung**: Gespeicherte Daten verschlüsselt
- **Keychain-Integration**: Sichere API-Key-Speicherung
- **Session-Isolation**: Getrennte Verarbeitung pro Session

### 10.2 Organisatorische Maßnahmen
- **Open Source**: Vollständig transparenter Code
- **Minimale Datensammlung**: Nur funktionsnotwendige Daten
- **Regelmäßige Updates**: Sicherheits-Patches
- **Community-Audit**: Öffentliche Code-Reviews möglich

## 11. Datenschutz-freundliche Konfiguration

### Maximaler Datenschutz
```yaml
profiles:
  privacy-max:
    mode: privacy-strict
    voice:
      enabled: true
      permissions:
        privacy:
          localProcessingOnly: true
          storeRecordings: false
          anonymizeTranscripts: true
          encryptStoredData: true
          gdprCompliant: true
          userConsentRequired: true
      providers:
        - id: ollama  # Nur lokale Modelle
```

### Ausgewogene Konfiguration
```yaml
profiles:
  balanced:
    mode: auto
    voice:
      enabled: true
      permissions:
        privacy:
          storeRecordings: false
          anonymizeTranscripts: true
          dataRetentionDays: 7    # Kürzere Aufbewahrung
```

## 12. Kontakt

**Datenschutzbeauftragte/r**: [Contact Information]  
**Support**: GitHub Issues  
**Aufsichtsbehörde**: Ihre örtliche Datenschutzbehörde

## 13. Änderungen

Diese Datenschutzerklärung kann bei Änderungen der Extension aktualisiert werden. Nutzer werden über VSCode-Benachrichtigungen informiert.

**Version**: 1.0  
**Nächste Überprüfung**: $(date + 1 year)

---

## 🛡️ Ihre Kontrolle

Sie haben **vollständige Kontrolle** über Ihre Daten:

### Sofortige Löschung
```
"Guido" → "Lösche alle meine Daten"
```

### Datenschutz-Modus aktivieren
```
"Guido" → "Datenschutz Modus"
```

### Export anfordern
```
"Guido" → "Exportiere meine Daten"
```

**Bei Fragen zum Datenschutz können Sie uns jederzeit kontaktieren!**
