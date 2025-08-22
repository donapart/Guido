# Budget & Cost (Deep Dive)

<!-- TOC START -->
<!-- TOC END -->

## Components
- `PriceCalculator` (estimate & actual cost)
- `BudgetManager` (transactions, limits, warnings)

## Config
```yaml
budget:
  dailyUSD: 2.50
  monthlyUSD: 50
  hardStop: true
  warningThreshold: 80
```

## Flow
1. Pre-call estimation
2. Stream completes → usage → actual cost
3. Transaction stored
4. Listener updates status bar

## Warnings
- At `warningThreshold`% daily → notification
- Over limit & `hardStop` → block

## Tips
- Use mini models for tests
- Keep monthly > daily * days (buffer)
