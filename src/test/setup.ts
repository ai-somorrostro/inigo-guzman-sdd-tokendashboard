import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import rawCatalog from '../data/models.json'

globalThis.fetch = async () => new Response(JSON.stringify(rawCatalog), { status: 200 })

afterEach(cleanup)
