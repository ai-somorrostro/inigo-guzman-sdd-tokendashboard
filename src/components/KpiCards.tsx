import type { Model } from '../catalog/schema'
import { formatPrice, formatTtft, formatContext } from '../catalog/format'

type Props = {
  models: Model[]
  onSelectModel?: (model: Model) => void
}

export function KpiCards({ models, onSelectModel }: Props) {
  // Modelos con precio de input válido
  const modelsWithInputPrice = models.filter((m) => m.pricing.inputPerM !== null)
  const cheapestInput = modelsWithInputPrice.reduce<Model | null>((min, cur) => {
    if (!min) return cur
    return (cur.pricing.inputPerM ?? Infinity) < (min.pricing.inputPerM ?? Infinity) ? cur : min
  }, null)

  // Modelo con menor TTFT (más rápido)
  const modelsWithTtft = models.filter((m) => m.ttft.valueMs !== null)
  const fastestModel = modelsWithTtft.reduce<Model | null>((fast, cur) => {
    if (!fast) return cur
    return (cur.ttft.valueMs ?? Infinity) < (fast.ttft.valueMs ?? Infinity) ? cur : fast
  }, null)

  // Modelo con mayor ventana de contexto
  const largestContext = models.reduce<Model | null>((max, cur) => {
    if (!max) return cur
    return cur.contextWindow > max.contextWindow ? cur : max
  }, null)

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <span className="kpi-label">Modelos Evaluados</span>
        <span className="kpi-value text-neon-green">{models.length}</span>
        <span className="kpi-sub">En catálogo activo</span>
      </div>

      <div
        className={`kpi-card ${cheapestInput && onSelectModel ? 'kpi-clickable' : ''}`}
        onClick={() => cheapestInput && onSelectModel?.(cheapestInput)}
        title={cheapestInput ? `Ver ${cheapestInput.name}` : undefined}
      >
        <span className="kpi-label">Menor Coste Entrada</span>
        <span className="kpi-value text-neon-blue">
          {cheapestInput?.pricing.inputPerM !== undefined && cheapestInput?.pricing.inputPerM !== null
            ? formatPrice(cheapestInput.pricing.inputPerM)
            : '—'}
        </span>
        <span className="kpi-sub">
          {cheapestInput ? `${cheapestInput.name} (${cheapestInput.provider})` : 'Sin datos'}
        </span>
      </div>

      <div
        className={`kpi-card ${fastestModel && onSelectModel ? 'kpi-clickable' : ''}`}
        onClick={() => fastestModel && onSelectModel?.(fastestModel)}
        title={fastestModel ? `Ver ${fastestModel.name}` : undefined}
      >
        <span className="kpi-label">Menor Latencia (TTFT)</span>
        <span className="kpi-value text-neon-yellow">
          {fastestModel?.ttft.valueMs ? formatTtft(fastestModel.ttft.valueMs) : '—'}
        </span>
        <span className="kpi-sub">
          {fastestModel ? `${fastestModel.name} (${fastestModel.ttft.percentile || 'p50'})` : 'Sin datos'}
        </span>
      </div>

      <div
        className={`kpi-card ${largestContext && onSelectModel ? 'kpi-clickable' : ''}`}
        onClick={() => largestContext && onSelectModel?.(largestContext)}
        title={largestContext ? `Ver ${largestContext.name}` : undefined}
      >
        <span className="kpi-label">Mayor Contexto</span>
        <span className="kpi-value text-neon-purple">
          {largestContext ? formatContext(largestContext.contextWindow) : '—'}
        </span>
        <span className="kpi-sub">
          {largestContext ? `${largestContext.name} (${largestContext.provider})` : 'Sin datos'}
        </span>
      </div>
    </div>
  )
}
