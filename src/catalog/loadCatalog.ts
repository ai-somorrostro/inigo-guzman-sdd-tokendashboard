import catalogUrl from '../data/models.json?url'
import rawCatalog from '../data/models.json'
import { parseCatalog, type Model } from './schema'

export function loadCatalog(): Model[] {
  return parseCatalog(rawCatalog)
}

export async function fetchCatalog(): Promise<Model[]> {
  const response = await fetch(catalogUrl)
  if (!response.ok) {
    throw new Error(`Catalog request failed with status ${response.status}`)
  }
  return parseCatalog(await response.json())
}
