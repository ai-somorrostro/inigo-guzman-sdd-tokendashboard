import { z } from 'zod'

export const MODALITIES = ['text', 'image', 'audio', 'video'] as const
export type Modality = (typeof MODALITIES)[number]

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const dateSchema = z.string().regex(DATE_RE, 'must be an ISO date (YYYY-MM-DD)')
const modalitySchema = z.enum(MODALITIES)
const priceSchema = z.number().nonnegative().nullable()

export const ttftSchema = z
  .strictObject({
    valueMs: z.number().nonnegative().nullable(),
    percentile: z.string().min(1).optional(),
    source: z.string().min(1).optional(),
    capturedAt: dateSchema.optional(),
    conditions: z.string().min(1).optional(),
  })
  .superRefine((ttft, ctx) => {
    if (ttft.valueMs === null) return
    for (const field of ['percentile', 'source', 'capturedAt'] as const) {
      if (ttft[field] === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: `${field} is required when valueMs is present`,
        })
      }
    }
  })

export const modelSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  family: z.string().min(1).optional(),
  pricing: z.strictObject({
    inputPerM: priceSchema,
    outputPerM: priceSchema,
    cachedInputPerM: priceSchema,
  }),
  contextWindow: z.number().int().positive(),
  modalities: z.strictObject({
    input: z.array(modalitySchema),
    output: z.array(modalitySchema),
  }),
  ttft: ttftSchema,
  capturedAt: dateSchema,
})

export type Model = z.infer<typeof modelSchema>

export class CatalogValidationError extends Error {}

export function parseCatalog(data: unknown): Model[] {
  if (!Array.isArray(data)) {
    throw new CatalogValidationError('catalog: expected an array of model entries')
  }
  return data.map((entry, index) => {
    const result = modelSchema.safeParse(entry)
    if (result.success) return result.data
    const id =
      typeof entry === 'object' && entry !== null && 'id' in entry
        ? String((entry as { id: unknown }).id)
        : '(no id)'
    const issues = result.error.issues
      .map((issue) => `${issue.path.length ? issue.path.join('.') : '(entry)'}: ${issue.message}`)
      .join('; ')
    throw new CatalogValidationError(`models[${index}] (id "${id}"): ${issues}`)
  })
}
