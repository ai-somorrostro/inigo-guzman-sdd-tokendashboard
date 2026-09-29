import rawCatalog from '../data/models.json'
import { parseCatalog, type Model } from './schema'

export function loadCatalog(): Model[] {
  return parseCatalog(rawCatalog)
}
