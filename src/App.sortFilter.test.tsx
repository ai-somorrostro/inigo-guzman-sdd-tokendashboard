import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import {
  filterByInputModality,
  priceOf,
  sortModels,
} from './catalog/accessors'
import { loadCatalog } from './catalog/loadCatalog'
import type { Model } from './catalog/schema'
import { ComparisonTable } from './components/ComparisonTable'

const catalog = loadCatalog()

function bodyRows(): HTMLElement[] {
  return screen.getAllByRole('row').slice(1)
}

function inputPrices(): (number | null)[] {
  return bodyRows().map((row) => {
    const text = within(row).getAllByRole('cell')[2].textContent ?? ''
    if (text.includes('—')) return null
    return Number(text.replace(/[^0-9.]/g, ''))
  })
}

function selectFilter(value: string) {
  fireEvent.change(screen.getByLabelText('Filter by input modality'), { target: { value } })
}

describe('sorting by price', () => {
  it('defaults to input price ascending with unknown prices last', () => {
    render(<App />)
    const prices = inputPrices()
    const known = prices.filter((price): price is number => price !== null)
    const firstUnknown = prices.findIndex((price) => price === null)
    if (firstUnknown !== -1) {
      expect(prices.slice(firstUnknown).every((price) => price === null)).toBe(true)
    }
    expect(known).toEqual([...known].sort((a, b) => a - b))
    expect(screen.getByRole('columnheader', { name: '$ / 1M in' })).toHaveAttribute('aria-sort', 'ascending')
  })

  it('sorts by output price and keeps unknown prices at the end', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '$ / 1M out' }))
    expect(screen.getByRole('columnheader', { name: '$ / 1M out' })).toHaveAttribute('aria-sort', 'ascending')
    const prices = bodyRows().map((row) => {
      const text = within(row).getAllByRole('cell')[3].textContent ?? ''
      if (text.includes('—')) return null
      return Number(text.replace(/[^0-9.]/g, ''))
    })
    const known = prices.filter((price): price is number => price !== null)
    expect(known).toEqual([...known].sort((a, b) => a - b))
    const firstUnknown = prices.findIndex((price) => price === null)
    expect(firstUnknown).toBeGreaterThan(-1)
    expect(prices.slice(firstUnknown).every((price) => price === null)).toBe(true)
  })

  it('toggles the input price column to descending on a second click', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '$ / 1M in' }))
    expect(screen.getByRole('columnheader', { name: '$ / 1M in' })).toHaveAttribute('aria-sort', 'descending')
    const prices = inputPrices()
    const known = prices.filter((price): price is number => price !== null)
    expect(known).toEqual([...known].sort((a, b) => b - a))
    const firstUnknown = prices.findIndex((price) => price === null)
    expect(firstUnknown).toBeGreaterThan(-1)
    expect(prices.slice(firstUnknown).every((price) => price === null)).toBe(true)
  })
})

describe('filtering by input modality', () => {
  it('keeps only models whose input list includes the selection', () => {
    render(<App />)
    selectFilter('image')
    const textOnly = catalog.filter((model) => model.modalities.input.join(',') === 'text')
    expect(textOnly.length).toBeGreaterThan(0)
    for (const model of textOnly) {
      expect(screen.queryByText(model.name)).toBeNull()
    }
    const imageCapable = catalog.filter((model) => model.modalities.input.includes('image'))
    expect(imageCapable.length).toBeGreaterThan(0)
    for (const model of imageCapable) {
      expect(screen.getByText(model.name)).toBeInTheDocument()
    }
  })

  it('shows an explicit empty result when the filter matches no model', () => {
    render(<App />)
    expect(catalog.some((model) => model.modalities.input.includes('video'))).toBe(false)
    selectFilter('video')
    expect(screen.getByRole('status')).toHaveTextContent(
      'No models match the selected input modality filter.',
    )
    expect(screen.queryByRole('table')).toBeNull()
  })
})

describe('normalized accessors', () => {
  const unknownModel: Model = {
    id: 'unknown-fixture',
    name: 'Unknown Fixture',
    provider: 'Fixture Labs',
    pricing: { inputPerM: null, outputPerM: null, cachedInputPerM: null },
    contextWindow: 128000,
    modalities: { input: [], output: [] },
    ttft: { valueMs: null },
    capturedAt: '2026-09-01',
  }
  const knownModel: Model = {
    id: 'known-fixture',
    name: 'Known Fixture',
    provider: 'Fixture Labs',
    pricing: { inputPerM: 1, outputPerM: 2, cachedInputPerM: null },
    contextWindow: 128000,
    modalities: { input: ['text'], output: ['text'] },
    ttft: { valueMs: null },
    capturedAt: '2026-09-01',
  }

  it('treats a null value consistently in a row cell, under sort, and under filter', () => {
    render(<ComparisonTable models={[knownModel, unknownModel]} />)

    const row = screen.getByText('Unknown Fixture').closest('tr') as HTMLElement
    const priceCell = within(row).getAllByRole('cell')[2]
    expect(priceCell).toHaveTextContent('—')
    expect(priceCell).not.toHaveTextContent('0')
    expect(within(priceCell).getByLabelText('unknown')).toBeInTheDocument()
    expect(priceOf(unknownModel, 'inputPerM')).toBeNull()

    const sorted = sortModels([knownModel, unknownModel], 'inputPerM', 'asc')
    expect(sorted.map((model) => model.id)).toEqual(['known-fixture', 'unknown-fixture'])

    const filteredOut = filterByInputModality([knownModel, unknownModel], 'text')
    expect(filteredOut.map((model) => model.id)).toEqual(['known-fixture'])
    expect(filterByInputModality([knownModel, unknownModel], 'all')).toHaveLength(2)
  })
})

describe('TTFT provenance hover', () => {
  it('reveals provenance on hover and hides it again, and never renders it for an unknown TTFT', () => {
    render(<ComparisonTable models={catalog} />)
    const sourcedRow = screen.getByText('GPT-5.6 Sol').closest('tr') as HTMLElement
    const cell = sourcedRow.querySelector('.ttft-cell') as HTMLElement
    const provenance = cell.querySelector('.ttft-provenance') as HTMLElement
    expect(provenance).not.toHaveClass('visible')
    expect(provenance).toHaveTextContent('artificialanalysis.ai')

    fireEvent.mouseEnter(cell)
    expect(provenance).toHaveClass('visible')

    fireEvent.mouseLeave(cell)
    expect(provenance).not.toHaveClass('visible')

    const unknownRow = screen.getByText('Kimi K2.6').closest('tr') as HTMLElement
    expect(unknownRow.querySelector('.ttft-provenance')).toBeNull()
  })
})

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
}

describe('stale marking does not affect comparability', () => {
  const staleCheap: Model = {
    id: 'stale-cheap',
    name: 'Stale Cheap',
    provider: 'Fixture Labs',
    pricing: { inputPerM: 0.1, outputPerM: 0.2, cachedInputPerM: null },
    contextWindow: 128000,
    modalities: { input: ['text'], output: ['text'] },
    ttft: { valueMs: null },
    capturedAt: isoDaysAgo(200),
  }
  const freshExpensive: Model = {
    id: 'fresh-expensive',
    name: 'Fresh Expensive',
    provider: 'Fixture Labs',
    pricing: { inputPerM: 5, outputPerM: 10, cachedInputPerM: null },
    contextWindow: 128000,
    modalities: { input: ['text'], output: ['text'] },
    ttft: { valueMs: null },
    capturedAt: isoDaysAgo(5),
  }

  it('keeps a stale row visible, in its sorted position, and matching the filter', () => {
    const sorted = sortModels([freshExpensive, staleCheap], 'inputPerM', 'asc')
    expect(sorted.map((model) => model.id)).toEqual(['stale-cheap', 'fresh-expensive'])

    const filtered = filterByInputModality(sorted, 'text')
    expect(filtered.map((model) => model.id)).toEqual(['stale-cheap', 'fresh-expensive'])

    render(<ComparisonTable models={filtered} />)
    const rows = bodyRows()
    expect(rows).toHaveLength(2)
    expect(rows[0].textContent).toContain('Stale Cheap')
    expect(within(rows[0]).getByText('stale')).toBeInTheDocument()
    expect(rows[1].textContent).toContain('Fresh Expensive')
    expect(within(rows[1]).queryByText('stale')).toBeNull()
  })
})
