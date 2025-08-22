# Audio Assets für Guido Voice Control

Diese Audio-Dateien werden von der Voice Control Extension verwendet.

## Beep-Sounds

Verschiedene Bestätigungstöne für verschiedene Aktionen:

### Classic Beep (800Hz, 200ms)
- **Verwendung**: Standard-Aktivierungsbeep
- **Format**: Programmatisch erzeugt via Web Audio API
- **Konfiguration**: `beepSound: "classic"`

### Modern Beep (1000Hz, 150ms) 
- **Verwendung**: Moderne Alternative
- **Format**: Programmatisch erzeugt
- **Konfiguration**: `beepSound: "modern"`

### Sci-Fi Beep (440Hz mit Modulation, 300ms)
- **Verwendung**: Futuristischer Sound-Effekt
- **Format**: Programmatisch mit LFO-Modulation
- **Konfiguration**: `beepSound: "sci-fi"`

### Gentle Beep (600Hz, 250ms)
- **Verwendung**: Sanfter Ton für ruhige Umgebungen
- **Format**: Programmatisch erzeugt
- **Konfiguration**: `beepSound: "gentle"`

## Notification Sounds

### Info Sound
- **Ton**: 800Hz, 150ms
- **Verwendung**: Informative Meldungen

### Success Sound  
- **Ton**: Akkord (1000Hz + 1200Hz), 200ms
- **Verwendung**: Erfolgreiche Aktionen

### Warning Sound
- **Ton**: 600Hz, 2x150ms (wiederholt)
- **Verwendung**: Warnungen

### Error Sound
- **Ton**: 400Hz, 500ms (dissonant)
- **Verwendung**: Fehlermeldungen

## Implementierung

Alle Sounds werden zur Laufzeit über die Web Audio API generiert:

```typescript
// Beispiel für Classic Beep
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

oscillator.frequency.value = 800; // Hz
gainNode.gain.value = 0.3; // Lautstärke
oscillator.type = 'sine';

oscillator.start();
oscillator.stop(audioContext.currentTime + 0.2); // 200ms
```

## Anpassung

Beep-Parameter können in der `router.config.yaml` angepasst werden:

```yaml
voice:
  audio:
    enableBeep: true
    beepSound: "classic"    # classic, modern, sci-fi, gentle, off
    beepVolume: 0.4         # 0.0-1.0
    beepDuration: 200       # Millisekunden
```

## Accessibility

- Alle Sounds können deaktiviert werden (`enableBeep: false`)
- Lautstärke individuell anpassbar
- Alternative visuelle Feedback-Optionen verfügbar
- Respektiert System-Accessibility-Einstellungen

## Performance

- Minimaler Speicherverbrauch (keine Audio-Dateien)
- Sofortige Verfügbarkeit (kein Laden erforderlich)
- Niedrige Latenz durch Web Audio API
- Automatische Browser-Kompatibilität
