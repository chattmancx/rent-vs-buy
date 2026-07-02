export function deflate(nominalValue: number, inflationRate: number, years: number): number {
  return nominalValue / Math.pow(1 + inflationRate, years)
}

export function deflateIfEnabled(
  nominalValue: number,
  realDollars: boolean,
  inflationRate: number,
  years: number,
): number {
  return realDollars ? deflate(nominalValue, inflationRate, years) : nominalValue
}
