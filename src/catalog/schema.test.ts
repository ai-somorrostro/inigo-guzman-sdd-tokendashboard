import { describe, expect, it } from 'vitest'
import { CatalogValidationError, parseCatalog, type Model } from './schema'

const validEntry: Model = {
  id: 'example-model',
  name: 'Example Model',
  provider: 'Example AI',
  pricing: { inputPerM: 3, outputPerM: 15, cachedInputPerM: 0.3 },
  contextWindow: 200000,
  modalities: { input: ['text', 'image'], output: ['text'] },
  ttft: {
    valueMs: 420,
    percentile: 'p50',
    source: 'example-benchmarks.dev',
    capturedAt: '2026-09-20',
    conditions: 'short prompt, streaming',
  },
  capturedAt: '2026-09-20',
}

function clone(entry: Model = validEntry): Record<string, unknown> {
  return JSON.parse(JSON.stringify(entry)) as Record<string, unknown>
}

function setNested(obj: Record<string, unknown>, path: string[], value: unknown): void {
  const last = path.pop()!
  const target = path.reduce<Record<string, unknown>>(
    (acc, key) => acc[key] as Record<string, unknown>,
    obj,
  )
  target[last] = value
}

describe('parseCatalog', () => {
  it('accepts a valid catalog and preserves nulls as unknown', () => {
    const entry = clone()
    setNested(entry, ['pricing', 'inputPerM'], null)
    const [model] = parseCatalog([entry])
    expect(model.pricing.inputPerM).toBeNull()
    expect(model.pricing.inputPerM).not.toBe(0)
  })

  it('fails naming the offending model id', () => {
    const broken = clone()
    setNested(broken, ['pricing', 'outputPerM'], '15')
    expect(() => parseCatalog([broken])).toThrow(CatalogValidationError)
    try {
      parseCatalog([broken])
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as Error).message).toContain('id "example-model"')
      expect((error as Error).message).toContain('pricing.outputPerM')
    }
  })

  it('reports the array index of the offending entry', () => {
    const broken = clone()
    setNested(broken, ['provider'], '')
    expect(() => parseCatalog([validEntry, broken])).toThrow('models[1]')
  })

  it('accepts null prices', () => {
    const entry = clone()
    for (const field of ['inputPerM', 'outputPerM', 'cachedInputPerM']) {
      setNested(entry, ['pricing', field], null)
    }
    expect(() => parseCatalog([entry])).not.toThrow()
  })

  it('accepts a bare null TTFT with no provenance', () => {
    const entry = clone()
    setNested(entry, ['ttft'], { valueMs: null })
    const [model] = parseCatalog([entry])
    expect(model.ttft.valueMs).toBeNull()
  })

  it('rejects a TTFT value missing its source', () => {
    const entry = clone()
    setNested(entry, ['ttft'], {
      valueMs: 420,
      percentile: 'p50',
      capturedAt: '2026-09-20',
    })
    try {
      parseCatalog([entry])
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as Error).message).toContain('source is required')
    }
  })

  it('rejects a TTFT value missing its percentile', () => {
    const entry = clone()
    setNested(entry, ['ttft'], {
      valueMs: 420,
      source: 'example-benchmarks.dev',
      capturedAt: '2026-09-20',
    })
    expect(() => parseCatalog([entry])).toThrow('percentile is required')
  })

  it('rejects a capability attribute used as a modality', () => {
    const entry = clone()
    setNested(entry, ['modalities', 'input'], ['text', 'toolUse'])
    expect(() => parseCatalog([entry])).toThrow()
  })

  it('rejects a capability attribute as a model field', () => {
    const entry = clone()
    entry.toolUse = true
    expect(() => parseCatalog([entry])).toThrow()
  })

  it('rejects a modality outside text/image/audio/video', () => {
    const entry = clone()
    setNested(entry, ['modalities', 'output'], ['text', 'pdf'])
    expect(() => parseCatalog([entry])).toThrow()
  })

  it('rejects a missing capture date', () => {
    const entry = clone()
    delete entry.capturedAt
    expect(() => parseCatalog([entry])).toThrow('capturedAt')
  })

  it('accepts empty modality lists as unknown', () => {
    const entry = clone()
    setNested(entry, ['modalities', 'input'], [])
    expect(() => parseCatalog([entry])).not.toThrow()
  })

  it('rejects a non-array catalog', () => {
    expect(() => parseCatalog({ models: [] })).toThrow('expected an array')
  })
})
