# Proposal

## Why

We need one shared place for me and my classmates to compare available AI models on price, TTFT, and modalities. Today that comparison lives in scattered pricing pages and benchmark posts with no common units, no stated provenance, and no way to sort or filter — so every discussion starts from zero.

## What Changes

- Introduce a versioned, hand-maintained model catalog (`models.json`) holding price, TTFT, context window, and media modalities per model.
- Introduce a comparison table that sorts by price and filters by input modality, with a capture date visible per model so stale data is obvious.
- Treat TTFT as curated, sourced benchmark data rather than a live measurement: every value carries source, percentile, conditions, and capture date, and may be empty.
- Treat missing prices as unknown (`null`), never as zero.
- Ship as a static Vite + React + TypeScript app with no backend, no authentication, and no third-party API keys.

## Capabilities

### New Capabilities

- `model-comparison`: Comparing AI models in a sortable, filterable catalog table, including the data shape of the catalog (price, TTFT, modalities, context, capture date) and the honesty rules for sourced and missing values.

### Modified Capabilities

<!-- none: this project has no existing specs -->

## Impact

- **Code**: new Vite + React + TypeScript app; new `models.json` data module.
- **Dependencies**: React, Vite, TypeScript only — no backend, no database, no API integrations.
- **Data maintenance**: catalog edited by hand via git by class members.
- **Out of scope (non-goals)**: real spend/usage tracking, live TTFT probing, third-party API keys, capability attributes such as tool use, reasoning, and structured output (deferred to a later iteration).
