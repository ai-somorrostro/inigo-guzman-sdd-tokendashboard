import type { Model, Modality } from './schema'

export type PriceColumn = 'inputPerM' | 'outputPerM'
export type SortDirection = 'asc' | 'desc'
export type ModalityFilter = Modality | 'all'

export function priceOf(model: Model, column: PriceColumn): number | null {
  return model.pricing[column]
}

export function ttftOf(model: Model): number | null {
  return model.ttft.valueMs
}

export function inputModalitiesOf(model: Model): string[] {
  return model.modalities.input
}

export function supportsInput(model: Model, filter: ModalityFilter): boolean {
  if (filter === 'all') return true
  return inputModalitiesOf(model).includes(filter)
}

export function compareByPrice(a: Model, b: Model, column: PriceColumn, direction: SortDirection): number {
  const left = priceOf(a, column)
  const right = priceOf(b, column)
  if (left === null && right === null) return 0
  if (left === null) return 1
  if (right === null) return -1
  return direction === 'asc' ? left - right : right - left
}

export function sortModels(models: Model[], column: PriceColumn, direction: SortDirection): Model[] {
  return [...models].sort((a, b) => compareByPrice(a, b, column, direction))
}

export function filterByInputModality(models: Model[], filter: ModalityFilter): Model[] {
  return models.filter((model) => supportsInput(model, filter))
}
