# Design

## Context

`src/catalog/staleness.ts` already computes staleness (`STALE_AFTER_DAYS = 90`, `isCaptureStale(capturedAt, now)`), and `ComparisonTable.tsx` already calls it — but only to attach a `title` attribute ("Older than 90 days") to the `<time>` element in the capture-date cell. The signal is invisible until hover and is not covered by any requirement; the spec delta adds one. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Make staleness visible at a glance in the capture-date cell
- Reuse the existing staleness calculation and threshold without changing its semantics

**Non-Goals:**
- Hiding, excluding, reordering, or dimming stale rows
- Judging staleness per value (TTFT keeps its own provenance display)
- Changing the schema, the catalog data, or the update workflow
- Addressing the future-date and price-provenance gaps identified during exploration

## Decisions

**Badge next to the date, inside the capture-date cell.**
Alternatives considered: coloring only the date text (too easy to miss), dimming the whole row (reads as "disabled", contradicting "marked, not excluded"), a page-level banner (does not tell *which* rows are old). The badge sits next to the evidence (the date), so cause and effect are adjacent.

**Marker must not rely on color alone.**
The badge renders the word "stale" (with styling), satisfying the spec's accessibility scenario. The existing `title` tooltip is kept for the threshold explanation.

**Staleness is computed from `model.capturedAt` only.**
This is the price capture date — the value the table sorts by. `ttft.capturedAt` stays visible in the TTFT provenance hover and is out of scope for the row badge. Rationale: one mark per row keeps the table scannable; mixing dates would mark rows whose sort-relevant data is fresh.

**Threshold stays at `STALE_AFTER_DAYS = 90`.**
A single constant, already in the codebase. No tiers: the mark is informational, and tiers only pay off if rows behaved differently by color, which was explicitly rejected.

**Comparison: `isCaptureStale` called during render, no new state or memoization.**
The date and badge derive from data already present on each row; the table re-renders under existing sort/filter state anyway.

## Risks / Trade-offs

- [Rows near the 90-day boundary flip between visits as `new Date()` advances] → Accepted: staleness is genuinely time-relative; deterministic tests inject a fixed `now` (the existing `isCaptureStale` signature already accepts one).
- [Badge adds visual noise to a dense table] → Mitigated: badge renders only for stale rows; fresh rows are unchanged.
- [Catalog currently has no rows older than 90 days, so the badge is not visible in the shipped data] → Tests cover it with synthetic dates; the UI change is verifiable without waiting for real data to age.
