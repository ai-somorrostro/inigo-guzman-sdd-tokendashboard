import { useState } from 'react'
import { formatContext, formatPrice, formatTtft } from '../catalog/format'
import {
  priceOf,
  ttftOf,
  type PriceColumn,
  type SortableColumn,
  type SortDirection,
} from '../catalog/accessors'
import type { Model } from '../catalog/schema'
import { isCaptureStale } from '../catalog/staleness'
import { Unknown } from './Unknown'

export type SortState = { column: SortableColumn; direction: SortDirection }

type Props = {
  models: Model[]
  sort?: SortState
  onSortChange?: (column: SortableColumn) => void
  onSelectModel?: (model: Model) => void
  selectedModelId?: string | null
}

const HEADERS_CONFIG: { column: SortableColumn; label: string; isNum?: boolean }[] = [
  { column: 'name', label: 'Model' },
  { column: 'provider', label: 'Provider' },
  { column: 'inputPerM', label: '$ / 1M in', isNum: true },
  { column: 'outputPerM', label: '$ / 1M out', isNum: true },
  { column: 'ttft', label: 'TTFT' },
  { column: 'contextWindow', label: 'Context', isNum: true },
  { column: 'inputModalities', label: 'Input modalities' },
  { column: 'outputModalities', label: 'Output modalities' },
  { column: 'capturedAt', label: 'Captured' },
]

function PriceCell({ model, column }: { model: Model; column: PriceColumn }) {
  const price = priceOf(model, column)
  return <td className="num">{price === null ? <Unknown /> : formatPrice(price)}</td>
}

function TtftCell({ model }: { model: Model }) {
  const [open, setOpen] = useState(false)
  const value = ttftOf(model)
  if (value === null) {
    return (
      <td>
        <Unknown />
      </td>
    )
  }
  const provenance = [
    model.ttft.source,
    model.ttft.percentile,
    model.ttft.capturedAt,
    model.ttft.conditions,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' · ')
  return (
    <td
      className="ttft-cell"
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span className="ttft-value">{formatTtft(value)}</span>
      <span
        className={open ? 'ttft-provenance visible' : 'ttft-provenance'}
        role={open ? 'tooltip' : undefined}
      >
        {provenance}
      </span>
    </td>
  )
}

function ModalityCell({ modalities }: { modalities: string[] }) {
  if (modalities.length === 0)
    return (
      <td>
        <Unknown />
      </td>
    )
  return (
    <td>
      {modalities.map((modality, index) => (
        <span key={modality}>
          {index > 0 && ', '}
          <span className="chip">{modality}</span>
        </span>
      ))}
    </td>
  )
}

function SortableHeader({
  column,
  label,
  isNum,
  sort,
  onSortChange,
}: {
  column: SortableColumn
  label: string
  isNum?: boolean
  sort?: SortState
  onSortChange?: (column: SortableColumn) => void
}) {
  const isActive = sort?.column === column
  const sortDirection = isActive
    ? sort.direction === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none'

  if (!onSortChange) {
    return (
      <th scope="col" className={isNum ? 'num' : undefined}>
        {label}
      </th>
    )
  }

  return (
    <th
      scope="col"
      className={isNum ? 'num' : undefined}
      aria-sort={sortDirection}
    >
      <button
        type="button"
        onClick={() => onSortChange(column)}
        className="th-sort-btn"
        title={`Sort by ${label}`}
      >
        <span>{label}</span>
        <span className="sort-arrow" aria-hidden="true">
          {isActive ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : ''}
        </span>
      </button>
    </th>
  )
}

export function ComparisonTable({
  models,
  sort,
  onSortChange,
  onSelectModel,
  selectedModelId,
}: Props) {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            {HEADERS_CONFIG.map(({ column, label, isNum }) => (
              <SortableHeader
                key={column}
                column={column}
                label={label}
                isNum={isNum}
                sort={sort}
                onSortChange={onSortChange}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {models.map((model) => {
            const stale = isCaptureStale(model.capturedAt)
            const isSelected = selectedModelId === model.id
            return (
              <tr
                key={model.id}
                className={[
                  stale ? 'row-stale' : '',
                  isSelected ? 'row-selected' : '',
                  onSelectModel ? 'row-clickable' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectModel?.(model)}
                tabIndex={onSelectModel ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onSelectModel && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onSelectModel(model)
                  }
                }}
              >
                <td className="cell-model">{model.name}</td>
                <td className="cell-provider">{model.provider}</td>
                <PriceCell model={model} column="inputPerM" />
                <PriceCell model={model} column="outputPerM" />
                <TtftCell model={model} />
                <td className="num">{formatContext(model.contextWindow)}</td>
                <ModalityCell modalities={model.modalities.input} />
                <ModalityCell modalities={model.modalities.output} />
                <td className="cell-captured">
                  <time
                    dateTime={model.capturedAt}
                    title={stale ? 'Older than 90 days' : undefined}
                  >
                    {model.capturedAt}
                  </time>
                  {stale && (
                    <span className="stale-badge" title="Older than 90 days">
                      stale
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
