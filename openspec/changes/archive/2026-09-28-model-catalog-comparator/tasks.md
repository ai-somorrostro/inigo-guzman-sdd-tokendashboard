# Tasks

## 1. Project Setup

- [x] 1.1 Scaffold the Vite + React + TypeScript app and verify `npm run dev` serves the empty shell and `npm run build` completes without type errors
- [x] 1.2 Add the runtime schema-validation dependency and verify it loads in the app

## 2. Catalog Data and Schema

- [x] 2.1 Define the `Model` type and load-time schema (identity, pricing, `ttft` provenance, context window, input/output media modalities, `capturedAt`) and verify a deliberately invalid fixture fails validation naming the offending model id
- [x] 2.2 Enforce the honesty rules in the schema: prices and `ttft.valueMs` accept `null`, and `source`/`percentile`/`capturedAt` are required whenever `ttft.valueMs` is present — verified by schema tests covering both a bare null TTFT and a value missing its source
- [x] 2.3 Constrain input and output modalities to text/image/audio/video only and verify a capability attribute such as `toolUse` is rejected
- [x] 2.4 Seed `models.json` with a first set of real models including at least one entry with an unknown price or TTFT and verify the app loads and renders it
- [x] 2.5 Document in `README.md` how a classmate adds or edits a model (fields, units, provenance, git workflow) and verify the steps work by adding a model following only that document

## 3. Comparison Table

- [x] 3.1 Render one row per model with columns: model, provider, $/1M in, $/1M out, TTFT, context, input modalities, output modality chips, capture date — verified by a rendering test asserting the header set and one row's values
- [x] 3.2 Render unknown values as an explicit "—" marker with an unknown `aria-label` and never as 0 or an empty cell — verified by a test where `priceIn: null` produces the marker, not "0"
- [x] 3.3 Surface TTFT provenance (source, percentile, capture date) per cell via hover/popover — verified by a test asserting provenance text appears for a sourced TTFT and that a null TTFT shows no provenance
- [x] 3.4 Display each model's capture date in its own column and verify two models with different dates both show theirs

## 4. Sorting and Filtering

- [x] 4.1 Implement sort-by-price (input and output columns, default input price ascending) with `null` prices last — verified by a test asserting both the ascending order and that an unknown-price model lands at the end
- [x] 4.2 Implement the input-modality filter so only models whose input list includes the selection remain — verified by a test selecting image and asserting a text-only model is excluded
- [x] 4.3 Render an explicit empty-result state when a filter matches no models — verified by a test selecting a modality no seeded model has
- [x] 4.4 Verify sorting, filtering, and rendering all read the same normalized accessor by checking a `null` value behaves consistently in a row cell, under sort, and under filter

## 5. Integration Checks

- [x] 5.1 Run the full test suite and production build and verify both pass clean
- [x] 5.2 Manually verify in the browser: sort by input price, filter to image input, and inspect a TTFT provenance popover against the values in `models.json`
