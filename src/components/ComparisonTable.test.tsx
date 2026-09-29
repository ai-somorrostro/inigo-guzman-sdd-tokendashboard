import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { loadCatalog } from '../catalog/loadCatalog'
import type { Model } from '../catalog/schema'
import { ComparisonTable } from './ComparisonTable'

const catalog = loadCatalog()

function rowFor(name: string): HTMLElement {
  return screen.getByText(name).closest('tr') as HTMLElement
}

function cellsOf(row: HTMLElement): string[] {
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent ?? '')
}

describe('ComparisonTable', () => {
  it('shows the full header set', () => {
    render(<ComparisonTable models={catalog} />)
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent)
    expect(headers).toEqual([
      'Model',
      'Provider',
      '$ / 1M in',
      '$ / 1M out',
      'TTFT',
      'Context',
      'Input modalities',
      'Output modalities',
      'Captured',
    ])
  })

  it('renders every column value for a complete model', () => {
    render(<ComparisonTable models={catalog} />)
    const cells = cellsOf(rowFor('GPT-5.6 Sol'))
    expect(cells[0]).toBe('GPT-5.6 Sol')
    expect(cells[1]).toBe('OpenAI')
    expect(cells[2]).toBe('$5.00')
    expect(cells[3]).toBe('$30.00')
    expect(cells[4]).toContain('17.87s')
    expect(cells[5]).toBe('1.1M')
    expect(cells[6]).toBe('text, image')
    expect(cells[7]).toBe('text')
    expect(cells[8]).toBe('2026-09-28')
  })

  it('renders an unknown price as a marker, never as 0', () => {
    render(<ComparisonTable models={catalog} />)
    const row = rowFor('Kimi K2.6')
    const cells = cellsOf(row)
    expect(cells[2]).not.toMatch(/0/)
    expect(cells[3]).not.toMatch(/0/)
    expect(within(row).getAllByLabelText('unknown').length).toBeGreaterThanOrEqual(3)
    expect(cells[2]).toContain('—')
  })

  it('keeps the row comparable when TTFT is unknown', () => {
    render(<ComparisonTable models={catalog} />)
    const cells = cellsOf(rowFor('Kimi K2.6'))
    expect(cells[4]).toContain('—')
    expect(cells[0]).toBe('Kimi K2.6')
    expect(cells[8]).toBe('2026-09-28')
  })

  it('shows source, percentile and capture date for a sourced TTFT', () => {
    render(<ComparisonTable models={catalog} />)
    const row = rowFor('GPT-5.6 Sol')
    expect(row.textContent).toContain('artificialanalysis.ai')
    expect(row.textContent).toContain('median')
    expect(row.textContent).toContain('2026-09-28')
    expect(row.textContent).toContain('10k input tokens')
  })

  it('shows each value’s own provenance when sources disagree', () => {
    render(<ComparisonTable models={catalog} />)
    expect(rowFor('GPT-5.6 Sol').textContent).toContain('artificialanalysis.ai')
    expect(rowFor('Claude Haiku 4.5').textContent).toContain('kunalganglani.com')
    expect(rowFor('Claude Haiku 4.5').textContent).toContain('single run')
  })

  it('shows no provenance for an unknown TTFT', () => {
    render(<ComparisonTable models={catalog} />)
    const row = rowFor('Kimi K2.6')
    expect(within(row).queryByText(/artificialanalysis\.ai/)).toBeNull()
    expect(within(row).queryByText(/kunalganglani\.com/)).toBeNull()
    expect(row.querySelector('.ttft-provenance')).toBeNull()
  })

  it('shows the capture date of every model', () => {
    const models: Model[] = [
      {
        id: 'alpha',
        name: 'Alpha',
        provider: 'A Labs',
        pricing: { inputPerM: 1, outputPerM: 2, cachedInputPerM: null },
        contextWindow: 200000,
        modalities: { input: ['text'], output: ['text'] },
        ttft: { valueMs: null },
        capturedAt: '2026-01-15',
      },
      {
        id: 'beta',
        name: 'Beta',
        provider: 'B Labs',
        pricing: { inputPerM: 3, outputPerM: 4, cachedInputPerM: null },
        contextWindow: 200000,
        modalities: { input: ['text'], output: ['text'] },
        ttft: { valueMs: null },
        capturedAt: '2026-09-28',
      },
    ]
    render(<ComparisonTable models={models} />)
    expect(rowFor('Alpha').textContent).toContain('2026-01-15')
    expect(rowFor('Beta').textContent).toContain('2026-09-28')
  })
})

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
}

function fixtureModel(id: string, name: string, capturedAt: string): Model {
  return {
    id,
    name,
    provider: 'Fixture Labs',
    pricing: { inputPerM: 1, outputPerM: 2, cachedInputPerM: null },
    contextWindow: 128000,
    modalities: { input: ['text'], output: ['text'] },
    ttft: { valueMs: null },
    capturedAt,
  }
}

describe('stale capture dates', () => {
  it('shows a stale badge next to a capture date older than 90 days', () => {
    render(<ComparisonTable models={[fixtureModel('old', 'Old Model', isoDaysAgo(200))]} />)
    const row = rowFor('Old Model')
    const badge = within(row).getByText('stale')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('stale-badge')
  })

  it('shows no stale badge for a capture date within 90 days', () => {
    render(<ComparisonTable models={[fixtureModel('fresh', 'Fresh Model', isoDaysAgo(5))]} />)
    expect(within(rowFor('Fresh Model')).queryByText('stale')).toBeNull()
  })

  it('explains the threshold in the stale case and not in the fresh case', () => {
    render(
      <ComparisonTable
        models={[
          fixtureModel('old', 'Old Model', isoDaysAgo(200)),
          fixtureModel('fresh', 'Fresh Model', isoDaysAgo(5)),
        ]}
      />,
    )
    const staleTime = within(rowFor('Old Model')).getByText(isoDaysAgo(200))
    expect(staleTime.getAttribute('title')).toBe('Older than 90 days')
    const staleBadge = within(rowFor('Old Model')).getByText('stale')
    expect(staleBadge.getAttribute('title')).toBe('Older than 90 days')
    const freshTime = within(rowFor('Fresh Model')).getByText(isoDaysAgo(5))
    expect(freshTime.getAttribute('title')).toBeNull()
  })

  it('renders the marker as readable text, not color alone', () => {
    render(<ComparisonTable models={[fixtureModel('old', 'Old Model', isoDaysAgo(200))]} />)
    expect(within(rowFor('Old Model')).getByText(/^stale$/)).toBeInTheDocument()
  })
})
