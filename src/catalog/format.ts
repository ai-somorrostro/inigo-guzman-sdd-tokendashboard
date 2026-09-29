function trim(value: number): string {
  return String(Number(value.toFixed(3)))
}

export function formatPrice(value: number): string {
  if (value >= 1) return `$${value.toFixed(2)}`
  return `$${value.toFixed(3).replace(/\.?0+$/, '')}`
}

export function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) return `${trim(tokens / 1_000_000)}M`
  return `${trim(tokens / 1_000)}K`
}

export function formatTtft(valueMs: number): string {
  if (valueMs >= 1000) return `${(valueMs / 1000).toFixed(2)}s`
  return `${valueMs}ms`
}
