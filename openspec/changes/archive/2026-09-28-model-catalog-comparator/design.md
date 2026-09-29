# Design

## Context

Static, key-free comparison tool for class use (see proposal.md — Why). The catalog is hand-edited through git; there is no backend, no auth, and no live measurement. The specs define behavior; this document settles how the behavior is built.

## Goals / Non-Goals

**Goals:**
- One data source of truth for every displayed value, so table cells and tooltips can never disagree
- Make unknown values and stale data structurally visible rather than a rendering afterthought
- Keep the catalog editable by a classmate who only knows git and JSON

**Non-Goals:**
- Live TTFT probing, spend tracking, authentication (excluded from scope in the proposal)
- Pixel-level visual design
- Support for capability attributes (tool use, reasoning, structured output)

## Decisions

### D1: Static JSON catalog with a schema guard, not a database
`models.json` + a TypeScript type (and a lightweight runtime validation pass at load, e.g. a zod schema or equivalent hand-rolled check) so a malformed entry fails loudly at load with a named path, not as a blank cell at render time.
- *Alternatives considered*: CSV (rejected — no nesting for TTFT provenance or modality lists); markdown tables (rejected — unparseable units and free text defeat sorting); a headless CMS (rejected — overkill for a class git workflow).

### D2: `null` means unknown, everywhere in the chain
Absent price/TTFT/modality renders as a dedicated "—" marker with an `aria-label="unknown"`, never `0`, never `""`. Sorting and filtering treat `null` as lowest-priority: `null` sorts **last** under ascending price, and an unknown modality fails a modality filter. Rendering, sorting, and filtering all read the same normalized accessor so the three can't drift.
- *Why*: a zero that means "unknown" silently ranks a priceless model as the cheapest.

### D3: TTFT provenance is a structured object, not a comment
```jsonc
"ttft": { "valueMs": 420, "percentile": "p50",
          "source": "artificialanalysis.ai", "capturedAt": "2026-09-20",
          "conditions": "short prompt, streaming, us-east" }
```
Rendered as the value in the cell with source/percentile/date surfaced on hover or in a details popover. `conditions` is optional; `source`, `percentile`, and `capturedAt` are required whenever `valueMs` is present (enforced by D1's schema).
- *Why*: two numbers from different percentiles displayed bare are a false comparison.

### D4: Capture date is per-model, derived once
One `capturedAt` per model covering both price and TTFT (the catalog is edited in a single pass), displayed as its own column and used for a staleness hint past a threshold. Per-field dates were rejected: they imply independent update cadences nobody will maintain.

### D5: Price columns carry units in the header
`$ / 1M in`, `$ / 1M out` — units live in the header, values stay raw numbers so sorting is numeric, not lexicographic. Currency is fixed to USD in this iteration (non-goal: multi-currency).

### D6: Single-page client-side sorting/filtering
The full catalog fits in one request; sort and filter run in memory on the loaded array. No URL state, no virtualization, no server in this iteration.

## Risks / Trade-offs

- **Data goes stale silently** → capture date column + staleness highlight; the git history makes "who last touched this" inspectable.
- **Percentiles/sources incomparable across rows** → provenance shown per cell (D3) rather than a single blended TTFT column claim.
- **Hand-edited JSON breaks the build** → schema validation at load (D1) fails with the offending model id.
- **Catalog outgrows one screen** → accepted; revisit only if the model count makes the table unusable (deferred, not designed now).

## Open Questions

- Should the default sort be input price or output price? Defaults to input price; trivial to flip once classmates use it.
- Staleness threshold (e.g. 90 days) — pick a number during implementation; does not affect the specs.
