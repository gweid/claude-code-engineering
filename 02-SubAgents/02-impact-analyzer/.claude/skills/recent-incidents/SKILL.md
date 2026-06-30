---
name: recent-incidents
description: Recent incident records. Use for impact-analyzer to reference historical incidents when analyzing related changes.
---

# Recent Incident Records

- 2024-12: OrderService added a risk control call, increasing the chain latency by 800ms and triggering a 5s SLA alert.
  - Root cause: The risk control service had no timeout configured, reaching 3s+ in extreme cases.
  - Fix: Added a 500ms timeout and fallback strategy.
