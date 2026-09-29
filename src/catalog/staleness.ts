export const STALE_AFTER_DAYS = 90

export function isCaptureStale(capturedAt: string, now: Date = new Date()): boolean {
  const captured = new Date(`${capturedAt}T00:00:00Z`).getTime()
  const ageDays = (now.getTime() - captured) / 86_400_000
  return ageDays > STALE_AFTER_DAYS
}
