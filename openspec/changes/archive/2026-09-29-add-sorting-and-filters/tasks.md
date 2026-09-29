# Tasks

## 1. Catalog loading with fetch (design D1–D3, D7)

- [x] 1.1 Add `fetchCatalog()` next to the existing sync loader: import `../data/models.json?url`, fetch it, parse with `parseCatalog`, and map request/validation failures to an error result; keep `loadCatalog()` untouched. Verify: `npx tsc --noEmit` exits 0 **with the `?url` import present** (acceptance criterion: tsconfig `"types": ["vite/client"]` types the import) and `loadCatalog()` still exports a synchronous `Model[]`.
- [x] 1.2 Add a global fetch stub to the existing `src/test/setup.ts` that resolves with the contents of `src/data/models.json` (static import, `ok`/`json()`-shaped response) so tests exercise the real `fetchCatalog()` path. Verify: `npm test` runs without "fetch is not defined"/URL-parse failures in jsdom.
- [x] 1.3 Wire a `loading | ready | error` state machine into `src/App.tsx` (loading: `role="status"` text, no table; error: `role="alert"` + reason + Retry button that re-issues the fetch) and adapt the 7 tests that render `<App />` (`App.test.tsx` ×2, `App.sortFilter.test.tsx` ×5) to the async render using `findBy*`/`waitFor`. Verify: `npm test` passes 35/35 — same test cases and assertions, no file deleted (`git diff --stat` on the two test files shows only async adaptation).
- [x] 1.4 Manual, reproducible verification of the three runtime states in `npm run dev`:
  - *Loading*: DevTools → Network → throttling `Slow 3G` → reload → the loading text is visible before any row, then the table replaces it.
  - *Error*: DevTools → Network → right-click the `models.json` request → **Block request URL** → reload → the error state (reason + Retry, no table) is shown.
  - *Retry*: click **Retry** while still blocked → a new request appears in Network and the error state persists; unblock the URL → click **Retry** → the table renders with the default sort.
  Verify: all three observations performed and recorded before leaving dev stopped.

## 2. Sorting by any column (design D4)

- [x] 2.1 Generalize `src/catalog/accessors.ts` to a `SortableColumn` union covering all nine columns with one comparator: unknown/null last in both directions, empty modality list treated as unknown, case-insensitive strings, `YYYY-MM-DD` dates, stable ties (catalog order), keeping `sortModels`' existing signature compatible with `PriceColumn` callers. Verify: `npx tsc --noEmit` passes and `npm test` keeps all 35 tests green.
- [x] 2.2 Make every header in `src/components/ComparisonTable.tsx` an activating control (same labels, `aria-sort` on the active column, `none` elsewhere) and widen `SortState` to `SortableColumn`; `src/App.tsx` keeps the default `inputPerM`/`asc` and the toggle-on-revisit behavior. Verify: `npm test` green, including the pinned `aria-sort` assertions at `src/App.sortFilter.test.tsx:41,47,63`.
- [x] 2.3 Manual verification in `npm run dev`: clicking Model, Context, TTFT and Captured headers reorders ascending then descending; TTFT/price unknowns stay in the last rows in both directions; two models with equal values keep the relative order of `src/data/models.json`. Verify: observations recorded.

## 3. Name and output-modality filters (design D5–D6)

- [x] 3.1 Add `filterByName` and `filterByOutputModality` accessors alongside `filterByInputModality`, combining the three with AND in `src/App.tsx`, reusing the existing input-modality control untouched. Verify: `npx tsc --noEmit` and `npm test` green, including the `Filter by input modality` label assertion.
- [x] 3.2 Add the name text input and output-modality select (labelled, keyboard reachable), extend the status line to show the active filters and `rows: visible/total`, and switch the empty state to the single generalized sentence `No models match the current filters.` (intentional change, design D6), updating the pinned assertion accordingly. Verify: `npm test` green — the empty-state test still asserts `role="status"` and no table, only with the new text.
- [x] 3.3 Manual verification: typing a partial name filters case-insensitively; name + input + output filters combine with AND; a name with no match shows the generalized empty state. Verify: observations recorded.

## 4. Integration verification, OpenSpec archive, and Git flow

- [x] 4.1 Full gate, all green: `npm test` (35/35, coverage preserved), `npx tsc --noEmit` (includes the `?url` import), `npm run build` (confirm `dist/assets/models-*.json` is emitted in `dist/assets/`), `openspec validate add-sorting-and-filters --strict`. Verify: the four commands exit 0.
- [x] 4.2 Non-regression pass in `npm run dev`: stale badge on rows older than 90 days, TTFT provenance hover, unknown markers rendering `—` (never `0`), default input-price ascending order, header label set. Verify: observations recorded.
- [x] 4.3 **Before any commit**: run the archive cycle — `opsx-archive` for `add-sorting-and-filters` (includes `opsx-sync` so the three deltas merge into `openspec/specs/model-comparison/spec.md`). Verify: the change directory has moved to `openspec/changes/archive/`, the main spec contains the renamed/added requirements without delta headers, `openspec validate --all --strict` exits 0, and `openspec status` reports no active changes.
- [x] 4.4 Review what will be committed: `git status` (expected: modified `src/App.tsx`, `src/components/ComparisonTable.tsx`, `src/catalog/accessors.ts`, `src/catalog/loadCatalog.ts`, `src/test/setup.ts`, `src/index.css`, the 2 adapted test files; added `openspec/changes/archive/<date>-add-sorting-and-filters/`; updated `openspec/specs/model-comparison/spec.md`), `git diff` scoped to Feature 1 only, current branch `feature.inigo.guzman/ordenacion-y-filtros`. Verify: no unrelated files staged and the message matches the reference pattern `feat(feature-1): implement column sorting and reactive filters by name and modality`.
- [x] 4.5 Commit on the feature branch, then `git merge --no-ff feature.inigo.guzman/ordenacion-y-filtros` on `inigo.guzman.develop` with message `merge: feature.inigo.guzman/ordenacion-y-filtros into develop`, then push both branches. Verify: `git log --oneline --graph` shows the feature commit with its OpenSpec artifacts inside it and the merge commit on develop; `git status` clean; `git status -sb` shows both branches pushed.
