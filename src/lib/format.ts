export function toPercent(decimal: number): number {
  return parseFloat((decimal * 100).toPrecision(10))
}

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number): string {
  return USD.format(value)
}

export function formatDelta(value: number): string {
  const formatted = USD.format(Math.abs(value))
  return value >= 0 ? `+${formatted}` : `-${formatted}`
}

export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) {
    const str = (Math.round((abs / 1_000_000) * 10) / 10).toFixed(1).replace(/\.0$/, '')
    return `${sign}$${str}M`
  }
  if (abs >= 1_000) {
    const str = (Math.round((abs / 1_000) * 10) / 10).toFixed(1).replace(/\.0$/, '')
    return `${sign}$${str}K`
  }
  return `${sign}$${Math.round(abs).toString()}`
}

// Recharts' XAxis `interval` prop: 0 shows every tick, n shows every (n+1)th. Caps the number of
// visible x-axis labels regardless of horizon length, so a 40-year horizon doesn't run two-digit
// year labels together illegibly. maxLabels=15 keeps the axis readable at any horizon 1-40.
export function computeXAxisInterval(pointCount: number, maxLabels = 15): number {
  if (pointCount <= maxLabels) return 0
  return Math.ceil(pointCount / maxLabels) - 1
}
