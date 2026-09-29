# Design

## Context

The comparison view today reads `src/data/models.json` with a static ES import (`loadCatalog()`, synchronous) at `App` module scope, sorts only via the two price columns (`PriceColumn`), and filters only by input modality. The existing suite (35 tests across 4 files) pins observable behaviors: default input-price ascending with unknowns last, `aria-sort` values, the header label set, and the `Filter by input modality` control label. Feature 1 (reference README §4) and the `fetch` requirement (§2) are the motivation; see proposal.md. Verified in this environment before writing this design: `import catalogUrl from '../data/models.json?url'` resolves in vitest, `npx tsc --noEmit` accepts it (tsconfig already sets `"types": ["vite/client"]`), and `vite build` emits `dist/assets/models-*.json` (4.68 kB), so a runtime `fetch` of the same file works in dev, test, and production builds.

## Goals / Non-Goals

**Goals:**
- One implementation of sorting that covers all nine displayed columns with a single, documented null and tie-breaking rule.
- Three combinable filters with AND semantics, reusing the existing input-modality control unchanged, and a single generalized empty-state sentence.
- A runtime `fetch` of the catalog with explicit loading and error states, without moving or renaming the data file.
- Zero **new** test files and zero new dependencies; the existing 35 test cases keep their coverage and assertion strength (adaptation to async loading is allowed, deletion or weakening is not); `npm test` + `npx tsc --noEmit` + `npm run build` green.

**Non-Goals:**
- No new test files or new test cases (assignment constraint: "sin tests"); loading/error states are covered by reproducible manual verification instead of automated tests.
- No changes to `models.json`, the Zod schema, honesty rules, stale marking, or TTFT provenance behavior.
- No pagination, virtualization, column visibility, or multi-column sort.

## Decisions

### D1. Data file stays at `src/data/models.json`; runtime fetch uses Vite's `?url` asset URL

`import catalogUrl from '../data/models.json?url'` + `fetch(catalogUrl)`. Alternatives considered:

- **`public/models.json` (rejected)**: moving the file breaks the README contract ("Abre `src/data/models.json`"), forces a rewrite of `loadCatalog`'s import (used as a fixture by 3 of the 4 test files), breaks the git history/`spec` guarantee that the catalog is the same versioned file, and invites the public/src duplication anti-pattern. Highest impact of the three.
- **Bundled import only (rejected)**: does not satisfy reference README §2 ("cargados vía `fetch`").
- **`?url` (chosen)**: single source file, no config changes, README and `model-comparison` spec untouched, typechecks (`vite/client`), works in vitest and in `vite build` (verified by probe; build output re-verified during apply).

### D2. Zod schema and sync loader are untouched; `fetchCatalog()` is added next to `loadCatalog()`

`parseCatalog` validates whatever JSON arrives, so the schema has zero impact. `loadCatalog()` (static import, synchronous) remains the fixture loader for `schema.test`, `ComparisonTable.test`, `App.test`, and `App.sortFilter.test` — those imports keep compiling and running unchanged. `fetchCatalog()` is the runtime path.

### D3. Tests adapt to async loading; a global fetch stub in the test setup serves `models.json`

**Decision (revised after review — the previous `MODE === 'test'` environment branch is rejected as production debt: a code path that exists only for tests leaves the real fetch path untested).**

jsdom cannot serve files, so the tests need two mechanical adaptations, both allowed under "sin tests nuevos":

1. **Fetch stub in `src/test/setup.ts`** (existing file, no new test file): a global `fetch` that resolves with the contents of `src/data/models.json` (static import in the setup file), returning an `ok`/`json()`-shaped response. This exercises the *real* `fetchCatalog()` code path end-to-end in tests instead of bypassing it.
2. **Await the async render** in the 7 tests that render `<App />` (`App.test.tsx`: 2, `App.sortFilter.test.tsx`: 5): synchronous `getBy*` becomes `await screen.findBy*` (or `waitFor`) after `render`. No test case is deleted, merged, or loosened: the same models, orderings, and `aria-sort` assertions are kept; fixtures still come from the sync `loadCatalog()`.

Alternatives considered:
- **Environment branch in app code (rejected)**: keeps tests untouched but ships a test-only path in the bundle's source and hides the async path from the suite — technical debt, and the fetch would never be exercised by tests at all.
- **Fetch in `main.tsx` + optional prop on `App` (rejected)**: keeps tests green but leaves a dead "default catalog" path in production code and duplicates the catalog in the bundle.

Trade-off accepted: the stub replaces the network layer, so the asset-URL resolution of `?url` (dev server / emitted asset) is exercised only by the manual verification in task 1.4 and by the `npm run build` check, not by vitest.

### D4. Null placement: unknown always last, both directions, every column

Generalizes the existing price rule (`compareByPrice` returns `1` for null regardless of direction) so behavior is uniform: known values ordered per direction, then unknowns. Modalities lists compare by joined string; an empty list counts as unknown. Dates compare as `YYYY-MM-DD` strings (lexicographic = chronological). Names/providers compare case-insensitively. Ties keep catalog-file order — `Array.prototype.sort` is stable since ES2019, so no manual index tiebreaker is needed (covered by a spec scenario rather than assumed silently).

### D5. Filter composition

Name filter: trimmed, case-insensitive substring over `model.name`. Modality selects keep `MODALITIES` options plus `all`. Composition is AND over the three predicates (`visible = name ∧ input ∧ output`), preserving `filterByInputModality` and adding `filterByName`/`filterByOutputModality` accessors in the same style.

### D6. Empty state: one generalized sentence (intentional change)

The empty state renders a single generalized sentence — `No models match the current filters.` — with `role="status"` and no table, regardless of which filter emptied the result. **This intentionally replaces** the previous input-modality-specific sentence, which becomes false once name and output filters exist; the existing assertion at `src/App.sortFilter.test.tsx:93` is updated to the new text as part of the test adaptation authorized in D3 (coverage unchanged: the test still asserts an explicit `role="status"` empty result and `queryByRole('table') === null`). Rejected alternative: keeping the old sentence when the input filter is active — two variants for one state, with copy that still misattributes the cause when several filters are combined.

### D7. Loading and error states

`loading`: text message in a `role="status"` region, controls/table not rendered (no stale "0 rows" illusion). `error`: `role="alert"` with the failure reason plus a Retry button that re-issues the fetch. While loading, no other `role="status"` exists, so the empty-state assertion (`getByRole('status')`) stays unambiguous.

## Risks / Trade-offs

- [Loading/error paths are not covered by automated tests (no new test cases allowed)] → Reproducible manual verification steps (DevTools request blocking + throttling, Retry recovery) are spelled out in tasks 1.4 and re-run at 4.1; the fetch code itself *is* executed by tests through the setup stub (D3).
- [Fetch stub replaces the network layer in tests, so `?url` asset resolution is not exercised by vitest] → Covered by `npm run build` asserting `dist/assets/models-*.json` is emitted (task 4.1) and by the manual dev verification (task 1.4).
- [In `npm run dev`, Vite's SPA fallback answers **200 + `text/html`** for a missing source file instead of 404] → `response.ok` stays true, so the catalog failure surfaces through `response.json()` throwing a parse error, not through the status check; the app still lands in the documented error state (payload that does not validate ⇒ error + Retry), and this was observed while exercising task 1.4 with a deliberately broken URL. Production builds serve the emitted asset, where a missing file is a real 404.
- [Existing sort/filter tests pin exact `aria-sort` values and header labels] → All header labels and `aria-sort` semantics are preserved; only previously static `<th>` elements become `<button>`-bearing headers (labels unchanged, so `textContent` assertions still pass).
- [`?url` behavior depends on Vite's asset pipeline] → Already probed in vitest, `tsc --noEmit`, and `vite build` in this repo; re-verified as apply tasks after the code lands.
- [Risk pending confirmation with the professor (from plan decision 3): interpreting "sin librerías externas / JS puro" as "no new dependencies on top of the given React+Vite base"] → No dependency is added by this change either way; if the professor requires a framework-free rewrite, the whole baseline changes and this change must be re-proposed.
- [Known limitation transferred to the next change (Feature 2): consumption data covers only 2 of 10 models (real values from the reference `mock-data.json` for Mistral Small 3.1 and Llama 3.3 70B Instruct; `null` = unknown elsewhere; no invented values)] → To be recorded in the F2 change's design.md and raised with the professor before F2 is approved; out of scope for F1.

## Migration Plan

Single-branch feature; no deployment step beyond `npm run build`. Rollback = do not merge the feature branch into `inigo.guzman.develop`.

## Open Questions

None. (The empty-state copy question raised in the first draft was resolved by the review: one generalized sentence, D6.)
