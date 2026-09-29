import { useState } from 'react'
import { formatContext, formatPrice, formatTtft } from '../catalog/format'
import {
  priceOf,
  ttftOf,
  type PriceColumn,
  type SortDirection,
} from '../catalog/accessors'
import type { Model } from '../catalog/schema'
import { isCaptureStale } from '../catalog/staleness'
import { Unknown } from './Unknown'

export type SortState = { column: PriceColumn; direction: SortDirection }

type Props = {
  models: Model[]
  sort?: SortState
  onSortChange?: (column: PriceColumn) => void
}

const PRICE_HEADERS: { column: PriceColumn; label: string }[] = [
  { column: 'inputPerM', label: '$ / 1M in' },
  { column: 'outputPerM', label: '$ / 1M out' },
]

const OTHER_HEADERS = [
  'Model',
  'Provider',
  'TTFT',
  'Context',
  'Input modalities',
  'Output modalities',
  'Captured',
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
      <span className={open ? 'ttft-provenance visible' : 'ttft-provenance'} role={open ? 'tooltip' : undefined}>
        {provenance}
      </span>
    </td>
  )
}

function ModalityCell({ modalities }: { modalities: string[] }) {
  if (modalities.length === 0) return <td><Unknown /></td>
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

function PriceHeader({
  column,
  label,
  sort,
  onSortChange,
}: {
  column: PriceColumn
  label: string
  sort?: SortState
  onSortChange?: (column: PriceColumn) => void
}) {
  if (!onSortChange) {
    return <th scope="col" className="num">{label}</th>
  }
  const isActive = sort?.column === column
  return (
    <th
      scope="col"
      className="num"
      aria-sort={isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button type="button" onClick={() => onSortChange(column)}>
        {label}
      </button>
    </th>
  )
}

export function ComparisonTable({ models, sort, onSortChange }: Props) {
  return (
    <div className="table-shell">
    <table>
      <thead>
        <tr>
          <th scope="col">{OTHER_HEADERS[0]}</th>
          <th scope="col">{OTHER_HEADERS[1]}</th>
          {PRICE_HEADERS.map(({ column, label }) => (
            <PriceHeader key={column} column={column} label={label} sort={sort} onSortChange={onSortChange} />
          ))}
          {OTHER_HEADERS.slice(2).map((header) => (
            <th key={header} scope="col" className={header === 'Context' ? 'num' : undefined}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {models.map((model) => {
          const stale = isCaptureStale(model.capturedAt)
          return (
            <tr key={model.id} className={stale ? 'row-stale' : undefined}>
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
