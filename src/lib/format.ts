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
