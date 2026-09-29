import type { Model, Modality } from './schema'

export type PriceColumn = 'inputPerM' | 'outputPerM'
export type SortableColumn =
  | 'name'
  | 'provider'
  | 'inputPerM'
  | 'outputPerM'
  | 'ttft'
  | 'contextWindow'
  | 'inputModalities'
  | 'outputModalities'
  | 'capturedAt'

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

export function outputModalitiesOf(model: Model): string[] {
  return model.modalities.output
}

export function supportsInput(model: Model, filter: ModalityFilter): boolean {
  if (filter === 'all') return true
  return inputModalitiesOf(model).includes(filter)
}

export function supportsOutput(model: Model, filter: ModalityFilter): boolean {
  if (filter === 'all') return true
  return outputModalitiesOf(model).includes(filter)
}

export function compareByPrice(
  a: Model,
  b: Model,
  column: PriceColumn,
  direction: SortDirection,
): number {
  const left = priceOf(a, column)
  const right = priceOf(b, column)
  if (left === null && right === null) return 0
  if (left === null) return 1
  if (right === null) return -1
  return direction === 'asc' ? left - right : right - left
}

export function compareModels(
  a: Model,
  b: Model,
  column: SortableColumn,
  direction: SortDirection,
): number {
  if (column === 'inputPerM' || column === 'outputPerM') {
    return compareByPrice(a, b, column, direction)
  }

  let left: string | number | null = null
  let right: string | number | null = null

  switch (column) {
    case 'name':
      left = a.name.toLowerCase()
      right = b.name.toLowerCase()
      break
    case 'provider':
      left = a.provider.toLowerCase()
      right = b.provider.toLowerCase()
      break
    case 'ttft':
      left = a.ttft.valueMs
      right = b.ttft.valueMs
      break
    case 'contextWindow':
      left = a.contextWindow
      right = b.contextWindow
      break
    case 'inputModalities':
      left = a.modalities.input.length > 0 ? a.modalities.input.join(', ') : null
      right = b.modalities.input.length > 0 ? b.modalities.input.join(', ') : null
      break
    case 'outputModalities':
      left = a.modalities.output.length > 0 ? a.modalities.output.join(', ') : null
      right = b.modalities.output.length > 0 ? b.modalities.output.join(', ') : null
      break
    case 'capturedAt':
      left = a.capturedAt
      right = b.capturedAt
      break
  }

  // Nulls / unknowns go to the bottom in both sort directions
  if (left === null && right === null) return 0
  if (left === null) return 1
  if (right === null) return -1

  if (typeof left === 'number' && typeof right === 'number') {
    return direction === 'asc' ? left - right : right - left
  }

  const strLeft = String(left)
  const strRight = String(right)
  const cmp = strLeft.localeCompare(strRight)
  return direction === 'asc' ? cmp : -cmp
}

export function sortModels(
  models: Model[],
  column: SortableColumn,
  direction: SortDirection,
): Model[] {
  return [...models].sort((a, b) => compareModels(a, b, column, direction))
}

export function filterByName(models: Model[], query: string): Model[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return models
  return models.filter((model) => model.name.toLowerCase().includes(trimmed))
}

export function filterByInputModality(models: Model[], filter: ModalityFilter): Model[] {
  return models.filter((model) => supportsInput(model, filter))
}

export function filterByOutputModality(models: Model[], filter: ModalityFilter): Model[] {
  return models.filter((model) => supportsOutput(model, filter))
}
