import { useMemo, useState } from 'react'
import {
  filterByInputModality,
  sortModels,
  type ModalityFilter,
  type PriceColumn,
} from './catalog/accessors'
import { loadCatalog } from './catalog/loadCatalog'
import { MODALITIES, type Modality } from './catalog/schema'
import { ComparisonTable, type SortState } from './components/ComparisonTable'

const catalog = loadCatalog()

export function App() {
  const [sort, setSort] = useState<SortState>({ column: 'inputPerM', direction: 'asc' })
  const [filter, setFilter] = useState<ModalityFilter>('all')

  const visibleModels = useMemo(
    () => filterByInputModality(sortModels(catalog, sort.column, sort.direction), filter),
    [sort, filter],
  )

  function handleSortChange(column: PriceColumn) {
    setSort((current): SortState =>
      current.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    )
  }

  return (
    <main className="app">
      <header className="app-header">
        <span className="app-header__prompt" aria-hidden="true">
          root@catalog:~$ ./compare --sort price --format table
        </span>
        <h1>
          Model Catalog Comparator
          <span className="cursor" aria-hidden="true">
            ▮
          </span>
        </h1>
        <span className="app-header__meta" aria-hidden="true">
          static catalog · price · ttft · modalities
        </span>
      </header>
      <div className="controls">
        <span className="controls__prompt" aria-hidden="true">
          &gt;
        </span>
        <label htmlFor="input-modality-filter">Filter by input modality</label>
        <span className="select-shell">
          <select
            id="input-modality-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as ModalityFilter)}
          >
            <option value="all">All</option>
            {MODALITIES.map((modality: Modality) => (
              <option key={modality} value={modality}>
                {modality}
              </option>
            ))}
          </select>
          <span className="select-shell__caret" aria-hidden="true">
            ▼
          </span>
        </span>
      </div>
      <div className="status-line">
        <span className="status-line__led" aria-hidden="true" />
        <span className="status-line__cell">
          filter: <strong>{filter}</strong>
        </span>
        <span className="status-line__cell">
          sort: <strong>{sort.column} · {sort.direction}</strong>
        </span>
        <span className="status-line__cell">
          rows: <strong>{visibleModels.length}/{catalog.length}</strong>
        </span>
      </div>
      {visibleModels.length === 0 ? (
        <p role="status" className="empty-state">
          No models match the selected input modality filter.
        </p>
      ) : (
        <ComparisonTable models={visibleModels} sort={sort} onSortChange={handleSortChange} />
      )}
    </main>
  )
}
