---
name: chain-knowledge
description: Order creation, product search, and payment callback chain knowledge with SLA constraints. Use for impact-analyzer to analyze related change impact.
---

# Chain Knowledge

## Order Creation Chain

```text
Client App
  -> API Gateway (SLA: 5s)
  -> OrderService.createOrder() (SLA: 2s)
  -> InventoryService.reserve() (SLA: 500ms)
  -> PaymentService.preAuth() (SLA: 1s)
  -> NotificationService.push() (async, does not block the main chain)
  -> Return order confirmation
```

## Key SLA Constraints

| Chain | End-to-end SLA | Notes |
|------|-----------|------|
| Order creation | 5s | Show the "Processing" fallback page on timeout |
| Product search | 1s | P99 requirement |
| Payment callback | 30s | Async tolerance |
