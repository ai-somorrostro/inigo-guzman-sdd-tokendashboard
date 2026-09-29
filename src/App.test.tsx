import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { loadCatalog } from './catalog/loadCatalog'

describe('App', () => {
  it('validates and renders every model from the catalog', async () => {
    const catalog = loadCatalog()
    expect(catalog.length).toBeGreaterThanOrEqual(8)
    render(<App />)
    for (const model of catalog) {
      expect(await screen.findByText(model.name)).toBeInTheDocument()
    }
  })

  it('renders a model whose prices are unknown without crashing', async () => {
    render(<App />)
    expect(await screen.findByText('Kimi K2.6')).toBeInTheDocument()
  })
})
