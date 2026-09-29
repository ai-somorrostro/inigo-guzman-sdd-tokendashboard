import { useEffect, useMemo, useState } from 'react'
import {
  filterByInputModality,
  filterByName,
  filterByOutputModality,
  sortModels,
  type ModalityFilter,
  type SortableColumn,
} from './catalog/accessors'
import { fetchCatalog } from './catalog/loadCatalog'
import { MODALITIES, type Modality, type Model } from './catalog/schema'
import { ComparisonTable, type SortState } from './components/ComparisonTable'
import { KpiCards } from './components/KpiCards'
import { PriceChart } from './components/PriceChart'
import { TokenConsumptionChart } from './components/TokenConsumptionChart'
import { ModelDetailModal } from './components/ModelDetailModal'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; catalog: Model[] }
  | { status: 'error'; message: string }

type ActiveTab = 'all' | 'charts' | 'table'

export function App() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  // Estados de ordenación y filtrado (Feature 1)
  const [sort, setSort] = useState<SortState>({ column: 'inputPerM', direction: 'asc' })
  const [inputFilter, setInputFilter] = useState<ModalityFilter>('all')
  const [outputFilter, setOutputFilter] = useState<ModalityFilter>('all')
  const [nameFilter, setNameFilter] = useState<string>('')

  // Estado de vista de navegación y selección de modelo (Features 2 y 3)
  const [activeTab, setActiveTab] = useState<ActiveTab>('all')
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchCatalog()
      .then((catalog) => {
        if (!cancelled) setLoad({ status: 'ready', catalog })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoad({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  // Aplicación combinada de ordenación y los 3 filtros
  const visibleModels = useMemo(() => {
    if (load.status !== 'ready') return []
    let result = sortModels(load.catalog, sort.column, sort.direction)
    result = filterByName(result, nameFilter)
    result = filterByInputModality(result, inputFilter)
    result = filterByOutputModality(result, outputFilter)
    return result
  }, [load, sort, nameFilter, inputFilter, outputFilter])

  function handleSortChange(column: SortableColumn) {
    setSort((current) => {
      if (current.column === column) {
        return { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { column, direction: 'asc' }
    })
  }

  function handleResetFilters() {
    setNameFilter('')
    setInputFilter('all')
    setOutputFilter('all')
  }

  const hasActiveFilters =
    nameFilter.trim() !== '' || inputFilter !== 'all' || outputFilter !== 'all'

  return (
    <main className="app-shell">
      {/* Cabecera Cyber */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-badge">SDD · OPENSPEC · OPENCODE</div>
          <h1 className="brand-title">TokenDashboard</h1>
          <p className="brand-subtitle">
            Comparador estático de modelos de IA · Métricas de Precios, TTFT y Consumo de Tokens
          </p>
        </div>
        <div className="header-status">
          <span className="live-indicator">
            <span className="live-dot" />
            WSL2 LOCAL RUNTIME
          </span>
          <span className="user-signature">Iñigo Guzmán · PIA</span>
        </div>
      </header>

      {/* Estado de carga */}
      {load.status === 'loading' && (
        <div role="status" className="load-state">
          <div className="cyber-spinner" />
          <p>Loading catalog…</p>
        </div>
      )}

      {/* Estado de error */}
      {load.status === 'error' && (
        <div role="alert" className="error-state">
          <p className="error-state__message">Could not load the catalog: {load.message}</p>
          <button
            type="button"
            className="retry-btn"
            onClick={() => setAttempt((current) => current + 1)}
          >
            Reintentar Carga
          </button>
        </div>
      )}

      {/* Contenido Principal */}
      {load.status === 'ready' && (
        <>
          {/* Navegación por Pestañas del Dashboard */}
          <nav className="dashboard-nav" aria-label="Vistas del Dashboard">
            <button
              type="button"
              className={`nav-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              ◈ Vista Ejecutiva Completa
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'charts' ? 'active' : ''}`}
              onClick={() => setActiveTab('charts')}
            >
              📊 Gráficas y Consumo
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'table' ? 'active' : ''}`}
              onClick={() => setActiveTab('table')}
            >
              📋 Tabla de Modelos
            </button>
          </nav>

          {/* KPI Cards de resumen (Visibles en all y charts) */}
          {activeTab !== 'table' && (
            <section className="section-kpis" aria-label="Métricas destacadas">
              <KpiCards models={load.catalog} onSelectModel={setSelectedModel} />
            </section>
          )}

          {/* Sección de Gráficas y Visualizaciones (Feature 2) */}
          {activeTab !== 'table' && (
            <section className="section-dashboards" aria-label="Dashboards y visualizaciones">
              <PriceChart models={visibleModels} onSelectModel={setSelectedModel} />
              <TokenConsumptionChart models={visibleModels} onSelectModel={setSelectedModel} />
            </section>
          )}

          {/* Barra de Filtros y Controles (Feature 1) */}
          {activeTab !== 'charts' && (
            <section className="section-controls" aria-label="Filtros de catálogo">
              <div className="controls">
                <span className="controls__prompt" aria-hidden="true">
                  &gt;
                </span>

                {/* Filtro por Nombre */}
                <div className="filter-group">
                  <label htmlFor="model-name-filter" className="filter-label">
                    Buscar modelo
                  </label>
                  <input
                    id="model-name-filter"
                    type="text"
                    className="filter-input-text"
                    placeholder="Filtrar por nombre..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                  />
                </div>

                {/* Filtro por Modalidad de Entrada (label exacto para tests) */}
                <div className="filter-group">
                  <label htmlFor="input-modality-filter" className="filter-label">
                    Filter by input modality
                  </label>
                  <span className="select-shell">
                    <select
                      id="input-modality-filter"
                      value={inputFilter}
                      onChange={(event) => setInputFilter(event.target.value as ModalityFilter)}
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

                {/* Filtro por Modalidad de Salida */}
                <div className="filter-group">
                  <label htmlFor="output-modality-filter" className="filter-label">
                    Filter by output modality
                  </label>
                  <span className="select-shell">
                    <select
                      id="output-modality-filter"
                      value={outputFilter}
                      onChange={(event) => setOutputFilter(event.target.value as ModalityFilter)}
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

                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn-reset-filters"
                    onClick={handleResetFilters}
                    title="Limpiar filtros"
                  >
                    ✕ Limpiar
                  </button>
                )}
              </div>

              {/* Barra de Estado (Status Line) */}
              <div className="status-line">
                <span className="status-line__led" aria-hidden="true" />
                <span className="status-line__cell">
                  filter: <strong>{inputFilter}</strong>
                </span>
                <span className="status-line__cell">
                  sort:{' '}
                  <strong>
                    {sort.column} · {sort.direction}
                  </strong>
                </span>
                <span className="status-line__cell">
                  rows:{' '}
                  <strong>
                    {visibleModels.length}/{load.catalog.length}
                  </strong>
                </span>
              </div>
            </section>
          )}

          {/* Tabla de Comparación o Estado Vacío */}
          {activeTab !== 'charts' && (
            <section className="section-table" aria-label="Tabla comparativa">
              {visibleModels.length === 0 ? (
                <p role="status" className="empty-state">
                  No models match the selected input modality filter.
                </p>
              ) : (
                <ComparisonTable
                  models={visibleModels}
                  sort={sort}
                  onSortChange={handleSortChange}
                  onSelectModel={setSelectedModel}
                  selectedModelId={selectedModel?.id}
                />
              )}
            </section>
          )}

          {/* Modal de Vista de Detalle (Feature 3) */}
          <ModelDetailModal model={selectedModel} onClose={() => setSelectedModel(null)} />
        </>
      )}
    </main>
  )
}
