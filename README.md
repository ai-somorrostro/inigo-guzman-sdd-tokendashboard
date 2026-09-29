# Model Catalog Comparator

Comparador estático de modelos de IA (precio, TTFT, modalidades) para uso interno de clase. Sin backend, sin API keys: todo el dato vive en un archivo del repositorio.

```bash
npm install     # primera vez
npm run dev     # app en http://localhost:5173
npm test        # suite de tests
npm run build   # typecheck + build de producción
```

## Cómo añadir o editar un modelo

1. Abre `src/data/models.json`.
2. Copia una entrada existente y edítala (o añade una nueva al final del array).
3. Guarda y ejecuta `npm test`. Si la entrada es inválida, el test de catálogo te dice **qué modelo y qué campo** está mal.
4. Abre un PR (o hace commit directo si eres maintainer). En el mensaje, indica de dónde salieron los datos.

## Campos de una entrada

| Campo | Significado | Unidad / formato |
|---|---|---|
| `id` | Identificador único en kebab-case | string, sin repetir |
| `name` | Nombre visible del modelo | string |
| `provider` | Empresa que lo publica | string |
| `pricing.inputPerM` | Precio de **entrada** | USD por 1M de tokens |
| `pricing.outputPerM` | Precio de **salida** | USD por 1M de tokens |
| `pricing.cachedInputPerM` | Precio de lectura de caché | USD por 1M de tokens |
| `contextWindow` | Ventana de contexto | nº entero de tokens |
| `modalities.input` | Modalidades de entrada | solo `text`, `image`, `audio`, `video` |
| `modalities.output` | Modalidades de salida | solo `text`, `image`, `audio`, `video` |
| `ttft.valueMs` | Time to first token | milisegundos |
| `ttft.percentile` | Qué percentila/b estadística es | p. ej. `median`, `p95` |
| `ttft.source` | Fuente del dato | p. ej. `artificialanalysis.ai` |
| `ttft.capturedAt` | Fecha en que la fuente lo medía | `YYYY-MM-DD` |
| `ttft.conditions` | Condiciones de la medición | opcional, p. ej. `10k input tokens, Vertex` |
| `capturedAt` | Fecha en que capturaste precio y TTFT | `YYYY-MM-DD` |

## Reglas de honestidad (las cumplen los tests)

- **`null` = desconocido, nunca `0`.** Si un proveedor no publica un precio, pon `null`. Un modelo gratis de verdad lleva `0`.
- **TTFT con valor obliga a procedencia.** Si `ttft.valueMs` no es `null`, entonces `percentile`, `source` y `capturedAt` son obligatorios. Un TTFT sin fuente es un `{"valueMs": null}`.
- **Modalidades solo de media.** Nada de `toolUse`, `reasoning` ni `structured output`: eso llegará en otra iteración.
- **Precios de tarifa estándar.** Si encuentras un precio promocional, usa el de lista y anota la fecha en `capturedAt`; si el promo es lo único publicado, inclúyelo igualmente con la fecha exacta, para que se vea cuándo caduca.

## Mantenimiento

- El campo `capturedAt` de cada modelo es la fecha de su última revisión: si ves una fecha vieja en la tabla, ese modelo conviene revalidarlo.
- Cualquier cambio de precio o TTFT es un commit normal con la fuente en el mensaje.
