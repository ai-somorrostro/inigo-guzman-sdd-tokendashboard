# Tasks

## 1. Stale marker in the capture-date cell

- [x] 1.1 Render an explicit `stale` badge next to the date in the capture-date cell when `isCaptureStale(model.capturedAt)` is true, and verify with a `ComparisonTable` test that a date older than 90 days shows the badge while a recent date does not
- [x] 1.2 Keep the threshold explanation available on the badge/date (existing `title` tooltip) and verify the explanation is present in the stale case and absent in the fresh case
- [x] 1.3 Verify the badge does not rely on color alone: it renders readable text, and a test asserts the marker text rather than only a style/class
- [x] 1.4 Add badge styles in `src/index.css` and verify `npm run build` (tsc + vite) succeeds with the styles applied

## 2. Stale rows remain fully comparable

- [x] 2.1 Verify with a test that a stale row stays visible, keeps its position under the active price sort, and is not filtered out (marking changes nothing except the capture-date cell)
- [x] 2.2 Run the full suite with `npm test` and verify all existing tests still pass, including sorting/filtering and staleness unit tests

## 3. Integration checks

- [x] 3.1 Run `npm run build` and `npm test` on the final state and verify both exit cleanly
