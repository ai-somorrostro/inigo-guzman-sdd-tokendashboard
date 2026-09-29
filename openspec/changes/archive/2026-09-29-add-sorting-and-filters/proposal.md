# Proposal

## Why

The dashboard assignment (reference README §4, Feature 1) requires the comparison table to be sortable by **any** column and filterable by **model name and both input and output modalities**, and §2 requires the catalog to be **loaded with `fetch`** instead of a bundled import. Today the table only sorts by the two price columns, only filters by input modality, and reads `models.json` synchronously at module scope, so it cannot show loading or error states.

## What Changes

- **Sorting**: every table column header becomes a clickable sort control (toggle ascending/descending), replacing the current price-only sorting. Unknown/null values are placed last in both directions on every sortable column; rows with equal keys keep their catalog order (stable sort). The default remains input price ascending.
- **Filtering**: adds a case-insensitive substring filter on model name and a select for output modality alongside the existing input-modality select. The three filters combine with AND semantics; the existing input-modality label and `id` stay unchanged, and the empty state uses one generalized sentence instead of the previous input-modality-specific one.
- **Catalog loading**: the runtime path loads `src/data/models.json` with `fetch` (served through Vite's asset URL) and exposes explicit loading and error states; the file location, name, and Zod schema stay as they are, and the synchronous loader remains the fixture source for tests.
- **No regressions**: stale badge, TTFT provenance hover, honesty rules (`null` = unknown, never `0`), default sort, header labels, and the `role="status"` empty-state behavior are preserved.
- **No new dependencies and no new test files**; the existing 35 test cases keep their coverage and assertion strength, adapted only where the async load and the generalized empty-state sentence require it (global fetch stub in the existing test setup + `findBy`/`await` at the 7 `render(<App />)` sites).

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `model-comparison`:
  - *Comparison table supports sorting by price* → generalized to sorting by **any** column and renamed to *Comparison table supports sorting by any column* (null placement rule, stable ordering, toggle semantics, default preserved).
  - *Comparison table supports filtering by input modality* → extended to **name + input modality + output modality** filters combined with AND and renamed to *Comparison table supports filtering by name and modalities*, preserving the existing input-modality behavior and empty-result behavior.
  - *Catalog is maintained through the repository* → extended with the runtime contract: the catalog file is fetched asynchronously on load, with visible loading and error states, while the file stays versioned in the repository.

## Impact

- **Code**: `src/App.tsx` (load state machine, new filter controls, generalized sort state), `src/components/ComparisonTable.tsx` (all headers sortable, `SortState` widened), `src/catalog/accessors.ts` (generic comparators), `src/catalog/loadCatalog.ts` (adds `fetchCatalog()` next to the existing sync loader), `src/index.css` (controls/status styles).
- **Data**: `src/data/models.json` unchanged, still at the same path (README contract).
- **Tests**: no new test files; the 2 files that render `<App />` are adapted to the async load and `src/test/setup.ts` gains a fetch stub, without deleting or weakening any of the 35 cases (the empty-state assertion adopts the generalized sentence).
- **Dependencies**: none added (native DOM/SVG-free, plain TS/React already in the stack).
- **Specs**: `openspec/specs/model-comparison/spec.md` receives the three requirement deltas above.
