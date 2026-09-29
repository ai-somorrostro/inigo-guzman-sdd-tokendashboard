import { useState } from 'react'
import type { Model } from '../catalog/schema'
import { formatPrice } from '../catalog/format'

type Props = {
  models: Model[]
  onSelectModel?: (model: Model) => void
}

export function PriceChart({ models, onSelectModel }: Props) {
  const [hovered, setHovered] = useState<{
    model: Model
    type: 'in' | 'out'
    x: number
    y: number
  } | null>(null)

  // Filtramos modelos que tengan al menos un precio para el gráfico
  const chartModels = models.filter(
    (m) => m.pricing.inputPerM !== null || m.pricing.outputPerM !== null,
  )

  if (chartModels.length === 0) {
    return (
      <div className="chart-panel">
        <h3 className="chart-heading">Comparativa de Precios por 1M de Tokens</h3>
        <p className="chart-empty">No hay modelos con datos de precio disponibles para graficar.</p>
      </div>
    )
  }

  // Dimensiones del SVG
  const width = 960
  const height = 320
  const margin = { top: 30, right: 30, bottom: 85, left: 60 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  // Máximo precio para escalar el eje Y
  const maxPrice = Math.max(
    ...chartModels.map((m) => Math.max(m.pricing.inputPerM ?? 0, m.pricing.outputPerM ?? 0)),
    1,
  )

  const groupWidth = innerWidth / chartModels.length
  const barWidth = Math.max(Math.min(groupWidth * 0.38, 28), 6)
  const gap = 4

  // Líneas horizontales de referencia (5 niveles)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: maxPrice * pct,
    y: innerHeight - innerHeight * pct,
  }))

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <div>
          <h3 className="chart-heading">Comparativa de Precios ($ / 1M Tokens)</h3>
          <p className="chart-sub">Comparación directa entre coste de Entrada (Prompt) y Salida (Completion)</p>
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-swatch swatch-input" />
            <span>Entrada (Input)</span>
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-output" />
            <span>Salida (Output)</span>
          </span>
        </div>
      </div>

      <div className="svg-container">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="chart-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid horizontal */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={0}
                  y1={tick.y}
                  x2={innerWidth}
                  y2={tick.y}
                  className="chart-grid-line"
                />
                <text
                  x={-10}
                  y={tick.y + 4}
                  className="chart-axis-text"
                  textAnchor="end"
                >
                  ${tick.val.toFixed(tick.val >= 10 ? 0 : 1)}
                </text>
              </g>
            ))}

            {/* Barras de cada modelo */}
            {chartModels.map((model, idx) => {
              const groupX = idx * groupWidth
              const centerX = groupX + groupWidth / 2

              const inputVal = model.pricing.inputPerM
              const outputVal = model.pricing.outputPerM

              const inHeight = inputVal !== null ? (inputVal / maxPrice) * innerHeight : 0
              const outHeight = outputVal !== null ? (outputVal / maxPrice) * innerHeight : 0

              const inY = innerHeight - inHeight
              const outY = innerHeight - outHeight

              const inX = centerX - barWidth - gap / 2
              const outX = centerX + gap / 2

              return (
                <g
                  key={model.id}
                  className="model-bar-group"
                  onClick={() => onSelectModel?.(model)}
                  style={{ cursor: onSelectModel ? 'pointer' : 'default' }}
                >
                  {/* Barra Input */}
                  {inputVal !== null ? (
                    <rect
                      x={inX}
                      y={inY}
                      width={barWidth}
                      height={inHeight}
                      rx={3}
                      className="bar-input"
                      onMouseEnter={() =>
                        setHovered({ model, type: 'in', x: inX + barWidth / 2, y: inY })
                      }
                      onMouseLeave={() => setHovered(null)}
                    />
                  ) : (
                    <text
                      x={inX + barWidth / 2}
                      y={innerHeight - 8}
                      textAnchor="middle"
                      className="bar-null-label"
                    >
                      —
                    </text>
                  )}

                  {/* Barra Output */}
                  {outputVal !== null ? (
                    <rect
                      x={outX}
                      y={outY}
                      width={barWidth}
                      height={outHeight}
                      rx={3}
                      className="bar-output"
                      onMouseEnter={() =>
                        setHovered({ model, type: 'out', x: outX + barWidth / 2, y: outY })
                      }
                      onMouseLeave={() => setHovered(null)}
                    />
                  ) : (
                    <text
                      x={outX + barWidth / 2}
                      y={innerHeight - 8}
                      textAnchor="middle"
                      className="bar-null-label"
                    >
                      —
                    </text>
                  )}

                  {/* Etiqueta de nombre en eje X (rotada) */}
                  <text
                    x={centerX}
                    y={innerHeight + 16}
                    textAnchor="end"
                    transform={`rotate(-40, ${centerX}, ${innerHeight + 16})`}
                    className="chart-x-label"
                  >
                    {`› ${model.name.length > 12 ? model.name.slice(0, 10) + '…' : model.name}`}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* Tooltip interactivo flotante */}
        {hovered && (
          <div
            className="chart-tooltip"
            style={{
              left: `${margin.left + (hovered.x / width) * 100}%`,
              top: `${Math.max(margin.top + hovered.y - 12, 10)}px`,
            }}
          >
            <strong>{hovered.model.name}</strong>
            <div className="tooltip-row">
              <span>{hovered.type === 'in' ? 'Precio Entrada:' : 'Precio Salida:'}</span>
              <span className="tooltip-value">
                {hovered.type === 'in'
                  ? formatPrice(hovered.model.pricing.inputPerM!)
                  : formatPrice(hovered.model.pricing.outputPerM!)}
              </span>
            </div>
            <div className="tooltip-sub">{hovered.model.provider} · Haz clic para detalle</div>
          </div>
        )}
      </div>
    </div>
  )
}
