# Budget & Kosten (Deep Dive)

<!-- TOC START -->
<!-- TOC END -->

## Komponenten
- `PriceCalculator` (Schätzung & tatsächliche Kosten)
- `BudgetManager` (Transaktionen, Limits, Warnungen)

## Konfiguration
```yaml
budget:
  dailyUSD: 2.50
  monthlyUSD: 50
  hardStop: true
  warningThreshold: 80
```

## Ablauf
1. Vor Ausführung: Schätzung (Model Preis * Tokens)
2. Nach Stream-Ende: Usage → tatsächliche Kosten berechnet
3. Transaktion gespeichert (Datum, Provider, Modell, USD)
4. Listener aktualisiert Statusbar

## Warnungen
- Erreicht: `warningThreshold`% Tagesverbrauch → Notification
- Überschritten & `hardStop` → Block weiterer Calls

## Empfehlungen
- Mini-Modelle für Tests & Boilerplate
- Hohe Limits nur für Teams / Shared Workspaces
- Monatliches Limit > Summe Tage (Puffer)
