import { useState } from 'react'
import type { Model } from '../catalog/schema'
import { formatTtft } from '../catalog/format'

type Props = {
  models: Model[]
  onSelectModel?: (model: Model) => void
}

// Mapa de tokens de referencia basado en el mock-data de consumo real de la práctica
const TOKEN_BENCHMARKS: Record<
  string,
  { inDay: number; outDay: number; inWeek: number; outWeek: number }
> = {
  'mistral-small-3-1': { inDay: 1900000, outDay: 620000, inWeek: 13200000, outWeek: 4300000 },
  'gpt-4o-mini': { inDay: 4800000, outDay: 1400000, inWeek: 33600000, outWeek: 9800000 },
  'claude-haiku-4-5': { inDay: 2100000, outDay: 750000, inWeek: 14700000, outWeek: 5250000 },
  'gpt-4.1': { inDay: 3200000, outDay: 910000, inWeek: 22400000, outWeek: 6370000 },
  'gpt-4o': { inDay: 5600000, outDay: 1800000, inWeek: 39200000, outWeek: 12600000 },
  'claude-sonnet-4-5': { inDay: 4200000, outDay: 1100000, inWeek: 29400000, outWeek: 7700000 },
  'gpt-5-6-sol': { inDay: 1500000, outDay: 520000, inWeek: 10500000, outWeek: 3640000 },
  'claude-opus-4-1': { inDay: 980000, outDay: 310000, inWeek: 6860000, outWeek: 2170000 },
  'llama-3.3-70b-instruct': { inDay: 4200000, outDay: 1100000, inWeek: 29000000, outWeek: 7600000 },
  'kimi-k2-6': { inDay: 1700000, outDay: 480000, inWeek: 11900000, outWeek: 3350000 },
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

export function TokenConsumptionChart({ models, onSelectModel }: Props) {
  const [timeframe, setTimeframe] = useState<'day' | 'week'>('day')
  const [metricType, setMetricType] = useState<'tokens' | 'ttft'>('tokens')

  const maxTokens = Math.max(
    ...models.map((m) => {
      const b = TOKEN_BENCHMARKS[m.id] || { inDay: 2000000, inWeek: 14000000 }
      return timeframe === 'day' ? b.inDay : b.inWeek
    }),
    1,
  )

  const maxTtft = Math.max(...models.map((m) => m.ttft.valueMs ?? 0), 1000)

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <div>
          <h3 className="chart-heading">
            {metricType === 'tokens'
              ? `Consumo de Tokens por Modelo (${timeframe === 'day' ? 'Diario' : 'Semanal'})`
              : 'Latencia y Velocidad de Respuesta (TTFT)'}
          </h3>
          <p className="chart-sub">
            {metricType === 'tokens'
              ? 'Volumen de tokens procesados por el equipo para evaluar carga y uso'
              : 'Tiempo transcurrido hasta recibir el primer token (Time To First Token)'}
          </p>
        </div>

        <div className="chart-actions">
          <div className="btn-group">
            <button
              type="button"
              className={`toggle-btn ${metricType === 'tokens' ? 'active' : ''}`}
              onClick={() => setMetricType('tokens')}
            >
              Consumo Tokens
            </button>
            <button
              type="button"
              className={`toggle-btn ${metricType === 'ttft' ? 'active' : ''}`}
              onClick={() => setMetricType('ttft')}
            >
              Latencia TTFT
            </button>
          </div>

          {metricType === 'tokens' && (
            <div className="btn-group">
              <button
                type="button"
                className={`toggle-btn ${timeframe === 'day' ? 'active' : ''}`}
                onClick={() => setTimeframe('day')}
              >
                Diario
              </button>
              <button
                type="button"
                className={`toggle-btn ${timeframe === 'week' ? 'active' : ''}`}
                onClick={() => setTimeframe('week')}
              >
                Semanal
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bars-list">
        {models.map((model) => {
          const bench = TOKEN_BENCHMARKS[model.id] || {
            inDay: 2000000,
            outDay: 600000,
            inWeek: 14000000,
            outWeek: 4200000,
          }
          const inTokens = timeframe === 'day' ? bench.inDay : bench.inWeek
          const outTokens = timeframe === 'day' ? bench.outDay : bench.outWeek
          const tokenPct = Math.min((inTokens / maxTokens) * 100, 100)

          const ttftVal = model.ttft.valueMs
          const ttftPct = ttftVal !== null ? Math.min((ttftVal / maxTtft) * 100, 100) : 0

          return (
            <div
              key={model.id}
              className="bar-row"
              onClick={() => onSelectModel?.(model)}
              style={{ cursor: onSelectModel ? 'pointer' : 'default' }}
            >
              <div className="bar-row-header">
                <span className="bar-row-name">
                  <strong>◈ {model.name}</strong>
                  <span className="bar-row-provider"> · {model.provider}</span>
                </span>
                <span className="bar-row-metric">
                  {metricType === 'tokens' ? (
                    <>
                      <span className="text-neon-green">In: {formatTokens(inTokens)}</span>
                      <span className="bar-row-sep"> | </span>
                      <span className="text-neon-blue">Out: {formatTokens(outTokens)}</span>
                    </>
                  ) : (
                    <span>
                      {ttftVal !== null ? (
                        <>
                          <strong className="text-neon-yellow">{formatTtft(ttftVal)}</strong>
                          <span className="bar-row-sub"> ({model.ttft.percentile || 'p50'})</span>
                        </>
                      ) : (
                        <span className="text-muted">No medido</span>
                      )}
                    </span>
                  )}
                </span>
              </div>

              <div className="bar-track">
                {metricType === 'tokens' ? (
                  <div
                    className="bar-fill-tokens"
                    style={{ width: `${tokenPct}%` }}
                    title={`${model.name}: ${formatTokens(inTokens)} tokens`}
                  />
                ) : (
                  <div
                    className={`bar-fill-ttft ${
                      ttftVal && ttftVal > 1000 ? 'bar-slow' : 'bar-fast'
                    }`}
                    style={{ width: `${ttftPct}%` }}
                    title={`${model.name}: ${ttftVal ? formatTtft(ttftVal) : 'Sin datos'}`}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
