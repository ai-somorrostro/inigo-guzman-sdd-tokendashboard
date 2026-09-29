import { useEffect } from 'react'
import type { Model } from '../catalog/schema'
import { formatContext, formatPrice, formatTtft } from '../catalog/format'
import { isCaptureStale } from '../catalog/staleness'
import { Unknown } from './Unknown'

type Props = {
  model: Model | null
  onClose: () => void
}

export function ModelDetailModal({ model, onClose }: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!model) return null

  const stale = isCaptureStale(model.capturedAt)
  const inputPrice = model.pricing.inputPerM
  const outputPrice = model.pricing.outputPerM
  const cachedPrice = model.pricing.cachedInputPerM
  const ttftVal = model.ttft.valueMs

  const priceRatio =
    inputPrice !== null && outputPrice !== null && inputPrice > 0
      ? (outputPrice / inputPrice).toFixed(1)
      : null

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-tag">{model.provider}</span>
            <h2 id="modal-title" className="modal-title">
              {model.name}
            </h2>
            <span className="modal-subtitle">
              ID: <code>{model.id}</code> {model.family ? `· Familia: ${model.family}` : ''}
            </span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Sección 1: Precios Extendidos */}
          <div className="modal-section">
            <h3 className="modal-section-title">Estructura de Precios ($ / 1M Tokens)</h3>
            <div className="modal-cards-grid">
              <div className="modal-stat-card">
                <span className="modal-stat-label">Precio Entrada (Input)</span>
                <span className="modal-stat-val text-neon-green">
                  {inputPrice !== null ? formatPrice(inputPrice) : <Unknown />}
                </span>
                <span className="modal-stat-sub">Por millón de tokens de prompt</span>
              </div>

              <div className="modal-stat-card">
                <span className="modal-stat-label">Precio Salida (Output)</span>
                <span className="modal-stat-val text-neon-blue">
                  {outputPrice !== null ? formatPrice(outputPrice) : <Unknown />}
                </span>
                <span className="modal-stat-sub">Por millón de tokens generados</span>
              </div>

              <div className="modal-stat-card">
                <span className="modal-stat-label">Entrada Caché (Cached)</span>
                <span className="modal-stat-val text-neon-purple">
                  {cachedPrice !== null ? formatPrice(cachedPrice) : <Unknown />}
                </span>
                <span className="modal-stat-sub">Lectura de context cache</span>
              </div>

              <div className="modal-stat-card">
                <span className="modal-stat-label">Ratio Salida / Entrada</span>
                <span className="modal-stat-val text-neon-yellow">
                  {priceRatio ? `${priceRatio}x` : '—'}
                </span>
                <span className="modal-stat-sub">Factor multiplicador del output</span>
              </div>
            </div>
          </div>

          {/* Sección 2: Rendimiento y TTFT */}
          <div className="modal-section">
            <h3 className="modal-section-title">Rendimiento y Latencia (TTFT)</h3>
            <div className="modal-cards-grid">
              <div className="modal-stat-card">
                <span className="modal-stat-label">Time To First Token</span>
                <span className="modal-stat-val text-neon-yellow">
                  {ttftVal !== null ? formatTtft(ttftVal) : <Unknown />}
                </span>
                <span className="modal-stat-sub">
                  {model.ttft.percentile ? `Percentil: ${model.ttft.percentile}` : 'Sin datos'}
                </span>
              </div>

              <div className="modal-stat-card">
                <span className="modal-stat-label">Fuente de Medición</span>
                <span className="modal-stat-val-text">
                  {model.ttft.source ? model.ttft.source : '—'}
                </span>
                <span className="modal-stat-sub">
                  {model.ttft.capturedAt ? `Medido el: ${model.ttft.capturedAt}` : 'Sin procedencia'}
                </span>
              </div>

              <div className="modal-stat-card">
                <span className="modal-stat-label">Condiciones de Prueba</span>
                <span className="modal-stat-val-text">
                  {model.ttft.conditions ? model.ttft.conditions : 'Estándar'}
                </span>
                <span className="modal-stat-sub">Parámetros de benchmarking</span>
              </div>

              <div className="modal-stat-card">
                <span className="modal-stat-label">Ventana de Contexto</span>
                <span className="modal-stat-val text-neon-purple">
                  {formatContext(model.contextWindow)}
                </span>
                <span className="modal-stat-sub">Capacidad máxima ({model.contextWindow.toLocaleString()} tokens)</span>
              </div>
            </div>
          </div>

          {/* Sección 3: Modalidades y Frescura */}
          <div className="modal-section">
            <h3 className="modal-section-title">Modalidades y Estado de Catálogo</h3>
            <div className="modal-row-split">
              <div className="modal-info-box">
                <span className="modal-info-label">Modalidades de Entrada:</span>
                <div className="chips-container">
                  {model.modalities.input.map((mod) => (
                    <span key={mod} className="chip chip-input">
                      {mod}
                    </span>
                  ))}
                  {model.modalities.input.length === 0 && <Unknown />}
                </div>
              </div>

              <div className="modal-info-box">
                <span className="modal-info-label">Modalidades de Salida:</span>
                <div className="chips-container">
                  {model.modalities.output.map((mod) => (
                    <span key={mod} className="chip chip-output">
                      {mod}
                    </span>
                  ))}
                  {model.modalities.output.length === 0 && <Unknown />}
                </div>
              </div>

              <div className="modal-info-box">
                <span className="modal-info-label">Última Revisión (Captura):</span>
                <div className="modal-date-wrapper">
                  <span className="modal-date-text">{model.capturedAt}</span>
                  {stale ? (
                    <span className="stale-badge" title="Más de 90 días desde última verificación">
                      stale (&gt;90d)
                    </span>
                  ) : (
                    <span className="fresh-badge">al día</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-modal-close" onClick={onClose}>
            Cerrar Vista de Detalle
          </button>
        </div>
      </div>
    </div>
  )
}
