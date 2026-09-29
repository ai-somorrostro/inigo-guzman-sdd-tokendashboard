# Proposal

## Why

The comparison table shows each model's capture date, but a row whose price data is months old compares exactly like a row captured yesterday. The only staleness signal today is a hover tooltip, so class members can draw conclusions from numbers that are no longer current without noticing.

## What Changes

- Rows whose `capturedAt` is older than 90 days are visibly marked in the capture-date column with an explicit `stale` badge next to the date.
- The mark is informational only: stale rows are never hidden, excluded, reordered, or dimmed.
- Staleness is judged from the model's `capturedAt` (the price capture date), reusing the existing 90-day threshold.
- The badge does not rely on color alone and keeps the explanatory tooltip.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `model-comparison`: adds a requirement that rows with capture dates older than 90 days are marked as stale in the comparison table, without changing their comparability.

## Impact

- `src/components/ComparisonTable.tsx` — capture-date cell gains the badge; existing `title` tooltip retained.
- `src/catalog/staleness.ts` — reused as-is (`STALE_AFTER_DAYS`, `isCaptureStale`); no semantic change.
- `src/index.css` — styles for the badge.
- No changes to the schema, `models.json`, sorting, filtering, or the catalog update workflow.
